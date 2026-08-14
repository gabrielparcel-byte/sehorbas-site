-- Rode isso no SQL Editor do Supabase
-- Adiciona zoom e arraste (pan) livre do banner de fundo, substituindo
-- o grid fixo de 9 pontos por um controle contínuo.

alter table configuracoes_site add column if not exists hero_banner_zoom numeric not null default 1;
alter table configuracoes_site add column if not exists hero_banner_pan_x numeric not null default 0;
alter table configuracoes_site add column if not exists hero_banner_pan_y numeric not null default 0;
