"use server";

import { createClient } from "@/lib/supabase/server";
import { registrarAccion } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type AsistenciaInput = {
  jugador_id: string;
  presente: boolean;
  observacion?: string | null;
};

export async function guardarAsistenciasBatch(
  fecha: string,
  sedeId: string,
  categoria: string,
  asistencias: AsistenciaInput[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol, nombre_completo")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado" };

  if (!fecha || !sedeId || !categoria || asistencias.length === 0) {
    return { error: "Faltan fecha, sede, categoría o lista de asistencias." };
  }

  const isAdmin = profile.rol === "admin" || profile.rol === "superadmin";
  const hoy = new Date().toISOString().slice(0, 10);
  if (!isAdmin && fecha < hoy) {
    return {
      error: "No se pueden cargar ni modificar asistencias de fechas pasadas. Contactá a un administrador.",
    };
  }

  const rows = asistencias.map((a) => ({
    club_id: profile.club_id,
    jugador_id: a.jugador_id,
    fecha,
    presente: a.presente,
    observacion: a.observacion?.trim() || null,
    registrado_por: user.id,
  }));

  const { error } = await supabase
    .from("asistencias")
    .upsert(rows, {
      onConflict: "jugador_id,fecha",
      ignoreDuplicates: false,
    });

  if (error) return { error: error.message };

  const presentes = asistencias.filter((a) => a.presente).length;
  await registrarAccion(supabase, {
    clubId: profile.club_id,
    usuarioId: user.id,
    usuarioNombre: profile.nombre_completo,
    accion: "guardar_asistencias",
    entidad: "asistencia",
    entidadDescripcion: `${categoria} · ${fecha} · ${presentes}/${asistencias.length} presentes`,
    cambios: { fecha, categoria, sedeId, presentes, total: asistencias.length },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/asistencias/cargar");
  return {};
}
