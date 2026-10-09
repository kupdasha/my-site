/* ================================================================
   КЕЙС «КОНСТРУКТОР МАКЕТОВ ДЛЯ СОЦСЕТЕЙ» (поле maket у проекта)
   Иллюстрации почти без слов, в цветах самого конструктора
   (заказчик — «Одна кавычка»: лайм, черный, розовый, знак-кавычка).
   Заголовки в макетах — полоски, а не буквы.
   Главы: feed — лента одного паблика: у карточек одна аватарка
   и одно имя, а сами макеты все разные, логотип растянут, верстка
   медленно разъезжается; file — окно браузера с конструктором:
   заголовок печатается, фото падает в рамку, формат меняется
   16:9 ⇄ 4:5; style — в макет попадает что попало (чужой цвет,
   кривая строка, растянутый логотип), и конструктор по очереди
   ставит каждый элемент на место: в фирменный цвет, по полям,
   в пропорции; нажатие — испортить еще раз; mix — кнопка
   «замиксовать» перебирает палитру, фон и композицию, нажимается
   сама, пока не тронули; compare — нейросеть каждый раз
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
const ICON_LIKE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/></svg>`;
const ICON_TALK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 11.6a7.5 7 0 1 1 3.4 5.9L4.2 19l1.2-3.4a6.7 6.7 0 0 1-.9-4z"/></svg>`;
// карточка ленты: одна и та же аватарка с кавычкой и одно имя — видно, что пишет один паблик
function feedHTML(){
  const card = () => `<div class="mk-card">
    <div class="mk-card-head"><span class="mk-ava">${logo('mk-ava-mark')}</span><b></b></div>
    <div class="mk-tile">
      <div class="mk-j mk-j-photo">${scene(3)}<i class="mk-wm"></i></div>
      <svg class="mk-j mk-j-logo" viewBox="0 0 232 309" preserveAspectRatio="none" aria-hidden="true"><path d="${MARK}"/></svg>
      <i class="mk-j mk-j-tag"></i><i class="mk-j mk-j-l1"></i><i class="mk-j mk-j-l2"></i><i class="mk-j mk-j-sub"></i>
    </div>
    <div class="mk-card-foot">${ICON_LIKE}${ICON_TALK}</div>
  </div>`;
  return `<div class="mk-stage mk-feed"><div class="mk-grid">${Array.from({ length: 6 }, card).join('')}</div></div>`;
}
// каждый элемент — свои координаты в процентах плитки; разъезжаются понемногу от прежних
function messUp(tile, full){
  const st = tile._st || (tile._st = {});
  const drift = (k, a, b, d) => { st[k] = full || st[k] == null ? rnd(a, b) : Math.min(b + d, Math.max(a - d, st[k] + rnd(-d, d))); return st[k]; };
  const set = (sel, css) => Object.assign(tile.querySelector(sel).style, css);
  if (full) {
    // у каждого поста свой фон — ни одного повтора в ленте
    const taken = [...tile.closest('.mk-grid').querySelectorAll('.mk-tile')].filter(t => t !== tile).map(t => t._bg);
    tile._bg = any(WRONG_BG.filter(c => !taken.includes(c)));
    tile.style.background = tile._bg;
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
   style — в макет попадает что попало, конструктор всё ставит на место
   ================================================================ */
function styleHTML(c){
  return `<div class="mk-stage mk-style">
    <div class="mk-zone" role="button" tabindex="0" aria-label="${esc(H.pick(c.hint || ''))}">
      ${postHTML({ s: 'lime', p: 'dots', l: 'bl', lines: [.82, .56], cls: 'mk-big' })}
      <div class="mk-guides" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>
  </div>
  ${c.hint ? `<p class="mk-hint">${H.T(c.hint)}</p>` : ''}`;
}
function liveStyle(box){
  const zone = box.querySelector('.mk-zone');
  const post = zone.querySelector('.mk-post');
  // по очереди: знак, теги, строки заголовка, подзаголовок
  const parts = [post.querySelector('.mk-logo'), ...post.querySelectorAll('.mk-copy > *')];
  let poke = null, kick = () => {};
  // «как вставили»: чужой цвет, наклон, сдвиг за поле, растянуто или сплющено
  const spoil = () => {
    zone.classList.add('raw');
    post.dataset.s = other(SCHEMES, post.dataset.s);
    post.dataset.p = any(PATTERNS);
    post.dataset.l = any(LAYOUTS);
    parts.forEach((el, i) => {
      const logo = i === 0;
      el.style.setProperty('--cx', rnd(-18, 18).toFixed(1) + 'cqw');
      el.style.setProperty('--cy', rnd(-9, 9).toFixed(1) + 'cqw');
      el.style.setProperty('--cr', rnd(-14, 14).toFixed(1) + 'deg');
      el.style.setProperty('--csx', (logo ? rnd(1.8, 3) : rnd(.7, 1.35)).toFixed(2));
      el.style.setProperty('--csy', (logo ? rnd(.55, .8) : rnd(.6, 1.9)).toFixed(2));
      el.style.setProperty('--cc', any(WRONG_INK));
      el.style.setProperty('--crad', any(['0px', '3px', '99px']));   // у строк — чужая форма, как другой шрифт
    });
    zone.offsetWidth;
    zone.classList.remove('raw');
  };
  const fix = el => ['--cx', '--cy', '--cr', '--csx', '--csy', '--cc', '--crad'].forEach(k => el.style.removeProperty(k));
  // нажатие — испортить еще раз
  const again = () => { kick(); };
  zone.addEventListener('click', again);
  zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); again(); } });
  if (still()) return;
  runner(zone, async alive => {
    spoil();
    await wait(1300);
    if (!alive()) return;
    zone.classList.add('fixing');
    for (const el of parts) { fix(el); await wait(320); if (!alive()) return; }
    await wait(700);
    zone.classList.remove('fixing');
    // держим готовый макет; нажатие обрывает паузу
    poke = new Promise(r => { kick = r; });
    await Promise.race([wait(2600), poke]);
    kick = () => {};
  }, .45);
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
