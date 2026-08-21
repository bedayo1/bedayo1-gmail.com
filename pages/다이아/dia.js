/* dia.html 전용 로직
   실제 표 데이터는 window.DIA_DATA 에 들어있다 (data/dia-data-<사업소>.js 에서 로드됨).
   구조: DIA_DATA["사업소명"]["근무구분"] = "<table class=dia-table>...</table>" (원본 xlsx 서식을 그대로 재현한 HTML)

   행로표 파일이 바뀌면?
   1) scripts/xlsx_to_html.ps1 (docs/다이아-데이터-생성.md 참고) 를 새 xlsx 파일로 다시 실행
   2) pages/다이아/data/dia-data-<사업소>.js 가 자동으로 다시 생성됨 (덮어쓰기)
   3) 새 사업소를 추가할 때는 dia.html 에 <script src="./data/dia-data-새사업소.js"> 한 줄만 추가하면 됨
*/

const DUTY_ORDER = ["평일", "휴일", "평평", "휴평", "평휴", "휴휴"];

let currentDepot = null;
let currentDuty = null;

function getDepots() {
  return Object.keys(window.DIA_DATA || {});
}

function getDutyTabsFor(depot) {
  const data = (window.DIA_DATA || {})[depot] || {};
  return DUTY_ORDER.filter((d) => Object.prototype.hasOwnProperty.call(data, d));
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
      renderDepotTabs();
      renderDutyTabs();
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
      renderDutyTabs();
      renderTable();
    });
  });
}

function renderTable() {
  const mount = document.getElementById("dia-table-mount");
  const data = (window.DIA_DATA || {})[currentDepot];
  const html = data ? data[currentDuty] : null;

  if (!html) {
    mount.innerHTML = `<div class="empty-state">불러올 다이아 데이터가 없습니다.</div>`;
    return;
  }

  mount.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("dia");

  const depots = getDepots();
  currentDepot = depots[0] || null;
  currentDuty = currentDepot ? getDutyTabsFor(currentDepot)[0] || null : null;

  renderDepotTabs();
  renderDutyTabs();
  renderTable();
});
