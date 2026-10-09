/* ================================================================
   КЕЙС «TELE2, КОНФЕРЕНЦИЯ «ВЫХОДИ ЗА РАМКИ»» (поле tele у проекта)
   illusion — фотозона с иллюзией: панели на разной глубине, TELE2
              собирается только с одной точки; камеры 30 и 40 мм,
              схема сверху, точка зрителя — посередине;
   pixels   — панно из поворотных плашек: рисовать курсором или
              пальцем, без касания рисует само;
   wishes   — кубы с пожеланиями: гора кубов растет, нажатие ставит
              свой куб, рядом — маленькое превью рендера;
   things   — сцена, стойки, фольга, куб, награды, кубы, дженга.
   Тексты — в content.js, оформление — tele.css, картинки — img/tele2.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => matchMedia('(max-width:760px)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const small = s => s.replace(/\.webp$/, '-s.webp');
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
const css = (el, v) => getComputedStyle(el).getPropertyValue(v).trim();
const LIME = '#E2FB5A';

const head = c => `<div class="t2-head">
  <span class="case-label t2-label">${H.T(c.label)}</span>
  <h2 class="t2-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="t2-text">${H.T(c.text)}</p>` : ''}
</div>`;

/* ================================================================
   illusion — фотозона-обманка. Зритель смотрит вдоль +z из точки E,
   панели стоят на разной глубине. Буквы TELE2 нарисованы в плоскости
   ZD и спроецированы из E на панели: из E логотип целый, с любой
   другой точки куски разъезжаются. Все плоскости фронтальные, поэтому
   панель на экране — прямоугольник, а перенос в кадр — простое
   масштабирование (setTransform)
   ================================================================ */
const E = { x: 0, y: 1.5, z: 0 };   // точка зрителя, высота камеры — 1,5
const ZD = 5;                       // плоскость, в которой задуман логотип
const DEPTH = .14;                  // толщина панели
// x0, x1, y0, y1, z; t — слоган на низкой табличке
const PANELS = [
  [-2.4, -.7, 0, 3.4, 6.6],
  [-.9, .35, 0, 2.35, 3.9],
  [.25, 2.6, 0, 3.3, 7.2],
  [.7, 1.7, 0, 2.5, 4.4],
  [-2.3, -1.25, 0, .7, 3.4, 0],
  [1.15, 2.2, 0, .7, 3.5, 1],
].map(([x0, x1, y0, y1, z, t]) => ({ x0, x1, y0, y1, z, t }));
const BACK = 8.6;                   // черная стена со слоганами
// фокусное (эквивалент 35 мм) → горизонтальный угол кадра
const fovOf = mm => 2 * Math.atan(18 / mm);
// где встает фотограф, чтобы зона (5 м и запас) вошла в кадр; точка зрителя — посередине
const fit = mm => 2.75 / Math.tan(fovOf(mm) / 2);
// буквы из брусков: ширина буквы W, высота LH, толщина S
const LW = .62, LH = 1.5, LS = .2, GAP = .08;
function wordBars(){
  const w = LW, h = LH, s = LS;
  const L = {
    T: [[0, h - s, w, h], [w / 2 - s / 2, 0, w / 2 + s / 2, h - s]],
    E: [[0, 0, s, h], [s, h - s, w, h], [s, (h - s) / 2, w * .86, (h + s) / 2], [s, 0, w, s]],
    L: [[0, 0, s, h], [s, 0, w, s]],
    2: [[0, h - s, w, h], [w - s, (h - s) / 2, w, h - s], [0, (h - s) / 2, w, (h + s) / 2], [0, s, s, (h - s) / 2], [0, 0, w, s]],
  };
  const word = ['T', 'E', 'L', 'E', 2], total = word.length * w + (word.length - 1) * GAP;
  const out = [];
  word.forEach((ch, i) => {
    const ox = -total / 2 + i * (w + GAP), oy = 1.05;
    L[ch].forEach(([a, b, c, d]) => out.push([ox + a, oy + b, ox + c, oy + d]));
  });
  return out;
}
const BARS = wordBars();
// дальние панели чуть темнее ближних — так видно глубину даже из точки зрителя
const tone = z => { const v = Math.round(clamp(244 - (z - 3) * 6, 214, 244)); return `rgb(${v},${v},${v - 3})`; };

function illusionHTML(c){
  return `<div class="t2-ill">
    <div class="t2-view"><canvas class="t2-cv" aria-label="${esc(H.pick(c.alt))}"></canvas></div>
    <div class="t2-side">
      <div class="t2-cams" role="group">${c.cams.map((m, i) =>
        `<button class="btn btn-line t2-cam${i ? '' : ' on'}" data-i="${i}" aria-pressed="${i ? 'false' : 'true'}"><span class="spell">${H.T(m.name)}</span></button>`).join('')}</div>
      <div class="t2-map"><canvas class="t2-top" aria-hidden="true"></canvas></div>
      <p class="t2-state" aria-live="polite"></p>
      <p class="t2-hint">${H.T(c.hint)}</p>
    </div>
  </div>
  ${c.photo ? `<button class="t2-shot t2-ill-photo" aria-label="Увеличить"><img src="${esc(small(c.photo))}" alt="${esc(H.pick(c.photoAlt || ''))}" loading="lazy" decoding="async" draggable="false"></button>` : ''}
  ${c.photoCap ? `<p class="t2-cap">${H.T(c.photoCap)}</p>` : ''}`;
}
function liveIllusion(box, c){
  const cv = box.querySelector('.t2-cv'), top = box.querySelector('.t2-top');
  const ctx = cv.getContext('2d'), tctx = top.getContext('2d');
  const stateEl = box.querySelector('.t2-state'), btns = [...box.querySelectorAll('.t2-cam')];
  const mms = c.cams.map(m => m.mm);
  const spot = mms.map(mm => (fit(mms[0]) + fit(mms[1])) / 2 - fit(mm));   // z, где встает каждый телефон
  let cam = { x: -1.1, z: .7 }, aim = { x: E.x, z: E.z }, fov = fovOf(mms[0]), fovAim = fov;
  let seen = false, raf = 0, last = 0, manual = 0, script = [], hold = 0, step = 0, state = '';
  const AUTO = [[0, 0, 2.6], [-1.2, .7, 1.1], [1.0, -.9, 1.1], [0, 0, 2.6], [1.3, .9, 1.1], [-.7, -1.2, 1.1]];
  const ink = () => css(box, '--ink') || '#1D222A';

  const size = () => {
    const d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(cv.clientWidth * d); cv.height = Math.round(cv.clientHeight * d);
    top.width = Math.round(top.clientWidth * d); top.height = Math.round(top.clientHeight * d);
    draw();
  };
  // текст в плоскости z (ось y смотрит вверх — переворачиваем обратно)
  const word = (g, s, x, y, size, color) => {
    g.save(); g.translate(x, y); g.scale(size / 100, -size / 100);
    g.font = '600 100px "Golos Text", system-ui, sans-serif'; g.fillStyle = color; g.fillText(s, 0, 0); g.restore();
  };
  const draw = () => {
    const W = cv.width, Hh = cv.height; if (!W) return;
    const F = (W / 2) / Math.tan(fov / 2), cy = E.y;
    const P = (x, y, z) => { const k = F / (z - cam.z); return [W / 2 + (x - cam.x) * k, Hh / 2 - (y - cy) * k]; };
    const plane = z => { const s = F / (z - cam.z); ctx.setTransform(s, 0, 0, -s, W / 2 - cam.x * s, Hh / 2 + cy * s); };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0E0F11'; ctx.fillRect(0, 0, W, Hh);
    // пол: сетка до стены
    ctx.fillStyle = '#1B1C20'; ctx.fillRect(0, P(0, 0, BACK)[1], W, Hh);
    ctx.strokeStyle = '#2A2C32'; ctx.lineWidth = Math.max(1, W / 900);
    ctx.beginPath();
    for (let z = Math.ceil(cam.z + 1.2); z <= BACK; z += .5) { const a = P(-12, 0, z), b = P(12, 0, z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    for (let x = -6; x <= 6; x += .5) { const a = P(x, 0, cam.z + 1.2), b = P(x, 0, BACK); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    ctx.stroke();
    // стена со слоганами
    plane(BACK);
    ctx.fillStyle = '#0B0B0D'; ctx.fillRect(-9, 0, 18, 5);
    const ws = c.wall || [];
    ws.forEach((s, i) => word(ctx, s, -7 + (i % 2) * 1.6 - (i % 3) * .5, 4.2 - i * .62, .5, i % 3 === 1 ? '#5E6B1C' : '#2B2D33'));
    // панели — от дальних к ближним
    const order = PANELS.map((p, i) => i).sort((a, b) => PANELS[b].z - PANELS[a].z);
    order.forEach(i => {
      const p = PANELS[i];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // торцы: видно ту сторону, к которой стоит камера
      const side = x => {
        const a = P(x, p.y0, p.z), b = P(x, p.y1, p.z), cc = P(x, p.y1, p.z + DEPTH), d = P(x, p.y0, p.z + DEPTH);
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...cc); ctx.lineTo(...d); ctx.closePath(); ctx.fill();
      };
      ctx.fillStyle = '#B9BAB6';
      if (cam.x > p.x1) side(p.x1);
      if (cam.x < p.x0) side(p.x0);
      plane(p.z);
      ctx.save();
      ctx.beginPath(); ctx.rect(p.x0, p.y0, p.x1 - p.x0, p.y1 - p.y0);
      const white = tone(p.z);
      ctx.fillStyle = white; ctx.fill(); ctx.clip();
      // куски букв: лучи из E через плоскость ZD до этой панели
      const k = (p.z - E.z) / (ZD - E.z);
      ctx.fillStyle = '#121214';
      BARS.forEach(([a, b, cc, d]) => ctx.fillRect(E.x + (a - E.x) * k, E.y + (b - E.y) * k, (cc - a) * k, (d - b) * k));
      // что из E закрыто ближними панелями, там не рисовали
      ctx.fillStyle = white;
      PANELS.forEach(q => {
        if (q.z >= p.z) return;
        const kq = (p.z - E.z) / (q.z - E.z);
        ctx.fillRect(E.x + (q.x0 - E.x) * kq, E.y + (q.y0 - E.y) * kq, (q.x1 - q.x0) * kq, (q.y1 - q.y0) * kq);
      });
      if (p.t != null && ws[p.t]) {
        const lines = ws[p.t].split(' ');
        lines.forEach((s, j) => word(ctx, s, p.x0 + .08, p.y1 - .17 - j * .15, .12, '#121214'));
      }
      ctx.restore();
    });
    drawTop();
  };
  const drawTop = () => {
    const w = top.width, h = top.height; if (!w) return;
    const d = w / top.clientWidth, g = tctx;
    const zmin = -1.9, zmax = BACK + .3;
    const sc = Math.min(w / 6.6, (h - 20 * d) / (zmax - zmin));
    const X = x => w / 2 + x * sc, Y = z => h - 10 * d - (z - zmin) * sc;
    const col = ink();
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
    // клин кадра
    const a = fov / 2, far = BACK - cam.z;
    g.beginPath(); g.moveTo(X(cam.x), Y(cam.z));
    g.lineTo(X(cam.x - Math.tan(a) * far), Y(BACK)); g.lineTo(X(cam.x + Math.tan(a) * far), Y(BACK)); g.closePath();
    g.fillStyle = LIME + '66'; g.fill();
    // стена и панели
    g.fillStyle = col;
    g.fillRect(X(-3.2), Y(BACK) - 2 * d, 6.4 * sc, 4 * d);
    PANELS.forEach(p => g.fillRect(X(p.x0), Y(p.z + DEPTH), (p.x1 - p.x0) * sc, Math.max(3 * d, DEPTH * sc)));
    // где встает каждый телефон
    g.font = `400 ${16 * d}px "Golos Text", system-ui, sans-serif`; g.textBaseline = 'middle';
    g.lineWidth = 1.5 * d; g.strokeStyle = col;
    spot.forEach((z, i) => {
      g.beginPath(); g.arc(X(0), Y(z), 4.5 * d, 0, 7); g.stroke();
      g.fillStyle = col; g.globalAlpha = .65; g.fillText(H.pick(c.cams[i].mark), X(0) + 12 * d, Y(z)); g.globalAlpha = 1;
    });
    // точка зрителя
    g.beginPath(); g.arc(X(E.x), Y(E.z), 7 * d, 0, 7); g.fillStyle = LIME; g.fill(); g.strokeStyle = col; g.stroke();
    g.fillStyle = col; g.fillText(H.pick(c.spotName), X(E.x) + 14 * d, Y(E.z));
    // камера
    g.beginPath(); g.arc(X(cam.x), Y(cam.z), 5 * d, 0, 7); g.fillStyle = col; g.fill();
  };
  // из координат схемы — в зал
  const fromTop = e => {
    const r = top.getBoundingClientRect(), w = r.width, h = r.height;
    const zmin = -1.9, zmax = BACK + .3, sc = Math.min(w / 6.6, (h - 20) / (zmax - zmin));
    return { x: (e.clientX - r.left - w / 2) / sc, z: zmin + (h - 10 - (e.clientY - r.top)) / sc };
  };
  const setAim = (x, z) => {
    aim.x = clamp(x, -1.6, 1.6); aim.z = clamp(z, -1.5, 1.0);
    if (Math.hypot(aim.x - E.x, aim.z - E.z) < .14) { aim.x = E.x; aim.z = E.z; }   // рядом с точкой — прилипает
    manual = performance.now(); script = [];
  };
  cv.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || e.buttons) {
      const r = cv.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      setAim(-1.6 + u * 3.2, e.pointerType === 'mouse' ? 1.0 - v * 2.5 : aim.z);
    }
  });
  let drag = false;
  top.addEventListener('pointerdown', e => { drag = true; top.setPointerCapture(e.pointerId); const p = fromTop(e); setAim(p.x, p.z); });
  top.addEventListener('pointermove', e => { if (drag) { const p = fromTop(e); setAim(p.x, p.z); } });
  top.addEventListener('pointerup', () => { drag = false; });
  btns.forEach((b, i) => b.addEventListener('click', () => {
    btns.forEach((x, j) => { x.classList.toggle('on', i === j); x.setAttribute('aria-pressed', i === j); });
    fovAim = fovOf(mms[i]);
    // телефон сначала встает туда, где ему удобно, потом — на точку зрителя
    manual = 0; script = [[0, spot[i], 2.4], [0, 0, 2.8]]; hold = 0; aim.x = 0; aim.z = spot[i];
    if (still()) { fov = fovAim; cam = { x: 0, z: 0 }; draw(); status(); }
  }));
  const status = () => {
    const d = Math.hypot(cam.x - E.x, cam.z - E.z);
    const s = d < .04 ? 'ok' : d < .3 ? 'near' : 'off';
    if (s !== state) { state = s; stateEl.textContent = H.pick(c.state[s]); stateEl.classList.toggle('ok', s === 'ok'); }
  };
  const loop = now => {
    raf = 0;
    if (!seen) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
    // без касания 2,5 с — сценарий: свой (после кнопки) или обход зала
    if (!drag && (!manual || now - manual > 2500)) {
      const near = Math.hypot(cam.x - aim.x, cam.z - aim.z) < .03;
      if (near) {
        hold += dt;
        const cur = script.length ? script[0] : AUTO[step % AUTO.length];
        if (hold > cur[2]) {
          hold = 0;
          if (script.length) script.shift(); else step++;
          const nx = script.length ? script[0] : AUTO[step % AUTO.length];
          aim.x = nx[0]; aim.z = nx[1];
        }
      }
    }
    const k = 1 - Math.exp(-dt * 3.2);
    cam.x += (aim.x - cam.x) * k; cam.z += (aim.z - cam.z) * k; fov += (fovAim - fov) * k;
    if (Math.abs(aim.x - cam.x) < .002 && Math.abs(aim.z - cam.z) < .002) { cam.x = aim.x; cam.z = aim.z; }
    draw(); status();
    raf = requestAnimationFrame(loop);
  };
  new ResizeObserver(size).observe(cv);
  document.fonts?.ready.then(draw);
  const ph = box.querySelector('.t2-ill-photo');
  if (ph) ph.addEventListener('click', () => H.openViewer([c.photo], 0, [ph.querySelector('img')]));
  if (still()) { cam = { x: 0, z: 0 }; aim = { ...cam }; size(); status(); return; }
  aim.x = AUTO[0][0]; aim.z = AUTO[0][1];
  size(); status();
  onScreen(cv, v => { seen = v; last = 0; if (v && !raf) raf = requestAnimationFrame(loop); });
}

/* ================================================================
   pixels — панно из плашек: с одной стороны темные, с другой лаймовые.
   Плашка переворачивается вокруг вертикальной оси; курсор (палец)
   переворачивает, без касания панно само рисует две улыбки
   ================================================================ */
const FACES = [
  ['.............', '.............', '...#.....#...', '...#.....#...', '...#.....#...', '.............',
   '.............', '.#.........#.', '..#.......#..', '...#######...', '.............', '.............'],
  ['.............', '.............', '...#.....#...', '..#.#...#.#..', '.#...#.#...#.', '.............',
   '.............', '.#.........#.', '..#.......#..', '...#######...', '.............', '.............'],
];
function pixelsHTML(c){
  return `<div class="t2-pix">
    <div class="t2-board"><i class="t2-led" aria-hidden="true"></i><canvas class="t2-pcv" aria-label="${esc(H.pick(c.alt))}"></canvas></div>
    <div class="t2-pix-bar"><button class="btn btn-line t2-clear"><span class="spell">${H.T(c.clear)}</span></button></div>
  </div>
  ${c.photos ? `<div class="t2-pair">${c.photos.map(s =>
    `<button class="t2-shot" aria-label="Увеличить"><img src="${esc(s)}" alt="" loading="lazy" decoding="async" draggable="false"></button>`).join('')}</div>` : ''}
  ${c.photoCap ? `<p class="t2-cap">${H.T(c.photoCap)}</p>` : ''}`;
}
function livePixels(box, c){
  const cv = box.querySelector('.t2-pcv'), g = cv.getContext('2d');
  const ROWS_P = 12;
  let cols = 0, tiles = [], seen = false, raf = 0, touched = 0, auto = [], autoAt = 0, faceN = 0, paintTo = true, down = false;
  const FLIP = 380;
  const build = () => {
    const n = narrow() ? 16 : 36;
    if (n === cols) return;
    cols = n;
    tiles = Array.from({ length: cols * ROWS_P }, () => ({ on: false, at: -1e9, ajar: Math.random() < .035 }));
    auto = []; autoAt = 0;
  };
  const size = () => {
    build();
    const d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth;
    cv.style.height = (w * ROWS_P / cols) + 'px';
    cv.width = Math.round(w * d); cv.height = Math.round(w * ROWS_P / cols * d);
    draw(performance.now());
  };
  const flip = (i, on, now) => {
    const t = tiles[i]; if (!t || t.on === on) return;
    t.on = on; t.at = now; t.ajar = false;
  };
  const draw = now => {
    const W = cv.width, Hh = cv.height, s = W / cols, gap = s * .12;
    g.clearRect(0, 0, W, Hh);
    let busy = false;
    tiles.forEach((t, i) => {
      const x = (i % cols) * s, y = Math.floor(i / cols) * s;
      const p = clamp((now - t.at) / FLIP, 0, 1);
      if (p < 1) busy = true;
      const lit = p < .5 ? !t.on : t.on;
      const sx = Math.max(.06, Math.abs(Math.cos(p * Math.PI)));
      const w = (s - gap) * sx, cx = x + s / 2;
      g.fillStyle = lit ? LIME : (t.ajar ? '#55585F' : '#2A2C31');
      g.fillRect(cx - w / 2, y + gap / 2, w, s - gap);
      if (!lit) { g.fillStyle = '#34373D'; g.fillRect(cx - w / 2, y + gap / 2, w, Math.max(1, s * .08)); }
    });
    return busy;
  };
  // сценарий без касания: улыбки построчно → пауза → плашки возвращаются вразнобой
  const plan = now => {
    const face = FACES[faceN++ % FACES.length], list = [];
    const places = cols >= 30 ? [4, 19] : [1];
    places.forEach((ox, f) => {
      const fc = cols >= 30 ? FACES[f] : face;
      fc.forEach((row, r) => [...row].forEach((ch, k) => { if (ch === '#') list.push(r * cols + ox + k); }));
    });
    let t = now + 300;
    auto = list.map(i => ({ i, on: true, t: t += 55 }));
    t += 2600;
    const off = list.slice().sort(() => Math.random() - .5);
    off.forEach(i => auto.push({ i, on: false, t: t += 22 }));
    autoAt = t + 1200;
  };
  const at = e => {
    const r = cv.getBoundingClientRect(), s = r.width / cols;
    const cx = Math.floor((e.clientX - r.left) / s), cy = Math.floor((e.clientY - r.top) / s);
    return cx < 0 || cy < 0 || cx >= cols || cy >= ROWS_P ? -1 : cy * cols + cx;
  };
  const stopAuto = now => {
    touched = now;
    if (auto.length) { auto = []; tiles.forEach((t, i) => flip(i, false, now)); }
  };
  cv.addEventListener('pointerdown', e => {
    const now = performance.now(), i = at(e); stopAuto(now);
    if (i < 0) return;
    down = true; paintTo = !tiles[i].on; flip(i, paintTo, now); wake();
  });
  cv.addEventListener('pointermove', e => {
    const now = performance.now(), i = at(e);
    if (i < 0) return;
    if (e.pointerType === 'mouse' && !down) { stopAuto(now); flip(i, true, now); wake(); }
    else if (down) { touched = now; flip(i, paintTo, now); wake(); }
  });
  addEventListener('pointerup', () => { down = false; });
  box.querySelector('.t2-clear').addEventListener('click', () => {
    const now = performance.now(); auto = []; touched = now;
    tiles.forEach((t, i) => { if (t.on) setTimeout(() => { flip(i, false, performance.now()); wake(); }, Math.random() * 400); });
    wake();
  });
  const loop = now => {
    raf = 0;
    if (!seen) return;
    // своя картинка висит 9 с, потом панно снова рисует само
    if (!still() && now - touched > 9000) {
      if (!auto.length && now > autoAt) {
        if (tiles.some(t => t.on)) { tiles.forEach((t, i) => { if (t.on) auto.push({ i, on: false, t: now + Math.random() * 600 }); }); autoAt = now + 1500; }
        else plan(now);
      }
      while (auto.length && auto[0].t <= now) { const a = auto.shift(); flip(a.i, a.on, now); }
      auto.sort((a, b) => a.t - b.t);
    }
    draw(now);
    raf = requestAnimationFrame(loop);
  };
  const wake = () => { if (seen && !raf) raf = requestAnimationFrame(loop); else if (!seen) draw(performance.now()); };
  new ResizeObserver(() => { const w = cols; size(); if (w !== cols) draw(performance.now()); }).observe(cv.parentNode);
  size();
  if (still()) {
    // без движения — сразу готовые улыбки
    const now = performance.now() - FLIP;
    plan(now); auto.filter(a => a.on).forEach(a => flip(a.i, true, now)); auto = []; autoAt = Infinity;
    draw(performance.now());
  }
  onScreen(cv, v => { seen = v; if (v) wake(); });
  const shots = [...box.querySelectorAll('.t2-pair .t2-shot')];
  shots.forEach((b, i) => b.addEventListener('click', () => H.openViewer(c.photos, i, shots.map(x => x.querySelector('img')))));
}

/* ================================================================
   wishes — кубы с пожеланиями. Изометрия на canvas: у куба три видимые
   грани, на левой — значок и пожелание, на правой — значок. Гора
   растет сама, нажатие ставит куб сразу; когда гора собрана —
   кубы уходят, и всё сначала
   ================================================================ */
// высота горы в каждой клетке (i — вправо-вниз, j — влево-вниз)
const MOUND = [
  [1, 2, 2, 1, 0],
  [2, 3, 3, 2, 1],
  [2, 3, 4, 3, 1],
  [1, 2, 3, 2, 1],
  [0, 1, 1, 1, 0],
];
const SLOTS = (() => {
  const out = [];
  MOUND.forEach((row, i) => row.forEach((h, j) => { for (let k = 0; k < h; k++) out.push({ i, j, k }); }));
  return out.sort((a, b) => a.k - b.k || (a.i + a.j) - (b.i + b.j) || a.i - b.i);   // снизу вверх, от дальних к ближним
})();
const DARK = '#1B1C1F';
// значки в квадрате 100 × 100, центр — (50, 36)
const ICONS = {
  up: g => { g.moveTo(50, 58); g.lineTo(50, 16); g.moveTo(36, 30); g.lineTo(50, 16); g.lineTo(64, 30); },
  sky: g => { g.moveTo(26, 52); g.lineTo(74, 52); g.moveTo(30, 52); g.lineTo(44, 34); g.lineTo(52, 44); g.lineTo(60, 36); g.lineTo(70, 52);
    g.moveTo(60, 24); g.arc(52, 24, 8, 0, Math.PI * 2); },
  bulb: g => { g.moveTo(62, 30); g.arc(50, 30, 12, 0, Math.PI * 2); g.moveTo(44, 46); g.lineTo(56, 46); g.moveTo(45, 52); g.lineTo(55, 52);
    g.moveTo(50, 10); g.lineTo(50, 4); g.moveTo(30, 30); g.lineTo(24, 30); g.moveTo(70, 30); g.lineTo(76, 30); },
  luck: g => { [[50, 22], [62, 34], [50, 46], [38, 34]].forEach(([x, y]) => { g.moveTo(x + 8, y); g.arc(x, y, 8, 0, Math.PI * 2); });
    g.moveTo(50, 34); g.lineTo(58, 58); },
  coins: g => { [52, 42, 32].forEach(y => { g.moveTo(66, y); g.ellipse(50, y, 16, 6, 0, 0, Math.PI * 2); }); g.moveTo(34, 32); g.lineTo(34, 52); g.moveTo(66, 32); g.lineTo(66, 52); },
  lead: g => { g.moveTo(50, 8); g.lineTo(53, 15); g.lineTo(60, 15); g.lineTo(54, 20); g.lineTo(56, 27); g.lineTo(50, 23); g.lineTo(44, 27); g.lineTo(46, 20); g.lineTo(40, 15); g.lineTo(47, 15); g.closePath();
    g.moveTo(57, 38); g.arc(50, 38, 7, 0, Math.PI * 2); g.moveTo(34, 60); g.quadraticCurveTo(50, 40, 66, 60); },
};
function wishesHTML(c){
  return `<div class="t2-wish">
    <div class="t2-pile"><canvas class="t2-wcv" aria-label="${esc(H.pick(c.alt))}"></canvas></div>
    <div class="t2-wish-side">
      <button class="btn btn-line t2-add"><span class="spell">${H.T(c.add)}</span></button>
      <p class="t2-wish-now" aria-live="polite"></p>
      <p class="t2-hint">${H.T(c.hint)}</p>
      ${c.preview ? `<button class="t2-shot t2-wish-prev" aria-label="Увеличить"><img src="${esc(small(c.preview))}" alt="" loading="lazy" decoding="async" draggable="false"></button>
      ${c.previewCap ? `<p class="t2-cap">${H.T(c.previewCap)}</p>` : ''}` : ''}
    </div>
  </div>`;
}
function liveWishes(box, c){
  const cv = box.querySelector('.t2-wcv'), g = cv.getContext('2d');
  const words = c.wishes.map(w => ({ icon: w.icon, text: H.pick(w.text) }));
  let cubes = [], seen = false, raf = 0, next = 0, leaving = 0, n = 0;
  const FALL = 520;
  let S = 40, OX = 0, OY = 0;
  const size = () => {
    const d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(cv.clientWidth * d); cv.height = Math.round(cv.clientHeight * d);
    // гора 5 × 5 клеток: по ширине 8,7 ребра, от вершины до низа — 7,4 ребра; плюс поля
    const W = cv.width, Hh = cv.height;
    S = Math.min(W / 9.4, Hh / 8.2);
    OX = W / 2; OY = Hh / 2 + S * .7;
    draw(performance.now());
  };
  const make = (slot, now, at) => {
    const w = words[n % words.length];
    // пожелания по кругу, цвета — вперемешку, лаймовых больше
    const lime = (n * 7) % 5 < 3;
    n++;
    return { ...slot, w, lime, at: at ?? now };
  };
  const nowEl = box.querySelector('.t2-wish-now');
  const add = now => {
    if (cubes.length >= SLOTS.length || leaving) return false;
    const q = make(SLOTS[cubes.length], now);
    cubes.push(q);
    nowEl.textContent = q.w.text;
    return true;
  };
  const face = (ox, oy, ux, uy, vx, vy, fill, draw) => {
    g.save(); g.setTransform(ux / 100, uy / 100, vx / 100, vy / 100, ox, oy);
    g.beginPath(); g.rect(0, 0, 100, 100); g.fillStyle = fill; g.fill();
    if (draw) draw();
    g.restore();
  };
  const cube = (q, now) => {
    const t = clamp((now - q.at) / FALL, 0, 1);
    const drop = (1 - t) * (1 - t) * 6;   // падает с высоты 6 этажей, у земли замедляется
    let alpha = 1, k = q.k + drop;
    if (leaving) { const p = clamp((now - leaving - (q.i + q.j) * 40) / 500, 0, 1); alpha = 1 - p; k -= p * .6; }
    if (alpha <= 0 || t <= 0) return;
    const ex = [S * .866, S * .5], ey = [-S * .866, S * .5];
    const O = [OX + (q.i - 2) * ex[0] + (q.j - 2) * ey[0], OY + (q.i - 2) * ex[1] + (q.j - 2) * ey[1] - k * S];
    const body = q.lime ? LIME : DARK;
    const ink = q.lime ? DARK : LIME;
    const top = q.lime ? '#EEFC9A' : '#2E3035', right = q.lime ? '#C9E040' : '#141517';
    g.globalAlpha = alpha;
    // верх
    g.beginPath();
    g.moveTo(O[0], O[1] - S); g.lineTo(O[0] + ex[0], O[1] + ex[1] - S); g.lineTo(O[0] + ex[0] + ey[0], O[1] + ex[1] + ey[1] - S); g.lineTo(O[0] + ey[0], O[1] + ey[1] - S); g.closePath();
    g.fillStyle = top; g.fill();
    // на гранях только значки: подпись была бы мельче 16 px — пожелание пишется рядом
    const mark = big => () => {
      g.strokeStyle = ink; g.lineWidth = big ? 5 : 4.5; g.lineCap = 'round'; g.lineJoin = 'round';
      g.save(); g.translate(50, 50); g.scale(big ? 1.15 : .9, big ? 1.15 : .9); g.translate(-50, -34);
      g.beginPath(); ICONS[q.w.icon](g); g.stroke(); g.restore();
    };
    // левая грань (j = 1): вдоль ex, вниз; правая (i = 1): вдоль −ey, вниз
    const L = [O[0] + ey[0], O[1] + ey[1] - S];
    face(L[0], L[1], ex[0], ex[1], 0, S, body, mark(true));
    const R = [O[0] + ex[0] + ey[0], O[1] + ex[1] + ey[1] - S];
    face(R[0], R[1], -ey[0], -ey[1], 0, S, right, mark(false));
    g.globalAlpha = 1;
  };
  const draw = now => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    // тень горы на полу
    g.fillStyle = 'rgba(0,0,0,.07)';
    g.beginPath(); g.ellipse(OX, OY + S * 2.1, S * 4.2, S * 1.1, 0, 0, Math.PI * 2); g.fill();
    cubes.slice().sort((a, b) => (a.i + a.j + a.k) - (b.i + b.j + b.k) || a.k - b.k).forEach(q => cube(q, now));
  };
  const loop = now => {
    raf = 0;
    if (!seen) return;
    if (leaving && now - leaving > 1400) { cubes = []; leaving = 0; next = now + 400; }
    if (!leaving && now > next) {
      if (cubes.length >= SLOTS.length) { leaving = now + 2600; next = Infinity; }
      else { add(now); next = now + 900; }
    }
    if (leaving && leaving > now) { /* гора постояла — сейчас уйдет */ }
    draw(now);
    raf = requestAnimationFrame(loop);
  };
  // по нажатию — свой куб сразу; гора собрана — начинаем новую
  const put = () => {
    const now = performance.now();
    if (leaving) return;
    if (cubes.length >= SLOTS.length) { leaving = now; return; }
    add(now); next = now + 2400;
    if (!raf && seen) raf = requestAnimationFrame(loop);
    if (still()) draw(now + FALL);
  };
  cv.addEventListener('click', put);
  box.querySelector('.t2-add').addEventListener('click', put);
  const pv = box.querySelector('.t2-wish-prev');
  if (pv) pv.addEventListener('click', () => H.openViewer([c.preview], 0, [pv.querySelector('img')]));
  // в начале гора уже наполовину собрана
  const now0 = performance.now() - FALL;
  for (let s = 0; s < 16; s++) cubes.push(make(SLOTS[s], now0, now0));
  nowEl.textContent = cubes[cubes.length - 1].w.text;
  new ResizeObserver(size).observe(cv);
  document.fonts?.ready.then(() => draw(performance.now()));
  size();
  if (still()) { while (cubes.length < SLOTS.length) cubes.push(make(SLOTS[cubes.length], now0, now0)); draw(performance.now()); return; }
  onScreen(cv, v => { seen = v; if (v && !raf) { next = performance.now() + 600; raf = requestAnimationFrame(loop); } });
}

/* ================================================================
   things — остальное оформление: заголовок и строка слева, кадры справа
   ================================================================ */
function thingsHTML(c){
  return `<div class="t2-things">${c.items.map(it =>
    `<div class="t2-thing">
      <div class="t2-thing-txt"><h3>${H.T(it.title)}</h3>${it.text ? `<p>${H.T(it.text)}</p>` : ''}</div>
      <div class="t2-thing-img${it.imgs.length > 1 ? ' two' : ''}">${it.imgs.map(s =>
        `<button class="t2-shot" aria-label="Увеличить"><img src="${esc(small(s))}" alt="" loading="lazy" decoding="async" draggable="false"></button>`).join('')}</div>
    </div>`).join('')}</div>`;
}
function liveThings(box, c){
  const list = c.items.flatMap(it => it.imgs);
  const shots = [...box.querySelectorAll('.t2-shot')];
  shots.forEach((b, i) => b.addEventListener('click', () => H.openViewer(list, i, shots.map(x => x.querySelector('img')))));
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'tele.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

const KINDS = {
  illusion: [illusionHTML, liveIllusion],
  pixels:   [pixelsHTML, livePixels],
  wishes:   [wishesHTML, liveWishes],
  things:   [thingsHTML, liveThings],
};
export async function mountTele(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const b = p.tele, keys = Object.keys(KINDS).filter(k => b[k]);
  mount.innerHTML = keys.map(k =>
    `<section class="t2-ch t2-${k}-ch"><div class="wrap">${head(b[k])}</div><div class="wrap t2-viz">${KINDS[k][0](b[k])}</div></section>`).join('');
  keys.forEach(k => {
    const box = mount.querySelector(`.t2-${k}-ch`);
    reveal.observe(box);
    KINDS[k][1](box, b[k]);
  });
}
