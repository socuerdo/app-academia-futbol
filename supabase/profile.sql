-- =============================================================================
-- Perfil de usuario — campos extra y bucket de avatars
-- =============================================================================
-- INSTRUCCIONES:
-- Ejecutar este archivo en el SQL Editor del proyecto Supabase.
-- =============================================================================

-- 1. Columnas nuevas en profiles ---------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS telefono text;

-- 2. Bucket público para avatars ---------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 3. Políticas del bucket -----------------------------------------------------
-- Lectura pública (la URL del avatar se muestra en la app).
DROP POLICY IF EXISTS "storage_avatars_select_public" ON storage.objects;
CREATE POLICY "storage_avatars_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Escritura: solo el propio usuario en su carpeta {user_id}/...
DROP POLICY IF EXISTS "storage_avatars_insert_own" ON storage.objects;
CREATE POLICY "storage_avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_avatars_update_own" ON storage.objects;
CREATE POLICY "storage_avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_avatars_delete_own" ON storage.objects;
CREATE POLICY "storage_avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
