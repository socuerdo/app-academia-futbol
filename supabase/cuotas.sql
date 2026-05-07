-- =============================================================================
-- Rol secretaria + tabla de cuotas (cobros mensuales)
-- =============================================================================
-- INSTRUCCIONES:
-- Ejecutar este archivo en el SQL Editor del proyecto Supabase.
-- =============================================================================

-- 1. Agregar 'secretaria' al CHECK de rol en profiles ------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rol_check
  CHECK (rol IN ('superadmin', 'admin', 'profesor', 'secretaria'));

-- 2. Tabla cuotas ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cuotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  jugador_id uuid NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
  periodo text NOT NULL CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pagado', 'pendiente')),
  fecha_pago timestamptz,
  monto numeric(12, 2),
  observacion text,
  registrado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, jugador_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_cuotas_club_periodo
  ON public.cuotas(club_id, periodo);
CREATE INDEX IF NOT EXISTS idx_cuotas_jugador
  ON public.cuotas(jugador_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado
  ON public.cuotas(club_id, estado);

-- Trigger para mantener updated_at -------------------------------------------
CREATE OR REPLACE FUNCTION public.cuotas_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cuotas_updated_at_trigger ON public.cuotas;
CREATE TRIGGER cuotas_updated_at_trigger
  BEFORE UPDATE ON public.cuotas
  FOR EACH ROW EXECUTE FUNCTION public.cuotas_set_updated_at();

-- 3. RLS ---------------------------------------------------------------------
ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cuotas_select" ON public.cuotas;
CREATE POLICY "cuotas_select"
  ON public.cuotas FOR SELECT
  USING (
    public.current_user_rol() = 'superadmin'
    OR club_id = public.current_user_club_id()
  );

DROP POLICY IF EXISTS "cuotas_insert" ON public.cuotas;
CREATE POLICY "cuotas_insert"
  ON public.cuotas FOR INSERT
  WITH CHECK (
    public.current_user_rol() = 'superadmin'
    OR (
      public.current_user_rol() IN ('admin', 'secretaria')
      AND club_id = public.current_user_club_id()
    )
  );

DROP POLICY IF EXISTS "cuotas_update" ON public.cuotas;
CREATE POLICY "cuotas_update"
  ON public.cuotas FOR UPDATE
  USING (
    public.current_user_rol() = 'superadmin'
    OR (
      public.current_user_rol() IN ('admin', 'secretaria')
      AND club_id = public.current_user_club_id()
    )
  );

DROP POLICY IF EXISTS "cuotas_delete" ON public.cuotas;
CREATE POLICY "cuotas_delete"
  ON public.cuotas FOR DELETE
  USING (
    public.current_user_rol() = 'superadmin'
    OR (public.current_user_rol() = 'admin' AND club_id = public.current_user_club_id())
  );
