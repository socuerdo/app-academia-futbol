-- =============================================================================
-- SCHEMA COMPLETO - Sistema de Gestión de Asistencias (Escuelas de Fútbol)
-- Multi-tenant con RLS por club_id. Ejecutar en SQL Editor de Supabase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLA: clubs
-- -----------------------------------------------------------------------------
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  logo_url text,
  color_primario text NOT NULL DEFAULT '#c0392b',
  color_sidebar text NOT NULL DEFAULT '#2c3e50',
  iniciales text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. TABLA: profiles (extiende auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  rol text NOT NULL CHECK (rol IN ('superadmin', 'admin', 'profesor')),
  nombre_completo text NOT NULL DEFAULT '',
  categorias_asignadas text[] NOT NULL DEFAULT '{}',
  permisos text[] NOT NULL DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.profiles.club_id IS 'NULL solo para superadmin';

-- -----------------------------------------------------------------------------
-- 3. TABLA: sedes
-- -----------------------------------------------------------------------------
CREATE TABLE public.sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  direccion text,
  ciudad text,
  telefono text,
  activo boolean NOT NULL DEFAULT true
);

-- -----------------------------------------------------------------------------
-- 4. TABLA: jugadores
-- -----------------------------------------------------------------------------
CREATE TABLE public.jugadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  sede_id uuid NOT NULL REFERENCES public.sedes(id) ON DELETE RESTRICT,
  dni text NOT NULL,
  apellido text NOT NULL,
  nombre text NOT NULL,
  sexo text NOT NULL,
  categoria text NOT NULL,
  numero_camiseta int,
  fecha_nacimiento date,
  numero_carnet text,
  fecha_vencimiento_carnet date,
  foto_url text,
  telefono text,
  fecha_inscripcion date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, dni)
);

-- -----------------------------------------------------------------------------
-- 5. TABLA: asistencias
-- -----------------------------------------------------------------------------
CREATE TABLE public.asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  jugador_id uuid NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  presente boolean NOT NULL,
  observacion text,
  registrado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(jugador_id, fecha)
);

-- -----------------------------------------------------------------------------
-- 6. FUNCIONES AUXILIARES PARA RLS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_club_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT club_id FROM public.profiles WHERE id = auth.uid() AND activo = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_rol()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid() AND activo = true LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- ----- clubs -----
CREATE POLICY "clubs_select"
  ON public.clubs FOR SELECT
  USING (
    current_user_rol() = 'superadmin'
    OR id = current_user_club_id()
  );

CREATE POLICY "clubs_insert"
  ON public.clubs FOR INSERT
  WITH CHECK (current_user_rol() = 'superadmin');

CREATE POLICY "clubs_update"
  ON public.clubs FOR UPDATE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND id = current_user_club_id())
  );

CREATE POLICY "clubs_delete"
  ON public.clubs FOR DELETE
  USING (current_user_rol() = 'superadmin');

-- ----- profiles -----
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  USING (current_user_rol() = 'superadmin');

-- ----- sedes -----
CREATE POLICY "sedes_select"
  ON public.sedes FOR SELECT
  USING (
    current_user_rol() = 'superadmin'
    OR club_id = current_user_club_id()
  );

CREATE POLICY "sedes_insert"
  ON public.sedes FOR INSERT
  WITH CHECK (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() IN ('admin', 'profesor') AND club_id = current_user_club_id())
  );

CREATE POLICY "sedes_update"
  ON public.sedes FOR UPDATE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() IN ('admin', 'profesor') AND club_id = current_user_club_id())
  );

CREATE POLICY "sedes_delete"
  ON public.sedes FOR DELETE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

-- ----- jugadores -----
CREATE POLICY "jugadores_select"
  ON public.jugadores FOR SELECT
  USING (
    current_user_rol() = 'superadmin'
    OR club_id = current_user_club_id()
  );

CREATE POLICY "jugadores_insert"
  ON public.jugadores FOR INSERT
  WITH CHECK (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
    OR (current_user_rol() = 'profesor' AND club_id = current_user_club_id())
  );

CREATE POLICY "jugadores_update"
  ON public.jugadores FOR UPDATE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
    OR (current_user_rol() = 'profesor' AND club_id = current_user_club_id())
  );

CREATE POLICY "jugadores_delete"
  ON public.jugadores FOR DELETE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

-- ----- asistencias -----
CREATE POLICY "asistencias_select"
  ON public.asistencias FOR SELECT
  USING (
    current_user_rol() = 'superadmin'
    OR club_id = current_user_club_id()
  );

CREATE POLICY "asistencias_insert"
  ON public.asistencias FOR INSERT
  WITH CHECK (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() IN ('admin', 'profesor') AND club_id = current_user_club_id() AND registrado_por = auth.uid())
  );

CREATE POLICY "asistencias_update"
  ON public.asistencias FOR UPDATE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() IN ('admin', 'profesor') AND club_id = current_user_club_id())
  );

CREATE POLICY "asistencias_delete"
  ON public.asistencias FOR DELETE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

-- -----------------------------------------------------------------------------
-- 8. TRIGGER: crear profile al registrar usuario en auth.users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, rol, nombre_completo)
  VALUES (
    NEW.id,
    'admin',
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 9. ÍNDICES
-- -----------------------------------------------------------------------------
CREATE INDEX idx_profiles_club_id ON public.profiles(club_id);
CREATE INDEX idx_profiles_rol ON public.profiles(rol);

CREATE INDEX idx_sedes_club_id ON public.sedes(club_id);

CREATE INDEX idx_jugadores_club_id ON public.jugadores(club_id);
CREATE INDEX idx_jugadores_sede_id ON public.jugadores(sede_id);
CREATE INDEX idx_jugadores_categoria ON public.jugadores(club_id, categoria);

CREATE INDEX idx_asistencias_club_id ON public.asistencias(club_id);
CREATE INDEX idx_asistencias_jugador_id ON public.asistencias(jugador_id);
CREATE INDEX idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX idx_asistencias_club_fecha ON public.asistencias(club_id, fecha);

-- -----------------------------------------------------------------------------
-- NOTAS POST-EJECUCIÓN
-- -----------------------------------------------------------------------------
-- 1. Primer usuario (superadmin): después del primer signup, ejecutá por ejemplo:
--    UPDATE public.profiles SET rol = 'superadmin' WHERE id = '<tu-user-id>';
-- 2. Profesores creados con Admin API: el trigger crea el profile con rol 'admin'.
--    La app debe actualizar ese profile a rol = 'profesor', club_id y categorias_asignadas.
-- 3. Restricción por categoría para profesores: RLS permite al profesor cualquier
--    jugador/asistencia de su club; filtrar por categorias_asignadas en la app.
-- -----------------------------------------------------------------------------
-- FIN DEL SCHEMA
-- -----------------------------------------------------------------------------
