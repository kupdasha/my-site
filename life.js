/* ================================================================
   КЕЙС «ИМИДЖЕВЫЙ БУКЛЕТ LIFE ВАРШАВСКАЯ» (поле life у проекта, страница NDA)
   paper   — в начале: рендеры с калькой коллажем (большой — листы
             перелистываются, рядом разворот и крупный план карты),
             крупно по нажатию;
   cover   — обложка сверху, под текстом макро тиснения; обе крупно
             по нажатию (свет за курсором убран 23.11);
   layers  — карта первого разворота стопкой листов: белый лист с картой
             и три прозрачных (дети, спорт, паркинги). «Вместе» — листы
             сложены, карта целиком; слой — стопка раскрывается, нужный
             лист поднимается. Переключатели — строка надписей с полоской
             таймера, листается само, пока не тронули; стопка наклоняется
             за курсором;
   spreads — развороты коллажем, крупно по нажатию (кроме noZoom);
   крупно — без масштабирования внутри просмотра (NOZOOM, просьба 23.11);
   outdoor — наружная реклама, вторая концепция: щит на трассе и форматы,
             «плашка / градиент» сменяются сами.
   Картинки — img/life. Тексты — в content.js, оформление — life.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
const img = n => H.base + 'img/life/' + n;
// картинка с легкой копией для телефона
// крупно — без масштабирования внутри просмотра (просьба 23.11)
const NOZOOM = { noZoom: true };
const pic = (n, sizes = '(max-width: 900px) 100vw, 58vw') =>
  `src="${img(n + '.webp')}" srcset="${img(n + '-s.webp')} 900w, ${img(n + '.webp')} 1800w" sizes="${sizes}"`;

/* ---------- текст главы ---------- */
const block = (c, extra = '') => `<div class="lf-col">
  <span class="case-label lf-label">${H.T(c.label)}</span>
  <h2 class="lf-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="lf-text">${H.T(c.text)}</p>` : ''}${extra}
</div>`;
const chapter = (k, viz, c, rev, extra = '') =>
  `<section class="lf-ch wrap lf-split lf-${k}${rev ? ' rev' : ''}"><div class="lf-viz">${viz}</div>${block(c, extra)}</section>`;

/* ---------- строка надписей с полоской таймера (как в кейсе Ак Барс) ---------- */
const tabsHTML = (tabs, cls) => `<div class="lf-tabs ${cls}" role="tablist">${tabs.map((t, i) =>
  `<button type="button" class="lf-tab" role="tab" data-k="${t.k}" aria-selected="${i ? 'false' : 'true'}">${H.T(t.t)}<i class="lf-tick"></i></button>`).join('')}</div>`;
// листает само, пока видно и пока не нажали; нажатие — дальше только руками
function autoTabs(box, tabsEl, ms, set){
  const tabs = [...tabsEl.querySelectorAll('.lf-tab')];
  let at = 0, t, on = false, hand = false;
  tabsEl.style.setProperty('--ms', ms + 'ms');
  const go = (i, run) => {
    at = (i + tabs.length) % tabs.length;
    tabs.forEach((b, j) => { b.setAttribute('aria-selected', j === at); b.classList.remove('run'); });
    if (run) { void tabs[at].offsetWidth; tabs[at].classList.add('run'); }
    set(tabs[at].dataset.k);
  };
  const next = () => {
    clearTimeout(t);
    if (!on || hand || still()) return;
    t = setTimeout(() => { go(at + 1, true); next(); }, ms);
  };
  tabs.forEach((b, i) => b.addEventListener('click', () => { hand = true; clearTimeout(t); go(i, false); }));
  onScreen(box, v => {
    on = v;
    if (v && !hand && !still()) { go(at, true); next(); } else clearTimeout(t);
  }, .35);
  go(0, false);
}

/* ================================================================
   paper — рендеры с калькой: большой слева, два справа
   ================================================================ */
function paperHTML(c){
  return `<div class="lf-paper">${c.imgs.map((n, i) =>
    `<button type="button" class="lf-cell lf-pp${i + 1}" data-n="${n}" aria-label="${esc(H.pick(c.open))}"><img ${pic(n, i ? '(max-width: 900px) 100vw, 32vw' : '(max-width: 900px) 100vw, 64vw')} alt="" decoding="async"></button>`).join('')}</div>`;
}

/* ================================================================
   cover — обложка сверху и макро тиснения, обе крупно по нажатию
   (свет за курсором убран 23.11: картинка от него становилась грязной)
   ================================================================ */
function coverHTML(c){
  return `<button type="button" class="lf-lit" aria-label="${esc(H.pick(c.aria))}"><img ${pic(c.img)} alt="" loading="lazy" decoding="async"></button>`;
}
const coverExtra = c => `<p class="lf-text">${H.T(c.more)}</p>
  <button type="button" class="lf-macro" aria-label="${esc(H.pick(c.title))}"><img ${pic(c.macro, '(max-width: 900px) 100vw, 30vw')} alt="" loading="lazy" decoding="async"></button>`;
function liveCover(box, c){
  const btns = [box.querySelector('.lf-lit'), box.querySelector('.lf-macro')];
  const list = [img(c.img + '.webp'), img(c.macro + '.webp')];
  btns.forEach((b, i) => b.addEventListener('click', () => H.openViewer(list, i, btns.map(x => x.querySelector('img')), null, NOZOOM)));
}

/* ================================================================
   layers — стопка листов карты
   ================================================================ */
const SHEETS = ['base', 'kids', 'sport', 'park'];
function layersHTML(c){
  return `<div class="lf-desk" data-k="all">
    <div class="lf-stack" role="img" aria-label="${esc(H.pick(c.aria))}">${SHEETS.map((s, i) =>
      `<div class="lf-sh lf-sh-${s}" style="--i:${i}"><img src="${img('map-' + s + '.webp')}" alt="" loading="lazy" decoding="async"></div>`).join('')}
    </div>
  </div>`;
}
function liveLayers(box, c){
  const desk = box.querySelector('.lf-desk');
  autoTabs(box, box.querySelector('.lf-tabs'), 3000, k => { desk.dataset.k = k; });
  // наклон за курсором
  let raf = 0;
  desk.addEventListener('pointermove', e => {
    const r = desk.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { desk.style.setProperty('--tx', (x * 14).toFixed(2) + 'deg'); desk.style.setProperty('--ty', (-y * 10).toFixed(2) + 'deg'); });
  });
  desk.addEventListener('pointerleave', () => { desk.style.setProperty('--tx', '0deg'); desk.style.setProperty('--ty', '0deg'); });
}

/* ================================================================
   spreads — развороты коллажем
   ================================================================ */
// noZoom — картинки, которые крупно не открываются (просто ячейка, не кнопка)
function spreadsHTML(c){
  const fixed = c.noZoom || [];
  return `<div class="lf-grid">${c.imgs.map((n, i) => {
    const pic1 = `<img ${pic(n, i ? '(max-width: 600px) 100vw, 45vw' : '(max-width: 900px) 100vw, 90vw')} alt="" loading="lazy" decoding="async">`;
    return fixed.includes(n)
      ? `<div class="lf-cell lf-cell${i + 1} lf-still">${pic1}</div>`
      : `<button type="button" class="lf-cell lf-cell${i + 1}" data-n="${n}" aria-label="${esc(H.pick(c.open))}">${pic1}</button>`;
  }).join('')}</div>`;
}
// коллаж: нажатие — крупно, листается по картинкам главы, которые можно открыть
function liveSpreads(box, c){
  const cells = [...box.querySelectorAll('button.lf-cell')];
  const names = cells.map(b => b.dataset.n);
  const list = names.map(n => img(n + '.webp'));
  cells.forEach((b, i) => b.addEventListener('click', () => H.openViewer(list, i, cells.map(x => x.querySelector('img')), null, NOZOOM)));
}

/* ================================================================
   outdoor — вторая концепция наружки
   ================================================================ */
const FORMATS = [['h', 2.0], ['v', .668], ['w', 3.01], ['x', 2.997]];
function outdoorHTML(c){
  return `<div class="lf-board" data-k="${c.tabs[0].k}">${c.tabs.map(t =>
    `<img class="lf-b-${t.k}" ${pic('board-' + t.k)} alt="" loading="lazy" decoding="async">`).join('')}</div>`;
}
function formatsHTML(c){
  const row = list => `<div class="lf-row">${list.map(([f, r]) =>
    `<button type="button" class="lf-fmt" style="--r:${r}" data-f="${f}" aria-label="${esc(H.pick(c.open))}">${c.tabs.map(t =>
      `<img class="lf-b-${t.k}" src="${img(t.k + '-' + f + '.webp')}" alt="" loading="lazy" decoding="async">`).join('')}</button>`).join('')}</div>`;
  return `<div class="wrap lf-fmts" data-k="${c.tabs[0].k}">${row(FORMATS.slice(0, 2))}${row(FORMATS.slice(2))}</div>`;
}
function liveOutdoor(box, c){
  const board = box.querySelector('.lf-board'), fmts = box.querySelector('.lf-fmts');
  autoTabs(box, box.querySelector('.lf-tabs'), 3400, k => { board.dataset.k = k; fmts.dataset.k = k; });
  const btns = [...fmts.querySelectorAll('.lf-fmt')];
  btns.forEach((b, i) => b.addEventListener('click', () => {
    const k = fmts.dataset.k;
    H.openViewer(FORMATS.map(([f]) => img(k + '-' + f + '.webp')), i, btns.map(x => x.querySelector('.lf-b-' + k)), null, NOZOOM);
  }));
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'life.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountLife(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const s = p.life;
  mount.innerHTML =
      (s.paper   ? `<section class="lf-ch lf-paper-ch"><div class="wrap lf-head">${block(s.paper)}</div><div class="wrap">${paperHTML(s.paper)}</div></section>` : '')
    + (s.cover   ? chapter('cover', coverHTML(s.cover), s.cover, false, coverExtra(s.cover)) : '')
    + (s.layers  ? chapter('layers', tabsHTML(s.layers.tabs, 'lf-tabs-map') + layersHTML(s.layers), s.layers, true) : '')
    + (s.spreads ? `<section class="lf-ch lf-spreads"><div class="wrap lf-head">${block(s.spreads)}</div><div class="wrap">${spreadsHTML(s.spreads)}</div></section>` : '')
    + (s.outdoor ? `<section class="lf-ch lf-outdoor"><div class="wrap lf-split"><div class="lf-viz">${tabsHTML(s.outdoor.tabs, 'lf-tabs-board')}${outdoorHTML(s.outdoor)}</div>${block(s.outdoor)}</div>${formatsHTML(s.outdoor)}</section>` : '');
  // калька — в самом начале кейса, выше задачи и роли: сразу видно, что страницы прозрачные
  const paper = mount.querySelector('.lf-paper-ch'), scheme = mount.parentElement.querySelector(':scope > .wrap:has(.camp-head)');
  if (paper && scheme) {
    const top = document.createElement('div');
    top.className = 'lf lf-top';
    top.appendChild(paper);
    scheme.before(top);
  }
  mount.parentElement.querySelectorAll('.lf-ch').forEach(el => reveal.observe(el));
  const q = c => mount.querySelector(c);
  if (paper) liveSpreads(paper, s.paper);
  if (s.cover) liveCover(q('.lf-cover'), s.cover);
  if (s.layers) liveLayers(q('.lf-layers'), s.layers);
  if (s.spreads) liveSpreads(q('.lf-spreads'), s.spreads);
  if (s.outdoor) liveOutdoor(q('.lf-outdoor'), s.outdoor);
}
