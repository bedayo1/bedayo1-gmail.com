/* malfunction.html 전용 데이터 & 로직 */

let malfunctions = loadData("malfunctions", [
  { id: uid(), title: "출입문 미폐쇄 시 조치", type: "출입문", procedure: "해당 출입문 수동 잠금 처리 후 관제 보고, 지시에 따라 운행 여부 결정.", exampleImg: "", manualImg: "" },
  { id: uid(), title: "제동 불완전 체결", type: "제동장치", procedure: "무리한 운행 금지, 즉시 관제 보고 후 지시에 따름.", exampleImg: "", manualImg: "" },
]);
saveData("malfunctions", malfunctions);

/* ---------- CRUD ---------- */

function getAllMalfunctions() {
  return malfunctions;
}

function getMalfunction(id) {
  return malfunctions.find((m) => m.id === id);
}

function addMalfunction(data) {
  malfunctions.push({ id: uid(), ...data });
  saveData("malfunctions", malfunctions);
  renderMalfunctionList();
}

function updateMalfunction(id, data) {
  malfunctions = malfunctions.map((m) => (m.id === id ? { ...m, ...data } : m));
  saveData("malfunctions", malfunctions);
  renderMalfunctionList();
}

function deleteMalfunction(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  malfunctions = malfunctions.filter((m) => m.id !== id);
  saveData("malfunctions", malfunctions);
  renderMalfunctionList();
}

/* ---------- 렌더링 ---------- */

function renderMalfunctionList() {
  const tbody = document.getElementById("malfunction-tbody");

  if (malfunctions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">등록된 매뉴얼이 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = malfunctions
    .map(
      (m) => `
      <tr>
        <td class="title-cell"><a data-action="detail" data-id="${m.id}">${m.title}</a></td>
        <td><span class="badge info">${m.type}</span></td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${m.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${m.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='detail']").forEach((el) => {
    el.addEventListener("click", () => openDetail(el.dataset.id));
  });
  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteMalfunction(btn.dataset.id));
  });
}

/* ---------- 상세 화면 (메인 > 고장처치 매뉴얼 > 제목 클릭 시) ---------- */

function renderDetailImage(src, label) {
  if (!src) return `<div class="detail-image-empty">${label} 없음</div>`;
  return `<img class="detail-image" src="${src}" alt="${label}">`;
}

function openDetail(id) {
  const item = getMalfunction(id);
  if (!item) return;

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-body").innerHTML = `
    <div class="detail-section">
      <h4>고장유형</h4>
      <span class="badge info">${item.type}</span>
    </div>
    <div class="detail-section">
      <h4>처치 절차</h4>
      <p style="margin:0; font-size:14px; line-height:1.6;">${item.procedure}</p>
    </div>
    <div class="detail-section">
      <h4>고장예시 이미지</h4>
      ${renderDetailImage(item.exampleImg, "고장예시 이미지")}
    </div>
    <div class="detail-section">
      <h4>매뉴얼 이미지</h4>
      ${renderDetailImage(item.manualImg, "매뉴얼 이미지")}
    </div>
  `;
  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getMalfunction(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-type").value = item ? item.type : "출입문";
  document.getElementById("f-procedure").value = item ? item.procedure : "";
  document.getElementById("f-exampleimg").value = item ? item.exampleImg || "" : "";
  document.getElementById("f-manualimg").value = item ? item.manualImg || "" : "";
  title.textContent = item ? "매뉴얼 수정" : "매뉴얼 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("malfunction");
  renderMalfunctionList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });

  document.getElementById("malfunction-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      title: document.getElementById("f-title").value.trim(),
      type: document.getElementById("f-type").value,
      procedure: document.getElementById("f-procedure").value.trim(),
      exampleImg: document.getElementById("f-exampleimg").value.trim(),
      manualImg: document.getElementById("f-manualimg").value.trim(),
    };

    if (id) {
      updateMalfunction(id, data);
      showToast("매뉴얼이 수정되었습니다.");
    } else {
      addMalfunction(data);
      showToast("매뉴얼이 추가되었습니다.");
    }
    closeModal();
  });
});
