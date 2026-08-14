-- Rode isso no SQL Editor do Supabase
-- Adiciona descrição às categorias (lista detalhada, expansível no
-- site) e limpa qualquer categoria cadastrada errada até agora.

alter table categorias add column if not exists descricao text;

-- Limpa o que estiver cadastrado (inclusive a categoria com o texto
-- inteiro colado de uma vez) — a próxima migration (017) recadastra
-- tudo organizado.
delete from categorias;
