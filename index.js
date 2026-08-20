/* index.html 전용 데이터 & 로직 */

// 전역 변수 + localStorage 영속화 (규칙 2)
let notices = loadData("notices", [
  { id: uid(), text: "2026년 하반기 기관사 정기 안전교육 일정 안내", date: formatDate(new Date()) },
  { id: uid(), text: "철도안전법 개정사항 반영 교육자료 업데이트", date: formatDate(new Date()) },
]);
saveData("notices", notices); // 최초 로드시 시드 데이터를 즉시 영속화

/* ---------- CRUD ---------- */

function getAllNotices() {
  return notices;
}

function addNotice(text) {
  notices.push({ id: uid(), text, date: formatDate(new Date()) });
  saveData("notices", notices);
  renderNoticeList();
}

function deleteNotice(id) {
  notices = notices.filter((n) => n.id !== id);
  saveData("notices", notices);
  renderNoticeList();
}

/* ---------- 렌더링 ---------- */

function renderNoticeList() {
  const listEl = document.getElementById("notice-list");
  const countEl = document.getElementById("stat-notice-count");
  countEl.textContent = notices.length;

  if (notices.length === 0) {
    listEl.innerHTML = `<li class="empty-state" style="border:none;">등록된 공지가 없습니다.</li>`;
    return;
  }

  listEl.innerHTML = notices
    .map(
      (n) => `
      <li>
        <span><span class="notice-date">${n.date}</span>${n.text}</span>
        <button class="notice-del" data-id="${n.id}">삭제</button>
      </li>`
    )
    .join("");

  listEl.querySelectorAll(".notice-del").forEach((btn) => {
    btn.addEventListener("click", () => deleteNotice(btn.dataset.id));
  });
}

function renderCourseCount() {
  // course.js 가 localStorage 에 저장한 데이터를 홈 화면에서 읽어와 요약 표시
  const courses = loadData("courses", []);
  document.getElementById("stat-course-count").textContent = courses.length;
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("home");
  renderNoticeList();
  renderCourseCount();

  document.getElementById("btn-add-notice").addEventListener("click", () => {
    const text = prompt("공지 내용을 입력하세요");
    if (text && text.trim()) addNotice(text.trim());
  });
});
