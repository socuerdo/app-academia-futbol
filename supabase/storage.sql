-- =============================================================================
-- SUPABASE STORAGE — Buckets y políticas
-- =============================================================================
-- INSTRUCCIONES:
-- 1. En el Dashboard de Supabase: Project Settings → Storage (o ejecutar este SQL en el SQL Editor).
-- 2. Crear los dos buckets si no existen (el script siguiente los crea vía SQL).
-- 3. Ejecutar todo este archivo en el SQL Editor del proyecto.
--
-- BUCKETS:
-- - logos (público): logos de clubes. Rutas: {club_id}/logo.{ext}
-- - jugadores (público): fotos de perfil de jugadores. Rutas: {club_id}/{jugador_id}.{ext}
--
-- POLÍTICAS:
-- - Lectura: pública para ambos buckets (cualquiera puede ver las URLs públicas).
-- - Escritura: solo usuarios autenticados del mismo club (o superadmin).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREAR BUCKETS (públicos)
-- Opcional en Dashboard: limitar tamaño (ej. 5MB) y MIME (image/jpeg, image/png, etc.).
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('logos', 'logos', true),
  ('jugadores', 'jugadores', true)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public;

-- -----------------------------------------------------------------------------
-- 2. POLÍTICAS — Lectura pública
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_logos_select_public" ON storage.objects;
CREATE POLICY "storage_logos_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "storage_jugadores_select_public" ON storage.objects;
CREATE POLICY "storage_jugadores_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'jugadores');

-- -----------------------------------------------------------------------------
-- 3. POLÍTICAS — Escritura solo usuarios del mismo club (o superadmin)
-- La primera carpeta del path debe coincidir con el club_id del usuario.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_logos_insert_same_club" ON storage.objects;
CREATE POLICY "storage_logos_insert_same_club"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = (SELECT public.current_user_club_id()::text)
      OR (SELECT public.current_user_rol()) = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "storage_logos_update_same_club" ON storage.objects;
CREATE POLICY "storage_logos_update_same_club"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = (SELECT public.current_user_club_id()::text)
      OR (SELECT public.current_user_rol()) = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "storage_logos_delete_same_club" ON storage.objects;
CREATE POLICY "storage_logos_delete_same_club"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = (SELECT public.current_user_club_id()::text)
      OR (SELECT public.current_user_rol()) = 'superadmin'
    )
  );

-- Jugadores
DROP POLICY IF EXISTS "storage_jugadores_insert_same_club" ON storage.objects;
CREATE POLICY "storage_jugadores_insert_same_club"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'jugadores'
    AND (
      (storage.foldername(name))[1] = (SELECT public.current_user_club_id()::text)
      OR (SELECT public.current_user_rol()) = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "storage_jugadores_update_same_club" ON storage.objects;
CREATE POLICY "storage_jugadores_update_same_club"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'jugadores'
    AND (
      (storage.foldername(name))[1] = (SELECT public.current_user_club_id()::text)
      OR (SELECT public.current_user_rol()) = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "storage_jugadores_delete_same_club" ON storage.objects;
CREATE POLICY "storage_jugadores_delete_same_club"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'jugadores'
    AND (
      (storage.foldername(name))[1] = (SELECT public.current_user_club_id()::text)
      OR (SELECT public.current_user_rol()) = 'superadmin'
    )
  );
