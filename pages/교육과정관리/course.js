/* course.html 전용 데이터 & 로직 — 새 메뉴를 만들 때 이 파일 구조를 그대로 복사해서 쓴다 */

// 전역 변수 + localStorage 영속화 (규칙 2)
let courses = loadData("courses", [
  { id: uid(), name: "철도안전법 기본과정", target: "신입 기관사", hours: 16, status: "planned" },
  { id: uid(), name: "비상상황 대응 실습", target: "전 기관사", hours: 8, status: "ongoing" },
  { id: uid(), name: "고속철도 운전취급 갱신교육", target: "고속철도 기관사", hours: 24, status: "done" },
]);
saveData("courses", courses); // 최초 로드시 시드 데이터를 즉시 영속화해 다른 페이지(index.js)에서도 바로 조회 가능

// 로그인한 직원 본인의 이수 처리 여부를 표시하기 위해 사용한다 (관리자 세션이면 null).
let profile = loadData("profile", null);

const STATUS_LABEL = {
  planned: { text: "예정", cls: "neutral" },
  ongoing: { text: "진행중", cls: "info" },
  done: { text: "완료", cls: "ok" },
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

const coursePager = { page: 0, pageSize: 10 };
const courseSearch = { field: "title", query: "" };

function renderCourseList() {
  const tbody = document.getElementById("course-tbody");
  const filtered = filterByTitleContent(
    courses,
    courseSearch,
    (c) => c.name,
    (c) => [c.target, STATUS_LABEL[c.status] ? STATUS_LABEL[c.status].text : ""].filter(Boolean).join(" ")
  );

  renderListSearch("course-search", courseSearch, () => {
    coursePager.page = 0;
    renderCourseList();
  });
  const skipPaging = !!courseSearch.query.trim() || isAppViewport();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">등록된 교육과정이 없습니다.</div></td></tr>`;
    renderPaginationOrAll("course-pager", coursePager, 0, renderCourseList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(filtered, coursePager, skipPaging);

  tbody.innerHTML = pageItems
    .map((c) => {
      const status = STATUS_LABEL[c.status] || STATUS_LABEL.planned;
      const completedCount = countCourseCompletions(c.id);
      const iCompleted = profile && isCourseCompletedBy(c.id, profile.empId);
      return `
      <tr>
        <td class="title-cell">${c.name}</td>
        <td>${c.target}</td>
        <td class="mobile-hide">${c.hours}시간</td>
        <td><span class="badge ${status.cls}">${status.text}</span></td>
        <td>
          ${profile ? `<button type="button" class="btn ${iCompleted ? "secondary" : ""} small" data-action="complete" data-id="${c.id}">${iCompleted ? "✅ 이수완료" : "이수 처리"}</button>` : ""}
          <span class="notice-card-meta">이수 ${completedCount}명</span>
        </td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${c.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${c.id}">삭제</button>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-action='complete']").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!profile) return;
      toggleCourseCompletion(btn.dataset.id, profile.empId, profile.name);
      renderCourseList();
    });
  });
  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteCourse(btn.dataset.id));
  });

  renderPaginationOrAll("course-pager", coursePager, filtered.length, renderCourseList, skipPaging);
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
  onViewportChange(renderCourseList);

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
