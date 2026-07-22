// ========== MOBILE MENU ==========
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');

if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('open');
    });

    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            nav.classList.remove('open');
        });
    });
}

// ========== HEADER SCROLL ==========
const header = document.getElementById('header');
if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 20);
    });
}

// ========== WHATSAPP AGENDAMENTO ==========
const WHATSAPP_NUMBER = '5544988130165';
const agendamentoForm = document.getElementById('agendamentoForm');

async function carregarAssuntos() {
    const sel = document.getElementById('assunto');
    if (!sel) return;
    const { data, error } = await sb
        .from('assuntos')
        .select('nome')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
    sel.innerHTML = '<option value="">Selecione o assunto</option>';
    if (!error && data) {
        data.forEach(a => {
            sel.innerHTML += `<option value="${escapeHtml(a.nome)}">${escapeHtml(a.nome)}</option>`;
        });
    }
}
carregarAssuntos();

if (agendamentoForm) {
    agendamentoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const data = document.getElementById('data').value;
        const horario = document.getElementById('horario').value;
        const assunto = document.getElementById('assunto').value;
        const mensagem = document.getElementById('mensagem').value.trim();

        const dataFormatada = data ? new Date(data + 'T12:00:00').toLocaleDateString('pt-BR') : '';

        let texto = `Olá! Gostaria de fazer um *pré-agendamento* no SEHORBAS.\n\n`;
        texto += `*Nome:* ${nome}\n`;
        texto += `*Telefone:* ${telefone}\n`;
        texto += `*Data de preferência:* ${dataFormatada}\n`;
        if (horario) texto += `*Horário de preferência:* ${horario}\n`;
        texto += `*Assunto:* ${assunto}\n`;
        if (mensagem) texto += `*Mensagem:* ${mensagem}\n`;
        texto += `\n_Estou ciente de que este é um pré-agendamento e que o horário será confirmado pelo atendente._`;

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
        window.open(url, '_blank');
    });
}

// ========== PHONE MASK ==========
const telefoneInput = document.getElementById('telefone');
if (telefoneInput) {
    telefoneInput.addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 6) {
            this.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        } else if (v.length > 2) {
            this.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        } else if (v.length > 0) {
            this.value = `(${v}`;
        }
    });
}

// ========== CONVÊNIOS ==========
function buildConvenioCardHTML(c) {
    const logoUrlSegura = safeUrl(c.logo_url);
    const siteUrlSeguro = safeUrl(c.site_url);
    const logoEhPdf = logoUrlSegura && logoUrlSegura.toLowerCase().endsWith('.pdf');
    const logoHtml = logoUrlSegura
        ? (logoEhPdf
            ? `<a href="${logoUrlSegura}" target="_blank" rel="noopener" title="Ver logo (PDF)">📄</a>`
            : `<img src="${logoUrlSegura}" alt="${escapeHtml(c.nome)}">`)
        : escapeHtml(c.nome).charAt(0).toUpperCase();

    return `
    <div class="convenio-card">
        <div class="convenio-card-header">
            <div class="convenio-logo">${logoHtml}</div>
            <h3>${escapeHtml(c.nome)}</h3>
        </div>
        <div class="convenio-card-body">
            <p>${escapeHtml(c.descricao)}</p>
            ${c.endereco ? `<div class="convenio-detail"><span>📍</span><span>${escapeHtml(c.endereco)}</span></div>` : ''}
            ${c.telefone ? `<div class="convenio-detail"><span>📞</span><span>${escapeHtml(c.telefone)}</span></div>` : ''}
            ${siteUrlSeguro ? `<a href="${siteUrlSeguro}" target="_blank" rel="noopener" class="convenio-site-link">🔗 Visitar site</a>` : ''}
        </div>
    </div>
    `;
}

async function renderConvenios(limit) {
    const grid = document.getElementById('conveniosGrid');
    if (!grid) return;

    const { data: convenios, error } = await sb
        .from('convenios')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar convênios:', error);
        grid.innerHTML = `<div class="convenio-empty"><p>Não foi possível carregar os convênios no momento.</p></div>`;
        return;
    }

    if (!convenios || convenios.length === 0) {
        grid.innerHTML = `<div class="convenio-empty"><p>Em breve, novos convênios e parcerias para você.</p></div>`;
        return;
    }

    const exibidos = limit ? convenios.slice(0, limit) : convenios;
    grid.innerHTML = exibidos.map(buildConvenioCardHTML).join('');

    const verMaisWrap = document.getElementById('conveniosVerMais');
    if (verMaisWrap) {
        verMaisWrap.style.display = (limit && convenios.length > limit) ? 'flex' : 'none';
    }
}

// ========== RENDER DOCUMENTOS (Convenções / Acordos / Modelos) ==========
function buildDocCardHTML(c, showDownload = true) {
    const arquivoUrlSeguro = safeUrl(c.arquivo_url);
    const descricao = escapeHtml(c.descricao || '');
    return `
    <div class="carousel-item">
        <div class="doc-card" onclick="this.classList.toggle('expanded');var b=this.querySelector('.doc-card-toggle');if(b)b.textContent=this.classList.contains('expanded')?'Ver menos':'Ver mais'">
            <h3>${escapeHtml(c.titulo)}</h3>
            <p class="doc-card-desc">${descricao}</p>
            <div class="doc-card-footer">
                ${descricao ? '<button type="button" class="doc-card-toggle">Ver mais</button>' : ''}
                ${showDownload && arquivoUrlSeguro ? `<a href="${arquivoUrlSeguro}" target="_blank" rel="noopener" class="convencao-download" onclick="event.stopPropagation()">📄 Download</a>` : ''}
            </div>
        </div>
    </div>
    `;
}

async function renderDocumentos(tabela, containerId, mensagemVazia, showDownload = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { data: docs, error } = await sb
        .from(tabela)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`Erro ao carregar ${tabela}:`, error);
        container.innerHTML = `<div class="convenio-empty"><p>Não foi possível carregar no momento.</p></div>`;
        return;
    }

    if (!docs || docs.length === 0) {
        container.innerHTML = `<div class="convenio-empty"><p>${mensagemVazia}</p></div>`;
        return;
    }

    container.innerHTML = docs.map(d => buildDocCardHTML(d, showDownload)).join('');
}

function renderConvencoes() {
    return renderDocumentos('convencoes', 'convencaoTrack', 'Em breve, a convenção coletiva estará disponível para consulta.');
}

function renderAcordos() {
    return renderDocumentos('acordos', 'acordoTrack', 'Em breve, o acordo coletivo estará disponível para consulta.');
}

function renderModelosAcordo() {
    return renderDocumentos('modelos_acordo', 'modelosTrack', 'Em breve, modelos de acordo disponíveis para download.');
}

// ========== CARROSSEL (setas prev/next + deslizamento automático) ==========
function wireCarousel(trackId, prevId, nextId) {
    const track = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);
    if (!track || !prevBtn || !nextBtn) return;

    const scrollAmount = () => {
        const item = track.querySelector('.carousel-item');
        return item ? item.getBoundingClientRect().width + 20 : 320;
    };

    function avancar() {
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
        track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + scrollAmount(), behavior: 'smooth' });
    }
    function voltar() {
        track.scrollTo({ left: Math.max(0, track.scrollLeft - scrollAmount()), behavior: 'smooth' });
    }

    prevBtn.addEventListener('click', () => { voltar(); pausarTemporario(); });
    nextBtn.addEventListener('click', () => { avancar(); pausarTemporario(); });

    // Avanço automático — move um card por vez, alinhado ao snap, pausa ao interagir.
    let autoTimer = null;
    let pausado = false;
    let resumeTimer = null;

    function iniciarAuto() {
        pararAuto();
        autoTimer = setInterval(() => {
            if (!pausado && track.scrollWidth > track.clientWidth + 5) avancar();
        }, 4000);
    }
    function pararAuto() {
        if (autoTimer) clearInterval(autoTimer);
    }
    function pausarTemporario() {
        pausado = true;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => { pausado = false; }, 6000);
    }

    track.addEventListener('mouseenter', () => { pausado = true; });
    track.addEventListener('mouseleave', () => { pausado = false; });
    track.addEventListener('touchstart', () => { pausado = true; }, { passive: true });
    track.addEventListener('touchend', pausarTemporario);

    iniciarAuto();
}

// ========== RENDER NOTÍCIAS (posts do Instagram) ==========
function processInstagramEmbeds(retries) {
    if (retries === undefined) retries = 20;
    if (window.instgrm && window.instgrm.Embeds) {
        window.instgrm.Embeds.process();
        ajustarEmbedsInstagram();
    } else if (retries > 0) {
        setTimeout(() => processInstagramEmbeds(retries - 1), 300);
    }
}

// Reduz cada post do Instagram proporcionalmente para caber inteiro
// dentro do card, em vez de simplesmente cortar o excesso. Usa
// ResizeObserver porque o Instagram só define a altura real do post
// depois de carregar o conteúdo de forma assíncrona.
function ajustarEmbedsInstagram() {
    document.querySelectorAll('.noticia-embed-wrap iframe').forEach((iframe) => {
        if (iframe.dataset.ajustado) return;
        iframe.dataset.ajustado = '1';

        let ultimaAlturaNatural = 0;
        const encaixar = () => {
            const wrap = iframe.closest('.noticia-embed-wrap');
            const alturaNatural = iframe.offsetHeight;
            const alturaDisponivel = wrap ? wrap.clientHeight : 0;
            if (!alturaNatural || !alturaDisponivel || alturaNatural === ultimaAlturaNatural) return;
            ultimaAlturaNatural = alturaNatural;

            const escala = Math.min(1, alturaDisponivel / alturaNatural);
            iframe.style.transform = `scale(${escala})`;
            iframe.style.width = `${100 / escala}%`;
        };

        encaixar();
        new ResizeObserver(encaixar).observe(iframe);
        window.addEventListener('resize', encaixar);

        // Alguns posts demoram mais para o Instagram calcular a altura
        // final (ex: publicações com várias fotos/carrossel interno).
        // Reforça a checagem por alguns segundos como garantia extra.
        [800, 1600, 2500, 4000, 6000].forEach((delay) => setTimeout(encaixar, delay));
    });
}

function buildNoticiaCardHTML(n) {
    const linkSeguro = safeUrl(n.link);
    if (!linkSeguro) return '';
    return `
    <div class="carousel-item">
        <div class="noticia-card">
            ${n.titulo ? `<h3 class="noticia-titulo">${escapeHtml(n.titulo)}</h3>` : ''}
            <div class="noticia-embed-wrap">
                <blockquote class="instagram-media" data-instgrm-permalink="${linkSeguro}" data-instgrm-version="14"></blockquote>
            </div>
        </div>
    </div>
    `;
}

async function renderNoticias() {
    const track = document.getElementById('noticiasTrack');
    if (!track) return;

    const { data: noticias, error } = await sb
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar notícias:', error);
        track.innerHTML = `<div class="convenio-empty"><p>Não foi possível carregar as notícias no momento.</p></div>`;
        return;
    }

    if (!noticias || noticias.length === 0) {
        track.innerHTML = `<div class="convenio-empty"><p>Em breve, novidades por aqui.</p></div>`;
        return;
    }

    track.innerHTML = noticias.map(buildNoticiaCardHTML).join('');
    processInstagramEmbeds();
}

// ========== RENDER EQUIPE ==========
let equipeCache = [];

async function renderEquipeSite() {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;

    const { data: equipe, error } = await sb
        .from('equipe')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        console.error('Erro ao carregar equipe:', error);
        grid.innerHTML = `<p class="convenio-empty">Não foi possível carregar a equipe no momento.</p>`;
        return;
    }

    if (!equipe || equipe.length === 0) {
        grid.innerHTML = `<p class="convenio-empty">Em breve, informações da equipe.</p>`;
        return;
    }

    equipeCache = equipe;

    grid.innerHTML = equipe.map(f => {
        const iniciais = escapeHtml(f.nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase());
        const fotoUrlSegura = safeUrl(f.foto_url);
        const avatarHtml = fotoUrlSegura
            ? `<img src="${fotoUrlSegura}" alt="${escapeHtml(f.nome)}">`
            : iniciais;
        return `
            <div class="team-card" onclick="openTeamModal('${f.id}')">
                <div class="team-avatar">${avatarHtml}</div>
                <h3>${escapeHtml(f.nome)}</h3>
                <span class="team-role">${escapeHtml(f.cargo)}</span>
                ${f.descricao ? `<p class="team-desc">${escapeHtml(f.descricao)}</p>` : ''}
            </div>
        `;
    }).join('');
}

// ========== MODAL DETALHE EQUIPE ==========
const teamModalOverlay = document.getElementById('teamModalOverlay');

function openTeamModal(id) {
    const f = equipeCache.find(p => p.id === id);
    if (!f || !teamModalOverlay) return;

    const iniciais = escapeHtml(f.nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase());
    const fotoUrlSegura = safeUrl(f.foto_url);

    document.getElementById('teamModalAvatar').innerHTML = fotoUrlSegura
        ? `<img src="${fotoUrlSegura}" alt="${escapeHtml(f.nome)}">`
        : iniciais;
    document.getElementById('teamModalNome').textContent = f.nome;
    document.getElementById('teamModalCargo').textContent = f.cargo;
    document.getElementById('teamModalDesc').textContent = f.descricao || 'Nenhuma descrição cadastrada.';

    teamModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeTeamModal() {
    if (!teamModalOverlay) return;
    teamModalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

if (teamModalOverlay) {
    document.getElementById('teamModalClose').addEventListener('click', closeTeamModal);
    teamModalOverlay.addEventListener('click', (e) => {
        if (e.target === teamModalOverlay) closeTeamModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTeamModal();
    });
}

// ========== INIT ==========
renderConvenios(document.getElementById('conveniosVerMais') ? 3 : undefined);
renderConvencoes();
renderAcordos();
renderModelosAcordo();
renderNoticias();
renderEquipeSite();

wireCarousel('noticiasTrack', 'noticiasPrev', 'noticiasNext');
wireCarousel('convencaoTrack', 'convencaoPrev', 'convencaoNext');
wireCarousel('acordoTrack', 'acordoPrev', 'acordoNext');
wireCarousel('modelosTrack', 'modelosPrev', 'modelosNext');
