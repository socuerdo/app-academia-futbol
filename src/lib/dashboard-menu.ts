import { PERMISO, tienePermiso } from "@/lib/permisos";
import type { Rol } from "@/types/database";
import type { MenuItem } from "@/types/dashboard";

export function getDashboardMenuItems(
  rol: Rol,
  permisos: string[] = []
): MenuItem[] {
  const isAdmin = rol === "admin" || rol === "superadmin";
  const isProfesor = rol === "profesor";
  const isSecretaria = rol === "secretaria";
  const canCrearEvaluaciones =
    isAdmin || tienePermiso(permisos, PERMISO.EVALUACIONES_CREAR);
  const canEditarEvaluaciones =
    isAdmin || tienePermiso(permisos, PERMISO.EVALUACIONES_EDITAR);
  const canDescargarEvaluaciones =
    isAdmin || tienePermiso(permisos, PERMISO.EVALUACIONES_DESCARGAR);
  const canVerEvaluaciones =
    canCrearEvaluaciones || canEditarEvaluaciones || canDescargarEvaluaciones;
  const canDescargarAsistencias =
    isAdmin || tienePermiso(permisos, PERMISO.ASISTENCIAS_DESCARGAR);
  const canVerCuotas = isAdmin || isSecretaria || isProfesor;
  const canCobrarCuotas = isAdmin || isSecretaria;

  const items: MenuItem[] = [];

  items.push({ type: "link", label: "Dashboard", href: "/dashboard" });

  if (isAdmin || isSecretaria) {
    items.push({ type: "link", label: "Jugadores", href: "/dashboard/jugadores" });
  }

  items.push({ type: "link", label: "Asistencias", href: "/dashboard/asistencias" });

  if (isAdmin || (isProfesor && canVerEvaluaciones)) {
    items.push({ type: "link", label: "Evaluaciones", href: "/dashboard/evaluaciones" });
  }

  if (canVerCuotas) {
    items.push({ type: "link", label: "Cuotas", href: "/dashboard/cuotas" });
  }

  if (isAdmin) {
    items.push({
      type: "group",
      label: "Configuración",
      items: [
        { type: "link", label: "Sedes", href: "/dashboard/sedes" },
        { type: "link", label: "Categorías", href: "/dashboard/configuracion/categorias" },
        { type: "link", label: "Usuarios", href: "/dashboard/usuarios" },
        { type: "link", label: "Personalización", href: "/dashboard/configuracion" },
      ],
    });
  }

  return items;
}
