-- Hardening menor (avisos del linter de Supabase). Aplicado como migracion
-- "hardening_funciones_e_indices".
--
-- Rollback de permisos:
--   GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC;
--   GRANT EXECUTE ON FUNCTION public.current_user_rol(), public.current_user_club_id() TO PUBLIC;

-- handle_new_user es una funcion de trigger: no necesita EXECUTE para dispararse
-- y no debe ser invocable por /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Las politicas RLS usan estas funciones: se conserva authenticated y service_role.
REVOKE EXECUTE ON FUNCTION public.current_user_rol() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_club_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_rol() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_club_id() TO authenticated, service_role;

-- search_path fijo en funciones de trigger.
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.cuotas_set_updated_at() SET search_path = public;

-- Indices en claves foraneas sin cobertura.
CREATE INDEX IF NOT EXISTS idx_asistencias_registrado_por ON public.asistencias (registrado_por);
CREATE INDEX IF NOT EXISTS idx_cuotas_registrado_por ON public.cuotas (registrado_por);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_evaluador_id ON public.evaluaciones (evaluador_id);
CREATE INDEX IF NOT EXISTS idx_turnos_alquiler_club_id ON public.turnos_alquiler (club_id);
CREATE INDEX IF NOT EXISTS idx_turnos_escuela_club_id ON public.turnos_escuela (club_id);
