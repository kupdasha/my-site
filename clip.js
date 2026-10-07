/* ================================================================
   КЕЙС «МУЗЫКАЛЬНЫЙ КЛИП» (поле clip у проекта)
   Песня и клип, сделанные нейросетями. Главы: история по ступеням
   лестницы (кадр меняется с прокруткой), голос с диктофона
   раскладывается на дорожки, 120 фотографий собираются в одно лицо,
   раскадровка по моделям, клип в одну цветную полоску, звонок
   из грядущего дня. Тексты и картинки — в content.js, оформление —
   clip.css. Волны и цвета посчитаны по настоящим файлам песни и клипа.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

// версия для ?v=: на сайте меняется раз в час, на локальном превью — при каждой загрузке
const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
// прогресс блока при прокрутке: 0 — только показался снизу, 1 — ушел вверх
const progress = el => {
  const r = el.getBoundingClientRect(), vh = innerHeight;
  return clamp((vh - r.top) / (vh + r.height), 0, 1);
};
// подписка на прокрутку кейса (он листается внутри своего окна) и окна
function onScroll(box, cb){
  let raf = 0, seen = false;
  const sc = box.closest('.case') || window;
  const req = () => { if (seen && !raf) raf = requestAnimationFrame(() => { raf = 0; cb(); }); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  onScreen(box, v => { seen = v; req(); }, '200px 0px');
}
const zoom = (list, el) => {
  const imgs = list.map(b => b.querySelector('img'));
  H.openViewer(imgs.map(i => i.currentSrc || i.src), list.indexOf(el), imgs);
};
const time = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const head = ch => `<div class="cl-head">
  <span class="case-label cl-label">${H.T(ch.label)}</span>
  <h2 class="cl-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="cl-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const cap = t => t ? `<p class="cl-cap">${H.T(t)}</p>` : '';

/* ---------- данные песни и клипа ---------- */
// громкость дорожек песни «Звонок из грядущего дня»: 140 точек на 2:46, каждая дорожка от 0 до 100
// (посчитано по wav-файлам: голос, бэк-вокал, барабаны, бас, клавиши, перкуссия, синтезатор)
const WAVES = [
  [43,51,44,48,57,48,39,39,31,45,58,64,80,60,80,72,95,78,78,70,71,100,88,78,90,72,59,70,74,55,82,80,84,53,75,60,73,65,73,66,62,73,66,67,66,80,54,51,52,42,49,50,52,48,42,50,79,77,66,56,85,80,72,72,64,68,50,62,93,72,75,77,86,81,57,81,74,54,78,35,67,61,70,62,72,72,57,69,74,71,68,69,32,42,44,32,47,54,43,44,50,41,66,78,75,70,77,83,72,70,79,94,84,96,67,31,36,62,5,12,63,41,48,53,52,63,38,38,49,50,42,37,13,41,60,27,51,57,2,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,5,8,2,5,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,10,0,98,49,0,0,0,0,0,0,33,63,1,0,0,0,0,0,0,0,0,8,19,26,28,10,6,12,11,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,21,1,0],
  [0,0,0,0,0,3,0,7,4,1,4,6,56,53,57,40,43,57,50,58,55,35,45,50,74,47,41,21,40,41,17,10,14,11,53,51,54,68,57,63,59,48,52,59,67,38,60,100,66,80,58,61,61,55,44,73,66,38,36,40,40,17,31,41,27,38,41,28,56,27,52,66,64,49,59,31,22,20,9,16,67,58,60,81,64,66,57,54,54,59,34,50,69,71,52,71,66,83,70,45,41,59,56,49,0,0,0,0,0,0,0,0,0,0,26,32,28,33,42,31,28,44,16,1,0,0,71,70,68,93,73,84,77,73,59,93,65,53,49,5],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,65,73,28,51,36,0,0,0,0,56,56,53,68,60,52,56,60,10,49,52,32,60,72,83,82,53,61,71,64,68,66,42,32,22,18,15,20,12,29,19,10,18,9,0,38,15,38,24,16,14,2,0,0,0,0,31,43,40,33,55,47,56,62,11,21,0,1,78,70,62,78,65,73,64,65,61,81,57,35,0,0,0,0,0,27,30,31,37,35,22,0,0,0,0,0,0,0,0,0,0,0,69,84,83,66,100,82,97,99,92,85,83,38,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,47,79,54,90,79,26,76,70,31,100,62,38,57,60,50,67,54,52,66,55,81,94,18,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,17,9,16,14,18,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,0,0,0,0,0,0,0,0,72,0,100,63,15,49,42,41,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [84,61,62,79,75,80,81,71,85,80,60,66,46,2,56,62,0,30,33,0,51,40,67,100,56,79,71,30,48,35,40,50,30,34,32,31,52,35,34,40,45,33,40,32,30,40,36,48,35,40,37,30,31,40,38,33,30,58,56,48,66,62,60,77,79,42,57,51,28,70,21,47,64,53,54,60,38,37,17,4,63,41,57,42,43,33,41,48,23,30,28,26,69,59,50,55,42,48,51,47,31,31,33,17,7,7,7,7,8,31,26,21,22,14,10,31,16,22,33,39,35,19,21,14,17,21,31,44,32,27,34,35,37,35,33,31,21,0,0,1]
];
// средний цвет каждой секунды клипа (166 секунд), насыщенность чуть усилена, чтобы полоска читалась
const BAR = '3a3a3a 444444 535353 484848 3a3a3a 444444 474747 5b5b5b 363636 684f3d 654c3e 634b3d 525259 525058 6d6666 685d5c 8c836a 8d866d 83806a 8b8b8b 727272 9a9a9a 919191 8b8b8b 977548 737373 747474 626262 5b4722 65533a 6a5f51 444032 87776e 595442 5b5444 5b5341 978e8c 857368 87776c 908a85 686656 6a6653 968773 8c8c8c a3a3a3 5f5f5f 4f4f4f 505050 686868 6e6e6e 765e3c 745e3c 3e3e3e 4a4a4a 5c5c5c 474747 656565 474747 525252 484848 444444 4e4e4e 5b5b5b 4f4f4f 414141 505050 555555 505050 606060 777777 7c5d48 948078 94837e 716c5f ab7550 a9734d 565244 595647 665641 878273 8d897a 979386 7c7969 746962 706965 525252 535353 3b7179 4d7a7e 7b866d 806a50 7d654a 766743 1a1d1d 534941 545454 5a5a5a 585858 4c4c4c 505050 434343 505050 aea9a1 547a74 6f625e 6f615c 88684d a18c7b a18979 936a4d c08457 936242 2e578a 887a76 ac7454 b87c50 ac7b56 504e5c 464f6a 3f5173 365178 2c4e7d 264d80 817c6e 5e5e5e 616161 434550 1e334b 261614 261614 3f2926 402d2d 2e2525 322726 3f2d27 412f2a 52382e 3f434a 654e45 61443d 60433d 72765e 747760 8c8c70 8d8d72 8d8d72 585858 5b5b5b 525252 616161 8e795f 887255 352f2e 36312f 756e69 928878 b8b6ab 484143 6c5e61 3b2c1e 34271d 77596a 555555 3a3a3a 010101 010101'.split(' ');
// цвета дорожек: голос — цветом текста, остальные — свои, без оранжевого
const STEM = ['var(--ink)', '#7B8CFF', '#2FA36B', '#2F6BFF', '#A46BFF', '#E0559A', '#17A9BD'];
// цвета моделей в раскадровке
const MODEL = ['#2F6BFF', '#2FA36B', '#A46BFF', '#E0559A', '#17A9BD'];

/* ---------- история: ступени лестницы, кадр меняется с прокруткой ---------- */
function worldsHTML(c){
  return `<div class="cl-worlds" style="--n:${c.items.length}">
    <div class="cl-w-pin">
      <div class="cl-w-left">
        <div class="cl-w-frame">${c.items.map((x, i) =>
          `<img src="${x.img}" alt="" draggable="false"${i ? ' loading="lazy"' : ' class="on"'}>`).join('')}</div>
        <div class="cl-w-texts">${c.items.map((x, i) =>
          `<p class="cl-w-text${i ? '' : ' on'}"><b>${H.T(x.name)}</b> ${H.T(x.text)}</p>`).join('')}</div>
      </div>
      <ol class="cl-steps" aria-hidden="true">${c.items.map((x, i) =>
        `<li style="--i:${i};--sw:#${BAR[Math.min(BAR.length - 1, x.t)]}"${i ? '' : ' class="on"'}><i></i><span>${H.T(x.name)}</span></li>`).join('')}</ol>
    </div>
  </div>${cap(c.hint)}`;
}
function liveWorlds(box){
  const pin = box.querySelector('.cl-w-pin');
  const imgs = [...box.querySelectorAll('.cl-w-frame img')];
  const texts = [...box.querySelectorAll('.cl-w-text')];
  const steps = [...box.querySelectorAll('.cl-steps li')];
  const n = imgs.length;
  let cur = 0;
  const show = k => {
    if (k === cur) return; cur = k;
    [imgs, texts, steps].forEach(list => list.forEach((el, i) => el.classList.toggle('on', i === k)));
    steps.forEach((el, i) => el.classList.toggle('past', i < k));
  };
  // ступень — по тому, сколько пролистано, пока кадр приколот
  const upd = () => {
    const r = box.getBoundingClientRect(), top = parseFloat(getComputedStyle(pin).top) || 0;
    const travel = Math.max(1, r.height - pin.offsetHeight);
    const p = clamp((top - r.top) / travel, 0, .9999);
    show(Math.floor(p * n));
  };
  // нажатие на ступень — прокрутка к ней
  steps.forEach((li, i) => li.addEventListener('click', () => {
    const sc = box.closest('.case'), r = box.getBoundingClientRect();
    const travel = r.height - pin.offsetHeight, top = parseFloat(getComputedStyle(pin).top) || 0;
    const dy = r.top - top + travel * (i + .5) / n;
    (sc || window).scrollBy({ top: dy, behavior: still() ? 'auto' : 'smooth' });
  }));
  upd();
  onScroll(box, upd);
}

/* ---------- голос: диктофон раскладывается на дорожки ---------- */
// огибающая звука как залитая фигура, зеркально от середины
function wavePath(v, h = 40){
  const n = v.length, mid = h / 2, k = (h / 2 - 1) / 100;
  let top = '', bot = '';
  v.forEach((a, i) => {
    const x = (i / (n - 1) * 140).toFixed(2), y = Math.max(.6, a * k);
    top += `${i ? 'L' : 'M'}${x} ${(mid - y).toFixed(2)}`;
    bot = `L${x} ${(mid + y).toFixed(2)}` + bot;
  });
  return top + bot + 'Z';
}
// голос на диктофоне: та же песня, но с шумом комнаты и неровной громкостью
const MEMO = WAVES[0].map((a, i) => clamp(a * .7 + 14 + 10 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1), 0, 100));

function voiceHTML(c){
  return `<div class="cl-voice">
    <div class="cl-memo">
      <span class="cl-v-name">${H.T(c.memo)}</span>
      <svg viewBox="0 0 140 40" preserveAspectRatio="none" aria-hidden="true"><path d="${wavePath(MEMO)}"/></svg>
    </div>
    <div class="cl-ai"><i></i><span>${H.T(c.ai)}</span><i></i></div>
    <div class="cl-stems">${c.stems.map((name, i) => `<div class="cl-stem" style="--c:${STEM[i]};--d:${i}">
      <span class="cl-v-name">${H.T(name)}</span>
      <div class="cl-s-w"><svg viewBox="0 0 140 40" preserveAspectRatio="none" aria-hidden="true"><path d="${wavePath(WAVES[i])}"/></svg></div>
    </div>`).join('')}<i class="cl-play"></i></div>
  </div>${cap(c.hint)}`;
}
function liveVoice(box){
  const stems = box.querySelector('.cl-stems'), rows = [...box.querySelectorAll('.cl-stem')];
  // наведение на дорожку — остальные притихают
  rows.forEach(r => {
    r.addEventListener('pointerenter', () => { stems.classList.add('hold'); r.classList.add('on'); });
    r.addEventListener('pointerleave', () => { stems.classList.remove('hold'); r.classList.remove('on'); });
  });
  const upd = () => {
    const p = still() ? 1 : clamp(progress(box) * 2.4 - .5, 0, 1);
    box.style.setProperty('--p', p.toFixed(3));
    box.style.setProperty('--h', Math.min(1, p * 1.5).toFixed(3));   // бегунок идет впереди первой дорожки
    // дорожки проявляются по очереди, сверху вниз
    rows.forEach((r, i) => r.style.setProperty('--q', clamp(p * 1.5 - i * .07, 0, 1).toFixed(3)));
  };
  upd();
  onScroll(box, upd);
}

/* ---------- лицо: 120 фотографий собираются в одно ---------- */
function faceHTML(c){
  const cols = 12, rows = 10;
  // разброс у каждой клетки свой, но одинаковый при каждой загрузке
  const rnd = i => Math.abs(Math.sin(i * 78.233) * 43758.5453) % 1;
  let tiles = '';
  for (let i = 0; i < cols * rows; i++) {
    const x = i % cols, y = Math.floor(i / cols);
    tiles += `<i style="--x:${x};--y:${y};--dx:${((rnd(i) - .5) * 260).toFixed(0)}%;--dy:${((rnd(i + 300) - .5) * 260).toFixed(0)}%;--r:${((rnd(i + 600) - .5) * 70).toFixed(0)}deg;--s:${(.55 + rnd(i + 900) * .5).toFixed(2)};--b:${(.7 + rnd(i + 1200) * .6).toFixed(2)}"></i>`;
  }
  return `<div class="cl-face">
    <div class="cl-mosaic" style="--img:url('${c.img}')">${tiles}</div>
    <div class="cl-face-side">
      <p class="cl-count"><b>120</b><span>${H.T(c.from)}</span></p>
      <p class="cl-count cl-one"><b>1</b><span>${H.T(c.to)}</span></p>
    </div>
  </div>
  ${c.same ? `<div class="cl-same">${c.same.map(src => `<button class="cl-shot" aria-label="Увеличить кадр"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>` : ''}
  ${cap(c.hint)}`;
}
function liveFace(box){
  const mos = box.querySelector('.cl-mosaic');
  const shots = [...box.querySelectorAll('.cl-shot')];
  box.addEventListener('click', e => { const b = e.target.closest('.cl-shot'); if (b) zoom(shots, b); });
  const upd = () => {
    const p = still() ? 1 : clamp(progress(mos) * 2.6 - .3, 0, 1);
    const e = 1 - Math.pow(1 - p, 3);
    mos.style.setProperty('--p', e.toFixed(3));
    box.classList.toggle('done', p > .97);
  };
  upd();
  onScroll(box, upd);
}

/* ---------- раскадровка: 24 кадра и модели, которые их сделали ---------- */
function boardHTML(c){
  const count = c.models.map((_, m) => c.frames.filter(f => f[1] === m).length);
  return `<div class="cl-board">
    <div class="cl-models">${c.models.map((name, m) =>
      `<button class="cl-model" data-m="${m}" style="--c:${MODEL[m]}"><i></i>${name}<span>${count[m]}</span></button>`).join('')}</div>
    <ol class="cl-cells">${c.frames.map(([name, m]) =>
      `<li data-m="${m}" style="--c:${MODEL[m]}">${H.T(name)}</li>`).join('')}</ol>
    ${c.rules ? `<div class="cl-rules">${c.rules.map(r =>
      `<div><h3>${H.T(r.name)}</h3><p>${H.T(r.text)}</p></div>`).join('')}</div>` : ''}
  </div>${cap(c.hint)}`;
}
function liveBoard(box){
  const board = box.querySelector('.cl-board'), btns = [...box.querySelectorAll('.cl-model')];
  let k = -1, held = false, t = 0, seen = false;
  const show = m => {
    board.dataset.m = m < 0 ? '' : m;
    btns.forEach((b, i) => b.classList.toggle('on', i === m));
  };
  // пока на экране, модели подсвечиваются по очереди; наведение останавливает перебор
  const step = () => { if (!held) { k = (k + 1) % btns.length; show(k); } };
  const run = () => { clearInterval(t); if (seen && !still()) t = setInterval(step, 1800); };
  btns.forEach((b, i) => {
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { held = true; k = i; show(i); } });
    b.addEventListener('pointerleave', () => { held = false; run(); });
    b.addEventListener('click', () => { k = i; show(i); run(); });
  });
  onScreen(board, v => { seen = v; if (v && k < 0) step(); run(); });
}

/* ---------- клип в одну полоску: цвет каждой секунды, наведение показывает кадр ---------- */
function scoreHTML(c){
  const n = BAR.length;
  const grad = BAR.map((h, i) => `#${h} ${(i / n * 100).toFixed(2)}% ${((i + 1) / n * 100).toFixed(2)}%`).join(',');
  return `<div class="cl-score" style="--sprite:url('${c.sprite}')">
    <div class="cl-peek"><div class="cl-thumb"></div><span class="cl-tc">0:00</span></div>
    <div class="cl-bar" style="background:linear-gradient(90deg,${grad})"><i class="cl-cur"></i></div>
    <div class="cl-marks">${(c.marks || []).map(m =>
      `<span style="left:${(m.t / n * 100).toFixed(2)}%">${H.T(m.name)}</span>`).join('')}</div>
    <div class="cl-ticks"><span>0:00</span><span>${time(n)}</span></div>
  </div>${cap(c.hint)}`;
}
function liveScore(box){
  const score = box.querySelector('.cl-score'), bar = box.querySelector('.cl-bar');
  const peek = box.querySelector('.cl-peek'), thumb = box.querySelector('.cl-thumb'), tc = box.querySelector('.cl-tc');
  const n = BAR.length, frames = Math.floor(n / 2);   // миниатюры — раз в две секунды, по 10 в ряд
  let sec = 0, held = false, raf = 0, seen = false, last = 0;
  const place = s => {
    sec = clamp(s, 0, n - .01);
    const f = Math.min(frames, Math.floor(sec / 2)), col = f % 10, row = Math.floor(f / 10);
    thumb.style.backgroundPosition = `${col / 9 * 100}% ${row / 8 * 100}%`;
    tc.textContent = time(sec);
    const x = sec / n;
    score.style.setProperty('--x', x.toFixed(4));
    // окошко не вылезает за края полоски
    const w = bar.clientWidth, pw = peek.offsetWidth;
    peek.style.transform = `translateX(${clamp(x * w - pw / 2, 0, w - pw).toFixed(1)}px)`;
  };
  const at = e => { const r = bar.getBoundingClientRect(); return (e.clientX - r.left) / r.width * n; };
  score.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) { held = true; place(at(e)); } });
  score.addEventListener('pointerdown', e => { held = true; place(at(e)); });
  score.addEventListener('pointerleave', () => { held = false; });
  score.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(() => { held = false; }, 2500); });
  // сам по себе курсор идет по клипу в шесть раз быстрее, чем клип играет
  const draw = t => {
    const dt = Math.min(64, t - (last || t)); last = t;
    if (!held) place((sec + dt * .006) % n);
    if (seen) raf = requestAnimationFrame(draw);
  };
  place(0);
  if (still()) return;
  onScreen(score, v => {
    if (v && !seen) { seen = true; last = 0; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- звонок из грядущего дня: ответить и увидеть себя старше ---------- */
function callHTML(c){
  return `<div class="cl-call">
    <div class="cl-call-frame">
      <img class="cl-c-now on" src="${c.from}" alt="" draggable="false">
      <img class="cl-c-then" src="${c.to}" alt="" loading="lazy" draggable="false">
      <p class="cl-call-line">${H.T(c.line)}</p>
    </div>
    <button class="btn btn-accent cl-answer"><span class="cl-a-on">${H.T(c.answer)}</span><span class="cl-a-off">${H.T(c.hang)}</span></button>
  </div>${cap(c.hint)}`;
}
function liveCall(box){
  const call = box.querySelector('.cl-call'), btn = box.querySelector('.cl-answer');
  btn.addEventListener('click', () => call.classList.toggle('talk'));
  onScreen(call, v => call.classList.toggle('ring', v && !still()));
}

/* ---------- кадры: лента едет с прокруткой, на телефоне листается пальцем ---------- */
function filmHTML(c){
  return `<div class="cl-film"><div class="cl-strip">${c.items.map(src =>
    `<button class="cl-shot" aria-label="Увеличить кадр"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div></div>${cap(c.hint)}`;
}
function liveFilm(box){
  const strip = box.querySelector('.cl-strip'), shots = [...box.querySelectorAll('.cl-shot')];
  box.addEventListener('click', e => { const b = e.target.closest('.cl-shot'); if (b) zoom(shots, b); });
  const wide = matchMedia('(hover: hover) and (min-width: 761px)');
  const upd = () => {
    if (!wide.matches) { strip.style.transform = ''; return; }
    const p = still() ? 0 : progress(box);
    const range = Math.max(0, strip.scrollWidth - box.clientWidth);
    strip.style.transform = `translate3d(${(-range * clamp(p * 1.25 - .1, 0, 1)).toFixed(1)}px,0,0)`;
  };
  upd();
  box.querySelectorAll('img').forEach(i => i.addEventListener('load', upd, { once: true }));
  onScroll(box, upd);
}

const KINDS = {
  worlds: [worldsHTML, liveWorlds],
  voice:  [voiceHTML, liveVoice],
  face:   [faceHTML, liveFace],
  board:  [boardHTML, liveBoard],
  score:  [scoreHTML, liveScore],
  call:   [callHTML, liveCall],
  film:   [filmHTML, liveFilm],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'clip.css?v=' + VERS;
    l.onload = l.onerror = res; document.head.appendChild(l);
  });
  return cssReady;
}
// глава появляется, когда доезжает до экрана
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountClip(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const chs = p.clip.map(ch => [ch, Object.keys(KINDS).find(k => ch[k])]);
  mount.innerHTML = chs.map(([ch, kind]) =>
    `<section class="cl-ch wrap cl-${kind}-ch">${head(ch)}<div class="cl-viz">${kind ? KINDS[kind][0](ch[kind]) : ''}</div></section>`).join('');
  [...mount.querySelectorAll('.cl-ch')].forEach((s, i) => {
    reveal.observe(s);
    const kind = chs[i][1];
    if (kind) KINDS[kind][1](s);
  });
}
