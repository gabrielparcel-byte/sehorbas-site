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

// ============================================================
// COMPRESSÃO DE IMAGEM — redimensiona/comprime no navegador antes do
// upload (evita subir fotos de celular/drone com vários MB pro
// Supabase). PDFs e arquivos que não são imagem passam direto.
// ============================================================
function compressImage(file, options) {
    options = options || {};
    const maxWidth = options.maxWidth || 1600;
    const maxHeight = options.maxHeight || 1600;
    const quality = options.quality || 0.82;

    if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/gif') {
        return Promise.resolve(file);
    }

    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
            const width = Math.max(1, Math.round(img.width * ratio));
            const height = Math.max(1, Math.round(img.height * ratio));

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);

            // PNG mantém PNG (preserva transparência de logos); o resto vira JPEG
            const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

            canvas.toBlob((blob) => {
                if (!blob || blob.size >= file.size) {
                    resolve(file); // compressão não ajudou, mantém o original
                    return;
                }
                const ext = outType === 'image/png' ? 'png' : 'jpg';
                const nome = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
                resolve(new File([blob], nome, { type: outType }));
            }, outType, quality);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
        };
        img.src = objectUrl;
    });
}
