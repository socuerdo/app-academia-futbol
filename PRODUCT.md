# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Escuelas y academias de fútbol (juvenil sobre todo) que gestionan su día a día con la app. Cada club es un tenant aparte.

- **Profesores** (usuario clave del día a día): cargan asistencias desde el celular, parados en la cancha. Algunos reciben permisos extra (editar jugadores, cargar/editar/descargar evaluaciones, descargar reportes de asistencia).
- **Admin y secretaria**: gestionan jugadores, cuotas y cobros, sedes, categorías y usuarios, normalmente desde la computadora. El rol auditor tiene el mismo acceso que admin.
- **Canchero**: administra turnos de alquiler y de escuela de las canchas.
- **Superadmin**: rol de la plataforma, ve y administra todos los clubes.

Los usuarios son en gran parte poco técnicos: ya hubo feedback de que el menú tenía demasiados subítems por sección.

## Product Purpose

Que un club lleve en un solo lugar a sus jugadores, la asistencia a entrenamientos, las evaluaciones y las cuotas, sin planillas sueltas. Éxito: el profesor registra la asistencia en segundos desde el celular, y la administración sabe quién viene, quién debe cuota y qué cambió.

## Positioning

SaaS multi-tenant para varias academias: cada club se registra solo (`/registro`) y queda aislado de los demás, con su propio logo y colores. Es un sistema de gestión pensado para escuelas de fútbol, no una app genérica de asistencias.

## Operating Context

- Los profesores usan la app en la cancha: celulares modestos, señal floja, lectura a la intemperie y bajo el sol.
- Administración trabaja en escritorio con tablas, filtros, reportes y exportaciones (PDF, Excel, CSV).
- Toda la interfaz está en español, con voseo rioplatense ("Iniciá sesión", "Revisá").
- Cambios y correcciones quedan en un historial de actividad auditable.

## Capabilities and Constraints

- **Jugadores:** alta, edición, foto, activar/desactivar, cambio de sede, importación masiva por CSV/Excel con asignación de categoría en un segundo paso, cumpleaños próximos y recientes.
- **Asistencias:** carga por sede, categoría y fecha (sin restricción de fecha); reportes general, por jugador y de todos, con totales por género.
- **Evaluaciones:** tipos por club, carga y edición con permisos, reporte descargable en PDF y enlace público por token.
- **Cuotas:** estado por período, morosidad, historial; los períodos anteriores a la inscripción no cuentan como deuda.
- **Configuración:** sedes, categorías, usuarios y permisos, personalización de marca del club, historial de actividad.
- **Canchero:** turnos de alquiler y de escuela por cancha.
- **Roles:** superadmin, admin, auditor, profesor, secretaria, canchero. El menú y las acciones dependen del rol y de permisos finos.
- **Técnicas:** Next.js (App Router) + Supabase con RLS por `club_id`, deploy en Vercel. Cada club define su color primario, color de sidebar y logo, y esa identidad manda dentro de su dashboard.

## Brand Commitments

La marca del club prevalece sobre la de la app dentro del dashboard: logo, color primario y color del sidebar son configurables por club y no se pueden pisar con colores fijos de la app.

## Evidence on Hand

- Feedback de una usuaria que recorrió toda la app (Jam #0bfc4f58), resumido en `mejoras-ui.md`: consolidar secciones en menos pantallas, con vistas de tabla y acciones integradas.
- Contexto técnico y de producto en `docs/contexto-app-claude.md`.
- No hay testimonios, métricas de uso, casos de clientes ni precios documentados. No inventarlos.

## Product Principles

1. **La cancha manda.** Lo que hace el profesor desde el celular (cargar asistencia) tiene que ser rápido, legible al sol y funcionar con señal pobre.
2. **Pocas pantallas, acciones a mano.** Preferir una tabla con acciones integradas antes que páginas separadas por tarea.
3. **El club primero, la app después.** La identidad visual del club es la protagonista; la interfaz de la app se mantiene neutra.
4. **Cada rol ve solo lo suyo.** Menús, acciones y permisos se ajustan al rol; nada de funciones que el usuario no puede usar.
5. **Lo que cambia, queda registrado.** Las modificaciones a datos sensibles (asistencias, cuotas, jugadores) se pueden rastrear.

## Accessibility & Inclusion

- Contraste alto y textos legibles al aire libre, bajo el sol.
- Zonas táctiles grandes y acciones obvias para usuarios poco técnicos.
- Livianidad y tolerancia a conexiones flojas en celulares modestos.
