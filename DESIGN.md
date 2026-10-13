---
name: Gestión de Asistencias
description: Sistema visual de una app de gestión para escuelas de fútbol: neutra y legible, con el color de cada club como única voz fuerte.
colors:
  club-primary: "#c0392b"
  club-sidebar: "#2c3e50"
  white: "#ffffff"
  paper: "#f8fafc"
  paper-tint: "#f1f5f9"
  line: "#e2e8f0"
  line-strong: "#cbd5e1"
  ink-muted: "#64748b"
  ink-soft: "#475569"
  ink: "#334155"
  ink-strong: "#1e293b"
  ink-deep: "#0f172a"
  present: "#047857"
  present-tint: "#ecfdf5"
  pending: "#b45309"
  pending-tint: "#fffbeb"
  alert: "#b91c1c"
  alert-tint: "#fee2e2"
typography:
  display:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: "normal"
  body-input-mobile:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.club-primary}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.lg}"
    padding: "16px"
  filter-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  text-input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-input-mobile}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "44px"
  badge-present:
    backgroundColor: "{colors.present-tint}"
    textColor: "{colors.present}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-pending:
    backgroundColor: "{colors.pending-tint}"
    textColor: "{colors.pending}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-alert:
    backgroundColor: "{colors.alert-tint}"
    textColor: "{colors.alert}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  nav-link:
    backgroundColor: "{colors.club-sidebar}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
---

# Design System: Gestión de Asistencias

## Overview

**Creative North Star: "La planilla del entrenador"**

La interfaz se comporta como una planilla de cancha bien hecha: clara, rápida y sin adornos que estorben. El fondo es casi blanco con un gris azulado muy tenue, el texto es gris pizarra oscuro y todo lo que importa se resuelve con una tabla, una lista o un interruptor grande. La energía del deporte no viene de decoración sino del color del club: es la única voz fuerte de la pantalla y marca botones, interruptores activos, avatares y el menú lateral.

La app es multi-club, así que dentro del panel su identidad propia es contenida: cada club define su color primario, el color de su menú lateral y su logo, y esa marca manda. La energía de equipo deportivo viene de la tipografía condensada en cursiva de los títulos y de los números grandes del dashboard, y de los interruptores de presente y pagada; el resto se mantiene plano, legible y denso donde el administrador lo necesita.

La entrada (portada, login y registro) es la única parte con identidad propia de la app, "App Club Deportivo", porque todavía no hay un club que la vista: campo rojo de camiseta con rayas verticales tenues, líneas de cancha dibujadas, títulos enormes en la tipografía condensada y una franja azul medianoche. Es la camiseta del equipo antes de ponerle el escudo de cada club.

Se usa en dos escenas distintas: el profesor en la cancha, con el celular, bajo el sol y con el pulgar; y la administración en una computadora, con tablas, filtros y reportes. Por eso hay un solo lenguaje visual con dos composiciones: lista de filas tocables en pantallas chicas, tabla en pantallas medianas y grandes.

**Key Characteristics:**
- Neutro y plano de base; el color del club es el único acento fuerte dentro del panel.
- Tipografía condensada en cursiva para títulos y números: ahí vive la energía deportiva.
- Legibilidad al aire libre: contraste alto, texto de 14 px como mínimo para lo importante, nada en gris claro.
- Zonas de toque de 44 px o más para todo lo que se opera con el pulgar.
- Estado siempre dicho con texto además de color ("Presente", "Pagada", "Pendiente").
- Mobile-first: lista de filas en celular, tabla desde 768 px.

## Colors

Paleta de grises pizarra con un único acento variable: el color primario del club. Los verdes, ámbares y rojos tienen significado fijo de estado y no son decorativos.

### Primary
- **Rojo camiseta del club** (`#c0392b`, por defecto): color primario del club, configurable por cada club y expuesto como `--color-primary`. Botones primarios, interruptores encendidos, avatares sin foto, aviso de guardado y el logo sin imagen. Siempre se referencia como variable, nunca como valor fijo.
- **Azul medianoche del menú** (`#2c3e50`, por defecto): color del menú lateral del club, expuesto como `--color-sidebar`. Fondo del sidebar con texto blanco.

### Neutral
- **Papel** (`#f8fafc`) y **Papel tenue** (`#f1f5f9`): fondos de filtros, encabezados de tabla y filas alternas.
- **Línea** (`#e2e8f0`) y **Línea fuerte** (`#cbd5e1`): bordes de tarjetas y tablas; el borde fuerte para controles apagados.
- **Tinta tenue** (`#64748b`), **suave** (`#475569`), **tinta** (`#334155`), **fuerte** (`#1e293b`) y **profunda** (`#0f172a`): jerarquía del texto, de apoyo a titulares y números. El texto secundario no baja de la tinta suave sobre fondos de color.

### Estado
- **Verde presente** (`#047857`) sobre **tinte verde** (`#ecfdf5`): presente, pagada, éxito.
- **Ámbar pendiente** (`#b45309`) sobre **tinte ámbar** (`#fffbeb`): pendiente, atención.
- **Rojo alerta** (`#b91c1c`) sobre **tinte rojo** (`#fee2e2`): deuda, faltas, error, acciones destructivas.

### Named Rules
**The Club Voice Rule.** El color del club es la única voz fuerte de la pantalla. Se usa en acciones primarias y estados activos, siempre vía `var(--color-primary)`, y ningún componente fija su propio rojo de marca.

**The Words Beat Color Rule.** Un estado nunca se comunica solo con color: lleva palabra ("Presente", "Pagada", "Pendiente") o ícono con etiqueta.

**The No Gray On Color Rule.** Sobre fondos tintados el texto secundario se oscurece del mismo matiz o sube a tinta suave; nunca un gris claro.

## Typography

**Display Font:** Barlow Condensed (pesos 700 y 800, normal e itálica, con system-ui, sans-serif de respaldo), cargada con `next/font` y expuesta como `--font-display` / clase `font-display`.
**Body Font:** Inter
**Label/Mono Font:** Inter; no hay fuente monoespaciada.

**Character:** Dos voces claras. La condensada en cursiva y mayúsculas tiene el aire de una camiseta o un marcador y se reserva para títulos, números grandes y botones de la entrada; Inter, neutra y de lectura rápida, hace todo lo demás.

### Hierarchy
- **Display** (Barlow Condensed 800 cursiva, 48 px, 1): números de las tarjetas de métricas del dashboard; en la portada llega a 176 px.
- **Headline** (Barlow Condensed 800 cursiva, mayúsculas, 36 px, 1): título de cada página y de los formularios de entrada.
- **Title** (600, 18 px): títulos de secciones y diálogos.
- **Body** (500, 14 px, 1.43): texto de tablas, listas, filtros y botones; es el tamaño dominante de la app.
- **Body input mobile** (400, 16 px): campos de texto en celular, para que iOS no haga zoom al enfocar.
- **Label** (600, 12 px): etiquetas, chips y texto de apoyo.

### Named Rules
**The 14-Pixel Floor Rule.** Lo que el usuario necesita leer para decidir ("Presente", "Pendiente", nombres) no baja de 14 px; 12 px queda para chips y apoyo y nunca en gris claro.

**The Sixteen On Mobile Rule.** Los campos de texto editables miden 16 px en celular.

**The Display Is For Headlines Rule.** La tipografía condensada es solo para títulos, números grandes y botones de la entrada; nunca para texto corrido, tablas ni etiquetas.

## Layout

Estructura de panel: menú lateral a la izquierda (colapsable en escritorio, cajón en celular), barra superior con migas de pan, avisos y perfil, y contenido apilado con separación vertical de 24 px entre bloques. El espaciado se mueve en una escala corta (4, 8, 12, 16, 24 px) con tarjetas de 16 px de padding.

El punto de quiebre principal es 768 px (`md`): por debajo, las colecciones se muestran como lista de filas de al menos 64 px de alto sin scroll horizontal; por encima, como tabla. Las grillas de métricas pasan de dos columnas en celular a cinco en pantallas grandes, y los filtros de una columna a tres.

En celular, la acción principal de la pantalla vive en una barra fija al pie (por ejemplo, guardar asistencias), con margen inferior seguro para iPhone. Los accesos rápidos van antes que las métricas porque la tarea del profesor es actuar, no mirar.

## Elevation & Depth

Plano con sombra sutil. Las superficies están separadas por un borde fino gris y una sombra casi imperceptible; la profundidad real aparece solo como respuesta a una acción (hover) o para elementos flotantes.

### Shadow Vocabulary
- **Reposo** (`box-shadow: 0 1px 2px rgba(0,0,0,0.05)`, clase `shadow-sm`): tarjetas, tablas y secciones.
- **Hover** (`shadow-md`): tarjetas que se pueden tocar o abrir.
- **Flotante** (`shadow-lg`): aviso de guardado (toast).
- **Modal** (`shadow-xl`): diálogos y menús desplegables.

### Named Rules
**The Flat Until Touched Rule.** Las superficies están planas en reposo; la sombra sube solo con hover, foco o cuando el elemento flota sobre el contenido.

## Shapes

Esquinas suaves y consistentes. Tarjetas, botones, campos y contenedores usan radios de 12 px (`rounded-lg` y `rounded-xl` resuelven al mismo valor); controles pequeños y menús, 10 px u 8 px; chips, avatares e interruptores son píldoras o círculos completos. Los bordes son de 1 px en gris claro. No se usa ninguna forma geométrica decorativa ni recortes.

## Components

Carácter general: prácticos y seguros, con zonas de toque generosas.

### Buttons
- **Shape:** esquinas de 12 px, alto mínimo de 44 px.
- **Primary:** fondo del color del club, texto blanco, 14 px en peso medio, padding horizontal de 20 px; con ícono a la izquierda si ayuda.
- **Hover / Focus:** el hover oscurece levemente (`brightness 0.95`); el foco muestra un anillo de 2 px visible.
- **Secondary:** blanco con borde gris fuerte y texto tinta; hover con fondo papel.
- **Destructive (confirmación):** rojo sólido (`#dc2626`) solo dentro del diálogo de confirmación.
- **Disabled:** 50 % de opacidad.

### Cards / Containers
- **Corner Style:** 12 px.
- **Background:** blanco sobre fondo papel.
- **Shadow Strategy:** reposo, hover si es tocable (ver Elevation & Depth).
- **Border:** 1 px línea.
- **Internal Padding:** 16 px (12 px en las métricas de celular).
- **Regla:** sin tarjetas anidadas y sin borde grueso de color en un lado.

### Inputs / Fields
- **Style:** los filtros usan un contenedor tonal (fondo papel, borde fino, etiqueta de 14 px arriba) y el selector transparente adentro; los campos de texto, borde fino gris y 16 px en celular.
- **Focus:** contorno de 2 px en el color del club (filtros) o anillo del color del club (campos de texto).
- **Error:** mensaje en bloque rojo claro con borde y `role="alert"`, cerca de la acción que falló.

### Switch (interruptor de estado)
Control de 48 × 28 px con perilla circular. Encendido: fondo del color del club y perilla blanca. Apagado: fondo gris claro con borde y perilla gris pizarra, visibles al sol. Siempre acompañado de una etiqueta de texto de 14 px ("Presente"/"Ausente", "Pagada"/"Pendiente") dentro de un botón con `role="switch"` de 44 px o más. Es un componente compartido (`SwitchVisual`).

### Chips / Badges
Píldoras de 12 px en peso 600 con tinte suave (fondo claro, texto oscuro del mismo matiz): verde para presente o pagada, ámbar para pendiente, rojo para deuda y faltas, gris para pasado o neutro.

### Navigation
Menú lateral sobre el color del club, texto blanco al 85 %. Cada ítem tiene 16 px de ícono, 14 px de texto en peso medio y radio de 12 px. Hover: fondo blanco al 10 %. Activo: fondo blanco al 15 %, sin borde lateral. Los grupos se pliegan con una línea fina a la izquierda de los subítems. En celular es un cajón.

### Stat Card (tarjeta de métrica)
Tarjeta con un ícono chico junto al título, el número en Display y una línea de apoyo oculta en celular. Las métricas del club (jugadores activos, % de asistencia) son blancas con el ícono en el color del club; solo las de estado llevan tinte de fondo: verde para presentes, rosa para alertas y ámbar para cuotas impagas. Así el tinte conserva su significado y el color de marca no se confunde con una alerta. Si lleva a otra pantalla es un enlace con hover de sombra.

### Entrada (portada, login y registro)
Campo `#c0392b` con rayas verticales de negro al 7 % cada 56 px, líneas de cancha en trazo blanco al 20 % y franja inferior azul `#2c3e50`. Los títulos y las consignas van en Display cursiva en mayúsculas. El login y el registro son pantalla dividida: panel rojo con la marca y una consigna, y formulario blanco con controles de 48 px o más; en celular el panel se reduce a una franja con el nombre. Una sola animación de entrada en la portada, que se omite si el usuario pidió menos movimiento.

### Attendance Row (fila de asistencia)
Pieza distintiva para celular: una fila tocable de al menos 64 px con foto o inicial, "Apellido, Nombre", etiqueta de cuota si hay deuda y el interruptor con su palabra a la derecha; debajo, un campo de observación de 44 px. Toda la fila cambia el estado.

## Do's and Don'ts

### Do:
- **Do** usar siempre `var(--color-primary)` y `var(--color-sidebar)` para la marca del club; nunca un rojo o azul fijo.
- **Do** mantener las zonas de toque en 44 px o más (filas, interruptores, botones de ícono).
- **Do** acompañar cada estado con una palabra, además del color.
- **Do** oscurecer el texto secundario sobre fondos tintados (tinta suave o el 700 del mismo matiz).
- **Do** mostrar listas de filas en celular y tablas desde 768 px.
- **Do** poner el error cerca del botón que lo provocó, con `role="alert"`.

### Don't:
- **Don't** usar bordes gruesos de color en un solo lado de tarjetas, ítems o alertas.
- **Don't** usar texto en gris claro (`slate-400` o más claro) para nada que haya que leer; en 10 px menos todavía.
- **Don't** anidar tarjetas ni agrupar todo en bloques idénticos de ícono, título y texto.
- **Don't** usar sombras marcadas en reposo ni formas decorativas.
- **Don't** hacer que toda una fila cambie un dato sensible, como marcar una cuota como pagada: ahí el control es explícito.
- **Don't** hacer un campo de texto de menos de 16 px en celular.
