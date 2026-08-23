/* mypage.html 전용 데이터 & 로직 */

let profile = loadData("profile", {
  name: "김기관",
  empId: "22100119",
  role: "기관사",
  dept: "신답승무사업소",
});
saveData("profile", profile);

/* ---------- CRUD (단일 레코드) ---------- */

function getProfile() {
  return profile;
}

function updateProfile(data) {
  profile = { ...profile, ...data };
  saveData("profile", profile);
  renderProfile();
}

/* ---------- 렌더링 ---------- */

function renderProfile() {
  document.getElementById("profile-name").textContent = `${profile.name} ${profile.role}`;
  document.getElementById("profile-meta").textContent = `사번: ${profile.empId} · 소속: ${profile.dept}`;
}

function renderEducationHistory() {
  const records = getAttendancesFor(profile.empId);
  const summary = summarizeEducation(records);

  document.getElementById("edu-stat-count").textContent = summary.count;
  document.getElementById("edu-stat-avg").textContent = `${summary.avgScore}점`;
  document.getElementById("edu-stat-accuracy").textContent = `${summary.accuracy}%`;

  document.getElementById("my-weak-areas").innerHTML = renderWeakAreasHtml(analyzeWeakAreas(records, 8));

  const recent = records.slice(0, 5);
  document.getElementById("my-edu-history").innerHTML = recent.length
    ? recent
        .map(
          (r) => `
      <div class="edu-history-day">
        <div class="edu-history-day-title">${r.date} · ${r.education.score}점</div>
        ${renderQuizReviewHtml(r.education.items)}
      </div>`
        )
        .join("")
    : `<div class="empty-state">아직 응시 이력이 없습니다. 홈 화면에서 출근을 완료하면 여기에 기록됩니다.</div>`;
}

function changePassword(oldPw, newPw1, newPw2) {
  if (oldPw !== getEmployeePassword(profile.empId)) return { ok: false, message: "현재 비밀번호가 올바르지 않습니다." };
  if (newPw1.length < 4) return { ok: false, message: "새 비밀번호는 4자리 이상이어야 합니다." };
  if (newPw1 !== newPw2) return { ok: false, message: "새 비밀번호가 일치하지 않습니다." };
  setEmployeePassword(profile.empId, newPw1);
  return { ok: true, message: "비밀번호가 변경되었습니다." };
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("mypage");
  renderProfile();
  renderEducationHistory();

  document.getElementById("pw-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const oldPw = document.getElementById("pw-old").value;
    const newPw1 = document.getElementById("pw-new1").value;
    const newPw2 = document.getElementById("pw-new2").value;
    const result = changePassword(oldPw, newPw1, newPw2);
    showToast(result.message);
    if (result.ok) e.target.reset();
  });
});
