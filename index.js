/* index.html 전용 데이터 & 로직 */

// 전역 변수 + localStorage 영속화 (규칙 2)
let notices = loadData("notices", [
  { id: uid(), text: "2026년 하반기 기관사 정기 안전교육 일정 안내", date: formatDate(new Date()) },
  { id: uid(), text: "철도안전법 개정사항 반영 교육자료 업데이트", date: formatDate(new Date()) },
]);
saveData("notices", notices); // 최초 로드시 시드 데이터를 즉시 영속화

// mypage.js 의 profile 을 "로그인한 사용자" 취급 — 이 앱엔 별도 로그인이 없으므로 마이페이지 프로필을 그대로 사용한다.
let profile = loadData("profile", {
  name: "김기관",
  empId: "22100119",
  role: "기관사",
  dept: "신답승무사업소",
  pw: "1234",
});

let attendances = loadData("attendances", []);

/* ---------- CRUD (공지) ---------- */

function getAllNotices() {
  return notices;
}

function addNotice(text) {
  notices.push({ id: uid(), text, date: formatDate(new Date()) });
  saveData("notices", notices);
  renderNoticeList();
}

function deleteNotice(id) {
  notices = notices.filter((n) => n.id !== id);
  saveData("notices", notices);
  renderNoticeList();
}

/* ---------- 렌더링 (공지 / 통계) ---------- */

function renderNoticeList() {
  const listEl = document.getElementById("notice-list");
  const countEl = document.getElementById("stat-notice-count");
  countEl.textContent = notices.length;

  if (notices.length === 0) {
    listEl.innerHTML = `<li class="empty-state" style="border:none;">등록된 공지가 없습니다.</li>`;
    return;
  }

  listEl.innerHTML = notices
    .map(
      (n) => `
      <li>
        <span><span class="notice-date">${n.date}</span>${n.text}</span>
        <button class="notice-del" data-id="${n.id}">삭제</button>
      </li>`
    )
    .join("");

  listEl.querySelectorAll(".notice-del").forEach((btn) => {
    btn.addEventListener("click", () => deleteNotice(btn.dataset.id));
  });
}

function renderCourseCount() {
  // course.js 가 localStorage 에 저장한 데이터를 홈 화면에서 읽어와 요약 표시
  const courses = loadData("courses", []);
  document.getElementById("stat-course-count").textContent = courses.length;
}

/* =========================================================
   출근 절차 마법사
   1. 출무시간  2. 승무적합성검사  3. 지시전달사항  4. 일일안전교육
   ========================================================= */

const WIZARD_STEP_LABELS = ["출무시간", "승무적합성검사", "지시전달사항", "일일안전교육"];

let wizardStep = 1;
let wizardData = null;

function currentTimeStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 새로고침(강제 새로고침 포함)할 때마다 출근을 처음부터 다시 진행해야 하므로,
// localStorage에 저장된 지난 출근 기록으로 "오늘 출근 완료" 상태를 판단하지 않는다.
// 완료 상태는 이번 페이지 세션 동안만 이 변수에 보관하고, 기록 자체는 attendances 에 계속 누적 저장한다.
let lastCompletedRecord = null;

function getTodayAttendance() {
  return lastCompletedRecord;
}

/* ---------- 출근 카드 ---------- */

function renderAttendanceCard() {
  const mount = document.getElementById("attendance-card");
  const record = getTodayAttendance();

  if (record) {
    mount.innerHTML = `
      <div class="attendance-info">
        <div class="attendance-title">${profile.name} 님, 오늘도 안전 운행하세요</div>
        <div class="attendance-desc">출무 ${record.dispatch.actualTime || "-"} · 오늘의 안전교육 점수 ${record.education.score}점 (${record.education.items.filter((i) => i.correct).length}/${record.education.items.length}문제 정답)</div>
      </div>
      <button type="button" class="attendance-done-badge" id="btn-attendance-detail">✅ 출근 완료 · 상세보기</button>
    `;
    document.getElementById("btn-attendance-detail").addEventListener("click", () => openAttendanceDetail(record));
    return;
  }

  mount.innerHTML = `
    <div class="attendance-info">
      <div class="attendance-title">${profile.name} 님, 출근 전입니다</div>
      <div class="attendance-desc">출무시간 · 승무적합성검사 · 지시전달사항 · 일일안전교육을 순서대로 마쳐야 출근이 처리됩니다.</div>
    </div>
    <button type="button" class="btn" id="btn-start-attendance">+ 출근하기</button>
  `;
  document.getElementById("btn-start-attendance").addEventListener("click", openWizard);
}

/* ---------- 일일안전교육: 고장처치/이례상황 매뉴얼에서 랜덤 3문항 객관식 생성 ---------- */

function truncateText(text, n) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n) + "…" : clean;
}

function shuffleArray(arr) {
  return [...arr]
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

function buildEducationPool() {
  const malfunctions = loadData("malfunctions", []).map((m) => ({
    type: "고장처치",
    title: m.title,
    answerText: m.procedure || m.symptom || "",
    questionText: `"${m.title}" 발생 시 올바른 조치요령은?`,
    raw: m,
  }));
  const emergencies = loadData("emergencies", []).map((e) => ({
    type: "이례상황",
    title: e.title,
    answerText: (e.procedureSteps && e.procedureSteps[0]) || e.condition || "",
    questionText: `"${e.title}" 상황에서 가장 먼저 취해야 할 조치는?`,
    raw: e,
  }));
  return [...malfunctions, ...emergencies].filter((x) => x.answerText);
}

function buildQuizQuestion(item, pool) {
  const correctText = truncateText(item.answerText, 42);
  const distractorTexts = [
    ...new Set(
      pool
        .filter((x) => x.title !== item.title)
        .map((x) => truncateText(x.answerText, 42))
        .filter((t) => t && t !== correctText)
    ),
  ];
  const distractors = shuffleArray(distractorTexts).slice(0, 3);

  const choiceTexts = shuffleArray([correctText, ...distractors]);
  const correctIndex = choiceTexts.indexOf(correctText);

  return {
    type: item.type,
    title: item.title,
    question: item.questionText,
    choices: choiceTexts,
    correctIndex,
    selectedIndex: null,
    raw: item.raw,
    manualOpen: false,
  };
}

function pickDailyEducationQuiz() {
  const pool = buildEducationPool();
  const picked = shuffleArray(pool).slice(0, 3);
  return picked.map((item) => buildQuizQuestion(item, pool));
}

/* ---------- 마법사 열기/닫기 ---------- */

function openWizard() {
  wizardStep = 1;
  wizardData = {
    formationNo: "",
    assignedTime: "",
    actualTime: currentTimeStr(),
    restHours: "11:00",
    drinking: "무",
    drinkingLevel: "0.000",
    drugUse: "무",
    mentalStatus: "이상없음",
    ackedNoticeIds: new Set(),
    quiz: null,
  };
  renderWizardSteps();
  renderWizardBody();
  document.getElementById("attendance-backdrop").classList.add("open");
}

function closeWizard() {
  document.getElementById("attendance-backdrop").classList.remove("open");
}

function confirmCloseWizard() {
  if (confirm("출근 절차를 종료할까요? 입력한 내용은 저장되지 않습니다.")) closeWizard();
}

/* ---------- 단계 이동 ---------- */

function getTodayUrgentNotices() {
  // "긴급 공지"는 최근 등록된 사고사례 1건을 노출한다.
  // 노출 기간/시간대 설정은 차후 관리자 페이지에서 구현 예정.
  const accidents = loadData("accidents", []);
  return [...accidents].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 1);
}

function canProceedCurrentStep() {
  if (wizardStep === 1) {
    return !!wizardData.actualTime; // 편성번호는 선택 입력 — 없어도 다음 단계로 진행 가능
  }
  if (wizardStep === 2) {
    if (!wizardData.restHours.trim()) return false;
    if (wizardData.drinking === "유") return false;
    if (parseFloat(wizardData.drinkingLevel || "0") >= 0.02) return false;
    if (wizardData.drugUse === "유") return false;
    if (wizardData.mentalStatus === "이상있음") return false;
    return true;
  }
  if (wizardStep === 3) {
    const urgent = getTodayUrgentNotices();
    return urgent.every((n) => wizardData.ackedNoticeIds.has(n.id));
  }
  if (wizardStep === 4) {
    return !!wizardData.quiz && wizardData.quiz.every((q) => q.selectedIndex !== null);
  }
  return true;
}

function updateWizardButtons() {
  const prevBtn = document.getElementById("btn-wizard-prev");
  const nextBtn = document.getElementById("btn-wizard-next");
  prevBtn.style.visibility = wizardStep === 1 ? "hidden" : "visible";
  nextBtn.textContent = wizardStep === 4 ? "출근 완료" : "다음";
  nextBtn.disabled = !canProceedCurrentStep();
}

function renderWizardSteps() {
  const mount = document.getElementById("wizard-steps");
  mount.innerHTML = WIZARD_STEP_LABELS.map((label, i) => {
    const n = i + 1;
    const cls = n < wizardStep ? "step done" : n === wizardStep ? "step active" : "step";
    const arrow = i > 0 ? `<span class="arrow">→</span>` : "";
    const dot = n < wizardStep ? "✓" : String(n);
    return `${arrow}<div class="${cls}"><span class="dot">${dot}</span>${label}</div>`;
  }).join("");
}

/* ---------- 단계별 화면 ---------- */

function renderStep1Html() {
  return `
    <div class="wizard-section">
      <div class="form-row"><label>사번</label><input type="text" value="${profile.empId}" disabled></div>
      <div class="form-row"><label>이름</label><input type="text" value="${profile.name}" disabled></div>
      <div class="form-row"><label>소속</label><input type="text" value="${profile.dept}" disabled></div>
      <div class="form-row"><label>편성번호 <span style="font-weight:400; color:var(--color-text-muted);">(선택)</span></label><input type="text" id="w-formation" placeholder="편성번호 입력 (예: 108.114)" value="${wizardData.formationNo}"></div>
      <div class="form-row"><label>지정출무시간</label><input type="time" id="w-assigned-time" value="${wizardData.assignedTime}"></div>
      <div class="form-row"><label>실제출무시간</label><input type="time" id="w-actual-time" value="${wizardData.actualTime}"></div>
    </div>
  `;
}

function renderStep2Html() {
  const disqualified = !canProceedCurrentStep() && (
    wizardData.drinking === "유" ||
    parseFloat(wizardData.drinkingLevel || "0") >= 0.02 ||
    wizardData.drugUse === "유" ||
    wizardData.mentalStatus === "이상있음"
  );
  return `
    <div class="wizard-section">
      <div class="form-row"><label>사번/성명</label><input type="text" value="${profile.empId} / ${profile.name}" disabled></div>
      <div class="form-row"><label>직급</label><input type="text" value="${profile.role}" disabled></div>
      <div class="form-row"><label>휴양시간</label><input type="text" id="w-rest" placeholder="예: 12:00 (직접 입력)" value="${wizardData.restHours}"></div>
      <div class="form-row">
        <label>음주유무</label>
        <div class="radio-row">
          <label><input type="radio" name="w-drinking" value="유" ${wizardData.drinking === "유" ? "checked" : ""}> 유</label>
          <label><input type="radio" name="w-drinking" value="무" ${wizardData.drinking === "무" ? "checked" : ""}> 무</label>
        </div>
      </div>
      <div class="form-row"><label>음주수치</label><input type="number" step="0.001" min="0" id="w-drinking-level" value="${wizardData.drinkingLevel}"></div>
      <div class="form-row">
        <label>약물복용</label>
        <div class="radio-row">
          <label><input type="radio" name="w-drug" value="유" ${wizardData.drugUse === "유" ? "checked" : ""}> 유</label>
          <label><input type="radio" name="w-drug" value="무" ${wizardData.drugUse === "무" ? "checked" : ""}> 무</label>
        </div>
      </div>
      <div class="form-row">
        <label>심신 이상여부</label>
        <div class="radio-row">
          <label><input type="radio" name="w-mental" value="이상있음" ${wizardData.mentalStatus === "이상있음" ? "checked" : ""}> 이상 있음</label>
          <label><input type="radio" name="w-mental" value="이상없음" ${wizardData.mentalStatus === "이상없음" ? "checked" : ""}> 이상 없음</label>
        </div>
      </div>
      <div class="wizard-alert ${disqualified ? "danger" : ""}" id="w-fitness-alert">
        ⚠ 음주수치 0.02% 이상 또는 심신 이상 시 즉시 직무배제 대상입니다.${disqualified ? " (현재 직무배제 대상 — 관리자에게 즉시 보고하세요.)" : ""}
      </div>
    </div>
  `;
}

function renderStep3Html() {
  const urgent = getTodayUrgentNotices();
  const ackedCount = urgent.filter((n) => wizardData.ackedNoticeIds.has(n.id)).length;

  const urgentHtml = urgent.length
    ? urgent
        .map(
          (n) => `
      <div class="notice-alert-card">
        <span class="badge danger">긴급 공지 · 사고사례</span>
        <div class="notice-alert-title">${n.title}</div>
        <div class="notice-alert-meta">${n.date}${n.line ? ` · ${n.line}` : ""}</div>
        <div class="notice-alert-footer">
          <span>${ackedCount}/${urgent.length} 확인</span>
          <button type="button" class="btn small ack-btn" data-id="${n.id}" ${wizardData.ackedNoticeIds.has(n.id) ? "disabled" : ""}>${wizardData.ackedNoticeIds.has(n.id) ? "확인됨" : "확인 완료"}</button>
        </div>
      </div>`
        )
        .join("")
    : `<div class="empty-state">등록된 긴급 공지가 없습니다.</div>`;

  const directives = loadData("adminNotices", []).filter((n) => n.type === "지시사항");
  const directiveHtml = directives.length
    ? directives
        .map(
          (n) => `
      <div class="notice-card-item">
        <div class="notice-card-title">${n.title}</div>
        <div class="notice-card-meta">${n.content || ""}</div>
      </div>`
        )
        .join("")
    : `<div class="empty-state">등록된 운전지시사항이 없습니다.</div>`;

  const dutyType = [0, 6].includes(new Date().getDay()) ? "휴일" : "평일";
  const diaPages = (window.DIA_DATA && window.DIA_DATA[profile.dept] && window.DIA_DATA[profile.dept][dutyType]) || [];
  const diaHtml = diaPages[0]
    ? `<div class="dia-scroll wizard-dia-embed">${diaPages[0]}</div>`
    : `<div class="empty-state">등록된 근무행로가 없습니다.</div>`;

  const teammates = loadData("employees", [])
    .filter((e) => e.dept === profile.dept && e.name !== profile.name)
    .slice(0, 8)
    .map((e) => e.name);

  return `
    <div class="wizard-section">
      <h4>긴급 공지</h4>
      ${urgentHtml}
    </div>
    <div class="wizard-section">
      <h4>운전지시사항</h4>
      ${directiveHtml}
    </div>
    <div class="wizard-section">
      <h4>근무행로 · 운행시각표 (오늘 · ${dutyType})</h4>
      ${diaHtml}
      ${teammates.length ? `<div class="wizard-team-list">오늘 함께 근무하는 팀원: ${teammates.join(", ")}</div>` : ""}
    </div>
  `;
}

function renderManualRefBody(q) {
  const r = q.raw || {};
  if (q.type === "고장처치") {
    return `
      ${r.vehicleType ? `<div><strong>차종</strong> ${r.vehicleType}</div>` : ""}
      ${r.symptom ? `<div><strong>현상</strong> ${r.symptom}</div>` : ""}
      ${r.cause ? `<div><strong>원인</strong> ${r.cause}</div>` : ""}
      ${r.procedure ? `<div><strong>조치요령</strong> ${r.procedure}</div>` : ""}
      ${r.notes ? `<div><strong>주의사항</strong> ${r.notes}</div>` : ""}
    `;
  }
  const steps = r.procedureSteps && r.procedureSteps.length ? r.procedureSteps.map((s, i) => `${i + 1}. ${s}`).join("<br>") : "";
  return `
    ${r.category ? `<div><strong>유형</strong> ${r.category}</div>` : ""}
    ${r.condition ? `<div><strong>상황</strong> ${r.condition}</div>` : ""}
    ${steps ? `<div><strong>조치 절차</strong><br>${steps}</div>` : ""}
    ${r.caution ? `<div><strong>주의사항</strong> ${r.caution}</div>` : ""}
  `;
}

function renderStep4Html() {
  if (!wizardData.quiz) {
    wizardData.quiz = pickDailyEducationQuiz();
  }
  const qs = wizardData.quiz;

  if (qs.length === 0) {
    return `<div class="empty-state">출제할 매뉴얼 데이터가 없습니다.</div>`;
  }

  return (
    `<div class="wizard-alert">📖 문제를 풀기 전에 "관련 매뉴얼 보기"로 해당 매뉴얼 원문을 먼저 확인할 수 있습니다.</div>` +
    qs
      .map(
        (q, qi) => `
    <div class="quiz-question-card">
      <div class="quiz-q-index">${q.type} · 문제 ${qi + 1} · ${q.title}</div>
      <button type="button" class="btn secondary small quiz-manual-toggle" data-qi="${qi}">${q.manualOpen ? "📖 매뉴얼 닫기" : "📖 관련 매뉴얼 보기"}</button>
      <div class="quiz-manual-ref" style="display:${q.manualOpen ? "block" : "none"}">${renderManualRefBody(q)}</div>
      <div class="quiz-q-text">${q.question}</div>
      <div class="quiz-choices">
        ${q.choices
          .map(
            (c, ci) => `
          <label class="quiz-choice ${q.selectedIndex === ci ? "selected" : ""}" data-qi="${qi}" data-ci="${ci}">
            <input type="radio" name="quiz-${qi}" ${q.selectedIndex === ci ? "checked" : ""} style="pointer-events:none;">
            <span>${c}</span>
          </label>`
          )
          .join("")}
      </div>
    </div>`
      )
      .join("")
  );
}

function wireStepEvents() {
  if (wizardStep === 1) {
    document.getElementById("w-formation").addEventListener("input", (e) => {
      wizardData.formationNo = e.target.value;
      updateWizardButtons();
    });
    document.getElementById("w-assigned-time").addEventListener("input", (e) => {
      wizardData.assignedTime = e.target.value;
    });
    document.getElementById("w-actual-time").addEventListener("input", (e) => {
      wizardData.actualTime = e.target.value;
      updateWizardButtons();
    });
  } else if (wizardStep === 2) {
    document.getElementById("w-rest").addEventListener("input", (e) => {
      wizardData.restHours = e.target.value;
      updateWizardButtons();
    });
    document.getElementById("w-drinking-level").addEventListener("input", (e) => {
      wizardData.drinkingLevel = e.target.value;
      renderWizardBody();
    });
    document.querySelectorAll('input[name="w-drinking"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        wizardData.drinking = e.target.value;
        renderWizardBody();
      });
    });
    document.querySelectorAll('input[name="w-drug"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        wizardData.drugUse = e.target.value;
        renderWizardBody();
      });
    });
    document.querySelectorAll('input[name="w-mental"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        wizardData.mentalStatus = e.target.value;
        renderWizardBody();
      });
    });
  } else if (wizardStep === 3) {
    document.querySelectorAll(".ack-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        wizardData.ackedNoticeIds.add(btn.dataset.id);
        renderWizardBody();
      });
    });
  } else if (wizardStep === 4) {
    document.querySelectorAll(".quiz-choice").forEach((label) => {
      label.addEventListener("click", () => {
        const qi = Number(label.dataset.qi);
        const ci = Number(label.dataset.ci);
        wizardData.quiz[qi].selectedIndex = ci;
        renderWizardBody();
      });
    });
    document.querySelectorAll(".quiz-manual-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qi = Number(btn.dataset.qi);
        wizardData.quiz[qi].manualOpen = !wizardData.quiz[qi].manualOpen;
        renderWizardBody();
      });
    });
  }
}

function renderWizardBody() {
  const mount = document.getElementById("wizard-body");
  if (wizardStep === 1) mount.innerHTML = renderStep1Html();
  else if (wizardStep === 2) mount.innerHTML = renderStep2Html();
  else if (wizardStep === 3) mount.innerHTML = renderStep3Html();
  else mount.innerHTML = renderStep4Html();
  wireStepEvents();
  updateWizardButtons();
}

function finishAttendance() {
  const correctCount = wizardData.quiz.filter((q) => q.selectedIndex === q.correctIndex).length;
  const score = wizardData.quiz.length ? Math.round((correctCount / wizardData.quiz.length) * 100) : 0;
  const today = formatDate(new Date());

  const record = {
    id: uid(),
    empId: profile.empId,
    name: profile.name,
    dept: profile.dept,
    date: today,
    dispatch: {
      formationNo: wizardData.formationNo,
      assignedTime: wizardData.assignedTime,
      actualTime: wizardData.actualTime,
    },
    fitness: {
      position: profile.role,
      restHours: wizardData.restHours,
      drinking: wizardData.drinking,
      drinkingLevel: wizardData.drinkingLevel,
      drugUse: wizardData.drugUse,
      mentalStatus: wizardData.mentalStatus,
    },
    notices: {
      urgent: getTodayUrgentNotices().map((n) => ({ id: n.id, title: n.title, date: n.date, line: n.line || "" })),
      ackedNoticeIds: [...wizardData.ackedNoticeIds],
      directives: loadData("adminNotices", [])
        .filter((n) => n.type === "지시사항")
        .map((n) => ({ title: n.title, content: n.content || "" })),
    },
    education: {
      dutyType: [0, 6].includes(new Date().getDay()) ? "휴일" : "평일",
      items: wizardData.quiz.map((q) => ({
        type: q.type,
        title: q.title,
        question: q.question,
        choices: q.choices,
        selectedIndex: q.selectedIndex,
        correctIndex: q.correctIndex,
        correct: q.selectedIndex === q.correctIndex,
      })),
      score,
    },
    completedAt: new Date().toISOString(),
  };

  attendances = attendances.filter((a) => !(a.empId === profile.empId && a.date === today));
  attendances.push(record);
  saveData("attendances", attendances);
  lastCompletedRecord = record;

  closeWizard();
  renderAttendanceCard();
  showToast(`출근이 완료되었습니다. 오늘의 안전교육 점수: ${score}점`);
}

/* ---------- 출근 상세보기 (완료된 출근 내용 읽기전용 확인) ---------- */

function renderAttendanceDetailHtml(record) {
  const d = record.dispatch;
  const f = record.fitness;
  const n = record.notices || { urgent: [], ackedNoticeIds: [], directives: [] };
  const edu = record.education;

  const urgentHtml = n.urgent.length
    ? n.urgent
        .map(
          (item) => `
      <div class="notice-alert-card">
        <span class="badge danger">긴급 공지 · 사고사례</span>
        <div class="notice-alert-title">${item.title}</div>
        <div class="notice-alert-meta">${item.date}${item.line ? ` · ${item.line}` : ""} · ${n.ackedNoticeIds.includes(item.id) ? "확인 완료" : "미확인"}</div>
      </div>`
        )
        .join("")
    : `<div class="empty-state">등록된 긴급 공지가 없었습니다.</div>`;

  const directiveHtml = n.directives.length
    ? n.directives
        .map((item) => `<div class="notice-card-item"><div class="notice-card-title">${item.title}</div><div class="notice-card-meta">${item.content}</div></div>`)
        .join("")
    : `<div class="empty-state">등록된 운전지시사항이 없었습니다.</div>`;

  const quizHtml = edu.items
    .map(
      (q, qi) => `
    <div class="quiz-question-card">
      <div class="quiz-q-index">${q.type} · 문제 ${qi + 1} · ${q.title} · ${q.correct ? "✅ 정답" : "❌ 오답"}</div>
      <div class="quiz-q-text">${q.question}</div>
      <div class="quiz-choices">
        ${(q.choices || [])
          .map((c, ci) => {
            let cls = "";
            if (ci === q.correctIndex) cls = "correct";
            else if (ci === q.selectedIndex) cls = "wrong";
            return `<div class="quiz-choice quiz-choice-readonly ${cls}">${ci === q.selectedIndex ? "☑" : "☐"} ${c}</div>`;
          })
          .join("")}
      </div>
    </div>`
    )
    .join("");

  return `
    <div class="wizard-section">
      <h4>1. 출무시간</h4>
      <div class="detail-kv"><span>편성번호</span><span>${d.formationNo || "-"}</span></div>
      <div class="detail-kv"><span>지정출무시간</span><span>${d.assignedTime || "-"}</span></div>
      <div class="detail-kv"><span>실제출무시간</span><span>${d.actualTime || "-"}</span></div>
    </div>
    <div class="wizard-section">
      <h4>2. 승무적합성검사</h4>
      <div class="detail-kv"><span>직급</span><span>${f.position}</span></div>
      <div class="detail-kv"><span>휴양시간</span><span>${f.restHours}</span></div>
      <div class="detail-kv"><span>음주유무 / 수치</span><span>${f.drinking} / ${f.drinkingLevel}</span></div>
      <div class="detail-kv"><span>약물복용</span><span>${f.drugUse}</span></div>
      <div class="detail-kv"><span>심신 이상여부</span><span>${f.mentalStatus}</span></div>
    </div>
    <div class="wizard-section">
      <h4>3. 지시전달사항</h4>
      ${urgentHtml}
      <h4 style="margin-top:12px;">운전지시사항</h4>
      ${directiveHtml}
    </div>
    <div class="wizard-section">
      <h4>4. 일일안전교육 — 오늘의 점수 ${edu.score}점</h4>
      ${quizHtml}
    </div>
  `;
}

function openAttendanceDetail(record) {
  document.getElementById("attendance-detail-body").innerHTML = renderAttendanceDetailHtml(record);
  document.getElementById("attendance-detail-backdrop").classList.add("open");
}

function closeAttendanceDetail() {
  document.getElementById("attendance-detail-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("home");
  renderNoticeList();
  renderCourseCount();
  renderAttendanceCard();

  document.getElementById("btn-add-notice").addEventListener("click", () => {
    const text = prompt("공지 내용을 입력하세요");
    if (text && text.trim()) addNotice(text.trim());
  });

  document.getElementById("btn-wizard-close").addEventListener("click", confirmCloseWizard);
  document.getElementById("attendance-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "attendance-backdrop") confirmCloseWizard();
  });

  document.getElementById("btn-attendance-detail-close").addEventListener("click", closeAttendanceDetail);
  document.getElementById("btn-attendance-detail-close2").addEventListener("click", closeAttendanceDetail);
  document.getElementById("attendance-detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "attendance-detail-backdrop") closeAttendanceDetail();
  });

  document.getElementById("btn-wizard-prev").addEventListener("click", () => {
    if (wizardStep > 1) {
      wizardStep--;
      renderWizardSteps();
      renderWizardBody();
    }
  });

  document.getElementById("btn-wizard-next").addEventListener("click", () => {
    if (!canProceedCurrentStep()) return;
    if (wizardStep < 4) {
      wizardStep++;
      renderWizardSteps();
      renderWizardBody();
    } else {
      finishAttendance();
    }
  });
});
