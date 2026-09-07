/* chatbot.html 전용 데이터 & 로직 */
/* 단순 키워드 검색 기능(handleUserMessage)에, PDCA식 능동 학습 요소를 정적 사이트 범위 안에서 덧붙인다.
   Plan: 시즌/최신/취약분야 기반 추천, Do: 시나리오 훈련(등록된 매뉴얼의 조치 순서를 문제로 변환),
   Check: 오답 즉시 피드백, Act: 오답 항목을 마이페이지 취약분야와 동일한 화면으로 다시 안내. */

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

// 클릭형 칩 버튼 목록(카테고리 선택, 시나리오 선택지 등)을 공용으로 그린다.
function appendChoiceChips(choices, onPick) {
  const log = document.getElementById("chat-log");
  const wrap = document.createElement("div");
  wrap.className = "chat-choice-chips";
  wrap.innerHTML = choices.map((c, i) => `<button type="button" class="chat-chip" data-i="${i}">${c.label}</button>`).join("");
  wrap.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap.querySelectorAll("button").forEach((b) => (b.disabled = true));
      btn.classList.add("picked");
      onPick(choices[Number(btn.dataset.i)], btn);
    });
  });
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function handleUserMessage(text) {
  appendUserText(text);
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

/* ---------- Plan: 시즌/최신/취약분야 기반 추천 ---------- */

const SEASON_KEYWORDS = {
  6: "혹서기", 7: "혹서기", 8: "혹서기",
  12: "동절기", 1: "동절기", 2: "동절기",
  3: "우천", 4: "우천", 5: "우천",
  9: "태풍", 10: "태풍", 11: "태풍",
};

function suggestProactiveTopics() {
  const profile = loadData("profile", null);

  // 1) 내 취약분야 (마이페이지와 동일 로직)
  if (profile) {
    const records = getAttendancesFor(profile.empId);
    const weak = analyzeWeakAreas(records, 3);
    if (weak.length > 0) {
      appendBotText(`📌 최근 자주 틀리신 항목이 있어요. 시나리오 훈련이나 매뉴얼로 바로 복습해보시겠어요?`);
      const log = document.getElementById("chat-log");
      const wrap = document.createElement("div");
      wrap.className = "chat-results";
      wrap.innerHTML = renderWeakAreasHtml(weak);
      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;
    }
  }

  // 2) 시즌 키워드 추천
  const month = new Date().getMonth() + 1;
  const seasonKeyword = SEASON_KEYWORDS[month];
  if (seasonKeyword) {
    const seasonResults = searchAll(seasonKeyword, 3);
    if (seasonResults.length > 0) {
      appendBotText(`🗓️ 지금은 "${seasonKeyword}" 관련 사고가 늘어나는 시기예요. 관련 자료를 먼저 보여드릴게요.`);
      appendResultCards(seasonResults);
    }
  }

  // 3) 최근 등록된 사고사례 (최신성 기반)
  const recentAccidents = [...loadData("accidents", [])]
    .filter((a) => a.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 2);
  if (recentAccidents.length > 0) {
    appendBotText(`🆕 최근 등록된 사고사례예요. 한번 확인해보세요.`);
    appendResultCards(
      recentAccidents.map((a) => ({
        icon: "📋",
        type: "사고사례",
        path: "pages/사고사례/accident.html",
        title: a.title,
        snippet: `${a.line || ""} · ${a.date}`,
      }))
    );
  }
}

/* ---------- Do/Check/Act: 시나리오 훈련 (등록된 매뉴얼의 조치 순서를 순서 맞추기 문제로 변환) ---------- */

const SCENARIO_SOURCES = [
  { key: "emergencies", label: "이례상황", getSteps: (x) => x.procedureSteps || [] },
  {
    key: "malfunctions",
    label: "고장처치",
    getSteps: (x) => (x.procedure || "").split("\n").map((s) => s.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean),
  },
];

let scenarioState = null; // { sourceKey, item, steps, stepIndex, wrongSteps: [] }

function pickScenarioItem(sourceKey) {
  const src = SCENARIO_SOURCES.find((s) => s.key === sourceKey);
  const pool = loadData(sourceKey, [])
    .map((item) => ({ item, steps: src.getSteps(item) }))
    .filter((x) => x.steps.length >= 3);
  if (pool.length === 0) return null;
  return { ...pool[Math.floor(Math.random() * pool.length)], src };
}

// 오답 보기(디코이)는 같은 자료군의 다른 매뉴얼 절차에서 무작위로 가져온다.
function pickDecoySteps(sourceKey, excludeItemTitle, count) {
  const src = SCENARIO_SOURCES.find((s) => s.key === sourceKey);
  const allSteps = loadData(sourceKey, [])
    .filter((x) => (x.title || "") !== excludeItemTitle)
    .flatMap((x) => src.getSteps(x));
  const shuffled = [...allSteps].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function startScenario(sourceKey) {
  const picked = pickScenarioItem(sourceKey);
  if (!picked) {
    appendBotText("아직 등록된 매뉴얼이 부족해서 시나리오를 만들 수 없어요. 매뉴얼을 더 등록한 뒤 다시 시도해주세요.");
    return;
  }
  scenarioState = {
    sourceKey,
    itemTitle: picked.item.title,
    steps: picked.steps,
    stepIndex: 0,
    wrongSteps: [],
  };
  const label = SCENARIO_SOURCES.find((s) => s.key === sourceKey).label;
  appendBotText(`🎮 [${label} 시나리오 훈련] "${picked.item.title}" 상황입니다.\n실제 상황이라 생각하고, 각 단계마다 알맞은 조치를 순서대로 골라주세요.`);
  askScenarioStep();
}

function askScenarioStep() {
  const st = scenarioState;
  const correctStep = st.steps[st.stepIndex];
  const decoys = pickDecoySteps(st.sourceKey, st.itemTitle, 2);
  const options = shuffleArray([correctStep, ...decoys]).map((text) => ({ label: text, correct: text === correctStep }));

  appendBotText(`${st.stepIndex + 1}단계 — 다음으로 해야 할 조치는 무엇일까요?`);
  appendChoiceChips(options, (choice, btnEl) => {
    if (choice.correct) {
      btnEl.classList.add("chat-chip-correct");
      appendBotText("✅ 정답입니다. 다음 단계로 진행할게요.");
    } else {
      btnEl.classList.add("chat-chip-wrong");
      st.wrongSteps.push({ stepIndex: st.stepIndex, correctText: correctStep, pickedText: choice.label });
      appendBotText(`❌ 실제 매뉴얼상의 순서와 달라요.\n정답: ${correctStep}`);
    }
    st.stepIndex += 1;
    if (st.stepIndex < st.steps.length) {
      askScenarioStep();
    } else {
      finishScenario();
    }
  });
}

// Check: 즉시 피드백은 각 단계 클릭 시 이미 제공됨. Act: 오답이 있었던 항목을 정리해 매뉴얼 복습으로 연결.
function finishScenario() {
  const st = scenarioState;
  const total = st.steps.length;
  const wrongCount = st.wrongSteps.length;
  const correctCount = total - wrongCount;

  appendBotText(`🏁 시나리오 종료 — ${total}단계 중 ${correctCount}단계 정답 (오답 ${wrongCount}건)`);

  if (wrongCount > 0) {
    const wrongText = st.wrongSteps
      .map((w) => `· ${w.stepIndex + 1}단계 — 선택: "${w.pickedText}" → 정답: "${w.correctText}"`)
      .join("\n");
    appendBotText(`📋 오답 리포트\n${wrongText}\n\n"${st.itemTitle}" 매뉴얼 원문을 다시 확인해보시는 걸 추천드려요.`);
    const manualPath =
      st.sourceKey === "malfunctions" ? "pages/고장조치메뉴얼/malfunction.html" : "pages/이례상황메뉴얼/emergency.html";
    appendResultCards([
      {
        icon: st.sourceKey === "malfunctions" ? "🔧" : "🚨",
        type: SCENARIO_SOURCES.find((s) => s.key === st.sourceKey).label,
        path: manualPath,
        title: st.itemTitle,
        snippet: "원문 매뉴얼 바로 보기",
      },
    ]);
  } else {
    appendBotText("👏 전 단계를 정확히 수행하셨습니다! 실제 상황에서도 이 순서를 기억해주세요.");
  }

  scenarioState = null;
  appendBotText("다른 시나리오를 더 해보시려면 아래에서 선택해주세요.");
  offerScenarioMenu();
}

function offerScenarioMenu() {
  appendChoiceChips(
    [
      { label: "🚨 이례상황 시나리오", sourceKey: "emergencies" },
      { label: "🔧 고장처치 시나리오", sourceKey: "malfunctions" },
    ],
    (choice) => startScenario(choice.sourceKey)
  );
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("chatbot");

  appendBotText(
    "안녕하세요! 겪고 있는 상황이나 증상을 적어주시면, 등록된 매뉴얼·사고사례 중 비슷한 자료를 찾아드릴게요.\n예) 출입문이 안 열려요 / 정지신호 위반했을 때 조치는? / 판타 상승 불능"
  );

  suggestProactiveTopics();

  appendBotText("🎮 실제 상황처럼 조치 순서를 훈련해보고 싶으시면 아래 버튼을 눌러 시나리오 훈련을 시작할 수 있어요.");
  offerScenarioMenu();

  document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    handleUserMessage(text);
  });
});
