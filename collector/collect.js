// 학내 게시판 수집 → site/data/{학과id}.json. GitHub Actions에서 하루 4회 실행.
// CNU_KEY=... node collector/collect.js
const fs = require('fs');
const path = require('path');
const E = require('../extension/extract.js');
const { fetchAcademic } = require('./academic.js');

const API = 'https://api.cnu.ac.kr/svc/offcam/pub/homepageboardContents';
const LIST_API = 'https://api.cnu.ac.kr/svc/offcam/pub/cmsBoard';
const LATEST = 50;
const OUT = path.join(__dirname, '..', 'site', 'data');

// 게시판 1개 호출. 키가 URL에 남지 않도록 POST form만 쓴다(학교 요구사항).
async function post(url, params) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(30000),
  });
}
async function fetchBoard(no, key) {
  const r = await post(API, { AUTH_KEY: key, P_board_no: String(no) });
  if (!r.ok) throw new Error(`board ${no}: HTTP ${r.status}`);
  const j = await r.json();
  if (!Array.isArray(j.RESULT)) throw new Error(`board ${no}: ${JSON.stringify(j.OutBlock || j).slice(0, 120)}`);
  return j.RESULT;
}

const timeOf = (x) => (x.update_dt && +x.update_dt.time) || 0; // update_dt가 빠진 글도 있을 수 있다

// API 응답 → 달력 일정. 정보형·날짜 없는 글은 버린다. 본문은 저장하지 않는다.
function toItems(rows, board) {
  return rows
    .slice()
    .sort((a, b) => timeOf(b) - timeOf(a))
    .slice(0, LATEST)
    .flatMap((x) => {
      const type = E.classify(x.article_title);
      if (type === 'info') return [];
      const d = E.extractDeadline(x.article_title, E.htmlText(x.article_text), new Date(timeOf(x) || Date.now()));
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

// 같은 공지를 여러 게시판에 올리거나 다시 올린 경우: 제목·날짜·시간이 같으면 하나로.
// items는 매핑 순서(대표 게시판 먼저)·게시판 안에서는 최신 글 먼저라 앞의 것을 남기고, 겹친 수는 also로.
function mergeSame(items) {
  const byKey = new Map();
  for (const i of items) {
    const k = i.title + '|' + i.date + '|' + (i.time || '');
    const f = byKey.get(k);
    if (!f) byKey.set(k, { ...i });
    else if (f.id !== i.id) f.also = (f.also || 0) + 1;
  }
  return [...byKey.values()];
}

function readJson(f) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; }
}

async function main() {
  const key = process.env.CNU_KEY;
  if (!key) throw new Error('CNU_KEY 환경변수가 없습니다');
  const colleges = readJson(path.join(__dirname, '..', 'extension', 'departments.json'));
  fs.mkdirSync(OUT, { recursive: true });

  // 게시판 점검용: 학교 API 게시판 목록(1건 호출)
  let listed = null;
  try { const r = await post(LIST_API, { AUTH_KEY: key }); listed = new Map((await r.json()).RESULT.map((b) => [+b.board_no, b.board_nm.trim()])); } catch (e) { console.error('cmsBoard:', e.message); }

  const cache = new Map(); // board no → items | Error (학과끼리 게시판을 공유한다)
  const report = {}; // board no → 점검 결과(커밋되는 공개 파일이라 키·본문은 넣지 않는다)
  let calls = 0, fails = 0;
  for (const c of colleges) for (const d of c.depts) {
    if (!d.boards.length) continue;
    const file = path.join(OUT, d.id + '.json');
    const prev = readJson(file);
    const items = [];
    let ok = true;
    for (const b of d.boards) {
      if (!cache.has(b.no)) {
        try {
          calls++;
          const rows = await fetchBoard(b.no, key);
          const items = toItems(rows, b);
          cache.set(b.no, items);
          const latest = rows.reduce((m, x) => Math.max(m, timeOf(x)), 0);
          report[b.no] = { name: b.name, inList: listed ? listed.has(b.no) : null, rows: rows.length, latest: latest ? new Date(latest).toISOString().slice(0, 10) : null, items: items.length, url: !!b.url };
        } catch (e) { fails++; console.error(e.message); cache.set(b.no, e); report[b.no] = { name: b.name, inList: listed ? listed.has(b.no) : null, error: e.message, url: !!b.url }; }
      }
      const got = cache.get(b.no);
      if (got instanceof Error) {
        ok = false;
        items.push(...((prev && prev.items) || []).filter((i) => i.board === b.no)); // 실패한 게시판은 지난 수집분 유지
      } else items.push(...got);
    }
    const uniq = mergeSame(items).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const updated = ok ? new Date().toISOString() : (prev && prev.updated) || null;
    fs.writeFileSync(file, JSON.stringify({ updated, ok, items: uniq }) + '\n');
  }
  // 학교 학사일정(수강신청·계절학기 등). 실패하면 지난 파일 유지
  try {
    const items = await fetchAcademic();
    if (items.length) fs.writeFileSync(path.join(OUT, 'academic.json'), JSON.stringify({ updated: new Date().toISOString(), items }) + '\n');
    console.log(`학사일정 ${items.length}건`);
  } catch (e) { console.error('학사일정:', e.message); }

  fs.writeFileSync(path.join(OUT, '_report.json'), JSON.stringify({ at: new Date().toISOString(), calls: calls + 1, fails, boards: report }, null, 1) + '\n');
  console.log(`호출 ${calls + 1}건(목록 1건 포함), 실패 ${fails}건`);
  if (calls && fails === calls) process.exit(1); // 전부 실패 = 키 만료·API 변경. Actions 실패 메일로 알린다
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { toItems, mergeSame };
