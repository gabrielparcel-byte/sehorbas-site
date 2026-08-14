-- Rode isso no SQL Editor do Supabase
-- Configuração do banner de fundo do hero (imagem da cidade, opcional)

create table if not exists configuracoes_site (
    id smallint primary key default 1,
    hero_banner_url text,
    updated_at timestamptz not null default now(),
    constraint configuracoes_site_singleton check (id = 1)
);

insert into configuracoes_site (id) values (1) on conflict (id) do nothing;

alter table configuracoes_site enable row level security;

create policy "configuracoes_site_select_public" on configuracoes_site for select using (true);

create policy "configuracoes_site_write_auth" on configuracoes_site for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE — crie o bucket "banner-fundo" pelo painel (Storage > New
-- bucket > marque "Public bucket"), depois rode a política abaixo.
-- ============================================================
create policy "banner_fundo_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'banner-fundo')
    with check (bucket_id = 'banner-fundo');
