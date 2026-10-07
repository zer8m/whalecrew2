// 마감일 추출 — 기획서 32~35p 규칙(정규식 + 키워드). LLM 없음. 수집기(node)와 확장앱이 같이 쓴다.
(function (root) {
  const KW = /(마감|기한|기간|접수|신청|제출|모집|까지)/;
  // 2026.9.30 · '26.9.30 · 9.30 · 9월 30일 + (요일) + 18:00 | 오후 5시 | 정오
  const DATE_RE = /(?<![\d'])(?:(?:(\d{4})|'(\d{2}))\s*[.\-/년]\s*)?(\d{1,2})\s*([./\-]|월)\s*(\d{1,2})(?!\d)\s*일?\.?\s*(?:\(\s*[월화수목금토일]\s*\))?\.?\s*(?:(\d{1,2}):(\d{2})|(오전|오후)?\s*(\d{1,2})\s*시(?!간)|(정오))?/g;

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  function timeOf(hh, mm, ampm, h2, noon) {
    if (noon) return '12:00';
    if (hh) return +hh < 24 ? pad(+hh) + ':' + mm : null;
    if (!h2) return null;
    let h = +h2;
    if (ampm === '오후' && h < 12) h += 12;
    return h < 24 ? pad(h) + ':00' : null;
  }

  // 한 줄에서 날짜들을 찾는다. 연도가 없으면 같은 줄 앞 날짜의 연도 → 게시일 연도 순으로 채운다.
  function findDates(line, base) {
    const out = [];
    let lastYear = null;
    for (const m of line.matchAll(DATE_RE)) {
      const [, y4, y2, mo, sep, d, hh, mm, ampm, h2, noon] = m;
      const y = y4 ? +y4 : y2 ? 2000 + +y2 : null;
      if (!y && sep === '-') continue; // 042-821-1234 같은 전화번호 배제
      const month = +mo, day = +d;
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;
      let year = y || lastYear || base.getFullYear();
      let date = new Date(year, month - 1, day);
      // 연도 없는 날짜가 게시일보다 한참 앞이면 내년으로 본다
      if (!y && !lastYear && date < new Date(base.getFullYear(), base.getMonth(), base.getDate() - 180)) {
        year += 1;
        date = new Date(year, month - 1, day);
      }
      lastYear = year;
      out.push({ date: ymd(date), time: timeOf(hh, mm, ampm, h2, noon), index: m.index });
    }
    return out;
  }

  // 기간(~)이면 끝 날짜, 아니면 줄의 마지막 날짜
  function pickFromLine(line, base) {
    const dates = findDates(line, base);
    if (!dates.length) return null;
    const tilde = line.lastIndexOf('~');
    const after = tilde >= 0 ? dates.filter((x) => x.index > tilde) : [];
    const pick = after.length ? after[0] : dates[dates.length - 1];
    return { date: pick.date, time: pick.time };
  }

  // 제목의 마감 날짜 → 본문의 접수기간·제출기한 → 본문 아무 날짜 순
  function extractDeadline(title, text, base) {
    const lines = String(text || '').replace(/~\s*\n/g, '~ ').split(/\n|■|•|□|◦/).map((s) => s.trim()).filter(Boolean);
    const fromTitle = title && pickFromLine(title, base);
    if (fromTitle) return fromTitle;
    for (const l of lines) if (KW.test(l)) { const r = pickFromLine(l, base); if (r) return r; }
    for (const l of lines) { const r = pickFromLine(l, base); if (r) return r; }
    return null;
  }

  // 마감형 → 달력+알림, 행사형 → 달력, 정보형 → 피드만
  function classify(title) {
    if (/(신청|접수|제출|모집|마감|선발|수요조사|참여기간|까지)/.test(title)) return 'deadline';
    if (/(특강|설명회|OT|오리엔테이션|시험|개최|행사|발표|박람회|축전)/.test(title)) return 'event';
    return 'info';
  }

  // 달력에 보일 제목: 머리말 [태그]·★, 날짜가 든 꼬리 (기간…)·: 날짜, 끝의 안내 제거
  const HAS_DATE = /\d{1,2}\s*[./]\s*\d{1,2}/;
  function cutTail(s) {
    for (let i = 4; i < s.length; i++) {
      if (s[i] === ':' && HAS_DATE.test(s.slice(i))) return s.slice(0, i);
      if (s[i] !== '(') continue;
      let depth = 0, j = i;
      for (; j < s.length; j++) { if (s[j] === '(') depth++; else if (s[j] === ')' && --depth === 0) break; }
      if (HAS_DATE.test(s.slice(i, j + 1))) return s.slice(0, i);
    }
    return s;
  }
  function cleanTitle(t) {
    let s = String(t).replace(/★/g, '').trim();
    const tags = [];
    while (/^\[[^\]]*\]\s*/.test(s)) s = s.replace(/^\[([^\]]*)\]\s*/, (m, x) => (tags.push(x.trim()), ''));
    s = cutTail(s).replace(/\s*(개최\s*)?안내\s*[:.]?\s*$/, '').replace(/\s+/g, ' ').trim();
    // 태그를 떼면 뜻이 사라지는 제목("[조기 졸업 신청] 신청기간: …")은 태그를 살린다
    if (s.length < 8 || /^[가-힣]*기간$/.test(s)) s = (tags.join(' ') + ' ' + s.replace(/^[가-힣]*기간$/, '')).trim();
    return s || String(t).trim();
  }

  // 게시판 본문 HTML → 줄 단위 텍스트
  function htmlText(h) {
    const ent = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', rarr: '→', ldquo: '"', rdquo: '"', middot: '·' };
    return String(h || '')
      .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&(#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCharCode(+e.slice(1)) : ent[e.toLowerCase()] || ' '))
      .replace(/[ \t ]+/g, ' ')
      .replace(/ *\n */g, '\n');
  }

  // 드래그한 덩어리 → 제목 · 마감일 · 메모
  function splitDrag(text, base) {
    const lines = String(text).split(/\n+/).map((s) => s.replace(/^■\s*/, '').trim()).filter(Boolean);
    const title = lines[0] || '';
    const rest = lines.slice(1);
    const deadline = extractDeadline(title, rest.join('\n'), base);
    const memo = rest
      .filter((l) => !findDates(l, base).length)
      .map((l) => l.replace(/\s*:\s*/, ' : ').replace(/\d{2,4}-\d{3,4}-\d{4}/g, '***').replace(/\s*:\s*\*\*\*/, ' ***'))
      .join(' · ')
      .slice(0, 200);
    return { title, deadline, memo };
  }

  const api = { findDates, extractDeadline, classify, cleanTitle, htmlText, splitDrag, ymd };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Extract = api;
})(this);
