-- Rode isso no SQL Editor do Supabase
alter table equipe add column if not exists foto_url text;

-- Depois crie o bucket "equipe-fotos" pelo painel (Storage > New bucket,
-- marque "Public bucket"), e rode a política abaixo para liberar upload.
create policy "equipe_fotos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'equipe-fotos')
    with check (bucket_id = 'equipe-fotos');
