/* admin-employee.html 전용 데이터 & 로직 */

// EMPLOYEE_SEED는 common/data-employees.js(공용 시드 데이터 파일, html에서 common.js보다 먼저 로드됨)에 정의되어 있다.
let employees = loadData(
  "employees",
  EMPLOYEE_SEED.map((e) => ({ id: uid(), ...e }))
);
saveData("employees", employees);

/* ---------- CRUD ---------- */

function getAllEmployees() {
  return employees;
}

function getEmployee(id) {
  return employees.find((e) => e.id === id);
}

function addEmployee(data) {
  employees.push({ id: uid(), ...data });
  saveData("employees", employees);
  renderEmployeeList();
}

function updateEmployee(id, data) {
  employees = employees.map((e) => (e.id === id ? { ...e, ...data } : e));
  saveData("employees", employees);
  renderEmployeeList();
}

function deleteEmployee(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  employees = employees.filter((e) => e.id !== id);
  saveData("employees", employees);
  renderEmployeeList();
}

/* ---------- 렌더링 ---------- */

const employeePager = { page: 0, pageSize: 10 };
const employeeSearch = { field: "title", query: "" };

function renderEmployeeList() {
  const tbody = document.getElementById("admin-employee-tbody");
  const filtered = filterByTitleContent(
    employees,
    employeeSearch,
    (e) => e.name,
    (e) => [e.empId, e.role, e.dept].filter(Boolean).join(" ")
  );

  renderListSearch("admin-employee-search", employeeSearch, () => {
    employeePager.page = 0;
    renderEmployeeList();
  });
  const skipPaging = !!employeeSearch.query.trim() || isAppViewport();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">등록된 직원이 없습니다.</div></td></tr>`;
    renderPaginationOrAll("admin-employee-pager", employeePager, 0, renderEmployeeList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(filtered, employeePager, skipPaging);

  tbody.innerHTML = pageItems
    .map(
      (e) => `
      <tr>
        <td class="mobile-hide">${e.empId}</td>
        <td class="title-cell">${e.name}</td>
        <td>${e.role}</td>
        <td>${e.dept}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="reset-pw" data-id="${e.empId}">비번초기화</button>
          <button class="btn secondary small" data-action="edit" data-id="${e.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${e.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteEmployee(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='reset-pw']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const empId = btn.dataset.id;
      if (!confirm(`사번 ${empId}의 비밀번호를 초기 비밀번호(1234)로 되돌릴까요?`)) return;
      setEmployeePassword(empId, "1234");
      showToast("비밀번호가 1234로 초기화되었습니다.");
    });
  });

  renderPaginationOrAll("admin-employee-pager", employeePager, filtered.length, renderEmployeeList, skipPaging);
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getEmployee(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-empid").value = item ? item.empId : "";
  document.getElementById("f-name").value = item ? item.name : "";
  document.getElementById("f-role").value = item ? item.role : "기관사";
  document.getElementById("f-dept").value = item ? item.dept : "";
  title.textContent = item ? "직원 정보 수정" : "직원 등록";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("admin-employee");
  renderEmployeeList();
  onViewportChange(renderEmployeeList);

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("admin-employee-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      empId: document.getElementById("f-empid").value.trim(),
      name: document.getElementById("f-name").value.trim(),
      role: document.getElementById("f-role").value,
      dept: document.getElementById("f-dept").value.trim(),
    };

    if (id) {
      updateEmployee(id, data);
      showToast("직원 정보가 수정되었습니다.");
    } else {
      addEmployee(data);
      showToast("직원이 등록되었습니다.");
    }
    closeModal();
  });
});
