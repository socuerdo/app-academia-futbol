-- Bucket para fotos de jugadores.
-- Ver instrucciones completas en supabase/STORAGE.md
-- Ejecutar mejor todo el archivo supabase/storage.sql (incluye logos + jugadores).
insert into storage.buckets (id, name, public)
values ('jugadores', 'jugadores', true)
on conflict (id) do nothing;
