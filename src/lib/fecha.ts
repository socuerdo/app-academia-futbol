const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const TIMEZONE_CLUB = "America/Argentina/Buenos_Aires";

/**
 * Fecha de "hoy" en la zona horaria del club (YYYY-MM-DD), no en UTC.
 * `new Date().toISOString()` usa UTC: en Argentina (UTC-3), entre las 21:00
 * y las 23:59 ya es "mañana" en UTC, lo que bloqueaba de noche la carga de
 * asistencias/cuotas del día en curso al compararla como fecha pasada.
 */
export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE_CLUB }).format(new Date());
}

export function formatFecha(date: string | null | undefined): string {
  if (!date) return "-";
  const parts = date.split("-");
  if (parts.length < 3) return date;
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return date;
  return `${day} de ${MESES[month - 1]} de ${year}`;
}

/**
 * Días a la ocurrencia más cercana del cumpleaños (0 = hoy, negativo = ya
 * pasó hace esa cantidad de días, positivo = falta esa cantidad de días).
 * Compara contra el cumple del año pasado, este año y el que viene, y se
 * queda con el más cercano a "hoy" para que un cumple de fin de diciembre
 * siga contando como "reciente" a principios de enero.
 */
export function diasHastaCumpleanios(fechaNacimiento: string, hoy: Date = new Date()): number {
  const parts = fechaNacimiento.split("-");
  if (parts.length < 3) return Infinity;
  const mes = Number(parts[1]);
  const dia = Number(parts[2]);
  const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diffs = [-1, 0, 1].map((offset) => {
    const cumple = new Date(hoy.getFullYear() + offset, mes - 1, dia);
    return Math.round((cumple.getTime() - hoyMidnight.getTime()) / 86400000);
  });
  return diffs.reduce((mejor, d) => (Math.abs(d) < Math.abs(mejor) ? d : mejor));
}
