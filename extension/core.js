// 사이드바(app.js)와 백그라운드(background.js)가 같이 쓰는 상태·일정 로직
(function (root) {
  const DATA_BASE = 'https://zer8m.github.io/whalecrew2/data/';
  // 통합·개명된 학과: 옛 이름으로 저장한 사용자를 새 이름으로 옮긴다(collector/build-map.js RENAMED와 같게)
  const RENAMED = {
    '컴퓨터융합학부': '컴퓨터인공지능학부', '인공지능학과': '컴퓨터인공지능학부', '건축학과': '건축공학과',
    '동물자원과학부': '동물자원생명과학과', '바이오시스템기계공학과': '스마트농업시스템기계공학과',
    '인문사회과학전공': '인문사회학과', '리더십과 조직과학전공': '리더쉽과 조직과학과', '공공안전학전공': '공공안전학과',
  };
  const DEF_SETTINGS = { sync: true, d7: false, d3: true, d1: true, d0: true, time: '09:00', browser: true, appTab: true, dragBtn: true, autoDetect: true };

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const at = (s, hm) => { const d = parseD(s); const [h, m] = (hm || '23:59').split(':'); d.setHours(+h, +m); return d; };
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // ───── 저장소 ─────
  // S: 사이드바가 쓰는 사용자 상태 · alerts: 양쪽이 쓰는 알림탭 · fired/seen/notices: 백그라운드 전용
  const store = chrome.storage.local;
  async function load() {
    const r = await store.get(['S', 'alerts', 'notices']);
    const S = r.S || { onboarded: false, depts: [], items: [], hidden: [], settings: {}, deptAt: Date.now() };
    S.settings = { ...DEF_SETTINGS, ...S.settings };
    S.depts = [...new Set(S.depts.map((n) => RENAMED[n] || n))];
    return { S, alerts: r.alerts || [], notices: r.notices || {} };
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
        const id = 'n-' + n.id;
        if (seen.has(id)) continue; // 복수전공끼리 게시판 공유
        seen.add(id);
        const dl = n.type === 'deadline';
        out.push({ id, title: n.title + (dl ? ' 마감' : ''), cat: '학과공지', date: n.date, time: n.time || '23:59', kind: dl ? '마감' : '시작',
          sub: n.writer || n.tag, dept: name, src: 'notice', url: n.url || '', memo: n.attach ? '첨부 ' + n.attach + '건 · 원문에서 확인' : '',
          rem: dl ? null : { d7: false, d3: false, d1: false, d0: false } });
      }
    }
    return out;
  }
  function allItems(S, notices, list) {
    const own = new Set(S.items.map((i) => i.id));
    const extra = noticeItems(S, notices, list).filter((i) => !own.has(i.id) && !S.hidden.includes(i.id));
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

  root.Core = { DATA_BASE, DEF_SETTINGS, ymd, parseD, addD, at, midnight, load, mutate, newAlert, pushAlert, colleges, deptId, noticeItems, allItems, getRem, remTimes };
})(this);
