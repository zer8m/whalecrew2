const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { parse } = require('./academic.js');
const { mergeSame } = require('./collect.js');

const html = fs.readFileSync(path.join(__dirname, 'fixtures', 'academic2026.html'), 'utf8');

test('학사일정 파싱: 전년 12월·해 넘김 기간·신청류 표시', () => {
  const x = parse(html, 2026);
  const by = (t) => x.find((i) => i.title === t);
  assert.deepStrictEqual(by('동기 계절학기 수강신청'), { id: '2026-11-05-동기 계절학기 수강신청', title: '동기 계절학기 수강신청', start: '2026-11-05', end: '2026-11-10', act: true });
  assert.strictEqual(x[0].start, '2025-12-22'); // 첫 상자는 전년 12월
  assert.ok(x.some((i) => i.start === '2026-12-21' && i.end === '2027-01-12')); // 해를 넘기는 기간
  assert.strictEqual(by('제2학기 개강일').act, false);
  assert.strictEqual(x.filter((i) => i.title === '수강신청 확인 및 변경' && i.start === '2026-03-03').length, 1); // 두 번 적힌 일정은 하나만
});

test('같은 공지가 여러 게시판에 있으면 대표 게시판 글 하나로 합친다', () => {
  const a = { id: '305-1', board: 305, title: '수강제한', date: '2026-08-04', time: null, url: 'computer' };
  const b = { id: '4645-2', board: 4645, title: '수강제한', date: '2026-08-04', time: null, url: 'ai' };
  const c = { id: '305-3', board: 305, title: '다른 공지', date: '2026-08-04', time: null };
  const out = mergeSame([a, b, c]);
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[0].url, 'computer');
  assert.strictEqual(out[0].also, 1);
});

test('학사일정 → 달력: 기간은 시작·마감 두 개, 신청류만 알림', async () => {
  const EXT = path.join(__dirname, '..', 'extension');
  const ctx = vm.createContext({ chrome: { storage: { local: {} }, runtime: { getURL: (p) => p } }, fetch: async (u) => ({ json: async () => JSON.parse(fs.readFileSync(path.join(EXT, u), 'utf8')) }) });
  vm.runInContext(fs.readFileSync(path.join(EXT, 'core.js'), 'utf8'), ctx);
  const C = ctx.Core;
  const S = await C.normalize({ depts: [], items: [], hidden: [], settings: {} });
  const notices = { _academic: { items: [
    { id: '2026-11-05-동기 계절학기 수강신청', title: '동기 계절학기 수강신청', start: '2026-11-05', end: '2026-11-10', act: true },
    { id: '2026-12-21-동기 계절학기', title: '동기 계절학기', start: '2026-12-21', end: '2027-01-12', act: false },
    { id: '2026-10-09-한글날', title: '한글날', start: '2026-10-09', end: null, act: false },
  ] } };
  const items = C.allItems(S, notices, []);
  const t = (s) => items.find((i) => i.title === s);
  assert.strictEqual(t('동기 계절학기 수강신청 시작').date, '2026-11-05');
  assert.strictEqual(t('동기 계절학기 수강신청 마감').kind, '마감');
  assert.strictEqual(C.remTimes(S, t('동기 계절학기 수강신청 시작')).length, 1); // 시작 하루 전
  assert.deepStrictEqual([...C.remTimes(S, t('동기 계절학기 수강신청 마감')).map((r) => r.label)], ['D-1']);
  assert.strictEqual(t('동기 계절학기 종료').kind, '종료'); // 신청류가 아니면 마감으로 치지 않음
  assert.strictEqual(C.remTimes(S, t('동기 계절학기 종료')).length, 0);
  assert.strictEqual(C.remTimes(S, t('한글날')).length, 0);
  // 설정에서 끄면 사라진다
  assert.strictEqual(C.allItems({ ...S, settings: { ...S.settings, academic: false } }, notices, []).length, 0);
});
