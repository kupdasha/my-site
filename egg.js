/* ================================================================
   КЕЙС «ТАЙМЕР ДЛЯ ЯЙЦА» (поле egg у проекта)
   Иллюстрации — интерфейс самого таймера (egg.kupdaria26.workers.dev):
   светлый экран, белые подложки, черная пилюля, цифры прокручиваются
   по одной. Яйцо — той же формы, что в приложении; желток застывает
   от края к центру: розовая жидкая середина сжимается внутри желтого
   (цвета не смешиваются — без оранжевого).
   cond  — условия и желток вместе, почти без слов: переключатели-иконки
           «яйцо» и «вода», пять желтков, время и разница пересчитываются
           (переключаются сами, пока не тронули);
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
   cond — условия и желток в одной главе, почти без слов:
   слева яйцо в разрезе с выбранным желтком (у яйца из холодильника
   скорлупа холодная, в кипятке над ним пар); справа два переключателя-
   иконки — яйцо (снежинка / дом) и вода (кастрюля / кастрюля с паром),
   крупное время и разница с «холодильник + холодная вода»;
   внизу пять желтков — консистенция. Желток один и тот же, меняется время
   ================================================================ */
const ICO = {
  fridge: '<path d="M12 3V21M4.2 7.5L19.8 16.5M4.2 16.5L19.8 7.5M9.5 4.5L12 7L14.5 4.5M9.5 19.5L12 17L14.5 19.5"/>',
  room:   '<path d="M3.5 11.5L12 4L20.5 11.5M6 9.5V20H18V9.5"/><path d="M10 20V15H14V20"/>',
  cold:   '<path d="M3 10H21M5 10V16A4 4 0 0 0 9 20H15A4 4 0 0 0 19 16V10"/><path d="M7.5 14H16.5"/>',
  boil:   '<path d="M3 10H21M5 10V16A4 4 0 0 0 9 20H15A4 4 0 0 0 19 16V10"/><path d="M8.5 7C7.5 5.8 9.5 4.8 8.5 3.5M12 7C11 5.8 13 4.8 12 3.5M15.5 7C14.5 5.8 16.5 4.8 15.5 3.5"/>',
};
const iseg = (k, a, b, c) => `<div class="eg-seg eg-iseg" data-k="${k}">
  ${[a, b].map((n, i) => `<button type="button" class="${i ? '' : 'sel'}" data-i="${i}" aria-label="${esc(H.pick(c.aria[n]))}" title="${esc(H.pick(c.aria[n]))}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICO[n]}</svg></button>`).join('')}
  <i class="eg-pill" aria-hidden="true"></i></div>`;
// мини-желток: желтый круг, розовая жидкая середина размером liq
const miniYolk = k => `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#FFD84D"/>${k.liq > 0 ? `<circle cx="20" cy="20" r="${(15 * k.liq).toFixed(1)}" fill="#F0506E"/>` : ''}</svg>`;
function condHTML(c, y){
  return `<div class="eg-app eg-cond-app" data-room="0" data-boil="0">
    <div class="eg-cond-egg">${eggSVG()}<span class="eg-puff" aria-hidden="true"><i></i><i></i><i></i></span></div>
    <div class="eg-cond-side">
      <div class="eg-qs">${iseg('room', 'fridge', 'room', c)}${iseg('boil', 'cold', 'boil', c)}</div>
      <div class="eg-read"><div class="eg-time"></div><div class="eg-delta" aria-live="polite"></div></div>
      <div class="eg-yolks">${y.kinds.map((k, i) => `<button type="button" class="eg-yk" data-i="${i}" aria-label="${esc(H.pick(k.name))}" title="${esc(H.pick(k.name))}">${miniYolk(k)}</button>`).join('')}</div>
    </div>
  </div>`;
}
function liveCond(box, c, y){
  const app = box.querySelector('.eg-cond-app');
  const egg = eggCtl(app.querySelector('.eg-egg'), 1);
  const setT = digits(app.querySelector('.eg-time'));
  const delta = app.querySelector('.eg-delta');
  const yks = [...app.querySelectorAll('.eg-yk')];
  const st = { room: 0, boil: 0, y: Math.max(0, y.kinds.findIndex(k => k.best)) };
  const pulse = el => { if (still() || !el) return; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); };
  const paint = (changed, now) => {
    app.dataset.room = st.room; app.dataset.boil = st.boil;
    app.querySelectorAll('.eg-seg').forEach(s => {
      const v = st[s.dataset.k];
      s.classList.toggle('right', !!v);
      s.querySelectorAll('button').forEach(b => b.classList.toggle('sel', +b.dataset.i === v));
    });
    yks.forEach((b, i) => b.classList.toggle('sel', i === st.y));
    const k = y.kinds[st.y];
    egg.set(k.liq, now);
    const m = minutes(k.base, st.room, st.boil), d = k.base - m;
    setT(fmt(m * 60));
    flip(delta, d ? '−' + fmt(d * 60).replace(/^0/, '') : '');
    if (changed) pulse(changed === 'y' ? yks[st.y] : app.querySelector(`.eg-seg[data-k="${changed}"]`));
  };
  // сами, по одному: условия меняются чаще желтка — главное в главе — они
  const STEPS = [['room', 1], ['boil', 1], ['room', 0], ['boil', 0], ['y', 1]];
  let step = 0, timer = 0, touched = false, on = false;
  const go = () => {
    clearInterval(timer);
    if (!on || touched || still()) return;
    timer = setInterval(() => {
      if (!app.isConnected) return clearInterval(timer);
      const [key, v] = STEPS[step++ % STEPS.length];
      if (key === 'y') st.y = (st.y + 1) % y.kinds.length; else st[key] = v;
      paint(key);
    }, 2000);
  };
  const stop = () => { touched = true; clearInterval(timer); };
  app.querySelectorAll('.eg-seg button').forEach(b => b.addEventListener('click', () => {
    stop(); const k = b.parentNode.dataset.k; st[k] = +b.dataset.i; paint(k);
  }));
  yks.forEach((b, i) => b.addEventListener('click', () => { stop(); st.y = i; paint('y'); }));
  paint(null, true);
  onScreen(app, v => { on = v; egg.run(v); app.classList.toggle('run', v && !still()); go(); }, .35);
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
    + (e.timer ? chapter('timer', timerHTML(e.timer), e.timer, e.try, true) : '');
  mount.querySelectorAll('.eg-ch').forEach(s => reveal.observe(s));
  const q = s => mount.querySelector(s);
  if (e.cond) liveCond(q('.eg-cond'), e.cond, y);
  if (e.timer) liveTimer(q('.eg-timer'), e.timer, y);
}
