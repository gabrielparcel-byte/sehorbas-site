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
    const file = fileInput.files[0];

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

// ========== ACORDOS CRUD ==========
const acordoFormCard = document.getElementById('acordoFormCard');
const acordoForm = document.getElementById('acordoForm');

document.getElementById('addAcordoBtn').addEventListener('click', () => {
    document.getElementById('acordoId').value = '';
    document.getElementById('acordoArquivoAtual').value = '';
    document.getElementById('acordoArquivoHint').textContent = '';
    acordoForm.reset();
    document.getElementById('acordoFormTitle').textContent = 'Novo Acordo';
    acordoFormCard.style.display = 'block';
});

document.getElementById('cancelAcordo').addEventListener('click', () => {
    acordoFormCard.style.display = 'none';
});

acordoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = acordoForm.querySelector('button[type="submit"]');
    const id = document.getElementById('acordoId').value;
    const arquivoAtual = document.getElementById('acordoArquivoAtual').value;
    const fileInput = document.getElementById('acordoArquivo');
    const file = fileInput.files[0];

    let arquivo_url = arquivoAtual || null;

    if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando arquivo...';
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await sb.storage.from('acordos-arquivos').upload(filePath, file);
        if (uploadError) {
            alert('Erro ao enviar arquivo: ' + uploadError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
            return;
        }
        const { data: { publicUrl } } = sb.storage.from('acordos-arquivos').getPublicUrl(filePath);
        arquivo_url = publicUrl;
    }

    const item = {
        titulo: document.getElementById('acordoTitulo').value.trim(),
        descricao: document.getElementById('acordoDescricao').value.trim(),
        arquivo_url
    };

    const { error } = id
        ? await sb.from('acordos').update(item).eq('id', id)
        : await sb.from('acordos').insert(item);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar';

    if (error) {
        alert('Erro ao salvar acordo: ' + error.message);
        return;
    }
    acordoFormCard.style.display = 'none';
    renderAcordosAdmin();
});

async function editAcordo(id) {
    const { data: c, error } = await sb.from('acordos').select('*').eq('id', id).single();
    if (error || !c) return;
    document.getElementById('acordoId').value = c.id;
    document.getElementById('acordoTitulo').value = c.titulo;
    document.getElementById('acordoDescricao').value = c.descricao || '';
    document.getElementById('acordoArquivo').value = '';
    document.getElementById('acordoArquivoAtual').value = c.arquivo_url || '';
    document.getElementById('acordoArquivoHint').textContent = c.arquivo_url
        ? 'Já existe um arquivo enviado. Escolha um novo apenas se quiser substituí-lo.'
        : '';
    document.getElementById('acordoFormTitle').textContent = 'Editar Acordo';
    acordoFormCard.style.display = 'block';
}

async function deleteAcordo(id) {
    if (!confirm('Remover este acordo?')) return;
    const { error } = await sb.from('acordos').delete().eq('id', id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    renderAcordosAdmin();
}

async function renderAcordosAdmin() {
    const list = document.getElementById('acordosList');
    const { data: acordos, error } = await sb
        .from('acordos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="admin-list-empty">Erro ao carregar: ${error.message}</div>`;
        return;
    }
    if (!acordos || acordos.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum acordo cadastrado.</div>';
        return;
    }
    list.innerHTML = acordos.map(c => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${escapeHtml(c.titulo)}</h4>
                <p>${escapeHtml(c.descricao || 'Sem descrição')}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editAcordo('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAcordo('${c.id}')">Remover</button>
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
    const file = fileInput.files[0];

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

// ========== RENDER ALL ==========
function renderAll() {
    renderConvenios();
    renderConvencoes();
    renderAcordosAdmin();
    renderModelosAdmin();
    renderNoticiasAdmin();
    renderEquipe();
    renderAssuntosAdmin();
}
