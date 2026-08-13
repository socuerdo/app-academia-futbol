"use server";

import { randomUUID } from "crypto";
import { PERMISO, tienePermiso, esAdminOAuditor } from "@/lib/permisos";
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

export type FiltrosReporteEvaluaciones = {
  categoria?: string;
  tipo?: string;
  jugador?: string;
  temporada?: string;
};

export type FilaReporteEvaluacion = {
  apellido: string;
  nombre: string;
  categoria: string;
  tipo_nombre: string | null;
  fecha: string;
  temporada: string | null;
  evaluador_nombre: string | null;
  fisico: number;
  tecnico: number;
  tactico: number;
  social: number;
  emocional: number;
  promedio: number;
};

const MAX_FILAS_REPORTE = 2000;

/**
 * Trae todas las evaluaciones que matchean los filtros (sin paginar) para
 * armar el PDF. La lista de pantalla está paginada, así que no alcanza con
 * exportar lo que se ve.
 */
export async function obtenerEvaluacionesParaReporte(
  filtros: FiltrosReporteEvaluaciones
): Promise<
  | { ok: true; filas: FilaReporteEvaluacion[]; truncado: boolean }
  | { ok: false; error: string }
> {
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

  const puedeDescargar =
    esAdminOAuditor(profile.rol) ||
    tienePermiso(profile.permisos, PERMISO.EVALUACIONES_DESCARGAR);
  if (!puedeDescargar) {
    return { ok: false, error: "Sin permiso para descargar el reporte" };
  }

  const categoria = filtros.categoria?.trim() || "";
  let jugadorIdsEnCategoria: string[] | null = null;
  if (categoria) {
    const { data: jugs } = await supabase
      .from("jugadores")
      .select("id")
      .eq("club_id", profile.club_id)
      .eq("categoria", categoria);
    jugadorIdsEnCategoria = (jugs ?? []).map((j) => j.id);
    if (jugadorIdsEnCategoria.length === 0) {
      return { ok: true, filas: [], truncado: false };
    }
  }

  let query = supabase
    .from("evaluaciones")
    .select(
      `id, fecha, temporada, puntaje_promedio, evaluador_id,
       puntaje_fisico, puntaje_tecnico, puntaje_tactico, puntaje_social, puntaje_emocional,
       jugadores (nombre, apellido, categoria),
       tipos_evaluacion (nombre)`
    )
    .eq("club_id", profile.club_id)
    .order("fecha", { ascending: false })
    .limit(MAX_FILAS_REPORTE + 1);

  if (filtros.tipo?.trim()) query = query.eq("tipo_evaluacion_id", filtros.tipo.trim());
  if (filtros.jugador?.trim()) query = query.eq("jugador_id", filtros.jugador.trim());
  if (filtros.temporada?.trim()) query = query.eq("temporada", filtros.temporada.trim());
  if (jugadorIdsEnCategoria) query = query.in("jugador_id", jugadorIdsEnCategoria);

  const { data: rows, error } = await query;
  if (error) return { ok: false, error: error.message };

  const truncado = (rows ?? []).length > MAX_FILAS_REPORTE;
  const acotadas = (rows ?? []).slice(0, MAX_FILAS_REPORTE);

  const evaluadorIds = [
    ...new Set(acotadas.map((r) => r.evaluador_id).filter(Boolean)),
  ] as string[];
  let evaluadorMap = new Map<string, string>();
  if (evaluadorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre_completo")
      .in("id", evaluadorIds);
    evaluadorMap = new Map(
      (profs ?? []).map((p) => [p.id, p.nombre_completo?.trim() || "—"])
    );
  }

  type JugadorJoin = { nombre: string; apellido: string; categoria: string };
  const unir = <T,>(v: T | T[] | null | undefined): T | null =>
    v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v;

  const filas: FilaReporteEvaluacion[] = acotadas.map((r) => {
    const jug = unir(r.jugadores as JugadorJoin | JugadorJoin[] | null);
    const tipo = unir(r.tipos_evaluacion as { nombre: string } | { nombre: string }[] | null);
    return {
      apellido: jug?.apellido ?? "—",
      nombre: jug?.nombre ?? "",
      categoria: jug?.categoria ?? "—",
      tipo_nombre: tipo?.nombre ?? null,
      fecha: r.fecha,
      temporada: r.temporada,
      evaluador_nombre: r.evaluador_id
        ? (evaluadorMap.get(r.evaluador_id) ?? null)
        : null,
      fisico: r.puntaje_fisico ?? 0,
      tecnico: r.puntaje_tecnico ?? 0,
      tactico: r.puntaje_tactico ?? 0,
      social: r.puntaje_social ?? 0,
      emocional: r.puntaje_emocional ?? 0,
      promedio: r.puntaje_promedio ?? 0,
    };
  });

  filas.sort(
    (a, b) =>
      a.categoria.localeCompare(b.categoria, "es") ||
      a.apellido.localeCompare(b.apellido, "es") ||
      a.nombre.localeCompare(b.nombre, "es") ||
      b.fecha.localeCompare(a.fecha)
  );

  return { ok: true, filas, truncado };
}

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
  const isAdmin = esAdminOAuditor(profile.rol);
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

  const isAdmin = esAdminOAuditor(profile.rol);
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

  if (!profile?.club_id || !esAdminOAuditor(profile.rol)) {
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
    esAdminOAuditor(profile.rol) ||
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
