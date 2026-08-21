/* admin-schedule.html 전용 데이터 & 로직 */

let schedules = loadData("schedules", [
  { id: uid(), line: "2호선", diaNo: "108", startTime: "05:30", stations: 43 },
  { id: uid(), line: "5호선", diaNo: "214", startTime: "05:45", stations: 51 },
]);
saveData("schedules", schedules);

/* ---------- CRUD ---------- */

function getAllSchedules() {
  return schedules;
}

function getSchedule(id) {
  return schedules.find((s) => s.id === id);
}

function addSchedule(data) {
  schedules.push({ id: uid(), ...data });
  saveData("schedules", schedules);
  renderScheduleList();
}

function updateSchedule(id, data) {
  schedules = schedules.map((s) => (s.id === id ? { ...s, ...data } : s));
  saveData("schedules", schedules);
  renderScheduleList();
}

function deleteSchedule(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  schedules = schedules.filter((s) => s.id !== id);
  saveData("schedules", schedules);
  renderScheduleList();
}

/* ---------- 렌더링 ---------- */

function renderScheduleList() {
  const tbody = document.getElementById("admin-schedule-tbody");

  if (schedules.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">등록된 다이아가 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = schedules
    .map(
      (s) => `
      <tr>
        <td>${s.line}</td>
        <td>${s.diaNo}</td>
        <td>${s.startTime}</td>
        <td>${s.stations}개</td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${s.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${s.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteSchedule(btn.dataset.id));
  });
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getSchedule(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-line").value = item ? item.line : "";
  document.getElementById("f-diano").value = item ? item.diaNo : "";
  document.getElementById("f-starttime").value = item ? item.startTime : "";
  document.getElementById("f-stations").value = item ? item.stations : "";
  title.textContent = item ? "다이아 수정" : "다이아 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("admin-schedule");
  renderScheduleList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("admin-schedule-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      line: document.getElementById("f-line").value.trim(),
      diaNo: document.getElementById("f-diano").value.trim(),
      startTime: document.getElementById("f-starttime").value,
      stations: Number(document.getElementById("f-stations").value),
    };

    if (id) {
      updateSchedule(id, data);
      showToast("다이아가 수정되었습니다.");
    } else {
      addSchedule(data);
      showToast("다이아가 추가되었습니다.");
    }
    closeModal();
  });
});
