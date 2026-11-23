/* ================================================================
   КЕЙС «ИМИДЖЕВЫЙ БУКЛЕТ» — живые блоки в конце кейса (поле booklet.live)
   wheel — живой конструктор: четыре диска с фестонами и цветами крутятся
           под крышкой с вертикальным срезом и четырьмя окошками в ряд по
           горизонтали; в «сочетании» — те же цветы и их цвета; диски тянутся
           рукой (подсказка — иконка руки едет вместе с большим диском),
           кнопка крутит все разом, без касания крутится сам; фон почти черный;
   fin   — венок из цветов собирается вокруг бейджа «Среды».
   Грузит booklet.js сразу после своей разметки (mountParts). Цветы — вырезаны
   из присланного Дашей листа пиктограмм (img/booklet/fl, оранжевые 06, 18, 36
   не взяты). Оформление — booklet-wheel.css.
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
const FULL = '100vw', WIDE = '(max-width: 900px) 100vw, 64vw', SIDE = '(max-width: 900px) 100vw, 32vw';
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
// k — во сколько раз усилить тени: на маленьком экране сцена сжата, и тени в единицах рисунка становятся едва заметными
function wheelSVG(k = 1){
  const rings = RINGS.map((g, k) => {
    const step = 360 / g.f.length;
    return `<path class="bw-disc" filter="url(#bwShD)" d="${scallop(g.R)}" stroke="rgba(0,0,0,.1)" stroke-width="${f1(1.4 * k)}" fill="${['#f1ede5', '#f4f0e9', '#f7f4ee', '#faf8f3'][k]}"/>
      <g class="bw-ring" data-k="${k}">${g.f.map((n, i) =>
        `<image href="${fl(n)}" x="${C + g.fr - FS / 2}" y="${C - FS / 2}" width="${FS}" height="${FS}" transform="rotate(${f1(WIN + i * step)} ${C} ${C})"/>`).join('')}</g>`;
  }).join('');
  const holes = RINGS.map(g => { const [x, y] = pol(g.fr, WIN); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${HOLE - 1.5}"/>`; }).join('');
  return `<svg class="bw-svg" viewBox="0 0 1000 1000" role="img">
    <defs><filter id="bwShD" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="${f1(5 * k)}" stdDeviation="${f1(3.5 * k)}" flood-color="#000" flood-opacity=".34"/></filter>
      <filter id="bwShC" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="${f1(9 * k)}" stdDeviation="${f1(6.5 * k)}" flood-color="#000" flood-opacity=".38"/></filter></defs>
    ${rings}
    <path class="bw-cover" filter="url(#bwShC)" d="${coverPath()}" fill="#fcfaf6" fill-rule="evenodd"/>
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
    stage.innerHTML = wheelSVG(Math.min(2.2, Math.max(1, 560 / (stage.clientWidth || 560))));
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
      // посетителем считается только настоящий поворот: на телефоне палец, который просто листает страницу,
      // тоже касается диска — раньше от этого навсегда пропадала подсказка-рука
      drag = { r, a: Math.atan2(y, x) * 180 / Math.PI, moved: 0, rot0: r.rot, real: false };
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const [x, y] = pt(e), a = Math.atan2(y, x) * 180 / Math.PI;
      let da = a - drag.a; if (da > 180) da -= 360; if (da < -180) da += 360;
      drag.a = a; drag.moved += Math.abs(da);
      if (!drag.real && drag.moved > 3) {
        drag.real = true; hand = true; clearTimeout(tt); clearInterval(auto); stopDemo();
        drag.r.el.style.transitionDuration = '0s'; svg.classList.add('grab'); res.classList.add('spin');
        try { svg.setPointerCapture(e.pointerId); } catch (er) {}
      }
      if (drag.real) { drag.r.rot += da; drag.r.el.style.transform = `rotate(${drag.r.rot}deg)`; }
    });
    const up = () => {
      if (!drag) return;
      const r = drag.r, real = drag.real; drag = null; svg.classList.remove('grab');
      if (!real) return;
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
    l.rel = 'stylesheet'; l.href = base + 'booklet-wheel.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);
  });
  return cssReady;
}
/* booklet.js зовет это сразу после своей разметки: глава wheel заменяется живым конструктором,
   за ней текст с тюльпанами и венок; кадры, ролики и «крупно по нажатию» довязывает сам booklet.js */
export async function mountParts(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  const s = p.booklet, W = s.live, old = mount.querySelector('.ib-wheel');
  if (!old || !mount.isConnected) return;
  if (s.open) OPEN = s.open;
  const sec = (k, html) => `<section class="ib-ch bw-ch bw-${k}">${html}</section>`;
  old.outerHTML = sec('wheel', wheelHTML(s.wheel, W))
    + (s.pages ? sec('pages', `<div class="wrap"><div class="ib-col"><p class="ib-text">${H.T(s.pages.text)}</p></div>${shot(s.pages.fade, FULL)}</div>`) : '')
    + sec('fin', finHTML(s, W));
  liveWheel(mount.querySelector('.bw-wheel'));
}
