import { PERMISO, tienePermiso } from "@/lib/permisos";
import type { Rol } from "@/types/database";
import type { MenuItem, MenuItemLink } from "@/types/dashboard";

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

  if (isAdmin) {
    items.push({
      type: "group",
      label: "Jugadores",
      items: [
        { type: "link", label: "Cargar jugador", href: "/dashboard/jugadores/cargar" },
        { type: "link", label: "Buscar/Editar", href: "/dashboard/jugadores/buscar" },
        { type: "link", label: "Activar/Desactivar", href: "/dashboard/jugadores/activar" },
        { type: "link", label: "Cambiar sede/categoría", href: "/dashboard/jugadores/cambiar-sede" },
        { type: "link", label: "Importar jugadores", href: "/dashboard/jugadores/importar" },
      ],
    });
  } else if (isSecretaria) {
    items.push({
      type: "group",
      label: "Jugadores",
      items: [
        { type: "link", label: "Buscar", href: "/dashboard/jugadores/buscar" },
      ],
    });
  }

  if (!isSecretaria) {
    const asistenciasItems: MenuItemLink[] = [
      { type: "link", label: "Cargar asistencias", href: "/dashboard/asistencias/cargar" },
    ];
    if (canDescargarAsistencias) {
      asistenciasItems.push(
        { type: "link", label: "Reportes de asistencias", href: "/dashboard/asistencias/reportes" },
        { type: "link", label: "Reporte por jugador", href: "/dashboard/asistencias/reporte-jugador" },
        { type: "link", label: "Reporte todos los jugadores", href: "/dashboard/asistencias/reporte-todos" }
      );
    }
    items.push({ type: "group", label: "Asistencias", items: asistenciasItems });
  }

  if (isAdmin || (isProfesor && canVerEvaluaciones)) {
    const evaluacionesItems: MenuItemLink[] = [];
    if (canCrearEvaluaciones) {
      evaluacionesItems.push({
        type: "link",
        label: "Cargar evaluación",
        href: "/dashboard/evaluaciones/nueva",
      });
    }
    evaluacionesItems.push({
      type: "link",
      label: "Ver evaluaciones",
      href: "/dashboard/evaluaciones",
    });
    items.push({
      type: "group",
      label: "Evaluaciones",
      items: evaluacionesItems,
    });
  }

  if (canVerCuotas) {
    const cuotasItems: MenuItemLink[] = [];
    if (canCobrarCuotas) {
      cuotasItems.push({
        type: "link",
        label: "Cobrar cuotas",
        href: "/dashboard/cuotas",
      });
    }
    cuotasItems.push({
      type: "link",
      label: "Morosidad",
      href: "/dashboard/cuotas/morosidad",
    });
    items.push({ type: "group", label: "Cuotas", items: cuotasItems });
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
