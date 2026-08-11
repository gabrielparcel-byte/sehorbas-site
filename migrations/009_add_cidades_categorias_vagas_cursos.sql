-- Rode isso no SQL Editor do Supabase
-- Cria as tabelas de Base Territorial (cidades), Categorias Abrangidas,
-- Vagas de Emprego e Cursos com desconto

create table if not exists cidades (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    ordem int not null default 0,
    created_at timestamptz not null default now()
);

alter table cidades enable row level security;

create policy "cidades_select_public" on cidades for select using (true);

create policy "cidades_write_auth" on cidades for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create table if not exists categorias (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    icone text,
    ordem int not null default 0,
    created_at timestamptz not null default now()
);

alter table categorias enable row level security;

create policy "categorias_select_public" on categorias for select using (true);

create policy "categorias_write_auth" on categorias for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create table if not exists vagas (
    id uuid primary key default gen_random_uuid(),
    titulo text,
    imagem_url text not null,
    descricao text,
    created_at timestamptz not null default now()
);

alter table vagas enable row level security;

create policy "vagas_select_public" on vagas for select using (true);

create policy "vagas_write_auth" on vagas for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create table if not exists cursos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    instituicao text,
    descricao text not null,
    desconto text,
    link text,
    logo_url text,
    created_at timestamptz not null default now()
);

alter table cursos enable row level security;

create policy "cursos_select_public" on cursos for select using (true);

create policy "cursos_write_auth" on cursos for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- Categorias iniciais (exemplo — edite/adicione pela área admin)
insert into categorias (nome, icone, ordem) values
    ('Hotéis', '🏨', 1),
    ('Restaurantes', '🍽️', 2),
    ('Bares', '🍺', 3),
    ('Motéis', '🛏️', 4);

-- ============================================================
-- STORAGE — crie os buckets abaixo pelo painel (Storage > New bucket
-- > marque "Public bucket"), depois rode as políticas para liberar
-- upload a usuários autenticados.
--   - vagas-flyers
--   - cursos-logos
-- ============================================================
create policy "vagas_flyers_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'vagas-flyers')
    with check (bucket_id = 'vagas-flyers');

create policy "cursos_logos_write_auth" on storage.objects
    for all
    to authenticated
    using (bucket_id = 'cursos-logos')
    with check (bucket_id = 'cursos-logos');
