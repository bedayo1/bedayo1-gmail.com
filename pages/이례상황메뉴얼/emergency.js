/* emergency.html 전용 데이터 & 로직 */

let emergencies = loadData("emergencies", [
  {
    id: uid(),
    title: "터널 내 정차 시 승객 대피",
    category: "화재",
    condition: "터널 구간에서 화재로 인해 열차가 정차하고 자력 운행이 불가능한 경우",
    procedureSteps: [
      "즉시 비상제동 체결 및 관제 보고",
      "승객 안내방송으로 상황 공지",
      "가장 가까운 비상구 방향으로 승객 유도",
      "대피 완료 후 관제에 최종 인원 보고",
    ],
    caution: "관제 지시 없이 임의로 열차를 재기동하지 않는다. 연기 방향을 확인해 반대 방향으로 대피시킨다.",
    reference: "철도안전법 시행규칙 제.., 사내 비상대응지침 3장",
  },
  {
    id: uid(),
    title: "선로 내 장애물 발견",
    category: "기타",
    condition: "운행 중 전방 선로 위에서 사람, 차량, 낙하물 등 장애물을 육안으로 확인한 경우",
    procedureSteps: [
      "즉시 비상제동 체결",
      "관제에 위치와 상황 보고",
      "서행 통과 절대 금지, 관제 지시 대기",
    ],
    caution: "장애물 제거를 위해 임의로 선로에 진입하지 않는다.",
    reference: "사내 비상대응지침 5장",
  },
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

const emergencyPager = { page: 0, pageSize: 10 };
const emergencySearch = { field: "title", query: "" };

function renderEmergencyList() {
  const tbody = document.getElementById("emergency-tbody");
  const filtered = filterByTitleContent(
    emergencies,
    emergencySearch,
    (e) => e.title,
    (e) => [e.condition, (e.procedureSteps || []).join(" "), e.caution].filter(Boolean).join(" ")
  );

  renderListSearch("emergency-search", emergencySearch, () => {
    emergencyPager.page = 0;
    renderEmergencyList();
  });
  const skipPaging = !!emergencySearch.query.trim() || isAppViewport();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">등록된 매뉴얼이 없습니다.</div></td></tr>`;
    renderPaginationOrAll("emergency-pager", emergencyPager, 0, renderEmergencyList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(filtered, emergencyPager, skipPaging);

  tbody.innerHTML = pageItems
    .map(
      (e) => `
      <tr>
        <td class="title-cell"><button type="button" class="link-title" data-action="detail" data-id="${e.id}">${e.title}</button></td>
        <td><span class="badge danger">${e.category}</span></td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${e.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${e.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='detail']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteEmergency(btn.dataset.id));
  });

  renderPaginationOrAll("emergency-pager", emergencyPager, filtered.length, renderEmergencyList, skipPaging);
}

/* ---------- 모달 (상세/등록/수정 공용) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getEmergency(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-category").value = item ? item.category : "화재";
  document.getElementById("f-condition").value = item ? item.condition : "";
  document.getElementById("f-procedure").value = item ? (item.procedureSteps || []).join("\n") : "";
  document.getElementById("f-caution").value = item ? item.caution : "";
  document.getElementById("f-reference").value = item ? item.reference : "";
  title.textContent = item ? "이례상황 매뉴얼 상세" : "매뉴얼 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("emergency");
  renderEmergencyList();
  onViewportChange(renderEmergencyList);

  // 마이페이지 취약분야 목록 등에서 ?title= 로 넘어온 경우 해당 매뉴얼 상세를 바로 연다.
  const titleParam = new URLSearchParams(location.search).get("title");
  if (titleParam) {
    const target = emergencies.find((e) => e.title === titleParam);
    if (target) openModal(target.id);
  }

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
      condition: document.getElementById("f-condition").value.trim(),
      procedureSteps: document
        .getElementById("f-procedure")
        .value.split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      caution: document.getElementById("f-caution").value.trim(),
      reference: document.getElementById("f-reference").value.trim(),
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
