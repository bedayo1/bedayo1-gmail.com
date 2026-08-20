/* accident.html 전용 데이터 & 로직 */

let accidents = loadData("accidents", [
  { id: uid(), title: "출입문 끼임 사고", date: "2026-03-12", line: "2호선", summary: "승강장 출입문 폐쇄 중 승객 소지품 끼임으로 재개방 지연 발생. 출입문 폐쇄 전 육안 확인 절차 재교육 필요." },
  { id: uid(), title: "정위치 초과 정차", date: "2026-05-02", line: "5호선", summary: "제동 지연으로 정위치를 1.2m 초과하여 정차. 관제 보고 후 재취급 완료." },
]);
saveData("accidents", accidents);

/* ---------- CRUD ---------- */

function getAllAccidents() {
  return accidents;
}

function getAccident(id) {
  return accidents.find((a) => a.id === id);
}

function addAccident(data) {
  accidents.push({ id: uid(), ...data });
  saveData("accidents", accidents);
  renderAccidentList();
}

function updateAccident(id, data) {
  accidents = accidents.map((a) => (a.id === id ? { ...a, ...data } : a));
  saveData("accidents", accidents);
  renderAccidentList();
}

function deleteAccident(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  accidents = accidents.filter((a) => a.id !== id);
  saveData("accidents", accidents);
  renderAccidentList();
}

/* ---------- 렌더링 ---------- */

function renderAccidentList() {
  const tbody = document.getElementById("accident-tbody");

  if (accidents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">등록된 사고사례가 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = accidents
    .map(
      (a) => `
      <tr>
        <td>${a.title}</td>
        <td>${a.date}</td>
        <td>${a.line}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${a.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${a.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteAccident(btn.dataset.id));
  });
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getAccident(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-date").value = item ? item.date : "";
  document.getElementById("f-line").value = item ? item.line : "";
  document.getElementById("f-summary").value = item ? item.summary : "";
  title.textContent = item ? "사고사례 수정" : "사고사례 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("accident");
  renderAccidentList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("accident-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      title: document.getElementById("f-title").value.trim(),
      date: document.getElementById("f-date").value,
      line: document.getElementById("f-line").value.trim(),
      summary: document.getElementById("f-summary").value.trim(),
    };

    if (id) {
      updateAccident(id, data);
      showToast("사고사례가 수정되었습니다.");
    } else {
      addAccident(data);
      showToast("사고사례가 추가되었습니다.");
    }
    closeModal();
  });
});
