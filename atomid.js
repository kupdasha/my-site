/* ================================================================
   КЕЙС «РЕДИЗАЙН ЛОГОТИПА АТОМ ID» (поле atomid у проекта, страница NDA)
   Логотипы стоят прямо на странице, без подложек (в дружеской версии
   и на темном фоне черные знаки становятся белыми — фильтр в atomid.css).
   entry    — в самом начале, выше задачи и роли: продукт одной
              картинкой — сотрудник, одна дверь, 34 системы; линии
              прорисовываются, по ним бегут импульсы, счетчики
              «200 000+ входов в день» и «34 системы» накручиваются;
   path     — весь путь по раундам (убран по просьбе 04.11, код остался);
   refusal  — что уже попробовали: два прежних знака и короткое описание
              (полоска с датами, штамп и пиктограммы причин — только если
              они заданы в content.js; с 04.11 убраны);
   inside   — первый раунд: «ID» прячется в букву «О». Варианты
              сменяются сами (строка надписей с таймером), у каждого
              английская и русская версия по очереди;
   sketches — наброски плиткой: каждый вынут из Фигмы отдельным
              вектором, клетки проявляются по очереди;
   values   — шесть ценностей Росатома кругом, как на их схеме: настоящий
              знак Росатома в центре, светло-серые сегменты с текстом по дуге;
   ideas    — второй раунд: четыре концепции, у каждой своя «страница»:
              слева имя и мысль, справа инфографика к знаку (pict или bars —
              у «этапов» ступени лестницей вправо вверх), знак крупно —
              вектор вставлен в страницу и собирается из частей (точки,
              полоски, буквы) каждый раз, как попадает на экран, лента —
              рендеры и айдентика с цветами; сверху липкое меню концепций;
   names    — третий раунд: три имени против четырех критериев,
              таблица заполняется сама, внизу итог — счет галочек;
   blue     — первый «Росатом ID»: синее «iD», полная и короткая версия
   final3   — четвертый раунд: три финалиста рядом, потом у каждого
              своя «страница» — окно браузера с входом и лента айдентики;
              у «Росатом ID» окно само перекрашивается в цвета HR-сервисов,
              отрасли и заказчиков, а черно-белый знак остается тем же;
              в окне сам печатается логин и нажимается «Продолжить»;
   final    — Росатом ID: (шторка «было / стало» — только если заданы
              beforeLogo/afterLogo, с 04.11 убрана), синий в основных сервисах и черно-белый
              в остальных рядами, короткая версия в размерах от фавикона
              до экрана входа, палитра брендбука.
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

// число накручивается от нуля: разряды через тонкий пробел
const fmtNum = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
function countUp(el, to, ms = 2200, delay = 0){
  const suf = el.dataset.suf || '';
  if (still()) { el.textContent = fmtNum(to) + suf; return; }
  let t0 = 0;
  const step = now => { if (!t0) t0 = now; const k = clamp((now - t0 - delay) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmtNum(to * e) + (k >= 1 ? suf : ''); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
// пиктограммы: штрих 2 px, 24-сетка, рисуются текущим цветом
const ICONS = {
  pass:  '<rect x="3" y="7" width="18" height="10" rx="3"/><circle cx="8" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  code:  '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 11h4M10 14h2.5"/>',
  face:  '<path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><circle cx="9.5" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M9.5 14.5c1.2 1.3 3.8 1.3 5 0"/>',
  door:  '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="15" cy="12.5" r="1.2" fill="currentColor" stroke="none"/><path d="M5 21h14"/>',
  lock:  '<rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none"/><path d="M12 16.3v1.8"/>',
  A:     '<path d="M4.5 20L12 4l7.5 16M7.6 14h8.8"/>',
  six:   '<circle cx="12" cy="4" r="2.2"/><circle cx="18.9" cy="8" r="2.2"/><circle cx="18.9" cy="16" r="2.2"/><circle cx="12" cy="20" r="2.2"/><circle cx="5.1" cy="16" r="2.2"/><circle cx="5.1" cy="8" r="2.2"/>',
  atoms: '<circle cx="7" cy="7" r="2.6"/><circle cx="17" cy="6" r="2.6"/><circle cx="12" cy="13" r="2.6"/><circle cx="5.5" cy="18" r="2.6"/><circle cx="18.5" cy="17" r="2.6"/><path d="M9.3 8.4l1.4 2.2M14.6 8.1l-1.3 2.4M9.9 15.2l-2.2 1.5M14.2 15.1l2.4 1.4" stroke-width="1.4"/>',
  id:    '<rect x="3" y="5" width="18" height="14" rx="3" stroke-dasharray="3 2.5"/><path d="M8.5 9v6M12 9h2.6a3 3 0 0 1 0 6H12z"/>',
  key:   '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2.5"/>',
  person:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
};
const icon = (k, cls = '') => `<svg class="ri-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ''}</svg>`;
// кусок логотипа как картинка-значок: край side, клетка квадратная
const markIcon = (n, side) => `<i class="ri-ic ri-ic-img" style="background-image:url(${img(n + '.svg')});background-position:${side} center"></i>`;

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
   entry — продукт одной картинкой: сотрудник → одна дверь → 34 системы.
   Линии к системам прорисовываются по очереди, плитки загораются,
   по линиям без конца бегут импульсы (animateMotion, без скриптов);
   рядом счетчики входов и систем накручиваются от нуля
   ================================================================ */
function entryHTML(c){
  const W = 1000, Hh = 480, cy = Hh / 2;
  const px = 110, dx = 420, dw = 104, dh = 148;             // сотрудник и дверь
  const gx = 560, cols = 6, cell = 58, gap = 12;            // сетка систем 6 × 6, последние две клетки пустые
  const n = c.systems, rows = Math.ceil(n / cols), gy = cy - (rows * (cell + gap) - gap) / 2;
  let lines = '', tiles = '', pulses = '';
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), col = i % cols;
    const tx = gx + col * (cell + gap), ty = gy + r * (cell + gap) + cell / 2;
    const x0 = dx + dw, x1 = tx;
    const d = `M${x0} ${cy}C${x0 + 70} ${cy} ${x1 - 90} ${ty} ${x1} ${ty}`;
    lines += `<path id="riE${i}" class="ri-e-line" d="${d}" pathLength="1" style="--i:${i}"/>`;
    tiles += `<rect class="ri-e-tile" x="${tx}" y="${ty - cell / 2}" width="${cell}" height="${cell}" rx="14" style="--i:${i}"/>`;
    // импульс по каждой третьей линии, со сдвигом по времени
    if (i % 3 === 0) pulses += `<circle class="ri-e-pulse" r="5"><animateMotion dur="${(2.2 + (i % 5) * .35).toFixed(2)}s" begin="${(i * .17).toFixed(2)}s" repeatCount="indefinite"><mpath href="#riE${i}"/></animateMotion></circle>`;
  }
  const walk = `M${px + 52} ${cy}L${dx} ${cy}`;
  return `<div class="ri-entry">
    <div class="ri-e-nums">
      <div class="ri-e-num"><b class="ri-num" data-to="${c.count}" data-suf="+">0</b><span>${H.T(c.countT)}</span></div>
      <div class="ri-e-num"><b class="ri-num" data-to="${c.systems}">0</b><span>${H.T(c.systemsT)}</span></div>
    </div>
    <svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(H.pick(c.title))}">
      <path id="riEw" class="ri-e-line ri-e-walk" d="${walk}" pathLength="1"/>
      ${lines}
      <g class="ri-e-who"><circle cx="${px}" cy="${cy - 56}" r="22"/><path d="M${px - 40} ${cy + 36}c0-26 18-42 40-42s40 16 40 42"/></g>
      <text class="ri-e-t" x="${px}" y="${cy + 72}" text-anchor="middle">${esc(H.pick(c.who))}</text>
      <g class="ri-e-door"><rect x="${dx}" y="${cy - dh / 2}" width="${dw}" height="${dh}" rx="16"/>
        <rect x="${dx + 36}" y="${cy - 18}" width="32" height="36" rx="8" class="ri-e-hole"/><circle cx="${dx + 52}" cy="${cy - 4}" r="5" class="ri-e-pin"/><path d="M${dx + 52} ${cy}v10" class="ri-e-pin2"/></g>
      <text class="ri-e-t" x="${dx + dw / 2}" y="${cy + dh / 2 + 30}" text-anchor="middle">${esc(H.pick(c.door))}</text>
      ${tiles}
      <circle class="ri-e-pulse" r="5"><animateMotion dur="1.6s" repeatCount="indefinite"><mpath href="#riEw"/></animateMotion></circle>
      ${pulses}
    </svg>
  </div>`;
}
function liveEntry(box, c){
  const nums = [...box.querySelectorAll('.ri-num')], svg = box.querySelector('svg');
  // подписи в схеме не мельче 16 px на экране — пересчет по ширине
  const fit = () => { const w = svg.getBoundingClientRect().width || 1000; svg.style.setProperty('--fs', Math.max(18, 16 * 1000 / w).toFixed(1)); };
  new ResizeObserver(fit).observe(svg); fit();
  let done = false;
  onScreen(box, v => { if (v && !done) { done = true; nums.forEach((el, i) => countUp(el, +el.dataset.to, i ? 1600 : 2400, 500)); } }, .35);
}

/* ================================================================
   refusal — что уже попробовали: два знака, полоска «подача → отказ»
   с месяцами, штамп, причины пиктограммами
   ================================================================ */
function refusalHTML(c){
  // 18 месяцев между подачей и отказом — рисками по полоске (только если в content.js есть даты)
  const ticks = Array.from({ length: 19 }, (_, i) => `<i style="left:${(i / 18 * 100).toFixed(2)}%"></i>`).join('');
  const cap = t => t ? `<figcaption>${H.T(t)}</figcaption>` : '';
  return `<div class="ri-refusal">
    <div class="ri-olds">
      <figure class="ri-old">${logo('old-dots')}${cap(c.first)}</figure>
      <figure class="ri-old">${logo('old-orbit2')}${cap(c.second)}</figure>
    </div>${c.dateFrom ? `
    <div class="ri-wait">
      <span class="ri-date"><small>${H.T(c.from)}</small>${esc(c.dateFrom)}</span>
      <span class="ri-wait-line"><span class="ri-ticks" aria-hidden="true">${ticks}</span><b></b><em>${H.T(c.months)}</em></span>
      <span class="ri-date ri-date-to"><small>${H.T(c.to)}</small>${esc(c.dateTo)}<span class="ri-stamp" aria-hidden="true">${H.T(c.stamp)}</span></span>
    </div>` : ''}
  </div>`;
}
const whyHTML = c => `<div class="ri-why">${c.why.map(w => `<span class="ri-why-i">${icon(w.ic)}<span>${H.T(w.t)}</span></span>`).join('')}</div>`;

/* ---------- пиктограммы мысли: ряд значков со стрелками или столбики ---------- */
function pictHTML(it){
  // этапы — лестница вправо вверх: шаг за шагом, длина ступени — сколько длится проверка
  if (it.bars) {
    const total = it.bars.reduce((a, b) => a + b.h, 0), n = it.bars.length;
    let at = 0;
    return `<div class="ri-stairs" style="--n:${n}" aria-hidden="true">${it.bars.map((b, i) => {
      const left = at / total * 100, w = b.h / total * 100; at += b.h;
      return `<span class="ri-step" style="--i:${i};left:${left.toFixed(2)}%;width:${w.toFixed(2)}%;bottom:calc(${i} * var(--row))"><i></i><span>${H.T(b.t)}</span></span>`;
    }).join('')}</div>`;
  }
  if (!it.pict) return '';
  return `<div class="ri-pict" aria-hidden="true">${it.pict.map((p, i) => typeof p === 'string'
    ? `<span class="ri-pict-sep">${esc(p)}</span>`
    : `<span class="ri-pict-i" style="--i:${i}">${p.img ? markIcon(p.img, p.side) : icon(p.ic)}<span>${H.T(p.t)}</span></span>`).join('')}</div>`;
}

/* ---------- знак крупно: вектор вставляется в страницу и собирается из частей ---------- */
let svgCache = {};
async function inlineLogo(host, name){
  // jsDelivr по свежему номеру версии иногда отвечает 403 — тогда текст знака берется с GitHub
  if (!svgCache[name]) svgCache[name] = fetch(img(name + '.svg')).then(r => r.ok ? r.text() : Promise.reject())
    .catch(() => fetch('https://raw.githubusercontent.com/kupdasha/my-site/main/img/atom-id/' + name + '.svg').then(r => r.text()));
  let txt = await svgCache[name];
  if (!host.isConnected) return;
  // у каждого вставленного вектора свои id, иначе обтравки разных знаков перепутаются
  const pfx = 'ri' + name.replace(/\W/g, '') + '_';
  txt = txt.replace(/id="/g, `id="${pfx}`).replace(/url\(#/g, `url(#${pfx}`).replace(/href="#/g, `href="#${pfx}`);
  const doc = new DOMParser().parseFromString(txt, 'image/svg+xml'), svg = doc.documentElement;
  svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('class', 'ri-logo-v');
  const parts = [...svg.querySelectorAll('path, image, rect, circle, ellipse')].filter(e => !e.closest('defs, clipPath'));
  parts.forEach((e, i) => { e.classList.add('ri-part'); e.style.setProperty('--i', i); });
  host.replaceChildren(svg);
  host.classList.add('ri-sign-v');
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
    `<span class="ri-pc${/^p-/.test(n) ? '' : ' ri-pc-r'}${LIGHT.includes(n) ? ' ri-pc-light' : ''}"${hidden ? ' aria-hidden="true"' : ''}${RATIO[n] ? ` style="aspect-ratio:${RATIO[n]}"` : ''}><img ${(/^p-/.test(n) ? pic(n, tileSizes(n, '(max-width: 900px) 70vw, 40vw'), 1800, 900) : pic(n, tileSizes(n, '(max-width: 900px) 100vw, 60vw'))).replace(/(^| )(src|srcset)=/g, '$1data-$2=')} alt="" decoding="async"></span>`).join('')
    + `<div class="ri-pal"${hidden ? ' data-copy' : ''} aria-hidden="true">${sw}</div>`;
  return `<div class="ri-strip"><div class="ri-strip-in">${row(false)}${row(true)}</div></div>`;
}
// пропорции плиток (ширина к высоте): место под картинку есть до загрузки — лента не прыгает и палитра не стоит одна
// ширина плитки на экране — по высоте ленты (до 480 px, на телефоне 260 px): браузер берет картинку нужного размера
const tileSizes = (n, def) => RATIO[n] ? `(max-width: 900px) ${Math.round(RATIO[n] * 260)}px, ${Math.round(RATIO[n] * 480)}px` : def;
const RATIO = {"c-cycle-hero":1.7778,"c-portal-hero":1.7778,"c-steps-hero":1.7778,"p-cycle-right":0.6956,"p-cycle-sq":1.1356,"p-cycle-tall":0.725,"p-cycle-ui":1.8499,"p-cycle-wide":1.873,"p-key-right":0.6956,"p-key-sq":1.1356,"p-key-tall":0.725,"p-key-ui":1.8499,"p-oval-right":0.6958,"p-oval-sq":1.1357,"p-oval-tall":0.725,"p-oval-ui":1.8499,"p-oval-wide":1.873,"p-portal-right":0.6956,"p-portal-sq":1.1356,"p-portal-tall":0.725,"p-portal-ui":1.8499,"p-portal-wide":1.873,"p-ros-right":0.6956,"p-ros-sq":1.1356,"p-ros-tall":0.725,"p-ros-ui":1.8499,"p-ros-wide":1.873,"p-ros3a-right":0.6958,"p-ros3a-sq":1.1357,"p-ros3a-tall":0.725,"p-ros3a-ui":1.8499,"p-ros3a-web1":0.6667,"p-ros3a-web2":0.8178,"p-ros3a-web3":0.6667,"p-ros3a-web4":0.8,"p-ros3a-wide":1.873,"p-shield-right":0.6958,"p-shield-sq":1.1357,"p-shield-tall":0.725,"p-shield-ui":1.8499,"p-shield-wide":1.7778,"p-steps-right":0.6956,"p-steps-sq":1.1356,"p-steps-tall":0.725,"p-steps-ui":1.8499,"p-steps-wide":1.873};
// плитки со светлым краем (посчитано по картинкам) — им нужна рамка
const LIGHT = ['p-ros3a-tall', 'p-shield-wide', 'p-cycle-wide', 'p-oval-sq', 'p-oval-wide', 'p-portal-wide', 'p-ros-sq', 'p-steps-wide'];
// сначала рендеры (lead), потом плитки айдентики
const stripList = (k, it) => (it.lead || []).concat(it.pieces.map(p => 'p-' + k + '-' + p));
function liveStrip(box){
  const strip = box.querySelector('.ri-strip'), inner = strip.firstElementChild;
  // картинки ленты грузятся все сразу, как лента подходит к экрану (а не по одной, когда доедут до края)
  const load = new IntersectionObserver(es => { if (!es.some(e => e.isIntersecting)) return; load.disconnect();
    strip.querySelectorAll('img[data-src]').forEach(im => { if (im.dataset.srcset) im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); }); }, { rootMargin: '900px 0px' });
  load.observe(strip);
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
  const D = 248;   // знак Росатома — оригинал с градиентом (rosatom-sign.webp, прислан Дашей 04.11)
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
    <defs>${defs}</defs>
    ${segs}
    <image href="${img('rosatom-sign.webp')}" x="${cx - D / 2}" y="${cy - D / 2}" width="${D}" height="${D}"/>
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
// слева заголовок и описание, справа — знак (у финалистов) или инфографика к знаку (у концепций)
const pageHead = (it, mark = '', noName = false) => { const right = mark || pictHTML(it);
  return `<div class="wrap ri-page-head">
    <div class="ri-page-t">${noName ? '' : `<h3 class="ri-name">${H.T(it.t)}</h3>`}<p class="ri-text">${H.T(it.idea)}</p></div>
    ${right ? `<div class="ri-page-mark${mark ? '' : ' ri-page-info'}">${right}</div>` : ''}
  </div>`; };
// главная картинка концепции — сам знак в векторе, крупно; у «ключа» — русская и английская версии
// плашка-перебивка «концепция N» — у всех вариантов подряд: четыре концепции, первый «Росатом ID», три финалиста
const numHTML = n => `<div class="ri-num"><div class="wrap"><span>концепция ${n}</span></div></div>`;
function ideaPage(it, c, n){
  // перебивка: невысокая черная плашка на всю ширину сайта с номером концепции, дальше имя крупно и знак; фон везде белый
  return `<article class="ri-page ri-page-b" data-k="${it.k}">
    ${numHTML(n)}
    <div class="ri-band"><div class="wrap ri-band-in"><div class="ri-band-t"><h3 class="ri-name">${H.T(it.t)}</h3></div>
      <div class="ri-sign${it.mark2 ? ' ri-sign-2' : ''}">${logo(it.mark)}${it.mark2 ? logo(it.mark2) : ''}</div></div></div>
    ${pageHead(it, '', true)}
    <div class="wrap">${stripHTML(it.k, it, c.open)}</div>
  </article>`;
}
function liveIdeas(box, c){
  // липкого меню концепций нет (просьба 05.11): их разделяют плашки «концепция N»
  c.items.forEach(it => {
    const page = box.querySelector(`.ri-page[data-k="${it.k}"]`);
    liveStrip(page);
    // знак собирается из частей каждый раз, как оказывается на экране
    const sign = page.querySelector('.ri-sign');
    [...sign.querySelectorAll('.ri-logo')].forEach(im => {
      const host = document.createElement('span'); host.className = 'ri-sign-host'; im.replaceWith(host);
      inlineLogo(host, im.getAttribute('src').match(/([^/]+)\.svg/)[1]);
    });
    onScreen(sign, v => sign.classList.toggle('build', v), .45);
  });
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
  const sums = c.cols.map((_, j) => c.rows.reduce((a, r) => a + (r.v[j] ? 1 : 0), 0));
  const total = `<div class="ri-nt-c ri-nt-crit ri-nt-sumt">${H.T(c.sum)}</div>${sums.map((v, j) =>
    `<div class="ri-nt-c ri-nt-s${j === 2 ? ' best' : ''}"><b class="ri-num" data-to="${v}">0</b><small>${H.T(c.of)}</small><i class="ri-pips">${c.rows.map((_, k) => `<u${k < v ? ' class="on"' : ''} style="--i:${k}"></u>`).join('')}</i></div>`).join('')}`;
  return `<div class="ri-nt" role="table">${head}${rows}${total}</div>`;
}
function liveNames(box){
  let done = false;
  onScreen(box, v => { if (v && !done) { done = true; box.querySelectorAll('.ri-num').forEach(el => countUp(el, +el.dataset.to, 900, 1400)); } }, .3);
}

/* ================================================================
   final3 — три финалиста: рядом, потом у каждого своя «страница»
   ================================================================ */
const BACK = '<svg class="ri-back" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5m6-7l-7 7 7 7"/></svg>';
const CROSS = '<svg class="ri-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
const SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z"/></svg>';
// окно браузера: вкладка с фавиконом и названием, строка адреса, страница входа.
// фавикон — знак из логотипа (край fav[0], клетка fav[1] к высоте) белым на черной плашке
const loginHTML = (it, c) => `${it.themes ? tabsHTML(it.themes, 'ri-tabs-th') : ''}<div class="ri-login"${it.themes ? ` data-th="${it.themes[0].k}"` : ''}${it.bg ? ` data-bg style="--ri-bg:url(${img(it.bg + '.webp')})"` : ''}>
    <div class="ri-win">
      <div class="ri-tabs-bar"><span class="ri-wtab">
        <i class="ri-fav">${it.favImg ? `<img class="ri-fav-img" src="${img(it.favImg + '.svg')}" alt="">` : `<b style="background-image:url(${img(it.logo + '.svg')});background-position:${it.fav[0]} center;aspect-ratio:${it.fav[1]}"></b>`}</i>
        <span class="ri-wtab-t">${esc(it.name)}</span>${CROSS}</span></div>
      <div class="ri-bar">${BACK}<div class="ri-addr">${SHIELD}<span>${esc(it.url)}</span></div></div>
      <div class="ri-site">
        ${it.themes ? `<div class="ri-head-bar">${logo(it.logo, 'ri-keep')}<i></i><i></i><i></i></div>` : ''}
        <div class="ri-card">
          <div class="ri-card-logo">${logo(it.logo, 'ri-keep')}</div>
          <div class="ri-form">
            <b class="ri-signin">${H.T(c.sign)}</b>
            <span class="ri-lbl">${H.T(c.login)}</span><span class="ri-input ri-type" data-text="i.petrov"><span></span><i class="ri-caret"></i></span>
            <span class="ri-lbl">${H.T(c.pass)}</span><span class="ri-input ri-dots ri-type" data-text="••••••••"><span></span><i class="ri-caret"></i></span>
            <span class="ri-go">${H.T(c.go)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
function final3HTML(c, n0 = 0){
  const trio = `<div class="wrap"><div class="ri-trio">${c.items.map(it =>
    `<button type="button" class="ri-trio-i ri-trio-${it.k}" data-go="${it.k}" aria-label="${esc(H.pick(it.t))}"><span class="ri-trio-l">${logo(it.logo)}</span></button>`).join('')}</div></div>`;
  const pages = c.items.map((it, i) => `<article class="ri-page" data-k="${it.k}">
    ${n0 ? numHTML(n0 + i + 1) : ''}
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
    liveTyping(page);
  });
  box.querySelectorAll('.ri-trio-i').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
}

// в окне входа сам печатается логин, потом пароль точками, потом нажимается «Продолжить» — и по кругу
function liveTyping(page){
  const fields = [...page.querySelectorAll('.ri-type')], go = page.querySelector('.ri-go');
  let on = false, t, run = 0;
  const wait = ms => new Promise(r => { t = setTimeout(r, ms); });
  const type = async (f, id) => { const sp = f.firstElementChild, txt = f.dataset.text; f.classList.add('on'); sp.textContent = '';
    for (const ch of txt) { if (run !== id) return; sp.textContent += ch; await wait(f.classList.contains('ri-dots') ? 70 : 110); } f.classList.remove('on'); };
  const cycle = async () => {
    const id = ++run;
    while (on && run === id && !still()) {
      fields.forEach(f => { f.firstElementChild.textContent = ''; f.classList.remove('on'); }); go.classList.remove('press');
      await wait(900); if (run !== id) return;
      await type(fields[0], id); await wait(350); await type(fields[1], id); await wait(500); if (run !== id) return;
      go.classList.add('press'); await wait(3200);
    }
  };
  onScreen(page.querySelector('.ri-login'), v => { on = v; clearTimeout(t); if (v) cycle(); else { run++; fields.forEach(f => { f.firstElementChild.textContent = f.dataset.text; f.classList.remove('on'); }); } }, .4);
  fields.forEach(f => { f.firstElementChild.textContent = f.dataset.text; });
}

/* ================================================================
   final — Росатом ID: шторка «было / стало», версии в цвете
   и монохроме, размеры, палитра
   ================================================================ */
function shutterHTML(c){
  return `<div class="ri-ba" style="--x:50%">
    <div class="ri-ba-pane ri-ba-old">${logo(c.beforeLogo)}<span class="ri-ba-l">${H.T(c.before)}</span></div>
    <div class="ri-ba-pane ri-ba-new">${logo(c.afterLogo)}<span class="ri-ba-l ri-ba-lr">${H.T(c.after)}</span></div>
    <div class="ri-ba-h" aria-hidden="true"><i></i></div>
  </div>`;
}
function liveShutter(box){
  const ba = box.querySelector('.ri-ba');
  let raf = 0, on = false, user = 0, t0 = 0, x = .5;
  const set = v => { x = clamp(v, .02, .98); ba.style.setProperty('--x', (x * 100).toFixed(2) + '%'); };
  const move = e => { const r = ba.getBoundingClientRect(); set((e.clientX - r.left) / r.width); user = performance.now(); };
  ba.addEventListener('pointerdown', e => { ba.setPointerCapture(e.pointerId); move(e); });
  ba.addEventListener('pointermove', e => { if (e.buttons) move(e); });
  // сама ходит туда-сюда, пока не потянули; через 4 с после касания идет снова
  const loop = now => {
    if (!t0) t0 = now;
    if (now - user > 4000) set(.5 + Math.sin((now - t0) / 1900) * .36);
    if (on) raf = requestAnimationFrame(loop);
  };
  onScreen(ba, v => { on = v; cancelAnimationFrame(raf); if (v && !still()) raf = requestAnimationFrame(loop); }, .3);
}
const sizesHTML = c => `<div class="ri-sizes"><p class="ri-fin-t">${H.T(c.sizes.t)}</p><div class="ri-sizes-row">${c.sizes.list.map(([h, t], i) =>
  `<figure style="--h:${h}px;--i:${i}"><span class="ri-sz"><img class="ri-logo ri-keep" src="${img('fin-short.svg')}" alt=""></span><figcaption>${esc(t)}, ${h} px</figcaption></figure>`).join('')}</div></div>`;
/* первый «Росатом ID» (вариант 3а): полная и короткая версия рядом, без подписей рядов */
const blueHTML = (c, f3) => `<div class="wrap ri-wide"><div class="ri-fin ri-blue"><div class="ri-fin-row">
    <figure class="ri-fin-v ri-fin-full">${logo(c.logos.full, 'ri-keep')}<figcaption>${H.T(c.full)}</figcaption></figure>
    <figure class="ri-fin-v ri-fin-short">${logo(c.logos.short, 'ri-keep')}<figcaption>${H.T(c.short)}</figcaption></figure>
  </div></div></div>
  ${f3 ? `<div class="wrap">${loginHTML(c, f3)}</div>` : ''}
  ${c.pieces ? `<div class="wrap">${stripHTML('ros3a', c, f3 && f3.open)}</div>` : ''}`;
function finalHTML(c){
  return `${c.beforeLogo ? shutterHTML(c) : ''}<div class="ri-fin">${c.rows.map(r => `<div class="ri-fin-row">
    <span class="ri-fin-t">${H.T(r.t)}</span>
    <figure class="ri-fin-v ri-fin-full">${logo(r.full)}<figcaption>${H.T(c.full)}</figcaption></figure>
    <figure class="ri-fin-v ri-fin-short">${logo(r.short)}<figcaption>${H.T(c.short)}</figcaption></figure>
  </div>`).join('')}</div>${c.sizes ? sizesHTML(c) : ''}${c.palette ? `<div class="ri-brand"><p class="ri-brand-t">${H.T(c.palette.t)}</p>
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
  const s = p.atomid, nIdeas = s.ideas ? s.ideas.items.length : 0;
  mount.innerHTML =
      (s.entry    ? `<section class="ri-ch ri-path-ch ri-ch-entry"><div class="wrap ri-head">${block(s.entry)}</div><div class="wrap ri-wide">${entryHTML(s.entry)}</div></section>` : '')
    + (s.path     ? `<section class="ri-ch ri-path-ch"><div class="wrap">${pathHTML(s.path)}</div></section>` : '')
    + (s.refusal  ? split('refusal', refusalHTML(s.refusal), s.refusal, false, s.refusal.why ? whyHTML(s.refusal) : '') : '')
    + (s.inside   ? split('inside', insideHTML(s.inside), s.inside, true) : '')
    + (s.sketches ? wide('sketches', sketchesHTML(s.sketches), s.sketches) : '')
    + (s.values   ? wide('values', valuesHTML(s.values), s.values) : '')
    + (s.ideas    ? `<section class="ri-ch ri-ch-ideas ri-deck"><div class="wrap ri-head">${block(s.ideas)}</div>${s.ideas.items.map((it, i) => ideaPage(it, s.ideas, i + 1)).join('')}</section>` : '')
    + (s.names    ? wide('names', namesHTML(s.names), s.names) : '')
    + (s.blue     ? `<section class="ri-ch ri-ch-blue">${numHTML(nIdeas + 1)}<div class="wrap ri-head">${block(s.blue)}</div>${blueHTML(s.blue, s.final3)}</section>` : '')
    + (s.final3   ? `<section class="ri-ch ri-ch-final3 ri-deck"><div class="wrap ri-head">${block(s.final3)}</div>${final3HTML(s.final3, nIdeas + (s.blue ? 1 : 0))}</section>` : '')
    + (s.final    ? wide('final', finalHTML(s.final), s.final) : '');
  // продукт одной картинкой — в самом начале кейса, выше задачи и роли
  const tops = [...mount.querySelectorAll('.ri-path-ch')], scheme = mount.parentElement.querySelector(':scope > .wrap:has(.camp-head)');
  if (tops.length && scheme) {
    const top = document.createElement('div');
    top.className = 'ri ri-top';
    tops.forEach(el => top.appendChild(el));
    scheme.before(top);
  }
  // шесть ценностей — прямо перед концепцией «циклы защиты»: из них она и выросла
  const vals = mount.querySelector('.ri-ch-values'), cyc = mount.querySelector('.ri-ch-ideas .ri-page[data-k="cycle"]');
  if (vals && cyc) { vals.classList.add('ri-in-deck'); cyc.before(vals); }
  const path = tops.find(el => !el.classList.contains('ri-ch-entry'));
  mount.parentElement.querySelectorAll('.ri-ch, .ri-page').forEach(el => reveal.observe(el));
  const q = c => mount.querySelector(c);
  if (path) livePath(path);
  if (s.entry) liveEntry(tops.find(el => el.classList.contains('ri-ch-entry')), s.entry);
  if (s.inside) liveInside(q('.ri-ch-inside'));
  if (s.values) liveValues(q('.ri-ch-values'));
  if (s.ideas) liveIdeas(q('.ri-ch-ideas'), s.ideas);
  if (s.names) liveNames(q('.ri-ch-names'));
  if (s.blue) { const b = q('.ri-ch-blue'); if (s.blue.pieces) liveStrip(b); if (s.final3) liveTyping(b); }
  if (s.final3) liveFinal3(q('.ri-ch-final3'), s.final3);
  if (s.final && s.final.beforeLogo) liveShutter(q('.ri-ch-final'));
}
