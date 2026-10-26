// 학교 학사일정(plus.cnu.ac.kr 학사일정 페이지) → 일정 목록. 공개 페이지라 키가 필요 없다.
const URL_BASE = 'https://plus.cnu.ac.kr/_prog/academic_calendar/?site_dvs_cd=kr&menu_dvs_cd=05020101&year=';
// 신청·취소처럼 기한 안에 행동해야 하는 일정 → 시작·마감 하루 전 알림
const ACTION = /(신청|취소|변경|납부|등록)/;

const pad = (n) => String(n).padStart(2, '0');

// 페이지는 "12월(전년) → 1월 … 12월" 순서의 월 상자로 되어 있다. 달이 줄어들면 해가 바뀐 것.
function parse(html, year) {
  const boxes = [...html.matchAll(/<div class="fl_month[^"]*">\s*<strong>(\d{1,2})월<\/strong>[\s\S]*?<ul>([\s\S]*?)<\/ul>/g)];
  if (!boxes.length) return [];
  let y = +boxes[0][1] === 12 && boxes.length > 1 ? year - 1 : year;
  let prev = 0;
  const out = [];
  for (const [, m, ul] of boxes) {
    if (+m < prev) y++;
    prev = +m;
    for (const [, when, title] of ul.matchAll(/<strong>([^<]+)<\/strong>\s*<span class="list">([^<]+)<\/span>/g)) {
      const d = [...when.matchAll(/(\d{1,2})\.(\d{1,2})/g)].map(([, mm, dd]) => [+mm, +dd]);
      if (!d.length) continue;
      const start = `${y}-${pad(d[0][0])}-${pad(d[0][1])}`;
      let end = null;
      if (d[1]) end = `${d[1][0] < d[0][0] ? y + 1 : y}-${pad(d[1][0])}-${pad(d[1][1])}`;
      const t = title.replace(/\s+/g, ' ').trim();
      out.push({ id: `${start}-${t}`, title: t, start, end, act: ACTION.test(t) });
    }
  }
  // 같은 일정이 두 번 적힌 경우(예: 수강신청 확인 및 변경) 하나만
  const seen = new Set();
  return out.filter((x) => !seen.has(x.id) && seen.add(x.id));
}

// 학교 서버가 해외(GitHub Actions) 접속에 느릴 때가 있어 넉넉히 기다리고 한 번 더 시도한다
async function get(url) {
  for (let k = 0; ; k++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) { if (k) throw new Error(`학사일정: ${e.message}`); }
  }
}

async function fetchAcademic(now = new Date()) {
  const y = now.getFullYear();
  const items = [];
  for (const year of [y, y + 1]) {
    items.push(...parse(await get(URL_BASE + year), year));
  }
  const seen = new Set();
  return items.filter((x) => !seen.has(x.id) && seen.add(x.id));
}

module.exports = { parse, fetchAcademic };

// 직접 갱신: node collector/academic.js → site/data/academic.json (Actions에서 실패할 때 PC에서 돌려 커밋)
if (require.main === module) {
  const out = require('path').join(__dirname, '..', 'site', 'data', 'academic.json');
  fetchAcademic().then((items) => {
    require('fs').writeFileSync(out, JSON.stringify({ updated: new Date().toISOString(), items }) + '\n');
    console.log(`학사일정 ${items.length}건 → ${out}`);
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
