/* dia.html 전용 로직
   실제 표 데이터는 window.DIA_DATA 에 들어있다 (data/dia-data-<사업소>.js 에서 로드됨).
   구조: DIA_DATA["사업소명"]["근무구분"] = ["<table>...</table>", "<table>...</table>", ...]
   (한 근무구분당 여러 페이지로 미리 쪼개져 있음 - 페이지마다 상단 머리글 행이 반복 포함되고,
    병합된 행 블록(운행 단위) 중간에서는 잘리지 않는다.)

   행로표 파일이 바뀌면?
   1) scripts/xlsx_to_dia_data.ps1 를 새 xlsx 파일로 다시 실행
   2) pages/다이아/data/dia-data-<사업소>.js 가 자동으로 다시 생성됨 (덮어쓰기)
   3) 새 사업소를 추가할 때는 dia.html 에 <script src="./data/dia-data-새사업소.js"> 한 줄만 추가하면 됨
*/

const DUTY_ORDER = ["평일", "휴일", "평평", "휴평", "평휴", "휴휴"];

// 사업소별 원본 엑셀(행로표) 파일 경로 — 사업소가 늘어나면 여기에 한 줄씩 추가하면 된다.
const DIA_XLSX_FILES = {
  신답승무사업소: "./data/1호선 행로표(26.02.28.).xlsx",
};

let currentDepot = null;
let currentDuty = null;
let currentPage = 0;

function getDepots() {
  return Object.keys(window.DIA_DATA || {});
}

function getDutyTabsFor(depot) {
  const data = (window.DIA_DATA || {})[depot] || {};
  return DUTY_ORDER.filter((d) => Object.prototype.hasOwnProperty.call(data, d));
}

function getPagesFor(depot, duty) {
  const data = (window.DIA_DATA || {})[depot];
  if (!data) return [];
  const pages = data[duty];
  return Array.isArray(pages) ? pages : pages ? [pages] : [];
}

function renderXlsxDownloadLink() {
  const link = document.getElementById("btn-download-xlsx");
  const file = currentDepot ? DIA_XLSX_FILES[currentDepot] : null;
  if (!file) {
    link.style.display = "none";
    return;
  }
  link.href = file;
  link.download = file.split("/").pop();
  link.style.display = "";
}

function renderDepotTabs() {
  const mount = document.getElementById("depot-tabs");
  const depots = getDepots();

  if (depots.length === 0) {
    mount.innerHTML = "";
    return;
  }

  mount.innerHTML = depots
    .map((d) => `<button type="button" class="${d === currentDepot ? "active" : ""}" data-key="${d}">${d}</button>`)
    .join("");

  mount.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentDepot = btn.dataset.key;
      const duties = getDutyTabsFor(currentDepot);
      currentDuty = duties[0] || null;
      currentPage = 0;
      renderDepotTabs();
      renderXlsxDownloadLink();
      renderDutyTabs();
      renderPager();
      renderTable();
    });
  });
}

function renderDutyTabs() {
  const mount = document.getElementById("duty-tabs");
  const duties = currentDepot ? getDutyTabsFor(currentDepot) : [];

  if (duties.length === 0) {
    mount.innerHTML = "";
    return;
  }

  mount.innerHTML = duties
    .map((d) => `<button type="button" class="${d === currentDuty ? "active" : ""}" data-key="${d}">${d}</button>`)
    .join("");

  mount.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentDuty = btn.dataset.key;
      currentPage = 0;
      renderDutyTabs();
      renderPager();
      renderTable();
    });
  });
}

function goToPage(idx) {
  const total = getPagesFor(currentDepot, currentDuty).length;
  if (idx < 0 || idx >= total) return;
  currentPage = idx;
  renderPager();
  renderTable();
  document.getElementById("dia-table-mount").scrollTo({ top: 0 });
}

function renderPager() {
  const mount = document.getElementById("dia-pager");
  const total = getPagesFor(currentDepot, currentDuty).length;

  if (total <= 1) {
    mount.innerHTML = "";
    return;
  }

  const pageButtons = [];
  for (let i = 0; i < total; i++) {
    pageButtons.push(
      `<button type="button" class="${i === currentPage ? "active" : ""}" data-page="${i}">${i + 1}</button>`
    );
  }

  mount.innerHTML = `
    <button type="button" data-page="${currentPage - 1}" ${currentPage === 0 ? "disabled" : ""}>이전</button>
    ${pageButtons.join("")}
    <button type="button" data-page="${currentPage + 1}" ${currentPage === total - 1 ? "disabled" : ""}>다음</button>
  `;

  mount.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => goToPage(Number(btn.dataset.page)));
  });
}

function renderTable() {
  const mount = document.getElementById("dia-table-mount");
  const pages = getPagesFor(currentDepot, currentDuty);
  const html = pages[currentPage];

  if (!html) {
    mount.innerHTML = `<div class="empty-state">불러올 다이아 데이터가 없습니다.</div>`;
    return;
  }

  mount.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.appReady; // 클라우드에서 최신 데이터를 받아온 뒤에 화면을 그린다
  renderLayout("dia");

  const depots = getDepots();
  currentDepot = depots[0] || null;
  currentDuty = currentDepot ? getDutyTabsFor(currentDepot)[0] || null : null;
  currentPage = 0;

  renderDepotTabs();
  renderXlsxDownloadLink();
  renderDutyTabs();
  renderPager();
  renderTable();
});
