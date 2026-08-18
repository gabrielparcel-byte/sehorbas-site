-- Rode isso no SQL Editor do Supabase
-- Cria a tabela de sócios cadastrados (para gerar a Carteirinha de
-- Associado). Diferente das outras tabelas do site, essa NÃO tem
-- select público — guarda CPF, então só o admin autenticado pode
-- ler/escrever.

create table if not exists socios (
    id uuid primary key default gen_random_uuid(),
    numero serial,
    nome text not null,
    cpf text not null,
    cargo_empresa text not null,
    validade text not null, -- formato 'MM/AAAA'
    foto_url text,
    created_at timestamptz not null default now()
);

alter table socios enable row level security;

create policy "socios_all_auth" on socios for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE — crie o bucket "socios-fotos" pelo painel (Storage >
-- New bucket > marque "Public bucket"), depois rode a política abaixo.
-- ============================================================
create policy "socios_fotos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'socios-fotos')
    with check (bucket_id = 'socios-fotos');
