/* admin-education.html 전용 데이터 & 로직 */
/* 일일안전교육(출근 시 응시하는 고장처치/이례상황 매뉴얼 기반 문제풀이) 결과를 직원별로 모아서 보여준다.
   원본 데이터는 attendances(홈 화면 출근 마법사가 저장) 이고, 요약/취약분야 계산은 common.js 의
   summarizeEducation() / analyzeWeakAreas() 를 그대로 재사용한다. */

// 직원 한 명당 { ...employee, count, avgScore, accuracy, weak, records } 형태로 요약을 만든다.
function buildEmployeeEducationSummaries() {
  const employees = loadData("employees", []);
  const allAttendances = getAllAttendances();

  return employees.map((emp) => {
    const records = allAttendances
      .filter((a) => a.empId === emp.empId)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const summary = summarizeEducation(records);
    const weak = analyzeWeakAreas(records, 5);
    return { ...emp, ...summary, weak, records };
  });
}

const eduPager = { page: 0, pageSize: 10 };
const eduSearch = { field: "title", query: "" };

function renderStats(summaries) {
  const totalCount = summaries.reduce((sum, s) => sum + s.count, 0);
  const totalQuestions = summaries.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = summaries.reduce((sum, s) => sum + s.totalCorrect, 0);
  const withRecords = summaries.filter((s) => s.count > 0);
  const avgScore = withRecords.length
    ? Math.round(withRecords.reduce((sum, s) => sum + s.avgScore, 0) / withRecords.length)
    : 0;
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const noAttempt = summaries.length - withRecords.length;
  const retrainingCount = summaries.filter((s) => needsRetraining(s)).length;

  document.getElementById("stat-total-count").textContent = totalCount;
  document.getElementById("stat-avg-score").textContent = `${avgScore}점`;
  document.getElementById("stat-accuracy").textContent = `${accuracy}%`;
  document.getElementById("stat-no-attempt").textContent = `${noAttempt}명`;
  document.getElementById("stat-retraining").textContent = `${retrainingCount}명`;
}

// 좋아요 수 기준 매뉴얼 Top5 — 어떤 매뉴얼이 실제로 직원들에게 도움이 됐는지 파악하기 위함.
function renderPopularManuals() {
  const mount = document.getElementById("popular-manuals");
  const base = getRootBase();

  const malfunctionItems = loadData("malfunctions", []).map((m) => ({
    type: "고장처치",
    title: m.title,
    likes: (m.likedBy || []).length,
    views: m.views || 0,
    href: `${base}pages/고장조치메뉴얼/malfunction.html?title=${encodeURIComponent(m.title)}`,
  }));
  const emergencyItems = loadData("emergencies", []).map((e) => ({
    type: "이례상황",
    title: e.title,
    likes: (e.likedBy || []).length,
    views: e.views || 0,
    href: `${base}pages/이례상황메뉴얼/emergency.html?title=${encodeURIComponent(e.title)}`,
  }));

  const top5 = [...malfunctionItems, ...emergencyItems]
    .filter((x) => x.likes > 0)
    .sort((a, b) => b.likes - a.likes || b.views - a.views)
    .slice(0, 5);

  mount.innerHTML = top5.length
    ? `<div class="weak-area-list">
        ${top5
          .map(
            (x) => `
          <a class="weak-area-item" href="${x.href}">
            <span class="badge ${x.type === "고장처치" ? "info" : "danger"}">${x.type}</span>
            <span class="weak-area-title">${x.title}</span>
            <span class="weak-area-rate">❤️ ${x.likes} · 👁 ${x.views}</span>
          </a>`
          )
          .join("")}
      </div>`
    : `<div class="empty-state">아직 좋아요를 받은 매뉴얼이 없습니다.</div>`;
}

function renderList() {
  const tbody = document.getElementById("edu-tbody");
  const all = buildEmployeeEducationSummaries();
  renderStats(all);

  const filtered = filterByTitleContent(
    all,
    eduSearch,
    (s) => s.name,
    (s) => [s.empId, s.dept].filter(Boolean).join(" ")
  );

  renderListSearch("edu-search", eduSearch, () => {
    eduPager.page = 0;
    renderList();
  });
  const skipPaging = !!eduSearch.query.trim() || isAppViewport();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">직원 데이터가 없습니다.</div></td></tr>`;
    renderPaginationOrAll("edu-pager", eduPager, 0, renderList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(filtered, eduPager, skipPaging);

  tbody.innerHTML = pageItems
    .map((s) => {
      const topWeak = s.weak[0] ? `${s.weak[0].title} (오답 ${s.weak[0].wrong}/${s.weak[0].total})` : "-";
      const retraining = needsRetraining(s);
      return `
      <tr>
        <td class="mobile-hide">${s.empId}</td>
        <td class="title-cell">${s.name}${retraining ? ` <span class="badge retraining-badge">🔴 재교육 필요</span>` : ""}</td>
        <td>${s.dept}</td>
        <td>${s.count ? `${s.count}회` : `<span class="badge neutral">미응시</span>`}</td>
        <td>${s.count ? `${s.avgScore}점` : "-"}</td>
        <td>${s.count ? `${s.accuracy}%` : "-"}</td>
        <td>${topWeak}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="detail" data-id="${s.empId}" ${s.count ? "" : "disabled"}>상세보기</button>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-action='detail']").forEach((btn) => {
    btn.addEventListener("click", () => openDetail(btn.dataset.id));
  });

  renderPaginationOrAll("edu-pager", eduPager, filtered.length, renderList, skipPaging);
}

function openDetail(empId) {
  const summaries = buildEmployeeEducationSummaries();
  const s = summaries.find((x) => x.empId === empId);
  if (!s) return;

  document.getElementById("edu-detail-title").textContent = `${s.name} (${s.empId}) · ${s.dept}${needsRetraining(s) ? " · 🔴 재교육 필요" : ""}`;

  const eduRecords = s.records.filter((r) => !r.excluded);
  const recentRecords = eduRecords.slice(0, 5);
  const historyHtml = recentRecords
    .map(
      (r) => `
      <div class="edu-history-day">
        <div class="edu-history-day-title">${r.date} · ${r.education.score}점</div>
        ${renderQuizReviewHtml(r.education.items)}
      </div>`
    )
    .join("");

  document.getElementById("edu-detail-body").innerHTML = `
    <div class="edu-detail-summary">
      <div class="mini-stat"><div class="mini-num">${s.count}</div><div class="mini-lbl">응시 횟수</div></div>
      <div class="mini-stat"><div class="mini-num">${s.avgScore}</div><div class="mini-lbl">평균 점수</div></div>
      <div class="mini-stat"><div class="mini-num">${s.accuracy}%</div><div class="mini-lbl">정답률</div></div>
    </div>
    <div class="wizard-section">
      <h4>차종별 정답률</h4>
      ${renderVehicleTypeStatsHtml(analyzeVehicleTypeStats(s.records))}
    </div>
    <div class="wizard-section">
      <h4>취약분야 (오답이 있었던 매뉴얼)</h4>
      ${renderWeakAreasHtml(s.weak)}
    </div>
    <div class="wizard-section">
      <h4>최근 응시 이력${eduRecords.length > 5 ? ` (최근 5건 · 전체 ${eduRecords.length}건)` : ""}</h4>
      ${historyHtml || `<div class="empty-state">응시 이력이 없습니다.</div>`}
    </div>
  `;
  document.getElementById("edu-detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("edu-detail-backdrop").classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("admin-education");
  renderList();
  renderPopularManuals();
  onViewportChange(renderList);

  document.getElementById("btn-edu-detail-close").addEventListener("click", closeDetail);
  document.getElementById("btn-edu-detail-close2").addEventListener("click", closeDetail);
  document.getElementById("edu-detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "edu-detail-backdrop") closeDetail();
  });
});
