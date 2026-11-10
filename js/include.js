/**
 * layout.html 을 #layout 자리에 불러오는 include 스크립트
 * ⚠ fetch 를 쓰기 때문에 file:// 로 열면 동작하지 않습니다.
 *    VS Code "Live Server" 또는 `npx serve` / `python -m http.server` 로 열어 주세요.
 */
(async () => {
  const root = document.getElementById("layout");
  if (!root) return;

  try {
    const res = await fetch("layout.html");
    if (!res.ok) throw new Error(res.status);
    root.innerHTML = await res.text();
  } catch (e) {
    root.innerHTML = '<p style="padding:24px">layout.html 을 불러오지 못했어요. 로컬 서버로 실행해 주세요.</p>';
    return;
  }

  // 현재 페이지 메뉴 활성화
  const page = document.body.dataset.page;
  root.querySelectorAll("[data-nav]").forEach((a) => {
    const on = a.dataset.nav === page;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "page");
  });

  // 검색어 유지 (검색 페이지에서)
  const q = new URLSearchParams(location.search).get("q");
  if (q) root.querySelector(".searchbar input").value = q;

  // 관리자 로그인 모달
  const modal = root.querySelector("#loginModal");
  const form = root.querySelector("#loginForm");
  const pw = root.querySelector("#loginPw");
  const err = root.querySelector("#loginError");
  let nextUrl = "upload.html";

  root.querySelectorAll("[data-requires-admin]").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (Auth.isAdmin()) return;       // 이미 로그인 → 그냥 이동
      e.preventDefault();
      nextUrl = a.getAttribute("href");
      pw.value = ""; err.hidden = true;
      modal.showModal();
      pw.focus();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (await Auth.login(pw.value)) {
      modal.close();
      location.href = nextUrl;
    } else {
      err.hidden = false;
      pw.select();
    }
  });
  root.querySelector("#loginCancel").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  root.querySelector("#logoutBtn").addEventListener("click", async () => {
    await Auth.logout();
    // 업로드 페이지에 있었다면 홈으로
    if (page === "upload") location.href = "index.html";
  });

  document.dispatchEvent(new CustomEvent("layout-ready"));
})();
