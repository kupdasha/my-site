/* ================================================================
   КЕЙС «THE VENTURES JAPAN» (поле ventures у проекта)
   Шапка кейса — живой принт: плитки с веткой сакуры едут от подола
   вверх и тают, как на футболке; нажатие переворачивает
   футболку (перед — логотип, спина — слоган и award).
   Главы: tile — одна плитка и десять шагов уменьшения;
   look — съемка, по нажатию крупно; tokyo — фото с мероприятия.
   Векторы сняты из макета в Figma: img/ventures/*.svg.
   Тексты — в content.js, оформление — ventures.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- геометрия узора — как в макете ---------- */
// одна «колонка» принта: 10 плиток по дуге от края к середине, каждая меньше и повернута на 2° сильнее
const COL_X = [0, 55.5, 109.2, 161, 210.6, 258, 302.8, 345, 384.3, 420.7];
const COL_Y = [0, 24.1, 52, 83.5, 118.7, 157.2, 199.1, 244.2, 292.4, 343.5];
const STEP_X = 93.7;           // шаг колонок по горизонтали
const BIG = 67, SMALL = 0.7;   // размер плитки у края и в середине
const FRAME_H = 618;           // высота принта; полоса плиток — нижние 344, как у подола футболки
const BLUE = '#3044FF';        // фирменный синий из макета
// фон принта: синий → белый → белый → синий (стопы из макета)
const STOPS = [[0, BLUE], [0.27, '#FFFFFF'], [0.47, '#FFFFFF'], [0.92, BLUE]];

// точка на колонке: u = 0 — край принта, u = 1 — середина; за краем продолжаем первый отрезок
function colAt(u){
  const f = u * 9, i = clamp(Math.floor(f), 0, 8), t = f - i;
  return {
    x: COL_X[i] + (COL_X[i + 1] - COL_X[i]) * t,
    y: COL_Y[i] + (COL_Y[i + 1] - COL_Y[i]) * t,
    s: BIG + (SMALL - BIG) * u,
    r: -18 * u * Math.PI / 180,
  };
}

let tileImg;
function loadTile(){
  if (!tileImg) tileImg = new Promise(res => {
    const im = new Image();
    im.onload = () => res(im); im.onerror = () => res(null);
    im.src = H.base + 'img/ventures/tile.svg?v=' + VERS;
  });
  return tileImg;
}

/* ---------- шапка: живой принт ---------- */
function posterHTML(c){
  return `<div class="vn-poster" role="button" tabindex="0" aria-label="${H.T(c.hint)}">
    <canvas class="vn-canvas" aria-hidden="true"></canvas>
    <div class="vn-side vn-front"><img class="vn-logo" src="${H.base}img/ventures/logo.svg" alt="The Ventures Japan 2026"></div>
    <div class="vn-side vn-back">
      <img class="vn-award" src="${H.base}img/ventures/award.svg" alt="Global Startup Award">
      <img class="vn-slogan" src="${H.base}img/ventures/slogan.svg" alt="Pitch in Tokyo. Win Globally.">
    </div>
    <span class="vn-flip"><b class="vn-f">${H.T(c.front)}</b><i></i><b class="vn-b">${H.T(c.back)}</b></span>
  </div>`;
}

async function livePoster(box, c){
  const cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
  const tile = await loadTile();
  let W = 0, Hh = 0, k = 1, dpr = 1, sprite = null;
  let phase = 0, last = 0, raf = 0, visible = false;
  let mx = -1e4, my = -1e4, near = 0;   // курсор: плитки рядом с ним раскрываются

  function size(){
    const r = box.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; Hh = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
    k = Hh / FRAME_H;
    // плитка один раз рисуется в спрайт крупно — потом только масштабируется
    if (tile){
      const px = Math.ceil(BIG * k * dpr * 1.5);
      sprite = document.createElement('canvas'); sprite.width = sprite.height = px;
      sprite.getContext('2d').drawImage(tile, 0, 0, px, px * 49 / 50);
    }
    draw();
  }

  function band(flip){
    // колонки идут с шагом STEP_X; лишние слева — чтобы дуги заходили в кадр
    const cols = Math.ceil((W / k + 440) / STEP_X) + 1;
    for (let j = 0; j < cols; j++){
      const x0 = j * STEP_X - 430;
      for (let n = -1; n < 10; n++){
        const u = (n + phase) / 9;
        if (u > 1) continue;
        const p = colAt(u);
        let s = p.s * k;
        if (s < 0.4) continue;
        let cx = (x0 + p.x + p.s / 2) * k, cy = (p.y + p.s / 2) * k;
        if (flip){ cx = W - cx; cy = Hh - cy; }
        if (near > 0.01){
          const d = Math.hypot(cx - mx, cy - my), R = 170;
          if (d < R) s *= 1 + 0.45 * near * (1 - d / R) ** 2;
        }
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(p.r + (flip ? Math.PI : 0));
        ctx.drawImage(sprite, -s / 2, -s / 2, s, s * 49 / 50);
        ctx.restore();
      }
    }
  }

  function draw(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, Hh);
    STOPS.forEach(([o, col]) => g.addColorStop(o, col));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
    if (!sprite) return;
    band(true);   // плитки только снизу: у подола крупные, к груди тают
  }

  function tick(t){
    raf = 0;
    const dt = last ? Math.min(t - last, 60) : 16; last = t;
    phase = (phase + dt / 2400) % 1;   // одна плитка проезжает свой шаг за 2,4 секунды
    near += ((mx > -1e3 ? 1 : 0) - near) * 0.08;
    draw();
    if (visible && !still()) raf = requestAnimationFrame(tick);
  }
  const run = () => { if (!raf && visible && !still()){ last = 0; raf = requestAnimationFrame(tick); } };

  new ResizeObserver(size).observe(box);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(box);
  box.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = box.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    if (still()) { near = 1; draw(); }
  });
  box.addEventListener('pointerleave', () => { mx = my = -1e4; if (still()) { near = 0; draw(); } });

  // перед ⇄ спина: по нажатию и сами, пока блок не трогали
  let auto = 0, touched = false;
  const flip = () => box.classList.toggle('back');
  box.addEventListener('click', () => { touched = true; clearInterval(auto); flip(); });
  box.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); box.click(); } });
  new IntersectionObserver(([e]) => {
    clearInterval(auto);
    if (e.isIntersecting && !touched && !still()) auto = setInterval(flip, 4200);
  }).observe(box);
}

/* ---------- глава: плитка и десять шагов ---------- */
function tileHTML(c){
  const steps = COL_X.map((_, i) => colAt(i / 9).s);
  return `<div class="vn-tile">
    <div class="vn-tile-big"><img src="${H.base}img/ventures/tile.svg" alt=""></div>
    <div class="vn-steps">${steps.map((s, i) =>
      `<span style="--s:${(s / BIG).toFixed(3)};--r:${(-2 * i)}deg;--i:${i}"><img src="${H.base}img/ventures/tile.svg" alt=""></span>`).join('')}</div>
  </div>${c.caption ? `<p class="vn-cap">${H.T(c.caption)}</p>` : ''}`;
}

/* ---------- глава: съемка, по нажатию крупно ---------- */
function lookHTML(c){
  return `<div class="vn-look">${c.items.map((src, i) =>
    `<button class="vn-shot" data-i="${i}" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>
    ${c.hint ? `<p class="vn-cap">${H.T(c.hint)}</p>` : ''}`;
}
function liveLook(box, c){
  const imgs = [...box.querySelectorAll('.vn-shot img')];
  box.querySelectorAll('.vn-shot').forEach((b, i) =>
    b.addEventListener('click', () => H.openViewer(c.items, i, imgs)));
}

/* ---------- глава: Токио ---------- */
function tokyoHTML(c){
  return `<div class="vn-tokyo">${c.items.map((it, i) =>
    `<figure style="--ar:${it.ratio}"><button class="vn-shot" data-i="${i}" aria-label="Увеличить"><img src="${it.src}" alt="" loading="lazy"></button>
      <figcaption>${H.T(it.caption)}</figcaption></figure>`).join('')}</div>`;
}
function liveTokyo(box, c){
  const list = c.items.map(x => x.src), imgs = [...box.querySelectorAll('.vn-shot img')];
  box.querySelectorAll('.vn-shot').forEach((b, i) =>
    b.addEventListener('click', () => H.openViewer(list, i, imgs, c.items.map(x => H.T(x.caption)))));
}

const KINDS = {
  tile:  [tileHTML, () => {}],
  look:  [lookHTML, liveLook],
  tokyo: [tokyoHTML, liveTokyo],
};

const head = ch => `<div class="vn-head">
  <span class="case-label vn-label">${H.T(ch.label)}</span>
  <h2 class="vn-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="vn-text">${H.T(ch.text)}</p>` : ''}
</div>`;

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'ventures.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountVentures(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const V = p.ventures;
  // шапка кейса: вместо картинки — живой принт (картинка видна, пока он грузится)
  const hero = (mount.closest('.case-body') || mount).parentElement?.querySelector('.case-hero');
  if (hero && V.poster){
    hero.classList.add('vn-hero');
    hero.insertAdjacentHTML('beforeend', posterHTML(V.poster));
    livePoster(hero.querySelector('.vn-poster'), V.poster);
  }
  const ch = V.chapters || [];
  const kinds = ch.map(c => Object.keys(KINDS).find(k => c[k]));
  mount.innerHTML = ch.map((c, i) =>
    `<section class="vn-ch wrap vn-${kinds[i]}-ch">${head(c)}<div class="vn-viz">${kinds[i] ? KINDS[kinds[i]][0](c[kinds[i]]) : ''}</div></section>`).join('');
  mount.querySelectorAll('.vn-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.vn-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.vn-viz'), ch[i][k]); });
}
