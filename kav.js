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
function pinsHTML(c){
  return `<div class="kv-pins">
    ${FRAY}
    <div class="kv-board" style="--bg:url('${c.bg}')">
      <img src="${c.bg}" alt="" draggable="false">
      ${c.items.map((it, i) => `<div class="kv-pin" data-i="${i}" style="left:${it.x}%;top:${it.y}%;--r:${it.r || 0}deg" aria-hidden="true">${patchSVG(it, i)}</div>`).join('')}
    </div>
    <div class="kv-pins-bar">
      <button class="btn btn-line kv-shuffle"><span class="spell">${H.T(c.shuffle)}</span></button>
      <button class="btn btn-line kv-reset"><span class="spell">${H.T(c.reset)}</span></button>
    </div>
    ${cap(c.hint)}
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
  const presets = H.pick(c.presets);
  return `<div class="kv-print">
    <div class="kv-desk">
      <div class="kv-holder">
        <i class="kv-hang" aria-hidden="true"></i>
        <div class="kv-win"><div class="kv-paper">${logoPaper(c)}</div></div>
      </div>
    </div>
    <div class="kv-ctrl">
      <div class="kv-presets">
        <button class="kv-pre on" data-logo="1">${H.T(c.logoName)}</button>
        ${presets.map(t => `<button class="kv-pre" data-t="${esc(t)}">${esc(t.replace(/\n/g, ' '))}</button>`).join('')}
      </div>
      <form class="kv-form">
        <input class="kv-input" maxlength="40" placeholder="${esc(H.pick(c.placeholder))}" aria-label="${esc(H.pick(c.placeholder))}">
        <button class="btn btn-line" type="submit"><span class="spell">${H.T(c.button)}</span></button>
      </form>
      ${c.video ? `<figure class="kv-mini">${loopVideo(c.video, c.poster)}<figcaption>${H.T(c.videoCap)}</figcaption></figure>` : ''}
    </div>
  </div>${cap(c.hint)}`;
}
function liveLabel(box, c){
  const win = box.querySelector('.kv-win'), pres = [...box.querySelectorAll('.kv-pre')];
  const form = box.querySelector('.kv-form'), input = box.querySelector('.kv-input');
  let busy = Promise.resolve();
  // подгоняем кегль, чтобы слова влезли в окошко лейбла
  const fit = el => {
    const t = el.querySelector('.kv-words');
    if (!t) return;
    // сначала строки как написаны; если длинная строка не влезает и в 22px — пусть переносится
    const W = el.clientWidth * .8, Hh = el.clientHeight - el.clientWidth * .2;
    const over = () => t.scrollWidth > W + 1 || t.scrollHeight > Hh + 1;
    let s = 44;
    t.style.whiteSpace = 'nowrap'; t.style.fontSize = s + 'px';
    while (s > 22 && over()) t.style.fontSize = --s + 'px';
    if (over()) { t.style.whiteSpace = 'normal'; while (s > 14 && over()) t.style.fontSize = --s + 'px'; }
  };
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
  // короткие слова (предлоги, союзы) держатся за следующим, чтобы не висеть в конце строки
  const glue = t => t.replace(/(^|\s)([а-яёa-z]{1,2}) /gi, '$1$2\u00a0');
  const words = t => `<div class="kv-words">${glue(glue(esc(t))).replace(/\n/g, '<br>')}</div>`;
  pres.forEach(b => b.addEventListener('click', () => {
    pres.forEach(x => x.classList.toggle('on', x === b));
    print(b.dataset.logo ? logoPaper(c) : words(b.dataset.t));
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) { input.focus(); return; }
    pres.forEach(x => x.classList.remove('on'));
    print(words(t.toLowerCase()));
    input.value = '';
  });
  liveVideos(box);
}

/* ---------- брелок: мягкая кавычка, по краю бежит надпись, от нажатия мнется ---------- */
// контур кавычки: середина ручки A → B (угол) → C, толщина 2r; надпись идет по часовой, чтобы читалась
function chevOutline(d){
  const A = [312, 70], B = [104, 200], C = [312, 330];
  const nr = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
  const n1 = nr(A, B), n2 = nr(B, C);
  const o = (p, n, s) => [p[0] + n[0] * d * s, p[1] + n[1] * d * s];
  // внутренний угол: пересечение смещенных внутрь сторон
  const a1 = o(A, n1, -1), b1 = o(B, n1, -1), b2 = o(B, n2, -1), c2 = o(C, n2, -1);
  const x1 = b1[0] - a1[0], y1 = b1[1] - a1[1], x2 = c2[0] - b2[0], y2 = c2[1] - b2[1];
  const t = ((b2[0] - a1[0]) * y2 - (b2[1] - a1[1]) * x2) / (x1 * y2 - y1 * x2);
  const I = [a1[0] + x1 * t, a1[1] + y1 * t];
  const P = p => p.map(v => v.toFixed(1)).join(' ');
  const R = `A${d} ${d} 0 0 1`;
  return `M${P(o(B, n1, 1))}L${P(o(A, n1, 1))}${R} ${P(o(A, n1, -1))}L${P(I)}L${P(o(C, n2, -1))}${R} ${P(o(C, n2, 1))}L${P(o(B, n2, 1))}${R} ${P(o(B, n1, 1))}Z`;
}
function plushHTML(c){
  const ring = H.pick(c.ring);
  return `<div class="kv-plush">
    <div class="kv-toy-box">
      <svg class="kv-toy" viewBox="0 0 400 400" role="img" aria-label="${esc(ring)}">
        <defs><path id="kvRing" d="${chevOutline(66)}"/></defs>
        <g class="kv-squish">
          <path d="${chevOutline(80)}" fill="${NEON}" stroke="#141414" stroke-width="2.4" stroke-dasharray="2 5" stroke-linecap="round"/>
          <path d="${chevOutline(80)}" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="10" transform="translate(0 4)" opacity=".5"/>
          <text class="kv-ring" font-size="15" font-weight="500" fill="#141414"><textPath href="#kvRing" startOffset="0">${esc(ring)}</textPath></text>
          <g transform="translate(212 128) rotate(-32)" font-family="Golos Text, system-ui, sans-serif" fill="#141414">
            <text x="0" y="0" font-size="34" font-weight="400">одна</text>
            <text x="-8" y="38" font-size="38" font-weight="800">кавычка</text>
          </g>
        </g>
        <g class="kv-ringlet" fill="none" stroke="#9AA0A6" stroke-width="5"><circle cx="388" cy="386" r="16"/></g>
      </svg>
    </div>
    <div class="kv-plush-side">
      ${c.photos.map(s => shot(s)).join('')}
      ${c.video ? `<figure class="kv-mini">${loopVideo(c.video, c.poster)}</figure>` : ''}
    </div>
  </div>${cap(c.hint)}`;
}
function livePlush(box){
  const svg = box.querySelector('.kv-toy'), g = box.querySelector('.kv-squish');
  const tp = box.querySelector('textPath'), ring = box.querySelector('.kv-ring');
  // повторяем надпись, чтобы она закрывала весь контур и еще один круг сверху
  const path = box.querySelector('#kvRing'), L = path.getTotalLength();
  const one = tp.textContent + '\u00a0\u00a0\u00a0';
  tp.textContent = one;
  // надпись растягиваем так, чтобы на контур ложилось целое число повторов — тогда круг замыкается без шва
  const k = Math.max(1, Math.round(L / (ring.getComputedTextLength() || 220)));
  const unit = L / k;
  tp.textContent = one.repeat(k + 1);
  ring.setAttribute('textLength', (unit * (k + 1)).toFixed(1));
  ring.setAttribute('lengthAdjust', 'spacing');
  // мнется пружиной: нажатие сплющивает в сторону пальца, отпустили — отпружинивает
  let sx = 1, sy = 1, vx = 0, vy = 0, tx = 1, ty = 1, ox = 200, oy = 200, off = 0, speed = .03, raf = 0, seen = false, last = 0;
  const press = e => {
    const r = svg.getBoundingClientRect();
    ox = (e.clientX - r.left) / r.width * 400; oy = (e.clientY - r.top) / r.height * 400;
    tx = 1.08; ty = .86; speed = .12;
    svg.setPointerCapture?.(e.pointerId);
  };
  const release = () => { tx = 1; ty = 1; speed = .03; };
  svg.addEventListener('pointerdown', press);
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', release);
  svg.addEventListener('pointerleave', release);
  const draw = t => {
    const dt = Math.min(48, t - (last || t)); last = t;
    vx = (vx + (tx - sx) * .18) * .78; vy = (vy + (ty - sy) * .18) * .78;
    sx += vx; sy += vy;
    g.setAttribute('transform', `translate(${ox} ${oy}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-ox} ${-oy})`);
    off = (off + speed * dt) % unit;
    tp.setAttribute('startOffset', (-off).toFixed(1));
    if (seen) raf = requestAnimationFrame(draw);
  };
  zoomable(box);
  liveVideos(box);
  if (still()) return;
  onScreen(svg, v => {
    if (v && !seen) { seen = true; last = 0; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- лукбук: кадры и короткие ролики вперемешку ---------- */
function lookHTML(c){
  return `<div class="kv-look">${c.items.map(it => typeof it === 'string' ? shot(it)
    : `<figure class="kv-mini kv-look-vid">${loopVideo(it.video, it.poster)}</figure>`).join('')}</div>${cap(c.hint)}`;
}
function liveLook(box){ zoomable(box); liveVideos(box); }

const KINDS = {
  pins:   [pinsHTML, livePins],
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
    `<section class="kv-ch wrap kv-${kinds[i]}-ch">${head(ch)}<div class="kv-viz">${kinds[i] ? KINDS[kinds[i]][0](ch[kinds[i]]) : ''}</div></section>`).join('');
  mount.querySelectorAll('.kv-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.kv-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.kv-viz'), p.kav[i][k]); });
}
