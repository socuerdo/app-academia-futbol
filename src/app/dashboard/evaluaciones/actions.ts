"use server";

import { randomUUID } from "crypto";
import { PERMISO, tienePermiso } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EvaluacionInput = {
  jugador_id: string;
  tipo_evaluacion_id: string;
  fecha: string;
  temporada: string | null;
  puntaje_fisico: number;
  puntaje_tecnico: number;
  puntaje_tactico: number;
  puntaje_social: number;
  puntaje_emocional: number;
  comentario_fisico: string | null;
  comentario_tecnico: string | null;
  comentario_tactico: string | null;
  comentario_social: string | null;
  comentario_emocional: string | null;
  observaciones_generales: string | null;
};

export async function crearEvaluacion(
  input: EvaluacionInput
): Promise<{ ok: true; id: string; token_publico: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol, permisos")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id) return { ok: false, error: "Sin club" };
  const isAdmin = profile.rol === "admin" || profile.rol === "superadmin";
  if (!isAdmin && profile.rol !== "profesor") {
    return { ok: false, error: "Sin permiso" };
  }
  if (!isAdmin && !tienePermiso(profile.permisos, PERMISO.EVALUACIONES_CREAR)) {
    return { ok: false, error: "Sin permiso para cargar evaluaciones" };
  }

  const { data, error } = await supabase
    .from("evaluaciones")
    .insert({
      club_id: profile.club_id,
      jugador_id: input.jugador_id,
      tipo_evaluacion_id: input.tipo_evaluacion_id,
      evaluador_id: user.id,
      fecha: input.fecha,
      temporada: input.temporada?.trim() || null,
      puntaje_fisico: input.puntaje_fisico,
      puntaje_tecnico: input.puntaje_tecnico,
      puntaje_tactico: input.puntaje_tactico,
      puntaje_social: input.puntaje_social,
      puntaje_emocional: input.puntaje_emocional,
      comentario_fisico: input.comentario_fisico,
      comentario_tecnico: input.comentario_tecnico,
      comentario_tactico: input.comentario_tactico,
      comentario_social: input.comentario_social,
      comentario_emocional: input.comentario_emocional,
      observaciones_generales: input.observaciones_generales,
    })
    .select("id, token_publico")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Error al guardar" };
  }

  revalidatePath("/dashboard/evaluaciones");
  return { ok: true, id: data.id, token_publico: data.token_publico };
}

export async function actualizarEvaluacion(
  id: string,
  input: EvaluacionInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol, permisos")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id) return { ok: false, error: "Sin club" };

  const { data: row } = await supabase
    .from("evaluaciones")
    .select("id, evaluador_id, club_id")
    .eq("id", id)
    .single();

  if (!row || row.club_id !== profile.club_id) {
    return { ok: false, error: "No encontrada" };
  }

  const isAdmin = profile.rol === "admin" || profile.rol === "superadmin";
  const tienePermisoEditar = tienePermiso(profile.permisos, PERMISO.EVALUACIONES_EDITAR);
  const puedeEditar =
    isAdmin || (row.evaluador_id === user.id && tienePermisoEditar);

  if (!puedeEditar) return { ok: false, error: "Sin permiso para editar" };

  const { error } = await supabase
    .from("evaluaciones")
    .update({
      jugador_id: input.jugador_id,
      tipo_evaluacion_id: input.tipo_evaluacion_id,
      fecha: input.fecha,
      temporada: input.temporada?.trim() || null,
      puntaje_fisico: input.puntaje_fisico,
      puntaje_tecnico: input.puntaje_tecnico,
      puntaje_tactico: input.puntaje_tactico,
      puntaje_social: input.puntaje_social,
      puntaje_emocional: input.puntaje_emocional,
      comentario_fisico: input.comentario_fisico,
      comentario_tecnico: input.comentario_tecnico,
      comentario_tactico: input.comentario_tactico,
      comentario_social: input.comentario_social,
      comentario_emocional: input.comentario_emocional,
      observaciones_generales: input.observaciones_generales,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/evaluaciones");
  revalidatePath(`/dashboard/evaluaciones/${id}`);
  return { ok: true };
}

export async function eliminarEvaluacion(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol")
    .eq("id", user.id)
    .single();

  if (
    !profile?.club_id ||
    (profile.rol !== "admin" && profile.rol !== "superadmin")
  ) {
    return { ok: false, error: "Solo administradores pueden eliminar" };
  }

  const { error } = await supabase.from("evaluaciones").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/evaluaciones");
  return { ok: true };
}

export async function regenerarTokenPublico(
  id: string
): Promise<{ ok: true; token_publico: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const token = randomUUID();

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id) return { ok: false, error: "Sin club" };

  const { data: row } = await supabase
    .from("evaluaciones")
    .select("club_id, evaluador_id")
    .eq("id", id)
    .single();

  if (!row || row.club_id !== profile.club_id) {
    return { ok: false, error: "No encontrada" };
  }

  const puede =
    profile.rol === "admin" ||
    profile.rol === "superadmin" ||
    row.evaluador_id === user.id;
  if (!puede) return { ok: false, error: "Sin permiso" };

  const { data, error } = await supabase
    .from("evaluaciones")
    .update({ token_publico: token })
    .eq("id", id)
    .select("token_publico")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Error" };

  revalidatePath(`/dashboard/evaluaciones/${id}`);
  return { ok: true, token_publico: data.token_publico };
}
