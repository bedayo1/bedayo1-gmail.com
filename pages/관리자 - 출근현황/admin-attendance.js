/* admin-attendance.html 전용 데이터 & 로직 */
/* 출근 마법사(index.js)가 저장한 attendances 원본을 그대로 읽어, 선택한 날짜 기준으로
   직원별 출근 상태(출근완료 / 직무배제 / 미출근)를 정리해서 보여준다. */

let selectedDate = formatDate(new Date());

const attPager = { page: 0, pageSize: 10 };
const attSearch = { field: "title", query: "" };

function buildDailyStatus(date) {
  const employees = loadData("employees", []);
  const records = getAllAttendances().filter((a) => a.date === date);
  const byEmpId = {};
  records.forEach((r) => {
    byEmpId[r.empId] = r;
  });

  return employees.map((emp) => {
    const record = byEmpId[emp.empId] || null;
    const status = !record ? "미출근" : record.excluded ? "직무배제" : "출근완료";
    return { ...emp, record, status };
  });
}

function renderStats(rows) {
  document.getElementById("stat-total").textContent = rows.length;
  document.getElementById("stat-done").textContent = rows.filter((r) => r.status === "출근완료").length;
  document.getElementById("stat-excluded").textContent = rows.filter((r) => r.status === "직무배제").length;
  document.getElementById("stat-none").textContent = rows.filter((r) => r.status === "미출근").length;
}

function statusBadge(status) {
  if (status === "출근완료") return `<span class="badge ok">✅ 출근완료</span>`;
  if (status === "직무배제") return `<span class="badge danger">🚫 직무배제</span>`;
  return `<span class="badge neutral">미출근</span>`;
}

function renderList() {
  const tbody = document.getElementById("att-tbody");
  const all = buildDailyStatus(selectedDate);
  renderStats(all);

  const filtered = filterByTitleContent(
    all,
    attSearch,
    (r) => r.name,
    (r) => [r.empId, r.dept].filter(Boolean).join(" ")
  );

  renderListSearch("att-search", attSearch, () => {
    attPager.page = 0;
    renderList();
  });
  const skipPaging = !!attSearch.query.trim() || isAppViewport();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">직원 데이터가 없습니다.</div></td></tr>`;
    renderPaginationOrAll("att-pager", attPager, 0, renderList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(filtered, attPager, skipPaging);

  tbody.innerHTML = pageItems
    .map(
      (r) => `
      <tr>
        <td class="mobile-hide">${r.empId}</td>
        <td class="title-cell">${r.name}</td>
        <td>${r.dept}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${r.record ? r.record.dispatch.actualTime || "-" : "-"}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="detail" data-id="${r.empId}" ${r.record ? "" : "disabled"}>상세보기</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='detail']").forEach((btn) => {
    btn.addEventListener("click", () => openDetail(btn.dataset.id));
  });

  renderPaginationOrAll("att-pager", attPager, filtered.length, renderList, skipPaging);
}

function renderRecordDetailHtml(record) {
  const d = record.dispatch;
  const f = record.fitness;

  if (record.excluded) {
    return `
      <div class="wizard-alert danger">🚫 이 날짜에 승무적합성검사에서 직무배제 대상으로 보고되었습니다.</div>
      <div class="wizard-section">
        <h4>출무시간</h4>
        <div class="detail-kv"><span>편성번호</span><span>${d.formationNo || "-"}</span></div>
        <div class="detail-kv"><span>실제출무시간</span><span>${d.actualTime || "-"}</span></div>
      </div>
      <div class="wizard-section">
        <h4>승무적합성검사</h4>
        <div class="detail-kv"><span>휴양시간</span><span>${f.restHours}</span></div>
        <div class="detail-kv"><span>음주유무 / 수치</span><span>${f.drinking} / ${f.drinkingLevel}</span></div>
        <div class="detail-kv"><span>약물복용</span><span>${f.drugUse}</span></div>
        <div class="detail-kv"><span>심신 이상여부</span><span>${f.mentalStatus}</span></div>
      </div>
    `;
  }

  const edu = record.education || { score: 0, items: [] };
  return `
    <div class="wizard-section">
      <h4>출무시간</h4>
      <div class="detail-kv"><span>편성번호</span><span>${d.formationNo || "-"}</span></div>
      <div class="detail-kv"><span>지정출무시간</span><span>${d.assignedTime || "-"}</span></div>
      <div class="detail-kv"><span>실제출무시간</span><span>${d.actualTime || "-"}</span></div>
    </div>
    <div class="wizard-section">
      <h4>승무적합성검사</h4>
      <div class="detail-kv"><span>휴양시간</span><span>${f.restHours}</span></div>
      <div class="detail-kv"><span>음주유무 / 수치</span><span>${f.drinking} / ${f.drinkingLevel}</span></div>
      <div class="detail-kv"><span>약물복용</span><span>${f.drugUse}</span></div>
      <div class="detail-kv"><span>심신 이상여부</span><span>${f.mentalStatus}</span></div>
    </div>
    <div class="wizard-section">
      <h4>일일안전교육 — ${edu.score}점</h4>
      ${renderQuizReviewHtml(edu.items)}
    </div>
  `;
}

function openDetail(empId) {
  const row = buildDailyStatus(selectedDate).find((r) => r.empId === empId);
  if (!row || !row.record) return;

  document.getElementById("att-detail-title").textContent = `${row.name} (${row.empId}) · ${row.dept} · ${selectedDate}`;
  document.getElementById("att-detail-body").innerHTML = renderRecordDetailHtml(row.record);
  document.getElementById("att-detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("att-detail-backdrop").classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("admin-attendance");

  const dateInput = document.getElementById("att-date");
  dateInput.value = selectedDate;
  dateInput.addEventListener("change", () => {
    selectedDate = dateInput.value || formatDate(new Date());
    attPager.page = 0;
    renderList();
  });

  renderList();
  onViewportChange(renderList);

  document.getElementById("btn-att-detail-close").addEventListener("click", closeDetail);
  document.getElementById("btn-att-detail-close2").addEventListener("click", closeDetail);
  document.getElementById("att-detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "att-detail-backdrop") closeDetail();
  });
});
