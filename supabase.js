/** Supabase 클라이언트 (config.js 다음에 로드) */
const sb = CONFIG.READY
  ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
  : null;
