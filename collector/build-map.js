// 학과 → 게시판 매핑 생성. 결과는 사람이 검수 후 커밋한다.
// node collector/build-map.js <cmsBoard.json> [--no-crawl]
// 1) 학교 공식 학과 목록을 cmsBoard 사이트명과 짝지음  2) 학과 홈페이지 공지 메뉴를 훑어 boardNo → URL 수집
// 학과 id는 한 번 정해지면 유지한다(이름이 바뀌어도 RENAMED로 이어받음) — 사용자 저장값·수집 데이터 파일명이 id 기준.
const fs = require('fs');
const path = require('path');

// 학교 홈페이지 "단과대학 소개"(plus.cnu.ac.kr sub02_020118) 기준, 2026-10-17 확인
const COLLEGES = [
  { name: '공과대학', depts: ['컴퓨터인공지능학부', '건축공학과', '토목공학과', '환경공학과', '기계공학부', '메카트로닉스공학과', '선박해양공학과', '항공우주공학과', '전기공학과', '전자공학과', '전파정보통신공학과', '정보통신융합학부', '신소재공학과', '응용화학공학과', '유기재료공학과', '자율운항시스템공학과', '에너지공학과', '스마트시티건축공학과'] },
  { name: '인문대학', depts: ['국어국문학과', '영어영문학과', '독어독문학과', '불어불문학과', '중어중문학과', '일어일문학과', '한문학과', '언어학과', '국사학과', '사학과', '고고학과', '철학과'] },
  { name: '사회과학대학', depts: ['사회학과', '문헌정보학과', '심리학과', '언론정보학과', '사회복지학과', '행정학부', '정치외교학과', '도시·자치융합학과'] },
  { name: '자연과학대학', depts: ['수학과', '정보통계학과', '물리학과', '천문우주과학과', '화학과', '생화학과', '지질환경과학과', '해양환경과학과', '스포츠과학과', '무용학과', '반도체융합학과'] },
  { name: '경상대학', depts: ['경영학부', '경제학과', '무역학과', '아시아비즈니스국제학과'] },
  { name: '농업생명과학대학', depts: ['농업경제학과', '식물자원학과', '원예학과', '산림환경자원학과', '환경소재공학과', '동물자원생명과학과', '동물바이오시스템과학과', '응용생물학과', '생물환경화학과', '식품공학과', '지역환경토목학과', '스마트농업시스템기계공학과'] },
  { name: '약학대학', depts: ['약학과'] },
  { name: '의과대학', depts: ['의예과', '의학과'] },
  { name: '간호대학', depts: ['간호학과'] },
  { name: '생활과학대학', depts: ['의류학과', '식품영양학과', '소비자학과'] },
  { name: '예술대학', depts: ['음악과', '관현악과', '회화과', '조소과', '디자인창의학과'] },
  { name: '수의과대학', depts: ['수의예과', '수의학과'] },
  { name: '사범대학', depts: ['국어교육과', '영어교육과', '교육학과', '수학교육과', '건설공학교육과', '기계공학교육과', '전기·전자·통신공학교육과', '화학공학교육과', '기술교육과', '체육교육과'] },
  { name: '생명시스템과학대학', depts: ['생물과학과', '미생물·분자생명과학과', '생명정보융합학과'] },
  { name: '지식융합학부', depts: ['인문사회학과', '리더쉽과 조직과학과', '공공안전학과'] },
  { name: '국제학부', depts: ['국제학전공', '한국문화학전공'] },
  { name: '국가안보융합학부', depts: ['국토안보학전공', '해양안보학전공'] },
];

// 옛 학과명 → 새 학과명(통합·개명). extension/core.js의 RENAMED와 같게 유지
const RENAMED = {
  '컴퓨터융합학부': '컴퓨터인공지능학부', '인공지능학과': '컴퓨터인공지능학부', '건축학과': '건축공학과',
  '동물자원과학부': '동물자원생명과학과', '바이오시스템기계공학과': '스마트농업시스템기계공학과',
  '인문사회과학전공': '인문사회학과', '리더십과 조직과학전공': '리더쉽과 조직과학과', '공공안전학전공': '공공안전학과',
};

// 학과명과 API 사이트명이 다른 경우
const ALIAS = {
  '전파정보통신공학과': '정보통신융합학부, 전파정보통신공학과',
  '정보통신융합학부': '정보통신융합학부, 전파정보통신공학과',
  '미생물·분자생명과학과': '미생물분자생명과학과',
  '전기·전자·통신공학교육과': '전기전자통신공학교육과',
  '지질환경과학과': '우주지질학과 대기과학전공',
  '약학과': '약학대학', '의예과': '의과대학', '의학과': '의과대학', '간호학과': '간호대학',
  '수의예과': '수의과대학', '수의학과': '수의과대학',
  '인문사회학과': '지식융합학부 (자유전공학부)', '리더쉽과 조직과학과': '지식융합학부 (자유전공학부)', '공공안전학과': '지식융합학부 (자유전공학부)',
  '국제학전공': '국제학부', '한국문화학전공': '국제학부',
  '국토안보학전공': '국가안보융합학부', '해양안보학전공': '국가안보융합학부',
};

const NOTICE = /(공지|학사|장학|취업|notice)/i;
const SKIP = /(대학원|동문|교우|영문|english|자료실|입학|기부|발전기금|갤러리|faq|양식|세미나|old|2019|센터|연구소|사업단|연수|지도사|실습|경진대회|학생회|채용|linc|ds사업|고시|문화예술교육사|영재|오페라)/i;
const MAX_BOARDS = 3;
// 같은 사이트를 쓰는 전공별로 게시판을 직접 지정
// 통합된 컴퓨터인공지능학부는 옛 인공지능학과 학사공지(4645)도 함께 받는다
const OVERRIDE = { '국토안보학전공': [6205, 6206, 498], '해양안보학전공': [6205, 6207, 498], '컴퓨터인공지능학부': [305, 4645, 307],
  // API가 글을 주지 않는 게시판(397 장학금안내)을 같은 사이트의 글 있는 게시판으로(probe.js 2026-10-17)
  '수의예과': [402, 398, 6903], '수의학과': [402, 398, 6903], '응용생물학과': [2897, 7164] };

function pickBoards(rows) {
  const ok = rows.filter((b) => NOTICE.test(b.board_nm) && !SKIP.test(b.board_nm));
  const pool = ok.length ? ok : rows.filter((b) => /소식/.test(b.board_nm) && !SKIP.test(b.board_nm));
  // 학사/학부 공지 먼저, 그다음 장학·취업
  const rank = (b) => (/학사|학부/.test(b.board_nm) ? 0 : /^(.*> )?공지사항$|학과공지/.test(b.board_nm.trim()) ? 1 : /장학/.test(b.board_nm) ? 2 : 3);
  return pool.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_BOARDS);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    return r.ok ? { url: r.url, html: await r.text() } : null;
  } catch (e) { return null; }
}

// 학교 단과대학 소개 페이지에 학과 홈페이지 주소가 모여 있다
async function hosts() {
  const p = await get('https://plus.cnu.ac.kr/html/kr/sub02/sub02_020118.html');
  const set = new Set();
  for (const m of p.html.matchAll(/href="\s*(https?:\/\/[a-z0-9-]+\.cnu\.ac\.kr(?:\/[a-z0-9_-]*)?\/?)"/gi)) set.add(m[1].replace(/^http:/, 'https:').replace(/\/?$/, '/'));
  return [...set];
}

// 홈페이지 메뉴 중 공지 계열 링크만 열어 boardNo를 읽는다
async function crawl(home, found) {
  const p = await get(home);
  if (!p) return;
  const links = new Map();
  for (const m of p.html.matchAll(/<a[^>]+href="([^"#]+\.do)"[^>]*>\s*([^<]{1,30})</g)) {
    if (!/(공지|학사|장학|취업|소식|학부|열린마당|게시판|커뮤니티|알림|notice)/i.test(m[2])) continue;
    try { links.set(new URL(m[1], p.url).href.split('?')[0], 1); } catch (e) {}
  }
  for (const u of [...links.keys()].slice(0, 40)) {
    const q = await get(u);
    await sleep(1000); // 빠르게 몰아 요청하면 학교 사이트가 일시적으로 거부한다
    const b = q && q.html.match(/boardNo\s*=\s*'(\d+)'/);
    if (b && !found[b[1]]) found[b[1]] = u;
  }
}

async function main() {
  const src = process.argv[2] || 'cmsBoard.json';
  const rows = JSON.parse(fs.readFileSync(src, 'utf8').replace(/^\uFEFF/, '')).RESULT;
  const norm = (s) => s.replace(/[\s·()]/g, '');
  const bySite = new Map();
  for (const r of rows) {
    const k = norm(r.site_nm);
    if (!bySite.has(k)) bySite.set(k, []);
    bySite.get(k).push(r);
  }

  // 기존 매핑: 학과 id와 이미 찾은 게시판 URL을 이어받는다
  const outFile = path.join(__dirname, '..', 'extension', 'departments.json');
  const oldId = {}, found = {};
  let maxId = 0;
  try {
    for (const c of JSON.parse(fs.readFileSync(outFile, 'utf8'))) for (const d of c.depts) {
      const name = RENAMED[d.name] || d.name;
      if (!oldId[name]) oldId[name] = d.id; // 통합되면 앞선 학과의 id
      maxId = Math.max(maxId, +d.id.slice(1));
      for (const b of d.boards) if (b.url) found[b.no] = b.url;
    }
  } catch (e) {}

  if (!process.argv.includes('--no-crawl'))
    for (const h of await hosts()) { process.stderr.write('crawl ' + h + '\n'); await crawl(h, found); }

  const out = COLLEGES.map((c) => ({
    name: c.name,
    depts: c.depts.map((d) => {
      const site = bySite.get(norm(ALIAS[d] || d)) || [];
      const picked = OVERRIDE[d] ? OVERRIDE[d].map((no) => rows.find((b) => +b.board_no === no)).filter(Boolean) : pickBoards(site);
      const boards = picked.map((b) => ({ no: +b.board_no, name: b.board_nm.trim(), url: found[b.board_no] || null }));
      return { id: oldId[d] || 'd' + String(++maxId).padStart(2, '0'), name: d, boards };
    }),
  }));
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n');
  for (const c of out) for (const d of c.depts) {
    const miss = d.boards.filter((b) => !b.url).length;
    if (!d.boards.length || miss) console.log(`${d.id} ${d.name}: 게시판 ${d.boards.length}개, URL 없음 ${miss}개`);
  }
}

if (require.main === module) main();
module.exports = { pickBoards, RENAMED };
