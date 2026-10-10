/* ================================================================
   КЕЙС «ИИ СТИКЕРЫ» (поле stickers у проекта)
   Готовых 3D-героев (Иван, Глазыч, дети) оживили нейросетью и собрали
   в анимированный стикерпак для Телеграма.
   Стикеры вырезаны из презентации без фона: у каждого .webm (VP9
   с прозрачностью — Chrome, Firefox, Android), -hevc.mp4 (HEVC
   с прозрачностью — Safari и всё на iPhone) и .webp (первый кадр).
   Главы: faces — нюансы ретуши: у стикера лупа над местом правки
     (блики, которые у нейросети катались; слеза, добавленная программно);
   chat — от рендера до мессенджера: переписка стикерами, панель
     стикерпака внизу; каждый новый стикер приходит на зеленом фоне,
     и фон стирается — как при клинапе; нажатие отправляет стикер,
     собеседник отвечает; пока не тронули, переписка идет сама.
     Рядом с чатом — этапы списком: что и кто делал.
   Тексты и список стикеров — в content.js, оформление — stickers.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const any = a => a[Math.floor(Math.random() * a.length)];
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
const plural = (n, one, few, many) => {
  const d = n % 10, h = n % 100;
  return d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
};

/* ---------- стикер: прозрачное видео ---------- */
// Safari и любой браузер на iPhone не умеют прозрачность у VP9 — им HEVC с прозрачностью,
// остальным WebM: Chrome на Маке HEVC играет, но без прозрачности, поэтому выбираем по движку, а не по canPlayType
const UA = navigator.userAgent;
const APPLE = /iP(hone|ad|od)/.test(UA) || (/Safari\//.test(UA) && !/Chrome|Chromium|CriOS|Android|Edg|Firefox|OPR/.test(UA));
const file = s => s + (APPLE ? '-hevc.mp4' : '.webm');
const vid = (s, cls = '') => `<video class="stk-v${cls ? ' ' + cls : ''}" muted loop playsinline preload="none" poster="${esc(s)}.webp" data-src="${esc(file(s))}" aria-hidden="true"></video>`;
// играет, только пока виден; при «меньше движения» остается первый кадр
const vio = new IntersectionObserver(es => es.forEach(({ target: v, isIntersecting: on }) => {
  if (on && !still()) {
    if (!v.getAttribute('src')) v.src = v.dataset.src;
    v.muted = true;
    v.play().catch(() => {});
  } else v.pause();
}), { rootMargin: '120px' });
const watch = root => root.querySelectorAll('video.stk-v').forEach(v => vio.observe(v));

/* ---------- заголовок главы: слова поднимаются из-под строки ---------- */
function splitWords(el){
  const nodes = [];
  // знак сразу после слова в обертке типографа держится за это слово
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) nodes.push(walk.currentNode);
  nodes.forEach(node => {
    const m = node.textContent.match(/^[,.:;!?»)…]+/), prev = node.previousSibling;
    if (m && prev && prev.nodeType === 1) { const t = prev.lastChild; if (t && t.nodeType === 3) t.data += m[0]; else prev.append(m[0]); node.textContent = node.textContent.slice(m[0].length); }
  });
  nodes.length = 0;
  const walk2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walk2.nextNode()) if (walk2.currentNode.textContent) nodes.push(walk2.currentNode);
  let n = 0;
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/([ \t\n]+)/).forEach(part => {
      if (!part) return;
      if (/^[ \t\n]+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement('span'); w.className = 'stk-w';
      const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--i', n++);
      w.append(i); frag.append(w);
    });
    node.replaceWith(frag);
  });
}
const head = ch => `<div class="stk-head">
  <span class="case-label stk-label">${H.T(ch.label)}</span>
  <h2 class="stk-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="stk-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const side = ch => `<div class="stk-side">
  <span class="case-label stk-label">${H.T(ch.label)}</span>
  <h2 class="stk-title">${H.T(ch.title)}</h2>
  <p class="stk-text">${H.T(ch.text)}</p>
  ${ch.steps ? `<ul class="stk-steps">${ch.steps.map(st =>
    `<li><span>${H.T(st.name)}</span><span class="stk-by">${H.T(st.who)}</span></li>`).join('')}</ul>` : ''}
</div>`;

/* ================================================================
   chat — переписка стикерами, внизу панель стикерпака
   ================================================================ */
function chatHTML(c, all){
  const s = all.stickers;
  const n = s.heroes.reduce((k, h) => k + h.items.length, 0);
  return `<div class="stk-phone">
    <div class="stk-top">
      <span class="stk-ava"><img src="${esc(s.heroes[1].items[0].src)}.webp" alt="" decoding="async"></span>
      <span class="stk-who"><b>${H.T(c.name)}</b><span>${n} ${plural(n, 'стикер', 'стикера', 'стикеров')}</span></span>
    </div>
    <div class="stk-feed" style="background-image:url(&quot;${esc(s.wall)}&quot;)"><div class="stk-msgs"></div></div>
    <div class="stk-pack">
      <div class="stk-packs" role="tablist">${s.heroes.map((h, i) =>
        `<button class="stk-pk" type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><img src="${esc(h.items[0].src)}.webp" alt="" decoding="async"><span>${H.T(h.name)}</span></button>`).join('')}</div>
      <div class="stk-grid"></div>
    </div>
  </div>`;
}
function liveChat(sec, c, all){
  const heroes = all.stickers.heroes;
  const flat = heroes.flatMap((h, hi) => h.items.map(it => ({ ...it, hi })));
  const msgs = sec.querySelector('.stk-msgs'), grid = sec.querySelector('.stk-grid');
  const pks = [...sec.querySelectorAll('.stk-pk')];
  const lines = (c.lines || []).map(l => H.pick(l));
  let touched = false, last = null, replyTimer = 0;

  const showHero = i => {
    pks.forEach((b, j) => b.setAttribute('aria-selected', j === i));
    grid.innerHTML = heroes[i].items.map((it, k) =>
      `<button class="stk-cell" type="button" data-k="${k}" aria-label="${esc(H.pick(it.emo))}">${vid(it.src)}</button>`).join('');
    grid.querySelectorAll('.stk-cell').forEach(b => b.addEventListener('click', () => {
      touched = true;
      const it = heroes[i].items[+b.dataset.k];
      send('out', { st: { ...it, hi: i } });
      // собеседник отвечает стикером другого героя
      clearTimeout(replyTimer);
      replyTimer = setTimeout(() => send('in', { st: pickSticker(x => x.hi !== i) }), 1100);
    }));
    watch(grid);
  };
  pks.forEach((b, i) => b.addEventListener('click', () => { touched = true; showHero(i); }));

  const pickSticker = (ok = () => true) => {
    const pool = flat.filter(x => x !== last && ok(x));
    return (last = any(pool.length ? pool : flat));
  };
  // сообщение: реплика пузырем или стикер без пузыря; старые уезжают вверх и пропадают
  function send(from, { text, st }, instant){
    const m = document.createElement('div');
    m.className = `stk-msg ${from}${st ? ' st' : ''}${instant ? ' show' : ''}`;
    m.innerHTML = st ? `${instant ? '' : '<i class="stk-chroma"></i>'}${vid(st.src)}` : `<p>${H.T(text)}</p>`;
    msgs.append(m);
    watch(m);
    if (!instant) requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('show')));
    // зеленый фон уходит, когда стикер уже на месте; при «меньше движения» его нет сразу
    if (st && !instant) setTimeout(() => m.classList.add('clean'), still() ? 0 : 700);
    while (msgs.children.length > 8) msgs.firstElementChild.remove();
  }

  // переписка сама по себе: реплики по очереди, между ними стикеры
  const SCRIPT = [['out', 'st'], ['in', 'st'], ['out', 'line'], ['in', 'st'], ['in', 'line'], ['out', 'st'], ['out', 'line'], ['in', 'st'], ['in', 'line'], ['out', 'st']];
  let step = 0, li = 1, timer = 0, on = false;
  const next = () => {
    clearTimeout(timer);
    if (touched || !on || still()) return;
    const [from, what] = SCRIPT[step++ % SCRIPT.length];
    if (what === 'line' && lines.length) send(from, { text: lines[li++ % lines.length] });
    else send(from, { st: pickSticker() });
    timer = setTimeout(next, what === 'line' ? 1500 : 2100);
  };
  // чат не пустой с самого начала
  if (lines[0]) send('in', { text: lines[0] }, true);
  send('out', { st: last = flat[0] }, true);
  showHero(0);
  onScreen(sec.querySelector('.stk-phone'), v => { on = v; if (v) timer = setTimeout(next, 900); else clearTimeout(timer); }, .4);
}

/* ================================================================
   faces — нюансы ретуши: стикер и лупа над местом правки
   (блики, которые у нейросети катались; слеза, добавленная программно).
   Лупа — canvas: каждый кадр берет тот же кусок из ролика, поэтому
   увеличение всегда совпадает с самим стикером
   ================================================================ */
function facesHTML(c){
  return `<div class="stk-fixes">${c.fixes.map(f => `<figure class="stk-fix">
    <div class="stk-fixp" style="--x:${f.x * 100}%;--y:${f.y * 100}%;--r:${f.r * 100}%">
      ${vid(f.src)}
      <i class="stk-ring" aria-hidden="true"></i>
      <canvas class="stk-loupe" width="320" height="320" aria-hidden="true"></canvas>
    </div>
    <figcaption><span class="stk-by">${H.T(f.name)}</span><p>${H.T(f.text)}</p></figcaption>
  </figure>`).join('')}</div>`;
}
function liveFaces(sec, c){
  sec.querySelectorAll('.stk-fix').forEach((fig, i) => {
    const f = c.fixes[i], v = fig.querySelector('video'), cv = fig.querySelector('canvas'), g = cv.getContext('2d');
    const poster = new Image(); poster.src = f.src + '.webp';
    const draw = () => {
      const src = v.readyState >= 2 ? v : poster, w = v.videoWidth || poster.naturalWidth;
      if (!w) return;
      const s = f.r * 2 * w;
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(src, (f.x - f.r) * w, (f.y - f.r) * w, s, s, 0, 0, cv.width, cv.height);
    };
    poster.onload = draw;
    let on = false, raf = 0;
    const loop = () => { draw(); raf = on ? requestAnimationFrame(loop) : 0; };
    onScreen(fig, vis => { on = vis && !still(); if (on && !raf) loop(); else draw(); }, .2);
    v.addEventListener('loadeddata', draw);
  });
  watch(sec);
}

/* ---------- запуск ---------- */
// [ключ, иллюстрация, оживление, раскладка]: head — заголовок сверху; left — иллюстрация слева от текста
const CHAPTERS = [
  ['faces', facesHTML, liveFaces, 'head'],
  ['chat', chatHTML, liveChat, 'left'],
];

let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'stickers.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountStickers(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const s = p.stickers;
  mount.innerHTML = CHAPTERS.filter(([k]) => s[k]).map(([k, html, , how]) => {
    const viz = `<div class="stk-viz">${html(s[k], p)}</div>`;
    if (how === 'head') return `<section class="stk-ch wrap stk-${k}-ch">${head(s[k])}${viz}</section>`;
    return `<section class="stk-ch wrap stk-${k}-ch stk-split stk-${how}">${viz}${side(s[k])}</section>`;
  }).join('');
  mount.querySelectorAll('.stk-title').forEach(splitWords);
  mount.querySelectorAll('.stk-ch').forEach(x => reveal.observe(x));
  CHAPTERS.filter(([k]) => s[k]).forEach(([k, , live]) => live(mount.querySelector(`.stk-${k}-ch`), s[k], p));
}
