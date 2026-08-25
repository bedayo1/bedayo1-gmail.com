/* admin-notice.html 전용 데이터 & 로직 */

let adminNotices = loadData("adminNotices", [
  { id: uid(), title: "혹서기 서행운전 안내", type: "알림", content: "혹서기 레일 온도 상승에 따른 서행구간을 반드시 준수 바랍니다." },
  { id: uid(), title: "금일 승무 전 음주측정 필수", type: "지시사항", content: "승무 전 전원 음주측정 후 출무하시기 바랍니다." },
]);
saveData("adminNotices", adminNotices);

/* ---------- CRUD ---------- */

function getAllAdminNotices() {
  return adminNotices;
}

function getAdminNotice(id) {
  return adminNotices.find((n) => n.id === id);
}

function addAdminNotice(data) {
  adminNotices.push({ id: uid(), ...data });
  saveData("adminNotices", adminNotices);
  renderAdminNoticeList();
}

function updateAdminNotice(id, data) {
  adminNotices = adminNotices.map((n) => (n.id === id ? { ...n, ...data } : n));
  saveData("adminNotices", adminNotices);
  renderAdminNoticeList();
}

function deleteAdminNotice(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  adminNotices = adminNotices.filter((n) => n.id !== id);
  saveData("adminNotices", adminNotices);
  renderAdminNoticeList();
}

/* ---------- 렌더링 ---------- */

const adminNoticePager = { page: 0, pageSize: 10 };
const adminNoticeSearch = { field: "title", query: "" };

function renderAdminNoticeList() {
  const tbody = document.getElementById("admin-notice-tbody");
  const filtered = filterByTitleContent(adminNotices, adminNoticeSearch, (n) => n.title, (n) => n.content);

  renderListSearch("admin-notice-search", adminNoticeSearch, () => {
    adminNoticePager.page = 0;
    renderAdminNoticeList();
  });
  const skipPaging = !!adminNoticeSearch.query.trim() || isAppViewport();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">등록된 공지·지시사항이 없습니다.</div></td></tr>`;
    renderPaginationOrAll("admin-notice-pager", adminNoticePager, 0, renderAdminNoticeList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(filtered, adminNoticePager, skipPaging);

  const totalEmployees = loadData("employees", []).length;

  tbody.innerHTML = pageItems
    .map((n) => {
      const ackCount = (n.ackedBy || []).length;
      return `
      <tr>
        <td class="title-cell">
          ${n.title}
          ${!isWithinNoticePeriod(n) ? `<span class="badge neutral">기간외</span>` : ""}
        </td>
        <td><span class="badge ${NOTICE_TYPE_BADGE_CLASS[n.type] || "neutral"}">${n.type}</span></td>
        <td class="actions">
          <button class="btn secondary small" data-action="ack" data-id="${n.id}">확인현황 (${ackCount}/${totalEmployees})</button>
          <button class="btn secondary small" data-action="edit" data-id="${n.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${n.id}">삭제</button>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteAdminNotice(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='ack']").forEach((btn) => {
    btn.addEventListener("click", () => openAckStatus(btn.dataset.id));
  });

  renderPaginationOrAll("admin-notice-pager", adminNoticePager, filtered.length, renderAdminNoticeList, skipPaging);
}

/* ---------- 확인현황 (누가 이 공지사항을 확인했는지) ---------- */

function openAckStatus(id) {
  const item = getAdminNotice(id);
  if (!item) return;

  const employees = loadData("employees", []);
  const ackedByIdSet = new Set((item.ackedBy || []).map((a) => a.empId));
  const acked = [...(item.ackedBy || [])].sort((a, b) => (a.ackedAt < b.ackedAt ? 1 : -1));
  const unacked = employees.filter((e) => !ackedByIdSet.has(e.empId));

  document.getElementById("ack-title").textContent = `확인현황 · ${item.title}`;
  document.getElementById("ack-body").innerHTML = `
    <div class="wizard-section">
      <h4>확인 완료 (${acked.length}/${employees.length})</h4>
      ${
        acked.length
          ? `<div class="weak-area-list">
              ${acked
                .map(
                  (a) => `
                <div class="weak-area-item">
                  <span class="weak-area-title">${a.name} (${a.empId})</span>
                  <span class="weak-area-rate">${formatDate(a.ackedAt)}</span>
                </div>`
                )
                .join("")}
            </div>`
          : `<div class="empty-state">아직 아무도 확인하지 않았습니다.</div>`
      }
    </div>
    <div class="wizard-section">
      <h4>미확인 (${unacked.length}명)</h4>
      ${
        unacked.length
          ? `<div class="weak-area-list">
              ${unacked
                .map((e) => `<div class="weak-area-item"><span class="weak-area-title">${e.name} (${e.empId})</span></div>`)
                .join("")}
            </div>`
          : `<div class="empty-state">전 직원이 확인했습니다.</div>`
      }
    </div>
  `;
  document.getElementById("ack-backdrop").classList.add("open");
}

function closeAckStatus() {
  document.getElementById("ack-backdrop").classList.remove("open");
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getAdminNotice(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-type").value = item ? item.type : NOTICE_TYPES[0];
  document.getElementById("f-content").value = item ? item.content || "" : "";
  document.getElementById("f-photo-picker").value = "";
  populatePhotoEditor(document.getElementById("editor"), item ? item.photos : []);
  document.getElementById("f-start-date").value = item ? item.startDate || "" : "";
  document.getElementById("f-end-date").value = item ? item.endDate || "" : "";
  title.textContent = item ? "수정" : "등록";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("admin-notice");

  document.getElementById("f-type").innerHTML = NOTICE_TYPES.map((t) => `<option value="${t}">${t}</option>`).join("");

  renderAdminNoticeList();
  onViewportChange(renderAdminNoticeList);

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("btn-cancel2").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  wirePhotoEditor(
    document.getElementById("editor"),
    document.getElementById("btn-add-photo"),
    document.getElementById("f-photo-picker")
  );

  document.getElementById("btn-ack-close").addEventListener("click", closeAckStatus);
  document.getElementById("btn-ack-close2").addEventListener("click", closeAckStatus);
  document.getElementById("ack-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "ack-backdrop") closeAckStatus();
  });

  document.getElementById("admin-notice-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const content = document.getElementById("f-content").value.trim();
    const photos = collectPhotosFromEditor(document.getElementById("editor"));

    if (!content && photos.length === 0) {
      showToast("내용을 입력하거나 문서 사진을 첨부해주세요.");
      return;
    }

    const data = {
      title: document.getElementById("f-title").value.trim(),
      type: document.getElementById("f-type").value,
      content,
      photos,
      startDate: document.getElementById("f-start-date").value,
      endDate: document.getElementById("f-end-date").value,
    };

    if (id) {
      updateAdminNotice(id, data);
      showToast("수정되었습니다.");
    } else {
      addAdminNotice(data);
      showToast("등록되었습니다.");
    }
    closeModal();
  });
});
