/* ================================================================
   КОММЕНТАРИИ НА СТРАНИЦЕ — только локальное превью (localhost).
   Включить: добавить к адресу ?comments (дальше режим помнится во вкладке),
   выключить — ?comments=off. Грузит app.js.
   Кнопка «комментарий» справа сверху → нажать на любое место страницы →
   написать → «сохранить». Метка привязана к блоку, ездит вместе с ним.
   Всё сохраняется в notes/comments.json (через serve-nocache.py),
   оттуда комментарии читает Claude; решенные он помечает done: true —
   их метки серые и прячутся, пока не включить «показать решенные».
   На сайт этот файл не попадает: app.js грузит его только на localhost.
   ================================================================ */
(function(){
  if (window.__kdComments) return;
  window.__kdComments = true;
  const API = '/__comments';
  const page = () => location.pathname.replace(/^.*\//, '') + location.hash;
  let list = [], adding = false, showDone = false, openId = null;

  /* ---------- оформление ---------- */
  const css = `
  .kc-ui{position:fixed;top:14px;right:14px;z-index:2147483000;display:flex;gap:8px;font:500 16px/1.2 "Golos Text",system-ui,sans-serif}
  .kc-btn{border:0;border-radius:999px;padding:10px 16px;background:#111;color:#fff;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.18);font:inherit}
  .kc-btn.on{background:#E2FB5A;color:#111}
  .kc-btn.ghost{background:#fff;color:#111}
  html.kc-adding, html.kc-adding *{cursor:crosshair !important}
  .kc-tip{position:fixed;top:64px;right:14px;z-index:2147483000;background:#111;color:#fff;border-radius:12px;padding:10px 14px;font:16px/1.3 "Golos Text",system-ui,sans-serif;max-width:280px}
  .kc-pin{position:fixed;z-index:2147482999;width:30px;height:30px;margin:-30px 0 0 -2px;border-radius:50% 50% 50% 4px;background:#111 !important;color:#fff !important;
    display:grid;place-items:center;font:600 14px/1 "Golos Text",system-ui,sans-serif;cursor:pointer;box-shadow:0 0 0 2px #fff,0 4px 12px rgba(0,0,0,.25);border:0;padding:0}
  .kc-pin.done{background:#9A9CA3 !important}
  .kc-pin.hide{display:none}
  .kc-pop{position:fixed;z-index:2147483001;width:min(320px,calc(100vw - 24px));background:#fff;color:#111;border-radius:14px;padding:14px;
    box-shadow:0 10px 40px rgba(0,0,0,.25);font:16px/1.35 "Golos Text",system-ui,sans-serif}
  .kc-pop textarea{width:100%;min-height:96px;border:1px solid #D9DBE0;border-radius:10px;padding:10px;font:inherit;color:#111;background:#fff;resize:vertical;box-sizing:border-box}
  .kc-pop p{margin:0 0 10px;white-space:pre-wrap}
  .kc-pop .kc-meta{font-size:16px;color:#6B6E76;margin:0 0 8px}
  .kc-row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
  .kc-row .kc-btn{box-shadow:none;padding:8px 14px}
  .kc-list{position:fixed;top:64px;right:14px;z-index:2147483000;width:min(340px,calc(100vw - 28px));max-height:70vh;overflow:auto;background:#fff;color:#111;
    border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.25);padding:8px;font:16px/1.35 "Golos Text",system-ui,sans-serif}
  .kc-item{display:block;width:100%;text-align:left;border:0;background:none;padding:10px;border-radius:10px;cursor:pointer;font:inherit;color:inherit}
  .kc-item:hover{background:#F2F3F5}
  .kc-item.done{color:#9A9CA3}
  .kc-item b{font-weight:600;margin-right:6px}
  .kc-empty{padding:10px;color:#6B6E76}
  .kc-check{display:flex;align-items:center;gap:8px;padding:10px;border-top:1px solid #EEE;margin-top:4px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- привязка к блоку: путь из классов и номеров ---------- */
  const skip = el => el.closest('.kc-ui,.kc-pop,.kc-pin,.kc-list,.kc-tip');
  function pathOf(el){
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      let s = el.tagName.toLowerCase();
      if (el.id && !/^mhc\d+$/.test(el.id)) { parts.unshift(s + '#' + CSS.escape(el.id)); break; }
      const cls = [...el.classList].filter(c => !/^(in|on|run|lock|word|dim|off|pop|open|show)$/.test(c)).slice(0, 2);
      if (cls.length) s += '.' + cls.map(c => CSS.escape(c)).join('.');
      const p = el.parentElement;
      if (p) { const same = [...p.children].filter(x => x.tagName === el.tagName); if (same.length > 1) s += `:nth-of-type(${same.indexOf(el) + 1})`; }
      parts.unshift(s);
      el = p;
    }
    return parts.join(' > ');
  }
  // svg-детали слишком мелкие и перерисовываются — цепляемся за ближайший html-блок
  const anchorOf = el => { while (el && (el instanceof SVGElement)) el = el.parentElement; return el; };
  const chapterOf = el => {
    const s = el.closest('section,[class*="-ch"]');
    const h = s && s.querySelector('h2,h3');
    return h ? h.textContent.trim().slice(0, 80) : '';
  };
  const caseTitle = () => { const h = document.querySelector('#case.open h1, #case.open .case-head h1, #case.open h2'); return h ? h.textContent.trim() : ''; };

  /* ---------- сохранение ---------- */
  async function load(){
    try { const r = await fetch(API, { cache: 'no-store' }); if (r.ok) list = await r.json(); } catch (e) {}
    render();
  }
  async function save(){
    try { await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list) }); }
    catch (e) { alert('Не сохранилось: превью запущено без поддержки комментариев'); }
  }

  /* ---------- интерфейс ---------- */
  const ui = document.createElement('div'); ui.className = 'kc-ui';
  ui.innerHTML = `<button type="button" class="kc-btn kc-add">комментарий</button><button type="button" class="kc-btn ghost kc-all">все</button>`;
  document.body.appendChild(ui);
  const addBtn = ui.querySelector('.kc-add'), allBtn = ui.querySelector('.kc-all');
  let tip, pop, panel;
  const close = () => { pop && pop.remove(); pop = null; openId = null; };
  const setAdding = v => {
    adding = v; addBtn.classList.toggle('on', v); document.documentElement.classList.toggle('kc-adding', v);
    tip && tip.remove(); tip = null;
    if (v) { tip = document.createElement('div'); tip.className = 'kc-tip'; tip.textContent = 'Нажмите на место, к которому комментарий. Esc — отмена'; document.body.appendChild(tip); }
  };
  addBtn.addEventListener('click', e => { e.stopPropagation(); close(); panel && (panel.remove(), panel = null); setAdding(!adding); });
  allBtn.addEventListener('click', e => { e.stopPropagation(); close(); if (panel) { panel.remove(); panel = null; } else showPanel(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setAdding(false); close(); } });

  // нажатие в режиме добавления — перехватываем до сайта
  document.addEventListener('click', e => {
    if (!adding || skip(e.target)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const el = anchorOf(e.target) || document.body, r = el.getBoundingClientRect();
    setAdding(false);
    const draft = {
      id: Date.now().toString(36), page: page(), case: caseTitle(), chapter: chapterOf(el),
      path: pathOf(el), x: r.width ? (e.clientX - r.left) / r.width : 0, y: r.height ? (e.clientY - r.top) / r.height : 0,
      quote: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('alt') || '').trim().replace(/\s+/g, ' ').slice(0, 120),
      width: innerWidth, text: '', created: new Date().toISOString(), done: false,
    };
    editor(draft, e.clientX, e.clientY, true);
  }, true);
  ['pointerdown', 'mousedown', 'pointerup', 'mouseup'].forEach(t => document.addEventListener(t, e => {
    if (adding && !skip(e.target)) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
  }, true));

  function place(box, x, y){
    const w = box.offsetWidth, h = box.offsetHeight;
    box.style.left = Math.max(12, Math.min(innerWidth - w - 12, x + 12)) + 'px';
    box.style.top = Math.max(12, Math.min(innerHeight - h - 12, y + 12)) + 'px';
  }
  function editor(c, x, y, isNew){
    close();
    pop = document.createElement('div'); pop.className = 'kc-pop';
    pop.innerHTML = `${c.chapter ? `<p class="kc-meta">${esc(c.chapter)}</p>` : ''}<textarea placeholder="Что поправить?"></textarea>
      <div class="kc-row"><button type="button" class="kc-btn kc-save">сохранить</button><button type="button" class="kc-btn ghost kc-cancel">отмена</button>${
      isNew ? '' : '<button type="button" class="kc-btn ghost kc-del">удалить</button>'}</div>`;
    document.body.appendChild(pop);
    const ta = pop.querySelector('textarea'); ta.value = c.text; place(pop, x, y); ta.focus();
    pop.querySelector('.kc-cancel').onclick = close;
    pop.querySelector('.kc-save').onclick = async () => {
      c.text = ta.value.trim(); if (!c.text) return close();
      if (isNew) list.push(c);
      close(); render(); await save();
    };
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) pop.querySelector('.kc-save').click(); });
    const del = pop.querySelector('.kc-del');
    if (del) del.onclick = async () => { list = list.filter(x => x !== c); close(); render(); await save(); };
  }
  function viewer(c, x, y){
    close(); openId = c.id;
    pop = document.createElement('div'); pop.className = 'kc-pop';
    pop.innerHTML = `${c.chapter ? `<p class="kc-meta">${esc(c.chapter)}</p>` : ''}<p>${esc(c.text)}</p>${c.done ? '<p class="kc-meta">решено</p>' : ''}
      <div class="kc-row"><button type="button" class="kc-btn ghost kc-edit">изменить</button><button type="button" class="kc-btn ghost kc-x">закрыть</button></div>`;
    document.body.appendChild(pop); place(pop, x, y);
    pop.querySelector('.kc-x').onclick = close;
    pop.querySelector('.kc-edit').onclick = () => editor(c, x, y, false);
  }
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ---------- метки ---------- */
  const pins = new Map();
  function render(){
    const here = list.filter(c => c.page === page());
    pins.forEach((el, id) => { if (!here.find(c => c.id === id)) { el.remove(); pins.delete(id); } });
    here.forEach(c => {
      let el = pins.get(c.id);
      if (!el) {
        el = document.createElement('button'); el.type = 'button'; el.className = 'kc-pin';
        el.addEventListener('click', e => { e.stopPropagation(); const r = el.getBoundingClientRect(); viewer(c, r.right, r.top); });
        document.body.appendChild(el); pins.set(c.id, el);
      }
      el.textContent = list.indexOf(c) + 1;
      el.classList.toggle('done', !!c.done);
      el.title = c.text;
    });
    const open_ = list.filter(c => !c.done).length;
    allBtn.textContent = open_ ? `все (${open_})` : 'все';
    if (panel) showPanel();
  }
  function tick(){
    list.forEach(c => {
      const el = pins.get(c.id); if (!el) return;
      let a = null; try { a = document.querySelector(c.path); } catch (e) {}
      const r = a && a.getBoundingClientRect();
      const visible = r && (r.width || r.height) && !(c.done && !showDone);
      el.classList.toggle('hide', !visible);
      if (visible) { el.style.left = (r.left + r.width * c.x) + 'px'; el.style.top = (r.top + r.height * c.y) + 'px'; }
    });
    requestAnimationFrame(tick);
  }
  function showPanel(){
    if (!panel) { panel = document.createElement('div'); panel.className = 'kc-list'; document.body.appendChild(panel); }
    const items = list.map((c, i) => ({ c, i })).filter(({ c }) => showDone || !c.done);
    panel.innerHTML = (items.length ? items.map(({ c, i }) => `<button type="button" class="kc-item${c.done ? ' done' : ''}" data-id="${c.id}"><b>${i + 1}</b>${esc(c.text)}${
      c.page !== page() ? `<br><span style="color:#6B6E76">${esc(c.case || c.page)}</span>` : ''}</button>`).join('') : '<div class="kc-empty">Комментариев пока нет</div>')
      + `<label class="kc-check"><input type="checkbox"${showDone ? ' checked' : ''}> показать решенные</label>`;
    panel.querySelector('input').onchange = e => { showDone = e.target.checked; showPanel(); };
    panel.querySelectorAll('.kc-item').forEach(b => b.onclick = () => {
      const c = list.find(x => x.id === b.dataset.id);
      if (c.page !== page()) { location.href = c.page.replace(/#.*$/, '') + '?comments' + (c.page.match(/#.*$/) || [''])[0]; return; }
      let a = null; try { a = document.querySelector(c.path); } catch (e) {}
      if (a) a.scrollIntoView({ behavior: 'smooth', block: 'center' });
      panel.remove(); panel = null;
    });
  }
  addEventListener('hashchange', () => { close(); render(); });
  document.addEventListener('click', e => { if (pop && !skip(e.target)) close(); });
  // Claude отмечает решенные прямо в файле — подтягиваем изменения
  setInterval(async () => {
    if (pop || adding) return;
    try { const r = await fetch(API, { cache: 'no-store' }); if (r.ok) { const fresh = await r.json(); if (JSON.stringify(fresh) !== JSON.stringify(list)) { list = fresh; render(); } } } catch (e) {}
  }, 5000);
  load(); requestAnimationFrame(tick);
})();
