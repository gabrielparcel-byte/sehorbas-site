-- Rode isso no SQL Editor do Supabase
-- Cria a tabela de Modelos de Acordo

create table if not exists modelos_acordo (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    descricao text,
    arquivo_url text,
    created_at timestamptz not null default now()
);

alter table modelos_acordo enable row level security;

create policy "modelos_acordo_select_public" on modelos_acordo for select using (true);

create policy "modelos_acordo_write_auth" on modelos_acordo for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE — crie o bucket "modelos-acordo-arquivos" pelo painel
-- (Storage > New bucket > marque "Public bucket"), depois rode
-- a política abaixo para liberar upload a usuários autenticados.
-- ============================================================
create policy "modelos_acordo_arquivos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'modelos-acordo-arquivos')
    with check (bucket_id = 'modelos-acordo-arquivos');
