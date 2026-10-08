/* ================================================================
   КЕЙС «РУССКИЙ ОФИС» (поле office у проекта)
   Главы почти без слов — иконки и короткие анимации:
   one — три отдельных редактора, у каждого ключ-лицензия; ключи
   улетают, окна складываются в одно с четырьмя вкладками;
   side — одно окно, внутри рядом заявление, смета и презентация,
   курсор переносит итог сметы в график и в заявление;
   templates — шаблоны заполняются сами, а набор сменный: госорган,
   дивизион, компания, переключается сам, пока не тронули;
   qr — QR-код собирается прямо на листе, по нему проходит сканер;
   page — мини-лендинг из блоков, редактор сворачивается в браузер;
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
// значки наборов: госорган — фронтон с колоннами, дивизион — цех, компания — башня-офис
const SET_ICON = [
  `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 12L16 5l12 7z"/><path d="M7 13v11M12.5 13v11M19.5 13v11M25 13v11M4 27h24"/></svg>`,
  `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 27V15l7 4v-4l7 4v-4l7 4V6h3v21z"/><path d="M9 23h3M15 23h3M21 23h3"/></svg>`,
  `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 27V5h14v22M4 27h24"/><path d="M13 10h2M17 10h2M13 15h2M17 15h2M13 20h2M17 20h2"/></svg>`,
];

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
    <i></i><i class="mark"></i><i></i><i class="s"></i><div class="ft"><i></i><svg viewBox="0 0 60 20" aria-hidden="true"><path d="M2 14c6-10 9 6 14-2s6-8 9 0 7 4 10-3 6 4 12 1 9-4 11-2"/></svg></div></div>`;
  const cells = Array.from({ length: 5 }, () => `<i></i><u></u>`).join('');
  const sheet = `<div class="ro-smeta"><div class="rows">${cells}</div><div class="sum"><i></i><u class="total"></u></div></div>`;
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

/* ================================================================
   qr — код собирается прямо на листе
   ================================================================ */
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
function qrHTML(){
  return `<div class="ro-stage ro-qrst">
    <div class="ro-sheet">
      <i class="h"></i><i></i><i></i><i class="s"></i><i></i>
      <div class="ro-qrrow"><div class="lines"><i></i><i class="s"></i><i></i><i class="s"></i></div>
        <div class="ro-qr"><div class="ro-qr-in">${qrSVG()}</div><s class="scan"></s></div></div>
    </div>
  </div>`;
}
function liveQR(box){
  const st = box.querySelector('.ro-qrst');
  const inner = box.querySelector('.ro-qr-in');
  if (still()) { st.classList.add('go'); return; }
  cycle(st, [
    async () => { st.classList.add('go'); await wait(1900); },
    async () => { st.classList.add('scan'); await wait(1600); },
    async () => { await wait(1400); st.classList.add('fade'); await wait(500);
      st.classList.remove('go', 'scan', 'fade'); inner.innerHTML = qrSVG(); await wait(300); },
  ]);
}

/* ================================================================
   page — мини-лендинг из блоков открывается как сайт
   ================================================================ */
function pageHTML(){
  const pal = `<div class="ro-pal">${['hero', 'pic', 'cards', 'btn'].map(k => `<span class="p-${k}"></span>`).join('')}</div>`;
  return `<div class="ro-stage ro-pagest" data-step="0">
    <div class="ro-app ro-browser">
      <div class="ro-bar ro-pbar"><span class="dots"><b></b><b></b><b></b></span><span class="tab ro-m-html"></span><span class="addr"></span></div>
      <div class="ro-ed">${pal}
        <div class="ro-site">
          <div class="b b-hero" style="--k:0"><i></i><i class="s"></i></div>
          <div class="b b-pic" style="--k:1"><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40L28 14l18 16 14-10 40 20z"/><circle cx="78" cy="11" r="5"/></svg></div>
          <div class="b b-cards" style="--k:2"><b></b><b></b><b></b></div>
          <div class="b b-btn" style="--k:3"><span></span></div>
        </div>
      </div>
    </div>
    <div class="ro-hand">${CURSOR}</div>
  </div>`;
}
function livePage(box){
  const st = box.querySelector('.ro-pagest');
  const hand = box.querySelector('.ro-hand');
  const btn = box.querySelector('.b-btn span');
  if (still()) { st.dataset.step = 2; return; }
  const move = (el, ms) => {
    const [x, y] = at(el, st, .6, .6);
    hand.style.transition = `transform ${ms}ms var(--ease-io), opacity .3s`;
    hand.style.transform = `translate(${x}px,${y}px)`;
    return wait(ms);
  };
  cycle(st, [
    async () => { st.dataset.step = 0; await wait(500); st.dataset.step = 1; await wait(2200); },   // блоки встают на место
    async () => { st.dataset.step = 2; await wait(1300); },                                         // редактор сворачивается в браузер
    async () => {
      // курсор появляется внизу справа и идет к кнопке
      hand.style.transition = 'none'; hand.style.transform = `translate(${st.clientWidth * .8}px,${st.clientHeight * .9}px)`;
      void hand.offsetWidth; st.classList.add('hand'); await wait(300); await move(btn, 900); hand.classList.add('press'); btn.classList.add('hit');
      await wait(200); hand.classList.remove('press'); await wait(1600); btn.classList.remove('hit'); st.classList.remove('hand'); await wait(600); },
  ]);
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
   templates — шаблоны заполняются сами; набор сменный
   ================================================================ */
// рисунки шаблонов: заявление, приказ (с гербом-кружком), служебка, таблица, Гант, формулы, график, слайды, лендинг, счет, договор, QR
const MINI = {
  letter:   () => `<div class="to"><i></i><i class="s"></i></div><i class="tt"></i><i></i><i></i><i class="s"></i>`,
  sums:     () => `<svg class="sig" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5H6l6.5 7L6 19h12"/></svg><div class="fx">${[70, 45, 85].map(w => `<i></i><u style="width:${w}%"></u>`).join('')}</div><div class="fx res"><i></i><u></u></div>`,
  order:    () => `<span class="emb"></span><i class="tt"></i><i></i><i></i><i class="s"></i><i></i>`,
  memo:     () => `<i class="tt l"></i><i></i><i class="s"></i><i></i><i></i><i class="s"></i>`,
  table:    () => `<div class="tb">${Array.from({ length: 12 }, (_, k) => `<u${k < 3 ? ' class="th"' : ''}></u>`).join('')}</div>`,
  gantt:    () => `<div class="gt">${[[0, 40], [25, 35], [50, 30], [65, 35]].map(([x, w]) => `<span><b style="left:${x}%;width:${w}%"></b></span>`).join('')}</div>`,
  chart:    () => `<div class="cht">${[35, 60, 45, 80, 65].map(h => `<b style="height:${h}%"></b>`).join('')}</div>`,
  slides:   () => `<i class="tt l"></i><div class="sl"><b></b><b></b></div>`,
  landing:  () => `<span class="gh"></span><div class="cd"><b></b><b></b><b></b></div><span class="pill"></span>`,
  invoice:  () => `<i class="tt l"></i><div class="tb sm">${Array.from({ length: 6 }, () => '<u></u>').join('')}</div><i class="s r"></i>`,
  contract: () => `<i class="tt"></i><i></i><i></i><i></i><i class="s"></i><div class="sg"><i></i><i></i></div>`,
  qrdoc:    () => `<i class="tt l"></i><i></i><i class="s"></i><span class="qr"></span>`,
};
const MODE_OF = { sums: 'sheet', letter: 'doc', order: 'doc', memo: 'doc', contract: 'doc', qrdoc: 'doc', table: 'sheet', gantt: 'sheet', invoice: 'sheet', chart: 'slide', slides: 'slide', landing: 'html' };
const SETS = [
  ['letter', 'gantt', 'sums', 'order', 'memo', 'table'],        // госорган: заявление, Гант, формулы — первыми
  ['gantt', 'table', 'chart', 'memo', 'slides', 'letter'],      // дивизион
  ['contract', 'invoice', 'landing', 'chart', 'qrdoc', 'slides'], // компания
];
const card = (k, i) => `<div class="ro-k ro-m-${MODE_OF[k]} k-${k}" style="--i:${i}"><div class="ro-kin">${MINI[k]()}</div></div>`;
function kitsHTML(c){
  const names = H.pick(c.sets);
  return `<div class="ro-stage ro-kitst">
    <div class="ro-sets" role="tablist">${names.map((n, i) =>
      `<button class="ro-set${i ? '' : ' on'}" type="button" role="tab" aria-selected="${!i}" aria-label="${esc(n)}" data-i="${i}">${SET_ICON[i]}<s></s></button>`).join('')}</div>
    <div class="ro-kit fill">${SETS[0].map(card).join('')}</div>
  </div>`;
}
function liveKits(box){
  const st = box.querySelector('.ro-kitst');
  const kit = st.querySelector('.ro-kit');
  const btns = [...st.querySelectorAll('.ro-set')];
  const MS = 3400;
  let cur = 0, timer = 0, on = false, touched = false, gen = 0;
  const run = () => {
    clearTimeout(timer);
    btns.forEach(b => b.classList.remove('run'));
    if (!on || touched || still()) return;
    const b = btns[cur]; void b.offsetWidth; b.style.setProperty('--ms', MS + 'ms'); b.classList.add('run');
    timer = setTimeout(() => set((cur + 1) % SETS.length), MS);
  };
  // карточки переворачиваются по очереди: старый набор уходит, на его месте — новый
  const set = async (i, user) => {
    if (user) touched = true;
    cur = i;
    btns.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
    run();
    const my = ++gen;
    const cards = [...kit.children];
    if (!still()) { cards.forEach(el => el.classList.add('flip')); await wait(320 + cards.length * 50); }
    if (my !== gen) return;
    SETS[i].forEach((k, n) => { const el = cards[n]; el.className = `ro-k ro-m-${MODE_OF[k]} k-${k}${still() ? '' : ' flip'}`; el.firstElementChild.innerHTML = MINI[k](); });
    kit.classList.remove('fill');
    await wait(30);
    if (my !== gen) return;
    cards.forEach(el => el.classList.remove('flip'));
    void kit.offsetWidth; kit.classList.add('fill');   // строки печатаются, полосы и столбики растут
  };
  btns.forEach(b => b.addEventListener('click', () => set(+b.dataset.i, true)));
  let seen = false;
  if (!still()) kit.classList.remove('fill');
  onScreen(st, v => { on = v; run(); if (v && !seen) { seen = true; requestAnimationFrame(() => kit.classList.add('fill')); } }, .3);
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
  ['templates', kitsHTML, liveKits, 'left'],
  ['qr', qrHTML, liveQR, 'right'],
  ['closed', closedHTML, liveClosed, 'wide'],
  ['page', pageHTML, livePage, 'left'],   // последняя: под текстом — кнопка демо
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
