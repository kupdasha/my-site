/* ================================================================
   БЕЗУМИЕ ДРУЖЕСКОЙ ВЕРСИИ (пока только для компьютера)
   ----------------------------------------------------------------
   1. Кнопки на ножках, у каждой свой характер:
        бегает   — носится по своей строке и приседает;
        спит     — лежит на сложенных ножках, над ней «з-з-з»,
                   просыпается, если подвести курсор;
        обнимашки — две кнопки в строке сходятся и обнимаются;
        столкновение — на первом экране: бегают туда-сюда, потом
                   разгоняются навстречу и сталкиваются;
        толкучка — кнопки в строке толкают друг друга.
      Любую кнопку можно поймать: под курсором она замирает и дрожит.
   2. Заголовки разделов живут своей жизнью: буквы плывут, кружат,
      дерутся или собираются в смайлик.
   3. Многоножка ползет по рамке окна, иногда спрыгивает на кейсы
      и падает с одного на другой. Клик — перекрашивается, второй — убегает.
   5. Струны направлений оставляют радужный шлейф и звучат как гитара.
      Звук включается после первого клика где угодно (так требует браузер).
   6. НЛО летает по всей странице и ворует лучом то, что видно на экране:
      слова заголовков, названия, пометки, ноты, имена клиентов. Унеся
      несколько вещей, улетает, роняет всё обратно и потом возвращается.
   7. Названия кейсов осыпаются дождем, когда проект уезжает вверх.
   8. Превью кейсов под запотевшим стеклом — его надо протереть курсором.
   9. Секретные материалы — засекреченные досье с серебряной полосой:
      курсор становится монеткой, полосу можно стереть.
  10. При прокрутке на фоне мягко вспыхивают и гаснут цветные пятна.

   Работает только в темной (дружеской) версии, на экранах шире 900 px
   и с мышью. При «уменьшении движения» в системе — выключено.
   Ниже — всё, что можно спокойно менять.
   ================================================================ */
const FUN = {
  frostShare: 0.3,   // какую долю работ в выбранной категории покрывает иней (0.3 — 30%)
  runners: {
    speed:      130,   // скорость бега кнопок, px в секунду
    fleeSpeed:  260,   // скорость, с которой бегунья убегает от курсора
    fleeRadius: 120,   // с какого расстояния кнопка замечает курсор, px
    squatFrom:  700,   // сколько сидит на корточках, мс: от…
    squatTo:    1800,  //                                   …до
  },
  // характер кнопок задается автоматически, но можно поставить вручную
  // атрибутом у кнопки: data-mood="run" | "sleep" | "hug" | "push" | "clash"
  headings: ['float', 'fight', 'smile', 'orbit'],  // по очереди для заголовков разделов
  centipede: {
    segments: 16,      // сегментов в теле
    spacing:  11,      // расстояние между сегментами, px
    size:     6,       // половина ширины тела, px
    speed:    55,      // скорость, px в секунду
    inset:    14,      // отступ дорожки от края окна, px
    corner:   60,      // скругление дорожки в углах, px
    visitEvery: [12, 22], // раз в сколько секунд спрыгивает на кейсы (от, до)
    // расцветки по кругу (меняются по клику)
    colors: [
      { body: ['#E2FB5A', '#C6E244'], head: '#E2FB5A', legs: '#C9CDD6', boots: '#F4F4F6' },
      { body: ['#F4F4F6', '#D4D5D9'], head: '#F4F4F6', legs: '#9AA1AD', boots: '#E2FB5A' },
      { body: ['#B79FF3', '#9C84E6'], head: '#B79FF3', legs: '#C9CDD6', boots: '#F4F4F6' },
      { body: ['#7DAFFC', '#5E93EE'], head: '#7DAFFC', legs: '#C9CDD6', boots: '#F4F4F6' },
      { body: ['#F3E94A', '#7DE36A', '#3FD3C9', '#4F7BF2', '#A65BEF', '#E85BD0'], head: '#F4F4F6', legs: '#C9CDD6', boots: '#F4F4F6' },
    ],
  },
  guitar: {
    // струна над первой строкой и под каждой строкой — сверху вниз
    // на октаву выше настоящей гитары: самые низкие ноты динамики ноутбука почти не воспроизводят
    freqs: [659.26, 164.81, 220.0, 293.66, 392.0, 493.88, 659.26],
    notes: ['ми', 'ля', 'ре', 'соль', 'си', 'ми'],   // ноты в кружках строк
    volume: 0.6,
  },
  ufo: {
    visits: 3,      // сколько вещей ворует, прежде чем улететь
    speed:  0.035,  // плавность полета (больше — резче)
    hover:  1600,   // сколько висит после того, как съел текст, мс
  },
};

(() => {
if (window.__kdFun) return; window.__kdFun = true;
'use strict';
const root = document.documentElement;
const desktop = matchMedia('(min-width: 901px) and (hover: hover)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// дружеская версия работает везде, и на телефоне тоже; на сенсорных экранах кнопки не убегают от пальца
const touchDev = matchMedia('(hover: none)').matches;
const isActive = () => root.dataset.theme === 'dark' && !reduced;
const joke = key => dispatchEvent(new CustomEvent('fun:joke', { detail: key }));
const rand = (a, b) => a + Math.random() * (b - a);
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
let on = false;

let px = -1e4, py = -1e4;
addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });
document.addEventListener('pointerleave', () => { px = py = -1e4; });


/* ================================================================
   1. КНОПКИ НА НОЖКАХ
   ================================================================ */
const OBSTACLES = 'p, h1, h2, h3, .btn, .link, .tag, .media, .portrait, .nda-media, .pod-player, .eyebrow, .fact, img';
let runners = [], groups = [];

/* сколько места кнопка может пробежать влево и вправо, не наезжая на соседей */
function freeRange(r){
  const el = r.el, b = el.getBoundingClientRect();
  const left = b.left - r.x, right = left + b.width;
  const wrap = el.closest('.wrap') || document.body, w = wrap.getBoundingClientRect(), ws = getComputedStyle(wrap);
  let lo = w.left + (parseFloat(ws.paddingLeft) || 0), hi = w.right - (parseFloat(ws.paddingRight) || 0);
  (el.closest('section') || document.body).querySelectorAll(OBSTACLES).forEach(o => {
    if (o === el || el.contains(o) || o.contains(el)) return;
    let q = o.getBoundingClientRect();
    if (!q.width || q.bottom < b.top - 4 || q.top > b.bottom + 24) return;
    const shared = o.classList.contains('runner');
    if (shared) { const dx = parseFloat(o.style.translate) || 0; q = { left: q.left - dx, right: q.right - dx }; }
    if (q.right <= left + 2) lo = Math.max(lo, shared ? (q.right + left) / 2 + 9 : q.right + 18);
    else if (q.left >= right - 2) hi = Math.min(hi, shared ? (q.left + right) / 2 - 9 : q.left - 18);
  });
  r.min = Math.min(0, lo - left);
  r.max = Math.max(0, hi - right);
  r.base = left;
  r.width = b.width;
}

function addLegs(el){
  const legs = document.createElement('span');
  legs.className = 'legs'; legs.setAttribute('aria-hidden', 'true');
  legs.innerHTML = '<i></i><i></i><i></i><i></i>';
  el.appendChild(legs);
  el.classList.add('runner');
  const r = { el, legBox: legs, legs: [...legs.children], x: 0, y: 0, v: 0, rot: 0, phase: Math.random() * 6, target: 0, speed: FUN.runners.speed,
              state: 'squat', until: performance.now() + rand(600, 1800), caught: false, min: 0, max: 0, dir: 1, sq: 0, mood: 'run' };
  el.addEventListener('pointerenter', r.onEnter = () => { r.caught = true; if (!r.wasCaught) { r.wasCaught = true; joke('caught'); } });
  el.addEventListener('pointerleave', r.onLeave = () => { r.caught = false; r.state = 'squat'; r.until = performance.now() + 500; });
  return r;
}
function removeLegs(r){
  r.el.querySelector('.legs')?.remove();
  r.el.querySelector('.zzz')?.remove();
  r.el.classList.remove('runner');
  r.el.style.translate = ''; r.el.style.rotate = '';
  r.el.removeEventListener('pointerenter', r.onEnter);
  r.el.removeEventListener('pointerleave', r.onLeave);
}

function setupRunners(){
  runners.forEach(removeLegs);
  runners = []; groups = [];
  if (!on) return;
  // кнопки страницы (в прототипе — внутри main, на Тильде main нет), кроме шапки, кейса и сообщений
  runners = [...document.querySelectorAll('.btn, .hero-link')].filter(el => !el.closest('.head, .case, .toasts, .fab')).map(addLegs);
  runners.forEach(freeRange);
  // характеры: по строкам
  const rows = new Map();
  runners.forEach(r => { const row = r.el.closest('.ctas') || r.el; if (!rows.has(row)) rows.set(row, []); rows.get(row).push(r); });
  rows.forEach(list => {
    list.sort((a, b) => a.base - b.base);
    const manual = list[0].el.dataset.mood;
    let mood = manual || (list.length >= 3 ? 'push' : list.length === 2 ? (list[0].el.closest('#hero') ? 'clash' : 'hug') : list[0].el.closest('#nda') ? 'sleep' : 'run');
    if (list.length < 2 && (mood === 'push' || mood === 'hug' || mood === 'clash')) mood = 'run';
    list.forEach(r => r.mood = mood);
    if (mood === 'hug' || mood === 'push' || mood === 'clash') groups.push({ mood, list, state: 'rest', until: performance.now() + rand(1200, 2500) });
    if (mood === 'sleep') list.forEach(r => {
      const z = document.createElement('span'); z.className = 'zzz'; z.setAttribute('aria-hidden', 'true');
      z.innerHTML = '<i style="--k:0">з</i><i style="--k:1">з</i><i style="--k:2">з</i>';
      r.el.appendChild(z); r.zzz = z;
    });
  });
}

function setLegs(r, angles, len){
  r.legs.forEach((leg, i) => { leg.style.setProperty('--a', angles[i].toFixed(1) + 'deg'); leg.style.setProperty('--leg', len.toFixed(1) + 'px'); });
}
function place(r){
  r.el.style.translate = `${r.x.toFixed(1)}px ${r.y.toFixed(1)}px`;
  r.el.style.rotate = `${r.rot.toFixed(2)}deg`;
}
/* пойманная кнопка: на цыпочках дрожит */
function tremble(r, dt){
  r.phase += dt * 40; r.y = -2; r.rot *= 0.8;
  setLegs(r, [0, 1, 2, 3].map(i => Math.sin(r.phase + i) * 7), 20);
}
/* шагать к цели (для обнимашек и толкучки) */
function walkTo(r, target, speed, dt){
  const delta = target - r.x, step = speed * dt;
  if (Math.abs(delta) <= step) { r.x = target; return true; }
  r.x += Math.sign(delta) * step; r.dir = Math.sign(delta);
  r.phase += dt * speed / 9;
  r.y = -Math.abs(Math.sin(r.phase)) * 3;
  setLegs(r, [0, 1, 2, 3].map(i => Math.sin(r.phase + (i % 2) * Math.PI) * 30 * r.dir), 18);
  return false;
}
function idle(r, dt){
  r.phase += dt * 3;
  r.y += (Math.sin(r.phase) * 1 - r.y) * 0.2;
  setLegs(r, [20, 8, -8, -20].map((a, i) => a + Math.sin(r.phase + i) * 4), 16);
}

function stepRun(r, dt, now){
  const b = r.el.getBoundingClientRect();
  const d = Math.hypot(b.left + b.width / 2 - px, b.top + b.height / 2 - py);
  if (!touchDev && d < FUN.runners.fleeRadius && r.max - r.min > 20) {
    const away = b.left + b.width / 2 > px ? r.max : r.min;
    if (Math.abs(away - r.x) > 4) { r.target = away; r.speed = FUN.runners.fleeSpeed; r.state = 'run'; }
  }
  if (r.state === 'run') {
    const delta = r.target - r.x, stepLen = r.speed * dt;
    r.dir = Math.sign(delta) || r.dir;
    if (Math.abs(delta) <= stepLen) { r.x = r.target; r.state = 'squat'; r.until = now + rand(FUN.runners.squatFrom, FUN.runners.squatTo); }
    else r.x += Math.sign(delta) * stepLen;
    r.phase += dt * r.speed / 9;
    r.sq += (0 - r.sq) * 0.2;
    r.y = -Math.abs(Math.sin(r.phase)) * 3 + r.sq;
    setLegs(r, [0, 1, 2, 3].map(i => Math.sin(r.phase + (i % 2) * Math.PI) * 30 * r.dir), 18);
  } else if (r.state === 'dance') {
    r.phase += dt * 12; r.y = -Math.abs(Math.sin(r.phase)) * 2;
    setLegs(r, [0, 1, 2, 3].map(i => Math.sin(r.phase + (i % 2) * Math.PI) * 18), 18);
    if (now > r.until) { r.state = 'squat'; r.until = now + 900; }
  } else {
    r.sq += (7 - r.sq) * 0.12; r.y = r.sq;
    setLegs(r, [32, 14, -14, -32], 18 - r.sq * 1.1);
    if (now > r.until) {
      r.sq = 7;
      const span = r.max - r.min;
      if (span < 30) { r.state = 'dance'; r.until = now + 900; }
      else { let t; do { t = r.min + Math.random() * span; } while (Math.abs(t - r.x) < Math.min(60, span / 3)); r.target = t; r.speed = FUN.runners.speed; r.state = 'run'; }
    }
  }
}

function stepSleep(r, dt, now){
  const b = r.el.getBoundingClientRect();
  const near = Math.hypot(b.left + b.width / 2 - px, b.top + b.height / 2 - py) < 150;
  if (near) r.awakeUntil = now + 2200;
  if (now < (r.awakeUntil || 0)) {
    // проснулась: подпрыгнула и топчется на месте
    if (!r.awake) { r.awake = true; r.y = -12; }
    r.phase += dt * 14; r.y += (-Math.abs(Math.sin(r.phase)) * 3 - r.y) * 0.25;
    setLegs(r, [0, 1, 2, 3].map(i => Math.sin(r.phase + (i % 2) * Math.PI) * 22), 18);
    if (r.zzz) r.zzz.style.display = 'none';
    r.legBox.style.opacity = '';
  } else {
    // спит: ножки сложены, дышит
    r.awake = false;
    r.phase += dt * 1.3;
    r.y += (5 + Math.sin(r.phase) * 1.4 - r.y) * 0.1;
    setLegs(r, [55, 35, -35, -55], 7);
    r.legBox.style.opacity = '0';            // лежит — ножек не видно
    if (r.zzz) r.zzz.style.display = '';
  }
}

function stepGroup(g, dt, now){
  const [A, B] = g.list;
  if (g.mood === 'clash') {
    // столкновение: бегают туда-сюда, разгоняются навстречу, сталкиваются, отлетают, покачиваются
    const spring = r => { r.v += (-r.x * 40 - r.v * 6) * dt; r.x += r.v * dt; };
    if (g.state === 'rest') { g.state = 'roam'; g.until = now + rand(3500, 5500); }
    if (g.state === 'roam') {
      g.list.forEach(r => { if (!r.caught) stepRun(r, dt, now); r.rot *= 0.9; });
      if (now > g.until) g.state = 'charge';
    } else if (g.state === 'charge') {
      const meet = (B.base - (A.base + A.width)) / 2 + 2;
      const a = A.caught || walkTo(A, meet, 340, dt), b = B.caught || walkTo(B, -meet, 340, dt);
      A.rot += (6 - A.rot) * 0.2; B.rot += (-6 - B.rot) * 0.2;           // наклонились вперед
      if (a && b) { g.state = 'bump'; g.until = now + 900; A.v = -440; B.v = 440; }
    } else if (g.state === 'bump') {
      g.list.forEach((r, i) => {
        if (r.caught) return;
        spring(r);
        r.rot += ((i ? 1 : -1) * Math.min(18, Math.abs(r.v) * 0.05) - r.rot) * 0.25;
        r.phase += dt * 25; r.y = -Math.abs(Math.sin(r.phase * 0.5)) * 4;
        setLegs(r, [0, 1, 2, 3].map(j => Math.sin(r.phase + j) * 28), 18);
      });
      if (now > g.until) { g.state = 'dizzy'; g.until = now + 1300; }
    } else if (g.state === 'dizzy') {
      // покачиваются, приходят в себя
      g.list.forEach(r => { if (r.caught) return; spring(r); r.rot = Math.sin(now / 90) * 5 * Math.max(0, (g.until - now) / 1300); idle(r, dt); });
      if (now > g.until) {
        g.state = 'roam'; g.until = now + rand(3500, 5500);
        g.list.forEach(r => { r.state = 'squat'; r.until = now + 300; r.rot = 0; r.v = 0; });
      }
    }
    return;
  }
  if (g.mood === 'hug') {
    // обнимашки: сходятся, наклоняются друг к другу, расходятся
    const gap = B.base - (A.base + A.width), meet = gap / 2 + 4;
    if (g.state === 'rest') { g.list.forEach(r => { if (!r.caught) idle(r, dt); r.rot *= 0.9; }); if (now > g.until) g.state = 'go'; }
    else if (g.state === 'go') {
      const a = A.caught || walkTo(A, meet, 110, dt), b = B.caught || walkTo(B, -meet, 110, dt);
      if (a && b) { g.state = 'hug'; g.until = now + 1800; }
    } else if (g.state === 'hug') {
      g.list.forEach((r, i) => {
        if (r.caught) return;
        r.phase += dt * 4;
        r.rot += ((i ? -7 : 7) - r.rot) * 0.15;
        r.y = -2 + Math.sin(r.phase) * 1.5;
        setLegs(r, [26, 10, -10, -26].map(a => a + Math.sin(r.phase * 2) * 5), 17);
      });
      if (now > g.until) g.state = 'back';
    } else if (g.state === 'back') {
      g.list.forEach(r => r.rot *= 0.85);
      const a = A.caught || walkTo(A, 0, 90, dt), b = B.caught || walkTo(B, 0, 90, dt);
      if (a && b) { g.state = 'rest'; g.until = now + rand(2500, 4500); }
    }
    return;
  }
  // толкучка: одна кнопка толкает соседку, та отлетает и пружинит обратно
  g.list.forEach(r => {
    if (r.caught || r === g.att) return;
    r.v += (-r.x * 60 - r.v * 9) * dt; r.x += r.v * dt;      // пружина к своему месту
    r.rot += (Math.max(-12, Math.min(12, r.v * 0.04)) - r.rot) * 0.2;
    if (Math.abs(r.v) > 30) { r.phase += dt * 20; setLegs(r, [0, 1, 2, 3].map(i => Math.sin(r.phase + i) * 25), 18); r.y = -2; }
    else idle(r, dt);
  });
  if (g.state === 'rest' && now > g.until) {
    const i = Math.floor(Math.random() * (g.list.length - 1)), right = Math.random() < 0.5;
    g.att = g.list[right ? i : i + 1]; g.vic = g.list[right ? i + 1 : i];
    g.dir = right ? 1 : -1; g.state = 'windup'; g.until = now + 350;
  } else if (g.state === 'windup') {
    const r = g.att; if (!r.caught) { r.x += (-g.dir * 10 - r.x) * 0.2; r.rot += (-g.dir * 6 - r.rot) * 0.2; idle(r, dt); }
    if (now > g.until) g.state = 'lunge';
  } else if (g.state === 'lunge') {
    const r = g.att, gap = g.dir > 0 ? (g.vic.base - (r.base + r.width)) : (r.base - (g.vic.base + g.vic.width));
    if (r.caught || walkTo(r, g.dir * (gap + 2), 420, dt)) { g.vic.v += g.dir * 320; g.state = 'back'; g.until = now + 300; }
    r.rot += (g.dir * 8 - r.rot) * 0.3;
  } else if (g.state === 'back') {
    const r = g.att; r.rot *= 0.85;
    if (now > g.until && (r.caught || walkTo(r, 0, 120, dt))) { g.att = null; g.state = 'rest'; g.until = now + rand(1800, 3200); }
  }
}

function stepRunners(dt, now){
  runners.forEach(r => {
    if (r.caught) { tremble(r, dt); return; }
    if (r.mood === 'run') stepRun(r, dt, now);
    else if (r.mood === 'sleep') stepSleep(r, dt, now);
  });
  groups.forEach(g => stepGroup(g, dt, now));
  runners.forEach(place);
}


/* ================================================================
   2. ЗАГОЛОВКИ ЖИВУТ СВОЕЙ ЖИЗНЬЮ
   ================================================================ */
let heads = [];
function setupHeadings(){
  heads.forEach(h => h.letters.forEach(ch => { ch.style.translate = ''; ch.style.rotate = ''; }));
  heads = [];
  if (!on) return;
  [...document.querySelectorAll('.h2, .clients-title')].filter(el => !el.closest('.case')).forEach((el, k) => {
    const letters = [...el.querySelectorAll('.ch')];
    if (!letters.length) return;
    const words = [...el.querySelectorAll('.wd')];
    heads.push({ el, letters, words, mood: el.dataset.mood || FUN.headings[k % FUN.headings.length], t0: rand(0, 3) });
  });
}
function stepHeadings(now){
  const t = now / 1000;
  heads.forEach(h => {
    const box = h.el.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight) return;
    const L = h.letters, n = L.length, tt = t + h.t0;
    if (h.mood === 'float') {
      // буквы плывут, как по воде
      L.forEach((ch, i) => { ch.style.translate = `0 ${(Math.sin(tt * 1.4 + i * 0.5) * 5).toFixed(1)}px`; ch.style.rotate = `${(Math.sin(tt * 1.1 + i * 0.6) * 4).toFixed(1)}deg`; });
    } else if (h.mood === 'orbit') {
      // буквы кружат по маленьким орбитам
      L.forEach((ch, i) => { const a = tt * 1.3 + i * 0.45; ch.style.translate = `${(Math.cos(a) * 3.5).toFixed(1)}px ${(Math.sin(a) * 3.5).toFixed(1)}px`; });
    } else if (h.mood === 'fight') {
      // две половины сходятся, дерутся и разлетаются
      const c = (tt % 6), half = h.words.length > 1 ? null : Math.floor(n / 2);
      const leftSide = ch => half == null ? h.words.indexOf(ch.closest('.wd')) < h.words.length / 2 : L.indexOf(ch) < half;
      let go = 0, jitter = 0;
      if (c < 2) go = 0;
      else if (c < 2.4) go = ease((c - 2) / 0.4);
      else if (c < 3.5) { go = 1; jitter = 1; }
      else if (c < 3.8) go = 1 - ease((c - 3.5) / 0.3) * 1.6;
      else if (c < 4.6) go = -0.6 * (1 - ease((c - 3.8) / 0.8));
      L.forEach(ch => {
        const s = leftSide(ch) ? 1 : -1;
        const jx = jitter ? (Math.random() - 0.5) * 6 : 0, jy = jitter ? (Math.random() - 0.5) * 6 : 0;
        ch.style.translate = `${(s * go * 12 + jx).toFixed(1)}px ${jy.toFixed(1)}px`;
        ch.style.rotate = jitter ? `${((Math.random() - 0.5) * 24).toFixed(0)}deg` : `${(s * go * 4).toFixed(1)}deg`;
      });
    } else if (h.mood === 'smile') {
      // буквы время от времени собираются в смайлик и расходятся обратно
      const c = tt % 9;
      const p = c < 4 ? 0 : c < 5 ? ease(c - 4) : c < 6.8 ? 1 : c < 7.8 ? 1 - ease(c - 6.8) : 0;
      if (p === 0) { L.forEach(ch => { ch.style.translate = ''; ch.style.rotate = ''; }); h.centers = null; return; }
      if (!h.centers) h.centers = L.map(ch => { const r = ch.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      const cx = h.centers.reduce((s, c) => s + c[0], 0) / n, cy = h.centers.reduce((s, c) => s + c[1], 0) / n;
      const R = Math.min(150, Math.max(40, n * 7));   // чем больше букв, тем шире улыбка, чтобы они не слипались
      L.forEach((ch, i) => {
        let tx, ty;
        if (i < 2) { tx = cx + (i ? 1 : -1) * R * 0.42; ty = cy - R * 0.45; }       // глаза
        else { const a = Math.PI * (0.15 + 0.7 * (i - 2) / Math.max(1, n - 3)); tx = cx + Math.cos(a) * R; ty = cy + Math.sin(a) * R * 0.55; }   // улыбка
        const wob = p === 1 ? Math.sin(tt * 6 + i) * 1.5 : 0;
        ch.style.translate = `${((tx - h.centers[i][0]) * p).toFixed(1)}px ${((ty - h.centers[i][1]) * p + wob).toFixed(1)}px`;
        ch.style.rotate = `${(p * (i < 2 ? 0 : (i - n / 2) * 4)).toFixed(1)}deg`;
      });
    }
  });
}


/* ================================================================
   3. МНОГОНОЖКА
   Голова ведет, тело повторяет ее путь (след хранится в координатах
   страницы, поэтому на кейсе многоножка едет вместе с прокруткой).
   ================================================================ */
const C = FUN.centipede;
const cv = document.createElement('canvas');
cv.className = 'centipede'; cv.setAttribute('aria-hidden', 'true');
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
let W = 0, H = 0, L = 0;

function sizeCanvas(){
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = C.corner, a = W - 2 * C.inset - 2 * R, b = H - 2 * C.inset - 2 * R;
  L = 2 * a + 2 * b + 2 * Math.PI * R;
}
/* точка на дорожке-рамке по пройденному пути s (в координатах окна) */
function at(s){
  const R = C.corner, i = C.inset, a = W - 2 * i - 2 * R, b = H - 2 * i - 2 * R, q = Math.PI * R / 2;
  s = ((s % L) + L) % L;
  const arc = (cx, cy, from, k) => { const ang = from + k / R; return [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R]; };
  if (s < a) return [i + R + s, i];                         s -= a;
  if (s < q) return arc(W - i - R, i + R, -Math.PI / 2, s); s -= q;
  if (s < b) return [W - i, i + R + s];                     s -= b;
  if (s < q) return arc(W - i - R, H - i - R, 0, s);        s -= q;
  if (s < a) return [W - i - R - s, H - i];                 s -= a;
  if (s < q) return arc(i + R, H - i - R, Math.PI / 2, s);  s -= q;
  if (s < b) return [i, H - i - R - s];                     s -= b;
  return arc(i + R, i + R, Math.PI, s);
}
/* путь по нижнему краю рамки для точки x — чтобы вернуться на рамку после падения */
function bottomS(x){
  const R = C.corner, i = C.inset, a = W - 2 * i - 2 * R, b = H - 2 * i - 2 * R, q = Math.PI * R / 2;
  return a + q + b + q + Math.min(a, Math.max(0, W - i - R - x));
}

const bug = {
  mode: 'frame', s: 0, dir: 1, speed: C.speed, x: 0, y: 0, vy: 0,
  card: null, cardDir: 1, pauseUntil: 0, nextVisit: 0, scheme: 0, clicks: 0, trail: [], t: 0,
};
function resetTrail(){
  bug.trail = [];
  for (let k = 0; k < (C.segments + 2) * C.spacing; k += 3) {
    const [x, y] = at(bug.s - bug.dir * k);
    bug.trail.push([x, y + scrollY]);
  }
  [bug.x, bug.y] = bug.trail[0];
}
let lastScroll = scrollY;
function pushHead(){
  const [hx, hy] = bug.trail[0];
  if (Math.hypot(bug.x - hx, bug.y - hy) >= 1.5) {
    bug.trail.unshift([bug.x, bug.y]);
    const max = Math.ceil((C.segments + 3) * C.spacing / 1.5) + 20;
    if (bug.trail.length > max) bug.trail.length = max;
  }
}
/* точка тела на расстоянии d от головы вдоль следа */
function sample(d){
  const tr = bug.trail;
  let acc = 0;
  for (let i = 0; i < tr.length - 1; i++) {
    const [x1, y1] = tr[i], [x2, y2] = tr[i + 1];
    const seg = Math.hypot(x2 - x1, y2 - y1);
    if (acc + seg >= d) { const f = seg ? (d - acc) / seg : 0; return [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f]; }
    acc += seg;
  }
  return tr[tr.length - 1];
}

/* кейсы, на которые можно спрыгнуть: верхний край превью в координатах страницы */
function cards(){
  return [...document.querySelectorAll('.work .media, .nda-media')].map(el => {
    const r = el.getBoundingClientRect();
    return { el, left: r.left + 12, right: r.right - 12, top: r.top + scrollY, vtop: r.top };
  }).filter(c => c.right - c.left > 80);
}
const STAND = () => C.size * 1.1;   // насколько тело выше края, на котором стоит

function updateBug(dt, now){
  // прокрутка: на рамке многоножка остается на месте экрана, на кейсе — едет со страницей
  const ds = scrollY - lastScroll; lastScroll = scrollY;
  if (bug.mode === 'frame' && ds) bug.trail.forEach(p => p[1] += ds);

  bug.speed += (C.speed - bug.speed) * 0.02;
  const moving = now > bug.pauseUntil;
  bug.t += dt * (moving ? bug.speed / C.speed : 0.25);
  const headScreenY = bug.y - scrollY;
  // курсор у головы — один резкий разворот; следующий только после того, как курсор отойдет
  const cursorDist = Math.hypot(bug.x - px, headScreenY - py);
  if (cursorDist > 160) bug.dodged = false;
  const scared = cursorDist < 80 && !bug.dodged;
  if (scared) bug.dodged = true;

  if (bug.mode === 'frame') {
    if (scared) { bug.dir = -bug.dir; bug.speed = C.speed * 3.5; }
    if (moving) bug.s += bug.dir * bug.speed * dt;
    const [x, y] = at(bug.s); bug.x = x; bug.y = y + scrollY;
    // пора прогуляться по кейсам
    if (now > bug.nextVisit) {
      bug.nextVisit = now + rand(...C.visitEvery) * 1000;
      const near = cards().filter(c => c.vtop > 120 && c.vtop < H - 200);
      if (near.length) {
        const c = near.reduce((a, b) => (Math.hypot(a.left - bug.x, a.top - bug.y) < Math.hypot(b.left - bug.x, b.top - bug.y) ? a : b));
        const fromLeft = Math.abs(bug.x - c.left) < Math.abs(bug.x - c.right);
        bug.card = c; bug.cardDir = fromLeft ? 1 : -1;
        bug.mode = 'walk'; bug.tx = fromLeft ? c.left : c.right; bug.ty = c.top - STAND();
      }
    }
  } else if (bug.mode === 'walk') {
    // идет с рамки к краю кейса
    const dx = bug.tx - bug.x, dy = bug.ty - bug.y, d = Math.hypot(dx, dy), step = bug.speed * 1.4 * dt;
    if (d <= step) { bug.x = bug.tx; bug.y = bug.ty; bug.mode = 'edge'; bug.pauseUntil = now + 900; }
    else { bug.x += dx / d * step; bug.y += dy / d * step; }
  } else if (bug.mode === 'edge') {
    // ползет по верхнему краю превью
    const c = bug.card, r = c.el.getBoundingClientRect();
    c.left = r.left + 12; c.right = r.right - 12; c.top = r.top + scrollY;
    if (scared) { bug.cardDir = -bug.cardDir; bug.speed = C.speed * 3; }
    if (moving) bug.x += bug.cardDir * bug.speed * dt;
    bug.y = c.top - STAND();
    if (bug.x > c.right || bug.x < c.left) { bug.x = Math.min(c.right + 14, Math.max(c.left - 14, bug.x)); bug.mode = 'fall'; bug.vy = 0; }
  } else if (bug.mode === 'fall') {
    // падает вниз, как фигура в тетрисе, и цепляется за следующий кейс
    const prevY = bug.y;
    bug.vy = Math.min(900, bug.vy + 1400 * dt);
    bug.y += bug.vy * dt;
    const land = cards().find(c => bug.x > c.left - 6 && bug.x < c.right + 6 && prevY <= c.top - STAND() && bug.y >= c.top - STAND());
    if (land) {
      bug.card = land; bug.y = land.top - STAND(); bug.mode = 'edge'; bug.pauseUntil = now + 600;
      bug.cardDir = (bug.x - land.left) < (land.right - bug.x) ? 1 : -1;
    } else if (bug.y - scrollY >= H - C.inset) {
      bug.mode = 'frame'; bug.s = bottomS(bug.x); bug.dir = Math.random() < 0.5 ? 1 : -1;
      bug.x = at(bug.s)[0]; bug.y = H - C.inset + scrollY;
    }
  }
  if (bug.mode === 'frame' && now > bug.pauseUntil + 9000 && Math.random() < dt * 0.06) bug.pauseUntil = now + 1200;   // иногда осматривается
  pushHead();
}

/* Рисуем многоножку: сегменты-капсулы, тонкие ножки с круглыми ступнями,
   на хвостовой паре — маленькие сапожки, голова с глазками и усиками */
function drawBug(){
  const sc = C.colors[bug.scheme % C.colors.length], n = C.segments, sz = C.size, oy = -scrollY;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pts = [];
  for (let k = 0; k < n; k++) {
    const d = k * C.spacing;
    const [x, y] = sample(d), [xa, ya] = sample(Math.max(0, d - 3)), [xb, yb] = sample(d + 3);
    let tx = xa - xb, ty = ya - yb; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    pts.push({ x, y: y + oy, tx, ty, nx: -ty, ny: tx });
  }
  // ножки: тонкие, с коленцем, шагают волной
  for (let k = 1; k < n; k++) {
    const p = pts[k], booted = k === n - 1;
    for (const side of [-1, 1]) {
      const step = Math.sin(bug.t * 10 - k * 0.7 + (side > 0 ? 0 : Math.PI));
      const bx = p.x + p.nx * side * sz * 0.7, by = p.y + p.ny * side * sz * 0.7;
      const kx = bx + p.nx * side * sz * 0.8 + p.tx * step * sz * 0.3, ky = by + p.ny * side * sz * 0.8 + p.ty * step * sz * 0.3;
      const fx = kx + p.nx * side * sz * 0.5 + p.tx * (step * 0.6 - 0.3) * sz, fy = ky + p.ny * side * sz * 0.5 + p.ty * (step * 0.6 - 0.3) * sz;
      ctx.strokeStyle = sc.legs; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      if (booted) {
        ctx.fillStyle = sc.boots;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.atan2(p.ty, p.tx));
        ctx.beginPath(); ctx.ellipse(1.2, 0, 3, 2.1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = sc.legs; ctx.beginPath(); ctx.arc(fx, fy, 1.3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // тело
  for (let k = n - 1; k >= 1; k--) {
    const p = pts[k], w = sz * (1 - Math.max(0, k - n * 0.7) / n * 0.9);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.ty, p.tx));
    ctx.fillStyle = sc.body[k % sc.body.length];
    ctx.beginPath(); ctx.ellipse(0, 0, C.spacing * 0.6, w, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // голова
  const h = pts[0], R = sz * 1.2, ang = Math.atan2(h.ty, h.tx);
  ctx.strokeStyle = sc.legs; ctx.lineWidth = 1.4;
  for (const side of [-1, 1]) {
    const a = side * (0.5 + Math.sin(bug.t * 4 + side) * 0.2);
    const dx = h.tx * Math.cos(a) + h.nx * Math.sin(a), dy = h.ty * Math.cos(a) + h.ny * Math.sin(a);
    ctx.beginPath(); ctx.moveTo(h.x + dx * R * 0.6, h.y + dy * R * 0.6);
    ctx.quadraticCurveTo(h.x + h.tx * R * 1.8 + h.nx * side * R * 0.3, h.y + h.ty * R * 1.8 + h.ny * side * R * 0.3, h.x + dx * R * 2.4, h.y + dy * R * 2.4);
    ctx.stroke();
  }
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ang);
  ctx.fillStyle = sc.head; ctx.beginPath(); ctx.ellipse(0, 0, R * 1.05, R, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1D222A';
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(R * 0.45, side * R * 0.45, R * 0.17, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

/* клик по многоножке: первый — перекрашивается, второй — убегает */
addEventListener('click', e => {
  if (!on) return;
  for (let k = 0; k < C.segments; k++) {
    const [x, y] = sample(k * C.spacing);
    if (Math.hypot(x - e.clientX, y - scrollY - e.clientY) < 18) {
      bug.clicks++;
      if (bug.clicks % 2) { bug.scheme++; joke('bug'); }
      else {
        joke('bugRun');
        if (bug.mode === 'frame') { bug.dir = -bug.dir; bug.speed = C.speed * 5; }
        else if (bug.mode === 'edge') { bug.mode = 'fall'; bug.vy = 0; }
      }
      return;
    }
  }
});


/* ================================================================
   5. ГИТАРНЫЕ СТРУНЫ: ноты в кружках и звук
   ================================================================ */
let ac = null, hinted = false;
const buffers = {};
/* браузер разрешает звук только после действия человека — заводим его на любом клике,
   в том числе на клике по переключателю, которым включают эту версию */
['pointerdown', 'click', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state !== 'running') ac.resume(); } catch (e) {}
}, { passive: true }));
/* звук струны по алгоритму Карплуса — Стронга: шум в кольце, который затухает */
function stringBuffer(freq){
  const sr = ac.sampleRate, len = Math.floor(sr * 2.4), buf = ac.createBuffer(1, len, sr), out = buf.getChannelData(0);
  const N = Math.round(sr / freq), ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const a = ring[idx], b = ring[(idx + 1) % N];
    out[i] = a; ring[idx] = (a + b) * 0.5 * 0.998; idx = (idx + 1) % N;
  }
  return buf;
}
const lastPluck = {};
addEventListener('string:pluck', e => {
  if (!on) return;
  const { k, power } = e.detail, freq = FUN.guitar.freqs[k];
  if (!freq) return;
  if (!ac || ac.state !== 'running') { if (!hinted) { hinted = true; joke('sound'); } return; }
  const now = performance.now();
  if (now - (lastPluck[k] || 0) < 90) return;
  lastPluck[k] = now;
  const src = ac.createBufferSource(), gain = ac.createGain(), tone = ac.createBiquadFilter();
  src.buffer = buffers[freq] || (buffers[freq] = stringBuffer(freq));
  tone.type = 'lowpass'; tone.frequency.value = 4500 + power * 3000;
  gain.gain.value = FUN.guitar.volume * power;
  src.connect(tone).connect(gain).connect(ac.destination);
  src.start();
});
function addNotes(){
  document.querySelectorAll('#dirList .dir .go').forEach((go, k) => {
    if (go.querySelector('.note')) return;
    const n = document.createElement('span');
    n.className = 'note'; n.textContent = FUN.guitar.notes[k] || '';
    go.appendChild(n);
  });
}


/* ================================================================
   6. НЛО-ВОРИШКА
   Летает по всей странице, зависает над тем, что видно на экране,
   и затягивает это лучом. Унеся несколько вещей, улетает
   и роняет всё обратно, а потом возвращается.
   ================================================================ */
const STEAL = '.h2 .wd, .work h3, .work .tag, .nda-item h3, .nda-item .tag, .dir .go, .client, .fact span:last-child, .sec-note, .pod-play, .about .big, .ttt-rules';
const ufo = { el: null, beam: null, x: -200, y: 120, loot: [], state: 'fly', until: 0, target: null, back: 0 };
const UFO_HTML = `
<svg viewBox="0 0 120 60" width="120" height="60">
  <circle cx="60" cy="26" r="17" fill="#ECE9FC"/>
  <circle cx="54" cy="21" r="4" fill="#FFFFFF"/>
  <ellipse cx="60" cy="36" rx="54" ry="12" fill="#F4F4F6"/>
  <rect x="10" y="33" width="100" height="6" rx="3" fill="#E2FB5A"/>
  <g class="ufo-lights">${[22, 38, 54, 70, 86].map((x, i) => `<circle cx="${x + 6}" cy="45" r="3.2" fill="#1D222A" style="--i:${i}"/>`).join('')}</g>
</svg>`;
function setupUfo(){
  ufo.el?.remove(); ufo.beam?.remove(); ufo.el = ufo.beam = null;
  giveBack(true);
  if (!on) return;
  ufo.beam = document.createElement('div'); ufo.beam.className = 'ufo-beam';
  ufo.el = document.createElement('div'); ufo.el.className = 'ufo'; ufo.el.innerHTML = UFO_HTML;
  ufo.el.setAttribute('role', 'img'); ufo.el.setAttribute('aria-label', 'НЛО');
  document.body.append(ufo.beam, ufo.el);
  ufo.el.addEventListener('click', () => { joke('ufo'); ufo.state = 'leave'; });
  ufo.state = 'wait'; ufo.until = performance.now() + rand(6000, 10000);
}
/* что можно украсть: видно на экране, не в шапке, еще не украдено */
function pickTarget(){
  const list = [...document.querySelectorAll(STEAL)].filter(el => {
    if (ufo.loot.some(l => l.el === el) || el.closest('.case, #hero')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 12 && r.top > 140 && r.bottom < innerHeight - 90;
  });
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}
/* затянуть элемент в тарелку */
function steal(el){
  const r = el.getBoundingClientRect(), mx = ufo.x + 60, my = ufo.y + 40;
  const anim = el.animate([
    { translate: '0 0', scale: '1', opacity: 1 },
    { translate: `${(mx - r.left - r.width / 2) * 0.35}px ${(my - r.top - r.height / 2) * 0.45}px`, scale: '0.7', opacity: 1, offset: 0.5 },
    { translate: `${mx - r.left - r.width / 2}px ${my - r.top - r.height / 2}px`, scale: '0.08', opacity: 0 },
  ], { duration: 1100, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' });
  ufo.loot.push({ el, anim });
}
/* вернуть всё украденное: оно падает обратно на место */
function giveBack(now){
  ufo.loot.forEach(({ anim }) => { if (now) { anim.cancel(); return; } try { anim.reverse(); anim.onfinish = () => anim.cancel(); } catch (e) { anim.cancel(); } });
  ufo.loot = [];
}
function updateUfo(dt, now){
  if (!ufo.el) return;
  const hidden = document.body.classList.contains('locked');
  ufo.el.style.visibility = ufo.beam.style.visibility = hidden ? 'hidden' : '';
  if (hidden) return;
  let tx = ufo.x, ty = ufo.y, k = 0.03;
  // вернулись на первый экран — НЛО улетает: оно живет только со второго блока
  if (ufo.state !== 'wait' && ufo.state !== 'leave' && scrollY < innerHeight * 0.8) ufo.state = 'leave';
  if (ufo.state === 'wait') {
    tx = -260; ty = 120;
    if (now > ufo.until && scrollY > innerHeight * 0.8) { ufo.state = 'fly';   // на первом экране НЛО не появляется
      ufo.target = pickTarget(); ufo.x = Math.random() < 0.5 ? -200 : innerWidth + 80; ufo.y = rand(90, 200); }
  } else if (ufo.state === 'leave') {
    tx = ufo.x > innerWidth / 2 ? innerWidth + 300 : -300; ty = -140; k = 0.05;
    if (ufo.x < -240 || ufo.x > innerWidth + 240) { giveBack(); ufo.state = 'wait'; ufo.until = now + rand(25000, 40000); }
  } else {
    const t = ufo.target;
    const r = t && t.getBoundingClientRect();
    if (!t || r.bottom < 100 || r.top > innerHeight) { ufo.target = pickTarget(); if (!ufo.target) { tx = innerWidth / 2 - 60; ty = 110; } }
    else { tx = r.left + r.width / 2 - 60; ty = Math.max(70, r.top - 130); }
    const close = Math.hypot(tx - ufo.x, ty - ufo.y) < 8;
    if (ufo.state === 'fly' && close && ufo.target) { ufo.state = 'beam'; ufo.until = now + 500; }
    else if (ufo.state === 'beam' && now > ufo.until) {
      if (!ufo.target) { ufo.state = 'fly'; }   // цель уехала с экрана — ищем новую
      else { steal(ufo.target); ufo.state = 'hold'; ufo.until = now + 1100 + FUN.ufo.hover; }
    }
    else if (ufo.state === 'hold' && now > ufo.until) {
      if (ufo.loot.length >= FUN.ufo.visits) ufo.state = 'leave';
      else { ufo.target = pickTarget(); ufo.state = 'fly'; }
    }
  }
  const vx = (tx - ufo.x) * (ufo.state === 'leave' ? k : FUN.ufo.speed);
  ufo.x += vx; ufo.y += (ty - ufo.y) * (ufo.state === 'leave' ? k : FUN.ufo.speed);
  const bob = Math.sin(now / 420) * 5;
  ufo.el.style.transform = `translate(${ufo.x.toFixed(1)}px, ${(ufo.y + bob).toFixed(1)}px) rotate(${Math.max(-14, Math.min(14, vx * 1.6)).toFixed(1)}deg)`;
  // луч от тарелки до добычи
  const beamOn = (ufo.state === 'beam' || ufo.state === 'hold') && ufo.target;
  ufo.beam.style.opacity = beamOn ? 1 : 0;
  if (beamOn) {
    const r = ufo.target.getBoundingClientRect(), top = ufo.y + bob + 44, wb = Math.min(r.width, 260) + 30;
    ufo.beam.style.transform = `translate(${(ufo.x + 60 - wb / 2).toFixed(1)}px, ${top.toFixed(1)}px)`;
    ufo.beam.style.width = wb + 'px';
    ufo.beam.style.height = Math.max(0, r.bottom + 6 - top) + 'px';
  }
}


/* ================================================================
   7. ДОЖДЬ ИЗ НАЗВАНИЙ КЕЙСОВ
   Когда проект уезжает вверх, буквы его названия осыпаются вниз.
   ================================================================ */
function stepRain(){
  document.querySelectorAll('.work h3').forEach(h => {
    const r = h.getBoundingClientRect();
    if (r.top < innerHeight * 0.22) h.classList.add('raining');
    else if (r.top > innerHeight * 0.32) h.classList.remove('raining');
  });
}


/* ================================================================
   8. ПРОТЕРЕТЬ ПРЕВЬЮ
   Превью закрыто запотевшим стеклом. Курсор стирает туман; когда
   протерто больше половины, остатки тают сами.
   ================================================================ */
const FOG = { brush: 48, clearAt: 0.55, hint: 'протри' };
let fogs = [];
/* иней: голубовато-белая наледь, морозные узоры от краев и снежинки */
function makeFog(media){
  const c = document.createElement('canvas');
  c.className = 'fog'; c.setAttribute('aria-hidden', 'true');
  media.appendChild(c);
  const r = media.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), W = r.width, H = r.height;
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const base = g.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, 'rgba(238,244,252,.97)'); base.addColorStop(.5, 'rgba(214,226,242,.94)'); base.addColorStop(1, 'rgba(236,242,250,.97)');
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  // морозные папоротники: ветвятся от краев к центру
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineCap = 'round';
  const fern = (x, y, ang, len, depth) => {
    if (depth > 3 || len < 4) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    g.lineWidth = Math.max(0.5, 2.2 - depth * 0.45);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    const n = 3;
    for (let k = 1; k <= n; k++) {
      const px = x + (x2 - x) * k / (n + 1), py = y + (y2 - y) * k / (n + 1);
      fern(px, py, ang + 0.75 + rand(-0.15, 0.15), len * 0.42, depth + 1);
      fern(px, py, ang - 0.75 + rand(-0.15, 0.15), len * 0.42, depth + 1);
    }
    fern(x2, y2, ang + rand(-0.3, 0.3), len * 0.6, depth + 1);
  };
  for (let i = 0; i < 9; i++) {
    const edge = Math.floor(Math.random() * 4), t = Math.random();
    const [x, y, a] = edge === 0 ? [t * W, 0, Math.PI / 2] : edge === 1 ? [W, t * H, Math.PI] : edge === 2 ? [t * W, H, -Math.PI / 2] : [0, t * H, 0];
    fern(x, y, a + rand(-0.5, 0.5), Math.min(W, H) * rand(0.18, 0.32), 0);
  }
  // снежинки и зерно льда
  for (let i = 0; i < W * H / 40; i++) {
    g.fillStyle = `rgba(255,255,255,${rand(0.15, 0.6)})`;
    g.beginPath(); g.arc(Math.random() * W, Math.random() * H, rand(0.4, 1.6), 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#1D222A'; g.font = '500 18px "Golos Text", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(FOG.hint, W / 2, H / 2);
  const cols = 16, rows = 10;
  const f = { media, c, g, w: W, h: H, grid: new Uint8Array(cols * rows), cols, rows, cleared: 0, last: null };
  f.onMove = e => wipe(f, e);
  f.onLeave = () => { f.last = null; };
  media.addEventListener('pointermove', f.onMove);
  media.addEventListener('pointerleave', f.onLeave);
  return f;
}
function wipe(f, e){
  if (f.done) return;
  const r = f.media.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const g = f.g;
  g.save(); g.globalCompositeOperation = 'destination-out';
  const steps = f.last ? Math.max(1, Math.ceil(Math.hypot(x - f.last[0], y - f.last[1]) / 10)) : 1;
  for (let i = 1; i <= steps; i++) {
    const bx = f.last ? f.last[0] + (x - f.last[0]) * i / steps : x, by = f.last ? f.last[1] + (y - f.last[1]) * i / steps : y;
    const grad = g.createRadialGradient(bx, by, 0, bx, by, FOG.brush);
    grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(0.6, 'rgba(0,0,0,.8)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.beginPath(); g.arc(bx, by, FOG.brush, 0, Math.PI * 2); g.fill();
    // отмечаем протертые клетки
    for (let cy = 0; cy < f.rows; cy++) for (let cx = 0; cx < f.cols; cx++) {
      const k = cy * f.cols + cx;
      if (f.grid[k]) continue;
      const gx = (cx + 0.5) * f.w / f.cols, gy = (cy + 0.5) * f.h / f.rows;
      if (Math.hypot(gx - bx, gy - by) < FOG.brush * 0.7) { f.grid[k] = 1; f.cleared++; }
    }
  }
  g.restore();
  f.last = [x, y];
  if (f.cleared / f.grid.length > FOG.clearAt) { f.done = true; f.c.classList.add('gone'); setTimeout(() => f.c.remove(), 1000); }
}
function setupFog(){
  fogs.forEach(f => { f.c.remove(); f.media.removeEventListener('pointermove', f.onMove); f.media.removeEventListener('pointerleave', f.onLeave); });
  fogs = [];
  if (!on) return;
  // иней: на кейсах с frost: true и еще на стольких, чтобы в выбранной категории
  // протирать пришлось не меньше FUN.frostShare работ (остальные берутся через одну, равномерно)
  const works = [...document.querySelectorAll('#workList .work')];
  const need = Math.ceil(works.length * FUN.frostShare);
  const chosen = new Set(works.filter(w => SITE.works.items[+w.dataset.k]?.frost));
  const step = works.length / Math.max(1, need);
  for (let i = 0; chosen.size < need && i < works.length * 2; i++) chosen.add(works[Math.floor((i * step + 1) % works.length)]);
  fogs = works.filter(w => chosen.has(w)).map(w => makeFog(w.querySelector('.media')));
}


/* ================================================================
   9. СЕКРЕТНЫЕ МАТЕРИАЛЫ: ДОСЬЕ СО СТИРАЕМОЙ СЕРЕБРЯНОЙ ПОЛОСОЙ
   Обложка — засекреченное досье: вымаранные строки и штамп.
   Посередине серебряная полоса, как на лотерейном билете: курсор
   становится монеткой, полосу можно стереть. Под ней — шутка.
   ================================================================ */
const SECRET = { clearAt: 0.6 };   // тексты — в content.js, раздел secret
let secrets = [];
function makeSecret(media, k){
  const T = SITE.secret, prank = T.pranks[Math.min(k, T.pranks.length - 1)];
  const d = document.createElement('div');
  d.className = 'dossier'; d.setAttribute('aria-hidden', 'true');
  // вымаранные строки: черные плашки разной длины
  let lines = '';
  for (let i = 0; i < 4; i++) lines += `<i style="width:${Math.round(rand(35, 92))}%"></i>`;
  d.innerHTML = `<span class="dossier-lines">${lines}</span><b class="stamp">${T.stamp}</b><span class="prank">${prank}</span><canvas class="silver"></canvas>`;
  media.appendChild(d);
  const c = d.querySelector('.silver'), r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  // серебро: металлический перелив, искорки и подпись
  const grad = g.createLinearGradient(0, 0, r.width, r.height);
  grad.addColorStop(0, '#AEB4BE'); grad.addColorStop(0.35, '#EEF1F5'); grad.addColorStop(0.55, '#C3C8D0'); grad.addColorStop(0.8, '#F4F6F9'); grad.addColorStop(1, '#A4AAB4');
  g.fillStyle = grad; g.fillRect(0, 0, r.width, r.height);
  for (let i = 0; i < r.width * r.height / 18; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(90,97,110,.18)';
    g.fillRect(Math.random() * r.width, Math.random() * r.height, 1, 1);
  }
  g.fillStyle = '#5A616E'; g.font = '500 16px "Golos Text", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(T.label, r.width / 2, r.height / 2);
  const cols = 14, rows = 5;
  const f = { d, c, g, w: r.width, h: r.height, grid: new Uint8Array(cols * rows), cols, rows, cleared: 0, last: null };
  f.onMove = e => scratch(f, e);
  f.onLeave = () => { f.last = null; };
  c.addEventListener('pointermove', f.onMove);
  c.addEventListener('pointerleave', f.onLeave);
  return f;
}
function scratch(f, e){
  if (f.done) return;
  const r = f.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, g = f.g;
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  const steps = f.last ? Math.max(1, Math.ceil(Math.hypot(x - f.last[0], y - f.last[1]) / 4)) : 1;
  for (let i = 1; i <= steps; i++) {
    const bx = f.last ? f.last[0] + (x - f.last[0]) * i / steps : x, by = f.last ? f.last[1] + (y - f.last[1]) * i / steps : y;
    // монетка царапает неровно: несколько мелких пятнышек вокруг точки
    for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(bx + rand(-6, 6), by + rand(-6, 6), rand(5, 10), 0, Math.PI * 2); g.fill(); }
    for (let cy = 0; cy < f.rows; cy++) for (let cx = 0; cx < f.cols; cx++) {
      const k = cy * f.cols + cx;
      if (f.grid[k]) continue;
      if (Math.hypot((cx + 0.5) * f.w / f.cols - bx, (cy + 0.5) * f.h / f.rows - by) < 12) { f.grid[k] = 1; f.cleared++; }
    }
  }
  g.restore();
  f.last = [x, y];
  if (f.cleared / f.grid.length > SECRET.clearAt) { f.done = true; f.c.classList.add('gone'); }
}
function setupSecrets(){
  secrets.forEach(f => f.d.remove());
  secrets = [];
  if (!on) return;
  secrets = [...document.querySelectorAll('#ndaList .nda-media')].map((m, k) => makeSecret(m, k));
}


/* ================================================================
   10. ЦВЕТНЫЕ ВСПЫШКИ ПРИ ПРОКРУТКЕ
   Пока страницу листают, на фоне мягко вспыхивают и гаснут пятна света.
   ================================================================ */
// фон из текучих волн (waves.js) на весь экран: разгорается, пока листают, и тает, когда остановились
const GLOW = { colors: '#1B1240,#3B2A9E,#16706B,#4A2380', max: 0.55, gain: 0.004, fade: 0.97 };
const glowLayer = document.createElement('div');
glowLayer.className = 'glows'; glowLayer.setAttribute('aria-hidden', 'true');
glowLayer.dataset.waves = ''; glowLayer.dataset.colors = GLOW.colors; glowLayer.dataset.speed = '1.6';
document.body.prepend(glowLayer);
let glowScroll = scrollY, glowEnergy = 0;
addEventListener('scroll', () => {
  const d = Math.abs(scrollY - glowScroll); glowScroll = scrollY;
  if (!on || scrollY < innerHeight * 0.6) return;   // на первом экране своих переливов хватает
  glowEnergy = Math.min(GLOW.max, glowEnergy + d * GLOW.gain);
}, { passive: true });
function stepGlow(){
  glowEnergy *= GLOW.fade;
  glowLayer.style.opacity = on ? glowEnergy.toFixed(3) : 0;
}


/* ================================================================
   ОБЩИЙ ЦИКЛ И ВКЛЮЧЕНИЕ
   ================================================================ */
let prev = performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  if (!on) return;
  stepRunners(dt, now);
  stepHeadings(now);
  stepRain();
  updateBug(dt, now);
  ctx.clearRect(0, 0, W, H);
  drawBug();
  updateUfo(dt, now);
  stepGlow();
}
function clearAll(){
  heads.forEach(h => h.letters.forEach(ch => { ch.style.translate = ''; ch.style.rotate = ''; }));
  document.querySelectorAll('.work h3.raining').forEach(h => h.classList.remove('raining'));
}
function refresh(){
  const was = on;
  on = isActive();
  root.classList.toggle('fun-on', on);
  sizeCanvas();
  if (!on) { ctx.clearRect(0, 0, W, H); clearAll(); }
  if (on && !was) { bug.nextVisit = performance.now() + rand(4, 8) * 1000; lastScroll = scrollY; resetTrail(); }
  setupRunners();
  setupHeadings();
  if (on) addNotes();
  setupUfo();
  setupFog();
  setupSecrets();
}
addEventListener('theme:apply', refresh);   // сменили версию — убираем или включаем всё сразу, до снимка шторки
new MutationObserver(() => setTimeout(refresh, 60)).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
desktop.addEventListener('change', refresh);
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { sizeCanvas(); if (bug.mode === 'frame') resetTrail(); setupRunners(); setupFog(); setupSecrets(); }, 200); });
// места становится больше-меньше по мере появления блоков — пересчитываем
setInterval(() => { if (on) runners.forEach(freeRange); }, 2000);
addEventListener('works:rendered', () => { if (on) { setupFog(); setupRunners(); } });   // сменили фильтр проектов
setTimeout(refresh, 400);
requestAnimationFrame(frame);
})();
