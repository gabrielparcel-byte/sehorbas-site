-- Rode isso no SQL Editor do Supabase
-- Remove a seção "Acordo Coletivo" (não usa mais) e cria "Comunicados"
-- (título + descrição + PDF), no mesmo formato de Convenções.

drop table if exists acordos;

create table if not exists comunicados (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    descricao text,
    arquivo_url text,
    created_at timestamptz not null default now()
);

alter table comunicados enable row level security;

create policy "comunicados_select_public" on comunicados for select using (true);

create policy "comunicados_write_auth" on comunicados for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE — crie o bucket "comunicados-arquivos" pelo painel
-- (Storage > New bucket > marque "Public bucket"), depois rode
-- a política abaixo para liberar upload a usuários autenticados.
-- Pode remover o bucket antigo "acordos-arquivos" se não precisar
-- mais dos arquivos que estavam lá.
-- ============================================================
create policy "comunicados_arquivos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'comunicados-arquivos')
    with check (bucket_id = 'comunicados-arquivos');
