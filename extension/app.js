// 앗!차차 사이드바 — 상태 · 화면 렌더 · 이벤트. 마크업은 시안 원본 그대로.
(function () {
  const WH = '#2B6CFF';
  const W = ['일', '월', '화', '수', '목', '금', '토'];
  const WL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = Extract.ymd;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ───── 아이콘(시안 SVG 경로) ─────
  const I = {
    x: '<path d="M18 6 6 18M6 6l12 12"></path>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"></path>',
    gear: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>',
    right: '<path d="m9 18 6-6-6-6"></path>',
    right2: '<path d="m9 6 6 6-6 6"></path>',
    left: '<path d="m15 18-6-6 6-6"></path>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="3"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    check: '<path d="m20 6-11 11-5-5"></path>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19"></path>',
    mega: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12"></path>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"></path>',
    grip: '<path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"></path>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"></path>',
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3"></path>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"></path><path d="M4 19.5V5.5"></path>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5"></path><path d="M9 13h6M9 17h4"></path>',
    memo: '<path d="M4 4h12l4 4v12H4z"></path><path d="M8 12h8M8 16h5"></path>',
    info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path>',
    cap: '<path d="m2 9 10-5 10 5-10 5z"></path><path d="M6 11.5V17c0 1.5 3 3 6 3s6-1.5 6-3v-5.5M22 9v6"></path>',
    flag: '<path d="M4 22V4a1 1 0 0 1 1-1h12l-2 4 2 4H5"></path>',
    pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
  };
  const svg = (n, size, stroke, sw, style) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${style ? ` style="${style}"` : ''}>${I[n]}</svg>`;

  const CAT = {
    '학과공지': { c: WH, bg: '#EAF0FF', ic: 'mega' },
    '과제·시험': { c: '#E5484D', bg: '#FDECEC', ic: 'clock' },
    '대외활동': { c: '#7A5AF8', bg: '#F1EDFF', ic: 'trophy' },
    '개인': { c: '#D98D06', bg: '#FFF4DE', ic: 'clock' },
  };

  // ───── 날짜 ─────
  const midnight = Core.midnight;
  let TODAY = midnight(new Date());
  const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const diff = (s) => Math.round((parseD(s) - TODAY) / 864e5);
  const dd = (n) => (n === 0 ? 'D-Day' : n > 0 ? 'D-' + n : 'D+' + -n);
  const at = (s, hm) => { const d = parseD(s); const [h, m] = (hm || '23:59').split(':'); d.setHours(+h, +m); return d; };
  const mdw = (s) => { const d = parseD(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${W[d.getDay()]})`; };
  const mdl = (s) => { const d = parseD(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WL[d.getDay()]}`; };
  const hm = (d) => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const rel = (s) => { const n = diff(s); const d = parseD(s); return n === 0 ? '오늘' : n === 1 ? '내일' : `${d.getMonth() + 1}/${d.getDate()}(${W[d.getDay()]})`; };

  // ───── 상태 ─────
  // S: 사용자 상태(storage 'S') · ALERTS: 알림탭 · NOTICES: 학과별 수집 데이터 · LIST/COLLEGES: 학과 목록
  let S, ALERTS = [], NOTICES = {}, LIST = [], COLLEGES = [];
  const save = () => chrome.storage.local.set({ S });

  // 화면 상태(저장 안 함)
  const U = { view: 'onboard', sel: ymd(TODAY), month: [TODAY.getFullYear(), TODAY.getMonth()], sheet: null,
    ci: 0, q: '', tmp: [], alertTab: 0, draft: null, back: 'main', sd: null, scrap: null };

  // ───── 일정 ─────
  const allItems = () => Core.allItems(S, NOTICES, LIST);
  const find = (id) => allItems().find((i) => i.id === id);
  const onDate = (s) => allItems().filter((i) => i.date === s);
  const getRem = (i) => Core.getRem(S, i);
  const catLabel = (i) => i.cat;
  const chip = (txt, c, bg, extra) => `<span class="chip" style="color:${c};background:${bg};${extra || ''}">${esc(txt)}</span>`;
  const catChip = (i) => { const c = CAT[i.cat] || CAT['개인']; return chip(catLabel(i), c.c, c.bg); };
  const dots = (s) => [...new Set(onDate(s).map((i) => (CAT[i.cat] || CAT['개인']).c))].slice(0, 3).map((c) => `<i style="background:${c};"></i>`).join('');

  function remText(i) {
    const r = getRem(i), extra = (i.custom || []).length;
    // 시작형(개인 일정)은 D-n 대신 시작 2시간 전 알림(remTimes와 같은 규칙)
    if (i.kind === '시작') return r.d0 !== false ? '시작 2시간 전' + (extra ? ' 외 ' + extra + '개' : '') : extra ? '직접 지정 ' + extra + '개' : '없음';
    const on = [['d7', 'D-7'], ['d3', 'D-3'], ['d1', 'D-1'], ['d0', 'D-Day']].filter(([k]) => r[k]).map(([, l]) => l);
    if (!on.length) return (i.custom || []).length ? '직접 지정 ' + i.custom.length + '개' : '없음';
    return on.join(' · ') + ' ' + S.settings.time + ((i.custom || []).length ? ' 외 ' + i.custom.length + '개' : '');
  }
  function upsert(item) {
    const k = S.items.findIndex((x) => x.id === item.id);
    item.savedAt = Date.now(); // 이 시각 전에 이미 지난 알림 시점은 보내지 않는다
    if (k >= 0) S.items[k] = item; else S.items.push(item);
    save();
  }
  function remove(id) {
    S.items = S.items.filter((x) => x.id !== id);
    if (/^n-/.test(id)) S.hidden.push(id);
    save();
  }
  const pushAlert = (a) => Core.pushAlert(S, a);

  // ───── 공통 조각 ─────
  const logo = (size) => `<span style="display:inline-flex;align-items:center;gap:7px;font-size:16px;font-weight:800;letter-spacing:-.03em;color:${WH};"><img src="chacha.png" alt="앗!차차" style="width:${size || 28}px;height:${size || 28}px;border-radius:8px;object-fit:cover;flex:none;">앗!차차</span>`;
  const topIcons = `<div style="display:flex;align-items:center;"><a class="ib press" data-go="alerts" aria-label="알림">${svg('bell', 21, '#1A1C22', 1.8)}</a><a class="ib press" data-go="settings" aria-label="설정">${svg('gear', 21, '#1A1C22', 1.8)}</a></div>`;
  const header = (l, r) => `<div style="flex:none;display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 12px 0 20px;background:#fff;">${l}${r}</div>`;
  const nav = (on) => `<nav style="flex:none;display:flex;padding:4px 24px 8px;border-top:1px solid #EEF1F6;background:#fff;">` +
    [['alerts', 'bell', '알림'], ['main', 'cal', '캘린더'], ['settings', 'gear', '설정']].map(([v, ic, t]) =>
      `<a class="nav${on === v ? ' on' : ''}" data-go="${v}">${svg(ic, 22, 'currentColor', on === v ? 2 : 1.6)}<span>${t}</span></a>`).join('') + `</nav>`;
  const frame = (inner) => `<div style="width:100%;height:100%;display:flex;flex-direction:column;background:#FFFFFF;overflow:hidden;position:relative;">${inner}</div>`;
  const tog = (on, act, label) => `<button class="tog${on ? ' on' : ''}" style="${on ? 'background:' + WH + ';' : ''}" aria-label="${label || '켜기/끄기'}" data-act="${act}"><i></i></button>`;
  const weekHead = `<div style="display:grid;grid-template-columns:repeat(7, minmax(0, 1fr));">` + W.map((w, k) =>
    `<span style="text-align:center;font-size:12px;font-weight:500;color:${k === 0 ? '#E5484D' : k === 6 ? '#3B7BFF' : '#9AA3B2'};padding-bottom:4px;">${w}</span>`).join('') + `</div>`;

  // 월 달력: mode main(날짜 → 상세) | scrap(날짜 선택) | sheet(바텀시트)
  function monthGrid(y, m, sel, mode) {
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), off = first.getDay();
    const cells = Math.ceil((off + days) / 7) * 7, t = ymd(TODAY);
    let h = `<div style="display:grid;grid-template-columns:repeat(7, minmax(0, 1fr));gap:2px 0;">`;
    for (let k = 0; k < cells; k++) {
      const d = new Date(y, m, k - off + 1), s = ymd(d), inM = d.getMonth() === m;
      const dot = mode === 'sheet' ? '' : `<span class="d">${inM ? dots(s) : ''}</span>`;
      if (!inM) { h += `<span class="day o"><span class="n"${mode === 'sheet' ? '' : ' style=""'}>${d.getDate()}</span>${dot}</span>`; continue; }
      let st = '';
      if (s === sel) st = `background:${WH};color:#fff;font-weight:700;`;
      else if (s === t) st = mode === 'sheet' ? `box-shadow:inset 0 0 0 1.5px ${WH};color:${WH};font-weight:700;` : `background:#EAF0FF;color:${WH};font-weight:700;`;
      else if (s < t) st = 'color:#B4BBC7;';
      const act = mode === 'main' ? `data-go="day:${s}"` : mode === 'scrap' ? `data-act="scrapDay" data-arg="${s}"` : `data-act="sheetDay" data-arg="${s}"`;
      h += `<a class="day" ${act}><span class="n" style="${st}">${d.getDate()}</span>${dot}</a>`;
    }
    return h + `</div>`;
  }

  // 목록 행(시안 메인의 일정 행)
  function row(i, mode, border) {
    const left = mode === 'up' ? `${parseD(i.date).getDate()}일` : i.time;
    const n = diff(i.date);
    const dchip = i.kind === '마감' ? chip(dd(n), WH, '#EAF0FF') : '';
    const sub = mode === 'up' ? `${i.time} · ${esc(i.sub)}` : esc(i.src === 'notice' ? '학과 공지 자동 연동' : i.sub);
    const link = i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:${WH};font-weight:600;">원문${svg('ext', 11, WH, 2.4)}</a>` : '';
    const memo = mode === 'up' && i.memo ? `<span class="c2" style="display:flex;align-items:center;gap:5px;min-width:0;">${svg('memo', 12, '#9AA3B2', 2, 'flex:none;')}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(i.memo)}</span></span>` : '';
    // 메인 목록: 행 전체 → 날짜 상세(읽기). 상세·스크랩 화면 안: 제목 → 편집
    const toDay = U.view === 'main' && !U.scrap;
    return `<div${toDay ? ` class="rowp" data-go="day:${i.date}"` : ''} style="display:flex;gap:14px;padding:14px 16px;align-items:flex-start;${border ? 'border-bottom:1px solid #EEF1F6;' : ''}">
  <span style="width:44px;flex:none;display:flex;flex-direction:column;gap:2px;padding-top:1px;"><span style="font-size:14px;font-weight:700;">${left}</span><span class="c2" style="font-size:11px;">${i.kind}</span></span>
  <span style="display:flex;flex-direction:column;gap:5px;flex:1;min-width:0;">
    <span style="display:flex;align-items:center;gap:6px;">${catChip(i)}${mode === 'up' || i.kind === '마감' ? dchip : ''}</span>
    <a${toDay ? '' : ` data-go="edit:${i.id}"`} style="font-size:15px;font-weight:600;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(i.title)}</a>
    <span class="c" style="display:flex;gap:8px;align-items:center;">${sub}${link}</span>${memo}
  </span>
</div>`;
  }
  const emptyCard = (t) => `<div class="card" style="padding:16px;"><span class="c2">${t}</span></div>`;

  // ───── 1. 학과 선택 ─────
  function deptRows(sheet) {
    const q = U.q.trim();
    const list = q ? COLLEGES.flatMap((c) => c.depts.filter((d) => d.includes(q)).map((d) => [d, c.name])) : COLLEGES[U.ci].depts.map((d) => [d, COLLEGES[U.ci].name]);
    if (!list.length) return `<div class="row"><span class="c2">'${esc(q)}' 학과를 찾지 못했어요</span></div>`;
    return list.map(([n, col]) => {
      const on = U.tmp.includes(n);
      const mark = on ? `<span style="width:22px;height:22px;border-radius:7px;background:${WH};display:inline-flex;align-items:center;justify-content:center;${sheet ? 'flex:none;' : ''}">${svg('check', 13, '#fff', 3)}</span>`
        : `<span style="width:22px;height:22px;border-radius:7px;border:1.5px solid #D5DAE3;display:block;${sheet ? 'flex:none;' : ''}"></span>`;
      if (sheet) return `<button class="row rowp press" data-act="pickDept" data-arg="${esc(n)}" style="justify-content:space-between;${on ? 'background:#F8FAFF;' : ''}"><span style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:15px;font-weight:${on ? 600 : 500};color:${on ? WH : '#1A1C22'};display:inline-flex;align-items:center;">${esc(n)}${on && U.tmp[0] === n ? `<span class="chip" style="height:18px;padding:0 6px;font-size:10px;color:${WH};background:#EAF0FF;margin-left:6px;">주전공</span>` : ''}</span><span class="c2">${col}</span></span>${mark}</button>`;
      return `<button class="row rowp press" data-act="pickDept" data-arg="${esc(n)}" style="justify-content:space-between;"><span style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:15px;font-weight:${on ? 600 : 500};color:${on ? WH : '#1A1C22'};">${esc(n)}</span><span class="c2">${col}</span></span>${mark}</button>`;
    }).join('');
  }
  const collegeTabs = (sheet) => COLLEGES.map((c, k) => sheet
    ? `<span class="${k === U.ci && !U.q ? 'on' : ''}" data-act="college" data-arg="${k}" style="flex:none;padding:0 12px;white-space:nowrap;">${c.name}</span>`
    : `<button class="${k === U.ci && !U.q ? 'on' : 'off'}" data-act="college" data-arg="${k}" style="flex:none;padding:0 12px;white-space:nowrap;border:0;background:transparent;cursor:pointer;">${c.name}</button>`).join('');
  const josa = (s) => (((s.charCodeAt(s.length - 1) - 0xAC00) % 28) === 0 ? '로' : '으로');
  const cta = () => U.tmp.length === 0 ? '학과 없이 시작하기' : U.tmp.length === 1 ? U.tmp[0] + josa(U.tmp[0]) + ' 시작하기' : U.tmp[0] + ' 외 ' + (U.tmp.length - 1) + '개 학과로 시작하기';
  function selChips() {
    if (!U.tmp.length) return '';
    return `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"><span class="c2" style="font-weight:600;margin-right:2px;">선택 ${U.tmp.length}개</span>` +
      U.tmp.map((n) => `<button class="press" data-act="pickDept" data-arg="${esc(n)}" style="height:28px;padding:0 8px 0 10px;border-radius:999px;border:1px solid #C5D6FF;background:#EAF0FF;color:${WH};font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px;cursor:pointer;" aria-label="${esc(n)} 선택 해제">${esc(n)}${svg('x', 12, WH, 2.6)}</button>`).join('') + `</div>`;
  }
  function vOnboard() {
    return frame(header(logo(), `<div style="display:flex;align-items:center;"><a class="c2" data-act="skip" style="padding-right:10px;font-weight:600;color:#7B8494;">건너뛰기</a></div>`) +
`<div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:8px 20px 12px;overflow-y:auto;overflow-x:hidden;">
  <div style="display:flex;flex-direction:column;gap:8px;">
    <span class="c">충남대학교 학생이라면</span>
    <h1 style="margin:0;font-size:24px;font-weight:700;line-height:32px;letter-spacing:-.03em;text-wrap:balance;"><span style="color:${WH};">소속 학과</span>를 고르면<br>학과 공지가 달력에 들어와요.</h1>
    <span class="c">복수전공·부전공도 함께 고를 수 있어요. 여러 개 선택 가능</span>
  </div>
  <div class="well" style="padding:10px 14px;display:flex;align-items:flex-start;gap:8px;"><span style="margin-top:2px;display:flex;">${svg('info', 15, WH, 2.2, 'flex:none;')}</span><span class="c" style="color:#4B5261;">학과를 고르지 않아도 <br><b style="font-weight: 700; color: rgb(26, 28, 34)">드래그 저장·직접 입력</b>으로 일정을 모을 수 있어요.</span></div>
  <div style="position:relative;display:flex;align-items:center;">
    <label for="q" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">학과 검색</label>
    <span style="position:absolute;left:14px;display:flex;">${svg('search', 18, '#9AA3B2', 2)}</span>
    <input id="q" class="inp" data-in="q" placeholder="학과명을 검색하세요" value="${esc(U.q)}" style="padding-left:42px;">
  </div>
  <div id="selChips">${selChips()}</div>
  <div class="tabs" id="colTabs" style="overflow-x:auto;overflow-y:hidden;flex:none;scrollbar-width:none;margin:0 -20px;padding:0 20px;-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 40px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 40px),transparent);">${collegeTabs(false)}</div>
  <div class="card" id="deptList" style="overflow:hidden;">${deptRows(false)}</div>
</div>
<div style="flex:none;padding:12px 20px 20px;">
  <a class="btn press" id="ctaBtn" data-act="startDepts" style="width:100%;background:${WH};color:#fff;">${esc(cta())}</a>
</div>`);
  }

  // ───── 2. 메인 달력 ─────
  function calCard(sel, mode) {
    const [y, m] = U.month;
    const head = mode === 'scrap'
      ? `<div style="display:flex;align-items:center;justify-content:space-between;height:40px;padding-left:4px;"><span style="font-size:16px;font-weight:700;letter-spacing:-.02em;">${y}년 ${m + 1}월</span><span style="display:flex;"><button class="ib press" data-act="month" data-arg="-1" aria-label="이전 달">${svg('left', 18, '#4B5261', 2)}</button><button class="ib press" data-act="month" data-arg="1" aria-label="다음 달">${svg('right', 18, '#4B5261', 2)}</button></span></div>`
      : `<div style="display:flex;align-items:center;justify-content:center;gap:12px;height:40px;position:relative;"><button class="ib press" data-act="month" data-arg="-1" aria-label="이전 달">${svg('left', 18, '#4B5261', 2)}</button><span style="font-size:16px;font-weight:700;letter-spacing:-.02em;min-width:96px;text-align:center;">${y}년 ${m + 1}월</span><button class="ib press" data-act="month" data-arg="1" aria-label="다음 달">${svg('right', 18, '#4B5261', 2)}</button><button class="press" data-act="today" style="position:absolute;right:0;height:28px;padding:0 10px;border-radius:8px;border:1px solid #E1E6EE;background:#fff;font-size:12px;font-weight:600;color:#4B5261;cursor:pointer;">오늘</button></div>`;
    return `<div class="card" style="padding:${mode === 'scrap' ? '6px 12px 10px' : '4px 12px 8px'};">${head}${weekHead}${monthGrid(y, m, sel, mode)}</div>`;
  }
  function vMain() {
    if (U.scrap) return vScrap();
    const noDept = !S.depts.length, now = Date.now();
    const future = allItems().filter((i) => i.kind === '마감' && !i.done && at(i.date, i.time) >= now);
    const hero = future[0];
    const up = future.filter((i) => i !== hero && diff(i.date) <= 7).slice(0, 2);
    const day = onDate(U.sel);
    let h = '';
    if (noDept) h += `<a class="press" data-act="openDeptSheet" style="display:flex;align-items:center;justify-content:space-between;gap:10px;height:34px;padding:0 12px;border-radius:8px;background:#F5F7FB;margin-top:2px;">
    <span class="c2" style="display:inline-flex;align-items:center;gap:6px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;"><span class="dot" style="background:${WH};"></span>학과 공지 없이 사용 중</span>
    <span style="display:inline-flex;align-items:center;gap:2px;font-size:12px;font-weight:700;color:${WH};flex:none;">학과 선택${svg('right', 13, WH, 2.4)}</span>
  </a>`;
    if (hero) {
      const where = hero.src === 'notice' ? (hero.dept || S.depts[0]) : hero.sub;
      h += `<a class="card press" data-go="day:${hero.date}" style="padding:14px 16px 14px;display:flex;flex-direction:column;gap:8px;background:#FFF0F1;border-color:#FBD5D8;margin-top:4px;">
    <span style="display:flex;align-items:center;justify-content:space-between;">
      <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#E5484D;letter-spacing:.01em;"><span class="dot" style="background:#E5484D;"></span>가장 가까운 마감</span>
      ${chip(catLabel(hero), (CAT[hero.cat] || CAT['개인']).c, (CAT[hero.cat] || CAT['개인']).bg)}
    </span>
    <span style="display:flex;align-items:baseline;gap:10px;min-width:0;">
      <span style="font-size:32px;font-weight:800;line-height:36px;letter-spacing:-.04em;color:#E5484D;flex:none;">${dd(diff(hero.date))}</span>
      <span style="font-size:17px;font-weight:700;letter-spacing:-.02em;line-height:24px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(hero.title)}</span>
    </span>
    <span style="display:flex;align-items:center;justify-content:space-between;">
      <span class="c">${mdw(hero.date)} ${hero.time} · ${esc(where)}</span>
      <span style="display:inline-flex;align-items:center;gap:2px;font-size:12px;font-weight:600;color:#E5484D;">자세히${svg('right', 14, '#E5484D', 2.2)}</span>
    </span>
  </a>`;
    }
    h += calCard(U.sel, 'main');
    h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 2px 0;">
    <span style="font-size:16px;font-weight:700;letter-spacing:-.02em;">${mdl(U.sel)}</span>
    <a data-go="new:${U.sel}" style="display:inline-flex;align-items:center;gap:3px;font-size:13px;font-weight:600;color:${WH};">${svg('plus', 14, WH, 2.6)}일정 추가</a>
  </div>`;
    h += day.length ? `<div class="card" style="overflow:hidden;">${day.map((i, k) => row(i, 'date', k < day.length - 1)).join('')}</div>` : emptyCard('등록된 일정이 없어요');
    h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 2px 0;">
    <span style="font-size:16px;font-weight:700;letter-spacing:-.02em;">다가오는 마감 <span class="c" style="font-weight:500;">${up.length}건</span></span>
    <a class="c" data-go="alerts" style="display:inline-flex;align-items:center;gap:2px;">전체${svg('right', 14, '#9AA3B2', 2)}</a>
  </div>`;
    h += up.length ? `<div class="card" style="overflow:hidden;">${up.map((i, k) => row(i, 'up', k < up.length - 1)).join('')}</div>` : emptyCard('일주일 안에 마감이 없어요');
    const body = header(logo(), topIcons) + `<div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:0 20px 16px;overflow-y:auto;overflow-x:hidden;">${h}</div>` + nav('main');
    return frame(body + (U.sheet === 'dept' ? deptSheet() : ''));
  }

  // ───── 2-2. 학과 선택 바텀시트 ─────
  function sheetChips() {
    return U.tmp.map((n, k) => `<button class="press" data-act="pickDept" data-arg="${esc(n)}" style="height:30px;padding:0 6px 0 11px;border-radius:999px;border:0;background:${WH};color:#fff;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;cursor:pointer;" aria-label="${esc(n)} 선택 해제">${esc(n)}${k ? `<span style="height:18px;padding:0 6px;border-radius:5px;background:rgba(255,255,255,.22);font-size:10px;font-weight:600;display:inline-flex;align-items:center;">복수전공</span>` : ''}<span style="width:22px;height:22px;border-radius:999px;background:rgba(255,255,255,.18);display:inline-flex;align-items:center;justify-content:center;">${svg('x', 12, '#fff', 2.6)}</span></button>`).join('') +
      `<span class="c2" style="margin-left:2px;">${U.tmp.length}개 선택</span>`;
  }
  const sheetCta = () => U.tmp.length ? `${U.tmp.length}개 학과로 저장` : '학과 없이 사용하기';
  function deptSheet() {
    return `<div aria-hidden="true" data-act="closeSheet" style="position:absolute;inset:0;background:rgba(26,28,34,.42);"></div>
<div role="dialog" aria-label="학과 선택" style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -1px 0 rgba(26,28,34,.04),0 -16px 48px rgba(26,28,34,.16);display:flex;flex-direction:column;padding:8px 20px 20px;gap:12px;max-height:92%;">
  <span aria-hidden="true" style="width:36px;height:4px;border-radius:2px;background:#D5DAE3;align-self:center;"></span>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-top:2px;"><span style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:18px;font-weight:700;letter-spacing:-.03em;line-height:24px;">학과 선택</span><span class="c">복수전공·부전공까지 여러 개 고를 수 있어요</span></span><a class="ib press" data-act="closeSheet" aria-label="닫기" style="margin:-8px -10px 0 0;">${svg('x', 20, '#1A1C22', 2)}</a></div>
  <div style="position:relative;display:flex;align-items:center;"><span style="position:absolute;left:14px;display:flex;">${svg('search', 18, '#9AA3B2', 2)}</span><input id="q" class="inp" data-in="q" placeholder="학과명을 검색하세요" value="${esc(U.q)}" style="padding-left:42px;height:44px;background:#F5F7FB;border-color:transparent;"></div>
  <div id="selChips" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">${sheetChips()}</div>
  <div class="tabs" id="colTabs" style="overflow-x:auto;scrollbar-width:none;flex:none;margin:0 -20px;padding:0 20px;-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 40px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 40px),transparent);">${collegeTabs(true)}</div>
  <div class="card" id="deptList" style="overflow-y:auto;flex:none;max-height:262px;">${deptRows(true)}</div>
  <div style="display:flex;flex-direction:column;gap:10px;"><a class="btn press" id="ctaBtn" data-act="saveDepts" style="width:100%;background:${WH};color:#fff;">${sheetCta()}</a></div>
</div>`;
  }

  // ───── 3. 날짜 상세 ─────
  function bigCard(i) {
    const c = CAT[i.cat] || CAT['개인'];
    const imp = i.importance === '높음' ? `<span class="chip" style="margin-left:auto;color:#E5484D;background:#FDECEC;gap:3px;">${svg('flag', 10, '#E5484D', 2.6)}중요</span>` : '';
    const url = i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;align-items:center;height:36px;border-top:1px solid #E9EDF3;gap:12px;"><span class="c">원문</span><span style="display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:${WH};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(shortUrl(i.url))}${svg('ext', 12, WH, 2.4)}</span></a>` : '';
    const memo = i.memo ? `<div style="display:flex;gap:8px;align-items:flex-start;padding:2px 2px 0;">${svg('memo', 15, '#9AA3B2', 2, 'flex:none;margin-top:2px;')}<span style="display:flex;flex-direction:column;gap:2px;min-width:0;"><span class="c2" style="font-weight:600;">메모</span><span style="font-size:13px;line-height:19px;color:#4B5261;">${esc(i.memo)}</span></span></div>` : '';
    return `<div class="card" style="padding:16px 16px 14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;gap:6px;">${chip(catLabel(i), c.c, c.bg)}${chip(i.done ? '완료' : dd(diff(i.date)), i.done ? '#2FBF71' : WH, i.done ? '#E6F7EE' : '#EAF0FF')}${imp}</div>
    <a data-go="edit:${i.id}" style="font-size:18px;font-weight:700;letter-spacing:-.02em;line-height:24px;text-wrap:balance;">${esc(i.title)}</a>
    <div class="well" style="padding:4px 14px;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;height:36px;"><span class="c">${i.kind === '시작' ? '시작' : '마감'}</span><span style="font-size:14px;font-weight:600;">${mdw(i.date)} ${i.time}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;height:36px;border-top:1px solid #E9EDF3;"><span class="c">알림</span><span style="font-size:14px;font-weight:600;">${remText(i)}</span></div>
      ${url}
    </div>
    ${memo}
    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px;">
      <a class="btn2 press" data-go="edit:${i.id}" style="gap:6px;">${svg('pen', 15, '#1A1C22', 2)}수정</a>
      <button class="btn2 press" data-act="del" data-arg="${i.id}" style="gap:6px;color:#E5484D;">${svg('trash', 15, '#E5484D', 2)}삭제</button>
    </div>
  </div>`;
  }
  function vDay() {
    const d = parseD(U.sel), start = addD(d, -d.getDay()), t = ymd(TODAY);
    let strip = '';
    for (let k = 0; k < 7; k++) {
      const s = ymd(addD(start, k));
      const st = s === U.sel ? `background:${WH};color:#fff;font-weight:700;` : s === t ? `background:#EAF0FF;color:${WH};font-weight:700;` : '';
      strip += `<a data-go="day:${s}" class="day" style="height:76px;gap:5px;font-size:16px;"><span class="c2" style="font-size:12px;color:${k === 0 ? '#E5484D' : '#9AA3B2'};">${W[k]}</span><span class="n" style="${st}">${addD(start, k).getDate()}</span><span class="d">${dots(s)}</span></a>`;
    }
    const items = onDate(U.sel);
    const cards = items.map(bigCard).join('');
    return frame(header(`<a class="ib press" data-go="main" aria-label="뒤로" style="margin-left:-10px;">${svg('left', 22, '#1A1C22', 2)}</a>`, `<div style="display:flex;align-items:center;"><a class="ib press" data-go="new:${U.sel}" aria-label="일정 추가">${svg('plus', 22, '#1A1C22', 2)}</a></div>`) +
      `<div style="position:absolute;left:0;right:0;top:0;height:56px;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:16px;font-weight:700;letter-spacing:-.02em;">${d.getFullYear()}년 ${d.getMonth() + 1}월</div>
<div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:0 20px;overflow-y:auto;overflow-x:hidden;">
  <div class="card wk" style="padding:8px 6px;"><div style="display:grid;grid-template-columns:repeat(7, minmax(0, 1fr));">${strip}</div></div>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 2px 0;">
    <span style="font-size:18px;font-weight:700;letter-spacing:-.03em;">${d.getDate()}일 ${WL[d.getDay()]} <span class="c" style="font-weight:500;">${items.length}건</span></span>
  </div>
  ${cards}
  <a class="btn2 press" data-go="new:${U.sel}" style="gap:6px;border-style:dashed;color:${WH};flex:none;">${svg('plus', 15, WH, 2.6)}이 날짜에 개인 일정 추가</a>
  <div style="height:8px;flex:none;"></div>
</div>` + nav('main'));
  }

  // ───── 4. 일정 편집 ─────
  function shortUrl(u) { try { const x = new URL(u); return x.host.replace(/^www\./, '') + (x.pathname.length > 1 ? x.pathname.split('/').slice(0, 2).join('/') + '/…' : ''); } catch (e) { return u; } }
  const siteName = (u) => /linkareer/.test(u) ? '링커리어' : /cnu\.ac\.kr/.test(u) ? '학교 홈페이지' : (() => { try { return new URL(u).host; } catch (e) { return '웹'; } })();
  function newDraft(date) {
    return { id: 'u' + Date.now(), title: '', cat: '개인', date, time: '23:59', kind: '마감', sub: '직접 입력한 개인 일정', src: 'manual', url: '', memo: '', importance: '보통',
      rem: { d7: S.settings.d7, d3: S.settings.d3, d1: S.settings.d1, d0: S.settings.d0 }, custom: [], isNew: true };
  }
  function customLabel(c) {
    const h = (at(U.draft.date, U.draft.time) - new Date(c)) / 3600e3;
    return h < 0 ? '마감 후' : h < 24 ? Math.round(h) + '시간 전' : Math.round(h / 24) + '일 전';
  }
  function vEdit() {
    const D = U.draft, n = diff(D.date), d = parseD(D.date);
    const remOn = ['d7', 'd3', 'd1', 'd0'].filter((k) => D.rem[k]).length + D.custom.length;
    const rb = [['d7', 7, 'D-7'], ['d3', 3, 'D-3'], ['d1', 1, 'D-1'], ['d0', 0, 'D-Day']].map(([k, off, l]) => {
      const on = D.rem[k], x = addD(d, -off);
      return `<button class="press" data-act="rem" data-arg="${k}" aria-pressed="${on}" style="height:44px;border-radius:10px;border:1px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;${on ? `color:#fff;background:${WH};border-color:${WH};` : 'color:#7B8494;background:#fff;border-color:#E1E6EE;'}"><span style="font-size:13px;font-weight:700;line-height:16px;">${l}</span><span style="font-size:10px;line-height:12px;opacity:.8;">${x.getMonth() + 1}/${x.getDate()}</span></button>`;
    }).join('');
    const customs = D.custom.map((c, k) => { const x = new Date(c); return `<div class="well" style="display:flex;align-items:center;gap:8px;height:40px;padding:0 6px 0 12px;font-size:13px;"><span style="display:inline-flex;align-items:center;gap:5px;color:${WH};font-weight:700;">${svg('bell', 13, 'currentColor', 2.2)}${customLabel(c)}</span><span class="c" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${mdw(ymd(x))} ${hm(x)} · 직접 지정</span><button class="ib press" data-act="delCustom" data-arg="${k}" style="width:32px;height:32px;" aria-label="이 알림 삭제">${svg('x', 15, '#9AA3B2', 2.2)}</button></div>`; }).join('');
    const from = D.src === 'drag' ? ` · ${siteName(D.url)}에서 드래그로 가져옴` : D.src === 'notice' ? ' · 학과 공지 원문' : '';
    const link = D.url
      ? `<div class="inp" style="height:44px;background:#F5F7FB;border-color:transparent;justify-content:space-between;"><span style="display:inline-flex;align-items:center;gap:8px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:${WH};font-weight:500;">${svg('link', 15, WH, 2)}${esc(D.url.length > 34 ? D.url.slice(0, 33) + '…' : D.url)}</span><button class="ib press" data-act="clearUrl" style="width:32px;height:32px;margin-right:-8px;" aria-label="링크 지우기">${svg('x', 15, '#9AA3B2', 2.2)}</button></div>`
      : `<div class="inp" style="height:44px;background:#F5F7FB;border-color:transparent;">${svg('link', 15, '#9AA3B2', 2)}<input data-in="url" placeholder="링크를 붙여넣으세요 (선택)" style="border:0;background:transparent;outline:none;flex:1;min-width:0;font-size:13px;"></div>`;
    const impBtn = (l) => { const on = D.importance === l; const st = !on ? 'color:#7B8494;' : l === '높음' ? 'border-color:#E5484D;color:#E5484D;background:#FDECEC;' : l === '보통' ? `border-color:${WH};color:${WH};background:#EAF0FF;` : 'border-color:#C9CFD9;color:#1A1C22;background:#F5F7FB;'; return `<button class="btn2 press" data-act="imp" data-arg="${l}" style="height:36px;font-size:13px;${st}">${l}</button>`; };
    const body = header(`<a class="ib press" data-act="closeEdit" aria-label="닫기" style="margin-left:-10px;">${svg('x', 22, '#1A1C22', 2)}</a><span style="font-size:16px;font-weight:700;letter-spacing:-.02em;margin-left:2px;">일정 편집</span>`,
      `<div style="display:flex;align-items:center;">${D.isNew ? '<span style="width:40px;"></span>' : `<button class="ib press" data-act="del" data-arg="${D.id}" aria-label="삭제">${svg('trash', 20, '#E5484D', 1.8)}</button>`}</div>`) +
`<div style="flex:1;display:flex;flex-direction:column;gap:16px;padding:4px 20px 12px;overflow-y:auto;overflow-x:hidden;">
  <div style="display:flex;flex-direction:column;gap:8px;"><span class="lbl">일정 이름</span><input class="inp" id="fTitle" data-in="title" value="${esc(D.title)}" placeholder="일정 이름을 입력하세요" style="font-weight:500;"></div>
  <div style="display:flex;flex-direction:column;gap:8px;"><span class="lbl">분류</span><div class="tabs">${['학과공지', '과제·시험', '대외활동', '개인'].map((c) => `<span${D.cat === c ? ' class="on"' : ''} data-act="cat" data-arg="${c}">${c}</span>`).join('')}</div></div>
  <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px;">
    <div style="display:flex;flex-direction:column;gap:8px;"><span class="lbl" style="display:flex;align-items:center;gap:6px;">마감 날짜<span class="chip" style="height:18px;padding:0 6px;font-size:10px;color:${WH};background:#EAF0FF;">${dd(n)}</span></span><a class="inp press" data-act="openDeadline" style="justify-content:space-between;cursor:pointer;font-weight:500;">${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}${svg('cal', 16, '#9AA3B2', 2)}</a></div>
    <div style="display:flex;flex-direction:column;gap:8px;"><span class="lbl">마감 시간</span><button class="inp press" data-act="pickTime" data-arg="edit" style="justify-content:space-between;cursor:pointer;font-weight:500;">${D.time}${svg('clock', 16, '#9AA3B2', 2)}</button></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px;">
    <div style="display:flex;justify-content:space-between;align-items:center;"><span class="lbl">마감 알림</span><span class="c2">${S.settings.time}에 · ${remOn}개 켜짐</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 44px;gap:6px;">${rb}<button class="press" data-act="addCustom" aria-label="알림 시간 직접 지정" style="height:44px;border-radius:10px;border:1px dashed #C9CFD9;background:#fff;display:flex;align-items:center;justify-content:center;color:${WH};cursor:pointer;">${svg('plus', 16, WH, 2.4)}</button></div>
    ${customs}
  </div>
  <div style="display:flex;flex-direction:column;gap:8px;"><span class="lbl">원문 링크 <span style="font-weight:500;color:#9AA3B2;">${from}</span></span>${link}</div>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;"><span class="lbl">중요도</span><div style="display:grid;grid-template-columns:repeat(3, 64px);gap:6px;">${impBtn('낮음')}${impBtn('보통')}${impBtn('높음')}</div></div>
  <div style="display:flex;flex-direction:column;gap:8px;">
    <div style="display:flex;justify-content:space-between;align-items:center;"><span class="lbl">메모</span><span class="c2" id="memoCnt">${D.memo.length}/200 · 상세·알림에 표시</span></div>
    <textarea class="inp" rows="2" data-in="memo" maxlength="200" placeholder="준비물, 제출 방법, 참고할 내용을 적어두세요" style="height:auto;min-height:64px;padding:10px 14px;line-height:20px;font-size:14px;resize:none;display:block;">${esc(D.memo)}</textarea>
  </div>
</div>
<div style="flex:none;padding:12px 20px 20px;">
  <a class="btn press" data-act="saveEdit" style="width:100%;background:${WH};color:#fff;">저장</a>
</div>`;
    return frame(body + (U.sheet === 'deadline' ? deadlineSheet() : ''));
  }

  // ───── 4-1. 마감 날짜 바텀시트 ─────
  function quick() {
    const t = TODAY;
    return [['오늘', t], ['내일', addD(t, 1)], ['이번 주 금요일', addD(t, (5 - t.getDay() + 7) % 7)], ['+1주', addD(t, 7)], ['월말', new Date(t.getFullYear(), t.getMonth() + 1, 0)]].map(([l, d]) => [l, ymd(d)]);
  }
  function deadlineSheet() {
    const sd = U.sd, n = diff(sd.date), [y, m] = sd.month;
    const rel = n === 0 ? '오늘 마감' : n > 0 ? `오늘(${TODAY.getMonth() + 1}월 ${TODAY.getDate()}일)부터 ${n}일 뒤` : `${-n}일 지남`;
    return `<div aria-hidden="true" data-act="closeSheet" style="position:absolute;inset:0;background:rgba(26,28,34,.42);"></div>
<div role="dialog" aria-label="마감 날짜 선택" style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -12px 40px rgba(26,28,34,.18);display:flex;flex-direction:column;padding:8px 20px 20px;gap:14px;max-height:100%;overflow-y:auto;">
  <span aria-hidden="true" style="width:36px;height:4px;border-radius:2px;background:#D5DAE3;align-self:center;flex:none;"></span>
  <div style="display:flex;align-items:center;justify-content:space-between;height:36px;flex:none;"><span style="font-size:16px;font-weight:700;letter-spacing:-.02em;">마감 날짜</span><a class="ib press" data-act="closeSheet" aria-label="닫기" style="margin-right:-10px;">${svg('x', 20, '#1A1C22', 2)}</a></div>
  <div class="well" style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex:none;">
    <span style="display:flex;flex-direction:column;gap:3px;"><span style="font-size:20px;font-weight:800;letter-spacing:-.03em;">${mdw(sd.date)}</span><span class="c">${rel} · ${sd.time}</span></span>
    <span style="display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 14px;border-radius:12px;background:${WH};color:#fff;font-size:18px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;">${dd(n)}</span>
  </div>
  <div style="display:flex;gap:6px;overflow:hidden;flex:none;">${quick().map(([l, s]) => `<span class="chip press" data-act="sheetDay" data-arg="${s}" style="height:32px;padding:0 12px;border-radius:999px;font-size:13px;font-weight:600;${s === sd.date ? `color:#fff;background:${WH};` : 'color:#4B5261;background:#F5F7FB;'}cursor:pointer;">${l}</span>`).join('')}</div>
  <div class="card" style="padding:6px 8px 8px;">
    <div style="display:flex;align-items:center;justify-content:space-between;height:40px;padding-left:6px;"><span style="font-size:15px;font-weight:700;letter-spacing:-.02em;">${y}년 ${m + 1}월</span><span style="display:flex;"><button class="ib press" data-act="sheetMonth" data-arg="-1" aria-label="이전 달">${svg('left', 18, '#4B5261', 2)}</button><button class="ib press" data-act="sheetMonth" data-arg="1" aria-label="다음 달">${svg('right', 18, '#4B5261', 2)}</button></span></div>
    ${weekHead}${monthGrid(y, m, sd.date, 'sheet')}
  </div>
  <div class="card" style="overflow:hidden;">
    <div class="row" data-act="pickTime" data-arg="sheet" style="justify-content:space-between;cursor:pointer;"><span style="font-size:15px;font-weight:600;">마감 시간</span><span style="display:inline-flex;align-items:center;gap:6px;font-size:15px;font-weight:600;color:${WH};">${sd.time}${svg('right2', 16, WH, 2)}</span></div>
  </div>
  <a class="btn press" data-act="applyDeadline" style="width:100%;background:${WH};color:#fff;flex:none;">${dd(n)}로 설정</a>
</div>`;
  }

  // ───── 5. 알림 탭 ─────
  function alertIcon(a) {
    const it = find(a.itemId);
    if (a.type === 'notice') return ['mega', WH, '#EAF0FF'];
    if (a.type === 'saved') return ['grip', WH, '#EAF0FF'];
    if (a.type === 'done') return ['check', '#2FBF71', '#E6F7EE'];
    const cat = it ? it.cat : '과제·시험';
    if (cat === '과제·시험' && /시험|고사|퀴즈/.test(a.title)) return ['book', '#E5484D', '#FDECEC'];
    const c = CAT[cat] || CAT['개인'];
    return [c.ic, c.c, c.bg];
  }
  function alertChip(a) {
    if (a.type === 'done') return ['#2FBF71', '#E6F7EE'];
    if (/시간 전/.test(a.chip)) return ['#D98D06', '#FFF4DE'];
    if (a.type === 'deadline' && (a.chip === 'D-1' || a.chip === 'D-Day')) return ['#fff', '#E5484D'];
    return [WH, '#EAF0FF'];
  }
  function vAlerts() {
    const tabs = ['전체', '안 읽음', '마감', '공지'];
    const unread = ALERTS.filter((a) => !a.read).length;
    const list = ALERTS.filter((a) => [true, !a.read, a.type === 'deadline' || a.type === 'start', a.type === 'notice'][U.alertTab]);
    const groups = [['오늘', []], ['이번 주', []], ['지난주', []]];
    for (const a of list) { const n = Math.round((TODAY - midnight(new Date(a.at))) / 864e5); groups[n <= 0 ? 0 : n < 7 ? 1 : 2][1].push(a); }
    const item = (a, last) => {
      const [ic, c, bg] = alertIcon(a), [cc, cb] = alertChip(a), d = new Date(a.at), n = Math.round((TODAY - midnight(d)) / 864e5);
      const right = n <= 0 ? hm(d) : n < 14 ? d.getDate() + '일' : `${d.getMonth() + 1}/${d.getDate()}`;
      return `<a data-act="openAlert" data-arg="${a.id}" class="press" style="display:flex;gap:12px;padding:12px 16px 12px 14px;align-items:flex-start;${last ? '' : 'border-bottom:1px solid #EEF1F6;'}${a.read ? 'opacity:.72;' : ''}">${a.read ? '<span style="width:7px;flex:none;"></span>' : `<span style="width:7px;height:7px;border-radius:999px;background:${WH};flex:none;margin-top:16px;"></span>`}<span style="width:38px;height:38px;border-radius:11px;background:${bg};display:inline-flex;align-items:center;justify-content:center;flex:none;">${svg(ic, 18, c, 2)}</span><span style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0;"><span style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><span style="font-size:15px;font-weight:${a.read ? 600 : 700};line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.title)}</span><span class="c2" style="flex:none;">${right}</span></span><span style="display:flex;align-items:center;gap:6px;min-width:0;"><span class="chip" style="color:${cc};background:${cb};height:20px;padding:0 6px;">${esc(a.chip)}</span><span class="c" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.sub)}</span></span></span></a>`;
    };
    let body = groups.filter(([, g]) => g.length).map(([l, g]) => `<span class="lbl" style="padding:2px 2px 0;">${l}</span>
  <div class="card" style="overflow:hidden;margin-top:-6px;">${g.map((a, k) => item(a, k === g.length - 1)).join('')}</div>`).join('');
    if (!body) body = emptyCard('알림이 없어요');
    return frame(header(`<span style="font-size:22px;font-weight:700;letter-spacing:-.03em;">알림</span>`, `<div style="display:flex;align-items:center;"><button class="press" data-act="readAll" style="height:30px;padding:0 10px;border-radius:8px;border:1px solid #E1E6EE;background:#fff;font-size:12px;font-weight:600;color:#4B5261;cursor:pointer;margin-right:8px;">모두 읽음</button></div>`) +
`<div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:4px 20px 16px;overflow-y:auto;overflow-x:hidden;">
  <div class="card" style="padding:12px 14px;display:flex;align-items:center;gap:12px;background:#F5F7FB;border-color:transparent;">
    <img src="chacha.png" alt="앗!차차" style="width:36px;height:36px;border-radius:10px;object-fit:cover;flex:none;">
    <span style="display:flex;flex-direction:column;gap:1px;flex:1;"><span style="font-size:14px;font-weight:600;">웨일 브라우저 알림</span><span class="c2">브라우저를 닫아도 도착해요</span></span>
    ${tog(S.settings.browser, 'set:browser', '브라우저 알림')}
  </div>
  <div class="tabs">${tabs.map((t, k) => `<span${k === U.alertTab ? ' class="on"' : ''} data-act="alertTab" data-arg="${k}">${t}${k === 1 && unread ? ` <span style="margin-left:4px;color:${WH};">${unread}</span>` : ''}</span>`).join('')}</div>
  ${body}
</div>` + nav('alerts'));
  }

  // ───── 6. 설정 ─────
  function vSettings() {
    const s = S.settings, min = Math.floor((Date.now() - syncAt()) / 60e3);
    const ago = !syncAt() ? '아직 받은 공지 없음' : min < 1 ? '방금 기준' : min < 60 ? min + '분 전 기준' : Math.floor(min / 60) + '시간 전 기준';
    const r = (t, sub, right) => `<div class="row" style="justify-content:space-between;"><span style="display:flex;flex-direction:column;gap:2px;min-width:0;"><span style="font-size:15px;font-weight:500;">${t}</span>${sub ? `<span class="c2">${sub}</span>` : ''}</span>${right}</div>`;
    const sec = (l, rows) => `<div style="display:flex;flex-direction:column;gap:8px;"><span class="lbl" style="padding:0 2px;">${l}</span><div class="card" style="overflow:hidden;">${rows}</div></div>`;
    const [h, m] = s.time.split(':').map(Number);
    const timeTxt = `${h < 12 ? '오전' : '오후'} ${pad(h > 12 ? h - 12 : h)}:${pad(m)}`;
    const dept = S.depts.length ? S.depts[0] + (S.depts.length > 1 ? ` 외 ${S.depts.length - 1}개` : '') : '학과 미선택';
    return frame(header(`<span style="font-size:22px;font-weight:700;letter-spacing:-.03em;">설정</span>`, `<div style="display:flex;align-items:center;"><span style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:800;letter-spacing:-.03em;color:${WH};"><img src="chacha.png" alt="앗!차차" style="width:24px;height:24px;border-radius:7px;object-fit:cover;flex:none;">앗!차차</span></div>`) +
`<div style="flex:1;display:flex;flex-direction:column;gap:20px;padding:4px 20px 16px;overflow-y:auto;overflow-x:hidden;">
  <a class="card press" data-act="changeDept" style="padding:16px;display:flex;align-items:center;gap:12px;background:#F5F7FB;border-color:transparent;">
    <span style="width:44px;height:44px;border-radius:12px;background:#fff;display:inline-flex;align-items:center;justify-content:center;">${svg('cap', 22, WH, 1.8)}</span>
    <span style="display:flex;flex-direction:column;gap:2px;flex:1;"><span class="c2">충남대학교</span><span style="font-size:16px;font-weight:700;letter-spacing:-.02em;">${esc(dept)}</span></span>
    <span style="font-size:13px;font-weight:600;color:${WH};">변경</span>
  </a>
  ${sec('학교 연동', r('학과 공지 자동 연동', ago + ' · 마감이 있는 글만', tog(s.sync, 'set:sync')))}
  ${sec('새 일정의 기본 알림', r('D-7', '', tog(s.d7, 'set:d7')) + r('D-3', '', tog(s.d3, 'set:d3')) + r('D-1', '', tog(s.d1, 'set:d1')) + r('D-Day', '', tog(s.d0, 'set:d0')) +
    `<div class="row" data-act="pickTime" data-arg="settings" style="justify-content:space-between;cursor:pointer;"><span style="display:flex;flex-direction:column;gap:2px;min-width:0;"><span style="font-size:15px;font-weight:500;">알림 시각</span></span><span style="font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">${timeTxt}${svg('right', 16, '#C9CFD9', 2)}</span></div>`)}
  ${sec('알림 받는 곳', r('웨일 브라우저 알림', '화면 우측 하단 팝업', tog(s.browser, 'set:browser')) + r('앱 알림 탭', '', tog(s.appTab, 'set:appTab')))}
  ${sec('드래그로 담기', r('글을 드래그하면 버튼 표시', '링커리어·학교 홈페이지 등 모든 사이트', tog(s.dragBtn, 'set:dragBtn')) + r('마감일 자동 인식', '드래그한 글에서 날짜를 찾아 채움', tog(s.autoDetect, 'set:autoDetect')))}
</div>` + nav('settings'));
  }

  // ───── 7. 드래그 → 사이드바 스크랩 ─────
  function vScrap() {
    const sc = U.scrap, d = parseD(sc.date), n = diff(sc.date);
    const others = onDate(sc.date);
    const pending = `<div style="display:flex;gap:14px;padding:14px 16px;align-items:flex-start;background:#F5F7FB;">
        <span style="width:44px;flex:none;display:flex;flex-direction:column;gap:2px;padding-top:1px;"><span style="font-size:14px;font-weight:700;">${sc.time}</span><span class="c2" style="font-size:11px;">마감</span></span>
        <span style="display:flex;flex-direction:column;gap:5px;flex:1;min-width:0;">
          <span style="display:flex;align-items:center;gap:6px;">${chip(sc.cat, CAT[sc.cat].c, CAT[sc.cat].bg)}${chip(dd(n), WH, '#EAF0FF')}<span class="chip" style="margin-left:auto;color:#7B8494;background:#EEF1F6;">저장 전</span></span>
          <span style="font-size:15px;font-weight:600;line-height:20px;">${esc(sc.title)} 마감</span>
          <span class="c" style="display:flex;gap:8px;align-items:center;">${remText({ rem: null })} 알림<a href="${esc(sc.url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:${WH};font-weight:600;">원문${svg('ext', 11, WH, 2.4)}</a></span>
        </span>
      </div>`;
    const rest = others.map((i) => `<div style="border-top:1px solid #EEF1F6;">${row(i, 'date')}</div>`).join('');
    return frame(header(logo(), topIcons) +
`<div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:0 20px 16px;overflow-y:auto;overflow-x:hidden;">
    <div style="border:1.5px dashed ${WH};border-radius:12px;background:#EAF0FF;padding:12px 14px;display:flex;flex-direction:column;gap:4px;flex:none;">
      <span style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:12px;font-weight:700;color:${WH};display:inline-flex;align-items:center;gap:6px;">${svg('grip', 13, WH, 2.4)}스크랩한 내용</span><button class="ib press" data-act="cancelScrap" style="width:28px;height:28px;margin:-6px -8px -6px 0;" aria-label="스크랩 취소">${svg('x', 14, '#7B8494', 2.2)}</button></span>
      <span style="font-size:15px;font-weight:700;letter-spacing:-.02em;">${esc(sc.title)}${sc.found ? ` <span style="color:${WH};">~${d.getMonth() + 1}.${d.getDate()}</span>` : ''}</span>
      <span class="c2" style="display:inline-flex;align-items:center;gap:4px;">${svg('link', 12, '#9AA3B2', 2)}${esc(shortUrl(sc.url))}</span>
    </div>
    ${calCard(sc.date, 'scrap')}
    <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 2px 0;"><span style="font-size:16px;font-weight:700;letter-spacing:-.02em;">${mdl(sc.date)}</span><span class="c2">${sc.auto ? '마감일 자동 선택' : '직접 선택'}</span></div>
    <div class="card" style="overflow:hidden;">${pending}${rest}</div>
  </div>
  <div style="flex:none;display:flex;gap:8px;padding:12px 20px 16px;border-top:1px solid #EEF1F6;">
    <a class="btn press" data-act="scrapEdit" style="flex:none;width:96px;background:#F5F7FB;color:#1A1C22;font-size:14px;">알림 수정</a>
    <a class="btn press" data-act="scrapSave" style="flex:1;background:${WH};color:#fff;">${d.getMonth() + 1}월 ${d.getDate()}일에 저장</a>
  </div>`);
  }
  function scrapToItem(sc) {
    return { id: 'u' + Date.now(), title: sc.title + ' 마감', cat: sc.cat, date: sc.date, time: sc.time, kind: '마감', sub: siteName(sc.url), src: 'drag', url: sc.url, memo: sc.memo || '',
      importance: '보통', rem: { d7: S.settings.d7, d3: S.settings.d3, d1: S.settings.d1, d0: S.settings.d0 }, custom: [] };
  }
  function savedAlert(item) {
    const d = parseD(item.date), r = getRem(item);
    const on = [['d7', 'D-7'], ['d3', 'D-3'], ['d1', 'D-1'], ['d0', 'D-Day']].filter(([k]) => r[k]).map(([, l]) => l).join('·');
    pushAlert({ itemId: item.id, type: 'saved', chip: '저장됨', title: item.title, sub: `${d.getMonth() + 1}/${d.getDate()}(${W[d.getDay()]}) ${item.time} · ${on ? on + ' 알림 켜짐' : '알림 없음'}` });
  }

  // ───── 렌더 ─────
  const $ = (id) => document.getElementById(id);
  const side = $('side');
  // 학과 공지 수집 시각: 고른 학과 중 가장 오래된 기준
  function syncAt() {
    const t = S.depts.map((n) => NOTICES[Core.deptId(LIST, n)]).filter(Boolean).map((d) => +new Date(d.updated || 0));
    return t.length ? Math.min(...t) : 0;
  }
  function renderSide() {
    const v = { onboard: vOnboard, main: vMain, day: vDay, edit: vEdit, alerts: vAlerts, settings: vSettings }[U.view];
    const scroller = side.querySelector('[style*="overflow-y:auto"]'), top = scroller ? scroller.scrollTop : 0, sameView = side.dataset.v === U.view;
    side.innerHTML = v();
    side.dataset.v = U.view;
    const sc2 = side.querySelector('[style*="overflow-y:auto"]');
    if (sc2 && sameView) sc2.scrollTop = top;
  }
  function go(v) { U.view = v; U.sheet = null; renderSide(); }

  // ───── 편집 흐름 ─────
  function openEdit(id) {
    const it = find(id); if (!it) return;
    U.back = U.view === 'edit' ? U.back : U.view;
    U.draft = { ...it, rem: { ...getRem(it) }, custom: [...(it.custom || [])], importance: it.importance || '보통', memo: it.memo || '', url: it.url || '', isNew: false };
    go('edit');
  }
  function commitDraft() {
    const D = U.draft;
    if (!D.title.trim()) { const f = $('fTitle'); f && f.focus(); return; }
    const { isNew, fromScrap, ...item } = D;
    item.title = item.title.trim();
    if (isNew && !fromScrap) item.kind = item.cat === '개인' ? '시작' : '마감';
    upsert(item);
    if (isNew) savedAlert(item);
    if (fromScrap) U.scrap = null;
    U.sel = item.date; U.month = [parseD(item.date).getFullYear(), parseD(item.date).getMonth()];
    go('day');
  }

  // ───── 이벤트 ─────
  function pick(input, value, x, y, cb) {
    input.style.left = x + 'px'; input.style.top = y + 'px'; input.style.position = 'fixed';
    input.value = value;
    input.onchange = () => { if (input.value) cb(input.value); };
    try { input.showPicker(); } catch (e) { input.focus(); input.click(); }
  }
  function refreshDeptUi(sheet) {
    $('deptList').innerHTML = deptRows(sheet);
    $('selChips').innerHTML = sheet ? sheetChips() : selChips();
    $('colTabs').innerHTML = collegeTabs(sheet);
    $('ctaBtn').textContent = sheet ? sheetCta() : cta();
  }

  side.addEventListener('click', (e) => {
    if (e.target.closest('a[href]')) return; // 원문 링크는 그대로 열기
    const el = e.target.closest('[data-go],[data-act]');
    if (!el) return;
    if (el.dataset.go) {
      e.preventDefault();
      const [v, arg] = el.dataset.go.split(':');
      if (v === 'day') { U.sel = arg; go('day'); }
      else if (v === 'edit') openEdit(arg);
      else if (v === 'new') { U.back = U.view; U.draft = newDraft(arg); go('edit'); }
      else go(v);
      return;
    }
    const a = el;
    const act = a.dataset.act, arg = a.dataset.arg;
    const D = U.draft;
    switch (act) {
      case 'skip': S.depts = []; S.onboarded = true; S.deptAt = Date.now(); save(); U.q = ''; go('main'); break;
      case 'startDepts': S.depts = [...U.tmp]; S.onboarded = true; S.deptAt = Date.now(); save().then(refreshNotices); U.q = ''; go('main'); break;
      case 'pickDept': U.tmp = U.tmp.includes(arg) ? U.tmp.filter((x) => x !== arg) : [...U.tmp, arg]; refreshDeptUi(U.sheet === 'dept'); break;
      case 'college': U.ci = +arg; U.q = ''; const q = $('q'); if (q) q.value = ''; refreshDeptUi(U.sheet === 'dept'); break;
      case 'openDeptSheet': U.tmp = [...S.depts]; U.q = ''; U.ci = 0; U.sheet = 'dept'; renderSide(); break;
      case 'saveDepts': S.depts = [...U.tmp]; S.deptAt = Date.now(); save().then(refreshNotices); U.sheet = null; U.q = ''; renderSide(); break;
      case 'changeDept': U.tmp = [...S.depts]; U.q = ''; U.ci = 0; go('onboard'); break;
      case 'closeSheet': U.sheet = null; renderSide(); break;
      case 'month': { let [y, m] = U.month; m += +arg; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } U.month = [y, m]; renderSide(); break; }
      case 'today': U.month = [TODAY.getFullYear(), TODAY.getMonth()]; U.sel = ymd(TODAY); renderSide(); break;
      case 'del': remove(arg); if (U.view === 'edit') { U.sel = D.date; go('day'); } else renderSide(); break;
      case 'cat': D.cat = arg; renderSide(); break;
      case 'rem': D.rem[arg] = !D.rem[arg]; renderSide(); break;
      case 'imp': D.importance = arg; renderSide(); break;
      case 'clearUrl': D.url = ''; renderSide(); break;
      case 'delCustom': D.custom.splice(+arg, 1); renderSide(); break;
      case 'addCustom': { const base = new Date(at(D.date, D.time) - 3 * 3600e3); const v = ymd(base) + 'T' + hm(base);
        pick($('dtPick'), v, e.clientX, e.clientY, (val) => { D.custom.push(new Date(val).toISOString()); renderSide(); }); break; }
      case 'pickTime': {
        const cur = arg === 'edit' ? D.time : arg === 'sheet' ? U.sd.time : S.settings.time;
        pick($('timePick'), cur, e.clientX, e.clientY, (val) => {
          if (arg === 'edit') D.time = val; else if (arg === 'sheet') U.sd.time = val; else { S.settings.time = val; save(); }
          renderSide();
        }); break; }
      case 'openDeadline': { const d = parseD(D.date); U.sd = { date: D.date, time: D.time, month: [d.getFullYear(), d.getMonth()] }; U.sheet = 'deadline'; renderSide(); break; }
      case 'sheetDay': { U.sd.date = arg; const d = parseD(arg); U.sd.month = [d.getFullYear(), d.getMonth()]; renderSide(); break; }
      case 'sheetMonth': { let [y, m] = U.sd.month; m += +arg; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } U.sd.month = [y, m]; renderSide(); break; }
      case 'applyDeadline': D.date = U.sd.date; D.time = U.sd.time; U.sheet = null; renderSide(); break;
      case 'closeEdit': go(U.back || 'main'); break;
      case 'saveEdit': commitDraft(); break;
      case 'alertTab': U.alertTab = +arg; renderSide(); break;
      case 'readAll': Core.mutate('alerts', (l) => l.map((x) => ({ ...x, read: true })), []); break;
      case 'openAlert': { const al = ALERTS.find((x) => x.id === arg); if (al) Core.mutate('alerts', (l) => l.map((x) => (x.id === arg ? { ...x, read: true } : x)), []); if (al && find(al.itemId)) openEdit(al.itemId); break; }
      case 'scrapDay': U.scrap.date = arg; U.scrap.auto = false; renderSide(); break;
      case 'cancelScrap': U.scrap = null; go('main'); break;
      case 'scrapSave': { const it = scrapToItem(U.scrap); upsert(it); savedAlert(it); U.scrap = null; U.sel = it.date; go('day'); break; }
      case 'scrapEdit': U.back = 'main'; U.draft = { ...scrapToItem(U.scrap), isNew: true, fromScrap: true }; go('edit'); break;
      default:
        if (act.startsWith('set:')) { const k = act.slice(4); S.settings[k] = !S.settings[k]; save(); renderSide(); }
    }
  });
  side.addEventListener('input', (e) => {
    const f = e.target.dataset.in; if (!f) return;
    if (f === 'q') { U.q = e.target.value; $('deptList').innerHTML = deptRows(U.sheet === 'dept'); $('colTabs').innerHTML = collegeTabs(U.sheet === 'dept'); return; }
    U.draft[f] = e.target.value;
    if (f === 'memo') $('memoCnt').textContent = e.target.value.length + '/200 · 상세·알림에 표시';
  });

  // ───── 드래그 스크랩 수신(content.js → background → storage) ─────
  const refreshNotices = () => chrome.runtime.sendMessage({ type: 'refresh' }).catch(() => {});
  function takeScrap(p) {
    if (!p) return;
    chrome.storage.local.remove('pendingScrap');
    chrome.runtime.sendMessage({ type: 'clearBadge' }).catch(() => {});
    const r = Extract.splitDrag(p.text, TODAY);
    const dl = S.settings.autoDetect ? r.deadline : null;
    const date = dl ? dl.date : ymd(TODAY);
    U.scrap = { title: r.title.slice(0, 100), memo: r.memo, url: p.url, cat: /cnu\.ac\.kr/.test(p.url) ? '학과공지' : '대외활동', date, time: (dl && dl.time) || '23:59', auto: !!dl, found: !!dl };
    U.month = [parseD(date).getFullYear(), parseD(date).getMonth()];
    if (!S.onboarded) { S.onboarded = true; S.deptAt = Date.now(); save(); }
    go('main');
  }
  function takeFocus(id) {
    if (!id) return;
    chrome.storage.local.remove('focus');
    if (find(id)) openEdit(id);
  }

  // ───── 시작 ─────
  chrome.storage.onChanged.addListener((c) => {
    if (c.alerts) ALERTS = c.alerts.newValue || [];
    if (c.notices) NOTICES = c.notices.newValue || {};
    if (c.S && c.S.newValue && JSON.stringify(c.S.newValue) !== JSON.stringify(S)) S = { ...c.S.newValue, settings: { ...Core.DEF_SETTINGS, ...c.S.newValue.settings } };
    if (c.pendingScrap && c.pendingScrap.newValue) return takeScrap(c.pendingScrap.newValue);
    if (c.focus && c.focus.newValue) return takeFocus(c.focus.newValue);
    if ((c.alerts || c.notices || c.S) && U.view !== 'edit' && U.view !== 'onboard' && !U.sheet) renderSide();
  });
  setInterval(() => { const t = midnight(new Date()); if (+t !== +TODAY) { TODAY = t; if (U.view !== 'edit') renderSide(); } }, 60e3);

  (async () => {
    ({ S, alerts: ALERTS, notices: NOTICES } = await Core.load());
    LIST = await Core.colleges();
    COLLEGES = LIST.map((c) => ({ name: c.name, depts: c.depts.map((d) => d.name) }));
    U.view = S.onboarded ? 'main' : 'onboard';
    renderSide();
    const r = await chrome.storage.local.get(['pendingScrap', 'focus']);
    takeScrap(r.pendingScrap);
    takeFocus(r.focus);
    refreshNotices();
  })();
})();
