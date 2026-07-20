-- Rode isso no SQL Editor do Supabase
-- Permite que usuários autenticados (admin logado) enviem, atualizem e
-- removam arquivos nos buckets de convênios e convenções. A leitura
-- pública já funciona por os buckets estarem marcados como "Public".

create policy "convenios_logos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'convenios-logos')
    with check (bucket_id = 'convenios-logos');

create policy "convencoes_arquivos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'convencoes-arquivos')
    with check (bucket_id = 'convencoes-arquivos');
