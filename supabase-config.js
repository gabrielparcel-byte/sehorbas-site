// ============================================================
// CONFIGURAÇÃO SUPABASE
// Preencha com os dados do seu projeto:
// Supabase Dashboard > Project Settings > API
// ============================================================
const SUPABASE_URL = 'https://ramswvctsypojgfjfbkf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZgxDIe8nw0mdIuUjZ-iudw_SfU6KgZm';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
