/* driveinfo.html 전용 데이터 & 로직 */

// 사업소가 늘어나면 이 배열에 한 줄만 추가하면 필터 탭과 등록 폼 select가 함께 늘어난다.
const DEPOTS = [
  { key: "신답승무사업소", label: "신답승무 사업소" },
  { key: "기타", label: "기타" },
];

const DEPOT_TABS = [{ key: "all", label: "전체" }, ...DEPOTS];

let currentDepotFilter = "all";

let driveinfos = loadData("driveinfos", []);
saveData("driveinfos", driveinfos);

/* ---------- CRUD ---------- */

function getAllDriveinfos() {
  return driveinfos;
}

function getDriveinfo(id) {
  return driveinfos.find((d) => d.id === id);
}

function addDriveinfo(data) {
  driveinfos.push({ id: uid(), date: formatDate(new Date()), ...data });
  saveData("driveinfos", driveinfos);
  renderDriveinfoList();
}

function updateDriveinfo(id, data) {
  driveinfos = driveinfos.map((d) => (d.id === id ? { ...d, ...data } : d));
  saveData("driveinfos", driveinfos);
  renderDriveinfoList();
}

function deleteDriveinfo(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  driveinfos = driveinfos.filter((d) => d.id !== id);
  saveData("driveinfos", driveinfos);
  renderDriveinfoList();
}

/* ---------- 렌더링 (필터 탭 & 목록) ---------- */

function depotLabel(key) {
  return DEPOTS.find((x) => x.key === key)?.label || key;
}

function renderDepotTabs() {
  const mount = document.getElementById("depot-tabs");
  mount.innerHTML = DEPOT_TABS.map(
    (t) =>
      `<button type="button" class="${t.key === currentDepotFilter ? "active" : ""}" data-key="${t.key}">${t.label}</button>`
  ).join("");

  mount.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentDepotFilter = btn.dataset.key;
      renderDepotTabs();
      renderDriveinfoList();
    });
  });
}

function renderDriveinfoList() {
  const tbody = document.getElementById("driveinfo-tbody");
  const list = (
    currentDepotFilter === "all" ? driveinfos : driveinfos.filter((d) => d.depot === currentDepotFilter)
  )
    .slice()
    .reverse();

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">등록된 게시글이 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map(
      (d) => `
      <tr>
        <td class="title-cell"><a data-action="detail" data-id="${d.id}">${d.title}</a></td>
        <td>${d.author}</td>
        <td><span class="badge info">${depotLabel(d.depot)}</span></td>
        <td>${d.date}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${d.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${d.id}">삭제</button>
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
    btn.addEventListener("click", () => deleteDriveinfo(btn.dataset.id));
  });
}

/* ---------- 상세 화면 ---------- */

function renderDetailSection(label, value) {
  if (!value) return "";
  return `
    <div class="detail-section">
      <h4>${label}</h4>
      <p>${value}</p>
    </div>`;
}

function openDetail(id) {
  const item = getDriveinfo(id);
  if (!item) return;

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-body").innerHTML = `
    <div class="detail-section">
      <h4>작성자 · 사업소 · 작성일</h4>
      <p>${item.author} · ${depotLabel(item.depot)} · ${item.date}</p>
    </div>
    ${renderDetailSection("내용", item.content)}
    ${
      item.attachments && item.attachments.length
        ? `<div class="detail-section"><h4>첨부파일</h4>${renderAttachmentList(item.attachments)}</div>`
        : ""
    }
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
  const item = id ? getDriveinfo(id) : null;

  const depotSelect = document.getElementById("f-depot");
  depotSelect.innerHTML = DEPOTS.map((d) => `<option value="${d.key}">${d.label}</option>`).join("");

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-author").value = item ? item.author : "";
  depotSelect.value = item ? item.depot : DEPOTS[0].key;
  document.getElementById("f-content").value = item ? item.content : "";
  document.getElementById("f-attachments").value = item ? videosToText(item.attachments) : "";
  title.textContent = item ? "글 수정" : "글쓰기";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("driveinfo");
  renderDepotTabs();
  renderDriveinfoList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });

  document.getElementById("driveinfo-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      title: document.getElementById("f-title").value.trim(),
      author: document.getElementById("f-author").value.trim(),
      depot: document.getElementById("f-depot").value,
      content: document.getElementById("f-content").value.trim(),
      attachments: parseVideosText(document.getElementById("f-attachments").value),
    };

    if (id) {
      updateDriveinfo(id, data);
      showToast("게시글이 수정되었습니다.");
    } else {
      addDriveinfo(data);
      showToast("게시글이 등록되었습니다.");
    }
    closeModal();
  });
});
