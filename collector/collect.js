// 학내 게시판 수집 → site/data/{학과id}.json. GitHub Actions에서 하루 2회 실행.
// CNU_KEY=... node collector/collect.js
const fs = require('fs');
const path = require('path');
const E = require('../extension/extract.js');

const API = 'https://api.cnu.ac.kr/svc/offcam/pub/homepageboardContents';
const LATEST = 50;
const OUT = path.join(__dirname, '..', 'site', 'data');

// 게시판 1개 호출. 키가 URL에 남지 않도록 POST form만 쓴다(학교 요구사항).
async function fetchBoard(no, key) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ AUTH_KEY: key, P_board_no: String(no) }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`board ${no}: HTTP ${r.status}`);
  const j = await r.json();
  if (!Array.isArray(j.RESULT)) throw new Error(`board ${no}: ${JSON.stringify(j.OutBlock || j).slice(0, 120)}`);
  return j.RESULT;
}

// API 응답 → 달력 일정. 정보형·날짜 없는 글은 버린다. 본문은 저장하지 않는다.
function toItems(rows, board) {
  return rows
    .slice()
    .sort((a, b) => b.update_dt.time - a.update_dt.time)
    .slice(0, LATEST)
    .flatMap((x) => {
      const type = E.classify(x.article_title);
      if (type === 'info') return [];
      const d = E.extractDeadline(x.article_title, E.htmlText(x.article_text), new Date(x.update_dt.time));
      if (!d) return [];
      return [{
        id: `${board.no}-${x.article_no}`,
        board: board.no,
        title: E.cleanTitle(x.article_title),
        type,
        date: d.date,
        time: d.time,
        url: board.url ? `${board.url}?mode=view&articleNo=${x.article_no}` : null,
        writer: String(x.writer_nm || '').trim(),
        attach: +x.attach_cnt || 0,
        tag: board.name.split(/\s*[>|-]\s*/).pop(),
      }];
    });
}

function readJson(f) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; }
}

async function main() {
  const key = process.env.CNU_KEY;
  if (!key) throw new Error('CNU_KEY 환경변수가 없습니다');
  const colleges = readJson(path.join(__dirname, '..', 'extension', 'departments.json'));
  fs.mkdirSync(OUT, { recursive: true });

  const cache = new Map(); // board no → items | Error (학과끼리 게시판을 공유한다)
  let calls = 0, fails = 0;
  for (const c of colleges) for (const d of c.depts) {
    if (!d.boards.length) continue;
    const file = path.join(OUT, d.id + '.json');
    const prev = readJson(file);
    const items = [];
    let ok = true;
    for (const b of d.boards) {
      if (!cache.has(b.no)) {
        try { calls++; cache.set(b.no, toItems(await fetchBoard(b.no, key), b)); }
        catch (e) { fails++; console.error(e.message); cache.set(b.no, e); }
      }
      const got = cache.get(b.no);
      if (got instanceof Error) {
        ok = false;
        items.push(...((prev && prev.items) || []).filter((i) => i.board === b.no)); // 실패한 게시판은 지난 수집분 유지
      } else items.push(...got);
    }
    const seen = new Set();
    const uniq = items.filter((i) => !seen.has(i.id) && seen.add(i.id)).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const updated = ok ? new Date().toISOString() : (prev && prev.updated) || null;
    fs.writeFileSync(file, JSON.stringify({ updated, ok, items: uniq }) + '\n');
  }
  console.log(`호출 ${calls}건, 실패 ${fails}건`);
  if (calls && fails === calls) process.exit(1); // 전부 실패 = 키 만료·API 변경. Actions 실패 메일로 알린다
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { toItems };
