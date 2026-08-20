/* mypage.html 전용 데이터 & 로직 */

let profile = loadData("profile", {
  name: "김기관",
  empId: "22100119",
  role: "기관사",
  dept: "신답승무사업소",
  pw: "1234",
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

function renderStats() {
  document.getElementById("stat-accident").textContent = loadData("accidents", []).length;
  document.getElementById("stat-malfunction").textContent = loadData("malfunctions", []).length;
  document.getElementById("stat-emergency").textContent = loadData("emergencies", []).length;
  document.getElementById("stat-post").textContent = loadData("posts", []).length;
}

function changePassword(oldPw, newPw1, newPw2) {
  if (oldPw !== profile.pw) return { ok: false, message: "현재 비밀번호가 올바르지 않습니다." };
  if (newPw1.length < 4) return { ok: false, message: "새 비밀번호는 4자리 이상이어야 합니다." };
  if (newPw1 !== newPw2) return { ok: false, message: "새 비밀번호가 일치하지 않습니다." };
  updateProfile({ pw: newPw1 });
  return { ok: true, message: "비밀번호가 변경되었습니다." };
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("mypage");
  renderProfile();
  renderStats();

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
