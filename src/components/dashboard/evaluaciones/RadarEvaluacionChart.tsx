"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { DimensionKey } from "@/lib/evaluaciones/escala";
import { ESCALA_EVALUACION } from "@/lib/evaluaciones/escala";

const DIM_ORDER: DimensionKey[] = [
  "fisico",
  "tecnico",
  "tactico",
  "social",
  "emocional",
];

export function RadarEvaluacionChart(props: {
  fisico: number;
  tecnico: number;
  tactico: number;
  social: number;
  emocional: number;
  color?: string;
}) {
  const data = DIM_ORDER.map((key) => ({
    dimension: ESCALA_EVALUACION[key].nombre,
    fullMark: 5,
    value: props[key],
  }));

  const stroke = props.color ?? "var(--color-primary, #c0392b)";

  return (
    <div className="w-full h-[280px] sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#475569", fontSize: 11 }}
          />
          <Radar
            name="Puntaje"
            dataKey="value"
            stroke={stroke}
            fill={stroke}
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
