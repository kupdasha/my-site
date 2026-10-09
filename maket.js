/* ================================================================
   КЕЙС «КОНСТРУКТОР МАКЕТОВ ДЛЯ СОЦСЕТЕЙ» (поле maket у проекта)
   Иллюстрации почти без слов, в цветах самого конструктора
   (заказчик — «Одна кавычка»: лайм, черный, розовый, знак-кавычка).
   Заголовки в макетах — полоски, а не буквы.
   Главы: feed — лента, где каждый пост сделан «как умеют»: логотип
   растянут, верстка медленно разъезжается; file — окно браузера
   с конструктором: заголовок печатается, фото падает в рамку,
   формат меняется 16:9 ⇄ 4:5; style — заголовок можно утащить
   за край, но он встает только в разрешенное место (пока никто
   не трогал, тянет курсор); mix — кнопка «замиксовать» перебирает
   палитру, фон и композицию, нажимается сама, пока не тронули;
   photo — картинка с водяным знаком отскакивает от рамки, фото
   из подборки прилетает на ее место; compare — нейросеть каждый раз
   рисует по-новому, конструктор — всегда в стиле; под ней —
   демо и «написать» (maket.try).
   Тексты — в content.js, оформление — maket.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const any = a => a[Math.floor(Math.random() * a.length)];
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
// живой блок крутится, только пока виден; body(alive) — один круг
function runner(el, body, threshold){
  let on = false, busy = false;
  const go = async () => {
    if (busy) return; busy = true;
    try { while (on) await body(() => on); } finally { busy = false; }
  };
  onScreen(el, v => { on = v && !still(); if (on) go(); }, threshold);
}
// плавная величина 0 → 1 за ms
function tween(ms, f){
  return new Promise(res => {
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const frame = now => {
      const t = Math.min(1, (now - t0) / ms);
      f(ease(t));
      if (t < 1) requestAnimationFrame(frame); else res();
    };
    requestAnimationFrame(frame);
  });
}

/* ---------- фирменные элементы конструктора ---------- */
// знак «Одной кавычки» — из логотипа в самом конструкторе
const MARK = 'M144.701 2.30078C160.136 -3.22816 194.328 2.28739 217.43 7.51465C225.352 9.3074 231.717 15.6084 231.987 23.7266C232.681 44.5748 222.59 58.0847 216.471 62.7471L108.121 153.852L107.943 154.112L108.121 154.374L216.471 245.479C222.59 250.141 232.681 263.65 231.987 284.498C231.717 292.616 225.352 298.918 217.43 300.711C194.328 305.938 160.136 311.454 144.701 305.925C121.358 297.563 5.5197 197.401 0.292969 159.774C0.0328607 157.902 -0.0498989 156.012 0.0283203 154.112C-0.0498643 152.213 0.0328853 150.324 0.292969 148.451C5.51882 110.825 121.358 10.6633 144.701 2.30078Z';
const logo = (cls = 'mk-logo') => `<svg class="${cls}" viewBox="0 0 232 309" aria-hidden="true"><path d="${MARK}"/></svg>`;

// разрешенное брендом: три палитры, четыре фона, пять мест для текста, два вида тегов
const SCHEMES = ['lime', 'black', 'rose'];
const PATTERNS = ['dots', 'grid', 'checker', 'clean'];
const LAYOUTS = ['bl', 'tl', 'center', 'br', 'tr'];
const TAGS = ['line', 'fill'];
// где стоит текст в каждой композиции: x, y — точка в процентах макета, ax, ay — какой угол текста к ней приложен
// (то же записано в maket.css: при правке менять в обоих местах)
const ANCHOR = { bl: [7, 90, 0, 100], tl: [7, 24, 0, 0], tr: [93, 9, 100, 0], center: [50, 52, 50, 50], br: [93, 90, 100, 100] };

// фото — плоская картинка из трех фигур: небо, солнце, два холма
const scene = k => `<div class="mk-scene" data-k="${k}"><i class="mk-sun"></i><i class="mk-hill"></i><i class="mk-hill mk-hill2"></i></div>`;

// макет: тег-капсулы, строки заголовка полосками, подзаголовок, знак
function postHTML({ s = 'lime', p = 'dots', l = 'bl', f = 'wide', g = 'line', tags = 2, lines = [.86, .58], sub = .62, photo = '', cls = '', style = '' } = {}){
  return `<div class="mk-post${cls ? ' ' + cls : ''}" data-s="${s}" data-p="${p}" data-l="${l}" data-f="${f}" data-g="${g}"${style ? ` style="${style}"` : ''}>
    ${photo ? `<div class="mk-photo">${photo}</div>` : ''}
    ${logo()}
    <div class="mk-copy">
      ${tags ? `<div class="mk-tags">${'<i></i>'.repeat(tags)}</div>` : ''}
      ${lines.map(w => `<i class="mk-line" style="--w:${w}"></i>`).join('')}
      ${sub ? `<i class="mk-sub" style="--w:${sub}"></i>` : ''}
    </div>
  </div>`;
}
// текст встает в новую композицию плавно: запоминаем, где он был, и доезжаем оттуда
function moveCopy(post, l){
  const c = post.querySelector('.mk-copy');
  const a = c.getBoundingClientRect();
  c.classList.remove('snap');
  c.style.setProperty('--dx', '0px'); c.style.setProperty('--dy', '0px');
  post.dataset.l = l;
  if (still()) return;
  const b = c.getBoundingClientRect();
  c.style.setProperty('--dx', (a.left - b.left) + 'px'); c.style.setProperty('--dy', (a.top - b.top) + 'px');
  c.offsetWidth;
  c.classList.add('snap');
  c.style.setProperty('--dx', '0px'); c.style.setProperty('--dy', '0px');
}
const other = (list, cur) => any(list.filter(x => x !== cur));

/* ---------- заголовок главы: слова поднимаются из-под строки ---------- */
function splitWords(el){
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  // знак сразу после слова в обертке типографа («по-новому,») держится за это слово, а не уезжает на новую строку
  nodes.forEach(node => {
    const m = node.textContent.match(/^[,.:;!?»)…]+/), prev = node.previousSibling;
    if (m && prev && prev.nodeType === 1) { const t = prev.lastChild; if (t && t.nodeType === 3) t.data += m[0]; else prev.append(m[0]); node.textContent = node.textContent.slice(m[0].length); }
  });
  nodes.splice(0, nodes.length);
  const walk2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walk2.nextNode()) if (walk2.currentNode.textContent) nodes.push(walk2.currentNode);
  let n = 0;
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/([ \t\n]+)/).forEach(part => {
      if (!part) return;
      if (/^[ \t\n]+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement('span'); w.className = 'mk-w';
      const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--i', n++);
      w.append(i); frag.append(w);
    });
    node.replaceWith(frag);
  });
}
const head = ch => `<div class="mk-head">
  <span class="case-label mk-label">${H.T(ch.label)}</span>
  <h2 class="mk-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="mk-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const side = ch => `<div class="mk-side">
  <span class="case-label mk-label">${H.T(ch.label)}</span>
  <h2 class="mk-title">${H.T(ch.title)}</h2>
  <p class="mk-text">${H.T(ch.text)}</p>
</div>`;

/* ================================================================
   feed — лента «как умеют»: всё мимо стиля и медленно разъезжается
   ================================================================ */
// цвета, которых в брендбуке нет (оранжевого нет и тут)
const WRONG_BG = ['#8FD3FF', '#FFE45C', '#B79CFF', '#9EE6A8', '#FF9DBA', '#FFFFFF', '#2E2E33', '#7AE0D4', '#DCD3C4'];
const WRONG_INK = ['#E5484D', '#1F4FD8', '#2E2E33', '#FFFFFF', '#14A06B', '#8A2BE2', '#FF4FA3'];
function feedHTML(){
  const tile = () => `<div class="mk-tile">
    <div class="mk-j mk-j-photo">${scene(3)}<i class="mk-wm"></i></div>
    <svg class="mk-j mk-j-logo" viewBox="0 0 232 309" preserveAspectRatio="none" aria-hidden="true"><path d="${MARK}"/></svg>
    <i class="mk-j mk-j-tag"></i><i class="mk-j mk-j-l1"></i><i class="mk-j mk-j-l2"></i><i class="mk-j mk-j-sub"></i>
  </div>`;
  return `<div class="mk-stage mk-feed"><div class="mk-grid">${Array.from({ length: 6 }, tile).join('')}</div></div>`;
}
// каждый элемент — свои координаты в процентах плитки; разъезжаются понемногу от прежних
function messUp(tile, full){
  const st = tile._st || (tile._st = {});
  const drift = (k, a, b, d) => { st[k] = full || st[k] == null ? rnd(a, b) : Math.min(b + d, Math.max(a - d, st[k] + rnd(-d, d))); return st[k]; };
  const set = (sel, css) => Object.assign(tile.querySelector(sel).style, css);
  if (full) {
    tile.style.background = any(WRONG_BG);
    st.ink = any(WRONG_INK.filter(c => c !== tile.style.background));
    st.photo = Math.random() < .55;
  }
  const ink = st.ink;
  set('.mk-j-logo', { left: drift('lx', 4, 58, 8) + '%', top: drift('ly', 4, 30, 6) + '%', width: drift('lw', 12, 40, 8) + '%', height: drift('lh', 8, 20, 4) + '%', fill: ink });
  set('.mk-j-photo', { display: st.photo ? '' : 'none', left: drift('px', -12, 38, 8) + '%', top: drift('py', -10, 26, 6) + '%', width: drift('pw', 50, 80, 6) + '%', height: drift('ph', 34, 52, 5) + '%', transform: `rotate(${drift('pr', -6, 6, 3)}deg)` });
  set('.mk-j-l1', { left: drift('ax', 4, 34, 8) + '%', top: drift('ay', 52, 66, 5) + '%', width: drift('aw', 40, 90, 10) + '%', background: ink, transform: `rotate(${drift('ar', -6, 6, 3)}deg)`, borderRadius: st.r1 ?? (st.r1 = any(['0', '99px', '3px'])) });
  set('.mk-j-l2', { left: drift('bx', 2, 44, 10) + '%', top: (st.ay + drift('by', 9, 16, 3)) + '%', width: drift('bw', 26, 70, 10) + '%', background: full ? (st.c2 = any(WRONG_INK)) : st.c2, transform: `rotate(${drift('br', -7, 7, 3)}deg)` });
  set('.mk-j-sub', { left: drift('sx', 6, 40, 8) + '%', top: (st.ay + drift('sy', 24, 30, 3)) + '%', width: drift('sw', 24, 60, 8) + '%', background: ink });
  set('.mk-j-tag', { left: drift('tx', 50, 80, 6) + '%', top: drift('ty', 36, 48, 4) + '%', borderColor: ink, background: Math.random() < .5 ? ink : 'transparent', transform: `rotate(${drift('tr', -14, 14, 6)}deg)` });
}
function liveFeed(box){
  const tiles = [...box.querySelectorAll('.mk-tile')];
  tiles.forEach(t => messUp(t, true));
  runner(box.querySelector('.mk-feed'), async alive => {
    await wait(1100);
    if (!alive()) return;
    // одна-две плитки еще чуть-чуть разъезжаются; изредка пост «пересобирают» заново и тоже мимо
    const t = any(tiles);
    if (Math.random() < .14) { t.classList.add('mk-redo'); messUp(t, true); setTimeout(() => t.classList.remove('mk-redo'), 900); }
    else messUp(t, false);
    if (Math.random() < .5) messUp(any(tiles), false);
  });
}

/* ================================================================
   file — конструктор в окне браузера: заголовок, фото, формат
   ================================================================ */
const FILE_ICON = `<svg class="mk-fileic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.8h8l4.2 4.2v13a1.2 1.2 0 0 1-1.2 1.2H6a1.2 1.2 0 0 1-1.2-1.2V4A1.2 1.2 0 0 1 6 2.8z"/><path d="M14 2.8V7h4.2"/><path d="M9.6 12.2l-2 2 2 2M14.4 12.2l2 2-2 2"/></svg>`;
function fileHTML(c){
  const [w, t] = c.formats || ['16:9', '4:5'];
  return `<div class="mk-stage mk-file" data-f="wide" data-step="0">
    <div class="mk-win">
      <div class="mk-bar"><i></i><i></i><i></i><span class="mk-addr">${FILE_ICON}<b></b></span></div>
      <div class="mk-app">
        <div class="mk-rail">${'<i></i>'.repeat(6)}</div>
        <div class="mk-work">
          <div class="mk-seg"><span data-f="wide">${esc(w)}</span><span data-f="tall">${esc(t)}</span></div>
          <div class="mk-canvas">${postHTML({ f: 'wide', photo: scene(0), lines: [.9, .62], sub: .7 })}</div>
        </div>
      </div>
    </div>
  </div>`;
}
function liveFile(box){
  const st = box.querySelector('.mk-file');
  const post = st.querySelector('.mk-post');
  const parts = [...post.querySelectorAll('.mk-tags, .mk-line, .mk-sub')];
  const setF = f => { st.dataset.f = f; post.dataset.f = f; };
  const show = n => parts.forEach((p, i) => p.classList.toggle('on', i < n));
  if (still()) { show(parts.length); st.dataset.step = '3'; return; }
  runner(st, async alive => {
    const steps = [
      [500, () => { setF('wide'); show(0); st.dataset.step = '0'; }],
      [700, () => show(1)],                  // теги
      [1000, () => show(2)],                 // первая строка печатается
      [1000, () => show(3)],
      [900, () => show(4)],                  // подзаголовок
      [1300, () => { st.dataset.step = '3'; }],   // фото падает в рамку
      [2200, () => setF('tall')],            // пост 4:5 — фото сверху, текст снизу
      [2400, () => setF('wide')],
      [1800, () => { st.dataset.step = '4'; show(0); }],   // макет очищается — следующий пост
    ];
    for (const [ms, f] of steps) { if (!alive()) return; f(); await wait(ms); }
  });
}

/* ================================================================
   style — заголовок тянется, но встает только туда, где можно
   ================================================================ */
const CURSOR = `<svg class="mk-cur" viewBox="0 0 24 30" aria-hidden="true"><path d="M3.8 2.4v20.2l5-4.6 3.6 8 3.4-1.5-3.6-7.8 6.9-.5z"/></svg>`;
function styleHTML(c){
  return `<div class="mk-stage mk-style">
    <div class="mk-zone">
      ${postHTML({ s: 'lime', p: 'dots', l: 'bl', lines: [.82, .56], cls: 'mk-big' })}
      <div class="mk-guides" aria-hidden="true">${Object.keys(ANCHOR).map(k => `<i data-a="${k}"></i>`).join('')}</div>
      ${CURSOR}
    </div>
  </div>
  ${c.hint ? `<p class="mk-hint">${H.T(c.hint)}</p>` : ''}`;
}
function liveStyle(box){
  const zone = box.querySelector('.mk-zone');
  const post = zone.querySelector('.mk-post');
  const copy = post.querySelector('.mk-copy');
  const cur = zone.querySelector('.mk-cur');
  const guides = zone.querySelectorAll('.mk-guides i');
  let touched = false;
  // точки разрешенных мест — там, где оказался бы центр текста
  const centerOf = (k, W, Hh, w, h) => {
    const [x, y, ax, ay] = ANCHOR[k];
    return [x / 100 * W - ax / 100 * w + w / 2, y / 100 * Hh - ay / 100 * h + h / 2];
  };
  const placeGuides = () => {
    const W = post.clientWidth, Hh = post.clientHeight, w = copy.offsetWidth, h = copy.offsetHeight;
    guides.forEach(g => { const [cx, cy] = centerOf(g.dataset.a, W, Hh, w, h); g.style.left = cx + 'px'; g.style.top = cy + 'px'; });
  };
  // перетаскивание с «резинкой»: за полем макета текст едва сдвигается
  let r0 = null;
  const begin = () => {
    copy.classList.remove('snap');
    const pr = post.getBoundingClientRect(), cr = copy.getBoundingClientRect();
    r0 = { x: cr.left - pr.left, y: cr.top - pr.top, w: cr.width, h: cr.height, W: pr.width, H: pr.height };
    placeGuides();
    zone.classList.add('drag');
  };
  const rubber = (v, size, max, m) => {
    if (v < m) return m - (m - v) * .16;
    if (v + size > max - m) { const over = v + size - (max - m); return v - over + over * .16; }
    return v;
  };
  const dragTo = (dx, dy) => {
    const m = r0.W * .05;
    const x = rubber(r0.x + dx, r0.w, r0.W, m), y = rubber(r0.y + dy, r0.h, r0.H, m);
    copy.style.setProperty('--dx', (x - r0.x) + 'px'); copy.style.setProperty('--dy', (y - r0.y) + 'px');
    return [x + r0.w / 2, y + r0.h / 2];
  };
  const nearest = (cx, cy) => {
    let best = 'bl', d = Infinity;
    for (const k in ANCHOR) {
      const [ax, ay] = centerOf(k, r0.W, r0.H, r0.w, r0.h);
      const dd = (ax - cx) ** 2 + (ay - cy) ** 2;
      if (dd < d) { d = dd; best = k; }
    }
    return best;
  };
  const end = (k) => { zone.classList.remove('drag'); moveCopy(post, k); r0 = null; };

  // посетитель тянет сам — курсор-подсказка больше не нужен
  let start = null, last = null;
  copy.addEventListener('pointerdown', e => {
    touched = true; zone.classList.add('touched');
    copy.setPointerCapture(e.pointerId);
    start = [e.clientX, e.clientY]; begin(); last = dragTo(0, 0);
    e.preventDefault();
  });
  copy.addEventListener('pointermove', e => { if (start) last = dragTo(e.clientX - start[0], e.clientY - start[1]); });
  const up = () => { if (!start) return; start = null; end(nearest(...last)); };
  copy.addEventListener('pointerup', up);
  copy.addEventListener('pointercancel', up);

  // пока не трогали — тянет курсор: хватает текст, уводит за край, отпускает
  const curAt = (x, y) => { cur.style.transform = `translate(${x}px, ${y}px)`; };
  curAt(post.clientWidth * .62, post.clientHeight * .4);
  runner(zone, async alive => {
    if (touched) { await wait(3000); return; }
    const from = post.dataset.l;
    const to = other(LAYOUTS, from);
    const pr = post.getBoundingClientRect(), cr = copy.getBoundingClientRect();
    const sx = cr.left - pr.left + cr.width * .3, sy = cr.top - pr.top + cr.height * .5;
    // курсор подъезжает к тексту
    const c0 = cur.style.transform.match(/-?[\d.]+/g)?.map(Number) || [sx, sy];
    zone.classList.add('cur-on');
    await tween(700, t => curAt(c0[0] + (sx - c0[0]) * t, c0[1] + (sy - c0[1]) * t));
    if (!alive() || touched) return;
    zone.classList.add('grab'); begin();
    // тянет дальше нужного места — за край макета
    const W = pr.width, Hh = pr.height;
    const [tx, ty] = centerOf(to, W, Hh, cr.width, cr.height);
    const [fx, fy] = centerOf(from, W, Hh, cr.width, cr.height);
    const dx = (tx - fx) * 1.25 + Math.sign(tx - fx || 1) * W * .12, dy = (ty - fy) * 1.25 + Math.sign(ty - fy) * Hh * .1;
    await tween(1100, t => { dragTo(dx * t, dy * t); curAt(sx + dx * t, sy + dy * t); });
    if (!alive() || touched) { end(from); zone.classList.remove('grab'); return; }
    await wait(350);
    zone.classList.remove('grab');
    end(to);
    await wait(500);
    const c1 = [sx + dx, sy + dy], rest = [W * (.35 + Math.random() * .3), Hh * (.3 + Math.random() * .3)];
    await tween(600, t => curAt(c1[0] + (rest[0] - c1[0]) * t, c1[1] + (rest[1] - c1[1]) * t));
    await wait(1500);
  }, .45);
  addEventListener('resize', placeGuides, { passive: true });
}

/* ================================================================
   mix — «замиксовать»: другой вариант, но всегда в стиле
   ================================================================ */
function mixHTML(c){
  return `<div class="mk-stage mk-mix">
    <div class="mk-mix-post">${postHTML({ s: 'lime', p: 'dots', l: 'bl', lines: [.84, .6] })}</div>
    <div class="mk-mix-bar">
      <div class="mk-sws" aria-hidden="true">${SCHEMES.map(s => `<i data-s="${s}"></i>`).join('')}</div>
      <button class="mk-mixbtn" type="button">${H.T(c.btn)}</button>
    </div>
  </div>`;
}
function liveMix(box){
  const st = box.querySelector('.mk-mix');
  const post = st.querySelector('.mk-post');
  const btn = st.querySelector('.mk-mixbtn');
  const sws = [...st.querySelectorAll('.mk-sws i')];
  let touched = false;
  const mark = () => sws.forEach(i => i.classList.toggle('on', i.dataset.s === post.dataset.s));
  const shuffle = () => {
    post.classList.remove('flash'); post.offsetWidth; post.classList.add('flash');
    post.dataset.s = other(SCHEMES, post.dataset.s);
    post.dataset.p = other(PATTERNS, post.dataset.p);
    post.dataset.g = any(TAGS);
    // заголовок — та же пара строк, но другой длины, как другой текст
    post.querySelectorAll('.mk-line').forEach((l, i) => l.style.setProperty('--w', (i ? rnd(.38, .7) : rnd(.66, .94)).toFixed(2)));
    moveCopy(post, other(LAYOUTS, post.dataset.l));
    mark();
  };
  mark();
  btn.addEventListener('click', () => { touched = true; shuffle(); });
  runner(st, async alive => {
    await wait(2300);
    if (!alive() || touched) return;
    btn.classList.add('press');
    await wait(180);
    btn.classList.remove('press');
    shuffle();
  }, .45);
}

/* ================================================================
   photo — картинка с водяным знаком отскакивает, фото из подборки встает
   ================================================================ */
function photoHTML(){
  return `<div class="mk-stage mk-pics">
    <div class="mk-pics-post">${postHTML({ s: 'black', p: 'clean', f: 'tall', l: 'bl', lines: [.8, .5], photo: `<div class="mk-slot"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2.6"/><circle cx="8.6" cy="9.6" r="1.6"/><path d="M4 16.6l4.6-4.6 3.4 3.4 3-3 5.5 5.5"/></svg></div><div class="mk-pic"></div>` })}</div>
    <div class="mk-pics-side">
      <div class="mk-bad">${scene(3)}<i class="mk-wm"></i><svg class="mk-x" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" d="M8 8L92 92M92 8L8 92"/></svg></div>
      <div class="mk-thumbs">${[0, 1, 2].map(k => `<div class="mk-th">${scene(k)}</div>`).join('')}</div>
    </div>
  </div>`;
}
function livePhoto(box){
  const st = box.querySelector('.mk-pics');
  const frame = st.querySelector('.mk-photo');
  const pic = st.querySelector('.mk-pic');
  const bad = st.querySelector('.mk-bad');
  const ths = [...st.querySelectorAll('.mk-th')];
  let k = 0;
  if (still()) { pic.innerHTML = scene(0); pic.classList.add('on'); return; }
  const rel = el => { const a = el.getBoundingClientRect(), b = st.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; };
  runner(st, async alive => {
    // 1. из гугла несут картинку с водяным знаком — рамка ее не берет
    pic.classList.remove('on');
    bad.className = 'mk-bad';
    ths.forEach(t => t.classList.remove('lift', 'gone'));
    await wait(700);
    if (!alive()) return;
    bad.classList.add('show');
    await wait(900);
    const a = rel(bad), f = rel(frame);
    // подлетает вплотную к рамке
    const dx = f.x + f.w * .5 - (a.x + a.w * .5), dy = f.y + f.h * .5 - (a.y + a.h * .5);
    bad.style.setProperty('--tx', dx * .82 + 'px'); bad.style.setProperty('--ty', dy * .82 + 'px');
    bad.classList.add('go');
    await wait(650);
    if (!alive()) return;
    frame.classList.add('shake');
    bad.classList.add('back');
    await wait(500);
    frame.classList.remove('shake');
    bad.classList.add('no');
    await wait(1100);
    bad.classList.add('out');
    await wait(500);
    if (!alive()) return;
    // 2. фото из подборки поднимается и встает в рамку
    const th = ths[k % ths.length];
    th.classList.add('lift');
    await wait(450);
    const s = rel(th), d = rel(frame);
    const fly = document.createElement('div');
    fly.className = 'mk-fly'; fly.innerHTML = scene(k % ths.length);
    Object.assign(fly.style, { left: s.x + 'px', top: s.y + 'px', width: s.w + 'px', height: s.h + 'px' });
    st.appendChild(fly);
    th.classList.add('gone');
    fly.offsetWidth;
    Object.assign(fly.style, { left: d.x + 'px', top: d.y + 'px', width: d.w + 'px', height: d.h + 'px' });
    fly.classList.add('flying');
    await wait(800);
    pic.innerHTML = scene(k % ths.length); pic.classList.add('on');
    fly.remove();
    k++;
    await wait(2600);
  }, .4);
}

/* ================================================================
   compare — нейросеть каждый раз по-новому, конструктор — в стиле
   ================================================================ */
const SPARK = `<svg viewBox="0 0 40 40" aria-hidden="true"><path class="mk-spark" d="M20 3Q20 20 37 20Q20 20 20 37Q20 20 3 20Q20 20 20 3Z"/><circle class="mk-coin" cx="33" cy="33" r="6"/><path class="mk-coin-l" d="M31 30.6v5M31 30.6h2.4a1.4 1.4 0 0 1 0 2.8H30.2M30.2 35h3.6"/></svg>`;
const FILE_BIG = `<svg viewBox="0 0 40 40" aria-hidden="true"><path class="mk-page" d="M10 4h14l7 7v24a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 9 35V5.5A1.5 1.5 0 0 1 10.5 4z"/><path class="mk-page-fold" d="M24 4v7h7"/><path class="mk-page-code" d="M16.5 19l-3 3 3 3M23.5 19l3 3-3 3"/></svg>`;
// «красиво, но каждый раз по-другому»: свои цвета, своя толщина строк, свои углы
const AI_LOOKS = [['#1E2A78', '#FFD84D'], ['#F4EFE6', '#2B2B2B'], ['#0F5132', '#E8F5E9'], ['#FFB3C7', '#5A1E3B'],
  ['#6C4AB6', '#FFFFFF'], ['#C9F0FF', '#003049'], ['#FFE8A3', '#7A2E8E'], ['#111111', '#F2F2F2'], ['#D7263D', '#FFF5E6']];
function aiPost(i, used){
  let look; do look = any(AI_LOOKS); while (used.has(look)); used.add(look);
  const n = 1 + Math.floor(Math.random() * 3);
  return postHTML({
    f: 'tall', l: any(LAYOUTS), p: any(['clean', 'clean', 'dots', 'grid']), tags: Math.random() < .5 ? 0 : 1, g: any(TAGS),
    lines: Array.from({ length: n }, () => +rnd(.4, 1).toFixed(2)), sub: Math.random() < .6 ? +rnd(.3, .7).toFixed(2) : 0,
    cls: 'mk-ai', style: `--mk-bg:${look[0]};--mk-t:${look[1]};--mk-lh:${rnd(.55, 1.5).toFixed(2)};--mk-r:${any(['0px', '99px', '.6cqw'])};--mk-logo:${any(['1', '0'])};--i:${i}`,
  });
}
// палитры идут по кругу со случайного места: в ряду всегда видно все три
let ownShift = 0;
function ownPost(i){
  if (!i) ownShift = Math.floor(Math.random() * SCHEMES.length);
  return postHTML({ f: 'tall', s: SCHEMES[(ownShift + i) % SCHEMES.length], p: any(PATTERNS), l: any(LAYOUTS), g: any(TAGS),
    lines: [+rnd(.66, .94).toFixed(2), +rnd(.38, .7).toFixed(2)], style: `--i:${i}` });
}
function compareHTML(){
  return `<div class="mk-stage mk-cmp">
    <div class="mk-row mk-row-ai"><div class="mk-ico">${SPARK}</div><div class="mk-posts"></div></div>
    <div class="mk-row mk-row-own"><div class="mk-ico">${FILE_BIG}</div><div class="mk-posts"></div></div>
  </div>`;
}
function liveCompare(box){
  const st = box.querySelector('.mk-cmp');
  const [ai, own] = st.querySelectorAll('.mk-posts');
  const fill = () => {
    const used = new Set();
    ai.innerHTML = [0, 1, 2, 3].map(i => aiPost(i, used)).join('');
    own.innerHTML = [0, 1, 2, 3].map(ownPost).join('');
  };
  fill();
  if (still()) { st.classList.add('in'); return; }
  runner(st, async alive => {
    st.classList.remove('in', 'out');
    fill();
    st.offsetWidth;
    st.classList.add('in');
    await wait(4200);
    if (!alive()) return;
    st.classList.add('out');
    await wait(600);
  }, .35);
}
// под сравнением — демо и «написать»
const tryHTML = t => t ? `<div class="mk-try">
  <div class="mk-try-in">
    <h3 class="mk-try-title">${H.T(t.title)}</h3>
    <p class="mk-try-text">${H.T(t.text)}</p>
    <div class="mk-try-btns">
      ${t.link ? `<a class="btn btn-accent mk-try-btn" href="${esc(t.link)}" target="_blank" rel="noopener">${H.T(t.btn)}</a>` : ''}
      ${t.write ? `<a class="btn btn-line" href="${esc(t.writeLink)}" target="_blank" rel="noopener">${H.T(t.write)}</a>` : ''}
    </div>
  </div>
</div>` : '';

/* ---------- запуск ---------- */
// [ключ, иллюстрация, оживление, раскладка]: head — заголовок сверху; left / right — иллюстрация слева / справа от текста
const CHAPTERS = [
  ['feed', feedHTML, liveFeed, 'head'],
  ['file', fileHTML, liveFile, 'left'],
  ['style', styleHTML, liveStyle, 'head'],
  ['mix', mixHTML, liveMix, 'right'],
  ['photo', photoHTML, livePhoto, 'left'],
  ['compare', compareHTML, liveCompare, 'head'],
];

let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'maket.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountMaket(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const m = p.maket;
  mount.innerHTML = CHAPTERS.filter(([k]) => m[k]).map(([k, html, , how]) => {
    const viz = `<div class="mk-viz">${html(m[k])}</div>`;
    const tail = k === 'compare' ? tryHTML(m.try) : '';
    if (how === 'head') return `<section class="mk-ch wrap mk-${k}-ch">${head(m[k])}${viz}${tail}</section>`;
    return `<section class="mk-ch wrap mk-${k}-ch mk-split mk-${how}">${viz}${side(m[k])}</section>`;
  }).join('');
  mount.querySelectorAll('.mk-title').forEach(splitWords);
  mount.querySelectorAll('.mk-ch').forEach(s => reveal.observe(s));
  CHAPTERS.filter(([k]) => m[k]).forEach(([k, , live]) => live(mount.querySelector(`.mk-${k}-ch`), m[k]));
}
