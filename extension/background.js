// 백그라운드: 학과 공지 새로고침(3시간) · 알림 확인(1분) · 드래그 스크랩 중계 · 알림 클릭 처리
importScripts('core.js');
const { load, mutate, pushAlert, colleges, deptId, allItems, remTimes, parseD, midnight, DATA_BASE } = Core;
const sidebar = self.whale && whale.sidebarAction;
const W = ['일', '월', '화', '수', '목', '금', '토'];

function ensureAlarms() {
  chrome.alarms.create('tick', { periodInMinutes: 1 });
  chrome.alarms.create('refresh', { periodInMinutes: 180 });
}
chrome.runtime.onInstalled.addListener(() => { ensureAlarms(); refresh(); });
chrome.runtime.onStartup.addListener(() => { ensureAlarms(); refresh().then(tick); });
chrome.alarms.onAlarm.addListener((a) => (a.name === 'refresh' ? refresh() : tick()));

// ───── 학과 공지 ─────
async function refresh() {
  const { S, notices } = await load();
  const list = await colleges();
  const ids = S.depts.map((n) => deptId(list, n)).filter(Boolean);
  const next = {};
  const { seen = {} } = await chrome.storage.local.get('seen');
  const fresh = [];
  for (const id of ids) {
    try {
      const r = await fetch(DATA_BASE + id + '.json', { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      const first = !notices[id];
      for (const n of data.items) {
        const k = 'n-' + n.id;
        if (seen[k]) continue;
        seen[k] = Date.now();
        if (!first && n.date >= Core.ymd(new Date())) fresh.push(n);
      }
      next[id] = data;
    } catch (e) {
      if (notices[id]) next[id] = notices[id]; // 실패하면 지난 데이터 유지
    }
  }
  await chrome.storage.local.set({ notices: next, seen });
  for (const n of fresh.slice(0, 5))
    await pushAlert(S, { itemId: 'n-' + n.id, type: 'notice', chip: '새 공지', title: n.title, sub: (n.writer || n.tag) + ' · 달력 추가됨' });
}

// ───── 알림 ─────
function rel(s) {
  const n = Math.round((parseD(s) - midnight(new Date())) / 864e5), d = parseD(s);
  return n === 0 ? '오늘' : n === 1 ? '내일' : `${d.getMonth() + 1}/${d.getDate()}(${W[d.getDay()]})`;
}
async function tick() {
  const { S, notices } = await load();
  if (!S.onboarded) return;
  const items = allItems(S, notices, await colleges());
  const { fired = {}, seen = {} } = await chrome.storage.local.get(['fired', 'seen']);
  const now = Date.now();
  for (const i of items) {
    if (i.done) continue;
    // 저장(또는 공지 수신) 전에 이미 지난 알림 시점은 보내지 않는다
    const floor = i.savedAt || seen[i.id] || S.deptAt || 0;
    for (const r of remTimes(S, i)) {
      const k = i.id + '|' + r.key;
      if (fired[k] || r.at > now) continue;
      fired[k] = now;
      if (r.at < floor) continue;
      await deliver(S, i, r, now - r.at > 3600e3);
    }
  }
  for (const k in fired) if (now - fired[k] > 60 * 864e5) delete fired[k];
  await chrome.storage.local.set({ fired });
}

async function deliver(S, item, r, missed) {
  const when = `${rel(item.date)} ${item.time}`;
  await pushAlert(S, { itemId: item.id, type: item.kind === '시작' ? 'start' : 'deadline', chip: r.label, title: item.title, sub: `${when} · ${item.sub}${missed ? ' · 놓친 알림' : ''}` });
  if (missed || !S.settings.browser) return;
  const n = Math.round((parseD(item.date) - midnight(new Date())) / 864e5);
  const dd = n === 0 ? 'D-Day' : n > 0 ? 'D-' + n : 'D+' + -n;
  chrome.notifications.create('it|' + item.id + '|' + Date.now(), {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: item.kind === '시작' ? `${r.label} · ${item.title}` : `${dd} · ${item.title}`,
    message: item.kind === '시작' ? `${when} 시작 · ${item.sub}` : `${when}까지 · ${item.sub}`,
    contextMessage: '앗!차차 · ' + (item.kind === '시작' ? '일정 알림' : '마감 알림'),
    buttons: [{ title: '원문 열기' }, { title: '완료' }],
    priority: 2,
  });
}

const itemOf = (nid) => nid.split('|')[1];
async function focusItem(id, windowId) {
  await chrome.storage.local.set({ focus: id });
  openSidebar(windowId);
}
function openSidebar(windowId) {
  if (!sidebar) return;
  try { windowId ? sidebar.show(windowId) : sidebar.show(); } catch (e) {}
}
chrome.notifications.onClicked.addListener((nid) => { chrome.notifications.clear(nid); focusItem(itemOf(nid)); });
chrome.notifications.onButtonClicked.addListener(async (nid, btn) => {
  chrome.notifications.clear(nid);
  const { S, notices } = await load();
  const it = allItems(S, notices, await colleges()).find((x) => x.id === itemOf(nid));
  if (!it) return;
  if (btn === 0) return it.url ? chrome.tabs.create({ url: it.url }) : focusItem(it.id);
  await mutate('S', (s) => {
    const k = s.items.findIndex((x) => x.id === it.id);
    if (k >= 0) s.items[k].done = true; else s.items.push({ ...it, done: true });
    return s;
  });
  const d = new Date();
  await pushAlert(S, { itemId: it.id, type: 'done', chip: '완료', title: it.title, sub: `${d.getMonth() + 1}/${d.getDate()} 완료` });
});

// ───── 메시지 ─────
chrome.runtime.onMessage.addListener((m, sender) => {
  if (m.type === 'scrap') {
    // 사이드바가 열리면 pendingScrap을 읽어 스크랩 화면을 띄운다. 못 열면 배지로 알린다.
    chrome.storage.local.set({ pendingScrap: { text: m.text, url: m.url, title: m.title, at: Date.now() } });
    if (sidebar) { sidebar.setBadgeText({ text: '1' }); sidebar.setBadgeBackgroundColor({ color: '#2B6CFF' }); }
    openSidebar(sender.tab && sender.tab.windowId);
  } else if (m.type === 'refresh') refresh().then(tick);
  else if (m.type === 'clearBadge' && sidebar) sidebar.setBadgeText({ text: '' });
});
