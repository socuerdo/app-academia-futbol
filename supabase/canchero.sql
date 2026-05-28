-- =============================================================================
-- MIGRACIÓN: Módulo Canchero
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- =============================================================================

-- 1. Actualizar check constraint de roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check
  CHECK (rol = ANY (ARRAY['superadmin','admin','profesor','secretaria','canchero']));

-- 2. Tabla turnos de alquiler
CREATE TABLE IF NOT EXISTS public.turnos_alquiler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  hora text NOT NULL,
  cancha text NOT NULL,
  equipo1 text,
  equipo2 text,
  efectivo numeric(10,2),
  transferencia numeric(10,2),
  notas text,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabla turnos de escuela
CREATE TABLE IF NOT EXISTS public.turnos_escuela (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  hora text NOT NULL,
  cancha text NOT NULL,
  equipo_clase text,
  tipo text,
  profesor text,
  created_at timestamptz DEFAULT now()
);

-- 4. RLS turnos_alquiler
ALTER TABLE public.turnos_alquiler ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver_turnos_alquiler" ON public.turnos_alquiler FOR SELECT
  USING (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "gestionar_turnos_alquiler_insert" ON public.turnos_alquiler FOR INSERT
  WITH CHECK (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "gestionar_turnos_alquiler_update" ON public.turnos_alquiler FOR UPDATE
  USING (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "gestionar_turnos_alquiler_delete" ON public.turnos_alquiler FOR DELETE
  USING (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid()));

-- 5. RLS turnos_escuela
ALTER TABLE public.turnos_escuela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver_turnos_escuela" ON public.turnos_escuela FOR SELECT
  USING (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "gestionar_turnos_escuela_insert" ON public.turnos_escuela FOR INSERT
  WITH CHECK (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "gestionar_turnos_escuela_update" ON public.turnos_escuela FOR UPDATE
  USING (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "gestionar_turnos_escuela_delete" ON public.turnos_escuela FOR DELETE
  USING (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid()));
