// Supabase Configuration
const SUPABASE_URL = 'https://bemeygiosjhwhjjcdhce.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3BkOx3KnibKiYHtyb6GJvg_rocSigl4'
// Initialize Supabase client
window.supabaseClient = null;
if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn('Supabase library not loaded. Check that supabase.min.js is loaded before config.js');
}
