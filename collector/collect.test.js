const test = require('node:test');
const assert = require('node:assert');
const { toItems } = require('./collect.js');
const fixture = require('./fixtures/board305.json');

const board = { no: 305, name: '공지사항 > 학사공지', url: 'https://computer.cnu.ac.kr/computer/notice/bachelor.do' };

test('API 응답 → 달력 일정: 정보형은 빼고 마감일·원문 링크를 만든다', () => {
  const items = toItems(fixture.RESULT, board);
  assert.deepStrictEqual(items.map((i) => i.id), ['305-599952', '305-599701', '305-598716']);
  const [a] = items;
  assert.strictEqual(a.title, '2026학년도 동기 계절학기 개설 교양 및 전공 개설과목 수요조사');
  assert.strictEqual(a.date, '2026-10-12');
  assert.strictEqual(a.time, '12:00');
  assert.strictEqual(a.url, 'https://computer.cnu.ac.kr/computer/notice/bachelor.do?mode=view&articleNo=599952');
  assert.strictEqual(a.tag, '학사공지');
  assert.ok(!('article_text' in a), '본문은 저장하지 않는다');
});

test('게시판 URL을 모르면 원문 링크는 null', () => {
  assert.strictEqual(toItems(fixture.RESULT, { ...board, url: null })[0].url, null);
});

test('update_dt가 빠진 글이 섞여도 게시판 전체가 실패하지 않는다', () => {
  const rows = [...fixture.RESULT, { ...fixture.RESULT[0], article_no: 1, update_dt: null }];
  assert.doesNotThrow(() => toItems(rows, board));
});
