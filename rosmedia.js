/* ================================================================
   КЕЙС «СООБЩЕСТВО ДИЗАЙНЕРОВ РОСАТОМА» (поле rosmedia у проекта, страница NDA)
   Соцсети дизайн-команды Гринатома «Всё о дизайне в Росатом»: канал
   в мессенджере, отраслевой портал дизайнеров и статьи для медиа.
   Макеты — из Дашиной Фигмы (img/design-community), тексты — content.js.
   hero      — в самом начале, выше задачи и роли (rosmedia.js переносит блок):
               синяя полоса во всю ширину, в ней под углом едет стена из всех
               публикаций (три ряда в разные стороны), впереди стеклянная
               аватарка и имя сообщества; курсор чуть поворачивает стену;
   path      — роль по шагам вместо абзаца: пять станций с живыми иконками
               (оформление, спикеры, редактура, свои тексты, площадки),
               линия между ними прорисовывается, нажатие ведет к главе,
               текущая глава подсвечена;
   others    — ресерч: коллаж сообществ других команд разрезан на плитки
               (TILES — положение в процентах), плитки слетаются на место
               при прокрутке, с курсором чуть расходятся по глубине;
               на телефоне — коллаж одной картинкой; крупно по нажатию;
   face      — лицо сообщества: профиль канала со стеклянной аватаркой
               (наклоняется за курсором) и шапка;
   kit       — одна система на все форматы: все макеты коллажом (колонки),
               появляются по очереди, крупно по нажатию;
   speakers  — профили спикеров: компактные карточки 3 × 2 (все шесть на один экран);
               над сеткой «кому отдать тему»: тема сама летит к нужному спикеру;
   carousels — три ленты одна под другой, слайды по порядку; прокрутка проводит
               каждую ленту целиком (нечетные влево, четные вправо), плюс легкое
               покачивание; крупно по нажатию;
   own       — писала сама: настоящие скриншоты опубликованных постов (posts/),
               лента едет сама, в ленте верх поста, крупно — целиком;
   pixel     — «день без правок» (9 сентября, День графического дизайнера):
               игра — найти белый пиксель на картинке 1080 × 1080; курсор
               или палец — лупа (canvas, пиксели без сглаживания), лупа
               над пикселем или нажатие рядом — нашли; без касания лупа
               бродит сама (но пиксель не выдает); кнопка «показать»;
   where     — площадки на светлой подложке: окно мессенджера (шапка, обои,
               пузырь, просмотры) и два окна браузера — портал и статья;
   plan      — шаблон для экспертов живьем: семь вопросов → статья; ниже
               «тема → пост»: темы с постами подсвечиваются по очереди,
               справа веером встают посты на эту тему, наведение выбирает.
   LIGHT     — макеты со светлым фоном: у них тонкая серая рамка.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = () => matchMedia('(hover: none)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
const img = n => H.base + (n.startsWith('img/') ? n : 'img/design-community/' + n);
const full = n => img(n + '.webp'), small = n => img(n + '-s.webp');
// картинка с легкой копией для телефона; data-full — для просмотра крупно
const pic = (n, sizes = '(max-width: 900px) 100vw, 40vw', cls = '') =>
  `<img class="${cls}" src="${full(n)}" srcset="${small(n)} 540w, ${full(n)} 1080w" sizes="${sizes}" alt="" loading="lazy" decoding="async" data-full="${full(n)}">`;

// макеты со светлым фоном — тонкая серая рамка, чтобы не сливались со страницей
const LIGHT = new Set(['as-3', 'as-4', 'brand-2', 'brand-3', 'brand-6', 'fear-2', 'fear-3', 'fear-5', 'fest-3', 'fest-w3', 'g8', 'hello', 'lead-2', 'lead-4', 'mobius', 'team-1', 'team-2']);
const lt = n => LIGHT.has(n) || n.startsWith('posts/') ? ' dc-light' : '';   // скриншоты постов — все на светлом
// скриншот поста: в ленте — верх (копия -s, обрезана по посту), крупно — целиком
const post = n => `<img src="${small(n)}" alt="" loading="lazy" decoding="async" data-full="${full(n)}">`;

/* ---------- текст главы ---------- */
const block = c => `<div class="dc-col">
  <h2 class="dc-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="dc-text">${H.T(c.text)}</p>` : ''}
</div>`;

// крупно по нажатию: все картинки с data-full внутри box
function zoomable(box){
  box.addEventListener('click', e => {
    const im = e.target.closest('img[data-full]');
    if (!im || !H.openViewer) return;
    const list = [...box.querySelectorAll('img[data-full]')].filter(x => x.offsetParent);
    H.openViewer(list.map(x => x.dataset.full), Math.max(0, list.indexOf(im)), list);
  });
}

/* ================================================================
   hero — стена публикаций под углом, впереди аватарка сообщества
   ================================================================ */
const WALL = [
  ['as-1', 'article', 'brand-3', 'fest-w1', 'lead-2', 'html-1', 'fear-4', 'lecture-1', 'team-1', 'metrics-1', 'as-4', 'hello'],
  ['lead-1', 'as-w1', 'fear-1', 'html-2', 'brand-5', 'fest-w2', 'as-1', 'lecture-2', 'search', 'article-dark', 'fest-3', 'metrics-2'],
  ['brand-1', 'fest-w3', 'fear-3', 'html-3', 'lead-5', 'as-w2', 'team-2', 'lecture-3', 'as-5', 'fest-w4', 'lead-4', 'ux'],
];
function heroHTML(c){
  const row = list => list.map(n => `<img src="${small(n)}" alt="" decoding="async">`).join('');
  return `<section class="dc dc-hero" aria-label="${esc(c.name)}">
    <div class="dc-wall">${WALL.map((r, i) => `<div class="dc-row" style="--dur:${[86, 104, 92][i]}s"><div class="dc-row-t">${row(r)}${row(r)}</div></div>`).join('')}</div>
    <div class="dc-hero-front">
      <div class="dc-hero-ava"><img src="${full('avatar')}" alt="" decoding="async"></div>
      <b>${esc(c.name)}</b>${c.sub ? `<span>${H.T(c.sub)}</span>` : ''}
    </div>
  </section>`;
}
function liveHero(box){
  if (still() || touch()) return;
  let raf = 0, mx = 0, my = 0;
  box.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - .5) * 2; my = ((e.clientY - r.top) / r.height - .5) * 2;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; box.style.setProperty('--mx', mx.toFixed(3)); box.style.setProperty('--my', my.toFixed(3)); });
  });
  box.addEventListener('pointerleave', () => { box.style.setProperty('--mx', 0); box.style.setProperty('--my', 0); });
}

/* ================================================================
   path — роль по шагам: пять станций с живыми иконками
   ================================================================ */
const ICONS = {
  face: `<svg viewBox="0 0 56 56" aria-hidden="true"><circle class="i1" cx="17" cy="21" r="9"/><rect class="i2" x="31" y="15" width="17" height="4" rx="2"/><rect class="i2" x="31" y="23" width="11" height="4" rx="2"/><rect class="i3" x="8" y="37" width="40" height="11" rx="3"/></svg>`,
  speakers: `<svg viewBox="0 0 56 56" aria-hidden="true"><g class="h h1"><circle cx="14" cy="24" r="6"/><path d="M4 44c0-7 4.5-11 10-11s10 4 10 11"/></g><g class="h h2"><circle cx="28" cy="19" r="6"/><path d="M18 40c0-7 4.5-11 10-11s10 4 10 11"/></g><g class="h h3"><circle cx="42" cy="24" r="6"/><path d="M32 44c0-7 4.5-11 10-11s10 4 10 11"/></g></svg>`,
  edit: `<svg viewBox="0 0 56 56" aria-hidden="true"><rect class="l" x="9" y="14" width="38" height="4" rx="2"/><rect class="l" x="9" y="26" width="30" height="4" rx="2"/><rect class="l" x="9" y="38" width="34" height="4" rx="2"/><rect class="st" x="7" y="27" width="34" height="2" rx="1"/><rect class="pen" x="40" y="21" width="5" height="14" rx="1.5"/></svg>`,
  own: `<svg viewBox="0 0 56 56" aria-hidden="true"><rect class="pg" x="12" y="6" width="32" height="44" rx="3"/><rect class="t t1" x="18" y="15" width="20" height="3" rx="1.5"/><rect class="t t2" x="18" y="23" width="20" height="3" rx="1.5"/><rect class="t t3" x="18" y="31" width="20" height="3" rx="1.5"/><rect class="t t4" x="18" y="39" width="20" height="3" rx="1.5"/></svg>`,
  where: `<svg viewBox="0 0 56 56" aria-hidden="true"><g class="w w1"><rect x="6" y="30" width="30" height="20" rx="3"/><circle cx="11" cy="35" r="1.5"/><circle cx="16" cy="35" r="1.5"/></g><g class="w w2"><rect x="13" y="18" width="30" height="20" rx="3"/><circle cx="18" cy="23" r="1.5"/><circle cx="23" cy="23" r="1.5"/></g><g class="w w3"><rect x="20" y="6" width="30" height="20" rx="3"/><circle cx="25" cy="11" r="1.5"/><circle cx="30" cy="11" r="1.5"/></g></svg>`,
};
function pathHTML(c){
  return `<section class="dc-ch dc-ch-path"><div class="wrap">
    <span class="case-label dc-label">${H.T(c.label)}</span>
    <div class="dc-path"><i class="dc-path-line"></i>${c.steps.map((s, i) =>
      `<button type="button" class="dc-step" data-k="${s.k}" data-ic="${s.i || s.k}" style="--i:${i}"><span class="dc-step-i">${ICONS[s.i || s.k] || ''}</span><span class="dc-step-t">${H.T(s.t)}</span></button>`).join('')}</div>
  </div></section>`;
}
function livePath(box, mount){
  const steps = [...box.querySelectorAll('.dc-step')];
  const caseEl = mount.closest('.case') || document.scrollingElement;
  const chapter = k => mount.querySelector('.dc-ch-' + k);
  steps.forEach(b => b.addEventListener('click', () => {
    const sec = chapter(b.dataset.k); if (!sec) return;
    const top = sec.getBoundingClientRect().top - caseEl.getBoundingClientRect().top + caseEl.scrollTop - 72;
    caseEl.scrollTo({ top, behavior: still() ? 'auto' : 'smooth' });
  }));
  // текущая глава — станция подсвечена
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const k = [...e.target.classList].find(c => c.startsWith('dc-ch-')).slice(6);
    steps.forEach(b => b.classList.toggle('now', b.dataset.k === k));
  }), { rootMargin: '-40% 0px -50% 0px' });
  steps.forEach(b => { const sec = chapter(b.dataset.k); if (sec) io.observe(sec); });
}

/* ================================================================
   others — ресерч: коллаж плитками, слетаются на место
   ================================================================ */
// плитки коллажа img/design-community/others/o-NN.webp: [x, y, w, h] в процентах от коллажа 2978 × 2388
// плитки коллажа — по узлам Фигмы, в порядке слоев (позже в списке — выше; наложения как в макете):
// [x, y, w, h] в процентах от раздела, 1 — светлая (рамка). Файлы others/u-NN.webp — исходные картинки Даши (экспорт из Фигмы по именам слоев, 04.11), NN — номер узла в разделе
const TILES = [[1.54, 1.81, 17.2, 12.06, 0], [19.95, 1.81, 18.39, 13.99, 0], [39.25, 1.81, 21.49, 15.08, 0], [61.96, 1.24, 18.81, 13.2, 0], [81.68, 1.81, 17.2, 12.06, 0], [86.84, 15.8, 12.04, 8.38, 1], [68.97, 16.89, 16.12, 20.1, 0], [40.54, 29.7, 17.2, 12.06, 1], [57.33, 31.46, 9.89, 9.25, 0], [22.68, 20.25, 16.11, 13.37, 0], [68.97, 39.44, 8.6, 10.72, 0], [78.64, 38.75, 6.45, 3.92, 0], [86.84, 29.7, 12.04, 6.33, 0], [45.11, 47.58, 20.96, 6.27, 1], [68.97, 51.92, 17.2, 12.06, 1], [2.85, 19.48, 8.6, 10.72, 0], [2.67, 31.46, 13.76, 21.44, 1], [2.85, 53.26, 13.76, 21.44, 1], [2.67, 74.7, 17.2, 15.43, 1], [60.37, 14.44, 8.6, 10.72, 0], [46.39, 58.38, 18.39, 13.65, 0], [46.39, 73.11, 18.66, 23.19, 1], [67.22, 70.61, 17.2, 16.08, 0], [23.76, 57.2, 18.43, 13.57, 1], [28.09, 53.84, 9.08, 1.32, 0]];
// очередность появления — сверху вниз, слева направо (порядок в DOM остается как в Фигме)
const TILE_ORDER = TILES.map((t, i) => i).sort((a, b) => (Math.floor(TILES[a][1] / 12) - Math.floor(TILES[b][1] / 12)) || (TILES[a][0] - TILES[b][0]));
function othersHTML(c){
  // разлет: каждая плитка стартует со своей стороны, с поворотом; --jx/--jy — сдвиг от сетки Фигмы,
  // чтобы край коллажа был рваным: у крайних плиток (верхний и нижний ряд, левая и правая колонка) сдвиг больше; --z — глубина для параллакса
  const rnd = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  return `<div class="dc-board" style="aspect-ratio:2978/2388">${TILES.map((t, i) =>
    `<img class="dc-tile${t[4] ? ' dc-light' : ''}" src="${img('others/u-' + String(i + 1).padStart(2, '0') + '.webp')}" alt="" loading="lazy" decoding="async"
      style="left:${(t[0] + (rnd(i, 5) - .5) * 4 + (t[0] < 5 || t[0] + t[2] > 95 ? (rnd(i, 7) - .5) * 7 : 0)).toFixed(2)}%;top:${(t[1] + (rnd(i, 6) - .5) * 5 + (t[1] < 8 || t[1] + t[3] > 88 ? (rnd(i, 8) - .5) * 10 : 0)).toFixed(2)}%;width:${t[2]}%;--i:${TILE_ORDER.indexOf(i)};--dx:${((rnd(i, 1) - .5) * 90).toFixed(1)}%;--dy:${((rnd(i, 2) - .5) * 90).toFixed(1)}%;--rz:${((rnd(i, 3) - .5) * 40).toFixed(1)}deg;--z:${(.4 + rnd(i, 4) * .8).toFixed(2)}">`).join('')}</div>
  <figure class="dc-others"><img src="${img(c.src)}" alt="" loading="lazy" decoding="async" data-full="${img(c.src)}"></figure>`;
}
// плитки плавают: у каждой свой медленный ход, одни выходят вперед (крупнее и выше), другие уходят назад;
// курсор чуть сдвигает по глубине; наведение — плитка на передний план
function liveOthers(box, c){
  const board = box.querySelector('.dc-board'), tiles = [...board.querySelectorAll('.dc-tile')];
  board.addEventListener('click', () => H.openViewer && H.openViewer([img(c.src)], 0));
  if (still()) return;
  let mx = 0, my = 0, raf = 0, on = false, started = false, hot = null;
  if (!touch()) {
    board.addEventListener('pointermove', e => { const r = board.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - .5) * 2; my = ((e.clientY - r.top) / r.height - .5) * 2; });
    board.addEventListener('pointerleave', () => { mx = my = 0; });
    tiles.forEach(t => { t.addEventListener('pointerenter', () => { hot = t; }); t.addEventListener('pointerleave', () => { if (hot === t) hot = null; }); });
  }
  const P = tiles.map((t, i) => ({ t, w: .25 + (i * 7 % 10) / 14, f: i * 2.4, ax: 6 + (i * 5 % 7), ay: 5 + (i * 3 % 6), z: +t.style.getPropertyValue('--z') }));
  const frame = now => {
    const s = now / 1000;
    P.forEach((p, i) => {
      const d = Math.sin(s * p.w + p.f);                      // глубина: 1 — впереди, -1 — сзади
      const x = Math.cos(s * p.w * .7 + p.f) * p.ax + mx * p.z * 6, y = Math.sin(s * p.w * .9 + p.f * 1.3) * p.ay + my * p.z * 6;
      const h = hot === p.t;
      p.t.style.transform = `translate(${x.toFixed(1)}px,${(y - (h ? 4 : 0)).toFixed(1)}px) scale(${(h ? 1.1 : 1 + d * .06).toFixed(3)})`;
      p.t.style.zIndex = h ? 99 : 50 + Math.round(d * 20);
    });
    if (on) raf = requestAnimationFrame(frame);
  };
  // после прилета плиток CSS-переход больше не нужен — ходом управляет кадр
  onScreen(box, v => { on = v; cancelAnimationFrame(raf);
    if (!v) return;
    const go = () => { board.classList.add('float'); raf = requestAnimationFrame(frame); };
    if (started) go(); else { started = true; setTimeout(go, 2600); }
  }, .25);
}

/* ================================================================
   face — профиль канала, шапка, подпись на постах
   ================================================================ */
function faceHTML(c){
  return `<div class="dc-face">
    <div class="dc-prof">
      <div class="dc-ava"><img src="${full('avatar')}" alt="" decoding="async"></div>
      <div class="dc-prof-t"><b>${esc(c.name)}</b><span>${H.T(c.sub)}</span></div>
    </div>
    <img class="dc-cap" src="${full('header')}" alt="" loading="lazy" decoding="async" data-full="${full('header')}">
    <div class="dc-minis">${['as-1', 'lead-1', 'brand-2', 'fear-2'].map((n, i) =>
      `<div class="dc-mini${lt(n)}" style="--i:${i}">${pic(n, '(max-width: 900px) 25vw, 12vw')}</div>`).join('')}</div>
  </div>`;
}
function liveFace(box){
  const ava = box.querySelector('.dc-ava');
  if (still() || touch()) return;
  box.addEventListener('pointermove', e => {
    const r = ava.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / innerWidth, y = (e.clientY - r.top - r.height / 2) / innerHeight;
    ava.style.transform = `rotateY(${x * 40}deg) rotateX(${-y * 40}deg)`;
  });
  box.addEventListener('pointerleave', () => { ava.style.transform = ''; });
}

/* ================================================================
   kit — все макеты коллажом
   ================================================================ */
const kitHTML = c => `<div class="dc-kit">${c.items.map((n, j) =>
  `<figure class="dc-kit-f${lt(n)}" style="--j:${j}">${pic(n, '(max-width: 700px) 50vw, 25vw')}</figure>`).join('')}</div>`
  + (c.lectures ? lecturesHTML(c.lectures) : '');
// записи лекций: обложки видео (плеер нарисован в самих обложках) — как список видеозаписей
const lecturesHTML = l => `<div class="dc-lec">
  <h3 class="dc-lec-h">${H.T(l.title)}</h3>
  <div class="dc-lec-g">${l.items.map((v, i) => `<figure class="dc-lec-v" style="--i:${i}"><div class="dc-lec-th">${pic(v.img, '(max-width: 700px) 90vw, 32vw')}</div></figure>`).join('')}</div>
</div>`;

/* ================================================================
   speakers — профили; тема сама летит к спикеру
   ================================================================ */
function speakersHTML(c){
  return `<div class="dc-ask"><span>${H.T(c.ask)}</span><b class="dc-ask-chip"></b></div>
  <div class="dc-team">${c.people.map((m, i) => `<article class="dc-man" style="--i:${i}">
    <img class="dc-man-p" src="${full('p-' + m.p)}" alt="" loading="lazy" decoding="async">
    <h3>${esc(m.name)}</h3><p class="dc-man-r">${H.T(m.role)}</p>
    <ul class="dc-man-c">${m.tags.map(t => `<li>${H.T(t)}</li>`).join('')}</ul>
  </article>`).join('')}</div>`;
}
function liveSpeakers(box, c){
  const cards = [...box.querySelectorAll('.dc-man')], chip = box.querySelector('.dc-ask-chip'), ask = box.querySelector('.dc-ask');
  const wrap = box.querySelector('.dc-wide');
  let at = 0, round = 0, timers = [], on = false, hand = false;
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const after = (ms, f) => timers.push(setTimeout(f, ms));
  const set = i => cards.forEach((card, j) => { card.classList.toggle('hot', j === i); if (j !== i) card.querySelectorAll('li').forEach(l => l.classList.remove('hot')); });
  cards.forEach((card, i) => card.addEventListener('pointerenter', () => { hand = true; clear(); set(i); chip.classList.remove('go'); ask.classList.add('idle'); }));
  // одна тема: показать в чипе → долететь до компетенции спикера → подсветить карточку
  const step = () => {
    clear();
    if (!on || hand || still()) return;
    const card = cards[at], lis = [...card.querySelectorAll('li')], li = lis[round % lis.length];
    chip.classList.add('reset'); chip.classList.remove('go', 'land'); chip.textContent = li.textContent;
    void chip.offsetWidth; chip.classList.remove('reset');   // без перехода — иначе чип летит назад поверх карточек
    cards.forEach(x => x.classList.remove('hot')); box.querySelectorAll('.dc-man li.hot').forEach(l => l.classList.remove('hot'));
    after(900, () => {
      const a = chip.getBoundingClientRect(), b = li.getBoundingClientRect();
      chip.style.setProperty('--tx', (b.left + b.width / 2 - (a.left + a.width / 2)) + 'px');
      chip.style.setProperty('--ty', (b.top + b.height / 2 - (a.top + a.height / 2)) + 'px');
      chip.classList.add('go');
    });
    after(1800, () => { chip.classList.add('land'); li.classList.add('hot'); set(at); });
    after(3400, () => { at = (at + 1) % cards.length; if (!at) round++; step(); });
  };
  onScreen(wrap, v => { on = v; if (v && !hand) step(); else clear(); }, .3);
  if (still()) { ask.classList.add('idle'); set(0); }
}

/* ================================================================
   carousels — три ленты одна под другой: слайды идут по порядку,
   прокрутка проводит ленту целиком (нечетные — влево, четные — вправо)
   ================================================================ */
function carouselsHTML(c){
  return `<div class="dc-strips">${c.items.map((it, i) =>
    `<div class="dc-strip" style="--i:${i}">
      <div class="wrap dc-strip-h"><b>${H.T(it.t)}</b><span class="dc-strip-a"><button type="button" class="dc-arr" data-d="-1" aria-label="назад" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="dc-arr" data-d="1" aria-label="дальше"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></span></div>
      <div class="dc-strip-v">${it.slides.map(n => `<figure class="dc-sl${lt(n)}">${pic(n, '(max-width: 700px) 70vw, 22vw')}</figure>`).join('')}</div>
    </div>`).join('')}</div>`;
}
// лента листается руками: колесо или трекпад вбок, палец, стрелки, мышью — тянуть; начинается с первого слайда
function liveCarousels(box){
  zoomable(box.querySelector('.dc-strips'));
  box.querySelectorAll('.dc-strip').forEach(row => {
    const v = row.querySelector('.dc-strip-v'), [prev, next] = row.querySelectorAll('.dc-arr');
    const step = () => (v.querySelector('.dc-sl')?.offsetWidth || 300) + 16;
    const sync = () => { prev.disabled = v.scrollLeft < 4; next.disabled = v.scrollLeft > v.scrollWidth - v.clientWidth - 4; };
    [prev, next].forEach(b => b.addEventListener('click', () => v.scrollBy({ left: +b.dataset.d * step(), behavior: still() ? 'auto' : 'smooth' })));
    v.addEventListener('scroll', sync, { passive: true }); sync();
    // мышью — тянуть; если тянули, нажатие не открывает картинку
    let x0 = null, s0 = 0, moved = false;
    v.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = v.scrollLeft; moved = false; });
    addEventListener('pointermove', e => { if (x0 == null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 5) { moved = true; v.classList.add('drag'); } v.scrollLeft = s0 - dx; });
    addEventListener('pointerup', () => { x0 = null; v.classList.remove('drag'); });
    v.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    v.addEventListener('dragstart', e => e.preventDefault());
  });
}

/* ================================================================
   own — свои посты: пост, вырезанный из скриншота (без обоев мессенджера),
   в карточке с подписью площадки; лента едет сама, крупно — весь скриншот
   ================================================================ */
const SND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="on" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/><path class="off" d="M17 9l5 6M22 9l-5 6"/></svg>';
const videoCard = (it, ch) => `<figure class="dc-pc dc-pc-v"><figcaption class="dc-pc-h"><img src="${small('avatar')}" alt=""><b>${esc(ch[it.on])}</b></figcaption>
  <div class="dc-pc-b"><span class="dc-pc-a">${esc(it.author)}</span>
    <div class="dc-pc-vid"><video src="${img(it.video + '.mp4')}" poster="${img(it.video + '.webp')}" muted loop playsinline preload="none"></video>
      <button type="button" class="dc-snd" aria-label="${esc(H.T(it.sound))}">${SND}</button></div>
    <b class="dc-pc-t">${H.T(it.t)}</b><p>${H.T(it.text)}</p></div></figure>`;
// ролики играют, только пока карточка на экране; звук — по кнопке, один на всех
function liveVideos(box){
  const vids = [...box.querySelectorAll('.dc-pc-vid video')];
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target;
    if (e.isIntersecting && !still()) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { threshold: .4 });
  vids.forEach(v => io.observe(v));
  box.querySelectorAll('.dc-snd').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const v = b.parentElement.querySelector('video'), on = v.muted;
    vids.forEach(x => { x.muted = true; x.parentElement.classList.remove('loud'); });
    if (on) { v.muted = false; v.play().catch(() => {}); b.parentElement.classList.add('loud'); }
  }));
}
const postCard = (it, ch) => it.video ? videoCard(it, ch) : `<figure class="dc-pc"><figcaption class="dc-pc-h"><img src="${small('avatar')}" alt=""><b>${esc(ch[it.on])}</b></figcaption>
  <img class="dc-pc-i" src="${small(it.src)}" alt="" loading="lazy" decoding="async" data-full="${full(it.full || it.src)}"></figure>`;
function ownHTML(c){
  return `<div class="dc-own"><div class="wrap dc-own-a"><button type="button" class="dc-arr" data-d="-1" aria-label="назад" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="dc-arr" data-d="1" aria-label="дальше"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div>
    <div class="dc-own-v">${c.items.map(it => postCard(it, c.channels)).join('')}</div></div>`;
}
// лента постов: вбок колесом, пальцем, мышью тянуть, стрелками; с первого поста
function liveOwn(box){
  const v = box.querySelector('.dc-own-v'), [prev, next] = box.querySelectorAll('.dc-arr');
  const step = () => (v.querySelector('.dc-pc')?.offsetWidth || 300) + 18;
  const sync = () => { prev.disabled = v.scrollLeft < 4; next.disabled = v.scrollLeft > v.scrollWidth - v.clientWidth - 4; };
  [prev, next].forEach(b => b.addEventListener('click', () => v.scrollBy({ left: +b.dataset.d * step(), behavior: still() ? 'auto' : 'smooth' })));
  v.addEventListener('scroll', sync, { passive: true }); sync();
  let x0 = null, s0 = 0, moved = false;
  v.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('button')) return; x0 = e.clientX; s0 = v.scrollLeft; moved = false; });
  addEventListener('pointermove', e => { if (x0 == null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 5) { moved = true; v.classList.add('drag'); } v.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { x0 = null; v.classList.remove('drag'); });
  v.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  v.addEventListener('dragstart', e => e.preventDefault());
}

/* ================================================================
   all — дизайн для всех: посты для тех, кто не дизайнер (цвет опасности,
   знак радиации, полосы на трубах, логотип Росатома) — карточки поста
   с картинкой, заголовком и началом текста из опубликованного поста
   ================================================================ */
function allHTML(c){
  return `<div class="dc-all">${c.items.map((it, i) => `<article class="dc-ac" style="--i:${i}">
    <div class="dc-ac-c">
      <div class="dc-ac-h"><img src="${small('avatar')}" alt=""><b>${esc(c.channel)}</b></div>
      <b class="dc-ac-t">${H.T(it.t)}</b>
      <span class="dc-ac-tags">${it.tags.map(esc).join(' ')}</span>
      <p>${H.T(it.lead)}</p>
      <div class="dc-ac-f"><img src="${full(it.img)}" alt="" loading="lazy" decoding="async" data-full="${full(it.full)}"${it.pos ? ` style="object-position:${it.pos};transform-origin:${it.pos}"` : ''}></div>
    </div>
  </article>`).join('')}</div>`;
}

/* ================================================================
   pixel — найдите битый пиксель: лупа на canvas
   ================================================================ */
function pixelHTML(c){
  return `<div class="dc-px">
    <div class="dc-px-pic" style="--x:${(c.x + .5) / c.size * 100}%;--y:${(c.y + .5) / c.size * 100}%">
      <img src="${img(c.src + '.webp')}" alt="" decoding="async" draggable="false">
      <canvas class="dc-px-lens" aria-hidden="true"></canvas>
      <i class="dc-px-ring" aria-hidden="true"></i>
    </div>
    <div class="dc-px-bar">
      <span class="dc-px-say" aria-live="polite">${H.T(touch() ? c.hintTouch : c.hint)}</span>
      <button type="button" class="btn btn-line dc-px-btn">${H.T(c.give)}</button>
    </div>
  </div>`;
}
function livePixel(box, c){
  const pic = box.querySelector('.dc-px-pic'), lens = box.querySelector('.dc-px-lens'), say = box.querySelector('.dc-px-say');
  const btn = box.querySelector('.dc-px-btn'), ctx = lens.getContext('2d');
  const src = new Image(); src.src = img(c.src + '.webp');
  const K = 10;                       // увеличение лупы
  let found = false, hand = false, raf = 0, on = false, t0 = 0, last = null;
  const size = () => lens.getBoundingClientRect().width || 180;
  // лупа над точкой (u, v) в пикселях картинки
  const draw = (u, v) => {
    const r = pic.getBoundingClientRect(), L = size(), dpr = devicePixelRatio || 1;
    if (lens.width !== Math.round(L * dpr)) { lens.width = lens.height = Math.round(L * dpr); }
    const span = L / (r.width / c.size * K);   // сколько пикселей картинки помещается в лупу
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, lens.width, lens.height);
    if (src.complete) ctx.drawImage(src, u - span / 2, v - span / 2, span, span, 0, 0, lens.width, lens.height);
    lens.style.transform = `translate(${u / c.size * r.width - L / 2}px,${v / c.size * r.height - L / 2}px)`;
    pic.classList.add('look');
  };
  const win = () => {
    found = true; hand = true; cancelAnimationFrame(raf);
    draw(c.x + .5, c.y + .5); pic.classList.add('found');   // лупа встает ровно на пиксель
    say.innerHTML = H.T(c.found); btn.innerHTML = H.T(c.again);
  };
  const reset = () => {
    found = false; pic.classList.remove('found', 'look'); say.innerHTML = H.T(touch() ? c.hintTouch : c.hint); btn.innerHTML = H.T(c.give);
  };
  const at = e => { const r = pic.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * c.size, (e.clientY - r.top) / r.height * c.size]; };
  const near = (u, v, d) => Math.hypot(u - c.x - .5, v - c.y - .5) < d;
  pic.addEventListener('pointermove', e => {
    if (found) return; hand = true; cancelAnimationFrame(raf);
    const [u, v] = at(e); last = [u, v]; draw(u, v);
    if (near(u, v, 5)) win();          // пиксель оказался в самом центре лупы
  });
  pic.addEventListener('pointerdown', e => {
    if (found) return; hand = true; cancelAnimationFrame(raf);
    const [u, v] = at(e); draw(u, v);
    if (near(u, v, 22)) win();
    else if (e.pointerType === 'mouse') { say.innerHTML = H.T(c.miss); pic.classList.remove('miss'); void pic.offsetWidth; pic.classList.add('miss'); }
  });
  pic.addEventListener('pointerleave', () => { if (!found) pic.classList.remove('look'); });
  btn.addEventListener('click', () => { hand = true; cancelAnimationFrame(raf); found ? reset() : win(); });
  // без касания лупа бродит сама по верхней половине — пиксель не выдает
  const wander = now => {
    if (!on || hand || found) return;
    if (!t0) t0 = now; const k = (now - t0) / 1000;
    draw(c.size * (.5 + .34 * Math.sin(k * .42) * Math.cos(k * .17)), c.size * (.3 + .16 * Math.sin(k * .31 + 1)));
    raf = requestAnimationFrame(wander);
  };
  if (still()) return;
  onScreen(box, v => { on = v; cancelAnimationFrame(raf); if (v && !hand && !found) raf = requestAnimationFrame(wander); }, .4);
}

/* ================================================================
   where — площадки: окна мессенджера и браузера на подложке
   ================================================================ */
const ICO = {
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l6 6-6 6M20 11H9a5 5 0 0 0-5 5v3"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l-1 6 4 4H6l4-4-1-6ZM12 13v8"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2ZM10 20a2 2 0 0 0 4 0"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
};
// окно браузера: точки, вкладка, адресная строка (адреса не пишем — только замок и полоска)
const browser = inner => `<div class="dc-br"><div class="dc-br-top"><i></i><i></i><i></i><span class="dc-br-tab"></span></div>
  <div class="dc-br-bar">${ICO.lock}<span></span></div><div class="dc-br-body">${inner}</div></div>`;
function whereHTML(c){
  const ch = c.chat, po = c.portal, me = c.media;
  return `<div class="dc-stage"><div class="wrap"><div class="dc-where">
    <div class="dc-w dc-w-chat">
      <div class="dc-w-bar">${ICO.back}<img src="${full('avatar')}" alt=""><span><b>${esc(ch.channel)}</b><small>${H.T(ch.subs)}</small></span></div>
      <div class="dc-w-wall">
        <div class="dc-w-bubble">
          <span class="dc-w-from">${esc(ch.author)}</span>
          <img class="dc-w-img" src="${img(ch.img + '.webp')}" alt="" loading="lazy" decoding="async">
          <b class="dc-w-h">${H.T(ch.title)}</b>
          <p>${H.T(ch.text)}</p>
          <span class="dc-w-meta">${ICO.eye}${esc(ch.views)}<i></i>${esc(ch.time)}</span>
        </div>
      </div>
      <div class="dc-w-foot">${ICO.bell}${H.T(ch.mute)}</div>
    </div>
    <div class="dc-w-stack">
      <div class="dc-w dc-w-wide">${browser(`
        <div class="dc-w-side"><i class="on"></i><i></i><i></i><i></i></div>
        <div class="dc-w-card">
          <div class="dc-w-txt">
            <div class="dc-w-who"><img src="${full('avatar')}" alt=""><span><b>${esc(po.channel)}</b><small>${ICO.pin}${H.T(po.date)}</small></span></div>
            <b class="dc-w-h">${H.T(po.title)}</b>
            <span class="dc-w-tags">${po.tags.map(esc).join(' ')}</span>
            <p>${H.T(po.text)}</p>
            <div class="dc-w-stat"><span>${ICO.heart}${esc(po.likes)}</span><span>${H.T(po.views)}</span></div>
          </div>
          <img class="dc-w-img" src="${full(po.img)}" alt="" loading="lazy" decoding="async">
        </div>`)}</div>
      <div class="dc-w dc-w-wide">${browser(`
        <div class="dc-w-page">
          <div class="dc-w-txt">
            <div class="dc-w-site"><i></i><span></span><span></span><span></span></div>
            <span class="dc-w-kick">${H.T(me.kicker)}</span>
            <b class="dc-w-big">${H.T(me.title)}</b>
            <span class="dc-w-by">${H.T(me.by)}</span>
          </div>
          <img class="dc-w-img" src="${full(me.img)}" alt="" loading="lazy" decoding="async">
        </div>`)}</div>
    </div>
  </div></div></div>`;
}
/* ================================================================
   plan — шаблон живьем: ответы эксперта собираются в статью; рубрики
   ================================================================ */
function planHTML(c){
  const q = c.form.length;
  return `<div class="dc-flow">
    <div class="dc-flow-l">
      <span class="dc-flow-cap">${H.T(c.expert)}</span>
      <ol class="dc-q">${c.form.map((t, i) => `<li style="--i:${i}"><span>${H.T(t)}</span><i class="dc-ans"><b style="--w:${[82, 64, 92, 70, 88, 76, 46][i % 7]}%"></b><b style="--w:${[58, 0, 70, 0, 52, 61, 0][i % 7]}%"></b></i></li>`).join('')}</ol>
    </div>
    <i class="dc-flow-arrow" aria-hidden="true"></i>
    <div class="dc-flow-r">
      <span class="dc-flow-cap">${H.T(c.editor)}</span>
      <div class="dc-art"><i class="dc-art-h"></i>${Array.from({ length: q }, (_, i) => `<i class="dc-art-p" style="--i:${i}"><b></b><b></b>${i % 2 ? '' : '<b></b>'}</i>`).join('')}</div>
    </div>
  </div>`;
}
function livePlan(box){
  const flow = box.querySelector('.dc-flow'), qs = [...box.querySelectorAll('.dc-q li')], ps = [...box.querySelectorAll('.dc-art-p')];
  if (still()) { flow.classList.add('done'); return; }
  let on = false, timers = [], run = false;
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const after = (ms, f) => timers.push(setTimeout(f, ms));
  // ответ печатается → абзац ложится в статью; после всех — пауза и заново
  const play = () => {
    clear(); run = true;
    qs.forEach(q => q.classList.remove('on')); ps.forEach(p => p.classList.remove('on')); flow.classList.remove('done');
    qs.forEach((q, i) => { after(400 + i * 1500, () => q.classList.add('on')); after(1300 + i * 1500, () => ps[i].classList.add('on')); });
    after(400 + qs.length * 1500 + 600, () => flow.classList.add('done'));
    after(400 + qs.length * 1500 + 4200, () => { if (on) play(); else run = false; });
  };
  onScreen(box, v => { on = v; if (v && !run) play(); }, .25);
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'rosmedia.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

const split = (k, viz, c, rev) =>
  `<section class="dc-ch dc-ch-${k}"><div class="wrap dc-split${rev ? ' rev' : ''}"><div class="dc-viz">${viz}</div>${block(c)}</div></section>`;
const wide = (k, viz, c) =>
  `<section class="dc-ch dc-ch-${k}"><div class="wrap dc-head">${block(c)}</div><div class="wrap dc-wide">${viz}</div></section>`;

export async function mountRosMedia(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const s = p.rosmedia;
  mount.innerHTML =
      (s.path      ? pathHTML(s.path) : '')
    + (s.others    ? split('others', othersHTML(s.others), s.others, true) : '')
    + (s.face      ? split('face', faceHTML(s.face), s.face, false) : '')
    + (s.kit       ? wide('kit', kitHTML(s.kit), s.kit) : '')
    + (s.speakers  ? wide('speakers', speakersHTML(s.speakers), s.speakers) : '')
    + (s.carousels ? `<section class="dc-ch dc-ch-carousels"><div class="wrap dc-head">${block(s.carousels)}</div>${carouselsHTML(s.carousels)}</section>` : '')
    + (s.own       ? `<section class="dc-ch dc-ch-own"><div class="wrap dc-head">${block(s.own)}</div>${ownHTML(s.own)}</section>` : '')
    + (s.all       ? wide('all', allHTML(s.all), s.all) : '')
    + (s.pixel     ? split('pixel', pixelHTML(s.pixel), s.pixel, false) : '')
    + (s.where     ? `<section class="dc-ch dc-ch-where"><div class="wrap dc-head">${block(s.where)}</div>${whereHTML(s.where)}</section>` : '')
    + (s.plan      ? wide('plan', planHTML(s.plan), s.plan) : '');
  // стена публикаций — в самом начале кейса, выше задачи и роли
  const scheme = mount.parentElement.querySelector(':scope > .wrap:has(.camp-head)');
  let hero = null;
  if (s.hero && scheme) {
    scheme.insertAdjacentHTML('beforebegin', heroHTML(s.hero));
    hero = scheme.previousElementSibling;
  }
  mount.querySelectorAll('.dc-ch').forEach(el => reveal.observe(el));
  const q = c => mount.querySelector(c);
  if (hero) liveHero(hero);
  if (s.path) livePath(q('.dc-ch-path'), mount);
  if (s.others) { liveOthers(q('.dc-ch-others'), s.others); zoomable(q('.dc-others')); }
  if (s.face) { liveFace(q('.dc-ch-face')); zoomable(q('.dc-face')); }
  if (s.kit) zoomable(q('.dc-kit'));
  if (s.speakers) liveSpeakers(q('.dc-ch-speakers'), s.speakers);
  if (s.carousels) liveCarousels(q('.dc-ch-carousels'));
  if (s.own) { zoomable(q('.dc-own')); liveVideos(q('.dc-own')); liveOwn(q('.dc-own')); }
  if (s.all) zoomable(q('.dc-all'));
  if (s.pixel) livePixel(q('.dc-ch-pixel'), s.pixel);
  if (s.plan) livePlan(q('.dc-ch-plan'));
}
