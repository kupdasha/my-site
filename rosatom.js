/* ================================================================
   КЕЙС «РЕБРЕНДИНГ HR-ЭКОСИСТЕМЫ РОСАТОМА» (поле rosatom у проекта, страница NDA)
   zoo      — зоопарк логотипов (настоящие логотипы из Фигмы, img/rosatom-hr/zoo)
              по кнопке или сам собирается в одно имя и модули;
   atom     — имена с «атомом», «атом» подсвечивается, остается «Рекорд»;
   research — ресерч под спойлером: что было, рынок, платформа, архитектура
              с тумблерами модулей, критерии, мудборды, дорожная карта;
   ideas    — три концепции, липкое меню с полоской прогресса, у каждой
              заставка и главы (виды глав — KINDS ниже).
   Знаки: первые два — картинки от Даши (img/rosatom-hr/sign-*.webp), знак
   третьей концепции с живой водой нарисован по вектору из Фигмы. Орбитали водорода считаются честно,
   той же физикой, что в Дашином конструкторе (nda/rosatom-hr/orbitals.html).
   Цвета внутри иллюстраций — бренда HR-экосистемы (оранжевый #FD7B25,
   синий Росатома) — исключение из «без оранжевого»: это работа для клиента.
   Тексты — content.js, оформление — rosatom.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const url = p => H.base + p;
// у растровых макетов и мудбордов есть легкая копия -s (900 px) — ее берет сетка, крупно — полная
const small = p => /\/[abc]-[^/]+\.webp$/.test(p) ? p.replace(/\.webp$/, '-s.webp') : p;
const onScreen = (el, cb, threshold = .25) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
let uid = 0;
const nid = s => 'ra' + s + (++uid);

const OR = '#FD7B25';
// шестигранник знака «Сердце Росатома» (вектор из Фигмы, рамка 575 × 529) и три точки внутри: [cx, cy, r]
const HEX = 'M559.15 206.06C580.06 242.28 580.06 286.91 559.15 323.13L473.98 470.65C453.06 506.88 414.41 529.19 372.58 529.19L202.25 529.19C160.42 529.19 121.77 506.88 100.85 470.65L15.69 323.13C-5.23 286.91 -5.23 242.28 15.69 206.06L100.85 58.54C121.77 22.31 160.42 0 202.25 0L372.58 0C414.41 0 453.06 22.31 473.98 58.54L559.15 206.06Z';
const HEX_DOTS = [[192.6, 424.3, 46.7], [272.3, 302.9, 61.3], [357.2, 143.2, 85]];
// шестигранник с градиентом без точек: оранжевый HR, синий Росатома, свечение — слои включаются по data-step у родителя
function gradHex(dots){
  const c = nid('c'), f = nid('f'), b = nid('b');
  return `<svg class="ra-ghex" viewBox="-10 -10 595 549" aria-hidden="true">
    <defs><clipPath id="${c}"><path d="${HEX}"/></clipPath>
      <filter id="${f}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>
      <radialGradient id="${b}" cx="68%" cy="30%" r="88%"><stop offset=".3" stop-color="#C13BDF" stop-opacity="0"/><stop offset=".6" stop-color="#C13BDF" stop-opacity=".9"/><stop offset=".85" stop-color="#2680FF"/><stop offset="1" stop-color="#1F4FD8"/></radialGradient></defs>
    <g clip-path="url(#${c})">
      <rect class="ra-g-or" x="-10" y="-10" width="600" height="560" fill="#FC6A16"/>
      <rect class="ra-g-bl" x="-10" y="-10" width="600" height="560" fill="url(#${b})"/>
      <g class="ra-g-gl" filter="url(#${f})"><circle cx="400" cy="180" r="130" fill="#FDB532"/><circle cx="300" cy="40" r="90" fill="#F92A10" opacity=".7"/><circle cx="560" cy="300" r="70" fill="#F92A10" opacity=".6"/></g>
    </g>
    <path class="ra-g-line" d="${HEX}" fill="none"/>
    ${dots ? `<g class="ra-g-dots">${HEX_DOTS.map(([x, y, r], i) => `<circle style="--i:${i}" cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}</g>` : ''}
  </svg>`;
}

// знак «Ватерлинии человека»: квадрат, вода снизу, кольцо марки — голова человека.
// Под водой нижняя половина кольца оранжевая, внутри белая — как в знаке из Фигмы; liveWater качает воду
const WATER_Y = 74.3;
const waterBody = (d, cl) => `<g class="ra-ws-water"><path class="ra-ws-wave" d="${d}" fill="#FFD6A2"/></g>
      <circle cx="70.65" cy="74.3" r="36.1" fill="none" stroke="#fff" stroke-width="11.3"/>
      <g class="ra-ws-under"><clipPath id="${cl}"><path d="${d}"/></clipPath>
        <g clip-path="url(#${cl})"><circle cx="70.65" cy="74.3" r="36.1" fill="none" stroke="${OR}" stroke-width="11.3"/><circle cx="70.65" cy="74.3" r="30.4" fill="#fff"/></g></g>`;
function waterSign(){
  const c = nid('c'), cl = nid('w');
  return `<svg class="ra-sq ra-wsign" viewBox="0 0 141.3 141.3" aria-hidden="true" data-cl="${cl}">
    <defs><clipPath id="${c}"><rect width="141.3" height="141.3" rx="38.4"/></clipPath></defs>
    <g clip-path="url(#${c})">
      <rect width="141.3" height="141.3" fill="${OR}"/>
      ${waterBody(`M-5 ${WATER_Y}L147 ${WATER_Y}L147 150L-5 150Z`, cl)}
    </g>
  </svg>`;
}
// знаки концепций — картинки (первые две прислала Даша, третья — по вектору из Фигмы)
const SIGN_IMG = { heart: 'sign-heart', wave: 'sign-wave', water: 'sign-water' };
const signImg = (k, cls = '') => `<img class="ra-sign ra-sign-${k} ${cls}" src="${url('img/rosatom-hr/' + SIGN_IMG[k] + '.webp')}" alt="" draggable="false">`;
const SIGN = { heart: () => signImg('heart'), wave: () => signImg('wave'), water: () => signImg('water') };

/* ================================================================
   ГЛАВА: заголовок, подпись, текст
   ================================================================ */
const head = (ch, cls = '') => `<div class="ra-head ${cls}">
  <span class="case-label ra-label">${H.T(ch.label)}</span>
  <h2 class="ra-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="ra-text">${H.T(ch.text)}</p>` : ''}
</div>`;

/* ================================================================
   ЗООПАРК: логотипы вразброс → одно имя и модули
   ================================================================ */
// раскладка как на слайде «как сейчас»: слева логотипы и строки сервисов, справа баннеры и рассылки.
// Места заданы вручную ([x, y] в процентах сцены), чтобы ничего не наезжало
const ZOO_LOGO = [[2,4],[24,3],[44,6],[3,15],[23,14],[43,17],[2,26],[22,26],[42,28],[3,37],[23,38],[44,39],[2,48],[22,49],[42,50],[12,59],[34,60]];
const ZOO_ROW  = [[2,70],[26,74],[3,80],[24,86],[4,92]];
const ZOO_MAT  = [[60,3],[80,5],[61,23],[79,30],[60,48],[81,55],[62,72],[80,79]];
function zooHTML(Z){
  let k = 0;
  // на телефоне (--mx, --my): логотипы — верхняя половина сцены на всю ширину, материалы — нижняя
  const item = (cls, src, [x, y], extra = '') => {
    const r = ((k * 47) % 11) - 5, i = k++;
    const mx = cls === 'mat' ? (x - 60) * 3 : Math.min(x * 1.5, 68), my = cls === 'mat' ? 52 + y * .48 : y * .6;
    return `<img class="ra-zl ${cls}" src="${url(src)}" alt="" draggable="false" style="--x:${x}%;--y:${y}%;--mx:${mx.toFixed(1)}%;--my:${my.toFixed(1)}%;--r:${r * .6}deg;--d:${(i % 7) * .35}s;--i:${i}${extra}">`;
  };
  // у двухстрочных логотипов (знак + подпись «Росатом») буквы мельче — их показываем крупнее
  const big = n => /^(hrtech|atom-id|moy-golos|atomkor|rekord-rosatom|rekord-mobile2|lk)$/.test(n) ? ';--s:1.45' : '';
  const html = Z.logos.map((n, i) => item('logo', 'img/rosatom-hr/zoo/' + n + '.svg', ZOO_LOGO[i % ZOO_LOGO.length], big(n))).join('')
    + Z.rows.map((n, i) => item('row', 'img/rosatom-hr/zoo/' + n + '.svg', ZOO_ROW[i % ZOO_ROW.length])).join('')
    + Z.mats.map((n, i) => item('mat', 'img/rosatom-hr/zoo/' + n + '.webp', ZOO_MAT[i % ZOO_MAT.length])).join('');
  return `<div class="ra-zoo"><div class="ra-zoo-field">${html}</div></div>`;
}
/* ================================================================
   «АТОМ» В ИМЕНАХ: подсветка повторов, остается одно имя
   ================================================================ */
function atomHTML(A){
  const mark = n => esc(n).replace(/(атом|atom)/i, '<mark>$1</mark>');
  return `<div class="ra-atom" data-step="0">
    <div class="ra-atom-names">${A.names.map((n, i) => `<span class="ra-an" style="--i:${i}">${mark(n)}</span>`).join('')}</div>
  </div>`;
}
// «атом» подчеркивается по очереди во всех именах, держится и гаснет — по кругу, пока блок на экране
function liveAtom(sec){
  const box = sec.querySelector('.ra-atom');
  let vis = false, t = 0, k = 0;
  const run = () => { clearTimeout(t); if (!vis) return; box.dataset.step = still() ? 1 : k; if (still()) return; t = setTimeout(() => { k = 1 - k; run(); }, k ? 4200 : 1400); };
  onScreen(box, v => { vis = v; if (v) { k = 0; run(); } else clearTimeout(t); });
}

/* ================================================================
   РЕСЕРЧ: раскрывается кнопкой, внутри — свои живые блоки
   ================================================================ */
function researchHTML(R){
  const sub = (t, body, cls = '') => `<div class="ra-rs ${cls}"><h3 class="ra-rs-title">${H.T(t)}</h3>${body}</div>`;
  const before = sub(R.before.title, `<p class="ra-rs-text">${H.T(R.before.text)}</p>
    <div class="ra-before">${R.before.imgs.map((s, i) => `<button class="ra-pic" data-g="before" data-i="${i}" aria-label="Увеличить"><img src="${url(s)}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>`);
  // карта продуктов — схема: продукты сверху, ниже сквозной Марк и группы сервисов; линии рисует liveMap по положению карточек
  const M0 = R.map;
  const logo = n => `<img class="ra-map-logo${/^(atom-id|moy-golos|atomkor|rekord-mobile)$/.test(n) ? ' two' : ''}" src="${url('img/rosatom-hr/zoo/' + n + '.svg')}" alt="" loading="lazy" draggable="false">`;
  const linked = new Set([...M0.through.from, ...M0.groups.map(g => g.from)]);
  const prod = p => `<div class="ra-map-p${linked.has(p.key) ? '' : ' alone'}" data-key="${p.key}"><span class="ra-map-k">${H.T(p.name)}</span>${p.logos.map(logo).join('')}</div>`;
  const map = sub(M0.title, `<p class="ra-rs-text">${H.T(M0.text)}</p>
    <div class="ra-map">
      <svg class="ra-map-lines" aria-hidden="true"></svg>
      ${M0.products.filter(p => linked.has(p.key)).map(prod).join('')}
      <div class="ra-map-through" data-from="${M0.through.from.join(' ')}"><span class="ra-map-k">${H.T(M0.through.name)}</span><span>${H.T(M0.through.what)}</span></div>
      ${M0.groups.map(g => `<div class="ra-map-g" data-from="${g.from}"><span class="ra-map-gk">${H.T(g.name)}</span>
        <ul>${g.items.map(([n, c]) => `<li><i style="--c:${c}"></i><span>${H.T(n)}</span></li>`).join('')}</ul></div>`).join('')}
      <div class="ra-map-alone"><span class="ra-map-sub">${H.T(M0.alone)}</span><div class="ra-map-alone-in">${M0.products.filter(p => !linked.has(p.key)).map(prod).join('')}</div></div>
    </div>`);
  // рынок — скриншоты HR-сервисов других компаний, по группам
  const market = sub(R.market.title, `<p class="ra-rs-text">${H.T(R.market.text)}</p>
    <div class="ra-market">${R.market.groups.map((g, gi) => `<div class="ra-mk-g"><span class="ra-map-sub">${H.T(g.name)}</span>
      <div class="ra-mk-shots">${g.imgs.map((n, i) => `<button class="ra-pic" data-g="market${gi}" data-i="${i}" aria-label="Увеличить"><img src="${url('img/rosatom-hr/market/' + n + '.webp')}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div></div>`).join('')}</div>`);
  const platform = sub(R.platform.title, `<ol class="ra-chain">${R.platform.steps.map((s, i) =>
    `<li style="--i:${i}"><span class="ra-chain-k">${H.T(s.k)}</span><span class="ra-chain-t">${H.T(s.t)}</span></li>`).join('')}</ol>`);
  // критерии знака: три рисунка с короткой подписью
  const C = R.criteria;
  const PIC = {
    people: '<svg viewBox="0 0 120 80"><circle cx="30" cy="30" r="10"/><path d="M14 66c0-10 7-17 16-17s16 7 16 17"/><circle cx="60" cy="26" r="12"/><path d="M41 66c0-12 8-21 19-21s19 9 19 21"/><circle cx="90" cy="30" r="10"/><path d="M74 66c0-10 7-17 16-17s16 7 16 17"/></svg>',
    smile:  '<svg viewBox="0 0 120 80"><circle cx="60" cy="40" r="30"/><path d="M47 46c4 6 9 8 13 8s9-2 13-8"/><circle cx="50" cy="33" r="2.5" class="f"/><circle cx="70" cy="33" r="2.5" class="f"/></svg>',
    sizes:  '<svg viewBox="0 0 120 80"><rect x="6" y="52" width="14" height="14" rx="4"/><rect x="28" y="40" width="26" height="26" rx="7"/><rect x="62" y="22" width="52" height="44" rx="8"/><rect x="70" y="30" width="14" height="14" rx="4" class="f"/></svg>',
  };
  const criteria = sub(C.title, `<div class="ra-crit">${C.items.map(it => `<div class="ra-crit-i"><span class="ra-crit-pic">${PIC[it.pic]}</span><span class="ra-crit-t">${H.T(it.t)}</span></div>`).join('')}</div>`);
  const M = R.moods;
  const moods = sub(M.title, `<p class="ra-rs-text">${H.T(M.text)}</p>
    <div class="ra-moods">
      <div class="ra-mood-tabs">${M.items.map((m, i) => `<button class="ra-mood-tab${i ? '' : ' on'}" data-i="${i}">${H.T(m.name)}<i class="ra-prog"><b></b></i></button>`).join('')}</div>
      <div class="ra-mood-stage">${M.items.map((m, i) => `<div class="ra-mood${i ? '' : ' on'}" data-i="${i}">
        <button class="ra-pic ra-mood-pic" data-g="mood" data-i="${i}" aria-label="Увеличить"><img src="${url(m.img)}" data-full="${url(m.img)}" alt="" loading="lazy" draggable="false">${M.corner ? `<span class="ra-mood-corner"><b>${esc(M.corner[0])}</b>${esc(M.corner[1])}</span>` : ''}</button>
        <span class="ra-tags">${m.tags.map(t => `<span class="ra-tag">${esc(t)}</span>`).join('')}</span></div>`).join('')}</div>
    </div>`);
  const road = sub(R.road.title, `<ol class="ra-road">${R.road.items.map(r => `<li class="${r.now ? 'now' : ''}"><span class="ra-road-w">${esc(r.when)}</span><span class="ra-road-t">${H.T(r.what)}</span></li>`).join('')}</ol>`);
  return `<div class="ra-research">${head(R)}
    <button class="btn btn-line ra-rs-btn" aria-expanded="false"><span class="ra-rs-lbl">${H.T(R.open)}</span><span class="ra-rs-arr" aria-hidden="true">↓</span></button>
    <p class="ra-rs-lead">${H.T(R.lead)}</p>
    <div class="ra-rs-body"><div class="ra-rs-in">${before}${map}${market}${platform}${criteria}${moods}${road}</div></div>
  </div>`;
}
// линии схемы: от низа карточки продукта к верху связанной карточки, плавной кривой; пересчет при раскрытии и ресайзе
function liveMap(map){
  const svg = map.querySelector('.ra-map-lines');
  const draw = () => {
    const R = map.getBoundingClientRect(); if (!R.width) return;
    svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
    let d = '';
    map.querySelectorAll('[data-from]').forEach(el => el.dataset.from.split(' ').forEach(k => {
      const p = map.querySelector(`.ra-map-p[data-key="${k}"]`); if (!p) return;
      const a = p.getBoundingClientRect(), b = el.getBoundingClientRect();
      const x1 = a.left + a.width / 2 - R.left, y1 = a.bottom - R.top, x2 = b.left + b.width / 2 - R.left, y2 = b.top - R.top, m = (y1 + y2) / 2;
      d += `M${x1.toFixed(1)} ${y1.toFixed(1)}C${x1.toFixed(1)} ${m.toFixed(1)} ${x2.toFixed(1)} ${m.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }));
    svg.innerHTML = `<path d="${d}"/>`;
  };
  new ResizeObserver(draw).observe(map);
  map.querySelectorAll('img').forEach(i => i.addEventListener('load', draw));
}
function liveResearch(sec, R){
  const box = sec.querySelector('.ra-research'), btn = box.querySelector('.ra-rs-btn'), lbl = btn.querySelector('.ra-rs-lbl');
  btn.addEventListener('click', () => {
    const open = !box.classList.contains('open');
    box.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    lbl.innerHTML = H.T(open ? R.close : R.open);
    if (!open) {   // свернули — вернуться к кнопке, чтобы не потеряться
      const sc = box.closest('.case') || document.scrollingElement;
      const top = btn.getBoundingClientRect().top - (sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top) - 120;
      if (top < 0) sc.scrollBy({ top, behavior: still() ? 'auto' : 'smooth' });
    }
  });
  liveMap(box.querySelector('.ra-map'));
  // мудборды: переключаются сами, пока не тронули; полоска показывает время до следующего
  const tabs = [...box.querySelectorAll('.ra-mood-tab')], panes = [...box.querySelectorAll('.ra-mood')];
  let mk = 0, mt = 0, mtouch = false, mvis = false;
  const show = i => { mk = i; tabs.forEach((t, j) => t.classList.toggle('on', j === i)); panes.forEach((p, j) => p.classList.toggle('on', j === i)); };
  const mloop = () => { clearTimeout(mt); box.querySelector('.ra-moods').classList.toggle('run', mvis && !mtouch && !still()); if (!mvis || mtouch || still()) return; mt = setTimeout(() => { show((mk + 1) % tabs.length); mloop(); }, 4200); };
  tabs.forEach((t, i) => t.addEventListener('click', () => { mtouch = true; show(i); mloop(); }));
  onScreen(box.querySelector('.ra-moods'), v => { mvis = v; mloop(); });
}

/* ================================================================
   ВИДЫ ГЛАВ КОНЦЕПЦИЙ: [разметка, оживление]
   ================================================================ */
const KINDS = {
  /* ---- форма: картограмма активной зоны ВВЭР-1000 — 163 шестигранные сборки (кольца до 7-го без шести углов),
     сборки разных типов вспыхивают волной от центра, потом соты гаснут и остается один шестигранник ---- */
  core: [() => {
    const cells = [], s = 13, TYPES = ['#FFFFFF', '#CFE3FF', '#7FB1FF', '#FFD9B8', '#FD9A55'];
    for (let q = -7; q <= 7; q++) for (let r = Math.max(-7, -q - 7); r <= Math.min(7, -q + 7); r++) {
      const d = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
      if (d === 7 && (q === 0 || r === 0 || q + r === 0)) continue;   // шесть угловых — за границей зоны
      const x = s * Math.sqrt(3) * (q + r / 2), y = s * 1.5 * r;
      // раскраска симметрична, как на картограмме: m — расстояние до ближайшей из трех осей
      const m = Math.min(Math.abs(q), Math.abs(r), Math.abs(q + r));
      const type = d === 0 ? 2 : m === 0 ? (d % 2 ? 2 : 4) : d === 7 ? 0 : (d + m) % 3 === 0 ? 3 : m % 2 ? 1 : 0;
      cells.push(`<path class="ra-cell" d="${hexPath(x, y, s * .93, true)}" style="--d:${(d * .09).toFixed(2)}s;--c:${TYPES[type]}"/>`);
    }
    return `<div class="ra-stage ra-core" data-step="0"><svg viewBox="-200 -200 400 400" aria-hidden="true">
      <g class="ra-cells">${cells.join('')}</g>
      <path class="ra-core-one" d="${HEX}" transform="translate(-130 -120) scale(.452)"/>
    </svg></div>`;
  }, (sec) => {
    const box = sec.querySelector('.ra-core');
    let t = 0, k = 0, vis = false;
    const run = () => { clearTimeout(t); if (!vis || still()) { box.dataset.step = 1; return; } box.dataset.step = k; t = setTimeout(() => { k = (k + 1) % 3; run(); }, [3000, 1600, 3000][k]); };
    onScreen(box, v => { vis = v; run(); });
  }],

  /* ---- смысл: шесть ценностей на гранях; по контуру бежит голубой свет Черенкова, за ним — ролик свечения.
     Знака здесь нет: он появляется только в конце рассказа ---- */
  values: [c => {
    // вершины скругленного шестигранника знака (рамка 575 × 529): верх-лево, верх-право, право, низ-право, низ-лево, лево
    const V = [[143.7, 15.7], [431.3, 15.7], [574.8, 264.6], [431.3, 513.5], [143.7, 513.5], [0.2, 264.6]];
    const side = ['tl', 'tr', 'r', 'br', 'bl', 'l'], cl = nid('c');
    const cells = [], s = 26;
    for (let q = -6; q <= 6; q++) for (let r = -6; r <= 6; r++) {
      const x = 287.5 + s * Math.sqrt(3) * (q + r / 2), y = 264.6 + s * 1.5 * r;
      if (x < -20 || x > 600 || y < -20 || y > 550) continue;
      cells.push(`<path d="${hexPath(x, y, s * .92, true)}"/>`);
    }
    return `<div class="ra-stage ra-values">
      <div class="ra-val-wrap"><div class="ra-val-fig">
        <svg viewBox="0 0 575 529" aria-hidden="true">
          <defs><clipPath id="${cl}"><path d="${HEX}"/></clipPath></defs>
          <g class="ra-val-cells" clip-path="url(#${cl})">${cells.join('')}</g>
          <path class="ra-val-hex" d="${HEX}"/>
          <path class="ra-val-run" d="${HEX}"/>
          ${V.map((p, i) => `<circle class="ra-val-dot" data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="7"/>`).join('')}
        </svg></div>
        ${c.items.map((v, i) => `<button class="ra-val ${side[i]}" data-i="${i}">${esc(v)}</button>`).join('')}
      </div>
    </div>`;
  }, (sec) => {
    const box = sec.querySelector('.ra-values'), run = box.querySelector('.ra-val-run');
    const vals = [...box.querySelectorAll('.ra-val')], dots = [...box.querySelectorAll('.ra-val-dot')];
    // где на контуре стоит каждая вершина: ищем ближайшую точку пути
    const L = run.getTotalLength(), at = dots.map(d => {
      const x = +d.getAttribute('cx'), y = +d.getAttribute('cy'); let best = 0, bd = 1e9;
      for (let k = 0; k <= 300; k++) { const p = run.getPointAtLength(L * k / 300), dd = (p.x - x) ** 2 + (p.y - y) ** 2; if (dd < bd) { bd = dd; best = L * k / 300; } }
      return best;
    });
    run.style.strokeDasharray = `90 ${L}`;
    let pos = 0, target = null, raf = 0, vis = false, last = performance.now();
    const on = i => { vals.forEach((v, j) => v.classList.toggle('on', j === i)); dots.forEach((d, j) => d.classList.toggle('on', j === i)); };
    const near = () => { let bi = 0, bd = 1e9; at.forEach((a, i) => { const dd = Math.min(Math.abs(a - pos), L - Math.abs(a - pos)); if (dd < bd) { bd = dd; bi = i; } }); return bi; };
    const frame = now => {
      raf = 0; if (!vis) return;
      const dt = Math.min(50, now - last); last = now;
      if (target == null) pos = (pos + dt * L / 14000) % L;          // круг — за 14 с
      else { let dd = at[target] - pos; if (dd > L / 2) dd -= L; if (dd < -L / 2) dd += L; pos = (pos + dd * .12 + L) % L; }
      run.style.strokeDashoffset = (45 - pos).toFixed(1);           // голова света — в точке pos
      on(near());
      raf = requestAnimationFrame(frame);
    };
    vals.forEach((v, i) => {
      v.addEventListener('pointerenter', () => { target = i; });
      v.addEventListener('pointerleave', () => { target = null; });
    });
    onScreen(box, v => { vis = v; last = performance.now(); if (still()) { on(0); return; } if (v && !raf) raf = requestAnimationFrame(frame); });
  }],

  /* ---- свечение Черенкова: два ролика из презентации ---- */
  cher: [c => `<div class="ra-cher">${c.videos.map(v => `<span class="ra-vid ra-cher-v"><video data-src="${url(v.src)}" poster="${url(v.poster)}" muted loop playsinline preload="none"></video></span>`).join('')}</div>`,
    (sec) => playWhenSeen(sec)],

  /* ---- поле на всю ширину сайта: зацикленная орбиталь водорода считается живьем, в центре — знак ---- */
  field: [c => `<div class="ra-field"><canvas width="960" height="960"></canvas><span class="ra-field-sign">${signImg('wave')}</span></div>`,
    (sec, c) => liveField(sec, c)],

  /* ---- цвет: шестигранник заливается по шагам — оранжевый, синий по краям, свечение; подписи шагов загораются ---- */
  grad: [c => `<div class="ra-stage ra-grad" data-step="0">
      <span class="ra-grad-hex">${gradHex(false)}</span>
      <span class="ra-grad-steps">${c.steps.map((n, i) => `<span class="ra-grad-s" data-i="${i}"><i></i><span>${H.T(n)}</span></span>`).join('')}</span>
    </div>`, (sec) => {
    const box = sec.querySelector('.ra-grad');
    let t = 0, k = 0, vis = false;
    const run = () => { clearTimeout(t); if (!vis || still()) { box.dataset.step = 2; return; } box.dataset.step = k; t = setTimeout(() => { k = (k + 1) % 3; run(); }, [1800, 1800, 3600][k]); };
    onScreen(box, v => { vis = v; run(); });
  }],

  /* ---- три точки: логотип HR TECH → его точки влетают в шестигранник → готовый знак с именем, только здесь ---- */
  dots: [() => `<div class="ra-stage ra-dots" data-step="0">
      <img class="ra-dots-old" src="${url('img/rosatom-hr/zoo/hrtech-big.svg')}" alt="" draggable="false">
      <span class="ra-dots-hex">${gradHex(true)}</span>
      <img class="ra-dots-logo" src="${url('img/rosatom-hr/logo-heart.svg')}" alt="Атом" draggable="false">
    </div>`, (sec) => {
    const box = sec.querySelector('.ra-dots');
    let t = 0, k = 0, vis = false;
    const run = () => { clearTimeout(t); if (!vis || still()) { box.dataset.step = 2; return; } box.dataset.step = k; t = setTimeout(() => { k = (k + 1) % 3; run(); }, [2200, 2600, 3800][k]); };
    onScreen(box, v => { vis = v; run(); });
  }],

  /* ---- в деле: сначала интерфейс крупно, потом отдельным блоком коммуникации; по нажатию — крупно ---- */
  shots: [(c, ch) => {
    let i = 0;
    // элемент — путь к картинке или { src, video }: макет с живым фоном играет как ролик, постер — та же картинка
    const pic = (it, cls) => it.video
      ? `<span class="ra-shot ra-shot-v ${cls}"><video data-src="${url(it.video)}" poster="${url(small(it.src))}" muted loop playsinline preload="none"></video></span>`
      : `<button class="ra-pic ra-shot ${cls}" data-g="shots" data-i="${i++}" aria-label="Увеличить"><img src="${url(cls === 'ui' ? it : small(it))}" data-full="${url(it)}" alt="" loading="lazy" draggable="false"></button>`;
    return `<div class="ra-shots">
      <div class="ra-shots-ui">${c.ui.map(s => pic(s, 'ui')).join('')}</div>
      <div class="ra-band"><div class="ra-band-in">
        <h3 class="ra-shots-h">${H.T(ch.comms)}</h3>
        <div class="ra-collage">${collage(c.comms, c.wide).map(s => pic(s, 'col')).join('')}</div>
      </div></div>
    </div>`;
  }, (sec) => playWhenSeen(sec)],

  /* ---- у каждого своя частота: таблица орбиталей, наведение запускает пульс ---- */
  states: [c => `<div class="ra-stage ra-states"><div class="ra-st-grid">${c.list.map((s, i) =>
      `<span class="ra-st" data-i="${i}"><canvas width="120" height="120"></canvas><em>${s.join(' ')}</em></span>`).join('')}</div></div>`,
    (sec, c) => {
      const cells = [...sec.querySelectorAll('.ra-st')];
      const data = c.list.map(([n, l, m]) => densityGrid(n, l, m, 120));
      const pal = buildPalette(false);
      const draw = (i, gamma) => paintDensity(cells[i].querySelector('canvas'), data[i], gamma, pal, null);
      cells.forEach((_, i) => draw(i, .4));
      let hot = -1, auto = 0, raf = 0, vis = false, touched = false, t0 = 0, at = 0;
      const frame = now => {
        raf = 0; if (!vis) return;
        if (!touched && now - at > 1600) { at = now; hot = (auto = (auto + 7) % cells.length); t0 = now; cells.forEach((el, j) => el.classList.toggle('on', j === hot)); }
        if (hot >= 0) { const u = (now - t0) / 1600; draw(hot, .4 * (1 + .45 * Math.sin(u * Math.PI * 2))); }
        raf = requestAnimationFrame(frame);
      };
      cells.forEach((el, i) => {
        el.addEventListener('pointerenter', () => { touched = true; if (hot >= 0 && hot !== i) draw(hot, .4); hot = i; t0 = performance.now(); cells.forEach((x, j) => x.classList.toggle('on', j === i)); });
        el.addEventListener('pointerleave', () => { draw(i, .4); el.classList.remove('on'); hot = -1; touched = false; at = performance.now(); });
      });
      onScreen(sec.querySelector('.ra-states'), v => { vis = v; if (v && !raf && !still()) raf = requestAnimationFrame(frame); });
    }],

  /* ---- знак: курсор и буква съезжаются и становятся знаком ---- */
  morph: [c => `<div class="ra-stage ra-morph" data-step="0">
      <svg viewBox="0 0 800 420" aria-hidden="true">
        <g class="ra-mo-cur"><path d="M0 0L0 150L42 112L70 176L98 164L70 102L124 102Z" transform="translate(150 120)"/><text x="190" y="90">курсор</text></g>
        <g class="ra-mo-let"><text class="ra-mo-p" x="560" y="290">Р</text><text x="565" y="90">буква</text></g>
        </svg>
      <span class="ra-mo-sign">${signImg('wave')}</span>
    </div>`, (sec) => {
    const box = sec.querySelector('.ra-morph');
    let t = 0, k = 0, vis = false;
    const run = () => { clearTimeout(t); if (!vis || still()) { box.dataset.step = 2; return; } box.dataset.step = k; t = setTimeout(() => { k = (k + 1) % 3; run(); }, [2200, 900, 3200][k]); };
    onScreen(box, v => { vis = v; run(); });
  }],

  /* ---- конструктор паттернов: окно программы. Слева — орбиталь, последовательность шагов и фон, справа — холст;
     последовательность проигрывается сама, под холстом — дорожка с бегунком, текущий шаг подсвечен ---- */
  maker: [c => {
    const BASES = [[3, 2, 0], [4, 2, 1], [5, 3, 2], [4, 3, 0], [2, 1, 0], [5, 4, 1]];
    return `<div class="ra-maker" data-bases='${JSON.stringify(BASES)}'>
      <div class="ra-tool">
        <div class="ra-tool-side">
          <span class="ra-tool-k">${H.T(c.labels.base)}</span>
          <div class="ra-mk-bases">${BASES.map((b, i) => `<button class="ra-mk-base${i ? '' : ' on'}" data-i="${i}" aria-label="орбиталь ${b.join(' ')}"><canvas width="64" height="64"></canvas></button>`).join('')}</div>
          <span class="ra-tool-k">${H.T(c.labels.seq)}</span>
          <div class="ra-mk-steps">${c.steps.map((st, i) => `<button class="ra-mk-step" data-i="${i}"><span>${H.T(st.name)}</span><em>${st.dur} с</em><i><b></b></i></button>`).join('')}</div>
          <span class="ra-tool-k">${H.T(c.labels.bg)}</span>
          <div class="ra-mk-row">${c.bgs.map((b, i) => `<button class="ra-mk-bg${i ? '' : ' on'}" data-i="${i}" style="--c:${b.bg}" aria-label="${esc(H.pick(b.name))}"></button>`).join('')}</div>
        </div>
        <div class="ra-tool-main">
          <div class="ra-mk-view" style="--bg:${c.bgs[0].bg}"><canvas width="420" height="420"></canvas></div>
          <div class="ra-mk-track">${c.steps.map(st => `<span style="flex:${st.dur}"></span>`).join('')}<i class="ra-mk-head"></i></div>
        </div>
      </div>
      <button class="btn btn-line ra-mk-open"><span>${H.T(c.open)}</span></button>
    </div>`;
  }, (sec, c) => liveMaker(sec, c)],

  /* ---- движение: ролики из конструктора, играют, пока на экране ---- */
  videos: [c => `<div class="ra-videos">${c.items.map(v =>
      `<span class="ra-vid"><video data-src="${url(v.src)}" poster="${url(v.poster)}" muted loop playsinline preload="none"></video></span>`).join('')}</div>`,
    (sec) => playWhenSeen(sec)],

  /* ---- марка углубления: фото с бортов ---- */
  marks: [c => `<div class="ra-marks">${c.imgs.map((s, i) =>
      `<button class="ra-pic" data-g="marks" data-i="${i}" aria-label="Увеличить"><img src="${url(s)}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>`, () => {}],

  /* ---- человек + марка → знак; ползунок «нагрузка» поднимает воду ---- */
  water: [c => `<div class="ra-stage ra-water">
      <div class="ra-w-left"><div class="ra-w-sum">
        <span class="ra-w-part"><svg viewBox="0 0 82 82" aria-hidden="true"><circle cx="41" cy="41" r="35" fill="none" stroke="currentColor" stroke-width="7"/><path d="M14 41h54a27 27 0 0 1-54 0Z" fill="currentColor"/></svg><em>${H.T(c.a)}</em></span>
        <span class="ra-w-plus" aria-hidden="true">+</span>
        <span class="ra-w-part"><svg viewBox="0 0 82 82" aria-hidden="true"><circle cx="41" cy="41" r="26" fill="none" stroke="currentColor" stroke-width="7"/><path d="M0 41h82" stroke="currentColor" stroke-width="7"/></svg><em>${H.T(c.b)}</em></span>
      </div>
      <label class="ra-w-load"><span>${H.T(c.load)}</span><input type="range" min="0" max="100" value="50"></label></div>
      <span class="ra-w-sign">${waterSign()}</span>
    </div>`, (sec) => liveWater(sec)],
};

// коллаж коммуникаций: высокие макеты чередуются с широкими баннерами
function collage(tall, wide){
  const out = [], n = Math.max(tall.length, wide.length);
  for (let i = 0; i < n; i++) { if (tall[i]) out.push(tall[i]); if (wide[i]) out.push(wide[i]); }
  return out;
}
function hexPath(x, y, s, pointy){
  const pts = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i + (pointy ? 30 : 0)); pts.push([x + s * Math.cos(a), y + s * Math.sin(a)]); }
  return 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
}
// ролики кейса грузятся лениво: адрес ставится, когда ролик в 600 px от экрана, играют только на экране.
// muted ставим свойством — Safari иначе не дает играть без звука
const vidNear = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && !v.src && v.dataset.src) { v.muted = true; v.src = v.dataset.src; v.preload = 'auto'; }
}), { rootMargin: '600px 0px' });
function playWhenSeen(sec){
  sec.querySelectorAll('video').forEach(v => {
    v.muted = true;
    vidNear.observe(v);
    onScreen(v, on => {
      v._on = on;
      if (on && !still()) { if (!v.src && v.dataset.src) v.src = v.dataset.src; v.play().catch(() => {}); }
      else if (v.src) v.pause();
    }, .15);
  });
}
// вкладку открыли снова — запустить ролики, которые стоят на экране (в фоне браузер их не пускает)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || still()) return;
  document.querySelectorAll('.ra-mount video').forEach(v => { if (v._on && v.paused) v.play().catch(() => {}); });
});

/* ---------- вода в знаке третьей концепции: волна бежит, уровень — от нагрузки ---------- */
function liveWater(sec){
  const st = sec.querySelector('.ra-water'), inp = st.querySelector('input'), svg = st.querySelector('.ra-wsign');
  const wave = svg.querySelector('.ra-ws-wave'), clip = svg.querySelector('.ra-ws-under clipPath path');
  let lvl = .5, target = .5, touched = false, vis = false, raf = 0, t0 = performance.now();
  const frame = now => {
    raf = 0; if (!vis) return;
    if (!touched) target = .5 + .22 * Math.sin((now - t0) / 1900);
    lvl += (target - lvl) * .06;
    const y = 104 - lvl * 60;   // нагрузка 0 — вода у низа знака, 100 — выше середины кольца
    const ph = (now - t0) / 600, amp = 2.2;
    let d = `M-5 ${y.toFixed(2)}`;
    for (let x = -5; x <= 147; x += 6) d += `L${x} ${(y + amp * Math.sin(x / 13 + ph)).toFixed(2)}`;
    d += 'L147 150L-5 150Z';
    wave.setAttribute('d', d); clip.setAttribute('d', d);
    if (!touched) inp.value = Math.round(lvl * 100);
    if (!still()) raf = requestAnimationFrame(frame);
  };
  inp.addEventListener('input', () => { touched = true; target = inp.value / 100; if (!raf) raf = requestAnimationFrame(frame); });
  onScreen(st, v => { vis = v; if (v && !raf) raf = requestAnimationFrame(frame); });
}

/* ================================================================
   ОРБИТАЛИ ВОДОРОДА — физика из Дашиного конструктора
   ================================================================ */
const FACT = [1]; for (let i = 1; i <= 30; i++) FACT[i] = FACT[i - 1] * i;
function laguerre(k, a, x){
  if (k === 0) return 1;
  let L0 = 1, L1 = 1 + a - x;
  for (let i = 1; i < k; i++) { const L2 = ((2 * i + 1 + a - x) * L1 - (i + a) * L0) / (i + 1); L0 = L1; L1 = L2; }
  return L1;
}
function plgndr(l, m, x){
  let pmm = 1;
  if (m > 0) { const s = Math.sqrt((1 - x) * (1 + x)); let f = 1; for (let i = 1; i <= m; i++) { pmm *= -f * s; f += 2; } }
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm; if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll++) { pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m); pmm = pmmp1; pmmp1 = pll; }
  return pll;
}
function radial(n, l, r){
  const norm = Math.sqrt(Math.pow(2 / n, 3) * FACT[n - l - 1] / (2 * n * FACT[n + l]));
  const rho = 2 * r / n;
  return norm * Math.exp(-r / n) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho);
}
const autoHalf = n => 1.4 * n * (n + 3);
// ψ со знаком на срезе x–z
function psiGrid(n, l, m, px, half){
  const v = new Float32Array(px * px), am = Math.abs(m);
  const norm = Math.sqrt((2 * l + 1) / (4 * Math.PI) * FACT[l - am] / FACT[l + am]);
  for (let r = 0; r < px; r++) { const z = -half + 2 * half * r / (px - 1);
    for (let c = 0; c < px; c++) { const x = -half + 2 * half * c / (px - 1);
      let rr = Math.hypot(x, z); if (rr < 1e-9) rr = 1e-9;
      v[r * px + c] = radial(n, l, rr) * norm * plgndr(l, am, z / rr); } }
  return v;
}
// |ψ|², нормированная к 1
function densityGrid(n, l, m, px, half){
  const p = psiGrid(n, l, m, px, half || autoHalf(n)), d = new Float32Array(px * px);
  let mx = 0; for (let i = 0; i < d.length; i++) { d[i] = p[i] * p[i]; if (d[i] > mx) mx = d[i]; }
  for (let i = 0; i < d.length; i++) d[i] /= mx || 1;
  return d;
}
// фирменная теплая палитра конструктора (и вывернутая — для оранжевого фона)
const WARM = [[0, [253, 236, 214]], [.45, [245, 166, 35]], [.72, [246, 133, 31]], [.88, [250, 200, 120]], [1, [255, 255, 255]]];
const WARM_INV = [[0, [247, 145, 51]], [.30, [248, 161, 76]], [.55, [250, 191, 122]], [.80, [253, 226, 184]], [1, [255, 255, 255]]];
function buildPalette(inv){
  const P = inv ? WARM_INV : WARM, out = new Uint8ClampedArray(256 * 4);
  for (let k = 0; k < 256; k++) {
    const t = k / 255; let c = [255, 255, 255];
    for (let i = 0; i < P.length - 1; i++) { const [a, ca] = P[i], [b, cb] = P[i + 1];
      if (t >= a && t <= b) { const f = b === a ? 0 : (t - a) / (b - a); c = ca.map((v, j) => v + (cb[j] - v) * f); break; } }
    out.set([c[0], c[1], c[2], 255 * Math.min(1, t * 1.25)], k * 4);
  }
  return out;
}
// раскраска плотности на холст: сначала мягкий размытый слой, сверху — резкий (свечение как в конструкторе)
const _tmp = {};
function paintDensity(cv, d, gamma, pal, bg, vals){
  const px = Math.round(Math.sqrt(d.length));
  const key = px;
  const t = _tmp[key] || (_tmp[key] = (() => { const c = document.createElement('canvas'); c.width = c.height = px; return { c, x: c.getContext('2d'), img: new ImageData(px, px) }; })());
  const D = t.img.data;
  for (let i = 0; i < d.length; i++) {
    let v = vals ? vals[i] : Math.pow(d[i], gamma); v = v < 0 ? 0 : v > 1 ? 1 : v;
    const k = (v * 255) | 0, o = k * 4, j = i * 4;
    D[j] = pal[o]; D[j + 1] = pal[o + 1]; D[j + 2] = pal[o + 2]; D[j + 3] = pal[o + 3];
  }
  t.x.putImageData(t.img, 0, 0);
  const x = cv.getContext('2d'), W = cv.width;
  x.clearRect(0, 0, W, W);
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, W, W); }
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.filter = `blur(${(W * .03).toFixed(1)}px)`; x.drawImage(t.c, 0, 0, W, W);
  x.filter = `blur(${(W * .008).toFixed(1)}px)`; x.drawImage(t.c, 0, 0, W, W);
  x.filter = 'none';
}

/* ---------- поле орбитали на всю ширину: пульс по кругу, 6 с, начало и конец совпадают ---------- */
function liveField(sec, c){
  const box = sec.querySelector('.ra-field'), cv = box.querySelector('canvas');
  const [n, l, m] = c.orbital, PX = 220;
  const d = densityGrid(n, l, m, PX, autoHalf(n) * 1.9), vals = new Float32Array(PX * PX), pal = buildPalette(false), g = .4;
  const rn = new Float32Array(PX * PX);
  for (let r = 0; r < PX; r++) for (let q = 0; q < PX; q++) rn[r * PX + q] = Math.min(1, Math.hypot(-1 + 2 * q / (PX - 1), -1 + 2 * r / (PX - 1)));
  let vis = false, raf = 0, t0 = performance.now();
  // круг 5 с: орбиталь дышит (свечение то собирается, то расходится) и по ней бегут кольца волны
  const frame = now => {
    raf = 0; if (!vis) return;
    const u = ((now - t0) / 5000) % 1, gt = g * (1 + .75 * Math.sin(Math.PI * 2 * u)), ph = Math.PI * 2 * u;
    for (let i = 0; i < vals.length; i++) vals[i] = Math.pow(d[i], gt) * (1 + .45 * Math.sin(Math.PI * 2 * 3 * rn[i] - ph)) / 1.45;
    paintDensity(cv, d, g, pal, '#FDEFDD', vals);
    if (!still()) raf = requestAnimationFrame(frame);
  };
  onScreen(box, v => { vis = v; if (v && !raf) raf = requestAnimationFrame(frame); }, .05);
}

/* ---------- мини-конструктор ---------- */
function liveMaker(sec, c){
  const box = sec.querySelector('.ra-maker'), view = box.querySelector('.ra-mk-view'), cv = view.querySelector('canvas');
  const BASES = JSON.parse(box.dataset.bases), PX = 150;
  const steps = c.steps, T = steps.reduce((a, s) => a + s.dur, 0) * 1000;
  const stepEls = [...box.querySelectorAll('.ra-mk-step')], head = box.querySelector('.ra-mk-head');
  let base = 0, bgi = 0, pal = buildPalette(false), vis = false, raf = 0, t0 = performance.now();
  const cache = {};
  const grid = i => cache[i] || (cache[i] = (() => {
    const [n, l, m] = BASES[i], half = Math.max(autoHalf(n), autoHalf(4));
    const A = psiGrid(n, l, m, PX, half), B = psiGrid(4, 3, 0, PX, half);
    const A2 = new Float32Array(PX * PX), B2 = new Float32Array(PX * PX), AB = new Float32Array(PX * PX), rn = new Float32Array(PX * PX);
    let ma = 0, mb = 0;
    for (let k = 0; k < A.length; k++) { A2[k] = A[k] * A[k]; B2[k] = B[k] * B[k]; if (A2[k] > ma) ma = A2[k]; if (B2[k] > mb) mb = B2[k]; }
    const sa = 1 / (ma || 1), sb = 1 / (mb || 1);
    for (let k = 0; k < A.length; k++) { AB[k] = A[k] * B[k] * Math.sqrt(sa * sb); A2[k] *= sa; B2[k] *= sb; }
    for (let r = 0; r < PX; r++) for (let q = 0; q < PX; q++) rn[r * PX + q] = Math.min(1, Math.hypot(-1 + 2 * q / (PX - 1), -1 + 2 * r / (PX - 1)));
    return { A2, B2, AB, rn };
  })());
  const vals = new Float32Array(PX * PX), g = .4;
  // каждый шаг начинается и заканчивается в базовом состоянии — поэтому шаги стыкуются без швов
  const frame = now => {
    raf = 0; if (!vis) return;
    const G = grid(base), tt = (now - t0) % T;
    let acc = 0, si = 0;
    while (si < steps.length - 1 && tt >= acc + steps[si].dur * 1000) { acc += steps[si].dur * 1000; si++; }
    const u = (tt - acc) / (steps[si].dur * 1000), move = steps[si].key;
    stepEls.forEach((el, i) => { el.classList.toggle('on', i === si); el.style.setProperty('--k', i < si ? 1 : i === si ? u.toFixed(3) : 0); });
    head.style.left = (tt / T * 100).toFixed(2) + '%';
    if (move === 'pulse') {
      const gt = g * (1 + .55 * .7 * Math.sin(Math.PI * 2 * 2 * u));
      for (let i = 0; i < vals.length; i++) vals[i] = Math.pow(G.A2[i], gt);
    } else if (move === 'wave') {
      const de = .6 * Math.sin(Math.PI * u), kf = 1 / (1 + de), ph = Math.PI * 2 * u;
      for (let i = 0; i < vals.length; i++) vals[i] = Math.pow(G.A2[i], g) * (1 + de * Math.sin(Math.PI * 2 * 3 * G.rn[i] - ph)) * kf;
    } else {   // биения: честная суперпозиция двух состояний, примесь входит и выходит
      const bm = Math.sin(Math.PI * u), bb = bm * bm, cr = 2 * bm * Math.sqrt(1 - bb), cs = Math.cos(Math.PI * 2 * u);
      let mx = 1e-9;
      for (let i = 0; i < vals.length; i++) { const d = (1 - bb) * G.A2[i] + bb * G.B2[i] + cr * G.AB[i] * cs; vals[i] = d > 0 ? d : 0; if (vals[i] > mx) mx = vals[i]; }
      for (let i = 0; i < vals.length; i++) vals[i] = Math.pow(vals[i] / mx, g);
    }
    paintDensity(cv, G.A2, g, pal, c.bgs[bgi].bg, vals);
    if (!still()) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (vis && !raf) raf = requestAnimationFrame(frame); };
  box.querySelectorAll('.ra-mk-base').forEach((b, i) => {
    const [n, l, m] = BASES[i];
    paintDensity(b.querySelector('canvas'), densityGrid(n, l, m, 64), g, buildPalette(false), '#FDEFDD');
    b.addEventListener('click', () => { base = i; box.querySelectorAll('.ra-mk-base').forEach((x, j) => x.classList.toggle('on', j === i)); kick(); });
  });
  // нажатие на шаг — перемотка к его началу
  stepEls.forEach((el, i) => el.addEventListener('click', () => {
    const start = steps.slice(0, i).reduce((a, s) => a + s.dur * 1000, 0);
    t0 = performance.now() - start; kick();
  }));
  box.querySelectorAll('.ra-mk-bg').forEach((b, i) => b.addEventListener('click', () => {
    bgi = i; pal = buildPalette(!!c.bgs[i].inv); view.style.setProperty('--bg', c.bgs[i].bg);
    box.querySelectorAll('.ra-mk-bg').forEach((x, j) => x.classList.toggle('on', j === i)); kick();
  }));
  box.querySelector('.ra-mk-open').addEventListener('click', () => openFull(c.full));
  onScreen(view, v => { vis = v; kick(); });
}

/* ---------- весь конструктор — в окне поверх кейса (страница из репозитория, как «Новый век») ---------- */
function openFull(path){
  const wrap = document.createElement('div');
  wrap.className = 'ra-full';
  wrap.innerHTML = `<div class="ra-full-in"><iframe title="Конструктор паттернов" allow="fullscreen"></iframe></div>
    <button class="ra-full-x" aria-label="Закрыть"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button>`;
  document.body.appendChild(wrap);
  const f = wrap.querySelector('iframe');
  fetch(url(path) + '?v=' + VERS).then(r => r.text()).then(t => { f.srcdoc = t; });
  const close = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 400); removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'Escape') close(); };
  wrap.querySelector('.ra-full-x').addEventListener('click', close);
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  addEventListener('keydown', key);
  requestAnimationFrame(() => wrap.classList.add('open'));
}

/* ================================================================
   КОНЦЕПЦИИ: заставки и липкое меню с прогрессом
   ================================================================ */
function ideaHTML(idea){
  const chs = idea.chapters.map(ch => {
    const ks = Object.keys(KINDS).filter(x => ch[x]);
    return `<section class="ra-ch wrap" data-kind="${ks[0] || ''}">${ch.title ? head(ch) : ''}${ks.map(k => `<div class="ra-viz ra-viz-${k}">${KINDS[k][0](ch[k] === true ? {} : ch[k], ch)}</div>`).join('')}</section>`;
  }).join('');
  return `<div class="ra-idea ra-idea-${idea.key}" data-idea="${idea.key}">
    <header class="ra-door"><div class="wrap ra-door-in">
      <div class="ra-door-txt"><span class="ra-door-sub">${H.T(idea.sub)}</span><h2 class="ra-door-name">${H.T(idea.name)}</h2><p class="ra-door-text">${H.T(idea.text)}</p></div>
    </div></header>
    ${chs}
  </div>`;
}
function navHTML(ideas, label){
  return `<nav class="ra-nav" aria-label="${esc(H.pick(label))}"><div class="wrap"><div class="ra-nav-in">${ideas.map(it =>
    `<button class="ra-tab" data-go="${it.key}"><span class="ra-tab-ic">${SIGN[it.key]()}</span><span class="ra-tab-name">${H.T(it.name)}</span><i class="ra-prog"><b></b></i></button>`).join('')}</div></div></nav>`;
}
function liveNav(mount){
  const sc = mount.closest('.case') || document.scrollingElement;
  const nav = mount.querySelector('.ra-nav'), tabs = [...nav.querySelectorAll('.ra-tab')];
  const ideas = [...mount.querySelectorAll('.ra-idea')];
  const go = key => {
    const el = mount.querySelector(`.ra-idea[data-idea="${key}"]`); if (!el) return;
    const under = nav.getBoundingClientRect().height + parseFloat(getComputedStyle(nav).top || 0);
    const top = el.getBoundingClientRect().top - (sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top) - under + 1;
    sc.scrollTo({ top: sc.scrollTop + top, behavior: still() ? 'auto' : 'smooth' });
  };
  nav.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  let raf = 0;
  const upd = () => {
    raf = 0;
    const line = nav.getBoundingClientRect().bottom;
    let on = -1;
    ideas.forEach((el, i) => {
      const r = el.getBoundingClientRect();
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

/* ---------- финал: три знака рядом ---------- */
function finalHTML(F, ideas){
  return `<section class="ra-ch wrap ra-final">${head(F)}
    <div class="ra-viz ra-three">${ideas.map(it => `<button class="ra-three-i" data-go="${it.key}">
      <img class="ra-three-logo" src="${url('img/rosatom-hr/logo-' + it.key + '.svg')}" alt="${esc(H.pick(it.name))}" draggable="false"></button>`).join('')}</div>
  </section>`;
}

/* ---------- увеличение картинок: группа — все картинки с тем же data-g в своей главе ---------- */
function liveViewer(mount){
  mount.addEventListener('click', e => {
    const b = e.target.closest('.ra-pic'); if (!b) return;
    const scope = b.closest('.ra-ch, .ra-rs') || mount;
    const group = [...scope.querySelectorAll(`.ra-pic[data-g="${b.dataset.g}"]`)];
    const imgs = group.map(x => x.querySelector('img'));
    H.openViewer(imgs.map(i => i.dataset.full || i.src), group.indexOf(b), imgs);
  });
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'rosatom.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountRosatom(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const R = p.rosatom;
  mount.innerHTML = `
    <section class="ra-ch wrap ra-zoo-ch">${head(R.zoo)}<div class="ra-viz">${zooHTML(R.zoo)}</div></section>
    <section class="ra-ch wrap ra-atom-ch">${head(R.atom)}<div class="ra-viz">${atomHTML(R.atom)}</div></section>
    <section class="ra-ch wrap ra-rs-ch">${researchHTML(R.research)}</section>
    <div class="ra-ideas">${navHTML(R.ideas, R.menuLabel)}${R.ideas.map(ideaHTML).join('')}</div>
    ${finalHTML(R.final, R.ideas)}`;
  mount.querySelectorAll('.ra-ch, .ra-door').forEach(s => reveal.observe(s));
  liveAtom(mount.querySelector('.ra-atom-ch'));
  liveResearch(mount.querySelector('.ra-rs-ch'), R.research);
  R.ideas.forEach(idea => {
    const secs = [...mount.querySelectorAll(`.ra-idea[data-idea="${idea.key}"] .ra-ch`)];
    idea.chapters.forEach((ch, i) => Object.keys(KINDS).filter(k => ch[k]).forEach(k => {
      try { KINDS[k][1](secs[i], ch[k] === true ? {} : ch[k]); } catch (err) { console.warn('глава не ожила', k, err); }
    }));
  });
  liveNav(mount);
  liveViewer(mount);
  mount.querySelector('.ra-three').addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (b) mount.querySelector(`.ra-tab[data-go="${b.dataset.go}"]`).click();
  });
}
