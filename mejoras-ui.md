# Mejoras UI — App Academias Fútbol

## Contexto del proyecto

Sistema web multi-tenant de gestión para academias y clubs de fútbol.
Stack: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (sin ORM).
UI completamente en español.

---

## Feedback recibido (Jam #0bfc4f58)

La usuaria recorrió toda la app y señaló que el menú lateral tiene demasiados subítems por sección. La mejora principal es **consolidar cada sección en la menor cantidad de pantallas posible**, priorizando vistas de tabla con acciones integradas en lugar de páginas separadas para cada acción.

---

## Mejoras por sección

---

### 1. Jugadores — PRIORIDAD ALTA

**Problema:** 5 subítems en el menú (Cargar, Buscar/Editar, Activar, Cambiar sede, Importar) que llevan a páginas separadas con funcionalidades que deberían estar unificadas.

**Solución:** Una sola ruta `/dashboard/jugadores` con tabla unificada.

**Comportamiento esperado:**
- La página carga por defecto con **todos los jugadores activos** del club (paginados)
- **Buscador** por nombre y/o apellido en el header de la tabla
- **Filtros:** sede, categoría, estado (activo / inactivo / todos)
- **Columnas de la tabla:** Foto (avatar), Apellido y Nombre, Categoría, Sede, Cuota del mes actual (badge: Pagada / Pendiente / Sin datos), Estado (activo/inactivo)
- **Acciones por fila** (menú de 3 puntos o botones inline):
  - Editar jugador → abre modal con el formulario completo
  - Activar / Desactivar → toggle con confirmación
  - Cambiar sede → modal o select inline
- **Header de la página:**
  - Botón primario: `+ Nuevo jugador` → abre modal con formulario de carga
  - Botón secundario: `Importar CSV` → abre modal/drawer con el flujo existente de importación
- **Menú lateral:** reemplazar los 5 subítems por **un solo ítem "Jugadores"** que apunta a `/dashboard/jugadores`

**Archivos a modificar/crear:**
- `src/app/dashboard/jugadores/page.tsx` — nueva página unificada
- `src/app/dashboard/jugadores/components/` — tabla, modales, filtros
- `src/lib/menu.ts` (o donde esté `getDashboardMenuItems()`) — actualizar estructura del menú
- Mantener las server actions existentes; solo cambiar la UI que las consume

---

### 2. Asistencias — PRIORIDAD MEDIA

**Problema:** 4 subítems (Cargar, Reportes, Reporte jugador, Reporte todos) donde los 3 de reportes podrían unificarse.

**Solución:** 2 subítems en el menú.

**Comportamiento esperado:**
- **"Cargar asistencias"** → mantener exactamente como está (`/dashboard/asistencias/cargar`)
- **"Reportes"** → nueva vista en `/dashboard/asistencias/reportes` que muestra la tabla general de asistencias con filtros (sede, categoría, fecha/rango). Al hacer clic en un jugador de la tabla, se expande o navega a la vista de reporte individual de ese jugador (drill-down). Eliminar las rutas separadas `reporte-jugador` y `reporte-todos`.
- **Menú lateral:** 2 ítems bajo Asistencias: `Cargar` y `Reportes`

---

### 3. Evaluaciones — PRIORIDAD BAJA

**Problema:** "Nueva evaluación" aparece como ítem del menú, pero dentro del listado de evaluaciones ya existe un botón para crear una nueva.

**Solución:** Eliminar el subítem "Nueva evaluación" del menú lateral.

**Comportamiento esperado:**
- **Menú lateral:** 1 solo ítem `Evaluaciones` que apunta al listado `/dashboard/evaluaciones`
- Dentro del listado, el botón `+ Nueva evaluación` es el único punto de entrada para crear
- No se modifica ninguna lógica ni página, solo se actualiza `getDashboardMenuItems()`

---

### 4. Cuotas — PRIORIDAD MEDIA

**Problema:** "Cobrar cuotas" y "Morosidad" son pantallas separadas, y la de cobro no tiene buscador por nombre de jugador.

**Solución:** Mantener 2 subítems pero mejorar la pantalla de cobro.

**Comportamiento esperado:**
- **"Cobrar cuotas"** en `/dashboard/cuotas`:
  - Agregar **buscador por nombre/apellido** encima de la tabla (para cuando un jugador viene a pagar directamente)
  - Mantener los filtros existentes de período (YYYY-MM), sede y categoría
  - La tabla muestra jugadores con su estado de cuota y el toggle pagado/pendiente
- **"Morosidad"** → mantener como está (`/dashboard/cuotas/morosidad`)
- **Menú lateral:** sin cambios estructurales, solo revisar labels si es necesario

---

## Menú lateral — Estructura objetivo

```
Dashboard

Jugadores                    ← 1 ítem (era 5)

Asistencias
  └─ Cargar
  └─ Reportes                ← unifica los 3 reportes anteriores

Evaluaciones                 ← 1 ítem, sin "Nueva evaluación"

Cuotas
  └─ Cobrar cuotas           ← mejorada con buscador
  └─ Morosidad

Configuración                ← sin cambios
  └─ Sedes
  └─ Categorías
  └─ Usuarios
  └─ Personalización
```

---

## Convenciones a respetar

- Toda query filtra por `club_id` (multi-tenancy)
- No usar Prisma; queries con cliente Supabase directo
- Server Actions en `src/app/actions/` o co-ubicadas con la feature
- Cada Server Action llama `revalidatePath()` al final
- Validación solo server-side
- Componentes reutilizables en `src/components/`
- Helpers en `src/lib/`
- No modificar lógica de negocio existente, solo reorganizar la UI

---

## Orden de implementación sugerido

1. **Jugadores** — mayor impacto, consolida 5 rutas en 1
2. **Evaluaciones** — cambio mínimo, solo menú
3. **Cuotas** — agregar buscador a pantalla existente
4. **Asistencias** — requiere pensar el drill-down de reportes
