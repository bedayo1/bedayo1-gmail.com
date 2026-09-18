/* emergency.html 전용 데이터 & 로직 */

// EMERGENCY_SEED는 common/data-emergencies.js(공용 시드 데이터 파일, html에서 common.js보다 먼저 로드됨)에 정의되어 있다.

let emergencies = loadData(
  "emergencies",
  EMERGENCY_SEED.map((e) => ({ id: uid(), ...e }))
);
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
        <td class="title-cell"><button type="button" class="link-title" data-action="detail" data-id="${e.id}">${e.title}</button>${renderViewsLikesBadge(e)}</td>
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

function renderEmergencyLikesBar(item) {
  const mount = document.getElementById("views-likes-mount");
  if (!item) {
    mount.innerHTML = "";
    return;
  }
  mount.innerHTML = renderViewsLikesHtml(item);
  mount.querySelector(".like-btn").addEventListener("click", () => {
    toggleLike(item);
    saveData("emergencies", emergencies);
    renderEmergencyLikesBar(item);
  });
}

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getEmergency(id) : null;

  if (item) {
    recordView(item);
    saveData("emergencies", emergencies);
  }
  renderEmergencyLikesBar(item);

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-category").value = item ? item.category : "열차운행장애";
  document.getElementById("f-condition").value = item ? item.condition : "";
  document.getElementById("f-procedure").value = item ? (item.procedureSteps || []).join("\n") : "";
  document.getElementById("f-caution").value = item ? item.caution : "";
  document.getElementById("f-reference").value = item ? item.reference : "";
  title.textContent = item ? "이례상황 매뉴얼 상세" : "매뉴얼 추가";

  backdrop.classList.add("open");
}

function renderEmergencyBodyHtml(item) {
  return `
    <h4>상황 유형</h4><p>${item.category}</p>
    <h4>발생/적용 조건</h4><p>${item.condition || ""}</p>
    <h4>대응 절차</h4><p>${(item.procedureSteps || []).map((s, i) => `${i + 1}. ${s}`).join("<br>")}</p>
    ${item.caution ? `<h4>주의사항</h4><p>${item.caution}</p>` : ""}
    ${item.reference ? `<h4>관련 근거(규정)</h4><p>${item.reference}</p>` : ""}
  `;
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
  renderEmergencyList(); // 조회수/좋아요가 목록 뱃지에도 바로 반영되게 갱신
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  await window.appReady; // 클라우드에서 최신 데이터를 받아온 뒤에 화면을 그린다
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

  document.getElementById("btn-download-all").addEventListener("click", () => {
    if (emergencies.length === 0) {
      showToast("다운로드할 매뉴얼이 없습니다.");
      return;
    }
    const bodyHtml = emergencies.map((e) => `<h2>${e.title}</h2>${renderEmergencyBodyHtml(e)}<hr>`).join("");
    downloadAsHtml("이례상황매뉴얼_전체", "이례상황 매뉴얼 (전체)", bodyHtml);
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
