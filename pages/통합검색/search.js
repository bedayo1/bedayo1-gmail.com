/* search.html 전용 데이터 & 로직 */

let currentTypeFilter = "all";
let currentResults = [];
const searchPager = { page: 0, pageSize: 10 };

function renderFilters() {
  const mount = document.getElementById("search-filters");
  const types = ["all", ...new Set(SEARCH_SOURCES.map((s) => s.type))];
  mount.innerHTML = types
    .map(
      (t) =>
        `<button type="button" class="${t === currentTypeFilter ? "active" : ""}" data-type="${t}">${t === "all" ? "전체" : t}</button>`
    )
    .join("");
  mount.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTypeFilter = btn.dataset.type;
      searchPager.page = 0;
      renderFilters();
      runSearch();
    });
  });
}

function runSearch() {
  const q = document.getElementById("search-input").value;
  const summary = document.getElementById("search-summary");
  const results = document.getElementById("search-results");

  if (!q.trim()) {
    currentResults = [];
    summary.textContent = "";
    results.innerHTML = "";
    renderPagination("search-pager", searchPager, 0, runSearch);
    return;
  }

  let all = searchAll(q);
  if (currentTypeFilter !== "all") {
    all = all.filter((r) => r.type === currentTypeFilter);
  }
  currentResults = all;

  summary.textContent = `"${q}" 검색 결과 ${all.length}건`;

  if (all.length === 0) {
    results.innerHTML = `<div class="empty-state">일치하는 자료가 없습니다.</div>`;
    renderPagination("search-pager", searchPager, 0, runSearch);
    return;
  }

  const base = getRootBase();
  const pageItems = paginateList(all, searchPager);
  results.innerHTML = pageItems
    .map(
      (r) => `
      <a class="search-result-card" href="${base}${r.path}">
        <span class="badge info">${r.icon} ${r.type}</span>
        <div class="search-result-title">${r.title}</div>
        <div class="search-result-snippet">${r.snippet}</div>
      </a>`
    )
    .join("");

  renderPagination("search-pager", searchPager, all.length, runSearch);
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("search");
  renderFilters();

  const input = document.getElementById("search-input");
  input.addEventListener("input", () => {
    searchPager.page = 0;
    runSearch();
  });

  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  if (q) {
    input.value = q;
    runSearch();
  }
});
