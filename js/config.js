/**
 * Supabase 설정 — 본인 값으로 바꾸세요.
 * Dashboard > Project Settings > API 에서 확인:
 *   - Project URL
 *   - anon (public) key 또는 publishable key  ← 공개되어도 되는 키입니다 (보안은 RLS가 담당)
 * ⚠ service_role / secret 키는 절대 여기에 넣지 마세요.
 */
const CONFIG = {
  SUPABASE_URL: "https://kpangpshjmbspmgbavwe.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_7m7o3cSywItIcQMAx2CIIg_p1O3qPam",
  ADMIN_EMAIL: "hnkim369@gmail.com",   // 관리자 계정 이메일 (비밀번호만 로그인창에서 입력)
  BUCKET: "images",
};
CONFIG.READY = !/YOUR-/.test(CONFIG.SUPABASE_URL + CONFIG.SUPABASE_ANON_KEY);
