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
                <h4>${c.nome}</h4>
                <p>${c.descricao}</p>
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
                <h4>${c.titulo}</h4>
                <p>${c.descricao || 'Sem descrição'}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editConvencao('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteConvencao('${c.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== EQUIPE CRUD ==========
const funcFormCard = document.getElementById('funcFormCard');
const funcForm = document.getElementById('funcForm');

document.getElementById('addFuncBtn').addEventListener('click', () => {
    document.getElementById('funcIdx').value = '';
    funcForm.reset();
    document.getElementById('funcFormTitle').textContent = 'Novo Funcionário';
    funcFormCard.style.display = 'block';
});

document.getElementById('cancelFunc').addEventListener('click', () => {
    funcFormCard.style.display = 'none';
});

funcForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('funcIdx').value;
    const item = {
        nome: document.getElementById('funcNome').value.trim(),
        cargo: document.getElementById('funcCargo').value.trim(),
        descricao: document.getElementById('funcDescricao').value.trim() || null
    };

    const { error } = id
        ? await sb.from('equipe').update(item).eq('id', id)
        : await sb.from('equipe').insert(item);

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
                <h4>${f.nome}</h4>
                <p>${f.cargo}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editFunc('${f.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteFunc('${f.id}')">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== RENDER ALL ==========
function renderAll() {
    renderConvenios();
    renderConvencoes();
    renderEquipe();
}
