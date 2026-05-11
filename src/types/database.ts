export type Rol = "superadmin" | "admin" | "profesor" | "secretaria";

export type EstadoCuota = "pagado" | "pendiente";

export interface Cuota {
  id: string;
  club_id: string;
  jugador_id: string;
  periodo: string; // formato YYYY-MM
  estado: EstadoCuota;
  fecha_pago: string | null;
  monto: number | null;
  observacion: string | null;
  registrado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  club_id: string | null;
  rol: Rol;
  nombre_completo: string;
  categorias_asignadas: string[];
  permisos: string[];
  activo: boolean;
  foto_url: string | null;
  telefono: string | null;
  created_at: string;
}

export interface Club {
  id: string;
  nombre: string;
  logo_url: string | null;
  color_primario: string;
  color_sidebar: string;
  iniciales: string;
  activo: boolean;
  created_at: string;
}

export interface Sede {
  id: string;
  club_id: string;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  activo: boolean;
}

export interface Jugador {
  id: string;
  club_id: string;
  sede_id: string;
  dni: string;
  apellido: string;
  nombre: string;
  sexo: string;
  categoria: string;
  numero_camiseta: number | null;
  fecha_nacimiento: string | null;
  fecha_inscripcion: string | null;
  telefono: string | null;
  numero_carnet: string | null;
  fecha_vencimiento_carnet: string | null;
  foto_url: string | null;
  activo: boolean;
  created_at: string;
  sede?: { nombre: string } | null;
}

export interface Asistencia {
  id: string;
  club_id: string;
  jugador_id: string;
  fecha: string;
  presente: boolean;
  observacion: string | null;
  registrado_por: string;
  created_at: string;
}

export type Categoria = {
  id: string;
  club_id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  created_at: string;
};

export type Evaluacion = {
  id: string;
  club_id: string;
  jugador_id: string;
  tipo_evaluacion_id: string;
  evaluador_id: string | null;
  fecha: string;
  temporada: string | null;
  puntaje_fisico: number | null;
  puntaje_tecnico: number | null;
  puntaje_tactico: number | null;
  puntaje_social: number | null;
  puntaje_emocional: number | null;
  comentario_fisico: string | null;
  comentario_tecnico: string | null;
  comentario_tactico: string | null;
  comentario_social: string | null;
  comentario_emocional: string | null;
  observaciones_generales: string | null;
  puntaje_promedio: number | null;
  token_publico: string;
  created_at: string;
  updated_at: string;
};

export type TipoEvaluacion = {
  id: string;
  club_id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
};
