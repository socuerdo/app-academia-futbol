import type { Rol } from "@/types/database";
import type { MenuItem, MenuItemLink } from "@/types/dashboard";

const PERMISO_CARGAR_JUGADOR = "jugadores.crear";
const PERMISO_VER_REPORTES = "reportes.ver";

function hasPermiso(permisos: string[] | undefined, permiso: string): boolean {
  return Array.isArray(permisos) && permisos.includes(permiso);
}

export function getDashboardMenuItems(
  rol: Rol,
  permisos: string[] = []
): MenuItem[] {
  const isAdmin = rol === "admin" || rol === "superadmin";
  const isProfesor = rol === "profesor";
  const canCargarJugador = isAdmin || hasPermiso(permisos, PERMISO_CARGAR_JUGADOR);
  const canVerReportes = isAdmin || hasPermiso(permisos, PERMISO_VER_REPORTES);

  const items: MenuItem[] = [];

  items.push({ type: "link", label: "Dashboard", href: "/dashboard" });

  if (canCargarJugador || isAdmin) {
    const jugadoresItems: MenuItemLink[] = [];
    if (isAdmin) {
      jugadoresItems.push(
        { type: "link", label: "Cargar jugador", href: "/dashboard/jugadores/cargar" },
        { type: "link", label: "Buscar/Editar", href: "/dashboard/jugadores/buscar" },
        { type: "link", label: "Activar/Desactivar", href: "/dashboard/jugadores/activar" },
        { type: "link", label: "Cambiar sede/categoría", href: "/dashboard/jugadores/cambiar-sede" },
        { type: "link", label: "Importar jugadores", href: "/dashboard/jugadores/importar" }
      );
    } else {
      jugadoresItems.push(
        { type: "link", label: "Cargar jugador", href: "/dashboard/jugadores/cargar" }
      );
    }
    items.push({ type: "group", label: "Jugadores", items: jugadoresItems });
  }

  const asistenciasItems: MenuItemLink[] = [
    { type: "link", label: "Cargar asistencias", href: "/dashboard/asistencias/cargar" },
  ];
  if (canVerReportes) {
    asistenciasItems.push(
      { type: "link", label: "Reportes de asistencias", href: "/dashboard/asistencias/reportes" },
      { type: "link", label: "Reporte por jugador", href: "/dashboard/asistencias/reporte-jugador" },
      { type: "link", label: "Reporte todos los jugadores", href: "/dashboard/asistencias/reporte-todos" }
    );
  }
  items.push({ type: "group", label: "Asistencias", items: asistenciasItems });

  if (isAdmin || isProfesor) {
    items.push({
      type: "group",
      label: "Evaluaciones",
      items: [
        { type: "link", label: "Cargar evaluación", href: "/dashboard/evaluaciones/nueva" },
        { type: "link", label: "Ver evaluaciones", href: "/dashboard/evaluaciones" },
      ],
    });
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
