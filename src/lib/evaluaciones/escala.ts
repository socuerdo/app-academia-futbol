export const DIMENSION_KEYS = [
  "fisico",
  "tecnico",
  "tactico",
  "social",
  "emocional",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export type NivelEscala = {
  etapa: string;
  descripcion: string;
};

export type DimensionEscala = {
  nombre: string;
  icono: string;
  niveles: Record<1 | 2 | 3 | 4 | 5, NivelEscala>;
};

export const ESCALA_EVALUACION: Record<DimensionKey, DimensionEscala> = {
  fisico: {
    nombre: "Desarrollo Físico",
    icono: "🏃",
    niveles: {
      1: {
        etapa: "Iniciación Motriz",
        descripcion:
          "Descubriendo capacidades físicas básicas y coordinación global.",
      },
      2: {
        etapa: "En Crecimiento",
        descripcion:
          "Gana ritmo, avances en velocidad de desplazamiento.",
      },
      3: {
        etapa: "Consistencia Física",
        descripcion:
          "Mantiene un nivel de energía estable y responde bien a las cargas.",
      },
      4: {
        etapa: "Perfil Atlético",
        descripcion:
          "Destacado despliegue y recuperación rápida tras esfuerzos.",
      },
      5: {
        etapa: "Potencial de Élite",
        descripcion:
          "Condición física superior; domina duelos por potencia o velocidad.",
      },
    },
  },
  tecnico: {
    nombre: "Técnico",
    icono: "⚽",
    niveles: {
      1: {
        etapa: "Familiarización",
        descripcion:
          "Contacto inicial; reconoce el gesto técnico y el dominio del balón.",
      },
      2: {
        etapa: "Aplicación Básica",
        descripcion:
          "Ejecuta pases y controles sin presión defensiva.",
      },
      3: {
        etapa: "Técnica Funcional",
        descripcion:
          "Ejecuta fundamentos con seguridad en juego real, en ambos perfiles.",
      },
      4: {
        etapa: "Dominio Técnico",
        descripcion:
          "Fluidez y precisión en velocidad; resuelve situaciones complejas.",
      },
      5: {
        etapa: "Maestría Técnica",
        descripcion:
          "Ejecución creativa bajo máxima presión; genera ventajas claras.",
      },
    },
  },
  tactico: {
    nombre: "Táctico",
    icono: "🧭",
    niveles: {
      1: {
        etapa: "Ubicación Inicial",
        descripcion:
          "Comprende su posición y nociones básicas de ataque y defensa.",
      },
      2: {
        etapa: "Noción Colectiva",
        descripcion:
          "Se relaciona con compañeros y respeta el dibujo táctico básico.",
      },
      3: {
        etapa: "Lectura Activa",
        descripcion:
          "Decisiones acertadas según contexto; colabora en transiciones.",
      },
      4: {
        etapa: "Visión de Juego",
        descripcion:
          "Anticipa jugadas, ocupa espacios vacíos y rompe líneas.",
      },
      5: {
        etapa: "Referente Táctico",
        descripcion:
          "Organiza el equipo, entiende los tiempos y optimiza el juego.",
      },
    },
  },
  social: {
    nombre: "Sociales",
    icono: "🤝",
    niveles: {
      1: {
        etapa: "Integración al Grupo",
        descripcion:
          "Conociendo la dinámica del equipo y normas de convivencia.",
      },
      2: {
        etapa: "Participación Colaborativa",
        descripcion:
          "Se suma a tareas grupales con buena disposición.",
      },
      3: {
        etapa: "Comunicación Fluida",
        descripcion:
          "Interactúa positivamente con compañeros y cuerpo técnico.",
      },
      4: {
        etapa: "Cooperación Activa",
        descripcion:
          "Ayuda activamente, comunica durante el juego y fomenta unión.",
      },
      5: {
        etapa: "Liderazgo Inspirador",
        descripcion:
          "Pilar del grupo; motiva y comunica con asertividad.",
      },
    },
  },
  emocional: {
    nombre: "Emocional",
    icono: "🧠",
    niveles: {
      1: {
        etapa: "Descubrimiento Emocional",
        descripcion:
          "Aprendiendo a transitar emociones en competencia.",
      },
      2: {
        etapa: "Superación del Error",
        descripcion:
          "Mantiene entusiasmo tras fallos y acepta correcciones.",
      },
      3: {
        etapa: "Equilibrio y Enfoque",
        descripcion:
          "Actitud positiva y estable durante práctica o partido.",
      },
      4: {
        etapa: "Mentalidad Resiliente",
        descripcion:
          "Se crece ante la dificultad y recupera confianza rápido.",
      },
      5: {
        etapa: "Fortaleza Competitiva",
        descripcion:
          "Mentalidad inquebrantable; lidera desde la calma.",
      },
    },
  },
};

export function nivelValido(n: number): n is 1 | 2 | 3 | 4 | 5 {
  return n >= 1 && n <= 5 && Number.isInteger(n);
}

export function getEtapaDescripcion(
  dimension: DimensionKey,
  nivel: number
): NivelEscala | null {
  if (!nivelValido(nivel)) return null;
  return ESCALA_EVALUACION[dimension].niveles[nivel];
}

export function promedioCincoDimensiones(
  f: number,
  tec: number,
  tac: number,
  soc: number,
  emo: number
): number {
  return (f + tec + tac + soc + emo) / 5;
}

export function badgePromedioClass(promedio: number): string {
  if (promedio < 2.5) return "bg-red-100 text-red-800 border-red-200";
  if (promedio < 3.5) return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}
