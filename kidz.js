/* ================================================================
   КЕЙС «VK, ДЕТСКИЕ ЗОНЫ В КИДЗАНИИ. ДВЕ ЛОКАЦИИ» (поле kidz у проекта)
   Две локации в одном кейсе. В начале — две карточки-фото, нажатие
   ведет к локации. Дальше липкое меню из двух половин с полоской
   прогресса. Перед каждой локацией — синяя перебивка, в конце —
   фото с площадки каруселью.
   Показываем только настоящий материал: рендеры из Blender, фото,
   картинки из презентаций. Нарисованных сценок нет (переделано 18.11:
   рядом с фото они выглядели слабо).
   VK Праздники: рендер и фото построенного рядом (pair), рендер сверху
   с точками зон (plan), фасад (shot + notes), реквизит (collage). Форма поваров — reflex.
   Дом блогеров — аудит застройки: у каждой зоны картинки вариантов
   и списки «добавили / отказались» с причиной (notes).
   Тексты — в content.js, оформление — kidz.css, картинки — img/kidzania.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const small = src => src.replace(/\.webp$/, '-s.webp');   // легкая копия 900 px
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
// перебор по кругу, пока блок на экране и его не трогали; возвращает «стоп»
function autoTour(box, n, show, ms = 2800){
  let i = 0, t = 0, touched = false;
  const step = () => show(i = (i + 1) % n);
  onScreen(box, v => {
    clearInterval(t);
    if (v && !touched && !still()) t = setInterval(step, ms);
  });
  return k => { touched = true; clearInterval(t); if (k != null) i = k; };
}
// логотип VK: белая плашка, буквы — прорезь (сквозь них виден фон)
const VK = 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z';

// aside — картинки коллажем справа от текста (по нажатию — крупно)
const head = ch => `<div class="kz-head${ch.aside ? ' has-aside' : ''}">
  <span class="case-label kz-label">${H.T(ch.label)}</span>
  <h2 class="kz-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="kz-text">${H.T(ch.text)}</p>` : ''}
  ${ch.aside ? `<div class="kz-aside">${ch.aside.map((src, i) =>
    `<button class="kz-aside-pic" data-i="${i}" aria-label="Увеличить"><img src="${small(src)}" data-full="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>` : ''}
</div>`;
function liveAside(sec){
  const imgs = [...sec.querySelectorAll('.kz-aside img')];
  sec.querySelectorAll('.kz-aside-pic').forEach(b => b.addEventListener('click', () =>
    H.openViewer(imgs.map(x => x.dataset.full), +b.dataset.i, imgs)));
}

/* ---------- карточки локаций в начале: фото, название, что сделано ---------- */
function indexHTML(places){
  return `<div class="kz-two">${places.map(pl => `
    <button class="kz-pick" data-go="${pl.key}">
      <span class="kz-pick-pic"><img src="${small(pl.cover)}" srcset="${small(pl.cover)} 900w, ${pl.cover} 2000w" sizes="(max-width:600px) 100vw, 50vw" alt="" draggable="false"></span>
      <span class="kz-pick-name">${H.T(pl.name)}<span class="kz-arr" aria-hidden="true">↓</span></span>
      <span class="kz-pick-text">${H.T(pl.text)}</span>
    </button>`).join('')}</div>`;
}

/* ---------- рендер и фото построенного рядом: главное доказательство кейса ---------- */
function pairHTML(c){
  const pic = (src, tag, i) => `<button class="kz-stage kz-pair-pic" data-i="${i}" aria-label="Увеличить">
    <img src="${small(src)}" srcset="${small(src)} 900w, ${src} 2000w" sizes="(max-width:760px) 100vw, 50vw" data-full="${src}" alt="" loading="lazy" draggable="false">
    <span class="kz-tag">${H.T(tag)}</span></button>`;
  return `<div class="kz-pairs">${c.items.map((it, i) => `<figure class="kz-pair${it.ratio === '4/5' ? ' tall' : ''}" style="--r:${it.ratio || '16/10'};--rn:${ratioNum(it.ratio)}">
    <div class="kz-pair-row">${pic(it.render, c.render, i * 2)}${pic(it.photo, c.built, i * 2 + 1)}</div>
    <figcaption>${H.T(it.name)}</figcaption></figure>`).join('')}</div>`;
}
const ratioNum = r => { const [a, b] = (r || '16/10').split('/'); return (a / b).toFixed(3); };
function livePair(box){
  const imgs = [...box.querySelectorAll('.kz-pair-pic img')];
  box.querySelectorAll('.kz-pair-pic').forEach(b => b.addEventListener('click', () =>
    H.openViewer(imgs.map(x => x.dataset.full), +b.dataset.i, imgs)));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -15% 0px' });
  box.querySelectorAll('.kz-pair').forEach(f => io.observe(f));
}

/* ---------- планировка: рендер сверху, точки зон, площадь ---------- */
function planHTML(c){
  return `<div class="kz-plan">
    <div class="kz-plan-map kz-frame"><img src="${small(c.img)}" srcset="${small(c.img)} 900w, ${c.img} 2000w" sizes="(max-width:760px) 100vw, 40vw" alt="" loading="lazy" draggable="false">
      ${c.zones.map((z, i) => `<button class="kz-pin" data-i="${i}" style="left:${z.x}%;top:${z.y}%" aria-label="${esc(H.pick(z.name))}"><i></i></button>`).join('')}</div>
    <div class="kz-plan-side">
      <p class="kz-area"><span class="kz-area-n" data-n="${esc(c.area)}">0</span><span class="kz-area-u">м²</span></p>
      <ul class="kz-zones">${c.zones.map((z, i) => `<li data-i="${i}"><h3>${H.T(z.name)}</h3><p>${H.T(z.text)}</p></li>`).join('')}</ul>
    </div>
  </div>`;
}
function livePlan(box, c){
  const map = box.querySelector('.kz-plan-map'), pins = [...box.querySelectorAll('.kz-pin')], items = [...box.querySelectorAll('.kz-zones li')];
  const show = i => { pins.forEach((x, k) => x.classList.toggle('on', k === i)); items.forEach((x, k) => x.classList.toggle('on', k === i)); };
  show(0);
  const stop = autoTour(map, c.zones.length, show, 3200);
  [...pins, ...items].forEach(el => {
    const go = () => { stop(+el.dataset.i); show(+el.dataset.i); };
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') go(); });
    el.addEventListener('click', go);
  });
  // площадь досчитывается до 24,6, когда план показался
  const n = box.querySelector('.kz-area-n'), to = parseFloat(n.dataset.n.replace(',', '.'));
  let done = false;
  onScreen(map, v => {
    if (!v || done) return; done = true;
    if (still()) { n.textContent = n.dataset.n; return; }
    const t0 = performance.now();
    const tick = t => {
      const k = clamp((t - t0) / 1400, 0, 1), e = 1 - Math.pow(1 - k, 3);
      n.textContent = (to * e).toFixed(1).replace('.', ',');
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- одна картинка во всю ширину, по нажатию — крупно ---------- */
function shotHTML(c){
  return `<button class="kz-stage kz-shot" aria-label="Увеличить"><img src="${small(c.img)}" srcset="${small(c.img)} 900w, ${c.img} 2000w" sizes="100vw" data-full="${c.img}" alt="" loading="lazy" draggable="false"></button>`;
}
function liveShot(box){
  const b = box.querySelector('.kz-shot'), im = b.querySelector('img');
  b.addEventListener('click', () => H.openViewer([im.dataset.full], 0, [im]));
}

/* ---------- решения: что добавили и от чего отказались, у каждого пункта причина ---------- */
let NOTE_LABELS;
function notesHTML(c){
  const list = (items, cls, label) => `<div class="kz-notes-col ${cls}"><span class="case-label">${H.T(label)}</span><ul>${items.map(([what, why]) =>
    `<li><b>${H.T(what)}</b>${why ? `<span class="kz-why">${H.T(why)}</span>` : ''}</li>`).join('')}</ul></div>`;
  return `<div class="kz-notes">${list(c.plus, 'plus', NOTE_LABELS.plus)}${list(c.minus, 'minus', NOTE_LABELS.minus)}</div>`;
}

/* ---------- форма поваров: два одинаковых кадра, отличается только цвет формы и рефлекс от нее на коже ---------- */
// манекен без лица: важен только цвет, который форма отбрасывает на подбородок, шею и руки
function reflexHTML(c){
  const fig = (it, k) => `<svg viewBox="0 0 400 440" aria-hidden="true">
    <defs>
      <radialGradient id="kzSkin${k}" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#F8D6BD"/><stop offset="1" stop-color="#DFA583"/></radialGradient>
      <radialGradient id="kzGlow${k}" gradientUnits="userSpaceOnUse" cx="200" cy="330" r="210"><stop offset="0" stop-color="${it.glow}" stop-opacity=".95"/><stop offset=".55" stop-color="${it.glow}" stop-opacity=".45"/><stop offset="1" stop-color="${it.glow}" stop-opacity="0"/></radialGradient>
      <linearGradient id="kzBib${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
      <clipPath id="kzBody${k}"><circle cx="200" cy="150" r="84"/><rect x="170" y="216" width="60" height="70" rx="20"/><rect x="60" y="300" width="56" height="140" rx="28"/><rect x="284" y="300" width="56" height="140" rx="28"/></clipPath>
    </defs>
    <path d="M70 440V340c0-44 40-66 130-66s130 22 130 66v100z" fill="#F3F4F7"/>
    <g fill="url(#kzSkin${k})"><rect x="60" y="300" width="56" height="140" rx="28"/><rect x="284" y="300" width="56" height="140" rx="28"/><rect x="170" y="216" width="60" height="70" rx="20"/><circle cx="200" cy="150" r="84"/></g>
    <rect class="kz-rf-glow" x="0" y="0" width="400" height="440" fill="url(#kzGlow${k})" clip-path="url(#kzBody${k})"/>
    <path d="M152 262v60M248 262v60" stroke="${it.color}" stroke-width="14"/>
    <path d="M140 316h120v44c40 6 54 22 54 48v32H86v-32c0-26 14-42 54-48z" fill="${it.color}"/>
    <path d="M140 316h120v44c40 6 54 22 54 48v32H86v-32c0-26 14-42 54-48z" fill="url(#kzBib${k})"/>
    <path fill="#fff" fill-rule="evenodd" transform="translate(178 344) scale(1.85)" d="${VK}"/>
  </svg>`;
  return `<div class="kz-rf">${c.items.map((it, k) => `<figure class="kz-rf-it"><span class="kz-stage kz-rf-pic">${fig(it, k)}<span class="kz-rf-vf"><i></i><i></i><i></i><i></i></span></span>
    <figcaption><b>${H.T(it.name)}</b><span>${H.T(it.text)}</span></figcaption></figure>`).join('')}</div>`;
}

/* ---------- что внутри: точки на общем виде ---------- */
function spotsHTML(c){
  return `<div class="kz-spots">
    <div class="kz-stage kz-spots-pic">
      <img src="${small(c.img)}" srcset="${small(c.img)} 900w, ${c.img} 2000w" sizes="100vw" alt="" draggable="false" loading="lazy">
      ${c.items.map((s, i) => `<button class="kz-spot" data-i="${i}" style="left:${s.x}%;top:${s.y}%" aria-label="${esc(H.pick(s.name))}"><i></i></button>`).join('')}
      <div class="kz-tip" aria-live="polite"><b></b><span></span></div>
    </div>
    <p class="kz-spots-cap"><b></b><span></span></p>
  </div>`;
}
function liveSpots(box, c){
  const pic = box.querySelector('.kz-spots-pic'), tip = box.querySelector('.kz-tip'), mob = box.querySelector('.kz-spots-cap');
  const spots = [...box.querySelectorAll('.kz-spot')];
  const show = i => {
    const s = c.items[i];
    spots.forEach((el, k) => el.classList.toggle('on', k === i));
    [tip, mob].forEach(el => {
      el.querySelector(':scope > b').innerHTML = H.T(s.name);
      el.querySelector(':scope > span').innerHTML = H.T(s.text);
    });
    tip.style.left = s.x + '%'; tip.style.top = s.y + '%';
    tip.classList.toggle('left', s.x > 58);
    tip.classList.remove('show'); void tip.offsetWidth; tip.classList.add('show');
  };
  show(0);
  const stop = autoTour(pic, c.items.length, show, 3000);
  spots.forEach(el => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { stop(+el.dataset.i); show(+el.dataset.i); } });
    el.addEventListener('click', () => { stop(+el.dataset.i); show(+el.dataset.i); });
  });
}

/* ---------- карусель: один кадр на всю ширину, сменяются сами, под ними кружки по числу кадров ---------- */
// смахнуть — следующий кадр, короткое нажатие — крупно
function carouselHTML(c){
  const list = c.items;
  return `<div class="kz-car" tabindex="0" role="region" aria-roledescription="слайды">
    <div class="kz-car-row">${list.map((src, k) =>
      `<figure class="kz-car-shot${k ? '' : ' on'}"><img src="${small(src)}" srcset="${small(src)} 900w, ${src} 2000w" sizes="(max-width:760px) 100vw, 80vw" alt="" loading="lazy" draggable="false"></figure>`).join('')}</div>
    <div class="kz-dots">${list.map((_, k) =>
      `<button class="kz-dot${k ? '' : ' on'}" type="button" aria-label="${k + 1} из ${list.length}"><i></i></button>`).join('')}</div>
  </div>`;
}
function liveCarousel(box, c){
  const car = box.querySelector('.kz-car'), row = car.querySelector('.kz-car-row');
  const shots = [...row.children], imgs = shots.map(f => f.querySelector('img')), dots = [...car.querySelectorAll('.kz-dot')];
  let cur = 0, on = false, timer = 0;
  const run = () => { clearTimeout(timer); if (on && !still()) timer = setTimeout(() => go(cur + 1), 4000); };
  const go = k => {
    cur = (k + shots.length) % shots.length;
    shots.forEach((f, n) => f.classList.toggle('on', n === cur));
    dots.forEach((d, n) => d.classList.toggle('on', n === cur));
    // следующий кадр грузится заранее, чтобы смена не мигала пустым
    const nx = imgs[(cur + 1) % imgs.length]; if (nx.loading === 'lazy') nx.loading = 'eager';
    run();
  };
  dots.forEach((d, n) => d.addEventListener('click', () => go(n)));
  onScreen(row, v => { on = v; if (v) imgs.slice(0, 2).forEach(i => { i.loading = 'eager'; }); run(); });
  let x0 = null;
  row.addEventListener('pointerdown', e => { x0 = e.clientX; });
  row.addEventListener('pointerup', e => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
    else H.openViewer(c.items, cur, imgs);
  });
  car.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });
}

/* ---------- меню Café de Persik: буклет один в один с макетом, листается ---------- */
// обложка, разворот из двух колонок и задняя сторона; на телефоне — по одной странице
// узоры напечатаны глянцем по матовой бумаге: поверх рисунка тот же рисунок бликом (градиент kzGloss), блик проезжает по нему
const K_D = 'M48.5 0V213M48.5 117C68 117 86 114 100 110M48.5 117C68 117 86 120 100 124M0 190C18 203 34 208 48.5 208';
const BOOK_K = `<svg class="kz-bk-k" viewBox="0 0 100 213" preserveAspectRatio="none" aria-hidden="true"><path d="${K_D}"/><path class="kz-gl" d="${K_D}"/></svg>`;
// градиент блика — один на кейс: страницы книжки собираются из копий шаблонов
const GLOSS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="kzGloss" x1="-1" y1="0" x2="0" y2=".6">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    <animate attributeName="x1" values="-1;1.2;1.2" keyTimes="0;.6;1" dur="4.5s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="0;2.2;2.2" keyTimes="0;.6;1" dur="4.5s" repeatCount="indefinite"/>
  </linearGradient></defs></svg>`;
function bookPat(){
  let d = '';
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
    const x = k * 34, y = 109 + r * 35;
    d += `M${x} ${y}h14C${x + 18} ${y + 14} ${x + 26} ${y + 28} ${x + 34} ${y + 35}h-14C${x + 13} ${y + 28} ${x + 4} ${y + 14} ${x} ${y}Z`;
  }
  return `<svg class="kz-bk-pat" viewBox="0 0 100 213" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/><path class="kz-gl" d="${d}"/></svg>`;
}
const BOOK_CAT = `<svg class="kz-bk-cat" viewBox="0 0 120 160" aria-hidden="true"><path d="M20 60L26 14 50 40M100 60L94 14 70 40M18 74C18 44 38 36 60 36S102 44 102 74 84 112 60 112 18 104 18 74ZM30 66h24v10c0 6-24 6-24 0zM66 66h24v10c0 6-24 6-24 0zM54 70h12M46 92c6-6 10-6 14 0 4-6 8-6 14 0M60 112v8M44 124l16-8 16 8-16 8zM30 112c-8 20-10 36-6 48M90 112c8 20 10 36 6 48"/></svg>`;
function menuHTML(c){
  const col = list => list.map(([h, items]) => `<section><h4>${esc(h)}</h4>${items.map(t => `<p>${H.T(t)}</p>`).join('')}</section>`).join('');
  const pages = {
    front: `<div class="kz-bk-page kz-bk-front">${BOOK_K}<span class="kz-bk-vk"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" fill-rule="evenodd" d="${VK}"/></svg></span><h3>${esc(c.title).replace(' de ', '<br>de ')}</h3></div>`,
    col1: `<div class="kz-bk-page kz-bk-col">${col(c.cols[0])}</div>`,
    col2: `<div class="kz-bk-page kz-bk-col">${BOOK_CAT}${col(c.cols[1])}</div>`,
    back: `<div class="kz-bk-page kz-bk-back">${bookPat()}</div>`,
  };
  return `<div class="kz-menu">
    <div class="kz-book">${GLOSS}
      <div class="kz-book-stage" tabindex="0" role="region" aria-roledescription="меню" aria-label="${esc(c.title)}">
        <div hidden>${Object.entries(pages).map(([k, h]) => `<template data-k="${k}">${h}</template>`).join('')}</div>
      </div>
    </div>
    ${c.render ? `<button class="kz-stage kz-bk-render" aria-label="Увеличить"><picture>${c.renderWide
      ? `<source media="(max-width:900px)" srcset="${small(c.renderWide)} 900w, ${c.renderWide} 2000w" sizes="100vw">` : ''}<img src="${small(c.render)}" srcset="${small(c.render)} 900w, ${c.render} 2000w" sizes="45vw" data-full="${c.renderWide || c.render}" alt="" loading="lazy" draggable="false"></picture></button>` : ''}
  </div>`;
}
// Прототип листания: меню перелистывается само по кругу, пока оно на экране, без кнопок.
// Широкий экран — настоящая книжка: два листа на корешке посередине, лист переворачивается вокруг корешка
// (обложка → разворот → задняя сторона → разворот → обложка; закрытая книжка сдвигается в центр).
// Узкий экран — по одной странице: страница уходит ребром, следующая выходит с другой стороны
function liveMenu(box, c){
  const stage = box.querySelector('.kz-book-stage');
  const tpl = k => box.querySelector(`template[data-k="${k}"]`).innerHTML;
  const singles = ['front', 'col1', 'col2', 'back'];
  let wide = null, cur = 0, leaves = [], timer = 0, on = false, k = 0;
  // сколько держать каждую страницу: разворот читают дольше
  const PLAN = { wide: [[0, 2800], [1, 4600], [2, 2800], [1, 4600]], narrow: [[0, 2600], [1, 3800], [2, 3800], [3, 2600]] };
  const layout = () => {
    const w = stage.clientWidth >= 500;
    if (w === wide) return;
    wide = w; cur = 0; k = 0; fresh = true;
    stage.querySelectorAll('.kz-bk3d, .kz-bk-spread').forEach(x => x.remove());
    if (w) {
      stage.insertAdjacentHTML('beforeend', `<div class="kz-bk3d">
        <div class="kz-bk-leaf"><div class="kz-bk-face">${tpl('front')}</div><div class="kz-bk-face kz-bk-rev">${tpl('col1')}</div></div>
        <div class="kz-bk-leaf"><div class="kz-bk-face">${tpl('col2')}</div><div class="kz-bk-face kz-bk-rev">${tpl('back')}</div></div>
      </div>`);
      leaves = [...stage.querySelectorAll('.kz-bk-leaf')];
      book(0, true);
    } else stage.insertAdjacentHTML('beforeend', `<div class="kz-bk-spread">${tpl(singles[0])}</div>`);
    run();
  };
  // листы слева от корешка — перевернутые; переворачиваемый лист лежит поверх остальных
  const book = (to, instant) => {
    const bk = stage.querySelector('.kz-bk3d');
    bk.classList.toggle('instant', !!instant);
    bk.dataset.step = to;
    leaves.forEach((l, i) => {
      const turned = i < to;
      if (l.classList.contains('turned') !== turned) l.style.zIndex = 5;
      l.classList.toggle('turned', turned);
    });
    setTimeout(() => leaves.forEach((l, i) => { l.style.zIndex = i < to ? i + 1 : leaves.length - i; }), instant ? 0 : 900);
    if (instant) requestAnimationFrame(() => bk.classList.remove('instant'));
    cur = to;
  };
  const page = to => {
    const dir = to > cur || (cur === 3 && to === 0) ? 1 : -1, old = stage.querySelector('.kz-bk-spread');
    old.classList.add(dir > 0 ? 'out-l' : 'out-r');
    setTimeout(() => {
      old.remove();
      stage.insertAdjacentHTML('beforeend', `<div class="kz-bk-spread">${tpl(singles[to])}</div>`);
      const nw = stage.querySelector('.kz-bk-spread');
      nw.classList.add(dir > 0 ? 'in-r' : 'in-l'); nw.getBoundingClientRect(); nw.classList.remove('in-r', 'in-l');
    }, 300);
    cur = to;
  };
  // первый раз обложка открывается почти сразу — иначе меню успевают пролистать, не заметив, что оно живое
  let fresh = true;
  const run = () => {
    clearTimeout(timer);
    if (!on) return;
    const plan = PLAN[wide ? 'wide' : 'narrow'];
    timer = setTimeout(() => {
      k = (k + 1) % plan.length;
      const to = plan[k][0];
      if (wide) book(to); else page(to);
      run();
    }, fresh && k === 0 ? 650 : plan[k][1]);
    fresh = false;
  };
  const r = box.querySelector('.kz-bk-render');
  if (r) r.addEventListener('click', () => { const im = r.querySelector('img'); H.openViewer([im.dataset.full], 0, [im]); });
  layout();
  addEventListener('resize', layout);
  // без анимаций — сразу разворот, и ничего не листается
  if (still()) { if (wide) book(1, true); else { stage.querySelector('.kz-bk-spread').remove(); stage.insertAdjacentHTML('beforeend', `<div class="kz-bk-spread">${tpl('col1')}</div>`); } return; }
  // листает, когда меню видно хотя бы на треть
  new IntersectionObserver(([e]) => { on = e.isIntersecting; run(); }, { threshold: .3 }).observe(stage);
}

/* ---------- коллаж: одна картинка крупно, остальные вокруг; по нажатию — крупно ---------- */
function collageHTML(c){
  return `<div class="kz-col">${c.items.map((it, i) =>
    `<button class="kz-stage kz-col-it${it.big ? ' big' : ''}${it.tall ? ' tall' : ''}" data-i="${i}" aria-label="Увеличить"><img src="${it.img}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>`;
}
function liveCollage(box){
  const imgs = [...box.querySelectorAll('.kz-col-it img')];
  box.querySelectorAll('.kz-col-it').forEach(b => b.addEventListener('click', () =>
    H.openViewer(imgs.map(x => x.currentSrc || x.src), +b.dataset.i, imgs)));
}

/* ---------- было и варианты: рендеры из презентации рядом, по нажатию — крупно ---------- */
// zoom: { s, x, y } — все картинки ряда увеличены в одно место: варианты отличаются деталью, и ее должно быть видно
function compareHTML(c){
  const z = c.zoom ? ` style="--zs:${c.zoom.s};--zx:${c.zoom.x}%;--zy:${c.zoom.y}%"` : '';
  return `<div class="kz-cmp${c.zoom ? ' zoom' : ''}" style="--n:${c.items.length}">${c.items.map((it, i) =>
    `<figure class="kz-cmp-it"><button class="kz-stage kz-cmp-pic" data-i="${i}" aria-label="Увеличить"><img src="${c.zoom ? it.img : small(it.img)}" data-full="${it.img}" alt="" loading="lazy" draggable="false"${z}></button>${
      it.name ? `<figcaption>${H.T(it.name)}</figcaption>` : ''}</figure>`).join('')}</div>`;
}
function liveCompare(box){
  const imgs = [...box.querySelectorAll('.kz-cmp-pic img')];
  box.querySelectorAll('.kz-cmp-pic').forEach(b => b.addEventListener('click', () =>
    H.openViewer(imgs.map(x => x.dataset.full), +b.dataset.i, imgs)));
}

/* ---------- переключатель рендеров: кнопки — варианты, картинки сменяются сами, пока их не трогали ---------- */
function viewsHTML(c){
  return `<div class="kz-views${c.side ? ' side' : ''}">
    <div class="kz-stage kz-views-pic" style="aspect-ratio:${c.ratio || '16/10'}">${c.items.map((it, i) =>
      `<div class="kz-view${i ? '' : ' on'}" data-i="${i}">${(it.imgs || [it.img]).map(src =>
        `<img src="${small(src)}" srcset="${small(src)} 900w, ${src} 2000w" sizes="${c.side ? '(max-width:760px) 100vw, 55vw' : '(max-width:760px) 100vw, 90vw'}" data-full="${src}" alt="" loading="lazy" draggable="false">`).join('')}</div>`).join('')}</div>
    <div class="kz-bar">${c.items.map((it, i) => `<button class="btn kz-chip${i ? '' : ' on'}" data-i="${i}">${H.T(it.name)}</button>`).join('')}</div>
  </div>`;
}
function liveViews(box, c){
  const views = [...box.querySelectorAll('.kz-view')], chips = [...box.querySelectorAll('.kz-chip')];
  const show = i => { views.forEach((v, k) => v.classList.toggle('on', k === i)); chips.forEach((b, k) => b.classList.toggle('on', k === i)); };
  const stop = autoTour(box.querySelector('.kz-views-pic'), c.items.length, show, 3600);
  chips.forEach((b, i) => b.addEventListener('click', () => { stop(i); show(i); }));
  onScreen(box, v => { if (v) box.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; }); }, '300px 0px');
  box.querySelector('.kz-views-pic').addEventListener('click', e => {
    const im = e.target.closest('img'); if (!im) return;
    const all = [...box.querySelectorAll('.kz-view img')];
    H.openViewer(all.map(x => x.dataset.full), all.indexOf(im), all);
  });
}

const none = () => {};
// порядок здесь — порядок блоков внутри главы: сначала картинки, потом списки решений
const KINDS = {
  pair:   [pairHTML, livePair],
  plan:   [planHTML, livePlan],
  spots:  [spotsHTML, liveSpots],
  shot:   [shotHTML, liveShot],
  reflex: [reflexHTML, none],
  views:  [viewsHTML, liveViews],
  menu:   [menuHTML, liveMenu],
  collage: [collageHTML, liveCollage],
  carousel: [carouselHTML, liveCarousel],
  compare:  [compareHTML, liveCompare],
  notes:  [notesHTML, none],
};

/* ================================================================
   НАВИГАЦИЯ: липкое меню с прогрессом, кнопка «дальше»
   ================================================================ */
function navHTML(places){
  return `<nav class="kz-nav" aria-label="Локации"><div class="wrap"><div class="kz-nav-in">${places.map(pl =>
    `<button class="kz-tab" data-go="${pl.key}"><span class="kz-tab-name">${H.T(pl.name)}</span><i class="kz-prog"><b></b></i></button>`).join('')}</div></div></nav>`;
}
function placeHTML(pl){
  const chs = pl.chapters.map(ch => {
    const ks = Object.keys(KINDS).filter(x => ch[x]);
    return `<section class="kz-ch wrap" data-kind="${ks[0] || ''}">${head(ch)}${ks.map(k => `<div class="kz-viz kz-viz-${k}">${KINDS[k][0](ch[k])}</div>`).join('')}</section>`;
  }).join('');
  return `<div class="kz-place kz-place-${pl.key}" data-place="${pl.key}">
    <header class="kz-door"><div class="wrap">
      <h2 class="kz-door-name">${H.T(pl.name)}</h2><p class="kz-door-sub">${H.T(pl.text)}</p>
    </div></header>
    ${chs}
    ${pl.photos ? `<section class="kz-ch wrap" data-kind="photos">${head(pl.photos)}<div class="kz-viz">${carouselHTML(pl.photos)}</div></section>` : ''}
    ${pl.next && pl.nextKey ? `<div class="wrap kz-next-row"><button class="btn btn-line kz-next" data-go="${pl.nextKey}"><span>${H.T(pl.next)}</span><span class="kz-arr" aria-hidden="true">↓</span></button></div>` : ''}
  </div>`;
}
function liveNav(mount){
  const sc = mount.closest('.case') || document.scrollingElement;
  const nav = mount.querySelector('.kz-nav'), tabs = [...nav.querySelectorAll('.kz-tab')];
  const places = [...mount.querySelectorAll('.kz-place')];
  // верх липкого меню — под полоской «все работы»: прокручиваем так, чтобы заставка локации встала сразу под меню
  const go = key => {
    const pl = mount.querySelector(`.kz-place[data-place="${key}"]`); if (!pl) return;
    const under = nav.getBoundingClientRect().height + parseFloat(getComputedStyle(nav).top || 0);
    const top = pl.getBoundingClientRect().top - (sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top) - under + 1;
    sc.scrollTo({ top: sc.scrollTop + top, behavior: still() ? 'auto' : 'smooth' });
  };
  mount.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  let raf = 0;
  const upd = () => {
    raf = 0;
    const line = nav.getBoundingClientRect().bottom;
    let on = -1;
    places.forEach((pl, i) => {
      const r = pl.getBoundingClientRect();
      const k = clamp((line - r.top) / Math.max(1, r.height - (innerHeight - line)), 0, 1);
      tabs[i].style.setProperty('--k', k.toFixed(3));
      if (r.top <= line + 2 && r.bottom > line + 2) on = i;
    });
    tabs.forEach((t, i) => t.classList.toggle('on', i === on));
    nav.classList.toggle('stuck', on >= 0);
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(upd); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  upd();
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'kidz.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountKidz(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const K = p.kidz, places = K.places;
  NOTE_LABELS = K.notes;
  places.forEach((pl, i) => { pl.nextKey = places[i + 1] ? places[i + 1].key : null; });
  mount.innerHTML = `
    <section class="kz-ch wrap kz-intro">${head(K.intro)}<div class="kz-viz">${indexHTML(places)}</div></section>
    <div class="kz-places">${navHTML(places)}${places.map(placeHTML).join('')}</div>`;
  mount.querySelectorAll('.kz-ch, .kz-door').forEach(s => reveal.observe(s));
  places.forEach(pl => {
    const sec = [...mount.querySelectorAll(`.kz-place[data-place="${pl.key}"] .kz-ch`)];
    pl.chapters.forEach((ch, i) => Object.keys(KINDS).forEach(k => {
      if (ch[k]) KINDS[k][1](sec[i].querySelector('.kz-viz-' + k), ch[k]);
    }));
    if (pl.photos) liveCarousel(sec[pl.chapters.length].querySelector('.kz-viz'), pl.photos);
    pl.chapters.forEach((ch, i) => { if (ch.aside) liveAside(sec[i]); });
  });
  liveNav(mount);
}
