/** 홈: 핀터레스트 스타일 카드 피드 (Supabase 연동) */
(() => {
  const feed = document.getElementById("feed");
  const empty = document.getElementById("empty");
  const status = document.getElementById("status");
  const modal = document.getElementById("pinModal");
  let posts = [];
  let currentId = null;

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (t) => new Date(t).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const ICON_EDIT = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  const ICON_DEL = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M7 7l1 13h8l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const setStatus = (msg) => { status.textContent = msg || ""; status.hidden = !msg; };

  function cardHTML(p) {
    const ratio = p.w && p.h ? `${p.w} / ${p.h}` : "3 / 4";
    return `
      <article class="pin" data-id="${esc(p.id)}">
        <button type="button" class="pin-media" style="aspect-ratio:${ratio}" aria-label="${esc(p.title)} 자세히 보기">
          <img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy" decoding="async">
        </button>
        <div class="pin-meta">
          <h3 class="pin-title">${esc(p.title)}</h3>
          <div class="pin-tools admin-only">
            <button type="button" class="icon-btn" data-act="edit" aria-label="수정" title="수정">${ICON_EDIT}</button>
            <button type="button" class="icon-btn danger" data-act="delete" aria-label="삭제" title="삭제">${ICON_DEL}</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    feed.innerHTML = posts.map(cardHTML).join("");
    empty.hidden = posts.length > 0;
    feed.querySelectorAll("img").forEach((img) => {
      const done = () => img.classList.add("loaded");
      img.complete ? done() : (img.onload = img.onerror = done);
    });
  }

  async function load() {
    if (!CONFIG.READY) {
      setStatus("js/config.js 에 Supabase URL과 키를 입력해 주세요.");
      return;
    }
    setStatus("불러오는 중…");
    try {
      posts = await Store.getAll();
      setStatus("");
      render();
    } catch (e) {
      console.error(e);
      setStatus("글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요. (무료 프로젝트가 일시 정지되었을 수도 있어요)");
    }
  }

  function editPost(id) {
    if (!Auth.isAdmin()) return;
    location.href = `upload.html?id=${encodeURIComponent(id)}`;
  }

  async function deletePost(id) {
    if (!Auth.isAdmin()) return;
    if (!confirm("이 글을 삭제할까요? 삭제하면 되돌릴 수 없어요.")) return;
    try {
      await Store.remove(id);
      posts = posts.filter((p) => p.id !== id);
      if (modal.open) modal.close();
      render();
    } catch (e) {
      console.error(e);
      alert("삭제하지 못했어요. 로그인이 만료되었을 수 있어요. 다시 로그인해 주세요.");
    }
  }

  function openDetail(id) {
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    currentId = id;
    const img = document.getElementById("pinImg");
    img.src = p.img; img.alt = p.title;
    document.getElementById("pinTitle").textContent = p.title;
    document.getElementById("pinDesc").textContent = p.desc || "";
    document.getElementById("pinTags").textContent = p.tags.map((t) => "#" + t).join(" ");
    document.getElementById("pinDate").textContent = fmtDate(p.createdAt);
    modal.showModal();
  }

  feed.addEventListener("click", (e) => {
    const card = e.target.closest(".pin");
    if (!card) return;
    const id = card.dataset.id;
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "edit") return editPost(id);
    if (act === "delete") return deletePost(id);
    if (e.target.closest(".pin-media")) openDetail(id);
  });

  document.getElementById("pinClose").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  document.getElementById("pinEdit").addEventListener("click", () => editPost(currentId));
  document.getElementById("pinDelete").addEventListener("click", () => deletePost(currentId));

  load();
})();
