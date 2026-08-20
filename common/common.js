/* ============================================
   공통 JS — 2개 이상의 페이지에서 쓰는 함수/데이터만 여기에 작성
   ============================================ */

// 메뉴 추가 시 이 배열만 수정하면 모든 페이지의 사이드바가 함께 갱신된다.
const NAV_ITEMS = [
  { key: "home", label: "홈", path: "index.html", icon: "🏠" },
  { key: "course", label: "교육과정 관리", path: "pages/course/course.html", icon: "📚" },
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
      <div class="header-date">${formatDate(new Date())}</div>
    </header>
  `;
}

function renderSidebar(activeKey) {
  const mount = document.getElementById("site-sidebar");
  if (!mount) return;
  const base = getRootBase();
  const links = NAV_ITEMS.map((item) => {
    const cls = item.key === activeKey ? "active" : "";
    return `<a href="${base}${item.path}" class="${cls}"><span class="icon">${item.icon}</span>${item.label}</a>`;
  }).join("");

  mount.outerHTML = `
    <aside class="site-sidebar" id="site-sidebar">
      <div class="sidebar-title">메뉴</div>
      <nav>
        <ul class="sidebar-menu">${links}</ul>
      </nav>
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
  renderHeader();
  renderSidebar(activeKey);
  renderFooter();
}
