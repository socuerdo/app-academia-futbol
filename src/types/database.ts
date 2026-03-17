export type Rol = "superadmin" | "admin" | "profesor";

export interface Profile {
  id: string;
  club_id: string | null;
  rol: Rol;
  nombre_completo: string;
  categorias_asignadas: string[];
  permisos: string[];
  activo: boolean;
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
