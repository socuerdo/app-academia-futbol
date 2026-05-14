-- Tabla de auditoría/historial de acciones
-- Migración aplicada: 2026-05-14

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nombre text,
  accion text NOT NULL,   -- crear | editar | eliminar | importar | activar | desactivar | asignar_categoria | guardar_asistencias
  entidad text NOT NULL,  -- jugador | asistencia | evaluacion | cuota | importacion
  entidad_id uuid,
  entidad_descripcion text,
  cambios jsonb,          -- { campo: { anterior: x, nuevo: y }, ... }
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_club_created_idx ON public.audit_log(club_id, created_at DESC);
CREATE INDEX audit_log_usuario_idx ON public.audit_log(usuario_id);
CREATE INDEX audit_log_entidad_idx ON public.audit_log(entidad);
CREATE INDEX audit_log_accion_idx ON public.audit_log(accion);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins y superadmins pueden leer el historial de su club
CREATE POLICY "admins_read_audit_log"
  ON public.audit_log FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')
    )
  );

-- Cualquier miembro del club puede insertar registros de sus propias acciones
CREATE POLICY "members_insert_audit_log"
  ON public.audit_log FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );
