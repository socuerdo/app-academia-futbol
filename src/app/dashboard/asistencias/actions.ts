"use server";

import { createClient } from "@/lib/supabase/server";
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
    .select("club_id")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado" };

  if (!fecha || !sedeId || !categoria || asistencias.length === 0) {
    return { error: "Faltan fecha, sede, categoría o lista de asistencias." };
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
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/asistencias/cargar");
  return {};
}
