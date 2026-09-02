/* board.html 전용 데이터 & 로직 */

let posts = loadData("posts", [
  { id: uid(), title: "이번 달 안전교육 일정 공유드립니다", author: "김기관", date: formatDate(new Date()), content: "이번 달 정기 안전교육은 3주차에 진행됩니다. 많은 참여 부탁드립니다.", comments: [] },
]);
saveData("posts", posts);

// 댓글 작성자 기본값으로 쓸 로그인한 직원 이름 (없으면 빈 값 — 관리자 세션 등)
let profile = loadData("profile", null);

/* ---------- CRUD ---------- */

function getAllPosts() {
  return posts;
}

function getPost(id) {
  return posts.find((p) => p.id === id);
}

function addPost(data) {
  posts.push({ id: uid(), date: formatDate(new Date()), ...data });
  saveData("posts", posts);
  renderPostList();
}

function updatePost(id, data) {
  posts = posts.map((p) => (p.id === id ? { ...p, ...data } : p));
  saveData("posts", posts);
  renderPostList();
}

function deletePost(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  posts = posts.filter((p) => p.id !== id);
  saveData("posts", posts);
  renderPostList();
}

/* ---------- 댓글 ---------- */

function addComment(postId, author, content) {
  const post = getPost(postId);
  if (!post) return;
  if (!post.comments) post.comments = [];
  post.comments.push({
    id: uid(),
    author,
    content,
    date: formatDate(new Date()),
    authorEmpId: (profile && profile.empId) || null,
  });
  saveData("posts", posts);
}

function deleteComment(postId, commentId) {
  const post = getPost(postId);
  if (!post || !post.comments) return;
  post.comments = post.comments.filter((c) => c.id !== commentId);
  saveData("posts", posts);
}

/* ---------- 렌더링 ---------- */

const postPager = { page: 0, pageSize: 10 };
const postSearch = { field: "title", query: "" };

function renderPostList() {
  const tbody = document.getElementById("board-tbody");
  let reversed = [...posts].reverse();
  reversed = filterByTitleContent(reversed, postSearch, (p) => p.title, (p) => p.content);

  renderListSearch("board-search", postSearch, () => {
    postPager.page = 0;
    renderPostList();
  });
  const skipPaging = !!postSearch.query.trim() || isAppViewport();

  if (reversed.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">등록된 게시글이 없습니다.</div></td></tr>`;
    renderPaginationOrAll("board-pager", postPager, 0, renderPostList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(reversed, postPager, skipPaging);

  tbody.innerHTML = pageItems
    .map(
      (p) => `
      <tr>
        <td class="title-cell"><a data-action="detail" data-id="${p.id}">${p.title}</a>${p.comments && p.comments.length ? ` <span class="badge neutral">💬 ${p.comments.length}</span>` : ""}${renderViewsLikesBadge(p)}</td>
        <td>${p.author}</td>
        <td class="mobile-hide">${p.date}</td>
        <td class="actions">
          ${
            canModifyPost(p, profile)
              ? `<button class="btn secondary small" data-action="edit" data-id="${p.id}">수정</button>
                 <button class="btn danger small" data-action="delete" data-id="${p.id}">삭제</button>`
              : ""
          }
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
    btn.addEventListener("click", () => deletePost(btn.dataset.id));
  });

  renderPaginationOrAll("board-pager", postPager, reversed.length, renderPostList, skipPaging);
}

/* ---------- 상세보기 (본문 + 댓글) ---------- */

let currentDetailId = null;

function renderCommentList(post) {
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
            ${canModifyPost(c, profile) ? `<button type="button" class="comment-del" data-id="${c.id}">삭제</button>` : ""}
          </span>
        </div>
        <div class="comment-content">${c.content}</div>
      </div>`
        )
        .join("")
    : `<div class="empty-state">첫 댓글을 남겨보세요.</div>`;

  document.getElementById("comment-list").querySelectorAll(".comment-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("댓글을 삭제하시겠습니까?")) return;
      deleteComment(currentDetailId, btn.dataset.id);
      openDetail(currentDetailId);
      renderPostList();
    });
  });
}

function renderBoardLikesBar(item) {
  const mount = document.getElementById("views-likes-mount");
  mount.innerHTML = renderViewsLikesHtml(item);
  mount.querySelector(".like-btn").addEventListener("click", () => {
    toggleLike(item);
    saveData("posts", posts);
    renderBoardLikesBar(item);
  });
}

function openDetail(id) {
  const item = getPost(id);
  if (!item) return;
  currentDetailId = id;

  recordView(item);
  saveData("posts", posts);

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-meta").textContent = `${item.author} · ${item.date}`;
  document.getElementById("detail-content").textContent = item.content;
  const commentAuthorInput = document.getElementById("c-author");
  commentAuthorInput.value = (profile && profile.name) || "";
  commentAuthorInput.readOnly = !!profile;
  renderBoardLikesBar(item);
  renderCommentList(item);

  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
  currentDetailId = null;
  renderPostList(); // 조회수/좋아요가 목록 뱃지에도 바로 반영되게 갱신
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getPost(id) : null;

  const authorInput = document.getElementById("f-author");
  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  authorInput.value = item ? item.author : (profile && profile.name) || "";
  // 글쓴이 이름은 로그인한 본인 것으로 고정 — 다른 사람 이름으로 글을 올리거나(작성),
  // 이미 쓴 글의 작성자를 바꾸는(수정) 걸 막는다. 관리자가 새 글을 쓸 때만 자유 입력.
  authorInput.readOnly = !!item || !!profile;
  document.getElementById("f-content").value = item ? item.content : "";
  title.textContent = item ? "글 수정" : "글쓰기";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("board");
  renderPostList();
  onViewportChange(renderPostList);

  // 알림함 등에서 ?open= 으로 넘어온 경우 해당 게시글 상세를 바로 연다.
  const openId = new URLSearchParams(location.search).get("open");
  if (openId && getPost(openId)) openDetail(openId);

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("btn-detail-close2").addEventListener("click", closeDetail);

  document.getElementById("btn-download-all").addEventListener("click", () => {
    if (posts.length === 0) {
      showToast("다운로드할 게시글이 없습니다.");
      return;
    }
    const sorted = [...posts].reverse();
    const bodyHtml = sorted
      .map((p) => {
        const comments = (p.comments || [])
          .map((c) => `<div style="margin:4px 0 4px 16px; font-size:13px; color:#555;">└ ${c.author}: ${c.content}</div>`)
          .join("");
        return `
        <h2>${p.title}</h2>
        <div class="meta">${p.author} · ${p.date}</div>
        <div>${(p.content || "").replace(/\n/g, "<br>")}</div>
        ${comments}
        <hr>`;
      })
      .join("");
    downloadAsHtml("자유게시판_전체", "자유게시판 (전체)", bodyHtml);
  });

  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });

  document.getElementById("comment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const author = document.getElementById("c-author").value.trim();
    const content = document.getElementById("c-content").value.trim();
    if (!author || !content) return;
    addComment(currentDetailId, author, content);
    document.getElementById("c-content").value = "";
    openDetail(currentDetailId);
    renderPostList();
  });

  document.getElementById("board-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      title: document.getElementById("f-title").value.trim(),
      author: document.getElementById("f-author").value.trim(),
      content: document.getElementById("f-content").value.trim(),
    };
    // 새 글일 때만 작성자를 로그인한 사람으로 고정한다 (수정 시에는 원래 작성자 정보를 그대로 유지).
    if (!id) data.authorEmpId = (profile && profile.empId) || null;

    if (id) {
      updatePost(id, data);
      showToast("게시글이 수정되었습니다.");
    } else {
      addPost(data);
      showToast("게시글이 등록되었습니다.");
    }
    closeModal();
  });
});
