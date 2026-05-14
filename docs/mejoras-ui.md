# Mejoras de UI — app-academias-futbol

## Mejora 1: Jugadores — página unificada ✅

**Objetivo:** Consolidar las 5 sub-rutas de jugadores en una sola página `/dashboard/jugadores` con tabla interactiva.

**Antes:** 5 sub-rutas independientes
- `/dashboard/jugadores/cargar` — Formulario de alta
- `/dashboard/jugadores/buscar` — Búsqueda y edición
- `/dashboard/jugadores/activar` — Toggle activo/inactivo
- `/dashboard/jugadores/cambiar-sede` — Cambiar sede/categoría
- `/dashboard/jugadores/importar` — Importación CSV/Excel

**Después:** Una sola página `/dashboard/jugadores`
- Tabla con todos los jugadores, paginada (client-side)
- Filtros: texto libre (DNI/apellido/nombre), categoría, sede, estado (activos/inactivos/todos)
- Toggle activo/inactivo inline (admin)
- Edición, cambio de sede/categoría y eliminación desde modal de edición
- Botón "Nuevo jugador" → modal con formulario de alta
- Botón "Importar" → modal con importador CSV/Excel
- Secretaria: tabla de solo lectura
- Sub-rutas antiguas redirigen a `/dashboard/jugadores`

**Archivos:**
- `src/app/dashboard/jugadores/page.tsx` — servidor: carga jugadores + sedes + deudas
- `src/components/dashboard/jugadores/JugadoresUnificadosView.tsx` — componente principal (client)
- `src/components/dashboard/jugadores/CargarJugadorForm.tsx` — agrega prop `onSuccess?`
- `src/lib/dashboard-menu.ts` — grupo Jugadores → un solo link
- Sub-rutas → `redirect("/dashboard/jugadores")`

---

## Mejora 2: Asistencias — página unificada con tabs ✅

**Objetivo:** Consolidar las 4 sub-rutas de asistencias en una sola página `/dashboard/asistencias` con navegación por tabs.

**Tabs:**
- `?tab=cargar` (default) — Cargar asistencias
- `?tab=reporte` — Reporte general con % por jugador
- `?tab=jugador` — Reporte individual + heatmap 90 días
- `?tab=todos` — Listado completo con vencimiento de carnet

**Patrón:** Tabs server-side via query params. Cada tab carga sus datos en el mismo `page.tsx`. Los componentes existentes se reutilizan con URLs actualizadas a `/dashboard/asistencias?tab=X&...`. Deep linking funciona correctamente.

**Permisos:** Tabs de reportes solo visibles para admin o con permiso `asistencias.descargar`. Si el usuario sin permiso intenta acceder a un tab de reporte via URL, redirige a `?tab=cargar`.

**Archivos:**
- `src/app/dashboard/asistencias/page.tsx` — nueva página unificada con toda la lógica de data loading
- 4 componentes existentes — solo se actualizan las URLs que generan
- `src/lib/dashboard-menu.ts` — grupo Asistencias → un solo link
- Sub-rutas → redirect al tab correspondiente

---

## Mejora 3: Evaluaciones — página unificada con tabs ✅

**Objetivo:** Consolidar `/evaluaciones/nueva` y el listado en una sola página `/dashboard/evaluaciones`.

**Tabs:**
- Sin tab / `?tab=lista` (default) → Listado con filtros y paginación
- `?tab=nueva` → Formulario de nueva evaluación (solo con permiso `evaluaciones.crear`)

**Patrón:** Igual que asistencias. El tab bar y el botón "+ Nueva evaluación" viven en el page. `EvaluacionesListView` ya no renderiza el h1 ni el botón.

**Permisos:** Tab "Nueva evaluación" visible solo para usuarios con `canCrear`. Acceso directo via URL protegido server-side.

**Archivos:**
- `src/app/dashboard/evaluaciones/page.tsx` — absorbe lógica de `nueva/page.tsx`, maneja tabs
- `src/components/dashboard/evaluaciones/EvaluacionesListView.tsx` — se quita el header con h1 y botón
- `src/lib/dashboard-menu.ts` — grupo con 2 links → 1 link "Evaluaciones"
- `/evaluaciones/nueva` → redirect a `?tab=nueva`

---

## Mejora 4: Cuotas — página unificada con tabs ✅

**Objetivo:** Consolidar `/cuotas` (cobrar) y `/cuotas/morosidad` en una sola página `/dashboard/cuotas` con navegación por tabs.

**Tabs:**
- `?tab=cobrar` (default para admin/secretaria) — Cobrar cuotas por período
- `?tab=morosidad` (default para profesor) — Listado de jugadores con deuda

**Permisos:**
- `canCobrar` (admin/superadmin/secretaria): ve ambos tabs; tab bar visible
- `canVer` (+ profesor): solo tab morosidad; sin tab bar
- Tab bar solo se renderiza si `canCobrar`; acceso a `?tab=cobrar` sin permiso redirige a `?tab=morosidad`

**Archivos:**
- `src/app/dashboard/cuotas/page.tsx` — absorbe lógica de morosidad/page.tsx, maneja tabs con datos compartidos vía Promise.all
- `src/components/dashboard/cuotas/CobrarCuotasView.tsx` — se quita h1, `navegarFiltros` usa `/dashboard/cuotas?tab=cobrar&...`
- `src/components/dashboard/cuotas/MorosidadView.tsx` — se quita h1+desc, `navegarFiltros` usa `/dashboard/cuotas?tab=morosidad&...`
- `src/lib/dashboard-menu.ts` — grupo Cuotas → un solo link "Cuotas"
- `/cuotas/morosidad/page.tsx` → `redirect("/dashboard/cuotas?tab=morosidad")`

---

## Mejora 5: Dashboard home — correcciones y accesos por rol ✅

**Objetivo:** Arreglar links rotos post-consolidación y mejorar accesos rápidos por rol.

**Cambios:**
- Tipo `rol` expandido: `"admin" | "superadmin" | "profesor" | "secretaria"` (antes solo admin/profesor)
- Accesos rápidos diferenciados por rol:
  - Admin/Superadmin: Jugadores, Cargar asistencias, Reportes, Gestión de usuarios
  - Secretaria: Jugadores, Cobrar cuotas, Morosidad
  - Profesor: Cargar asistencias, Reportes, Evaluaciones
- Card "Alertas" ahora es un `<Link>` hacia `/dashboard/asistencias?tab=reporte`
- Card "Cuotas impagas" link corregido: `/cuotas/morosidad` → `/cuotas?tab=morosidad`; se renderiza sin link para profesor
- "Editar" en tabla de baja asistencia corregido: `/jugadores/buscar?dni=` → `/asistencias?tab=jugador&jugador=${id}` (reporte individual)
- Todos los URLs de accesos rápidos actualizados a rutas unificadas

**Archivos:**
- `src/components/dashboard/DashboardPrincipal.tsx`
- `src/app/dashboard/page.tsx` — cast de rol corregido

---

## Mejora 6: (pendiente)
