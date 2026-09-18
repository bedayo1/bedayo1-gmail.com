/* scenario.html 전용 데이터 & 로직 */
/* AI챗봇의 시나리오 훈련과 같은 엔진(등록된 매뉴얼의 조치 순서를 객관식 문제로 자동 변환)을
   PDCA 4단계 화면(Plan 카테고리 선택 → Do 시나리오 풀이 → Check 즉시 채점 → Act 누적 데이터 기반 추천)으로 보여준다.
   자유 서술형 답변을 실제 AI가 채점하는 건 별도의 AI API·서버가 필요해 이번 버전에는 없다 — 대신
   지금 있는 데이터만으로 가능한 "정답/오답 자동 판정 + 누적 취약분야 추천"까지 구현했다. */

const SCENARIO_SOURCES = [
  {
    key: "emergencies",
    label: "이례상황",
    icon: "🚨",
    desc: "화재·탈선 등 이례상황 매뉴얼 기반",
    manualPath: "pages/이례상황메뉴얼/emergency.html",
    getSteps: (x) => x.procedureSteps || [],
    getPremise: (x) => x.condition || "",
  },
  {
    key: "malfunctions",
    label: "고장처치",
    icon: "🔧",
    desc: "차종별 고장처치 매뉴얼 기반",
    manualPath: "pages/고장조치메뉴얼/malfunction.html",
    getSteps: (x) => (x.procedure || "").split("\n").map((s) => s.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean),
    getPremise: (x) => [x.symptom, x.cause].filter(Boolean).join(" "),
  },
];

// Plan 단계 카드 8개(2×4)는 실제 등록 폼(emergency.html)의 "상황 유형" 선택지 + 고장처치(차량장애)를
// 그대로 따른다 — 화면과 실제 등록 가능한 분류가 항상 일치하도록. 아직 그 카테고리로 등록된 매뉴얼이
// 없으면 카드를 "준비 중"으로 비활성 표시해서, 있지도 않은 시나리오를 있는 것처럼 보여주지는 않는다
// (나중에 그 유형의 매뉴얼이 등록되면 자동으로 활성화된다).
const SCENARIO_CARD_DEFS = [
  { sourceKey: "emergencies", category: "열차운행장애", icon: "🚆", label: "열차운행장애", subtitle: "출발·운행 중 이상", color: "blue" },
  { sourceKey: "emergencies", category: "신호장애", icon: "⚠️", label: "신호장애", subtitle: "신호 관련 이상", color: "red" },
  { sourceKey: "malfunctions", category: null, icon: "🔧", label: "차량장애", subtitle: "전동차 고장", color: "green" },
  { sourceKey: "emergencies", category: "전원장애", icon: "⚡", label: "전원장애", subtitle: "전력 공급 이상", color: "purple" },
  { sourceKey: "emergencies", category: "승강장 안전사고", icon: "🚉", label: "승강장 안전사고", subtitle: "승객 안전 관련", color: "orange" },
  { sourceKey: "emergencies", category: "기상상황", icon: "🌧️", label: "기상상황", subtitle: "기상 악화·자연재해", color: "slate" },
  { sourceKey: "emergencies", category: "인적사고", icon: "🧍", label: "인적사고", subtitle: "선로침입·자살사고 등", color: "blue" },
  { sourceKey: "emergencies", category: "기타", icon: "❓", label: "기타", subtitle: "기타 이례상황", color: "gray" },
];

function buildScenarioCards() {
  return SCENARIO_CARD_DEFS.map((def) => {
    const src = SCENARIO_SOURCES.find((s) => s.key === def.sourceKey);
    const data = loadData(def.sourceKey, []);
    const ready = data.some((x) => (!def.category || x.category === def.category) && src.getSteps(x).length >= 3);
    return {
      sourceKey: def.sourceKey,
      category: def.category,
      label: def.label,
      icon: def.icon,
      color: def.color,
      desc: ready ? def.subtitle : "아직 등록된 매뉴얼이 없어요",
      ready,
    };
  });
}

const STEPS = [
  { key: "plan", letter: "P", label: "Plan", desc: "사고사례 선택" },
  { key: "do", letter: "D", label: "Do", desc: "학습 시나리오 생성" },
  { key: "check", letter: "C", label: "Check", desc: "즉각적 오류 진단" },
  { key: "act", letter: "A", label: "Act", desc: "오답 데이터 기반 추천" },
];

let currentStepIndex = 0;
let run = null; // { sourceKey, item, itemTitle, steps, stepIndex, wrongSteps: [] }

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickScenarioItem(sourceKey, category) {
  const src = SCENARIO_SOURCES.find((s) => s.key === sourceKey);
  const pool = loadData(sourceKey, [])
    .filter((item) => !category || item.category === category)
    .map((item) => ({ item, steps: src.getSteps(item) }))
    .filter((x) => x.steps.length >= 3);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 오답 보기(디코이)는 같은 카테고리 안에서 먼저 찾고, 부족하면 같은 자료군 전체에서 채운다.
function pickDecoySteps(sourceKey, category, excludeItemTitle, count) {
  const src = SCENARIO_SOURCES.find((s) => s.key === sourceKey);
  const all = loadData(sourceKey, []).filter((x) => (x.title || "") !== excludeItemTitle);
  const sameCategory = category ? all.filter((x) => x.category === category) : all;
  const pooled = sameCategory.length >= 3 ? sameCategory : all;
  return shuffleArray(pooled.flatMap((x) => src.getSteps(x))).slice(0, count);
}

/* ---------- 누적 기록 (Act 단계에서 쓸 데이터) ---------- */

function saveScenarioAttempt(result) {
  const attempts = loadData("scenarioAttempts", []);
  attempts.push(result);
  saveData("scenarioAttempts", attempts);
}

function getScenarioStats() {
  const attempts = loadData("scenarioAttempts", []);
  return SCENARIO_SOURCES.map((src) => {
    const mine = attempts.filter((a) => a.sourceKey === src.key);
    const total = mine.reduce((s, a) => s + a.total, 0);
    const correct = mine.reduce((s, a) => s + a.correct, 0);
    return { ...src, attemptCount: mine.length, total, correct, accuracy: total ? Math.round((correct / total) * 100) : null };
  });
}

function statTier(accuracy) {
  if (accuracy >= 80) return "high";
  if (accuracy >= 60) return "mid";
  return "low";
}

/* ---------- 렌더링 ---------- */

function renderStepper() {
  document.getElementById("pdca-stepper").innerHTML = STEPS.map(
    (s, i) => `
    <div class="pdca-step ${i === currentStepIndex ? "active" : ""} ${i < currentStepIndex ? "done" : ""}">
      <div class="pdca-step-circle">${s.letter}</div>
      <div class="pdca-step-label">${s.label}</div>
      <div class="pdca-step-desc">${s.desc}</div>
    </div>`
  ).join("");
}

function goToStep(i) {
  currentStepIndex = i;
  renderStepper();
  renderBody();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderBody() {
  const body = document.getElementById("pdca-body");
  const step = STEPS[currentStepIndex].key;

  if (step === "plan") {
    const cards = buildScenarioCards();
    body.innerHTML = `
      <h3 class="pdca-body-title">사고사례 카테고리를 선택해주세요</h3>
      <p class="pdca-body-sub">학습하고 싶은 사고사례 분야를 선택해주세요.</p>
      <div class="scenario-cat-grid">
        ${cards
          .map(
            (c, i) => `
          <button type="button" class="scenario-cat-card ${c.ready ? "" : "not-ready"}" data-i="${i}">
            <span class="scenario-cat-icon color-${c.color}">${c.icon}</span>
            <span class="scenario-cat-text">
              <span class="scenario-cat-label">${c.label}</span>
              <span class="scenario-cat-desc">${c.desc}</span>
            </span>
            ${c.ready ? `<span class="scenario-cat-chevron">›</span>` : `<span class="badge neutral">준비 중</span>`}
          </button>`
          )
          .join("")}
      </div>`;
    body.querySelectorAll(".scenario-cat-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = cards[Number(btn.dataset.i)];
        if (!card.ready) {
          showToast("아직 이 카테고리로 등록된 매뉴얼이 없어요. 매뉴얼이 등록되면 바로 훈련할 수 있어요.");
          return;
        }
        startRun(card);
      });
    });
    return;
  }

  if (step === "do" || step === "check") {
    if (!run) {
      body.innerHTML = `<div class="empty-state">먼저 Plan 단계에서 카테고리를 선택해주세요.</div>`;
      return;
    }
    renderRunStep(body);
    return;
  }

  if (step === "act") {
    renderActStep(body);
  }
}

function startRun(card) {
  const sourceKey = card.sourceKey;
  const category = card.category || null;
  const picked = pickScenarioItem(sourceKey, category);
  if (!picked) {
    showToast("등록된 매뉴얼이 부족해서 시나리오를 만들 수 없어요.");
    return;
  }
  run = {
    sourceKey,
    category,
    item: picked.item,
    itemTitle: picked.item.title,
    steps: picked.steps,
    stepIndex: 0,
    wrongSteps: [],
    correctSteps: [],
    finished: false,
  };
  goToStep(1); // Do
}

function renderRunStep(body) {
  const src = SCENARIO_SOURCES.find((s) => s.key === run.sourceKey);

  if (run.finished) {
    renderCheckResult(body, src);
    return;
  }

  const correctStep = run.steps[run.stepIndex];
  const decoys = pickDecoySteps(run.sourceKey, run.category, run.itemTitle, 2);
  const options = shuffleArray([correctStep, ...decoys]);
  const premise = src.getPremise(run.item);
  const manualHref = `${getRootBase()}${src.manualPath}?title=${encodeURIComponent(run.itemTitle)}`;

  body.innerHTML = `
    <div class="scenario-run-card">
      <div class="scenario-run-badges">
        <span class="badge info">${src.icon} ${src.label}</span>
        <span class="badge danger">실전 시나리오</span>
        <span class="scenario-run-progress">${run.stepIndex + 1} / ${run.steps.length}</span>
      </div>
      <h3 class="pdca-body-title">시나리오 — "${run.itemTitle}"</h3>
      ${premise ? `<p class="scenario-run-premise">${premise}</p>` : ""}
      <p class="scenario-run-question">다음으로 해야 할 조치는 무엇일까요?</p>
      <div class="scenario-choice-list">
        ${options.map((text, i) => `<button type="button" class="scenario-choice" data-i="${i}">${text}</button>`).join("")}
      </div>
      <div id="scenario-run-feedback"></div>
      <div class="scenario-run-footer">
        <a class="btn secondary" href="${manualHref}" target="_blank" rel="noopener">📖 관련 매뉴얼 보기</a>
      </div>
    </div>`;

  body.querySelectorAll(".scenario-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      body.querySelectorAll(".scenario-choice").forEach((b) => (b.disabled = true));
      const picked = options[Number(btn.dataset.i)];
      const correct = picked === correctStep;
      btn.classList.add(correct ? "scenario-choice-correct" : "scenario-choice-wrong");
      const feedback = document.getElementById("scenario-run-feedback");
      if (correct) {
        run.correctSteps.push({ stepIndex: run.stepIndex, text: correctStep });
        feedback.innerHTML = `<div class="scenario-feedback-box ok">✅ 정답입니다.</div>`;
      } else {
        run.wrongSteps.push({ stepIndex: run.stepIndex, correctText: correctStep, pickedText: picked });
        feedback.innerHTML = `<div class="scenario-feedback-box">❌ 실제 매뉴얼 순서와 달라요. 정답: "${correctStep}"</div>`;
      }
      setTimeout(() => {
        run.stepIndex += 1;
        if (run.stepIndex >= run.steps.length) {
          run.finished = true;
          saveScenarioAttempt({
            sourceKey: run.sourceKey,
            itemTitle: run.itemTitle,
            total: run.steps.length,
            correct: run.steps.length - run.wrongSteps.length,
            date: formatDate(new Date()),
          });
          goToStep(2); // Check
        } else {
          renderRunStep(body);
        }
      }, 900);
    });
  });
}

function renderCheckResult(body, src) {
  const total = run.steps.length;
  const wrongCount = run.wrongSteps.length;
  const correctCount = total - wrongCount;
  const score = Math.round((correctCount / total) * 100);
  const perfect = wrongCount === 0;

  body.innerHTML = `
    <div class="scenario-run-card">
      <div class="scenario-run-badges">
        <span class="badge info">${src.icon} ${src.label}</span>
        <span class="badge danger">실전 시나리오</span>
      </div>

      <div class="scenario-result-banner ${perfect ? "ok" : "bad"}">
        <span class="scenario-result-icon">${perfect ? "✅" : "❌"}</span>
        <span class="scenario-result-text">${perfect ? "전 절차를 정확히 수행했습니다." : "일부 절차가 누락되었습니다."}</span>
        <span class="scenario-result-score">${score}점 <small>/ 100점</small></span>
      </div>

      <h3 class="pdca-body-title">"${run.itemTitle}" 결과</h3>

      ${
        wrongCount > 0
          ? `<div class="scenario-feedback-box">
              <div class="scenario-feedback-title">⚠️ 누락·오류 절차</div>
              ${run.wrongSteps
                .map(
                  (w, i) => `
                <div class="scenario-numbered-row bad"><span class="scenario-numbered-dot bad">${i + 1}</span>
                  ${w.stepIndex + 1}단계 — 선택: "${w.pickedText}" → 정답: "${w.correctText}"</div>`
                )
                .join("")}
            </div>`
          : ""
      }
      ${
        run.correctSteps.length > 0
          ? `<div class="scenario-feedback-box ok">
              <div class="scenario-feedback-title">✅ 잘한 점</div>
              ${run.correctSteps
                .map((c, i) => `<div class="scenario-numbered-row ok"><span class="scenario-numbered-dot ok">${i + 1}</span> ${c.stepIndex + 1}단계 — "${c.text}"</div>`)
                .join("")}
            </div>`
          : ""
      }
      <div class="scenario-feedback-box">
        <div class="scenario-feedback-title">📋 정답 예시 (핵심 절차)</div>
        ${run.steps.map((s, i) => `<div class="scenario-numbered-row"><span class="scenario-numbered-dot">${i + 1}</span> ${s}</div>`).join("")}
      </div>

      <div class="modal-actions">
        <button type="button" class="btn secondary" id="btn-retry-plan">다른 시나리오 하기</button>
        <button type="button" class="btn" id="btn-go-act">Act 단계(추천) 보기</button>
      </div>
    </div>`;
  document.getElementById("btn-retry-plan").addEventListener("click", () => goToStep(0));
  document.getElementById("btn-go-act").addEventListener("click", () => goToStep(3));
}

function renderActStep(body) {
  const stats = getScenarioStats();
  const withData = stats.filter((s) => s.attemptCount > 0);

  if (withData.length === 0) {
    body.innerHTML = `<div class="empty-state">아직 완료한 시나리오가 없어요. Plan 단계에서 먼저 훈련을 시작해보세요.</div>`;
    return;
  }

  const totalAll = withData.reduce((s, x) => s + x.total, 0);
  const correctAll = withData.reduce((s, x) => s + x.correct, 0);
  const overall = Math.round((correctAll / totalAll) * 100);
  const weakest = [...withData].sort((a, b) => a.accuracy - b.accuracy)[0];
  const allStrong = weakest.accuracy >= 90;

  // 취약 영역에서 아직 오답이 있었던(=아직 완벽히 못 맞춘) 매뉴얼을 최근 시도 기준으로 최대 3개 추천한다.
  const attempts = loadData("scenarioAttempts", []);
  const recommendTitles = [
    ...new Set(
      attempts
        .filter((a) => a.sourceKey === weakest.key && a.correct < a.total)
        .map((a) => a.itemTitle)
    ),
  ].slice(0, 3);

  body.innerHTML = `
    <h3 class="pdca-body-title">나의 학습 분석 결과</h3>
    <div class="scenario-act-summary">
      <div class="scenario-donut" style="--pct:${overall}">
        <div class="scenario-donut-inner">
          <div class="scenario-donut-score">${overall}점</div>
          <div class="scenario-donut-label">종합 점수</div>
        </div>
      </div>
      <div class="scenario-act-summary-text">
        ${
          allStrong
            ? `기본적인 대응 능력이 우수합니다. 지금까지 훈련한 영역 모두 정답률이 높으니, 다른 카테고리도 훈련해서 범위를 넓혀보세요.`
            : `기본적인 대응 능력은 양호하나, <strong>${weakest.label}</strong> 영역(정답률 ${weakest.accuracy}%)에서 보완이 필요합니다.`
        }
      </div>
    </div>

    <div class="pdca-body-title" style="margin-top:20px;">항목별 정답률</div>
    <div class="scenario-stat-grid">
      ${withData
        .map(
          (s) => `
        <div class="scenario-stat-card">
          <div class="scenario-stat-label">${s.icon} ${s.label} (${s.attemptCount}회 훈련)</div>
          <div class="scenario-stat-bar-track"><div class="scenario-stat-bar-fill tier-${statTier(s.accuracy)}" style="width:${s.accuracy}%"></div></div>
          <div class="scenario-stat-value">${s.accuracy}%</div>
        </div>`
        )
        .join("")}
    </div>

    ${
      recommendTitles.length > 0
        ? `<div class="pdca-body-title" style="margin-top:20px;">🎯 AI 추천 학습</div>
           <div class="scenario-recommend-list">
             ${recommendTitles
               .map(
                 (title, i) => `
               <div class="scenario-recommend-row">
                 <span class="scenario-numbered-dot">${i + 1}</span>
                 <span class="scenario-recommend-title">${title}</span>
                 <div class="scenario-recommend-actions">
                   <a class="btn secondary small" href="${getRootBase()}${weakest.manualPath}?title=${encodeURIComponent(title)}" target="_blank" rel="noopener">📖 매뉴얼 학습</a>
                   <button type="button" class="btn small" data-retrain-title="${title}">🎮 시나리오 실습</button>
                 </div>
               </div>`
               )
               .join("")}
           </div>`
        : ""
    }

    <div class="modal-actions">
      <button type="button" class="btn" id="btn-act-retrain">${weakest.label} 시나리오 다시 훈련하기</button>
    </div>`;

  const retrainCard = { sourceKey: weakest.key, category: null };
  document.getElementById("btn-act-retrain").addEventListener("click", () => startRun(retrainCard));
  body.querySelectorAll("[data-retrain-title]").forEach((btn) => {
    btn.addEventListener("click", () => startRun(retrainCard));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.appReady; // 클라우드에서 최신 데이터를 받아온 뒤에 화면을 그린다
  renderLayout("ai-scenario");
  goToStep(0);
});
