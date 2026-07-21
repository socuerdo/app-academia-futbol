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

/** Devuelve los días hasta el próximo cumpleaños (0 = hoy, -1 = ya pasó este año) */
export function diasHastaCumpleanios(fechaNacimiento: string, hoy: Date = new Date()): number {
  const parts = fechaNacimiento.split("-");
  if (parts.length < 3) return -1;
  const mes = Number(parts[1]);
  const dia = Number(parts[2]);
  const cumple = new Date(hoy.getFullYear(), mes - 1, dia);
  if (cumple < hoy) cumple.setFullYear(hoy.getFullYear() + 1);
  return Math.round((cumple.getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 86400000);
}
