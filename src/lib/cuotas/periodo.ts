// Helpers para trabajar con períodos de cuotas (formato YYYY-MM)

import { hoyISO } from "@/lib/fecha";

export function periodoActual(): string {
  return hoyISO().slice(0, 7);
}

export function esPeriodoValido(periodo: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo);
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatPeriodo(periodo: string): string {
  if (!esPeriodoValido(periodo)) return periodo;
  const [year, month] = periodo.split("-");
  return `${MESES[Number(month) - 1]} ${year}`;
}

export function periodosUltimos(n: number, hasta: string = periodoActual()): string[] {
  if (!esPeriodoValido(hasta)) return [];
  const [yStr, mStr] = hasta.split("-");
  let y = Number(yStr);
  let m = Number(mStr);
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return result;
}

export function periodosProximos(n: number, desde: string = periodoActual()): string[] {
  if (!esPeriodoValido(desde)) return [];
  const [yStr, mStr] = desde.split("-");
  let y = Number(yStr);
  let m = Number(mStr);
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    m += 1;
    if (m === 13) { m = 1; y += 1; }
    result.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return result;
}
