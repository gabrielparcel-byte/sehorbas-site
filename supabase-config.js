// ============================================================
// CONFIGURAÇÃO SUPABASE
// Preencha com os dados do seu projeto:
// Supabase Dashboard > Project Settings > API
// ============================================================
const SUPABASE_URL = 'https://ramswvctsypojgfjfbkf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZgxDIe8nw0mdIuUjZ-iudw_SfU6KgZm';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// HELPERS DE SEGURANÇA — usar sempre que inserir texto/URLs vindos
// do banco em innerHTML, para evitar XSS armazenado.
// ============================================================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

// Só permite URLs http/https — bloqueia esquemas perigosos como javascript:
function safeUrl(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url, window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return escapeHtml(parsed.href);
        }
    } catch (e) { /* URL inválida */ }
    return '';
}
