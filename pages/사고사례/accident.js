/* accident.html 전용 데이터 & 로직 */

// 사내 "운전정보" 발간물(2026-1~14호)을 원문 그대로 옮겨 등록한 사고사례 데이터.
// photos는 각 발간물 PDF에서 실제로 추출한 사진이다.
const ACCIDENT_SEED =[{"no":"2026-1","title":"4호선 길음역 하선 열차 차상신호장치 고장","line":"4호선","date":"2026-02-04","location":"4호선 길음역 하선","overview":"제4057열차(459편성)가 미아역 하선 초과정차(50cm), 정위치정차 수정 후 출발시 ADU에 순간 60km/h 현시 후 15km/h 현시되고 동력운전 시도 중 즉시 비상제동 체결. MC-key 취거 및 투입 후 동력운전 시도, 동일 현상발생으로 관제 보고, 관제 지시로 AFS 취급 후 미아사거리까지 영업운행, AFS복귀 및 ATCN1차단 복귀하였으나 동일 현상 15km/h 현시 다시 AFS취급 후 길음역 하선 도착하여 회송한 상황","cause":"승무원 응급조치 소홀\n- 열차 정위치정차 조정후 역전기 F(전진)위치 시 제동핸들 EB위치 미인식","countermeasures":"긴급 업무지시(SNS 활용) 및 사고사례 특별교육 실시\n이례상황 교육(신조전동차 응급조치 교육시행)\n정위치정차 조정후 주간제어기 EB위치 확인철저\n관제와 정확한 운전정보 교환철저","extra":"","diagram":"images/case1_3.jpg","photos":[{"file":"images/case1_1.jpg","caption":"TCMS 고장 화면"},{"file":"images/case1_2.jpg","caption":"ADU 15km/h현시"}]},{"no":"2026-2","title":"4호선 신길온천역 하선 정지신호 위반","line":"4호선","date":"2026-02-17","location":"4호선 신길온천역 하선 장내신호기(1A)","overview":"제4609열차(466편성)가 신길온천역 하선 진입시 하1폐색 신호기 주의신호를 보지못해 속도초과로 ATS 경보 동작, 기관사 비상제동 체결하였으나 장내신호기(1A)를 진과정차한 상황","cause":"신호 확인 소홀 (정지신호 위반)\n○ 기관사 전도주시 및 지적확인환호 소홀\n○ 기관사 전자기기 전원 OFF 미흡","countermeasures":"승무업무 중 전자기기 전원 OFF 철저\n직통운행구간(코레일 구간) 지도승무 강화 시행\n운전보안장치(DSD) 무력화 금지\n신호·진로 확인 철저\n전도주시 및 지적확인환호 철저\n운행 중 이례상황 발생 시 즉시 관제보고 및 관제무전 경청\n인적오류 근절을 위한 안전패트롤 현장활동 강화","extra":"","diagram":"images/case2_4.jpg","photos":[{"file":"images/case2_1.jpg","caption":"제4609열차 정지신호 위반"},{"file":"images/case2_2.jpg","caption":"안산~신길온천 1폐색 신호기"},{"file":"images/case2_3.jpg","caption":"신길온천역 1A 장내신호기"}]},{"no":"2026-3","title":"5호선 방화차량기지 유치선 입환 중 궤도 이탈","line":"5호선","date":"2026-04-15","location":"5호선 방화차량기지 S11번 유치선","overview":"5호선 방화차량기지 검사고(D4번)에서 유치선(S11번)으로 입환하던 538편성이 유치선(S11번) 탈선방지 가드레일 부근에서 6호차 1대차 탈선 이후 약 50m 진행","cause":"규정속도 위반 (20km/h 제한구간 초과 운전)\n타오름에 의한 궤도이탈 추정 (세부원인 조사 중)","countermeasures":"사고사례 특별 교육 실시\n신호·진로 확인, 전도 주시 및 지적확인환호 철저 교육 실시\n운행 중 이례상황 발생 시 즉시 관제보고 및 관제 무전 경청\n기지구내 제한속도 구간 준수 교육 실시\n운행기록부 분석 시 제한속도 구간 분석 철저","extra":"","diagram":"images/case3_3.jpg","photos":[{"file":"images/case3_2.jpg","caption":"S11번 제한 20km/h 표지"},{"file":"images/case3_1.jpg","caption":"궤도이탈"}]},{"no":"2026-4","title":"7호선 어린이대공원역 하선 제동풀림 안됨","line":"7호선","date":"2026-04-21","location":"7호선 어린이대공원역 하선","overview":"제7607열차(749편성) 1칸(7249호) \"제동 풀림 안됨\" 고장 발생으로 어린이대공원역 승객 하차, 청담역 유치 후 천왕기지 입고","cause":"1차: 7249호 제동제어장치(ECU) 불량\n2차: 출고 중 \"제동풀림 안됨\" 고장 발생(17회) 보고 미흡","countermeasures":"사고사례 특별 교육 실시\n출고 점검 철저 → 이례상황 발생 시 즉시 관제보고\n출고 차량 고장 발생 시 차량 교환 후 출고(고장차 출고 절대 금지)\n고장소멸 여부 임의판단 금지","extra":"","diagram":"images/case4_3.jpg","photos":[{"file":"images/case4_1.jpg","caption":"제동풀림안됨 고장 기록"},{"file":"images/case4_2.jpg","caption":"고장검지 List"}]},{"no":"2026-5","title":"5호선 장한평역 하선 반대편 출입문 개방","line":"5호선","date":"2026-04-24","location":"5호선 장한평역 하선","overview":"제5655열차 564편성 장한평역 도착, 출입문 자동 열림 → 승객 취급 → 출입문 폐문 후, 잔여 승객 승차를 위해 출입문 재취급(운전모드 수동, 출입문모드 수/수 전환) 시 반대편 출입문을 개방하여 민원 발생","cause":"출입문 수동 취급 시 반대쪽 출입문 스위치 취급\n승강장 방향 확인 소홀","countermeasures":"긴급 업무지시(SNS 활용) 및 사고사례 특별교육 실시\n안전패트롤 1단계 주의 발령(\u002726.4.24.~5.7.) / 2주간\n승무원 기본업무 교육 철저(지적확인환호 절대준수사항 등)\n출입문 수동 취급은 열림 방향 측창문 개방 후 실시 (기립 → 측창문 개방·승강장 방향 지적확인환호 → 측면 스위치 열림 취급 → 승하차 확인 → 측면 스위치 닫힘 취급)\n중앙 제어대 출입문 열림 스위치 취급 금지\n특이사항 없을 시 출입문 재취급 금지","extra":"최근 5년 반대편 출입문 개방 발생 현황\n\u002722.6.23.(목) 3호선(수서)\n\u002724.5.4.(토) 2호선(신정)\n\u002725.3.6.(목) 3호선(지축)\n\u002725.8.5.(화) 6호선(신내)\n\u002725.10.13.(월) 5호선(답십리)\n\u002726.4.24.(금) 5호선(답십리)","photos":[{"file":"images/case5_1.jpg","caption":"반대편 출입문 열림"}]},{"no":"2026-6","title":"5호선 명일역 하선 반대편 출입문 개방","line":"5호선","date":"2026-04-29","location":"5호선 명일역 하선","overview":"5호선 하남검단산행 제5087열차 517편성 명일역 도착 시 출입문 취급 후 반대편 출입문 재개방(약 11초). 반대편 출입문이 열렸다는 고객센터 민원 접수","cause":"출입문 수동 취급 시 반대쪽 출입문 스위치 취급\n승강장 방향 확인 소홀","countermeasures":"긴급 업무지시(SNS 활용) 및 사고사례 특별교육 실시\n안전패트롤 2단계 경보 발령(\u002726.4.29.~5.12.) / 2주간\n승무원 기본업무 교육 철저(지적확인환호 절대준수 등)\n출입문 수동 취급은 열림 방향 측창문 개방 후 실시\n출입문 재취급 시 반드시 승강장 방향 지적확인환호 후 취급\n중앙 제어대 출입문 열림 스위치 취급 금지\n특이사항 없을 시 출입문 재취급 절대 금지","extra":"최근 5년 반대편 출입문 개방 발생 현황\n\u002722.6.23.(목) 3호선(수서)\n\u002724.5.4.(토) 2호선(신정)\n\u002725.3.6.(목) 3호선(지축)\n\u002725.8.5.(화) 6호선(신내)\n\u002725.10.13.(월) 5호선(답십리)\n\u002726.4.24.(금) 5호선(답십리)\n\u002726.4.29.(수) 5호선(영등포)","photos":[]},{"no":"2026-7","title":"7호선 군자역 하선 미달정차 후 후속조치 미흡","line":"7호선","date":"2026-05-14","location":"7호선 군자역 하선 승강장","overview":"제 7125열차 772편성 군자역 하선 3m 미달정차, 수동운전모드로 전환 후 정위치조정(750mm미달), 출입문 및 승강장안전문 수동 취급, 1-1 승강장안전문 조기 닫힘으로 분승 안내방송 시행하였으나 1-1지점 하차하지 못한 승객이 민원 제기","cause":"1차: 자동운전 중 미달정차(약3m)\n2차: 정위치 정차 운전 미흡(2회), 관제미보고 임의조치","countermeasures":"승무원 기본업무 교욱철저(지적확인환호 절대준수사항 등)\n이례상황 발생 시 즉시 관제보고\n열차출입문 열기전 정지위치 합치여부 확인\n정위치 조정시 정위치범위 확인 후 출입문개방 (정위치정차 유도안내표시등(전광판) 양호 상태 반드시 확인)\n동일장애유발(무코드,초과정차,미달정차,승강장안전문 오류 등) 특정편성 및 개소 관리 철저 (업무메뉴얼 승무원 교육실시)","extra":"","diagram":"images/case7_5.jpg","photos":[{"file":"images/case7_4.jpg","caption":"09:22 열차 3m 미달 정차"},{"file":"images/case7_3.jpg","caption":"09:23 750mm 미달 정차"},{"file":"images/case7_2.jpg","caption":"09:24 승강장안전문 수동 개방"},{"file":"images/case7_1.jpg","caption":"승강장안전문 1-1 6초만에 닫힘"}]},{"no":"2026-8","title":"5호선 강동역 마천행 열차 행선지 육성안내방송 오방송","line":"5호선","date":"2026-06-02","location":"5호선 강동역 하선","overview":"마천행 제5607열차(522편성)가 강동역 하선 승강장에 도착 후, 승무원이 행선지 육성안내방송을 잘못 시행(하남검단산행 오방송), 일부 고객 오인 하차 및 민원 제기 (문자 민원 4건)","cause":"행선지 착각에 의한 오방송 시행\n- 마천행 열차였으나, 하남검단산행 오방송 시행","countermeasures":"출무보고 시 행선지 상호 확인 철저 (전 소속 출무보고 강화)\n행선안내 육성 방송 전 행선지 확인 후 방송 실시\n열차 시각표 시인성 강화 실시\n긴급 업무지시(SNS 활용) 및 사고사례 특별교육 실시","extra":"민원 내용: \"지하철안에도 마천행이라고 표기되어있고, 승강장에도 마천행이라고 표기되어있었는데, 방송에서 기관사분이 하남행이라고 말씀하셔서 다들 놀래서 내렸습니다.\"","photos":[{"file":"images/case8_1.jpg","caption":"시각표 시인성 강화 예시"}]},{"no":"2026-9","title":"4호선 신용산역 하선 승강장안전문 일부 안열림","line":"4호선","date":"2026-06-02","location":"4호선 신용산역 하선 승강장","overview":"사당행 제4185열차(411편성)가 신용산역 하선 승강장에 도착후, 열차 출입문은 열렸으나 승강장안전문 일부(11개 추정)가 열리지 않아 내리지 못한 승객이 고객안전실로 민원제기(1건)한 상황임","cause":"1차: 일시적인 승강장안전문 오류(추정)\n2차: 승무원 기본업무 소홀\n- HMI를 통한 PSD 상태 및 CCTV를 통한 승객 승·하차 확인 소홀\n- 형식적인 지적확인환호 시행","countermeasures":"승무원 기본업무 교육철저(지적확인환호 절대준수사항 등)\n- HMI 및 CCTV를 통한 승객 승·하차 상태 확인 철저\n승강장안전문 및 출입문 전체 개방 확인 후 지적확인환호 실시\n- 형식적인 지적확인환호 절대금지","extra":"","photos":[{"file":"images/case9_2.jpg","caption":"일부 안열림"},{"file":"images/case9_1.jpg","caption":"2-4 승객 수동개방"}]},{"no":"2026-10","title":"3호선 압구정역 하선 첫 열차 지연출발","line":"3호선","date":"2026-06-13","location":"3호선 압구정역 하선","overview":"제3001열차 312편성 압구정역 하선 첫 열차인 야간유치열차 승무원 지연출장으로 05:44경에 출발하여 약 14분 지연 출발","cause":"기본업무 및 출무 점호 확인 소홀","countermeasures":"승무원 기본업무 교육 철저\n사업소별 야간유치열차 업무 프로세스 교육\n사업소별 야간유치열차 침실 포스터 제작하여 부착\n야간유치열차 운용절차서 교육\n26년 인턴직원 특별교육 실시(수서승무사업소)\n업무경력 25년 이상직원 특별면담 실시(수서승무사업소)\n출무 보고 확인 철저 (중간출장기록부 실제 출장시간 기재)","extra":"야간유치(주박) 열차 업무시작 전 준수사항\n[운용부장] 승무원 1시간 5분전 기상 통보(5~8호선: 1시간전) / 야간유치 열차 승무원 음주측정 확인 / 승무원 숙소 출발 수보 후 중간출장기록부 \u0027실제 출장시간\u0027 기록\n[승무원] 기상 후 음주측정실시(취침전 승무원 각각 기상시간 알람 설정) / 숙소 출발전 운용부장 이상유무 보고 / 열차 도착후 관제로부터 급전상태 확인 후 출고점검 시행","diagram":"images/case10_1.jpg","photos":[]},{"no":"2026-11","title":"8호선 모란차량기지 특수차 선로전환기(110A) 훼손","line":"8호선","date":"2026-06-27","location":"8호선 모란차량기지 임시검사고선 (110A 선로전환기)","overview":"모란차량기지 차량정리(입환)중 #825(임시검사고)를 #824(시험선)로 착각하여 #824(시험선) 진행신호 제어 후 #825(임시검사고)에 차량정리(입환)통보하여 특수차 #825(임시검사고)가 신호 정지상태에서 이동하여 선로전환기(110A)를 훼손함","cause":"1차 원인: 기지관제원 신호 오취급\n2차 원인: 운전원 및 선탑자 신호·진로 미확인","countermeasures":"긴급 업무지시(SNS 활용) 및 사고사례 특별교육 실시\n전소속 기지관제원 특별면담 실시\n운전취급절차서에 따른 복명복창 및 차량정리(입환) 작업 준수 재강조 (승무지원처-4232, 2026.6.16.)\n안전패트롤 1단계 발령(\u002726.6.27.~7.10., 2주간)","extra":"","diagram":"images/case11_3.jpg","photos":[{"file":"images/case11_2.jpg","caption":"110A 선로전환기 불일치 발생"},{"file":"images/case11_1.jpg","caption":"110A 선로전환기 파손 모습"}]},{"no":"2026-12","title":"8호선 산성역 하선 출입문 미취급","line":"8호선","date":"2026-07-14","location":"8호선 산성역 하선","overview":"제8273열차(827편성, 운전실 0호차)가 우천으로 수동운전(복정~남위례~산성역 간) 시행 관제보고 후 운전모드 수동, 출입문 자/수로 복정역 출발, 남위례역 정상취급 후 산성역 도착하였으나, 출입문 미취급(승강장안전문 정상개방)으로 민원 발생","cause":"1차 원인: 출입문 열림 확인 소홀(기본업무 소홀)\n2차 원인: 주간제어기 B7 상태 확인 소홀","countermeasures":"긴급 업무지시(SNS 활용) 및 사고사례 특별교육 실시\n승무원 기본업무 교육 철저(지적확인환호 절대준수사항 등)\nATO 자동운전구간 임의로 수동운전 절대금지\n전동차별 기기위치 및 취급방법 교육\n출퇴근 시간대 지도승무 강화(잠실승무사업소)\n안전패트롤 1단계 발령(\u002726.7.14.~7.27., 2주간)","extra":"최근 신조차 기기 오/미취급 사례\n2024: 0호선 00역 제동풀림 불가 - B7 확인제동 미취급\n2025: 0호선 000역 하선 역행불능 - EO모드 미취급\n2025: 0호선 00역 회차선 마스콘키 오취급 - 마스콘키 \u0027검수모드\u0027 위치\n2026: 0호선 000역 하선 비상제동 체결 - EB 확인제동 미취급\n2026.07.14.: 8호선 산성역 하선 출입문 미취급 - B7 확인제동 미취급","photos":[{"file":"images/case12_2.jpg","caption":"지적확인환호"},{"file":"images/case12_1.jpg","caption":"전동차별 기기위치 교안"}]},{"no":"2026-13","title":"2호선 영등포구청역 내선 승강장안전문 미개방","line":"2호선","date":"2026-07-24","location":"2호선 영등포구청역 내선","overview":"제2476열차(270편성) 영등포구청역 내선(시청방면) 도착 후 출입문은 개방하였으나 승강장안전문 전체가 열리지 않아 일부 승객이 수동으로 승강장안전문을 개방(4개)하여 승·하차하였고 그외 승·하차하지 못한 승객이 민원을 제기함","cause":"1차 원인: 차상PSD조작반 시스템 오류\n2차 원인: 승무원 기본업무 소홀\n- 지적확인환호 소홀\n- CCTV를 통한 승객 승·하차 확인 소홀(HMI로 승강장안전문 열림상태 미확인)","countermeasures":"사고사례 특별교육 실시\n승무원 기본업무 교육 철저(지적확인환호 절대준수사항 등)\n- HMI확인철저(승강장안전문 전체열림확인) 및 CCTV를 통한 승객 승·하차 상태 확인 철저\n출고점검 시 차상PSD조작반 내,외선 선택스위치 상태 관제보고 철저(2호선)\n운전실 변경시 차상PSD조작반 내,외선 상태 승무원 상호확인(2호선)\n안전패트롤 2단계 발령(\u002726.7.24.~8.6., 2주간)\n2인 승무원(기관사⇔차장)간 상호 확인 철저 (출입문/PSD 전체열림시: 기관사→차장 단1 부져전호, 차장→기관사 단2 부져전호, 승무지원처-1999)\n향후 인적오류로 인한 사고·장애유발시 관리자 연대 엄중문책 및 전보조치 검토","extra":"","photos":[{"file":"images/case13_5.jpg","caption":"출입문/PSD 차내 부져 관련"},{"file":"images/case13_1.jpg","caption":"차상 PSD 조작반"}]},{"no":"2026-14","title":"2호선 건대입구역 외선 승강장안전문 일부 미개방","line":"2호선","date":"2026-08-03","location":"2호선 건대입구역 외선","overview":"건대입구역 외선 PSD 8-3 장애로 관계 직원이 점검 중, 제2357열차(287편성, 다원)가 건대입구역 외선 도착 후 출입문을 개방하였으나 PSD 일부가 열리지 않음. 현장작업자 수신호 확인 후 출발하였으나, 승·하차 하지 못한 승객이 고객센터로 민원 제기","cause":"(1차 원인) PSD 장애\n(2차 원인) 승무원 기본업무 소홀\n- PSD 미개방 사실 인지하였으나, 관제보고 및 PSD 수동취급 등 후속조치 미흡\n- CCTV를 통한 승객 승·하차 확인 소홀","countermeasures":"사고사례 특별교육 실시\n이례상황 발생시 관제 보고 철저\n승무원 기본업무 교육 철저(지적확인환호 절대준수사항 등)\n- HMI확인철저 (PSD 전체열림확인) 및 CCTV를 통한 승객 승·하차 상태 확인 철저\n승강장안전문 일부 미개방시 후속조치 절차 강화 (관제보고 → 안내방송 → 수동개방, 필요시 인접출입문 이용)\n지도승무 시 PSD 전체 열림 확인 여부 집중 확인 및 미흡 시 교정 시행","extra":"","photos":[{"file":"images/case14_2.jpg","caption":"열차 운행기록부 - PSD 미개방"},{"file":"images/case14_1.jpg","caption":"HMI 및 CCTV 화면 구성"}]}]
;

let accidents = loadData(
  "accidents",
  ACCIDENT_SEED.map((a) => ({ id: uid(), ...a }))
);
saveData("accidents", accidents);

/* ---------- CRUD ---------- */

function getAllAccidents() {
  return accidents;
}

function getAccident(id) {
  return accidents.find((a) => a.id === id);
}

function addAccident(data) {
  accidents.push({ id: uid(), ...data });
  saveData("accidents", accidents);
  renderAccidentList();
}

function updateAccident(id, data) {
  accidents = accidents.map((a) => (a.id === id ? { ...a, ...data } : a));
  saveData("accidents", accidents);
  renderAccidentList();
}

function deleteAccident(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  accidents = accidents.filter((a) => a.id !== id);
  saveData("accidents", accidents);
  renderAccidentList();
}

/* ---------- 렌더링 (목록) ---------- */

function renderAccidentList() {
  const tbody = document.getElementById("accident-tbody");
  const sorted = [...accidents].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">등록된 사고사례가 없습니다.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = sorted
    .map(
      (a) => `
      <tr>
        <td>${a.no || ""}</td>
        <td class="title-cell"><a data-action="detail" data-id="${a.id}">${a.title}</a></td>
        <td><span class="badge info">${a.line}</span></td>
        <td>${a.date}</td>
        <td class="actions">
          <button class="btn secondary small" data-action="edit" data-id="${a.id}">수정</button>
          <button class="btn danger small" data-action="delete" data-id="${a.id}">삭제</button>
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
    btn.addEventListener("click", () => deleteAccident(btn.dataset.id));
  });
}

/* ---------- 상세 화면: 운전정보 발간물 원본을 흉내낸 레이아웃 ---------- */

function renderBulletinSection(label, value) {
  if (!value) return "";
  return `
    <div class="detail-section">
      <h4>${label}</h4>
      <p>${value}</p>
    </div>`;
}

function openDetail(id) {
  const item = getAccident(id);
  if (!item) return;

  const photos = item.photos || [];
  const gallery = photos
    .map(
      (p) => `
      <div class="bulletin-photo-item">
        <a href="${p.file}" target="_blank"><img src="${p.file}" alt="${p.caption || "관련사진"}"></a>
        ${p.caption ? `<span class="caption">[${p.caption}]</span>` : ""}
      </div>`
    )
    .join("");

  const diagram = item.diagram
    ? `<div class="bulletin-diagram"><img src="${item.diagram}" alt="상황도"></div>`
    : "";

  document.getElementById("detail-body").innerHTML = `
    <div class="bulletin-header">
      <span class="bulletin-tag">운전정보</span>
      <h2>${item.title}</h2>
      <span class="bulletin-no">${item.no || ""}</span>
    </div>
    <div class="bulletin-body">
      <div class="bulletin-main">
        ${renderBulletinSection("장애(발생)개요", item.overview)}
        ${diagram}
        ${renderBulletinSection("원 인", item.cause)}
        ${renderBulletinSection("재발방지 대책", item.countermeasures)}
        ${renderBulletinSection("참고", item.extra)}
      </div>
      <div class="bulletin-side">
        <div class="side-block">
          <h4>1. 일 시</h4>
          <div>${item.date}</div>
        </div>
        <div class="side-block">
          <h4>2. 장 소</h4>
          <div>${item.location || item.line}</div>
        </div>
        ${
          gallery
            ? `<div class="side-block"><h4>3. 관련 사진</h4><div class="bulletin-photo-gallery">${gallery}</div></div>`
            : ""
        }
      </div>
    </div>
  `;
  document.getElementById("detail-backdrop").classList.add("open");
}

function closeDetail() {
  document.getElementById("detail-backdrop").classList.remove("open");
}

/* ---------- 모달 (등록/수정 공용 폼) ---------- */
/* 관련사진 입력: 사진을 끌어다 놓으면 그 자리에 삽입되고, 바로 밑에 설명을 적을 수 있다. */

function insertPhotoBlock(dataUrl, captionText) {
  const editor = document.getElementById("photo-editor");

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

function handlePhotoFiles(fileList) {
  Array.from(fileList || []).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => insertPhotoBlock(reader.result, "");
    reader.readAsDataURL(file);
  });
}

function populatePhotoEditor(photos) {
  const editor = document.getElementById("photo-editor");
  editor.innerHTML = "";
  (photos || []).forEach((p) => insertPhotoBlock(p.file, p.caption || ""));
  editor.blur();
}

function collectPhotosFromEditor() {
  const editor = document.getElementById("photo-editor");
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

function openModal(id) {
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const item = id ? getAccident(id) : null;

  document.getElementById("f-id").value = id || "";
  document.getElementById("f-no").value = item ? item.no || "" : "";
  document.getElementById("f-title").value = item ? item.title : "";
  document.getElementById("f-line").value = item ? item.line : "";
  document.getElementById("f-date").value = item ? item.date : "";
  document.getElementById("f-location").value = item ? item.location || "" : "";
  document.getElementById("f-overview").value = item ? item.overview || "" : "";
  document.getElementById("f-cause").value = item ? item.cause || "" : "";
  document.getElementById("f-countermeasures").value = item ? item.countermeasures || "" : "";
  document.getElementById("f-extra").value = item ? item.extra || "" : "";
  document.getElementById("f-photo-picker").value = "";
  populatePhotoEditor(item ? item.photos : []);
  title.textContent = item ? "사고사례 수정" : "사고사례 추가";

  backdrop.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

/* ---------- 초기화 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout("accident");
  renderAccidentList();

  document.getElementById("btn-new").addEventListener("click", () => openModal(null));
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("btn-detail-close").addEventListener("click", closeDetail);
  document.getElementById("detail-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "detail-backdrop") closeDetail();
  });

  const photoEditor = document.getElementById("photo-editor");

  document.getElementById("btn-add-photo").addEventListener("click", () => {
    document.getElementById("f-photo-picker").click();
  });

  document.getElementById("f-photo-picker").addEventListener("change", (e) => {
    handlePhotoFiles(e.target.files);
    e.target.value = "";
  });

  photoEditor.addEventListener("dragover", (e) => {
    e.preventDefault();
    photoEditor.classList.add("dragover");
  });
  photoEditor.addEventListener("dragleave", () => {
    photoEditor.classList.remove("dragover");
  });
  photoEditor.addEventListener("drop", (e) => {
    e.preventDefault();
    photoEditor.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      handlePhotoFiles(e.dataTransfer.files);
    }
  });
  photoEditor.addEventListener("paste", (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((it) => it.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    e.preventDefault();
    handlePhotoFiles(imageItems.map((it) => it.getAsFile()));
  });

  document.getElementById("accident-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("f-id").value;
    const data = {
      no: document.getElementById("f-no").value.trim(),
      title: document.getElementById("f-title").value.trim(),
      line: document.getElementById("f-line").value.trim(),
      date: document.getElementById("f-date").value,
      location: document.getElementById("f-location").value.trim(),
      overview: document.getElementById("f-overview").value.trim(),
      cause: document.getElementById("f-cause").value.trim(),
      countermeasures: document.getElementById("f-countermeasures").value.trim(),
      extra: document.getElementById("f-extra").value.trim(),
      photos: collectPhotosFromEditor(),
    };

    if (id) {
      updateAccident(id, data);
      showToast("사고사례가 수정되었습니다.");
    } else {
      addAccident(data);
      showToast("사고사례가 추가되었습니다.");
    }
    closeModal();
  });
});
