"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FilaImportacion = {
  dni: string;
  apellido: string;
  nombre: string;
  sexo: string;
  categoria: string;
  sede_nombre?: string;
  sede_id?: string;
  numero_camiseta?: number | null;
  fecha_nacimiento?: string | null;
  numero_carnet?: string | null;
  fecha_vencimiento_carnet?: string | null;
};

export type ResultadoImportacion = {
  importados: number;
  duplicados: number;
  errores: string[];
};

export async function importarJugadoresBatch(
  filas: FilaImportacion[],
  sedeIdPorNombre: Record<string, string>
): Promise<ResultadoImportacion> {
  const result: ResultadoImportacion = { importados: 0, duplicados: 0, errores: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    result.errores.push("No autorizado");
    return result;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) {
    result.errores.push("Sin club asignado");
    return result;
  }

  const clubId = profile.club_id;

  for (const row of filas) {
    const dni = String(row.dni ?? "").trim();
    const apellido = String(row.apellido ?? "").trim();
    const nombre = String(row.nombre ?? "").trim();
    const sexo = String(row.sexo ?? "M").trim().toUpperCase().slice(0, 1) || "M";
    const categoria = String(row.categoria ?? "").trim();
    const sedeId = row.sede_id || (row.sede_nombre && sedeIdPorNombre[row.sede_nombre]) || null;

    if (!dni || !apellido || !nombre || !categoria) {
      result.errores.push(`Fila con DNI "${dni || "?"}": faltan datos obligatorios`);
      continue;
    }
    if (!sedeId) {
      result.errores.push(`Fila ${dni}: sede no encontrada (${row.sede_nombre || "sin sede"})`);
      continue;
    }

    const { data: existente } = await supabase
      .from("jugadores")
      .select("id")
      .eq("club_id", clubId)
      .eq("dni", dni)
      .maybeSingle();

    if (existente) {
      result.duplicados++;
      continue;
    }

    const { error } = await supabase.from("jugadores").insert({
      club_id: clubId,
      sede_id: sedeId,
      dni,
      apellido,
      nombre,
      sexo: sexo === "F" ? "F" : "M",
      categoria,
      numero_camiseta: row.numero_camiseta ?? null,
      fecha_nacimiento: row.fecha_nacimiento || null,
      numero_carnet: row.numero_carnet || null,
      fecha_vencimiento_carnet: row.fecha_vencimiento_carnet || null,
      activo: true,
    });

    if (error) {
      result.errores.push(`DNI ${dni}: ${error.message}`);
      continue;
    }
    result.importados++;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jugadores/importar");
  return result;
}
