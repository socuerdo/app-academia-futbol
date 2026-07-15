"use server";

import { createClient } from "@/lib/supabase/server";
import { registrarAccion } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type FilaImportacion = {
  dni: string;
  apellido: string;
  nombre: string;
  sexo: string;
  categoria?: string;
  sede_nombre?: string;
  sede_id?: string;
  numero_camiseta?: number | null;
  fecha_nacimiento?: string | null;
  fecha_inscripcion?: string | null;
  numero_carnet?: string | null;
  fecha_vencimiento_carnet?: string | null;
};

export type JugadorImportado = {
  id: string;
  dni: string;
  apellido: string;
  nombre: string;
};

export type ResultadoImportacion = {
  importados: number;
  duplicados: number;
  errores: string[];
  jugadoresImportados: JugadorImportado[];
};

export async function importarJugadoresBatch(
  filas: FilaImportacion[],
  sedeIdPorNombre: Record<string, string>
): Promise<ResultadoImportacion> {
  const result: ResultadoImportacion = {
    importados: 0,
    duplicados: 0,
    errores: [],
    jugadoresImportados: [],
  };
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
    .select("club_id, nombre_completo")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) {
    result.errores.push("Sin club asignado");
    return result;
  }

  const clubId = profile.club_id;
  const hoy = new Date().toISOString().slice(0, 10);

  for (const row of filas) {
    const dni = String(row.dni ?? "").trim();
    const apellido = String(row.apellido ?? "").trim();
    const nombre = String(row.nombre ?? "").trim();
    const sexo = String(row.sexo ?? "M").trim().toUpperCase().slice(0, 1) || "M";
    const categoria = String(row.categoria ?? "").trim() || "Sin categoría";
    const sedeId = row.sede_id || (row.sede_nombre && sedeIdPorNombre[row.sede_nombre]) || null;

    if (!dni || !apellido || !nombre) {
      result.errores.push(`Fila con DNI "${dni || "?"}": faltan datos obligatorios (DNI, apellido, nombre)`);
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

    const { data: creado, error } = await supabase
      .from("jugadores")
      .insert({
        club_id: clubId,
        sede_id: sedeId,
        dni,
        apellido,
        nombre,
        sexo: sexo === "F" ? "F" : "M",
        categoria,
        numero_camiseta: row.numero_camiseta ?? null,
        fecha_nacimiento: row.fecha_nacimiento || null,
        fecha_inscripcion: row.fecha_inscripcion || hoy,
        numero_carnet: row.numero_carnet || null,
        fecha_vencimiento_carnet: row.fecha_vencimiento_carnet || null,
        activo: true,
      })
      .select("id")
      .single();

    if (error) {
      result.errores.push(`DNI ${dni}: ${error.message}`);
      continue;
    }
    if (creado) {
      result.importados++;
      result.jugadoresImportados.push({ id: creado.id, dni, apellido, nombre });
    }
  }

  if (result.importados > 0) {
    await registrarAccion(supabase, {
      clubId,
      usuarioId: user.id,
      usuarioNombre: profile.nombre_completo,
      accion: "importar",
      entidad: "importacion",
      entidadDescripcion: `Importación masiva: ${result.importados} jugadores`,
      cambios: { importados: result.importados, duplicados: result.duplicados },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jugadores/importar");
  return result;
}

export async function asignarCategoriaBatch(
  jugadorIds: string[],
  categoria: string
): Promise<{ asignados: number; error?: string }> {
  if (!jugadorIds.length || !categoria.trim()) {
    return { asignados: 0, error: "Seleccioná al menos un jugador y una categoría." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { asignados: 0, error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, nombre_completo")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { asignados: 0, error: "Sin club asignado" };

  const categoriaNueva = categoria.trim();

  const { data: antes } = await supabase
    .from("jugadores")
    .select("id, apellido, nombre, categoria")
    .eq("club_id", profile.club_id)
    .in("id", jugadorIds);

  const { error, count } = await supabase
    .from("jugadores")
    .update({ categoria: categoriaNueva })
    .eq("club_id", profile.club_id)
    .in("id", jugadorIds);

  if (error) return { asignados: 0, error: error.message };

  const asignados = count ?? jugadorIds.length;

  const cambios: Record<string, unknown> = {};
  (antes ?? []).forEach((j) => {
    if (j.categoria !== categoriaNueva) {
      cambios[`${j.apellido}, ${j.nombre}`] = { anterior: j.categoria, nuevo: categoriaNueva };
    }
  });

  await registrarAccion(supabase, {
    clubId: profile.club_id,
    usuarioId: user.id,
    usuarioNombre: profile.nombre_completo,
    accion: "asignar_categoria",
    entidad: "jugador",
    entidadDescripcion: `Asignación masiva de categoría "${categoriaNueva}" a ${asignados} jugadores`,
    cambios: Object.keys(cambios).length ? cambios : undefined,
  });

  revalidatePath("/dashboard/jugadores");
  return { asignados };
}
