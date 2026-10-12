-- Evita que un usuario autenticado se cambie a si mismo el rol, club o permisos
-- (la politica profiles_update permite editar la propia fila y no tiene WITH CHECK).
--
-- Reglas:
--   * Sin usuario en sesion (service_role, SQL editor, scripts): se permite.
--   * superadmin: se permite todo.
--   * admin / auditor: se permite, salvo asignar rol superadmin, tocar un
--     superadmin o cambiar el club de alguien.
--   * Cualquier otro rol: solo puede cambiar nombre, telefono y foto.
--
-- Rollback: DROP TRIGGER profiles_proteger_campos ON public.profiles;
--           DROP FUNCTION public.profiles_proteger_campos();

CREATE OR REPLACE FUNCTION public.profiles_proteger_campos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_rol text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_rol := public.current_user_rol();

  IF v_rol = 'superadmin' THEN
    RETURN NEW;
  END IF;

  IF v_rol IN ('admin', 'auditor') THEN
    IF (NEW.rol = 'superadmin' AND OLD.rol IS DISTINCT FROM 'superadmin')
       OR OLD.rol = 'superadmin'
       OR NEW.club_id IS DISTINCT FROM OLD.club_id THEN
      RAISE EXCEPTION 'No tenes permiso para cambiar ese rol o club.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.rol IS DISTINCT FROM OLD.rol
     OR NEW.club_id IS DISTINCT FROM OLD.club_id
     OR NEW.permisos IS DISTINCT FROM OLD.permisos
     OR NEW.activo IS DISTINCT FROM OLD.activo
     OR NEW.categorias_asignadas IS DISTINCT FROM OLD.categorias_asignadas THEN
    RAISE EXCEPTION 'No tenes permiso para modificar esos campos del perfil.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_proteger_campos ON public.profiles;
CREATE TRIGGER profiles_proteger_campos
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_proteger_campos();
