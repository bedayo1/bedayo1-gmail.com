/* case-share.html 전용 데이터 & 로직 */
/* 자유게시판(board.js)과 구조는 같지만, 글/댓글 본문이 일반 텍스트가 아니라
   common.js 의 공용 사진 에디터(insertPhotoBlock 등)로 만든 리치 HTML(bodyHtml)이다.
   사진을 드래그하거나 붙여넣으면 그 자리에 삽입되는 네이버 카페 글쓰기 스타일. */

let casePosts = loadData("casePosts", [
  {
    id: uid(),
    title: "출입문 고장 시 임시조치 사례 공유합니다",
    author: "김기관",
    date: formatDate(new Date()),
    bodyHtml: "<div>정차 중 출입문 안내등이 계속 점멸하는 상황이 있었습니다. 수동콕을 조작해 임시 조치한 뒤 관제에 즉시 보고했습니다.</div>",
    comments: [],
  },
]);
saveData("casePosts", casePosts);

// 댓글 작성자 기본값으로 쓸 로그인한 직원 이름 (없으면 빈 값 — 관리자 세션 등)
let profile = loadData("profile", null);

/* ---------- CRUD ---------- */

function getAllCasePosts() {
  return casePosts;
}

function getCasePost(id) {
  return casePosts.find((p) => p.id === id);
}

function addCasePost(data) {
  casePosts.push({ id: uid(), date: formatDate(new Date()), comments: [], ...data });
  saveData("casePosts", casePosts);
  renderCaseList();
}

function updateCasePost(id, data) {
  casePosts = casePosts.map((p) => (p.id === id ? { ...p, ...data } : p));
  saveData("casePosts", casePosts);
  renderCaseList();
}

function deleteCasePost(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  casePosts = casePosts.filter((p) => p.id !== id);
  saveData("casePosts", casePosts);
  renderCaseList();
}

/* ---------- 댓글 ---------- */

function addCaseComment(postId, author, bodyHtml) {
  const post = getCasePost(postId);
  if (!post) return;
  if (!post.comments) post.comments = [];
  post.comments.push({ id: uid(), author, bodyHtml, date: formatDate(new Date()) });
  saveData("casePosts", casePosts);
}

function deleteCaseComment(postId, commentId) {
  const post = getCasePost(postId);
  if (!post || !post.comments) return;
  post.comments = post.comments.filter((c) => c.id !== commentId);
  saveData("casePosts", casePosts);
}

/* ---------- 렌더링 ---------- */

const casePager = { page: 0, pageSize: 10 };
const caseSearch = { field: "title", query: "" };

function renderCaseList() {
  const tbody = document.getElementById("case-tbody");
  let reversed = [...casePosts].reverse();
  reversed = filterByTitleContent(reversed, caseSearch, (p) => p.title, (p) => p.bodyHtml);

  renderListSearch("case-search", caseSearch, () => {
    casePager.page = 0;
    renderCaseList();
  });
  const skipPaging = !!caseSearch.query.trim() || isAppViewport();

  if (reversed.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">등록된 사례가 없습니다.</div></td></tr>`;
    renderPaginationOrAll("case-pager", casePager, 0, renderCaseList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(reversed, casePager, skipPaging);

  tbody.innerHTML = pageItems
    .map(
      (p) => `
      <tr>
        <td class="title-cell"><a data-action="detail" data-id="${p.id}">${p.title}</a>${p.comments && p.comments.length ? ` <span class="badge neutral">💬 ${p.comments.length}</span>` : ""}${renderViewsLikesBadge(p)}</td>
        <td>${p.author}</td>
        <td class="mobile-hide">${p.date}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${p.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${p.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='detail']").forEach((el) => {
    el.addEventListener("click", () => openDetail(el.dataset.id));
  });
  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteCasePost(btn.dataset.id));
  });

  renderPaginationOrAll("case-pager", casePager, reversed.length, renderCaseList, skipPaging);
}

/* ---------- 상세보기 (본문 + 댓글) ---------- */

let currentDetailId = null;

function renderCaseCommentList(post) {
  const comments = post.comments || [];
  document.getElementById("comment-count").textContent = comments.length ? `(${comments.length})` : "";

  document.getElementById("comment-list").innerHTML = comments.length
    ? comments
        .map(
          (c) => `
      <div class="comment-item">
        <div class="comment-head">
          <span class="comment-author">${c.author}</span>
          <span>
            <span class="comment-date">${c.date}</span>
            <button type="button" class="comment-del" data-id="${c.id}">삭제</button>
          </span>
        </div>
        <div class="comment-content">${c.bodyHtml}</div>
      </div>`
        )
        .join("")
    : `<div class="empty-state">첫 댓글을 남겨보세요.</div>`;

  document.getElementById("comment-list").querySelectorAll(".comment-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("댓글을 삭제하시겠습니까?")) return;
      deleteCaseComment(currentDetailId, btn.dataset.id);
      openDetail(currentDetailId);
      renderCaseList();
    });
  });
}

function renderCaseLikesBar(item) {
  const mount = document.getElementById("views-likes-mount");
  mount.innerHTML = renderViewsLikesHtml(item);
  mount.querySelector(".like-btn").addEventListener("click", () => {
    toggleLike(item);
    saveData("casePosts", casePosts);
    renderCaseLikesBar(item);
  });
}

function openDetail(id) {
  const item = getCasePost(id);
  if (!item) return;
  currentDetailId = id;

  recordView(item);
  saveData("casePosts", casePosts);

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-meta").textContent = `${item.author} · ${item.date}`;
  document.getElementById("detail-content").innerHTML = item.bodyHtml || "";
  document.getElementById("c-author").value = (profile && profile.name) || "";
  document.getElementById("c-editor").innerHTML = "";
  renderCaseLikesBar(item);
  renderCaseCommentList(item);

  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
  currentDetailId = null;
  renderCaseList(); // 조회수/좋아요가 목록 뱃지에도 바로 반영되게 갱신
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getCasePost(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-author").value = item ? item.author : (profile && profile.name) || "";
  document.getElementById("f-photo-picker").value = "";
  document.getElementById("editor").innerHTML = item ? item.bodyHtml || "" : "";
  title.textContent = item ? "사례 수정" : "사례 작성";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("case-share");
  renderCaseList();
  onViewportChange(renderCaseList);

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("btn-cancel2").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  wirePhotoEditor(
    document.getElementById("editor"),
    document.getElementById("btn-add-photo"),
    document.getElementById("f-photo-picker")
  );
  wirePhotoEditor(
    document.getElementById("c-editor"),
    document.getElementById("btn-c-add-photo"),
    document.getElementById("c-photo-picker")
  );

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("btn-detail-close2").addEventListener("click", closeDetail);

  document.getElementById("btn-download-all").addEventListener("click", () => {
    if (casePosts.length === 0) {
      showToast("다운로드할 사례가 없습니다.");
      return;
    }
    const sorted = [...casePosts].reverse();
    const bodyHtml = sorted
      .map((p) => {
        const comments = (p.comments || [])
          .map((c) => `<div style="margin:4px 0 4px 16px; font-size:13px; color:#555;">└ ${c.author}: ${c.bodyHtml || ""}</div>`)
          .join("");
        return `
        <h2>${p.title}</h2>
        <div class="meta">${p.author} · ${p.date}</div>
        ${p.bodyHtml || ""}
        ${comments}
        <hr>`;
      })
      .join("");
    downloadAsHtml("사례공유게시판_전체", "사례공유게시판 (전체)", bodyHtml);
  });

  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });

  document.getElementById("comment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const author = document.getElementById("c-author").value.trim();
    const editor = document.getElementById("c-editor");
    const bodyHtml = editor.innerHTML.trim();
    if (!author || !bodyHtml) return;
    addCaseComment(currentDetailId, author, bodyHtml);
    editor.innerHTML = "";
    openDetail(currentDetailId);
    renderCaseList();
  });

  document.getElementById("case-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      title: document.getElementById("f-title").value.trim(),
      author: document.getElementById("f-author").value.trim(),
      bodyHtml: document.getElementById("editor").innerHTML.trim(),
    };

    if (id) {
      updateCasePost(id, data);
      showToast("사례가 수정되었습니다.");
    } else {
      addCasePost(data);
      showToast("사례가 등록되었습니다.");
    }
    closeModal();
  });
});
