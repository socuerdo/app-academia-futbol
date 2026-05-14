import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAccion =
  | "crear"
  | "editar"
  | "eliminar"
  | "importar"
  | "activar"
  | "desactivar"
  | "asignar_categoria"
  | "guardar_asistencias";

export type AuditEntidad = "jugador" | "asistencia" | "evaluacion" | "cuota" | "importacion";

type AuditParams = {
  clubId: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: AuditAccion;
  entidad: AuditEntidad;
  entidadId?: string;
  entidadDescripcion?: string;
  cambios?: Record<string, unknown>;
};

export async function registrarAccion(
  supabase: SupabaseClient,
  params: AuditParams
): Promise<void> {
  await supabase.from("audit_log").insert({
    club_id: params.clubId,
    usuario_id: params.usuarioId,
    usuario_nombre: params.usuarioNombre,
    accion: params.accion,
    entidad: params.entidad,
    entidad_id: params.entidadId ?? null,
    entidad_descripcion: params.entidadDescripcion ?? null,
    cambios: params.cambios ?? null,
  });
}
