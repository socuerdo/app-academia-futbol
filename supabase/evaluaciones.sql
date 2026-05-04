-- =============================================================================
-- MÓDULO: Evaluaciones
-- Ejecutar en SQL Editor de Supabase DESPUÉS del schema.sql principal.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLA: categorias
-- Catálogo de categorías por club. Los nombres deben coincidir con el campo
-- jugadores.categoria (text) para que el filtro del listado funcione.
-- -----------------------------------------------------------------------------
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  orden int NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, nombre)
);

-- -----------------------------------------------------------------------------
-- 2. TABLA: tipos_evaluacion
-- Ej: "Evaluación trimestral", "Evaluación mensual", etc.
-- -----------------------------------------------------------------------------
CREATE TABLE public.tipos_evaluacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  orden int NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. TABLA: evaluaciones
-- -----------------------------------------------------------------------------
CREATE TABLE public.evaluaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  jugador_id uuid NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
  tipo_evaluacion_id uuid NOT NULL REFERENCES public.tipos_evaluacion(id) ON DELETE RESTRICT,
  evaluador_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha date NOT NULL,
  temporada text,
  puntaje_fisico int NOT NULL CHECK (puntaje_fisico BETWEEN 1 AND 5),
  puntaje_tecnico int NOT NULL CHECK (puntaje_tecnico BETWEEN 1 AND 5),
  puntaje_tactico int NOT NULL CHECK (puntaje_tactico BETWEEN 1 AND 5),
  puntaje_social int NOT NULL CHECK (puntaje_social BETWEEN 1 AND 5),
  puntaje_emocional int NOT NULL CHECK (puntaje_emocional BETWEEN 1 AND 5),
  comentario_fisico text,
  comentario_tecnico text,
  comentario_tactico text,
  comentario_social text,
  comentario_emocional text,
  observaciones_generales text,
  puntaje_promedio numeric(3,2),
  token_publico text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. TRIGGER: calcular puntaje_promedio automáticamente
-- Se dispara en INSERT y UPDATE para no tener que enviarlo desde la app.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calcular_puntaje_promedio()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.puntaje_promedio := round(
    (NEW.puntaje_fisico + NEW.puntaje_tecnico + NEW.puntaje_tactico +
     NEW.puntaje_social + NEW.puntaje_emocional)::numeric / 5.0,
    2
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER evaluaciones_calcular_promedio
  BEFORE INSERT OR UPDATE ON public.evaluaciones
  FOR EACH ROW EXECUTE FUNCTION public.calcular_puntaje_promedio();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

-- ----- categorias -----
CREATE POLICY "categorias_select"
  ON public.categorias FOR SELECT
  USING (
    current_user_rol() = 'superadmin'
    OR club_id = current_user_club_id()
  );

CREATE POLICY "categorias_insert"
  ON public.categorias FOR INSERT
  WITH CHECK (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

CREATE POLICY "categorias_update"
  ON public.categorias FOR UPDATE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

CREATE POLICY "categorias_delete"
  ON public.categorias FOR DELETE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

-- ----- tipos_evaluacion -----
CREATE POLICY "tipos_evaluacion_select"
  ON public.tipos_evaluacion FOR SELECT
  USING (
    current_user_rol() = 'superadmin'
    OR club_id = current_user_club_id()
  );

CREATE POLICY "tipos_evaluacion_insert"
  ON public.tipos_evaluacion FOR INSERT
  WITH CHECK (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

CREATE POLICY "tipos_evaluacion_update"
  ON public.tipos_evaluacion FOR UPDATE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

CREATE POLICY "tipos_evaluacion_delete"
  ON public.tipos_evaluacion FOR DELETE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

-- ----- evaluaciones -----
CREATE POLICY "evaluaciones_select"
  ON public.evaluaciones FOR SELECT
  USING (
    current_user_rol() = 'superadmin'
    OR club_id = current_user_club_id()
  );

CREATE POLICY "evaluaciones_insert"
  ON public.evaluaciones FOR INSERT
  WITH CHECK (
    current_user_rol() = 'superadmin'
    OR (
      current_user_rol() IN ('admin', 'profesor')
      AND club_id = current_user_club_id()
      AND evaluador_id = auth.uid()
    )
  );

CREATE POLICY "evaluaciones_update"
  ON public.evaluaciones FOR UPDATE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
    OR (
      current_user_rol() = 'profesor'
      AND club_id = current_user_club_id()
      AND evaluador_id = auth.uid()
    )
  );

CREATE POLICY "evaluaciones_delete"
  ON public.evaluaciones FOR DELETE
  USING (
    current_user_rol() = 'superadmin'
    OR (current_user_rol() = 'admin' AND club_id = current_user_club_id())
  );

-- -----------------------------------------------------------------------------
-- 6. ÍNDICES
-- -----------------------------------------------------------------------------
CREATE INDEX idx_categorias_club_id ON public.categorias(club_id);
CREATE INDEX idx_tipos_evaluacion_club_id ON public.tipos_evaluacion(club_id);
CREATE INDEX idx_evaluaciones_club_id ON public.evaluaciones(club_id);
CREATE INDEX idx_evaluaciones_jugador_id ON public.evaluaciones(jugador_id);
CREATE INDEX idx_evaluaciones_tipo_id ON public.evaluaciones(tipo_evaluacion_id);
CREATE INDEX idx_evaluaciones_evaluador_id ON public.evaluaciones(evaluador_id);
CREATE INDEX idx_evaluaciones_fecha ON public.evaluaciones(fecha);
CREATE INDEX idx_evaluaciones_club_jugador ON public.evaluaciones(club_id, jugador_id);

-- -----------------------------------------------------------------------------
-- NOTAS POST-EJECUCIÓN
-- -----------------------------------------------------------------------------
-- Las categorías las gestiona cada club desde la app.
--
-- Los tipos de evaluación también se gestionan desde la app (pendiente de UI).
-- Si se necesita cargar datos iniciales manualmente:
--
--    INSERT INTO public.tipos_evaluacion (club_id, nombre, orden)
--    VALUES
--      ('<club-id>', 'Evaluación trimestral', 1),
--      ('<club-id>', 'Evaluación mensual', 2);
-- =============================================================================
