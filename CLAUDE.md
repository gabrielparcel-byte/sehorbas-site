# SEHORBAS — Site Institucional

Site do Sindicato dos Empregados em Hotéis, Restaurantes, Bares e Similares de Maringá e Região.

## Stack

- Site estático (HTML/CSS/JS puro, sem framework/build step)
- Backend: Supabase (Postgres + Auth + Storage), config em `supabase-config.js`
- Hospedagem: GitHub Pages, repo `gabrielparcel-byte/sehorbas-site`
- Domínio próprio: **sehorbas.com.br** (registro.br), DNS apontando pros IPs do GitHub Pages via arquivo `CNAME`, HTTPS forçado (Enforce HTTPS ligado)

## Estrutura de páginas

- `index.html` — site público (Sobre, Área de Atuação [Base Territorial + Categorias Abrangidas], Notícias/Instagram, Vagas de Emprego, Equipe, Convênios, Cursos, Convenção Coletiva, Comunicados, Modelos de Acordo, Pré-Agendamento, Contato)
- `admin.html` + `admin.js` — painel administrativo (login Supabase Auth), 12 abas: Convênios, Cursos, Convenções, Comunicados, Modelos de Acordo, Notícias, Vagas de Emprego, Equipe, Base Territorial, Categorias, Assuntos (do pré-agendamento), **Banner** (imagem de fundo do hero)
- `convenios.html`, `convencao.html`, `modelos.html` — páginas "Ver mais" (listagem completa de cada seção)
- `app.js` — lógica do site público (renderização, carrosséis, formulário WhatsApp)
- `style.css` / `admin.css` — estilos

Links internos usam `/` em vez de `index.html` (URLs limpas desde a migração pro domínio próprio).

## Tabelas no Supabase

`convenios`, `convencoes`, `comunicados` (título + descrição + PDF, mesmo formato de convenções — migration 011, substituiu a antiga tabela `acordos`), `modelos_acordo`, `noticias`, `equipe`, `assuntos` (assuntos do pré-agendamento — migration 008), `cidades` (Base Territorial), `categorias` (Categorias Abrangidas, com `icone` em emoji), `vagas` (Vagas de Emprego, imagem obrigatória, com `telefone`/`link` opcionais — migration 010), `cursos` (cursos com desconto — migration 009).

Todas com RLS: leitura pública (`select using (true)`), escrita só autenticado.

Buckets de Storage (públicos): `convenios-logos`, `convencoes-arquivos`, `comunicados-arquivos`, `modelos-acordo-arquivos`, `equipe-fotos`, `vagas-flyers`, `cursos-logos`, `banner-fundo`.

Configuração de site (linha única, id fixo 1): tabela `configuracoes_site` (migration 012, `hero_banner_position` na 013) guarda `hero_banner_url` — a foto de fundo do hero, opcional, editável na aba **Banner** do admin — e `hero_banner_position` (grid de 9 pontos no admin, vira `object-position` no CSS, default `center center`). Aplicada com `opacity: .16` + `mix-blend-mode: luminosity` sobre o degradê existente (`.hero-banner-img` em `style.css`), pra aparecer só sutilmente atrás do texto, sem prejudicar a legibilidade. O admin mostra uma prévia com a mesma proporção do hero antes de salvar, pra evitar cortar parte importante da foto.

Migrations em `migrations/`, numeradas e sequenciais — rodar manualmente no SQL Editor do Supabase quando adicionadas (não há CI de migration).

## Pré-agendamento

Formulário no `index.html` monta uma mensagem e abre o WhatsApp (`wa.me`) do número `5544988130165` (`WHATSAPP_NUMBER` em `app.js`). O campo "Assunto" carrega as opções dinamicamente da tabela `assuntos` — para adicionar/remover assuntos, usar a aba **Assuntos** no admin, não editar HTML.

## Contato / redes sociais (fonte de verdade)

- WhatsApp/telefone: (44) 98813-0165
- Fixo: (44) 3222-5952
- Emails: sehorbasmaringa@outlook.com, sehorbasmaringa@gmail.com
- Instagram: @sehorbasmaringa (embed manual via `instagram.com/embed.js`, tipo Prime)
- Facebook: /SEHORBASMARINGA
- Horário: seg-sex 8h-17h, almoço 11h30-13h30

Ícones de redes sociais são SVG inline (Instagram/Facebook oficiais), não emoji.

## Segurança

`supabase-config.js` expõe `escapeHtml()` e `safeUrl()` — **sempre** usar ao injetar dados do banco em `innerHTML` (evita XSS armazenado). `safeUrl()` só libera `http:`/`https:`.

## Convenções de UI

- Seções de documentos (Convenção, Comunicados, Modelos) usam carrossel (`.carousel-wrap/.carousel-track/.carousel-item`) com auto-advance por `setInterval` (4s) — não usar scroll contínuo via `requestAnimationFrame`, conflita com `scroll-snap`.
- Cards de documento (`.doc-card`) são clicáveis: expandem no clique mostrando descrição completa, com botão "Ver mais"/"Ver menos". Botão de Download tem `stopPropagation` pra não disparar o toggle de expandir.
- Convênios (`.convenio-card`) não têm botão de download — não faz sentido pro tipo de conteúdo (é cadastro de parceiro, não documento).
- Logo é `assets/logo.png` (não SVG — a versão SVG recortada perdia o arco de texto circular; `<textPath>` não renderiza quando SVG é usado como `<img src>`).
- Vagas de Emprego (`.vaga-card`) funcionam como um "post": imagem do flyer + título, clicáveis pra abrir um modal de detalhe (`#vagaModalOverlay`, reaproveita o CSS do modal de equipe) com descrição, telefone (`tel:`) e link de inscrição, quando cadastrados. Sem expiração automática — a dona do site remove manualmente pelo admin quando a vaga fecha.
- Base Territorial (cidades) usa chips simples (`.cidade-chip`); Categorias Abrangidas usa grid de ícones (`.categoria-card`, campo `icone` é um emoji digitado no admin). Ambas seguem o mesmo padrão simples de lista da tabela `assuntos` (nome + ordem, sem upload).

## Deploy

Push na branch `main` já publica direto (GitHub Pages serve a partir da raiz do `main`). Não tem build step, então o commit é o deploy.

## Pendências conhecidas

- GitHub Actions secrets do workflow `supabase-keepalive.yml` ainda não configurados.
- Arquivo solto `nova logo sehorbas.png` na raiz — é a logo original enviada pelo usuário, mantida como backup fora do Git (duplicata de `assets/logo.png`).

## Regra de manutenção deste arquivo

Manter este CLAUDE.md atualizado a cada mudança relevante de arquitetura, convenção ou decisão de produto — é a forma de levar contexto entre máquinas diferentes, já que a memória local do Claude Code não sincroniza entre PCs.
