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
    if (on && !still()) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
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
const PSD = `<g fill="none" stroke="#141414" stroke-width="2.6" stroke-linejoin="round"><path d="M38 20h30l14 14v36H38z"/><path d="M68 20v14h14"/><rect x="30" y="44" width="38" height="18" rx="4" fill="${NEON}"/></g>
  <text x="49" y="58" text-anchor="middle" font-size="13" font-weight="700" fill="#141414">PSD</text>`;
// неровный контур лоскута: у каждого свой, углы и середины сторон чуть гуляют
function blob(i, inset){
  let k = i * 9301 + 49297;
  const rnd = () => (k = (k * 233280 + 1) % 2147483647) / 2147483647 - .5;
  const a = inset, b = 120 - inset, j = 9;
  const pts = [[a, a], [60, a], [b, a], [b, 60], [b, b], [60, b], [a, b], [a, 60]].map(([x, y]) => [x + rnd() * j, y + rnd() * j]);
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
}
function patchSVG(it, i){
  const lines = it.text ? it.text.split('\n') : [];
  const fs = 15, lh = 17, y0 = 62 - (lines.length - 1) * lh / 2;
  const body = it.psd
    ? `${PSD}<text x="60" y="94" text-anchor="middle" font-size="15" font-weight="700" fill="#141414">${esc(it.psd)}</text>`
    : lines.map((l, i) => `<text x="60" y="${y0 + i * lh}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#141414">${esc(l)}</text>`).join('');
  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <path d="${blob(i, 11)}" fill="none" stroke="#EEFF6A" stroke-width="9" stroke-dasharray=".7 1.8" filter="url(#kvFluff)"/>
    <path d="${blob(i, 13)}" fill="${NEON}" filter="url(#kvEdge)"/>
    <g dominant-baseline="middle" font-family="Golos Text, system-ui, sans-serif">${body}</g>
    ${PIN(14, 18, -28)}${PIN(82, 104, 18)}
  </svg>`;
}
function pinsHTML(c, ch){
  return `<div class="kv-panel kv-pins">
    ${FRAY}
    <div class="kv-board">
      <img src="${c.bg}" alt="" draggable="false">
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
  ${c.photos ? `<div class="kv-row">${c.photos.map(s => shot(s)).join('')}</div>` : ''}`;
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
    place(p, 14 + Math.random() * 72, 30 + Math.random() * 62, Math.round(Math.random() * 50 - 25));
    p.style.zIndex = ++z;
  });
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

/* ---------- брелок: мягкая кавычка в 3D, от нажатия сминается, по краю бежит надпись ---------- */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
// середина кавычки: ручка A → угол B → ручка C; толщина ручки 2R
const CA = [1.12, 1.3], CB = [-0.96, 0], CC = [1.12, -1.3], CR = 0.8;
// контур на расстоянии d от средней линии: точки по кругу (по часовой, если смотреть спереди)
function outline(d, n = 24){
  const nr = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [dy / l, -dx / l]; };
  const n1 = nr(CA, CB), n2 = nr(CB, CC);
  const o = (p, nn, s) => [p[0] + nn[0] * d * s, p[1] + nn[1] * d * s];
  const a1 = o(CA, n1, -1), b1 = o(CB, n1, -1), b2 = o(CB, n2, -1), c2 = o(CC, n2, -1);
  const x1 = b1[0] - a1[0], y1 = b1[1] - a1[1], x2 = c2[0] - b2[0], y2 = c2[1] - b2[1];
  const t = ((b2[0] - a1[0]) * y2 - (b2[1] - a1[1]) * x2) / (x1 * y2 - y1 * x2);
  const I = [a1[0] + x1 * t, a1[1] + y1 * t];
  const arc = (c, f, to) => {   // дуга вокруг c от угла f к углу to, обе по кратчайшему внешнему пути
    const out = [];
    let da = to - f;
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    for (let i = 1; i < n; i++) { const a = f + da * i / n; out.push([c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d]); }
    return out;
  };
  const ang = v => Math.atan2(v[1], v[0]);
  // наружная сторона: +n1 вдоль A→B, скругление вокруг B, +n2 вдоль B→C; концы — полукруги
  const pts = [o(CA, n1, 1), o(CB, n1, 1), ...arc(CB, ang(n1), ang(n2)), o(CB, n2, 1), o(CC, n2, 1)];
  const capC = []; for (let i = 1; i < n; i++) { const a = ang(n2) + Math.PI * i / n; capC.push([CC[0] + Math.cos(a) * d, CC[1] + Math.sin(a) * d]); }
  pts.push(...capC, o(CC, n2, -1), I, o(CA, n1, -1));
  for (let i = 1; i < n; i++) { const a = ang(n1) + Math.PI + Math.PI * i / n; pts.push([CA[0] + Math.cos(a) * d, CA[1] + Math.sin(a) * d]); }
  // по часовой (площадь со знаком < 0 при оси y вверх)
  let area = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; });
  return area > 0 ? pts.reverse() : pts;
}
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
  import(THREE_URL).then(T3 => plush3D(host, T3, H.pick(c.ring))).catch(err => {
    console.warn('3D-брелок не загрузился', err);
    host.querySelector('.kv-toy-still').hidden = false;
  });
}
function plush3D(host, T3, ring){
  const N = 1024;
  // текстура: неон, строчка по краю, надпись по контуру и название вдоль верхней ручки
  const pts0 = outline(CR);
  const xs = pts0.map(p => p[0]), ys = pts0.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const S = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + .2;
  const px = (x, y) => [(x - cx) / S * N + N / 2, N / 2 - (y - cy) / S * N];
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d');
  const FONT = '"Golos Text", system-ui, sans-serif';
  // путь для бегущей надписи: контур ближе к краю, с длинами
  const path = outline(CR - .2, 18).map(p => px(...p));
  path.push(path[0]);
  const lens = [0]; for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const L = lens[lens.length - 1];
  const fs = 54;   // крупная надпись по бокам
  g.font = `500 ${fs}px ${FONT}`;
  const unitRaw = g.measureText(ring + '   ').width;
  const k = Math.max(1, Math.round(L / unitRaw)), unit = L / k, stretch = unit / unitRaw;
  const at = s => {
    s = ((s % L) + L) % L;
    let i = 1; while (lens[i] < s) i++;
    const a = path[i - 1], b = path[i], t = (s - lens[i - 1]) / (lens[i] - lens[i - 1]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  const chars = [...(ring + '   ')].map(ch => [ch, g.measureText(ch).width * stretch]);
  const draw = off => {
    g.fillStyle = NEON; g.fillRect(0, 0, N, N);
    // строчка по краю
    g.strokeStyle = '#141414'; g.lineWidth = 4; g.setLineDash([3, 12]); g.lineCap = 'round';
    g.beginPath(); outline(CR - .07, 18).forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](...px(...p))); g.closePath(); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#141414'; g.font = `500 ${fs}px ${FONT}`; g.textBaseline = 'middle'; g.textAlign = 'center';
    for (let r = 0, s = off; r < k; r++) for (const [ch, w] of chars) {
      const [x, y, a] = at(s + w / 2);
      g.save(); g.translate(x, y); g.rotate(a); g.fillText(ch, 0, 0); g.restore();
      s += w;
    }
    // название — вдоль верхней ручки
    const m = px((CA[0] + CB[0]) / 2 + .02, (CA[1] + CB[1]) / 2 + .14);
    g.save(); g.translate(...m); g.rotate(-Math.atan2(CA[1] - CB[1], CA[0] - CB[0]));
    g.textAlign = 'left';
    g.font = `400 64px ${FONT}`; g.fillText('одна', -140, -36);
    g.font = `800 76px ${FONT}`; g.fillText('кавычка', -165, 36);
    g.restore();
  };
  draw(0);
  const tex = new T3.CanvasTexture(cv);
  tex.colorSpace = T3.SRGBColorSpace; tex.anisotropy = 4;

  // форма: тонкая кавычка, вокруг нее — толстая скругленная фаска, получается подушка
  // контур дробим часто и ровно: длинные прямые грани иначе не могут прогнуться и ломаются складкой
  const dense = (pts, step) => pts.flatMap((p, i) => {
    const q = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
    return Array.from({ length: n }, (_, j) => [p[0] + (q[0] - p[0]) * j / n, p[1] + (q[1] - p[1]) * j / n]);
  });
  const shape = new T3.Shape(dense(outline(.12, 10), .05).map(p => new T3.Vector2(...p)));
  let geo = new T3.ExtrudeGeometry(shape, { depth: .02, bevelEnabled: true, bevelThickness: .42, bevelSize: CR - .12, bevelSegments: 18, curveSegments: 4 });
  geo.translate(0, 0, -.01);
  // склеиваем одинаковые точки, чтобы ткань гнулась плавно
  const src = geo.attributes.position, map = new Map(), pos = [], idx = [];
  for (let i = 0; i < src.count; i++) {
    const x = src.getX(i), y = src.getY(i), z = src.getZ(i);
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    let j = map.get(key);
    if (j == null) { j = pos.length / 3; map.set(key, j); pos.push(x, y, z); }
    idx.push(j);
  }
  geo.dispose();
  geo = new T3.BufferGeometry();
  geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push((pos[i] - cx) / S + .5, (pos[i + 1] - cy) / S + .5);
  geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const base = Float32Array.from(pos), nrm = Float32Array.from(geo.attributes.normal.array);
  const P = geo.attributes.position;

  const mat = new T3.MeshPhysicalMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .32, roughness: .82, sheen: 1, sheenRoughness: .5, sheenColor: new T3.Color(NEON) });
  const toy = new T3.Mesh(geo, mat);
  const ringMesh = new T3.Mesh(new T3.TorusGeometry(.26, .045, 16, 48), new T3.MeshStandardMaterial({ color: 0xc8ccd2, metalness: .7, roughness: .3 }));
  ringMesh.position.set(CC[0] + .74, CC[1] - .58, 0); ringMesh.rotation.set(0, .9, .6);
  const grp = new T3.Group(); grp.add(toy, ringMesh); grp.position.x = -.12;

  const renderer = new T3.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  const scene = new T3.Scene(); scene.add(grp);
  scene.add(new T3.HemisphereLight(0xffffff, 0x8a8a80, 1.15));
  const key = new T3.DirectionalLight(0xffffff, 2.8); key.position.set(-5, 4, 4); scene.add(key);
  const rim = new T3.DirectionalLight(0xffffff, 1.2); rim.position.set(4, -2, -3); scene.add(rim);
  const cam = new T3.PerspectiveCamera(30, 1, .1, 50); cam.position.set(0, 0, 10.5);
  host.appendChild(renderer.domElement);
  const cvs = renderer.domElement; cvs.className = 'kv-toy';
  const size = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(size).observe(host); size();

  // нажатие: вмятина там, куда нажали, игрушка сплющивается и отпружинивает
  const ray = new T3.Raycaster(), ptr = new T3.Vector2();
  const hit = new T3.Vector3(); let press = 0, vel = 0, target = 0, tiltX = 0, tiltY = 0, mx = 0, my = 0, off = 0, speed = .9;
  const pick = e => {
    const r = cvs.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    mx = ptr.x; my = ptr.y;
    ray.setFromCamera(ptr, cam);
    const h = ray.intersectObject(toy)[0];
    if (h) hit.copy(toy.worldToLocal(h.point.clone()));
    return !!h;
  };
  cvs.addEventListener('pointerdown', e => { if (pick(e)) { target = 1; speed = 4; cvs.setPointerCapture(e.pointerId); cvs.classList.add('held'); } });
  cvs.addEventListener('pointermove', e => { if (target) pick(e); else if (e.pointerType === 'mouse') { const r = cvs.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = -(e.clientY - r.top) / r.height * 2 + 1; } });
  const up = () => { target = 0; speed = .9; cvs.classList.remove('held'); };
  cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);
  cvs.addEventListener('pointerleave', () => { mx = my = 0; });

  const SIG = .68, DENT = .6;
  const deform = () => {
    const a = P.array, sq = 1 - .22 * press, wide = 1 + .06 * press;
    for (let i = 0; i < a.length; i += 3) {
      const bx = base[i], by = base[i + 1], bz = base[i + 2];
      const dx = bx - hit.x, dy = by - hit.y, dz = bz - hit.z;
      const f = Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * SIG * SIG)) * press * DENT;
      a[i] = (bx - nrm[i] * f) * wide; a[i + 1] = (by - nrm[i + 1] * f) * wide; a[i + 2] = (bz - nrm[i + 2] * f) * sq;
    }
    P.needsUpdate = true; geo.computeVertexNormals();
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
    off += speed * 60 * dt;
    if (frame++ % 2 === 0) { draw(off); tex.needsUpdate = true; }
    renderer.render(scene, cam);
    if (seen) raf = requestAnimationFrame(tick);
  };
  if (still()) { renderer.render(scene, cam); return; }
  onScreen(host, v => {
    if (v && !seen) { seen = true; last = 0; raf = requestAnimationFrame(tick); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
  // шрифт мог догрузиться позже — перерисуем надпись
  document.fonts?.ready.then(() => { draw(off); tex.needsUpdate = true; renderer.render(scene, cam); });
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
