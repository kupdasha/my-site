/* ================================================================
   КЕЙС «АУДИТ ВНУТРЕННИХ СИСТЕМ РОСАТОМА» (поле checkup у проекта, страница NDA)
   scope   — одиннадцать систем сразу коллажом: основное крупно, беклог мельче;
             в ряду ширина ∝ пропорциям картинки — ничего не обрезается;
   pattern — таблица «болезнь × система»: точки появляются по очереди,
             внизу столбики — сколько болезней у системы (считается);
   desk    — рабочий стол HR-сервисов, собранный кодом по Дашиному макету
             (1920 × 1000, масштабируется целиком): что мешает заметить поиск —
             подсветка по очереди, рядом текст;
   search  — тот же стол, пять решений по поиску строкой надписей с таймером:
             «спросить», запрос по ролям печатается, поиск над плитками,
             живой Марк (моргает — вектор из Дашиной Фигмы), цветовой блок;
   banner  — тот же стол, баннер меняется: как было, белый и мягкий, с фото
             и с интерфейсом;
   space   — кабинет в Атом Спейс: как было и как предлагаю, выноски по бокам;
             во втором варианты иконок сменяются сами;
   chats   — список чатов: «атом» перепечатывается из того, как сейчас,
             в одинаковое написание, измененные буквы подсвечены;
   icons   — иконки сервисов в пяти продуктах рядами;
   backlog — что подождет: четыре причины колонками, значок и системы-теги.
   Картинки — img/rosatom-audit. Тексты — content.js, оформление — checkup.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
const IMGV = 7;   // меняется, когда картинки пересобраны: иначе браузер показывает старые из кеша
const img = n => H.base + 'img/rosatom-audit/' + n + '?v=' + IMGV;
const pic = (n, sizes = '(max-width: 900px) 100vw, 58vw') =>
  `src="${img(n + '.webp')}" srcset="${img(n + '-s.webp')} 900w, ${img(n + '.webp')} 1600w" sizes="${sizes}"`;
const P = v => esc(H.pick(v));

/* ---------- текст главы ---------- */
const block = (c, extra = '') => `<div class="ck-col">
  <span class="case-label ck-label">${H.T(c.label)}</span>
  <h2 class="ck-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="ck-text">${H.T(c.text)}</p>` : ''}${extra}
</div>`;
const head = c => `<div class="wrap ck-head">${block(c)}</div>`;

/* ---------- строка надписей с полоской таймера ---------- */
const tabsHTML = tabs => `<div class="ck-tabs" role="tablist">${tabs.map((t, i) =>
  `<button type="button" class="ck-tab" role="tab" data-k="${t.k}" aria-selected="${i ? 'false' : 'true'}">${H.T(t.t)}<i class="ck-tick"></i></button>`).join('')}</div>`;
// листает само, пока видно и пока не нажали; нажатие — дальше только руками
function autoTabs(box, tabsEl, ms, set){
  const tabs = [...tabsEl.querySelectorAll('.ck-tab')];
  let at = 0, t, on = false, hand = false;
  tabsEl.style.setProperty('--ms', ms + 'ms');
  const go = (i, run) => {
    at = (i + tabs.length) % tabs.length;
    tabs.forEach((b, j) => { b.setAttribute('aria-selected', j === at); b.classList.remove('run'); });
    if (run) { void tabs[at].offsetWidth; tabs[at].classList.add('run'); }
    set(tabs[at].dataset.k, at);
  };
  const next = () => {
    clearTimeout(t);
    if (!on || hand || still()) return;
    t = setTimeout(() => { go(at + 1, true); next(); }, ms);
  };
  tabs.forEach((b, i) => b.addEventListener('click', () => { hand = true; clearTimeout(t); go(i, false); }));
  onScreen(box, v => {
    on = v;
    if (v && !hand && !still()) { go(at, true); next(); } else clearTimeout(t);
  }, .3);
  go(0, false);
}

/* ================================================================
   scope — одиннадцать систем коллажом: в ряду ширина картинки ∝ ее пропорциям,
   высота у ряда одна — ничего не обрезается и не сплющивается
   ================================================================ */
const RATIO = { 'hr-photo': 1600 / 873, 'space-1': 1600 / 942, 'comm-1': 1600 / 969, 'learn-1': 1600 / 1176, 'battle-1': 1600 / 941 };
const ratio = n => RATIO[n] || 16 / 9;
function scopeHTML(c){
  let n = 0;
  const fig = it => `<figure class="ck-sc-f" style="--r:${ratio(it.img).toFixed(4)}">
      <button type="button" class="ck-sc-p" data-n="${n++}" aria-label="${P(it.t)}"><img ${pic(it.img, '(max-width: 700px) 50vw, 33vw')} alt="" loading="lazy" decoding="async" style="aspect-ratio:${ratio(it.img).toFixed(4)}"></button>
      <figcaption>${H.T(it.t)}</figcaption></figure>`;
  const groups = c.groups.map((g, gi) => {
    const rows = gi ? [g.items.slice(0, 2), g.items.slice(2, 4), g.items.slice(4)] : [g.items.slice(0, 2), g.items.slice(2)];
    return `<div class="ck-sc-g${gi ? ' bl' : ''}">
      <div class="ck-sc-h"><b>${g.items.length}</b><span>${H.T(g.name)}</span></div>
      ${rows.map(r => `<div class="ck-sc-row">${r.map(fig).join('')}</div>`).join('')}
    </div>`;
  }).join('');
  return `<section class="ck-ch ck-scope">${head(c)}<div class="wrap"><div class="ck-sc">${groups}</div></div></section>`;
}
function liveScope(box, c){
  const list = c.groups.flatMap(g => g.items);
  const pics = [...box.querySelectorAll('.ck-sc-p img')];
  box.querySelectorAll('.ck-sc-p').forEach(b => b.addEventListener('click', () =>
    H.openViewer(list.map(it => img(it.img + '.webp')), +b.dataset.n, pics)));
}

/* ================================================================
   pattern — таблица «болезнь × система»: точки заполняются по очереди,
   внизу столбик — сколько болезней у системы (считается из rows);
   наведение на столбец подсвечивает систему
   ================================================================ */
function patternHTML(c, sys){
  const cnt = k => c.rows.filter(r => r.in.includes(k)).length;
  const max = Math.max(...sys.map(s => cnt(s.k)));
  const bl = sys.map(s => s.bl);
  const cls = j => (bl[j] ? ' bl' : '') + (bl[j] && !bl[j - 1] ? ' gap' : '');
  const headRow = `<div class="ck-mx-r ck-mx-head" aria-hidden="true"><span></span>${sys.map((s, j) =>
    `<span class="ck-mx-h${cls(j)}" data-j="${j}"><span>${esc(s.short)}</span></span>`).join('')}</div>`;
  const rows = c.rows.map((r, ri) => `<div class="ck-mx-r" style="--ri:${ri}">
      <h3 class="ck-mx-t">${H.T(r.t)}</h3>${sys.map((s, j) => {
        const on = r.in.includes(s.k);
        return `<i class="ck-mx-d${on ? ' on' : ''}${cls(j)}" data-j="${j}" style="--j:${j}"${on ? ` title="${esc(s.short)}"` : ''}></i>`;
      }).join('')}</div>`).join('');
  const tot = `<div class="ck-mx-r ck-mx-tot"><span class="ck-mx-t">${H.T(c.total)}</span>${sys.map((s, j) => {
      const n = cnt(s.k);
      return `<span class="ck-mx-b${cls(j)}${n === max ? ' max' : ''}" data-j="${j}" style="--v:${n / max}"><i></i><b>${n}</b></span>`;
    }).join('')}</div>`;
  return `<section class="ck-ch ck-pattern">${head(c)}
    <div class="wrap"><div class="ck-mx" role="table" aria-label="${P(c.title)}">${headRow}${rows}${tot}</div></div></section>`;
}
function livePattern(box){
  const mx = box.querySelector('.ck-mx');
  const cells = [...mx.querySelectorAll('[data-j]')];
  const hl = j => cells.forEach(el => el.classList.toggle('hl', j !== null && el.dataset.j === j));
  cells.forEach(el => {
    el.addEventListener('pointerenter', () => hl(el.dataset.j));
    el.addEventListener('pointerleave', () => hl(null));
  });
}

/* ================================================================
   рабочий стол HR-сервисов — собран по Дашиному макету, 1920 × 1000
   ================================================================ */
const TILES = [
  ['vacation', 'Мои отпуска'], ['trips', 'Мои командировки'], ['income', 'Мой доход'], ['docs', 'Мои справки'],
  ['career', 'Моя карьера'], ['plan', 'Мой план развития'], ['rating', 'Моя оценка эффективности'], ['social', 'Социальный пакет'],
];
const BANNERS = ['orange', 'white-photo', 'white-ui', 'soft-photo', 'soft-ui'];
const searchIcon = `<svg class="ck-d-mag" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>`;

function deskHTML(s, banner = 'orange'){
  const tiles = TILES.map(([k, t], i) => `<div class="ck-d-tile" style="left:${(i % 6) * 198}px;top:${i < 6 ? 0 : 192}px">
      <img src="${img('ic-' + k + '.webp')}" alt="" loading="lazy" decoding="async"><span>${esc(t)}</span></div>`).join('');
  const nav = [0, 1, 2, 3, null, 4, 5, 6].map((v, i) => v === null ? '' :
    `<i class="ck-d-nav" style="top:${172 + v * 52 + (v > 3 ? 54 : 0)}px;width:${[150, 128, 142, 118, 136, 124, 146][v]}px"></i>`).join('');
  const tags = (s ? s.tags : [['', ''], ['', ''], ['', ''], ['', ''], ['', '']])
    .map((t, i) => `<span class="ck-d-tag" style="--c:${i}">${esc(H.pick(t))}</span>`).join('');
  return `<div class="ck-desk" data-banner="${banner}" role="img" aria-label="рабочий стол HR-сервисов">
  <div class="ck-d-in">
    <div class="ck-d-side">
      <img class="ck-d-logo" src="${img('logo-atom.webp')}" alt="" decoding="async">
      <i class="ck-d-cap" style="top:132px"></i><i class="ck-d-cap" style="top:394px"></i>${nav}
      <i class="ck-d-btns"></i>
    </div>
    <div class="ck-d-title">Рабочий стол</div>
    <div class="ck-d-user"><i></i><b></b></div>
    <div class="ck-d-tiles">${tiles}<i class="ck-d-mini" style="top:0"></i><i class="ck-d-mini" style="top:64px"></i><i class="ck-d-mini" style="top:128px"></i></div>
    <div class="ck-d-ask">${s ? esc(H.pick(s.ask)) : ''}</div>
    <div class="ck-d-sg">
      <i class="ck-d-blk"></i>
      <div class="ck-d-mark"><img class="ck-d-mk" src="${img('mark.webp')}" alt="" decoding="async"></div>
      <div class="ck-d-field">${searchIcon}<span class="ck-d-ph" data-a="Search" data-b="${s ? P(s.placeholder) : 'Search'}">Search</span><span class="ck-d-type"></span><span class="ck-d-role"></span></div>
      <div class="ck-d-tags">${tags}</div>
    </div>
    <div class="ck-d-bn">${BANNERS.map(b => `<img data-b="${b}" src="${img('banner-' + b + '.webp')}" alt="" loading="lazy" decoding="async">`).join('')}
      <span class="ck-d-dots"><i></i><i></i><i></i><i></i></span></div>
    <div class="ck-d-tasks"><b>Мои задачи <em>0</em></b><i></i><i></i></div>
    <i class="ck-d-spot"></i>
  </div>${s && s.before ? `<img class="ck-d-was" src="${img(s.before + '.webp')}" alt="" loading="lazy" decoding="async">` : ''}</div>`;
}
// масштаб: стол рисуется в 1920 px и сжимается до ширины колонки; на телефоне без меню слева (--cw, --cx в checkup.css)
const fitRO = new ResizeObserver(es => es.forEach(e => e.target.style.setProperty('--k', e.contentRect.width / (parseFloat(getComputedStyle(e.target).getPropertyValue('--cw')) || 1920))));
// Марк — картинка, присланная Дашей (mark.webp); вектор из Фигмы искажался
function liveDesk(desk){
  fitRO.observe(desk);
}

/* desk — что мешает заметить поиск: подсветка по очереди */
const SPOTS = {
  same:     [524, 94, 1260, 582],
  mark:     [526, 526, 124, 150],
  carousel: [1090, 818, 112, 32],
  loud:     [530, 685, 1248, 180],
};
function deskChHTML(c, sc){
  const list = `<ul class="ck-pains">${c.pains.map(p => `<li><button type="button" class="ck-pain" data-k="${p.k}">${H.T(p.t)}<i class="ck-tick"></i></button></li>`).join('')}</ul>`;
  return `<section class="ck-ch ck-deskch wrap ck-split wide"><div class="ck-viz">${deskHTML({ ...sc, before: '' }, 'orange')}</div>${block(c, list)}</section>`;
}
function liveDeskCh(box){
  const desk = box.querySelector('.ck-desk'), spot = desk.querySelector('.ck-d-spot');
  const items = [...box.querySelectorAll('.ck-pain')];
  liveDesk(desk);
  let at = 0, t, on = false, hand = false;
  const ms = 3600;
  box.style.setProperty('--ms', ms + 'ms');
  const go = (i, run) => {
    at = (i + items.length) % items.length;
    const k = items[at].dataset.k, [x, y, w, h] = SPOTS[k];
    items.forEach((b, j) => { b.classList.toggle('on', j === at); b.classList.remove('run'); });
    if (run) { void items[at].offsetWidth; items[at].classList.add('run'); }
    spot.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    desk.dataset.pain = k;
    desk.classList.add('spot');
  };
  const next = () => { clearTimeout(t); if (!on || hand || still()) return; t = setTimeout(() => { go(at + 1, true); next(); }, ms); };
  items.forEach((b, i) => {
    b.addEventListener('click', () => { hand = true; clearTimeout(t); go(i, false); });
    b.addEventListener('pointerenter', () => { if (matchMedia('(hover: hover)').matches) { hand = true; clearTimeout(t); go(i, false); } });
  });
  onScreen(box, v => { on = v; if (v && !hand) { go(at, true); next(); } else clearTimeout(t); }, .3);
}

/* search — пять решений */
function searchChHTML(c){
  return `<section class="ck-ch ck-search">${head(c)}
    <div class="wrap">${tabsHTML(c.tabs)}<p class="ck-note" aria-live="polite"></p>${deskHTML(c, 'white-ui')}</div></section>`;
}
function liveSearch(box, c){
  const desk = box.querySelector('.ck-desk'), note = box.querySelector('.ck-note');
  const ph = desk.querySelector('.ck-d-ph'), typ = desk.querySelector('.ck-d-type'), role = desk.querySelector('.ck-d-role');
  liveDesk(desk);
  let typer = 0;
  // запрос под роль печатается и стирается по кругу
  const typeRoles = async () => {
    const my = ++typer;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    for (let n = 0; my === typer; n++) {
      const r = c.roles[n % c.roles.length], q = H.pick(r.q);
      role.textContent = H.pick(r.who); role.classList.add('on');
      for (let i = 1; i <= q.length && my === typer; i++) { typ.textContent = q.slice(0, i); await wait(still() ? 0 : 55); }
      await wait(1500);
      for (let i = q.length; i >= 0 && my === typer; i--) { typ.textContent = q.slice(0, i); await wait(still() ? 0 : 22); }
      role.classList.remove('on');
      await wait(350);
    }
  };
  // живой Марк — Дашины анимации (mark-a 2 с, mark-b 3 с) друг за другом по кругу;
  // display:none у невидимой останавливает ее, а показ запускает заново с начала
  const anim = document.createElement('div');
  anim.className = 'ck-d-anim'; anim.setAttribute('aria-hidden', 'true');
  desk.querySelector('.ck-d-mark').appendChild(anim);
  Promise.all(['mark-a.svg', 'mark-b.svg'].map(n => fetch(img(n)).then(r => r.text()).catch(() => '')))
    .then(([a, b]) => { anim.innerHTML = `<div class="a">${a}</div><div class="b">${b}</div>`; });
  let markT = 0;
  const playMark = on => {
    clearTimeout(markT);
    const [a, b] = anim.children;
    if (!on || !a) { anim.dataset.on = ''; return; }
    const step = which => {
      anim.dataset.on = which;
      markT = setTimeout(() => step(which === 'a' ? 'b' : 'a'), which === 'a' ? 2000 : 3000);
    };
    step('a');
  };
  // тихий баннер: сначала как было (оранжевый), потом белые и мягкие варианты по очереди
  let bnT = 0;
  const QUIET = ['orange', 'white-photo', 'white-ui', 'soft-photo', 'soft-ui'];
  const quiet = on => {
    clearTimeout(bnT);
    if (!on) { desk.dataset.banner = 'white-ui'; return; }
    let n = 0;
    const step = () => { desk.dataset.banner = QUIET[n]; if (++n < QUIET.length && !still()) bnT = setTimeout(step, n === 1 ? 900 : 1200); };
    step();
  };
  autoTabs(box, box.querySelector('.ck-tabs'), 5600, (k, i) => {
    playMark(k === 'live' && !still());
    quiet(k === 'quiet');
    desk.className = 'ck-desk m-' + k;
    ph.textContent = k === 'ask' ? ph.dataset.a : ph.dataset.b;
    note.innerHTML = H.T(c.tabs[i].note);
    note.classList.remove('on'); void note.offsetWidth; note.classList.add('on');
    if (k === 'role') typeRoles(); else { typer++; typ.textContent = ''; role.classList.remove('on'); }
  });
}

/* banner — тот же стол, баннер меняется */
function bannerChHTML(c, sc){
  return `<section class="ck-ch ck-bannerch wrap ck-split wide rev"><div class="ck-viz">${tabsHTML(c.tabs)}${deskHTML({ ...sc, before: '' }, 'orange')}</div>${block(c)}</section>`;
}
function liveBanner(box){
  const desk = box.querySelector('.ck-desk');
  liveDesk(desk);
  autoTabs(box, box.querySelector('.ck-tabs'), 3000, k => { desk.dataset.banner = k; });
}

/* ================================================================
   space — два экрана: как было (выноски слева) и как предлагаю (справа);
   у второго варианты иконок сменяются сами, выноски с v — у своего варианта
   ================================================================ */
const marksHTML = (marks, side) => `<ul class="ck-cab-m ${side}">${marks.map(m =>
  `<li style="--y:${m.y * 100}%"${m.v ? ` data-v="${m.v}"` : ''}><span>${H.T(m.t)}</span></li>`).join('')}</ul>`;
function spaceHTML(c){
  const b = c.before, a = c.after;
  const tabs = a.vars.length > 1 ? tabsHTML(a.vars.map(v => ({ k: v.k, t: v.t }))) : '';
  return `<section class="ck-ch ck-space">${head(c)}<div class="wrap"><div class="ck-cab">
    <figure class="ck-cab-f before">
      <figcaption>${H.T(b.t)}</figcaption>
      <div class="ck-cab-pic"><button type="button" class="ck-cab-p" data-i="0" aria-label="${P(b.t)}"><img src="${img(b.img + '.webp')}" alt="" loading="lazy" decoding="async"></button>${marksHTML(b.marks, 'l')}</div>
    </figure>
    <figure class="ck-cab-f after" data-v="${a.vars[0].k}">
      <figcaption>${H.T(a.t)}</figcaption>
      <div class="ck-cab-pic"><button type="button" class="ck-cab-p" aria-label="${P(a.t)}">${a.vars.map((v, i) =>
        `<img data-k="${v.k}" src="${img(v.img + '.webp')}" alt=""${i ? ' class="alt"' : ''} loading="lazy" decoding="async">`).join('')}</button>${marksHTML(a.marks, 'r')}</div>
      ${tabs}
    </figure>
  </div></div></section>`;
}
function liveSpace(box, c){
  const after = box.querySelector('.ck-cab-f.after');
  if (after.querySelector('.ck-tabs')) autoTabs(box, after.querySelector('.ck-tabs'), 3200, k => { after.dataset.v = k; });
  const list = [img(c.before.img + '.webp')].concat(c.after.vars.map(v => img(v.img + '.webp')));
  box.querySelectorAll('.ck-cab-p').forEach((btn, n) => btn.addEventListener('click', () => {
    const i = n ? 1 + Math.max(0, c.after.vars.findIndex(v => v.k === after.dataset.v)) : 0;
    H.openViewer(list, i, [...box.querySelectorAll('.ck-cab-p img')]);
  }));
}

/* ================================================================
   chats — «атом» пишется одинаково
   ================================================================ */
function chatsHTML(c){
  const rows = c.list.map((r, i) => `<li class="ck-chat">
      <span class="ck-av"><img class="a" src="${img('av-now-' + i + '.webp')}" alt="" loading="lazy" decoding="async"><img class="b" src="${img('av-new-' + i + '.webp')}" alt="" loading="lazy" decoding="async"></span>
      <span class="ck-chat-t"><b data-i="${i}">${esc(r.now)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>
      ${r.date ? `<em>${esc(r.date)}</em>` : ''}
    </li>`).join('');
  const sw = `<div class="ck-sw" role="tablist"><button type="button" role="tab" data-k="now" aria-selected="true">${H.T(c.now)}</button><button type="button" role="tab" data-k="next" aria-selected="false">${H.T(c.next)}</button><i></i></div>`;
  return `<section class="ck-ch ck-chats wrap ck-split"><div class="ck-viz"><div class="ck-phone">${sw}<ul class="ck-chatlist">${rows}</ul></div>${c.legend ? `<ul class="ck-lg">${c.legend.map(l => `<li data-i="${l.i.join(' ')}"><img src="${img('av-new-' + l.av + '.webp')}" alt="" loading="lazy" decoding="async"><span>${H.T(l.t)}</span></li>`).join('')}</ul>` : ''}</div>${block(c)}</section>`;
}
function liveChats(box, c){
  const titles = [...box.querySelectorAll('.ck-chat-t b')], list = box.querySelector('.ck-chatlist');
  const btns = [...box.querySelectorAll('.ck-sw button')], sw = box.querySelector('.ck-sw');
  let state = 'now', t, on = false, hand = false, run = 0;
  // перепечатывает строку: меняются только отличающиеся буквы, они подсвечиваются
  const morph = (el, from, to, my) => {
    const n = Math.max(from.length, to.length);
    let cur = from.split('');
    let step = 0;
    const tick = () => {
      if (my !== run) return;
      // находим следующую отличающуюся позицию
      while (step < n && cur[step] === to[step]) step++;
      if (step >= n) { el.innerHTML = [...to].map((ch, i) => from[i] !== ch || from.length !== to.length && i >= Math.min(from.length, to.length) ? `<u>${esc(ch)}</u>` : esc(ch)).join(''); return; }
      cur[step] = to[step] ?? '';
      el.innerHTML = cur.map((ch, i) => i === step ? `<u class="now">${esc(ch)}</u>` : esc(ch)).join('');
      step++;
      setTimeout(tick, still() ? 0 : 70);
    };
    if (from === to) { el.textContent = to; return; }
    tick();
  };
  // сдвиг по совпадающему концу: «Atom» → «Атом», «АТОМ.» → «Атом.» — посимвольно, длины совпадают;
  // «Атом Сообщества» → «Атом.Сообщества» — вставка точки: строим по общему префиксу
  const set = k => {
    if (k === state) return;
    const my = ++run;
    state = k;
    btns.forEach(b => b.setAttribute('aria-selected', b.dataset.k === k));
    sw.dataset.k = k; list.dataset.k = k;
    titles.forEach((el, i) => {
      const r = c.list[i], from = k === 'next' ? r.now : r.next, to = k === 'next' ? r.next : r.now;
      if (from.length === to.length) morph(el, from, to, my);
      else {   // вставка: показываем новое написание с подсветкой вставленного
        let a = 0; while (a < from.length && from[a] === to[a]) a++;
        const extra = to.length - from.length;
        el.innerHTML = extra > 0 ? esc(to.slice(0, a)) + `<u>${esc(to.slice(a, a + extra))}</u>` + esc(to.slice(a + extra)) : esc(to);
      }
    });
  };
  const loop = () => { clearTimeout(t); if (!on || hand || still()) return; t = setTimeout(() => { set(state === 'now' ? 'next' : 'now'); loop(); }, 3400); };
  // легенда: наведение показывает предложение и подсвечивает строки своей группы
  const rowsEl = [...box.querySelectorAll('.ck-chat')];
  box.querySelectorAll('.ck-lg li').forEach(li => {
    const ids = li.dataset.i.split(' ').map(Number);
    li.addEventListener('pointerenter', () => { hand = true; clearTimeout(t); set('next'); list.classList.add('lg'); rowsEl.forEach((r, j) => r.classList.toggle('hl', ids.includes(j))); });
    li.addEventListener('pointerleave', () => { list.classList.remove('lg'); rowsEl.forEach(r => r.classList.remove('hl')); });
  });
  btns.forEach(b => b.addEventListener('click', () => { hand = true; clearTimeout(t); set(b.dataset.k); }));
  onScreen(box, v => { on = v; loop(); });
}

/* ================================================================
   icons — пять продуктов, одни иконки
   ================================================================ */
function iconsHTML(c){
  return `<section class="ck-ch ck-icons">${head(c)}<div class="wrap"><div class="ck-rows">${c.rows.map((r, i) =>
    `<figure class="ck-row" style="--i:${i};--w:${r.w || 3009}"><div class="ck-row-sc"><img src="${img(r.img + '.webp')}" alt="${P(r.t)}" loading="lazy" decoding="async"></div><figcaption>${H.T(r.t)}</figcaption></figure>`).join('')}</div></div></section>`;
}

/* ================================================================
   backlog — что подождет: четыре причины колонками, у каждой значок и системы
   ================================================================ */
const BL_ICON = {
  icons:  '<rect x="10" y="10" width="18" height="18" rx="5"/><rect x="36" y="10" width="18" height="18" rx="5"/><rect x="10" y="36" width="18" height="18" rx="5"/><rect x="36" y="36" width="18" height="18" rx="9"/>',
  owner:  '<rect x="6" y="30" width="14" height="14" rx="4"/><rect x="25" y="30" width="14" height="14" rx="4"/><rect x="44" y="30" width="14" height="14" rx="4"/><circle cx="13" cy="15" r="5"/><circle cx="32" cy="15" r="5"/><circle cx="51" cy="15" r="5"/><path d="M13 20v10M32 20v10M51 20v10"/>',
  theirs: '<rect x="8" y="14" width="34" height="38" rx="6"/><path d="M34 30h22M48 22l8 8-8 8"/>',
  whole:  '<rect x="12" y="10" width="40" height="44" rx="6"/><path d="M22 22h20M22 32h20M22 42h12"/><path d="M50 50a14 14 0 1 0-6 6" transform="translate(4 2)"/>',
};
function backlogHTML(c, names){
  return `<section class="ck-ch ck-backlog">${head(c)}<div class="wrap"><div class="ck-bl">${c.reasons.map((r, i) =>
    `<article class="ck-bl-i" style="--i:${i}">
      <svg class="ck-bl-ic" viewBox="0 0 64 64" aria-hidden="true">${BL_ICON[r.k] || ''}</svg>
      <h3>${H.T(r.t)}</h3>
      <p class="ck-bl-tags">${r.items.map(k => `<span class="ck-bl-tag">${esc(names[k] || k)}</span>`).join('')}</p>
      ${r.more ? `<button type="button" class="ck-bl-p" data-i="${i}"><img src="${img(r.more + '-s.webp')}" alt="${P(r.moreT)}" loading="lazy" decoding="async"><span>${H.T(r.moreT)}</span></button>` : ''}
    </article>`).join('')}</div></div></section>`;
}
function liveBacklog(box, c){
  box.querySelectorAll('.ck-bl-p').forEach(b => b.addEventListener('click', () =>
    H.openViewer([img(c.reasons[+b.dataset.i].more + '.webp')], 0, [b.querySelector('img')])));
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'checkup.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountCheckup(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const s = p.checkup;
  const names = {}, sys = [];
  (s.scope ? s.scope.groups : []).forEach((g, gi) => g.items.forEach(it => {
    names[it.k] = H.pick(it.t);
    sys.push({ k: it.k, short: H.pick(it.s || it.t), bl: gi > 0 });
  }));
  mount.innerHTML =
      (s.scope   ? scopeHTML(s.scope) : '')
    + (s.pattern ? patternHTML(s.pattern, sys) : '')
    + (s.desk    ? deskChHTML(s.desk, s.search) : '')
    + (s.search  ? searchChHTML(s.search) : '')
    + (s.banner  ? bannerChHTML(s.banner, s.search) : '')
    + (s.space   ? spaceHTML(s.space) : '')
    + (s.chats   ? chatsHTML(s.chats) : '')
    + (s.icons   ? iconsHTML(s.icons) : '')
    + (s.backlog ? backlogHTML(s.backlog, names) : '');
  mount.querySelectorAll('.ck-ch').forEach(el => reveal.observe(el));
  const q = c => mount.querySelector(c);
  if (s.scope) liveScope(q('.ck-scope'), s.scope);
  if (s.pattern) livePattern(q('.ck-pattern'));
  if (s.desk) liveDeskCh(q('.ck-deskch'));
  if (s.search) liveSearch(q('.ck-search'), s.search);
  if (s.banner) liveBanner(q('.ck-bannerch'));
  if (s.space) liveSpace(q('.ck-space'), s.space);
  if (s.chats) liveChats(q('.ck-chats'), s.chats);
  if (s.backlog) liveBacklog(q('.ck-backlog'), s.backlog);
}
