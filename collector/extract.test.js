// node --test collector
const test = require('node:test');
const assert = require('node:assert');
const { extractDeadline, classify, cleanTitle, htmlText, splitDrag } = require('../extension/extract.js');

const posted = new Date(2026, 8, 25);
const dl = (title, text = '', base = posted) => extractDeadline(title, text, base);

test('기획서 예시: 본문 신청기간 → 끝 날짜 + 시간', () => {
  assert.deepStrictEqual(dl('[필독] 2026-2 국가장학금 신청 안내', '…■ 신청기간 : 2026.09.01.(월) ~\n09.30.(화) 18:00 까지…'), { date: '2026-09-30', time: '18:00' });
  assert.deepStrictEqual(dl('졸업논문 제출 안내 (~10/10)', '문의: 학과사무실'), { date: '2026-10-10', time: null });
});

test('실제 학과 공지 제목(컴퓨터인공지능학부 305)', () => {
  assert.deepStrictEqual(dl("수요조사 안내(기간: '26.10.2.(금)~10.12.(월)정오까지 엄수)"), { date: '2026-10-12', time: '12:00' });
  assert.deepStrictEqual(dl("[★ 조기 졸업 신청 ★] 신청기간: '26.9.30.(월)~'26.10.7.(수) 18:00"), { date: '2026-10-07', time: '18:00' });
  assert.deepStrictEqual(dl('장학생 선발 안내(9.28(월) 17시까지 서류 제출자)'), { date: '2026-09-28', time: '17:00' });
  assert.deepStrictEqual(dl('단체응시 선착순 접수 안내(9.2.(수)오후  5시까지'), { date: '2026-09-02', time: '17:00' });
  assert.deepStrictEqual(dl('국가장학금 2차 신청 안내(8.12(수)09시~9.9.(수)18시)'), { date: '2026-09-09', time: '18:00' });
  assert.deepStrictEqual(dl('수강 취소 신청 기간 2026. 9. 21.( 월 ) 09:00 ~ 9. 28.( 월 ) 18:00 엄수'), { date: '2026-09-28', time: '18:00' });
});

test('연도 없는 날짜: 반년 넘게 지난 날짜만 내년으로', () => {
  assert.strictEqual(dl('', '접수 마감 1월 5일').date, '2027-01-05');
  assert.strictEqual(dl('출석인정신청 마감(6.19(금) 16시까지)', '', new Date(2026, 6, 20)).date, '2026-06-19');
});

test('전화번호·시간 단어는 날짜가 아님', () => {
  assert.strictEqual(dl('', '문의 : 042-821-1234'), null);
  assert.strictEqual(dl('', '상담 3.5시간 진행').time, null);
});

test('유형 판정', () => {
  assert.strictEqual(classify('2026-2 국가장학금 신청 안내'), 'deadline');
  assert.strictEqual(classify('중간 강의평가 실시 안내 (참여기간: ~10.28.)'), 'deadline');
  assert.strictEqual(classify('생성형 AI 특강 개최 안내'), 'event');
  assert.strictEqual(classify('학과 사무실 이전 안내'), 'info');
});

test('제목 정리', () => {
  assert.strictEqual(cleanTitle("[수강취소] 2026학년도 제2학기 수강 취소 신청 안내 (취소신청 기간 '26.9.21.(월)09:00~9.28.(월)18:00까지)"), '2026학년도 제2학기 수강 취소 신청');
  assert.strictEqual(cleanTitle("[★ 조기 졸업(2027년 2월 졸업) 신청 ★] 신청기간: '26.9.30.(월)~'26.10.7.(수) 18:00"), '조기 졸업(2027년 2월 졸업) 신청');
  assert.strictEqual(cleanTitle('2026년도 하반기 SW역량검정(TOPCIT)정기평가 접수 안내(9.2.(수)오후 5시까지'), '2026년도 하반기 SW역량검정(TOPCIT)정기평가 접수');
});

test('본문 HTML → 텍스트', () => {
  assert.strictEqual(htmlText('<p>가&nbsp;나</p><p>&rarr;다&#33;</p>').trim(), '가 나\n→다!');
});

test('드래그 덩어리 → 제목·마감·메모', () => {
  const r = splitDrag('2026 네이버 웨일 서포터즈 모집\n■ 모집기간 : 2026.09.01(월) ~ 09.30(화) 18:00\n■ 대상 : 대학생 및 휴학생\n■ 문의 : 042-821-1234', posted);
  assert.strictEqual(r.title, '2026 네이버 웨일 서포터즈 모집');
  assert.deepStrictEqual(r.deadline, { date: '2026-09-30', time: '18:00' });
  assert.strictEqual(r.memo, '대상 : 대학생 및 휴학생 · 문의 ***');
});
