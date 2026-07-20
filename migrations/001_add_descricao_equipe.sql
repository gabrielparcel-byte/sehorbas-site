-- Rode isso no SQL Editor do Supabase (banco já criado, só adiciona a coluna nova)
alter table equipe add column if not exists descricao text;
