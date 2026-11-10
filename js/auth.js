/**
 * 관리자 인증 — Supabase Auth (이메일/비밀번호)
 * 이메일은 CONFIG.ADMIN_EMAIL 로 고정, 로그인창에서는 비밀번호만 입력합니다.
 * 세션은 브라우저에 유지되고, 실제 권한 검사는 서버(RLS)가 합니다.
 * 화면의 수정/삭제 버튼 표시는 편의 기능일 뿐이에요.
 */
const Auth = (() => {
  let admin = false;
  let resolveReady;
  const ready = new Promise((r) => (resolveReady = r));

  const isAdmin = () => admin;

  const apply = (session) => {
    admin = !!session && session.user?.email === CONFIG.ADMIN_EMAIL;
    document.body.classList.toggle("is-admin", admin);
    document.dispatchEvent(new CustomEvent("admin-changed"));
  };

  const login = async (pw) => {
    if (!sb) return false;
    const { error } = await sb.auth.signInWithPassword({ email: CONFIG.ADMIN_EMAIL, password: pw });
    return !error;
  };

  const logout = async () => { if (sb) await sb.auth.signOut(); };

  const init = async () => {
    if (!sb) { resolveReady(); return; }
    const { data } = await sb.auth.getSession();
    apply(data.session);
    resolveReady();
    sb.auth.onAuthStateChange((_e, session) => apply(session));
  };

  document.addEventListener("DOMContentLoaded", init);
  return { isAdmin, login, logout, ready };
})();
