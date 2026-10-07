/* ================================================================
   КЕЙС NΈOFLEET (поле fleet у проекта, см. Nέofleet)
   Худи из асфальта: страница ведет себя как дорога. Слоганы едут
   по полосам, референсы — встречными потоками, цвета ткани
   приезжают рядами, разметка на худи оживает, фары подсвечивают
   фактуру, съемка проезжает лентой. Тексты — в content.js,
   оформление — fleet.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

// версия для ?v=: на сайте меняется раз в час, на локальном превью — при каждой загрузке
const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// следит, на экране ли блок: живые анимации крутятся только там
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

const head = (ch) => `<div class="fl-head">
  <span class="case-label fl-label">${H.T(ch.label)}</span>
  <h2 class="fl-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="fl-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const cap = t => t ? `<p class="fl-cap">${H.T(t)}</p>` : '';

// значок-колесо Nέofleet: кольцо и «ń» внутри, как на капюшоне (контуры — из макета в Фигме)
const WHEEL = `<svg class="fl-wh" viewBox="0 0 27.74 27.74" aria-hidden="true"><circle cx="13.87" cy="13.87" r="12.585" fill="none" stroke="currentColor" stroke-width="2.57"/>
  <g transform="translate(8.733 4.109)" fill="currentColor"><path transform="translate(0 5.116)" d="M2.737 11.763V4.959c0-.56.103-1.036.31-1.429.211-.393.5-.693.869-.9.373-.211.799-.317 1.278-.317.705 0 1.257.219 1.655.658.404.438.605 1.045.605 1.822v6.97h2.737V4.37c.005-.928-.159-1.717-.491-2.367-.328-.65-.792-1.146-1.391-1.489C7.714.171 7.016 0 6.214 0c-.867 0-1.595.191-2.185.575-.584.382-1.01.899-1.277 1.549h-.136V.151H0v11.612z"/><path transform="translate(4.544 0)" d="M.703 0 0 3.576h1.671L3.266 0z"/></g></svg>`;

/* ---------- слоганы: едут по трем полосам, наведение переводит на русский ---------- */
function roadHTML(c){
  const lanes = [[], [], []];
  c.items.forEach((x, i) => lanes[i % 3].push(x));
  return `<div class="fl-road" aria-label="${c.items.map(x => x.en).join(', ')}">
    ${lanes.map((l, i) => `${i ? '<i class="fl-dash"></i>' : ''}<div class="fl-lane" data-i="${i}"><div class="fl-run">${
      l.map(x => `<button class="fl-slog" aria-hidden="true" tabindex="-1"><span class="en">${x.en}</span><span class="ru">${x.ru}</span></button>`).join('')
    }</div></div>`).join('')}
  </div>${cap(c.hint)}`;
}
function liveRoad(box){
  const lanes = [...box.querySelectorAll('.fl-lane')];
  // на каждой полосе свой ряд и своя скорость; вторая едет навстречу
  const L = lanes.map((lane, i) => {
    const run = lane.querySelector('.fl-run');
    const one = run.innerHTML;
    // размножаем ряд, чтобы он закрывал полосу дважды: тогда переход по кругу не виден
    let w = 0, guard = 0;
    run.innerHTML = one;
    while ((w = run.scrollWidth) < lane.clientWidth * 1.2 && guard++ < 12) run.innerHTML += one;
    const group = run.innerHTML;
    run.innerHTML = group + group;
    return { run, w: run.scrollWidth / 2, x: -Math.random() * 300, v: [.055, -.04, .07][i], k: 1, hold: false };
  });
  const dashes = [...box.querySelectorAll('.fl-dash')];
  let dash = 0;
  box.querySelectorAll('.fl-slog').forEach(s => {
    const lane = L[+s.closest('.fl-lane').dataset.i];
    s.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { s.classList.add('on'); lane.hold = true; } });
    s.addEventListener('pointerleave', () => { s.classList.remove('on'); lane.hold = false; });
    s.addEventListener('click', e => { if (e.pointerType !== 'mouse') s.classList.toggle('on'); });
  });
  const place = () => L.forEach(l => { l.run.style.transform = `translate3d(${l.x.toFixed(1)}px,0,0)`; });
  if (still()) { place(); return; }
  let raf = 0, seen = false, last = 0;
  const draw = t => {
    const dt = Math.min(64, t - (last || t)); last = t;
    L.forEach(l => {
      // под курсором полоса притормаживает, как перед светофором
      l.k += ((l.hold ? .08 : 1) - l.k) * .08;
      l.x -= l.v * l.k * dt;
      if (l.x < -l.w) l.x += l.w; if (l.x > 0) l.x -= l.w;
    });
    dash = (dash + .09 * dt) % 80;
    dashes.forEach(d => d.style.backgroundPosition = `${(-dash).toFixed(1)}px 0`);
    place();
    if (seen) raf = requestAnimationFrame(draw);
  };
  onScreen(box, v => {
    if (v && !seen) { seen = true; last = 0; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- референсы: два встречных потока, едут вместе с прокруткой ---------- */
function refsHTML(c){
  const half = Math.ceil(c.items.length / 2);
  const row = (list, d) => `<div class="fl-flow" data-d="${d}">${list.map(src =>
    `<button class="fl-ref" aria-label="Увеличить референс"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>`;
  return `<div class="fl-refs">${row(c.items.slice(0, half), 1)}<i class="fl-dash"></i>${row(c.items.slice(half), -1)}</div>${cap(c.hint)}`;
}
function liveRefs(box){
  const rows = [...box.querySelectorAll('.fl-flow')], dash = box.querySelector('.fl-dash');
  const btns = [...box.querySelectorAll('.fl-ref')];
  box.addEventListener('click', e => { const b = e.target.closest('.fl-ref'); if (b) zoom(btns, b); });
  const upd = () => {
    const p = still() ? .5 : progress(box);
    rows.forEach(r => {
      const range = Math.max(0, r.scrollWidth - box.clientWidth);
      const x = r.dataset.d === '1' ? -range * p : -range * (1 - p);
      r.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    });
    dash.style.backgroundPosition = `${(-p * 1600).toFixed(1)}px 0`;
  };
  upd();
  box.querySelectorAll('img').forEach(i => i.addEventListener('load', upd, { once: true }));
  onScroll(box, upd);
}

/* ---------- цвет ткани: ряд макетов уезжает, приезжает следующий ---------- */
function colorsHTML(c){
  return `<div class="fl-colors">
    <div class="fl-sws" role="tablist">${c.items.map((x, i) => `<button class="fl-sw${i ? '' : ' on'}" role="tab" aria-selected="${!i}" data-i="${i}" style="--sw:${x.color}"><i></i>${H.T(x.name)}</button>`).join('')}</div>
    <div class="fl-lot">${c.items.map((x, i) => `<div class="fl-row${i ? '' : ' on'}" data-i="${i}">${x.imgs.map(src =>
      `<button class="fl-car" aria-label="Увеличить макет"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>`).join('')}</div>
  </div>${cap(c.hint)}`;
}
function liveColors(box){
  const sws = [...box.querySelectorAll('.fl-sw')], rows = [...box.querySelectorAll('.fl-row')];
  let k = 0, timer = 0, seen = false, touched = false;
  const show = i => {
    if (i === k) return;
    const old = rows[k], nu = rows[i];
    // старый ряд уезжает влево, новый подъезжает справа
    old.classList.remove('on'); old.classList.add('gone');
    setTimeout(() => old.classList.remove('gone'), 900);
    nu.scrollLeft = 0; nu.classList.add('on');
    sws.forEach((s, j) => { s.classList.toggle('on', j === i); s.setAttribute('aria-selected', j === i); });
    k = i;
  };
  const tick = () => {
    clearTimeout(timer);
    if (seen && !touched && !still()) timer = setTimeout(() => { show((k + 1) % rows.length); tick(); }, 4200);
  };
  sws.forEach((s, i) => s.addEventListener('click', () => { touched = true; clearTimeout(timer); show(i); }));
  rows.forEach(r => {
    const cars = [...r.querySelectorAll('.fl-car')];
    r.addEventListener('click', e => { const b = e.target.closest('.fl-car'); if (b) { touched = true; clearTimeout(timer); zoom(cars, b); } });
    r.addEventListener('pointerdown', () => { touched = true; clearTimeout(timer); });
    r.addEventListener('wheel', () => { touched = true; clearTimeout(timer); }, { passive: true });
  });
  onScreen(box, v => { seen = v; tick(); });
}

/* ---------- поиски разметки: ведете по дороге — макеты меняются, колесо катится ---------- */
function searchHTML(c){
  const n = c.items.length;
  // подсказка — не мелкой строкой, а крупно над карточкой; игрушка по центру страницы
  return `<div class="fl-search-row"><div class="fl-search" style="--n:${n}">
    <div class="fl-stage">${c.items.map((x, i) => `<img class="${i ? '' : 'on'}" src="${x.img}" alt="" loading="lazy" draggable="false">`).join('')}
      ${c.items.map((x, i) => `<span class="fl-tag${i ? '' : ' on'}${i === n - 1 ? ' last' : ''}">${H.T(x.name)}</span>`).join('')}</div>
    <div class="fl-track">
      <i class="fl-dash"></i>
      <span class="fl-wh-box"><span class="fl-car-wh">${WHEEL}</span></span>
      <input class="fl-range" type="range" min="0" max="${n - 1}" step="any" value="0" aria-label="Варианты разметки, от первых проб к финалу">
    </div>
  </div>${c.hint ? `<p class="fl-side">${H.T(c.hint)}</p>` : ''}</div>`;
}
function liveSearch(box){
  const imgs = [...box.querySelectorAll('.fl-stage img')], tags = [...box.querySelectorAll('.fl-tag')];
  const range = box.querySelector('.fl-range'), wh = box.querySelector('.fl-car-wh'), dash = box.querySelector('.fl-dash');
  const stage = box.querySelector('.fl-stage'), n = imgs.length;
  let k = -1, v = 0, goal = 0, raf = 0, auto = true, seen = false;
  const set = val => {
    v = val; range.value = v;
    const p = v / (n - 1), i = Math.round(v);
    wh.style.left = `${(p * 100).toFixed(2)}%`;
    // колесо катится: поворот по пройденному пути
    wh.style.transform = `translate(-50%,-50%) rotate(${(p * 900).toFixed(1)}deg)`;
    dash.style.backgroundPosition = `${(-p * 240).toFixed(1)}px 0`;
    if (i !== k) {
      k = i;
      imgs.forEach((im, j) => im.classList.toggle('on', j === i));
      tags.forEach((t, j) => t.classList.toggle('on', j === i));
    }
  };
  const glide = () => {
    raf = 0;
    v += (goal - v) * .12;
    if (Math.abs(goal - v) < .002) v = goal;
    set(v);
    if (v !== goal) raf = requestAnimationFrame(glide);
  };
  const to = g => { goal = clamp(g, 0, n - 1); if (!raf) raf = requestAnimationFrame(glide); };
  const stop = () => { auto = false; };
  range.addEventListener('input', () => { stop(); goal = +range.value; set(goal); });
  stage.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    stop();
    const r = stage.getBoundingClientRect();
    to((e.clientX - r.left) / r.width * (n - 1));
  });
  stage.addEventListener('click', e => {
    if (e.pointerType && e.pointerType !== 'mouse') { stop(); to(Math.round(v) + 1 > n - 1 ? 0 : Math.round(v) + 1); return; }
    H.openViewer(imgs.map(i => i.currentSrc || i.src), Math.round(v), imgs);
  });
  set(0);
  if (still()) { set(n - 1); return; }
  // первый раз дорога проезжается сама: от первых проб до финала
  onScreen(box, on => {
    if (on && !seen && auto) {
      seen = true;
      let i = 0;
      const step = () => { if (!auto) return; to(++i); if (i < n - 1) setTimeout(step, 1100); };
      setTimeout(step, 900);
    }
  });
}

/* ---------- финал: разметку наносят, колесо подкатывается, наведение — поехали ---------- */
function markHTML(c){
  return `<div class="fl-mark">${c.items.map((x, i) => `
    <figure class="fl-hood" style="--i:${i}">
      <button class="fl-hood-in" aria-label="Увеличить"><img src="${x.img}" alt="" loading="lazy" draggable="false"><span class="fl-ov" data-svg="${x.svg}"></span></button>
      ${x.name ? `<figcaption>${H.T(x.name)}</figcaption>` : ''}
    </figure>`).join('')}</div>${cap(c.hint)}`;
}
function liveMark(box){
  const figs = [...box.querySelectorAll('.fl-hood')];
  const btns = figs.map(f => f.querySelector('.fl-hood-in'));
  box.addEventListener('click', e => { const b = e.target.closest('.fl-hood-in'); if (b) zoom(btns, b); });
  figs.forEach(f => {
    const ov = f.querySelector('.fl-ov');
    fetch(ov.dataset.svg + (ov.dataset.svg.includes('?') ? '&' : '?') + 'v=' + VERS).then(r => r.ok ? r.text() : '').then(svg => {
      if (!svg) return;
      ov.innerHTML = svg;
      // слой обрезается так же, как фото под ним (object-fit: cover), — пустые поля сверху и снизу уходят
      ov.querySelector('svg')?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      // полосы — линиями: тогда их можно разрезать на бегущий пунктир
      ov.querySelectorAll('.fl-stripe').forEach(r => {
        const x = +r.getAttribute('x') + 17, y = +r.getAttribute('y'), h = +r.getAttribute('height');
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('class', 'fl-stripe');
        l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', y); l.setAttribute('y2', y + h);
        r.replaceWith(l);
      });
      // буквы надписи проявляются по очереди, как будто их наносят трафаретом
      ov.querySelectorAll('.fl-text path').forEach((p, i) => p.style.setProperty('--d', `${(1.1 + i * .025).toFixed(3)}s`));
      f.classList.add('ready');
    }).catch(() => {});
    f.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') f.classList.add('go'); });
    f.addEventListener('pointerleave', () => f.classList.remove('go'));
  });
  onScreen(box, v => { if (v) figs.forEach(f => f.classList.add('drawn')); });
  // на телефоне машина едет сама, пока худи на экране
  if (!matchMedia('(hover: hover)').matches && !still())
    figs.forEach(f => onScreen(f, v => f.classList.toggle('go', v), '-20% 0px'));
}

/* ---------- фактура: курсор — фары, в темноте видно ткань и разметку ---------- */
function lightsHTML(c){
  return `<div class="fl-night"><img src="${c.img}" alt="" loading="lazy" draggable="false"><span class="fl-dark"></span></div>${cap(c.hint)}`;
}
function liveLights(box){
  let x = .5, y = .45, tx = .5, ty = .45, user = 0, raf = 0, seen = false, t0 = performance.now();
  const dark = box.querySelector('.fl-dark');
  const put = () => {
    const w = box.clientWidth, h = box.clientHeight;
    // две фары рядом, как у машины; расстояние между ними — от ширины кадра
    const gap = Math.min(w, h) * .16;
    box.style.setProperty('--lx', `${(x * w - gap).toFixed(1)}px`);
    box.style.setProperty('--rx', `${(x * w + gap).toFixed(1)}px`);
    box.style.setProperty('--ly', `${(y * h).toFixed(1)}px`);
  };
  box.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; user = performance.now();
  });
  if (still()) { dark.style.opacity = '.35'; put(); return; }
  const draw = t => {
    // без курсора фары сами медленно обшаривают кадр
    if (t - user > 2500) {
      const s = (t - t0) / 1000;
      tx = .5 + Math.sin(s * .45) * .3; ty = .45 + Math.sin(s * .7 + 1) * .22;
    }
    x += (tx - x) * .08; y += (ty - y) * .08;
    put();
    if (seen) raf = requestAnimationFrame(draw);
  };
  onScreen(box, v => {
    if (v && !seen) { seen = true; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- из макета в кадр: шторка между плоским макетом и съемкой, под ней — запрос ---------- */
function promptHTML(c){
  return `<div class="fl-prompt">
    <div class="fl-wipe" style="--w:50%">
      <img class="fl-after" src="${c.after}" alt="" loading="lazy" draggable="false">
      <img class="fl-before" src="${c.before}" alt="" loading="lazy" draggable="false">
      <span class="fl-wipe-line"><span class="fl-wipe-knob">${WHEEL}</span></span>
      ${c.notes ? `<span class="fl-wtag l">${H.T(c.notes[0])}</span><span class="fl-wtag r">${H.T(c.notes[1])}</span>` : ''}
      <input class="fl-range" type="range" min="0" max="100" step="any" value="50" aria-label="Шторка между макетом и съемкой">
    </div>
    <blockquote class="fl-q"><span class="case-label">${H.T(c.label)}</span><p>${H.T(c.text)}</p></blockquote>
  </div>${cap(c.hint)}`;
}
function livePrompt(box){
  const wipe = box.querySelector('.fl-wipe'), range = box.querySelector('.fl-range');
  const q = box.querySelector('.fl-q p'), full = q.textContent;
  let w = 50, auto = true, raf = 0, seen = false, t0 = 0, typed = false;
  const set = v => { w = v; wipe.style.setProperty('--w', `${v.toFixed(2)}%`); range.value = v; };
  const stop = () => { auto = false; };
  range.addEventListener('input', () => { stop(); set(+range.value); });
  wipe.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    stop();
    const r = wipe.getBoundingClientRect();
    set(clamp((e.clientX - r.left) / r.width * 100, 0, 100));
  });
  // запрос печатается, когда блок доехал до экрана
  const type = () => {
    if (typed) return; typed = true;
    if (still()) return;
    q.textContent = ''; q.classList.add('typing');
    let i = 0;
    const step = () => { i = Math.min(full.length, i + 2); q.textContent = full.slice(0, i); if (i < full.length) setTimeout(step, 22); else q.classList.remove('typing'); };
    step();
  };
  const draw = t => {
    if (!t0) t0 = t;
    // шторка сама ходит туда-обратно, пока ее не тронули
    if (auto) set(50 + Math.sin((t - t0) / 1400) * 32);
    if (seen && auto) raf = requestAnimationFrame(draw);
  };
  onScreen(box, v => {
    if (v) type();
    if (v && !seen) { seen = true; if (!still()) raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  }, '-10% 0px');
}

/* ---------- съемка: лента кадров проезжает при прокрутке, под ней — дорога ---------- */
function lookHTML(c){
  return `<div class="fl-look">
    <div class="fl-strip">${c.items.map(src => `<button class="fl-shot" aria-label="Увеличить кадр"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>
    <i class="fl-dash"></i>
  </div>${cap(c.hint)}`;
}
function liveLook(box){
  const strip = box.querySelector('.fl-strip'), dash = box.querySelector('.fl-dash');
  const btns = [...box.querySelectorAll('.fl-shot')];
  box.addEventListener('click', e => { const b = e.target.closest('.fl-shot'); if (b) zoom(btns, b); });
  // на телефоне лента листается пальцем, на широком экране — едет с прокруткой
  const wide = matchMedia('(hover: hover) and (min-width: 761px)');
  const upd = () => {
    if (!wide.matches) { strip.style.transform = ''; return; }
    const p = still() ? 0 : progress(box);
    const range = Math.max(0, strip.scrollWidth - box.clientWidth);
    strip.style.transform = `translate3d(${(-range * clamp(p * 1.25 - .1, 0, 1)).toFixed(1)}px,0,0)`;
    dash.style.backgroundPosition = `${(-p * 2400).toFixed(1)}px 0`;
  };
  upd();
  box.querySelectorAll('img').forEach(i => i.addEventListener('load', upd, { once: true }));
  onScroll(box, upd);
}

const KINDS = {
  road:   [roadHTML, liveRoad, '.fl-road'],
  refs:   [refsHTML, liveRefs, '.fl-refs'],
  colors: [colorsHTML, liveColors, '.fl-colors'],
  search: [searchHTML, liveSearch, '.fl-search'],
  mark:   [markHTML, liveMark, '.fl-mark'],
  lights: [lightsHTML, liveLights, '.fl-night'],
  prompt: [promptHTML, livePrompt, '.fl-prompt'],
  look:   [lookHTML, liveLook, '.fl-look'],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'fleet.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: на Тильде style.css стоит в body, стили кейса должны идти после него
  });
  return cssReady;
}
// глава появляется, когда доезжает до экрана
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountFleet(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  mount.innerHTML = p.fleet.map(ch => {
    const kind = Object.keys(KINDS).find(k => ch[k]);
    return `<section class="fl-ch wrap fl-${kind}-ch">${head(ch)}<div class="fl-viz">${kind ? KINDS[kind][0](ch[kind]) : ''}</div></section>`;
  }).join('');
  mount.querySelectorAll('.fl-ch').forEach(s => reveal.observe(s));
  Object.values(KINDS).forEach(([, live, sel]) => live && mount.querySelectorAll(sel).forEach(live));
}
