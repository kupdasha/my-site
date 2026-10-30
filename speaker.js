/* ================================================================
   СТРАНИЦА «ПРОФИЛЬ СПИКЕРА» (kupdasha.ru/profile)
   Одна версия, серьезная. Тексты — SITE.speaker в content.js, фото —
   SITE.photos.events, оформление — speaker.css.
   stage   — кадр со сцены раскрывается на всю ширину при прокрутке,
             кадры сменяются сами, строка событий с полоской таймера;
   topics  — темы списком, у каждой живая иконка, нажатие раскрывает;
   bio     — переключатель длины, счетчик знаков, копирование;
   ribbon  — лента кадров едет сама, на тач-устройствах листается;
   events  — названия событий, нажатие открывает их кадры.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, watchReveals, base

const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none)').matches;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; };

export function mountSpeaker(S, helpers){
  H = helpers;
  if (!document.querySelector('link[rel="stylesheet"][href*="speaker.css"]')) {
    // app.js мог заранее поставить preload: адрес берем у него, браузер возьмет файл из кеша
    const pre = document.querySelector('link[rel="preload"][href*="speaker.css"]');
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = pre ? pre.href : H.base + 'speaker.css?v=' + Date.now();
    // репозиторий больше 50 МБ: jsDelivr иногда отвечает на файл ошибкой — тогда стили берутся с GitHub и вставляются в страницу
    l.onerror = () => {
      const m = /my-site@([0-9a-f]{40})\//.exec(l.href);
      fetch(`https://raw.githubusercontent.com/kupdasha/my-site/${m ? m[1] : 'main'}/speaker.css`).then(r => r.text()).then(css => {
        const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      }).catch(() => {});
    };
    document.head.appendChild(l);
  }
  const E = SITE.photos.events;
  $('#speakerMail').href = 'mailto:' + S.email;
  $('#speakerMailText').textContent = S.email;
  stage(S, E);
  facts(S);
  topics(S);
  bio(S);
  ribbon(E);
  events(E);
  shows(S);
  fan(S);
  H.watchReveals(document, true);
}

/* ---------- Кадр со сцены ---------- */
function stage(S, E){
  const box = $('#spStage'), line = $('#spFrames');
  const frames = S.hero.map(f => ({ ...f, item: E.items.find(i => i.src.includes(f.ev + '.jpg')) })).filter(f => f.item);
  box.innerHTML = frames.map((f, k) =>
    `<img class="${k ? '' : 'on'}" ${k ? 'loading="lazy"' : 'fetchpriority="high"'} src="${f.item.src}" alt="${esc(H.pick(f.item.caption))}" style="object-position:${f.pos}">`).join('');
  line.innerHTML = frames.map((f, k) =>
    `<button class="sp-frame${k ? '' : ' on'}" data-k="${k}"><i></i><span>${H.T(E.labels[H.pick(f.item.caption)] || f.item.caption)}</span></button>`).join('');
  const imgs = [...box.children], tabs = [...line.children];
  let at = 0, seen = true, timer;
  const go = k => {
    if (k === at) return;
    imgs[at].classList.remove('on'); imgs[at].classList.add('off');
    const old = imgs[at]; setTimeout(() => old.classList.remove('off'), 1200);
    box.append(imgs[k]);   // новый кадр проявляется поверх прежнего
    imgs[k].getBoundingClientRect(); imgs[k].classList.add('on');
    tabs[at].classList.remove('on'); tabs[k].getBoundingClientRect(); tabs[k].classList.add('on');
    at = k;
  };
  const tick = () => { clearTimeout(timer); timer = setTimeout(() => { if (seen && !document.hidden) go((at + 1) % frames.length); tick(); }, 5000); };
  if (!reduced) tick();
  line.addEventListener('click', e => { const b = e.target.closest('.sp-frame'); if (b) { go(+b.dataset.k); tick(); } });
  new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(box);
  // кадр раскрывается от колонки сайта до краев экрана
  if (reduced) return;
  let queued = false;
  const open = () => {
    queued = false;
    const start = box.offsetTop;   // где кадр стоит до прокрутки
    box.style.setProperty('--open', Math.min(1, Math.max(0, scrollY / Math.max(1, Math.min(start, innerHeight * .55)))).toFixed(3));
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(open); } };
  addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); open();
}

/* ---------- Цифры и премии ---------- */
function facts(S){
  $('#spFacts').innerHTML = S.facts.map((f, k) =>
    `<div class="sp-fact" data-reveal style="--d:${(k * .06).toFixed(2)}s"><b>${H.T(f.big)}</b><span>${H.T(f.text)}</span></div>`).join('');
}

/* ---------- Темы: живые иконки — простые формы, лаймовое пятно одно на иконку ---------- */
const ICONS = [
  // ИИ в продакшене: много вариантов мерцают, один отобран
  `<svg viewBox="0 0 96 96">${[...Array(16)].map((_, k) => { const x = 6 + (k % 4) * 22, y = 6 + (k >> 2) * 22, on = k === 6;
    return `<rect class="${on ? 'pick' : 'flick'}" x="${x}" y="${y}" width="18" height="18" rx="3" style="--k:${(k * 7) % 16}"/>`; }).join('')}</svg>`,
  // вкус против насмотренности: из множества точек остается решение
  `<svg viewBox="0 0 96 96">${[[16,20],[38,12],[64,18],[82,34],[14,48],[82,62],[24,78],[50,86],[72,80]].map(([x, y], k) =>
    `<circle class="seek" cx="${x}" cy="${y}" r="5" style="--x:${48 - x}px;--y:${48 - y}px;--k:${k}"/>`).join('')}<circle class="pick grow" cx="48" cy="48" r="17"/></svg>`,
  // лидерство: команда держится вокруг одного центра
  `<svg viewBox="0 0 96 96"><g class="orbit">${[0, 72, 144, 216, 288].map(a => { const r = a * Math.PI / 180;
    return `<circle class="ink" cx="${(48 + 36 * Math.cos(r)).toFixed(1)}" cy="${(48 + 36 * Math.sin(r)).toFixed(1)}" r="8"/>`; }).join('')}</g><circle class="pick pulse" cx="48" cy="48" r="13"/></svg>`,
  // российские платформы: калька отходит и становится своей формой
  `<svg viewBox="0 0 96 96"><rect class="ink" x="10" y="14" width="50" height="50" rx="4"/><rect class="pick morph" x="10" y="14" width="50" height="50" rx="4"/></svg>`,
  // стендап: микрофон и волны от него
  `<svg viewBox="0 0 96 96"><circle class="wave" cx="38" cy="38" r="20"/><circle class="wave" cx="38" cy="38" r="20" style="--k:1"/><circle class="wave" cx="38" cy="38" r="20" style="--k:2"/><circle class="pick" cx="38" cy="38" r="15"/><path class="stick" d="M48 49 L80 84"/></svg>`,
];

function topics(S){
  const box = $('#topicList');
  const words = f => H.pick(f).replace(/\.$/, '').split(' / ');
  box.innerHTML = S.topics.map((t, k) => `
    <article class="sp-topic${k ? '' : ' open'}" data-reveal style="--d:${(k * .05).toFixed(2)}s">
      <button class="sp-topic-head" aria-expanded="${k ? 'false' : 'true'}">
        <span class="sp-icon" aria-hidden="true">${ICONS[k % ICONS.length]}</span>
        <span class="sp-topic-name">${H.T(t.title)}</span>
        <span class="sp-tags">${words(t.format).map(w => `<span class="sp-tag">${H.T(w)}</span>`).join('')}</span>
        <span class="sp-plus" aria-hidden="true"></span>
      </button>
      <div class="sp-topic-body"><div><div class="sp-topic-in">
        <p>${H.T(t.text)}</p>
        <p class="sp-who"><span>${H.T(S.whoLabel)}</span> ${H.T(t.who)}</p>
      </div></div></div>
    </article>`).join('');
  box.addEventListener('click', e => {
    const head = e.target.closest('.sp-topic-head'); if (!head) return;
    const item = head.parentElement, was = item.classList.contains('open');
    box.querySelectorAll('.sp-topic').forEach(i => { i.classList.remove('open'); i.firstElementChild.setAttribute('aria-expanded', 'false'); });
    if (!was) { item.classList.add('open'); head.setAttribute('aria-expanded', 'true'); }
  });
}

/* ---------- Био ---------- */
function bio(S){
  const box = $('#bioBox');
  box.innerHTML = `<div class="sp-seg" role="tablist">${S.bio.map((b, k) => `<button role="tab" class="${k ? '' : 'on'}" data-k="${k}">${H.T(b.name)}</button>`).join('')}</div>
    <div class="sp-bio-text"><p></p></div>
    <div class="sp-bio-foot"><span class="sp-count"></span><button class="btn btn-line sp-copy"><span>${H.T(S.copy)}</span></button></div>`;
  const wrapText = box.querySelector('.sp-bio-text'), p = wrapText.firstElementChild, count = box.querySelector('.sp-count'), copy = box.querySelector('.sp-copy');
  let at = 0, back, free;
  const show = k => {
    at = k;
    const from = wrapText.offsetHeight;
    p.innerHTML = H.T(S.bio[k].text);
    const n = S.bio[k].text.length;
    count.textContent = `${n} ${plural(n, 'знак', 'знака', 'знаков')}`;
    wrapText.style.height = 'auto';
    const to = wrapText.offsetHeight;
    wrapText.style.height = from + 'px'; wrapText.getBoundingClientRect(); wrapText.style.height = to + 'px';
    clearTimeout(free); free = setTimeout(() => { wrapText.style.height = 'auto'; }, 600);   // текст может измениться при повороте экрана
    p.classList.remove('in'); p.getBoundingClientRect(); p.classList.add('in');
  };
  p.innerHTML = H.T(S.bio[0].text);
  const n0 = S.bio[0].text.length; count.textContent = `${n0} ${plural(n0, 'знак', 'знака', 'знаков')}`;
  box.querySelector('.sp-seg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    box.querySelectorAll('.sp-seg button').forEach(x => x.classList.toggle('on', x === b));
    show(+b.dataset.k);
  });
  copy.addEventListener('click', () => {
    const text = S.bio[at].text;
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(() => {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }).finally(() => {
      copy.firstElementChild.innerHTML = H.T(S.copied); clearTimeout(back);
      back = setTimeout(() => { copy.firstElementChild.innerHTML = H.T(S.copy); }, 1800);
    });
  });
}

/* ---------- Лента кадров ---------- */
function ribbon(E){
  const box = $('#spRibbon');
  const rows = [E.items.filter((_, k) => k % 2 === 0), E.items.filter((_, k) => k % 2)];
  const all = E.items, cap = i => H.pick(i.caption);
  const fig = i => `<figure data-i="${all.indexOf(i)}" style="--ar:${i.ratio || 1.5}"><img src="${i.thumb || i.src}" alt="${esc(cap(i))}" loading="lazy" draggable="false"></figure>`;
  box.innerHTML = rows.map((r, n) => `<div class="sp-row${n ? ' back' : ''}"><div class="sp-run">${r.map(fig).join('')}${touch ? '' : r.map(fig).join('')}</div></div>`).join('');
  box.addEventListener('click', e => {
    const f = e.target.closest('figure'); if (!f) return;
    H.openViewer(all.map(i => i.src), +f.dataset.i, [], all.map(cap));
  });
}

/* ---------- События ---------- */
function events(E){
  const caps = [...new Set(E.items.map(i => H.pick(i.caption)))];
  const order = [...E.order.filter(c => caps.includes(c)), ...caps.filter(c => !E.order.includes(c))];
  const box = $('#spEvents');
  box.innerHTML = order.map((c, k) => {
    const n = E.items.filter(i => H.pick(i.caption) === c).length;
    return `<button class="sp-ev" data-c="${esc(c)}" data-reveal style="--d:${(k * .02).toFixed(2)}s"><span>${H.T(E.labels[c] || c)}</span><sup class="yr">${n}</sup></button>`;
  }).join('');
  box.addEventListener('click', e => {
    const b = e.target.closest('.sp-ev'); if (!b) return;
    const list = E.items.filter(i => H.pick(i.caption) === b.dataset.c);
    H.openViewer(list.map(i => i.src), 0, [], list.map(i => H.pick(i.caption)));
  });
}

/* ---------- Записи выступлений ---------- */
function shows(S){
  const box = $('#showList');
  box.innerHTML = S.shows.map(sh => `
    <a class="sp-show" href="${sh.link}" data-reveal>
      <span class="sp-show-img">${sh.images.map((src, k) => `<img class="${k ? '' : 'on'}" src="${src}" alt="" loading="lazy">`).join('')}</span>
      <span class="sp-show-name">${H.T(sh.title)}<span class="arr">→</span></span>
    </a>`).join('');
  if (reduced) return;
  box.querySelectorAll('.sp-show').forEach((card, n) => {
    const imgs = [...card.querySelectorAll('img')]; let at = 0;
    if (imgs.length > 1) setInterval(() => {
      if (document.hidden) return;
      imgs[at].classList.remove('on'); at = (at + 1) % imgs.length; imgs[at].classList.add('on');
    }, 3400 + n * 900);
  });
}

/* ---------- Фотографии веером ---------- */
function fan(S){
  $('#spFan').innerHTML = S.press.map(src => `<img src="${src}" alt="Дарья Купцова" loading="lazy">`).join('');
}
