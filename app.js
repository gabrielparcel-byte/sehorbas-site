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
const WHATSAPP_NUMBER = '554432225952';
const agendamentoForm = document.getElementById('agendamentoForm');

if (agendamentoForm) {
    agendamentoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const data = document.getElementById('data').value;
        const assunto = document.getElementById('assunto').value;
        const mensagem = document.getElementById('mensagem').value.trim();

        const dataFormatada = data ? new Date(data + 'T12:00:00').toLocaleDateString('pt-BR') : '';

        let texto = `Olá! Gostaria de agendar um atendimento no SEHORBAS.\n\n`;
        texto += `*Nome:* ${nome}\n`;
        texto += `*Telefone:* ${telefone}\n`;
        texto += `*Data desejada:* ${dataFormatada}\n`;
        texto += `*Assunto:* ${assunto}\n`;
        if (mensagem) texto += `*Mensagem:* ${mensagem}\n`;

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

// ========== RENDER CONVENÇÕES ==========
async function renderConvencoes() {
    const list = document.getElementById('convencaoList');
    if (!list) return;

    const { data: convencoes, error } = await sb
        .from('convencoes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar convenções:', error);
        list.innerHTML = `<div class="convenio-empty"><p>Não foi possível carregar as convenções no momento.</p></div>`;
        return;
    }

    if (!convencoes || convencoes.length === 0) {
        list.innerHTML = `<div class="convenio-empty"><p>Em breve, a convenção coletiva estará disponível para consulta.</p></div>`;
        return;
    }

    list.innerHTML = convencoes.map(c => {
        const arquivoUrlSeguro = safeUrl(c.arquivo_url);
        return `
        <div class="convencao-item">
            <div class="convencao-info">
                <h3>${escapeHtml(c.titulo)}</h3>
                <p>${escapeHtml(c.descricao || '')}</p>
            </div>
            ${arquivoUrlSeguro ? `<a href="${arquivoUrlSeguro}" target="_blank" rel="noopener" class="convencao-download">📄 Download</a>` : ''}
        </div>
        `;
    }).join('');
}

// ========== RENDER EQUIPE ==========
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

    grid.innerHTML = equipe.map(f => {
        const iniciais = escapeHtml(f.nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase());
        return `
            <div class="team-card">
                <div class="team-avatar">${iniciais}</div>
                <h3>${escapeHtml(f.nome)}</h3>
                <span class="team-role">${escapeHtml(f.cargo)}</span>
                ${f.descricao ? `<p class="team-desc">${escapeHtml(f.descricao)}</p>` : ''}
            </div>
        `;
    }).join('');
}

// ========== INIT ==========
renderConvenios(document.getElementById('conveniosVerMais') ? 3 : undefined);
renderConvencoes();
renderEquipeSite();
