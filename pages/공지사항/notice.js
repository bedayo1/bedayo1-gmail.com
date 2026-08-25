/* notice.html 전용 데이터 & 로직 */
/* 관리자가 등록한 공지사항·지시사항(adminNotices, admin-notice.js가 관리)을 직원이 열람만 할 수 있는 화면.
   등록/수정/삭제는 관리자 화면(admin-notice.html)에서만 하고, 여기서는 노출기간 내의 글만 읽기 전용으로 보여준다. */

let notices = loadData("adminNotices", []);

/* ---------- 렌더링 ---------- */

const noticePager = { page: 0, pageSize: 10 };
const noticeSearch = { field: "title", query: "" };

function renderNoticeList() {
  const tbody = document.getElementById("notice-tbody");
  notices = loadData("adminNotices", []);

  let visible = notices.filter((n) => isWithinNoticePeriod(n));
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
        <td><span class="badge ${n.type === "지시사항" ? "danger" : "info"}">${n.type}</span></td>
        <td class="title-cell"><a data-action="detail" data-id="${n.id}">${n.title}</a>${renderViewsLikesBadge(n)}</td>
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

function openDetail(id) {
  const item = getNotice(id);
  if (!item) return;

  recordView(item);
  saveData("adminNotices", notices);

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-meta").textContent = item.type;
  document.getElementById("detail-content").textContent = item.content || "";
  renderNoticeLikesBar(item);

  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
  renderNoticeList(); // 조회수/좋아요가 목록 뱃지에도 바로 반영되게 갱신
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("notice");
  renderNoticeList();
  onViewportChange(renderNoticeList);

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("btn-detail-close2").addEventListener("click", closeDetail);
  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });
});
