/* ================================================================
   КЕЙС «ИМИДЖЕВЫЙ БУКЛЕТ», каталог цветов для оптовиков (поле booklet у проекта)
   Везде настоящие рендеры. Пары кадров (одна сцена в разном цвете или
   свете) перетекают друг в друга через прозрачность по кругу — fade().
   hero   — в шапке кейса ролик open.mp4: обложка, книга открывается, поднимается ферма;
   symbol — круг: обложка меняет цвет, рядом вырубка, тоже меняет цвет;
   pages  — в конце главы конструктора: абзац без подписи и заголовка, под ним разворот с тюльпанами (просьба 23.11);
   farm   — объемная страница во всю ширину сайта, ниже ролик: обложка, книга открывается,
            поднимается ферма (open.mp4, имя на страницах заретушировано по кадрам),
            рядом текст и книга веером (свет проходит волной);
   scent  — ароматизированная страница: по бумаге проходит луч, рядом разворот;
   wheel  — круговой конструктор букета коллажом.
   Кадр крупно по нажатию. Картинки — img/booklet, -s — копия 900 px.
   Тексты — в content.js, оформление — booklet.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const img = n => H.base + 'img/booklet/' + n;
const SMALL = /^(scent-[12]|color|tulips)/;   // эти кадры 1920 px, остальные 2400 (wheel — 1280)
const pic = (n, sizes) =>
  `<img src="${img(n + '.webp')}" srcset="${img(n + '-s.webp')} 900w, ${img(n + '.webp')} ${n === 'wheel' ? 1280 : SMALL.test(n) ? 1920 : 2400}w" sizes="${sizes}" alt="" loading="lazy" decoding="async">`;
const FULL = '100vw', WIDE = '(max-width: 900px) 100vw, 64vw', HALF = '(max-width: 900px) 100vw, 46vw', SIDE = '(max-width: 900px) 100vw, 32vw';

/* ---------- кадр: одно имя — картинка, два — перетекают по кругу ---------- */
const shot = (names, sizes, cls = '') => {
  const list = [].concat(names);
  if (/\.mp4$/.test(list[0])) return `<div class="ib-shot ${cls}"><video muted loop playsinline preload="none" poster="${img(list[0].replace('.mp4', '.webp'))}" src="${img(list[0])}"></video></div>`;
  return `<button type="button" class="ib-shot ${cls}${list.length > 1 ? ' ib-fade' : ''}" data-n="${list.join(',')}" aria-label="${esc(H.pick(OPEN))}">${list.map(n => pic(n, sizes)).join('')}</button>`;
};
let OPEN = ['рассмотреть кадр', 'рассмотреть кадр'];

/* ---------- текст главы ---------- */
const block = c => `<div class="ib-col">
  <span class="case-label">${H.T(c.label)}</span>
  <h2 class="ib-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="ib-text">${H.T(c.text)}</p>` : ''}
</div>`;

const VIEW = {
  // круг: обложка меняет цвет, справа текст и вырубка
  symbol: c => `<div class="wrap ib-duo">${shot(c.fade, WIDE, 'ib-big')}${block(c)}${shot(c.img, SIDE, 'ib-low')}</div>`,
  // каталог: текст слева, разворот справа
  // объемная страница: во всю ширину сайта, ниже — как складывается, и текст
  farm:   c => `${shot(c.fade, FULL, 'ib-bleed')}<div class="wrap ib-duo ib-open">${shot(c.big, WIDE, 'ib-big')}${block(c)}${shot(c.img, SIDE, 'ib-low ib-sweep')}</div>`,
  // ароматы: заголовок, под ним два кадра поровну
  scent:  c => `<div class="wrap ib-head">${block(c)}</div><div class="wrap ib-pair">${shot(c.fade, HALF, 'ib-sweep')}${shot(c.img, HALF)}</div>`,
  // конструктор: большой круг, рядом он же в книге
  wheel:  (c, s) => `<div class="wrap ib-head">${block(c)}</div><div class="wrap ib-trio">${c.imgs.map((n, i) => shot(n, i ? SIDE : WIDE)).join('')}</div>${s.pages ? `<div class="wrap ib-after">${s.pages.text ? `<div class="ib-col"><p class="ib-text">${H.T(s.pages.text)}</p></div>` : ''}${shot(s.pages.fade, FULL)}</div>` : ''}`,
};

/* ---------- стили и запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'booklet.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
// кадры перетекают, только пока на экране и пока обе картинки загружены
const player = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('on', e.isIntersecting)), { threshold: .15 });
// ролик грузится и играет, только пока на экране
const roll = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); }), { threshold: .15 });
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });
function watchFade(el){
  const top = el.querySelector('img:last-child');
  const go = () => { el.classList.add('ready'); player.observe(el); };
  top.complete && top.naturalWidth ? go() : top.addEventListener('load', go, { once: true });
}

// какой кадр пары сейчас виден: у обычной — по прозрачности, у волны — по сдвигу маски
const shown = im => {
  const cs = getComputedStyle(im);
  return im.closest('.ib-sweep') ? Math.abs(parseFloat(cs.maskPosition || cs.webkitMaskPosition) - 50) < 25 : +cs.opacity > .5;
};

export async function mountBooklet(mount, p, helpers){
  H = helpers;
  // версия «вау» — по адресу с ?wow (booklet-wow.js); без него — версия 1 (метка git booklet-v1)
  if (p.booklet.wow && /[?&]wow\b/.test(location.search)) {
    const m = await import(H.base + 'booklet-wow.js?v=' + VERS);
    return m.mountWow(mount, p, helpers, loadCSS(H.base));
  }
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const s = p.booklet;
  if (s.open) OPEN = s.open;
  mount.innerHTML = ['symbol', 'farm', 'scent', 'wheel']
    .filter(k => s[k]).map(k => `<section class="ib-ch ib-${k}">${VIEW[k](s[k], s)}</section>`).join('');
  // живой конструктор и венок вокруг бейджа — из booklet-wow.js (выбраны Дашей из версии «вау» 23.11)
  if (s.wow) try {
    const m = await import(H.base + 'booklet-wow.js?v=' + VERS);
    await m.mountParts(mount, p, helpers);
  } catch (e) { console.warn('конструктор буклета не загрузился', e); }
  if (!mount.isConnected) return;
  const hero = mount.closest('.case-body')?.parentElement.querySelector('.case-hero');
  if (hero && s.hero) {
    hero.classList.add('ib-hero');
    if (typeof s.hero === 'string') {   // ролик: играет сам без звука, пока шапка на экране
      hero.innerHTML = `<video class="ib-hero-v" muted loop playsinline autoplay preload="auto" poster="${img(s.hero.replace('.mp4', '.webp'))}" src="${img(s.hero)}"></video>`;
      const v = hero.firstElementChild; v.muted = true; roll.observe(v);
    } else {
      hero.innerHTML = `<div class="ib-fade">${s.hero.map(n => pic(n, FULL).replace('loading="lazy"', 'fetchpriority="high"')).join('')}</div>`;
      watchFade(hero.firstElementChild);
    }
  }
  // бейдж премии — под текстом результата; если в конце кейса есть венок с бейджем, второй раз не ставим
  const last = mount.closest('.case-body')?.querySelector('.scheme-cols > .camp-col:last-child');
  if (last && s.award && !mount.querySelector('.bw-fin')) last.insertAdjacentHTML('beforeend', `<img class="ib-award" src="${img(s.award.img)}" alt="${esc(s.award.alt)}" width="249" height="84">`);
  mount.querySelectorAll('.ib-fade').forEach(watchFade);
  mount.querySelectorAll('video').forEach(v => { v.muted = true; roll.observe(v); });
  mount.querySelectorAll('.ib-ch').forEach(el => reveal.observe(el));
  // крупно по нажатию: листаются все кадры кейса подряд, у пары — оба
  const shots = [...mount.querySelectorAll('button.ib-shot')], list = [], from = [];
  shots.forEach(b => {
    const at = list.length, imgs = [...b.querySelectorAll('img')];
    b.dataset.n.split(',').forEach((n, i) => { list.push(img(n + '.webp')); from.push(imgs[i]); });
    // у пары открывается тот кадр, который сейчас виден
    b.addEventListener('click', () => H.openViewer(list, at + (imgs[1] && shown(imgs[1]) ? 1 : 0), from));
  });
}
