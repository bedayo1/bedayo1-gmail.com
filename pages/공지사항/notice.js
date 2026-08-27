/* notice.html 전용 데이터 & 로직 */
/* 관리자가 등록한 공지사항·지시사항(adminNotices, admin-notice.js가 관리)을 직원이 열람만 할 수 있는 화면.
   등록/수정/삭제는 관리자 화면(admin-notice.html)에서만 하고, 여기서는 노출기간 내의 글만 읽기 전용으로 보여준다.
   각 직원이 "확인 완료"를 누르기 전까지는 목록/상세/사이드바 메뉴에 NEW 표시가 남는다 (common.js 의
   isAckedByMe/ackNotice/getUnackedNoticesFor 공용 함수를 쓴다). */

let notices = loadData("adminNotices", []);
let currentNoticeTypeFilter = "all";

/* ---------- 필터 탭 ---------- */

function renderNoticeTypeTabs() {
  const mount = document.getElementById("notice-type-tabs");
  const tabs = ["all", ...NOTICE_TYPES];
  mount.innerHTML = tabs
    .map(
      (t) =>
        `<button type="button" class="${t === currentNoticeTypeFilter ? "active" : ""}" data-key="${t}">${t === "all" ? "전체" : t}</button>`
    )
    .join("");

  mount.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentNoticeTypeFilter = btn.dataset.key;
      noticePager.page = 0;
      renderNoticeTypeTabs();
      renderNoticeList();
    });
  });
}

/* ---------- 렌더링 ---------- */

const noticePager = { page: 0, pageSize: 10 };
const noticeSearch = { field: "title", query: "" };

function renderNoticeList() {
  const tbody = document.getElementById("notice-tbody");
  notices = loadData("adminNotices", []);

  let visible = notices.filter((n) => isWithinNoticePeriod(n));
  if (currentNoticeTypeFilter !== "all") visible = visible.filter((n) => n.type === currentNoticeTypeFilter);
  visible = [...visible].reverse();
  visible = filterByTitleContent(visible, noticeSearch, (n) => n.title, (n) => n.content);

  renderListSearch("notice-search", noticeSearch, () => {
    noticePager.page = 0;
    renderNoticeList();
  });
  const skipPaging = !!noticeSearch.query.trim() || isAppViewport();

  if (visible.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">등록된 공지사항이 없습니다.</div></td></tr>`;
    renderPaginationOrAll("notice-pager", noticePager, 0, renderNoticeList, skipPaging);
    return;
  }

  const pageItems = paginateListOrAll(visible, noticePager, skipPaging);

  tbody.innerHTML = pageItems
    .map(
      (n) => `
      <tr>
        <td><span class="badge ${NOTICE_TYPE_BADGE_CLASS[n.type] || "neutral"}">${n.type}</span></td>
        <td class="title-cell">
          <a data-action="detail" data-id="${n.id}">${n.title}</a>
          ${!isAckedByMe(n) ? `<span class="badge danger notice-new-badge">NEW</span>` : ""}
          ${renderViewsLikesBadge(n)}
        </td>
        <td></td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action='detail']").forEach((el) => {
    el.addEventListener("click", () => openDetail(el.dataset.id));
  });

  renderPaginationOrAll("notice-pager", noticePager, visible.length, renderNoticeList, skipPaging);
}

/* ---------- 상세보기 ---------- */

function getNotice(id) {
  return notices.find((n) => n.id === id);
}

function renderNoticeLikesBar(item) {
  const mount = document.getElementById("views-likes-mount");
  mount.innerHTML = renderViewsLikesHtml(item);
  mount.querySelector(".like-btn").addEventListener("click", () => {
    toggleLike(item);
    saveData("adminNotices", notices);
    renderNoticeLikesBar(item);
  });
}

let currentDetailId = null;

function renderAckButton(item) {
  const btn = document.getElementById("btn-ack");
  const already = isAckedByMe(item);
  btn.textContent = already ? "✅ 확인됨" : "확인 완료";
  btn.disabled = already;
}

function openDetail(id) {
  const item = getNotice(id);
  if (!item) return;
  currentDetailId = id;

  recordView(item);
  saveData("adminNotices", notices);

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-meta").textContent = item.type;
  document.getElementById("detail-content").innerHTML =
    (item.content ? `<div>${item.content}</div>` : "") + renderPhotoGalleryHtml(item.photos);
  renderNoticeLikesBar(item);
  renderAckButton(item);

  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
  currentDetailId = null;
  renderNoticeList(); // NEW 뱃지·조회수/좋아요가 목록에도 바로 반영되게 갱신
  renderSidebar("notice"); // 사이드바 NEW 카운트도 함께 갱신
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("notice");
  renderNoticeTypeTabs();
  renderNoticeList();
  onViewportChange(renderNoticeList);

  // 알림함 등에서 ?open= 으로 넘어온 경우 해당 공지 상세를 바로 연다.
  const openId = new URLSearchParams(location.search).get("open");
  if (openId && getNotice(openId)) openDetail(openId);

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("btn-detail-close2").addEventListener("click", closeDetail);
  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });

  document.getElementById("btn-download").addEventListener("click", () => {
    const item = getNotice(currentDetailId);
    if (!item) return;
    const bodyHtml =
      `<div class="meta">${item.type}</div>` +
      (item.content ? `<div>${item.content}</div>` : "") +
      renderPhotoGalleryHtml(item.photos);
    downloadAsHtml(toSafeFilename(item.title), item.title, bodyHtml);
  });

  document.getElementById("btn-ack").addEventListener("click", () => {
    const item = getNotice(currentDetailId);
    if (!item) return;
    if (ackNotice(item)) {
      saveData("adminNotices", notices);
      renderAckButton(item);
      showToast("확인 처리되었습니다.");
    }
  });

  document.getElementById("btn-ack-all").addEventListener("click", () => {
    const profile = loadData("profile", null);
    if (!profile) return;
    const pending = getUnackedNoticesFor(profile.empId);
    if (pending.length === 0) {
      showToast("이미 모두 확인했습니다.");
      return;
    }
    if (!confirm(`아직 확인하지 않은 공지 ${pending.length}건을 모두 확인 처리하시겠습니까?`)) return;
    notices = loadData("adminNotices", []);
    pending.forEach((n) => {
      const target = notices.find((x) => x.id === n.id);
      if (target) ackNotice(target);
    });
    saveData("adminNotices", notices);
    renderNoticeList();
    renderSidebar("notice");
    showToast(`${pending.length}건을 일괄 확인 처리했습니다.`);
  });
});
