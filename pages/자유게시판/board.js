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
  post.comments.push({ id: uid(), author, content, date: formatDate(new Date()) });
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
            <button type="button" class="comment-del" data-id="${c.id}">삭제</button>
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
  document.getElementById("c-author").value = (profile && profile.name) || "";
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

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-author").value = item ? item.author : "";
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

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("btn-detail-close2").addEventListener("click", closeDetail);
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
