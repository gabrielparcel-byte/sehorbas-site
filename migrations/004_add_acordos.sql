-- Rode isso no SQL Editor do Supabase
-- Cria a tabela de Acordos Coletivos (mesmo padrão da Convenção)

create table if not exists acordos (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    descricao text,
    arquivo_url text,
    created_at timestamptz not null default now()
);

alter table acordos enable row level security;

create policy "acordos_select_public" on acordos for select using (true);

create policy "acordos_write_auth" on acordos for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE — crie o bucket "acordos-arquivos" pelo painel
-- (Storage > New bucket > marque "Public bucket"), depois rode
-- as políticas abaixo para liberar upload a usuários autenticados.
-- ============================================================
create policy "acordos_arquivos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'acordos-arquivos')
    with check (bucket_id = 'acordos-arquivos');
