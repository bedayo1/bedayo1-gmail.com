/* admin-notice.html 전용 데이터 & 로직 */

// NOTICE_SEED는 common/data-notices.js(공용 시드 데이터 파일, html에서 common.js보다 먼저 로드됨)에 정의되어 있다.
let adminNotices = loadData(
  "adminNotices",
  NOTICE_SEED.map((n) => ({ id: uid(), ...n }))
);
saveData("adminNotices", adminNotices);

/* ---------- 확인현황 한눈에 보기 ---------- */
/* 노출 중인 공지마다 확인/미확인 인원을 이름 칩으로 바로 보여준다 (클릭해서 들어가야 하는 확인현황 모달과 별개로,
   목록 진입 즉시 전체 현황을 한눈에 파악할 수 있게 하기 위함). */

const ACK_OVERVIEW_CHIP_LIMIT = 20;
const ACK_OVERVIEW_EMP_LIMIT = 15;
let ackOverviewExpanded = false;

function renderChipList(people, cls) {
  if (people.length === 0) return `<span class="empty-state" style="padding:0;">-</span>`;
  const shown = people.slice(0, ACK_OVERVIEW_CHIP_LIMIT);
  const rest = people.length - shown.length;
  return `
    <div class="chip-list">
      ${shown.map((p) => `<span class="chip ${cls}">${p.name}</span>`).join("")}
      ${rest > 0 ? `<span class="chip ${cls}">+${rest}명</span>` : ""}
    </div>`;
}

// 직원별로 "지금 노출 중인 공지 중 몇 건을 확인했는지"를 집계 — 특정 공지 하나가 아니라
// 전체적으로 확인이 밀린 직원이 누구인지 한눈에 보기 위함. 확인율이 낮은 사람이 위로 오게 정렬한다.
function buildEmployeeAckSummary(employees, visibleNotices) {
  return employees
    .map((e) => {
      const ackedCount = visibleNotices.filter((n) => (n.ackedBy || []).some((a) => a.empId === e.empId)).length;
      return { ...e, ackedCount, total: visibleNotices.length };
    })
    .sort((a, b) => a.ackedCount - b.ackedCount);
}

function renderAckOverview() {
  const mount = document.getElementById("ack-overview");
  const employees = loadData("employees", []);
  const visible = adminNotices.filter((n) => isWithinNoticePeriod(n));

  if (visible.length === 0) {
    mount.innerHTML = `<div class="empty-state">지금 노출 중인 공지가 없습니다.</div>`;
    return;
  }

  const totalSlots = visible.length * employees.length;
  const totalAcked = visible.reduce((sum, n) => sum + (n.ackedBy || []).length, 0);
  const overallRate = totalSlots ? Math.round((totalAcked / totalSlots) * 100) : 0;

  const empSummary = buildEmployeeAckSummary(employees, visible);
  const behind = empSummary.filter((e) => e.ackedCount < e.total);

  const perNoticeHtml = visible
    .map((n) => {
      const ackedByIdSet = new Set((n.ackedBy || []).map((a) => a.empId));
      const acked = (n.ackedBy || []).map((a) => ({ empId: a.empId, name: a.name }));
      const unacked = employees.filter((e) => !ackedByIdSet.has(e.empId));
      return `
      <div class="ack-overview-item">
        <div class="ack-overview-title">
          <span class="badge ${NOTICE_TYPE_BADGE_CLASS[n.type] || "neutral"}">${n.type}</span>
          ${n.title}
        </div>
        <div class="ack-overview-row">
          <span class="ack-overview-row-label">✅ 확인 (${acked.length}/${employees.length})</span>
          ${renderChipList(acked, "ok")}
        </div>
        <div class="ack-overview-row">
          <span class="ack-overview-row-label">⏳ 미확인 (${unacked.length})</span>
          ${renderChipList(unacked, "pending")}
        </div>
      </div>`;
    })
    .join("");

  mount.innerHTML = `
    <div class="dashboard-grid" style="margin-bottom:16px;">
      <div class="card stat-card">
        <div class="stat-label">노출 중인 공지</div>
        <div class="stat-value">${visible.length}건</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">전체 평균 확인율</div>
        <div class="stat-value">${overallRate}%</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">한 건이라도 밀린 직원</div>
        <div class="stat-value">${behind.length}명</div>
      </div>
    </div>
    <h3 style="font-size:14px; margin:0 0 10px;">직원별 확인 현황 (확인율 낮은 순)</h3>
    ${
      behind.length
        ? `<div class="weak-area-list" style="margin-bottom:10px;">
            ${(ackOverviewExpanded ? behind : behind.slice(0, ACK_OVERVIEW_EMP_LIMIT))
              .map(
                (e) => `
              <div class="weak-area-item">
                <span class="weak-area-title">${e.name} (${e.empId})</span>
                <span class="weak-area-rate">${e.ackedCount}/${e.total}건 확인</span>
              </div>`
              )
              .join("")}
          </div>
          ${
            behind.length > ACK_OVERVIEW_EMP_LIMIT
              ? `<button type="button" class="btn secondary small" id="btn-ack-overview-toggle" style="margin-bottom:20px;">${
                  ackOverviewExpanded ? "접기" : `+${behind.length - ACK_OVERVIEW_EMP_LIMIT}명 더 보기`
                }</button>`
              : ""
          }`
        : `<div class="empty-state" style="margin-bottom:20px;">전 직원이 모든 공지를 확인했습니다.</div>`
    }
    <h3 style="font-size:14px; margin:0 0 10px;">공지별 확인/미확인</h3>
    ${perNoticeHtml}
  `;

  document.getElementById("btn-ack-overview-toggle")?.addEventListener("click", () => {
    ackOverviewExpanded = !ackOverviewExpanded;
    renderAckOverview();
  });
}

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
  renderAckOverview();
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

/* ---------- 확인현황 (누가 이 공지사항을 확인했는지 — 종이 서명부의 디지털 버전) ---------- */

let currentAckId = null;

// 실제 서명부(종이)처럼 사번·성명·확인일시(=서명)를 표로 정리해 파일로 남긴다.
// 미확인자는 확인일시 칸을 비워둬서, 누가 아직 서명(확인) 전인지 그대로 드러나게 한다.
function buildSignatureSheetHtml(item, acked, unacked) {
  const rows = [
    ...acked.map((a) => ({ empId: a.empId, name: a.name, signedAt: `${formatDate(a.ackedAt)} 확인` })),
    ...unacked.map((e) => ({ empId: e.empId, name: e.name, signedAt: "" })),
  ];
  return `
    <div class="meta">${item.type} · 생성일 ${formatDate(new Date())} · 확인 ${acked.length}/${rows.length}명</div>
    <p>${(item.content || "").replace(/\n/g, "<br>")}</p>
    ${renderPhotoGalleryHtml(item.photos)}
    ${item.files && item.files.length ? `<p>첨부파일: ${item.files.map((f) => f.name).join(", ")}</p>` : ""}
    <table class="trend-table">
      <thead><tr><th>사번</th><th>성명</th><th>확인(서명)</th></tr></thead>
      <tbody>
        ${rows.map((r) => `<tr><td>${r.empId}</td><td>${r.name}</td><td>${r.signedAt}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function openAckStatus(id) {
  const item = getAdminNotice(id);
  if (!item) return;
  currentAckId = id;

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

/* ---------- 원본 파일 첨부 (hwp/pdf 등, 사진 에디터와 별개) ---------- */
/* 화면에서 고른 파일을 base64로 읽어 등록 전까지 메모리에 들고 있다가, 저장할 때 공지 데이터에 담는다.
   수정 화면을 열면 기존 첨부가 이 배열에 먼저 채워지고, 여기서 빼거나 새로 추가할 수 있다. */

let pendingFiles = [];

function renderPendingFilesList() {
  const mount = document.getElementById("file-attach-list");
  mount.innerHTML = pendingFiles
    .map(
      (f, i) => `
      <div class="file-attach-item">
        <span>📎</span>
        <span class="file-attach-name">${f.name}</span>
        <button type="button" class="file-attach-remove" data-remove-index="${i}">✕ 제거</button>
      </div>`
    )
    .join("");

  mount.querySelectorAll("[data-remove-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingFiles.splice(Number(btn.dataset.removeIndex), 1);
      renderPendingFilesList();
    });
  });
}

function handleAttachFiles(fileList) {
  Array.from(fileList || []).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      pendingFiles.push({ name: file.name, url: reader.result });
      renderPendingFilesList();
    };
    reader.readAsDataURL(file);
  });
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
  document.getElementById("f-file-picker").value = "";
  pendingFiles = item ? [...(item.files || [])] : [];
  renderPendingFilesList();
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

  document.getElementById("btn-add-file").addEventListener("click", () => {
    document.getElementById("f-file-picker").click();
  });
  document.getElementById("f-file-picker").addEventListener("change", (e) => {
    handleAttachFiles(e.target.files);
    e.target.value = "";
  });

  document.getElementById("btn-ack-close").addEventListener("click", closeAckStatus);
  document.getElementById("btn-ack-close2").addEventListener("click", closeAckStatus);
  document.getElementById("ack-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "ack-backdrop") closeAckStatus();
  });

  document.getElementById("btn-ack-download").addEventListener("click", () => {
    const item = getAdminNotice(currentAckId);
    if (!item) return;
    const employees = loadData("employees", []);
    const ackedByIdSet = new Set((item.ackedBy || []).map((a) => a.empId));
    const acked = [...(item.ackedBy || [])].sort((a, b) => (a.ackedAt < b.ackedAt ? 1 : -1));
    const unacked = employees.filter((e) => !ackedByIdSet.has(e.empId));
    downloadAsHtml(`서명부_${toSafeFilename(item.title)}`, `${item.title} - 확인 서명부`, buildSignatureSheetHtml(item, acked, unacked));
  });

  document.getElementById("admin-notice-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const content = document.getElementById("f-content").value.trim();
    const photos = collectPhotosFromEditor(document.getElementById("editor"));

    if (!content && photos.length === 0 && pendingFiles.length === 0) {
      showToast("내용을 입력하거나 문서 사진·원본 파일을 첨부해주세요.");
      return;
    }

    const data = {
      title: document.getElementById("f-title").value.trim(),
      type: document.getElementById("f-type").value,
      content,
      photos,
      files: pendingFiles,
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
