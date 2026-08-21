/* board.html 전용 데이터 & 로직 */

let posts = loadData("posts", [
  { id: uid(), title: "이번 달 안전교육 일정 공유드립니다", author: "김기관", date: formatDate(new Date()), content: "이번 달 정기 안전교육은 3주차에 진행됩니다. 많은 참여 부탁드립니다." },
]);
saveData("posts", posts);

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

/* ---------- 렌더링 ---------- */

function renderPostList() {
  const tbody = document.getElementById("board-tbody");

  if (posts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">등록된 게시글이 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = [...posts]
    .reverse()
    .map(
      (p) => `
      <tr>
        <td>${p.title}</td>
        <td>${p.author}</td>
        <td>${p.date}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${p.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${p.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deletePost(btn.dataset.id));
  });
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

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
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
