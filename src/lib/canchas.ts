export const CANCHAS = [
  { id: "C1", label: "C1", tipo: "Fútbol 11" },
  { id: "C2", label: "C2", tipo: "Fútbol 11" },
  { id: "C3", label: "C3", tipo: "Fútbol 11" },
  { id: "C4", label: "C4", tipo: "Fútbol 11" },
  { id: "C5", label: "C5", tipo: "Fútbol 11" },
  { id: "C6", label: "C6", tipo: "Fútbol 11" },
  { id: "C7", label: "C7", tipo: "Fútbol 11" },
  { id: "C8", label: "C8", tipo: "Fútbol 7" },
  { id: "C9", label: "C9", tipo: "Fútbol 7" },
] as const;

export const HORARIOS_ALQUILER = [
  "08:00","09:00","10:00","11:00","12:00","13:00","14:00",
  "15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00",
] as const;

export const HORARIOS_ESCUELA = [
  "15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00",
] as const;

export type TurnoAlquiler = {
  id: string;
  club_id: string;
  fecha: string;
  hora: string;
  cancha: string;
  equipo1: string | null;
  equipo2: string | null;
  efectivo: number | null;
  transferencia: number | null;
  notas: string | null;
  estado: "pendiente" | "parcial" | "pagado";
  created_at: string;
};

export type TurnoEscuela = {
  id: string;
  club_id: string;
  fecha: string;
  hora: string;
  cancha: string;
  equipo_clase: string | null;
  tipo: string | null;
  profesor: string | null;
  created_at: string;
};
