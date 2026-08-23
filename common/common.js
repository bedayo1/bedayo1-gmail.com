/* ============================================
   공통 JS — 2개 이상의 페이지에서 쓰는 함수/데이터만 여기에 작성
   ============================================ */

// 메뉴 추가 시 이 배열만 수정하면 모든 페이지의 사이드바가 함께 갱신된다.
// group: "main"(사용자 메뉴) | "admin"(관리자 메뉴)
const NAV_ITEMS = [
  { key: "home", label: "홈", path: "index.html", icon: "🏠", group: "main" },
  { key: "search", label: "통합검색", path: "pages/통합검색/search.html", icon: "🔍", group: "main" },
  { key: "chatbot", label: "AI챗봇", path: "pages/AI챗봇/chatbot.html", icon: "🤖", group: "main" },
  { key: "course", label: "교육과정 관리", path: "pages/교육과정관리/course.html", icon: "📚", group: "main" },
  { key: "accident", label: "사고사례", path: "pages/사고사례/accident.html", icon: "📋", group: "main" },
  { key: "dia", label: "다이아", path: "pages/다이아/dia.html", icon: "🚆", group: "main" },
  { key: "malfunction", label: "고장처치 매뉴얼", path: "pages/고장조치메뉴얼/malfunction.html", icon: "🔧", group: "main" },
  { key: "emergency", label: "이례상황 매뉴얼", path: "pages/이례상황메뉴얼/emergency.html", icon: "🚨", group: "main" },
  { key: "board", label: "자유게시판", path: "pages/자유게시판/board.html", icon: "💬", group: "main" },
  { key: "mypage", label: "마이페이지", path: "pages/마이페이지/mypage.html", icon: "👤", group: "main" },
  { key: "admin-employee", label: "직원 관리", path: "pages/관리자 - 직원관리/admin-employee.html", icon: "👥", group: "admin" },
  { key: "admin-notice", label: "공지·지시사항 관리", path: "pages/관리자- 공지'지시사항관리/admin-notice.html", icon: "📢", group: "admin" },
  { key: "admin-schedule", label: "다이아·스케줄 관리", path: "pages/관리자 - 다이아(스케쥴) 관리/admin-schedule.html", icon: "📅", group: "admin" },
  { key: "admin-attendance", label: "출근현황", path: "pages/관리자 - 출근현황/admin-attendance.html", icon: "🕐", group: "admin" },
  { key: "admin-education", label: "일일안전교육 모니터링", path: "pages/관리자 - 일일교육모니터링/admin-education.html", icon: "📈", group: "admin" },
];

const NAV_GROUPS = [
  { key: "main", title: "메인 메뉴" },
  { key: "admin", title: "관리자" },
];

const STORAGE_PREFIX = "kcs_"; // 기관사(KiCSa) 안전교육 앱 localStorage 네임스페이스

// 데모용 고정 관리자 계정 — 직원 로그인과 완전히 분리된 별도 계정이다 (직원 명단에는 존재하지 않음).
const ADMIN_ACCOUNT = { id: "admin", pw: "admin1234" };

/* ---------- 로그인 게이트 ---------- */
/* 로그인 화면(login.html)을 제외한 모든 페이지는 세션이 없으면 즉시 로그인 화면으로 보낸다.
   세션 종류(session.type)가 "employee"면 사이드바에 메인 메뉴만, "admin"이면 관리자 메뉴만 보이게 된다
   (renderSidebar 참고). common.js 최상단에서 동기적으로 실행되어 화면이 그려지기 전에 리다이렉트한다. */
(function enforceLoginGate() {
  if (/(^|\/)login\.html$/.test(location.pathname)) return;
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "session"));
  } catch (e) {
    session = null;
  }
  if (!session) {
    location.replace(getRootBase() + "login.html");
  }
})();

function logout() {
  localStorage.removeItem(STORAGE_PREFIX + "session");
  location.href = getRootBase() + "login.html";
}

// 직원 비밀번호는 사번별로 localStorage("employeePasswords")에 보관한다. 값이 없으면 초기 비밀번호 1234.
function getEmployeePassword(empId) {
  const pwMap = loadData("employeePasswords", {});
  return pwMap[empId] || "1234";
}

function setEmployeePassword(empId, newPw) {
  const pwMap = loadData("employeePasswords", {});
  pwMap[empId] = newPw;
  saveData("employeePasswords", pwMap);
}

/* ---------- 데이터 저장 유틸 (페이지별 전역 변수의 영속화에 사용) ---------- */


function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("loadData 실패:", key, e);
    return defaultValue;
  }
}

function saveData(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

/* ---------- 공통 헬퍼 ---------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

let toastTimer = null;
function showToast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
}

/* ---------- 테마 (라이트/다크 전환) ---------- */

function applyTheme() {
  const theme = loadData("theme", "dark");
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  saveData("theme", next);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

/* ---------- 통합검색 (전체 데이터 인덱싱 & 검색) ---------- */
/* 이 앱은 서버가 없는 정적 데모라, 각 페이지가 localStorage에 저장한 데이터를
   직접 읽어 인덱스를 만든다. 새 데이터 종류를 추가하면 이 배열에 한 줄만 추가하면 된다. */

const SEARCH_SOURCES = [
  {
    key: "courses",
    type: "교육과정",
    icon: "📚",
    path: "pages/교육과정관리/course.html",
    getTitle: (x) => x.name,
    getText: (x) => [x.name, x.target, x.status].join(" "),
  },
  {
    key: "accidents",
    type: "사고사례",
    icon: "📋",
    path: "pages/사고사례/accident.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.line, x.location, x.overview, x.cause, x.countermeasures].join(" "),
  },
  {
    key: "malfunctions",
    type: "고장처치",
    icon: "🔧",
    path: "pages/고장조치메뉴얼/malfunction.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.vehicleType, x.symptom, x.cause, x.procedure, x.notes].join(" "),
  },
  {
    key: "emergencies",
    type: "이례상황",
    icon: "🚨",
    path: "pages/이례상황메뉴얼/emergency.html",
    getTitle: (x) => x.title,
    getText: (x) =>
      [x.title, x.category, x.condition, (x.procedureSteps || []).join(" "), x.caution].join(" "),
  },
  {
    key: "posts",
    type: "게시판",
    icon: "💬",
    path: "pages/자유게시판/board.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.content, x.author].join(" "),
  },
  {
    key: "adminNotices",
    type: "공지·지시사항",
    icon: "📢",
    path: "pages/관리자- 공지'지시사항관리/admin-notice.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.type, x.content].join(" "),
  },
  {
    key: "employees",
    type: "직원",
    icon: "👥",
    path: "pages/관리자 - 직원관리/admin-employee.html",
    getTitle: (x) => x.name,
    getText: (x) => [x.name, x.empId, x.role, x.dept].join(" "),
  },
  {
    key: "schedules",
    type: "다이아",
    icon: "📅",
    path: "pages/관리자 - 다이아(스케쥴) 관리/admin-schedule.html",
    getTitle: (x) => `${x.line} ${x.diaNo}호 다이아`,
    getText: (x) => [x.line, x.diaNo, x.startTime].join(" "),
  },
];

function buildSearchIndex() {
  const index = [];
  SEARCH_SOURCES.forEach((src) => {
    loadData(src.key, []).forEach((item) => {
      index.push({
        type: src.type,
        icon: src.icon,
        path: src.path,
        title: src.getTitle(item) || "(제목 없음)",
        text: (src.getText(item) || "").replace(/\s+/g, " ").trim(),
      });
    });
  });
  return index;
}

// query(검색어)와 관련도 높은 순으로 정렬된 결과를 반환한다.
// 제목에 포함되면 가중치를 더 준다. limit 지정 시 상위 N개만 반환.
function searchAll(query, limit) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const index = buildSearchIndex();

  const scored = index
    .map((item) => {
      const titleLower = item.title.toLowerCase();
      const hay = (titleLower + " " + item.text.toLowerCase());
      let score = 0;
      terms.forEach((t) => {
        const occurrences = hay.split(t).length - 1;
        if (occurrences === 0) return;
        score += occurrences;
        if (titleLower.includes(t)) score += 5;
      });
      const snippetSource = item.text || item.title;
      const snippet = snippetSource.length > 80 ? snippetSource.slice(0, 80) + "…" : snippetSource;
      return { ...item, score, snippet };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return typeof limit === "number" ? scored.slice(0, limit) : scored;
}

/* ---------- 관련 동영상 (경로 텍스트 ↔ 배열 변환) ---------- */
/* 동영상은 용량이 커서 localStorage(사진처럼 base64로 저장)에 담기 어렵다.
   그래서 페이지 폴더 안에 파일을 직접 넣어두고, "경로 | 설명" 한 줄짜리 텍스트로만 관리한다. */

function parseVideosText(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [file, ...rest] = line.split("|");
      return { file: file.trim(), caption: rest.join("|").trim() };
    })
    .filter((v) => v.file);
}

function videosToText(videos) {
  return (videos || [])
    .map((v) => (v.caption ? `${v.file} | ${v.caption}` : v.file))
    .join("\n");
}

function renderVideoGallery(videos) {
  if (!videos || videos.length === 0) return "";
  const items = videos
    .map(
      (v) => `
      <div class="detail-video-item">
        <video src="${v.file}" controls preload="metadata"></video>
        ${v.caption ? `<span class="detail-video-caption">${v.caption}</span>` : ""}
      </div>`
    )
    .join("");
  return `<div class="detail-video-gallery">${items}</div>`;
}

// 동영상뿐 아니라 어떤 파일이든(문서, 압축파일 등) 다운로드 링크 목록으로 보여줄 때 사용.
function renderAttachmentList(attachments) {
  if (!attachments || attachments.length === 0) return "";
  const items = attachments
    .map((a) => {
      const name = a.file.split("/").pop();
      return `
      <a class="attachment-item" href="${a.file}" download target="_blank">
        <span>📎 ${name}</span>
        ${a.caption ? `<span class="attachment-caption">${a.caption}</span>` : ""}
      </a>`;
    })
    .join("");
  return `<div class="attachment-list">${items}</div>`;
}

/* ---------- 긴급공지(사고사례) 노출 여부 판정 — accident.js·index.js 공용 ---------- */
/* "긴급 공지로 노출" 체크(noticeActive)를 명시적으로 켠 항목만 후보가 되고(opt-in),
   그중에서도 noticeStart/noticeEnd(YYYY-MM-DD, 둘 다 선택) 기간 안에 있어야 실제로 노출된다.
   시작/종료일을 비워두면 각각 "즉시부터"/"계속"으로 취급한다. */
function isNoticeCurrentlyActive(item) {
  if (!item.noticeActive) return false;
  const today = formatDate(new Date());
  if (item.noticeStart && today < item.noticeStart) return false;
  if (item.noticeEnd && today > item.noticeEnd) return false;
  return true;
}

// 운전지시사항(공지·지시사항 관리)은 별도 on/off 없이 노출기간(선택)만으로 걸러낸다 — 지정 안 하면 항상 노출.
function isWithinNoticePeriod(item) {
  const today = formatDate(new Date());
  if (item.startDate && today < item.startDate) return false;
  if (item.endDate && today > item.endDate) return false;
  return true;
}

/* ---------- 일일안전교육 학습결과 (출근 시 응시한 퀴즈) — 마이페이지·관리자 모니터링 공용 ---------- */
/* attendances 레코드 하나의 education.items 는
   [{ type, title, question, choices, selectedIndex, correctIndex, correct }, ...] 형태다. */

function getAllAttendances() {
  return loadData("attendances", []);
}

function getAttendancesFor(empId) {
  return getAllAttendances()
    .filter((a) => a.empId === empId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// 응시 횟수/평균점수/정답률 등 전체 요약
// (직무배제로 종료된 날은 애초에 문제를 풀지 않았으므로 "응시"에서 제외한다)
function summarizeEducation(records) {
  records = records.filter((r) => !r.excluded);
  let totalQuestions = 0;
  let totalCorrect = 0;
  let scoreSum = 0;
  records.forEach((r) => {
    const items = (r.education && r.education.items) || [];
    totalQuestions += items.length;
    totalCorrect += items.filter((i) => i.correct).length;
    scoreSum += (r.education && r.education.score) || 0;
  });
  return {
    count: records.length,
    totalQuestions,
    totalCorrect,
    accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    avgScore: records.length ? Math.round(scoreSum / records.length) : 0,
  };
}

// 오답이 있었던 매뉴얼(문제)을 오답률 순으로 정리 — "취약분야"
function analyzeWeakAreas(records, limit) {
  const stats = {};
  records.filter((r) => !r.excluded).forEach((r) => {
    ((r.education && r.education.items) || []).forEach((item) => {
      const key = `${item.type}::${item.title}`;
      if (!stats[key]) stats[key] = { type: item.type, title: item.title, total: 0, wrong: 0 };
      stats[key].total += 1;
      if (!item.correct) stats[key].wrong += 1;
    });
  });
  return Object.values(stats)
    .filter((s) => s.wrong > 0)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong)
    .slice(0, limit || 8);
}

// 퀴즈 문항별 정답/오답 리뷰 화면 (마이페이지, 관리자 모니터링, 출근 상세보기가 공용으로 사용)
function renderQuizReviewHtml(items) {
  if (!items || items.length === 0) {
    return `<div class="empty-state">응시한 문제가 없습니다.</div>`;
  }
  return items
    .map((q, qi) => {
      const choices = q.choices || [];
      return `
    <div class="quiz-question-card">
      <div class="quiz-q-index">${q.isReview ? "🔁 복습 · " : ""}${q.type} · 문제 ${qi + 1} · ${q.title} · ${q.correct ? "✅ 정답" : "❌ 오답"}</div>
      <div class="quiz-q-text">${q.question}</div>
      <div class="quiz-choices">
        ${choices
          .map((c, ci) => {
            let cls = "";
            if (ci === q.correctIndex) cls = "correct";
            else if (ci === q.selectedIndex) cls = "wrong";
            return `<div class="quiz-choice quiz-choice-readonly ${cls}">${ci === q.selectedIndex ? "☑" : "☐"} ${c}</div>`;
          })
          .join("")}
      </div>
    </div>`;
    })
    .join("");
}

// 취약분야 목록 렌더링 (마이페이지 / 관리자 모니터링 공용)
function renderWeakAreasHtml(weakAreas) {
  if (!weakAreas || weakAreas.length === 0) {
    return `<div class="empty-state">아직 오답이 없습니다. 좋은 결과예요!</div>`;
  }
  return `
    <div class="weak-area-list">
      ${weakAreas
        .map(
          (w) => `
        <div class="weak-area-item">
          <span class="badge ${w.type === "고장처치" ? "info" : "danger"}">${w.type}</span>
          <span class="weak-area-title">${w.title}</span>
          <span class="weak-area-rate">오답 ${w.wrong}/${w.total}</span>
        </div>`
        )
        .join("")}
    </div>`;
}

/* ---------- 목록 검색(제목/내용 선택) — 모든 목록형 페이지 공용 ---------- */
/* 사용법:
     const xxxSearch = { field: "title", query: "" };
     function renderXxxList() {
       let list = ...(탭 등 다른 필터 적용)...;
       list = filterByTitleContent(list, xxxSearch, (x) => x.title, (x) => x.content);
       renderListSearch("xxx-search", xxxSearch, renderXxxList);
       ...(list 를 페이징해서 렌더링)...
     }
   검색어/필드가 바뀌면 renderListSearch 내부에서 자동으로 pager.page 리셋용 onChange(=render 함수)를 다시 호출한다.
   render 함수 안에서 pager.page = 0 리셋은 검색 change 핸들러 쪽에서 처리되므로, 페이지 쪽에서는
   검색 input을 건드릴 때 pager도 함께 0으로 리셋해주면 된다(아래 renderListSearch 참고). */

function filterByTitleContent(list, search, getTitle, getContent) {
  const q = (search.query || "").trim().toLowerCase();
  if (!q) return list;
  return list.filter((item) => {
    const hay = search.field === "content" ? getContent(item) : getTitle(item);
    return (hay || "").toLowerCase().includes(q);
  });
}

function renderListSearch(containerId, search, onChange) {
  const mount = document.getElementById(containerId);
  if (!mount) return;

  // 이미 그려져 있으면(같은 페이지 재렌더 시) input을 새로 만들지 않고 값만 유지 — 매 렌더마다 다시 그리면 포커스가 끊긴다.
  if (mount.dataset.wired === "1") return;
  mount.dataset.wired = "1";

  mount.innerHTML = `
    <select id="${containerId}-field" class="list-search-field">
      <option value="title" ${search.field === "title" ? "selected" : ""}>제목</option>
      <option value="content" ${search.field === "content" ? "selected" : ""}>내용</option>
    </select>
    <input type="text" id="${containerId}-input" class="list-search-input" placeholder="검색어를 입력하세요" value="${search.query || ""}">
  `;

  mount.querySelector(`#${containerId}-field`).addEventListener("change", (e) => {
    search.field = e.target.value;
    onChange();
  });
  mount.querySelector(`#${containerId}-input`).addEventListener("input", (e) => {
    search.query = e.target.value;
    onChange();
  });
}

/* ---------- 목록 페이징 (모든 목록형 페이지 공용) ---------- */
/* 사용법:
     const xxxPager = { page: 0, pageSize: 10 };
     function renderXxxList() {
       const filtered = ...(검색/탭 필터링 결과)...;
       const pageItems = paginateList(filtered, xxxPager);
       tbody.innerHTML = pageItems.map(...).join("");
       ...(pageItems 기준으로 클릭 핸들러 연결)...
       renderPagination("xxx-pager", xxxPager, filtered.length, renderXxxList);
     }
   필터가 바뀌는 지점(검색어 입력, 탭 클릭 등)에서는 pager.page = 0 으로 리셋할 것. */

const PAGE_SIZE_OPTIONS = [10, 50, 100];

function paginateList(list, pager) {
  const start = pager.page * pager.pageSize;
  return list.slice(start, start + pager.pageSize);
}

function renderPagination(containerId, pager, totalItems, onChange) {
  const mount = document.getElementById(containerId);
  if (!mount) return;

  if (totalItems === 0) {
    mount.innerHTML = "";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pager.pageSize));
  if (pager.page > totalPages - 1) pager.page = totalPages - 1;
  if (pager.page < 0) pager.page = 0;

  const windowSize = 7;
  let startPage = Math.max(0, pager.page - Math.floor(windowSize / 2));
  let endPage = Math.min(totalPages - 1, startPage + windowSize - 1);
  startPage = Math.max(0, endPage - windowSize + 1);

  const pageBtns = [];
  for (let p = startPage; p <= endPage; p++) {
    pageBtns.push(
      `<button type="button" class="${p === pager.page ? "active" : ""}" data-page="${p}">${p + 1}</button>`
    );
  }

  mount.innerHTML = `
    <div class="pagination-size">
      <label for="${containerId}-size">표시 개수</label>
      <select id="${containerId}-size">
        ${PAGE_SIZE_OPTIONS.map(
          (s) => `<option value="${s}" ${s === pager.pageSize ? "selected" : ""}>${s}개씩</option>`
        ).join("")}
      </select>
    </div>
    <div class="pagination-pages">
      <button type="button" data-page="0" ${pager.page === 0 ? "disabled" : ""}>처음</button>
      <button type="button" data-page="${pager.page - 1}" ${pager.page === 0 ? "disabled" : ""}>이전</button>
      ${pageBtns.join("")}
      <button type="button" data-page="${pager.page + 1}" ${pager.page >= totalPages - 1 ? "disabled" : ""}>다음</button>
      <button type="button" data-page="${totalPages - 1}" ${pager.page >= totalPages - 1 ? "disabled" : ""}>마지막</button>
    </div>
    <div class="pagination-info">총 ${totalItems}건 · ${pager.page + 1}/${totalPages}페이지</div>
  `;

  mount.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = Number(btn.dataset.page);
      if (p < 0 || p >= totalPages || p === pager.page) return;
      pager.page = p;
      onChange();
    });
  });

  mount.querySelector(`#${containerId}-size`).addEventListener("change", (e) => {
    pager.pageSize = Number(e.target.value);
    pager.page = 0;
    onChange();
  });
}

/* 검색어가 있을 때는 검색 결과가 몇 건 안 되는 경우가 많아 페이징이 오히려 불편하므로
   (특히 모바일/앱 화면) 검색 중에는 페이징을 건너뛰고 전체 결과를 한 번에 보여준다. */
function paginateListOrAll(list, pager, skip) {
  return skip ? list : paginateList(list, pager);
}

function renderPaginationOrAll(containerId, pager, totalItems, onChange, skip) {
  if (skip) {
    const mount = document.getElementById(containerId);
    if (mount) mount.innerHTML = "";
    return;
  }
  renderPagination(containerId, pager, totalItems, onChange);
}

/* 앱(모바일) 화면인지 판단 — 목록 표가 카드로 바뀌는 CSS 분기점(768px)과 맞춘다.
   이 화면에서는 페이지네이션 자체를 없애고 전체 목록을 한 번에 보여준다(카드라 세로 스크롤만 하면 되므로). */
function isAppViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

// 목록형 페이지가 화면 크기 변화(브라우저 창 크기 조절, 기기 회전 등)에 맞춰
// 페이징 여부를 다시 계산하도록 재렌더 콜백을 등록한다.
function onViewportChange(callback) {
  let timer = null;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(callback, 150);
  });
}

/* ---------- 네비게이션 ---------- */

function getRootBase() {
  const scripts = document.getElementsByTagName("script");
  for (const s of scripts) {
    if (s.src && s.src.indexOf("common/common.js") !== -1) {
      return s.src.slice(0, s.src.indexOf("common/common.js"));
    }
  }
  return "./";
}

function renderSearchResultRow(base, r) {
  return `
    <a class="header-search-result" href="${base}${r.path}">
      <span class="badge info">${r.icon} ${r.type}</span>
      <span class="header-search-result-body">
        <span class="header-search-result-title">${r.title}</span>
        <span class="header-search-result-snippet">${r.snippet}</span>
      </span>
    </a>`;
}

function renderHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  const base = getRootBase();
  const session = loadData("session", null);
  const userLabel = session
    ? session.type === "admin"
      ? "⚙️ 관리자"
      : `${session.name || ""} ${session.role || ""}`.trim()
    : "";
  mount.outerHTML = `
    <header class="site-header" id="site-header">
      <div class="header-left">
        <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" type="button" title="메뉴 열기/닫기">☰</button>
        <div class="brand">기관사 안전교육
          <span class="sub">Locomotive Engineer Safety Training</span>
        </div>
      </div>
      <div class="header-right">
        ${userLabel ? `<div class="header-user-label">${userLabel}</div>` : ""}
        <button class="header-icon-btn" id="logout-btn" type="button" title="로그아웃">🚪</button>
        <div class="header-widget" id="search-widget">
          <button class="header-icon-btn" id="search-widget-btn" type="button" title="통합검색">🔍</button>
          <div class="widget-popup" id="search-widget-popup">
            <input type="text" id="search-widget-input" placeholder="제목, 내용, 증상 등으로 검색">
            <div class="header-search-results" id="search-widget-results"></div>
            <a class="widget-more-link" href="${base}pages/통합검색/search.html">통합검색 전체화면 열기 →</a>
          </div>
        </div>
        <div class="header-widget" id="chatbot-widget">
          <button class="header-icon-btn" id="chatbot-widget-btn" type="button" title="AI챗봇">🤖</button>
          <div class="widget-popup" id="chatbot-widget-popup">
            <div class="widget-popup-desc">겪고 있는 상황을 적어보세요. 비슷한 매뉴얼·사고사례를 찾아드려요.</div>
            <div class="header-search-results" id="chatbot-widget-results"></div>
            <form id="chatbot-widget-form">
              <input type="text" id="chatbot-widget-input" placeholder="예: 출입문이 안 열려요">
              <button type="submit" class="btn small">전송</button>
            </form>
            <a class="widget-more-link" href="${base}pages/AI챗봇/chatbot.html">AI챗봇 전체화면 열기 →</a>
          </div>
        </div>
        <button class="theme-toggle-btn" id="theme-toggle-btn" type="button" title="라이트/다크 모드 전환">🌙</button>
        <div class="header-date">${formatDate(new Date())}</div>
      </div>
    </header>
  `;
  document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);
  document.getElementById("sidebar-toggle-btn").addEventListener("click", toggleSidebar);
  document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("로그아웃하시겠습니까?")) logout();
  });
  updateThemeToggleIcon();
  wireHeaderWidgets(base);
}

/* ---------- 사이드바 열기/닫기 (앱/모바일 화면의 슬라이드 메뉴) ---------- */

function openSidebar() {
  document.getElementById("site-sidebar")?.classList.add("open");
  document.getElementById("sidebar-backdrop")?.classList.add("open");
}

function closeSidebar() {
  document.getElementById("site-sidebar")?.classList.remove("open");
  document.getElementById("sidebar-backdrop")?.classList.remove("open");
}

function toggleSidebar() {
  const sidebar = document.getElementById("site-sidebar");
  if (!sidebar) return;
  if (sidebar.classList.contains("open")) closeSidebar();
  else openSidebar();
}

function wireHeaderWidgets(base) {
  const searchBtn = document.getElementById("search-widget-btn");
  const searchWidget = document.getElementById("search-widget");
  const searchInput = document.getElementById("search-widget-input");
  const searchResults = document.getElementById("search-widget-results");

  const chatbotBtn = document.getElementById("chatbot-widget-btn");
  const chatbotWidget = document.getElementById("chatbot-widget");
  const chatbotForm = document.getElementById("chatbot-widget-form");
  const chatbotInput = document.getElementById("chatbot-widget-input");
  const chatbotResults = document.getElementById("chatbot-widget-results");

  function closeAllWidgets() {
    searchWidget.classList.remove("open");
    chatbotWidget.classList.remove("open");
  }

  searchBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = !searchWidget.classList.contains("open");
    closeAllWidgets();
    if (willOpen) {
      searchWidget.classList.add("open");
      searchInput.focus();
    }
  });

  chatbotBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = !chatbotWidget.classList.contains("open");
    closeAllWidgets();
    if (willOpen) {
      chatbotWidget.classList.add("open");
      chatbotInput.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!searchWidget.contains(e.target)) searchWidget.classList.remove("open");
    if (!chatbotWidget.contains(e.target)) chatbotWidget.classList.remove("open");
  });

  searchInput.addEventListener("input", () => {
    const results = searchAll(searchInput.value, 6);
    searchResults.innerHTML = results.length
      ? results.map((r) => renderSearchResultRow(base, r)).join("")
      : searchInput.value.trim()
        ? `<div class="header-search-empty">검색 결과가 없습니다.</div>`
        : "";
  });

  chatbotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = chatbotInput.value.trim();
    if (!q) return;
    const results = searchAll(q, 5);
    chatbotResults.innerHTML = results.length
      ? `<div class="header-search-empty">"${q}"과(와) 비슷한 자료를 찾았어요:</div>` +
        results.map((r) => renderSearchResultRow(base, r)).join("")
      : `<div class="header-search-empty">"${q}"과(와) 관련된 자료를 찾지 못했어요. 다른 표현으로 다시 시도해보세요.</div>`;
  });
}

function renderSidebar(activeKey) {
  const mount = document.getElementById("site-sidebar");
  if (!mount) return;
  const base = getRootBase();
  const session = loadData("session", null);
  // 직원 계정은 메인 메뉴만, 관리자 계정은 관리자 메뉴만 본다 (완전히 분리된 두 모드).
  const allowedGroup = session && session.type === "admin" ? "admin" : "main";

  const sections = NAV_GROUPS.filter((group) => group.key === allowedGroup).map((group) => {
    const items = NAV_ITEMS.filter((item) => item.group === group.key);
    if (!items.length) return "";
    const links = items
      .map((item) => {
        const cls = item.key === activeKey ? "active" : "";
        return `<a href="${base}${item.path}" class="${cls}"><span class="icon">${item.icon}</span>${item.label}</a>`;
      })
      .join("");
    return `<div class="sidebar-title">${group.title}</div><ul class="sidebar-menu">${links}</ul>`;
  }).join("");

  mount.outerHTML = `
    <aside class="site-sidebar" id="site-sidebar">
      <nav>
        ${sections}
        <div class="sidebar-menu-footer">
          <ul class="sidebar-menu">
            <a href="#" id="sidebar-logout-link" class="sidebar-danger"><span class="icon">🚪</span>로그아웃</a>
          </ul>
        </div>
      </nav>
    </aside>
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
  `;

  document.getElementById("sidebar-backdrop").addEventListener("click", closeSidebar);
  // 모바일에서 메뉴 항목을 클릭해 페이지를 이동할 때 슬라이드 메뉴를 자동으로 닫는다.
  document.querySelectorAll("#site-sidebar .sidebar-menu a:not(#sidebar-logout-link)").forEach((a) => {
    a.addEventListener("click", closeSidebar);
  });
  document.getElementById("sidebar-logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("로그아웃하시겠습니까?")) logout();
  });
}

function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  mount.outerHTML = `
    <footer class="site-footer" id="site-footer">
      © 2026 기관사 안전교육 시스템 · 발표용 데모
    </footer>
  `;
}

// 각 페이지는 DOMContentLoaded 시점에 renderLayout(현재메뉴키) 한 번만 호출하면 된다.
function renderLayout(activeKey) {
  applyTheme();
  renderHeader();
  renderSidebar(activeKey);
  renderFooter();
}
