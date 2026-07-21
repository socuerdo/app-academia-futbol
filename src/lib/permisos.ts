export const PERMISO = {
  EVALUACIONES_CREAR: "evaluaciones.crear",
  EVALUACIONES_EDITAR: "evaluaciones.editar",
  EVALUACIONES_DESCARGAR: "evaluaciones.descargar",
  ASISTENCIAS_DESCARGAR: "asistencias.descargar",
  JUGADORES_EDITAR: "jugadores.editar",
} as const;

export type PermisoKey = (typeof PERMISO)[keyof typeof PERMISO];

export const PERMISO_LABELS: Record<string, string> = {
  [PERMISO.EVALUACIONES_CREAR]: "Cargar evaluaciones",
  [PERMISO.EVALUACIONES_EDITAR]: "Editar evaluaciones",
  [PERMISO.EVALUACIONES_DESCARGAR]: "Descargar reporte de evaluaciones",
  [PERMISO.ASISTENCIAS_DESCARGAR]: "Descargar reporte de asistencias",
  [PERMISO.JUGADORES_EDITAR]: "Editar y crear jugadores",
};

export const PERMISOS_PROFESOR: { value: string; label: string }[] = [
  { value: PERMISO.JUGADORES_EDITAR, label: PERMISO_LABELS[PERMISO.JUGADORES_EDITAR] },
  { value: PERMISO.EVALUACIONES_CREAR, label: PERMISO_LABELS[PERMISO.EVALUACIONES_CREAR] },
  { value: PERMISO.EVALUACIONES_EDITAR, label: PERMISO_LABELS[PERMISO.EVALUACIONES_EDITAR] },
  { value: PERMISO.EVALUACIONES_DESCARGAR, label: PERMISO_LABELS[PERMISO.EVALUACIONES_DESCARGAR] },
  { value: PERMISO.ASISTENCIAS_DESCARGAR, label: PERMISO_LABELS[PERMISO.ASISTENCIAS_DESCARGAR] },
];

export function tienePermiso(
  permisos: string[] | null | undefined,
  permiso: string
): boolean {
  return Array.isArray(permisos) && permisos.includes(permiso);
}

/**
 * El rol "auditor" tiene el mismo acceso completo que "admin" (incluida la
 * autorización de cambios retroactivos en cuotas/asistencias), pero está por
 * encima en jerarquía. "superadmin" es el rol de plataforma (todos los clubes).
 */
export function esAdminOAuditor(rol: string | null | undefined): boolean {
  return rol === "admin" || rol === "auditor" || rol === "superadmin";
}
