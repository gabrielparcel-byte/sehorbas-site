// ============================================================
// CONFIGURAÇÃO SUPABASE
// Preencha com os dados do seu projeto:
// Supabase Dashboard > Project Settings > API
// ============================================================
const SUPABASE_URL = 'COLE_AQUI_A_PROJECT_URL'; // ex: https://xxxxxxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_ANON_PUBLIC_KEY'; // a chave "anon / public", NUNCA a "service_role"

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
