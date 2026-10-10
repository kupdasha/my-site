/* ================================================================
   КЕЙС «ТАЙМЕР ДЛЯ ЯЙЦА» (поле egg у проекта)
   Иллюстрации — интерфейс самого таймера (egg.kupdaria26.workers.dev):
   светлый экран, белые подложки, черная пилюля, цифры прокручиваются
   по одной. Яйцо — той же формы, что в приложении; желток застывает
   от края к центру: розовая жидкая середина сжимается внутри желтого
   (цвета не смешиваются — без оранжевого).
   cond  — переключатели «яйца» и «вода», кастрюля и время пересчитываются
           (переключаются сами, пока не тронули);
   yolk  — пять плиток консистенции, яйцо показывает желток (перебираются сами);
   timer — экран таймера: отсчет ускорен, пар, «готово» с волной,
           нажатие на яйцо — пауза; под текстом — кнопка демо (egg.try).
   Минуты — по формуле приложения: base из yolk.kinds, кипяток −1 мин,
   комнатное яйцо −30 с. Тексты — в content.js, оформление — egg.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

// время по формуле приложения
const minutes = (base, room, boil) => base - (boil ? 1 : 0) - (room ? .5 : 0);
const fmt = s => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const fmtMin = m => Number.isInteger(m) ? String(m) : Math.floor(m) + '½';

/* ---------- цифры, которые прокручиваются по одной (как в приложении) ---------- */
function digits(el){
  let prev = '';
  return str => {
    if (str === prev) return;
    if (el.children.length !== str.length) {
      el.innerHTML = [...str].map(ch => `<span class="eg-d${ch === ':' ? ' c' : ''}"><span>${ch}</span></span>`).join('');
      prev = str; return;
    }
    [...str].forEach((ch, i) => {
      if (prev[i] === ch) return;
      const cell = el.children[i];
      const old = cell.querySelector('span:not(.out)');
      if (old) { old.className = 'out'; setTimeout(() => old.remove(), 420); }
      const s = document.createElement('span');
      s.className = still() ? '' : 'in'; s.textContent = ch;
      cell.appendChild(s);
    });
    prev = str;
  };
}
// подпись меняется вертикальным перелистыванием
function flip(el, html){
  if (el.dataset.v === html) return;
  el.dataset.v = html; el.innerHTML = html;
  if (still()) return;
  el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
}

/* ---------- яйцо: белок той же формы, что в приложении, желток в разрезе ---------- */
const SHELL = 'M100 12C144 12 162 52 174 112C186 172 184 238 100 238C16 238 14 172 26 112C38 52 56 12 100 12Z';
const YX = 100, YY = 156, YR = 54;
let gid = 0;
function eggSVG(){
  const id = 'egr' + (++gid);
  return `<svg class="eg-egg" viewBox="0 0 200 250" aria-hidden="true">
    <defs>
      <radialGradient id="${id}r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F0284A"/><stop offset=".7" stop-color="#FF6F8C"/><stop offset="1" stop-color="#FF9AB0"/></radialGradient>
      <radialGradient id="${id}y" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD12E"/><stop offset="1" stop-color="#FFE47A"/></radialGradient>
      <radialGradient id="${id}w" cx=".5" cy=".42" r=".6"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#FBF3F5"/></radialGradient>
    </defs>
    <path class="eg-white" d="${SHELL}" fill="url(#${id}w)"/>
    <path class="eg-rim raw" d="${SHELL}"/>
    <path class="eg-rim set" d="${SHELL}"/>
    <circle class="eg-y" cx="${YX}" cy="${YY}" r="${YR}" fill="url(#${id}y)"/>
    <path class="eg-core" fill="url(#${id}r)"/>
  </svg>`;
}
// liq — доля жидкой середины: 1 — сырой, 0 — вкрутую. Жидкая середина дрожит, тем сильнее, чем ее больше
function eggCtl(svg, liq = 1){
  const core = svg.querySelector('.eg-core');
  let cur = liq, goal = liq, raf = 0, on = false, last = 0;
  const draw = t => {
    const r = YR * cur, a = still() ? 0 : .045 * cur, N = 40;
    svg.style.setProperty('--set', (1 - cur).toFixed(3));
    if (r < .6) { core.setAttribute('d', ''); return; }
    let d = '';
    for (let i = 0; i <= N; i++) {
      const th = i / N * Math.PI * 2;
      const k = 1 + a * (.6 * Math.sin(3 * th + t * 2.1) + .4 * Math.sin(5 * th - t * 1.7));
      d += (i ? 'L' : 'M') + (YX + Math.cos(th) * r * k).toFixed(2) + ' ' + (YY + Math.sin(th) * r * k).toFixed(2);
    }
    core.setAttribute('d', d + 'Z');
  };
  const loop = now => {
    if (!svg.isConnected || !on) { raf = 0; return; }
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    cur += (goal - cur) * Math.min(1, dt * 5);
    draw(now / 1000);
    raf = requestAnimationFrame(loop);
  };
  draw(0);
  return {
    set(v, now){ goal = v; if (now) cur = v; if (!raf) draw(performance.now() / 1000); },
    run(v){ on = v; if (on && !raf) { last = 0; raf = requestAnimationFrame(loop); } },
  };
}

/* ---------- текст главы: подпись, заголовок, абзац, кнопка демо ---------- */
const block = (c, t) => `<div class="eg-col">
  <span class="case-label eg-label">${H.T(c.label)}</span>
  <h2 class="eg-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="eg-text">${H.T(c.text)}</p>` : ''}
  ${t ? `<div class="eg-try">
    <h3 class="eg-try-title">${H.T(t.title)}</h3>
    <p class="eg-try-text">${H.T(t.text)}</p>
    <a class="btn btn-accent eg-try-btn" href="${esc(t.link)}" target="_blank" rel="noopener">${H.T(t.btn)}</a>
  </div>` : ''}
</div>`;
const chapter = (k, viz, c, t, flipSide) =>
  `<section class="eg-ch wrap eg-split eg-${k}${flipSide ? ' rev' : ''}"><div class="eg-viz">${viz}</div>${block(c, t)}</section>`;

/* ================================================================
   cond — откуда яйцо и какая вода: кастрюля, переключатели, время
   ================================================================ */
const seg = (k, q) => `<div class="eg-q"><span class="eg-qn">${H.T(q[0])}</span>
  <div class="eg-seg" data-k="${k}">${q[1].map((o, i) => `<button type="button" class="${i ? '' : 'sel'}" data-i="${i}">${H.T(o)}</button>`).join('')}<i class="eg-pill" aria-hidden="true"></i></div></div>`;
// кастрюля линиями: вода спокойная или с пузырями, у яйца из холодильника — иней
const POT = `<svg class="eg-pot" viewBox="0 0 260 190" aria-hidden="true">
  <g class="eg-steam"><path d="M98 34C92 26 104 20 98 10"/><path d="M130 30C124 22 136 16 130 6"/><path d="M162 34C156 26 168 20 162 10"/></g>
  <path class="eg-water" d="M36 88C66 88 80 88 130 88C180 88 194 88 224 88V148C224 166 212 176 194 176H66C48 176 36 166 36 148Z"/>
  <path class="eg-wave" d="M36 88Q58 80 80 88T124 88T168 88T212 88T256 88"/>
  <g class="eg-bub"><circle cx="70" cy="168" r="4"/><circle cx="104" cy="170" r="3"/><circle cx="160" cy="168" r="4.5"/><circle cx="190" cy="170" r="3"/><circle cx="132" cy="171" r="3.5"/></g>
  <g class="eg-in"><path d="M130 96C146 96 154 110 158 128C162 148 158 168 130 168C102 168 98 148 102 128C106 110 114 96 130 96Z"/>
    <g class="eg-frost"><path d="M114 116L120 122M120 116L114 122M117 114V124M112 119H122"/><path d="M142 138L147 143M147 138L142 143M144.5 136V145M140 140.5H149"/><path d="M120 146L124 150M124 146L120 150"/></g></g>
  <path class="eg-potline" d="M36 64V148C36 166 48 176 66 176H194C212 176 224 166 224 148V64M24 64H236M24 72H8M236 72H252"/>
</svg>`;
function condHTML(c, y){
  return `<div class="eg-app eg-cond-app" data-room="0" data-boil="0">
    <div class="eg-cond-top">${POT}
      <div class="eg-read"><div class="eg-time"></div><div class="eg-lbl-clip"><div class="eg-lbl"></div></div></div>
    </div>
    <div class="eg-qs">${seg('room', c.egg)}${seg('boil', c.water)}</div>
  </div>`;
}
function liveCond(box, c, y){
  const app = box.querySelector('.eg-cond-app');
  const kind = y.kinds.find(k => k.best) || y.kinds[0];
  const setT = digits(app.querySelector('.eg-time'));
  const lbl = app.querySelector('.eg-lbl');
  const st = { room: 0, boil: 0 };
  const paint = () => {
    app.dataset.room = st.room; app.dataset.boil = st.boil;
    app.querySelectorAll('.eg-seg').forEach(s => {
      const v = st[s.dataset.k];
      s.classList.toggle('right', !!v);
      s.querySelectorAll('button').forEach(b => b.classList.toggle('sel', +b.dataset.i === v));
    });
    const m = minutes(kind.base, st.room, st.boil);
    setT(fmt(m * 60));
    flip(lbl, H.T(c.for).replace('{n}', H.T(kind.name).toLowerCase()));
  };
  // переключаются сами по одному: стол, кипяток, холодильник, холодная вода — пока посетитель не нажал
  const ORDER = [['room', 1], ['boil', 1], ['room', 0], ['boil', 0]];
  let step = 0, timer = 0, touched = false, on = false;
  const go = () => {
    clearInterval(timer);
    if (!on || touched || still()) return;
    timer = setInterval(() => {
      if (!app.isConnected) return clearInterval(timer);
      const [k, v] = ORDER[step++ % ORDER.length]; st[k] = v; paint();
    }, 2200);
  };
  app.querySelectorAll('.eg-seg button').forEach(b => b.addEventListener('click', () => {
    touched = true; clearInterval(timer);
    st[b.parentNode.dataset.k] = +b.dataset.i; paint();
  }));
  paint();
  onScreen(app, v => { on = v; app.classList.toggle('run', v && !still()); go(); }, .35);
}

/* ================================================================
   yolk — пять плиток консистенции и яйцо в разрезе
   ================================================================ */
function yolkHTML(y){
  return `<div class="eg-app eg-yolk-app">
    <div class="eg-yolk-egg">${eggSVG()}<div class="eg-lbl-clip"><div class="eg-lbl eg-desc"></div></div></div>
    <div class="eg-tiles">${y.kinds.map((k, i) => `<button type="button" class="eg-tile" data-i="${i}">
      <span class="eg-mins">${fmtMin(minutes(k.base, 0, 0))} ${H.T(y.min)}</span><span class="eg-nm">${H.T(k.name)}</span><i></i></button>`).join('')}</div>
  </div>`;
}
function liveYolk(box, y){
  const app = box.querySelector('.eg-yolk-app');
  const egg = eggCtl(app.querySelector('.eg-egg'), y.kinds[0].liq);
  const tiles = [...app.querySelectorAll('.eg-tile')];
  const desc = app.querySelector('.eg-desc');
  let cur = -1, touched = false, on = false, raf = 0, t0 = 0;
  const LAP = 2600;
  const show = (i, now) => {
    if (i === cur) return;
    cur = i; const k = y.kinds[i];
    tiles.forEach((t, j) => { t.classList.toggle('sel', j === i); if (j !== i) t.style.setProperty('--p', 0); });
    egg.set(k.liq, now);
    flip(desc, H.T(k.desc));
    if (!still()) { const t = tiles[i]; t.classList.remove('just'); void t.offsetWidth; t.classList.add('just'); }
  };
  // плитки перебираются сами; полоска на текущей — сколько до следующей
  const tick = now => {
    if (!on || touched || !app.isConnected) { raf = 0; return; }
    if (!t0) t0 = now;
    const t = (now - t0) / LAP, n = Math.floor(t);
    show(n % tiles.length);
    tiles[cur].style.setProperty('--p', t - n);
    raf = requestAnimationFrame(tick);
  };
  const stop = () => { touched = true; tiles.forEach(t => t.style.setProperty('--p', 0)); };
  tiles.forEach((t, i) => {
    t.addEventListener('click', () => { stop(); show(i); });
    t.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { stop(); show(i); } });
  });
  show(0, true);
  onScreen(app, v => {
    on = v; egg.run(v);
    if (v && !touched && !raf && !still()) { t0 = 0; cur = -1; raf = requestAnimationFrame(tick); }
  }, .35);
}

/* ================================================================
   timer — экран таймера: отсчет ускорен, яйцо готовится, «готово»
   ================================================================ */
function timerHTML(t){
  return `<div class="eg-app eg-timer-app">
    <div class="eg-aura raw"></div><div class="eg-aura set"></div>
    <button type="button" class="eg-tap" aria-label="${esc(H.pick(t.ui.pause))}">
      <span class="eg-float">${eggSVG()}</span>
      <span class="eg-puff" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="eg-ring" aria-hidden="true"></span>
    </button>
    <div class="eg-read"><div class="eg-time big"></div><div class="eg-lbl-clip"><div class="eg-lbl"></div></div></div>
    <button type="button" class="eg-btn"></button>
  </div>
  ${t.hint ? `<p class="eg-hint">${H.T(t.hint)}</p>` : ''}`;
}
function liveTimer(box, t, y){
  const app = box.querySelector('.eg-timer-app');
  const kind = y.kinds.find(k => k.best) || y.kinds[0];
  const egg = eggCtl(app.querySelector('.eg-egg'), 1);
  const setT = digits(app.querySelector('.eg-time'));
  const lbl = app.querySelector('.eg-lbl'), btn = app.querySelector('.eg-btn'), tap = app.querySelector('.eg-tap');
  const float = app.querySelector('.eg-float');
  const TOTAL = minutes(kind.base, 0, 0) * 60;   // яйцо из холодильника, холодная вода
  const STEP = 10, EVERY = 300;                   // 10 секунд отсчета за 0,3 с — восемь минут проходят за 14 с
  let left = TOTAL, state = 'cook', timer = 0, on = false, userPaused = false, again = 0;
  const progress = p => {
    app.style.setProperty('--cook', p.toFixed(3));
    egg.set(1 - p * (1 - kind.liq));
  };
  const paint = () => {
    setT(fmt(left));
    flip(lbl, H.T(state === 'done' ? t.ui.done : state === 'pause' ? t.ui.paused : t.ui.cooking));
    btn.innerHTML = H.T(state === 'done' ? t.ui.again : state === 'pause' ? t.ui.resume : t.ui.pause);
    btn.classList.toggle('soft', state === 'cook');
    app.classList.toggle('cooking', state === 'cook');
    app.classList.toggle('paused', state === 'pause');
  };
  const loop = () => {
    clearInterval(timer);
    if (!on || state !== 'cook') return;
    timer = setInterval(() => {
      if (!app.isConnected) return clearInterval(timer);
      left -= STEP; progress(1 - left / TOTAL);
      if (left <= 0) { left = 0; finish(); return; }
      setT(fmt(left));
    }, still() ? EVERY * 3 : EVERY);
  };
  const finish = () => {
    clearInterval(timer); state = 'done'; progress(1); paint();
    if (!still()) { app.classList.remove('done'); void app.offsetWidth; app.classList.add('done'); }
    clearTimeout(again);
    again = setTimeout(() => { if (state === 'done' && on) reset(); }, 4200);   // демо идет по кругу
  };
  const reset = () => {
    clearTimeout(again); app.classList.remove('done');
    left = TOTAL; state = 'cook'; userPaused = false; progress(0); egg.set(1, true); paint(); loop();
  };
  const toggle = () => {
    if (state === 'cook') { state = 'pause'; userPaused = true; clearInterval(timer); paint(); }
    else if (state === 'pause') { state = 'cook'; userPaused = false; paint(); loop(); }
    else reset();
  };
  tap.addEventListener('click', () => {
    if (!still()) { float.classList.remove('boing'); void float.offsetWidth; float.classList.add('boing'); }
    toggle();
  });
  btn.addEventListener('click', toggle);
  progress(0); paint();
  onScreen(app, v => {
    on = v; egg.run(v); app.classList.toggle('run', v && !still());
    if (!v) { clearInterval(timer); return; }
    if (state === 'done') { clearTimeout(again); again = setTimeout(() => { if (state === 'done' && on) reset(); }, 1600); }
    else if (!userPaused) loop();
  }, .35);
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'egg.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountEgg(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const e = p.egg, y = e.yolk;
  mount.innerHTML =
      (e.cond ? chapter('cond', condHTML(e.cond, y), e.cond) : '')
    + (y ? chapter('yolk', yolkHTML(y), y, null, true) : '')
    + (e.timer ? chapter('timer', timerHTML(e.timer), e.timer, e.try) : '');
  mount.querySelectorAll('.eg-ch').forEach(s => reveal.observe(s));
  const q = s => mount.querySelector(s);
  if (e.cond) liveCond(q('.eg-cond'), e.cond, y);
  if (y) liveYolk(q('.eg-yolk'), y);
  if (e.timer) liveTimer(q('.eg-timer'), e.timer, y);
}
