/* ================================================================
   КЕЙС «ЗНАКИ ОТЛИЧИЯ АК БАРС БАНКА» (поле akbars у проекта)
   Медали как ювелирная витрина: идеи крутятся на подставках,
   круги правок сменяют друг друга, одна форма переливается тремя
   металлами, рендер стирается в чертеж с размерами, подставка
   поворачивается, фольга на коробке меняется, а в финале курсор —
   лампа над витриной.
   Тексты — в content.js, оформление — akbars.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);

const head = ch => `<div class="ab-head">
  <span class="case-label ab-label">${H.T(ch.label)}</span>
  <h2 class="ab-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="ab-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const cap = t => t ? `<p class="ab-cap">${H.T(t)}</p>` : '';
const img = (src, c = '') => `<img class="${c}" src="${src}" alt="" loading="lazy" draggable="false">`;
// вкладки — не кнопки, а строка надписей сверху: текущая темная, под ней бежит полоска таймера
const tabs = (names, c = '') => `<div class="ab-tabs${c}" role="tablist">${names.map((n, i) =>
  `<button class="ab-tab" role="tab" aria-selected="${i === 0}" data-i="${i}"><span>${H.T(n)}</span><i class="ab-tick"></i></button>`).join('')}</div>`;

// крупно по нажатию: листаются все кадры с data-zoom внутри box
function zoomable(box){
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-zoom]');
    if (!b || !box.contains(b)) return;
    const list = [...box.querySelectorAll('[data-zoom]')];
    const imgs = list.map(x => x.querySelector('img'));
    H.openViewer(list.map(x => x.dataset.zoom), list.indexOf(b), imgs);
  });
}

// переключатель, который сам листает по кругу, пока блок на экране и его не трогали;
// первое нажатие — и дальше листает только человек
function cycle(box, n, show, ms){
  const btns = [...box.querySelectorAll('.ab-tab')];
  let cur = 0, timer = 0, seen = false, touched = false;
  const set = (i, user) => {
    cur = (i + n) % n;
    btns.forEach((b, j) => b.setAttribute('aria-selected', j === cur));
    // на телефоне ступени — лента вбок: текущая подъезжает в видимую часть
    const bar = btns[cur].parentElement;
    if (bar.scrollWidth > bar.clientWidth + 2) {
      const d = btns[cur].getBoundingClientRect().left - bar.getBoundingClientRect().left;
      bar.scrollTo({ left: bar.scrollLeft + d - 20, behavior: still() ? 'auto' : 'smooth' });
    }
    box.classList.toggle('touched', touched);
    show(cur, user);
    run();
  };
  const run = () => {
    clearTimeout(timer);
    box.style.setProperty('--ms', ms + 'ms');
    // перезапуск полоски таймера у текущей вкладки
    btns.forEach(b => b.classList.remove('run'));
    if (touched || !seen || still()) return;
    void box.offsetWidth; btns[cur]?.classList.add('run');
    timer = setTimeout(() => set(cur + 1), ms);
  };
  btns.forEach((b, i) => b.addEventListener('click', () => { touched = true; set(i, true); }));
  onScreen(box, v => { seen = v; run(); }, '-15% 0px');
  set(0);
  return { set: i => { touched = true; set(i, true); } };
}

/* ---------- идеи: концепции на подставках, медали покачиваются ---------- */
// предмет витрины: картинка, у которой может быть оборот (back) — тогда он переворачивается
const piece = (it, i) => {
  const o = typeof it === 'string' ? { img: it } : it;
  return `<figure class="ab-piece${o.back ? ' ab-two' : ''}${o.pick ? ' ab-pick' : ''}" style="--d:${i}">
    <button class="ab-coin" data-zoom="${o.img}" aria-label="Увеличить">
      ${img(o.img, 'ab-face')}${o.back ? img(o.back, 'ab-back') : ''}
    </button>
    ${o.cap || o.pick ? `<figcaption>${o.pick ? `<span class="ab-chip">${H.T(o.pick)}</span>` : ''}${o.cap ? H.T(o.cap) : ''}</figcaption>` : ''}
  </figure>`;
};
const shelf = (items, c = '') => `<div class="ab-shelf${c}" style="--n:${items.length}">${items.map(piece).join('')}</div>`;

function ideasHTML(c){
  return `<div class="ab-ideas">
    ${tabs(c.groups.map(g => g.name))}
    <div class="ab-stage">${c.groups.map((g, i) => `<div class="ab-scene${i ? '' : ' on'}">
        ${shelf(g.items, g.items.length === 1 ? ' ab-solo' : '')}
        <p class="ab-about">${H.T(g.text)}</p>
      </div>`).join('')}</div>
  </div>${cap(c.hint)}`;
}
// у предметов с оборотом: сами переворачиваются по очереди, когда сцена показалась; наведение — тоже
function turner(box){
  let flips = [];
  box.querySelectorAll('.ab-two').forEach(f => {
    f.addEventListener('pointerenter', () => f.classList.add('flip'));
    f.addEventListener('pointerleave', () => f.classList.remove('flip'));
  });
  return scene => {
    flips.forEach(clearTimeout); flips = [];
    box.querySelectorAll('.ab-two').forEach(f => f.classList.remove('flip'));
    if (still()) return;
    scene.querySelectorAll('.ab-two').forEach((f, k) => {
      flips.push(setTimeout(() => f.classList.add('flip'), 1400 + k * 260));
      flips.push(setTimeout(() => f.classList.remove('flip'), 3600 + k * 260));
    });
  };
}
function scenes(box, c, ms){
  const list = [...box.querySelectorAll('.ab-scene')], turn = turner(box);
  cycle(box, list.length, i => { list.forEach((s, j) => s.classList.toggle('on', i === j)); turn(list[i]); }, c.ms || ms);
  zoomable(box);
}
function liveIdeas(box, c){ scenes(box, c, 5600); }

/* ---------- поиски: этапы строкой сверху, на полке — варианты; ниже всегда видна строка крупных планов на костюме ---------- */
function roundsHTML(c){
  return `<div class="ab-rounds">
    ${tabs(c.steps.map(s => s.name))}
    <div class="ab-stage">${c.steps.map((s, i) => `<div class="ab-scene${i ? '' : ' on'}">
        ${shelf(s.items, s.items.length > 4 ? ' ab-many' : '')}
        <p class="ab-about">${H.T(s.text)}</p>
      </div>`).join('')}</div>
    ${c.wear ? `<div class="ab-wears">
      <span class="ab-wears-label">${H.T(c.wear.label)}</span>
      <div class="ab-wears-row">${c.wear.items.map(w => `<figure>
          <button class="ab-wear" data-zoom="${w.img}" aria-label="Увеличить">${img(w.img)}</button>
          <figcaption>${H.T(w.cap)}</figcaption>
        </figure>`).join('')}</div>
    </div>` : ''}
  </div>${cap(c.hint)}`;
}
function liveRounds(box, c){ scenes(box, c, 6000); }

/* ---------- три уровня: три медали рядом, переключается отделка ---------- */
// рендеры небольшие, поэтому медали не крупно по одной, а втроем, с подписями
function levelsHTML(c){
  return `<div class="ab-levels">
    ${tabs(c.finishes)}
    <div class="ab-shelf ab-trio" style="--n:${c.levels.length}">${c.levels.map((l, i) => `<figure class="ab-piece" style="--d:${i}">
        <button class="ab-coin" data-zoom="${l.a}" aria-label="Увеличить">${img(l.a, 'ab-face')}</button>
        <figcaption><b>${H.T(l.name)}</b>${H.T(l.metal)}</figcaption>
      </figure>`).join('')}</div>
  </div>${cap(c.hint)}`;
}
function liveLevels(box, c){
  const L = c.levels, coins = [...box.querySelectorAll('.ab-coin')];
  const ts = [];
  // все варианты заранее, чтобы монеты не мигали пустотой
  L.forEach(l => [l.a, l.b].forEach(s => { const i = new Image(); i.src = s; }));
  cycle(box, c.finishes.length, f => coins.forEach((b, i) => {
    const src = f ? L[i].b : L[i].a, pic = b.querySelector('img');
    b.dataset.zoom = src;
    if (still() || pic.getAttribute('src') === src) { pic.src = src; return; }
    // монеты по очереди поворачиваются ребром — и выходят в другой отделке
    clearTimeout(ts[i]);
    ts[i] = setTimeout(() => {
      b.classList.add('turn');
      ts[i] = setTimeout(() => { pic.src = src; b.classList.remove('turn'); }, 260);
    }, i * 140);
  }), c.ms || 4200);
  zoomable(box);
}

/* ---------- чертеж: все три вещи в масштабе, рендер стирается в линии, по краям — размеры ---------- */
function planHTML(c){
  return `<div class="ab-plan">
    <div class="ab-board">
      ${c.items.map(it => `<figure class="ab-part">
        <div class="ab-obj" style="aspect-ratio:${it.ratio};--cm:${it.cm}">
          ${img(it.img, 'ab-render')}
          <i class="ab-lines" style="--mask:url('${new URL(it.line, location.href).href}')"></i>
          ${it.x ? `<span class="ab-dim ab-dx"><b>${H.T(it.x)}</b></span>` : ''}
          ${it.y ? `<span class="ab-dim ab-dy"><b>${H.T(it.y)}</b></span>` : ''}
        </div>
        <figcaption>${H.T(it.name)}</figcaption>
      </figure>`).join('')}
      <i class="ab-cut" aria-hidden="true"></i>
    </div>
    ${c.note ? `<p class="ab-about">${H.T(c.note)}</p>` : ''}
  </div>${cap(c.hint)}`;
}
function livePlan(box){
  const board = box.querySelector('.ab-board');
  const objs = [...box.querySelectorAll('.ab-obj')];
  let x = 50, auto = true, seen = false, raf = 0, t0 = 0;
  // граница общая для всей доски, а каждой вещи — свое место разреза
  const put = v => {
    x = clamp(v, 0, 100); board.style.setProperty('--x', x + '%');
    const r = board.getBoundingClientRect(), at = r.left + r.width * x / 100;
    objs.forEach(o => { const b = o.getBoundingClientRect(); if (b.width) o.style.setProperty('--lx', clamp((at - b.left) / b.width * 100, 0, 100) + '%'); });
  };
  // граница сама ходит от края до края, пока не тронули
  const tick = t => {
    if (!t0) t0 = t;
    put(50 + Math.sin((t - t0) / 1800) * 44);
    if (auto && seen) raf = requestAnimationFrame(tick);
  };
  const go = () => { cancelAnimationFrame(raf); if (auto && seen && !still()) raf = requestAnimationFrame(tick); };
  const move = e => {
    const r = board.getBoundingClientRect();
    put((e.clientX - r.left) / r.width * 100);
  };
  board.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || board.hasPointerCapture(e.pointerId)) { auto = false; cancelAnimationFrame(raf); move(e); } });
  board.addEventListener('pointerdown', e => { auto = false; cancelAnimationFrame(raf); board.setPointerCapture(e.pointerId); move(e); });
  // размеры прорисовываются, когда доска показалась
  onScreen(board, v => { seen = v; if (v) board.classList.add('drawn'); go(); });
  addEventListener('resize', () => put(x));
  put(x);
}

/* ---------- подставка: финальная вращается, рядом — три металла ---------- */
function standHTML(c){
  return `<div class="ab-stand">
    <div class="ab-night ab-turn" data-zoom="${c.front}" role="img" aria-label="${H.T(c.alt || '')}">
      ${img(c.front, 'ab-front')}${img(c.back, 'ab-rear')}
    </div>
    <div class="ab-paper ab-metals">
      ${shelf(c.items)}
    </div>
  </div>${cap(c.hint)}`;
}
function liveStand(box, c){
  const turn = box.querySelector('.ab-turn');
  let t = 0, seen = false, side = 0;
  // поворот: сжимается до ребра и раскрывается другой стороной
  const flip = () => {
    side = 1 - side;
    turn.classList.add('edge');
    setTimeout(() => { turn.classList.toggle('rear', !!side); turn.dataset.zoom = side ? c.back : c.front; turn.classList.remove('edge'); }, 380);
  };
  const run = () => { clearInterval(t); if (seen && !still()) t = setInterval(flip, 3200); };
  onScreen(turn, v => { seen = v; run(); });
  turn.addEventListener('pointerenter', () => { flip(); run(); });
  zoomable(box);
}

/* ---------- коробка: открытая с медалью и фольга логотипа в трех вариантах ---------- */
function boxHTML(c){
  return `<div class="ab-box">
    <button class="ab-night ab-open" data-zoom="${c.open}" aria-label="Увеличить">${img(c.open)}</button>
    <div class="ab-paper ab-foil">
      ${tabs(c.foils.map(f => f.name))}
      <div class="ab-lids">${c.foils.map((f, i) => `<button class="ab-lid${i ? '' : ' on'}" data-zoom="${f.img}" aria-label="Увеличить">${img(f.img)}</button>`).join('')}<i class="ab-sweep"></i></div>
      ${c.inside ? `<p class="ab-about">${H.T(c.inside)}</p>` : ''}
    </div>
  </div>${cap(c.hint)}`;
}
function liveBox(box, c){
  const foil = box.querySelector('.ab-foil'), lids = [...box.querySelectorAll('.ab-lid')], sweep = box.querySelector('.ab-sweep');
  cycle(foil, lids.length, i => {
    lids.forEach((l, j) => l.classList.toggle('on', i === j));
    // по фольге пробегает полоска света
    sweep.classList.remove('go'); void sweep.offsetWidth; if (!still()) sweep.classList.add('go');
  }, c.ms || 3000);
  zoomable(box);
}

/* ---------- витрина: курсор — лампа, медали поворачиваются к свету ---------- */
function showHTML(c){
  return `<div class="ab-night ab-show">
    <div class="ab-case">${c.items.map((it, i) =>
      `<button class="ab-gem ab-g${i}" data-zoom="${it}" aria-label="Увеличить" style="--d:${i}">${img(it)}</button>`).join('')}</div>
    <i class="ab-lamp" aria-hidden="true"></i>
  </div>
  ${c.strip ? `<button class="ab-strip" data-zoom="${c.strip}" aria-label="Увеличить">${img(c.strip)}</button>` : ''}${cap(c.hint)}`;
}
function liveShow(box){
  const show = box.querySelector('.ab-show'), gems = [...box.querySelectorAll('.ab-gem')];
  let lx = .3, ly = .3, tx = .3, ty = .3, auto = true, seen = false, raf = 0;
  const tick = t => {
    // без курсора лампа медленно ходит по витрине сама
    if (auto) { tx = .5 + Math.sin(t / 2300) * .36; ty = .42 + Math.sin(t / 1700) * .22; }
    lx += (tx - lx) * .08; ly += (ty - ly) * .08;
    show.style.setProperty('--lx', (lx * 100).toFixed(2) + '%');
    show.style.setProperty('--ly', (ly * 100).toFixed(2) + '%');
    const r = show.getBoundingClientRect();
    gems.forEach(g => {
      const b = g.getBoundingClientRect();
      const dx = (lx * r.width + r.left - (b.left + b.width / 2)) / r.width;
      const dy = (ly * r.height + r.top - (b.top + b.height / 2)) / r.height;
      g.style.setProperty('--ry', clamp(dx * 34, -16, 16).toFixed(2) + 'deg');
      g.style.setProperty('--rx', clamp(-dy * 24, -10, 10).toFixed(2) + 'deg');
    });
    if (seen) raf = requestAnimationFrame(tick);
  };
  show.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    auto = false; const r = show.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
  });
  show.addEventListener('pointerleave', () => { auto = true; });
  if (!still()) onScreen(show, v => {
    if (v && !seen) { seen = true; raf = requestAnimationFrame(tick); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
  zoomable(box);
}

const KINDS = {
  ideas:  [ideasHTML, liveIdeas],
  rounds: [roundsHTML, liveRounds],
  levels: [levelsHTML, liveLevels],
  plan:   [planHTML, livePlan],
  stand:  [standHTML, liveStand],
  box:    [boxHTML, liveBox],
  show:   [showHTML, liveShow],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'akbars.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountAkbars(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const kinds = p.akbars.map(ch => Object.keys(KINDS).find(k => ch[k]));
  mount.innerHTML = p.akbars.map((ch, i) =>
    `<section class="ab-ch wrap ab-${kinds[i]}-ch">${head(ch)}<div class="ab-viz">${kinds[i] ? KINDS[kinds[i]][0](ch[kinds[i]], ch) : ''}</div></section>`).join('');
  mount.querySelectorAll('.ab-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.ab-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.ab-viz'), p.akbars[i][k]); });
}
