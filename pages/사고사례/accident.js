/* accident.html 전용 데이터 & 로직 */

// ACCIDENT_SEED는 common/data-accidents.js(공용 시드 데이터 파일, html에서 common.js보다 먼저 로드됨)에 정의되어 있다.

let accidents = loadData(
  "accidents",
  ACCIDENT_SEED.map((a) => ({ id: uid(), ...a }))
);
saveData("accidents", accidents);

// 사고사례 번호별 원본 한글(hwp/hwpx) 파일 — "전체 다운로드"에서 zip으로 묶어 내려받는다.
const ACCIDENT_HWP_FILES = {
  "2026-1": "./data/운전정보 2026-1.hwpx",
  "2026-2": "./data/운전정보 2026-2.hwpx",
  "2026-3": "./data/운전정보 2026-3.hwpx",
  "2026-4": "./data/운전정보 2026-4.hwpx",
  "2026-5": "./data/운전정보 2026-5.hwpx",
  "2026-6": "./data/운전정보 2026-6.hwpx",
  "2026-7": "./data/운전정보 2026-7.hwpx",
  "2026-8": "./data/운전정보 2026-8.hwpx",
  "2026-9": "./data/운전정보 2026-9.hwpx",
  "2026-10": "./data/운전정보 2026-10.hwpx",
  "2026-11": "./data/운전정보 2026-11.hwpx",
  "2026-12": "./data/운전정보 2026-12.hwp",
  "2026-13": "./data/운전정보 2026-13.hwp",
  "2026-14": "./data/운전정보 2026-14.hwp",
};

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

/* ---------- 렌더링 (목록) ---------- */

const accidentPager = { page: 0, pageSize: 10 };
const accidentSearch = { field: "title", query: "" };

function renderAccidentList() {
  const tbody = document.getElementById("accident-tbody");
  let sorted = [...accidents].sort((a, b) => (a.date < b.date ? 1 : -1));
  sorted = filterByTitleContent(
    sorted,
    accidentSearch,
    (a) => a.title,
    (a) => [a.overview, a.cause, a.countermeasures, a.location].filter(Boolean).join(" ")
  );

  renderListSearch("accident-search", accidentSearch, () => {
    accidentPager.page = 0;
    renderAccidentList();
  });
  const skipPaging = !!accidentSearch.query.trim() || isAppViewport();

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">등록된 사고사례가 없습니다.</div></td></tr>`;
    renderPaginationOrAll("accident-pager", accidentPager, 0, renderAccidentList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(sorted, accidentPager, skipPaging);

  tbody.innerHTML = pageItems
    .map(
      (a) => `
      <tr>
        <td class="mobile-hide col-no">${a.no || ""}</td>
        <td class="title-cell">
          <a data-action="detail" data-id="${a.id}">${a.title}</a>
          ${isNoticeCurrentlyActive(a) ? `<span class="badge danger">🚨 긴급공지 노출중</span>` : ""}
          ${renderViewsLikesBadge(a)}
        </td>
        <td><span class="badge info">${a.line}</span></td>
        <td>${a.date}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${a.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${a.id}">삭제</button>
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
    btn.addEventListener("click", () => deleteAccident(btn.dataset.id));
  });

  renderPaginationOrAll("accident-pager", accidentPager, sorted.length, renderAccidentList, skipPaging);
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

function renderAccidentLikesBar(item) {
  const mount = document.getElementById("views-likes-mount");
  mount.innerHTML = renderViewsLikesHtml(item);
  mount.querySelector(".like-btn").addEventListener("click", () => {
    toggleLike(item);
    saveData("accidents", accidents);
    renderAccidentLikesBar(item);
  });
}

let currentDetailId = null;

function renderAccidentBodyHtml(item, includeLikesBar) {
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

  return `
    <div class="bulletin-header">
      <span class="bulletin-tag">운전정보</span>
      <h2>${item.title}</h2>
      <span class="bulletin-no">${item.no || ""}</span>
    </div>
    ${includeLikesBar ? `<div class="views-likes-bar" id="views-likes-mount"></div>` : ""}
    <div class="bulletin-body">
      <div class="bulletin-main">
        ${renderBulletinSection("장애(발생)개요", item.overview)}
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
          <div>${item.location || item.line}</div>
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
}

function openDetail(id) {
  const item = getAccident(id);
  if (!item) return;
  currentDetailId = id;

  recordView(item);
  saveData("accidents", accidents);

  document.getElementById("detail-body").innerHTML = renderAccidentBodyHtml(item, true);
  renderAccidentLikesBar(item);
  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
  renderAccidentList(); // 조회수/좋아요가 목록 뱃지에도 바로 반영되게 갱신
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
  const item = id ? getAccident(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-no").value = item ? item.no || "" : "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-line").value = item ? item.line : "";
  document.getElementById("f-date").value = item ? item.date : "";
  document.getElementById("f-location").value = item ? item.location || "" : "";
  document.getElementById("f-overview").value = item ? item.overview || "" : "";
  document.getElementById("f-cause").value = item ? item.cause || "" : "";
  document.getElementById("f-countermeasures").value = item ? item.countermeasures || "" : "";
  document.getElementById("f-extra").value = item ? item.extra || "" : "";
  document.getElementById("f-photo-picker").value = "";
  populatePhotoEditor(item ? item.photos : []);
  document.getElementById("f-videos").value = item ? videosToText(item.videos) : "";
  document.getElementById("f-notice-active").checked = item ? !!item.noticeActive : false;
  document.getElementById("f-notice-start").value = item ? item.noticeStart || "" : "";
  document.getElementById("f-notice-end").value = item ? item.noticeEnd || "" : "";
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
  onViewportChange(renderAccidentList);

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });

  document.getElementById("btn-download-all").addEventListener("click", async () => {
    const files = Object.entries(ACCIDENT_HWP_FILES).map(([, url]) => ({ name: url.split("/").pop(), url }));
    const btn = document.getElementById("btn-download-all");
    btn.disabled = true;
    btn.textContent = "묶는 중...";
    try {
      await downloadFilesAsZip("사고사례_전체(원본모음).zip", files);
    } catch (err) {
      showToast("다운로드 중 오류가 발생했습니다.");
    } finally {
      btn.disabled = false;
      btn.textContent = "⬇ 전체 다운로드";
    }
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

  document.getElementById("accident-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      no: document.getElementById("f-no").value.trim(),
      title: document.getElementById("f-title").value.trim(),
      line: document.getElementById("f-line").value.trim(),
      date: document.getElementById("f-date").value,
      location: document.getElementById("f-location").value.trim(),
      overview: document.getElementById("f-overview").value.trim(),
      cause: document.getElementById("f-cause").value.trim(),
      countermeasures: document.getElementById("f-countermeasures").value.trim(),
      extra: document.getElementById("f-extra").value.trim(),
      photos: collectPhotosFromEditor(),
      videos: parseVideosText(document.getElementById("f-videos").value),
      noticeActive: document.getElementById("f-notice-active").checked,
      noticeStart: document.getElementById("f-notice-start").value,
      noticeEnd: document.getElementById("f-notice-end").value,
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
