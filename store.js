/**
 * 게시글 저장소 — Supabase (DB: posts / Storage: images)
 * 화면에서 쓰는 글 구조: { id, title, desc, tags[], img, w, h, createdAt(ms) }
 */
const Store = (() => {
  const toPost = (r) => ({
    id: r.id,
    title: r.title,
    desc: r.description,
    tags: r.tags || [],
    img: r.img_url,
    imgPath: r.img_path,
    w: r.w,
    h: r.h,
    createdAt: new Date(r.created_at).getTime(),
  });

  const bucket = () => sb.storage.from(CONFIG.BUCKET);
  const must = ({ data, error }) => { if (error) throw error; return data; };

  async function uploadImage(image) {          // image: { blob, ext }
    const path = `${crypto.randomUUID()}.${image.ext}`;
    must(await bucket().upload(path, image.blob, {
      contentType: image.blob.type,
      cacheControl: "31536000",                // 파일명이 매번 새로 생성되므로 1년 캐시 OK
      upsert: false,
    }));
    return { path, url: bucket().getPublicUrl(path).data.publicUrl };
  }

  return {
    async getAll() {
      const rows = must(await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(200));
      return rows.map(toPost);
    },

    async get(id) {
      const row = must(await sb.from("posts").select("*").eq("id", id).maybeSingle());
      return row ? toPost(row) : null;
    },

    async remove(id) {
      const row = must(await sb.from("posts").select("img_path").eq("id", id).maybeSingle());
      must(await sb.from("posts").delete().eq("id", id));
      if (row?.img_path) await bucket().remove([row.img_path]);   // 파일 삭제 실패는 무시
    },

    /** 새 글: image 필수 / 수정: image 는 교체할 때만 */
    async save({ id, title, desc, tags, image }) {
      const fields = { title, description: desc, tags };

      if (!id) {
        const up = await uploadImage(image);
        try {
          must(await sb.from("posts").insert({ ...fields, img_url: up.url, img_path: up.path, w: image.w, h: image.h }));
        } catch (e) {
          await bucket().remove([up.path]);    // 글 저장 실패 시 고아 파일 정리
          throw e;
        }
        return;
      }

      let oldPath = null;
      if (image) {
        oldPath = must(await sb.from("posts").select("img_path").eq("id", id).maybeSingle())?.img_path;
        const up = await uploadImage(image);
        Object.assign(fields, { img_url: up.url, img_path: up.path, w: image.w, h: image.h });
      }
      must(await sb.from("posts").update(fields).eq("id", id));
      if (oldPath) await bucket().remove([oldPath]);
    },
  };
})();
