/* video.html 전용 데이터 & 로직 */
/* 교육영상 게시판 — 직원 누구나 영상(유튜브 등 링크, 또는 작은 용량의 영상 파일)을 등록하고
   함께 시청할 수 있다. 자유게시판/사례공유게시판과 같은 "내 글만 수정·삭제" 규칙(canModifyPost)을 따른다. */

const VIDEO_CATEGORIES = ["안전교육", "직무교육", "기타"];

let videos = loadData("trainingVideos", []);
let profile = loadData("profile", null);

/* ---------- 영상 URL 처리 ---------- */
/* 유튜브 링크(watch?v=, youtu.be/, shorts/)는 그대로 두면 브라우저가 재생할 수 없으므로
   내장 재생이 가능한 embed 주소로 바꿔준다. 그 외(직접 올린 mp4 파일 등)는 <video> 태그로 재생한다. */
function getYoutubeEmbedUrl(url) {
  const m =
    url.match(/youtu\.be\/([^?&]+)/) ||
    url.match(/[?&]v=([^?&]+)/) ||
    url.match(/youtube\.com\/shorts\/([^?&]+)/) ||
    url.match(/youtube\.com\/embed\/([^?&]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function renderVideoPlayerHtml(url) {
  if (!url) return `<div class="empty-state">등록된 영상이 없습니다.</div>`;
  const ytEmbed = getYoutubeEmbedUrl(url);
  if (ytEmbed) {
    return `<div class="video-player-frame"><iframe src="${ytEmbed}" allowfullscreen allow="autoplay; encrypted-media"></iframe></div>`;
  }
  return `<video src="${url}" class="video-player-native" controls></video>`;
}

/* ---------- CRUD ---------- */

function getAllVideos() {
  return videos;
}

function getVideo(id) {
  return videos.find((v) => v.id === id);
}

// saveData 성공 후에야 메모리 상의 videos를 갱신한다 — 영상 파일이 너무 커서 저장이 실패했을 때
// 저장되지도 않은 항목이 메모리에만 남아 있다가 다음 저장 때 함께 끼어드는 걸 막기 위함.
function addVideo(data) {
  const next = [...videos, { id: uid(), date: formatDate(new Date()), ...data }];
  saveData("trainingVideos", next);
  videos = next;
  renderVideoList();
}

function updateVideo(id, data) {
  const next = videos.map((v) => (v.id === id ? { ...v, ...data } : v));
  saveData("trainingVideos", next);
  videos = next;
  renderVideoList();
}

function deleteVideo(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  videos = videos.filter((v) => v.id !== id);
  saveData("trainingVideos", videos);
  renderVideoList();
}

/* ---------- 구분 필터 탭 ---------- */

let currentCategoryFilter = "all";

function renderVideoTypeTabs() {
  const mount = document.getElementById("video-type-tabs");
  const tabs = ["all", ...VIDEO_CATEGORIES];
  mount.innerHTML = tabs
    .map(
      (t) =>
        `<button type="button" class="${t === currentCategoryFilter ? "active" : ""}" data-key="${t}">${t === "all" ? "전체" : t}</button>`
    )
    .join("");
  mount.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentCategoryFilter = btn.dataset.key;
      videoPager.page = 0;
      renderVideoTypeTabs();
      renderVideoList();
    });
  });
}

/* ---------- 목록 렌더링 (카드형 그리드) ---------- */

const videoPager = { page: 0, pageSize: 12 };
const videoSearch = { field: "title", query: "" };

function renderVideoList() {
  const mount = document.getElementById("video-grid");
  let visible = [...videos].reverse();
  if (currentCategoryFilter !== "all") visible = visible.filter((v) => v.category === currentCategoryFilter);
  visible = filterByTitleContent(visible, videoSearch, (v) => v.title, (v) => v.desc);

  renderListSearch("video-search", videoSearch, () => {
    videoPager.page = 0;
    renderVideoList();
  });
  const skipPaging = !!videoSearch.query.trim() || isAppViewport();

  if (visible.length === 0) {
    mount.innerHTML = `<div class="empty-state">등록된 영상이 없습니다.</div>`;
    renderPaginationOrAll("video-pager", videoPager, 0, renderVideoList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(visible, videoPager, skipPaging);

  mount.innerHTML = pageItems
    .map(
      (v) => `
      <div class="video-card" data-action="detail" data-id="${v.id}">
        <div class="video-card-thumb">${getYoutubeEmbedUrl(v.url || "") ? "▶️" : "🎬"}</div>
        <div class="video-card-body">
          <div class="video-card-title">${v.title}</div>
          <div class="video-card-meta">
            <span class="badge info">${v.category}</span>
            <span>${v.author} · ${v.date}</span>
          </div>
          ${renderViewsLikesBadge(v)}
        </div>
        <div class="video-card-actions">
          ${
            canModifyPost(v, profile)
              ? `<button class="btn secondary small" data-action="edit" data-id="${v.id}">수정</button>
                 <button class="btn danger small" data-action="delete" data-id="${v.id}">삭제</button>`
              : ""
          }
        </div>
      </div>`
    )
    .join("");

  mount.querySelectorAll("[data-action='detail']").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='edit'],[data-action='delete']")) return;
      openDetail(el.dataset.id);
    });
  });
  mount.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(btn.dataset.id);
    });
  });
  mount.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteVideo(btn.dataset.id);
    });
  });

  renderPaginationOrAll("video-pager", videoPager, visible.length, renderVideoList, skipPaging);
}

/* ---------- 상세보기(재생) ---------- */

let currentDetailId = null;

function renderVideoLikesBar(item) {
  const mount = document.getElementById("views-likes-mount");
  mount.innerHTML = renderViewsLikesHtml(item);
  mount.querySelector(".like-btn").addEventListener("click", () => {
    toggleLike(item);
    saveData("trainingVideos", videos);
    renderVideoLikesBar(item);
  });
}

function openDetail(id) {
  const item = getVideo(id);
  if (!item) return;
  currentDetailId = id;

  recordView(item);
  saveData("trainingVideos", videos);

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-meta").textContent = `${item.category} · ${item.author} · ${item.date}`;
  document.getElementById("video-player-mount").innerHTML = renderVideoPlayerHtml(item.url);
  document.getElementById("detail-desc").textContent = item.desc || "";
  renderVideoLikesBar(item);

  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
  document.getElementById("video-player-mount").innerHTML = ""; // 재생 중지
  currentDetailId = null;
  renderVideoList();
}

/* ---------- 등록/수정 모달 ---------- */

let pendingFileUrl = null;

function setSourceMode(mode) {
  document.getElementById("row-source-link").hidden = mode !== "link";
  document.getElementById("row-source-file").hidden = mode !== "file";
}

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getVideo(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-author").value = item ? item.author : (profile && profile.name) || "";
  document.getElementById("f-author").readOnly = !!item || !!profile;
  document.getElementById("f-desc").value = item ? item.desc || "" : "";

  const isFileSource = item && item.url && item.url.startsWith("data:");
  document.querySelector(`input[name="f-source-mode"][value="${isFileSource ? "file" : "link"}"]`).checked = true;
  setSourceMode(isFileSource ? "file" : "link");
  document.getElementById("f-url").value = isFileSource ? "" : item ? item.url || "" : "";
  document.getElementById("f-video-picker").value = "";
  document.getElementById("video-file-name").textContent = "";
  pendingFileUrl = isFileSource ? item.url : null;
  if (isFileSource) document.getElementById("video-file-name").textContent = "기존 첨부 파일 유지됨 (새로 선택 시 교체)";

  title.textContent = item ? "동영상 수정" : "동영상 추가";
  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("video");

  document.getElementById("f-category").innerHTML = VIDEO_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");

  renderVideoTypeTabs();
  renderVideoList();
  onViewportChange(renderVideoList);

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("btn-cancel2").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.querySelectorAll('input[name="f-source-mode"]').forEach((radio) => {
    radio.addEventListener("change", () => setSourceMode(radio.value));
  });

  document.getElementById("f-video-picker").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingFileUrl = reader.result;
      document.getElementById("video-file-name").textContent = `선택됨: ${file.name}`;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("btn-detail-close2").addEventListener("click", closeDetail);
  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });

  document.getElementById("video-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const sourceMode = document.querySelector('input[name="f-source-mode"]:checked').value;
    const url = sourceMode === "file" ? pendingFileUrl : document.getElementById("f-url").value.trim();

    if (!url) {
      showToast(sourceMode === "file" ? "영상 파일을 선택해주세요." : "영상 링크를 입력해주세요.");
      return;
    }

    const data = {
      title: document.getElementById("f-title").value.trim(),
      category: document.getElementById("f-category").value,
      author: document.getElementById("f-author").value.trim(),
      desc: document.getElementById("f-desc").value.trim(),
      url,
    };
    if (!id) data.authorEmpId = (profile && profile.empId) || null;

    try {
      if (id) {
        updateVideo(id, data);
        showToast("수정되었습니다.");
      } else {
        addVideo(data);
        showToast("등록되었습니다.");
      }
      closeModal();
    } catch (err) {
      showToast("저장에 실패했습니다. 영상 파일 용량이 너무 크면 브라우저 저장공간을 초과할 수 있어요. 링크 방식을 이용해주세요.");
    }
  });
});
