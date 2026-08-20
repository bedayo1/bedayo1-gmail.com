/* course.html 전용 데이터 & 로직 — 새 메뉴를 만들 때 이 파일 구조를 그대로 복사해서 쓴다 */

// 전역 변수 + localStorage 영속화 (규칙 2)
let courses = loadData("courses", [
  { id: uid(), name: "철도안전법 기본과정", target: "신입 기관사", hours: 16, status: "planned" },
  { id: uid(), name: "비상상황 대응 실습", target: "전 기관사", hours: 8, status: "ongoing" },
  { id: uid(), name: "고속철도 운전취급 갱신교육", target: "고속철도 기관사", hours: 24, status: "done" },
]);
saveData("courses", courses); // 최초 로드시 시드 데이터를 즉시 영속화해 다른 페이지(index.js)에서도 바로 조회 가능

const STATUS_LABEL = {
  planned: { text: "예정", cls: "warn" },
  ongoing: { text: "진행중", cls: "ok" },
  done: { text: "완료", cls: "danger" },
};

/* ---------- CRUD ---------- */

function getAllCourses() {
  return courses;
}

function getCourse(id) {
  return courses.find((c) => c.id === id);
}

function addCourse(data) {
  courses.push({ id: uid(), ...data });
  saveData("courses", courses);
  renderCourseList();
}

function updateCourse(id, data) {
  courses = courses.map((c) => (c.id === id ? { ...c, ...data } : c));
  saveData("courses", courses);
  renderCourseList();
}

function deleteCourse(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  courses = courses.filter((c) => c.id !== id);
  saveData("courses", courses);
  renderCourseList();
}

/* ---------- 렌더링 ---------- */

function renderCourseList() {
  const tbody = document.getElementById("course-tbody");

  if (courses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">등록된 교육과정이 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = courses
    .map((c) => {
      const status = STATUS_LABEL[c.status] || STATUS_LABEL.planned;
      return `
      <tr>
        <td>${c.name}</td>
        <td>${c.target}</td>
        <td>${c.hours}시간</td>
        <td><span class="badge ${status.cls}">${status.text}</span></td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${c.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${c.id}">삭제</button>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteCourse(btn.dataset.id));
  });
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const course = id ? getCourse(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-name").value = course ? course.name : "";
  document.getElementById("f-target").value = course ? course.target : "";
  document.getElementById("f-hours").value = course ? course.hours : "";
  document.getElementById("f-status").value = course ? course.status : "planned";
  title.textContent = course ? "교육과정 수정" : "교육과정 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("course");
  renderCourseList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("course-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      name: document.getElementById("f-name").value.trim(),
      target: document.getElementById("f-target").value.trim(),
      hours: Number(document.getElementById("f-hours").value),
      status: document.getElementById("f-status").value,
    };

    if (id) {
      updateCourse(id, data);
      showToast("교육과정이 수정되었습니다.");
    } else {
      addCourse(data);
      showToast("교육과정이 추가되었습니다.");
    }
    closeModal();
  });
});
