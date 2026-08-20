/* emergency.html 전용 데이터 & 로직 */

let emergencies = loadData("emergencies", [
  { id: uid(), title: "터널 내 정차 시 승객 대피", category: "화재", procedure: "가장 가까운 비상구 방향으로 승객 유도. 관제 지시를 우선 따른다." },
  { id: uid(), title: "선로 내 장애물 발견", category: "기타", procedure: "즉시 비상제동 체결 후 관제 보고. 서행 통과 절대 금지." },
]);
saveData("emergencies", emergencies);

/* ---------- CRUD ---------- */

function getAllEmergencies() {
  return emergencies;
}

function getEmergency(id) {
  return emergencies.find((e) => e.id === id);
}

function addEmergency(data) {
  emergencies.push({ id: uid(), ...data });
  saveData("emergencies", emergencies);
  renderEmergencyList();
}

function updateEmergency(id, data) {
  emergencies = emergencies.map((e) => (e.id === id ? { ...e, ...data } : e));
  saveData("emergencies", emergencies);
  renderEmergencyList();
}

function deleteEmergency(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  emergencies = emergencies.filter((e) => e.id !== id);
  saveData("emergencies", emergencies);
  renderEmergencyList();
}

/* ---------- 렌더링 ---------- */

function renderEmergencyList() {
  const tbody = document.getElementById("emergency-tbody");

  if (emergencies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">등록된 매뉴얼이 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = emergencies
    .map(
      (e) => `
      <tr>
        <td>${e.title}</td>
        <td><span class="badge danger">${e.category}</span></td>
        <td class="actions">
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
    btn.addEventListener("click", () => deleteEmergency(btn.dataset.id));
  });
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getEmergency(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-category").value = item ? item.category : "화재";
  document.getElementById("f-procedure").value = item ? item.procedure : "";
  title.textContent = item ? "매뉴얼 수정" : "매뉴얼 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("emergency");
  renderEmergencyList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("emergency-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      title: document.getElementById("f-title").value.trim(),
      category: document.getElementById("f-category").value,
      procedure: document.getElementById("f-procedure").value.trim(),
    };

    if (id) {
      updateEmergency(id, data);
      showToast("매뉴얼이 수정되었습니다.");
    } else {
      addEmergency(data);
      showToast("매뉴얼이 추가되었습니다.");
    }
    closeModal();
  });
});
