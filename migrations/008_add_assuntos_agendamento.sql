-- Rode isso no SQL Editor do Supabase
-- Cria a tabela de Assuntos para o Pré-Agendamento

create table if not exists assuntos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    ordem int not null default 0,
    ativo boolean not null default true,
    created_at timestamptz not null default now()
);

alter table assuntos enable row level security;

create policy "assuntos_select_public" on assuntos for select using (true);

create policy "assuntos_write_auth" on assuntos for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- Insere os assuntos padrão que já existiam no site
insert into assuntos (nome, ordem) values
    ('Convenção Coletiva', 1),
    ('Direitos Trabalhistas', 2),
    ('Convênios', 3),
    ('Homologação', 4),
    ('Assistência Jurídica', 5),
    ('Outros', 99);
