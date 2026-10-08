/* ================================================================
   КЕЙС «РУССКИЙ ОФИС» (поле office у проекта)
   Главы почти без слов — иконки и короткие анимации:
   one — три отдельных редактора, у каждого ключ-лицензия; ключи
   улетают, окна складываются в одно с четырьмя вкладками;
   side — одно окно, внутри рядом готовые шаблоны: заявление в Word,
   смета со значками счетчиков и итогом по формуле, презентация;
   курсор переносит итог сметы в график и в заявление;
   comb — кнопка «причесать»: на холст падает неряшливая схема из
   PowerPoint или пестрая таблица из Excel, курсор жмет кнопку —
   всё встает ровно;
   html — вкладка HTML: презентация с анимацией становится лендингом
   и сама подстраивается под ноутбук, планшет и телефон; файл легкий,
   уходит по почте и в мессенджеры, открывается без интернета;
   closed — закрытый контур: данные ходят внутри, наружу не выходят —
   отскакивают от границы, облако и интернет снаружи без связи;
   справа под текстом последней главы с рисунком сбоку — кнопка демо.
   Цвета вкладок — как в самом приложении: документ синий, таблица
   зеленая, HTML лаймовый; презентация — малиновая (оранжевого
   на сайте нет). Тексты — в content.js, оформление — office.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
// следит, виден ли блок
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
// координаты элемента внутри сцены
const at = (el, stage, fx = .5, fy = .5) => {
  const a = el.getBoundingClientRect(), b = stage.getBoundingClientRect();
  return [a.left - b.left + a.width * fx, a.top - b.top + a.height * fy];
};

/* ---------- значки ---------- */
const KEY = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4.2"/><path d="M12.2 12H21M17.5 12v3.4M20.2 12v2.4"/></svg>`;
const CURSOR = `<svg class="ro-cur" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8.2-6.1 1.3L10 18.6z"/></svg>`;
// счетчики: капля и молния; искры — у кнопки «причесать»; почта, мессенджер и «нет сети» — у HTML
const METER = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 5c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z"/><path d="M23 4l-5 10h5l-3 9 8-12h-5l3-7z"/></svg>`;
const MAIL = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="7" width="24" height="18" rx="3"/><path d="M5 9l11 8 11-8"/></svg>`;
const PLANE = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M28 5L4 14.5l9 3.5 2.5 9 4.5-6 6.5 4.5z"/><path d="M13 18l15-13"/></svg>`;
const NONET = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 12.5a17 17 0 0 1 24 0M8.5 17a11 11 0 0 1 15 0M13 21.5a5 5 0 0 1 6 0"/><circle cx="16" cy="25.5" r="1.4"/><path d="M5 5l22 22"/></svg>`;
const SPARK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8zM18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z"/></svg>`;

/* ---------- содержимое вкладок: рисунки из простых форм ---------- */
const MODES = ['doc', 'sheet', 'slide', 'html'];
const G = {
  doc:   () => `<div class="g g-doc"><i class="h"></i><i></i><i></i><i class="s"></i><i></i><i class="s"></i></div>`,
  sheet: () => `<div class="g g-sheet">${Array.from({ length: 20 }, (_, k) => `<u${k < 4 ? ' class="th"' : ''}></u>`).join('')}</div>`,
  slide: () => `<div class="g g-slide"><i class="h"></i><div class="bars">${[38, 62, 48, 86].map(h => `<b style="height:${h}%"></b>`).join('')}</div></div>`,
  html:  () => `<div class="g g-html"><div class="gh"><i></i><i class="s"></i></div><div class="cards"><b></b><b></b><b></b></div><span class="gb"></span></div>`,
};

const head = ch => `<div class="ro-head">
  <span class="case-label ro-label">${H.T(ch.label)}</span>
  <h2 class="ro-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="ro-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const side = (ch, extra = '') => `<div class="ro-side">
  <span class="case-label ro-label">${H.T(ch.label)}</span>
  <h2 class="ro-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="ro-text">${H.T(ch.text)}</p>` : ''}${extra}
</div>`;

/* ---------- заголовок главы: слова поднимаются из-под строки ---------- */
function splitWords(el){
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  let n = 0;
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    // делим только по обычным пробелам: неразрывные типографа держат предлог со словом
    node.textContent.split(/([ \t\n]+)/).forEach(part => {
      if (!part) return;
      if (/^[ \t\n]+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement('span'); w.className = 'ro-w';
      const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--i', n++);
      w.append(i); frag.append(w);
    });
    node.replaceWith(frag);
  });
}

// цикл главы: пока блок на экране — крутится, ушел с экрана — доигрывает шаг и ждет
function cycle(el, steps, threshold = .3){
  let on = false, busy = false;
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) for (const s of steps) { if (!on) break; await s(); }
    busy = false;
  };
  onScreen(el, v => { on = v && !still(); if (on) loop(); }, threshold);
  return () => on;
}

/* ================================================================
   one — три редактора с ключами складываются в одно окно
   ================================================================ */
function oneHTML(){
  return `<div class="ro-stage ro-one" data-step="0">
    <div class="ro-many">${['doc', 'sheet', 'slide'].map((m, i) =>
      `<div class="ro-app ro-m-${m}" style="--i:${i}"><div class="ro-bar"><b></b></div><div class="ro-pane">${G[m]()}</div><span class="ro-key">${KEY}</span></div>`).join('')}
    </div>
    <div class="ro-single"><div class="ro-app ro-big" data-mode="doc">
      <div class="ro-bar ro-tabs">${MODES.map(m => `<b class="ro-t ro-m-${m}"></b>`).join('')}</div>
      <div class="ro-pane ro-modes">${MODES.map(m => `<div class="ro-mode ro-m-${m}">${G[m]()}</div>`).join('')}</div>
    </div></div>
  </div>`;
}
function liveOne(box){
  const st = box.querySelector('.ro-one');
  const big = box.querySelector('.ro-big');
  if (still()) { st.dataset.step = 2; return; }
  const live = cycle(st, [
    async () => { st.dataset.step = 0; await wait(1600); },
    async () => { st.dataset.step = 1; await wait(900); },          // ключи-лицензии улетают
    async () => { st.dataset.step = 2; await wait(900);              // окна складываются в одно
      // вкладки переключаются по очереди: документ, таблица, презентация, HTML
      for (const m of [...MODES.slice(1), 'doc']) { if (!live()) return; big.dataset.mode = m; await wait(1000); }
      await wait(600); },
    async () => { st.dataset.step = 3; await wait(700); big.dataset.mode = 'doc'; },
  ]);
}

/* ================================================================
   side — заявление, смета и презентация рядом; курсор переносит итог
   ================================================================ */
function sideHTML(){
  // заявление: шапка справа (кому, от кого), заголовок по центру, текст, дата и подпись
  const letter = `<div class="ro-letter"><div class="to"><i></i><i></i><i class="s"></i></div><i class="tt"></i>
    <i></i><i class="mark"></i><i></i><i class="s"></i><div class="ft"><i></i><svg viewBox="0 0 60 20" aria-hidden="true"><path d="M2 14c6-10 9 6 14-2s6-8 9 0 7 4 10-3 6 4 12 1 9-4 11-2"/></svg></div><span class="ro-docx">DOCX</span></div>`;
  const cells = Array.from({ length: 5 }, () => `<i></i><u></u>`).join('');
  const sheet = `<div class="ro-smeta"><span class="ico">${METER}</span><div class="rows">${cells}</div><div class="sum"><i></i><u class="total"></u></div></div>`;
  const slide = `<div class="ro-deck"><i class="h"></i><div class="bars">${[40, 58, 46, 30].map(h => `<b style="--h:${h}%"></b>`).join('')}</div></div>`;
  return `<div class="ro-stage ro-sidest">
    <div class="ro-app ro-wide">
      <div class="ro-bar ro-tabs">${['doc', 'sheet', 'slide'].map(m => `<b class="ro-t on ro-m-${m}"></b>`).join('')}</div>
      <div class="ro-panes">
        <div class="ro-p ro-m-doc">${letter}</div>
        <div class="ro-p ro-m-sheet">${sheet}</div>
        <div class="ro-p ro-m-slide">${slide}</div>
      </div>
    </div>
    <div class="ro-hand">${CURSOR}<span class="ro-chip"></span></div>
  </div>`;
}
function liveSide(box){
  const st = box.querySelector('.ro-sidest');
  const hand = box.querySelector('.ro-hand');
  const total = box.querySelector('.total');
  const lastBar = box.querySelector('.ro-deck .bars b:last-child');
  const mark = box.querySelector('.ro-letter .mark');
  const vals = [...box.querySelectorAll('.ro-smeta .rows u')];
  const move = (el, fx, fy, ms = 800) => {
    const [x, y] = at(el, st, fx, fy);
    hand.style.transition = `transform ${ms}ms var(--ease-io)`;
    hand.style.transform = `translate(${x}px,${y}px)`;
    return wait(ms);
  };
  const click = async () => { hand.classList.add('press'); await wait(180); hand.classList.remove('press'); };
  const reset = () => {
    // новые суммы: строки сметы разной длины, итог и последний столбик — заново
    vals.forEach(v => v.style.setProperty('--w', Math.round(rnd(35, 95)) + '%'));
    st.classList.remove('sum-on', 'bar-on', 'mark-on', 'carry');
    lastBar.style.setProperty('--h', '30%');
  };
  reset();
  if (still()) { st.classList.add('sum-on', 'bar-on', 'mark-on'); lastBar.style.setProperty('--h', '92%'); return; }
  hand.style.transform = `translate(50%,110%)`;
  cycle(st, [
    async () => { reset(); await wait(500); await move(vals[vals.length - 1], .5, .5, 900); },
    async () => { await move(total, .5, .5, 500); await click(); st.classList.add('sum-on'); await wait(400); },
    // итог сметы — в последний столбик графика
    async () => { st.classList.add('carry'); await move(lastBar, .5, .2, 900); await click();
      st.classList.remove('carry'); lastBar.style.setProperty('--h', Math.round(rnd(78, 96)) + '%'); st.classList.add('bar-on'); await wait(600); },
    // и в строку заявления
    async () => { await move(total, .5, .5, 800); await click(); st.classList.add('carry'); await wait(200);
      await move(mark, .7, .5, 1000); await click(); st.classList.remove('carry'); st.classList.add('mark-on'); await wait(2200); },
  ], .35);
}

/* ---------- QR-код: три квадрата по углам, остальное вразброс ---------- */
const N = 21;   // QR версии 1: 21 × 21 модуль
function qrModules(){
  const m = [];
  const finder = (x0, y0) => { for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const edge = x === 0 || y === 0 || x === 6 || y === 6, core = x > 1 && x < 5 && y > 1 && y < 5;
    if (edge || core) m.push([x0 + x, y0 + y, 1]);
  } };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  const reserved = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  for (let i = 8; i < N - 8; i++) { if (i % 2 === 0) { m.push([i, 6, 1]); m.push([6, i, 1]); } }   // полосы синхронизации
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (reserved(x, y) || x === 6 || y === 6) continue;
    if (Math.random() < .48) m.push([x, y, 0]);
  }
  return m;
}
function qrSVG(){
  // сначала встают три квадрата по углам, потом остальное вразброс
  return `<svg class="ro-qr-svg" viewBox="-1 -1 ${N + 2} ${N + 2}" aria-hidden="true">${qrModules().map(([x, y, f]) =>
    `<rect x="${x}" y="${y}" width="1.04" height="1.04" style="--d:${Math.round(f ? rnd(0, 300) : rnd(350, 1500))}ms"/>`).join('')}</svg>`;
}
/* ================================================================
   closed — закрытый контур: данные ходят внутри, наружу не выходят
   ================================================================ */
const W = 900, HGT = 440;
const BOX = { x: 240, y: 40, w: 420, h: 360 };
const INNER = [ // файлы внутри контура и приложение в середине
  { x: 450, y: 220, k: 'app' },
  { x: 330, y: 120, k: 'doc' }, { x: 570, y: 120, k: 'sheet' }, { x: 330, y: 320, k: 'slide' }, { x: 570, y: 320, k: 'html' },
];
const OUTER = [{ x: 105, y: 140, k: 'cloud' }, { x: 105, y: 310, k: 'server' }, { x: 795, y: 140, k: 'globe' }, { x: 795, y: 310, k: 'cloud' }];
function fileIcon(n){
  if (n.k === 'app') return `<g transform="translate(${n.x - 48} ${n.y - 36})"><rect class="app" width="96" height="72" rx="10"/>
    ${MODES.map((m, i) => `<rect class="f-${m}" x="${10 + i * 20}" y="10" width="16" height="7" rx="3.5"/>`).join('')}
    <rect class="ln" x="12" y="30" width="58" height="5" rx="2.5"/><rect class="ln" x="12" y="42" width="72" height="5" rx="2.5"/><rect class="ln" x="12" y="54" width="44" height="5" rx="2.5"/></g>`;
  return `<g transform="translate(${n.x - 22} ${n.y - 28})"><path class="page" d="M0 6a6 6 0 0 1 6-6h22l16 16v34a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z"/>
    <rect class="f-${n.k}" x="8" y="22" width="28" height="6" rx="3"/><rect class="ln" x="8" y="34" width="20" height="5" rx="2.5"/></g>`;
}
function outerIcon(n){
  const g = {
    cloud: `<path d="M-26 14h48a14 14 0 0 0 0-28 20 20 0 0 0-38-4 14 14 0 0 0-10 32z"/>`,
    globe: `<circle r="24"/><ellipse rx="10" ry="24"/><path d="M-24 0h48M-20-12h40M-20 12h40"/>`,
    server: `<rect x="-24" y="-24" width="48" height="20" rx="5"/><rect x="-24" y="4" width="48" height="20" rx="5"/><circle cx="-14" cy="-14" r="2"/><circle cx="-14" cy="14" r="2"/>`,
  }[n.k];
  return `<g class="out" transform="translate(${n.x} ${n.y})">${g}</g>`;
}
function closedHTML(){
  const links = OUTER.map(n => {
    const ex = n.x < W / 2 ? BOX.x : BOX.x + BOX.w;
    return `<path class="cut" d="M${n.x + (n.x < W / 2 ? 34 : -34)} ${n.y}H${ex + (n.x < W / 2 ? -14 : 14)}"/>`;
  }).join('');
  return `<div class="ro-stage ro-closedst">
    <svg class="ro-net" viewBox="0 0 ${W} ${HGT}" aria-hidden="true">
      ${links}${OUTER.map(outerIcon).join('')}
      <rect class="wall" x="${BOX.x}" y="${BOX.y}" width="${BOX.w}" height="${BOX.h}" rx="40"/>
      <g class="paths">${INNER.slice(1).map(n => `<path d="M${INNER[0].x} ${INNER[0].y}L${n.x} ${n.y}"/>`).join('')}</g>
      ${INNER.map(fileIcon).join('')}
      <g class="dots"></g><g class="rings"></g>
    </svg>
  </div>`;
}
function liveClosed(box){
  const svg = box.querySelector('.ro-net');
  const dotsG = svg.querySelector('.dots'), ringsG = svg.querySelector('.rings');
  if (still()) return;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, cls, g) => { const e = document.createElementNS(NS, tag); e.setAttribute('class', cls); g.appendChild(e); return e; };
  const app = INNER[0];
  let packets = [], on = false, raf = 0, last = 0, nextIn = 0, nextOut = 1200;
  // пакет внутри: от файла к приложению или обратно
  const inside = () => {
    const f = INNER[1 + Math.floor(Math.random() * 4)];
    const [a, b] = Math.random() < .5 ? [f, app] : [app, f];
    packets.push({ el: mk('circle', 'pk pk-' + (a.k === 'app' ? b.k : a.k), dotsG), a, b, t: 0, dur: rnd(900, 1300) });
  };
  // пакет наружу: от приложения к облаку или интернету, упирается в стену и возвращается
  const outward = () => {
    const o = OUTER[Math.floor(Math.random() * OUTER.length)];
    const wx = o.x < W / 2 ? BOX.x + 7 : BOX.x + BOX.w - 7;
    const wy = app.y + (o.y - app.y) * (wx - app.x) / (o.x - app.x);
    packets.push({ el: mk('circle', 'pk pk-out', dotsG), a: app, b: { x: wx, y: wy }, t: 0, dur: 900, bounce: true });
  };
  const ring = (x, y) => {
    const r = mk('circle', 'ring', ringsG);
    r.setAttribute('cx', x); r.setAttribute('cy', y);
    r.animate([{ r: 4, opacity: .9 }, { r: 30, opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => r.remove();
    svg.classList.remove('hit'); void svg.getBoundingClientRect(); svg.classList.add('hit');
  };
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  const frame = now => {
    const dt = Math.min(50, now - (last || now)); last = now;
    nextIn -= dt; nextOut -= dt;
    if (nextIn <= 0) { inside(); nextIn = rnd(260, 520); }
    if (nextOut <= 0) { outward(); nextOut = rnd(1500, 2300); }
    packets = packets.filter(p => {
      p.t += dt / p.dur;
      if (p.t >= 1) {
        if (p.bounce) { ring(p.b.x, p.b.y); [p.a, p.b] = [p.b, p.a]; p.t = 0; p.bounce = false; p.dur = 1100; return true; }
        p.el.remove(); return false;
      }
      const k = ease(p.t);
      p.el.setAttribute('cx', p.a.x + (p.b.x - p.a.x) * k);
      p.el.setAttribute('cy', p.a.y + (p.b.y - p.a.y) * k);
      p.el.setAttribute('r', 6);
      return true;
    });
    if (on) raf = requestAnimationFrame(frame);
  };
  onScreen(svg, v => { on = v; cancelAnimationFrame(raf); last = 0; if (on) raf = requestAnimationFrame(frame); }, .25);
}

/* ================================================================
   comb — кнопка «причесать»: неряшливая схема или таблица встают ровно
   ================================================================ */
// пять блоков схемы — неряшливо (u…) и ровно (n…), в процентах холста
const BOXES = [
  { u: [2, 5, 30, 22, -6], n: [5, 12, 24, 28] },
  { u: [14, 60, 20, 30, 4], n: [5, 60, 24, 28] },
  { u: [42, 22, 20, 32, -3], n: [38, 30, 24, 40] },
  { u: [66, 6, 32, 20, 7], n: [71, 12, 24, 28] },
  { u: [72, 58, 22, 34, -9], n: [71, 60, 24, 28] },
];
function boxStyle(b){
  const [ux, uy, uw, uh, ur] = b.u, [nx, ny, nw, nh] = b.n;
  return `--ux:${ux}%;--uy:${uy}%;--uw:${uw}%;--uh:${uh}%;--ur:${ur}deg;--nx:${nx}%;--ny:${ny}%;--nw:${nw}%;--nh:${nh}%`;
}
function combHTML(c){
  const cells = Array.from({ length: 20 }, (_, k) => `<span class="c" style="--k:${k}"><i></i></span>`).join('');
  return `<div class="ro-stage ro-combst">
    <div class="ro-app ro-tw ro-m-slide">
      <div class="ro-bar"><b></b></div>
      <div class="ro-scenes">
        <div class="sc sc-comb" data-v="chart">
          <div class="ro-canvas">
            <span class="ro-file"></span>
            <svg class="lk ugly" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M17 16L52 38M24 75L50 42M56 36L82 16M58 46L83 75"/></svg>
            <svg class="lk neat" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M29 26H33.5V45H38M29 74H33.5V55H38M62 45H66.5V26H71M62 55H66.5V74H71"/></svg>
            ${BOXES.map((b, k) => `<div class="bx" style="${boxStyle(b)};--k:${k}"><i></i><i class="s"></i></div>`).join('')}
            <div class="ro-tab">${cells}</div>
          </div>
          <div class="ro-cbar"><span class="ro-comb">${SPARK}<span>${H.T(c.btn)}</span></span></div>
          <div class="ro-hand">${CURSOR}</div>
        </div>
      </div>
    </div>
  </div>`;
}
function liveComb(box){
  const comb = box.querySelector('.sc-comb');
  const hand = comb.querySelector('.ro-hand'), btn = comb.querySelector('.ro-comb');
  if (still()) { comb.classList.add('ugly', 'neat'); return; }
  const move = (el, ms) => {
    const [x, y] = at(el, comb, .5, .6);
    hand.style.transition = `transform ${ms}ms var(--ease-io), opacity .3s`;
    hand.style.transform = `translate(${x}px,${y}px)`;
    return wait(ms);
  };
  // файл падает на холст, появляется как есть, курсор жмет «причесать» — всё встает ровно; сначала схема, потом таблица
  let v = 'table';
  cycle(comb, [
    async () => {
      v = v === 'chart' ? 'table' : 'chart';
      comb.classList.remove('neat', 'ugly', 'drop', 'hand'); comb.dataset.v = v;
      hand.style.transition = 'none'; hand.style.transform = `translate(${comb.clientWidth * .3}px,${comb.clientHeight * .95}px)`;
      await wait(250); comb.classList.add('drop'); await wait(700);
    },
    async () => { comb.classList.add('ugly'); await wait(1400); },
    async () => { comb.classList.add('hand'); await move(btn, 800);
      hand.classList.add('press'); btn.classList.add('hit'); await wait(180); hand.classList.remove('press'); btn.classList.remove('hit');
      comb.classList.add('neat'); comb.classList.remove('hand'); await wait(2800); },
  ], .35);
}

/* ================================================================
   html — презентация лендингом: ноутбук, планшет, телефон; почта и мессенджер
   ================================================================ */
// лендинг одинаковый, раскладка своя: карточки в ноутбуке в ряд, в планшете по две, в телефоне столбиком
const landing = qr => `<div class="ld"><div class="lb lh" style="--k:0"><i></i><i class="s"></i><span class="dot"></span></div>
  <div class="lb lp" style="--k:1"><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40L28 14l18 16 14-10 40 20z"/></svg></div>
  <div class="lb lc" style="--k:2"><b></b><b></b><b></b></div>${qr ? `<div class="lb lq" style="--k:3">${qrSVG()}</div>` : ''}</div>`;
function htmlHTML(){
  return `<div class="ro-stage ro-htst">
    <div class="ro-devs">
      <div class="dv dv-lap"><div class="scr">${landing(true)}</div><span class="base"></span></div>
      <div class="dv dv-tab"><div class="scr">${landing()}</div></div>
      <div class="dv dv-pho"><div class="scr">${landing()}</div></div>
    </div>
    <div class="ro-send">
      <span class="ro-file-h">HTML<i></i></span>
      <span class="road"><s></s></span>
      <span class="to t1">${MAIL}</span><span class="to t2">${PLANE}</span>
      <span class="off">${NONET}</span>
    </div>
  </div>`;
}
function liveHtml(box){
  const st = box.querySelector('.ro-htst');
  if (still()) { st.classList.add('go', 'sent'); return; }
  cycle(st, [
    async () => { st.classList.remove('go', 'sent'); await wait(400); st.classList.add('go'); await wait(2200); },   // блоки встают на всех трех экранах
    async () => { st.classList.add('sent'); await wait(2600); },                                                    // файл уходит по почте и в мессенджер
  ], .35);
}

/* ---------- демо: справа под текстом последней главы ---------- */
const tryHTML = t => t ? `<div class="ro-try">
  <h3 class="ro-try-title">${H.T(t.title)}</h3>
  ${H.pick(t.text) ? `<p class="ro-try-text">${H.T(t.text)}</p>` : ''}
  <a class="btn btn-accent ro-try-btn" href="${esc(t.link)}" target="_blank" rel="noopener">${H.T(t.btn)}</a>
</div>` : '';

/* ---------- запуск ---------- */
// [ключ, рисунок, оживление, раскладка]: wide — заголовок сверху и сцена во всю ширину;
// left / right — сцена слева или справа, текст рядом
const CHAPTERS = [
  ['one', oneHTML, liveOne, 'wide'],
  ['side', sideHTML, liveSide, 'wide'],
  ['comb', combHTML, liveComb, 'left'],
  ['closed', closedHTML, liveClosed, 'wide'],
  ['html', htmlHTML, liveHtml, 'right'],   // последняя: под текстом — кнопка демо
];

let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'office.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountOffice(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const o = p.office;
  const list = CHAPTERS.filter(([k]) => o[k]);
  const lastSplit = [...list].reverse().find(c => c[3] !== 'wide');
  mount.innerHTML = list.map(([k, html, , lay]) => lay === 'wide'
    ? `<section class="ro-ch wrap ro-${k}-ch">${head(o[k])}<div class="ro-viz">${html(o[k])}</div></section>`
    : `<section class="ro-ch wrap ro-${k}-ch ro-split${lay === 'right' ? ' rev' : ''}"><div class="ro-viz">${html(o[k])}</div>${
        side(o[k], lastSplit && lastSplit[0] === k ? tryHTML(o.try) : '')}</section>`).join('');
  mount.querySelectorAll('.ro-title').forEach(splitWords);
  mount.querySelectorAll('.ro-ch').forEach(s => reveal.observe(s));
  list.forEach(([k, , live]) => live(mount.querySelector(`.ro-${k}-ch`), o[k]));
}
