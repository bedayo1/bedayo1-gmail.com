/* admin-quiz.html 전용 데이터 & 로직 */

let quizzes = loadData("quizzes", [
  { id: uid(), category: "운전취급 규정", question: "열차 운행 중 진행신호가 갑자기 정지신호로 변경되었을 때 기관사의 최우선 조치는?", answer: "즉시 비상제동 체결 후 관제 보고" },
  { id: uid(), category: "여객안전", question: "열차 운행 중 승객이 선로에 추락하였을 때 기관사의 즉각 조치는?", answer: "즉시 비상제동 체결 및 관제 보고" },
]);
saveData("quizzes", quizzes);

/* ---------- CRUD ---------- */

function getAllQuizzes() {
  return quizzes;
}

function getQuiz(id) {
  return quizzes.find((q) => q.id === id);
}

function addQuiz(data) {
  quizzes.push({ id: uid(), ...data });
  saveData("quizzes", quizzes);
  renderQuizList();
}

function updateQuiz(id, data) {
  quizzes = quizzes.map((q) => (q.id === id ? { ...q, ...data } : q));
  saveData("quizzes", quizzes);
  renderQuizList();
}

function deleteQuiz(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  quizzes = quizzes.filter((q) => q.id !== id);
  saveData("quizzes", quizzes);
  renderQuizList();
}

/* ---------- 렌더링 ---------- */

const quizPager = { page: 0, pageSize: 10 };
const quizSearch = { field: "title", query: "" };

function renderQuizList() {
  const tbody = document.getElementById("admin-quiz-tbody");
  const filtered = filterByTitleContent(quizzes, quizSearch, (q) => q.question, (q) => q.answer);

  renderListSearch("admin-quiz-search", quizSearch, () => {
    quizPager.page = 0;
    renderQuizList();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">등록된 문제가 없습니다.</div></td></tr>`;
    renderPagination("admin-quiz-pager", quizPager, 0, renderQuizList);
    return;
  }

  const pageItems = paginateList(filtered, quizPager);

  tbody.innerHTML = pageItems
    .map(
      (q) => `
      <tr>
        <td><span class="badge neutral">${q.category}</span></td>
        <td class="question">${q.question}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${q.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${q.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteQuiz(btn.dataset.id));
  });

  renderPagination("admin-quiz-pager", quizPager, filtered.length, renderQuizList);
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getQuiz(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-category").value = item ? item.category : "";
  document.getElementById("f-question").value = item ? item.question : "";
  document.getElementById("f-answer").value = item ? item.answer : "";
  title.textContent = item ? "문제 수정" : "문제 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("admin-quiz");
  renderQuizList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("admin-quiz-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      category: document.getElementById("f-category").value.trim(),
      question: document.getElementById("f-question").value.trim(),
      answer: document.getElementById("f-answer").value.trim(),
    };

    if (id) {
      updateQuiz(id, data);
      showToast("문제가 수정되었습니다.");
    } else {
      addQuiz(data);
      showToast("문제가 추가되었습니다.");
    }
    closeModal();
  });
});
