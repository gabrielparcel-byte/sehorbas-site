-- Rode isso no SQL Editor do Supabase
-- Cria a seção "Somos Filiados" (entidades sindicais às quais o
-- SEHORBAS é filiado)

create table if not exists filiados (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    logo_url text,
    link text,
    ordem int not null default 0,
    created_at timestamptz not null default now()
);

alter table filiados enable row level security;

create policy "filiados_select_public" on filiados for select using (true);

create policy "filiados_write_auth" on filiados for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE — crie o bucket "filiados-logos" pelo painel (Storage >
-- New bucket > marque "Public bucket"), depois rode a política abaixo.
-- ============================================================
create policy "filiados_logos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'filiados-logos')
    with check (bucket_id = 'filiados-logos');
