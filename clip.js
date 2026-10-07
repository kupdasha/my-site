/* ================================================================
   КЕЙС «МУЗЫКАЛЬНЫЙ КЛИП» (поле clip у проекта)
   Песня и клип, сделанные нейросетями. Главы: история — спуск по лестнице
   (кадры сменяются сами), голос с диктофона и модель, 120 фотографий собираются в одно лицо,
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
// анимация по времени: f(0…1) за ms миллисекунд
function tween(ms, f, done){
  if (still()) { f(1); done && done(); return; }
  const t0 = performance.now();
  const step = now => { const k = clamp((now - t0) / ms, 0, 1); f(k); if (k < 1) requestAnimationFrame(step); else done && done(); };
  requestAnimationFrame(step);
}
// один раз, когда блок впервые показался на экране
const onceSeen = (el, cb) => {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); cb(); } }, { rootMargin: '0px 0px -20% 0px' });
  io.observe(el);
};
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
// громкость песни «Звонок из грядущего дня»: 140 точек на 2:46, от 0 до 100 (посчитано по wav-файлам):
// VOICE — голос, спетый моделью; ARR — аранжировка; MIX — песня целиком
const VOICE = [43,51,44,48,57,48,39,39,31,45,58,64,80,60,80,72,95,78,78,70,71,100,88,78,90,72,59,70,74,55,82,80,84,53,75,60,73,65,73,66,62,73,66,67,66,80,54,51,52,42,49,50,52,48,42,50,79,77,66,56,85,80,72,72,64,68,50,62,93,72,75,77,86,81,57,81,74,54,78,35,67,61,70,62,72,72,57,69,74,71,68,69,32,42,44,32,47,54,43,44,50,41,66,78,75,70,77,83,72,70,79,94,84,96,67,31,36,62,5,12,63,41,48,53,52,63,38,38,49,50,42,37,13,41,60,27,51,57,2,0];
const ARR = [32,23,22,26,26,32,33,27,30,28,22,27,47,33,44,43,30,44,44,41,47,31,30,65,68,56,64,51,55,49,34,25,18,13,51,65,62,69,76,74,74,64,55,64,68,45,83,79,83,98,83,68,78,84,74,87,68,49,47,48,33,41,35,39,46,41,40,33,22,68,2,68,67,66,45,47,30,20,12,5,58,61,70,56,79,71,71,76,55,55,28,20,96,78,78,92,100,94,86,84,66,89,74,56,16,15,15,17,8,26,27,22,38,32,25,35,28,28,30,41,34,36,16,13,18,11,77,86,90,86,96,96,93,93,87,100,87,51,46,6];
const MIX = [35,33,30,36,37,38,35,33,34,35,34,39,55,43,54,52,50,55,53,51,57,46,48,69,71,63,60,52,58,52,41,39,40,26,57,64,65,66,74,74,72,66,56,66,69,54,80,86,71,89,77,71,75,74,69,80,67,58,53,52,46,54,47,53,48,48,47,41,43,69,50,64,71,69,61,47,35,35,30,20,60,64,69,61,77,68,73,73,52,59,37,35,94,84,66,85,91,91,84,75,65,87,73,61,36,33,38,38,32,39,42,43,50,48,43,35,31,39,37,35,40,43,27,27,32,32,84,87,82,91,93,91,89,100,81,89,80,60,11,4];
// средний цвет каждой секунды клипа (166 секунд), насыщенность чуть усилена, чтобы полоска читалась
const BAR = '3a3a3a 444444 535353 484848 3a3a3a 444444 474747 5b5b5b 363636 684f3d 654c3e 634b3d 525259 525058 6d6666 685d5c 8c836a 8d866d 83806a 8b8b8b 727272 9a9a9a 919191 8b8b8b 977548 737373 747474 626262 5b4722 65533a 6a5f51 444032 87776e 595442 5b5444 5b5341 978e8c 857368 87776c 908a85 686656 6a6653 968773 8c8c8c a3a3a3 5f5f5f 4f4f4f 505050 686868 6e6e6e 765e3c 745e3c 3e3e3e 4a4a4a 5c5c5c 474747 656565 474747 525252 484848 444444 4e4e4e 5b5b5b 4f4f4f 414141 505050 555555 505050 606060 777777 7c5d48 948078 94837e 716c5f ab7550 a9734d 565244 595647 665641 878273 8d897a 979386 7c7969 746962 706965 525252 535353 3b7179 4d7a7e 7b866d 806a50 7d654a 766743 1a1d1d 534941 545454 5a5a5a 585858 4c4c4c 505050 434343 505050 aea9a1 547a74 6f625e 6f615c 88684d a18c7b a18979 936a4d c08457 936242 2e578a 887a76 ac7454 b87c50 ac7b56 504e5c 464f6a 3f5173 365178 2c4e7d 264d80 817c6e 5e5e5e 616161 434550 1e334b 261614 261614 3f2926 402d2d 2e2525 322726 3f2d27 412f2a 52382e 3f434a 654e45 61443d 60433d 72765e 747760 8c8c70 8d8d72 8d8d72 585858 5b5b5b 525252 616161 8e795f 887255 352f2e 36312f 756e69 928878 b8b6ab 484143 6c5e61 3b2c1e 34271d 77596a 555555 3a3a3a 010101 010101'.split(' ');
// цвета моделей в раскадровке
const MODEL = ['#2F6BFF', '#2FA36B', '#A46BFF', '#E0559A', '#17A9BD'];

/* ---------- история: спуск по лестнице, кадры сменяются сами ---------- */
function worldsHTML(c){
  const n = c.items.length;
  return `<div class="cl-worlds" style="--n:${n}">
    <div class="cl-w-frame">${c.items.map((x, i) => x.imgs.map((src, j) =>
      `<img src="${src}" alt="" draggable="false" data-k="${i}"${i || j ? ' loading="lazy"' : ' class="on"'}>`).join('')).join('')}
      <p class="cl-w-deep">${H.T(c.deep || '')}</p>
    </div>
    <ol class="cl-stairs">${c.items.map((x, i) =>
      `<li style="--i:${i}"${x.deep ? ' data-deep' : ''}${i ? '' : ' class="on"'}><button><span class="cl-st-name">${H.T(x.name)}</span><i class="cl-st-bar"><b></b></i></button></li>`).join('')}</ol>
    <div class="cl-w-texts">${c.items.map((x, i) =>
      `<p class="cl-w-text${i ? '' : ' on'}"><b>${H.T(x.name)}</b> ${H.T(x.text)}</p>`).join('')}</div>
  </div>`;
}
function liveWorlds(box){
  const w = box.querySelector('.cl-worlds');
  const imgs = [...box.querySelectorAll('.cl-w-frame img')];
  const steps = [...box.querySelectorAll('.cl-stairs li')], texts = [...box.querySelectorAll('.cl-w-text')];
  const n = steps.length, SHOT = 1500;   // кадр держится полторы секунды — спуск быстрый
  const shots = steps.map((_, i) => imgs.filter(im => +im.dataset.k === i));
  let k = 0, j = 0, held = false, seen = false, timer = 0;
  const show = () => {
    imgs.forEach(im => im.classList.remove('on'));
    shots[k][j].classList.add('on');
    steps.forEach((li, i) => { li.classList.toggle('on', i === k); li.classList.toggle('past', i < k); });
    texts.forEach((p, i) => p.classList.toggle('on', i === k));
    w.style.setProperty('--k', k);
    w.classList.toggle('deep', steps[k].hasAttribute('data-deep'));   // в самой глубине — подпись про темноту
    // полоска под ступенью заполняется, пока идут ее кадры
    const bar = steps[k].querySelector('b');
    bar.style.transition = 'none'; bar.style.width = (j / shots[k].length * 100) + '%';
    requestAnimationFrame(() => { bar.style.transition = `width ${SHOT}ms linear`; bar.style.width = ((j + 1) / shots[k].length * 100) + '%'; });
  };
  const next = () => {
    if (++j >= shots[k].length) { j = 0; k = (k + 1) % n; }
    show();
  };
  const run = () => { clearInterval(timer); if (seen && !held && !still()) timer = setInterval(next, SHOT); };
  // наведение на ступень — сразу к ней, спуск ждет
  steps.forEach((li, i) => {
    const go = () => { k = i; j = 0; show(); };
    li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { held = true; go(); run(); } });
    li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { held = false; run(); } });
    li.addEventListener('click', () => { go(); run(); });
  });
  show();
  onScreen(w, v => { seen = v; run(); });
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
// голос на диктофоне: та же партия, но с шумом комнаты и неровной громкостью
const MEMO = VOICE.map((a, i) => clamp(a * .7 + 14 + 10 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1), 0, 100));
const WAVE = { arr: ARR, memo: MEMO, voice: VOICE };

// шаги по порядку: аранжировка, голос на диктофон, модель, голос модели, всё вместе
function voiceHTML(c){
  const svg = inner => `<div class="cl-s-w"><svg viewBox="0 0 140 40" preserveAspectRatio="none" aria-hidden="true">${inner}</svg></div>`;
  const row = (x, i) => x.model
    ? `<div class="cl-ai cl-vrow" style="--d:${i}"><i></i><span>${H.T(x.model)}</span><i></i></div>`
    : `<div class="cl-vrow cl-v-${x.wave}" style="--d:${i}"><span class="cl-v-name">${H.T(x.name)}</span>${svg(
        x.wave === 'mix' ? `<path class="cl-w-arr" d="${wavePath(ARR)}"/><path class="cl-w-voice" d="${wavePath(VOICE.map(v => v * .55))}"/>`
                         : `<path d="${wavePath(WAVE[x.wave])}"/>`)}</div>`;
  return `<div class="cl-voice">${c.steps.map(row).join('')}</div>${cap(c.hint)}`;
}
function liveVoice(box){
  const rows = [...box.querySelectorAll('.cl-vrow')];
  // шаги проявляются по очереди, когда глава показалась на экране
  onceSeen(box.querySelector('.cl-voice'), () => rows.forEach((r, i) =>
    setTimeout(() => tween(1100, q => r.style.setProperty('--q', (1 - Math.pow(1 - q, 2)).toFixed(3))), i * 900)));
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
  // клетки слетаются в лицо сами, когда мозаика показалась на экране
  onceSeen(mos, () => tween(2800, p => mos.style.setProperty('--p', (1 - Math.pow(1 - p, 3)).toFixed(3)),
    () => box.classList.add('done')));
}

/* ---------- раскадровка: все 24 кадра по очереди, как дорожка в монтажке ---------- */
// у кадра: [название, модель, картинка, длительность в секундах]
function boardHTML(c){
  const count = c.models.map((_, m) => c.frames.filter(f => f[1] === m).length);
  let at = 0;
  const clips = c.frames.map(([name, m, img, d], i) => {
    const li = `<li data-m="${m}" style="--c:${MODEL[m]};--s:${at};--d:${d};background-image:url('${img}')"><span>${H.T(name)}</span></li>`;
    at += d; return li;
  }).join('');
  const total = at, ticks = [];
  for (let t = 0; t < total - 15; t += 30) ticks.push(`<span style="--s:${t}">${time(t)}</span>`);
  return `<div class="cl-board" data-total="${total}">
    <div class="cl-models">${c.models.map((name, m) =>
      `<button class="cl-model" data-m="${m}" style="--c:${MODEL[m]}"><i></i><em>${name}</em><span>${count[m]}</span></button>`).join('')}</div>
    <div class="cl-mon">
      <div class="cl-mon-img">${c.frames.map(([, , img], i) => `<img src="${img}" alt=""${i ? ' loading="lazy"' : ' class="on"'} draggable="false">`).join('')}</div>
      <div class="cl-mon-info"><b class="cl-mon-name"></b><span class="cl-mon-tc"></span><span class="cl-mon-model"><i></i><em></em></span></div>
    </div>
    <div class="cl-tl"><div class="cl-track">
      <div class="cl-ruler">${ticks.join('')}</div>
      <ol class="cl-clips">${clips}</ol>
      <i class="cl-ph"></i>
    </div></div>
    ${c.rules ? `<div class="cl-rules">${c.rules.map(r =>
      `<div><h3>${H.T(r.name)}</h3><p>${H.T(r.text)}</p></div>`).join('')}</div>` : ''}
  </div>${cap(c.hint)}`;
}
function liveBoard(box){
  const board = box.querySelector('.cl-board'), tl = box.querySelector('.cl-tl'), track = box.querySelector('.cl-track');
  const btns = [...box.querySelectorAll('.cl-model')], clips = [...box.querySelectorAll('.cl-clips li')];
  const imgs = [...box.querySelectorAll('.cl-mon-img img')];
  const name = box.querySelector('.cl-mon-name'), tc = box.querySelector('.cl-mon-tc');
  const mdl = box.querySelector('.cl-mon-model'), mName = mdl.querySelector('em');
  const total = +board.dataset.total;
  const starts = clips.map(li => +li.style.getPropertyValue('--s')), durs = clips.map(li => +li.style.getPropertyValue('--d'));
  let px = 4, t = 0, cur = -1, held = false, raf = 0, seen = false, last = 0;
  // масштаб: вся раскадровка во всю ширину; на телефоне крупнее — тогда дорожка листается пальцем
  const fit = () => {
    const cs = getComputedStyle(tl), w = tl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    px = Math.max(w / total, matchMedia('(max-width:760px)').matches ? 7 : 0);
    track.style.setProperty('--px', px + 'px');
    track.style.width = total * px + 'px';
  };
  const show = k => {
    if (k === cur) return; cur = k;
    imgs.forEach((im, i) => im.classList.toggle('on', i === k));
    clips.forEach((li, i) => li.classList.toggle('on', i === k));
    name.innerHTML = clips[k].querySelector('span').innerHTML;
    const m = +clips[k].dataset.m;
    mdl.style.setProperty('--c', MODEL[m]); mName.textContent = btns[m].querySelector('em').textContent;
  };
  const place = s => {
    t = clamp(s, 0, total - .01);
    let k = starts.findIndex((st, i) => t >= st && t < st + durs[i]); if (k < 0) k = clips.length - 1;
    show(k);
    tc.textContent = time(t);
    track.style.setProperty('--t', t.toFixed(2));
    // дорожка сама подъезжает, чтобы бегунок был виден
    if (!held && tl.scrollWidth > tl.clientWidth + 2) {
      const x = t * px, l = tl.scrollLeft, w = tl.clientWidth - 2 * parseFloat(getComputedStyle(tl).paddingLeft);
      if (x < l + w * .1 || x > l + w * .9) tl.scrollLeft = x - w * .2;
    }
  };
  const at = e => { const r = track.getBoundingClientRect(); return (e.clientX - r.left) / px; };
  track.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { held = true; place(at(e)); } });
  track.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') held = false; });
  track.addEventListener('click', e => place(at(e)));
  tl.addEventListener('touchstart', () => { held = true; }, { passive: true });
  tl.addEventListener('touchend', () => setTimeout(() => { held = false; }, 3000), { passive: true });
  // модель: наведение или нажатие подсвечивает ее кадры на дорожке
  const choose = m => { board.dataset.m = m < 0 ? '' : m; btns.forEach((b, i) => b.classList.toggle('on', i === m)); };
  btns.forEach((b, i) => {
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') choose(i); });
    b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') choose(-1); });
    b.addEventListener('click', e => { if (e.pointerType !== 'mouse') choose(board.dataset.m === String(i) ? -1 : i); });
  });
  // бегунок сам идет по раскадровке, в восемь раз быстрее, чем по таймингу
  const draw = now => {
    const dt = Math.min(64, now - (last || now)); last = now;
    if (!held) place((t + dt * .008) % total);
    if (seen) raf = requestAnimationFrame(draw);
  };
  fit(); place(0);
  addEventListener('resize', () => { fit(); place(t); });
  if (still()) return;
  onScreen(board, v => {
    if (v && !seen) { seen = true; last = 0; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
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

/* ---------- кадры: лента едет сама, наведение ее останавливает, можно листать ---------- */
function filmHTML(c){
  const shots = c.items.map(src =>
    `<button class="cl-shot" aria-label="Увеличить кадр"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('');
  return `<div class="cl-film"><div class="cl-strip">${shots}${shots.replace(/<button class="cl-shot"/g, '<button class="cl-shot" tabindex="-1" aria-hidden="true"')}</div></div>${cap(c.hint)}`;
}
function liveFilm(box){
  const film = box.querySelector('.cl-film'), strip = box.querySelector('.cl-strip');
  const shots = [...box.querySelectorAll('.cl-shot')].slice(0, strip.children.length / 2);
  box.addEventListener('click', e => {
    const b = e.target.closest('.cl-shot'); if (!b) return;
    const all = [...strip.children], i = all.indexOf(b) % shots.length;
    zoom(shots, shots[i]);
  });
  if (still()) return;
  let held = false, raf = 0, seen = false, last = 0, x = 0;
  film.addEventListener('pointerenter', () => { held = true; });
  film.addEventListener('pointerleave', () => { held = false; x = film.scrollLeft; });
  film.addEventListener('touchstart', () => { held = true; }, { passive: true });
  film.addEventListener('touchend', () => setTimeout(() => { held = false; x = film.scrollLeft; }, 2500), { passive: true });
  const draw = t => {
    const dt = Math.min(64, t - (last || t)); last = t;
    if (!held) {
      const half = strip.scrollWidth / 2;
      x += dt * .03; if (x >= half) x -= half;
      film.scrollLeft = x;
    }
    if (seen) raf = requestAnimationFrame(draw);
  };
  onScreen(film, v => {
    if (v && !seen) { seen = true; last = 0; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
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
