/* ================================================================
   КЕЙС «ПУШКИНСКИЙ БАЛ В МЕТАВСЕЛЕННОЙ» (поле ball у проекта)
   halls  — анфилада: прокрутка ведет сквозь арку в следующий зал,
            залы — рендеры метавселенной;
   podium — ролик организаторов: курсор (или палец) перематывает
            проход вдоль подиума, без касания ролик идет сам;
   wall   — конкурсные работы в золотых рамах, развеской как
            во дворце, по нажатию — крупно;
   zones  — часовые пояса от Калининграда до Владивостока:
            время настоящее, небо по местному часу, двери открыты.
   Тексты — в content.js, оформление — ball.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
// прокрутка кейса идет внутри .case, на Тильде — у окна
function onScroll(box, cb){
  let raf = 0, seen = false;
  const sc = box.closest('.case') || window;
  const req = () => { if (seen && !raf) raf = requestAnimationFrame(() => { raf = 0; cb(); }); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  onScreen(box, v => { seen = v; req(); }, '200px 0px');
}

const head = c => `<div class="bl-head">
  <span class="case-label bl-label">${H.T(c.label)}</span>
  <h2 class="bl-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="bl-text">${H.T(c.text)}</p>` : ''}
</div>`;

/* ================================================================
   halls — анфилада. Текущий зал во весь кадр, в его глубине — арка,
   а в ней следующий зал. Прокрутка приближает арку, пока она не
   закроет кадр: следующий зал становится текущим
   ================================================================ */
const AX = .5, AY = .6;   // точка схода — где в кадре стоит дальняя арка
const Z0 = .38;           // во сколько раз приблизится текущий зал, пока идем к арке
const DW = .15, DH = 1.5, G = 11;   // ширина арки от кадра, высота от ширины, во сколько раз она вырастет

function hallsHTML(c){
  const rooms = c.rooms;
  return `<div class="bl-halls" style="--n:${rooms.length}">
    <div class="bl-pin">
      <div class="bl-stage">${rooms.map((r, i) =>
        `<div class="bl-layer" data-i="${i}"><img src="${esc(r.img)}" alt="" ${i < 2 ? '' : 'loading="lazy" '}decoding="async" draggable="false"></div>`).join('')}
        <div class="bl-door" aria-hidden="true"></div>
      </div>
      <div class="bl-cap">
        <div class="bl-cap-txt">${rooms.map((r, i) =>
          `<p class="bl-cap-one${i ? '' : ' on'}"><b>${H.T(r.name)}</b><span>${H.T(r.text)}</span></p>`).join('')}</div>
        <div class="bl-dots" aria-hidden="true">${rooms.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
      </div>
    </div>
  </div>`;
}
function liveHalls(box){
  const halls = box.querySelector('.bl-halls'), stage = box.querySelector('.bl-stage');
  const layers = [...box.querySelectorAll('.bl-layer')], door = box.querySelector('.bl-door');
  const caps = [...box.querySelectorAll('.bl-cap-one')], dots = [...box.querySelectorAll('.bl-dots i')];
  const n = layers.length;
  if (still()) { halls.classList.add('flat'); return; }
  let shown = -1, W = 0, Hh = 0, inDoor = -1;
  const size = () => { W = stage.clientWidth; Hh = stage.clientHeight; };
  const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const draw = () => {
    if (!W) size();
    const r = halls.getBoundingClientRect(), pin = box.querySelector('.bl-pin').offsetHeight;
    const run = Math.max(1, r.height - pin);
    const t = clamp(-r.top / run, 0, 1) * (n - 1);
    const i = Math.min(n - 1, Math.floor(t)), p = i === n - 1 ? 0 : t - i, e = ease(p);
    const vx = W * AX, vy = Hh * AY;
    // следующий зал — в арке; арка растет от точки схода, зал в ней — до размера кадра
    const next = i < n - 1 ? layers[i + 1] : null;
    if (inDoor !== i) {
      if (inDoor >= 0 && layers[inDoor + 1]) { const back = layers[inDoor + 1]; stage.insertBefore(back, door); back.classList.remove('in-door'); back.style.cssText = ''; }
      if (next) { door.appendChild(next); next.classList.add('in-door'); }
      inDoor = next ? i : -1;
    }
    // текущий зал наезжает на камеру; остальные спрятаны
    layers.forEach((l, k) => {
      const cur = k === i;
      l.style.visibility = cur ? 'visible' : 'hidden';
      if (cur) l.style.transform = `translate(${vx}px,${vy}px) scale(${Math.pow(1 / Z0, e)}) translate(${-vx}px,${-vy}px)`;
    });
    door.style.visibility = next ? 'visible' : 'hidden';
    if (next) {
      const g = Math.pow(G, e), dw = W * DW * g, dh = W * DW * DH * g;
      const dl = vx - dw / 2, dt = vy - dh * .55;
      door.style.width = dw + 'px'; door.style.height = dh + 'px';
      door.style.transform = `translate(${dl}px,${dt}px)`;
      // зал в арке заполняет видимую часть арки (как object-fit: cover): пока арка мала — видна середина
      // зала, когда арка закрыла кадр — зал ровно во весь кадр и становится текущим без скачка
      const bx = Math.max(dl, 0), by = Math.max(dt, 0), br = Math.min(dl + dw, W), bb = Math.min(dt + dh, Hh);
      const z = Math.max((br - bx) / W, (bb - by) / Hh);
      next.style.visibility = 'visible';
      next.style.width = W * z + 'px'; next.style.height = Hh * z + 'px';
      next.style.transform = `translate(${(bx + br - W * z) / 2 - dl}px,${(by + bb - Hh * z) / 2 - dt}px)`;
    }
    // подпись — у зала, который ближе
    const near = Math.round(t);
    if (near !== shown) {
      shown = near;
      caps.forEach((c, k) => c.classList.toggle('on', k === near));
      dots.forEach((d, k) => d.classList.toggle('on', k === near));
    }
  };
  addEventListener('resize', () => { W = 0; });
  onScroll(halls, draw);
  requestAnimationFrame(draw);
}

/* ================================================================
   podium — ролик организаторов: курсор по кадру перематывает
   проход вдоль подиума; без касания ролик идет сам по кругу
   ================================================================ */
function podiumHTML(c){
  const small = innerWidth < 700 && c.videoS;
  return `<figure class="bl-film-wrap">
    <div class="bl-film" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${esc(H.pick(c.title))}">
      <video src="${esc(small ? c.videoS : c.video)}" poster="${esc(c.poster)}" muted loop playsinline preload="auto"></video>
    </div>
    <div class="bl-track" aria-hidden="true"><i></i><b></b></div>
    ${c.note ? `<figcaption class="bl-note">${H.T(c.note)}</figcaption>` : ''}
  </figure>`;
}
function livePodium(box, c){
  const film = box.querySelector('.bl-film'), v = film.querySelector('video');
  const track = box.querySelector('.bl-track');
  let on = false, hold = false, idle = 0, want = -1, seeking = false;
  const dur = () => v.duration || 32;
  // первые секунды ролика — табличка у входа; начинаем сразу с подиума
  v.addEventListener('loadedmetadata', () => { if (!hold && v.currentTime < 1) v.currentTime = c.start || 0; }, { once: true });
  const play = () => { if (on && !hold && !still()) v.play().catch(() => {}); };
  // перемотка: пока предыдущая не закончилась, запоминаем только последнюю точку
  const seek = s => {
    want = clamp(s, 0, dur() - .05);
    if (seeking) return;
    seeking = true;
    if (v.fastSeek && Math.abs(v.currentTime - want) > 2) v.fastSeek(want); else v.currentTime = want;
  };
  v.addEventListener('seeked', () => {
    seeking = false;
    if (want >= 0 && Math.abs(v.currentTime - want) > .04) seek(want); else want = -1;
  });
  const grab = () => { hold = true; v.pause(); clearTimeout(idle); };
  const letGo = () => { clearTimeout(idle); idle = setTimeout(() => { hold = false; play(); }, 1600); };
  const at = e => { const r = film.getBoundingClientRect(); seek(clamp((e.clientX - r.left) / r.width, 0, 1) * dur()); };
  let drag = false;
  // мышь: перематывает только настоящее движение — если кадр просто проехал под курсором при прокрутке, ролик идет дальше
  film.addEventListener('pointermove', e => { if (drag || (e.pointerType === 'mouse' && (e.movementX || e.movementY))) { grab(); at(e); } });
  film.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') letGo(); });
  film.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { drag = true; grab(); at(e); } });
  const up = () => { if (drag) { drag = false; letGo(); } };
  film.addEventListener('pointerup', up); film.addEventListener('pointercancel', up);
  film.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); grab(); seek(v.currentTime + (e.key === 'ArrowLeft' ? -1.5 : 1.5)); letGo();
  });
  // полоска под кадром — где мы на подиуме
  let raf = 0;
  const tick = () => {
    const k = v.currentTime / dur();
    track.style.setProperty('--k', k);
    film.setAttribute('aria-valuenow', Math.round(k * 100));
    raf = on ? requestAnimationFrame(tick) : 0;
  };
  onScreen(film, vis => {
    on = vis;
    if (vis) { play(); if (!raf) raf = requestAnimationFrame(tick); } else v.pause();
  }, '0px 0px -10% 0px');
}

/* ================================================================
   wall — работы конкурса в золотых рамах; рамы «вешаются» по очереди
   ================================================================ */
const thumb = s => s.replace(/(\.\w+)$/, '-s$1');
function wallHTML(c){
  return `<div class="bl-wall">${c.works.map((w, i) =>
    `<button class="bl-frame" type="button" style="--d:${(i % 4) * .09 + Math.floor(i / 4) * .14}s;--r:${(i % 3 - 1) * 2.4}deg" aria-label="Увеличить работу">
      <img src="${esc(thumb(w))}" alt="" loading="lazy" decoding="async" draggable="false">
    </button>`).join('')}</div>`;
}
function liveWall(box, c){
  const frames = [...box.querySelectorAll('.bl-frame')], imgs = frames.map(f => f.querySelector('img'));
  frames.forEach((f, i) => f.addEventListener('click', () => H.openViewer(c.works, i, imgs)));
  const wall = box.querySelector('.bl-wall');
  onScreen(wall, v => { if (v) wall.classList.add('hung'); }, '0px 0px -15% 0px');
}

/* ================================================================
   zones — от Калининграда до Владивостока: местное время, небо
   по часу, у каждого города открытая дверь
   ================================================================ */
// цвет неба по часу: ночь, сиреневый рассвет, день, сиреневый закат (без оранжевого)
const SKY = [[0, '#111631'], [4.5, '#1B2147'], [6.5, '#5B5A93'], [8, '#B7A9DA'], [10, '#A8CBEA'], [13, '#CFE5F6'],
             [17, '#A8CBEA'], [19, '#B7A9DA'], [20.5, '#5B5A93'], [22, '#1B2147'], [24, '#111631']];
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function sky(h){
  h = ((h % 24) + 24) % 24;
  let k = 0; while (SKY[k + 1][0] < h) k++;
  const [h0, c0] = SKY[k], [h1, c1] = SKY[k + 1], f = (h - h0) / (h1 - h0);
  const a = hex(c0), b = hex(c1);
  return a.map((x, i) => Math.round(x + (b[i] - x) * f));
}
const rgb = c => `rgb(${c.join(',')})`;
const light = c => (c[0] * .299 + c[1] * .587 + c[2] * .114) > 150;

function zonesHTML(c){
  return `<div class="bl-zones">${c.cities.map(([name]) =>
    `<div class="bl-zone">
      <span class="bl-orb" aria-hidden="true"></span>
      <span class="bl-city">${H.T(name)}</span>
      <span class="bl-time">--:--</span>
      <span class="bl-open"><svg viewBox="0 0 24 30" aria-hidden="true"><path d="M3 29V12A9 9 0 0 1 21 12V29Z"/></svg>${H.T(c.open)}</span>
    </div>`).join('')}</div>`;
}
function liveZones(box, c){
  const zones = [...box.querySelectorAll('.bl-zone')];
  const draw = () => {
    const now = new Date(), utc = now.getUTCHours() + now.getUTCMinutes() / 60;
    zones.forEach((z, i) => {
      const off = c.cities[i][1], h = (utc + off + 24) % 24;
      const a = sky(h), b = sky(h + 1);
      z.style.setProperty('--a', rgb(a)); z.style.setProperty('--b', rgb(b));
      z.classList.toggle('lt', light(a));
      // солнце днем, луна ночью; высота — по часу
      const day = h >= 6 && h < 20, arc = day ? Math.sin((h - 6) / 14 * Math.PI) : Math.sin(((h + 4) % 24) / 10 * Math.PI);
      z.classList.toggle('night', !day);
      z.style.setProperty('--y', (1 - clamp(arc, 0, 1)).toFixed(3));
      const hh = Math.floor(h), mm = Math.floor((h - hh) * 60 + 1e-6);
      z.querySelector('.bl-time').textContent = `${hh}:${String(mm).padStart(2, '0')}`;
    });
  };
  draw();
  let t = 0;
  onScreen(box, v => { clearInterval(t); if (v) { draw(); t = setInterval(draw, 15000); } });
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'ball.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

const KINDS = {
  halls:  [hallsHTML, liveHalls],
  podium: [podiumHTML, livePodium],
  wall:   [wallHTML, liveWall],
  zones:  [zonesHTML, liveZones],
};
export async function mountBall(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const b = p.ball, keys = Object.keys(KINDS).filter(k => b[k]);
  mount.innerHTML = keys.map(k =>
    `<section class="bl-ch bl-${k}-ch"><div class="wrap">${head(b[k])}</div><div class="wrap bl-viz">${KINDS[k][0](b[k])}</div></section>`).join('');
  keys.forEach(k => {
    const box = mount.querySelector(`.bl-${k}-ch`);
    reveal.observe(box);
    KINDS[k][1](box, b[k]);
  });
}
