-- ============================================================
-- SEHORBAS — Schema do banco (Supabase / Postgres)
-- Rode este script inteiro no SQL Editor do painel Supabase
-- (Project > SQL Editor > New query > cole tudo > Run)
-- ============================================================

-- CONVÊNIOS E PARCERIAS
create table if not exists convenios (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    endereco text,
    telefone text,
    descricao text not null,
    logo_url text,
    site_url text,
    created_at timestamptz not null default now()
);

-- CONVENÇÕES COLETIVAS
create table if not exists convencoes (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    descricao text,
    arquivo_url text,
    created_at timestamptz not null default now()
);

-- ACORDOS COLETIVOS
create table if not exists acordos (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    descricao text,
    arquivo_url text,
    created_at timestamptz not null default now()
);

-- MODELOS DE ACORDO (documentos editáveis para download)
create table if not exists modelos_acordo (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    descricao text,
    arquivo_url text,
    created_at timestamptz not null default now()
);

-- NOTÍCIAS (posts do Instagram exibidos como portal de notícias)
create table if not exists noticias (
    id uuid primary key default gen_random_uuid(),
    link text not null,
    titulo text,
    created_at timestamptz not null default now()
);

-- EQUIPE / FUNCIONÁRIOS
create table if not exists equipe (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    cargo text not null,
    descricao text,
    foto_url text,
    ordem int not null default 0,
    created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Leitura pública (qualquer visitante do site vê os dados),
-- escrita só para usuários autenticados (admin logado)
-- ============================================================

alter table convenios enable row level security;
alter table convencoes enable row level security;
alter table acordos enable row level security;
alter table modelos_acordo enable row level security;
alter table noticias enable row level security;
alter table equipe enable row level security;

-- Leitura pública
create policy "convenios_select_public" on convenios for select using (true);
create policy "convencoes_select_public" on convencoes for select using (true);
create policy "acordos_select_public" on acordos for select using (true);
create policy "modelos_acordo_select_public" on modelos_acordo for select using (true);
create policy "noticias_select_public" on noticias for select using (true);
create policy "equipe_select_public" on equipe for select using (true);

-- Escrita (insert/update/delete) só para autenticados
create policy "convenios_write_auth" on convenios for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create policy "convencoes_write_auth" on convencoes for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create policy "acordos_write_auth" on acordos for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create policy "modelos_acordo_write_auth" on modelos_acordo for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create policy "noticias_write_auth" on noticias for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create policy "equipe_write_auth" on equipe for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ============================================================
-- DADOS INICIAIS (equipe atual do cartão)
-- ============================================================
insert into equipe (nome, cargo, ordem) values
    ('João Candido Nogueira', 'Presidente', 1),
    ('Antonio Roberto Ghion', 'Tesoureiro', 2)
on conflict do nothing;

-- ============================================================
-- STORAGE — bucket para logos de convênios e PDFs de convenção
-- Rode isso depois de criar os buckets pelo painel (Storage > New bucket)
-- Nomes sugeridos: "convenios-logos" (público) e "convencoes-arquivos" (público)
-- Marque "Public bucket" ao criar para que as imagens/PDFs carreguem no site.
-- ============================================================
