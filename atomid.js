/* ================================================================
   КЕЙС «РЕДИЗАЙН ЛОГОТИПА АТОМ ID» (поле atomid у проекта, страница NDA)
   Логотипы стоят прямо на странице, без подложек (в дружеской версии
   и на темном фоне черные знаки становятся белыми — фильтр в atomid.css).
   path     — в самом начале, выше задачи и роли: весь путь одним
              взглядом — логотип каждого раунда крупно, под ним строка
              с датами; листается само, пока не тронули;
   refusal  — что уже попробовали: два прежних знака, полоска от подачи
              до отказа заполняется;
   inside   — первый раунд: «ID» прячется в букву «О». Варианты
              сменяются сами (строка надписей с таймером), у каждого
              английская и русская версия по очереди;
   sketches — наброски плиткой: каждый вынут из Фигмы отдельным
              вектором, клетки проявляются по очереди;
   values   — шесть ценностей Росатома кругом, как на их схеме: знак
              в центре, светло-серые сегменты с текстом по дуге;
   ideas    — второй раунд: четыре концепции, у каждой своя «страница»:
              имя, мысль, знак крупно в векторе, лента — рендеры
              и айдентика с цветами; сверху липкое меню концепций;
   names    — третий раунд: три имени против четырех критериев,
              таблица заполняется сама;
   final3   — четвертый раунд: три финалиста рядом, потом у каждого
              своя «страница» — окно браузера с входом и лента айдентики;
              у «Росатом ID» окно само перекрашивается в цвета HR-сервисов,
              отрасли и заказчиков, а черно-белый знак остается тем же;
   final    — Росатом ID: синий в основных сервисах, черно-белый
              в остальных — полная и короткая версии рядами.
   Тексты — в content.js, оформление — atomid.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
const img = n => H.base + 'img/atom-id/' + n;
const logo = (n, cls = '') => `<img class="ri-logo ${cls}" src="${img(n + '.svg')}" alt="" decoding="async">`;
// картинка с легкой копией для телефона
const pic = (n, sizes = '(max-width: 900px) 100vw, 60vw', full = 1920, small = 900) =>
  `src="${img(n + '.webp')}" srcset="${img(n + '-s.webp')} ${small}w, ${img(n + '.webp')} ${full}w" sizes="${sizes}"`;

/* ---------- текст главы ---------- */
const block = (c, extra = '') => `<div class="ri-col">
  ${c.label ? `<span class="case-label ri-label">${H.T(c.label)}</span>` : ''}
  <h2 class="ri-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="ri-text">${H.T(c.text)}</p>` : ''}${c.note ? `<div class="ri-warn" role="note"><i aria-hidden="true">!</i><p>${H.T(c.note)}</p></div>` : ''}${extra}
</div>`;

/* ---------- строка надписей с полоской таймера (как в кейсах Ак Барс и LIFE) ---------- */
const tabsHTML = (tabs, cls = '') => `<div class="ri-tabs ${cls}" role="tablist">${tabs.map((t, i) =>
  `<button type="button" class="ri-tab" role="tab" data-k="${t.k}" aria-selected="${i ? 'false' : 'true'}">${H.T(t.t)}<i class="ri-tick"></i></button>`).join('')}</div>`;
// листает само, пока видно и пока не нажали; нажатие — дальше только руками
function autoTabs(box, tabsEl, ms, set){
  const tabs = [...tabsEl.querySelectorAll('.ri-tab')];
  let at = 0, t, on = false, hand = false;
  tabsEl.style.setProperty('--ms', ms + 'ms');
  const go = (i, run) => {
    at = (i + tabs.length) % tabs.length;
    tabs.forEach((b, j) => { b.setAttribute('aria-selected', j === at); b.classList.remove('run'); });
    if (run) { void tabs[at].offsetWidth; tabs[at].classList.add('run'); }
    set(tabs[at].dataset.k, at);
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
  return { stop: () => { hand = true; clearTimeout(t); } };
}

/* ================================================================
   path — весь путь: логотип раунда крупно и строка с датами
   ================================================================ */
function pathHTML(c){
  return `<div class="ri-path" style="--n:${c.steps.length}">
    <div class="ri-stage" aria-hidden="true">${c.steps.map((s, i) =>
      `<div class="ri-frame${i ? '' : ' on'}" data-i="${i}">${logo(s.logo)}</div>`).join('')}</div>
    <div class="ri-rail" role="tablist"><i class="ri-line"><b></b></i>${c.steps.map((s, i) =>
      `<button type="button" class="ri-stop" role="tab" data-i="${i}" aria-selected="${i ? 'false' : 'true'}">
        <span class="ri-dot"></span><span class="ri-when">${esc(s.when)}</span><span class="ri-what">${H.T(s.t)}</span></button>`).join('')}</div>
  </div>`;
}
function livePath(box){
  const path = box.querySelector('.ri-path');
  const frames = [...path.querySelectorAll('.ri-frame')], stops = [...path.querySelectorAll('.ri-stop')];
  let at = 0, t, on = false, hand = false;
  const go = i => {
    at = (i + frames.length) % frames.length;
    frames.forEach((f, j) => f.classList.toggle('on', j === at));
    stops.forEach((b, j) => { b.setAttribute('aria-selected', j === at); b.classList.toggle('past', j < at); });
    path.style.setProperty('--at', at);
  };
  const next = () => {
    clearTimeout(t);
    if (!on || hand || still()) return;
    // на финале — чуть дольше, чтобы новое имя успели рассмотреть
    t = setTimeout(() => { go(at + 1); next(); }, at === frames.length - 1 ? 3600 : 2200);
  };
  stops.forEach((b, i) => {
    b.addEventListener('click', () => { hand = true; clearTimeout(t); go(i); });
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hand = true; clearTimeout(t); go(i); } });
  });
  onScreen(path, v => { on = v; if (v) next(); else clearTimeout(t); }, .4);
  go(0);
}

/* ================================================================
   refusal — что уже попробовали: два знака, полоска «подача → отказ»
   ================================================================ */
function refusalHTML(c){
  return `<div class="ri-refusal">
    <div class="ri-olds">
      <figure class="ri-old">${logo('old-dots')}<figcaption>${H.T(c.first)}</figcaption></figure>
      <figure class="ri-old">${logo('old-orbit')}<figcaption>${H.T(c.second)}</figcaption></figure>
    </div>
    <div class="ri-wait">
      <span class="ri-date"><small>${H.T(c.from)}</small>${esc(c.dateFrom)}</span>
      <i class="ri-wait-line"><b></b></i>
      <span class="ri-date ri-date-to"><small>${H.T(c.to)}</small>${esc(c.dateTo)}</span>
    </div>
  </div>`;
}

/* ================================================================
   inside — «ID» в букве «О»: варианты и языки сменяются сами
   ================================================================ */
function insideHTML(c){
  return `${tabsHTML(c.tabs, 'ri-tabs-in')}
  <div class="ri-word" data-k="${c.tabs[0].k}" data-l="en">
    <div class="ri-word-in">${c.tabs.map(t =>
      ['en', 'ru'].map(l => `<div class="ri-word-v" data-k="${t.k}" data-l="${l}">${logo('r1-' + t.k + '-' + l)}</div>`).join('')).join('')}</div>
    <div class="ri-lang" role="group">
      <button type="button" class="ri-lang-b" data-l="en" aria-pressed="true">${H.T(c.en)}</button>
      <button type="button" class="ri-lang-b" data-l="ru" aria-pressed="false">${H.T(c.ru)}</button>
    </div>
  </div>`;
}
function liveInside(box){
  const word = box.querySelector('.ri-word');
  const langs = [...word.querySelectorAll('.ri-lang-b')];
  let lt, hand = false, on = false;
  const setLang = l => { word.dataset.l = l; langs.forEach(b => b.setAttribute('aria-pressed', b.dataset.l === l)); };
  // язык меняется посередине каждого варианта: сначала английский, потом русский
  const flip = () => { clearTimeout(lt); if (!on || hand || still()) return; lt = setTimeout(() => setLang('ru'), 1900); };
  const tabs = autoTabs(box, box.querySelector('.ri-tabs'), 3800, k => { word.dataset.k = k; if (!hand) { setLang('en'); flip(); } });
  langs.forEach(b => b.addEventListener('click', () => { hand = true; clearTimeout(lt); tabs.stop(); setLang(b.dataset.l); }));
  box.querySelectorAll('.ri-tab').forEach(b => b.addEventListener('click', () => { hand = true; clearTimeout(lt); }));
  onScreen(box, v => { on = v; if (v) flip(); else clearTimeout(lt); }, .35);
}

/* ================================================================
   sketches — наброски плиткой: знак — клетка, надпись — две клетки
   ================================================================ */
function sketchesHTML(c){
  // надписи вставляются между знаками через равные промежутки, чтобы плитка не расслаивалась
  const cell = (n, w, i) => `<span class="ri-sk${w ? ' ri-sk-w' : ''}" style="--i:${i}"><img src="${img('sk/sk-' + n + '.svg')}" alt="" loading="lazy" decoding="async"></span>`;
  const out = [], step = Math.max(1, Math.round(c.marks.length / c.words.length));
  let w = 0;
  c.marks.forEach((m, i) => {
    out.push(cell(m, false, out.length));
    if ((i + 1) % step === 0 && w < c.words.length) out.push(cell(c.words[w++], true, out.length));
  });
  while (w < c.words.length) out.push(cell(c.words[w++], true, out.length));
  return `<div class="ri-sks" role="img" aria-label="${esc(H.pick(c.title))}">${out.join('')}</div>`;
}

/* ================================================================
   лента айдентики: плитки из Фигмы одной высоты и цвета; едет сама,
   пока не тронули; крупно не открывается
   ================================================================ */
function stripHTML(k, it, open){
  // подпись цвета: темная на светлых плашках, белая на темных
  const ink = c => { const m = /^#(..)(..)(..)$/.exec(c); if (!m) return '#fff';
    const [r, g, b] = m.slice(1).map(h => parseInt(h, 16) / 255); return .2126 * r + .7152 * g + .0722 * b > .55 ? '#1D1D1B' : '#fff'; };
  const sw = it.pal.map(c => `<span class="ri-sw" style="background:${c};color:${ink(c)}"><b>${/^#/.test(c) ? c : ''}</b></span>`).join('');
  const all = stripList(k, it);
  // плитки не увеличиваются; у светлых по краю — серая рамка, иначе они сливаются со страницей.
  // ряд повторен дважды: лента едет по кругу без конца
  const row = hidden => all.map(n =>
    `<span class="ri-pc${/^p-/.test(n) ? '' : ' ri-pc-r'}${LIGHT.includes(n) ? ' ri-pc-light' : ''}"${hidden ? ' aria-hidden="true"' : ''}><img ${/^p-/.test(n) ? pic(n, '(max-width: 900px) 70vw, 40vw', 1800, 900) : pic(n, '(max-width: 900px) 100vw, 60vw')} alt="" loading="lazy" decoding="async"></span>`).join('')
    + `<div class="ri-pal"${hidden ? ' data-copy' : ''} aria-hidden="true">${sw}</div>`;
  return `<div class="ri-strip"><div class="ri-strip-in">${row(false)}${row(true)}</div></div>`;
}
// плитки со светлым краем (посчитано по картинкам) — им нужна рамка
const LIGHT = ['p-shield-wide', 'p-cycle-wide', 'p-oval-sq', 'p-oval-wide', 'p-portal-wide', 'p-ros-sq', 'p-steps-wide'];
// сначала рендеры (lead), потом плитки айдентики
const stripList = (k, it) => (it.lead || []).concat(it.pieces.map(p => 'p-' + k + '-' + p));
function liveStrip(box){
  const strip = box.querySelector('.ri-strip'), inner = strip.firstElementChild;
  // первая плитка второй копии ряда: на ее месте лента незаметно возвращается к началу
  const firstCopy = () => inner.children[inner.children.length / 2];
  // лента сама плавно едет вправо по кругу; наведение — пауза, касание пальцем — пауза на 4 с
  let raf = 0, on = false, hold = false, last = 0, x = 0, t;
  const loop = now => {
    const dt = Math.min(50, now - (last || now)); last = now;
    const half = firstCopy().offsetLeft - inner.firstElementChild.offsetLeft;
    if (!hold && half > 0) { x += dt * .045; if (x >= half) x -= half; strip.scrollLeft = x; }
    if (on) raf = requestAnimationFrame(loop);
  };
  strip.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hold = true; });
  strip.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hold = false; x = strip.scrollLeft; } });
  strip.addEventListener('touchstart', () => { hold = true; clearTimeout(t); }, { passive: true });
  strip.addEventListener('touchend', () => { clearTimeout(t); t = setTimeout(() => { x = strip.scrollLeft; hold = false; }, 4000); }, { passive: true });
  onScreen(strip, v => {
    on = v; cancelAnimationFrame(raf); last = 0;
    if (v && !still()) { x = strip.scrollLeft; raf = requestAnimationFrame(loop); }
  }, .2);
}

/* ================================================================
   values — шесть ценностей Росатома кругом, как на их схеме: знак
   в центре (свой цвет, вырезан из полного логотипа), вокруг шесть
   светло-серых сегментов, текст черный по дуге; сегменты по очереди
   становятся темнее. Размер букв в пикселях не меньше 16 — пересчет
   при изменении ширины
   ================================================================ */
function valuesHTML(c){
  const V = 600, cx = 300, cy = 300, R1 = 290, R0 = 176, gap = 2.4, n = c.items.length;
  const rad = d => (d - 90) * Math.PI / 180;
  const P = (d, r) => `${(cx + r * Math.cos(rad(d))).toFixed(1)} ${(cy + r * Math.sin(rad(d))).toFixed(1)}`;
  const seg = i => { const a0 = i * 360 / n - 180 / n + gap, a1 = i * 360 / n + 180 / n - gap;
    return `M${P(a0, R1)}A${R1} ${R1} 0 0 1 ${P(a1, R1)}L${P(a1, R0)}A${R0} ${R0} 0 0 0 ${P(a0, R0)}Z`; };
  // дуга для текста: сверху — по часовой, снизу — против, чтобы буквы стояли ровно
  const arc = (i, r) => { const mid = i * 360 / n, a0 = mid - 28, a1 = mid + 28, down = Math.cos(rad(mid) + Math.PI / 2) < -.01;
    return down ? `M${P(a1, r)}A${r} ${r} 0 0 0 ${P(a0, r)}` : `M${P(a0, r)}A${r} ${r} 0 0 1 ${P(a1, r)}`; };
  const D = 236, ar = 913.619 / 151.808;
  let defs = '', segs = '';
  c.items.forEach((t, i) => {
    const lines = H.pick(t).split('/'), mid = (R0 + R1) / 2, down = Math.cos(rad(i * 360 / n) + Math.PI / 2) < -.01;
    const rs = lines.length === 1 ? [mid] : down ? [mid - 12, mid + 12] : [mid + 12, mid - 12];
    segs += `<g class="ri-v-seg" data-i="${i}"><path d="${seg(i)}"/>${lines.map((l, j) => {
      defs += `<path id="riVa${i}${j}" d="${arc(i, rs[j])}"/>`;
      return `<text dy=".35em"><textPath href="#riVa${i}${j}" startOffset="50%" text-anchor="middle">${esc(l)}</textPath></text>`;
    }).join('')}</g>`;
  });
  return `<div class="ri-vals"><svg viewBox="0 0 ${V} ${V}" role="img" aria-label="${esc(c.items.map(t => H.pick(t).replace('/', ' ')).join(', '))}">
    <defs>${defs}<clipPath id="riVsign"><rect x="${cx - D / 2}" y="${cy - D / 2}" width="${D}" height="${D}"/></clipPath></defs>
    ${segs}
    <image href="${img('fin-full.svg')}" x="${cx - D / 2}" y="${cy - D / 2}" width="${(D * ar).toFixed(1)}" height="${D}" clip-path="url(#riVsign)" preserveAspectRatio="xMinYMid meet"/>
  </svg></div>`;
}
function liveValues(box){
  const svg = box.querySelector('.ri-vals svg'), segs = [...svg.querySelectorAll('.ri-v-seg')];
  // буквы не мельче 16 px на экране, на большом — 19 px
  const fit = () => { const w = svg.getBoundingClientRect().width || 600; svg.style.setProperty('--fs', Math.max(19, 16 * 600 / w).toFixed(1)); };
  new ResizeObserver(fit).observe(svg); fit();
  let at = 0, t, on = false;
  const go = i => { at = i % segs.length; segs.forEach((g, j) => g.classList.toggle('on', j === at)); };
  const next = () => { clearTimeout(t); if (!on || still()) return; t = setTimeout(() => { go(at + 1); next(); }, 1400); };
  onScreen(box, v => { on = v; if (v) next(); else clearTimeout(t); }, .3);
  go(0);
}

/* ---------- липкое меню концепций (как в кейсе HR-экосистемы) ---------- */
function navHTML(items, label){
  return `<nav class="ri-nav" aria-label="${esc(H.pick(label))}"><div class="wrap"><div class="ri-nav-in" style="--n:${items.length}">${items.map(it =>
    `<button type="button" class="ri-nv" data-go="${it.k}"><span>${H.T(it.t)}</span><i class="ri-prog"><b></b></i></button>`).join('')}</div></div></nav>`;
}
function liveNav(box){
  const sc = box.closest('.case') || document.scrollingElement;
  const nav = box.querySelector('.ri-nav'), tabs = [...nav.querySelectorAll('.ri-nv')];
  const pages = [...box.querySelectorAll('.ri-page')];
  const go = k => {
    const el = box.querySelector(`.ri-page[data-k="${k}"]`); if (!el) return;
    const under = nav.getBoundingClientRect().height + parseFloat(getComputedStyle(nav).top || 0);
    const top = el.getBoundingClientRect().top - (sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top) - under + 1;
    sc.scrollTo({ top: sc.scrollTop + top, behavior: still() ? 'auto' : 'smooth' });
  };
  nav.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  let raf = 0;
  const upd = () => {
    raf = 0;
    const line = nav.getBoundingClientRect().bottom;
    let on = -1;
    pages.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      tabs[i].style.setProperty('--k', clamp((line - r.top) / Math.max(1, r.height - (innerHeight - line)), 0, 1).toFixed(3));
      if (r.top <= line + 2 && r.bottom > line + 2) on = i;
    });
    tabs.forEach((t, i) => t.classList.toggle('on', i === on));
    nav.classList.toggle('stuck', on >= 0);
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(upd); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  upd();
  return go;
}

/* ================================================================
   ideas — четыре концепции, у каждой своя «страница»
   ================================================================ */
const pageHead = (it, mark = '') => `<div class="wrap ri-page-head">
    <div class="ri-page-t"><h3 class="ri-name">${H.T(it.t)}</h3><p class="ri-text">${H.T(it.idea)}</p></div>
    ${mark ? `<div class="ri-page-mark">${mark}</div>` : ''}
  </div>`;
// главная картинка концепции — сам знак в векторе, крупно; у «ключа» — русская и английская версии
function ideaPage(it, c){
  return `<article class="ri-page" data-k="${it.k}">
    ${pageHead(it)}
    <div class="wrap"><div class="ri-sign${it.mark2 ? ' ri-sign-2' : ''}">${logo(it.mark)}${it.mark2 ? logo(it.mark2) : ''}</div></div>
    <div class="wrap">${stripHTML(it.k, it, c.open)}</div>
  </article>`;
}
function liveIdeas(box, c){
  liveNav(box);
  c.items.forEach(it => liveStrip(box.querySelector(`.ri-page[data-k="${it.k}"]`)));
}

/* ================================================================
   names — три имени и четыре критерия, таблица заполняется сама
   ================================================================ */
const YES = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const NO  = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
function namesHTML(c){
  let d = 0;
  const head = `<div class="ri-nt-c ri-nt-h"></div>${c.cols.map((n, j) => `<div class="ri-nt-c ri-nt-h ri-nt-name${j === 2 ? ' best' : ''}">${esc(n)}</div>`).join('')}`;
  const rows = c.rows.map(r => `<div class="ri-nt-c ri-nt-crit">${H.T(r.t)}</div>${r.v.map((v, j) =>
    `<div class="ri-nt-c ri-nt-v ${v ? 'yes' : 'no'}${j === 2 ? ' best' : ''}" style="--d:${(d++) * 110}ms">${v ? YES : NO}<span>${H.T(r.n[j])}</span></div>`).join('')}`).join('');
  return `<div class="ri-nt" role="table">${head}${rows}</div>`;
}

/* ================================================================
   final3 — три финалиста: рядом, потом у каждого своя «страница»
   ================================================================ */
const BACK = '<svg class="ri-back" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5m6-7l-7 7 7 7"/></svg>';
const CROSS = '<svg class="ri-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
const SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z"/></svg>';
// окно браузера: вкладка с фавиконом и названием, строка адреса, страница входа.
// фавикон — знак из логотипа (край fav[0], клетка fav[1] к высоте) белым на черной плашке
const loginHTML = (it, c) => `${it.themes ? tabsHTML(it.themes, 'ri-tabs-th') : ''}<div class="ri-login"${it.themes ? ` data-th="${it.themes[0].k}"` : ''}>
    <div class="ri-win">
      <div class="ri-tabs-bar"><span class="ri-wtab">
        <i class="ri-fav"><b style="background-image:url(${img(it.logo + '.svg')});background-position:${it.fav[0]} center;aspect-ratio:${it.fav[1]}"></b></i>
        <span class="ri-wtab-t">${esc(it.name)}</span>${CROSS}</span></div>
      <div class="ri-bar">${BACK}<div class="ri-addr">${SHIELD}<span>${esc(it.url)}</span></div></div>
      <div class="ri-site">
        ${it.themes ? `<div class="ri-head-bar">${logo(it.logo, 'ri-keep')}<i></i><i></i><i></i></div>` : ''}
        <div class="ri-card">
          <div class="ri-card-logo">${logo(it.logo, 'ri-keep')}</div>
          <div class="ri-form">
            <b class="ri-signin">${H.T(c.sign)}</b>
            <span class="ri-lbl">${H.T(c.login)}</span><span class="ri-input">i.petrov</span>
            <span class="ri-lbl">${H.T(c.pass)}</span><span class="ri-input ri-dots">••••••••</span>
            <span class="ri-go">${H.T(c.go)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
function final3HTML(c){
  const trio = `<div class="wrap"><div class="ri-trio">${c.items.map(it =>
    `<button type="button" class="ri-trio-i ri-trio-${it.k}" data-go="${it.k}" aria-label="${esc(H.pick(it.t))}"><span class="ri-trio-l">${logo(it.logo)}</span></button>`).join('')}</div></div>`;
  const pages = c.items.map(it => `<article class="ri-page" data-k="${it.k}">
    ${pageHead(it, `<div class="ri-pair"><figure>${logo(it.logo)}<figcaption>${H.T(c.ru)}</figcaption></figure><figure>${logo(it.logo2)}<figcaption>${H.T(c.en)}</figcaption></figure></div>`)}
    <div class="wrap">${loginHTML(it, c)}</div>
    <div class="wrap">${stripHTML(it.k, it, c.open)}</div>
  </article>`).join('');
  return trio + navHTML(c.items, c.title) + pages;
}
function liveFinal3(box, c){
  const go = liveNav(box);
  c.items.forEach(it => {
    const page = box.querySelector(`.ri-page[data-k="${it.k}"]`);
    liveStrip(page);
    // расцветки сервисов: окно перекрашивается, знак остается черно-белым
    if (it.themes) { const win = page.querySelector('.ri-login'); autoTabs(page, page.querySelector('.ri-tabs-th'), 2800, k => { win.dataset.th = k; }); }
  });
  box.querySelectorAll('.ri-trio-i').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
}

/* ================================================================
   final — Росатом ID: версии и монохром на трех интерфейсах
   ================================================================ */
function finalHTML(c){
  return `<div class="ri-fin">${c.rows.map(r => `<div class="ri-fin-row">
    <span class="ri-fin-t">${H.T(r.t)}</span>
    <figure class="ri-fin-v ri-fin-full">${logo(r.full)}<figcaption>${H.T(c.full)}</figcaption></figure>
    <figure class="ri-fin-v ri-fin-short">${logo(r.short)}<figcaption>${H.T(c.short)}</figcaption></figure>
  </div>`).join('')}</div>${c.palette ? `<div class="ri-brand"><p class="ri-brand-t">${H.T(c.palette.t)}</p>
    <div class="ri-brand-sw" aria-hidden="true">${c.palette.colors.map((col, i) => `<i style="background:${col};--i:${i}"></i>`).join('')}</div></div>` : ''}`;
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'atomid.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

const split = (k, viz, c, rev, extra = '') =>
  `<section class="ri-ch ri-ch-${k}"><div class="wrap ri-split${rev ? ' rev' : ''}"><div class="ri-viz">${viz}</div>${block(c, extra)}</div></section>`;
const wide = (k, viz, c) =>
  `<section class="ri-ch ri-ch-${k}"><div class="wrap ri-head">${block(c)}</div><div class="wrap ri-wide">${viz}</div></section>`;

export async function mountAtomId(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const s = p.atomid;
  mount.innerHTML =
      (s.path     ? `<section class="ri-ch ri-path-ch"><div class="wrap">${pathHTML(s.path)}</div></section>` : '')
    + (s.refusal  ? split('refusal', refusalHTML(s.refusal), s.refusal, false) : '')
    + (s.inside   ? split('inside', insideHTML(s.inside), s.inside, true) : '')
    + (s.sketches ? wide('sketches', sketchesHTML(s.sketches), s.sketches) : '')
    + (s.values   ? wide('values', valuesHTML(s.values), s.values) : '')
    + (s.ideas    ? `<section class="ri-ch ri-ch-ideas ri-deck"><div class="wrap ri-head">${block(s.ideas)}</div>${navHTML(s.ideas.items, s.ideas.menu)}${s.ideas.items.map(it => ideaPage(it, s.ideas)).join('')}</section>` : '')
    + (s.names    ? wide('names', namesHTML(s.names), s.names) : '')
    + (s.final3   ? `<section class="ri-ch ri-ch-final3 ri-deck"><div class="wrap ri-head">${block(s.final3)}</div>${final3HTML(s.final3)}</section>` : '')
    + (s.final    ? wide('final', finalHTML(s.final), s.final) : '');
  // путь — в самом начале кейса, выше задачи и роли
  const path = mount.querySelector('.ri-path-ch'), scheme = mount.parentElement.querySelector(':scope > .wrap:has(.camp-head)');
  if (path && scheme) {
    const top = document.createElement('div');
    top.className = 'ri ri-top';
    top.appendChild(path);
    scheme.before(top);
  }
  mount.parentElement.querySelectorAll('.ri-ch, .ri-page').forEach(el => reveal.observe(el));
  const q = c => mount.querySelector(c);
  if (path) livePath(path);
  if (s.inside) liveInside(q('.ri-ch-inside'));
  if (s.values) liveValues(q('.ri-ch-values'));
  if (s.ideas) liveIdeas(q('.ri-ch-ideas'), s.ideas);
  if (s.final3) liveFinal3(q('.ri-ch-final3'), s.final3);
}
