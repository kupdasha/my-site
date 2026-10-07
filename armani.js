/* ================================================================
   КЕЙС ARMANI/CASA (поле casa у проекта, см. Armani Casa)
   Как рождался ролик: огурцы режиссера разлетаются по столу,
   раскадровка играет сама, как аниматик, со «светом» по кадрам;
   квартира собирается от чертежа до рендера при прокрутке;
   свет переключается кнопками; правки заказчика — лентой.
   Тексты — в content.js, оформление — armani.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

// версия для ?v=: на сайте меняется раз в час, на локальном превью — при каждой загрузке
const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isVideo = s => /\.mp4(\?|$)/.test(s);
// следит, на экране ли блок: живые анимации крутятся только там
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
// подписка на прокрутку кейса (он листается внутри своего окна) и окна
function onScroll(box, cb){
  let raf = 0, seen = false;
  const sc = box.closest('.case') || window;
  const req = () => { if (seen && !raf) raf = requestAnimationFrame(() => { raf = 0; cb(); }); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  onScreen(box, v => { seen = v; req(); }, '200px 0px');
}
// увеличение картинок: листаются только картинки, ролики пропускаются
const zoom = (list, el) => {
  const imgs = list.map(b => b.querySelector('img')).filter(Boolean);
  const i = imgs.indexOf(el.querySelector('img'));
  if (i >= 0) H.openViewer(imgs.map(x => x.currentSrc || x.src), i, imgs);
};
// тихие ролики играют, только пока видны
const player = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && !still()) v.play().catch(() => {}); else v.pause();
}), { threshold: .25 });
const vid = (src, poster) => `<video src="${src}"${poster ? ` poster="${poster}"` : ''} muted loop playsinline preload="metadata"></video>`;

const head = ch => `<div class="ac-head">
  <span class="case-label ac-label">${H.T(ch.label)}</span>
  <h2 class="ac-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="ac-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const cap = t => t ? `<p class="ac-cap">${H.T(t)}</p>` : '';

/* ---------- огурцы режиссера: листы вразброс на столе, при прокрутке ложатся ровно ---------- */
function deskHTML(c){
  return `<div class="ac-desk">${c.items.map(src =>
    `<button class="ac-sheet" aria-label="Увеличить набросок"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>${cap(c.hint)}`;
}
// как листы лежат «вразброс»: сдвиг к центру стола и поворот
const SCATTER = [[.9, .1, -11], [.3, -.12, 7], [-.3, .16, -5], [-.9, -.06, 10]];
function liveDesk(box){
  const sheets = [...box.querySelectorAll('.ac-sheet')];
  box.addEventListener('click', e => { const b = e.target.closest('.ac-sheet'); if (b) zoom(sheets, b); });
  const upd = () => {
    const r = box.getBoundingClientRect(), vh = innerHeight;
    // разложены, когда стол поднялся до середины экрана
    const t = still() ? 1 : clamp((vh - r.top) / (vh * .7), 0, 1);
    const e = t * t * (3 - 2 * t);
    const cx = r.left + r.width / 2;
    sheets.forEach((s, i) => {
      const [, dy, rot] = SCATTER[i % 4];
      // к центру стола: настоящая разница между листом и серединой
      s.style.transform = 'none';
      const sr = s.getBoundingClientRect();
      const toC = cx - (sr.left + sr.width / 2);
      const k = 1 - e;
      s.style.transform = `translate3d(${(toC * .9 * k).toFixed(1)}px,${(dy * sr.height * k).toFixed(1)}px,0) rotate(${(rot * k).toFixed(2)}deg)`;
      s.style.zIndex = String(i + 1);
    });
  };
  upd();
  onScroll(box, upd);
}

/* ---------- раскадровка-плеер: кадры сменяют друг друга с медленным наездом ---------- */
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>';
function boardHTML(c){
  return `<div class="ac-board">
    <div class="ac-screen">
      <div class="ac-layer"><img alt="" draggable="false"></div>
      <div class="ac-layer"><img alt="" draggable="false"></div>
      <i class="ac-beam" aria-hidden="true"></i>
      <button class="ac-play" aria-label="Пауза">${PAUSE}</button>
    </div>
    <p class="ac-line" aria-live="polite"></p>
    <div class="ac-reel">${c.frames.map((f, i) =>
      `<button class="ac-thumb" data-i="${i}" aria-label="${f.text.replace(/"/g, '&quot;')}"><img src="${f.img}" alt="" loading="lazy" draggable="false"><i></i></button>`).join('')}</div>
  </div>${cap(c.hint)}`;
}
function liveBoard(box, c){
  const F = c.frames, N = F.length, DUR = 3600;
  const scr = box.querySelector('.ac-screen');
  const layers = [...box.querySelectorAll('.ac-layer')];
  const line = box.querySelector('.ac-line');
  const thumbs = [...box.querySelectorAll('.ac-thumb')];
  const reel = box.querySelector('.ac-reel');
  const btn = box.querySelector('.ac-play');
  let cur = -1, front = 0, t0 = 0, raf = 0, seen = false, hover = false, paused = still();
  const pre = i => { const im = new Image(); im.src = F[i % N].img; };
  const show = i => {
    cur = (i + N) % N;
    front = 1 - front;
    const L = layers[front], img = L.querySelector('img');
    img.src = F[cur].img;
    // наезд каждый раз в свою сторону, чтобы кадры «дышали» по-разному
    L.style.setProperty('--ox', ['30%', '70%', '50%', '40%'][cur % 4]);
    L.style.setProperty('--oy', ['40%', '60%', '30%', '55%'][cur % 4]);
    L.classList.remove('on'); void L.offsetWidth; L.classList.add('on');
    layers[1 - front].classList.remove('on');
    scr.classList.toggle('lit', !!F[cur].light);
    line.classList.remove('in'); void line.offsetWidth;
    line.innerHTML = H.T(F[cur].text); line.classList.add('in');
    thumbs.forEach((b, k) => b.classList.toggle('on', k === cur));
    // активная миниатюра — в поле зрения ленты, страница при этом не прыгает
    const b = thumbs[cur];
    reel.scrollTo({ left: b.offsetLeft - reel.clientWidth / 2 + b.offsetWidth / 2, behavior: still() ? 'auto' : 'smooth' });
    t0 = performance.now();
    pre(cur + 1);
  };
  const tick = t => {
    raf = 0;
    if (!seen) return;
    if (paused || hover) { t0 = t - (thumbs[cur].style.getPropertyValue('--p') || 0) * DUR; }
    else {
      const p = (t - t0) / DUR;
      if (p >= 1) show(cur + 1);
      else thumbs[cur].style.setProperty('--p', p.toFixed(3));
    }
    raf = requestAnimationFrame(tick);
  };
  const run = () => { if (!raf && seen) raf = requestAnimationFrame(tick); };
  const setPaused = v => {
    paused = v;
    btn.innerHTML = v ? PLAY : PAUSE;
    btn.setAttribute('aria-label', v ? 'Смотреть' : 'Пауза');
    box.classList.toggle('paused', v);
  };
  btn.addEventListener('click', () => setPaused(!paused));
  scr.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = true; box.classList.add('hold'); } });
  scr.addEventListener('pointerleave', () => { hover = false; box.classList.remove('hold'); });
  reel.addEventListener('click', e => {
    const b = e.target.closest('.ac-thumb'); if (!b) return;
    thumbs.forEach(x => x.style.setProperty('--p', 0));
    show(+b.dataset.i);
  });
  setPaused(paused);
  show(0);
  onScreen(box, v => { seen = v; if (v) run(); }, '-15% 0px');
}

/* ---------- квартира с нуля: картинка стоит на месте, шаги сменяются при прокрутке ---------- */
function buildHTML(c){
  const n = c.steps.length;
  return `<div class="ac-build" style="--n:${n}">
    <div class="ac-pin">
      <div class="ac-stage">${c.steps.map((s, i) =>
        `<button class="ac-step${i ? '' : ' on'}" aria-label="Увеличить"><img src="${s.img}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>
      <div class="ac-side">
        <div class="ac-bars">${c.steps.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
        <div class="ac-says">${c.steps.map((s, i) => `<p class="ac-say${i ? '' : ' on'}">${H.T(s.text)}</p>`).join('')}</div>
      </div>
    </div>
  </div>${cap(c.hint)}`;
}
function liveBuild(box){
  const steps = [...box.querySelectorAll('.ac-step')];
  const says = [...box.querySelectorAll('.ac-say')];
  const bars = [...box.querySelectorAll('.ac-bars i')];
  const n = steps.length;
  box.addEventListener('click', e => { const b = e.target.closest('.ac-step'); if (b) zoom(steps, b); });
  let cur = 0;
  const upd = () => {
    const r = box.getBoundingClientRect(), vh = innerHeight;
    const p = clamp(-r.top / Math.max(1, r.height - vh), 0, .9999);
    const i = Math.floor(p * n);
    bars.forEach((b, k) => b.style.setProperty('--f', clamp(p * n - k, 0, 1).toFixed(3)));
    if (i === cur) return;
    cur = i;
    [steps, says, bars].forEach(list => list.forEach((el, k) => el.classList.toggle('on', k === i)));
  };
  upd();
  onScroll(box, upd);
}

/* ---------- свет: три сценария, кнопки переключают ролик и подборку ---------- */
function lightHTML(c){
  return `<div class="ac-light">
    <div class="ac-modes" role="tablist">${c.modes.map((m, i) =>
      `<button class="ac-mode${i ? '' : ' on'}" role="tab" aria-selected="${!i}" data-i="${i}">${H.T(m.name)}</button>`).join('')}</div>
    <div class="ac-panels">${c.modes.map((m, i) => `<div class="ac-panel${i ? '' : ' on'}" role="tabpanel">
      <div class="ac-film">${vid(m.video, m.poster)}</div>
      <p class="ac-about">${H.T(m.text)}</p>
      ${m.items ? `<div class="ac-row">${m.items.map(src => isVideo(src)
        ? `<div class="ac-cell">${vid(src)}</div>`
        : `<button class="ac-cell" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>` : ''}
    </div>`).join('')}</div>
  </div>${cap(c.hint)}`;
}
function liveLight(box){
  const modes = [...box.querySelectorAll('.ac-mode')];
  const panels = [...box.querySelectorAll('.ac-panel')];
  let seen = false;
  const sync = () => panels.forEach(p => p.querySelectorAll('video').forEach(v => {
    if (seen && p.classList.contains('on') && !still()) v.play().catch(() => {}); else v.pause();
  }));
  modes.forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i;
    modes.forEach((x, k) => { x.classList.toggle('on', k === i); x.setAttribute('aria-selected', k === i); });
    panels.forEach((p, k) => p.classList.toggle('on', k === i));
    sync();
  }));
  box.addEventListener('click', e => {
    const b = e.target.closest('button.ac-cell'); if (!b) return;
    zoom([...b.closest('.ac-row').querySelectorAll('.ac-cell')], b);
  });
  onScreen(box, v => { seen = v; sync(); }, '-10% 0px');
}

/* ---------- правки: лента скриншотов с комментариями и роликов с пометками ---------- */
function notesHTML(c){
  return `<div class="ac-notes">${c.items.map(src => isVideo(src)
    ? `<div class="ac-note tall">${vid(src)}</div>`
    : `<button class="ac-note" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>${cap(c.hint)}`;
}
function liveNotes(box){
  const list = [...box.querySelectorAll('.ac-note')];
  box.addEventListener('click', e => { const b = e.target.closest('button.ac-note'); if (b) zoom(list, b); });
  box.querySelectorAll('video').forEach(v => player.observe(v));
}

const KINDS = {
  desk:  [deskHTML, liveDesk, '.ac-desk'],
  board: [boardHTML, liveBoard, '.ac-board'],
  build: [buildHTML, liveBuild, '.ac-build'],
  light: [lightHTML, liveLight, '.ac-light'],
  notes: [notesHTML, liveNotes, '.ac-notes'],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'armani.css?v=' + VERS;
    l.onload = l.onerror = res; document.head.appendChild(l);
  });
  return cssReady;
}
// глава появляется, когда доезжает до экрана
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountCasa(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const chs = p.casa.map(ch => ({ ch, kind: Object.keys(KINDS).find(k => ch[k]) }));
  mount.innerHTML = chs.map(({ ch, kind }) =>
    `<section class="ac-ch wrap ac-${kind}-ch">${head(ch)}<div class="ac-viz">${kind ? KINDS[kind][0](ch[kind]) : ''}</div></section>`).join('');
  const secs = [...mount.querySelectorAll('.ac-ch')];
  secs.forEach((s, i) => {
    reveal.observe(s);
    const { ch, kind } = chs[i];
    if (kind) KINDS[kind][1](s.querySelector(KINDS[kind][2]), ch[kind]);
  });
}
