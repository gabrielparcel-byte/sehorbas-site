// ========== AUTH ==========
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const mainLoginCard = document.getElementById('mainLoginCard');
const forgotPasswordScreen = document.getElementById('forgotPasswordScreen');
const resetPasswordScreen = document.getElementById('resetPasswordScreen');

let isPasswordRecovery = false;

function showLoginCard() {
    mainLoginCard.style.display = 'block';
    forgotPasswordScreen.style.display = 'none';
    resetPasswordScreen.style.display = 'none';
}

async function checkSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (session && !isPasswordRecovery) {
        showPanel();
    } else if (!isPasswordRecovery) {
        loginScreen.style.display = 'flex';
        adminPanel.style.display = 'none';
        showLoginCard();
    }
}

function showPanel() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    renderAll();
}

// Quando o usuário clica no link de recuperação recebido por email, o
// Supabase autentica automaticamente e dispara este evento — mostramos a
// tela de nova senha em vez de já abrir o painel administrativo.
sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
        isPasswordRecovery = true;
        loginScreen.style.display = 'flex';
        adminPanel.style.display = 'none';
        mainLoginCard.style.display = 'none';
        forgotPasswordScreen.style.display = 'none';
        resetPasswordScreen.style.display = 'block';
    }
});

checkSession();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const errorBox = document.getElementById('loginError');
    errorBox.textContent = '';

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
        errorBox.textContent = 'Email ou senha incorretos.';
        return;
    }
    showPanel();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.reload();
});

// ========== ESQUECI MINHA SENHA ==========
document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
    mainLoginCard.style.display = 'none';
    forgotPasswordScreen.style.display = 'block';
    document.getElementById('forgotError').textContent = '';
    document.getElementById('forgotSuccess').textContent = '';
});

document.getElementById('backToLoginBtn').addEventListener('click', showLoginCard);

document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const errorBox = document.getElementById('forgotError');
    const successBox = document.getElementById('forgotSuccess');
    errorBox.textContent = '';
    successBox.textContent = '';

    const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
    });

    if (error) {
        errorBox.textContent = 'Não foi possível enviar o email: ' + error.message;
        return;
    }
    successBox.textContent = 'Link enviado! Confira seu email (e a caixa de spam) para redefinir sua senha.';
});

// ========== DEFINIR NOVA SENHA ==========
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const novaSenha = document.getElementById('newPassword').value;
    const confirmacao = document.getElementById('newPasswordConfirm').value;
    const errorBox = document.getElementById('resetError');
    errorBox.textContent = '';

    if (novaSenha !== confirmacao) {
        errorBox.textContent = 'As senhas não coincidem.';
        return;
    }

    const { error } = await sb.auth.updateUser({ password: novaSenha });

    if (error) {
        errorBox.textContent = 'Erro ao salvar nova senha: ' + error.message;
        return;
    }

    isPasswordRecovery = false;
    showPanel();
});

// ========== TABS ==========
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        // A aba Banner fica display:none até ser aberta, então o
        // tamanho das prévias só dá pra medir depois de ficar visível.
        if (tab.dataset.tab === 'banner' && typeof sizeBannerImgs === 'function') {
            sizeBannerImgs();
            applyBannerTransform();
        }
    });
});

// ========== CONVÊNIOS CRUD ==========
const convenioFormCard = document.getElementById('convenioFormCard');
const convenioForm = document.getElementById('convenioForm');

document.getElementById('addConvenioBtn').addEventListener('click', () => {
    document.getElementById('convenioId').value = '';
    document.getElementById('convenioLogoAtual').value = '';
    document.getElementById('convenioLogoHint').textContent = '';
    convenioForm.reset();
    document.getElementById('convenioFormTitle').textContent = 'Novo Convênio';
    convenioFormCard.style.display = 'block';
});

document.getElementById('cancelConvenio').addEventListener('click', () => {
    convenioFormCard.style.display = 'none';
});

convenioForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = convenioForm.querySelector('button[type="submit"]');
    const id = document.getElementById('convenioId').value;
    const logoAtual = document.getElementById('convenioLogoAtual').value;
    const fileInput = document.getElementById('convenioLogo');
    const file = await compressImage(fileInput.files[0], { maxWidth: 500, maxHeight: 500, quality: 0.85 });

    let logo_url = logoAtual || null;

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando logo...';
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('convenios-logos').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar logo: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('convenios-logos').getPublicUrl(filePath);
        logo_url = publicUrl;
    }

    const item = {
        nome: document.getElementById('convenioNome').value.trim(),
        endereco: document.getElementById('convenioEndereco').value.trim(),
        telefone: document.getElementById('convenioTelefone').value.trim(),
        descricao: document.getElementById('convenioDescricao').value.trim(),
        site_url: document.getElementById('convenioSite').value.trim() || null,
        logo_url
    };

    const { error } = id
        ? await sb.from('convenios').update(item).eq('id', id)
        : await sb.from('convenios').insert(item);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar';

    if (error) {
        alert('Erro ao salvar convênio: ' + error.message);
        return;
    }
    convenioFormCard.style.display = 'none';
    renderConvenios();
});

async function editConvenio(id) {
    const { data: c, error } = await sb.from('convenios').select('*').eq('id', id).single();
    if (error || !c) return;
    document.getElementById('convenioId').value = c.id;
    document.getElementById('convenioNome').value = c.nome;
    document.getElementById('convenioEndereco').value = c.endereco || '';
    document.getElementById('convenioTelefone').value = c.telefone || '';
    document.getElementById('convenioDescricao').value = c.descricao;
    document.getElementById('convenioSite').value = c.site_url || '';
    document.getElementById('convenioLogo').value = '';
    document.getElementById('convenioLogoAtual').value = c.logo_url || '';
    document.getElementById('convenioLogoHint').textContent = c.logo_url
        ? 'Já existe uma logo enviada. Escolha uma nova apenas se quiser substituí-la.'
        : '';
    document.getElementById('convenioFormTitle').textContent = 'Editar Convênio';
    convenioFormCard.style.display = 'block';
}

async function deleteConvenio(id) {
    if (!confirm('Remover este convênio?')) return;
    const { error } = await sb.from('convenios').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderConvenios();
}

async function renderConvenios() {
    const list = document.getElementById('conveniosList');
    const { data: convenios, error } = await sb
        .from('convenios')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!convenios || convenios.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum convênio cadastrado.</div>';
        return;
    }
    list.innerHTML = convenios.map(c => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(c.nome)}</h4>
                <p>${escapeHtml(c.descricao)}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editConvenio('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteConvenio('${c.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== CURSOS CRUD ==========
const cursoFormCard = document.getElementById('cursoFormCard');
const cursoForm = document.getElementById('cursoForm');

document.getElementById('addCursoBtn').addEventListener('click', () => {
    document.getElementById('cursoId').value = '';
    document.getElementById('cursoLogoAtual').value = '';
    document.getElementById('cursoLogoHint').textContent = '';
    cursoForm.reset();
    document.getElementById('cursoFormTitle').textContent = 'Novo Curso';
    cursoFormCard.style.display = 'block';
});

document.getElementById('cancelCurso').addEventListener('click', () => {
    cursoFormCard.style.display = 'none';
});

cursoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = cursoForm.querySelector('button[type="submit"]');
    const id = document.getElementById('cursoId').value;
    const logoAtual = document.getElementById('cursoLogoAtual').value;
    const fileInput = document.getElementById('cursoLogo');
    const file = await compressImage(fileInput.files[0], { maxWidth: 500, maxHeight: 500, quality: 0.85 });

    let logo_url = logoAtual || null;

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando logo...';
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('cursos-logos').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar logo: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('cursos-logos').getPublicUrl(filePath);
        logo_url = publicUrl;
    }

    const item = {
        nome: document.getElementById('cursoNome').value.trim(),
        instituicao: document.getElementById('cursoInstituicao').value.trim() || null,
        descricao: document.getElementById('cursoDescricao').value.trim(),
        desconto: document.getElementById('cursoDesconto').value.trim() || null,
        link: document.getElementById('cursoLink').value.trim() || null,
        logo_url
    };

    const { error } = id
        ? await sb.from('cursos').update(item).eq('id', id)
        : await sb.from('cursos').insert(item);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar';

    if (error) {
        alert('Erro ao salvar curso: ' + error.message);
        return;
    }
    cursoFormCard.style.display = 'none';
    renderCursosAdmin();
});

async function editCurso(id) {
    const { data: c, error } = await sb.from('cursos').select('*').eq('id', id).single();
    if (error || !c) return;
    document.getElementById('cursoId').value = c.id;
    document.getElementById('cursoNome').value = c.nome;
    document.getElementById('cursoInstituicao').value = c.instituicao || '';
    document.getElementById('cursoDescricao').value = c.descricao;
    document.getElementById('cursoDesconto').value = c.desconto || '';
    document.getElementById('cursoLink').value = c.link || '';
    document.getElementById('cursoLogo').value = '';
    document.getElementById('cursoLogoAtual').value = c.logo_url || '';
    document.getElementById('cursoLogoHint').textContent = c.logo_url
        ? 'Já existe uma logo enviada. Escolha uma nova apenas se quiser substituí-la.'
        : '';
    document.getElementById('cursoFormTitle').textContent = 'Editar Curso';
    cursoFormCard.style.display = 'block';
}

async function deleteCurso(id) {
    if (!confirm('Remover este curso?')) return;
    const { error } = await sb.from('cursos').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderCursosAdmin();
}

async function renderCursosAdmin() {
    const list = document.getElementById('cursosList');
    const { data: cursos, error } = await sb
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!cursos || cursos.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum curso cadastrado.</div>';
        return;
    }
    list.innerHTML = cursos.map(c => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(c.nome)}</h4>
                <p>${escapeHtml(c.descricao)}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editCurso('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCurso('${c.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== CONVENÇÕES CRUD ==========
const convencaoFormCard = document.getElementById('convencaoFormCard');
const convencaoForm = document.getElementById('convencaoForm');

document.getElementById('addConvencaoBtn').addEventListener('click', () => {
    document.getElementById('convencaoId').value = '';
    document.getElementById('convencaoArquivoAtual').value = '';
    document.getElementById('convencaoArquivoHint').textContent = '';
    convencaoForm.reset();
    document.getElementById('convencaoFormTitle').textContent = 'Nova Convenção';
    convencaoFormCard.style.display = 'block';
});

document.getElementById('cancelConvencao').addEventListener('click', () => {
    convencaoFormCard.style.display = 'none';
});

convencaoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = convencaoForm.querySelector('button[type="submit"]');
    const id = document.getElementById('convencaoId').value;
    const arquivoAtual = document.getElementById('convencaoArquivoAtual').value;
    const fileInput = document.getElementById('convencaoArquivo');
    const file = fileInput.files[0];

    let arquivo_url = arquivoAtual || null;

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando arquivo...';
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('convencoes-arquivos').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar arquivo: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('convencoes-arquivos').getPublicUrl(filePath);
        arquivo_url = publicUrl;
    }

    const item = {
        titulo: document.getElementById('convencaoTitulo').value.trim(),
        descricao: document.getElementById('convencaoDescricao').value.trim(),
        arquivo_url
    };

    const { error } = id
        ? await sb.from('convencoes').update(item).eq('id', id)
        : await sb.from('convencoes').insert(item);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar';

    if (error) {
        alert('Erro ao salvar convenção: ' + error.message);
        return;
    }
    convencaoFormCard.style.display = 'none';
    renderConvencoes();
});

async function editConvencao(id) {
    const { data: c, error } = await sb.from('convencoes').select('*').eq('id', id).single();
    if (error || !c) return;
    document.getElementById('convencaoId').value = c.id;
    document.getElementById('convencaoTitulo').value = c.titulo;
    document.getElementById('convencaoDescricao').value = c.descricao || '';
    document.getElementById('convencaoArquivo').value = '';
    document.getElementById('convencaoArquivoAtual').value = c.arquivo_url || '';
    document.getElementById('convencaoArquivoHint').textContent = c.arquivo_url
        ? 'Já existe um arquivo enviado. Escolha um novo apenas se quiser substituí-lo.'
        : '';
    document.getElementById('convencaoFormTitle').textContent = 'Editar Convenção';
    convencaoFormCard.style.display = 'block';
}

async function deleteConvencao(id) {
    if (!confirm('Remover esta convenção?')) return;
    const { error } = await sb.from('convencoes').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderConvencoes();
}

async function renderConvencoes() {
    const list = document.getElementById('convencoesList');
    const { data: convencoes, error } = await sb
        .from('convencoes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!convencoes || convencoes.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhuma convenção cadastrada.</div>';
        return;
    }
    list.innerHTML = convencoes.map(c => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(c.titulo)}</h4>
                <p>${escapeHtml(c.descricao || 'Sem descrição')}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editConvencao('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteConvencao('${c.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== COMUNICADOS CRUD ==========
const comunicadoFormCard = document.getElementById('comunicadoFormCard');
const comunicadoForm = document.getElementById('comunicadoForm');

document.getElementById('addComunicadoBtn').addEventListener('click', () => {
    document.getElementById('comunicadoId').value = '';
    document.getElementById('comunicadoArquivoAtual').value = '';
    document.getElementById('comunicadoArquivoHint').textContent = '';
    comunicadoForm.reset();
    document.getElementById('comunicadoFormTitle').textContent = 'Novo Comunicado';
    comunicadoFormCard.style.display = 'block';
});

document.getElementById('cancelComunicado').addEventListener('click', () => {
    comunicadoFormCard.style.display = 'none';
});

comunicadoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = comunicadoForm.querySelector('button[type="submit"]');
    const id = document.getElementById('comunicadoId').value;
    const arquivoAtual = document.getElementById('comunicadoArquivoAtual').value;
    const fileInput = document.getElementById('comunicadoArquivo');
    const file = fileInput.files[0];

    let arquivo_url = arquivoAtual || null;

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando arquivo...';
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('comunicados-arquivos').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar arquivo: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('comunicados-arquivos').getPublicUrl(filePath);
        arquivo_url = publicUrl;
    }

    const item = {
        titulo: document.getElementById('comunicadoTitulo').value.trim(),
        descricao: document.getElementById('comunicadoDescricao').value.trim(),
        arquivo_url
    };

    const { error } = id
        ? await sb.from('comunicados').update(item).eq('id', id)
        : await sb.from('comunicados').insert(item);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar';

    if (error) {
        alert('Erro ao salvar comunicado: ' + error.message);
        return;
    }
    comunicadoFormCard.style.display = 'none';
    renderComunicadosAdmin();
});

async function editComunicado(id) {
    const { data: c, error } = await sb.from('comunicados').select('*').eq('id', id).single();
    if (error || !c) return;
    document.getElementById('comunicadoId').value = c.id;
    document.getElementById('comunicadoTitulo').value = c.titulo;
    document.getElementById('comunicadoDescricao').value = c.descricao || '';
    document.getElementById('comunicadoArquivo').value = '';
    document.getElementById('comunicadoArquivoAtual').value = c.arquivo_url || '';
    document.getElementById('comunicadoArquivoHint').textContent = c.arquivo_url
        ? 'Já existe um arquivo enviado. Escolha um novo apenas se quiser substituí-lo.'
        : '';
    document.getElementById('comunicadoFormTitle').textContent = 'Editar Comunicado';
    comunicadoFormCard.style.display = 'block';
}

async function deleteComunicado(id) {
    if (!confirm('Remover este comunicado?')) return;
    const { error } = await sb.from('comunicados').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderComunicadosAdmin();
}

async function renderComunicadosAdmin() {
    const list = document.getElementById('comunicadosList');
    const { data: comunicados, error } = await sb
        .from('comunicados')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!comunicados || comunicados.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum comunicado cadastrado.</div>';
        return;
    }
    list.innerHTML = comunicados.map(c => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(c.titulo)}</h4>
                <p>${escapeHtml(c.descricao || 'Sem descrição')}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editComunicado('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteComunicado('${c.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== MODELOS DE ACORDO CRUD ==========
const modeloFormCard = document.getElementById('modeloFormCard');
const modeloForm = document.getElementById('modeloForm');

document.getElementById('addModeloBtn').addEventListener('click', () => {
    document.getElementById('modeloId').value = '';
    document.getElementById('modeloArquivoAtual').value = '';
    document.getElementById('modeloArquivoHint').textContent = '';
    modeloForm.reset();
    document.getElementById('modeloFormTitle').textContent = 'Novo Modelo';
    modeloFormCard.style.display = 'block';
});

document.getElementById('cancelModelo').addEventListener('click', () => {
    modeloFormCard.style.display = 'none';
});

modeloForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = modeloForm.querySelector('button[type="submit"]');
    const id = document.getElementById('modeloId').value;
    const arquivoAtual = document.getElementById('modeloArquivoAtual').value;
    const fileInput = document.getElementById('modeloArquivo');
    const file = fileInput.files[0];

    let arquivo_url = arquivoAtual || null;

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando arquivo...';
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('modelos-acordo-arquivos').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar arquivo: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('modelos-acordo-arquivos').getPublicUrl(filePath);
        arquivo_url = publicUrl;
    }

    const item = {
        titulo: document.getElementById('modeloTitulo').value.trim(),
        descricao: document.getElementById('modeloDescricao').value.trim(),
        arquivo_url
    };

    const { error } = id
        ? await sb.from('modelos_acordo').update(item).eq('id', id)
        : await sb.from('modelos_acordo').insert(item);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar';

    if (error) {
        alert('Erro ao salvar modelo: ' + error.message);
        return;
    }
    modeloFormCard.style.display = 'none';
    renderModelosAdmin();
});

async function editModelo(id) {
    const { data: c, error } = await sb.from('modelos_acordo').select('*').eq('id', id).single();
    if (error || !c) return;
    document.getElementById('modeloId').value = c.id;
    document.getElementById('modeloTitulo').value = c.titulo;
    document.getElementById('modeloDescricao').value = c.descricao || '';
    document.getElementById('modeloArquivo').value = '';
    document.getElementById('modeloArquivoAtual').value = c.arquivo_url || '';
    document.getElementById('modeloArquivoHint').textContent = c.arquivo_url
        ? 'Já existe um arquivo enviado. Escolha um novo apenas se quiser substituí-lo.'
        : '';
    document.getElementById('modeloFormTitle').textContent = 'Editar Modelo';
    modeloFormCard.style.display = 'block';
}

async function deleteModelo(id) {
    if (!confirm('Remover este modelo?')) return;
    const { error } = await sb.from('modelos_acordo').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderModelosAdmin();
}

async function renderModelosAdmin() {
    const list = document.getElementById('modelosList');
    const { data: modelos, error } = await sb
        .from('modelos_acordo')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!modelos || modelos.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum modelo cadastrado.</div>';
        return;
    }
    list.innerHTML = modelos.map(c => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(c.titulo)}</h4>
                <p>${escapeHtml(c.descricao || 'Sem descrição')}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editModelo('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteModelo('${c.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== NOTÍCIAS CRUD ==========
const noticiaFormCard = document.getElementById('noticiaFormCard');
const noticiaForm = document.getElementById('noticiaForm');

document.getElementById('addNoticiaBtn').addEventListener('click', () => {
    document.getElementById('noticiaId').value = '';
    noticiaForm.reset();
    document.getElementById('noticiaFormTitle').textContent = 'Nova Notícia';
    noticiaFormCard.style.display = 'block';
});

document.getElementById('cancelNoticia').addEventListener('click', () => {
    noticiaFormCard.style.display = 'none';
});

noticiaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('noticiaId').value;
    const item = {
        link: document.getElementById('noticiaLink').value.trim(),
        titulo: document.getElementById('noticiaTitulo').value.trim() || null
    };

    const { error } = id
        ? await sb.from('noticias').update(item).eq('id', id)
        : await sb.from('noticias').insert(item);

    if (error) {
        alert('Erro ao salvar notícia: ' + error.message);
        return;
    }
    noticiaFormCard.style.display = 'none';
    renderNoticiasAdmin();
});

async function editNoticia(id) {
    const { data: n, error } = await sb.from('noticias').select('*').eq('id', id).single();
    if (error || !n) return;
    document.getElementById('noticiaId').value = n.id;
    document.getElementById('noticiaLink').value = n.link;
    document.getElementById('noticiaTitulo').value = n.titulo || '';
    document.getElementById('noticiaFormTitle').textContent = 'Editar Notícia';
    noticiaFormCard.style.display = 'block';
}

async function deleteNoticia(id) {
    if (!confirm('Remover esta notícia?')) return;
    const { error } = await sb.from('noticias').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderNoticiasAdmin();
}

async function renderNoticiasAdmin() {
    const list = document.getElementById('noticiasList');
    const { data: noticias, error } = await sb
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!noticias || noticias.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhuma notícia cadastrada.</div>';
        return;
    }
    list.innerHTML = noticias.map(n => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(n.titulo || 'Sem título')}</h4>
                <p>${escapeHtml(n.link)}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editNoticia('${n.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteNoticia('${n.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== VAGAS DE EMPREGO CRUD ==========
const vagaFormCard = document.getElementById('vagaFormCard');
const vagaForm = document.getElementById('vagaForm');

document.getElementById('addVagaBtn').addEventListener('click', () => {
    document.getElementById('vagaId').value = '';
    document.getElementById('vagaImagemAtual').value = '';
    document.getElementById('vagaImagemHint').textContent = '';
    vagaForm.reset();
    document.getElementById('vagaFormTitle').textContent = 'Nova Vaga';
    vagaFormCard.style.display = 'block';
});

document.getElementById('cancelVaga').addEventListener('click', () => {
    vagaFormCard.style.display = 'none';
});

vagaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = vagaForm.querySelector('button[type="submit"]');
    const id = document.getElementById('vagaId').value;
    const imagemAtual = document.getElementById('vagaImagemAtual').value;
    const fileInput = document.getElementById('vagaImagem');
    const file = await compressImage(fileInput.files[0], { maxWidth: 1000, maxHeight: 1400, quality: 0.82 });

    let imagem_url = imagemAtual || null;

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando flyer...';
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('vagas-flyers').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar flyer: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('vagas-flyers').getPublicUrl(filePath);
        imagem_url = publicUrl;
    }

    if (!imagem_url) {
        alert('Envie o flyer da vaga.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar';
        return;
    }

    const item = {
        titulo: document.getElementById('vagaTitulo').value.trim() || null,
        descricao: document.getElementById('vagaDescricao').value.trim() || null,
        telefone: document.getElementById('vagaTelefone').value.trim() || null,
        link: document.getElementById('vagaLink').value.trim() || null,
        imagem_url
    };

    const { error } = id
        ? await sb.from('vagas').update(item).eq('id', id)
        : await sb.from('vagas').insert(item);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar';

    if (error) {
        alert('Erro ao salvar vaga: ' + error.message);
        return;
    }
    vagaFormCard.style.display = 'none';
    renderVagasAdmin();
});

async function editVaga(id) {
    const { data: v, error } = await sb.from('vagas').select('*').eq('id', id).single();
    if (error || !v) return;
    document.getElementById('vagaId').value = v.id;
    document.getElementById('vagaTitulo').value = v.titulo || '';
    document.getElementById('vagaDescricao').value = v.descricao || '';
    document.getElementById('vagaTelefone').value = v.telefone || '';
    document.getElementById('vagaLink').value = v.link || '';
    document.getElementById('vagaImagem').value = '';
    document.getElementById('vagaImagemAtual').value = v.imagem_url || '';
    document.getElementById('vagaImagemHint').textContent = v.imagem_url
        ? 'Já existe um flyer enviado. Escolha um novo apenas se quiser substituí-lo.'
        : '';
    document.getElementById('vagaFormTitle').textContent = 'Editar Vaga';
    vagaFormCard.style.display = 'block';
}

async function deleteVaga(id) {
    if (!confirm('Remover esta vaga?')) return;
    const { error } = await sb.from('vagas').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderVagasAdmin();
}

async function renderVagasAdmin() {
    const list = document.getElementById('vagasList');
    const { data: vagas, error } = await sb
        .from('vagas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!vagas || vagas.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhuma vaga cadastrada.</div>';
        return;
    }
    list.innerHTML = vagas.map(v => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(v.titulo || 'Sem título')}</h4>
                <p>${escapeHtml(v.descricao || '')}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editVaga('${v.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteVaga('${v.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== EQUIPE CRUD ==========
const funcFormCard = document.getElementById('funcFormCard');
const funcForm = document.getElementById('funcForm');

document.getElementById('addFuncBtn').addEventListener('click', () => {
    document.getElementById('funcIdx').value = '';
    document.getElementById('funcFotoAtual').value = '';
    document.getElementById('funcFotoHint').textContent = '';
    funcForm.reset();
    document.getElementById('funcFormTitle').textContent = 'Novo Funcionário';
    funcFormCard.style.display = 'block';
});

document.getElementById('cancelFunc').addEventListener('click', () => {
    funcFormCard.style.display = 'none';
});

funcForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = funcForm.querySelector('button[type="submit"]');
    const id = document.getElementById('funcIdx').value;
    const fotoAtual = document.getElementById('funcFotoAtual').value;
    const fileInput = document.getElementById('funcFoto');
    const file = await compressImage(fileInput.files[0], { maxWidth: 500, maxHeight: 500, quality: 0.85 });

    let foto_url = fotoAtual || null;

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando foto...';
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('equipe-fotos').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar foto: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('equipe-fotos').getPublicUrl(filePath);
        foto_url = publicUrl;
    }

    const item = {
        nome: document.getElementById('funcNome').value.trim(),
        cargo: document.getElementById('funcCargo').value.trim(),
        descricao: document.getElementById('funcDescricao').value.trim() || null,
        foto_url
    };

    const { error } = id
        ? await sb.from('equipe').update(item).eq('id', id)
        : await sb.from('equipe').insert(item);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar';

    if (error) {
        alert('Erro ao salvar funcionário: ' + error.message);
        return;
    }
    funcFormCard.style.display = 'none';
    renderEquipe();
});

async function editFunc(id) {
    const { data: f, error } = await sb.from('equipe').select('*').eq('id', id).single();
    if (error || !f) return;
    document.getElementById('funcIdx').value = f.id;
    document.getElementById('funcNome').value = f.nome;
    document.getElementById('funcCargo').value = f.cargo;
    document.getElementById('funcDescricao').value = f.descricao || '';
    document.getElementById('funcFoto').value = '';
    document.getElementById('funcFotoAtual').value = f.foto_url || '';
    document.getElementById('funcFotoHint').textContent = f.foto_url
        ? 'Já existe uma foto enviada. Escolha uma nova apenas se quiser substituí-la.'
        : '';
    document.getElementById('funcFormTitle').textContent = 'Editar Funcionário';
    funcFormCard.style.display = 'block';
}

async function deleteFunc(id) {
    if (!confirm('Remover este funcionário?')) return;
    const { error } = await sb.from('equipe').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderEquipe();
}

async function renderEquipe() {
    const list = document.getElementById('funcList');
    const { data: equipe, error } = await sb
        .from('equipe')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!equipe || equipe.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum funcionário cadastrado.</div>';
        return;
    }
    list.innerHTML = equipe.map(f => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(f.nome)}</h4>
                <p>${escapeHtml(f.cargo)}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editFunc('${f.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteFunc('${f.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== BASE TERRITORIAL (CIDADES) CRUD ==========
const cidadeFormCard = document.getElementById('cidadeFormCard');
const cidadeForm = document.getElementById('cidadeForm');

document.getElementById('addCidadeBtn').addEventListener('click', () => {
    document.getElementById('cidadeId').value = '';
    cidadeForm.reset();
    document.getElementById('cidadeFormTitle').textContent = 'Nova Cidade';
    cidadeFormCard.style.display = 'block';
});

document.getElementById('cancelCidade').addEventListener('click', () => {
    cidadeFormCard.style.display = 'none';
});

cidadeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cidadeId').value;
    const item = {
        nome: document.getElementById('cidadeNome').value.trim(),
        ordem: parseInt(document.getElementById('cidadeOrdem').value) || 0
    };

    const { error } = id
        ? await sb.from('cidades').update(item).eq('id', id)
        : await sb.from('cidades').insert(item);

    if (error) {
        alert('Erro ao salvar cidade: ' + error.message);
        return;
    }
    cidadeFormCard.style.display = 'none';
    renderCidadesAdmin();
});

async function editCidade(id) {
    const { data: c, error } = await sb.from('cidades').select('*').eq('id', id).single();
    if (error || !c) return;
    document.getElementById('cidadeId').value = c.id;
    document.getElementById('cidadeNome').value = c.nome;
    document.getElementById('cidadeOrdem').value = c.ordem;
    document.getElementById('cidadeFormTitle').textContent = 'Editar Cidade';
    cidadeFormCard.style.display = 'block';
}

async function deleteCidade(id) {
    if (!confirm('Remover esta cidade?')) return;
    const { error } = await sb.from('cidades').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderCidadesAdmin();
}

async function renderCidadesAdmin() {
    const list = document.getElementById('cidadesList');
    const { data: cidades, error } = await sb
        .from('cidades')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!cidades || cidades.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhuma cidade cadastrada.</div>';
        return;
    }
    list.innerHTML = cidades.map(c => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(c.nome)}</h4>
                <p>Ordem: ${c.ordem}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editCidade('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCidade('${c.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== SELETOR DE EMOJI (campo Ícone das Categorias) ==========
const EMOJI_OPCOES = [
    '🏨', '🛏️', '🍽️', '🍴', '🍺', '🍻', '🍷', '🍸', '🍹', '☕',
    '🍕', '🍔', '🌭', '🍰', '🎂', '🍦', '🏪', '🏬', '🏢', '🏠',
    '🛎️', '🚪', '🧹', '🧺', '🧑‍🍳', '👨‍🍳', '🧑‍💼', '💼', '🛍️', '🎉',
    '🎊', '🎶', '🎤', '🌴', '🏖️', '🚗', '🚚', '🅿️', '📍', '⭐',
    '❤️', '✅', '💈', '💇', '💅', '🧖', '🎳', '🎮', '⚽', '🏋️'
];

function setupEmojiPicker(inputId, btnId, panelId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!input || !btn || !panel) return;

    panel.innerHTML = EMOJI_OPCOES.map(e =>
        `<button type="button" class="emoji-picker-option">${e}</button>`
    ).join('');

    panel.querySelectorAll('.emoji-picker-option').forEach(opt => {
        opt.addEventListener('click', () => {
            input.value = opt.textContent;
            panel.classList.remove('open');
        });
    });

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open');
    });
}

setupEmojiPicker('categoriaIcone', 'categoriaIconePickerBtn', 'categoriaIconePicker');

// ========== CATEGORIAS CRUD ==========
const categoriaFormCard = document.getElementById('categoriaFormCard');
const categoriaForm = document.getElementById('categoriaForm');

document.getElementById('addCategoriaBtn').addEventListener('click', () => {
    document.getElementById('categoriaId').value = '';
    categoriaForm.reset();
    document.getElementById('categoriaFormTitle').textContent = 'Nova Categoria';
    categoriaFormCard.style.display = 'block';
});

document.getElementById('cancelCategoria').addEventListener('click', () => {
    categoriaFormCard.style.display = 'none';
});

categoriaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('categoriaId').value;
    const item = {
        nome: document.getElementById('categoriaNome').value.trim(),
        icone: document.getElementById('categoriaIcone').value.trim() || null,
        descricao: document.getElementById('categoriaDescricao').value.trim() || null,
        ordem: parseInt(document.getElementById('categoriaOrdem').value) || 0
    };

    const { error } = id
        ? await sb.from('categorias').update(item).eq('id', id)
        : await sb.from('categorias').insert(item);

    if (error) {
        alert('Erro ao salvar categoria: ' + error.message);
        return;
    }
    categoriaFormCard.style.display = 'none';
    renderCategoriasAdmin();
});

async function editCategoria(id) {
    const { data: c, error } = await sb.from('categorias').select('*').eq('id', id).single();
    if (error || !c) return;
    document.getElementById('categoriaId').value = c.id;
    document.getElementById('categoriaNome').value = c.nome;
    document.getElementById('categoriaIcone').value = c.icone || '';
    document.getElementById('categoriaDescricao').value = c.descricao || '';
    document.getElementById('categoriaOrdem').value = c.ordem;
    document.getElementById('categoriaFormTitle').textContent = 'Editar Categoria';
    categoriaFormCard.style.display = 'block';
}

async function deleteCategoria(id) {
    if (!confirm('Remover esta categoria?')) return;
    const { error } = await sb.from('categorias').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderCategoriasAdmin();
}

async function renderCategoriasAdmin() {
    const list = document.getElementById('categoriasList');
    const { data: categorias, error } = await sb
        .from('categorias')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!categorias || categorias.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhuma categoria cadastrada.</div>';
        return;
    }
    list.innerHTML = categorias.map(c => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${c.icone ? escapeHtml(c.icone) + ' ' : ''}${escapeHtml(c.nome)}</h4>
                <p>Ordem: ${c.ordem}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editCategoria('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCategoria('${c.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== ASSUNTOS CRUD ==========
const assuntoFormCard = document.getElementById('assuntoFormCard');
const assuntoForm = document.getElementById('assuntoForm');

document.getElementById('addAssuntoBtn').addEventListener('click', () => {
    document.getElementById('assuntoId').value = '';
    assuntoForm.reset();
    document.getElementById('assuntoAtivo').checked = true;
    document.getElementById('assuntoFormTitle').textContent = 'Novo Assunto';
    assuntoFormCard.style.display = 'block';
});

document.getElementById('cancelAssunto').addEventListener('click', () => {
    assuntoFormCard.style.display = 'none';
});

assuntoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('assuntoId').value;
    const item = {
        nome: document.getElementById('assuntoNome').value.trim(),
        ordem: parseInt(document.getElementById('assuntoOrdem').value) || 0,
        ativo: document.getElementById('assuntoAtivo').checked
    };

    const { error } = id
        ? await sb.from('assuntos').update(item).eq('id', id)
        : await sb.from('assuntos').insert(item);

    if (error) {
        alert('Erro ao salvar assunto: ' + error.message);
        return;
    }
    assuntoFormCard.style.display = 'none';
    renderAssuntosAdmin();
});

async function editAssunto(id) {
    const { data: a, error } = await sb.from('assuntos').select('*').eq('id', id).single();
    if (error || !a) return;
    document.getElementById('assuntoId').value = a.id;
    document.getElementById('assuntoNome').value = a.nome;
    document.getElementById('assuntoOrdem').value = a.ordem;
    document.getElementById('assuntoAtivo').checked = a.ativo;
    document.getElementById('assuntoFormTitle').textContent = 'Editar Assunto';
    assuntoFormCard.style.display = 'block';
}

async function deleteAssunto(id) {
    if (!confirm('Remover este assunto?')) return;
    const { error } = await sb.from('assuntos').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderAssuntosAdmin();
}

async function renderAssuntosAdmin() {
    const list = document.getElementById('assuntosList');
    const { data: assuntos, error } = await sb
        .from('assuntos')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!assuntos || assuntos.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum assunto cadastrado.</div>';
        return;
    }
    list.innerHTML = assuntos.map(a => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(a.nome)} ${a.ativo ? '' : '<span style="color:#999;font-size:12px;">(inativo)</span>'}</h4>
                <p>Ordem: ${a.ordem}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editAssunto('${a.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAssunto('${a.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== BANNER DE FUNDO (zoom + arraste) ==========
const bannerForm = document.getElementById('bannerForm');
const bannerPreviewWrap = document.getElementById('bannerPreviewWrap');
const bannerPreviewImgs = document.querySelectorAll('.banner-preview-img');
const bannerCropPreview = document.getElementById('bannerCropPreview');
const bannerZoomInput = document.getElementById('bannerZoom');
const bannerZoomValue = document.getElementById('bannerZoomValue');
const bannerZoomHidden = document.getElementById('bannerZoomInput');
const bannerPanXHidden = document.getElementById('bannerPanX');
const bannerPanYHidden = document.getElementById('bannerPanY');

const bannerMobilePreview = document.querySelector('.banner-crop-preview--mobile');
let bannerNaturalSize = null;
let bannerRatios = { desktop: { rx: 1, ry: 1 }, mobile: { rx: 1, ry: 1 } };

// Dimensiona cada prévia pro tamanho real que "cobre" o quadro (igual
// object-fit:cover faria), mas como width/height explícitos em px —
// assim sobra imagem de verdade pra revelar ao arrastar/dar zoom, em
// vez de já vir pré-cortada no tamanho do quadro.
function sizeBannerImgs() {
    if (!bannerNaturalSize) return;
    [bannerCropPreview, bannerMobilePreview].forEach((container, i) => {
        const rect = container.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const scale = Math.max(rect.width / bannerNaturalSize.w, rect.height / bannerNaturalSize.h);
        const w = bannerNaturalSize.w * scale;
        const h = bannerNaturalSize.h * scale;
        bannerPreviewImgs[i].style.width = w + 'px';
        bannerPreviewImgs[i].style.height = h + 'px';
        const ratios = { rx: w / rect.width, ry: h / rect.height };
        if (i === 0) bannerRatios.desktop = ratios; else bannerRatios.mobile = ratios;
    });
}

function setBannerImgSrc(url) {
    bannerPreviewImgs.forEach(img => {
        img.onload = () => {
            bannerNaturalSize = { w: img.naturalWidth, h: img.naturalHeight };
            sizeBannerImgs();
            applyBannerTransform();
        };
        img.src = url;
    });
}

let bannerState = { zoom: 1, panX: 0, panY: 0 };

// Nunca deixa arrastar/zoom revelar espaço vazio: o limite depende de
// quanta imagem "sobra" além do quadro em cada prévia, e usamos o mais
// restritivo das duas (desktop/celular) pra nenhuma delas ficar com buraco.
function maxPanPercent(zoom, r) {
    return Math.max(0, 50 * zoom - 50 / r);
}
function clampBannerPan(zoom, panX, panY) {
    const boundX = Math.min(maxPanPercent(zoom, bannerRatios.desktop.rx), maxPanPercent(zoom, bannerRatios.mobile.rx));
    const boundY = Math.min(maxPanPercent(zoom, bannerRatios.desktop.ry), maxPanPercent(zoom, bannerRatios.mobile.ry));
    return {
        panX: Math.max(-boundX, Math.min(boundX, panX)),
        panY: Math.max(-boundY, Math.min(boundY, panY))
    };
}

function applyBannerTransform() {
    const clamped = clampBannerPan(bannerState.zoom, bannerState.panX, bannerState.panY);
    bannerState.panX = clamped.panX;
    bannerState.panY = clamped.panY;

    const transform = `translate(calc(-50% + ${bannerState.panX}%), calc(-50% + ${bannerState.panY}%)) scale(${bannerState.zoom})`;
    bannerPreviewImgs.forEach(img => { img.style.transform = transform; });
    bannerZoomHidden.value = bannerState.zoom;
    bannerPanXHidden.value = bannerState.panX;
    bannerPanYHidden.value = bannerState.panY;
    bannerZoomInput.value = Math.round(bannerState.zoom * 100);
    bannerZoomValue.textContent = Math.round(bannerState.zoom * 100) + '%';
}

function setBannerState(zoom, panX, panY) {
    bannerState = { zoom, panX, panY };
    applyBannerTransform();
}

bannerZoomInput.addEventListener('input', () => {
    bannerState.zoom = bannerZoomInput.value / 100;
    applyBannerTransform();
});

document.getElementById('resetBannerPositionBtn').addEventListener('click', () => {
    setBannerState(1, 0, 0);
});

// Arraste com mouse e toque
let dragging = false;
let dragStart = { x: 0, y: 0, panX: 0, panY: 0 };

function dragBegin(clientX, clientY) {
    dragging = true;
    dragStart = { x: clientX, y: clientY, panX: bannerState.panX, panY: bannerState.panY };
    bannerCropPreview.classList.add('dragging');
}
function dragMove(clientX, clientY) {
    if (!dragging) return;
    const rect = bannerCropPreview.getBoundingClientRect();
    const deltaXPercent = ((clientX - dragStart.x) / rect.width) * 100;
    const deltaYPercent = ((clientY - dragStart.y) / rect.height) * 100;
    bannerState.panX = dragStart.panX + deltaXPercent;
    bannerState.panY = dragStart.panY + deltaYPercent;
    applyBannerTransform();
}
function dragEnd() {
    dragging = false;
    bannerCropPreview.classList.remove('dragging');
}

bannerCropPreview.addEventListener('mousedown', (e) => { e.preventDefault(); dragBegin(e.clientX, e.clientY); });
window.addEventListener('mousemove', (e) => dragMove(e.clientX, e.clientY));
window.addEventListener('mouseup', dragEnd);

bannerCropPreview.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    dragBegin(t.clientX, t.clientY);
}, { passive: true });
window.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    dragMove(t.clientX, t.clientY);
}, { passive: true });
window.addEventListener('touchend', dragEnd);

window.addEventListener('resize', () => {
    if (document.getElementById('tab-banner').classList.contains('active')) {
        sizeBannerImgs();
        applyBannerTransform();
    }
});

document.getElementById('bannerImagem').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerImgSrc(URL.createObjectURL(file));
    bannerPreviewWrap.style.display = 'block';
    setBannerState(1, 0, 0);
});

async function renderBannerAdmin() {
    const { data, error } = await sb
        .from('configuracoes_site')
        .select('hero_banner_url, hero_banner_zoom, hero_banner_pan_x, hero_banner_pan_y')
        .eq('id', 1)
        .single();

    if (error || !data || !data.hero_banner_url) {
        bannerPreviewWrap.style.display = 'none';
        setBannerState(1, 0, 0);
        return;
    }
    setBannerImgSrc(data.hero_banner_url);
    setBannerState(data.hero_banner_zoom || 1, data.hero_banner_pan_x || 0, data.hero_banner_pan_y || 0);
    bannerPreviewWrap.style.display = 'block';
}

bannerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = bannerForm.querySelector('button[type="submit"]');
    const fileInput = document.getElementById('bannerImagem');
    const file = await compressImage(fileInput.files[0], { maxWidth: 1920, maxHeight: 1920, quality: 0.8 });
    const transformData = {
        hero_banner_zoom: bannerState.zoom,
        hero_banner_pan_x: bannerState.panX,
        hero_banner_pan_y: bannerState.panY
    };

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('banner-fundo').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar imagem: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('banner-fundo').getPublicUrl(filePath);

        const { error } = await sb.from('configuracoes_site')
            .update({ hero_banner_url: publicUrl, ...transformData })
            .eq('id', 1);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar';
        if (error) { alert('Erro ao salvar: ' + error.message); return; }
    } else {
        // Sem imagem nova: só atualiza zoom/posição da imagem já cadastrada
        const { error } = await sb.from('configuracoes_site').update(transformData).eq('id', 1);
        if (error) { alert('Erro ao salvar: ' + error.message); return; }
    }

    document.getElementById('bannerImagemHint').textContent = 'Banner atualizado! Confira na página principal.';
    fileInput.value = '';
    renderBannerAdmin();
});

document.getElementById('removeBannerBtn').addEventListener('click', async () => {
    if (!confirm('Remover o banner de fundo? O site volta a mostrar só o degradê, sem foto.')) return;
    const { error } = await sb.from('configuracoes_site').update({ hero_banner_url: null }).eq('id', 1);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderBannerAdmin();
});

// ========== RENDER ALL ==========
function renderAll() {
    renderConvenios();
    renderCursosAdmin();
    renderConvencoes();
    renderComunicadosAdmin();
    renderModelosAdmin();
    renderNoticiasAdmin();
    renderVagasAdmin();
    renderEquipe();
    renderCidadesAdmin();
    renderCategoriasAdmin();
    renderAssuntosAdmin();
    renderBannerAdmin();
}
