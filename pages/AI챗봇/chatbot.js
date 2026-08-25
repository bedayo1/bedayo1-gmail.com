/* chatbot.html 전용 데이터 & 로직 */

function appendBotText(text) {
  const log = document.getElementById("chat-log");
  const el = document.createElement("div");
  el.className = "chat-msg bot";
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

function appendUserText(text) {
  const log = document.getElementById("chat-log");
  const el = document.createElement("div");
  el.className = "chat-msg user";
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

function appendResultCards(results) {
  const log = document.getElementById("chat-log");
  const base = getRootBase();
  const wrap = document.createElement("div");
  wrap.className = "chat-results";
  wrap.innerHTML = results
    .map(
      (r) => `
      <a class="chat-result-card" href="${base}${r.path}">
        <span class="badge info">${r.icon} ${r.type}</span>
        <div class="chat-result-title">${r.title}</div>
        <div class="chat-result-snippet">${r.snippet}</div>
      </a>`
    )
    .join("");
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function handleUserMessage(text) {
  appendUserText(text);
  // 교육과정관리·사고사례·고장처치/이례상황 매뉴얼·사례공유게시판 등 SEARCH_SOURCES에 등록된
  // 모든 자료의 전체 내용을 대상으로 찾는다 (common.js searchAll/buildSearchIndex 참고).
  const results = searchAll(text, 8);
  if (results.length === 0) {
    appendBotText(
      `"${text}"과(와) 관련된 자료를 찾지 못했어요. 증상이나 상황을 조금 더 구체적으로 적어주시면 다시 찾아볼게요.`
    );
    return;
  }
  appendBotText(`"${text}"과(와) 비슷한 자료 ${results.length}건을 찾았어요. 관련 있어 보이는 걸 눌러서 확인해보세요.`);
  appendResultCards(results);
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("chatbot");

  appendBotText(
    "안녕하세요! 겪고 있는 상황이나 증상을 적어주시면, 등록된 매뉴얼·사고사례 중 비슷한 자료를 찾아드릴게요.\n예) 출입문이 안 열려요 / 정지신호 위반했을 때 조치는? / 판타 상승 불능"
  );

  document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    handleUserMessage(text);
  });
});
