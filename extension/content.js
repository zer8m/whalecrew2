// 모든 사이트: 글을 드래그하면 선택 영역 아래에 "앗!차차에 저장" 버튼(시안 7번)을 띄운다
(function () {
  if (window.__attchacha) return;
  window.__attchacha = true;

  let enabled = true;
  chrome.storage.local.get('S', (r) => { enabled = !(r.S && r.S.settings && r.S.settings.dragBtn === false); });
  chrome.storage.onChanged.addListener((c) => { if (c.S && c.S.newValue) enabled = (c.S.newValue.settings || {}).dragBtn !== false; });

  const host = document.createElement('attchacha-btn');
  host.style.cssText = 'all:initial;position:absolute;z-index:2147483647;display:none;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
  .w{display:flex;align-items:center;gap:6px;font-family:'Pretendard',-apple-system,'Malgun Gothic',system-ui,sans-serif;letter-spacing:-.01em}
  button{width:36px;height:36px;padding:0;border:0;border-radius:11px;background:#2B6CFF;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;box-shadow:0 4px 12px rgba(43,108,255,.28),0 0 0 3px #fff;transition:transform 160ms cubic-bezier(.23,1,.32,1)}
  button:active{transform:scale(.96)}
  button:focus-visible{outline:2px solid #2B6CFF;outline-offset:4px}
  img{width:36px;height:36px;object-fit:cover}
  span{height:24px;padding:0 9px;border-radius:6px;background:#1A1C22;color:#fff;font-size:12px;font-weight:600;display:inline-flex;align-items:center;white-space:nowrap;box-shadow:0 6px 16px rgba(26,28,34,.18)}
  @media (prefers-reduced-motion:reduce){button{transition:none}button:active{transform:none}}
</style><div class="w"><button aria-label="앗!차차에 저장"><img src="${chrome.runtime.getURL('chacha.png')}" alt=""></button><span>앗!차차에 저장</span></div>`;
  (document.body || document.documentElement).appendChild(host);

  let text = '';
  const hide = () => { host.style.display = 'none'; };
  // 확장앱을 업데이트·새로고침하면 이미 열린 탭의 이 스크립트는 확장앱과 끊긴다(chrome.runtime 사용 불가)
  const alive = () => { try { return !!chrome.runtime.id; } catch (e) { return false; } };
  document.addEventListener('mouseup', (e) => {
    if (e.composedPath().includes(host)) return;
    setTimeout(() => {
      const sel = getSelection();
      const t = sel ? sel.toString().trim() : '';
      if (!enabled || t.length < 2 || !sel.rangeCount) return hide();
      text = sel.toString();
      const r = sel.getRangeAt(0).getBoundingClientRect();
      host.style.left = Math.max(8, Math.min(r.left, innerWidth - 200)) + scrollX + 'px';
      host.style.top = r.bottom + scrollY + 8 + 'px';
      host.style.display = 'block';
    }, 0);
  });
  document.addEventListener('mousedown', (e) => { if (!e.composedPath().includes(host)) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  // 버튼을 눌러도 선택이 풀리지 않게
  root.querySelector('button').addEventListener('mousedown', (e) => e.preventDefault());
  // 누른 뒤 결과를 페이지에 짧게 알려준다(사이드바가 자동으로 안 열리는 경우도 알 수 있게)
  const toast = document.createElement('attchacha-toast');
  toast.style.cssText = 'all:initial;position:fixed;right:20px;bottom:24px;z-index:2147483647;display:none;';
  const troot = toast.attachShadow({ mode: 'closed' });
  (document.body || document.documentElement).appendChild(toast);
  let tt;
  function say(msg, warn) {
    troot.innerHTML = `<style>div{display:flex;align-items:center;gap:10px;max-width:340px;padding:12px 14px;border-radius:12px;background:#1A1C22;color:#fff;font:600 13px/1.5 'Pretendard',-apple-system,'Malgun Gothic',system-ui,sans-serif;letter-spacing:-.01em;box-shadow:0 12px 30px rgba(26,28,34,.28)}img{width:28px;height:28px;border-radius:8px;flex:none}b{color:${warn ? '#FFC24B' : '#8FB2FF'}}</style><div role="status"><img src="${alive() ? chrome.runtime.getURL('chacha.png') : ''}" alt="">${msg}</div>`;
    toast.style.display = 'block';
    clearTimeout(tt);
    tt = setTimeout(() => { toast.style.display = 'none'; }, warn ? 6500 : 3500);
  }
  root.querySelector('button').addEventListener('click', () => {
    hide();
    if (!alive()) return say('앗!차차가 업데이트됐어요. <b>이 페이지를 새로고침(F5)</b>한 뒤 다시 드래그해 주세요.', true);
    const sel = text;
    getSelection().removeAllRanges();
    try {
      chrome.runtime.sendMessage({ type: 'scrap', text: sel, url: location.href, title: document.title }, (r) => {
        if (chrome.runtime.lastError) return say('저장하지 못했어요. <b>페이지를 새로고침</b>한 뒤 다시 해 주세요.', true);
        if (r && r.opened) say('사이드바에서 <b>날짜를 확인하고 저장</b>하세요.');
        else say('담았어요! 오른쪽 사이드바의 <b>앗!차차 아이콘</b>을 눌러 저장을 마무리하세요.', true);
      });
    } catch (e) { say('앗!차차가 업데이트됐어요. <b>이 페이지를 새로고침(F5)</b>한 뒤 다시 드래그해 주세요.', true); }
  });
})();
