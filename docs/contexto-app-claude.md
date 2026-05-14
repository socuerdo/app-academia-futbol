# App academias fútbol — contexto para Claude

Documento de referencia del producto y la arquitectura. Útil para onboarding, refactors o nuevas features sin perder el hilo del dominio.

---

## Qué es

Web app **multi-club** para **escuelas / academias de fútbol**: gestión de **jugadores**, **asistencias**, **evaluaciones** (dimensiones físico, técnico, táctico, social, emocional), **cuotas mensuales** y **morosidad**, y **configuración del club** (sedes, categorías, marca, usuarios). Existe un panel **superadmin** para operar sobre todos los clubes.

---

## Stack técnico

| Área | Tecnología |
|------|------------|
| Framework | Next.js (App Router), React 18, TypeScript |
| Estilos / UI | Tailwind, Radix UI, shadcn, lucide-react |
| Backend / datos | Supabase (Auth con cookies `@supabase/ssr`, Postgres, RLS según políticas del proyecto) |
| Gráficos | recharts |
| Exportes | exceljs, jspdf, jspdf-autotable |
| Import CSV | papaparse |
| Otros | @dnd-kit (reordenar p. ej. categorías), SWR en hooks cliente |

---

## Autenticación y rutas protegidas

| Ruta | Rol |
|------|-----|
| `/` | Pública: landing (login / registro) |
| `/login` | Pública |
| `/registro` | Pública: alta de club + primer usuario → `POST /api/registro` |
| `/dashboard/*` | Usuario autenticado con club y rol permitido |
| `/superadmin/*` | Solo rol `superadmin` |

**Middleware** (`src/middleware.ts`):

- Sin sesión y ruta protegida → redirect `/login?redirectTo=...`
- Perfil `activo: false` → signOut, redirect con `inactivo=1`
- Club inactivo (usuario no superadmin) → signOut, `suspended=1`
- `superadmin` en `/dashboard` → redirect `/superadmin`
- Usuario no `superadmin` en `/superadmin` → redirect `/dashboard`

**Layout dashboard** (`src/app/dashboard/layout.tsx`): exige `club_id` y rol en `admin | profesor | superadmin | secretaria`; carga club (nombre, logo, colores). Si falta club o club inactivo, mensaje en UI.

---

## Roles y permisos

### Roles (`src/types/database.ts`)

| Rol | Alcance típico |
|-----|----------------|
| `superadmin` | Panel global `/superadmin`, no opera día a día de un club en `/dashboard` |
| `admin` | Todo el club: configuración, usuarios, jugadores, asistencias, evaluaciones, cuotas |
| `secretaria` | Jugadores, asistencias, cuotas (cobrar + morosidad); sin evaluaciones en menú estándar |
| `profesor` | Asistencias; evaluaciones según permisos; cuotas solo **morosidad** (consulta) |

### Permisos de profesor (`src/lib/permisos.ts`)

Almacenados en `profiles.permisos` (array de strings):

- `evaluaciones.crear` — cargar nuevas evaluaciones
- `evaluaciones.editar` — editar existentes
- `evaluaciones.descargar` — PDF / reportes de evaluaciones
- `asistencias.descargar` — tabs de reportes y exportes de asistencias; sin esto solo **Cargar asistencias**

Menú lateral: `getDashboardMenuItems` en `src/lib/dashboard-menu.ts`.

---

## Modelo de datos (resumen)

- **Club**: nombre, logo, colores primario/sidebar, iniciales, activo
- **Profile**: `club_id`, rol, nombre, teléfono, foto, `categorias_asignadas`, `permisos`, activo
- **Sede**, **Categoría** (orden, activo)
- **Jugador**: DNI, nombre, apellido, sexo, categoría, sede, camiseta, fechas/carnet, foto, activo
- **Asistencia**: jugador, fecha, presente, observación, registrado_por
- **Cuota**: jugador, periodo `YYYY-MM`, estado `pagado` | `pendiente`, monto, fecha_pago, observación
- **TipoEvaluacion**, **Evaluacion**: puntajes y comentarios por dimensión, promedio, temporada, `token_publico`

Toda operación de club debe respetar **`club_id`** del perfil autenticado.

---

## Módulos del dashboard (`/dashboard`)

### Dashboard (`/dashboard`)

- KPIs: jugadores activos, presentes hoy, % asistencia del mes, alertas asistencia &lt;70%, jugadores con cuota impaga del mes actual
- Tabla de seguimiento baja asistencia
- Accesos rápidos según rol (`DashboardPrincipal`)

### Jugadores (`/dashboard/jugadores`)

- Listado unificado: filtros (búsqueda, categoría, sede, activos/inactivos), paginación
- Alta, edición, activar/desactivar, baja/eliminación según rol
- Importación CSV
- Marcadores de deuda (cuotas pendientes)
- Rutas legacy posibles: `/dashboard/jugadores/cargar`, `buscar`, `importar`, `activar`, `cambiar-sede`

### Asistencias (`/dashboard/asistencias`)

Query `tab`:

- `cargar` (default): registro por sede, categoría, fecha
- `reporte`, `jugador`, `todos`: solo si puede descargar/reportar (admin, secretaria o permiso `asistencias.descargar`)

### Evaluaciones (`/dashboard/evaluaciones`)

Query `tab`:

- `lista`: listado con filtros y paginación
- `nueva`: alta (admin o permiso `evaluaciones.crear`)

Rutas adicionales:

- Detalle: `/dashboard/evaluaciones/[id]`
- Editar: `/dashboard/evaluaciones/[id]/editar`
- Historial por jugador: `/dashboard/evaluaciones/historial/[jugadorId]`
- Posible ruta suelta: `/dashboard/evaluaciones/nueva`

### Cuotas (`/dashboard/cuotas`)

Query `tab` y `periodo` (`YYYY-MM`):

- `cobrar`: registrar pagos del período (admin, superadmin en club, secretaria)
- `morosidad`: deudores; **profesor** solo este modo (redirect si intenta cobrar)

### Configuración (menú principalmente **admin**)

| Ruta | Contenido |
|------|-----------|
| `/dashboard/sedes` | ABM sedes |
| `/dashboard/configuracion/categorias` | Categorías, orden, activo |
| `/dashboard/usuarios` | Staff: admin, profesor, secretaria; emails (Admin API); categorías y permisos de profesor |
| `/dashboard/configuracion` | Personalización del club (logo vía API) |

Alias: `/dashboard/administracion/*` puede redirigir a rutas equivalentes.

### Perfil (`/dashboard/perfil`)

Datos personales, foto, teléfono, cambio de contraseña (`/api/profile/*`).

---

## Superadmin (`/superadmin`)

- Resumen: clubes totales/activos, jugadores, usuarios
- `/superadmin/clubes`, `/superadmin/clubes/nuevo`, `/superadmin/clubes/[id]`
- `/superadmin/usuarios`

---

## APIs internas (`src/app/api`)

| Ruta | Uso |
|------|-----|
| `POST /api/registro` | Registro club + usuario |
| `POST /api/auth/signout` | Cerrar sesión |
| `POST /api/users/create`, `PATCH/PUT .../api/users/update/[id]` | Usuarios |
| `POST /api/profile/update`, `change-password`, `upload-avatar` | Perfil |
| `POST /api/club/upload-logo` | Logo del club |

Mucha lógica también vía **Server Components**, **server actions** y consultas Supabase directas.

---

## Convenciones para cambios de código

- Reutilizar patrones existentes: mismo estilo de imports, nombres en español en UI, `createClient` servidor vs cliente según archivo.
- Nuevas pantallas del club: enlazar en `dashboard-menu.ts` si aplica y respetar roles/permisos.
- Cualquier listado o mutación: filtrar siempre por `club_id` del perfil salvo código explícito de superadmin.

---

## Scripts útiles

```bash
npm run dev      # desarrollo
npm run build    # producción
npm run lint
npm run create-superadmin  # script ts-node para primer superadmin
```

---

*Generado como contexto estático del repositorio; actualizar si cambian roles, rutas o flujos críticos.*
