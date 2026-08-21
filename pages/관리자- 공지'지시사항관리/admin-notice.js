/* admin-notice.html 전용 데이터 & 로직 */

let adminNotices = loadData("adminNotices", [
  { id: uid(), title: "혹서기 서행운전 안내", type: "공지사항", content: "혹서기 레일 온도 상승에 따른 서행구간을 반드시 준수 바랍니다." },
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

function renderAdminNoticeList() {
  const tbody = document.getElementById("admin-notice-tbody");

  if (adminNotices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">등록된 공지·지시사항이 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = adminNotices
    .map(
      (n) => `
      <tr>
        <td>${n.title}</td>
        <td><span class="badge ${n.type === "지시사항" ? "danger" : "info"}">${n.type}</span></td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${n.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${n.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteAdminNotice(btn.dataset.id));
  });
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getAdminNotice(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-type").value = item ? item.type : "공지사항";
  document.getElementById("f-content").value = item ? item.content : "";
  title.textContent = item ? "수정" : "등록";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("admin-notice");
  renderAdminNoticeList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("admin-notice-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      title: document.getElementById("f-title").value.trim(),
      type: document.getElementById("f-type").value,
      content: document.getElementById("f-content").value.trim(),
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
