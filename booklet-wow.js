/* ================================================================
   КЕЙС «ИМИДЖЕВЫЙ БУКЛЕТ» — версия «вау» (адрес с ?wow, поле booklet.wow)
   Версия 1 — booklet.js (метка git booklet-v1); эту грузит он же.
   hero   — книга открывается по прокрутке: шапка закреплена, прокрутка
            перематывает ролик open-scrub.mp4 (ключевой кадр каждые 2 кадра);
   sym    — круг: бутон (цветы сменяются), солнце, вырубка в обложке;
   farm   — объемная страница: теплый свет в доме идет за курсором
            (второй кадр виден в мягком круге), без курсора ходит сам;
   scent  — ароматы: круги на странице можно потереть — от них летят цветы;
   wheel  — живой конструктор: четыре диска с цветами крутятся под крышкой
            с окошками, в окошках складывается сочетание; диски можно
            тянуть рукой (подсказка — значок с рукой едет вместе с диском), кнопка крутит все разом,
            без касания крутится сам; фон почти черный (просьба 23.11);
   fin    — венок из цветов собирается вокруг бейджа «Среды».
   Цветы — вырезаны из присланного Дашей листа пиктограмм (img/booklet/fl,
   оранжевые 06, 18, 36 не взяты). Оформление — booklet-wow.css поверх booklet.css.
   ================================================================ */
let H;

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const img = n => H.base + 'img/booklet/' + n;
const fl = n => img('fl/' + String(n).padStart(2, '0') + '.webp');
const SMALL = /^(scent-[12]|color|tulips)/;
const pic = (n, sizes) =>
  `<img src="${img(n + '.webp')}" srcset="${img(n + '-s.webp')} 900w, ${img(n + '.webp')} ${n === 'wheel' ? 1280 : SMALL.test(n) ? 1920 : 2400}w" sizes="${sizes}" alt="" loading="lazy" decoding="async">`;
const FULL = '100vw', WIDE = '(max-width: 900px) 100vw, 64vw', HALF = '(max-width: 900px) 100vw, 46vw', SIDE = '(max-width: 900px) 100vw, 32vw';
let OPEN = ['рассмотреть кадр', 'рассмотреть кадр'];
const shot = (names, sizes, cls = '') => {
  const list = [].concat(names);
  if (/\.mp4$/.test(list[0])) return `<div class="ib-shot ${cls}"><video muted loop playsinline preload="none" poster="${img(list[0].replace('.mp4', '.webp'))}" src="${img(list[0])}"></video></div>`;
  return `<button type="button" class="ib-shot ${cls}${list.length > 1 ? ' ib-fade' : ''}" data-n="${list.join(',')}" aria-label="${esc(H.pick(OPEN))}">${list.map(n => pic(n, sizes)).join('')}</button>`;
};
const block = (c, extra = '') => `<div class="ib-col">
  <span class="case-label">${H.T(c.label)}</span>
  <h2 class="ib-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="ib-text">${H.T(c.text)}</p>` : ''}${extra}
</div>`;
const onScreen = (el, cb, threshold = .2) => new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

/* цветы: номера файлов и цвет лепестков (снят с картинок) */
const COL = { 1: '#a30216', 2: '#e25871', 3: '#efe9dc', 4: '#cf5d9d', 5: '#efb301', 7: '#d77bb3', 8: '#efe9dc', 9: '#712780', 10: '#cf3885',
  11: '#b21356', 12: '#e58d98', 13: '#cf201b', 14: '#e0b208', 15: '#b956a6', 16: '#f2b402', 17: '#e95170', 19: '#a00313', 20: '#c54395',
  21: '#d6526f', 22: '#ce7591', 23: '#c94d90', 24: '#ca6c93', 25: '#d92b2d', 26: '#8a0e25', 27: '#ce3972', 28: '#dca609', 29: '#e0ba1b',
  30: '#d5231d', 31: '#e6b211', 32: '#f3b102', 33: '#d2567e', 34: '#e45874', 35: '#db3045', 37: '#e8769c', 38: '#ad0910', 39: '#efe9dc', 40: '#8f5aa8' };

/* ================================================================
   hero — книга открывается по прокрутке
   ================================================================ */
function mountHero(hero, W){
  hero.classList.add('bw-hero');
  if (still()) {
    hero.innerHTML = `<video class="ib-hero-v" muted loop playsinline autoplay poster="${img('open.webp')}" src="${img('open.mp4')}"></video>`;
    return;
  }
  hero.classList.add('bw-scrub');
  hero.innerHTML = `<div class="bw-pin">
    <div class="bw-stagev"><video muted playsinline preload="auto" poster="${img('open.webp')}"></video></div>
    <div class="wrap bw-steps">${W.steps.map((t, i) => `<span class="bw-step${i ? '' : ' on'}">${H.T(t)}</span>`).join('')}
      <span class="bw-hint">${H.T(W.scroll)}</span><i class="bw-bar"><b></b></i></div>
  </div>`;
  const v = hero.querySelector('video'), steps = [...hero.querySelectorAll('.bw-step')], bar = hero.querySelector('.bw-bar b'), hint = hero.querySelector('.bw-hint');
  const scroller = hero.closest('.case') || document.scrollingElement;
  const EDGE = [0, .42, .62];   // с какой доли ролика начинается шаг: обложка, разворот, ферма
  let target = 0, cur = 0, raf = 0, on = false, dur = 6;
  v.muted = true;
  v.addEventListener('loadedmetadata', () => { dur = v.duration || 6; });
  // ролик качается целиком и отдается из памяти: так перемотка не зависит от сервера (не каждый отдает файл по частям)
  fetch(img('open-scrub.mp4')).then(r => r.ok ? r.blob() : Promise.reject()).then(b => { v.src = URL.createObjectURL(b); })
    .catch(() => { v.src = img('open-scrub.mp4'); });
  const read = () => {
    const pin = hero.querySelector('.bw-pin'), r = hero.getBoundingClientRect(), top = parseFloat(getComputedStyle(pin).top) || 0;
    const sr = scroller.getBoundingClientRect ? scroller.getBoundingClientRect().top : 0;
    const p = Math.min(1, Math.max(0, (sr + top - r.top) / Math.max(1, r.height - pin.offsetHeight)));
    target = p;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    hint.classList.toggle('off', p > .03);
    let k = 0; EDGE.forEach((e, i) => { if (p >= e) k = i; });
    steps.forEach((s, i) => s.classList.toggle('on', i === k));
  };
  const loop = () => {
    cur += (target - cur) * .16;
    const t = cur * (dur - .06);
    if (v.readyState > 0 && Math.abs(v.currentTime - t) > .012) v.currentTime = t;
    if (on) raf = requestAnimationFrame(loop);
  };
  scroller.addEventListener('scroll', read, { passive: true });
  addEventListener('resize', read);
  onScreen(hero, s => { on = s; cancelAnimationFrame(raf); if (s) { read(); raf = requestAnimationFrame(loop); } }, 0);
  read();
}

/* ================================================================
   sym — круг: бутон, солнце, вырубка
   ================================================================ */
const BUDS = [11, 5, 40, 2, 31, 25, 15, 34];
function symHTML(c, W){
  return `<div class="wrap bw-sym-top">${block(c)}
    <div class="bw-three">
      <figure><div class="bw-c bw-bud">${BUDS.map((n, i) => `<img src="${fl(n)}" alt="" class="${i ? '' : 'on'}" loading="lazy" decoding="async">`).join('')}</div><figcaption>${H.T(W.circles[0])}</figcaption></figure>
      <figure><div class="bw-c bw-sun"></div><figcaption>${H.T(W.circles[1])}</figcaption></figure>
      <figure><div class="bw-c bw-cut"><i style="background-image:url(${img('color-1.webp')})"></i><i style="background-image:url(${img('color-2.webp')})"></i></div><figcaption>${H.T(W.circles[2])}</figcaption></figure>
    </div>
  </div>
  <div class="wrap bw-pair">${shot(c.fade, WIDE)}${shot(c.img, SIDE)}</div>`;
}
function liveSym(box){
  const buds = [...box.querySelectorAll('.bw-bud img')];
  let at = 0, t = 0;
  const next = () => { buds[at].className = 'out'; at = (at + 1) % buds.length; buds[at].className = 'on'; };
  onScreen(box.querySelector('.bw-three'), s => { clearInterval(t); if (s && !still()) t = setInterval(next, 1900); });
}

/* ================================================================
   farm — свет в доме идет за курсором
   ================================================================ */
function farmHTML(c, W){
  return `<div class="bw-lamp" style="--x:38%;--y:34%" role="img" aria-label="${esc(H.pick(c.title))}">${pic(c.fade[0], FULL)}${pic(c.fade[1], FULL)}</div>
  <div class="wrap ib-duo ib-open">${shot(c.big, WIDE, 'ib-big')}${block(c, `<p class="bw-note">${H.T(W.lamp)}</p>`)}${shot(c.img, SIDE, 'ib-low ib-sweep')}</div>`;
}
function liveFarm(box){
  const lamp = box.querySelector('.bw-lamp');
  let raf = 0, on = false, user = -1e9, t0 = performance.now();
  const set = (x, y) => { lamp.style.setProperty('--x', (x * 100).toFixed(2) + '%'); lamp.style.setProperty('--y', (y * 100).toFixed(2) + '%'); };
  const move = e => { const r = lamp.getBoundingClientRect(); set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); user = performance.now(); };
  lamp.addEventListener('pointermove', move); lamp.addEventListener('pointerdown', move);
  const loop = now => {
    if (now - user > 2200) { const s = (now - t0) / 2400; set(.45 + Math.sin(s) * .22, .42 + Math.sin(s * 1.7) * .16); }
    if (on) raf = requestAnimationFrame(loop);
  };
  onScreen(lamp, s => { on = s; cancelAnimationFrame(raf); if (s && !still()) raf = requestAnimationFrame(loop); }, .1);
}

/* ================================================================
   scent — потрите круг: от него летят цветы
   ================================================================ */
const SPOTS = [   // круги на кадре scent-2: центр и радиус в долях кадра, какие цветы летят
  { x: .40, y: .54, r: .07, f: [31, 29, 14, 5] },     // гелихризум — желтые
  { x: .69, y: .64, r: .073, f: [40, 15, 9, 20] },    // шалфей — сиреневые
  { x: .33, y: .95, r: .07, f: [7, 37, 33, 12] },     // флокс — розовые
];
function scentHTML(c, W){
  return `<div class="wrap ib-duo bw-scent-grid">
    <div class="bw-rub ib-big"><img ${`src="${img('scent-2.webp')}" srcset="${img('scent-2-s.webp')} 900w, ${img('scent-2.webp')} 1920w" sizes="${WIDE}"`} alt="" loading="lazy" decoding="async">
      ${SPOTS.map((s, i) => `<i class="bw-spot" data-i="${i}" style="left:${s.x * 100}%;top:${s.y * 100}%;width:${s.r * 200}%"></i>`).join('')}<canvas></canvas></div>
    ${block(c, `<p class="bw-note">${H.T(W.rub)}</p>`)}${shot(c.img, SIDE, 'ib-low')}</div>`;
}
function liveScent(box){
  const rub = box.querySelector('.bw-rub'), cv = rub.querySelector('canvas'), ctx = cv.getContext('2d');
  const spots = [...rub.querySelectorAll('.bw-spot')];
  const pics = {}; SPOTS.forEach(s => s.f.forEach(n => { if (!pics[n]) { pics[n] = new Image(); pics[n].src = fl(n); } }));
  let P = [], raf = 0, on = false, user = -1e9, W = 0, Hh = 0, dpr = 1, auto = 0, lastAuto = 0, last = performance.now();
  const size = () => { dpr = Math.min(1.5, devicePixelRatio || 1); W = rub.clientWidth; Hh = rub.clientHeight; cv.width = W * dpr; cv.height = Hh * dpr; };
  new ResizeObserver(size).observe(rub); size();
  const emit = (i, n = 1) => {
    const s = SPOTS[i];
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * s.r * W * .7;
      P.push({ x: s.x * W + Math.cos(a) * d, y: s.y * Hh + Math.sin(a) * d * .8, vx: (Math.random() - .5) * 26, vy: -(34 + Math.random() * 46),
        r: Math.random() * 6.3, vr: (Math.random() - .5) * 1.6, s: (.035 + Math.random() * .04) * W, life: 0, max: 2.2 + Math.random() * 1.4, n: s.f[Math.floor(Math.random() * s.f.length)], ph: Math.random() * 6 });
    }
    if (P.length > 90) P.splice(0, P.length - 90);
  };
  const pulse = i => { const el = spots[i]; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); };
  // трение: считаем путь указателя внутри круга
  let acc = 0;
  rub.addEventListener('pointermove', e => {
    const r = rub.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    SPOTS.forEach((s, i) => {
      if (Math.hypot((x - s.x) * r.width, (y - s.y) * r.height) < s.r * r.width * 1.15) {
        user = performance.now(); acc += Math.hypot(e.movementX || 4, e.movementY || 4);
        if (acc > 26) { acc = 0; emit(i, 1); spots[i].classList.add('hot'); }
      } else spots[i].classList.remove('hot');
    });
  });
  spots.forEach((el, i) => el.addEventListener('pointerdown', () => { user = performance.now(); emit(i, 7); pulse(i); }));
  const loop = now => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (now - user > 2600 && now - lastAuto > 1700) { lastAuto = now; emit(auto, 6); pulse(auto); auto = (auto + 1) % SPOTS.length; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh);
    P = P.filter(p => (p.life += dt) < p.max);
    for (const p of P) {
      p.x += (p.vx + Math.sin(now / 700 + p.ph) * 14) * dt; p.y += p.vy * dt; p.vy *= (1 - .25 * dt); p.r += p.vr * dt;
      const k = p.life / p.max, a = k < .15 ? k / .15 : 1 - (k - .15) / .85, sc = .5 + Math.min(1, k * 3) * .5, im = pics[p.n];
      if (!im.complete || !im.naturalWidth) continue;
      ctx.globalAlpha = Math.max(0, a); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.drawImage(im, -p.s * sc / 2, -p.s * sc / 2, p.s * sc, p.s * sc);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.globalAlpha = 1;
    if (on) raf = requestAnimationFrame(loop);
  };
  onScreen(rub, s => { on = s; cancelAnimationFrame(raf); if (s && !still()) { last = performance.now(); raf = requestAnimationFrame(loop); } }, .15);
}

/* ================================================================
   wheel — живой конструктор букета
   ================================================================ */
const C = 500, WIN = 180;   // центр сцены; ряд окошек идет ровно по горизонтали влево от центра (просьба 23.11)
const RINGS = [   // от большого диска к малому: радиус диска, радиус дорожки с цветами, цветы
  { R: 455, fr: 405, f: [5, 10, 40, 25, 3, 11, 29, 20, 1, 7, 31, 13, 9, 34] },
  { R: 355, fr: 305, f: [23, 16, 35, 15, 2, 38, 28, 4, 30, 39, 27] },
  { R: 255, fr: 205, f: [21, 32, 19, 22, 14, 37, 26, 8] },
  { R: 155, fr: 105, f: [12, 33, 17, 24, 40] },
];
const FS = 80, HOLE = 45;
const pol = (r, deg) => [C + r * Math.cos(deg * Math.PI / 180), C + r * Math.sin(deg * Math.PI / 180)];
const f1 = v => v.toFixed(1);
function scallop(R){   // круг с фестонами по краю, как у дисков в буклете
  const n = Math.round(2 * Math.PI * R / 30), chord = 2 * R * Math.sin(Math.PI / n), r = chord * .62;
  let d = '';
  for (let i = 0; i <= n; i++) { const [x, y] = pol(R, i * 360 / n); d += i ? `A${f1(r)} ${f1(r)} 0 0 1 ${f1(x)} ${f1(y)}` : `M${f1(x)} ${f1(y)}`; }
  return d + 'Z';
}
function coverPath(){   // крышка: круг, срезанный вертикально чуть правее центра (просьба 23.11), с четырьмя окошками
  const R = 478, nu = 0, off = 34, a = Math.acos(off / R) * 180 / Math.PI;
  const [x1, y1] = pol(R, nu + a), [x2, y2] = pol(R, nu - a);
  let d = `M${f1(x1)} ${f1(y1)}A${R} ${R} 0 1 1 ${f1(x2)} ${f1(y2)}Z`;
  RINGS.forEach(g => { const [x, y] = pol(g.fr, WIN); d += `M${f1(x - HOLE)} ${f1(y)}a${HOLE} ${HOLE} 0 1 0 ${HOLE * 2} 0a${HOLE} ${HOLE} 0 1 0 ${-HOLE * 2} 0Z`; });
  return d;
}
// значок «можно крутить»: белая рука-указатель в темном кружке (нужна именно иконка руки — просьба 23.11), центр — в точке (0, 0).
// Рука собрана из скругленных форм: указательный палец, три согнутых, большой и ладонь
const HAND_PARTS = `<rect x="13" y="2" width="8" height="32" rx="4"/><rect x="21" y="17" width="8" height="20" rx="4"/><rect x="29" y="19.5" width="8" height="18" rx="4"/>
  <rect x="37" y="23" width="7" height="15" rx="3.5"/><rect x="8" y="26" width="8.5" height="20" rx="4.25" transform="rotate(-34 16 44)"/><rect x="13" y="27" width="31" height="25" rx="11"/>`;
const ICON = `<circle r="42" class="bw-ic-bg"/><g class="bw-ic-hand" transform="scale(1.02) translate(-25 -27)">${HAND_PARTS}</g>`;
function wheelSVG(){
  const rings = RINGS.map((g, k) => {
    const step = 360 / g.f.length;
    return `<path class="bw-disc" d="${scallop(g.R)}" fill="${['#f1ede5', '#f4f0e9', '#f7f4ee', '#faf8f3'][k]}"/>
      <g class="bw-ring" data-k="${k}">${g.f.map((n, i) =>
        `<image href="${fl(n)}" x="${C + g.fr - FS / 2}" y="${C - FS / 2}" width="${FS}" height="${FS}" transform="rotate(${f1(WIN + i * step)} ${C} ${C})"/>`).join('')}</g>`;
  }).join('');
  const holes = RINGS.map(g => { const [x, y] = pol(g.fr, WIN); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${HOLE - 1.5}"/>`; }).join('');
  return `<svg class="bw-svg" viewBox="0 0 1000 1000" role="img">
    ${rings}
    <path class="bw-cover" d="${coverPath()}" fill="#fcfaf6" fill-rule="evenodd"/>
    <g class="bw-rims" fill="none" stroke="rgba(70,30,20,.2)" stroke-width="3">${holes}</g>
    <circle cx="${C}" cy="${C}" r="11" fill="#8d8a86"/><circle cx="${C - 2}" cy="${C - 2}" r="6" fill="#c9c6c1"/>
    <g class="bw-hand" aria-hidden="true"><circle class="bw-tap" cx="${C + RINGS[0].fr}" cy="${C}" r="56"/>
      <g class="bw-hand-i"><g transform="translate(${C + RINGS[0].fr} ${C})">${ICON}</g></g></g>
  </svg>`;
}
function wheelHTML(c, W){
  return `<div class="wrap bw-wheel-grid">
    <div class="bw-stage" aria-label="${esc(H.pick(c.title))}"></div>
    ${block(c, `<div class="bw-result">
      <span class="bw-cap">${H.T(W.palette)}</span>
      <div class="bw-bq">${[0, 1, 2, 3].map(() => '<img alt="" decoding="async">').join('')}</div>
      <div class="bw-dots">${[0, 1, 2, 3].map(() => '<i></i>').join('')}</div>
      <button type="button" class="btn bw-spin"><span>${H.T(W.spin)}</span></button>
    </div>`)}
  </div>
  <div class="wrap bw-inbook"><span class="bw-cap">${H.T(W.inbook)}</span><div class="ib-trio">${c.imgs.map((n, i) => shot(n, i ? SIDE : WIDE)).join('')}</div></div>`;
}
function liveWheel(box){
  const stage = box.querySelector('.bw-stage'), res = box.querySelector('.bw-result');
  const bq = [...res.querySelectorAll('.bw-bq img')], dots = [...res.querySelectorAll('.bw-dots i')];
  let built = false, rings = [], hand = false, auto = 0, on = false, tt = 0, demoT = [], tick = 0;
  const picks = () => rings.map(r => r.f[((Math.round(-r.rot / r.step) % r.n) + r.n) % r.n]);
  const show = () => {
    const p = picks();
    res.classList.remove('spin');
    p.forEach((n, i) => {
      if (bq[i].dataset.n != n) { bq[i].dataset.n = n; bq[i].src = fl(n); bq[i].classList.remove('pop'); void bq[i].offsetWidth; bq[i].classList.add('pop'); }
      dots[i].style.background = COL[n] || '#efe9dc';
    });
  };
  const turn = (r, sec) => { r.el.style.transitionDuration = sec + 's'; r.el.style.transform = `rotate(${r.rot}deg)`; };
  const spin = () => {
    if (!built) return;
    res.classList.add('spin');
    rings.forEach((r, k) => { r.rot += (k % 2 ? -1 : 1) * (360 + (1 + Math.floor(Math.random() * (r.n - 1))) * r.step); turn(r, 1.5 + k * .28); });
    clearTimeout(tt); tt = setTimeout(show, 2450);
  };
  // подсказка без слов: значок с рукой появляется на большом диске и едет вместе с ним на два цветка
  const stopDemo = () => { demoT.forEach(clearTimeout); demoT = []; stage.querySelector('.bw-hand')?.classList.remove('on', 'press'); };
  const demo = () => {
    const h = stage.querySelector('.bw-hand'), r = rings[0];
    if (!h || !r) return;
    const hi = h.querySelector('.bw-hand-i');   // значок не наклоняется вместе с диском
    const a = -44, by = r.step * 2;
    h.style.transitionDuration = hi.style.transitionDuration = '0s'; h.style.transform = `rotate(${a}deg)`; hi.style.transform = `rotate(${-a}deg)`; void h.getBoundingClientRect(); h.classList.add('on');
    demoT = [
      setTimeout(() => h.classList.add('press'), 500),
      setTimeout(() => { res.classList.add('spin'); r.rot += by; turn(r, 1.2); h.style.transitionDuration = '1.2s'; hi.style.transitionDuration = '.35s, 1.2s'; h.style.transform = `rotate(${a + by}deg)`; hi.style.transform = `rotate(${-a - by}deg)`; }, 800),
      setTimeout(() => { h.classList.remove('press'); show(); }, 2100),
      setTimeout(() => h.classList.remove('on'), 2500),
    ];
  };
  const build = () => {
    if (built) return; built = true;
    stage.innerHTML = wheelSVG();
    const svg = stage.firstElementChild;
    rings = [...svg.querySelectorAll('.bw-ring')].map((el, k) => ({ el, k, f: RINGS[k].f, n: RINGS[k].f.length, step: 360 / RINGS[k].f.length, rot: 0 }));
    rings.forEach((r, k) => { r.rot = -r.step * [3, 7, 2, 1][k]; turn(r, 0); });
    show();
    // диск можно тянуть рукой: какой — по расстоянию от центра
    let drag = null;
    const pt = e => { const b = svg.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * 1000 - C, (e.clientY - b.top) / b.height * 1000 - C]; };
    svg.addEventListener('pointerdown', e => {
      const [x, y] = pt(e), d = Math.hypot(x, y);
      if (d > 470 || d < 30) return;
      const r = rings[d > 355 ? 0 : d > 255 ? 1 : d > 155 ? 2 : 3];
      hand = true; clearTimeout(tt); clearInterval(auto); stopDemo();
      drag = { r, a: Math.atan2(y, x) * 180 / Math.PI, moved: 0 };
      r.el.style.transitionDuration = '0s'; svg.setPointerCapture(e.pointerId); svg.classList.add('grab');
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const [x, y] = pt(e), a = Math.atan2(y, x) * 180 / Math.PI;
      let da = a - drag.a; if (da > 180) da -= 360; if (da < -180) da += 360;
      drag.a = a; drag.moved += Math.abs(da); drag.r.rot += da; drag.r.el.style.transform = `rotate(${drag.r.rot}deg)`;
      if (drag.moved > 3) res.classList.add('spin');
    });
    const up = () => {
      if (!drag) return;
      const r = drag.r; drag = null; svg.classList.remove('grab');
      r.rot = Math.round(r.rot / r.step) * r.step; turn(r, .5); clearTimeout(tt); tt = setTimeout(show, 520);
    };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  };
  box.querySelector('.bw-spin').addEventListener('click', () => { hand = true; clearInterval(auto); stopDemo(); spin(); });
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { build(); io.disconnect(); } }, { rootMargin: '700px 0px' }).observe(stage);
  onScreen(stage, s => {
    on = s; clearInterval(auto);
    // без касания: рука поворачивает диск, потом все диски крутятся разом — по очереди
    const step = () => { if (!built || hand) return; stopDemo(); (tick++ % 2 ? spin : demo)(); };
    if (s && !hand && !still()) { setTimeout(() => on && step(), 700); auto = setInterval(step, 4200); } else stopDemo();
  }, .35);
}

/* ================================================================
   fin — венок вокруг бейджа премии
   ================================================================ */
const WREATH = [11, 29, 40, 2, 5, 15, 25, 7, 31, 20, 1, 33, 14, 37, 26, 3, 23, 16, 35, 9, 34, 38];
function finHTML(s, W){
  const n = WREATH.length;
  return `<div class="wrap bw-fin-in">
    <div class="bw-wreath"><div class="bw-turn">${WREATH.map((f, i) => {
      const a = i * 360 / n, x = 50 + 41 * Math.cos(a * Math.PI / 180), y = 50 + 41 * Math.sin(a * Math.PI / 180);
      return `<img src="${fl(f)}" alt="" loading="lazy" decoding="async" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--a:${a.toFixed(1)}deg;--d:${(i * 45)}ms;--s:${(.86 + (i * 7 % 5) * .07).toFixed(2)}">`;
    }).join('')}</div>
    ${s.award ? `<img class="bw-badge" src="${img(s.award.img)}" alt="${esc(s.award.alt)}" width="249" height="84">` : ''}</div>
    <p class="bw-fin-text">${H.T(W.award)}</p>
  </div>`;
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'booklet-wow.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);
  });
  return cssReady;
}
const player = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('on', e.isIntersecting)), { threshold: .15 });
const roll = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); }), { threshold: .15 });
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });
function watchFade(el){
  const top = el.querySelector('img:last-child');
  const go = () => { el.classList.add('ready'); player.observe(el); };
  top.complete && top.naturalWidth ? go() : top.addEventListener('load', go, { once: true });
}
const shown = im => {
  const cs = getComputedStyle(im);
  return im.closest('.ib-sweep') ? Math.abs(parseFloat(cs.maskPosition || cs.webkitMaskPosition) - 50) < 25 : +cs.opacity > .5;
};

/* конструктор и венок — в версии 1 (просьба 23.11): booklet.js зовет это сразу после своей разметки,
   глава wheel заменяется живым конструктором, за ней текст с тюльпанами и венок; остальное довязывает сам booklet.js */
export async function mountParts(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  const s = p.booklet, W = s.wow, old = mount.querySelector('.ib-wheel');
  if (!old || !mount.isConnected) return;
  if (s.open) OPEN = s.open;
  const sec = (k, html) => `<section class="ib-ch bw-ch bw-${k}">${html}</section>`;
  old.outerHTML = sec('wheel', wheelHTML(s.wheel, W))
    + (s.pages ? sec('pages', `<div class="wrap"><div class="ib-col"><p class="ib-text">${H.T(s.pages.text)}</p></div>${shot(s.pages.fade, FULL)}</div>`) : '')
    + sec('fin', finHTML(s, W));
  liveWheel(mount.querySelector('.bw-wheel'));
}

export async function mountWow(mount, p, helpers, baseCSS){
  H = helpers;
  await Promise.all([baseCSS, loadCSS(H.base)]);
  if (!mount.isConnected) return;
  const s = p.booklet, W = s.wow;
  if (s.open) OPEN = s.open;
  mount.classList.add('bw');
  const sec = (k, html) => `<section class="ib-ch bw-ch bw-${k}">${html}</section>`;
  mount.innerHTML =
      sec('sym', symHTML(s.symbol, W))
    + sec('farm', farmHTML(s.farm, W))
    + sec('scent', scentHTML(s.scent, W))
    + sec('wheel', wheelHTML(s.wheel, W))
    + (s.pages ? sec('pages', `<div class="wrap"><div class="ib-col"><p class="ib-text">${H.T(s.pages.text)}</p></div>${shot(s.pages.fade, FULL)}</div>`) : '')
    + sec('fin', finHTML(s, W));
  const hero = mount.closest('.case-body')?.parentElement.querySelector('.case-hero');
  if (hero) mountHero(hero, W);
  const q = c => mount.querySelector(c);
  liveSym(q('.bw-sym')); liveFarm(q('.bw-farm')); liveScent(q('.bw-scent')); liveWheel(q('.bw-wheel'));
  mount.querySelectorAll('.ib-fade').forEach(watchFade);
  mount.querySelectorAll('.bw-lamp').forEach(el => { const t = el.querySelector('img:last-child'); const go = () => el.classList.add('ready'); t.complete && t.naturalWidth ? go() : t.addEventListener('load', go, { once: true }); });
  mount.querySelectorAll('video').forEach(v => { v.muted = true; roll.observe(v); });
  mount.querySelectorAll('.ib-ch').forEach(el => reveal.observe(el));
  const shots = [...mount.querySelectorAll('button.ib-shot')], list = [], from = [];
  shots.forEach(b => {
    const at = list.length, imgs = [...b.querySelectorAll('img')];
    b.dataset.n.split(',').forEach((n, i) => { list.push(img(n + '.webp')); from.push(imgs[i]); });
    b.addEventListener('click', () => H.openViewer(list, at + (imgs[1] && shown(imgs[1]) ? 1 : 0), from));
  });
}
