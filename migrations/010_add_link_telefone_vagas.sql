-- Rode isso no SQL Editor do Supabase
-- Adiciona link e telefone de contato às Vagas de Emprego

alter table vagas add column if not exists link text;
alter table vagas add column if not exists telefone text;
