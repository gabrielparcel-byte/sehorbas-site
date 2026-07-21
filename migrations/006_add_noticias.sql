-- Rode isso no SQL Editor do Supabase
-- Cria a tabela de Notícias (posts do Instagram exibidos no site)

create table if not exists noticias (
    id uuid primary key default gen_random_uuid(),
    link text not null,
    titulo text,
    created_at timestamptz not null default now()
);

alter table noticias enable row level security;

create policy "noticias_select_public" on noticias for select using (true);

create policy "noticias_write_auth" on noticias for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
