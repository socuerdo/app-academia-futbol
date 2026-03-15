# Configuración de Supabase Storage

## Buckets

Crear dos buckets **públicos** en Supabase:

| Bucket      | Uso                    | Ejemplo de path        |
|------------|-------------------------|------------------------|
| `logos`    | Logos de clubes         | `{club_id}/logo.jpg`   |
| `jugadores`| Fotos de perfil de jugadores | `{club_id}/{jugador_id}.jpg` |

## Cómo crear los buckets y políticas

**Opción recomendada:** ejecutar el archivo SQL en el SQL Editor del proyecto:

1. En Supabase Dashboard → **SQL Editor** → New query.
2. Copiar y pegar el contenido de `storage.sql`.
3. Run.

Eso crea (o actualiza) los buckets `logos` y `jugadores` y aplica todas las políticas.

**Opción manual (solo buckets):**

1. En Supabase Dashboard → **Storage** → New bucket.
2. Crear bucket **logos**: nombre `logos`, **Public bucket** = ON.
3. Crear bucket **jugadores**: nombre `jugadores`, **Public bucket** = ON.
4. Las políticas de escritura hay que definirlas igualmente (mejor usar `storage.sql`).

## Políticas

- **Lectura:** pública en ambos buckets (cualquiera puede ver las URLs públicas).
- **Escritura (INSERT/UPDATE/DELETE):** solo usuarios autenticados que pertenezcan al mismo club:
  - La primera carpeta del path debe ser el `club_id` del usuario.
  - El superadmin puede escribir en cualquier carpeta.

En la app, los uploads usan `supabase.storage.from('bucket').upload(path, file)` y se guarda la URL pública (`getPublicUrl(path)`) en la base de datos (`clubs.logo_url`, `jugadores.foto_url`).
