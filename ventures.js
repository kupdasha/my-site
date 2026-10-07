/* ================================================================
   КЕЙС «THE VENTURES JAPAN» (поле ventures у проекта)
   Шапка кейса — живой принт на сплошном синем: плитки с веткой
   сакуры едут от подола вверх и тают, сверху белый логотип.
   Главы: tile — осьминог, разрезанный пополам: половины по краям, текст главы посередине;
   щупальца из плиток «десять шагов уменьшения» тянутся к тексту, при наведении на текст — к курсору;
   fits — фасоны рядом (oversize и облегающий, выбранный отмечен);
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
const DROP = 70;               // насколько узор опущен под нижний край шапки
const FRAME_H = 618;           // высота принта; полоса плиток — нижние 344, как у подола футболки
const BLUE = '#3044FF';        // фирменный синий из макета

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
  return `<div class="vn-poster">
    <canvas class="vn-canvas" aria-hidden="true"></canvas>
    <div class="vn-side"><img class="vn-logo" src="${H.base}img/ventures/logo-white.svg" alt="The Ventures Japan 2026"></div>
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
    // масштаб — как у полной шапки 16:9 (на телефоне 4:5); сама шапка ниже, поэтому верх срезан, плитки те же
    k = (matchMedia('(max-width:760px)').matches ? W * 5 / 4 : W * 9 / 16) / FRAME_H;
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
      for (let n = -2; n < 10; n++){
        const u = (n + phase) / 9;
        if (u > 1) continue;
        const p = colAt(u);
        let s = p.s * k;
        if (s < 0.4) continue;
        let cx = (x0 + p.x + p.s / 2) * k, cy = (p.y + p.s / 2) * k;
        if (flip){ cx = W - cx; cy = Hh - cy + DROP * k; }   // весь узор ниже: у края не видно, где плитки появляются
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
    ctx.fillStyle = BLUE; ctx.fillRect(0, 0, W, Hh);
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
}

/* ---------- глава: осьминог пополам, текст посередине ---------- */
const ARMS = 5, PER_ARM = 9;   // у каждой половины пять щупалец, в каждом — шаги уменьшения плитки с принта
function tileHTML(c){
  const src = `${H.base}img/ventures/tile.svg`;
  const half = side => `${Array.from({ length: ARMS * PER_ARM }, () => `<img class="vn-arm" data-side="${side}" src="${src}" alt="">`).join('')}
      <img class="vn-body" data-side="${side}" src="${src}" alt="">`;
  return `<div class="vn-tile"><div class="vn-ring">${half(0)}${half(1)}</div></div>`;
}
function liveTile(box){
  const ring = box.querySelector('.vn-ring');
  // заголовок и текст главы встают в середину, между половинами
  const headEl = box.parentElement.querySelector('.vn-head');
  if (headEl) ring.appendChild(headEl);
  const tiles = [...ring.querySelectorAll('.vn-arm')], bodies = [...ring.querySelectorAll('.vn-body')];
  const steps = tiles.map((el, n) => {
    const k = n % (ARMS * PER_ARM);
    return { side: +el.dataset.side, arm: Math.floor(k / PER_ARM), i: k % PER_ARM, s: colAt((k % PER_ARM) / (PER_ARM - 1) * 0.92).s / BIG };
  });
  // шаг вдоль щупальца — по размеру соседних плиток: у тела плотнее, к кончику реже
  const cum = [0]; for (let i = 1; i < PER_ARM; i++) cum[i] = cum[i - 1] + (steps[i - 1].s + steps[i].s) / 2;
  steps.forEach(st => { st.t = (cum[st.i] + 0.5) / (cum[PER_ARM - 1] + 0.5); });

  let W = 0, Hh = 0, R0 = 0, L = 0, T = 0, phone = false, raf = 0, visible = false, last = 0, time = 0;
  let body = [], aim = { x: 0, y: 0 }, goal = { x: 0, y: 0 }, pull = 0, pullGoal = 0;
  function size(){
    const r = ring.getBoundingClientRect(); W = r.width; Hh = r.height;
    phone = matchMedia('(max-width:760px)').matches;
    const m = phone ? W : Hh;
    T = m * (phone ? 0.11 : 0.12); R0 = m * 0.1;
    // тела половин — за краями блока: на компьютере слева и справа, на телефоне сверху и снизу
    body = phone ? [{ x: W / 2, y: -m * 0.06, dir: Math.PI / 2 }, { x: W / 2, y: Hh + m * 0.06, dir: -Math.PI / 2 }]
                 : [{ x: -m * 0.08, y: Hh / 2, dir: 0 }, { x: W + m * 0.08, y: Hh / 2, dir: Math.PI }];
    L = phone ? Hh * 0.3 : W * 0.3;
    if (!pullGoal){ goal = { x: W / 2, y: Hh / 2 }; aim = { ...goal }; }
  }
  function place(){
    tiles.forEach((el, n) => {
      const st = steps[n], b = body[st.side], t = st.t;
      // веер щупалец смотрит внутрь, к тексту
      const spread = (st.arm - (ARMS - 1) / 2) * (phone ? 0.42 : 0.36);
      const wave = Math.sin(time * 1.3 - st.i * 0.55 + st.arm * 1.7 + st.side * 2) * 0.32 * t;
      const curl = (st.side ? -1 : 1) * (st.arm % 2 ? -1 : 1) * 0.55 * Math.pow(t, 1.6);   // соседние закручиваются в разные стороны — как в калейдоскопе
      let a = b.dir + spread + curl + wave, r = R0 + t * L;
      // тянемся к цели: к середине текста, при наведении — к курсору
      const dx = aim.x - b.x, dy = aim.y - b.y, ta = Math.atan2(dy, dx);
      let da = ta - a; da = Math.atan2(Math.sin(da), Math.cos(da));
      const w = (0.22 + pull * 0.6) * Math.pow(t, 1.3);
      a += da * w;
      r += (Math.hypot(dx, dy) * 0.92 - (R0 + L)) * pull * Math.pow(t, 1.5) * 0.7;
      const s = Math.max(st.s, 0.05) * T;
      el.style.width = s + 'px';
      el.style.transform = `translate(${b.x + Math.cos(a) * r - s / 2}px,${b.y + Math.sin(a) * r - s / 2}px) rotate(${a * 180 / Math.PI + 90 + curl * 50}deg)`;
    });
    bodies.forEach((el, k) => {
      const b = body[k], s = T * 2.2;
      el.style.width = s + 'px';
      el.style.transform = `translate(${b.x - s / 2}px,${b.y - s / 2}px) rotate(${(k ? 16 : -24) + Math.sin(time * 0.7 + k * 2) * 8}deg)`;
    });
  }
  function tick(t){
    raf = 0;
    const dt = last ? Math.min(t - last, 50) : 16; last = t;
    time += dt / 1000;
    pull += (pullGoal - pull) * 0.06;
    aim.x += (goal.x - aim.x) * 0.1; aim.y += (goal.y - aim.y) * 0.1;
    place();
    if (visible && !still()) raf = requestAnimationFrame(tick);
  }
  const run = () => { if (!raf && visible && !still()){ last = 0; raf = requestAnimationFrame(tick); } };
  // наведение на текст — щупальца тянутся к курсору; ушли с текста — возвращаются к середине
  const target = headEl || ring;
  target.addEventListener('pointermove', e => {
    const r = ring.getBoundingClientRect();
    goal = { x: e.clientX - r.left, y: e.clientY - r.top }; pullGoal = 1;
    if (still()) { aim = { ...goal }; pull = 1; place(); }
  });
  target.addEventListener('pointerleave', () => {
    goal = { x: W / 2, y: Hh / 2 }; pullGoal = 0;
    if (still()) { aim = { ...goal }; pull = 0; place(); }
  });
  new ResizeObserver(() => { size(); place(); }).observe(ring);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(ring);
  size(); place();
}

/* ---------- глава: фасоны рядом, выбранный отмечен ---------- */
function fitsHTML(c){
  return `<div class="vn-fits">${c.items.map(f =>
    `<div class="vn-fit${f.chosen ? ' chosen' : ''}">
      <p class="vn-fit-name"><span class="vn-tag">${H.T(f.name)}</span>${f.chosen ? `<span class="vn-fit-note">${H.T(c.chosen)}</span>` : ''}</p>
      <div class="vn-fit-shots">${f.photos.map(src =>
        `<button class="vn-shot" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>
    </div>`).join('')}</div>`;
}
function liveFits(box, c){
  const list = c.items.flatMap(f => f.photos), imgs = [...box.querySelectorAll('.vn-shot img')];
  box.querySelectorAll('.vn-shot').forEach((b, i) => b.addEventListener('click', () => H.openViewer(list, i, imgs)));
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
// самолет из Москвы в Токио: летит по прокрутке, садится на полосу у фото с мероприятия
const PLANE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.5 12c0-.7-.6-1.2-1.3-1.2h-5.4L9.6 3H7.8l2.6 7.8H5.6L3.9 8.6H2.6l1 3.4-1 3.4h1.3l1.7-2.2h4.8L7.8 21h1.8l5.2-7.8h5.4c.7 0 1.3-.5 1.3-1.2z"/></svg>';
function flightHTML(f){
  return `<div class="vn-flight" aria-hidden="true">
    <svg class="vn-route"><path class="vn-route-all"/><path class="vn-route-done"/></svg>
    <span class="vn-city vn-from">${H.T(f.from)}</span><span class="vn-city vn-to">${H.T(f.to)}</span>
    <span class="vn-plane">${PLANE}</span>
  </div>`;
}
function liveFlight(box){
  const svg = box.querySelector('.vn-route'), all = svg.querySelector('.vn-route-all'), done = svg.querySelector('.vn-route-done');
  const plane = box.querySelector('.vn-plane'), from = box.querySelector('.vn-from'), to = box.querySelector('.vn-to');
  let len = 0, W = 0, Hh = 0, land = 0, raf = 0;
  function shape(){
    const r = box.getBoundingClientRect(); W = r.width; Hh = r.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const P = (x, y) => `${(x * W).toFixed(1)} ${(y * Hh).toFixed(1)}`;
    // дуга над страницей, к концу — снижение и пробег по полосе
    const d = `M${P(0.04, 0.16)} C${P(0.36, -0.22)} ${P(0.64, 0.86)} ${P(0.84, 0.86)} L${P(0.97, 0.86)}`;
    all.setAttribute('d', d); done.setAttribute('d', d);
    len = all.getTotalLength();
    land = len - 0.13 * W;   // отсюда самолет уже на полосе
    done.style.strokeDasharray = `${len} ${len}`;
    from.style.left = 0.04 * W + 'px'; from.style.top = 0.16 * Hh + 'px';
    to.style.left = 0.97 * W + 'px'; to.style.top = 0.86 * Hh + 'px';
    fly();
  }
  function fly(){
    raf = 0;
    if (!box.isConnected){ document.removeEventListener('scroll', ask, true); return; }   // кейс закрыли
    if (!len) return;   // маршрут еще не построен
    const r = box.getBoundingClientRect(), vh = innerHeight;
    // взлет, когда блок показался снизу, посадка — когда полоса дошла до середины экрана
    const p = still() ? 1 : clamp((vh * 0.95 - r.top) / (r.height * 0.86 + vh * 0.45), 0, 1);
    const at = p * len, pt = all.getPointAtLength(at), ah = all.getPointAtLength(Math.min(at + 2, len)), bh = all.getPointAtLength(Math.max(at - 2, 0));
    const rot = Math.atan2(ah.y - bh.y, ah.x - bh.x) * 180 / Math.PI;
    const s = at > land ? 0.86 : 1 + 0.25 * Math.sin(Math.min(at / land, 1) * Math.PI);   // в воздухе чуть крупнее, на земле — меньше
    plane.style.transform = `translate(${pt.x}px,${pt.y}px) translate(-50%,-50%) rotate(${rot}deg) scale(${s})`;
    done.style.strokeDashoffset = len - at;
    box.classList.toggle('landed', p >= 0.999);
  }
  const ask = () => { if (!raf) raf = requestAnimationFrame(fly); };
  document.addEventListener('scroll', ask, { capture: true, passive: true });   // кейс прокручивается в своем окне — ловим любую прокрутку
  new ResizeObserver(shape).observe(box);
}

function tokyoHTML(c){
  return `${c.flight ? flightHTML(c.flight) : ''}<div class="vn-tokyo">${c.items.map((it, i) =>
    `<figure style="--ar:${it.ratio}"><button class="vn-shot" data-i="${i}" aria-label="Увеличить"><img src="${it.src}" alt="" loading="lazy"></button>
      <figcaption>${H.T(it.caption)}</figcaption></figure>`).join('')}</div>`;
}
function liveTokyo(box, c){
  const fl = box.querySelector('.vn-flight');
  if (fl){ box.parentElement.prepend(fl); liveFlight(fl); }   // самолет — перед заголовком главы: летит из съемки к Токио
  const list = c.items.map(x => x.src), imgs = [...box.querySelectorAll('.vn-shot img')];
  box.querySelectorAll('.vn-shot').forEach((b, i) =>
    b.addEventListener('click', () => H.openViewer(list, i, imgs, c.items.map(x => H.T(x.caption)))));
}

const KINDS = {
  tile:  [tileHTML, liveTile],
  fits:  [fitsHTML, liveFits],
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
