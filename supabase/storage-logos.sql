-- Bucket y políticas para logos de clubes.
-- Ver instrucciones completas en supabase/STORAGE.md
-- Ejecutar mejor todo el archivo supabase/storage.sql (incluye logos + jugadores).
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;
