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
      if (!enabled || t.length < 2 || !sel.rangeCount || !alive()) return hide();
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
  root.querySelector('button').addEventListener('click', () => {
    hide();
    if (!alive()) return alert('앗!차차가 업데이트됐어요. 이 페이지를 새로고침한 뒤 다시 드래그해 주세요.');
    chrome.runtime.sendMessage({ type: 'scrap', text, url: location.href, title: document.title });
    getSelection().removeAllRanges();
  });
})();
