// 사이드바(app.js)와 백그라운드(background.js)가 같이 쓰는 상태·일정 로직
(function (root) {
  const DATA_BASE = 'https://zer8m.github.io/whalecrew2/data/';
  const DEF_SETTINGS = { sync: true, academic: true, d7: false, d3: true, d1: true, d0: true, time: '09:00', browser: true, appTab: true, dragBtn: true, autoDetect: true };

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const at = (s, hm) => { const d = parseD(s); const [h, m] = (hm || '23:59').split(':'); d.setHours(+h, +m); return d; };
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // ───── 저장소 ─────
  // S: 사이드바가 쓰는 사용자 상태 · alerts: 양쪽이 쓰는 알림탭 · fired/seen/notices: 백그라운드 전용
  const store = chrome.storage.local;
  // 저장된 S → 쓸 수 있는 S: 기본 설정 채우기 + 통합·개명된 학과를 새 이름으로(renamed.json)
  let RENAMED = null;
  async function normalize(raw) {
    if (!RENAMED) RENAMED = await (await fetch(chrome.runtime.getURL('renamed.json'))).json();
    const S = raw ? { ...raw } : { onboarded: false, depts: [], items: [], hidden: [], settings: {}, deptAt: Date.now() };
    S.settings = { ...DEF_SETTINGS, ...S.settings };
    S.depts = [...new Set(S.depts.map((n) => RENAMED[n] || n))];
    return S;
  }
  async function load() {
    const r = await store.get(['S', 'alerts', 'notices']);
    return { S: await normalize(r.S), alerts: r.alerts || [], notices: r.notices || {} };
  }
  // 읽고-고치고-쓰기를 한 번에(사이드바·백그라운드 동시 수정 대비)
  async function mutate(key, fn, def) {
    const r = await store.get(key);
    const v = fn(r[key] === undefined ? def : r[key]);
    await store.set({ [key]: v });
    return v;
  }
  function newAlert(a) {
    return { id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6), read: false, at: new Date().toISOString(), ...a };
  }
  const pushAlert = (S, a) => (S.settings.appTab ? mutate('alerts', (list) => [newAlert(a), ...list].slice(0, 200), []) : Promise.resolve());

  // ───── 학과 ─────
  let DEPTS = null; // departments.json(단과대 → 학과)
  async function colleges() {
    if (!DEPTS) DEPTS = await (await fetch(chrome.runtime.getURL('departments.json'))).json();
    return DEPTS;
  }
  const deptId = (list, name) => { for (const c of list) for (const d of c.depts) if (d.name === name) return d.id; return null; };

  // 수집 JSON → 달력 일정(데모의 공지 일정 형태)
  function noticeItems(S, notices, list) {
    if (!S.settings.sync) return [];
    const out = [], seen = new Set();
    for (const name of S.depts) {
      const data = notices[deptId(list, name)];
      if (!data) continue;
      for (const n of data.items) {
        if ((S.offBoards || []).includes(n.board)) continue; // 설정에서 끈 게시판
        const id = 'n-' + n.id;
        if (seen.has(id)) continue; // 복수전공끼리 게시판 공유
        seen.add(id);
        const dl = n.type === 'deadline';
        out.push({ id, title: n.title + (dl ? ' 마감' : ''), cat: '학과공지', date: n.date, time: n.time || '23:59', kind: dl ? '마감' : '시작',
          sub: n.writer || n.tag, dept: name, src: 'notice', url: n.url || '', also: n.also || 0, memo: n.attach ? '첨부 ' + n.attach + '건 · 원문에서 확인' : '',
          rem: dl ? null : { d7: false, d3: false, d1: false, d0: false } });
      }
    }
    return out;
  }
  // 학교 학사일정(notices._academic) → 달력 일정. 기간은 시작·마감 두 개로.
  // 신청·취소처럼 행동이 필요한 일정만 시작 하루 전·마감 하루 전 알림, 나머지는 달력에만.
  const ACAD = { title: '', cat: '학사일정', sub: '학교 학사일정', src: 'academic', url: 'https://plus.cnu.ac.kr/_prog/academic_calendar/?site_dvs_cd=kr&menu_dvs_cd=05020101' };
  const NO_REM = { d7: false, d3: false, d1: false, d0: false };
  function academicItems(S, notices) {
    const data = notices._academic;
    if (!S.settings.academic || !data) return [];
    const out = [];
    for (const a of data.items) {
      const before = (s) => [new Date(+at(ymd(addD(parseD(s), -1)), S.settings.time)).toISOString()];
      if (!a.end) { out.push({ ...ACAD, id: 'ac-' + a.id, title: a.title, date: a.start, time: '00:00', kind: '일정', rem: NO_REM, custom: a.act ? before(a.start) : [] }); continue; }
      out.push({ ...ACAD, id: 'ac-' + a.id + '-s', title: a.title + ' 시작', date: a.start, time: '00:00', kind: '시작', rem: NO_REM, custom: a.act ? before(a.start) : [] });
      out.push({ ...ACAD, id: 'ac-' + a.id + '-e', title: a.title + (a.act ? ' 마감' : ' 종료'), date: a.end, time: '23:59', kind: a.act ? '마감' : '종료', rem: a.act ? { ...NO_REM, d1: true } : NO_REM, custom: [] });
    }
    return out;
  }
  function allItems(S, notices, list) {
    const own = new Set(S.items.map((i) => i.id));
    const extra = [...noticeItems(S, notices, list), ...academicItems(S, notices)].filter((i) => !own.has(i.id) && !S.hidden.includes(i.id));
    return [...S.items, ...extra].sort((a, b) => at(a.date, a.time) - at(b.date, b.time));
  }

  // ───── 알림 시점 ─────
  const getRem = (S, i) => i.rem || { d7: S.settings.d7, d3: S.settings.d3, d1: S.settings.d1, d0: S.settings.d0 };
  function remTimes(S, i) {
    const r = getRem(S, i), out = [];
    const diff = Math.round((parseD(i.date) - midnight(new Date())) / 864e5);
    if (i.kind === '시작') { if (r.d0 !== false) out.push({ key: 'start', at: +at(i.date, i.time) - 2 * 3600e3, label: '2시간 전' }); }
    else for (const [k, n, l] of [['d7', 7, 'D-7'], ['d3', 3, 'D-3'], ['d1', 1, 'D-1'], ['d0', 0, 'D-Day']])
      if (r[k]) out.push({ key: k, at: +at(ymd(addD(parseD(i.date), -n)), S.settings.time), label: l });
    for (const c of i.custom || []) out.push({ key: 'c' + c, at: +new Date(c), label: diff === 0 ? 'D-Day' : diff > 0 ? 'D-' + diff : 'D+' + -diff });
    return out;
  }

  root.Core = { DATA_BASE, DEF_SETTINGS, normalize, ymd, parseD, addD, at, midnight, load, mutate, newAlert, pushAlert, colleges, deptId, noticeItems, allItems, getRem, remTimes };
})(this);
