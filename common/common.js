/* ============================================
   공통 JS — 2개 이상의 페이지에서 쓰는 함수/데이터만 여기에 작성
   ============================================ */

// 메뉴 추가 시 이 배열만 수정하면 모든 페이지의 사이드바가 함께 갱신된다.
// group: "main"(사용자 메뉴) | "admin"(관리자 메뉴)
const NAV_ITEMS = [
  { key: "home", label: "홈", path: "index.html", icon: "🏠", group: "main" },
  { key: "search", label: "통합검색", path: "pages/통합검색/search.html", icon: "🔍", group: "main" },
  { key: "chatbot", label: "AI챗봇", path: "pages/AI챗봇/chatbot.html", icon: "🤖", group: "main" },
  { key: "notice", label: "공지사항", path: "pages/공지사항/notice.html", icon: "📢", group: "main" },
  { key: "course", label: "교육과정 관리", path: "pages/교육과정관리/course.html", icon: "📚", group: "main" },
  { key: "dia", label: "다이아", path: "pages/다이아/dia.html", icon: "🚆", group: "main" },
  { key: "accident", label: "사고사례", path: "pages/사고사례/accident.html", icon: "📋", group: "main" },
  { key: "malfunction", label: "고장처치 매뉴얼", path: "pages/고장조치메뉴얼/malfunction.html", icon: "🔧", group: "main" },
  { key: "emergency", label: "이례상황 매뉴얼", path: "pages/이례상황메뉴얼/emergency.html", icon: "🚨", group: "main" },
  { key: "case-share", label: "사례공유게시판", path: "pages/사례공유게시판/case-share.html", icon: "🖼️", group: "main" },
  { key: "board", label: "자유게시판", path: "pages/자유게시판/board.html", icon: "💬", group: "main" },
  { key: "mypage", label: "마이페이지", path: "pages/마이페이지/mypage.html", icon: "👤", group: "main" },
  { key: "admin-employee", label: "직원 관리", path: "pages/관리자 - 직원관리/admin-employee.html", icon: "👥", group: "admin" },
  { key: "admin-notice", label: "공지·지시사항 관리", path: "pages/관리자- 공지'지시사항관리/admin-notice.html", icon: "📢", group: "admin" },
  { key: "admin-schedule", label: "다이아·스케줄 관리", path: "pages/관리자 - 다이아(스케쥴) 관리/admin-schedule.html", icon: "📅", group: "admin" },
  { key: "admin-attendance", label: "출근현황", path: "pages/관리자 - 출근현황/admin-attendance.html", icon: "🕐", group: "admin" },
  { key: "admin-education", label: "일일안전교육 모니터링", path: "pages/관리자 - 일일교육모니터링/admin-education.html", icon: "📈", group: "admin" },
];

const NAV_GROUPS = [
  { key: "main", title: "메인 메뉴" },
  { key: "admin", title: "관리자" },
];

const STORAGE_PREFIX = "kcs_"; // 기관사(KiCSa) 안전교육 앱 localStorage 네임스페이스

// 데모용 고정 관리자 계정 — 직원 로그인과 완전히 분리된 별도 계정이다 (직원 명단에는 존재하지 않음).
const ADMIN_ACCOUNT = { id: "admin", pw: "admin1234" };

/* ---------- 로그인 게이트 ---------- */
/* 로그인 화면(login.html)을 제외한 모든 페이지는 세션이 없으면 즉시 로그인 화면으로 보낸다.
   세션 종류(session.type)가 "employee"면 사이드바에 메인 메뉴만, "admin"이면 관리자 메뉴만 보이게 된다
   (renderSidebar 참고). common.js 최상단에서 동기적으로 실행되어 화면이 그려지기 전에 리다이렉트한다. */
(function enforceLoginGate() {
  if (/(^|\/)login\.html$/.test(location.pathname)) return;
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "session"));
  } catch (e) {
    session = null;
  }
  if (!session) {
    location.replace(getRootBase() + "login.html");
  }
})();

function logout() {
  localStorage.removeItem(STORAGE_PREFIX + "session");
  location.href = getRootBase() + "login.html";
}

// 직원 비밀번호는 사번별로 localStorage("employeePasswords")에 보관한다. 값이 없으면 초기 비밀번호 1234.
function getEmployeePassword(empId) {
  const pwMap = loadData("employeePasswords", {});
  return pwMap[empId] || "1234";
}

function setEmployeePassword(empId, newPw) {
  const pwMap = loadData("employeePasswords", {});
  pwMap[empId] = newPw;
  saveData("employeePasswords", pwMap);
}

/* ---------- 데이터 저장 유틸 (페이지별 전역 변수의 영속화에 사용) ---------- */


function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("loadData 실패:", key, e);
    return defaultValue;
  }
}

function saveData(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

/* ---------- 공통 헬퍼 ---------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- 핵심 데이터 시드 보장 ---------- */
/* 고장처치/이례상황/사고사례 매뉴얼은 원래 각자의 관리 페이지(malfunction.js/emergency.js/accident.js)를
   처음 열 때만 localStorage에 채워졌다. 그런데 홈 출근 마법사·통합검색·AI챗봇은 그 페이지를 거치지 않고
   바로 데이터를 읽기 때문에, 아무도 그 관리 페이지를 연 적이 없으면 일일안전교육 문제가 0개로 뜨는 등의
   문제가 있었다. 시드 데이터 자체는 common.js보다 먼저 로드되는 data-*.js 공용 파일에 있고,
   여기서는 어떤 페이지로 처음 들어오든 한 번만 채워지도록 보장만 한다. */
function seedCoreData() {
  if (typeof MALFUNCTION_SEED !== "undefined" && loadData("malfunctions", []).length === 0) {
    saveData("malfunctions", MALFUNCTION_SEED.map((m) => ({ id: uid(), ...m })));
  }
  if (typeof EMERGENCY_SEED !== "undefined" && loadData("emergencies", []).length === 0) {
    saveData("emergencies", EMERGENCY_SEED.map((e) => ({ id: uid(), ...e })));
  }
  if (typeof ACCIDENT_SEED !== "undefined" && loadData("accidents", []).length === 0) {
    saveData("accidents", ACCIDENT_SEED.map((a) => ({ id: uid(), ...a })));
  }
}
seedCoreData();

// 사진 에디터가 만든 리치 HTML(bodyHtml)에서 태그를 걷어내 검색 인덱스용 순수 텍스트만 뽑는다.
function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || "";
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

let toastTimer = null;
function showToast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
}

/* ---------- 사진 첨부 에디터 (네이버 카페 글쓰기 스타일 공용) ---------- */
/* 사진을 에디터 영역에 드래그하거나 붙여넣으면 그 자리에 삽입되고, 바로 밑에 캡션 한 줄이 함께 생긴다.
   고장처치 매뉴얼의 [관련사진], 사례공유게시판의 글/댓글 본문에서 공용으로 사용한다. */

function insertPhotoBlock(editor, dataUrl, captionText) {
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

function handlePhotoFiles(editor, fileList) {
  Array.from(fileList || []).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => insertPhotoBlock(editor, reader.result, "");
    reader.readAsDataURL(file);
  });
}

function populatePhotoEditor(editor, photos) {
  editor.innerHTML = "";
  (photos || []).forEach((p) => insertPhotoBlock(editor, p.file, p.caption || ""));
  editor.blur();
}

function collectPhotosFromEditor(editor) {
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

// 사진추가 버튼/드래그앤드롭/붙여넣기를 에디터 한 인스턴스에 연결한다. addBtn/pickerInput은 없어도 된다(드래그·붙여넣기만 쓰는 경우).
function wirePhotoEditor(editor, addBtn, pickerInput) {
  if (addBtn && pickerInput) {
    addBtn.addEventListener("click", () => pickerInput.click());
    pickerInput.addEventListener("change", (e) => {
      handlePhotoFiles(editor, e.target.files);
      e.target.value = "";
    });
  }

  editor.addEventListener("dragover", (e) => {
    e.preventDefault();
    editor.classList.add("dragover");
  });
  editor.addEventListener("dragleave", () => editor.classList.remove("dragover"));
  editor.addEventListener("drop", (e) => {
    e.preventDefault();
    editor.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      handlePhotoFiles(editor, e.dataTransfer.files);
    }
  });
  editor.addEventListener("paste", (e) => {
    const items = Array.from((e.clipboardData && e.clipboardData.items) || []);
    const imageItems = items.filter((it) => it.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    e.preventDefault();
    handlePhotoFiles(editor, imageItems.map((it) => it.getAsFile()));
  });
}

/* ---------- 조회수 · 좋아요 (매뉴얼/게시판 공용) ---------- */
/* item.views(숫자), item.likedBy(사번/관리자ID 배열)를 직접 다룬다.
   저장은 각 페이지가 이미 갖고 있는 컬렉션 배열 + saveData 로 하므로, 여기서는 localStorage에 직접 접근하지 않는다. */

function currentUserKey() {
  const session = loadData("session", null);
  if (!session) return "guest";
  return session.type === "admin" ? "admin" : session.empId || "guest";
}

function recordView(item) {
  item.views = (item.views || 0) + 1;
}

// 좋아요를 누른 상태로 토글하고, 토글 후 "내가 좋아요를 누른 상태인지"를 반환한다.
function toggleLike(item) {
  const userKey = currentUserKey();
  if (!item.likedBy) item.likedBy = [];
  const idx = item.likedBy.indexOf(userKey);
  if (idx >= 0) {
    item.likedBy.splice(idx, 1);
    return false;
  }
  item.likedBy.push(userKey);
  return true;
}

function isLikedByMe(item) {
  return !!(item.likedBy && item.likedBy.includes(currentUserKey()));
}

function renderViewsLikesHtml(item) {
  const liked = isLikedByMe(item);
  return `
    <span class="views-count" title="조회수">👁 ${item.views || 0}</span>
    <button type="button" class="like-btn ${liked ? "liked" : ""}" title="좋아요">
      ${liked ? "❤️" : "🤍"} <span class="like-count">${(item.likedBy || []).length}</span>
    </button>`;
}

// 목록 행에 붙이는 짧은 뱃지 (조회수/좋아요가 0이면 표시하지 않는다).
function renderViewsLikesBadge(item) {
  const likeCount = (item.likedBy || []).length;
  if (!item.views && !likeCount) return "";
  return `<span class="views-likes-inline">${item.views ? `👁 ${item.views}` : ""}${likeCount ? ` ❤️ ${likeCount}` : ""}</span>`;
}

/* ---------- 공지사항 구분 · 확인사인(개인별 NEW) ---------- */
/* 공지사항 화면(notice.js)의 필터탭과 관리자 등록화면(admin-notice.js)의 구분 셀렉트가 공용으로 쓴다. */

const NOTICE_TYPES = ["지시사항", "산업안전보건교육", "지시전달부", "알림", "관련규정"];
const NOTICE_TYPE_BADGE_CLASS = {
  지시사항: "danger",
  산업안전보건교육: "info",
  지시전달부: "info",
  알림: "neutral",
  관련규정: "neutral",
};

// 공지사항 하나를 로그인한 직원이 "확인" 했는지 여부. item.ackedBy = [{empId, name, ackedAt}]
function isAckedByMe(item) {
  const profile = loadData("profile", null);
  if (!profile) return false;
  return !!(item.ackedBy && item.ackedBy.some((a) => a.empId === profile.empId));
}

// 확인 처리(서명). 이미 확인한 경우 아무 일도 하지 않는다. 새로 확인 처리됐으면 true 반환.
function ackNotice(item) {
  const profile = loadData("profile", null);
  if (!profile) return false;
  if (!item.ackedBy) item.ackedBy = [];
  if (item.ackedBy.some((a) => a.empId === profile.empId)) return false;
  item.ackedBy.push({ empId: profile.empId, name: profile.name, ackedAt: new Date().toISOString() });
  return true;
}

// 공지사항 등에 첨부된 photos([{file, caption}], 사진 에디터로 만든 문서/사진 첨부)를 읽기 전용으로 보여준다.
function renderPhotoGalleryHtml(photos) {
  if (!photos || photos.length === 0) return "";
  return `
    <div class="photo-gallery">
      ${photos
        .map(
          (p) => `
        <div class="photo-gallery-item">
          <img src="${p.file}" alt="${p.caption || "첨부 사진"}">
          ${p.caption ? `<div class="photo-gallery-caption">${p.caption}</div>` : ""}
        </div>`
        )
        .join("")}
    </div>`;
}

// 사이드바 NEW 뱃지, 목록 필터 등에서 쓰는 "이 직원이 아직 확인 안 한, 지금 노출 중인 공지" 목록.
function getUnackedNoticesFor(empId) {
  return loadData("adminNotices", []).filter(
    (n) => isWithinNoticePeriod(n) && !(n.ackedBy && n.ackedBy.some((a) => a.empId === empId))
  );
}

/* ---------- 파일로 다운로드 (매뉴얼/공지사항/게시판 공용) ---------- */
/* 상세보기에 나온 내용을 그대로 담은 독립 HTML 파일 하나로 내려받는다.
   사진(base64)까지 그대로 파일 안에 포함되어, 다운로드한 파일만 열어도 원문 그대로 보인다. */

function downloadAsHtml(filename, title, bodyHtml) {
  const safeTitle = (title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>
  body { font-family: "Malgun Gothic", "맑은 고딕", sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #222; }
  h1 { font-size: 22px; border-bottom: 2px solid #222; padding-bottom: 10px; }
  h4 { font-size: 14px; color: #555; margin: 18px 0 4px; }
  img { max-width: 100%; border-radius: 6px; border: 1px solid #ddd; margin: 8px 0; }
  .meta { color: #888; font-size: 13px; margin-bottom: 16px; }
  .caption { font-size: 12px; color: #888; }
</style>
</head>
<body>
  <h1>${safeTitle}</h1>
  ${bodyHtml}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 파일명으로 쓸 수 없는 문자(\/:*?"<>|)를 제거한다.
function toSafeFilename(text) {
  return (text || "제목없음").replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 80);
}

/* ---------- 여러 원본 파일을 zip 하나로 묶어 다운로드 (외부 라이브러리 없이 직접 구현) ---------- */
/* hwp/hwpx 원본처럼 "이미 압축된" 파일이 대부분이라 압축(Deflate) 없이 저장(Store) 방식으로만 담는다.
   ZIP 포맷 자체는 표준이라 압축을 안 해도 탐색기/알집 등에서 정상적으로 열린다. */

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32LE(view, offset, value) {
  view.setUint32(offset, value, true);
}
function writeUint16LE(view, offset, value) {
  view.setUint16(offset, value, true);
}

// files: [{ name, url }]. 하나라도 못 받아오면 에러를 던진다(호출부에서 안내 메시지 처리).
async function downloadFilesAsZip(zipFilename, files) {
  const encoder = new TextEncoder();
  const entries = [];

  for (const f of files) {
    const res = await fetch(f.url);
    if (!res.ok) throw new Error(`파일을 불러오지 못했습니다: ${f.name}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    entries.push({ name: f.name, nameBytes: encoder.encode(f.name), data: buf, crc: crc32(buf) });
  }

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach((e) => {
    const localHeader = new ArrayBuffer(30);
    const lv = new DataView(localHeader);
    writeUint32LE(lv, 0, 0x04034b50);
    writeUint16LE(lv, 4, 20);
    writeUint16LE(lv, 6, 0x0800); // UTF-8 파일명 플래그
    writeUint16LE(lv, 8, 0); // 저장(무압축)
    writeUint16LE(lv, 10, 0);
    writeUint16LE(lv, 12, 0);
    writeUint32LE(lv, 14, e.crc);
    writeUint32LE(lv, 18, e.data.length);
    writeUint32LE(lv, 22, e.data.length);
    writeUint16LE(lv, 26, e.nameBytes.length);
    writeUint16LE(lv, 28, 0);
    localParts.push(new Uint8Array(localHeader), e.nameBytes, e.data);

    const centralHeader = new ArrayBuffer(46);
    const cv = new DataView(centralHeader);
    writeUint32LE(cv, 0, 0x02014b50);
    writeUint16LE(cv, 4, 20);
    writeUint16LE(cv, 6, 20);
    writeUint16LE(cv, 8, 0x0800);
    writeUint16LE(cv, 10, 0);
    writeUint16LE(cv, 12, 0);
    writeUint16LE(cv, 14, 0);
    writeUint32LE(cv, 16, e.crc);
    writeUint32LE(cv, 20, e.data.length);
    writeUint32LE(cv, 24, e.data.length);
    writeUint16LE(cv, 28, e.nameBytes.length);
    writeUint16LE(cv, 30, 0);
    writeUint16LE(cv, 32, 0);
    writeUint16LE(cv, 34, 0);
    writeUint16LE(cv, 36, 0);
    writeUint32LE(cv, 38, 0);
    writeUint32LE(cv, 42, offset);
    centralParts.push(new Uint8Array(centralHeader), e.nameBytes);

    offset += localHeader.byteLength + e.nameBytes.length + e.data.length;
  });

  const centralStart = offset;
  const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);

  const endRecord = new ArrayBuffer(22);
  const ev = new DataView(endRecord);
  writeUint32LE(ev, 0, 0x06054b50);
  writeUint16LE(ev, 4, 0);
  writeUint16LE(ev, 6, 0);
  writeUint16LE(ev, 8, entries.length);
  writeUint16LE(ev, 10, entries.length);
  writeUint32LE(ev, 12, centralSize);
  writeUint32LE(ev, 16, centralStart);
  writeUint16LE(ev, 20, 0);

  const blob = new Blob([...localParts, ...centralParts, new Uint8Array(endRecord)], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename.endsWith(".zip") ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 원본 파일 하나를 있는 그대로(서버 파일을 재가공하지 않고) 다운로드한다.
function downloadOriginalFile(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || url.split("/").pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ---------- 테마 (라이트/다크 전환) ---------- */

function applyTheme() {
  const theme = loadData("theme", "dark");
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  saveData("theme", next);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

/* ---------- 통합검색 (전체 데이터 인덱싱 & 검색) ---------- */
/* 이 앱은 서버가 없는 정적 데모라, 각 페이지가 localStorage에 저장한 데이터를
   직접 읽어 인덱스를 만든다. 새 데이터 종류를 추가하면 이 배열에 한 줄만 추가하면 된다. */

const SEARCH_SOURCES = [
  {
    key: "courses",
    type: "교육과정",
    icon: "📚",
    path: "pages/교육과정관리/course.html",
    getTitle: (x) => x.name,
    getText: (x) => [x.name, x.target, x.status].join(" "),
  },
  {
    key: "accidents",
    type: "사고사례",
    icon: "📋",
    path: "pages/사고사례/accident.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.line, x.location, x.overview, x.cause, x.countermeasures].join(" "),
  },
  {
    key: "malfunctions",
    type: "고장처치",
    icon: "🔧",
    path: "pages/고장조치메뉴얼/malfunction.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.vehicleType, x.symptom, x.cause, x.procedure, x.notes].join(" "),
  },
  {
    key: "emergencies",
    type: "이례상황",
    icon: "🚨",
    path: "pages/이례상황메뉴얼/emergency.html",
    getTitle: (x) => x.title,
    getText: (x) =>
      [x.title, x.category, x.condition, (x.procedureSteps || []).join(" "), x.caution].join(" "),
  },
  {
    key: "posts",
    type: "게시판",
    icon: "💬",
    path: "pages/자유게시판/board.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.content, x.author].join(" "),
  },
  {
    key: "casePosts",
    type: "사례공유",
    icon: "🖼️",
    path: "pages/사례공유게시판/case-share.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.author, stripHtml(x.bodyHtml)].join(" "),
  },
  {
    key: "adminNotices",
    type: "공지·지시사항",
    icon: "📢",
    path: "pages/공지사항/notice.html",
    getTitle: (x) => x.title,
    getText: (x) => [x.title, x.type, x.content].join(" "),
  },
  {
    key: "employees",
    type: "직원",
    icon: "👥",
    path: "pages/관리자 - 직원관리/admin-employee.html",
    getTitle: (x) => x.name,
    getText: (x) => [x.name, x.empId, x.role, x.dept].join(" "),
  },
  {
    key: "schedules",
    type: "다이아",
    icon: "📅",
    path: "pages/관리자 - 다이아(스케쥴) 관리/admin-schedule.html",
    getTitle: (x) => `${x.line} ${x.diaNo}호 다이아`,
    getText: (x) => [x.line, x.diaNo, x.startTime].join(" "),
  },
];

function buildSearchIndex() {
  const index = [];
  SEARCH_SOURCES.forEach((src) => {
    loadData(src.key, []).forEach((item) => {
      index.push({
        type: src.type,
        icon: src.icon,
        path: src.path,
        title: src.getTitle(item) || "(제목 없음)",
        text: (src.getText(item) || "").replace(/\s+/g, " ").trim(),
      });
    });
  });
  return index;
}

// query(검색어)와 관련도 높은 순으로 정렬된 결과를 반환한다.
// 제목에 포함되면 가중치를 더 준다. limit 지정 시 상위 N개만 반환.
function searchAll(query, limit) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const index = buildSearchIndex();

  const scored = index
    .map((item) => {
      const titleLower = item.title.toLowerCase();
      const hay = (titleLower + " " + item.text.toLowerCase());
      let score = 0;
      terms.forEach((t) => {
        const occurrences = hay.split(t).length - 1;
        if (occurrences === 0) return;
        score += occurrences;
        if (titleLower.includes(t)) score += 5;
      });
      const snippetSource = item.text || item.title;
      const snippet = snippetSource.length > 80 ? snippetSource.slice(0, 80) + "…" : snippetSource;
      return { ...item, score, snippet };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return typeof limit === "number" ? scored.slice(0, limit) : scored;
}

/* ---------- 관련 동영상 (경로 텍스트 ↔ 배열 변환) ---------- */
/* 동영상은 용량이 커서 localStorage(사진처럼 base64로 저장)에 담기 어렵다.
   그래서 페이지 폴더 안에 파일을 직접 넣어두고, "경로 | 설명" 한 줄짜리 텍스트로만 관리한다. */

function parseVideosText(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [file, ...rest] = line.split("|");
      return { file: file.trim(), caption: rest.join("|").trim() };
    })
    .filter((v) => v.file);
}

function videosToText(videos) {
  return (videos || [])
    .map((v) => (v.caption ? `${v.file} | ${v.caption}` : v.file))
    .join("\n");
}

function renderVideoGallery(videos) {
  if (!videos || videos.length === 0) return "";
  const items = videos
    .map(
      (v) => `
      <div class="detail-video-item">
        <video src="${v.file}" controls preload="metadata"></video>
        ${v.caption ? `<span class="detail-video-caption">${v.caption}</span>` : ""}
      </div>`
    )
    .join("");
  return `<div class="detail-video-gallery">${items}</div>`;
}

// 동영상뿐 아니라 어떤 파일이든(문서, 압축파일 등) 다운로드 링크 목록으로 보여줄 때 사용.
function renderAttachmentList(attachments) {
  if (!attachments || attachments.length === 0) return "";
  const items = attachments
    .map((a) => {
      const name = a.file.split("/").pop();
      return `
      <a class="attachment-item" href="${a.file}" download target="_blank">
        <span>📎 ${name}</span>
        ${a.caption ? `<span class="attachment-caption">${a.caption}</span>` : ""}
      </a>`;
    })
    .join("");
  return `<div class="attachment-list">${items}</div>`;
}

/* ---------- 긴급공지(사고사례) 노출 여부 판정 — accident.js·index.js 공용 ---------- */
/* "긴급 공지로 노출" 체크(noticeActive)를 명시적으로 켠 항목만 후보가 되고(opt-in),
   그중에서도 noticeStart/noticeEnd(YYYY-MM-DD, 둘 다 선택) 기간 안에 있어야 실제로 노출된다.
   시작/종료일을 비워두면 각각 "즉시부터"/"계속"으로 취급한다. */
function isNoticeCurrentlyActive(item) {
  if (!item.noticeActive) return false;
  const today = formatDate(new Date());
  if (item.noticeStart && today < item.noticeStart) return false;
  if (item.noticeEnd && today > item.noticeEnd) return false;
  return true;
}

// 운전지시사항(공지·지시사항 관리)은 별도 on/off 없이 노출기간(선택)만으로 걸러낸다 — 지정 안 하면 항상 노출.
function isWithinNoticePeriod(item) {
  const today = formatDate(new Date());
  if (item.startDate && today < item.startDate) return false;
  if (item.endDate && today > item.endDate) return false;
  return true;
}

/* ---------- 일일안전교육 학습결과 (출근 시 응시한 퀴즈) — 마이페이지·관리자 모니터링 공용 ---------- */
/* attendances 레코드 하나의 education.items 는
   [{ type, title, question, choices, selectedIndex, correctIndex, correct }, ...] 형태다. */

function getAllAttendances() {
  return loadData("attendances", []);
}

function getAttendancesFor(empId) {
  return getAllAttendances()
    .filter((a) => a.empId === empId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// 응시 횟수/평균점수/정답률 등 전체 요약
// (직무배제로 종료된 날은 애초에 문제를 풀지 않았으므로 "응시"에서 제외한다)
function summarizeEducation(records) {
  records = records.filter((r) => !r.excluded);
  let totalQuestions = 0;
  let totalCorrect = 0;
  let scoreSum = 0;
  records.forEach((r) => {
    const items = (r.education && r.education.items) || [];
    totalQuestions += items.length;
    totalCorrect += items.filter((i) => i.correct).length;
    scoreSum += (r.education && r.education.score) || 0;
  });
  return {
    count: records.length,
    totalQuestions,
    totalCorrect,
    accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    avgScore: records.length ? Math.round(scoreSum / records.length) : 0,
  };
}

// 월별(YYYY-MM) 응시 횟수/정답률/평균점수 추이 — 마이페이지·관리자 모니터링의 "월별 학습 리포트" 공용.
// 오래된 달 -> 최근 달 순으로 정렬해서 반환한다 (그래프를 왼쪽부터 그리기 좋게).
function buildMonthlyEducationTrend(records) {
  const byMonth = {};
  records
    .filter((r) => !r.excluded && r.date)
    .forEach((r) => {
      const month = r.date.slice(0, 7); // "YYYY-MM"
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(r);
    });

  return Object.keys(byMonth)
    .sort()
    .map((month) => {
      const summary = summarizeEducation(byMonth[month]);
      return { month, ...summary };
    });
}

function renderMonthlyTrendHtml(trend) {
  if (!trend || trend.length === 0) {
    return `<div class="empty-state">아직 응시 이력이 없습니다.</div>`;
  }
  return `
    <div class="trend-chart">
      ${trend
        .map(
          (t) => `
        <div class="trend-bar-col">
          <div class="trend-bar-track">
            <div class="trend-bar" style="height:${Math.max(t.accuracy, 2)}%;" title="${t.month} 정답률 ${t.accuracy}%"></div>
          </div>
          <div class="trend-bar-value">${t.accuracy}%</div>
          <div class="trend-bar-label">${t.month.slice(5)}월</div>
        </div>`
        )
        .join("")}
    </div>
    <div style="overflow-x:auto;">
      <table class="trend-table">
        <thead>
          <tr><th>월</th><th>응시 횟수</th><th>평균 점수</th><th>정답률</th></tr>
        </thead>
        <tbody>
          ${trend
            .map((t) => `<tr><td>${t.month}</td><td>${t.count}회</td><td>${t.avgScore}점</td><td>${t.accuracy}%</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </div>`;
}

// 오답이 있었던 매뉴얼(문제)을 오답률 순으로 정리 — "취약분야"
function analyzeWeakAreas(records, limit) {
  const stats = {};
  records.filter((r) => !r.excluded).forEach((r) => {
    ((r.education && r.education.items) || []).forEach((item) => {
      const key = `${item.type}::${item.title}`;
      if (!stats[key]) stats[key] = { type: item.type, title: item.title, total: 0, wrong: 0 };
      stats[key].total += 1;
      if (!item.correct) stats[key].wrong += 1;
    });
  });
  return Object.values(stats)
    .filter((s) => s.wrong > 0)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong)
    .slice(0, limit || 8);
}

// 퀴즈 문항별 정답/오답 리뷰 화면 (마이페이지, 관리자 모니터링, 출근 상세보기가 공용으로 사용)
function renderQuizReviewHtml(items) {
  if (!items || items.length === 0) {
    return `<div class="empty-state">응시한 문제가 없습니다.</div>`;
  }
  return items
    .map((q, qi) => {
      const choices = q.choices || [];
      return `
    <div class="quiz-question-card">
      <div class="quiz-q-index">${q.isReview ? "🔁 복습 · " : ""}${q.type} · 문제 ${qi + 1} · ${q.title} · ${q.correct ? "✅ 정답" : "❌ 오답"}</div>
      <div class="quiz-q-text">${q.question}</div>
      <div class="quiz-choices">
        ${choices
          .map((c, ci) => {
            let cls = "";
            if (ci === q.correctIndex) cls = "correct";
            else if (ci === q.selectedIndex) cls = "wrong";
            return `<div class="quiz-choice quiz-choice-readonly ${cls}">${ci === q.selectedIndex ? "☑" : "☐"} ${c}</div>`;
          })
          .join("")}
      </div>
    </div>`;
    })
    .join("");
}

// 취약분야 목록 렌더링 (마이페이지 / 관리자 모니터링 공용)
// 항목을 클릭하면 해당 매뉴얼(고장처치/이례상황) 상세로 바로 이동해 복습할 수 있다.
function renderWeakAreasHtml(weakAreas) {
  if (!weakAreas || weakAreas.length === 0) {
    return `<div class="empty-state">아직 오답이 없습니다. 좋은 결과예요!</div>`;
  }
  const base = getRootBase();
  return `
    <div class="weak-area-list">
      ${weakAreas
        .map((w) => {
          const manualPath =
            w.type === "고장처치" ? "pages/고장조치메뉴얼/malfunction.html" : "pages/이례상황메뉴얼/emergency.html";
          const href = `${base}${manualPath}?title=${encodeURIComponent(w.title)}`;
          return `
        <a class="weak-area-item" href="${href}" title="매뉴얼 바로가기">
          <span class="badge ${w.type === "고장처치" ? "info" : "danger"}">${w.type}</span>
          <span class="weak-area-title">${w.title}</span>
          <span class="weak-area-rate">오답 ${w.wrong}/${w.total}</span>
        </a>`;
        })
        .join("")}
    </div>`;
}

// 차종별(VVVF/저항차/ATO) 정답률 — 고장처치 문제 중 vehicleType 이 있는 것만 집계한다.
// ATO는 기관사에게만 출제되므로(index.js buildEducationPool 참고) 차장은 자연히 ATO 항목이 비어있게 된다.
function analyzeVehicleTypeStats(records) {
  const stats = {};
  records
    .filter((r) => !r.excluded)
    .forEach((r) => {
      ((r.education && r.education.items) || []).forEach((item) => {
        if (!item.vehicleType) return;
        if (!stats[item.vehicleType]) stats[item.vehicleType] = { vehicleType: item.vehicleType, total: 0, correct: 0 };
        stats[item.vehicleType].total += 1;
        if (item.correct) stats[item.vehicleType].correct += 1;
      });
    });
  return Object.values(stats).map((s) => ({ ...s, accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0 }));
}

function renderVehicleTypeStatsHtml(stats) {
  if (!stats || stats.length === 0) {
    return `<div class="empty-state">차종별 응시 데이터가 없습니다.</div>`;
  }
  return `
    <div class="vt-stat-list">
      ${stats
        .map(
          (s) => `
        <div class="vt-stat-item">
          <span class="badge info">${s.vehicleType}</span>
          <span class="vt-stat-accuracy">${s.accuracy}%</span>
          <span class="vt-stat-detail">(${s.correct}/${s.total}문제)</span>
        </div>`
        )
        .join("")}
    </div>`;
}

// 전체 정답률이 기준치 미만이면 재교육 대상으로 본다 (응시 이력이 있는 사람만 대상).
const RETRAINING_ACCURACY_THRESHOLD = 30;
function needsRetraining(summary) {
  return summary.count > 0 && summary.totalQuestions > 0 && summary.accuracy < RETRAINING_ACCURACY_THRESHOLD;
}

/* ---------- 교육과정 이수 (교육과정 관리 / 마이페이지 공용) ---------- */
/* 이수 기록은 courseCompletions = [{id, courseId, empId, name, completedAt}] 로 별도 저장한다
   (courses 자체는 과정 "카탈로그"일 뿐이라, 누가 이수했는지는 별도 컬렉션으로 관리). */

function getCourseCompletions() {
  return loadData("courseCompletions", []);
}

function isCourseCompletedBy(courseId, empId) {
  return getCourseCompletions().some((c) => c.courseId === courseId && c.empId === empId);
}

function countCourseCompletions(courseId) {
  return getCourseCompletions().filter((c) => c.courseId === courseId).length;
}

// 이수 처리/취소를 토글한다. 토글 후 상태(이수 처리됐으면 true)를 반환한다.
function toggleCourseCompletion(courseId, empId, name) {
  let completions = getCourseCompletions();
  const exists = completions.some((c) => c.courseId === courseId && c.empId === empId);
  if (exists) {
    completions = completions.filter((c) => !(c.courseId === courseId && c.empId === empId));
  } else {
    completions.push({ id: uid(), courseId, empId, name, completedAt: formatDate(new Date()) });
  }
  saveData("courseCompletions", completions);
  return !exists;
}

function getCompletionsFor(empId) {
  return getCourseCompletions()
    .filter((c) => c.empId === empId)
    .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
}

/* ---------- 목록 검색(제목/내용 선택) — 모든 목록형 페이지 공용 ---------- */
/* 사용법:
     const xxxSearch = { field: "title", query: "" };
     function renderXxxList() {
       let list = ...(탭 등 다른 필터 적용)...;
       list = filterByTitleContent(list, xxxSearch, (x) => x.title, (x) => x.content);
       renderListSearch("xxx-search", xxxSearch, renderXxxList);
       ...(list 를 페이징해서 렌더링)...
     }
   검색어/필드가 바뀌면 renderListSearch 내부에서 자동으로 pager.page 리셋용 onChange(=render 함수)를 다시 호출한다.
   render 함수 안에서 pager.page = 0 리셋은 검색 change 핸들러 쪽에서 처리되므로, 페이지 쪽에서는
   검색 input을 건드릴 때 pager도 함께 0으로 리셋해주면 된다(아래 renderListSearch 참고). */

function filterByTitleContent(list, search, getTitle, getContent) {
  const q = (search.query || "").trim().toLowerCase();
  if (!q) return list;
  return list.filter((item) => {
    const hay = search.field === "content" ? getContent(item) : getTitle(item);
    return (hay || "").toLowerCase().includes(q);
  });
}

function renderListSearch(containerId, search, onChange) {
  const mount = document.getElementById(containerId);
  if (!mount) return;

  // 이미 그려져 있으면(같은 페이지 재렌더 시) input을 새로 만들지 않고 값만 유지 — 매 렌더마다 다시 그리면 포커스가 끊긴다.
  if (mount.dataset.wired === "1") return;
  mount.dataset.wired = "1";

  mount.innerHTML = `
    <select id="${containerId}-field" class="list-search-field">
      <option value="title" ${search.field === "title" ? "selected" : ""}>제목</option>
      <option value="content" ${search.field === "content" ? "selected" : ""}>내용</option>
    </select>
    <input type="text" id="${containerId}-input" class="list-search-input" placeholder="검색어를 입력하세요" value="${search.query || ""}">
  `;

  mount.querySelector(`#${containerId}-field`).addEventListener("change", (e) => {
    search.field = e.target.value;
    onChange();
  });
  mount.querySelector(`#${containerId}-input`).addEventListener("input", (e) => {
    search.query = e.target.value;
    onChange();
  });
}

/* ---------- 목록 페이징 (모든 목록형 페이지 공용) ---------- */
/* 사용법:
     const xxxPager = { page: 0, pageSize: 10 };
     function renderXxxList() {
       const filtered = ...(검색/탭 필터링 결과)...;
       const pageItems = paginateList(filtered, xxxPager);
       tbody.innerHTML = pageItems.map(...).join("");
       ...(pageItems 기준으로 클릭 핸들러 연결)...
       renderPagination("xxx-pager", xxxPager, filtered.length, renderXxxList);
     }
   필터가 바뀌는 지점(검색어 입력, 탭 클릭 등)에서는 pager.page = 0 으로 리셋할 것. */

const PAGE_SIZE_OPTIONS = [10, 50, 100];

function paginateList(list, pager) {
  const start = pager.page * pager.pageSize;
  return list.slice(start, start + pager.pageSize);
}

function renderPagination(containerId, pager, totalItems, onChange) {
  const mount = document.getElementById(containerId);
  if (!mount) return;

  if (totalItems === 0) {
    mount.innerHTML = "";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pager.pageSize));
  if (pager.page > totalPages - 1) pager.page = totalPages - 1;
  if (pager.page < 0) pager.page = 0;

  const windowSize = 7;
  let startPage = Math.max(0, pager.page - Math.floor(windowSize / 2));
  let endPage = Math.min(totalPages - 1, startPage + windowSize - 1);
  startPage = Math.max(0, endPage - windowSize + 1);

  const pageBtns = [];
  for (let p = startPage; p <= endPage; p++) {
    pageBtns.push(
      `<button type="button" class="${p === pager.page ? "active" : ""}" data-page="${p}">${p + 1}</button>`
    );
  }

  mount.innerHTML = `
    <div class="pagination-size">
      <label for="${containerId}-size">표시 개수</label>
      <select id="${containerId}-size">
        ${PAGE_SIZE_OPTIONS.map(
          (s) => `<option value="${s}" ${s === pager.pageSize ? "selected" : ""}>${s}개씩</option>`
        ).join("")}
      </select>
    </div>
    <div class="pagination-pages">
      <button type="button" data-page="0" ${pager.page === 0 ? "disabled" : ""}>처음</button>
      <button type="button" data-page="${pager.page - 1}" ${pager.page === 0 ? "disabled" : ""}>이전</button>
      ${pageBtns.join("")}
      <button type="button" data-page="${pager.page + 1}" ${pager.page >= totalPages - 1 ? "disabled" : ""}>다음</button>
      <button type="button" data-page="${totalPages - 1}" ${pager.page >= totalPages - 1 ? "disabled" : ""}>마지막</button>
    </div>
    <div class="pagination-info">총 ${totalItems}건 · ${pager.page + 1}/${totalPages}페이지</div>
  `;

  mount.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = Number(btn.dataset.page);
      if (p < 0 || p >= totalPages || p === pager.page) return;
      pager.page = p;
      onChange();
    });
  });

  mount.querySelector(`#${containerId}-size`).addEventListener("change", (e) => {
    pager.pageSize = Number(e.target.value);
    pager.page = 0;
    onChange();
  });
}

/* 검색어가 있을 때는 검색 결과가 몇 건 안 되는 경우가 많아 페이징이 오히려 불편하므로
   (특히 모바일/앱 화면) 검색 중에는 페이징을 건너뛰고 전체 결과를 한 번에 보여준다. */
function paginateListOrAll(list, pager, skip) {
  return skip ? list : paginateList(list, pager);
}

function renderPaginationOrAll(containerId, pager, totalItems, onChange, skip) {
  if (skip) {
    const mount = document.getElementById(containerId);
    if (mount) mount.innerHTML = "";
    return;
  }
  renderPagination(containerId, pager, totalItems, onChange);
}

/* 앱(모바일) 화면인지 판단 — 목록 표가 카드로 바뀌는 CSS 분기점(768px)과 맞춘다.
   이 화면에서는 페이지네이션 자체를 없애고 전체 목록을 한 번에 보여준다(카드라 세로 스크롤만 하면 되므로). */
function isAppViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

// 목록형 페이지가 화면 크기 변화(브라우저 창 크기 조절, 기기 회전 등)에 맞춰
// 페이징 여부를 다시 계산하도록 재렌더 콜백을 등록한다.
function onViewportChange(callback) {
  let timer = null;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(callback, 150);
  });
}

/* ---------- 네비게이션 ---------- */

function getRootBase() {
  const scripts = document.getElementsByTagName("script");
  for (const s of scripts) {
    if (s.src && s.src.indexOf("common/common.js") !== -1) {
      return s.src.slice(0, s.src.indexOf("common/common.js"));
    }
  }
  return "./";
}

function renderSearchResultRow(base, r) {
  return `
    <a class="header-search-result" href="${base}${r.path}">
      <span class="badge info">${r.icon} ${r.type}</span>
      <span class="header-search-result-body">
        <span class="header-search-result-title">${r.title}</span>
        <span class="header-search-result-snippet">${r.snippet}</span>
      </span>
    </a>`;
}

/* ---------- 통합 알림함 (헤더 🔔) ---------- */
/* 공지/지시사항 열람여부, 내 글의 새 댓글은 직원별로 읽음 상태를 localStorage에 남겨서 다음 방문에도 유지한다.
   재교육 필요/오늘 미출근 같은 항목은 조건이 사실인 동안 항상 떠 있는 "실시간 상태"라 별도 읽음 처리를 하지 않는다. */

function getNotifState(userKey) {
  const all = loadData("notifState", {});
  return all[userKey] || { readNoticeIds: [], commentSeenCounts: {} };
}

function saveNotifState(userKey, state) {
  const all = loadData("notifState", {});
  all[userKey] = state;
  saveData("notifState", all);
}

function buildNotifications() {
  const session = loadData("session", null);
  if (!session) return [];
  const base = getRootBase();
  const notifs = [];

  if (session.type === "admin") {
    const employees = loadData("employees", []);
    const today = formatDate(new Date());
    const todays = getAllAttendances().filter((a) => a.date === today);

    todays
      .filter((a) => a.excluded)
      .forEach((a) => {
        notifs.push({
          id: `exclude-${a.id}`,
          icon: "🚫",
          text: `${a.name}님이 오늘 직무배제 보고를 했습니다.`,
          href: `${base}pages/관리자 - 출근현황/admin-attendance.html`,
        });
      });

    const noShow = employees.length - todays.length;
    if (noShow > 0) {
      notifs.push({
        id: "no-attendance-today",
        icon: "🕐",
        text: `오늘 아직 출근 확인이 안 된 직원이 ${noShow}명 있습니다.`,
        href: `${base}pages/관리자 - 출근현황/admin-attendance.html`,
      });
    }

    const retrainCount = employees.filter((emp) => needsRetraining(summarizeEducation(getAttendancesFor(emp.empId)))).length;
    if (retrainCount > 0) {
      notifs.push({
        id: "retraining-admin",
        icon: "🔴",
        text: `재교육이 필요한 직원이 ${retrainCount}명 있습니다.`,
        href: `${base}pages/관리자 - 일일교육모니터링/admin-education.html`,
      });
    }
    return notifs;
  }

  const profile = loadData("profile", null);
  if (!profile) return [];
  const state = getNotifState(profile.empId);

  loadData("adminNotices", [])
    .filter((n) => isWithinNoticePeriod(n) && !state.readNoticeIds.includes(n.id))
    .forEach((n) => {
      notifs.push({
        id: `notice-${n.id}`,
        icon: n.type === "지시사항" ? "📢" : "📋",
        text: `[${n.type}] ${n.title}`,
        href: `${base}pages/공지사항/notice.html?open=${n.id}`,
        kind: "notice",
        noticeId: n.id,
      });
    });

  if (needsRetraining(summarizeEducation(getAttendancesFor(profile.empId)))) {
    notifs.push({
      id: "retraining-self",
      icon: "🔴",
      text: `최근 정답률이 ${RETRAINING_ACCURACY_THRESHOLD}% 미만입니다. 재교육이 필요할 수 있어요.`,
      href: `${base}pages/마이페이지/mypage.html`,
    });
  }

  loadData("posts", [])
    .filter((p) => p.author === profile.name)
    .forEach((p) => {
      const count = (p.comments || []).length;
      const seen = state.commentSeenCounts[p.id] || 0;
      if (count > seen) {
        notifs.push({
          id: `comment-${p.id}`,
          icon: "💬",
          text: `"${p.title}"에 새 댓글이 ${count - seen}개 달렸습니다.`,
          href: `${base}pages/자유게시판/board.html?open=${p.id}`,
          kind: "comment",
          postId: p.id,
          count,
        });
      }
    });

  return notifs;
}

function markNotificationRead(notif) {
  const profile = loadData("profile", null);
  if (!profile) return;
  const state = getNotifState(profile.empId);
  if (notif.kind === "notice") {
    if (!state.readNoticeIds.includes(notif.noticeId)) state.readNoticeIds.push(notif.noticeId);
  } else if (notif.kind === "comment") {
    state.commentSeenCounts[notif.postId] = notif.count;
  }
  saveNotifState(profile.empId, state);
}

function renderHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  const base = getRootBase();
  const session = loadData("session", null);
  const userLabel = session
    ? session.type === "admin"
      ? "⚙️ 관리자"
      : `${session.name || ""} ${session.role || ""}`.trim()
    : "";
  mount.outerHTML = `
    <header class="site-header" id="site-header">
      <div class="header-left">
        <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" type="button" title="메뉴 열기/닫기">☰</button>
        <div class="brand">기관사 안전교육
          <span class="sub">Locomotive Engineer Safety Training</span>
        </div>
      </div>
      <div class="header-right">
        ${userLabel ? `<div class="header-user-label">${userLabel}</div>` : ""}
        <button class="header-icon-btn" id="logout-btn" type="button" title="로그아웃">🚪</button>
        <div class="header-widget" id="search-widget">
          <button class="header-icon-btn" id="search-widget-btn" type="button" title="통합검색">🔍</button>
          <div class="widget-popup" id="search-widget-popup">
            <input type="text" id="search-widget-input" placeholder="제목, 내용, 증상 등으로 검색">
            <div class="header-search-results" id="search-widget-results"></div>
            <a class="widget-more-link" href="${base}pages/통합검색/search.html">통합검색 전체화면 열기 →</a>
          </div>
        </div>
        <div class="header-widget" id="chatbot-widget">
          <button class="header-icon-btn" id="chatbot-widget-btn" type="button" title="AI챗봇">🤖</button>
          <div class="widget-popup" id="chatbot-widget-popup">
            <div class="widget-popup-desc">겪고 있는 상황을 적어보세요. 비슷한 매뉴얼·사고사례를 찾아드려요.</div>
            <div class="header-search-results" id="chatbot-widget-results"></div>
            <form id="chatbot-widget-form">
              <input type="text" id="chatbot-widget-input" placeholder="예: 출입문이 안 열려요">
              <button type="submit" class="btn small">전송</button>
            </form>
            <a class="widget-more-link" href="${base}pages/AI챗봇/chatbot.html">AI챗봇 전체화면 열기 →</a>
          </div>
        </div>
        <div class="header-widget" id="notif-widget">
          <button class="header-icon-btn" id="notif-widget-btn" type="button" title="알림">🔔<span class="notif-badge" id="notif-badge" hidden>0</span></button>
          <div class="widget-popup" id="notif-widget-popup">
            <div class="header-search-results" id="notif-widget-results"></div>
          </div>
        </div>
        <button class="theme-toggle-btn" id="theme-toggle-btn" type="button" title="라이트/다크 모드 전환">🌙</button>
        <div class="header-date">${formatDate(new Date())}</div>
      </div>
    </header>
  `;
  document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);
  document.getElementById("sidebar-toggle-btn").addEventListener("click", toggleSidebar);
  document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("로그아웃하시겠습니까?")) logout();
  });
  updateThemeToggleIcon();
  wireHeaderWidgets(base);
  wireNotifWidget(base);
}

/* ---------- 사이드바 열기/닫기 (앱/모바일 화면의 슬라이드 메뉴) ---------- */

function openSidebar() {
  document.getElementById("site-sidebar")?.classList.add("open");
  document.getElementById("sidebar-backdrop")?.classList.add("open");
}

function closeSidebar() {
  document.getElementById("site-sidebar")?.classList.remove("open");
  document.getElementById("sidebar-backdrop")?.classList.remove("open");
}

function toggleSidebar() {
  const sidebar = document.getElementById("site-sidebar");
  if (!sidebar) return;
  if (sidebar.classList.contains("open")) closeSidebar();
  else openSidebar();
}

function wireHeaderWidgets(base) {
  const searchBtn = document.getElementById("search-widget-btn");
  const searchWidget = document.getElementById("search-widget");
  const searchInput = document.getElementById("search-widget-input");
  const searchResults = document.getElementById("search-widget-results");

  const chatbotBtn = document.getElementById("chatbot-widget-btn");
  const chatbotWidget = document.getElementById("chatbot-widget");
  const chatbotForm = document.getElementById("chatbot-widget-form");
  const chatbotInput = document.getElementById("chatbot-widget-input");
  const chatbotResults = document.getElementById("chatbot-widget-results");

  function closeAllWidgets() {
    document.querySelectorAll(".header-widget.open").forEach((w) => w.classList.remove("open"));
  }

  searchBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = !searchWidget.classList.contains("open");
    closeAllWidgets();
    if (willOpen) {
      searchWidget.classList.add("open");
      searchInput.focus();
    }
  });

  chatbotBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = !chatbotWidget.classList.contains("open");
    closeAllWidgets();
    if (willOpen) {
      chatbotWidget.classList.add("open");
      chatbotInput.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!searchWidget.contains(e.target)) searchWidget.classList.remove("open");
    if (!chatbotWidget.contains(e.target)) chatbotWidget.classList.remove("open");
  });

  searchInput.addEventListener("input", () => {
    const results = searchAll(searchInput.value, 6);
    searchResults.innerHTML = results.length
      ? results.map((r) => renderSearchResultRow(base, r)).join("")
      : searchInput.value.trim()
        ? `<div class="header-search-empty">검색 결과가 없습니다.</div>`
        : "";
  });

  chatbotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = chatbotInput.value.trim();
    if (!q) return;
    const results = searchAll(q, 5);
    chatbotResults.innerHTML = results.length
      ? `<div class="header-search-empty">"${q}"과(와) 비슷한 자료를 찾았어요:</div>` +
        results.map((r) => renderSearchResultRow(base, r)).join("")
      : `<div class="header-search-empty">"${q}"과(와) 관련된 자료를 찾지 못했어요. 다른 표현으로 다시 시도해보세요.</div>`;
  });
}

function renderNotifList() {
  const notifs = buildNotifications();
  const badge = document.getElementById("notif-badge");
  badge.textContent = notifs.length;
  badge.hidden = notifs.length === 0;

  const results = document.getElementById("notif-widget-results");
  results.innerHTML = notifs.length
    ? notifs
        .map(
          (n) => `
      <a class="header-search-result notif-item" data-notif-id="${n.id}" ${n.href ? `href="${n.href}"` : ""}>
        <span>${n.icon}</span>
        <span class="header-search-result-body">
          <span class="header-search-result-title">${n.text}</span>
        </span>
      </a>`
        )
        .join("")
    : `<div class="header-search-empty">새 알림이 없습니다.</div>`;

  results.querySelectorAll(".notif-item").forEach((el) => {
    el.addEventListener("click", () => {
      // href가 있으면 그 알림이 가리키는 게시물/공지로 그대로 이동한다 (마킹만 하고 목록을 다시 그리면
      // 이동 중인 링크 엘리먼트가 DOM에서 사라져 이동이 씹힐 수 있어 재렌더링은 하지 않는다).
      const notif = notifs.find((n) => n.id === el.dataset.notifId);
      if (notif && notif.kind) markNotificationRead(notif);
    });
  });
}

function wireNotifWidget() {
  const btn = document.getElementById("notif-widget-btn");
  const widget = document.getElementById("notif-widget");
  if (!btn || !widget) return;

  renderNotifList();

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = !widget.classList.contains("open");
    document.querySelectorAll(".header-widget.open").forEach((w) => w.classList.remove("open"));
    if (willOpen) {
      widget.classList.add("open");
      renderNotifList();
    }
  });

  document.addEventListener("click", (e) => {
    if (!widget.contains(e.target)) widget.classList.remove("open");
  });
}

function renderSidebar(activeKey) {
  const mount = document.getElementById("site-sidebar");
  if (!mount) return;
  const base = getRootBase();
  const session = loadData("session", null);
  // 직원 계정은 메인 메뉴만, 관리자 계정은 관리자 메뉴만 본다 (완전히 분리된 두 모드).
  const allowedGroup = session && session.type === "admin" ? "admin" : "main";

  // 공지사항 미확인 건수 — 직원 세션일 때만 사이드바 메뉴에 NEW 뱃지로 보여준다.
  const unackedNoticeCount =
    session && session.type === "employee" ? getUnackedNoticesFor(session.empId).length : 0;

  const sections = NAV_GROUPS.filter((group) => group.key === allowedGroup).map((group) => {
    const items = NAV_ITEMS.filter((item) => item.group === group.key);
    if (!items.length) return "";
    const links = items
      .map((item) => {
        const cls = item.key === activeKey ? "active" : "";
        const newBadge =
          item.key === "notice" && unackedNoticeCount > 0
            ? `<span class="badge danger sidebar-new-badge">NEW ${unackedNoticeCount}</span>`
            : "";
        return `<a href="${base}${item.path}" class="${cls}"><span class="icon">${item.icon}</span>${item.label}${newBadge}</a>`;
      })
      .join("");
    return `<div class="sidebar-title">${group.title}</div><ul class="sidebar-menu">${links}</ul>`;
  }).join("");

  mount.outerHTML = `
    <aside class="site-sidebar" id="site-sidebar">
      <nav>
        ${sections}
        <div class="sidebar-menu-footer">
          <ul class="sidebar-menu">
            <a href="#" id="sidebar-logout-link" class="sidebar-danger"><span class="icon">🚪</span>로그아웃</a>
          </ul>
        </div>
      </nav>
    </aside>
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
  `;

  document.getElementById("sidebar-backdrop").addEventListener("click", closeSidebar);
  // 모바일에서 메뉴 항목을 클릭해 페이지를 이동할 때 슬라이드 메뉴를 자동으로 닫는다.
  document.querySelectorAll("#site-sidebar .sidebar-menu a:not(#sidebar-logout-link)").forEach((a) => {
    a.addEventListener("click", closeSidebar);
  });
  document.getElementById("sidebar-logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("로그아웃하시겠습니까?")) logout();
  });
}

function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  mount.outerHTML = `
    <footer class="site-footer" id="site-footer">
      © 2026 기관사 안전교육 시스템 · 발표용 데모
    </footer>
  `;
}

// 각 페이지는 DOMContentLoaded 시점에 renderLayout(현재메뉴키) 한 번만 호출하면 된다.
function renderLayout(activeKey) {
  applyTheme();
  renderHeader();
  renderSidebar(activeKey);
  renderFooter();
}
