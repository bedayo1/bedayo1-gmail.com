/* scenario.html 전용 데이터 & 로직 */
/* AI챗봇의 시나리오 훈련과 같은 엔진(등록된 매뉴얼의 조치 순서를 객관식 문제로 자동 변환)을
   PDCA 4단계 화면(Plan 카테고리 선택 → Do 시나리오 풀이 → Check 즉시 채점 → Act 누적 데이터 기반 추천)으로 보여준다.
   자유 서술형 답변을 실제 AI가 채점하는 건 별도의 AI API·서버가 필요해 이번 버전에는 없다 — 대신
   지금 있는 데이터만으로 가능한 "정답/오답 자동 판정 + 누적 취약분야 추천"까지 구현했다. */

const SCENARIO_SOURCES = [
  { key: "emergencies", label: "이례상황", icon: "🚨", desc: "화재·탈선 등 이례상황 매뉴얼 기반", getSteps: (x) => x.procedureSteps || [] },
  {
    key: "malfunctions",
    label: "고장처치",
    icon: "🔧",
    desc: "차종별 고장처치 매뉴얼 기반",
    getSteps: (x) => (x.procedure || "").split("\n").map((s) => s.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean),
  },
];

const STEPS = [
  { key: "plan", label: "Plan", desc: "사고사례 선택" },
  { key: "do", label: "Do", desc: "학습 시나리오 생성" },
  { key: "check", label: "Check", desc: "즉각적 오류 진단" },
  { key: "act", label: "Act", desc: "오답 데이터 기반 추천" },
];

let currentStepIndex = 0;
let run = null; // { sourceKey, itemTitle, steps, stepIndex, wrongSteps: [] }

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickScenarioItem(sourceKey) {
  const src = SCENARIO_SOURCES.find((s) => s.key === sourceKey);
  const pool = loadData(sourceKey, [])
    .map((item) => ({ item, steps: src.getSteps(item) }))
    .filter((x) => x.steps.length >= 3);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickDecoySteps(sourceKey, excludeItemTitle, count) {
  const src = SCENARIO_SOURCES.find((s) => s.key === sourceKey);
  const allSteps = loadData(sourceKey, [])
    .filter((x) => (x.title || "") !== excludeItemTitle)
    .flatMap((x) => src.getSteps(x));
  return shuffleArray(allSteps).slice(0, count);
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

/* ---------- 렌더링 ---------- */

function renderStepper() {
  document.getElementById("pdca-stepper").innerHTML = STEPS.map(
    (s, i) => `
    <div class="pdca-step ${i === currentStepIndex ? "active" : ""} ${i < currentStepIndex ? "done" : ""}">
      <div class="pdca-step-circle">${i + 1}</div>
      <div class="pdca-step-label">${s.label}</div>
      <div class="pdca-step-desc">${s.desc}</div>
    </div>`
  ).join("");
}

function goToStep(i) {
  currentStepIndex = i;
  renderStepper();
  renderBody();
}

function renderBody() {
  const body = document.getElementById("pdca-body");
  const step = STEPS[currentStepIndex].key;

  if (step === "plan") {
    body.innerHTML = `
      <h3 class="pdca-body-title">사고사례 카테고리를 선택해주세요</h3>
      <div class="scenario-cat-grid">
        ${SCENARIO_SOURCES.map(
          (s) => `
          <button type="button" class="scenario-cat-card" data-key="${s.key}">
            <span class="scenario-cat-icon">${s.icon}</span>
            <span class="scenario-cat-label">${s.label}</span>
            <span class="scenario-cat-desc">${s.desc}</span>
          </button>`
        ).join("")}
      </div>`;
    body.querySelectorAll(".scenario-cat-card").forEach((btn) => {
      btn.addEventListener("click", () => startRun(btn.dataset.key));
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

function startRun(sourceKey) {
  const picked = pickScenarioItem(sourceKey);
  if (!picked) {
    showToast("등록된 매뉴얼이 부족해서 시나리오를 만들 수 없어요.");
    return;
  }
  run = { sourceKey, itemTitle: picked.item.title, steps: picked.steps, stepIndex: 0, wrongSteps: [], finished: false };
  goToStep(1); // Do
}

function renderRunStep(body) {
  const src = SCENARIO_SOURCES.find((s) => s.key === run.sourceKey);

  if (run.finished) {
    const total = run.steps.length;
    const wrongCount = run.wrongSteps.length;
    const correctCount = total - wrongCount;
    body.innerHTML = `
      <div class="scenario-run-card">
        <div class="scenario-run-badges"><span class="badge info">${src.icon} ${src.label}</span><span class="badge neutral">실전 시나리오</span></div>
        <h3 class="pdca-body-title">시나리오 종료 — "${run.itemTitle}"</h3>
        <div class="scenario-score">${correctCount} / ${total}단계 정답</div>
        ${
          wrongCount > 0
            ? `<div class="scenario-feedback-box">
                <div class="scenario-feedback-title">📋 오답 리포트</div>
                ${run.wrongSteps
                  .map((w) => `<div class="scenario-feedback-row">· ${w.stepIndex + 1}단계 — 선택: "${w.pickedText}" → 정답: "${w.correctText}"</div>`)
                  .join("")}
              </div>`
            : `<div class="scenario-feedback-box ok">👏 전 단계 정확히 수행하셨습니다!</div>`
        }
        <div class="modal-actions">
          <button type="button" class="btn secondary" id="btn-retry-plan">다른 시나리오 하기</button>
          <button type="button" class="btn" id="btn-go-act">Act 단계(추천) 보기</button>
        </div>
      </div>`;
    document.getElementById("btn-retry-plan").addEventListener("click", () => goToStep(0));
    document.getElementById("btn-go-act").addEventListener("click", () => goToStep(3));
    return;
  }

  const correctStep = run.steps[run.stepIndex];
  const decoys = pickDecoySteps(run.sourceKey, run.itemTitle, 2);
  const options = shuffleArray([correctStep, ...decoys]);

  body.innerHTML = `
    <div class="scenario-run-card">
      <div class="scenario-run-badges"><span class="badge info">${src.icon} ${src.label}</span><span class="badge neutral">실전 시나리오</span><span class="scenario-run-progress">${run.stepIndex + 1} / ${run.steps.length}</span></div>
      <h3 class="pdca-body-title">"${run.itemTitle}" 상황입니다</h3>
      <p class="scenario-run-question">다음으로 해야 할 조치는 무엇일까요?</p>
      <div class="scenario-choice-list">
        ${options.map((text, i) => `<button type="button" class="scenario-choice" data-i="${i}">${text}</button>`).join("")}
      </div>
      <div id="scenario-run-feedback"></div>
    </div>`;

  body.querySelectorAll(".scenario-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      body.querySelectorAll(".scenario-choice").forEach((b) => (b.disabled = true));
      const picked = options[Number(btn.dataset.i)];
      const correct = picked === correctStep;
      btn.classList.add(correct ? "scenario-choice-correct" : "scenario-choice-wrong");
      const feedback = document.getElementById("scenario-run-feedback");
      if (correct) {
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

function renderActStep(body) {
  const stats = getScenarioStats();
  const withData = stats.filter((s) => s.attemptCount > 0);

  if (withData.length === 0) {
    body.innerHTML = `<div class="empty-state">아직 완료한 시나리오가 없어요. Plan 단계에서 먼저 훈련을 시작해보세요.</div>`;
    return;
  }

  const weakest = [...withData].sort((a, b) => a.accuracy - b.accuracy)[0];
  const allStrong = weakest.accuracy >= 90;

  body.innerHTML = `
    <h3 class="pdca-body-title">나의 학습 분석 결과</h3>
    <div class="scenario-stat-grid">
      ${withData
        .map(
          (s) => `
        <div class="scenario-stat-card">
          <div class="scenario-stat-label">${s.icon} ${s.label} (${s.attemptCount}회 훈련)</div>
          <div class="scenario-stat-bar-track"><div class="scenario-stat-bar-fill" style="width:${s.accuracy}%"></div></div>
          <div class="scenario-stat-value">${s.accuracy}%</div>
        </div>`
        )
        .join("")}
    </div>
    <div class="scenario-feedback-box ${allStrong ? "ok" : ""}">
      ${
        allStrong
          ? `👏 지금까지 훈련한 영역 모두 정답률이 높아요. 다른 카테고리도 훈련해서 범위를 넓혀보세요.`
          : `💡 <strong>${weakest.label}</strong> 영역의 정답률이 가장 낮아요 (${weakest.accuracy}%). 이 카테고리로 시나리오를 더 훈련해보시는 걸 추천드립니다.`
      }
    </div>
    <div class="modal-actions">
      <button type="button" class="btn" id="btn-act-retrain">${weakest.label} 다시 훈련하기</button>
    </div>`;

  document.getElementById("btn-act-retrain").addEventListener("click", () => startRun(weakest.key));
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("ai-scenario");
  goToStep(0);
});
