/* driveinfo.html 전용 데이터 & 로직 */

// 사업소가 늘어나면 이 배열에 한 줄만 추가하면 필터 탭과 등록 폼 select가 함께 늘어난다.
const DEPOTS = [
  { key: "신답승무사업소", label: "신답승무 사업소" },
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
  driveinfos.push({ id: uid(), ...data });
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
  ).slice().sort((a, b) => (a.date < b.date ? 1 : -1));

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">등록된 운전정보가 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map(
      (d) => `
      <tr>
        <td>${d.no || ""}</td>
        <td class="title-cell"><a data-action="detail" data-id="${d.id}">${d.title}</a></td>
        <td><span class="badge info">${DEPOTS.find((x) => x.key === d.depot)?.label || d.depot}</span></td>
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

/* ---------- 상세 화면: 운전정보 발간물 원본을 흉내낸 레이아웃 ---------- */

function renderBulletinSection(label, value) {
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

  const photos = item.photos || [];
  const gallery = photos
    .map(
      (p) => `
      <div class="bulletin-photo-item">
        <a href="${p.file}" target="_blank"><img src="${p.file}" alt="${p.caption || "관련사진"}"></a>
        ${p.caption ? `<span class="caption">[${p.caption}]</span>` : ""}
      </div>`
    )
    .join("");

  const diagram = item.diagram
    ? `<div class="bulletin-diagram"><img src="${item.diagram}" alt="상황도"></div>`
    : "";

  document.getElementById("detail-body").innerHTML = `
    <div class="bulletin-header">
      <span class="bulletin-tag">운전정보</span>
      <h2>${item.title}</h2>
      <span class="bulletin-no">${item.no || ""}</span>
    </div>
    <div class="bulletin-body">
      <div class="bulletin-main">
        ${renderBulletinSection("발생개요", item.overview)}
        ${diagram}
        ${renderBulletinSection("원 인", item.cause)}
        ${renderBulletinSection("재발방지 대책", item.countermeasures)}
        ${renderBulletinSection("참고", item.extra)}
      </div>
      <div class="bulletin-side">
        <div class="side-block">
          <h4>1. 일 시</h4>
          <div>${item.date}</div>
        </div>
        <div class="side-block">
          <h4>2. 장 소</h4>
          <div>${item.location || ""}</div>
        </div>
        <div class="side-block">
          <h4>사업소</h4>
          <div>${DEPOTS.find((x) => x.key === item.depot)?.label || item.depot}</div>
        </div>
        ${
          gallery
            ? `<div class="side-block"><h4>3. 관련 사진</h4><div class="bulletin-photo-gallery">${gallery}</div></div>`
            : ""
        }
        ${
          item.videos && item.videos.length
            ? `<div class="side-block"><h4>4. 관련 동영상</h4>${renderVideoGallery(item.videos)}</div>`
            : ""
        }
      </div>
    </div>
  `;
  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */
/* 관련사진 입력: 사진을 끌어다 놓으면 그 자리에 삽입되고, 바로 밑에 설명을 적을 수 있다. */

function insertPhotoBlock(dataUrl, captionText) {
  const editor = document.getElementById("photo-editor");

  const img = document.createElement("img");
  img.src = dataUrl;
  editor.appendChild(img);

  const caption = document.createElement("div");
  caption.className = "photo-editor-caption";
  caption.contentEditable = "true";
  caption.textContent = captionText || "";
  editor.appendChild(caption);

  caption.focus();
}

function handlePhotoFiles(fileList) {
  Array.from(fileList || []).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => insertPhotoBlock(reader.result, "");
    reader.readAsDataURL(file);
  });
}

function populatePhotoEditor(photos) {
  const editor = document.getElementById("photo-editor");
  editor.innerHTML = "";
  (photos || []).forEach((p) => insertPhotoBlock(p.file, p.caption || ""));
  editor.blur();
}

function collectPhotosFromEditor() {
  const editor = document.getElementById("photo-editor");
  const photos = [];
  editor.querySelectorAll("img").forEach((img) => {
    let captionText = "";
    const next = img.nextElementSibling;
    if (next && next.classList.contains("photo-editor-caption")) {
      captionText = next.textContent.trim();
    }
    photos.push({ file: img.getAttribute("src"), caption: captionText });
  });
  return photos;
}

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getDriveinfo(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-no").value = item ? item.no || "" : "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-depot").value = item ? item.depot : DEPOTS[0].key;
  document.getElementById("f-date").value = item ? item.date : "";
  document.getElementById("f-location").value = item ? item.location || "" : "";
  document.getElementById("f-overview").value = item ? item.overview || "" : "";
  document.getElementById("f-cause").value = item ? item.cause || "" : "";
  document.getElementById("f-countermeasures").value = item ? item.countermeasures || "" : "";
  document.getElementById("f-extra").value = item ? item.extra || "" : "";
  document.getElementById("f-photo-picker").value = "";
  populatePhotoEditor(item ? item.photos : []);
  document.getElementById("f-videos").value = item ? videosToText(item.videos) : "";
  title.textContent = item ? "운전정보 수정" : "운전정보 추가";

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

  const photoEditor = document.getElementById("photo-editor");

  document.getElementById("btn-add-photo").addEventListener("click", () => {
    document.getElementById("f-photo-picker").click();
  });

  document.getElementById("f-photo-picker").addEventListener("change", (e) => {
    handlePhotoFiles(e.target.files);
    e.target.value = "";
  });

  photoEditor.addEventListener("dragover", (e) => {
    e.preventDefault();
    photoEditor.classList.add("dragover");
  });
  photoEditor.addEventListener("dragleave", () => {
    photoEditor.classList.remove("dragover");
  });
  photoEditor.addEventListener("drop", (e) => {
    e.preventDefault();
    photoEditor.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      handlePhotoFiles(e.dataTransfer.files);
    }
  });
  photoEditor.addEventListener("paste", (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((it) => it.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    e.preventDefault();
    handlePhotoFiles(imageItems.map((it) => it.getAsFile()));
  });

  document.getElementById("driveinfo-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      no: document.getElementById("f-no").value.trim(),
      title: document.getElementById("f-title").value.trim(),
      depot: document.getElementById("f-depot").value,
      date: document.getElementById("f-date").value,
      location: document.getElementById("f-location").value.trim(),
      overview: document.getElementById("f-overview").value.trim(),
      cause: document.getElementById("f-cause").value.trim(),
      countermeasures: document.getElementById("f-countermeasures").value.trim(),
      extra: document.getElementById("f-extra").value.trim(),
      photos: collectPhotosFromEditor(),
      videos: parseVideosText(document.getElementById("f-videos").value),
    };

    if (id) {
      updateDriveinfo(id, data);
      showToast("운전정보가 수정되었습니다.");
    } else {
      addDriveinfo(data);
      showToast("운전정보가 추가되었습니다.");
    }
    closeModal();
  });
});
