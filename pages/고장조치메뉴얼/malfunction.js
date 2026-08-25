/* malfunction.html 전용 데이터 & 로직 */

// MALFUNCTION_SEED는 common/data-malfunctions.js(공용 시드 데이터 파일, html에서 common.js보다 먼저 로드됨)에 정의되어 있다.

const VEHICLE_TYPES = [
  { key: "all", label: "전체" },
  { key: "VVVF", label: "1호선 VVVF" },
  { key: "저항차", label: "1호선 저항차" },
  { key: "ATO", label: "2호선 ATO" },
];

let currentVehicleFilter = "all";

// 차종별 원본 한글(hwp) 파일 — "전체 다운로드" 클릭 시 그대로 내려받는다.
const VEHICLE_HWP_FILES = {
  VVVF: "./data/1호선 ADV(VVVF)전동차 고장조치 매뉴얼 완성본 -5.28.hwp",
  저항차: "./data/1호선_AD저항차_고장조치_메뉴얼_완성본_6.23.hwp",
  ATO: "./data/2호선ATO 응급교범1-9.hwp",
};

let malfunctions = loadData(
  "malfunctions",
  MALFUNCTION_SEED.map((m) => ({ id: uid(), ...m }))
);
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

function renderVehicleTabs() {
  const mount = document.getElementById("vehicle-tabs");
  mount.innerHTML = VEHICLE_TYPES.map(
    (v) =>
      `<button type="button" class="${v.key === currentVehicleFilter ? "active" : ""}" data-key="${v.key}">${v.label}</button>`
  ).join("");

  mount.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentVehicleFilter = btn.dataset.key;
      malfunctionPager.page = 0;
      renderVehicleTabs();
      renderMalfunctionList();
    });
  });
}

const malfunctionPager = { page: 0, pageSize: 10 };
const malfunctionSearch = { field: "title", query: "" };

function renderMalfunctionList() {
  const tbody = document.getElementById("malfunction-tbody");
  let list =
    currentVehicleFilter === "all"
      ? malfunctions
      : malfunctions.filter((m) => m.vehicleType === currentVehicleFilter);
  list = filterByTitleContent(
    list,
    malfunctionSearch,
    (m) => m.title,
    (m) => [m.symptom, m.cause, m.procedure, m.notes].filter(Boolean).join(" ")
  );

  renderListSearch("malfunction-search", malfunctionSearch, () => {
    malfunctionPager.page = 0;
    renderMalfunctionList();
  });
  const skipPaging = !!malfunctionSearch.query.trim() || isAppViewport();

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">등록된 매뉴얼이 없습니다.</div></td></tr>`;
    renderPaginationOrAll("malfunction-pager", malfunctionPager, 0, renderMalfunctionList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(list, malfunctionPager, skipPaging);

  tbody.innerHTML = pageItems
    .map(
      (m) => `
      <tr>
        <td class="mobile-hide">${m.no || ""}</td>
        <td class="title-cell"><a data-action="detail" data-id="${m.id}">${m.title}</a>${renderViewsLikesBadge(m)}</td>
        <td><span class="badge info">${m.vehicleType}</span></td>
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

  renderPaginationOrAll("malfunction-pager", malfunctionPager, list.length, renderMalfunctionList, skipPaging);
}

/* ---------- 상세 화면 (메인 > 고장처치 매뉴얼 > 제목 클릭 시) ---------- */

function renderDetailSection(label, value) {
  if (!value) return "";
  return `
    <div class="detail-section">
      <h4>${label}</h4>
      <p>${value}</p>
    </div>`;
}

function renderDetailPhoto(item) {
  const photos = item.photos || [];
  if (photos.length === 0 && !item.photoImage && !item.photoNote) return "";

  const gallery = photos
    .map(
      (p) => `
      <a href="${p.file}" target="_blank" class="detail-photo-item">
        <img class="detail-photo-thumb" src="${p.file}" alt="${p.caption || "관련사진"}">
        ${p.caption ? `<span class="detail-photo-caption">${p.caption}</span>` : ""}
      </a>`
    )
    .join("");

  const uploaded = item.photoImage
    ? `<img class="detail-photo" src="${item.photoImage}" alt="추가 등록 사진">`
    : "";

  // 사진마다 붙은 개별 설명이 하나도 없을 때만(=매칭이 불확실해 비워둔 경우 포함),
  // 원문 설명 전체를 텍스트로 보여준다. 하나라도 있으면 사진별 설명을 우선한다.
  const anyCaptioned = photos.some((p) => p.caption);
  const caption = !anyCaptioned && item.photoNote ? `<p>${item.photoNote}</p>` : "";

  return `
    <div class="detail-section">
      <h4>관련사진</h4>
      ${gallery ? `<div class="detail-photo-gallery">${gallery}</div>` : ""}
      ${uploaded}
      ${caption}
    </div>`;
}

function renderDetailVideos(item) {
  const videos = item.videos || [];
  if (videos.length === 0) return "";
  return `
    <div class="detail-section">
      <h4>관련 동영상</h4>
      ${renderVideoGallery(videos)}
    </div>`;
}

function renderMalfunctionLikesBar(item) {
  const mount = document.getElementById("views-likes-mount");
  mount.innerHTML = renderViewsLikesHtml(item);
  mount.querySelector(".like-btn").addEventListener("click", () => {
    toggleLike(item);
    saveData("malfunctions", malfunctions);
    renderMalfunctionLikesBar(item);
  });
}

let currentDetailId = null;

function renderMalfunctionBodyHtml(item) {
  return `
    <div class="detail-section">
      <h4>차종</h4>
      <span class="badge info">${item.vehicleType}</span>
    </div>
    ${renderDetailSection("현상", item.symptom)}
    ${renderDetailSection("원인", item.cause)}
    ${renderDetailSection("조치요령", item.procedure)}
    ${renderDetailSection("상태", item.state)}
    ${renderDetailSection("참고", item.reference)}
    ${renderDetailSection("※ 주의사항", item.notes)}
    ${renderDetailPhoto(item)}
    ${renderDetailVideos(item)}
  `;
}

function openDetail(id) {
  const item = getMalfunction(id);
  if (!item) return;
  currentDetailId = id;

  recordView(item);
  saveData("malfunctions", malfunctions);

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-body").innerHTML = `
    <div class="views-likes-bar" id="views-likes-mount"></div>
    ${renderMalfunctionBodyHtml(item)}
  `;
  renderMalfunctionLikesBar(item);
  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
  renderMalfunctionList(); // 조회수/좋아요가 목록 뱃지에도 바로 반영되게 갱신
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */
/* 관련사진 입력(카페 글쓰기 스타일 드래그·붙여넣기 삽입)은 common.js 의
   insertPhotoBlock/handlePhotoFiles/populatePhotoEditor/collectPhotosFromEditor/wirePhotoEditor 공용 함수를 쓴다
   (사례공유게시판 글/댓글 본문과 동일한 에디터). */

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getMalfunction(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-vehicletype").value = item ? item.vehicleType : "VVVF";
  document.getElementById("f-symptom").value = item ? item.symptom || "" : "";
  document.getElementById("f-cause").value = item ? item.cause || "" : "";
  document.getElementById("f-procedure").value = item ? item.procedure || "" : "";
  document.getElementById("f-state").value = item ? item.state || "" : "";
  document.getElementById("f-reference").value = item ? item.reference || "" : "";
  document.getElementById("f-notes").value = item ? item.notes || "" : "";
  document.getElementById("f-photo-picker").value = "";
  populatePhotoEditor(document.getElementById("photo-editor"), item ? item.photos : []);
  document.getElementById("f-videos").value = item ? videosToText(item.videos) : "";
  title.textContent = item ? "매뉴얼 수정" : "매뉴얼 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("malfunction");
  renderVehicleTabs();
  renderMalfunctionList();
  onViewportChange(renderMalfunctionList);

  // 마이페이지 취약분야 목록 등에서 ?title= 로 넘어온 경우 해당 매뉴얼 상세를 바로 연다.
  const titleParam = new URLSearchParams(location.search).get("title");
  if (titleParam) {
    const target = malfunctions.find((m) => m.title === titleParam);
    if (target) openDetail(target.id);
  }

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
    const btn = document.getElementById("btn-download-all");
    if (currentVehicleFilter === "all") {
      const files = Object.entries(VEHICLE_HWP_FILES).map(([, url]) => ({ name: url.split("/").pop(), url }));
      btn.disabled = true;
      btn.textContent = "묶는 중...";
      try {
        await downloadFilesAsZip("고장처치매뉴얼_전체(hwp모음).zip", files);
      } catch (err) {
        showToast("다운로드 중 오류가 발생했습니다.");
      } finally {
        btn.disabled = false;
        btn.textContent = "⬇ 전체 다운로드";
      }
      return;
    }

    const url = VEHICLE_HWP_FILES[currentVehicleFilter];
    if (!url) {
      showToast("이 차종의 원본 파일이 없습니다.");
      return;
    }
    downloadOriginalFile(url);
  });

  wirePhotoEditor(
    document.getElementById("photo-editor"),
    document.getElementById("btn-add-photo"),
    document.getElementById("f-photo-picker")
  );

  document.getElementById("malfunction-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      title: document.getElementById("f-title").value.trim(),
      vehicleType: document.getElementById("f-vehicletype").value,
      symptom: document.getElementById("f-symptom").value.trim(),
      cause: document.getElementById("f-cause").value.trim(),
      procedure: document.getElementById("f-procedure").value.trim(),
      state: document.getElementById("f-state").value.trim(),
      reference: document.getElementById("f-reference").value.trim(),
      notes: document.getElementById("f-notes").value.trim(),
      photos: collectPhotosFromEditor(document.getElementById("photo-editor")),
      videos: parseVideosText(document.getElementById("f-videos").value),
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
