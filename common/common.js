/* ============================================
   공통 JS — 2개 이상의 페이지에서 쓰는 함수/데이터만 여기에 작성
   ============================================ */

// 메뉴 추가 시 이 배열만 수정하면 모든 페이지의 사이드바가 함께 갱신된다.
// group: "main"(사용자 메뉴) | "admin"(관리자 메뉴)
const NAV_ITEMS = [
  { key: "home", label: "홈", path: "index.html", icon: "🏠", group: "main" },
  { key: "course", label: "교육과정 관리", path: "pages/course/course.html", icon: "📚", group: "main" },
  { key: "accident", label: "사고사례", path: "pages/accident/accident.html", icon: "📋", group: "main" },
  { key: "malfunction", label: "고장처치 매뉴얼", path: "pages/malfunction/malfunction.html", icon: "🔧", group: "main" },
  { key: "emergency", label: "이례상황 매뉴얼", path: "pages/emergency/emergency.html", icon: "🚨", group: "main" },
  { key: "board", label: "자유게시판", path: "pages/board/board.html", icon: "💬", group: "main" },
  { key: "mypage", label: "마이페이지", path: "pages/mypage/mypage.html", icon: "👤", group: "main" },
  { key: "admin-employee", label: "직원 관리", path: "pages/admin-employee/admin-employee.html", icon: "👥", group: "admin" },
  { key: "admin-notice", label: "공지·지시사항 관리", path: "pages/admin-notice/admin-notice.html", icon: "📢", group: "admin" },
  { key: "admin-quiz", label: "문제(적합성검사) 관리", path: "pages/admin-quiz/admin-quiz.html", icon: "🧠", group: "admin" },
  { key: "admin-schedule", label: "다이아·스케줄 관리", path: "pages/admin-schedule/admin-schedule.html", icon: "📅", group: "admin" },
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

function renderHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  mount.outerHTML = `
    <header class="site-header" id="site-header">
      <div class="brand">기관사 안전교육
        <span class="sub">Locomotive Engineer Safety Training</span>
      </div>
      <div class="header-right">
        <button class="theme-toggle-btn" id="theme-toggle-btn" type="button" title="라이트/다크 모드 전환">🌙</button>
        <div class="header-date">${formatDate(new Date())}</div>
      </div>
    </header>
  `;
  document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);
  updateThemeToggleIcon();
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
