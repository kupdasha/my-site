/* ================================================================
   КЕЙС «VK PLAY, УНИВЕРСАЛЬНЫЙ СТЕНД» (поле stand у проекта)
   Стенд из трех модулей, который брендируется под один бренд
   или под три. План сверху подсвечивает модули, на общем виде
   точки рассказывают, из чего стенд собран, шторка меняет один
   бренд на три, куб крутится и переезжает с подвеса на подставку,
   бегущая строка печатает ваш текст, а стенд обходится прокруткой.
   Тексты — в content.js, оформление — vkplay.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
// подписка на прокрутку кейса (он листается внутри своего окна)
function onScroll(box, cb){
  let raf = 0, seen = false;
  const sc = box.closest('.case') || window;
  const req = () => { if (seen && !raf) raf = requestAnimationFrame(() => { raf = 0; cb(); }); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  onScreen(box, v => { seen = v; req(); }, '200px 0px');
}
// перебор по кругу, пока блок на экране и его не трогали
function autoTour(box, n, show, ms = 2600){
  let i = 0, t = 0, touched = false;
  const step = () => { show(i = (i + 1) % n); };
  onScreen(box, v => {
    clearInterval(t);
    if (v && !touched && !still()) t = setInterval(step, ms);
  });
  return () => { touched = true; clearInterval(t); };
}

const head = ch => `<div class="vp-head">
  <span class="case-label vp-label">${H.T(ch.label)}</span>
  <h2 class="vp-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="vp-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const cap = t => t ? `<p class="vp-cap">${H.T(t)}</p>` : '';

/* ---------- план сверху: чертеж стенда, три модуля подсвечиваются по очереди ---------- */
// чертеж в масштабе: 1 единица — 1 см, площадка 600 на 500. Линии прорисовываются при появлении
const ln = (d, c = '') => `<path class="vp-ln${c}" d="${d}" pathLength="1"/>`;
const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const circ = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
function planSVG(){
  const grid = [];
  for (let x = 50; x < 600; x += 50) grid.push(`M${x} 0V500`);
  for (let y = 50; y < 500; y += 50) grid.push(`M0 ${y}H600`);
  // арка сверху: стойки на концах, между ними — навес с ламелями
  const arch = (x, w, led) => {
    const slats = [];
    for (let y = 40; y <= 460; y += 20) slats.push(`M${x + 8} ${y}H${x + w - 8}`);
    return ln(rr(x, 0, w, 500, 6), ' vp-ln-bg') + ln(rr(x + 4, 4, w - 8, 24, 4), ' vp-ln-fill') + ln(rr(x + 4, 472, w - 8, 24, 4), ' vp-ln-fill')
      + `<path class="vp-ln vp-ln-thin" d="${slats.join('')}" pathLength="1"/>` + ln(`M${led} 0V500`, ' vp-ln-led');
  };
  const pouf = (x, y, r) => ln(circ(x, y, r)) + ln(circ(x, y, r * .45), ' vp-ln-thin');
  return `<svg class="vp-draw" viewBox="-4 -4 608 508" aria-hidden="true">
    <path class="vp-grid" d="${grid.join('')}"/>
    ${ln('M0 0H600V500H0Z', ' vp-ln-bold')}
    ${pouf(376, 65, 50)}${pouf(413, 413, 52)}${pouf(111, 414, 36)}${pouf(486, 290, 38)}
    ${arch(0, 111, 111)}
    ${arch(486, 114, 486)}
    ${ln(rr(198, 150, 200, 200, 16), ' vp-ln-bold')}
    ${ln(rr(228, 178, 142, 144, 6))}
    ${ln(rr(239, 189, 120, 120, 26), ' vp-ln-dash')}
    ${ln('M251 201L347 297M347 201L251 297', ' vp-ln-dash vp-ln-thin')}
  </svg>`;
}
function planHTML(c){
  return `<div class="vp-plan">
    <div class="vp-plan-map">
      <div class="vp-dim vp-dim-w"><i></i><span>${H.T(c.width)}</span></div>
      <div class="vp-plan-pic">
        ${planSVG()}
        ${c.zones.map((z, i) => `<button class="vp-zone" data-i="${i}" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%" aria-label="${esc(H.pick(z.name))}"></button>`).join('')}
      </div>
      <div class="vp-dim vp-dim-h"><i></i><span>${H.T(c.height)}</span></div>
    </div>
    <ul class="vp-zones">${c.zones.map((z, i) => `<li data-i="${i}"><h3>${H.T(z.name)}</h3><p>${H.T(z.text)}</p></li>`).join('')}
      <li class="vp-area">${H.T(c.area)}</li></ul>
  </div>`;
}
function livePlan(box, c){
  const zones = [...box.querySelectorAll('.vp-zone')], items = [...box.querySelectorAll('.vp-zones li[data-i]')];
  const show = i => {
    zones.forEach((z, k) => z.classList.toggle('on', k === i));
    items.forEach((z, k) => z.classList.toggle('on', k === i));
  };
  show(0);
  const stop = autoTour(box, c.zones.length, show);
  [...zones, ...items].forEach(el => {
    const go = () => { stop(); show(+el.dataset.i); };
    el.addEventListener('pointerenter', go);
    el.addEventListener('click', go);
  });
}

/* ---------- из чего собран: точки на общем виде ---------- */
function partsHTML(c){
  return `<div class="vp-parts">
    <div class="vp-stage vp-parts-pic">
      <img src="${c.img}" alt="" draggable="false">
      ${c.spots.map((s, i) => `<button class="vp-spot" data-i="${i}" style="left:${s.x}%;top:${s.y}%" aria-label="${esc(H.pick(s.name))}"><i></i></button>`).join('')}
      <div class="vp-tip" aria-live="polite"><b></b><span></span></div>
    </div>
    <ul class="vp-chips">${c.spots.map((s, i) => `<li><button class="chip vp-part" data-i="${i}">${H.T(s.name)}</button></li>`).join('')}</ul>
  </div>`;
}
function liveParts(box, c){
  const pic = box.querySelector('.vp-parts-pic'), tip = box.querySelector('.vp-tip');
  const spots = [...box.querySelectorAll('.vp-spot')], chips = [...box.querySelectorAll('.vp-part')];
  const show = i => {
    const s = c.spots[i];
    spots.forEach((el, k) => el.classList.toggle('on', k === i));
    chips.forEach((el, k) => el.classList.toggle('on', k === i));
    tip.querySelector('b').innerHTML = H.T(s.name);
    tip.querySelector('span').innerHTML = s.text ? H.T(s.text) : '';
    // подсказка — с той стороны точки, где больше места
    tip.style.left = s.x + '%'; tip.style.top = s.y + '%';
    tip.classList.toggle('left', s.x > 58);
    tip.classList.toggle('up', s.y > 62);
    tip.classList.remove('show'); void tip.offsetWidth; tip.classList.add('show');
  };
  show(0);
  const stop = autoTour(pic, c.spots.length, show, 3000);
  [...spots, ...chips].forEach(el => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { stop(); show(+el.dataset.i); } });
    el.addEventListener('click', () => { stop(); show(+el.dataset.i); });
  });
}

/* ---------- один бренд или три: шторка между одинаковыми ракурсами ---------- */
function brandsHTML(c){
  const v = c.views[0];
  return `<div class="vp-brands">
    <div class="vp-stage vp-wipe" style="--x:50%">
      <img class="vp-wipe-a" src="${v.one}" alt="" draggable="false">
      <img class="vp-wipe-b" src="${v.three}" alt="" draggable="false">
      <span class="vp-wipe-name vp-wipe-name-a">${H.T(c.one)}</span>
      <span class="vp-wipe-name vp-wipe-name-b">${H.T(c.three)}</span>
      <div class="vp-wipe-line"><span class="vp-wipe-knob" role="slider" tabindex="0" aria-label="${esc(H.pick(c.hint))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg></span></div>
    </div>
    ${c.views.length > 1 ? `<div class="vp-bar">${c.views.map((x, i) => `<button class="btn btn-line vp-view${i ? '' : ' on'}" data-i="${i}"><span class="spell">${H.T(x.name)}</span></button>`).join('')}</div>` : ''}
  </div>${cap(c.hint)}`;
}
function liveBrands(box, c){
  const wipe = box.querySelector('.vp-wipe'), knob = box.querySelector('.vp-wipe-knob');
  const a = box.querySelector('.vp-wipe-a'), b = box.querySelector('.vp-wipe-b');
  // ракурсы заранее, чтобы при переключении кадр не мигал
  c.views.slice(1).forEach(v => { new Image().src = v.one; new Image().src = v.three; });
  let x = 50, anim = 0, touched = false;
  const set = v => {
    x = clamp(v, 0, 100);
    wipe.style.setProperty('--x', x + '%');
    knob.setAttribute('aria-valuenow', Math.round(x));
    wipe.classList.toggle('only-a', x > 88);
    wipe.classList.toggle('only-b', x < 12);
  };
  // плавный проезд шторки к точке
  const glide = (to, ms = 900) => new Promise(res => {
    cancelAnimationFrame(anim);
    const from = x, t0 = performance.now();
    const f = t => {
      const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      set(from + (to - from) * e);
      if (k < 1) anim = requestAnimationFrame(f); else res();
    };
    anim = requestAnimationFrame(f);
  });
  // при первом появлении шторка показывает оба варианта
  let shown = false;
  onScreen(wipe, async v => {
    if (!v || shown || still()) return;
    shown = true;
    await glide(84, 800); if (touched) return;
    await glide(16, 1300); if (touched) return;
    glide(50, 900);
  });
  const at = e => { const r = wipe.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
  let drag = false;
  wipe.addEventListener('pointerdown', e => {
    touched = true; drag = true; cancelAnimationFrame(anim);
    wipe.setPointerCapture(e.pointerId); wipe.classList.add('held'); set(at(e));
  });
  wipe.addEventListener('pointermove', e => { if (drag) set(at(e)); });
  const up = () => { drag = false; wipe.classList.remove('held'); };
  wipe.addEventListener('pointerup', up);
  wipe.addEventListener('pointercancel', up);
  knob.addEventListener('keydown', e => {
    const d = { ArrowLeft: -5, ArrowRight: 5 }[e.key];
    if (d) { e.preventDefault(); touched = true; cancelAnimationFrame(anim); set(x + d); }
  });
  box.querySelectorAll('.vp-view').forEach(btn => btn.addEventListener('click', () => {
    const v = c.views[+btn.dataset.i];
    box.querySelectorAll('.vp-view').forEach(o => o.classList.toggle('on', o === btn));
    wipe.classList.add('swap');
    setTimeout(() => { a.src = v.one; b.src = v.three; wipe.classList.remove('swap'); }, 260);
  }));
}

/* ---------- куб VK Play: крутится, переезжает с подвеса на подставку ---------- */
// логотип-иксоник: крестик и кружок, как на кубе в рендерах
const XO = `<svg class="vp-xo" viewBox="0 0 100 50" aria-hidden="true"><path d="M8 9l30 32M38 9L8 41" stroke="currentColor" stroke-width="10" stroke-linecap="round"/><circle cx="74" cy="25" r="16" fill="none" stroke="currentColor" stroke-width="10"/></svg>`;
function cubeHTML(c){
  const face = f => f === 'xo' ? XO : `<span>${esc(H.pick(f))}</span>`;
  const sides = ['front', 'right', 'back', 'left', 'top', 'bottom'];
  return `<div class="vp-cube-box">
    <div class="vp-cube-stage" data-mode="${c.modes[0].key}">
      <div class="vp-cable"></div>
      <div class="vp-cube-spot"><div class="vp-cube">${sides.map((s, i) => `<div class="vp-face vp-${s}">${c.faces[i] ? face(c.faces[i]) : ''}</div>`).join('')}</div></div>
      <div class="vp-post"></div>
      <div class="vp-desk"><div class="vp-desk-led"><div class="vp-led-track">${tickerRun(H.pick(c.desk))}</div></div></div>
      <div class="vp-floor"></div>
    </div>
    <div class="vp-cube-side">
      <div class="vp-bar">${c.modes.map((m, i) => `<button class="btn btn-line vp-mode${i ? '' : ' on'}" data-k="${m.key}"><span class="spell">${H.T(m.name)}</span></button>`).join('')}</div>
      ${c.modes.map((m, i) => `<p class="vp-mode-text${i ? '' : ' on'}" data-k="${m.key}">${H.T(m.text)}</p>`).join('')}
      ${cap(c.hint)}
    </div>
  </div>`;
}
function liveCube(box, c){
  const stage = box.querySelector('.vp-cube-stage'), cube = box.querySelector('.vp-cube');
  const btns = box.querySelectorAll('.vp-mode'), texts = box.querySelectorAll('.vp-mode-text');
  btns.forEach(b => b.addEventListener('click', () => {
    stage.dataset.mode = b.dataset.k;
    btns.forEach(o => o.classList.toggle('on', o === b));
    texts.forEach(t => t.classList.toggle('on', t.dataset.k === b.dataset.k));
  }));
  // вращение: само по себе медленно, пальцем или мышкой — с разгоном и затуханием
  let ang = -28, tilt = -14, vel = .12, raf = 0, last = 0, drag = null;
  const draw = t => {
    const dt = last ? Math.min(48, t - last) : 16; last = t;
    if (!drag) { vel += (.12 - vel) * .02 * dt / 16; ang += vel * dt / 16; tilt += (-14 - tilt) * .04; }
    cube.style.transform = `rotateX(${tilt.toFixed(2)}deg) rotateY(${ang.toFixed(2)}deg)`;
    raf = requestAnimationFrame(draw);
  };
  cube.style.transform = `rotateX(${tilt}deg) rotateY(${ang}deg)`;
  const spot = box.querySelector('.vp-cube-spot');
  spot.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY, t: performance.now() };
    spot.setPointerCapture(e.pointerId); spot.classList.add('held');
  });
  spot.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now();
    ang += dx * .5; tilt = clamp(tilt - dy * .3, -40, 20);
    vel = dx * .5 / Math.max(8, now - drag.t) * 16;
    drag = { x: e.clientX, y: e.clientY, t: now };
    if (still()) cube.style.transform = `rotateX(${tilt}deg) rotateY(${ang}deg)`;
  });
  const up = () => { drag = null; spot.classList.remove('held'); };
  spot.addEventListener('pointerup', up);
  spot.addEventListener('pointercancel', up);
  if (still()) return;
  onScreen(stage, v => { cancelAnimationFrame(raf); last = 0; if (v) raf = requestAnimationFrame(draw); });
}

/* ---------- бегущая строка: лайн, логотипы или ваш текст ---------- */
const SEP = '<i class="vp-led-dot"></i>';
// строка повторяется дважды: лента едет на половину и бесшовно начинается заново
function tickerRun(text){
  const one = `<span class="vp-led-run">${Array.from({ length: 4 }, () => `<span>${esc(text)}</span>${SEP}`).join('')}</span>`;
  return one + one.replace('class="vp-led-run"', 'class="vp-led-run" aria-hidden="true"');
}
function tickerHTML(c){
  return `<div class="vp-ticker">
    <div class="vp-led"><div class="vp-led-track">${tickerRun(H.pick(c.lines[0]))}</div></div>
    <div class="vp-ticker-ctrl">
      <ul class="vp-chips">${c.lines.map((l, i) => `<li><button class="chip vp-line${i ? '' : ' on'}" data-i="${i}">${esc(H.pick(l))}</button></li>`).join('')}</ul>
      <form class="vp-form" autocomplete="off">
        <input class="vp-input" name="t" maxlength="40" placeholder="${esc(H.pick(c.placeholder))}" aria-label="${esc(H.pick(c.placeholder))}">
        <button class="btn btn-line" type="submit"><span class="spell">${H.T(c.button)}</span></button>
      </form>
    </div>
  </div>${cap(c.hint)}`;
}
function setRun(track, text){
  track.classList.add('swap');
  setTimeout(() => {
    track.innerHTML = tickerRun(text);
    // скорость постоянная: длинная строка едет дольше
    track.style.setProperty('--dur', clamp(text.length * .9, 8, 40) + 's');
    track.classList.remove('swap');
  }, 220);
}
function liveTicker(box, c){
  const track = box.querySelector('.vp-led-track'), chips = box.querySelectorAll('.vp-line');
  track.style.setProperty('--dur', clamp(H.pick(c.lines[0]).length * .9, 8, 40) + 's');
  chips.forEach(b => b.addEventListener('click', () => {
    chips.forEach(o => o.classList.toggle('on', o === b));
    setRun(track, H.pick(c.lines[+b.dataset.i]));
  }));
  const form = box.querySelector('.vp-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = form.t.value.trim().replace(/\s+/g, ' ');
    if (!t) { form.t.focus(); return; }
    chips.forEach(o => o.classList.remove('on'));
    setRun(track, t);
  });
}

/* ---------- обход стенда: кадры едут вбок, пока листаете вниз ---------- */
function walkHTML(c){
  return `<div class="vp-walk" style="--n:${c.items.length}">
    <div class="vp-walk-pin"><div class="vp-walk-track">${c.items.map(it =>
      `<figure class="vp-walk-item"><button class="vp-stage vp-walk-shot" aria-label="Увеличить кадр"><img src="${it.img}" alt="" loading="lazy" draggable="false"></button>${
        it.cap ? `<figcaption>${H.T(it.cap)}</figcaption>` : ''}</figure>`).join('')}</div></div>
  </div>${cap(c.hint)}`;
}
function liveWalk(box){
  const walk = box.querySelector('.vp-walk'), track = box.querySelector('.vp-walk-track');
  const list = [...box.querySelectorAll('.vp-walk-shot')];
  box.addEventListener('click', e => {
    const b = e.target.closest('.vp-walk-shot');
    if (!b) return;
    const imgs = list.map(x => x.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), list.indexOf(b), imgs);
  });
  onScroll(walk, () => {
    const r = walk.getBoundingClientRect(), vh = innerHeight;
    const k = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    const shift = Math.max(0, track.scrollWidth - track.parentNode.clientWidth);
    track.style.transform = `translate3d(${(-k * shift).toFixed(1)}px,0,0)`;
  });
}

const KINDS = {
  plan:   [planHTML, livePlan],
  parts:  [partsHTML, liveParts],
  brands: [brandsHTML, liveBrands],
  cube:   [cubeHTML, liveCube],
  ticker: [tickerHTML, liveTicker],
  walk:   [walkHTML, liveWalk],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'vkplay.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountStand(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const kinds = p.stand.map(ch => Object.keys(KINDS).find(k => ch[k]));
  mount.innerHTML = p.stand.map((ch, i) =>
    `<section class="vp-ch ${kinds[i] === 'walk' ? '' : 'wrap '}vp-${kinds[i]}-ch">${kinds[i] === 'walk' ? `<div class="wrap">${head(ch)}</div>` : head(ch)}<div class="vp-viz">${
      kinds[i] ? KINDS[kinds[i]][0](ch[kinds[i]]) : ''}</div></section>`).join('');
  mount.querySelectorAll('.vp-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.vp-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.vp-viz'), p.stand[i][k]); });
}
