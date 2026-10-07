/* ================================================================
   КЕЙС «ОДНА КАВЫЧКА» (поле kav у проекта, см. «Одна кавычка»)
   Мерч для своего медиа: всё держится на булавках и меняется.
   Стикеры на спине перевешиваются мышкой, рваную кавычку можно
   разглядеть под лупой, лейбл печатает ваш текст, мягкий брелок
   мнется от нажатия, а надпись бежит по его краю.
   Тексты — в content.js, оформление — kav.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
const NEON = '#E4FF1A';

const head = ch => `<div class="kv-head">
  <span class="case-label kv-label">${H.T(ch.label)}</span>
  <h2 class="kv-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="kv-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const cap = t => t ? `<p class="kv-cap">${H.T(t)}</p>` : '';
const shot = (src, c = '') => `<button class="kv-shot${c}" aria-label="Увеличить кадр"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`;
// крупно по нажатию: листаются все кадры главы
function zoomable(box){
  box.addEventListener('click', e => {
    const b = e.target.closest('.kv-shot');
    if (!b) return;
    const list = [...box.querySelectorAll('.kv-shot')], imgs = list.map(x => x.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), list.indexOf(b), imgs);
  });
}
// ролики играют, только пока на экране
const loopVideo = (src, poster) => `<video class="kv-vid" src="${src}" poster="${poster || ''}" muted loop playsinline preload="none"></video>`;
function liveVideos(box){
  box.querySelectorAll('.kv-vid').forEach(v => onScreen(v, on => {
    if (on && !still()) { v.preload = 'auto'; v.muted = true; v.play().catch(() => v.addEventListener('canplay', () => v.play().catch(() => {}), { once: true })); } else v.pause();
  }));
}

/* ---------- стикеры: неоновые лоскуты на булавках, их можно перевесить ---------- */
// края лоскута лохматые: шум сдвигает контур, второй слой — бахрома из ниток
const FRAY = `<svg class="kv-defs" aria-hidden="true" width="0" height="0"><defs>
  <filter id="kvEdge" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="3" seed="3"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>
  <filter id="kvFluff" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="16"/></filter>
</defs></svg>`;
// английская булавка: петля и головка
const PIN = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})" class="kv-safety"><path d="M0 0h30a3.2 3.2 0 0 1 0 6.4H3" fill="none" stroke="#141414" stroke-width="1.8" stroke-linecap="round"/><path d="M-6 -1.8h7v8.2h-7a1.4 1.4 0 0 1-1.4-1.4V-.4A1.4 1.4 0 0 1-6-1.8z" fill="#141414"/></g>`;
// неровный контур лоскута: у каждого свой, углы и середины сторон чуть гуляют
function blob(i, inset){
  let k = i * 9301 + 49297;
  const rnd = () => (k = (k * 233280 + 1) % 2147483647) / 2147483647 - .5;
  const a = inset, b = 120 - inset, j = 9;
  const pts = [[a, a], [60, a], [b, a], [b, 60], [b, b], [60, b], [a, b], [a, 60]].map(([x, y]) => [x + rnd() * j, y + rnd() * j]);
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
}
function patchSVG(it, i){
  // надпись — векторный макет квадрата из печати (PDF → прозрачный PNG), лоскут под ней — свой, лохматый
  const body = it.art ? `<image href="${it.art}" x="12" y="12" width="96" height="96"/>` : '';
  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <path d="${blob(i, 11)}" fill="none" stroke="#EEFF6A" stroke-width="9" stroke-dasharray=".7 1.8" filter="url(#kvFluff)"/>
    <path d="${blob(i, 13)}" fill="${NEON}" filter="url(#kvEdge)"/>
    ${body}
    ${PIN(14, 18, -28)}${PIN(82, 104, 18)}
  </svg>`;
}
// полупрозрачная рука-подсказка: сама берет стикер и переносит, пока посетитель не тронул ничего сам
const HAND = `<svg viewBox="0 0 64 72"><g fill="#fff" stroke="#141414" stroke-width="2.4" stroke-linejoin="round">
  <rect class="f" x="16" y="6" width="9" height="34" rx="4.5"/><rect class="f" x="25" y="2" width="9" height="38" rx="4.5"/>
  <rect class="f" x="34" y="4" width="9" height="36" rx="4.5"/><rect class="f" x="43" y="10" width="9" height="30" rx="4.5"/>
  <rect x="6" y="34" width="9" height="22" rx="4.5" transform="rotate(-40 10 45)"/>
  <path d="M14 30h40v16c0 12-8 22-20 22s-20-8-20-20z"/></g></svg>`;
function pinsHTML(c, ch){
  return `<div class="kv-pins">
    ${FRAY}
    <div class="kv-board" style="aspect-ratio:896/${Math.round(1152 * (1 - (c.crop || 0) / 100))}">
      <img src="${c.bg}" alt="" draggable="false">
      <i class="kv-hand" aria-hidden="true">${HAND}</i>
      ${c.items.map((it, i) => `<div class="kv-pin" data-i="${i}" style="left:${it.x}%;top:${it.y}%;--r:${it.r || 0}deg" aria-hidden="true">${patchSVG(it, i)}</div>`).join('')}
    </div>
    <div class="kv-pins-side">
      <span class="case-label">${H.T(ch.label)}</span>
      <h2 class="kv-title">${H.T(ch.title)}</h2>
      ${ch.text ? `<p class="kv-text">${H.T(ch.text)}</p>` : ''}
      <div class="kv-pins-bar">
        <button class="btn btn-line kv-shuffle"><span class="spell">${H.T(c.shuffle)}</span></button>
        <button class="btn btn-line kv-reset"><span class="spell">${H.T(c.reset)}</span></button>
      </div>
      ${cap(c.hint)}
    </div>
  </div>
  ${c.photos ? `<div class="kv-collage">${c.photos.map(s => shot(s)).join('')}</div>` : ''}`;
}
function livePins(box, c){
  const board = box.querySelector('.kv-board');
  const pins = [...box.querySelectorAll('.kv-pin')];
  let z = 10;
  const place = (p, x, y, r) => {
    p.style.left = x + '%'; p.style.top = y + '%';
    if (r != null) p.style.setProperty('--r', r + 'deg');
  };
  pins.forEach(p => {
    let sx, sy, ox, oy, rect, moved;
    p.addEventListener('pointerdown', e => {
      e.preventDefault();
      p.setPointerCapture(e.pointerId);
      rect = board.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; moved = false;
      ox = parseFloat(p.style.left); oy = parseFloat(p.style.top);
      p.style.zIndex = ++z; p.classList.add('held');
    });
    p.addEventListener('pointermove', e => {
      if (!p.classList.contains('held')) return;
      const dx = (e.clientX - sx) / rect.width * 100, dy = (e.clientY - sy) / rect.height * 100;
      if (Math.abs(dx) + Math.abs(dy) > .5) moved = true;
      // лоскут чуть клонится в сторону движения, как ткань в руке
      p.style.setProperty('--tilt', clamp(e.movementX * .8, -10, 10) + 'deg');
      place(p, clamp(ox + dx, 2, 98), clamp(oy + dy, 4, 97));
    });
    const drop = () => {
      if (!p.classList.contains('held')) return;
      p.classList.remove('held'); p.style.setProperty('--tilt', '0deg');
      if (moved && !still()) { p.classList.remove('pinned'); void p.offsetWidth; p.classList.add('pinned'); }
    };
    p.addEventListener('pointerup', drop);
    p.addEventListener('pointercancel', drop);
  });
  const shuffle = () => pins.forEach(p => {
    place(p, 12 + Math.random() * 76, 12 + Math.random() * 78, Math.round(Math.random() * 50 - 25));
    p.style.zIndex = ++z;
  });
  // подсказка: рука берет пустой стикер, переносит и отпускает; следующий раз — обратно
  const hand = board.querySelector('.kv-hand');
  let demo = !still(), seen = false, busy = false, there = false;
  const timers = [];
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const stopDemo = () => {
    if (!demo) return;
    demo = false; timers.forEach(clearTimeout);
    hand.classList.remove('on', 'grab');
    pins.forEach(p => p.classList.remove('demo', 'held'));
  };
  const at = (x, y) => { hand.style.left = x + '%'; hand.style.top = y + '%'; };
  const run = () => {
    if (!demo || !seen || busy) return;
    busy = true;
    const p = pins[0], it = c.items[0], to = [39, 18];
    const [fx, fy] = there ? to : [it.x, it.y], [tx, ty] = there ? [it.x, it.y] : to;
    hand.style.transition = 'none'; at(fx + 9, fy + 16); hand.getBoundingClientRect(); hand.style.transition = '';
    hand.classList.add('on'); at(fx, fy);
    later(800, () => { hand.classList.add('grab'); p.style.zIndex = ++z; p.classList.add('held', 'demo'); });
    later(1150, () => { place(p, tx, ty); at(tx, ty); });
    later(2350, () => { hand.classList.remove('grab'); p.classList.remove('held'); p.classList.remove('pinned'); void p.offsetWidth; p.classList.add('pinned'); });
    later(2700, () => { hand.classList.remove('on'); at(tx + 6, ty + 12); });
    later(3300, () => { p.classList.remove('demo'); there = !there; busy = false; });
    later(5200, run);
  };
  board.addEventListener('pointerdown', stopDemo, true);
  onScreen(board, v => { seen = v; if (v) later(600, run); }, '-15% 0px');
  box.querySelector('.kv-shuffle').addEventListener('click', () => { stopDemo(); });
  box.querySelector('.kv-reset').addEventListener('click', () => { stopDemo(); });
  box.querySelector('.kv-shuffle').addEventListener('click', shuffle);
  box.querySelector('.kv-reset').addEventListener('click', () => pins.forEach((p, i) => place(p, c.items[i].x, c.items[i].y, c.items[i].r || 0)));
  zoomable(box);
}

/* ---------- кармашек: что в него помещается ---------- */
function pocketHTML(c){
  return `<div class="kv-pocket">
    ${shot(c.img, ' kv-big')}
    <div class="kv-pocket-side">
      <ul class="kv-chips">${c.chips.map((t, i) => `<li style="--d:${i * 110}ms">${H.T(t)}</li>`).join('')}</ul>
      ${c.side ? shot(c.side) : ''}
    </div>
  </div>${cap(c.hint)}`;
}
function livePocket(box){ zoomable(box); }

/* ---------- рваная кавычка: лупа над футболкой ---------- */
function loupeHTML(c){
  return `<div class="kv-tee">
    <div class="kv-loupe-box" style="--src:url('${c.img}')">
      <img src="${c.img}" alt="" draggable="false">
      <i class="kv-lens" aria-hidden="true"></i>
    </div>
    <div class="kv-tee-side">
      ${c.side.map(s => `<figure>${shot(s.img)}${s.cap ? `<figcaption>${H.T(s.cap)}</figcaption>` : ''}</figure>`).join('')}
    </div>
  </div>${cap(c.hint)}`;
}
function liveLoupe(box){
  const st = box.querySelector('.kv-loupe-box'), lens = box.querySelector('.kv-lens');
  const Z = 2.6;
  const at = (px, py) => {
    const r = st.getBoundingClientRect();
    const x = clamp(px, 0, r.width), y = clamp(py, 0, r.height);
    lens.style.transform = `translate3d(${x}px,${y}px,0)`;
    lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
    lens.style.backgroundPosition = `${-(x * Z - lens.offsetWidth / 2)}px ${-(y * Z - lens.offsetHeight / 2)}px`;
  };
  let auto = true, raf = 0, seen = false, t0 = 0;
  const move = e => {
    auto = false; st.classList.add('on');
    const r = st.getBoundingClientRect();
    at(e.clientX - r.left, e.clientY - r.top);
  };
  st.addEventListener('pointermove', move);
  st.addEventListener('pointerdown', move);
  st.addEventListener('pointerleave', () => { auto = true; t0 = 0; if (seen && !still()) raf = requestAnimationFrame(draw); });
  // пока лупу не трогают, она сама ходит по кавычке
  const draw = t => {
    if (!auto || !seen) return;
    if (!t0) t0 = t;
    const r = st.getBoundingClientRect(), k = (t - t0) / 1000;
    st.classList.add('on');
    at(r.width * (.47 + Math.sin(k * .7) * .1), r.height * (.36 + Math.sin(k * 1.1) * .13));
    raf = requestAnimationFrame(draw);
  };
  onScreen(st, v => {
    seen = v;
    if (v && auto && !still()) raf = requestAnimationFrame(draw); else cancelAnimationFrame(raf);
  });
  zoomable(box);
}

/* ---------- лейбл: печатает ваш текст, как портативный принтер на чековой бумаге ---------- */
// кавычка-«ёлочка» — силуэт из логотипа
const CHEV = `<svg class="kv-chev" viewBox="0 0 40 40" aria-hidden="true"><path d="M30 6 9 20l21 14" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BARS = [3, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 1, 2, 1];
const logoPaper = c => `<div class="kv-logo">
  <div class="kv-mark">${CHEV}<b>одна<br>кавычка</b></div>
  <span class="kv-pill">${esc(c.pill)}</span>
  <span class="kv-bars">${BARS.map(w => `<i style="flex:${w}"></i><u></u>`).join('')}</span>
  <span class="kv-date">${c.date.map(d => `<i>${esc(d)}</i>`).join('')}</span>
</div>`;
function labelHTML(c){
  return `<div class="kv-print">
    <div class="kv-panel kv-desk">
      <div class="kv-story" aria-hidden="true"></div>
      <div class="kv-holder">
        <i class="kv-hang" aria-hidden="true"></i>
        <div class="kv-win"><div class="kv-paper">${logoPaper(c)}</div></div>
      </div>
    </div>
    <div class="kv-ctrl">
      <form class="kv-form">
        <input class="kv-input" maxlength="40" placeholder="${esc(H.pick(c.placeholder))}" aria-label="${esc(H.pick(c.placeholder))}">
        <button class="btn btn-line" type="submit"><span class="spell">${H.T(c.button)}</span></button>
      </form>
      ${c.video ? `<div class="kv-mini">${loopVideo(c.video, c.poster)}</div>` : ''}
    </div>
  </div>`;
}
// надписи сменяются сами, как истории: полоски сверху заполняются по очереди, нажатие на полоску — к ней
function liveLabel(box, c){
  const win = box.querySelector('.kv-win'), story = box.querySelector('.kv-story');
  const form = box.querySelector('.kv-form'), input = box.querySelector('.kv-input');
  const STEP = 3200;
  const items = [{ logo: true }, ...H.pick(c.presets).map(t => ({ t }))];
  let at = 0, busy = Promise.resolve(), seen = false;
  // подгоняем кегль, чтобы слова влезли в окошко лейбла
  const fit = el => {
    const t = el.querySelector('.kv-words');
    if (!t) return;
    // сначала строки как написаны; если длинная строка не влезает и в 22px — пусть переносится
    const W = el.clientWidth * .84, Hh = el.clientHeight - el.clientWidth * .16;
    const over = () => t.scrollWidth > W + 1 || t.scrollHeight > Hh + 1;
    let s = 56;
    t.style.whiteSpace = 'nowrap'; t.style.fontSize = s + 'px';
    while (s > 22 && over()) t.style.fontSize = --s + 'px';
    if (over()) { t.style.whiteSpace = 'normal'; while (s > 14 && over()) t.style.fontSize = --s + 'px'; }
  };
  // короткие слова (предлоги, союзы) держатся за следующим, чтобы не висеть в конце строки
  const glue = t => t.replace(/(^|\s)([а-яёa-z]{1,2}) /gi, '$1$2 ');
  const words = t => `<div class="kv-words">${glue(glue(esc(t))).replace(/\n/g, '<br>')}</div>`;
  const print = html => busy = busy.then(() => new Promise(done => {
    const old = win.querySelector('.kv-paper:not(.out)');
    const sheet = document.createElement('div');
    sheet.className = 'kv-paper';
    sheet.innerHTML = html;
    if (still()) { win.replaceChildren(sheet); fit(sheet); return done(); }
    // старая полоска уходит вверх, новая выползает из принтера и проявляется строка за строкой
    old && old.classList.add('out');
    sheet.classList.add('in');
    win.appendChild(sheet); fit(sheet);
    setTimeout(() => { old && old.remove(); sheet.classList.remove('in'); done(); }, 1100);
  }));
  const bars = () => {
    story.innerHTML = items.map((_, i) => `<button tabindex="-1" style="--t:${STEP}ms"><i></i></button>`).join('');
    story.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => go(i)));
    mark();
  };
  const mark = () => story.querySelectorAll('button').forEach((b, i) => {
    b.classList.toggle('done', i < at);
    b.classList.remove('on'); if (i === at) { void b.offsetWidth; b.classList.add('on'); }
  });
  const go = i => {
    at = (i + items.length) % items.length;
    const it = items[at];
    print(it.logo ? logoPaper(c) : words(it.t));
    mark();
  };
  // полоска дозаполнилась — следующая надпись
  story.addEventListener('animationend', e => { if (e.target.parentElement?.classList.contains('on')) go(at + 1); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = input.value.trim().toLowerCase();
    if (!t) { input.focus(); return; }
    items.splice(at + 1, 0, { t });
    input.value = '';
    bars(); go(at + 1);
  });
  bars();
  if (still()) story.classList.add('paused');
  onScreen(box, v => { seen = v; story.classList.toggle('paused', !v || still()); });
  liveVideos(box);
}

/* ---------- брелок: мягкая кавычка в 3D, напечатана один в один как в макете, от нажатия сминается ---------- */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
// печатный макет (PDF из Иллюстратора → plush-print.png, 300 dpi). Средняя линия кавычки и ширина
// подобраны по надписи на макете: ручка A → угол B → ручка C в точках макета при 150 dpi (лист 1057 × 1418)
const PAGE = [1057, 1418], PA = [749.4, 258.1], PB = [261.4, 726.9], PC = [745.7, 1162.4];
const RING = 213.6, EDGE = 285;   // надпись идет на расстоянии RING от средней линии, край игрушки — EDGE
const CR = 0.8, SC = CR / EDGE;   // в 3D край — 0.8 от средней линии
const w3 = p => [(p[0] - PAGE[0] / 2) * SC, (PAGE[1] / 2 - p[1]) * SC];
const CA = w3(PA), CB = w3(PB), CC = w3(PC);
// силуэт игрушки в точках макета: надпись, склеенная в ленту, плюс поле до шва, сглажено
const OUTLINE = [827,1404.5,795,1403.5,764,1396.5,724,1382.5,669,1360.5,600,1328.5,560,1317.5,545,1309.5,520,1288.5,482,1264.5,443,1244.5,373,1201.5,355,1192.5,346,1189.5,330,1181.5,323,1176.5,291,1144.5,266.5,1123,243,1095.5,216,1073.5,198.5,1056,165.5,1016,138.5,979,120.5,952,103.5,923,69.5,859,51.5,816,38.5,777,25.5,749,22.5,737,22.5,718,24.5,708,28.5,695,28.5,691,34.5,666,42.5,645,50.5,631,60.5,608,68.5,593,89.5,560,124.5,511,143.5,475,158,459.5,171,449.5,183.5,437,191.5,427,227.5,392,245.5,366,257.5,351,326.5,276,422,181.5,459,150.5,486,130.5,506,110.5,517,102.5,525,98.5,563,87.5,579,80.5,613,68.5,635,58.5,676,45.5,715,36.5,720,36.5,745,31.5,751,31.5,758,29.5,771,28.5,772,27.5,780,27.5,781,26.5,792,26.5,793,27.5,804,28.5,835,39.5,857,44.5,877,51.5,901,65.5,944,86.5,955,93.5,966,102.5,975.5,112,988.5,128,997.5,142,1007.5,161,1014.5,178,1021.5,203,1023.5,220,1024.5,221,1024.5,228,1025.5,229,1025.5,241,1026.5,242,1026.5,261,1025.5,262,1024.5,279,1023.5,280,1020.5,302,1013.5,326,1009.5,334,1004.5,349,995.5,367,984.5,384,973.5,398,928.5,443,915.5,461,903,473.5,864,496.5,832,521.5,806,546.5,754,590.5,733.5,611,719.5,629,711,637.5,700,645.5,683,654.5,668,665.5,659.5,674,655.5,680,652.5,689,653.5,699,657.5,707,665.5,718,720.5,780,825.5,905,842,921.5,858,933.5,870.5,947,887.5,980,899.5,998,914.5,1019,945.5,1057,967.5,1089,980.5,1111,993.5,1138,1003.5,1155,1013.5,1179,1014.5,1184,1014.5,1205,1010.5,1224,1008.5,1245,1002.5,1269,996.5,1283,989.5,1294,977.5,1308,949.5,1346,940,1356.5,925,1368.5,899,1383.5,872,1394.5,866,1395.5,859,1398.5,827,1404.5];
// рука с вытянутым пальцем: кончик пальца — точка нажатия
const TAP = `<svg viewBox="0 0 64 72"><g fill="#fff" stroke="#141414" stroke-width="2.4" stroke-linejoin="round">
  <rect x="26" y="2" width="11" height="40" rx="5.5"/><rect x="36" y="24" width="10" height="20" rx="5"/><rect x="45" y="28" width="9" height="18" rx="4.5"/>
  <rect x="11" y="36" width="10" height="22" rx="5" transform="rotate(-38 16 47)"/>
  <path d="M20 34h34v14c0 12-8 22-19 22s-17-8-17-18z"/></g></svg>`;
function plushHTML(c){
  return `<div class="kv-plush">
    <div class="kv-panel kv-toy-box">
      <img class="kv-toy-still" src="${c.photos[0]}" alt="" hidden>
    </div>
    <div class="kv-plush-side">
      ${c.photos.map(s => shot(s)).join('')}
      ${c.video ? `<div class="kv-mini">${loopVideo(c.video, c.poster)}</div>` : ''}
    </div>
  </div>${cap(c.hint)}`;
}
function livePlush(box, c){
  zoomable(box); liveVideos(box);
  const host = box.querySelector('.kv-toy-box');
  const fail = err => { console.warn('3D-брелок не загрузился', err); host.querySelector('.kv-toy-still').hidden = false; };
  const art = new Image();
  art.crossOrigin = 'anonymous';
  art.src = c.print;
  Promise.all([import(THREE_URL), art.decode()]).then(([T3]) => plush3D(host, T3, art)).catch(fail);
}
function plush3D(host, T3, art){
  // текстура — лист макета с полями: неон, поверх — черная надпись макета (умножением белое становится неоном)
  const PAD = 120, K = 1.6;
  const cw = Math.round((PAGE[0] + PAD * 2) * K), ch = Math.round((PAGE[1] + PAD * 2) * K);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  g.fillStyle = NEON; g.fillRect(0, 0, cw, ch);
  g.globalCompositeOperation = 'multiply';
  g.drawImage(art, PAD * K, PAD * K, PAGE[0] * K, PAGE[1] * K);
  g.globalCompositeOperation = 'source-over';
  // точка 3D → место на текстуре
  const toU = x => (x / SC + PAGE[0] / 2 + PAD) / (PAGE[0] + PAD * 2);
  const toV = y => 1 - (PAGE[1] / 2 - y / SC + PAD) / (PAGE[1] + PAD * 2);
  const xs = [CA[0], CB[0], CC[0]], ys = [CA[1], CB[1], CC[1]];
  const tex = new T3.CanvasTexture(cv);
  tex.colorSpace = T3.SRGBColorSpace; tex.anisotropy = 8;

  // форма-подушка: контур снят с печатного макета (надпись по краю плюс поле до шва), высота — как у надутой ткани:
  // у края ткань уходит вниз круто, к середине ручки — плавно. Края сшиты с изнанкой.
  const poly = [];
  for (let i = 0; i < OUTLINE.length; i += 2) poly.push(w3([OUTLINE[i], OUTLINE[i + 1]]));
  const near = (x, y) => {   // ближайшая точка контура и расстояние до нее
    let best = Infinity, bx = 0, by = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], vx = q[0] - p[0], vy = q[1] - p[1];
      const t = clamp(((x - p[0]) * vx + (y - p[1]) * vy) / (vx * vx + vy * vy), 0, 1);
      const cx2 = p[0] + vx * t, cy2 = p[1] + vy * t, d = (x - cx2) ** 2 + (y - cy2) ** 2;
      if (d < best) { best = d; bx = cx2; by = cy2; }
    }
    return [Math.sqrt(best), bx, by];
  };
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const PUFF = .5, STEP = .026;
  const pxs = poly.map(p => p[0]), pys = poly.map(p => p[1]);
  const x0 = Math.min(...pxs) - .1, y0 = Math.min(...pys) - .1;
  const nx = Math.ceil((Math.max(...pxs) + .1 - x0) / STEP), ny = Math.ceil((Math.max(...pys) + .1 - y0) / STEP);
  const NN = (nx + 1) * (ny + 1);
  // клетки: 0 — вне игрушки, 1 — шов (точка лежит на контуре), 2 — внутри
  const kind = new Uint8Array(NN), gx = new Float32Array(NN), gy = new Float32Array(NN);
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const k = j * (nx + 1) + i, x = x0 + i * STEP, y = y0 + j * STEP, [d, bx, by] = near(x, y), inn = inside(x, y);
    if (!inn && d > STEP * 1.5) continue;
    if (!inn || d < STEP * .3) { kind[k] = 1; gx[k] = bx; gy[k] = by; }
    else { kind[k] = 2; gx[k] = x; gy[k] = y; }
  }
  // надуваем, как настоящую подушку: давление изнутри, шов держит края (уравнение Пуассона, релаксация)
  const h = new Float32Array(NN);
  const W1 = nx + 1, src = STEP * STEP;
  for (let it = 0; it < 260; it++) for (let k = W1; k < NN - W1; k++) {
    if (kind[k] !== 2) continue;
    const v = (h[k - 1] + h[k + 1] + h[k - W1] + h[k + W1] + src) / 4;
    h[k] += 1.9 * (v - h[k]);
  }
  let hmax = 0; for (let k = 0; k < NN; k++) if (h[k] > hmax) hmax = h[k];
  // корень дает крутой, круглый бок у шва и плоскую середину; пара сглаживаний убирает рябь у шва
  let zf = new Float32Array(NN);
  for (let k = 0; k < NN; k++) if (kind[k] === 2) zf[k] = Math.sqrt(Math.max(0, h[k] / hmax));
  for (let pass = 0; pass < 4; pass++) {
    const nz = zf.slice();
    for (let k = W1; k < NN - W1; k++) if (kind[k] === 2) nz[k] = (zf[k] * 4 + zf[k - 1] + zf[k + 1] + zf[k - W1] + zf[k + W1]) / 8;
    zf = nz;
  }
  const pos = [], idOf = new Int32Array(NN).fill(-1), rimOf = kind.map(v => v === 1 ? 1 : 0), back = new Int32Array(NN).fill(-1);
  for (let k = 0; k < NN; k++) {
    if (!kind[k]) continue;
    if (kind[k] === 1) { idOf[k] = back[k] = pos.length / 3; pos.push(gx[k], gy[k], 0); continue; }
    const z = PUFF * zf[k];
    idOf[k] = pos.length / 3; pos.push(gx[k], gy[k], z);
    back[k] = pos.length / 3; pos.push(gx[k], gy[k], -z);
  }
  const idx = [];
  const tri = (m, a, b, c, flip) => {
    if (m[a] < 0 || m[b] < 0 || m[c] < 0) return;
    if (rimOf[a] && rimOf[b] && rimOf[c]) return;
    flip ? idx.push(m[a], m[c], m[b]) : idx.push(m[a], m[b], m[c]);
  };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    tri(idOf, a, b, d, 0); tri(idOf, a, d, c, 0);
    tri(back, a, b, d, 1); tri(back, a, d, c, 1);
  }
  const geo = new T3.BufferGeometry();
  geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(toU(pos[i]), toV(pos[i + 1]));
  geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const base = Float32Array.from(pos), nrm = Float32Array.from(geo.attributes.normal.array);
  const P = geo.attributes.position;

  const mat = new T3.MeshPhysicalMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .32, roughness: .82, sheen: 1, sheenRoughness: .5, sheenColor: new T3.Color(NEON) });
  const toy = new T3.Mesh(geo, mat);
  const ringMesh = new T3.Mesh(new T3.TorusGeometry(.26, .045, 16, 48), new T3.MeshStandardMaterial({ color: 0xc8ccd2, metalness: .7, roughness: .3 }));
  // кольцо — на конце нижней ручки
  const dl = Math.hypot(CC[0] - CB[0], CC[1] - CB[1]), dir = [(CC[0] - CB[0]) / dl, (CC[1] - CB[1]) / dl];
  ringMesh.position.set(CC[0] + dir[0] * .92, CC[1] + dir[1] * .92, 0); ringMesh.rotation.set(0, .9, Math.atan2(dir[1], dir[0]));
  // шов-оверлок по краю: тонкий валик в черную строчку, как на настоящей игрушке
  const st = document.createElement('canvas'); st.width = 64; st.height = 32;
  const sg = st.getContext('2d');
  sg.fillStyle = NEON; sg.fillRect(0, 0, 64, 32);
  sg.strokeStyle = '#1b1b1b'; sg.lineWidth = 7;
  sg.beginPath(); sg.moveTo(8, -4); sg.lineTo(40, 36); sg.stroke();
  const stTex = new T3.CanvasTexture(st);
  stTex.colorSpace = T3.SRGBColorSpace; stTex.wrapS = stTex.wrapT = T3.RepeatWrapping;
  const curve = new T3.CatmullRomCurve3(poly.map(p => new T3.Vector3(p[0], p[1], 0)), true, 'centripetal');
  stTex.repeat.set(Math.round(curve.getLength() / .045), 1);
  const seam = new T3.Mesh(new T3.TubeGeometry(curve, 900, .038, 10, true),
    new T3.MeshStandardMaterial({ map: stTex, emissive: 0xffffff, emissiveMap: stTex, emissiveIntensity: .25, roughness: .9 }));
  const grp = new T3.Group(); grp.add(toy, seam, ringMesh); grp.position.set(.07, .06, 0);

  const renderer = new T3.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  const scene = new T3.Scene(); scene.add(grp);
  scene.add(new T3.HemisphereLight(0xffffff, 0x8a8a80, 1.15));
  const key = new T3.DirectionalLight(0xffffff, 2.8); key.position.set(-5, 4, 4); scene.add(key);
  const rim = new T3.DirectionalLight(0xffffff, 1.2); rim.position.set(4, -2, -3); scene.add(rim);
  const cam = new T3.PerspectiveCamera(30, 1, .1, 50); cam.position.set(0, 0, 8.6);
  host.appendChild(renderer.domElement);
  const cvs = renderer.domElement; cvs.className = 'kv-toy';
  const size = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(size).observe(host); size();

  // нажатие: вмятина там, куда нажали, игрушка сплющивается и отпружинивает
  const ray = new T3.Raycaster(), ptr = new T3.Vector2();
  const hit = new T3.Vector3(); let press = 0, vel = 0, target = 0, tiltX = 0, tiltY = 0, mx = 0, my = 0;
  const pick = e => {
    const r = cvs.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    mx = ptr.x; my = ptr.y;
    ray.setFromCamera(ptr, cam);
    const h = ray.intersectObject(toy)[0];
    if (h) hit.copy(toy.worldToLocal(h.point.clone()));
    return !!h;
  };
  // подсказка: полупрозрачная рука нажимает на правую часть кавычки, та сминается; пропадает, когда нажмут сами
  const tapHand = document.createElement('i'), ring = document.createElement('i');
  tapHand.className = 'kv-tap'; tapHand.setAttribute('aria-hidden', 'true'); tapHand.innerHTML = TAP;
  ring.className = 'kv-tap-ring'; ring.setAttribute('aria-hidden', 'true');
  host.append(ring, tapHand);
  const spots = [[.78, .62], [.72, .66]].map(([t, lane], i) => {
    // точки на ручках ближе к правому краю: верхняя и нижняя
    const E = i ? CC : CA;
    return new T3.Vector3(CB[0] + (E[0] - CB[0]) * t, CB[1] + (E[1] - CB[1]) * t, .45);
  });
  let demo = !still(), spot = 0;
  const demoT = [];
  const stopDemo = () => { demo = false; demoT.forEach(clearTimeout); tapHand.classList.remove('on', 'down'); ring.classList.remove('go'); };
  const toScreen = v => {
    const w = toy.localToWorld(v.clone()).project(cam);
    return [(w.x + 1) / 2 * 100, (1 - w.y) / 2 * 100];
  };
  const tapLoop = () => {
    if (!demo) return;
    const v = spots[spot++ % spots.length], [x, y] = toScreen(v);
    tapHand.style.transition = 'none';
    tapHand.style.left = x + 8 + '%'; tapHand.style.top = y + 10 + '%';
    tapHand.getBoundingClientRect(); tapHand.style.transition = '';
    tapHand.classList.add('on'); tapHand.style.left = x + '%'; tapHand.style.top = y + '%';
    demoT.push(setTimeout(() => {
      if (!demo) return;
      tapHand.classList.add('down');
      ring.style.left = x + '%'; ring.style.top = y + '%';
      ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go');
      hit.copy(v); target = 1;
    }, 750));
    demoT.push(setTimeout(() => { if (demo) { target = 0; tapHand.classList.remove('down'); } }, 1250));
    demoT.push(setTimeout(() => { if (demo) tapHand.classList.remove('on'); }, 1700));
    demoT.push(setTimeout(tapLoop, 3600));
  };
  cvs.addEventListener('pointerdown', e => { stopDemo(); if (pick(e)) { target = 1; cvs.setPointerCapture(e.pointerId); cvs.classList.add('held'); } });
  cvs.addEventListener('pointermove', e => { if (target) pick(e); else if (e.pointerType === 'mouse') { const r = cvs.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = -(e.clientY - r.top) / r.height * 2 + 1; } });
  const up = () => { target = 0; cvs.classList.remove('held'); };
  cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);
  cvs.addEventListener('pointerleave', () => { mx = my = 0; });

  const SIG = .52, DENT = .72;
  const deform = () => {
    const a = P.array, sq = 1 - .22 * press, wide = 1 + .06 * press;
    for (let i = 0; i < a.length; i += 3) {
      const bx = base[i], by = base[i + 1], bz = base[i + 2];
      const dx = bx - hit.x, dy = by - hit.y, dz = bz - hit.z;
      // шов держит форму: у самого края вмятины нет
      const f = bz === 0 ? 0 : Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * SIG * SIG)) * press * DENT;
      a[i] = (bx - nrm[i] * f) * wide; a[i + 1] = (by - nrm[i + 1] * f) * wide; a[i + 2] = (bz - nrm[i + 2] * f) * sq;
    }
    P.needsUpdate = true; geo.computeVertexNormals();
    seam.scale.set(wide, wide, 1);
  };
  let raf = 0, seen = false, last = 0, frame = 0, settled = false;
  const tick = t => {
    const dt = Math.min(48, t - (last || t)) / 1000; last = t;
    // пружина: нажали — вминается, отпустили — пару раз колыхнется
    vel += ((target - press) * 120 - vel * 9) * dt; press += vel * dt;
    if (Math.abs(press) > .002 || Math.abs(vel) > .01) { deform(); settled = false; }
    else if (!settled) { press = 0; vel = 0; deform(); settled = true; }
    tiltY += (mx * .45 + Math.sin(t / 1600) * .12 - tiltY) * .06;
    tiltX += (-my * .3 - tiltX) * .06;
    // игрушка чуть подается под пальцем, как будто ее толкнули
    grp.rotation.set(tiltX - hit.y * .1 * press, tiltY + hit.x * .1 * press, 0);
    renderer.render(scene, cam);
    if (seen) raf = requestAnimationFrame(tick);
  };
  if (still()) { renderer.render(scene, cam); return; }
  let demoOn = false;
  onScreen(host, v => {
    if (v && !demoOn && demo) { demoOn = true; setTimeout(tapLoop, 900); }
    if (v && !seen) { seen = true; last = 0; raf = requestAnimationFrame(tick); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- лукбук: коллаж, ролики — маленькие, парой в одной ячейке ---------- */
function lookHTML(c){
  const vids = c.items.filter(it => typeof it !== 'string');
  const pics = c.items.filter(it => typeof it === 'string');
  const cell = (src, i) => `<div class="kv-cell kv-c${i}">${shot(src)}</div>`;
  return `<div class="kv-look">
    ${pics.slice(0, 5).map(cell).join('')}
    ${vids.length ? `<div class="kv-cell kv-panel kv-vids">${vids.map(v => `<div class="kv-mini">${loopVideo(v.video, v.poster)}</div>`).join('')}</div>` : ''}
    ${pics.slice(5).map((s, i) => cell(s, i + 5)).join('')}
  </div>${cap(c.hint)}`;
}
function liveLook(box){ zoomable(box); liveVideos(box); }

const KINDS = {
  pins:   [pinsHTML, livePins, true],   // true — заголовок и текст главы внутри панели, справа от футболки
  pocket: [pocketHTML, livePocket],
  loupe:  [loupeHTML, liveLoupe],
  printer: [labelHTML, liveLabel],
  plush:  [plushHTML, livePlush],
  look:   [lookHTML, liveLook],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'kav.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountKav(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const kinds = p.kav.map(ch => Object.keys(KINDS).find(k => ch[k]));
  mount.innerHTML = p.kav.map((ch, i) =>
    `<section class="kv-ch wrap kv-${kinds[i]}-ch">${kinds[i] && KINDS[kinds[i]][2] ? '' : head(ch)}<div class="kv-viz">${kinds[i] ? KINDS[kinds[i]][0](ch[kinds[i]], ch) : ''}</div></section>`).join('');
  mount.querySelectorAll('.kv-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.kv-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.kv-viz'), p.kav[i][k]); });
}
