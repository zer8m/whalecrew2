// 글이 0건인 게시판의 대체 후보 찾기: 같은 학과 사이트의 다른 게시판을 한 번씩 조회해 글 수·최근 글 날짜를 본다.
// CNU_KEY=... node collector/probe.js [cmsBoard.json]   → probe-result.json (커밋 금지)
const fs = require('fs');
const path = require('path');

const API = 'https://api.cnu.ac.kr/svc/offcam/pub/homepageboardContents';

async function main() {
  const key = (process.env.CNU_KEY || '').trim();
  if (!key) throw new Error('CNU_KEY 환경변수가 없습니다');
  const rows = JSON.parse(fs.readFileSync(process.argv[2] || 'cmsBoard.json', 'utf8').replace(/^﻿/, '')).RESULT;
  const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'site', 'data', '_report.json'), 'utf8')).boards;

  const empty = new Set(Object.keys(report).filter((n) => report[n].rows === 0).map(Number));
  const sites = new Set(rows.filter((b) => empty.has(+b.board_no)).map((b) => b.site_nm));
  const cand = rows.filter((b) => sites.has(b.site_nm) && !report[b.board_no]);

  const out = [];
  for (const b of cand) {
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ AUTH_KEY: key, P_board_no: b.board_no }), signal: AbortSignal.timeout(30000) });
      const res = (await r.json()).RESULT || [];
      const latest = res.reduce((m, x) => Math.max(m, x.update_dt.time), 0);
      out.push({ site: b.site_nm, no: +b.board_no, name: b.board_nm.trim(), rows: res.length, latest: latest ? new Date(latest).toISOString().slice(0, 10) : null });
    } catch (e) {
      out.push({ site: b.site_nm, no: +b.board_no, name: b.board_nm.trim(), error: e.message });
    }
  }
  fs.writeFileSync('probe-result.json', JSON.stringify(out, null, 1) + '\n');
  for (const x of out) console.log(`${x.site} | ${x.no} ${x.name} | ${x.error || x.rows + '건, 최근 ' + x.latest}`);
  console.log(`\n호출 ${cand.length}건 → probe-result.json`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
