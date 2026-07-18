// ========== DATA HELPERS ==========
function getData(key, fallback) {
    try {
        const d = localStorage.getItem(`sehorbas_${key}`);
        return d ? JSON.parse(d) : fallback;
    } catch { return fallback; }
}
function setData(key, value) {
    localStorage.setItem(`sehorbas_${key}`, JSON.stringify(value));
}

// ========== AUTH ==========
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'sehorbas2026';

function isLoggedIn() {
    return sessionStorage.getItem('sehorbas_auth') === 'true';
}

const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');

function showPanel() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    renderAll();
}

if (isLoggedIn()) showPanel();

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem('sehorbas_auth', 'true');
        showPanel();
    } else {
        document.getElementById('loginError').textContent = 'Usuário ou senha incorretos.';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('sehorbas_auth');
    location.reload();
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
    convenioForm.reset();
    document.getElementById('convenioFormTitle').textContent = 'Novo Convênio';
    convenioFormCard.style.display = 'block';
});

document.getElementById('cancelConvenio').addEventListener('click', () => {
    convenioFormCard.style.display = 'none';
});

convenioForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const convenios = getData('convenios', []);
    const id = document.getElementById('convenioId').value;
    const item = {
        nome: document.getElementById('convenioNome').value.trim(),
        endereco: document.getElementById('convenioEndereco').value.trim(),
        telefone: document.getElementById('convenioTelefone').value.trim(),
        descricao: document.getElementById('convenioDescricao').value.trim(),
        logo: document.getElementById('convenioLogo').value.trim()
    };

    if (id !== '') {
        convenios[parseInt(id)] = item;
    } else {
        convenios.push(item);
    }
    setData('convenios', convenios);
    convenioFormCard.style.display = 'none';
    renderConvenios();
});

function editConvenio(idx) {
    const convenios = getData('convenios', []);
    const c = convenios[idx];
    document.getElementById('convenioId').value = idx;
    document.getElementById('convenioNome').value = c.nome;
    document.getElementById('convenioEndereco').value = c.endereco || '';
    document.getElementById('convenioTelefone').value = c.telefone || '';
    document.getElementById('convenioDescricao').value = c.descricao;
    document.getElementById('convenioLogo').value = c.logo || '';
    document.getElementById('convenioFormTitle').textContent = 'Editar Convênio';
    convenioFormCard.style.display = 'block';
}

function deleteConvenio(idx) {
    if (!confirm('Remover este convênio?')) return;
    const convenios = getData('convenios', []);
    convenios.splice(idx, 1);
    setData('convenios', convenios);
    renderConvenios();
}

function renderConvenios() {
    const list = document.getElementById('conveniosList');
    const convenios = getData('convenios', []);
    if (convenios.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum convênio cadastrado.</div>';
        return;
    }
    list.innerHTML = convenios.map((c, i) => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${c.nome}</h4>
                <p>${c.descricao}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editConvenio(${i})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteConvenio(${i})">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== CONVENÇÕES CRUD ==========
const convencaoFormCard = document.getElementById('convencaoFormCard');
const convencaoForm = document.getElementById('convencaoForm');

document.getElementById('addConvencaoBtn').addEventListener('click', () => {
    document.getElementById('convencaoId').value = '';
    convencaoForm.reset();
    document.getElementById('convencaoFormTitle').textContent = 'Nova Convenção';
    convencaoFormCard.style.display = 'block';
});

document.getElementById('cancelConvencao').addEventListener('click', () => {
    convencaoFormCard.style.display = 'none';
});

convencaoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const convencoes = getData('convencoes', []);
    const id = document.getElementById('convencaoId').value;
    const item = {
        titulo: document.getElementById('convencaoTitulo').value.trim(),
        descricao: document.getElementById('convencaoDescricao').value.trim(),
        arquivo: document.getElementById('convencaoArquivo').value.trim()
    };

    if (id !== '') {
        convencoes[parseInt(id)] = item;
    } else {
        convencoes.push(item);
    }
    setData('convencoes', convencoes);
    convencaoFormCard.style.display = 'none';
    renderConvencoes();
});

function editConvencao(idx) {
    const convencoes = getData('convencoes', []);
    const c = convencoes[idx];
    document.getElementById('convencaoId').value = idx;
    document.getElementById('convencaoTitulo').value = c.titulo;
    document.getElementById('convencaoDescricao').value = c.descricao || '';
    document.getElementById('convencaoArquivo').value = c.arquivo || '';
    document.getElementById('convencaoFormTitle').textContent = 'Editar Convenção';
    convencaoFormCard.style.display = 'block';
}

function deleteConvencao(idx) {
    if (!confirm('Remover esta convenção?')) return;
    const convencoes = getData('convencoes', []);
    convencoes.splice(idx, 1);
    setData('convencoes', convencoes);
    renderConvencoes();
}

function renderConvencoes() {
    const list = document.getElementById('convencoesList');
    const convencoes = getData('convencoes', []);
    if (convencoes.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhuma convenção cadastrada.</div>';
        return;
    }
    list.innerHTML = convencoes.map((c, i) => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${c.titulo}</h4>
                <p>${c.descricao || 'Sem descrição'}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editConvencao(${i})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteConvencao(${i})">Remover</button>
            </div>
        </div>
    `).join('');
}

// ========== EQUIPE CRUD ==========
const funcFormCard = document.getElementById('funcFormCard');
const funcForm = document.getElementById('funcForm');

const DEFAULT_EQUIPE = [
    { nome: 'João Candido Nogueira', cargo: 'Presidente' },
    { nome: 'Antonio Roberto Ghion', cargo: 'Tesoureiro' }
];

function getEquipe() {
    return getData('equipe', DEFAULT_EQUIPE);
}

document.getElementById('addFuncBtn').addEventListener('click', () => {
    document.getElementById('funcIdx').value = '';
    funcForm.reset();
    document.getElementById('funcFormTitle').textContent = 'Novo Funcionário';
    funcFormCard.style.display = 'block';
});

document.getElementById('cancelFunc').addEventListener('click', () => {
    funcFormCard.style.display = 'none';
});

funcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const equipe = getEquipe();
    const idx = document.getElementById('funcIdx').value;
    const item = {
        nome: document.getElementById('funcNome').value.trim(),
        cargo: document.getElementById('funcCargo').value.trim()
    };

    if (idx !== '') {
        equipe[parseInt(idx)] = item;
    } else {
        equipe.push(item);
    }
    setData('equipe', equipe);
    funcFormCard.style.display = 'none';
    renderEquipe();
});

function editFunc(idx) {
    const equipe = getEquipe();
    const f = equipe[idx];
    document.getElementById('funcIdx').value = idx;
    document.getElementById('funcNome').value = f.nome;
    document.getElementById('funcCargo').value = f.cargo;
    document.getElementById('funcFormTitle').textContent = 'Editar Funcionário';
    funcFormCard.style.display = 'block';
}

function deleteFunc(idx) {
    if (!confirm('Remover este funcionário?')) return;
    const equipe = getEquipe();
    equipe.splice(idx, 1);
    setData('equipe', equipe);
    renderEquipe();
}

function renderEquipe() {
    const list = document.getElementById('funcList');
    const equipe = getEquipe();
    if (equipe.length === 0) {
        list.innerHTML = '<div class="admin-list-empty">Nenhum funcionário cadastrado.</div>';
        return;
    }
    list.innerHTML = equipe.map((f, i) => `
        <div class="admin-list-item">
            <div class="admin-list-info">
                <h4>${f.nome}</h4>
                <p>${f.cargo}</p>
            </div>
            <div class="admin-list-actions">
                <button class="btn btn-outline btn-sm" onclick="editFunc(${i})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteFunc(${i})">Remover</button>
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
