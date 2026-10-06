/* ================================================================
   КЕЙС «ГДЕ МОЁ ВНИМАНИЕ?» (поле adhd у проекта, см. СДВГ)
   Страница ведет себя как рассеянное внимание: мысли расплываются,
   наброски разбросаны и собираются при прокрутке, футболки сами
   перескакивают между версиями. Тексты — в content.js, оформление — adhd.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);
// следит, на экране ли блок: живые анимации крутятся только там
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);

const head = ch => `<div class="ad-head">
  <span class="case-label ad-label">${H.T(ch.label)}</span>
  <h2 class="ad-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="ad-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const cap = t => t ? `<p class="ad-cap">${H.T(t)}</p>` : '';

/* ---------- мысли: одна в фокусе, остальные расплываются и дрейфуют ---------- */
function thoughtsHTML(c){
  return `<div class="ad-thoughts" aria-label="${c.items.map(x => H.pick(x)).join(', ')}">
    ${c.items.map((t, i) => `<span class="ad-th" style="--i:${i}" aria-hidden="true">${H.T(t)}</span>`).join('')}
  </div>${cap(c.hint)}`;
}
function liveThoughts(box){
  const els = [...box.querySelectorAll('.ad-th')];
  const n = els.length;
  let pos = [], seen = false, raf = 0, t0 = performance.now();
  let fx = 0, fy = 0, gx = 0, gy = 0, hover = false, jumpAt = 0, stealUntil = 0;
  // раскладка: ячейки сетки, внутри — случайный сдвиг, чтобы не выглядело таблицей
  const lay = () => {
    const w = box.clientWidth, h = box.clientHeight, cols = w < 640 ? 2 : 3, rows = Math.ceil(n / cols);
    pos = els.map((el, i) => {
      const cw = w / cols, ch = h / rows, c = i % cols, r = Math.floor(i / cols);
      el.style.maxWidth = (cw - 24) + 'px';
      const ew = el.offsetWidth, eh = el.offsetHeight;
      return { x: c * cw + rnd(8, Math.max(8, cw - ew - 8)), y: r * ch + rnd(4, Math.max(4, ch - eh - 4)), w: ew, h: eh,
        ph: rnd(0, 6.28), sp: rnd(.25, .5), amp: rnd(6, 16) };
    });
  };
  const centre = i => [pos[i].x + pos[i].w / 2, pos[i].y + pos[i].h / 2];
  const jump = () => { const k = Math.floor(Math.random() * n); [gx, gy] = centre(k); };
  const draw = t => {
    const s = (t - t0) / 1000;
    // само по себе внимание перескакивает; с курсором — держится за ним, но иногда все равно убегает
    if (!hover && t > jumpAt) { jump(); jumpAt = t + rnd(1300, 2600); }
    if (hover && t > jumpAt) { if (Math.random() < .45) { jump(); stealUntil = t + 900; } jumpAt = t + rnd(2600, 4200); }
    const k = hover && t < stealUntil ? .14 : .08;
    fx += (gx - fx) * k; fy += (gy - fy) * k;
    const R = Math.max(box.clientWidth, 400) * .22;
    els.forEach((el, i) => {
      const p = pos[i];
      const dx = Math.sin(s * p.sp + p.ph) * p.amp, dy = Math.cos(s * p.sp * .8 + p.ph) * p.amp * .7;
      const [cx, cy] = [p.x + p.w / 2 + dx, p.y + p.h / 2 + dy];
      const d = Math.min(1, Math.hypot(cx - fx, cy - fy) / R);
      el.style.transform = `translate(${(p.x + dx).toFixed(1)}px,${(p.y + dy).toFixed(1)}px)`;
      el.style.filter = d < .08 ? 'none' : `blur(${(d * 5).toFixed(2)}px)`;
      el.style.opacity = (1 - d * .7).toFixed(2);
    });
    if (seen) raf = requestAnimationFrame(draw);
  };
  const start = () => { lay(); jump(); fx = gx; fy = gy; };
  start();
  new ResizeObserver(() => { lay(); }).observe(box);
  if (still()) {   // без движения: все мысли резкие и стоят на местах
    els.forEach((el, i) => { el.style.transform = `translate(${pos[i].x}px,${pos[i].y}px)`; });
    box.classList.add('still'); return;
  }
  box.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect();
    hover = true;
    if (performance.now() > stealUntil) { gx = e.clientX - r.left; gy = e.clientY - r.top; }
  });
  box.addEventListener('pointerleave', () => { hover = false; jumpAt = 0; });
  onScreen(box, v => {
    if (v && !seen) { seen = true; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- наброски: разбросаны по столу и собираются в сетку при прокрутке ---------- */
function boardHTML(c){
  return `<div class="ad-board">${c.items.map((x, i) => {
    const it = typeof x === 'string' ? { img: x } : x;
    return `<button class="ad-sk${it.fit ? ' fit' : ''}" style="--i:${i}" aria-label="Увеличить набросок"><img src="${it.img}" alt="" loading="lazy" draggable="false"></button>`;
  }).join('')}</div>${cap(c.hint)}`;
}
function liveBoard(box){
  const tiles = [...box.querySelectorAll('.ad-sk')];
  tiles.forEach(t => {
    t.style.setProperty('--dx', rnd(-40, 40).toFixed(1) + '%');
    t.style.setProperty('--dy', rnd(-30, 50).toFixed(1) + '%');
    t.style.setProperty('--r', rnd(-16, 16).toFixed(1) + 'deg');
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('.ad-sk'); if (!b) return;
    const imgs = tiles.map(t => t.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), tiles.indexOf(b), imgs);
  });
  if (still()) { box.style.setProperty('--p', 1); return; }
  // 0 — блок только показался снизу (всё вразброс), 1 — середина блока на середине экрана (всё по местам)
  let raf = 0, seen = false;
  const sc = box.closest('.case') || window;
  const upd = () => {
    raf = 0;
    const r = box.getBoundingClientRect(), vh = innerHeight;
    const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * .5 + r.height * .5)));
    box.style.setProperty('--p', (1 - Math.pow(1 - p, 3)).toFixed(3));
  };
  const req = () => { if (seen && !raf) raf = requestAnimationFrame(upd); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  onScreen(box, v => { seen = v; req(); }, '200px 0px');
}

/* ---------- живая типографика из набросков ---------- */
// кольцо «многоозадаченность» крутится; на наведении — быстрее, как будто взялась за всё сразу
function ringSVG(t){
  const word = (H.pick(t.ring) + ' ').repeat(3);
  return `<svg class="ad-type ad-ring" viewBox="0 0 400 400" aria-hidden="true">
    <defs><path id="adRing" d="M200 200m-150 0a150 150 0 1 1 300 0a150 150 0 1 1-300 0"/></defs>
    <g class="ad-spin"><text><textPath href="#adRing" textLength="930">${word}</textPath></text></g>
    <text class="ad-core" x="200" y="208" text-anchor="middle">${H.pick(t.core)}</text>
  </svg>`;
}
// «всё вокруг в слоумо»: строчка медленно ползет по крючку, как принт на футболке
function slowSVG(t){
  const s = H.pick(t.slow);
  return `<svg class="ad-type ad-slow" viewBox="0 0 400 400" aria-hidden="true">
    <path id="adHook" d="M330 40C300 140 200 230 170 300C150 350 190 380 220 360C250 340 220 300 180 320C120 350 60 340 40 360" fill="none"/>
    <path class="ad-hook" d="M330 40C300 140 200 230 170 300C150 350 190 380 220 360C250 340 220 300 180 320C120 350 60 340 40 360" fill="none"/>
    <text><textPath class="ad-slow-path" href="#adHook" startOffset="0">${s}</textPath></text>
  </svg>`;
}
// «я вас слушаю очень невнимательно»: каждая следующая строчка провисает сильнее — внимание утекает
function waveSVG(t){
  const s = H.pick(t.wave), n = 7;
  return `<svg class="ad-type ad-wave" viewBox="0 0 400 400" aria-hidden="true" data-n="${n}">
    <defs>${Array.from({ length: n }, (_, i) => `<path id="adW${i}" d=""/>`).join('')}</defs>
    ${Array.from({ length: n }, (_, i) => `<text style="opacity:${(1 - i * .11).toFixed(2)}"><textPath href="#adW${i}">${s}</textPath></text>`).join('')}
  </svg>`;
}
function typeHTML(c){
  return `<div class="ad-types">
    <figure>${ringSVG(c)}${c.notes ? `<figcaption>${H.T(c.notes[0])}</figcaption>` : ''}</figure>
    <figure>${slowSVG(c)}${c.notes ? `<figcaption>${H.T(c.notes[1])}</figcaption>` : ''}</figure>
    <figure>${waveSVG(c)}${c.notes ? `<figcaption>${H.T(c.notes[2])}</figcaption>` : ''}</figure>
  </div>${cap(c.hint)}`;
}
function liveType(box){
  const wave = box.querySelector('.ad-wave'), n = +wave.dataset.n, paths = [...wave.querySelectorAll('defs path')];
  const slow = box.querySelector('.ad-slow-path');
  const ring = box.querySelector('.ad-spin');
  let raf = 0, seen = false, t0 = performance.now(), ang = 0, speed = .05, goal = .05, last = t0;
  const shape = s => paths.forEach((p, i) => {
    // строчка начинается ровно, а к концу уходит вниз; провисание растет с номером строки и «дышит»
    const y = 70 + i * 34, sag = (i * 26 + 10) * (.75 + .25 * Math.sin(s * .9 - i * .35));
    p.setAttribute('d', `M20 ${y}C140 ${y} 230 ${y + sag * .15} 290 ${y + sag * .55}S370 ${y + sag * 1.2} 385 ${y + sag * 1.5}`);
  });
  shape(0);
  if (still()) return;
  ring.closest('figure').addEventListener('pointerenter', () => { goal = .6; });
  ring.closest('figure').addEventListener('pointerleave', () => { goal = .05; });
  const draw = t => {
    const s = (t - t0) / 1000, dt = Math.min(64, t - last); last = t;
    speed += (goal - speed) * .05; ang = (ang + speed * dt / 16) % 360;
    ring.setAttribute('transform', `rotate(${ang.toFixed(2)} 200 200)`);
    slow.setAttribute('startOffset', ((s * 6) % 120 - 20).toFixed(2) + '%');   // очень медленно, по кругу
    shape(s);
    if (seen) raf = requestAnimationFrame(draw);
  };
  onScreen(box, v => {
    if (v && !seen) { seen = true; last = performance.now(); raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- версии: каждая футболка сама перескакивает между вариантами ---------- */
function versionsHTML(c){
  return `<div class="ad-vers">${c.items.map((x, i) => `
    <figure class="ad-ver" style="--i:${i}" data-k="0">
      <div class="ad-ver-stack">${x.imgs.map((src, j) => `<img class="${j ? '' : 'on'}" src="${src}" alt="" loading="lazy" draggable="false">`).join('')}
        ${x.tag ? `<span class="ad-tag">${H.T(x.tag)}</span>` : ''}</div>
      <figcaption>
        <span class="ad-ver-name">${H.T(x.phrase)}</span>
        <span class="ad-dots">${x.imgs.map((_, j) => `<button class="${j ? '' : 'on'}" aria-label="Вариант ${j + 1} из ${x.imgs.length}"></button>`).join('')}</span>
      </figcaption>
    </figure>`).join('')}</div>${cap(c.hint)}`;
}
function liveVersions(box){
  const cards = [...box.querySelectorAll('.ad-ver')];
  let seen = false;
  cards.forEach(card => {
    const imgs = [...card.querySelectorAll('.ad-ver-stack img')], dots = [...card.querySelectorAll('.ad-dots button')];
    let k = 0, timer = 0, held = false;
    const show = i => {
      k = (i + imgs.length) % imgs.length;
      imgs.forEach((im, j) => im.classList.toggle('on', j === k));
      dots.forEach((d, j) => d.classList.toggle('on', j === k));
    };
    // у каждой карточки свой ритм: внимание прыгает неровно
    const tick = () => {
      clearTimeout(timer);
      if (!seen || held || still()) return;
      timer = setTimeout(() => { show(k + 1); tick(); }, rnd(1400, 3800));
    };
    card._tick = tick;
    const stack = card.querySelector('.ad-ver-stack');
    // мышью: курсор ведет по версиям слева направо, автоперебор на паузе
    stack.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      held = true; clearTimeout(timer); card.classList.add('held');
      const r = stack.getBoundingClientRect();
      show(Math.min(imgs.length - 1, Math.floor((e.clientX - r.left) / r.width * imgs.length)));
    });
    stack.addEventListener('pointerleave', () => { held = false; card.classList.remove('held'); tick(); });
    stack.addEventListener('click', e => {
      // пальцем — следующая версия; мышью — увеличить все версии и листать
      if (e.pointerType && e.pointerType !== 'mouse') { show(k + 1); return; }
      H.openViewer(imgs.map(i => i.currentSrc || i.src), k, imgs);
    });
    dots.forEach((d, j) => d.addEventListener('click', () => { show(j); clearTimeout(timer); held = true; setTimeout(() => { held = false; tick(); }, 4000); }));
  });
  onScreen(box, v => { seen = v; cards.forEach(c => c._tick()); });
}

/* ---------- фурнитура: карточки покачиваются, как брелоки ---------- */
function detailsHTML(c){
  return `<div class="ad-dets">${c.items.map((x, i) => `
    <figure class="ad-det" style="--i:${i}">
      <button class="ad-det-img" aria-label="Увеличить"><img src="${x.img}" alt="" loading="lazy" draggable="false"></button>
      ${x.note ? `<figcaption>${H.T(x.note)}</figcaption>` : ''}
    </figure>`).join('')}</div>${cap(c.hint)}`;
}
function liveDetails(box){
  const btns = [...box.querySelectorAll('.ad-det-img')];
  box.addEventListener('click', e => {
    const b = e.target.closest('.ad-det-img'); if (!b) return;
    const imgs = btns.map(t => t.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), btns.indexOf(b), imgs);
  });
  // наведение — толчок: брелок раскачивается и затухает
  box.querySelectorAll('.ad-det').forEach(f => f.addEventListener('pointerenter', () => {
    if (still()) return;
    f.classList.remove('swing'); void f.offsetWidth; f.classList.add('swing');
  }));
}

/* ---------- что вышло: финальные фото ---------- */
function finalHTML(c){
  return `<div class="ad-final">${c.items.map((src, i) => `<button class="ad-fin" style="--i:${i}" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>${cap(c.hint)}`;
}
function liveFinal(box){
  const btns = [...box.querySelectorAll('.ad-fin')];
  box.addEventListener('click', e => {
    const b = e.target.closest('.ad-fin'); if (!b) return;
    const imgs = btns.map(t => t.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), btns.indexOf(b), imgs);
  });
}

/* ---------- о проекте писали: названия изданий крупно ---------- */
function pressHTML(c){
  return `<ul class="ad-press">${c.items.map((x, i) => `<li style="--i:${i}"><a class="ad-press-a" href="${x.link}" target="_blank" rel="noopener">
    <b>${H.T(x.name)}</b><span>${H.T(x.note)}</span></a></li>`).join('')}</ul>`;
}

const KINDS = {
  thoughts: [thoughtsHTML, liveThoughts, '.ad-thoughts'],
  board:    [boardHTML, liveBoard, '.ad-board'],
  type:     [typeHTML, liveType, '.ad-types'],
  versions: [versionsHTML, liveVersions, '.ad-vers'],
  details:  [detailsHTML, liveDetails, '.ad-dets'],
  final:    [finalHTML, liveFinal, '.ad-final'],
  press:    [pressHTML, null, '.ad-press'],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'adhd.css?v=' + (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5));
    l.onload = l.onerror = res; document.head.appendChild(l);
  });
  return cssReady;
}
// глава появляется, когда доезжает до экрана
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { threshold: .12 });

export async function mountADHD(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  mount.innerHTML = p.adhd.map(ch => {
    const kind = Object.keys(KINDS).find(k => ch[k]);
    return `<section class="ad-ch wrap ad-${kind}-ch">${head(ch)}<div class="ad-viz">${kind ? KINDS[kind][0](ch[kind]) : ''}</div></section>`;
  }).join('');
  mount.querySelectorAll('.ad-ch').forEach(s => reveal.observe(s));
  Object.values(KINDS).forEach(([, live, sel]) => live && mount.querySelectorAll(sel).forEach(live));
}
