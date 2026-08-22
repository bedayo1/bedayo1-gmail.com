/* login.html 전용 데이터 & 로직 */
/* getEmployeePassword() 등 비밀번호 관련 함수는 common.js 에 있다 (마이페이지 비밀번호 변경과 공유). */

function showLoginError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.add("show");
}

function clearLoginError(id) {
  document.getElementById(id).classList.remove("show");
}

function loginAsEmployee() {
  clearLoginError("li-err");
  const empId = document.getElementById("li-id").value.trim();
  const pw = document.getElementById("li-pw").value;

  if (!empId || !pw) {
    showLoginError("li-err", "❌ 사번과 비밀번호를 입력하세요.");
    return;
  }

  const employees = loadData("employees", []);
  const emp = employees.find((e) => e.empId === empId);
  if (!emp) {
    showLoginError("li-err", "❌ 사번 또는 비밀번호가 올바르지 않습니다.");
    return;
  }
  if (pw !== getEmployeePassword(empId)) {
    showLoginError("li-err", "❌ 사번 또는 비밀번호가 올바르지 않습니다.");
    return;
  }

  saveData("profile", { name: emp.name, empId: emp.empId, role: emp.role, dept: emp.dept });
  saveData("session", {
    type: "employee",
    empId: emp.empId,
    name: emp.name,
    role: emp.role,
    dept: emp.dept,
    loginAt: new Date().toISOString(),
  });

  location.href = getRootBase() + "index.html";
}

function loginAsAdmin() {
  clearLoginError("adm-err");
  const id = document.getElementById("adm-id").value.trim();
  const pw = document.getElementById("adm-pw").value;

  if (id !== ADMIN_ACCOUNT.id || pw !== ADMIN_ACCOUNT.pw) {
    showLoginError("adm-err", "❌ 관리자 계정 정보가 올바르지 않습니다.");
    return;
  }

  saveData("session", { type: "admin", id, loginAt: new Date().toISOString() });

  const firstAdminItem = NAV_ITEMS.find((item) => item.group === "admin");
  location.href = getRootBase() + (firstAdminItem ? firstAdminItem.path : "index.html");
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();

  document.getElementById("btn-employee-login").addEventListener("click", loginAsEmployee);
  document.getElementById("btn-admin-login").addEventListener("click", loginAsAdmin);

  ["li-id", "li-pw"].forEach((id) => {
    document.getElementById(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginAsEmployee();
    });
  });
  ["adm-id", "adm-pw"].forEach((id) => {
    document.getElementById(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginAsAdmin();
    });
  });

  document.getElementById("link-to-admin").addEventListener("click", () => {
    document.getElementById("employee-login-box").style.display = "none";
    document.getElementById("admin-login-box").style.display = "block";
  });
  document.getElementById("link-to-employee").addEventListener("click", () => {
    document.getElementById("admin-login-box").style.display = "none";
    document.getElementById("employee-login-box").style.display = "block";
  });
});
