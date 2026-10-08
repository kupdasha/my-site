/* ================================================================
   КЕЙС «ИНТЕРАКТИВНЫЕ ПРЕЗЕНТАЦИИ» (поле poll у проекта)
   Всё объясняется картинкой, почти без слов:
   hands — зал поднимает руки вразнобой, на экране «?»; тумблер
   «руки / телефоны»: руки опускаются, у каждого загорается телефон,
   точки-ответы летят на экран и складываются в столбики;
   join — вход: телефон наводит камеру на QR, ноутбук набирает код
   с экрана, участники точками садятся в ряд на экране;
   results — одни и те же ответы облаком слов, графиком и рейтингом,
   переключатель иконками, растут в реальном времени;
   deck — PDF раскладывается на слайды, между ними встает слайд
   с опросом, кружки меняют оформление;
   local — схема: ноутбук с пультом, проектор, телефоны; связь
   с интернетом рвется, а ответы идут дальше; телефон стучится
   в пульт — замок не пускает. Справа под текстом — демо.
   Тексты — в content.js, оформление — poll.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// следит, виден ли блок
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

/* ---------- точка-ответ: летит по дуге от одного элемента к другому ---------- */
function fly(stage, from, to, { dur = 760, lift = 70, cls = '' } = {}){
  if (!stage.isConnected) return Promise.resolve();
  const s = stage.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const x1 = a.left + a.width / 2 - s.left, y1 = a.top + a.height / 2 - s.top;
  const x2 = b.left + b.width / 2 - s.left, y2 = b.top + b.height / 2 - s.top;
  const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - lift;
  const d = document.createElement('i');
  d.className = 'pl-dot ' + cls;
  stage.append(d);
  // кривая Безье по десяти точкам, чтобы шла дугой, а не ломаной
  const frames = Array.from({ length: 11 }, (_, k) => {
    const t = k / 10, u = 1 - t;
    const x = u * u * x1 + 2 * u * t * cx + t * t * x2, y = u * u * y1 + 2 * u * t * cy + t * t * y2;
    return { transform: `translate(${x}px,${y}px) scale(${k === 0 ? .3 : k === 10 ? .7 : 1})`, opacity: k === 0 ? 0 : 1 };
  });
  const an = d.animate(frames, { duration: dur, easing: 'cubic-bezier(.4,0,.3,1)' });
  return an.finished.then(() => d.remove(), () => d.remove());
}

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
      const w = document.createElement('span'); w.className = 'pl-w';
      const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--i', n++);
      w.append(i); frag.append(w);
    });
    node.replaceWith(frag);
  });
}

const head = ch => `<div class="pl-head">
  <span class="case-label pl-label">${H.T(ch.label)}</span>
  <h2 class="pl-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="pl-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const side = (ch, extra = '') => `<div class="pl-side">
  <span class="case-label pl-label">${H.T(ch.label)}</span>
  <h2 class="pl-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="pl-text">${H.T(ch.text)}</p>` : ''}
  ${extra}
</div>`;

// QR-код из простых квадратиков: три «глаза» по углам и шум — сканировать нечего, но читается как QR
function qrSVG(seed = 11){
  let s = seed;
  const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  const eye = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  let d = eye(0, 0) + eye(14, 0) + eye(0, 14);
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    if (x < 8 && y < 8 || x > 12 && y < 8 || x < 8 && y > 12) continue;
    if (r() < .48) d += `M${x} ${y}h1v1h-1z`;
  }
  return `<svg class="pl-qr" viewBox="-2 -2 25 25" aria-hidden="true" shape-rendering="crispEdges"><rect x="-2" y="-2" width="25" height="25" fill="#fff"/><path d="${d}" fill="#1D222A" fill-rule="evenodd"/></svg>`;
}

/* ---------- тумблер, который переключается сам, пока его не тронули ---------- */
function switchHTML(pair){
  const [off, on] = H.pick(pair);
  return `<div class="pl-switch">
    <span class="pl-sw-l" data-v="0">${H.T(off)}</span>
    <button class="pl-sw" type="button" role="switch" aria-checked="false" aria-label="${esc(off + ' / ' + on)}"><i class="pl-knob"></i></button>
    <span class="pl-sw-l" data-v="1">${H.T(on)}</span>
  </div>`;
}
function liveSwitch(box, watch, ms, onSet){
  const sw = box.querySelector('.pl-sw');
  let cur = 0, timer = 0, on = false, touched = false;
  const run = () => {
    clearTimeout(timer);
    sw.classList.remove('run');
    if (!on || touched || still()) return;
    const t = ms[cur];
    void sw.offsetWidth; sw.style.setProperty('--ms', t + 'ms'); sw.classList.add('run');
    timer = setTimeout(() => set(1 - cur), t);
  };
  const set = (v, user) => {
    if (user) touched = true;
    cur = v;
    sw.setAttribute('aria-checked', cur === 1);
    box.classList.toggle('after', cur === 1);
    onSet(cur);
    run();
  };
  sw.addEventListener('click', () => set(1 - cur, true));
  box.querySelectorAll('.pl-sw-l').forEach(l => l.addEventListener('click', () => set(+l.dataset.v, true)));
  onScreen(watch, v => { on = v; if (on) onSet(cur, true); run(); }, .25);
  return { get on(){ return on; } };
}

/* ================================================================
   hands — лес рук и телефоны
   ================================================================ */
function hallHTML(){
  // три ряда: задний мельче, передний крупнее; рисуем от заднего к переднему
  const rows = [{ n: 7, y: 120, s: .78 }, { n: 8, y: 186, s: .9 }, { n: 9, y: 262, s: 1.04 }];
  let k = 0, ppl = '';
  rows.forEach((r, ri) => {
    const w = 640 / r.n;
    for (let i = 0; i < r.n; i++) {
      const x = 30 + w * (i + .5) + (ri % 2 ? 0 : w * .15);
      const a = -18 + rnd(30);
      ppl += `<g class="pl-p" style="--k:${k++}" transform="translate(${x.toFixed(1)} ${r.y}) scale(${r.s})">
        <g transform="translate(15 12)"><g class="pl-arm" style="--a:${a}deg"><path d="M0 0V-46"/><circle cy="-50" r="8"/></g></g>
        <path class="pl-body" d="M-25 60V26C-25 11-13 4 0 4s25 7 25 22v34z"/>
        <circle class="pl-head" cy="-15" r="14"/>
        <rect class="pl-ph" x="-9" y="18" width="18" height="27" rx="3.5"/>
      </g>`;
    }
  });
  return `<div class="pl-stage pl-hall">
    <div class="pl-proj0"><span class="pl-q" aria-hidden="true">?</span>
      <div class="pl-bars">${[0, 1, 2].map(i => `<i class="pl-bar" style="--i:${i}"><b></b></i>`).join('')}</div></div>
    <svg class="pl-crowd" viewBox="0 0 700 330" aria-hidden="true">${ppl}</svg>
  </div>`;
}
function liveHands(box, c){
  const stage = box.querySelector('.pl-hall');
  const ppl = [...box.querySelectorAll('.pl-p')];
  const bars = [...box.querySelectorAll('.pl-bar')];
  // у каждого свой ответ: так столбики выходят разной высоты
  const vote = ppl.map(() => { const r = Math.random(); return r < .5 ? 0 : r < .82 ? 1 : 2; });
  const count = [0, 0, 0];
  let gen = 0, chaos = 0;
  const draw = () => {
    const lead = Math.max(...count);
    bars.forEach((b, i) => {
      b.style.setProperty('--h', (count[i] / ppl.length * 1.7).toFixed(3));
      b.classList.toggle('best', lead > 0 && count[i] === lead);
    });
  };
  // руки: кто-то поднимает, кто-то опускает, кто-то держит наполовину — посчитать нельзя
  const hands = () => {
    const g = ++gen;
    count.fill(0); draw();
    ppl.forEach(p => { p.classList.remove('ph'); p.classList.toggle('up', Math.random() < .45); });
    clearInterval(chaos);
    if (still()) return;
    chaos = setInterval(() => {
      if (g !== gen) { clearInterval(chaos); return; }
      for (let i = 0; i < 6; i++) {
        const p = ppl[rnd(ppl.length)];
        const r = Math.random();
        p.classList.toggle('up', r < .5);
        p.classList.toggle('half', r >= .5 && r < .72);
      }
    }, 560);
  };
  // телефоны: руки вниз, экраны загораются, ответы летят на экран и считаются по одному
  const phones = async () => {
    const g = ++gen;
    clearInterval(chaos);
    count.fill(0); draw();
    ppl.forEach(p => p.classList.remove('up', 'half'));
    if (still()) { ppl.forEach((p, i) => { p.classList.add('ph'); count[vote[i]]++; }); draw(); return; }
    await wait(350);
    for (const i of shuffle(ppl.map((_, i) => i))) {
      if (g !== gen) return;
      ppl[i].classList.add('ph');
      fly(stage, ppl[i].querySelector('.pl-ph'), bars[vote[i]], { dur: 820, lift: 40 })
        .then(() => { if (g === gen) { count[vote[i]]++; draw(); } });
      await wait(80);
    }
  };
  liveSwitch(box, stage, [3800, 6200], v => { stage.classList.toggle('is-ph', v === 1); (v ? phones : hands)(); });
}

/* ================================================================
   join — вход по QR и по коду
   ================================================================ */
function joinHTML(c){
  const code = String(c.code);
  return `<div class="pl-stage pl-join" data-s="0">
    <div class="pl-dev pl-phone"><div class="pl-scr">
      <div class="pl-cam"><div class="pl-cam-qr">${qrSVG()}</div><i class="pl-scan"></i><i class="pl-corners"></i></div>
      <div class="pl-ans">${[0, 1, 2].map(i => `<i style="--i:${i}"></i>`).join('')}</div>
    </div></div>
    <div class="pl-proj">
      <div class="pl-proj-in">${qrSVG()}<div class="pl-code">${[...code].map(d => `<b>${esc(d)}</b>`).join('')}</div></div>
      <div class="pl-seats">${Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
    </div>
    <div class="pl-dev pl-lap"><div class="pl-lscr">
      <i class="pl-url"></i>
      <div class="pl-form"><div class="pl-boxes">${[...code].map(() => '<b></b>').join('')}</div><i class="pl-go"></i></div>
      <div class="pl-ans">${[0, 1, 2].map(i => `<i style="--i:${i}"></i>`).join('')}</div>
    </div><i class="pl-lbase"></i></div>
  </div>`;
}
function liveJoin(box, c){
  const stage = box.querySelector('.pl-join');
  const phone = box.querySelector('.pl-phone .pl-scr');
  const lap = box.querySelector('.pl-lscr');
  const seats = [...box.querySelectorAll('.pl-seats i')];
  const boxes = [...box.querySelectorAll('.pl-boxes b')];
  const code = [...String(c.code)];
  const S = v => { stage.dataset.s = v; };
  let on = false, busy = false;
  const reset = () => {
    S(0); stage.classList.remove('ph-in', 'lap-in', 'go');
    seats.forEach(s => s.classList.remove('on'));
    boxes.forEach(b => { b.textContent = ''; });
  };
  const sit = i => seats[i] && seats[i].classList.add('on');
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      reset(); await wait(700); if (!on) break;
      S(1); await wait(1700); if (!on) break;                     // камера ловит QR
      stage.classList.add('ph-in');                               // телефон внутри: кнопки ответов
      fly(stage, phone, seats[0], { lift: 50 }).then(() => sit(0));
      await wait(500);
      for (const [i, d] of code.entries()) { if (!on) break; boxes[i].textContent = d; await wait(280); }   // ноутбук набирает код с экрана
      if (!on) break;
      await wait(250); stage.classList.add('go'); await wait(350);
      stage.classList.add('lap-in');
      fly(stage, lap, seats[1], { lift: 50 }).then(() => sit(1));
      await wait(900);
      // остальной зал заходит сам
      for (let i = 2; i < seats.length && on; i++) { sit(i); await wait(140); }
      await wait(2600);
    }
    busy = false;
  };
  if (still()) { S(1); stage.classList.add('ph-in', 'lap-in', 'go'); boxes.forEach((b, i) => { b.textContent = code[i]; }); seats.forEach(s => s.classList.add('on')); return; }
  onScreen(stage, v => { on = v; if (on) loop(); }, .35);
}

/* ================================================================
   results — облако слов, график, рейтинг
   ================================================================ */
const ICON = {
  cloud: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 24h15a5.5 5.5 0 0 0 .6-11A7.5 7.5 0 0 0 10.2 12 6 6 0 0 0 9 24z"/></svg>`,
  bars: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 26V15M13 26V7M20 26V12M27 26V19"/></svg>`,
  rank: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 8h22M5 16h15M5 24h9"/></svg>`,
};
// места для слов в облаке: самое частое — в центре, дальше по кругу
const SPOTS = [[50, 50], [24, 32], [76, 66], [27, 74], [74, 30], [50, 16], [52, 86], [12, 54], [88, 48]];
function resHTML(c){
  const names = H.pick(c.views);
  return `<div class="pl-stage pl-res">
    <div class="pl-tabs">${['cloud', 'bars', 'rank'].map((k, i) =>
      `<button class="pl-tab" type="button" data-v="${i}" aria-label="${esc(names[i])}" aria-pressed="${i === 0}">${ICON[k]}<i class="pl-tab-t"></i></button>`).join('')}</div>
    <div class="pl-board" data-v="0">
      <div class="pl-view pl-cloud">${c.words.map((w, i) => `<span class="pl-wd" data-i="${i}">${esc(w)}</span>`).join('')}</div>
      <div class="pl-view pl-cols">${c.words.map((w, i) => `<div class="pl-col" data-i="${i}"><i><b></b></i><span>${esc(w)}</span></div>`).join('')}</div>
      <div class="pl-view pl-rank">${c.words.map((w, i) => `<div class="pl-row" data-i="${i}"><span>${esc(w)}</span><i><b></b></i><em>0</em></div>`).join('')}</div>
    </div>
  </div>`;
}
function liveRes(box, c){
  const board = box.querySelector('.pl-board');
  const tabs = [...box.querySelectorAll('.pl-tab')];
  const N = c.words.length;
  const words = [...box.querySelectorAll('.pl-wd')];
  const cols = [...box.querySelectorAll('.pl-col')];
  const rows = [...box.querySelectorAll('.pl-row')];
  const nums = rows.map(r => r.querySelector('em'));
  let val = [], weight = [];
  const fresh = () => { val = Array(N).fill(0); weight = shuffle([6, 4.5, 3.5, 2.5, 1.6, 1.2, 1, .8].slice(0, N)); };
  const draw = hit => {
    const max = Math.max(1, ...val);
    const order = val.map((v, i) => i).sort((a, b) => val[b] - val[a] || a - b);
    order.forEach((i, r) => {
      const k = val[i] / max;
      const [x, y] = SPOTS[r % SPOTS.length];
      const wd = words[i];
      wd.style.left = x + '%'; wd.style.top = y + '%';
      wd.style.setProperty('--f', (val[i] ? 20 + 64 * k : 16).toFixed(1));
      wd.classList.toggle('best', r === 0 && val[i] > 0);
      wd.classList.toggle('zero', val[i] === 0);
      cols[i].style.setProperty('--h', k.toFixed(3));
      cols[i].classList.toggle('best', r === 0 && val[i] > 0);
      rows[i].style.setProperty('--r', r);
      rows[i].style.setProperty('--w', k.toFixed(3));
      rows[i].classList.toggle('best', r === 0 && val[i] > 0);
      nums[i].textContent = val[i];
    });
    if (hit != null) [words[hit], cols[hit], rows[hit]].forEach(el => { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); });
  };
  // голоса приходят по одному, частые слова — чаще
  const voteOne = () => {
    const sum = weight.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum, i = 0;
    while ((r -= weight[i]) > 0) i++;
    val[i]++; draw(i);
  };
  let view = 0, touched = false, on = false, vt = 0, vtimer = 0, ticking = false;
  const setView = (v, user) => {
    if (user) touched = true;
    view = v; board.dataset.v = v;
    tabs.forEach((t, i) => { t.classList.toggle('on', i === v); t.setAttribute('aria-pressed', i === v); t.classList.remove('run'); });
    clearTimeout(vtimer);
    if (!touched && on && !still()) {
      const t = tabs[v]; void t.offsetWidth; t.classList.add('run');
      vtimer = setTimeout(() => setView((view + 1) % 3), 4600);
    }
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => setView(i, true)));
  const tick = async () => {
    if (ticking) return; ticking = true;
    while (on) {
      voteOne();
      if (Math.max(...val) >= 26) { await wait(2400); if (!on) break; fresh(); draw(); await wait(700); }
      await wait(260 + rnd(260));
    }
    ticking = false;
  };
  fresh();
  if (still()) { for (let i = 0; i < 40; i++) voteOne(); setView(0); return; }
  for (let i = 0; i < 6; i++) voteOne();
  draw();
  setView(0);
  onScreen(board, v => { on = v; clearTimeout(vt); if (on) { tick(); setView(view); } else { clearTimeout(vtimer); tabs.forEach(t => t.classList.remove('run')); } }, .3);
}

/* ================================================================
   deck — свой PDF и свое оформление
   ================================================================ */
// оформления: фон слайда, текст, акцент; у последнего — шрифт с засечками
const THEMES = [
  { bg: '#FFFFFF', ink: '#1D222A', acc: '#E2FB5A' },
  { bg: '#1D222A', ink: '#F4F4F6', acc: '#E2FB5A' },
  { bg: '#E7ECFB', ink: '#203A86', acc: '#86A3F2' },
  { bg: '#EEF2E6', ink: '#26402F', acc: '#A7C784', serif: true },
];
// рисунки слайдов — из простых форм, слов нет
const SLIDE = {
  title: () => `<b class="pl-aa">Аа</b><i class="pl-ln s"></i>`,
  text: () => `<i class="pl-ln h"></i><i class="pl-ln"></i><i class="pl-ln"></i><i class="pl-ln s"></i>`,
  pic: () => `<div class="pl-two"><div><i class="pl-ln h"></i><i class="pl-ln"></i><i class="pl-ln s"></i></div><i class="pl-pic"></i></div>`,
  poll: () => `<i class="pl-ln h"></i><div class="pl-mini">${[.9, .55, .3].map((h, i) => `<i style="--h:${h};--i:${i}"></i>`).join('')}</div>`,
  nums: () => `<div class="pl-dots3"><i></i><i></i><i></i></div><i class="pl-ln s"></i>`,
  end: () => `<i class="pl-circ"></i>`,
};
function deckHTML(c){
  const names = H.pick(c.themes);
  const kinds = ['title', 'text', 'poll', 'pic', 'nums', 'end'];
  return `<div class="pl-stage pl-deck" data-s="0">
    <div class="pl-pdf" aria-hidden="true"><svg viewBox="0 0 60 76"><path d="M4 2h36l16 16v54a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path class="f" d="M40 2v16h16"/></svg><span>PDF</span></div>
    <div class="pl-grid">${kinds.map((k, i) => `<div class="pl-sl pl-sl-${k}" style="--i:${i}">${SLIDE[k]()}</div>`).join('')}</div>
    <div class="pl-themes">${THEMES.map((t, i) =>
      `<button class="pl-th${i ? '' : ' on'}" type="button" data-t="${i}" style="--a:${t.bg};--b:${t.acc};--c:${t.ink}" aria-label="${esc(names[i] || '')}"></button>`).join('')}</div>
  </div>`;
}
function liveDeck(box){
  const stage = box.querySelector('.pl-deck');
  const grid = box.querySelector('.pl-grid');
  const slides = [...grid.children];
  const poll = grid.querySelector('.pl-sl-poll');
  const btns = [...box.querySelectorAll('.pl-th')];
  let theme = 0, touched = false, on = false, busy = false;
  const setTheme = (t, user) => {
    if (user) touched = true;
    theme = t;
    const T = THEMES[t];
    grid.style.setProperty('--sb', T.bg); grid.style.setProperty('--si', T.ink); grid.style.setProperty('--sa', T.acc);
    grid.classList.toggle('serif', !!T.serif);
    btns.forEach((b, i) => { b.classList.toggle('on', i === t); b.setAttribute('aria-pressed', i === t); });
  };
  btns.forEach((b, i) => b.addEventListener('click', () => setTheme(i, true)));
  setTheme(0);
  // слайд с опросом встает между слайдами PDF, соседи плавно расступаются
  const flip = change => {
    const others = slides.filter(s => s !== poll);
    const r0 = others.map(s => s.getBoundingClientRect());
    change();
    others.forEach((s, i) => {
      const r1 = s.getBoundingClientRect();
      const dx = r0[i].left - r1.left, dy = r0[i].top - r1.top;
      if (dx || dy) s.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  };
  const S = v => { stage.dataset.s = v; };
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      S(0); grid.classList.remove('has-poll'); await wait(500); if (!on) break;
      S(1); await wait(1300); if (!on) break;          // файл PDF
      S(2); await wait(1500); if (!on) break;          // раскладывается на слайды
      flip(() => grid.classList.add('has-poll'));      // между ними — опрос
      S(3); await wait(1700);
      for (let k = 0; k < 3 && on; k++) {              // оформление меняется само, пока не выбрали свое
        if (!touched) setTheme((theme + 1) % THEMES.length);
        await wait(1500);
      }
      if (!on) break;
      if (!touched) setTheme(0);
      await wait(900);
      S(4); await wait(700);
    }
    busy = false;
  };
  if (still()) { S(3); grid.classList.add('has-poll'); return; }
  onScreen(stage, v => { on = v; if (on) loop(); }, .35);
}

/* ================================================================
   local — свой компьютер, без интернета
   ================================================================ */
// координаты схемы: ноутбук в центре, проектор слева сверху, интернет справа сверху, телефоны внизу
const LAP = { x: 330, y: 250 };
const PHONES = [100, 245, 415, 560];
function localHTML(){
  const phones = PHONES.map((x, i) => `<g class="pl-lph" data-i="${i}" transform="translate(${x} 400)">
      <rect x="-21" y="-34" width="42" height="68" rx="8"/><rect class="s" x="-15" y="-26" width="30" height="46" rx="3"/></g>`).join('');
  const wires = PHONES.map(x => `<path class="pl-wire" d="M${x} 362L${LAP.x} 300"/>`).join('');
  return `<div class="pl-stage pl-local">
    <svg class="pl-net" viewBox="0 0 660 460" aria-hidden="true">
      <path class="pl-wire" d="M262 214L208 150"/>
      ${wires}
      <g class="pl-web">
        <path class="pl-cut a" d="M400 205L466 152"/>
        <path class="pl-cut b" d="M466 152L522 108"/>
        <path class="pl-slash" d="M452 134l28 36"/>
        <g class="pl-globe" transform="translate(560 80)"><circle r="38"/><ellipse rx="16" ry="38"/><path d="M-38 0h76M-33-19h66M-33 19h66"/></g>
      </g>
      <g class="pl-scrn" transform="translate(40 30)">
        <rect width="190" height="118" rx="8"/>
        ${[0, 1, 2].map(i => `<rect class="pl-pb" data-i="${i}" x="${40 + i * 42}" y="22" width="26" height="78" rx="3"/>`).join('')}
        <path class="pl-leg" d="M95 118v18M70 136h50"/>
      </g>
      <g class="pl-lap" transform="translate(${LAP.x} ${LAP.y})">
        <rect class="pl-lap-s" x="-78" y="-62" width="156" height="102" rx="8"/>
        <path class="pl-lap-b" d="M-98 40h196l-12 16h-172z"/>
        <g class="pl-lock" transform="translate(0 -12)"><circle r="26"/><path class="sh" d="M-8-4v-7a8 8 0 0 1 16 0v7"/><rect x="-12" y="-4" width="24" height="19" rx="3"/></g>
      </g>
      ${phones}
    </svg>
  </div>`;
}
function liveLocal(box){
  const svg = box.querySelector('.pl-net');
  const bars = [...box.querySelectorAll('.pl-pb')];
  const phones = [...box.querySelectorAll('.pl-lph')];
  const lock = box.querySelector('.pl-lock');
  const count = [0, 0, 0];
  const NS = 'http://www.w3.org/2000/svg';
  const draw = () => bars.forEach((b, i) => b.style.setProperty('--h', Math.min(1, .06 + count[i] / 9).toFixed(3)));
  // точка-ответ в координатах схемы: по ломаной, с равной скоростью
  const run = (pts, { dur = 1300, cls = 'pl-ldot' } = {}) => {
    const d = document.createElementNS(NS, 'circle');
    d.setAttribute('r', 7); d.setAttribute('class', cls);
    svg.append(d);
    const len = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    const all = len.reduce((a, b) => a + b, 0);
    let acc = 0;
    const frames = pts.map((p, i) => { if (i) acc += len[i - 1]; return { transform: `translate(${p[0]}px,${p[1]}px)`, offset: acc / all }; });
    return d.animate(frames, { duration: dur, easing: 'ease-in-out' }).finished.then(() => d, () => d);
  };
  let on = false, busy = false, gen = 0;
  const send = g => {
    const i = rnd(PHONES.length), ch = Math.random() < .5 ? 0 : Math.random() < .6 ? 1 : 2;
    const b = bars[ch];
    const bx = 40 + +b.getAttribute('x') + 13;
    phones[i].classList.remove('tap'); void phones[i].getBoundingClientRect(); phones[i].classList.add('tap');
    run([[PHONES[i], 366], [LAP.x, 300], [LAP.x, 236], [262, 214], [208, 150], [bx, 112]], { dur: 1700 })
      .then(d => { d.remove(); if (g === gen) { count[ch]++; draw(); } });
  };
  // телефон из зала пробует открыть пульт: замок вздрагивает, точка гаснет
  const knock = () => {
    const i = 3;
    phones[i].classList.remove('tap'); void phones[i].getBoundingClientRect(); phones[i].classList.add('tap');
    run([[PHONES[i], 366], [LAP.x + 4, 250]], { dur: 1000, cls: 'pl-ldot no' }).then(d => {
      lock.classList.remove('deny'); void lock.getBoundingClientRect(); lock.classList.add('deny');
      d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).finished.then(() => d.remove(), () => d.remove());
    });
  };
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      const g = ++gen;
      count.fill(0); draw(); svg.classList.remove('cut');
      await wait(900); if (!on) break;
      for (let k = 0; k < 4 && on; k++) { send(g); await wait(520); }
      svg.classList.add('cut');                                    // интернет пропал
      await wait(700);
      for (let k = 0; k < 12 && on; k++) { if (k === 5) knock(); else send(g); await wait(480); }   // а ответы идут
      await wait(2600);
    }
    busy = false;
  };
  if (still()) { svg.classList.add('cut'); count.splice(0, 3, 6, 4, 2); draw(); return; }
  draw();
  onScreen(svg, v => { on = v; if (on) loop(); }, .35);
}

/* ---------- демо: кнопка под текстом последней главы ---------- */
const tryHTML = t => t ? `<div class="pl-try">
  <h3 class="pl-try-title">${H.T(t.title)}</h3>
  ${H.pick(t.text) ? `<p class="pl-try-text">${H.T(t.text)}</p>` : ''}
  <a class="btn btn-accent pl-try-btn" href="${esc(t.link)}" target="_blank" rel="noopener">${H.T(t.btn)}</a>
</div>` : '';

/* ---------- запуск ---------- */
// split — иллюстрация слева, текст справа; иначе заголовок сверху и сцена во всю ширину
const CHAPTERS = [
  { k: 'hands', html: hallHTML, live: liveHands, split: c => switchHTML(c.toggle) },
  { k: 'join', html: joinHTML, live: liveJoin },
  { k: 'results', html: resHTML, live: liveRes },
  { k: 'deck', html: deckHTML, live: liveDeck, split: () => '' },
  { k: 'local', html: localHTML, live: liveLocal, split: (c, a) => tryHTML(a.try) },
];

let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'poll.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountPoll(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const a = p.poll;
  const list = CHAPTERS.filter(ch => a[ch.k]);
  mount.innerHTML = list.map(({ k, html, split }) => split
    ? `<section class="pl-ch wrap pl-${k}-ch pl-split"><div class="pl-viz">${html(a[k])}</div>${side(a[k], split(a[k], a))}</section>`
    : `<section class="pl-ch wrap pl-${k}-ch">${head(a[k])}<div class="pl-viz">${html(a[k])}</div></section>`).join('');
  mount.querySelectorAll('.pl-title').forEach(splitWords);
  mount.querySelectorAll('.pl-ch').forEach(s => reveal.observe(s));
  list.forEach(({ k, live }) => live(mount.querySelector(`.pl-${k}-ch`), a[k]));
}
