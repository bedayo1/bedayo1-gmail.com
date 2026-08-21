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
  { key: "malfunction", label: "고장처치 매뉴얼", path: "pages/고장조치메뉴얼/malfunction.html", icon: "🔧", group: "main" },
  { key: "emergency", label: "이례상황 매뉴얼", path: "pages/이례상황메뉴얼/emergency.html", icon: "🚨", group: "main" },
  { key: "board", label: "자유게시판", path: "pages/자유게시판/board.html", icon: "💬", group: "main" },
  { key: "mypage", label: "마이페이지", path: "pages/마이페이지/mypage.html", icon: "👤", group: "main" },
  { key: "admin-employee", label: "직원 관리", path: "pages/관리자 - 직원관리/admin-employee.html", icon: "👥", group: "admin" },
  { key: "admin-notice", label: "공지·지시사항 관리", path: "pages/관리자- 공지'지시사항관리/admin-notice.html", icon: "📢", group: "admin" },
  { key: "admin-quiz", label: "문제(적합성검사) 관리", path: "pages/관리자 - 문제관리/admin-quiz.html", icon: "🧠", group: "admin" },
  { key: "admin-schedule", label: "다이아·스케줄 관리", path: "pages/관리자 - 다이아(스케쥴) 관리/admin-schedule.html", icon: "📅", group: "admin" },
];

const NAV_GROUPS = [
  { key: "main", title: "메인 메뉴" },
  { key: "admin", title: "관리자" },
];

const STORAGE_PREFIX = "kcs_"; // 기관사(KiCSa) 안전교육 앱 localStorage 네임스페이스

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
    key: "quizzes",
    type: "문제",
    icon: "🧠",
    path: "pages/관리자 - 문제관리/admin-quiz.html",
    getTitle: (x) => x.question,
    getText: (x) => [x.category, x.question, x.answer].join(" "),
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
  mount.outerHTML = `
    <header class="site-header" id="site-header">
      <div class="brand">기관사 안전교육
        <span class="sub">Locomotive Engineer Safety Training</span>
      </div>
      <div class="header-right">
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
  updateThemeToggleIcon();
  wireHeaderWidgets(base);
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

  const sections = NAV_GROUPS.map((group) => {
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
      <nav>${sections}</nav>
    </aside>
  `;
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
