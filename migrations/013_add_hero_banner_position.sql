-- Rode isso no SQL Editor do Supabase
-- Adiciona o "foco" (posicionamento do recorte) do banner de fundo

alter table configuracoes_site add column if not exists hero_banner_position text not null default 'center';
