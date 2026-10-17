// 확장앱 백그라운드 알림 로직을 가짜 chrome API로 검증한다
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const EXT = path.join(__dirname, '..', 'extension');

function boot(mem) {
  const listeners = {};
  const ev = (name) => ({ addListener: (f) => (listeners[name] = f) });
  const notes = [], alarms = {};
  const chrome = {
    storage: { onChanged: ev('changed'), local: {
      get: async (k) => { const o = {}; for (const x of [].concat(k)) if (x in mem) o[x] = structuredClone(mem[x]); return o; },
      set: async (o) => { for (const k in o) mem[k] = structuredClone(o[k]); },
    } },
    runtime: { getURL: (p) => p, onInstalled: ev('installed'), onStartup: ev('startup'), onMessage: ev('message') },
    alarms: { create: (n, o) => (alarms[n] = o), clear: (n) => delete alarms[n], onAlarm: ev('alarm') },
    notifications: { create: (id, o) => notes.push({ id, ...o }), clear() {}, onClicked: ev('nclick'), onButtonClicked: ev('nbutton') },
    tabs: { create() {} },
  };
  const ctx = vm.createContext({
    chrome, console, structuredClone, setTimeout, URLSearchParams,
    fetch: async (u) => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(EXT, u), 'utf8')) }),
  });
  ctx.self = ctx;
  ctx.importScripts = (f) => vm.runInContext(fs.readFileSync(path.join(EXT, f), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(EXT, 'background.js'), 'utf8'), ctx);
  return { tick: () => listeners.alarm({ name: 'tick' }), notes, alarms };
}

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

test('알림 시점: 방금 지난 것은 발송, 오래 지난 것은 놓친 알림, 저장 전 시점은 무시', async () => {
  const now = new Date();
  const hm = (d) => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const recent = new Date(now - 30 * 60e3); // 30분 전
  const old = new Date(now - 5 * 3600e3); // 5시간 전
  const item = (id, rem, savedAt) => ({ id, title: id, cat: '개인', date: ymd(now), time: '23:59', kind: '마감', sub: '테스트', src: 'manual', rem: { d7: false, d3: false, d1: false, d0: false }, custom: [rem.toISOString()], savedAt });
  const mem = {
    S: { onboarded: true, depts: [], hidden: [], settings: { time: hm(now) }, deptAt: 0,
      items: [item('recent', recent, now - 864e5), item('old', old, now - 864e5), item('before-save', recent, +now)] },
    alerts: [],
  };
  const bg = boot(mem);
  await bg.tick();
  assert.deepStrictEqual(bg.notes.map((n) => n.title), ['D-Day · recent']);
  const subs = Object.fromEntries(mem.alerts.map((a) => [a.title, a.sub]));
  assert.ok(subs.recent && !subs.recent.includes('놓친'));
  assert.ok(subs.old.includes('놓친 알림'));
  assert.ok(!('before-save' in subs));

  // 같은 시점은 두 번 보내지 않는다(동시에 두 번 불려도)
  await Promise.all([bg.tick(), bg.tick()]);
  assert.strictEqual(bg.notes.length, 1);
});

test('다음 알림 시각에 정확히 울리는 알람을 예약한다', async () => {
  const now = Date.now();
  const soon = new Date(now + 90e3), later = new Date(now + 3600e3);
  const d = new Date(now + 864e5);
  const item = (id, rem) => ({ id, title: id, cat: '개인', date: ymd(d), time: '23:59', kind: '마감', sub: 't', src: 'manual', rem: { d7: false, d3: false, d1: false, d0: false }, custom: [rem.toISOString()], savedAt: now - 1000 });
  const mem = { S: { onboarded: true, depts: [], hidden: [], settings: {}, deptAt: 0, items: [item('later', later), item('soon', soon)] }, alerts: [] };
  const bg = boot(mem);
  await bg.tick();
  assert.strictEqual(bg.alarms.next.when, +soon);
  assert.strictEqual(bg.notes.length, 0);
});

test('같은 시각 알림이 2개면 각각 별도 창으로 띄운다', async () => {
  const now = Date.now();
  const at = new Date(now - 60e3).toISOString();
  const d = ymd(new Date(now + 864e5));
  const item = (id, custom) => ({ id, title: id, cat: '개인', date: d, time: '23:59', kind: '마감', sub: 't', src: 'manual', rem: { d7: false, d3: false, d1: false, d0: false }, custom, savedAt: now - 3600e3 });
  // 한 일정에 같은 시각 알림 2개(직접 지정 두 번) → 서로 덮어쓰지 않는 창 2개
  const mem = { S: { onboarded: true, depts: [], hidden: [], settings: {}, deptAt: 0, items: [item('b', [at, new Date(now - 60e3 + 1).toISOString()])] }, alerts: [] };
  const bg = boot(mem);
  await bg.tick();
  assert.strictEqual(bg.notes.length, 2);
  assert.strictEqual(new Set(bg.notes.map((n) => n.id.split('|').slice(0, 3).join('|'))).size, 2);
});

test('같은 시각 알림이 3개 이상이면 한 창으로 묶고, 알림탭에는 모두 기록한다', async () => {
  const now = Date.now();
  const at = new Date(now - 60e3).toISOString();
  const d = ymd(new Date(now + 864e5));
  const item = (id) => ({ id, title: '과제 ' + id, cat: '개인', date: d, time: '23:59', kind: '마감', sub: 't', src: 'manual', rem: { d7: false, d3: false, d1: false, d0: false }, custom: [at], savedAt: now - 3600e3 });
  const mem = { S: { onboarded: true, depts: [], hidden: [], settings: {}, deptAt: 0, items: ['a', 'b', 'c', 'd'].map(item) }, alerts: [] };
  const bg = boot(mem);
  await bg.tick();
  assert.strictEqual(bg.notes.length, 1);
  assert.ok(bg.notes[0].id.startsWith('group|'));
  assert.strictEqual(bg.notes[0].title, '마감 알림 4건');
  assert.strictEqual(bg.notes[0].message, '과제 a, 과제 b 외 2건');
  assert.strictEqual(mem.alerts.length, 4);
});

test('저장된 옛 학과명은 새 이름으로 옮기고 중복은 합친다', async () => {
  const ctx = vm.createContext({ chrome: { storage: { local: {} }, runtime: { getURL: (p) => p } }, fetch: async (u) => ({ json: async () => JSON.parse(fs.readFileSync(path.join(EXT, u), 'utf8')) }) });
  vm.runInContext(fs.readFileSync(path.join(EXT, 'core.js'), 'utf8'), ctx);
  const S = await ctx.Core.normalize({ depts: ['컴퓨터융합학부', '인공지능학과', '사학과'], items: [], hidden: [], settings: { time: '08:00' } });
  assert.deepStrictEqual([...S.depts], ['컴퓨터인공지능학부', '사학과']);
  assert.strictEqual(S.settings.time, '08:00');
  assert.strictEqual(S.settings.d3, true);
});
