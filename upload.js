/** 글올리기 / 수정 (관리자 전용) */
(async () => {
  const $ = (id) => document.getElementById(id);
  const form = $("uploadForm"), file = $("file"), dz = $("dropzone");
  const preview = $("preview"), dzEmpty = $("dzEmpty"), info = $("fileInfo");
  const errEl = $("formError"), submitBtn = $("submitBtn");

  const MAX_INPUT = 25 * 1024 * 1024;   // 원본 25MB 까지 허용 (압축 후 5MB 이하로 저장)
  const MAX_WIDTH = 1200;
  const editId = new URLSearchParams(location.search).get("id");
  let image = null;                     // { blob, ext, w, h }

  const showError = (msg) => { errEl.textContent = msg; errEl.hidden = !msg; };

  // ----- 접근 제한: 로그인한 관리자만 -----
  await Auth.ready;
  if (!CONFIG.READY) { showError("js/config.js 에 Supabase 정보를 먼저 입력해 주세요."); form.querySelectorAll("input,textarea,button").forEach((e) => (e.disabled = true)); return; }
  if (!Auth.isAdmin()) { location.replace("index.html"); return; }

  // ----- 이미지 압축 (캔버스 → WebP, 미지원 브라우저는 JPEG) -----
  async function compress(f) {
    let bmp;
    try { bmp = await createImageBitmap(f, { imageOrientation: "from-image" }); }
    catch { throw new Error("이미지를 읽을 수 없어요. 다른 파일을 선택해 주세요."); }

    const scale = Math.min(1, MAX_WIDTH / bmp.width);
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
    bmp.close?.();

    const toBlob = (type, q) => new Promise((res) => canvas.toBlob(res, type, q));
    let blob = await toBlob("image/webp", 0.82);
    let ext = "webp";
    if (!blob || blob.type !== "image/webp") { blob = await toBlob("image/jpeg", 0.85); ext = "jpg"; }
    if (!blob) throw new Error("이미지를 변환하지 못했어요.");
    return { blob, ext, w, h };
  }

  async function handleFile(f) {
    showError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return showError("이미지 파일만 올릴 수 있어요.");
    if (f.size > MAX_INPUT) return showError("파일이 너무 커요. 25MB 이하 이미지를 선택해 주세요.");
    info.textContent = "이미지 처리 중…";
    try {
      image = await compress(f);
      if (image.blob.size > 5 * 1024 * 1024) { image = null; throw new Error("압축 후에도 5MB를 넘어요. 더 작은 이미지를 선택해 주세요."); }
      if (preview.src.startsWith("blob:")) URL.revokeObjectURL(preview.src);
      preview.src = URL.createObjectURL(image.blob);
      preview.hidden = false; dzEmpty.hidden = true;
      info.textContent = `${image.w}×${image.h} · ${(image.blob.size / 1024).toFixed(0)}KB`;
    } catch (e) {
      info.textContent = "";
      showError(e.message);
    }
  }

  file.addEventListener("change", () => handleFile(file.files[0]));
  dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.click(); } });
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("drag"); }));
  dz.addEventListener("drop", (e) => handleFile(e.dataTransfer.files[0]));
  document.addEventListener("paste", (e) => {                 // 클립보드 이미지 붙여넣기
    const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/"));
    if (f) handleFile(f);
  });

  // ----- 수정 모드: 기존 값 채우기 -----
  if (editId) {
    $("formTitle").textContent = "글 수정";
    submitBtn.textContent = "저장";
    try {
      const p = await Store.get(editId);
      if (!p) { showError("수정할 글을 찾을 수 없어요."); submitBtn.disabled = true; return; }
      $("title").value = p.title;
      $("desc").value = p.desc;
      $("tags").value = p.tags.join(", ");
      preview.src = p.img; preview.hidden = false; dzEmpty.hidden = true;
      info.textContent = "새 이미지를 선택하면 교체돼요. 선택하지 않으면 기존 이미지를 유지해요.";
    } catch (e) {
      console.error(e); showError("글을 불러오지 못했어요.");
    }
  }

  // ----- 저장 -----
  const parseTags = (s) =>
    [...new Set(s.split(/[,\n]/).map((t) => t.trim().replace(/^#+/, "")).filter(Boolean).map((t) => t.slice(0, 20)))].slice(0, 10);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    const title = $("title").value.trim();
    if (!title) { $("title").focus(); return showError("제목을 입력해 주세요."); }
    if (!editId && !image) return showError("이미지를 선택해 주세요.");

    submitBtn.disabled = true;
    const label = submitBtn.textContent;
    submitBtn.textContent = "저장 중…";
    try {
      await Store.save({ id: editId, title, desc: $("desc").value.trim(), tags: parseTags($("tags").value), image });
      location.href = "index.html";
    } catch (err) {
      console.error(err);
      showError("저장하지 못했어요. 로그인이 만료되었거나 네트워크 문제일 수 있어요. 다시 시도해 주세요.");
      submitBtn.disabled = false;
      submitBtn.textContent = label;
    }
  });
})();
