/* ================================================================
   ЛОГИКА САЙТА
   ----------------------------------------------------------------
   Тексты сюда не пишутся — они в content.js.
   Разделы ниже: типограф → вывод текстов → переключатель версий →
   направления со струнами → проекты и видеопревью → страница кейса →
   анимации → шутки → запуск. Частицы первого экрана — в shimmer.js.
   Числа, которые удобно подкрутить, вынесены в TUNE.
   ================================================================ */
(() => {
'use strict';
// если на странице Тильды код подключен дважды (старый блок + новый), второй запуск ничего не делает
// старый блок кода мог запуститься раньше текстов и упасть, оставив флаг __kdApp, — поэтому свой флаг __kdAppOK:
// без текстов (SITE) не запускаемся вовсе, а запустившись, не даем второй копии повторить запуск
if (window.__kdAppOK || typeof SITE === 'undefined') return; window.__kdAppOK = window.__kdApp = true;

/* На Тильде тексты (content.js) приходят с GitHub как есть, с адресами прототипа.
   Здесь они переводятся на адреса сайта: index.html → /full, about.html → /i,
   а картинки img/… — на тот же GitHub, откуда пришел content.js */
{
  const src = document.currentScript?.src || [...document.scripts].map(s => s.src).find(s => /\/app\.js(\?|$)/.test(s)) || '';
  const onTilda = !document.querySelector('script[src="content.js"]');
  const base = src.replace(/app\.js(\?.*)?$/, '');
  if (onTilda && typeof SITE !== 'undefined') {
    const PAGES = [[/^index\.html/, '/full'], [/^about\.html/, '/i'], [/^speaker\.html/, '/speaker'], [/^nda\.html/, '/n_d_a']];
    const fix = s => {
      if (s.startsWith('img/')) return base + s;
      for (const [re, to] of PAGES) if (re.test(s)) return s.replace(re, to).replace('/#', '/#').replace(/^\/\/+/, '/');
      return s;
    };
    const walk = o => { for (const k in o) { const v = o[k]; if (typeof v === 'string') o[k] = fix(v); else if (v && typeof v === 'object') walk(v); } };
    walk(SITE);
    SITE.homePage = SITE.homePage || '/full';   // главная на Тильде — kupdasha.ru/full
  }
}

// папка, откуда пришел app.js: на Тильде это GitHub, в прототипе — сама папка сайта
// версия файлов для ?v=: на сайте меняется раз в час, на локальном превью — при каждой загрузке
const VER = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const SCRIPT_BASE = (document.currentScript?.src || [...document.scripts].map(s => s.src).find(s => /\/app\.js(\?|$)/.test(s)) || '').replace(/app\.js(\?.*)?$/, '');
// живые главы кейса: стили начинают грузиться вместе со скриптом, а не после него, — у нового посетителя кейс
// открывается на один запрос быстрее. Адрес тот же, что потом запросит сам модуль (?v= — номер часа), поэтому
// его link берет файл из кеша. На локальном превью модули ставят ?v= по миллисекундам — там не подгружаем
const CASE_CSS = ['audit', 'adhd', 'fleet', 'clip', 'armani', 'kav', 'cartoon', 'akbars', 'suit', 'ventures', 'vector', 'navi', 'anon', 'poll', 'office', 'vkplay', 'fix'];
function caseImport(n){
  if (CASE_CSS.includes(n) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    const href = SCRIPT_BASE + n + '.css?v=' + VER;
    if (!document.querySelector(`link[href="${href}"]`)) {
      const l = document.createElement('link'); l.rel = 'preload'; l.as = 'style'; l.href = href; document.head.appendChild(l);
    }
  }
  return import(SCRIPT_BASE + n + '.js?v=' + VER);
}

const TUNE = {
  stringPull:     44,    // на сколько пикселей можно оттянуть струну
  stringStiff:    0.085, // упругость струны: больше — колеблется чаще
  stringDamping:  0.955, // затухание: ближе к 1 — дольше дрожит
  idleJokeAfter:  25000, // через сколько мс бездействия появляется шутка
};

const root    = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch   = matchMedia('(hover: none)').matches;
/* Если блока на этой странице нет (у «Обо мне» нет кейсов, у главной — подкаста),
   вместо него подставляется пустышка, и код этого блока просто ничего не делает */
const $  = s => document.querySelector(s) || document.createElement('div');
const $$ = s => [...document.querySelectorAll(s)];

/* Какая версия включена: 0 — формальная (светлая), 1 — дружеская (темная) */
const isFun = () => root.dataset.theme === 'dark';
/* Какая это страница: в прототипе — класс у body, на Тильде — атрибут data-page у раздела */
const isAboutPage = document.body.classList.contains('page-about') || !!document.querySelector('[data-page="about"]');
const isSpeakerPage = document.body.classList.contains('page-speaker') || !!document.querySelector('[data-page="speaker"]');
const isNdaPage = document.body.classList.contains('page-nda') || !!document.querySelector('[data-page="nda"]');
/* Старый блок страницы NDA на Тильде (проекты списком, без окна кейса) достраивается сам:
   сетка карточек и окно кейса появляются без перевставки блока */
if (isNdaPage) {
  const list = document.querySelector('#ndaProjects');
  if (list && !list.classList.contains('works')) {
    list.classList.add('works');
    if (!list.parentElement.classList.contains('wrap')) { const w = document.createElement('div'); w.className = 'wrap'; list.replaceWith(w); w.append(list); }
  }
  if (!document.querySelector('#case')) document.body.insertAdjacentHTML('beforeend', `
<div class="case" id="case" role="dialog" aria-modal="true" aria-labelledby="caseTitle">
  <div class="case-bar"><div class="wrap">
    <button class="case-back" id="caseBack">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 10H4M9 5l-5 5 5 5"/></svg>
      <span data-text="ndaPage.back"></span>
    </button>
  </div></div>
  <div id="caseContent"></div>
</div>`);
}
/* Разделы, которых нет на этой странице (на Тильде у каждой страницы свои тексты), — пустые */
['works', 'nda', 'directions', 'clients', 'about'].forEach(k => { SITE[k] = SITE[k] || {}; });
SITE.works.items = SITE.works.items || []; SITE.nda.items = SITE.nda.items || [];
SITE.directions.items = SITE.directions.items || []; SITE.clients.items = SITE.clients.items || [];
SITE.about.facts = SITE.about.facts || [];
/* Адрес главной: в прототипе index.html, на Тильде — / (задается в общих текстах) */
const HOME = SITE.homePage || 'index.html';
/* Ведет ли ссылка на эту же страницу: сравниваем адреса без index.html и .html */
const pathOf = u => new URL(u || location.href, location.href).pathname.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
const samePage = link => pathOf(link.split('#')[0] || location.href) === pathOf();
/* Из пары ['формально', 'по-дружески'] берем нужную строку */
const pick  = v => Array.isArray(v) ? v[isFun() ? 1 : 0] : v;
/* Достать значение из content.js по пути вида 'hero.title' */
const get   = path => path.split('.').reduce((o, k) => o == null ? o : o[k], SITE);


/* ================================================================
   ТИПОГРАФ — правила «Ководства» Артемия Лебедева
   ================================================================ */
const SHORT = 'без|для|изо|над|под|про|при|что|как|или|его|уже|все|это|чем|где|кто|еще|так|нет|над';

function typograf(input){
  let s = String(input ?? '');
  // точка разделяет предложения; если предложение одно, точка в конце не нужна (многоточие не трогаем)
  if (!/[.!?…](?=\s+["«„(]?[A-ZА-ЯЁ0-9])/.test(s.trim())) s = s.replace(/(?<!\.)\.\s*$/, '');
  s = s.replace(/…/g, '...');                                  // § 164: многоточие — три точки
  s = s.replace(/(^|[\s (\[—-])"/g, '$1«').replace(/"/g, '»'); // § 104: «елочки»
  s = nestQuotes(s);                                                //         внутри — „лапки“
  s = s.replace(/(\d)\s*[-–—]\s*(?=\d)/g, '$1–');                   // § 158: 60–120
  s = s.replace(/^\s*[-–—]\s+/, '— ');                         // § 97: тире в начале реплики
  s = s.replace(/[ \t]+[-–—][ \t]+/g, ' — ').replace(/[ \t]+[-–—](?=\n)/g, ' —');                        // § 62: тире держится за слово слева
  const shortWord = new RegExp(`(?<=^|[\\s\\u00a0(«„])([а-яёa-z]{1,2}|${SHORT})\\s`, 'gi');
  s = s.replace(shortWord, '$1 ').replace(shortWord, '$1 '); // § 62: предлоги и союзы — к следующему слову
  s = s.replace(/\s(?=(же|ли|ль|бы|б|ж)(?=$|[\s .,!?:;)»]))/gi, ' '); // частицы — к предыдущему
  s = s.replace(/(\d)\s(?=[а-яёa-z%])/gi, '$1 ');             // 60 минут
  // названия брендов не рвутся между строками: MANGO OFFICE, The Ventures Japan, VK Инклюзия
  s = s.replace(/(?<=(?:^|[\s\u00a0«„(])[A-Z][A-Za-z0-9&'’.]*)[ \t]+(?=[A-Z])/g, '\u00a0');
  s = s.replace(/(?<=(?:^|[\s\u00a0«„(])[A-Z]{2,})[ \t]+(?=[А-ЯЁ])/g, '\u00a0');
  // последнее слово абзаца не остается на строке одно: держится за предыдущее (если не слишком длинное для телефона)
  s = s.split('\n').map(l => l.trim().split(/[ \t]+/).length < 4 ? l : l.replace(/[ \t]+(?=[^\s\u00a0]{1,12}\s*$)/, '\u00a0')).join('\n');
  return s;
}
function nestQuotes(s){
  let depth = 0, out = '';
  for (const c of s) {
    if (c === '«') { out += depth ? '„' : '«'; depth++; }
    else if (c === '»') { depth = Math.max(0, depth - 1); out += depth ? '“' : '»'; }
    else out += c;
  }
  return out;
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PR_WIDTH = { '?': '-.5em', '!': '-.3em', '.': '-.26em', ',': '-.26em' };

/* Текст → HTML: разрядка прописных (§ 142), неразрывные слова через дефис,
   висячая пунктуация в начале (§ 120) и в конце центрированной строки (§ 143) */
function toHTML(text, { first = true, center = false } = {}){
  let h = esc(text).replace(/\n/g, '<br>');   // перенос строки: в тексте content.js пишется \n
  // ссылка внутри текста: [слово](https://адрес) — открывается в новой вкладке
  h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a class="link" href="$2" target="_blank" rel="noopener">$1</a>');
  // жирный внутри текста: **слова**
  h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  h = h.replace(/([A-Za-zА-Яа-яЁё0-9]+(?:-[A-Za-zА-Яа-яЁё0-9]+)+)/g, '<span class="nobr">$1</span>');
  h = h.replace(/(^|[^A-Za-zА-Яа-яЁё])([A-ZА-ЯЁ]{2,})(?=$|[^A-Za-zА-Яа-яЁё])/g, '$1<span class="caps">$2</span>');
  if (first) h = h.replace(/^([«„])/, '<span class="hang-q">$1</span>').replace(/^\(/, '<span class="hang-b">(</span>');
  if (center) h = h.replace(/([?!.,])$/, (m, c) => `<span class="pr" style="margin-right:${PR_WIDTH[c]}">${c}</span>`);
  return h;
}
/* Готовая строка из content.js: выбрать версию, обработать типографом, превратить в HTML */
const T = v => toHTML(typograf(pick(v)));


/* ================================================================
   ВЫВОД ТЕКСТОВ
   ================================================================ */
function splitWords(el, text){
  const words = typograf(text).split(' ');
  const center = el.classList.contains('center');
  el.innerHTML = words.map((w, i) =>
    `<span class="w"><span style="--d:${(i * 0.07).toFixed(2)}s">${toHTML(w, { first: i === 0, center: center && i === words.length - 1 })}</span></span>`
  ).join(' ');
}

function renderTexts(){
  $$('[data-text]').forEach(el => {
    let v = pick(get(el.dataset.text));
    if (v == null) return;
    el.hidden = v === '';   // пустая строка — элемента нет (например, подзаголовок в формальной версии)
    if (touch) v = String(v).replace('курсором', 'пальцем');
    if (el.classList.contains('split')) {
      const shown = el.classList.contains('in');
      el.classList.remove('in');
      splitWords(el, v);
      if (shown) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    } else {
      const html = toHTML(typograf(v), { center: el.classList.contains('center') });
      // во flex-контейнере каждый кусок текста стал бы отдельным элементом с отступом — оборачиваем
      el.innerHTML = getComputedStyle(el).display.includes('flex') ? `<span>${html}</span>` : html;
    }
    // слово, которое переливается радугой поверх белого
    if (el.dataset.text === 'hero.subtitle' && SITE.hero.iris)
      el.innerHTML = el.innerHTML.replace(SITE.hero.iris, `<span class="iris" data-t="${SITE.hero.iris}">${SITE.hero.iris}</span>`);
  });
  $$('[data-href]').forEach(el => el.href = get(el.dataset.href));
  document.title = pick(isNdaPage ? SITE.ndaPage.pageTitle : isSpeakerPage ? SITE.speaker.pageTitle : isAboutPage ? SITE.about.pageTitle : SITE.pageTitle);
  if (SITE.about.photo) $('#photo').src = SITE.about.photo;
}

function renderLists(){
  $('#nav').innerHTML = SITE.nav.map(n => {
    const here = samePage(n.link);
    return here && !n.link.includes('#')
      ? `<span class="nav-here" aria-current="page">${T(n.text)}</span>`
      : `<a class="link" href="${here ? '#' + n.link.split('#')[1] : n.link}">${T(n.text)}</a>`;
  }).join('');

  $('#facts').innerHTML = SITE.about.facts.map((f, k) =>
    `<div class="fact" data-reveal style="--d:${k * 0.06}s"><span>${T(f.name)}</span><span>${T(f.detail)}</span></div>`).join('');

  // курсы — таким же списком, как награды
  if (SITE.about.courses) $('#courses').innerHTML = SITE.about.courses.map((f, k) =>
    `<div class="fact" data-reveal style="--d:${k * 0.06}s"><span>${T(f.school)}</span><span>${T(f.title)}</span></div>`).join('');

  $('#clients').innerHTML = SITE.clients.items.map((c, k) => {
    const i = c.project ? SITE.works.items.findIndex(w => w.title === c.project) : -1;
    const style = `--d:${(k * 0.03).toFixed(2)}s;${c.color ? `--c:${c.color}` : ''}`;
    const cls = `client${c.color ? ' tinted' : ''}`;
    return i >= 0
      ? `<a class="${cls}" href="${HOME}#case-${i + 1}" target="_blank" data-k="${k}" data-reveal style="${style}">${T(c.name)}</a>`
      : `<span class="${cls}" data-k="${k}" data-reveal style="${style}">${T(c.name)}</span>`;
  }).join('');
  $('#clientsWhat').innerHTML = T(SITE.clients.hint);
  // под клиентами — маленькая строка о том, почему у некоторых нет кейса (элемент создается здесь, разметку менять не нужно)
  const what = document.getElementById('clientsWhat');
  if (what && SITE.clients.noCase) {
    let note = document.getElementById('clientsNote');
    if (!note) { note = document.createElement('p'); note.id = 'clientsNote'; note.className = 'clients-note'; what.after(note); }
    note.innerHTML = T(SITE.clients.noCase);
  }

  $('#contactLinks').innerHTML = SITE.contact.links.map((l, k) =>
    `<a class="btn ${k === 0 ? 'btn-accent' : 'btn-line'} big-btn${k === 0 ? ' tease' : ''}" href="${l.link}"><span class="spell">${T(l.text)}</span><span class="arr">→</span></a>`).join('');

  renderPodcast();
  renderAboutExtras();
  renderSpeaker();
  renderNdaPage();
  if (SITE.game) renderGame(gameOver ? $('.ttt-status').textContent : SITE.game.yourTurn);

  renderDirections();
  renderWorks();
  renderNda();
  spellOut();
  watchReveals(document, true);
}


/* ================================================================
   ТЕКСТ ПО БУКВАМ
   Подписи кнопок и короткие заголовки разбираются на буквы:
   кнопки проявляются буква за буквой, а при наведении по тексту
   пробегает волна. Слова не разрываются при переносе.
   ================================================================ */
const SPELL = '.btn > span[data-text], .spell, .dir h3, .work h3, .nda-item h3, .nda-item .tag, .case-next .case-title, .client, .h2, .clients-title';
function spellOut(scope = document){
  scope.querySelectorAll(SPELL).forEach(el => {
    if (el.querySelector('.ch')) return;
    const label = el.textContent;
    let i = 0;
    const walk = node => [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/( )/).forEach(part => {
          if (!part) return;
          if (part === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
          const word = document.createElement('span'); word.className = 'wd';
          for (const c of part) {
            const letter = document.createElement('span');
            letter.className = 'ch'; letter.textContent = c; letter.style.setProperty('--i', i++);
            letter.style.setProperty('--r', Math.random().toFixed(2));   // для «дождя» из букв
            word.appendChild(letter);
          }
          frag.appendChild(word);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1) walk(ch);
    });
    walk(el);
    el.setAttribute('aria-label', label);
  });
}


/* ================================================================
   «ОБО МНЕ»: фотографии, статьи, канал
   ================================================================ */
const photo = v => typeof v === 'string' ? { src: v, pos: '50% 50%' } : { pos: '50% 50%', ...v };
function renderAboutExtras(){
  if (SITE.photos) {
    const strip = $('#photoStrip');
    const E = SITE.photos.events;
    if (!isFun() && E && E.items && E.items.length) {
      // серьезная версия: хроника выступлений — несколько фото в ряд, остальные в просмотре
      strip.className = 'photo-strip ev-strip';
      strip.innerHTML = E.items.slice(0, E.first || 4).map((e, k) =>
        `<figure class="ev" data-i="${k}" data-reveal style="--d:${(k * 0.08).toFixed(2)}s;--ar:${e.ratio || 1.5}"><img src="${e.thumb || e.src}" alt="${uesc(pick(e.caption))}" loading="lazy"><figcaption>${T(e.caption)}</figcaption></figure>`).join('')
        + `<p class="ev-more" data-reveal><button type="button" class="link ev-all">${T(E.more)}</button><sup class="yr">${E.items.length}</sup></p>`;
      rotateEvents(strip);
    } else if (isFun() && SITE.photos.dating) {
      // дружеская версия: колода, как в приложении знакомств
      const D = SITE.photos.dating;
      strip.className = 'deck-wrap';
      strip.innerHTML = `<div class="deck" id="deck">${SITE.photos.items.map(photo).map((ph, k) => `
        <div class="swipe-card" data-k="${k}">
          <img src="${ph.funSrc || ph.src}" alt="Дарья Купцова" draggable="false" style="object-position:${ph.funPos || ph.pos}">
          <div class="swipe-info"><b>${T(D.name)}</b><span class="swipe-age">${T(D.age)}</span><p>${T(ph.caption || D.bio)}</p></div>
          <span class="swipe-stamp no">${T(D.no)}</span><span class="swipe-stamp yes">${T(D.yes)}</span>
        </div>`).reverse().join('')}</div>
        <div class="deck-actions">
          <button class="deck-btn no" aria-label="${D.no}"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
          <button class="deck-btn yes" aria-label="${D.yes}"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 19 5 21 8.6 19.6 11.8 17.5 16.4 12 21 12 21z"/></svg></button>
        </div>`;
      setupDeck();
    } else {
      strip.className = 'photo-strip';
      strip.innerHTML = SITE.photos.items.map(photo).map((ph, k) =>
        `<figure class="photo" data-reveal style="--d:${(k * 0.08).toFixed(2)}s"><img src="${ph.src}" alt="Дарья Купцова" loading="lazy" style="object-position:${ph.pos}"></figure>`).join('');
    }
  }
  // строки выступлений и жюри — в том же виде, что статьи; без ссылки строка просто текст
  const row = (r, k) => { const inner = `<span class="article-source">${T(r.source)}</span><span class="article-title">${T(r.title)}</span>`;
    return r.link ? `<a class="article" href="${r.link}" data-reveal style="--d:${(k * 0.05).toFixed(2)}s">${inner}<span class="go">${ARROW}</span></a>`
                  : `<div class="article" data-reveal>${inner}<span></span></div>`; };
  setTimeout(linkTalks, 0);   // после того как тексты встали на место
  if (SITE.articles) $('#articleList').innerHTML = SITE.articles.items.slice(0, SITE.articles.limit || 99).map((a, k) =>
    `<a class="article" href="${a.link}" data-reveal style="--d:${(k * 0.05).toFixed(2)}s"><span class="article-source">${T(a.source)}</span><span class="article-title">${T(a.title)}</span><span class="go">${ARROW}</span></a>`).join('');
  if (SITE.podcast && SITE.podcast.links) $('#podLinks').innerHTML = SITE.podcast.links.map(l => `<a class="link" href="${l.link}">${T(l.text)}</a>`).join('');
}


/* фото по клику открывается на весь экран: картинка плавно вылетает из своего места и туда же возвращается.
   Листать — стрелками на экране или на клавиатуре, закрыть — клик по фону или Esc */
const viewer = document.createElement('div');
viewer.className = 'viewer'; viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-label', 'Фото');
const VIEW_ICON = d => `<svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="${d}"/></svg>`;
viewer.innerHTML = '<img alt="">'
  + '<button class="viewer-close" aria-label="Закрыть">' + VIEW_ICON('M4 4l12 12M16 4L4 16') + '</button>'
  + '<button class="viewer-nav prev" aria-label="Предыдущее фото">' + VIEW_ICON('M12 4l-6 6 6 6') + '</button>'
  + '<button class="viewer-nav next" aria-label="Следующее фото">' + VIEW_ICON('M8 4l6 6-6 6') + '</button>'
  + '<p class="viewer-count"></p>';
document.body.appendChild(viewer);
const viewImg = viewer.querySelector('img');
let viewList = [], viewAt = 0, viewFrom = [];   // viewFrom — картинки на странице, из которых вылетает фото
const viewEase = 'transform .6s cubic-bezier(.2,.8,.2,1)';
function viewRect(el){ return el && el.isConnected ? el.getBoundingClientRect() : null; }
// сдвиг и масштаб, которые ставят открытое фото на место картинки на странице
function viewOffset(r){
  const v = viewImg.getBoundingClientRect();
  if (!r || !v.width) return '';
  return `translate(${r.left + r.width / 2 - (v.left + v.width / 2)}px,${r.top + r.height / 2 - (v.top + v.height / 2)}px) scale(${r.width / v.width})`;
}
let viewCaps = [];
/* В тексте «в профессиональном сообществе» слова про выступления — тихая ссылка:
   при наведении рядом с курсором фото со сцены (по очереди), по нажатию — все фото выступлений */
function linkTalks(){
  const note = document.querySelector('#community .sec-note'), E = SITE.photos && SITE.photos.events;
  if (!note || !E || isFun() || note.querySelector('.ev-link')) return;
  note.innerHTML = note.innerHTML.replace(/(выступаю(?:\s|&nbsp;)+на(?:\s|&nbsp;)+конференциях(?:\s|&nbsp;)+и(?:\s|&nbsp;)+митапах)/, '<span class="ev-link ev-all" role="button" tabindex="0">$1</span>');   // span, а не button: кнопка не переносится внутри строки
}
let talkShown = 0;
document.addEventListener('pointerover', e => {
  const l = e.target.closest && e.target.closest('.ev-link');
  if (!l || touch) return;
  const E = SITE.photos.events;
  showPreviewImage(E.items[talkShown++ % E.items.length].thumb);
});
document.addEventListener('pointerout', e => { if (e.target.closest && e.target.closest('.ev-link')) showPreviewImage(''); });
/* Фото в ленте выступлений сами сменяются: раз в несколько секунд все окошки разом показывают
   новые кадры. Кадры не повторяются, пока не покажутся все; в окошке не бывает два раза подряд одно и то же
   событие, и в одной четверке все события разные. Вертикальное окошко получает только вертикальные фото.
   Пока лента не на экране или включено «уменьшить движение» — стоит */
const EV_ROTATE = 3200;   // как часто меняется четверка, мс
let evTimer = null;
function rotateEvents(strip){
  clearInterval(evTimer);
  const E = SITE.photos.events, slots = [...strip.querySelectorAll('.ev')];
  if (!slots.length || reduced) return;
  const ev = i => pick(E.items[i].caption), tall = i => (E.items[i].ratio || 1.5) < 1;
  const OFTEN = (E.often || []).map(pick), often = i => OFTEN.includes(ev(i));
  let used = new Set(slots.map(s => +s.dataset.i));
  evTimer = setInterval(() => {
    const r = strip.getBoundingClientRect();
    if (document.hidden || !strip.isConnected || r.bottom < 0 || r.top > innerHeight) return;   // лента не на экране — стоим
    const now = slots.map(s => +s.dataset.i), picked = [];
    for (const slot of slots) {
      const cur = +slot.dataset.i;
      const ok = i => tall(i) === tall(cur) && !now.includes(i) && !picked.includes(i)
        && ev(i) !== ev(cur) && !picked.some(j => ev(j) === ev(i));
      // события из often показываются чаще: им можно повторяться и у них четыре шанса вместо одного
      let pool = E.items.map((x, i) => i).filter(i => ok(i) && (!used.has(i) || often(i)));
      if (!pool.some(i => !often(i))) {   // все обычные кадры этого формата показаны — начинаем круг заново
        E.items.forEach((x, i) => { if (tall(i) === tall(cur)) used.delete(i); });
        pool = E.items.map((x, i) => i).filter(ok);
      }
      pool = pool.flatMap(i => often(i) ? [i, i, i, i] : [i]);
      const next = pool.length ? pool[Math.floor(Math.random() * pool.length)] : cur;
      picked.push(next); used.add(next);
    }
    slots.forEach((slot, k) => swapEvent(slot, picked[k], k));
  }, EV_ROTATE);
}
function swapEvent(slot, next, k){
  const item = SITE.photos.events.items[next];
  if (+slot.dataset.i === next) return;
  const old = slot.querySelector('img'), img = new Image();
  img.alt = pick(item.caption); img.className = 'ev-next';
  img.style.setProperty('--k', k);
  img.onload = () => {
    old.after(img); old.classList.add('ev-out'); old.style.setProperty('--k', k);
    requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('on')));
    const cap = slot.querySelector('figcaption'); cap.style.setProperty('--k', k); cap.classList.add('swap');
    setTimeout(() => { cap.innerHTML = T(item.caption); cap.classList.remove('swap'); }, 420 + k * 70);
    setTimeout(() => { old.remove(); img.className = ''; img.style.removeProperty('--k'); slot.dataset.i = next; }, 1100 + k * 70);
  };
  img.src = item.thumb || item.src;
}
/* хроника выступлений: фото в ленте — сразу увеличивается; «все выступления» — плитка всех фото по событиям,
   нажатие на плитку увеличивает фото (листать можно по всем) */
const evGallery = document.createElement('div');
evGallery.className = 'ev-gallery'; evGallery.setAttribute('role', 'dialog'); evGallery.setAttribute('aria-label', 'Все выступления');
document.body.appendChild(evGallery);
function evOpenViewer(i, from){
  const E = SITE.photos.events;
  // в подписи при увеличении — событие и, если есть, с кем (note)
  openViewer(E.items.map(x => x.src), i, from, E.items.map(x => x.note ? `${pick(x.caption)}: ${pick(x.note)}` : x.caption));
}
function openGallery(){
  const E = SITE.photos.events;
  // карточки событий: название и фото этого события рядом; порядок — из events.order
  const groups = [];
  E.items.forEach((x, i) => {
    const c = pick(x.caption);
    let g = groups.find(g => g.c === c);
    if (!g) groups.push(g = { c, list: [] });
    g.list.push(i);
  });
  const order = (E.order || []).map(pick);
  groups.sort((a, b) => (order.indexOf(a.c) + 1 || 99) - (order.indexOf(b.c) + 1 || 99));
  evGallery.innerHTML = `<div class="ev-g-bar"><div class="wrap"><h2 class="ev-g-title">${T(E.more)}<sup class="yr">${E.items.length}</sup></h2>
      <button type="button" class="ev-g-close" aria-label="Закрыть"><svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l12 12M16 4L4 16"/></svg></button></div></div>
    <div class="wrap"><div class="ev-g-flow">${groups.map(g => `<p class="ev-g-head">${T((E.labels || {})[g.c] || g.c)}<sup class="yr">${g.list.length}</sup></p>` + g.list.map((i, n) =>
      `<button type="button" class="ev-g-tile${n ? '' : ' first'}" data-i="${i}" style="--ar:${E.items[i].ratio || 1.5}"><img src="${E.items[i].thumb || E.items[i].src}" alt="${esc(g.c)}" loading="lazy">${n ? '' : `<span class="ev-g-chip">${T((E.labels || {})[g.c] || g.c)}<sup class="yr">${g.list.length}</sup></span>`}</button>`).join('')).join('')}</div></div>`;
  evGallery.scrollTop = 0;
  evGallery.classList.add('open');
  document.body.classList.add('locked');
}
function closeGallery(){ evGallery.classList.remove('open'); document.body.classList.remove('locked'); }
evGallery.addEventListener('click', e => {
  if (e.target.closest('.ev-g-close')) { closeGallery(); return; }
  const t = e.target.closest('.ev-g-tile');
  if (!t) return;
  const from = [];
  evGallery.querySelectorAll('.ev-g-tile').forEach(b => from[+b.dataset.i] = b.querySelector('img'));
  evOpenViewer(+t.dataset.i, from);
});
addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('span.ev-all')) { e.preventDefault(); openGallery(); } });
addEventListener('keydown', e => { if (e.key === 'Escape' && evGallery.classList.contains('open') && !viewer.classList.contains('open')) closeGallery(); });
document.addEventListener('click', e => {
  if (!SITE.photos || !SITE.photos.events) return;
  if (e.target.closest('.ev-all')) { e.preventDefault(); openGallery(); return; }
  const f = e.target.closest('.ev');
  if (!f) return;
  const from = [];
  document.querySelectorAll('.ev img').forEach((img, k) => from[k] = img);
  evOpenViewer(+f.dataset.i, from);
});   // подписи к фото в просмотре (у хроники выступлений)
function viewShow(){
  const count = viewList.length > 1 ? `${viewAt + 1} из ${viewList.length}` : '';
  viewer.querySelector('.viewer-count').innerHTML = viewCaps[viewAt] ? `${T(viewCaps[viewAt])} <span class="viewer-n">${count}</span>` : count;
  viewer.classList.toggle('single', viewList.length < 2);
}
function openViewer(list, k, from, caps){
  viewCaps = caps || [];
  viewList = list; viewAt = k; viewFrom = from || [];
  viewImg.src = list[k]; viewShow();
  const src = viewFrom[k];
  viewImg.style.transition = 'none'; viewImg.style.transform = '';
  viewer.classList.add('fly'); viewer.getBoundingClientRect(); viewer.classList.add('open');   // фон темнеет плавно
  const go = () => {
    const off = viewOffset(viewRect(src));
    if (!off) { viewImg.style.transition = ''; viewer.classList.remove('fly'); return; }
    if (src) src.style.visibility = 'hidden';
    viewImg.style.transform = off;
    viewImg.getBoundingClientRect();   // зафиксировать начальное положение перед полетом
    viewImg.style.transition = viewEase; viewImg.style.transform = '';
  };
  viewImg.complete && viewImg.naturalWidth ? go() : viewImg.addEventListener('load', go, { once: true });
}
function closeViewer(){
  const src = viewFrom[viewAt], off = viewOffset(viewRect(src));
  viewer.classList.remove('open');
  if (off) { viewImg.style.transition = viewEase; viewImg.style.transform = off; }
  setTimeout(() => {
    viewFrom.forEach(el => el && (el.style.visibility = ''));
    viewImg.style.transition = 'none'; viewImg.style.transform = ''; viewer.classList.remove('fly');
  }, 600);
}
function stepViewer(d){
  if (viewList.length < 2) return;
  const old = viewFrom[viewAt];
  viewAt = (viewAt + d + viewList.length) % viewList.length;
  if (old) old.style.visibility = '';
  if (viewFrom[viewAt]) viewFrom[viewAt].style.visibility = 'hidden';
  viewImg.src = viewList[viewAt]; viewShow();
  viewImg.animate([{ opacity: 0, transform: `translateX(${d * 40}px)` }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
viewer.addEventListener('click', e => {
  const nav = e.target.closest('.viewer-nav');
  if (nav) return stepViewer(nav.classList.contains('next') ? 1 : -1);
  closeViewer();
});
// слушаем раньше остальных, чтобы Esc закрывал фото, а не весь кейс
addEventListener('keydown', e => {
  if (!viewer.classList.contains('open')) return;
  if (e.key === 'Escape') { e.stopImmediatePropagation(); closeViewer(); }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') stepViewer(e.key === 'ArrowRight' ? 1 : -1);
}, true);
document.addEventListener('click', e => {
  const f = e.target.closest('.photo');
  if (!f) return;
  const group = [...f.parentElement.querySelectorAll('.photo img')];
  openViewer(group.map(i => i.src), group.indexOf(f.querySelector('img')), group);
});

/* колода: верхнюю карточку тянут курсором или пальцем; дальше — влево, нравится — вправо */
function setupDeck(){
  const deck = $('#deck');
  const top = () => deck.lastElementChild;
  const fly = (card, dir) => {
    card.style.transition = 'transform .5s cubic-bezier(.3,.7,.4,1), opacity .5s';
    card.style.transform = `translate(${dir * 140}%, -10%) rotate(${dir * 28}deg)`;
    card.style.opacity = '0';
    if (dir > 0) joke('match');
    setTimeout(() => {   // карточка уходит под низ колоды — фото листаются по кругу
      card.style.transition = 'none'; card.style.transform = ''; card.style.opacity = '';
      card.classList.remove('like', 'nope');
      deck.prepend(card);
    }, 520);
  };
  let drag = null;
  deck.addEventListener('pointerdown', e => {
    const card = e.target.closest('.swipe-card');
    if (!card || card !== top()) return;
    drag = { card, x: e.clientX, y: e.clientY, dx: 0 };
    card.setPointerCapture(e.pointerId);
    card.style.transition = 'none';
  });
  deck.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.dx = e.clientX - drag.x; const dy = e.clientY - drag.y;
    drag.card.style.transform = `translate(${drag.dx}px, ${dy * 0.3}px) rotate(${drag.dx * 0.06}deg)`;
    drag.card.classList.toggle('like', drag.dx > 40);
    drag.card.classList.toggle('nope', drag.dx < -40);
  });
  const release = () => {
    if (!drag) return;
    const { card, dx } = drag; drag = null;
    if (Math.abs(dx) > 110) fly(card, Math.sign(dx));
    else { card.style.transition = 'transform .4s cubic-bezier(.3,.7,.4,1)'; card.style.transform = ''; card.classList.remove('like', 'nope'); }
  };
  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', release);
  $$('.deck-btn').forEach(b => b.addEventListener('click', () => {
    const card = top(); if (!card) return;
    card.classList.add(b.classList.contains('yes') ? 'like' : 'nope');
    fly(card, b.classList.contains('yes') ? 1 : -1);
  }));
}


/* ================================================================
   СТРАНИЦА NDA (nda.html, на Тильде kupdasha.ru/n_d_a под паролем):
   карточки проектов сеткой, как на главной; карточка открывает кейс.
   Проекты — в SITE.ndaPage.items, поля те же, что у обычных проектов.
   page: 'адрес' — карточка ведет на отдельную страницу вместо кейса
   ================================================================ */
function renderNdaPage(){
  const N = SITE.ndaPage;
  if (!N || !isNdaPage) return;
  $('#ndaProjects').innerHTML = (N.items || []).map((p, k) => {
    // все карточки одного размера и пропорций — сетка по две в ряд (стили .nda-page .works)
    const ratio = p.ratio || '16/9';
    const inner = `
      <span class="media" style="aspect-ratio:${ratio}">${mediaHTML(p)}</span>
      <span class="meta"><span class="ttl"><h3>${T(p.title)}</h3>${yearHTML(p)}</span>${p.tag ? `<span class="tag">${T(p.tag)}</span>` : ''}</span>
      ${p.short ? `<p>${T(p.short)}</p>` : ''}`;
    const cls = 'work';
    // page: '' — отдельной страницы еще нет: карточка видна, но никуда не ведет
    if (p.page === '') return `<div class="${cls} soon" style="cursor:default" data-reveal>${inner}</div>`;
    return p.page
      ? `<a class="${cls}" href="${p.page}" data-reveal>${inner}</a>`
      : `<button class="${cls}" data-k="${k}" data-reveal>${inner}</button>`;
  }).join('');
  $$('#ndaProjects .media').forEach(watchMedia);
}


/* ================================================================
   СТРАНИЦА «ПОЗВАТЬ СПИКЕРОМ»
   ================================================================ */
function renderSpeaker(){
  const S = SITE.speaker;
  if (!S || !isSpeakerPage) return;
  $('#speakerPhoto').src = S.photo;
  $('#speakerMail').href = 'mailto:' + S.email;
  $('#speakerMailText').textContent = S.email;
  $('#topicList').innerHTML = S.topics.map((t, k) => `
    <div class="topic" data-reveal style="--d:${(k * 0.05).toFixed(2)}s">
      <h3>${T(t.title)}</h3>
      <div><p>${T(t.text)}</p>
        <p class="topic-meta"><b>${T(S.whoLabel)}</b> ${T(t.who)}<br><b>${T(S.formatLabel)}</b> ${T(t.format)}</p></div>
    </div>`).join('');
  $('#bioList').innerHTML = S.bio.map((b, k) => `
    <div class="topic" data-reveal style="--d:${(k * 0.05).toFixed(2)}s">
      <h3>${T(b.name)}</h3>
      <div><p class="bio-text">${T(b.text)}</p>
        <button class="btn btn-line copy" data-k="${k}"><span class="spell">${T(S.copy)}</span></button></div>
    </div>`).join('');
  $('#showList').innerHTML = S.shows.map(sh => `
    <div class="show" data-reveal>
      <div class="show-head"><h3>${T(sh.title)}</h3><a class="link" href="${sh.link}">${T(SITE.works.more)}</a></div>
      <div class="photo-strip">${sh.images.map(src => `<figure class="photo"><img src="${src}" alt="" loading="lazy"></figure>`).join('')}</div>
    </div>`).join('');
}
// копировать био одним нажатием — организаторам удобно вставить в анонс
$('#bioList').addEventListener('click', e => {
  const b = e.target.closest('.copy');
  if (!b) return;
  const text = SITE.speaker.bio[+b.dataset.k].text;
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }).finally(() => {
    b.innerHTML = `<span>${T(SITE.speaker.copied)}</span>`;
    setTimeout(() => { b.innerHTML = `<span class="spell">${T(SITE.speaker.copy)}</span>`; spellOut(b); }, 1800);
  });
});


/* ================================================================
   ПЕРЕКЛЮЧАТЕЛЬ ВЕРСИЙ
   ================================================================ */
const sw = $('#switch');
let switchCount = 0;

function setMode(mode, toTop){
  const apply = () => {
    root.classList.add('switching');   // без плавных переходов: фон сразу нужной версии
    root.dataset.theme = mode;
    document.querySelectorAll('.switch').forEach(s => s.setAttribute('aria-checked', mode === 'dark'));
    if (toTop) scrollTo({ top: 0, behavior: 'instant' });
    if (mode !== 'dark') { $('#toasts').innerHTML = ''; pendingJoke = null; }   // шутки остаются в дружеской версии
    renderTexts(); renderLists();
    if (caseIndex != null) renderCase(caseIndex, true);
    try { localStorage.setItem('kd-mode', mode); } catch (e) {}
    dispatchEvent(new CustomEvent('theme:apply'));   // перелив первого экрана перерисовывается сразу
    setTimeout(() => root.classList.remove('switching'), 900);
  };
  if (!document.startViewTransition || reduced) { apply(); afterSwitch(mode); return; }
  // новая версия опускается сверху, как штора, которую задернули
  const t = document.startViewTransition(apply);
  t.updateCallbackDone.catch(() => {});
  t.ready.then(() => root.animate(
    { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0 0)'] },
    { duration: 750, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' }
  )).catch(() => {});
  t.finished.catch(() => {}).then(() => afterSwitch(mode));
}
function afterSwitch(mode){
  dispatchEvent(new CustomEvent('shimmer:ripple'));
  if (mode === 'dark') setTimeout(() => joke('enter'), 300);
  else $('#toasts').innerHTML = '';
  if (++switchCount > 4) joke('spam');
}
/* «Подмигивание»: пока переключателем не пользовались, ползунок
   время от времени выглядывает на другую сторону, а снизу всплывает подсказка */
let switchSeen = false;
try { switchSeen = localStorage.getItem('kd-switch-seen') === '1'; } catch (e) {}
sw.classList.toggle('unseen', !switchSeen);
let nudges = 0;
function nudge(){
  if (switchSeen || isFun() || reduced || caseIndex != null) return;
  sw.classList.remove('nudge'); void sw.offsetWidth; sw.classList.add('nudge');
  setTimeout(() => sw.classList.remove('nudge'), 2600);
  if (++nudges < 5) setTimeout(nudge, 9000);
}
setTimeout(nudge, 2400);

// тумблеров может быть несколько: в шапке и в ярком блоке «Обо мне» (он еще и возвращает наверх)
document.querySelectorAll('.switch').forEach(s => s.addEventListener('click', e => {
  switchSeen = true;
  sw.classList.remove('unseen', 'nudge');
  try { localStorage.setItem('kd-switch-seen', '1'); } catch (e) {}
  setMode(isFun() ? 'light' : 'dark', true);   // после переключения — сразу наверх, к первому экрану
}));


/* ================================================================
   НАПРАВЛЕНИЯ СО СТРУНАМИ
   Линии между строками — струны: если провести курсором сквозь
   линию, она цепляется, тянется за курсором и, сорвавшись, дрожит.
   ================================================================ */
const TRAIL = ['#F3E94A', '#7DE36A', '#3FD3C9', '#4F7BF2', '#A65BEF', '#E85BD0'];   // цвета шлейфа (без оранжевого)
const STRING_HTML = `<div class="string"><svg preserveAspectRatio="none">${TRAIL.map((c, j) =>
  `<path class="ghost" style="--gc:${c};--go:${(1 - j / TRAIL.length * 0.8).toFixed(2)}"/>`).join('')}<path class="line"/></svg></div>`;
const ARROW = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>';
let strings = [];
let plucks = 0;

function renderDirections(){
  $('#dirList').innerHTML = STRING_HTML + SITE.directions.items.map(d => `
    <a class="dir" href="${d.cat ? '#works' : d.link}"${d.cat ? ` data-cat="${d.cat}"` : ''}>
      <h3>${T(d.name)}</h3><p>${T(d.text)}</p><span class="go">${ARROW}</span>
    </a>${STRING_HTML}`).join('');
  collectStrings();
}
/* струны — между строками направлений и между строками «других работ» (в веселой версии) */
function collectStrings(){
  strings = $$('#otherList .string, #dirList .string').map(el => ({
    el, svg: el.querySelector('svg'), line: el.querySelector('.line'), ghosts: [...el.querySelectorAll('.ghost')], hist: [],
    amp: 0, vel: 0, at: 0.5, held: false, prev: null, w: 0,
  }));
  layoutStrings();
}
$('#dirList').addEventListener('click', e => {
  const d = e.target.closest('.dir[data-cat]');
  if (!d) return;
  e.preventDefault();
  setFilter(d.dataset.cat);
  $('#works').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
});
function layoutStrings(){
  strings.forEach(s => {
    s.w = s.el.getBoundingClientRect().width;
    s.svg.setAttribute('viewBox', `0 -60 ${s.w} 120`);
    drawString(s);
  });
}
function drawString(s){
  const W = s.w, px = Math.min(Math.max(s.at, 0.02), 0.98) * W, N = 48;
  if (!W) return;   // блок скрыт (в серьезной версии направлений на главной нет)
  let d = 'M0 0';
  for (let i = 1; i <= N; i++) {
    const x = (i / N) * W;
    const shape = x < px ? Math.sin((x / px) * Math.PI / 2) : Math.sin(((W - x) / (W - px)) * Math.PI / 2);
    d += ` L${x.toFixed(1)} ${(s.amp * shape).toFixed(2)}`;
  }
  s.line.setAttribute('d', d);
  // шлейф: каждая следующая радужная линия повторяет форму струны на несколько кадров раньше
  s.hist.unshift(d); if (s.hist.length > s.ghosts.length * 3 + 1) s.hist.length = s.ghosts.length * 3 + 1;
  s.ghosts.forEach((g, j) => g.setAttribute('d', s.hist[Math.min(s.hist.length - 1, (j + 1) * 3)]));
  // сила колебания — для радужного света в дружеской версии
  s.el.style.setProperty('--amp', Math.min(1, Math.abs(s.amp) / TUNE.stringPull).toFixed(3));
}
/* сорвавшаяся струна сообщает об этом — в дружеской версии fun.js играет ноту */
function pluck(s, power){
  dispatchEvent(new CustomEvent('string:pluck', { detail: { k: strings.indexOf(s), power: Math.min(1, Math.max(0.25, power)) } }));
}
let pointerX = null, pointerY = null;
function feelStrings(x, y){
  if (reduced || x == null) return;
  for (const s of strings) {
    const r = s.el.getBoundingClientRect();
    const dy = y - r.top;
    const inside = x > r.left && x < r.right;
    const at = (x - r.left) / r.width;
    if (s.held) {
      if (!inside || Math.abs(dy) > TUNE.stringPull) {
        s.held = false; s.el.classList.remove('live');
        pluck(s, Math.abs(s.amp) / TUNE.stringPull);
      }
      else { s.amp = dy; s.at = at; s.vel = 0; }
    } else if (inside && s.prev != null && Math.sign(dy) !== Math.sign(s.prev) && Math.abs(dy - s.prev) < 400) {
      s.at = at;
      if (Math.abs(dy) < TUNE.stringPull) { s.held = true; s.amp = dy; s.el.classList.add('live'); }
      else { s.amp = Math.sign(dy) * TUNE.stringPull * 0.6; pluck(s, 0.6); }
      if (++plucks === 12) joke('strings');
    }
    s.prev = inside ? dy : null;
  }
}
addEventListener('pointermove', e => { pointerX = e.clientX; pointerY = e.clientY; feelStrings(pointerX, pointerY); }, { passive: true });
// при прокрутке струна сама проезжает под курсором — и тоже цепляется
addEventListener('scroll', () => feelStrings(pointerX, pointerY), { passive: true });
document.addEventListener('pointerleave', () => { pointerX = pointerY = null; });
(function tickStrings(){
  for (const s of strings) {
    if (s.held) { drawString(s); continue; }
    if (Math.abs(s.amp) < 0.05 && Math.abs(s.vel) < 0.05) { if (s.amp) { s.amp = 0; drawString(s); } continue; }
    s.vel = (s.vel - TUNE.stringStiff * s.amp) * TUNE.stringDamping;
    s.amp += s.vel;
    drawString(s);
  }
  requestAnimationFrame(tickStrings);
})();


/* ================================================================
   ПРОЕКТЫ И ВИДЕОПРЕВЬЮ
   ================================================================ */
const SIZE = { 'маленький': 's', 'средний': 'm', 'большой': 'l' };

/* Видео и презентации: файл mp4 или ролик с площадки — 'vimeo:ID' (или 'vimeo:ID/ключ'), 'vk:OID_ID',
   'kinescope:ID', 'rutube:ID', 'drive:ID' (Google Диск, в том числе PDF) */
function parseMedia(v){
  if (!v) return null;
  const m = /^(vimeo|vk|kinescope|rutube|drive):(.+)$/.exec(v);
  if (m) return { type: m[1], id: m[2] };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(v)) return { type: 'file', src: v };
  return { type: 'image', src: v };
}
/* адрес проигрывателя; preview — тихий фон для карточки, без кнопок */
function embedURL(m, preview){
  switch (m.type) {
    case 'vimeo': {   // 'vimeo:ID' или 'vimeo:ID/ключ' для ролика по ссылке
      const [vid, h] = m.id.split('/'), base = `https://player.vimeo.com/video/${vid}?${h ? 'h=' + h + '&' : ''}`;
      return preview ? base + 'background=1&muted=1&loop=1&autopause=0&dnt=1&quality=540p'   // превью легче — грузится быстрее
                     : base + 'autoplay=1&muted=1&loop=1&dnt=1&title=0&byline=0&portrait=0';
    }
    case 'vk': { const [oid, id] = m.id.split(/_(?=\d+$)/); return `https://vkvideo.ru/video_ext.php?oid=${oid}&id=${id}&hd=2${preview ? '' : '&autoplay=1'}`; }
    case 'kinescope': return `https://kinescope.io/embed/${m.id}${preview ? '?autoplay=true&muted=true&loop=true&controls=false' : ''}`;   // Kinescope понимает только true/false: с muted=1 звук не выключается и браузер не дает ролику стартовать
    case 'rutube': return `https://rutube.ru/play/embed/${m.id}`;
    case 'drive': return `https://drive.google.com/file/d/${m.id}/preview`;
  }
  return '';
}
const FRAME_ALLOW = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write';
const legacyVideo = p => p.video || (p.vimeo ? 'vimeo:' + p.vimeo : '');

/* Превью проекта в сетке: картинка; поверх — тихое видео (mp4, Vimeo или Kinescope).
   Если картинки нет — сам проигрыватель площадки с его обложкой */
function mediaHTML(p){
  // preview — отдельный легкий ролик для сетки (mp4), если основное видео на площадке, которая не умеет тихий повтор
  const m = parseMedia(p.preview || legacyVideo(p));
  // thumb — легкая копия обложки для карточек (сетка, «следующий проект»); в шапке кейса остается полная image
  // listPreview-картинка (не ролик) — главная обложка проекта и для «следующего проекта», если она задана
  const cover = (p.listPreview && !/\.mp4(\?|$)/.test(p.listPreview) ? p.listPreview : '') || p.thumb || p.image;
  const img = cover ? `<img src="${cover}" alt="" loading="lazy" decoding="async"${p.pos ? ` style="object-position:${p.pos}"` : ''}>` : '';
  // ролик подгружается, только когда до карточки остается экран; до этого видна обложка
  // hover: true — ролик стоит на обложке и играет, только пока курсор над карточкой
  // под роликом — обычная картинка-обложка: видна всегда, даже если ролик еще не загрузился или браузер его не запустил
  if (m && m.type === 'file') return img + `<video muted loop playsinline preload="none" ${cover ? `poster="${cover}"` : ''} data-src="${m.src}"${p.hover ? ' data-hover' : ''}></video>`;
  // still: true — в сетке только статичная обложка, без ролика
  if (p.still && img) return img;
  if (m && (m.type === 'vimeo' || m.type === 'kinescope')) return img + `<iframe data-src="${embedURL(m, true)}"${p.ratio ? ` style="--vr:${p.ratio}"` : ''} allow="autoplay" tabindex="-1" aria-hidden="true"></iframe>`;
  if (img) return img;
  if (m && m.type !== 'image') return `<iframe class="still" data-src="${embedURL(m, true)}" allow="${FRAME_ALLOW}" tabindex="-1" aria-hidden="true"></iframe>`;
  return '';
}

/* Сетка раскладывается сама, если у проекта не указаны size и side */
const PATTERN = [['большой', 'слева'], ['маленький', 'слева'], ['средний', 'справа'], ['большой', 'справа'], ['средний', 'слева'], ['маленький', 'справа']];
let workFilter = SITE.works.startFilter ?? 'дизайн';   // какая категория выбрана при открытии страницы
/* проект может быть в нескольких категориях: cat: ['продакшен', '3D'] */
/* «другие работы»: other: true — внизу списком; promote: ['3D'] — но в этой категории крупной карточкой */
const isOther = p => p.other && !(workFilter && [].concat(p.promote || []).includes(workFilter));
const inCat = p => !workFilter || [].concat(p.cat).includes(workFilter);
/* год проекта — маленькой цифрой рядом с названием */
const yearHTML = p => p.year ? `<sup class="yr">${T(p.year)}</sup>` : '';
function renderWorks(){
  const W = SITE.works;
  // фильтры: над проектами и еще раз в самом конце, под «другими работами»
  const chips = (W.filters || []).map(f =>
    `<button class="chip${f.key === workFilter ? ' on' : ''}" data-cat="${f.key}">${T(f.text)}</button>`).join('');
  $('#workFilters').innerHTML = chips;
  $('#workFiltersEnd').innerHTML = chips;
  // «другие работы» из одного проекта не показываем: такой проект встает в общую сетку
  let other = W.items.map((p, k) => [p, k]).filter(([p]) => isOther(p) && inCat(p));
  const solo = other.length === 1 ? other[0][0] : null;
  if (solo) other = [];
  let n = 0;
  $('#workList').innerHTML = W.items.map((p, k) => {
    if ((isOther(p) && p !== solo) || !inCat(p)) return '';
    const [size, side] = p.size ? [p.size, p.side] : PATTERN[n % PATTERN.length];
    n++;
    // cardRatio — пропорции карточки в сетке, когда превью нужно показать целиком, а обложка кейса другая
    const ratio = p.cardRatio || p.ratio || (legacyVideo(p) || size === 'большой' ? '16/9' : '16/10');   // у видео всегда 16:9
    return `
    <button class="work ${SIZE[size] || 'm'} ${side === 'справа' ? 'right' : ''}" data-k="${k}" data-reveal${p.cardWidth ? ` style="--cw:${p.cardWidth}"` : ''}>
      <span class="media${p.cardRatio ? ' whole' : ''}" style="aspect-ratio:${ratio}">${mediaHTML(p)}${p.wip ? `<span class="work-wip">${T(W.wip)}</span>` : ''}</span>
      <span class="meta"><span class="ttl"><h3>${T(p.title)}</h3>${yearHTML(p)}</span>${p.tag ? `<span class="tag">${T(p.tag)}</span>` : ''}</span>
      ${p.short ? `<p>${T(p.short)}</p>` : ''}
    </button>`;
  }).join('');
  $$('#workList .media').forEach(watchMedia);
  // «другие работы» — простым списком под сеткой (фильтры под ним остаются всегда)
  $('#otherWorks').hidden = !other.length;
  // между строками — струны: в серьезной версии это просто линии, в веселой они звенят и светятся радугой
  $('#otherList').innerHTML = STRING_HTML + other.map(([p, k]) =>
    `<button class="article" data-k="${k}"><span class="article-source">${T(p.tag || [].concat(p.cat)[0])}</span><span class="article-title">${T(p.title)}${yearHTML(p)}${p.wip ? `<span class="work-wip">${T(SITE.works.wip)}</span>` : ''}</span><span class="go">${ARROW}</span></button>${STRING_HTML}`).join('');
  collectStrings();
  dispatchEvent(new CustomEvent('strings:rendered'));
}
function setFilter(cat){
  workFilter = cat;
  renderWorks();
  spellOut($('#workList'));
  watchReveals($('#workList'), true);
  watchReveals($('#otherWorks'), true);   // строки «других работ» тоже проявляются заново, иначе остаются невидимыми
  dispatchEvent(new CustomEvent('works:rendered'));
}
$('#workFilters').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) setFilter(c.dataset.cat); });
// нижние фильтры возвращают наверх, к заголовку проектов
$('#workFiltersEnd').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  setFilter(c.dataset.cat);
  const top = $('#works').getBoundingClientRect().top + scrollY - 80;
  scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
});
// «другие работы» открываются кодом, а не ссылкой: на Тильде ссылки с # перехватывает ее прокрутка
$('#otherList').addEventListener('click', e => { const w = e.target.closest('[data-k]'); if (w) openInTab(w.dataset.k); });
// превью при наведении на строку «других работ» — как у клиентов на «Обо мне»
$('#otherList').addEventListener('pointerover', e => {
  const w = e.target.closest('[data-k]'); const p = w && SITE.works.items[+w.dataset.k];
  showPreviewImage(p && previewOf(p));
});
$('#otherList').addEventListener('pointerleave', () => showPreviewImage(''));

/* Видео играет, только пока проект на экране; Vimeo грузится при первом показе */
const mediaSizer = new ResizeObserver(es => es.forEach(e => {
  e.target.style.setProperty('--pw', e.contentRect.width + 'px');
  e.target.style.setProperty('--ph', e.contentRect.height + 'px');
}));
const mediaWatcher = new IntersectionObserver(es => es.forEach(e => {
  const video = e.target.querySelector('video'), frame = e.target.querySelector('iframe[data-src]');
  if (video) {
    if (e.isIntersecting && !video.src && video.dataset.src) video.src = video.dataset.src;
    if (!('hover' in video.dataset)) e.isIntersecting ? video.play().catch(() => {}) : video.pause();
  }
  if (frame && e.isIntersecting && !frame.src) {
    frame.addEventListener('load', () => setTimeout(() => frame.classList.add('ready'), 600), { once: true });
    frame.src = frame.dataset.src;
  }
}), { threshold: 0.15 });
// видео площадок начинают грузиться заранее, за экран до появления, — к прокрутке они уже готовы
const framePreloader = new IntersectionObserver(es => es.forEach(e => {
  const vid = e.target.querySelector('video[data-src]');
  if (e.isIntersecting && vid && !vid.src) { vid.src = vid.dataset.src; vid.preload = 'auto'; }
  const frame = e.target.querySelector('iframe[data-src]');
  if (!e.isIntersecting || !frame || frame.src) return;
  frame.addEventListener('load', () => setTimeout(() => frame.classList.add('ready'), 600), { once: true });
  frame.src = frame.dataset.src;
}), { rootMargin: '100% 0px' });
function watchMedia(el){ mediaSizer.observe(el); mediaWatcher.observe(el); framePreloader.observe(el); }
// ролик пошел — картинка-обложка под ним прячется (в светлой версии ролик умножается на фон, и она бы просвечивала);
// ролик сброшен (у data-hover при уходе курсора) — обложка снова видна
document.addEventListener('playing', e => { if (e.target.matches?.('.media video')) e.target.parentElement.classList.add('vplay'); }, true);
document.addEventListener('emptied', e => { if (e.target.matches?.('.media video')) e.target.parentElement.classList.remove('vplay'); }, true);
// ролики с data-hover: курсор над карточкой — играет с начала, ушел — снова обложка
document.addEventListener('pointerover', e => {
  if (e.pointerType === 'touch') return;
  const card = e.target.closest('.work, .case-next'), v = card && card.querySelector('video[data-hover]');
  if (!v || v._on) return;
  v._on = true;
  if (!v.src && v.dataset.src) v.src = v.dataset.src;
  v.play().catch(() => {});
  const leave = ev => {
    if (card.contains(ev.relatedTarget)) return;
    card.removeEventListener('pointerout', leave);
    v._on = false; v.pause(); v.currentTime = 0; v.load();   // load — снова показать обложку-постер
  };
  card.addEventListener('pointerout', leave);
});

/* Кружок «смотреть» едет за курсором над обложкой проекта */
const lookCursor = document.createElement('div');
lookCursor.className = 'look-cursor'; lookCursor.setAttribute('aria-hidden', 'true');
document.body.appendChild(lookCursor);
if (!touch) {
  addEventListener('pointermove', e => {
    const over = !!e.target.closest?.('.work .media');
    if (over && !lookCursor.classList.contains('show')) lookCursor.innerHTML = `<span>${T(SITE.works.cursor || 'смотреть')}</span>`;
    lookCursor.classList.toggle('show', over);
    lookCursor.style.translate = `${e.clientX}px ${e.clientY}px`;
  }, { passive: true });
}
/* Кейс открывается в новой вкладке; в ней сразу показан кейс, «все работы» ведут на главную */
const openInTab = k => window.open(location.pathname + location.search + '#case-' + (+k + 1), '_blank');
/* На странице NDA кейс открывается в той же вкладке: пароль Тильды живет только в текущей вкладке,
   новая попросила бы его снова. «Назад» возвращает к карточкам */
$('#ndaProjects').addEventListener('click', e => {
  const w = e.target.closest('button.work');
  if (!w) return;
  history.pushState(null, '', '#case-' + (+w.dataset.k + 1));
  openedByClick = true;
  openCase(+w.dataset.k);
});
$('#workList').addEventListener('click', e => {
  const w = e.target.closest('.work');
  if (w) openInTab(w.dataset.k);
});


/* ================================================================
   КЛИЕНТЫ: имена увеличиваются рядом с курсором,
   ближайшее подсвечивается, внизу — что для него сделано
   ================================================================ */
let activeClient = null;
function setClient(k){
  if (k === activeClient) return;
  activeClient = k;
  $$('#clients .client').forEach(el => el.classList.toggle('on', +el.dataset.k === k));
  const c = SITE.clients.items[k];
  if (!c || !c.what) { $('#clientsWhat').innerHTML = T(SITE.clients.hint); return; }
  $('#clientsWhat').innerHTML = `${T(c.name)} — ${T(c.what)}` + (c.project ? `<span class="client-open">${T(SITE.clients.open)} →</span>` : '');
}
/* превью проекта рядом с курсором, пока он над именем клиента */
const clientPreview = document.createElement('div');
clientPreview.className = 'client-preview'; clientPreview.setAttribute('aria-hidden', 'true');
document.body.appendChild(clientPreview);
// listPreview — свое превью для строки «других работ» (картинка или тихий ролик mp4); иначе легкая копия обложки
const previewOf = w => { const m = parseMedia(legacyVideo(w)); return w.listPreview || w.thumb || w.image || (m && m.type === 'drive' ? `https://drive.google.com/thumbnail?id=${m.id}&sz=w800` : ''); };
function showPreviewImage(img){
  clientPreview.classList.toggle('show', !!img);
  if (img && clientPreview.dataset.src !== img) {
    clientPreview.dataset.src = img;
    clientPreview.classList.toggle('square', /\.mp4(\?|$)/.test(img));
    clientPreview.innerHTML = /\.mp4(\?|$)/.test(img) ? `<video src="${img}" muted loop playsinline autoplay preload="auto"></video>` : `<img src="${img}" alt="">`;
  }
}
function showClientPreview(c){
  const w = c && c.project && SITE.works.items.find(x => x.title === c.project);
  showPreviewImage(w && previewOf(w));
}
addEventListener('pointermove', e => {
  if (!clientPreview.classList.contains('show')) return;
  clientPreview.style.translate = `${Math.min(innerWidth - 300, e.clientX + 24)}px ${Math.min(innerHeight - 220, e.clientY + 24)}px`;
}, { passive: true });
$('#clients').addEventListener('pointermove', e => {
  let best = null, bestD = Infinity;
  $$('#clients .client').forEach(el => {
    const r = el.getBoundingClientRect();
    const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    const f = Math.max(0, 1 - d / 260);
    el.style.setProperty('--s', reduced ? 1 : (1 + 0.32 * f * f).toFixed(3));
    if (d < bestD) { bestD = d; best = +el.dataset.k; }
  });
  setClient(best);
  // превью — только того клиента, чье имя прямо под курсором (подсветка соседей не путает картинку)
  const hit = e.target.closest('.client');
  showClientPreview(hit ? SITE.clients.items[+hit.dataset.k] : null);
});
$('#clients').addEventListener('pointerleave', () => {
  showClientPreview(null);
  $$('#clients .client').forEach(el => el.style.setProperty('--s', 1));
  setClient(null);
});


/* ================================================================
   ПОДКАСТ: обложка с кнопкой, по клику — плеер VK Видео
   ================================================================ */
const PLAY = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
let podIndex = 0, podPlaying = false;
function renderPodcast(){
  const P = SITE.podcast;
  if (!P) return;   // подкаста на этой странице нет
  $('#podList').innerHTML = P.episodes.map((ep, k) =>
    `<button class="ep ${k === podIndex ? 'on' : ''}" data-k="${k}"><span>${T(ep.title)}</span><span class="ep-time">${ep.time}</span></button>`).join('');
  if (!podPlaying) showCover();
}
function showCover(){
  const ep = SITE.podcast.episodes[podIndex];
  $('#podPlayer').innerHTML = `<img src="${ep.cover}" alt="${ep.title}" loading="lazy"><span class="pod-play">${PLAY}</span>`;
}
function playEpisode(k){
  const P = SITE.podcast, ep = P.episodes[k];
  podIndex = k; podPlaying = true;
  $('#podPlayer').innerHTML = `<iframe src="https://vkvideo.ru/video_ext.php?oid=${P.owner}&id=${ep.id}&hd=2&autoplay=1" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock" allowfullscreen></iframe>`;
  $$('#podList .ep').forEach(b => b.classList.toggle('on', +b.dataset.k === k));
}
$('#podPlayer').addEventListener('click', () => { if (!podPlaying) playEpisode(podIndex); });
$('#podList').addEventListener('click', e => { const b = e.target.closest('.ep'); if (b) playEpisode(+b.dataset.k); });


/* ================================================================
   ПРОЕКТЫ ПОД NDA
   Видны только названия; превью — размытые пятна цветов проекта
   или настоящая картинка, размытая до неузнаваемости.
   ================================================================ */
const LOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9zm3 4a2 2 0 0 1 1 3.7V19h-2v-1.3A2 2 0 0 1 12 14z"/></svg>';

function renderNda(){
  const N = SITE.nda;
  $('#ndaList').innerHTML = N.items.map((p, k) => {
    const cols = (p.colors || ['#EAECF0', '#D4D5D9', '#80858E', '#D4D5D9']).join(',');
    // обложка — текучие волны цветов проекта (waves.js), как перелив на первом экране
    const picture = p.image ? `<img src="${p.image}" alt="" loading="lazy">` : `<span class="waves" data-waves data-speed="1.1" data-scroll data-colors="${cols}"></span>`;
    return `<a class="nda-item" href="${N.link}" data-reveal style="--d:${(k % 2) * 0.1}s">
      <span class="nda-media">${picture}<span class="nda-lock">${LOCK}</span></span>
      <span class="meta"><h3>${T(p.title)}</h3>${p.tag ? `<span class="tag">${T(p.tag)}</span>` : ''}</span>
    </a>`;
  }).join('');
  // еще ряд закрытых карточек, уходящих под градиент
  const ghosts = ['#EEF8F1,#D4F0DE,#BFE7CF,#E2F3E0', '#FBF0F8,#F3D9EC,#EAC8E3,#F0E0F5', '#F7FBE6,#EAF5C2,#DDEFA6,#E3F3D2', '#EEF0FE,#D9DDFB,#C6CCF8,#E4DAF8'];   // пастельные, как у карточек выше
  $('#ndaMore').innerHTML = Array.from({ length: N.more || 0 }, (_, k) =>
    `<a class="nda-ghost" href="${N.link}" aria-hidden="true" tabindex="-1">
      <span class="nda-media"><span class="waves" data-waves data-speed="1.1" data-scroll data-colors="${ghosts[k % ghosts.length]}"></span><span class="nda-lock">${LOCK}</span></span>
      <span class="meta"><h3>${T(N.hidden)}</h3></span>
    </a>`).join('');
}


/* ================================================================
   СТРАНИЦА КЕЙСА (верстка как у ONY)
   Заголовок → превью во всю ширину экрана → абзацы в правой колонке
   чередуются с макетами на всю ширину → следующий проект.
   Адрес кейса — #case-1, #case-2..., поэтому работает кнопка «назад».
   ================================================================ */
const caseEl = $('#case'), caseContent = $('#caseContent');
let caseIndex = null, openedByClick = false;
/* на странице NDA кейсы берутся из ее списка, на главной — из проектов */
const caseItems = () => isNdaPage ? SITE.ndaPage.items || [] : SITE.works.items;

function shotHTML(src){
  const m = parseMedia(src);
  if (m.type === 'image') return `<div class="case-shot" data-reveal><img src="${m.src}" alt="" loading="lazy"></div>`;
  if (m.type === 'file') return `<div class="case-shot" data-reveal><video src="${m.src}" muted loop playsinline autoplay controls></video></div>`;
  return `<div class="case-shot frame ${m.type}" data-reveal><iframe src="${embedURL(m, false).replace('&autoplay=1', '').replace('autoplay=1&', '')}" allow="${FRAME_ALLOW}" allowfullscreen loading="lazy"></iframe></div>`;
}
function heroHTML(p){
  // heroVideo — тихий ролик в шапке вместо основного (основной тогда стоит в галерее, см. Ростех)
  // heroImage без heroVideo — в шапке картинка, даже если у проекта есть ролик (он тогда в галерее и задает пропорции карточки, см. Ростех)
  const m = p.heroImage && !p.heroVideo ? null : parseMedia(p.heroVideo || legacyVideo(p));
  // heroSound — ролик со звуком и кнопками управления, запускается по нажатию (см. музыкальный клип)
  if (m && m.type === 'file' && p.heroSound) return `<video class="hero-full" src="${m.src}" ${p.image ? `poster="${p.image}"` : ''} controls preload="metadata" playsinline></video>`;
  if (m && m.type === 'file') return `<video src="${m.src}" ${p.image ? `poster="${p.image}"` : ''} muted loop playsinline autoplay></video>`;
  // heroImage — своя картинка в шапке кейса, если она отличается от обложки в сетке;
  // heroRatio — шапка в пропорциях картинки: целиком и без увеличения, карточка в сетке не меняется (см. СДВГ)
  const himg = p.heroImage || p.image;
  const poster = himg ? `<img src="${himg}" alt=""${p.pos && !p.heroImage ? ` style="object-position:${p.pos}"` : ''}>` : '';
  // Vimeo запускается сам поверх обложки; тяжелые плееры (Rutube, VK, Kinescope) грузятся по нажатию —
  // до этого видна обложка с кнопкой, и кейс открывается сразу
  if (m && m.type === 'vimeo') return poster + `<iframe class="hero-frame" src="${embedURL(m, false)}" allow="${FRAME_ALLOW}" allowfullscreen onload="setTimeout(()=>this.classList.add('ready'),400)"></iframe>`;
  if (m && m.type !== 'image' && m.type !== 'drive' && p.image)
    return poster + `<button class="hero-play" data-src="${embedURL(m, false)}${m.type === 'rutube' ? '?autoplay=1' : m.type === 'kinescope' ? '?autoplay=1' : ''}" aria-label="Смотреть видео"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>`;
  if (m && m.type !== 'image') return `<iframe src="${embedURL(m, false)}" allow="${FRAME_ALLOW}" allowfullscreen></iframe>`;
  return poster;
}

/* ================================================================
   ЖИВОЙ БЛОК «ЛОГОТИП И ЦВЕТА» в кейсе (поле brandkit у проекта)
   ================================================================ */
// знак: градиент рисуется CSS-ом и вырезается по контуру знака (маска)
function brandMark(b, mono){
  const mask = `url(&quot;data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${b.view[1]} ${b.view[1]}'><path fill-rule='evenodd' d='${b.mark}'/></svg>`)}&quot;)`;
  return `<span class="bk-mark${mono ? ' mono' : ''}" style="-webkit-mask-image:${mask};mask-image:${mask}"></span>`;
}
function brandLogo(b, mono){
  return `<span class="bk-logo" style="aspect-ratio:${b.view[0]}/${b.view[1]};--mk:${b.view[1] / b.view[0] * 100}%">${brandMark(b, mono)}<svg viewBox="0 0 ${b.view[0]} ${b.view[1]}" aria-hidden="true">${b.word.map((d, i) => `<path fill="currentColor" style="--l:${i}" d="${d}"/>`).join('')}</svg></span>`;
}
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const isLight = h => { const [r, g, b] = hexRGB(h); return r * .299 + g * .587 + b * .114 > 130; };
function brandkitHTML(b){
  const head = x => `<div class="case-text"><span class="case-label">${T(x.title)}</span><p>${T(x.text)}</p></div>`;
  let h = '';
  if (b.logo) h += `<div class="wrap bk bk-logos">${head(b.logo)}
    <div class="bk-grid" aria-label="Версии логотипа MAX">
      <div class="bk-tile dark wide">${brandLogo(b)}</div><div class="bk-tile light wide">${brandLogo(b)}</div>
      <div class="bk-tile dark wide">${brandLogo(b, true)}</div><div class="bk-tile light wide">${brandLogo(b, true)}</div>
      <div class="bk-tile dark">${brandMark(b)}</div><div class="bk-tile dark">${brandMark(b, true)}</div>
      <div class="bk-tile light">${brandMark(b)}</div><div class="bk-tile light">${brandMark(b, true)}</div>
    </div></div>`;
  if (b.colors) h += `<div class="wrap bk bk-colors bk-n${b.colors.items.length}">${head(b.colors)}
    <div class="bk-swatches">${b.colors.items.map((c, i) => `
      <button class="bk-sw${isLight(c.hex) ? ' on-light' : ''}" style="--c:${c.hex};--i:${i};--x3:${i % 3};--y3:${Math.floor(i / 3)};--x2:${i % 2};--y2:${Math.floor(i / 2)}" data-hex="${c.hex}" data-done="${T(b.colors.copied || 'скопировано')}">
        <span class="bk-name">${T(c.name)}</span>
        <span class="bk-code">${c.hex}<br><span class="bk-rgb"><span class="bk-rgb-l">RGB (</span>${hexRGB(c.hex).join(', ')}<span class="bk-rgb-l">)</span></span></span>
      </button>`).join('')}</div></div>`;
  if (b.film) h += `<div class="wrap bk bk-film"><div class="bk-film-box" style="aspect-ratio:${b.film.ratio || 16 / 9}">
    <iframe src="${embedURL(parseMedia(b.film.video), true)}" allow="autoplay" loading="lazy" tabindex="-1" aria-hidden="true"></iframe></div></div>`;
  return h;
}
// анимация запускается, когда блок доезжает до экрана; клик по цвету копирует код
const brandWatcher = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); brandWatcher.unobserve(e.target); }
}), { threshold: 0.2 });
function watchBrandkit(el){
  brandWatcher.observe(el);
  el.addEventListener('click', e => {
    const sw = e.target.closest('.bk-sw'); if (!sw) return;
    navigator.clipboard?.writeText(sw.dataset.hex).catch(() => {});
    sw.classList.add('copied'); clearTimeout(sw._t); sw._t = setTimeout(() => sw.classList.remove('copied'), 1400);
  });
}

/* ================================================================
   ТЕПЛОВИЗОР в кейсе (поле thermal у проекта, см. «ребрендинг Школы авторов»)
   Поле «температуры» из плавающих теплых пятен раскрашивается шкалой ramp,
   курсор или палец оставляет теплый след. Под полем — палитра, как в brandkit.
   ================================================================ */
function thermalHTML(t){
  const ramp = t.ramp.join(',');
  let h = `<div class="wrap thermo"><div class="thermo-box" style="--ramp:${ramp}">
    <canvas aria-hidden="true"></canvas>
    ${t.logo ? `<img class="thermo-logo" src="${t.logo}" alt="">` : ''}
  </div>${t.hint ? `<p class="camp-cap thermo-hint">${T(t.hint)}</p>` : ''}</div>`;
  if (t.colors) h += brandkitHTML({ colors: t.colors });
  return h;
}
const THERMO_FRAG = `precision mediump float;
uniform vec2 R; uniform float tm; uniform vec3 C[5]; uniform vec3 P[12];
float blob(vec2 p, vec2 c, float r){ vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5), b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.5),
        c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.5), d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.5);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
vec3 ramp(float x){ x = clamp(x, 0., 1.) * 4.;
  if (x < 1.) return mix(C[0], C[1], x); if (x < 2.) return mix(C[1], C[2], x - 1.);
  if (x < 3.) return mix(C[2], C[3], x - 2.); return mix(C[3], C[4], x - 3.); }
void main(){
  float m = max(R.x, R.y); vec2 F = R / m, p = gl_FragCoord.xy / m;
  float t = tm * .00012;
  vec2 w = p + .1 * vec2(n2(p * 2.8 + t * 3.), n2(p * 2.8 - t * 2. + 7.));
  float h = -.04;
  h += .82 * blob(w, F * vec2(.78 + .16 * sin(t * 2.1), .3 + .2 * cos(t * 1.7)), .2);
  h += .5 * blob(w, F * vec2(.24 + .16 * cos(t * 1.3), .85 + .12 * sin(t * 2.4)), .17);
  h += .36 * blob(w, F * vec2(.52 + .3 * sin(t * .9 + 2.), .5 + .3 * sin(t * 1.1)), .14);
  for (int i = 0; i < 12; i++) h += P[i].z * blob(p, P[i].xy, .05 + .07 * P[i].z);
  h += .06 * (n2(p * 16. + t * 20.) - .5);
  float iso = smoothstep(.04, 0., .5 - abs(fract(h * 6.) - .5)) * .045 * step(.08, h);
  vec3 col = ramp(h) + iso;
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + tm) * 43758.5) - .5) * .035;
  gl_FragColor = vec4(col, 1.);
}`;
function startThermal(box, t){
  const cv = box.querySelector('canvas');
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) { box.classList.add('flat'); return; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, THERMO_FRAG));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { box.classList.add('flat'); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  gl.uniform3fv(U('C'), t.ramp.flatMap(h => hexRGB(h).map(v => v / 255)));
  // след курсора: 12 точек, каждая остывает сама
  const trail = Array.from({ length: 12 }, () => [0, 0, 0]);
  let head = 0, lastX = -1, lastY = -1;
  box.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect(), m = Math.max(r.width, r.height), x = (e.clientX - r.left) / m, y = (r.bottom - e.clientY) / m;
    if (Math.hypot(x - lastX, y - lastY) < .03) return;
    lastX = x; lastY = y; trail[head] = [x, y, .34]; head = (head + 1) % trail.length;
  });
  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = Math.round(box.clientWidth * d * .6); cv.height = Math.round(box.clientHeight * d * .6);
    gl.viewport(0, 0, cv.width, cv.height);
  };
  size(); new ResizeObserver(size).observe(box);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let on = false, raf = 0, prev = performance.now();
  const draw = now => {
    const dt = Math.min(now - prev, 64) / 1000; prev = now;
    trail.forEach(p => { p[2] = Math.max(0, p[2] - dt * .35); });
    gl.uniform2f(U('R'), cv.width, cv.height);
    gl.uniform1f(U('tm'), still ? 4000 : now);
    gl.uniform3fv(U('P'), trail.flat());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (on && !still) raf = requestAnimationFrame(draw);
  };
  draw(prev);
  // крутится, только пока виден на экране
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on){ on = true; box.classList.add('in'); prev = performance.now(); raf = requestAnimationFrame(draw); }
    else if (!e.isIntersecting){ on = false; cancelAnimationFrame(raf); }
  }, { threshold: .15 }).observe(box);
}

/* ================================================================
   ЖИВЫЕ БЛОКИ БРЕНДБУКА (элементы gallery, см. «ребрендинг Школы авторов»)
   { head } — подпись и текст; { blend } — цвета и как они сливаются;
   { spin } — градиенты поворачиваются; { float3d } — левитирующие 3D-иконки;
   { icons2d } — анимированные 2D-элементы и правила соединения с 3D
   ================================================================ */
const blockHead = x => `<div class="case-text${x.cols ? ' cols2' : ''}"><span class="case-label">${T(x.title)}</span><p>${T(x.text)}</p></div>`;
// цвета: три полосы съезжаются в одну, сначала смешиваются напрямую (грязь), потом встает фиолетовый мостик
function blendHTML(b){
  const [c1, c2, c3] = b.items, m = b.between;
  const ph = b.phases || [];
  return brandkitHTML({ colors: b }) + `<div class="wrap mix">
    <div class="strip-box" style="--c1:${c1.hex};--c2:${c2.hex};--c3:${c3.hex};--m:${m}" aria-hidden="true">
      <div class="strip-parts">${[c1, c2, c3].map((c, i) => `<i class="p${i + 1}"><span>${T(c.tag || c.name)}</span></i>`).join('')}</div>
      <div class="strip-dirty"></div><i class="strip-drop"></i><div class="strip-clean"></div>
    </div>
    ${ph.length ? `<div class="strip-phases"><span class="ph1">${T(ph[0])}</span><span class="ph2">${T(ph[1])}</span></div>` : ''}
    ${b.hint ? `<p class="camp-cap">${T(b.hint)}</p>` : ''}</div>`;
}
function spinHTML(x){
  return `<div class="wrap spin-wrap">${blockHead(x)}<div class="spin">${x.items.map((src, i) =>
    `<div class="spin-tile" style="--i:${i}"><img src="${src}" alt="" loading="lazy"></div>`).join('')}</div></div>`;
}
function float3dHTML(f){
  return `<div class="wrap"><div class="levit">${f.icons.map((c, i) =>
    `<span class="fl" style="--x:${c.x}%;--y:${c.y}%;--mx:${c.mx ?? c.x}%;--my:${c.my ?? c.y}%;--s:${c.s || 120}px;--i:${i}"><img src="${c.src}" alt="" draggable="false"></span>`).join('')}
    <div class="levit-text"><span class="case-label">${T(f.title)}</span><p>${T(f.text)}</p>${f.hint ? `<p class="camp-cap">${T(f.hint)}</p>` : ''}</div>
  </div></div>`;
}
// 2D-элементы из брендбука, перерисованы вектором: синий и оранжевый, обводка одной толщины
const C2B = '#0077FF', C2O = '#FF7700';
const TWO_D = {
  slider: `<svg viewBox="0 0 400 200"><line x1="60" y1="100" x2="340" y2="100" stroke="${C2O}" stroke-width="8" stroke-linecap="round" opacity=".45"/>
    <line class="sl-fill" x1="60" y1="100" x2="340" y2="100" stroke="${C2B}" stroke-width="8" stroke-linecap="round"/>
    <circle class="sl-knob" cx="60" cy="100" r="24" fill="${C2B}"/></svg>`,
  crop: `<svg viewBox="0 0 200 200" fill="none" stroke-width="5"><rect x="34" y="34" width="132" height="132" stroke="${C2O}"/>
    ${[[34, 34], [166, 34], [34, 166], [166, 166]].map(([x, y]) => `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" fill="${C2B}" stroke="none"/>`).join('')}
    <g class="crop-in"><rect x="72" y="72" width="56" height="56" stroke="${C2O}"/>
    ${[[72, 72], [128, 72], [72, 128], [128, 128]].map(([x, y]) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="${C2B}" stroke="none"/>`).join('')}
    <path d="M100 90v20M90 100h20" stroke="${C2B}" stroke-linecap="round"/></g></svg>`,
  grid: `<svg viewBox="0 0 200 200" fill="none" stroke-linecap="round">
    ${[58, 86, 114, 142].map((v, i) => `<path class="gl" style="--k:${i}" pathLength="1" d="M${v} 30V170" stroke="${C2O}" stroke-width="3"/><path class="gl" style="--k:${i + 4}" pathLength="1" d="M30 ${v}H170" stroke="${C2O}" stroke-width="3"/>`).join('')}
    <path class="gl" style="--k:8" pathLength="1" d="M58 30H142M170 58V142M142 170H58M30 142V58" stroke="${C2O}" stroke-width="3"/>
    <path class="gc" d="M30 58A28 28 0 0 1 58 30M142 30A28 28 0 0 1 170 58M170 142A28 28 0 0 1 142 170M58 170A28 28 0 0 1 30 142" stroke="${C2B}" stroke-width="9"/></svg>`,
  counter: `<svg viewBox="0 0 400 200"><g class="eye"><path d="M40 100c22-34 50-48 78-48s56 14 78 48c-22 34-50 48-78 48s-56-14-78-48z" fill="${C2O}"/>
    <circle cx="118" cy="100" r="25" fill="#fff"/><circle cx="118" cy="100" r="13" fill="${C2O}"/></g>
    <text class="cnt" x="222" y="124" fill="${C2O}" font-size="72" font-weight="500">28,5K</text></svg>`,
  wave: `<svg viewBox="0 0 200 200">${[34, 58, 82, 106, 130, 154].map((x, i) =>
    `<rect class="wb" style="--k:${i}" x="${x}" y="${[70, 50, 30, 50, 70, 60][i]}" width="12" height="${[60, 100, 140, 100, 60, 80][i]}" rx="6" fill="${C2B}"/>`).join('')}</svg>`,
  record: `<svg viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="62" stroke="${C2O}" stroke-width="9" opacity=".3"/>
    <circle class="rec-ring" cx="100" cy="100" r="62" stroke="${C2O}" stroke-width="9" pathLength="1" stroke-linecap="round" transform="rotate(-90 100 100)"/>
    <rect class="rec-dot" x="74" y="74" width="52" height="52" rx="14" fill="${C2O}"/></svg>`,
  speed: `<svg viewBox="0 0 400 200" fill="none"><rect x="24" y="56" width="352" height="88" rx="44" stroke="${C2O}" stroke-width="4"/>
    ${['0,5', '1x', '2', '5'].map((t, i) => `<g class="sp" style="--k:${i}"><circle cx="${82 + i * 79}" cy="100" r="30" stroke="${C2O}" stroke-width="4"/>
    <text x="${82 + i * 79}" y="110" text-anchor="middle" fill="${C2O}" font-size="${i === 1 ? 30 : 26}" font-weight="500">${t}</text></g>`).join('')}</svg>`,
  react: `<svg viewBox="0 0 200 200" fill="none" stroke="${C2O}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
    ${['M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 19 5 21 8.6 19.6 11.8 17.5 16.4 12 21 12 21z',
       'M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
       'M14 5l7 6-7 6v-3.5c-5 0-8.5 1.5-11 5 .8-5.5 4-10 11-11z'].map((d, i) =>
      `<g transform="translate(80 ${16 + i * 58}) scale(1.7)"><path class="rx" style="--k:${i}" d="${d}"/></g>`).join('')}</svg>`,
  bolt: `<svg viewBox="0 0 200 200" fill="none" stroke="${C2O}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="100" cy="100" r="64"/><path class="bl" pathLength="1" d="M110 58 76 108h26l-10 36 34-52h-26z" fill="${C2O}"/></svg>`,
};
function icons2dHTML(x){
  const tiles = [['slider', 1], ['crop'], ['grid'], ['counter', 1], ['wave'], ['record'], ['speed', 1], ['react'], ['bolt']];
  const c = x.combo;
  return `<div class="wrap two">${blockHead(x)}
    <div class="two-grid">${tiles.map(([k, wide], i) => `<div class="two-tile${wide ? ' wide' : ''} t-${k}" style="--i:${i}">${TWO_D[k]}</div>`).join('')}</div>
  </div>
  <div class="wrap"><div class="case-text two-rules"><span class="case-label">${T(x.rulesTitle)}</span><div class="rules-box">
    <ul class="rules">${x.rules.map(r => `<li>${T(r)}</li>`).join('')}</ul>
    ${c ? `<div class="combo" aria-hidden="true"><img class="combo-bg" src="${c.bg}" alt=""><img class="combo-3d" src="${c.icon}" alt="">
      <svg class="combo-frame" viewBox="0 0 100 100" fill="none" stroke="${C2B}" stroke-width="3"><path d="M8 24V8h16M76 8h16v16M92 76v16H76M24 92H8V76"/></svg>
      <svg class="combo-count" viewBox="30 0 410 200"><path d="M40 100c22-34 50-48 78-48s56 14 78 48c-22 34-50 48-78 48s-56-14-78-48z" fill="${C2B}"/><circle cx="118" cy="100" r="22" fill="${C2O}"/>
      <text x="222" y="124" fill="${C2B}" font-size="72" font-weight="500">28,5K</text></svg>
      <svg class="combo-slider" viewBox="0 0 400 60"><line x1="20" y1="30" x2="380" y2="30" stroke="${C2B}" stroke-width="6" stroke-linecap="round"/><circle class="cs-knob" cx="120" cy="30" r="20" fill="${C2B}"/></svg>
    </div>` : ''}
  </div></div></div>`;
}
// фотостиль кинолентой: каждый ряд повторен дважды, чтобы ехать без шва; копии не попадают в просмотрщик
function reelHTML(lanes){
  const shot = (src, dup, i) => dup
    ? `<span class="reel-shot dup" data-of="${i}" aria-hidden="true"><img src="${src}" alt=""></span>`
    : `<button class="camp-shot reel-shot" aria-label="Увеличить"><img src="${src}" alt=""></button>`;
  return `<div class="wrap reel">${lanes.map((l, k) => `<div class="reel-lane${k % 2 ? ' back' : ''}">
    <span class="reel-label">${T(l.label)}</span>
    <div class="reel-window"><div class="reel-track" style="--n:${l.items.length}">${
      l.items.map((s, i) => shot(s, false, i)).join('') + l.items.map((s, i) => shot(s, true, i)).join('')}</div></div>
  </div>`).join('')}</div>`;
}
function startReel(box){
  // копия ведет себя как оригинал: по нажатию открывает тот же кадр
  box.addEventListener('click', e => {
    const d = e.target.closest('.reel-shot.dup'); if (!d) return;
    d.closest('.reel-track').querySelectorAll('button.reel-shot')[+d.dataset.of]?.click();
  });
}
// 3D-иконки: качаются сами (CSS), а от курсора разлетаются и плавно возвращаются
function startFloat(box){
  const els = [...box.querySelectorAll('.fl')], st = els.map(() => ({ x: 0, y: 0, r: 0 }));
  let px = -1e4, py = -1e4, on = false, raf = 0;
  box.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; });
  box.addEventListener('pointerdown', e => { px = e.clientX; py = e.clientY; });
  box.addEventListener('pointerleave', () => { px = py = -1e4; });
  const tick = () => {
    const base = els.map((el, i) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - st[i].x, r.top + r.height / 2 - st[i].y, r.width]; });
    els.forEach((el, i) => {
      const s = st[i], [cx, cy, w] = base[i], dx = cx - px, dy = cy - py, d = Math.hypot(dx, dy) || 1, R = 140 + w;
      const push = d < R ? (1 - d / R) ** 2 * 120 : 0;
      s.x += (dx / d * push - s.x) * .07; s.y += (dy / d * push - s.y) * .07; s.r += (Math.sign(dx) * push * .14 - s.r) * .07;
      el.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) rotate(${s.r.toFixed(1)}deg)`;
    });
    if (on) raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on){ on = true; box.classList.add('in'); raf = requestAnimationFrame(tick); }
    else if (!e.isIntersecting){ on = false; cancelAnimationFrame(raf); }
  }, { threshold: .1 }).observe(box);
}
// счетчик просмотров: набегает от нуля до 28,5K, когда плитка видна
function startCounter(el){
  const txt = el.querySelector('.cnt'); let t0 = 0, raf = 0;
  const step = now => {
    const u = ((now - t0) % 6000) / 1800, v = Math.min(u, 1), e = 1 - (1 - v) ** 3;
    txt.textContent = (28.5 * e).toFixed(1).replace('.', ',') + 'K';
    raf = requestAnimationFrame(step);
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting){ t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(step); }
    else cancelAnimationFrame(raf);
  }).observe(el);
}

/* ================================================================
   КАМПАНИИ ВНУТРИ КЕЙСА (поле campaigns у проекта, см. «рекламные кампании VK»)
   ================================================================ */
// одна ячейка ряда: картинка (увеличивается по нажатию) или ролик
function campCell(src){
  // ролик с особыми пропорциями: { video: 'kinescope:ID', ratio: 7.1 }
  // loop: true — Vimeo играет сам по кругу без кнопок; frame: пропорции самого ролика, если ячейка ниже —
  // лишнее сверху и снизу срезается; blend: true — белый фон ролика сливается с фоном страницы
  if (src && src.video) {
    let html = campCell(src.video);
    if (src.loop) html = html.replace(/data-src="[^"]*"/, `data-src="${embedURL(parseMedia(src.video), true)}"`);
    const cls = 'camp-shot frame' + (src.blend ? ' blend' : '') + (src.tint ? ' tint' : '') + (src.frame ? ' cropped' : '');
    return html.replace('class="camp-shot frame"', `class="${cls}" style="--ar:${src.ratio || 16 / 9}${src.frame ? ';--fr:' + src.frame : ''}"`);
  }
  // { img, tint: true } — светлая картинка с белыми полями: легкое затемнение отделяет ее от белого фона
  if (src && src.img) return campCell(src.img).replace('class="camp-shot"', `class="camp-shot${src.tint ? ' tint' : ''}"`);
  const m = parseMedia(src);
  if (m.type === 'image') return `<button class="camp-shot" aria-label="Увеличить"><img src="${m.src}" alt="" loading="lazy"></button>`;
  if (m.type === 'file') return `<div class="camp-shot frame"><video src="${m.src}" muted loop playsinline autoplay></video></div>`;
  // Kinescope играет сам без звука, как живая картинка; остальные — обычный плеер
  const url = m.type === 'kinescope' ? embedURL(m, true) : embedURL(m, false).replace('&autoplay=1', '');
  // ролик загружается, когда ячейка доезжает до экрана, — тогда Kinescope сам запускается
  return `<div class="camp-shot frame"><iframe data-src="${url}" allow="${FRAME_ALLOW}" allowfullscreen></iframe></div>`;
}
// narrow: true — ряд уже, по ширине текстовой колонки (для картинок низкого разрешения);
// small: true — еще уже, примерно в половину ширины (маленькие баннеры)
// stairs: true — картинки лесенкой: каждая следующая ниже и левее (для узких баннеров)
function campRow(items, caption, narrow, small, stairs){
  return `<div class="wrap camp-rowbox${narrow ? ' narrow' : ''}${small ? ' small' : ''}">${caption ? `<p class="camp-cap">${T(caption)}</p>` : ''}<div class="camp-row${stairs ? ' stairs' : ''}"${stairs ? ` style="--n:${items.length}"` : ''}>${items.map(campCell).join('')}</div></div>`;
}
// коллаж: ячейки раскладываются по схеме areas, у каждой подпись сверху; фото увеличиваются по нажатию
// блок-памятка (spec): заголовок и короткие пункты в колонках; у пункта могут быть цвета — плашки с кодом
// рисунки к пунктам памятки (поле viz): плоские схемы в цветах брифа, без текста внутри
const SPEC_CYAN = '#00D3E6', SPEC_BLUE = '#0077FF';
// силуэт человека: голова и плечи; x — центр, y — низ, k — масштаб
const specPerson = (x, y, k, style) => `<g transform="translate(${x} ${y}) scale(${k})" style="${style}">
  <circle cx="0" cy="-64" r="17"/><path d="M-36 0C-36-30-23-44 0-44S36-30 36 0Z"/></g>`;
const SPEC_VIZ = {
  // одна схема света на всех: три героя на одной бирюзовой циклораме, у всех один синий контур
  series: () => `<rect width="320" height="180" fill="${SPEC_CYAN}"/>
    ${[80, 160, 240].map(x => specPerson(x, 180, 1.15, `fill:#0E0F12;stroke:${SPEC_BLUE};stroke-width:4`)).join('')}`,
  // запас фона: штриховка — фон про запас, синяя рамка — то, что войдет в макет
  frame: () => `<defs><pattern id="specHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" style="stroke:var(--line);stroke-width:4"/></pattern></defs>
    <rect width="320" height="180" fill="url(#specHatch)"/>
    <rect x="96" y="30" width="128" height="150" style="fill:var(--bg)"/>
    ${specPerson(160, 180, 1.25, 'fill:var(--ink)')}
    <rect x="96" y="30" width="128" height="150" fill="none" stroke="${SPEC_BLUE}" stroke-width="3"/>`,
  // разрешение: кадр, у которого подсвечена меньшая сторона, и крупное число
  res: () => `<rect x="24" y="40" width="150" height="100" fill="none" style="stroke:var(--ink)" stroke-width="2"/>
    <line x1="24" y1="40" x2="24" y2="140" stroke="${SPEC_BLUE}" stroke-width="6"/>
    <text x="196" y="104" style="fill:var(--ink);font:500 46px var(--font)">6000</text>
    <text x="198" y="134" style="fill:var(--ink);font:400 22px var(--font);opacity:.6">px</text>`,
  // свет: бирюзовый фон, по бокам контурные приборы, на герое — синий рефлекс
  light: () => `<rect width="320" height="180" fill="${SPEC_CYAN}"/>
    <rect x="28" y="40" width="22" height="70" rx="4" fill="#FFFFFF"/><rect x="270" y="40" width="22" height="70" rx="4" fill="#FFFFFF"/>
    <path d="M50 52L118 96M50 98L118 110M270 52L202 96M270 98L202 110" stroke="#FFFFFF" stroke-width="2" opacity=".7"/>
    ${specPerson(160, 180, 1.45, `fill:#0E0F12;stroke:${SPEC_BLUE};stroke-width:5`)}`,
  // эмоция: серьезно и с прищуром — да, широкая улыбка — нет
  emotion: () => {
    const face = (x, mouth, no) => `<g transform="translate(${x} 92)" fill="none" style="stroke:var(--ink)" stroke-width="3" stroke-linecap="round">
      <circle r="36"/><circle cx="-12" cy="-8" r="2.5" style="fill:var(--ink)"/><circle cx="12" cy="-8" r="2.5" style="fill:var(--ink)"/>
      <path d="${mouth}"/>${no ? '<path d="M-44 44L44-44" stroke="#E5484D"/>' : ''}</g>`;
    return face(70, 'M-13 14H13') + face(160, 'M-13 16Q2 18 14 9') + face(250, 'M-17 8Q0 30 17 8', true);
  },
  // одежда: фирменные белый и синий
  clothes: () => `<rect width="320" height="180" style="fill:var(--soft)"/>
    <g transform="translate(160 180) scale(1.6)"><circle cx="0" cy="-64" r="17" style="fill:var(--ink)"/>
      <path d="M-36 0C-36-30-23-44 0-44S36-30 36 0Z" fill="${SPEC_BLUE}"/><path d="M-12-43L0-14L12-43Z" fill="#FFFFFF"/></g>`,
};
function campSpec(sp){
  const sw = c => `<span class="spec-sw" style="--c:${c}"></span>${c}`;
  const viz = it => it.viz && SPEC_VIZ[it.viz] ? `<svg class="spec-viz" viewBox="0 0 320 180" aria-hidden="true">${SPEC_VIZ[it.viz]()}</svg>` : '';
  return `<div class="wrap camp-rowbox"><div class="spec">
    <h4 class="spec-title">${T(sp.title)}</h4>
    <dl class="spec-list">${sp.items.map(it => `<div class="spec-item">${viz(it)}<dt>${T(it.label)}</dt><dd>${T(it.text)}${
      it.colors ? `<span class="spec-colors">${it.colors.map(sw).join('')}</span>` : ''}</dd></div>`).join('')}</dl>
  </div></div>`;
}
// презентация-листалка: слайды в ленте с прилипанием, стрелки по бокам, счетчик «3 из 30»
function campSlides(g){
  const cap = g.caption ? `<p class="camp-cap">${T(g.caption)}</p>` : '';
  const arrow = d => `<svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="${d}"/></svg>`;
  return `<div class="wrap camp-rowbox">${cap}<div class="slides" tabindex="0" aria-label="Презентация">
    <div class="slides-track">${g.slides.map((src, i) => `<button class="slide" aria-label="Слайд ${i + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>
    <button class="slides-nav prev" aria-label="Предыдущий слайд">${arrow('M12 4l-6 6 6 6')}</button>
    <button class="slides-nav next" aria-label="Следующий слайд">${arrow('M8 4l6 6-6 6')}</button>
    <p class="slides-count">1 из ${g.slides.length}</p>
  </div>${g.notes ? `<div class="slides-notes">${g.notes.map((n, i) => `<p${i ? ' hidden' : ''}>${T(n)}</p>`).join('')}</div>` : ''}</div>`;
}
function watchSlides(box){
  const track = box.querySelector('.slides-track'), slides = [...track.children], count = box.querySelector('.slides-count');
  const notes = [...(box.parentElement.querySelector('.slides-notes')?.children || [])];   // notes — подпись к каждому кадру
  const at = () => track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0;   // пока листалка не видна, ширина 0
  const go = i => track.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * track.clientWidth, behavior: 'smooth' });
  const show = () => {
    const i = at();
    count.textContent = `${i + 1} из ${slides.length}`;
    notes.forEach((n, j) => { n.hidden = j !== i; });
    box.classList.toggle('first', i === 0); box.classList.toggle('last', i === slides.length - 1);
  };
  track.addEventListener('scroll', () => requestAnimationFrame(show), { passive: true });
  show();
  box.addEventListener('click', e => {
    const nav = e.target.closest('.slides-nav');
    if (nav) return go(at() + (nav.classList.contains('next') ? 1 : -1));
    const s = e.target.closest('.slide');
    if (s) { const imgs = slides.map(x => x.querySelector('img')); openViewer(imgs.map(i => i.currentSrc || i.src), slides.indexOf(s), imgs); }
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(at() + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
}
function campCollage(g){
  const c = g.collage;
  const cap = g.caption ? `<p class="camp-cap">${g.link ? `<a class="link" href="${g.link}">${T(g.caption)}</a>` : T(g.caption)}</p>` : '';
  // несколько картинок в ячейке — стопкой: в ряд (одной высоты) или столбиком (dir: 'column')
  const fill = x => Array.isArray(x.img) ? `<div class="collage-stack${x.dir === 'column' ? ' col' : ''}">${x.img.map(campCell).join('')}</div>` : campCell(x.img);
  return `<div class="wrap camp-rowbox${g.narrow ? ' narrow' : ''}">${cap}<div class="collage camp-row${g.cover ? ' cover' : ''}" style="grid-template-areas:${c.areas.replace(/"/g, '&quot;')};grid-template-columns:${c.cols || ''};grid-template-rows:${c.rows || ''};aspect-ratio:${c.ratio || '16/9'}">${
    c.cells.map(x => `<div class="collage-cell" style="grid-area:${x.area}">${x.text ? `<span class="collage-txt">${T(x.text)}</span>` : ''}${fill(x)}</div>`).join('')
  }</div></div>`;
}
// галерея: картинки-строки встают рядами по cols, { row: [...] } — своя полоска, ролик VK — во всю ширину
function campGallery(c){
  const cols = c.cols || 3, out = [];
  let pile = [];
  const flush = () => { for (let i = 0; i < pile.length; i += cols) out.push(campRow(pile.slice(i, i + cols))); pile = []; };
  (c.gallery || []).forEach(g => {
    if (g && g.spec) { flush(); out.push(campSpec(g.spec)); }
    else if (g && g.compact) { flush(); out.push(`<div class="wrap camp-rowbox">${g.caption ? `<p class="camp-cap">${T(g.caption)}</p>` : ''}<div class="camp-row compact">${g.compact.map(campCell).join('')}</div></div>`); }
    else if (g && g.slides) { flush(); out.push(campSlides(g)); }
    else if (g && g.collage) { flush(); out.push(campCollage(g)); }
    else if (g && g.row) { flush(); out.push(campRow(g.row, g.caption, g.narrow, g.small, g.stairs)); }
    else if (parseMedia(g).type === 'image') pile.push(g);
    else { flush(); out.push(campRow([g])); }
  });
  flush();
  return out.join('');
}
function campaignsHTML(list, C){
  const col = (label, text) => text ? `<div class="camp-col"><span class="camp-label">${T(label)}</span><p>${T(text)}</p></div>` : '<div class="camp-col"></div>';
  return `
    <div class="wrap"><h2 class="camps-title">${T(C.title)}<sup class="camps-count">${list.length}</sup></h2></div>
    <div class="camps">
      <nav class="camps-nav" aria-label="Кампании"><div class="wrap"><div class="camps-strip">${
        list.map((c, i) => `<button class="camps-link" data-camp="${i}">${T(c.title)}</button>`).join('')
      }</div></div></nav>
      ${list.map((c, i) => `
      <section class="camp" data-camp="${i}">
        <div class="wrap"><div class="camp-head">
          <div class="camp-col camp-name"><h3 class="camp-title">${T(c.title)}</h3>${
            c.links && c.links.length ? `<div class="camp-links">${c.links.map(l => `<a class="link" href="${l.link}">${T(l.text)}</a>`).join('')}</div>` : ''}</div>
          ${col(C.task, pick(c.task))}
          ${col(C.solution, pick(c.solution)).replace(/<\/div>$/, c.note ? `<p class="camp-note">${T(c.note)}</p></div>` : '</div>')}
        </div></div>
        ${campGallery(c)}
      </section>`).join('')}
    </div>`;
}
// макеты плавно выезжают, когда доезжают до экрана: каждый следующий в ряду — чуть позже
// виды появления (описаны в style.css, ищите data-fx): подъем, шторка слева, раскрытие из центра,
// приближение, шторка сверху, выезд сбоку
const REVEAL_FX = ['rise', 'wipe', 'split', 'zoom', 'drop', 'slide'];
const campReveal = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); campReveal.unobserve(e.target);
  const f = e.target.querySelector('iframe[data-src]');
  if (f) { f.src = f.dataset.src; f.removeAttribute('data-src'); }
}), { rootMargin: '0px 0px -8% 0px' });
function watchCampaigns(root){
  // ряды бывают и в меню кампаний (.camps), и прямо в галерее обычного кейса
  const camps = root.querySelector('.camps');
  const box = camps || (root.querySelector('.camp-row') && root.querySelector('.case-body')); if (!box) return;
  box.querySelectorAll('.slides').forEach(watchSlides);
  // пропорции ячейки берутся из самой картинки — так ряд из разных форматов выходит одной высоты
  box.querySelectorAll('.camp-shot img').forEach(img => {
    const set = () => {
      if (!img.naturalWidth) return;
      const ar = img.naturalWidth / img.naturalHeight;
      img.parentNode.style.setProperty('--ar', ar);
      img.parentNode.classList.toggle('wide', ar > 1.3);   // широкий макет: на телефоне встает во всю ширину
    };
    img.complete ? set() : img.addEventListener('load', set, { once: true });
  });
  // у каждого ряда свой характер появления, чтобы листать было не монотонно;
  // в коллаже каждая ячейка появляется по-своему
  box.querySelectorAll('.camp-row').forEach((row, r) => {
    const cells = [...row.querySelectorAll(':scope>.camp-shot, :scope>.collage-cell .camp-shot')];
    const collage = row.classList.contains('collage');
    cells.forEach((cell, i) => {
      cell.dataset.fx = REVEAL_FX[(collage ? r + i : r) % REVEAL_FX.length];
      cell.style.setProperty('--k', i); cell.classList.add('pre'); campReveal.observe(cell);
    });
  });
  // увеличение по нажатию: листаются все картинки кейса подряд
  box.addEventListener('click', e => {
    const b = e.target.closest('button.camp-shot');
    if (b) {
      const imgs = [...box.querySelectorAll('button.camp-shot img')];
      return openViewer(imgs.map(i => i.currentSrc || i.src), imgs.indexOf(b.querySelector('img')), imgs);
    }
    const l = camps && e.target.closest('.camps-link');
    if (l) {
      const sec = box.querySelector(`.camp[data-camp="${l.dataset.camp}"]`), nav = box.querySelector('.camps-nav');
      // место под прилипшими полоской «все работы» и меню
      const top = sec.getBoundingClientRect().top - caseEl.getBoundingClientRect().top + caseEl.scrollTop - ($('.case-bar')?.offsetHeight || 0) - nav.offsetHeight + 8;
      caseEl.scrollTo({ top, behavior: 'smooth' });
    }
  });
  // в меню подсвечивается кампания, которую сейчас читают
  if (!camps) return;
  const strip = box.querySelector('.camps-strip'), links = [...strip.children];
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(l => l.classList.toggle('on', l.dataset.camp === e.target.dataset.camp));
    const on = links[+e.target.dataset.camp];
    strip.scrollTo({ left: on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' });
  }), { rootMargin: '-35% 0px -60% 0px' });
  box.querySelectorAll('.camp').forEach(s => spy.observe(s));
}

/* ссылки на статьи — заметные: когда доезжают до экрана, их заливает лаймовым маркером.
   Статьей считается ссылка, в тексте которой есть «стат», или ссылка на dsgners.ru, dprofile.ru, vc.ru, habr.com */
const ARTICLE = { text: /стат/i, host: /(dsgners\.ru|dprofile\.ru|vc\.ru|habr\.com|clck\.ru)/ };
const articleLit = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('lit'); articleLit.unobserve(e.target); }
}), { rootMargin: '0px 0px -15% 0px' });
function markArticles(root){
  root.querySelectorAll('a.link').forEach(a => {
    if (!ARTICLE.text.test(a.textContent) && !ARTICLE.host.test(a.href)) return;
    a.classList.add('article');
    a.closest('.camp-cap')?.classList.add('has-article');
    articleLit.observe(a);
  });
}

// ярлык премии: лента рисуется стилями, кольцо — картинка, поверх мерцают блестки (.award i)
function awardHTML(a){
  return `<span class="award" role="img" aria-label="${a.title || ''}"><img src="${a.ring}" alt=""><i></i><i></i><i></i><i></i><i></i></span>`;
}
// команда проекта под блоком «роль»: [['арт-директор', 'Имя Фамилия'], ...] — список в три колонки
function teamHTML(team){
  return `<ul class="case-team">${team.map(([role, name]) => `<li><span>${T(role)}</span>${T(name)}</li>`).join('')}</ul>`;
}
/* ================================================================
   МОРФИНГ ФИГУР (поле morph в галерее кейса, см. VK Инклюзия)
   Фигура плавно перетекает в следующую, рядом подсвечивается ее подпись. Рисуется кодом в SVG,
   поэтому всегда четкая. Числа — в MORPH.
   ================================================================ */
const MORPH = {
  points: 160,     // сколько точек в контуре: больше — глаже
  hold:   1600,    // сколько мс фигура стоит
  move:   750,     // сколько мс длится перетекание
  turn:   24,      // на сколько градусов фигура поворачивается в середине перетекания
};
// контуры в квадрате 100 × 100, центр 50,50: каждая фигура — плотный список точек от верха по часовой стрелке
const MORPH_SHAPES = {
  // скругленный квадрат как в логотипе VK (суперэллипс)
  square: () => byAngle(t => { const c = Math.cos(t), s = Math.sin(t), n = 2 / 5;
    return [50 + 40 * Math.sign(c) * Math.abs(c) ** n, 50 + 40 * Math.sign(s) * Math.abs(s) ** n]; }),
  circle: () => byAngle(t => [50 + 41 * Math.cos(t), 50 + 41 * Math.sin(t)]),
  // пятиугольник со скругленными углами
  pentagon: () => roundedPoly(5, 46, 10),
  // сердце: классическая кривая, пошире; кончик и выемка скруглены сглаживанием
  heart: () => smooth(byAngle(t => { const a = t + Math.PI / 2, x = 16 * Math.sin(a) ** 3,
      y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    return [50 + x * 2.9, 48 - y * 2.6]; }), 28, 3),
};
// сглаживание контура: каждую точку заменяем средним соседей (w — сколько соседей с каждой стороны, n — сколько раз)
function smooth(pts, w, n){
  for (let k = 0; k < n; k++) pts = pts.map((_, i) => {
    let x = 0, y = 0;
    for (let j = -w; j <= w; j++){ const q = pts[(i + j + pts.length) % pts.length]; x += q[0]; y += q[1]; }
    return [x / (2 * w + 1), y / (2 * w + 1)];
  });
  return pts;
}
const byAngle = f => Array.from({ length: 720 }, (_, i) => f(-Math.PI / 2 + i / 720 * 2 * Math.PI));
// правильный многоугольник вершиной вверх: R — радиус до вершины, r — радиус скругления угла
function roundedPoly(n, R, r){
  const pts = [], inner = R - r / Math.cos(Math.PI / n), cy = 50 + (R - R * Math.cos(Math.PI / n)) / 2;
  for (let i = 0; i < n; i++){
    const va = -Math.PI / 2 + i * 2 * Math.PI / n, vx = 50 + inner * Math.cos(va), vy = cy + inner * Math.sin(va);
    // дуга угла: от нормали предыдущей стороны к нормали следующей
    for (let j = 0; j <= 24; j++){ const q = va - Math.PI / n + j / 24 * 2 * Math.PI / n; pts.push([vx + r * Math.cos(q), vy + r * Math.sin(q)]); }
  }
  // начинаем с середины верхнего угла, как у остальных фигур
  return pts.slice(12).concat(pts.slice(0, 12));
}
// контур, разложенный на точки одинаково у всех фигур: равными шагами по длине
function morphOutline(name){
  const raw = (MORPH_SHAPES[name] || MORPH_SHAPES.circle)(), N = raw.length, len = [0];
  for (let i = 1; i <= N; i++){ const a = raw[i - 1], b = raw[i % N]; len.push(len[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const out = [], total = len[N];
  for (let j = 0, i = 0; j < MORPH.points; j++){
    const d = j / MORPH.points * total;
    while (len[i + 1] < d) i++;
    const a = raw[i], b = raw[(i + 1) % N], u = (d - len[i]) / (len[i + 1] - len[i] || 1);
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}
// { fold: { atlas, flacon, caption, hint } } — упаковка из развертки (см. Ростех): при прокрутке плоская развертка
// складывается в коробку, крышка переворачивается и садится сверху; обратно — разворачивается.
// Наведение (или нажатие) поднимает крышку, и из коробки выезжает флакон. Курсор поворачивает коробку.
// Геометрия — в пикселях atlas (развертка 2004×1890): у каждой грани — прямоугольник на развертке
const FOLD = {
  W: 2004, H: 1890,
  body: { c: [848, 846, 1084, 1083], arms: { t: [848, 114, 1084, 846], b: [848, 1083, 1084, 1815], l: [115, 846, 848, 1083], r: [1084, 846, 1816, 1083] } },
  lid:  { c: [1454, 275, 1737, 558], arms: { t: [1454, 39, 1737, 275], b: [1454, 558, 1737, 795], l: [1218, 275, 1454, 558], r: [1737, 275, 1973, 558] } },
};
function foldHTML(x){
  const face = (r, o, cls, sh) => `<div class="fold-face ${cls}" style="left:calc(var(--k)*${r[0] - o[0]}px);top:calc(var(--k)*${r[1] - o[1]}px);width:calc(var(--k)*${r[2] - r[0]}px);height:calc(var(--k)*${r[3] - r[1]}px);--bx:${-r[0]};--by:${-r[1]};--sh:${sh}"><i class="f"></i><i class="b"></i></div>`;
  const group = (g, cls, shades) => {
    const o = [(g.c[0] + g.c[2]) / 2, (g.c[1] + g.c[3]) / 2];
    return `<div class="fold-group ${cls}">${face(g.c, o, 'c', shades.c)}${Object.entries(g.arms).map(([k, r]) => face(r, o, 'a ' + k, shades[k])).join('')}</div>`;
  };
  return `<div class="wrap camp-rowbox">${x.caption ? `<p class="camp-cap">${T(x.caption)}</p>` : ''}
    ${x.hint ? `<p class="fold-hint">${T(x.hint)}</p>` : ''}
    <div class="fold-pin"><div class="fold" style="--atlas:url('${x.atlas}')" role="img" aria-label="Развертка упаковки складывается в коробку">
      <div class="fold-world">
        ${group(FOLD.body, 'fold-body', { c: 0, t: 0, b: .55, l: .45, r: .3 })}
        ${group(FOLD.lid, 'fold-lid', { c: -.08, t: .5, b: .2, l: .45, r: .3 })}
        ${x.flacon ? `<img class="fold-flacon" src="${x.flacon}" alt="">` : ''}
      </div>
    </div></div></div>`;
}
function watchFold(box){
  const world = box.querySelector('.fold-world'), body = box.querySelector('.fold-body'), lid = box.querySelector('.fold-lid');
  const flacon = box.querySelector('.fold-flacon'), arms = [...box.querySelectorAll('.fold-face.a')];
  const clamp = v => Math.max(0, Math.min(1, v)), ease = v => v * v * (3 - 2 * v), mix = (a, b, t) => a + (b - a) * t;
  const B = FOLD.body.c, L = FOLD.lid.c;
  const bc = [(B[0] + B[2]) / 2 - FOLD.W / 2, (B[1] + B[3]) / 2 - FOLD.H / 2];   // где центры граней лежат на плоской развертке
  const lc = [(L[0] + L[2]) / 2 - FOLD.W / 2, (L[1] + L[3]) / 2 - FOLD.H / 2];
  const TALL = FOLD.body.arms.t[3] - FOLD.body.arms.t[1], SIDE = B[2] - B[0];
  // наклон петли: верхняя грань — rotateX(+), нижняя — rotateX(−), левая — rotateY(−), правая — rotateY(+)
  const hinge = { t: ['X', 1], b: ['X', -1], l: ['Y', -1], r: ['Y', 1] };
  let k = 1, zoom = 1, raf = 0, open = 0, wantOpen = 0, px = 0, py = 0, tx = 0, ty = 0, seen = false;
  const size = () => {
    const w = box.clientWidth, h = box.clientHeight;
    k = Math.min(w / FOLD.W, h / FOLD.H) * .96;
    zoom = Math.max(1, h * .82 / ((TALL + 480) * k));   // собранная коробка крупнее плоской развертки
    box.style.setProperty('--k', k);
  };
  const frame = () => {
    raf = 0;
    // блок закреплен (sticky) внутри высокой обертки: пока она прокручивается, развертка складывается
    const r = box.parentElement.getBoundingClientRect(), top0 = parseFloat(getComputedStyle(box).top) || 0;
    const t = clamp((top0 - r.top) / Math.max(1, r.height - box.offsetHeight - 40));
    const f = ease(clamp(t / .5)), s = ease(clamp((t - .15) / .55)), m = ease(clamp((t - .3) / .5)), land = ease(clamp((t - .7) / .3));
    open += (wantOpen * land - open) * .12; px += (tx - px) * .1; py += (ty - py) * .1;
    const deg = 90 * f;
    arms.forEach(a => { const [ax, sg] = hinge[a.classList[2]]; a.style.transform = `rotate${ax}(${sg * deg}deg)`; });
    box.style.setProperty('--s', s);
    const yaw = (-32 + px * 28) * s, tilt = (-16 + py * 8) * s;
    world.style.transform = `scale(${mix(1, zoom, s)}) rotateX(${tilt}deg) rotateY(${yaw}deg)`;
    const base = TALL / 2 + 200;   // дно чуть ниже центра: сверху остается место для крышки и флакона
    body.style.transform = `translate3d(${mix(bc[0], 0, s) * k}px,${mix(bc[1], base, s) * k}px,0) rotateX(${-90 * s}deg)`;
    // открытая крышка поднимается и отъезжает вбок, чтобы флакон выехал из коробки
    const lift = (1 - land) * 360 + open * 320;
    lid.style.transform = `translate3d(${(mix(lc[0], 0, m) + open * SIDE * 1.5) * k}px,${mix(lc[1], base - TALL - lift, m) * k}px,0) rotateY(${90 * m}deg) rotateX(${90 * m}deg)`;
    if (flacon) {
      flacon.style.opacity = land;
      flacon.style.transform = `translate3d(-50%,${(base - 8 - open * 660) * k}px,0) rotateY(${-yaw}deg)`;
      flacon.style.width = `${SIDE * .78 * k}px`;
    }
    if (seen && (Math.abs(wantOpen * land - open) > .002 || Math.abs(tx - px) + Math.abs(ty - py) > .002)) raf = requestAnimationFrame(frame);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(frame); };
  size();
  new ResizeObserver(() => { size(); go(); }).observe(box);
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }).observe(box);
  // кейс прокручивается внутри своего окна, поэтому слушаем прокрутку любого элемента (capture)
  document.addEventListener('scroll', () => { if (seen) go(); }, { passive: true, capture: true });
  box.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = box.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; wantOpen = 1; go();
  });
  box.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; tx = ty = 0; wantOpen = 0; go(); });
  box.addEventListener('click', () => { wantOpen = wantOpen ? 0 : 1; go(); });   // на телефоне — по нажатию
}
// { pipe: { share, left, bridge, right, merge } } — схема совместного продакшна (см. Ростех):
// share — доля работы полосой; left и right — две программы и кто в них работал, bridge — как сцена переехала из одной в другую,
// merge — где всё сошлось. mine: true — этап мой (темная заливка). У этапа: who, tool, items — список дел,
// icons — однотонные логотипы программ (svg, красятся в цвет текста)
function pipeHTML(x){
  const node = (n, cls, i) => `<div class="pp-node ${cls}${n.mine ? ' mine' : ''}" style="--i:${i}">
    <span class="pp-who">${T(n.who)}</span><b class="pp-tool">${(n.icons || []).map(src => `<i class="pp-ico" style="--ico:url('${src}')"></i>`).join('')}${T(n.tool)}</b>
    <ul>${n.items.map(it => `<li>${T(it)}</li>`).join('')}</ul></div>`;
  const sh = x.share;
  return `<div class="wrap"><div class="pp">
    ${sh ? `<div class="pp-share" style="--v:${sh.value}"><div class="pp-bar"><i class="me"></i><i class="other"></i></div>
      <div class="pp-legend"><p><b>${sh.value}%</b> ${T(sh.me)}</p><p>${T(sh.other)}</p></div></div>` : ''}
    <div class="pp-flow">
      ${node(x.left, 'l', 0)}
      <div class="pp-bridge" style="--i:1"><span class="pp-line"></span>
        <div class="pp-mid"><b class="pp-tool">${T(x.bridge.tool)}</b><ul>${x.bridge.items.map(it => `<li>${T(it)}</li>`).join('')}</ul></div>
        <span class="pp-line"></span></div>
      ${node(x.right, 'r', 2)}
    </div>
    <div class="pp-join" style="--i:3" aria-hidden="true"></div>
    ${node(x.merge, 'm', 4)}
  </div></div>`;
}
// { frames: { items, notes } } — раскадровка мелкой сеткой: много маленьких кадров с подписями, без увеличения
// (для кадров низкого качества, см. Ростех); появляются волной, когда доезжают до экрана
function framesHTML(x){
  return `<div class="wrap"><div class="frames">${x.items.map((src, i) => `<figure style="--i:${i}"><img src="${src}" alt="" loading="lazy">${
    x.notes && x.notes[i] ? `<figcaption>${T(x.notes[i])}</figcaption>` : ''}</figure>`).join('')}</div></div>`;
}
function morphHTML(x){
  const cap = x.caption ? `<p class="camp-cap">${T(x.caption)}</p>` : '';
  return `<div class="wrap camp-rowbox">${cap}<div class="morph">
    <svg class="morph-art" viewBox="0 0 100 100" aria-hidden="true"><path/></svg>
    <ul class="morph-list">${x.morph.map((m, i) => `<li data-i="${i}" style="--c:${m.color};--t:${m.text || '#fff'}">${T(m.label)}</li>`).join('')}</ul>
  </div></div>`;
}
function startMorph(box, list){
  const path = box.querySelector('path'), items = [...box.querySelectorAll('.morph-list li')];
  const shapes = list.map(m => morphOutline(m.shape));
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const cols = list.map(m => hex(m.color));
  const ease = u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cycle = MORPH.hold + MORPH.move;
  let t0 = performance.now(), on = false, raf = 0, last = -1;
  const draw = now => {
    const t = (now - t0) % (cycle * list.length), k = Math.floor(t / cycle), u = Math.max(0, (t - k * cycle - MORPH.hold) / MORPH.move);
    const e = still ? 0 : ease(u), a = shapes[k], b = shapes[(k + 1) % list.length];
    const turn = Math.sin(e * Math.PI) * MORPH.turn * Math.PI / 180, cs = Math.cos(turn), sn = Math.sin(turn);
    path.setAttribute('d', a.map((p, i) => {
      const x = p[0] + (b[i][0] - p[0]) * e - 50, y = p[1] + (b[i][1] - p[1]) * e - 50;
      return (i ? 'L' : 'M') + (50 + x * cs - y * sn).toFixed(2) + ' ' + (50 + x * sn + y * cs).toFixed(2);
    }).join('') + 'Z');
    const c = cols[k].map((v, i) => Math.round(v + (cols[(k + 1) % list.length][i] - v) * e));
    path.setAttribute('fill', `rgb(${c})`);
    const cur = e > .5 ? (k + 1) % list.length : k;
    if (cur !== last){ items.forEach((li, i) => li.classList.toggle('on', i === cur)); last = cur; }
    if (on) raf = requestAnimationFrame(draw);
  };
  draw(t0);
  // крутится, только пока виден на экране
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on){ on = true; raf = requestAnimationFrame(draw); }
    else if (!e.isIntersecting){ on = false; cancelAnimationFrame(raf); }
  }).observe(box);
}
/* РОЛИКИ КОЛЛАЖОМ (поле { clips: [...], caption } в галерее кейса, см. MANGO OFFICE):
   тихие mp4 рядом друг с другом, сеткой по два; играют по кругу и встают на паузу вне экрана, не увеличиваются.
   #t=0.1 в адресе — первый кадр виден сразу, даже если телефон запретил автозапуск.
   «Вперед-назад» вшито в сами файлы (вторая половина ролика — он же задом наперед) */
function clipsHTML(x){
  return `<div class="wrap camp-rowbox">${x.caption ? `<p class="camp-cap">${T(x.caption)}</p>` : ''}<div class="clips${x.tall ? ' tall' : ''}">${
    x.clips.map(src => `<div class="clip"><video src="${src}#t=0.1" muted loop playsinline autoplay preload="auto" disablepictureinpicture></video></div>`).join('')
  }</div></div>`;
}
const clipPlayer = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
}), { threshold: 0.2 });
/* РОЛИКИ В ТЕЛЕФОНЕ (поле { phones: [{ src, poster }], title, text } в галерее кейса, см. AR мерч):
   запись экрана стоит в рамке телефона, рядом заголовок и текст; phones: [] — только текст, тем же шрифтом.
   Ролик подгружается заранее, когда телефон подъезжает к экрану, — к наведению он уже готов.
   Играет, пока на него навели курсор; на тач-экранах — пока телефон на экране. Нажатие запускает и ставит на паузу
   (на телефоне в режиме энергосбережения видео само не стартует). Пока стоит — на экране круглая кнопка */
const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
function phonesHTML(x){
  return `<div class="wrap ph-row${x.phones.length > 1 ? ' ph-many' : ''}${x.phones.length ? '' : ' ph-solo'}" data-reveal>${x.phones.length ? `<div class="ph-set">${
    x.phones.map(f => `<div class="phone"><video src="${f.src}"${f.poster ? ` poster="${f.poster}"` : ''} muted loop playsinline preload="none" disablepictureinpicture></video><span class="film-play ph-play">${PLAY_ICON}</span></div>`).join('')
  }</div>` : ''}<div class="ph-text">${x.title ? `<h3>${T(x.title)}</h3>` : ''}${x.text ? `<p>${T(x.text)}</p>` : ''}</div></div>`;
}
const phoneTouch = matchMedia('(hover: none)').matches;
const phonePlay = v => v.play().catch(() => {});
const phonePlayer = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) phonePlay(v); else v.pause();
}), { threshold: 0.6 });
// заранее грузим ролик, когда до телефона остается около экрана прокрутки
const phonePreload = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  phonePreload.unobserve(e.target);
  e.target.preload = 'auto'; e.target.load();
}), { rootMargin: '100% 0px' });
function phonesInit(root){
  root.querySelectorAll('.phone video').forEach(v => {
    const box = v.parentNode;
    v.addEventListener('play', () => box.classList.add('playing'));
    v.addEventListener('pause', () => box.classList.remove('playing'));
    box.addEventListener('click', () => v.paused ? phonePlay(v) : v.pause());
    phonePreload.observe(v);
    if (phoneTouch) return phonePlayer.observe(v);
    box.addEventListener('mouseenter', () => phonePlay(v));
    box.addEventListener('mouseleave', () => v.pause());
  });
}
/* ПЛЕЕР ПО НАЖАТИЮ (поле { film: 'vimeo:ID', poster } в галерее кейса, см. AR мерч):
   на месте плеера — заставка и круглая кнопка; окно плеера со звуком встает только после нажатия */
function filmCoverHTML(src, poster){
  const m = parseMedia(src);
  const url = embedURL(m, false).replace('muted=1&', '').replace('loop=1&', '');
  return `<div class="case-shot frame film-cover" data-reveal data-src="${url}"><img src="${poster}" alt="" loading="lazy">`
    + `<button type="button" class="film-play" aria-label="смотреть видео">${PLAY_ICON}</button></div>`;
}
function filmInit(root){
  root.querySelectorAll('.film-cover').forEach(box => box.addEventListener('click', () => {
    box.innerHTML = `<iframe src="${box.dataset.src}" allow="${FRAME_ALLOW}" allowfullscreen></iframe>`;
    box.classList.remove('film-cover');
  }, { once: true }));
}
/* ГАЙДЛАЙН ЗНАКА (см. MANGO OFFICE)
   { formula: { parts: [картинки], logo, tags: [слова] } } — части знака встают через «+», под ними собирается
   логотип, следом по одному появляются теги-ценности;
   { safe: { logo, mark } } — охранное поле: вокруг логотипа расходятся призрачные модули знака (1х),
   рамка показывает границу. Размер модуля = высота логотипа, считается от ширины блока (cqw) */
/* ЖИВЫЕ МАКЕТЫ НОСИТЕЛЕЙ (см. MANGO OFFICE): интерфейсы сверстаны, а не сняты скриншотом */
const uesc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const capHTML = c => c ? `<p class="camp-cap">${T(c)}</p>` : '';
// { login: { logo, caption, cards: [{ title, fields: [..], button, color, link }] } } — окна входа; \n в title — перенос строки
function loginHTML(x){
  return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="ui-scene ui-login">${x.cards.map(c => `
    <div class="ui-card">
      <img class="ui-logo" src="${x.logo}" alt="MANGO OFFICE">
      <p class="ui-title">${c.title.split('\n').map(T).join('<br>')}</p>
      ${c.fields.map((f, i) => `<label class="ui-field"><span>${uesc(f)}</span><i>${i === c.fields.length - 1 ? '<b class="ui-eye"></b>' : ''}</i></label>`).join('')}
      ${c.linkTop ? `<span class="ui-link">${uesc(c.linkTop)}</span>` : ''}
      <span class="ui-btn" style="--c:${c.color}">${uesc(c.button)}</span>
      ${c.link ? `<span class="ui-link right">${uesc(c.link)}</span>` : ''}
    </div>`).join('')}</div></div>`;
}
// { mail: { img, from, address, subject, caption } } — письмо в почтовом клиенте: список писем и открытое письмо
function mailHTML(x){
  const row = (on, w) => `<li class="${on ? 'on' : ''}"><i></i><span><b style="width:${w}%"></b><b style="width:${w - 18}%"></b></span></li>`;
  return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="ui-scene"><div class="ui-win ui-mail">
    <div class="ui-bar"><i></i><i></i><i></i></div>
    <div class="ui-mail-body">
      <ul class="ui-list">${row(false, 70)}<li class="on"><i class="ball"></i><span><em>${uesc(x.from)}</em><small>${uesc(x.subject)}</small></span></li>${row(false, 64)}${row(false, 76)}${row(false, 58)}${row(false, 68)}</ul>
      <div class="ui-read">
        <div class="ui-read-head"><i class="ball"></i><span><em>${uesc(x.from)}</em><small>${uesc(x.address)}</small></span></div>
        <p class="ui-subj">${T(x.subject)}</p>
        <div class="ui-letter"><img src="${x.img}" alt="" loading="lazy"></div>
      </div>
    </div></div></div></div>`;
}
// { laptop: { img, caption } } — серый ноутбук с экраном
function laptopHTML(x){
  return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="ui-scene ui-laptop-scene"><div class="ui-laptop">
    <div class="ui-screen"><img src="${x.img}" alt="" loading="lazy"></div><div class="ui-base"><i></i></div>
  </div></div></div>`;
}
// { papers: { items: [img...], caption } } — листы бумаги парят в воздухе
function papersHTML(x){
  return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="ui-scene ui-papers">${x.items.map((src, i) =>
    `<div class="paper p${i}"><img src="${src}" alt="" loading="lazy"></div>`).join('')}</div></div>`;
}
// { swing: { img, side, focus: [x, y], sideRatio, caption } } — брелок качается от движения курсора (маятник);
// рядом фото-«окно»: точка focus (доли кадра) стоит по центру, картинка катается за курсором — ощущение пространства
function swingHTML(x){
  return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="swing-row">
    ${x.side ? `<div class="pano" style="--fx:${x.focus ? x.focus[0] : .5};--fy:${x.focus ? x.focus[1] : .5};--iar:${x.sideRatio || 16 / 9}"><img src="${x.side}" alt="" loading="lazy" draggable="false"></div>` : ''}
    <div class="swing"><img class="swing-obj" src="${x.img}" alt="брелок" draggable="false"></div>
  </div></div>`;
}
function watchPano(box){
  const img = box.querySelector('img');
  let tx = 0, gx = 0, raf = 0;
  const step = () => {
    tx += (gx - tx) * .045;   // мягко догоняет курсор
    img.style.transform = `translateX(${tx.toFixed(3)}%)`;
    raf = Math.abs(gx - tx) > .005 ? requestAnimationFrame(step) : 0;
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(step); };
  // отсчет от центра самой фотографии: курсор в центре — логотип в центре
  box.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect();
    gx = -((e.clientX - r.left) / r.width - .5) * 6;   // проценты ширины картинки, в обратную сторону — глубина
    go();
  });
  box.addEventListener('pointerleave', () => { gx = 0; go(); });
}
// читаемость: прячем размеры, которые не помещаются в ширину блока (знак не сжимается, подпись остается правдой)
function fitSizes(box){
  const fit = () => {
    const base = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2;
    box.querySelectorAll('.gd-size').forEach(r => {
      const free = base - (getComputedStyle(r).flexDirection.startsWith('column') ? 0 : 70);   // подпись сбоку занимает место
      const img = r.querySelector('img'); if (!img.naturalWidth) return;
      r.classList.toggle('off', img.naturalWidth / img.naturalHeight * parseFloat(img.style.height) > free);
    });
  };
  box.querySelectorAll('img').forEach(i => i.complete ? fit() : i.addEventListener('load', fit, { once: true }));
  new ResizeObserver(fit).observe(box);
}
function watchSwing(box){
  const obj = box.querySelector('.swing-obj');
  let ang = 0, vel = 0, lastX = null, raf = 0, on = false, t0 = performance.now();
  const step = t => {
    // маятник: возвращается к покою, затухает; в покое чуть покачивается
    const idle = Math.sin((t - t0) / 1400) * 1.2;
    vel += (idle - ang) * 0.008; vel *= 0.97; vel = Math.max(-2.5, Math.min(2.5, vel)); ang = Math.max(-32, Math.min(32, ang + vel));
    obj.style.transform = `rotate(${ang.toFixed(2)}deg)`;
    if (on) raf = requestAnimationFrame(step);
  };
  box.addEventListener('pointermove', e => {
    if (lastX != null) vel = Math.max(-2.5, Math.min(2.5, vel - Math.max(-.5, Math.min(.5, (e.clientX - lastX) * 0.025))));   // толчок по скорости курсора: низ брелка уходит туда, куда ведут
    lastX = e.clientX;
  });
  box.addEventListener('pointerleave', () => { lastX = null; });
  box.addEventListener('click', () => { vel += (Math.random() < .5 ? -1 : 1) * 2; });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on){ on = true; raf = requestAnimationFrame(step); }
    else if (!e.isIntersecting){ on = false; cancelAnimationFrame(raf); }
  }).observe(box);
}
// { facts: [{ label, text }] } — короткие факты колонками в одну строку (бриф)
function factsHTML(list){
  return `<div class="wrap"><div class="camp-head scheme-cols facts">${list.map((f, i) =>
    `<div class="camp-col" style="grid-column:span ${Math.floor(12 / list.length)};--i:${i}"><span class="camp-label">${T(f.label)}</span><p>${T(f.text)}</p></div>`).join('')}</div></div>`;
}
// { stats: { total: { value, text }, items: [{ value, label }], tags: [...], source } } — исследование аудитории:
// большое число считается от нуля, полоски долей растут, черты портрета появляются по очереди (см. Яндекс Доставку)
function statsHTML(s){
  return `<div class="wrap"><div class="ys">
    ${s.total ? `<div class="ys-total"><b class="ys-num" data-to="${s.total.value}">${fmtNum(s.total.value)}</b><p>${T(s.total.text)}</p></div>` : ''}
    <div class="ys-bars">${s.items.map((x, i) => `
      <div class="ys-bar" style="--i:${i};--v:${x.value}%">
        <b class="ys-val"><span class="ys-num" data-to="${x.value}">${x.value}</span>%</b>
        <span class="ys-track"><i></i></span>
        <span class="ys-label">${T(x.label)}</span>
      </div>`).join('')}</div>
    ${s.tags ? `<ul class="ys-tags">${s.tags.map((t, i) => `<li style="--i:${i}">${T(t)}</li>`).join('')}</ul>` : ''}
    ${s.source ? `<p class="camp-cap ys-source">${T(s.source)}</p>` : ''}
  </div></div>`;
}
const fmtNum = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// числа считаются от нуля, когда блок доезжает до экрана
function countUp(box){
  const nums = [...box.querySelectorAll('.ys-num')];
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  nums.forEach(el => el.textContent = '0');
  const t0 = performance.now(), dur = 1600;
  const step = t => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    nums.forEach(el => el.textContent = fmtNum(+el.dataset.to * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const ysReveal = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  ysReveal.unobserve(e.target);
  e.target.classList.add('in');
  if (e.target.classList.contains('ys')) countUp(e.target);
}), { rootMargin: '0px 0px -15% 0px' });
// { steps: { items: [{ tag, title, text }] } } — процесс цепочкой: шаги появляются по очереди, между ними стрелки
function stepsHTML(x){
  const arrow = '<svg class="yst-arrow" viewBox="0 0 48 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h40M33 3l10 9-10 9"/></svg>';
  return `<div class="wrap"><div class="yst" style="--n:${x.items.length}">${x.items.map((s, i) => `${i ? arrow : ''}
    <div class="yst-step" style="--i:${i}">${s.tag ? `<span class="yst-tag">${T(s.tag)}</span>` : ''}<b>${T(s.title)}</b><p>${T(s.text)}</p></div>`).join('')}</div></div>`;
}
// { rules: { cols, items: [{ key, text }] } } — короткие правила сеткой: крупное слово и строка пояснения
function rulesHTML(x){
  return `<div class="wrap"><div class="yru" style="--cols:${x.cols || 3}">${x.items.map((r, i) =>
    `<div class="yru-item" style="--i:${i}"><b>${T(r.key)}</b><p>${T(r.text)}</p></div>`).join('')}</div></div>`;
}
// { zoom: { labels: ['исходник', 'ретушь'], items: [{ title, text, before, after, ratio }] } } — ретушь крупно:
// слева что поправлено, справа исходник → стрелка → результат; картинки увеличиваются по нажатию
function zoomHTML(z){
  const [la, lb] = (z.labels || [['исходник', 'было'], ['ретушь', 'стало']]).map(pick);
  const arrow = '<svg class="zm-arrow" viewBox="0 0 48 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h40M33 3l10 9-10 9"/></svg>';
  const shot = (src, label, r) => `<figure class="zm-fig"><figcaption>${T(label)}</figcaption><button class="camp-shot zm-shot" style="--ar:${r}" aria-label="Увеличить"><img src="${src}" alt="${uesc(label)}" loading="lazy"></button></figure>`;
  return `<div class="wrap">${z.caption ? `<p class="camp-cap">${T(z.caption)}</p>` : ''}${z.items.map((x, i) => `
    <div class="zm" style="--i:${i}">
      <div class="zm-text">${x.title ? `<b>${T(x.title)}</b>` : ''}<p>${T(x.text)}</p></div>
      <div class="zm-pair${(x.ratio || 1.5) < 1 ? ' tall' : ''}"${x.width ? ` style="--w:${x.width}"` : ''}>${shot(x.before, la, x.ratio || 1.5)}${arrow}${shot(x.after, lb, x.ratio || 1.5)}</div>
    </div>`).join('')}</div>`;
}
// { sizes: { logo, heights: [px...] } } — один знак в нескольких размерах: проверка читаемости, подпись — размер в пикселях
function sizesHTML(x){
  return `<div class="wrap"><div class="gd gd-sizes">${x.heights.map((h, i) =>
    `<div class="gd-size" style="--i:${i}"><img src="${x.logo}" alt="" style="height:${h}px"><span>${h} px</span></div>`).join('')}</div></div>`;
}
function formulaHTML(f){
  return `<div class="wrap"><div class="gd gd-formula">
    <div class="gd-parts">${f.parts.map((src, i) => `${i ? '<span class="gd-plus" aria-hidden="true">+</span>' : ''}<img src="${src}" alt="" style="--i:${i}">`).join('')}</div>
    <img class="gd-logo" src="${f.logo}" alt="${(f.alt || '').replace(/"/g, '&quot;')}" style="--i:${f.parts.length}">
    ${f.tags ? `<div class="gd-tags">${f.tags.map((t, i) => `<span class="gd-tag" style="--i:${i}">${T(t)}</span>`).join('')}</div>` : ''}
  </div></div>`;
}
function safeHTML(x){
  const r = x.ratio || 9;   // ширина логотипа к его высоте
  const ghost = side => `<img class="gd-ghost ${side}" src="${x.mark}" alt="" aria-hidden="true">`;
  return `<div class="wrap"><div class="gd gd-safe"><div class="gd-box" style="--r:${r}">
    <img class="gd-safe-logo" src="${x.logo}" alt="">
    ${['l', 'r', 't', 'b'].map(ghost).join('')}
    <span class="gd-1x">1x</span>
  </div></div></div>`;
}
const gdReveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); gdReveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -15% 0px' });
/* СТЕНА ЛОГОТИПОВ (поле { logos: [...] } в галерее кейса, см. MANGO OFFICE):
   одинаковые плитки, логотип на белом стоит с полями, fill: true — баннер или фото заполняет плитку,
   big: true — плитка 2×2, wide: true — плитка на две колонки, half: true — на полряда,
   если обычных плиток нет (только длинные знаки), на планшете стена в 4 колонки;
   у группы: white: true — белые плитки, разделенные тонкими линиями (без серой подложки),
   cols — свое число колонок (на телефоне одна), ratio — пропорции плиток, например '12/5'; labels: true — name плитки виден подписью; tcols / pcols — колонки на планшете и телефоне; pos — какую часть баннера оставить при обрезке. Плитки проявляются волной, по нажатию увеличиваются */
function logoWallHTML(groups){
  return groups.map(g => `<div class="wrap camp-rowbox">${g.caption ? `<p class="camp-cap">${T(g.caption)}</p>` : ''}<div class="logo-wall${g.items.every(i => i.big || i.wide || i.half) ? ' even' : ''}${g.white ? ' white' : ''}${g.cols ? ' set' : ''}"${g.cols || g.ratio ? ` style="${g.cols ? `--cols:${g.cols};--tcols:${g.tcols || g.cols};--pcols:${g.pcols || 1};` : ''}${g.ratio ? `--ar:${g.ratio}` : ''}"` : ''}>${
    g.items.map(i => `<button class="lw-tile${i.fill ? ' fill' : ''}${i.big ? ' big' : ''}${i.wide ? ' wide' : ''}${i.half ? ' half' : ''}" aria-label="${(i.name || 'Увеличить').replace(/"/g, '&quot;')}"><img src="${i.img}" alt="${(i.name || '').replace(/"/g, '&quot;')}"${i.pos ? ` style="object-position:${i.pos}"` : ''} loading="lazy">${g.labels && i.name ? `<span class="lw-name">${T(i.name)}</span>` : ''}</button>`).join('')
  }</div></div>`).join('');
}
const wallReveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); wallReveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -10% 0px' });
function watchLogoWall(wall){
  const tiles = [...wall.children];
  // волна по диагонали: задержка зависит от места плитки в сетке
  const cols = getComputedStyle(wall).gridTemplateColumns.split(' ').length;
  tiles.forEach((t, i) => t.style.setProperty('--k', (i % cols) + Math.floor(i / cols)));
  wallReveal.observe(wall);
  wall.addEventListener('click', e => {
    const b = e.target.closest('.lw-tile'); if (!b) return;
    const imgs = tiles.map(t => t.querySelector('img'));
    openViewer(imgs.map(i => i.currentSrc || i.src), tiles.indexOf(b), imgs);
  });
}
// элемент галереи кейса: { row, caption } — ряд макетов одной высоты, { collage } — коллаж,
// { morph } — фигуры перетекают друг в друга, остальное — во всю ширину
function galleryItem(x){
  if (Array.isArray(x)) return x.map(galleryItem).join('');
  if (x && x.head) return `<div class="wrap">${blockHead(x.head)}</div>`;
  if (x && x.reel) return reelHTML(x.reel);
  if (x && x.blend) return blendHTML(x.blend);
  if (x && x.spin) return spinHTML(x.spin);
  if (x && x.float3d) return float3dHTML(x.float3d);
  if (x && x.icons2d) return icons2dHTML(x.icons2d);
  if (x && x.logos) return logoWallHTML(x.logos);
  if (x && x.mark3d) return mark3dHTML(x.mark3d);
  if (x && x.stars) return starsHTML(x.stars);
  if (x && x.sky) return skyHTML(x.sky);
  if (x && x.grads) return gradsHTML(x.grads);
  if (x && x.pages) return pagesHTML(x.pages);
  // { sheet: [[…], […]], bg } — ряды макетов на серой подложке (светлые картинки не сливаются с белым фоном)
  // cls: 'keep' — ряд не складывается в столбик на телефоне, 'narrow' — без подложки, в правых двух третях
  if (x && x.sheet) return sheetHTML(x.sheet, x.bg, x.cls);
  // { colors } — палитра с копированием кода, как в brandkit; { slides } — презентация-листалка, notes — подпись к каждому кадру под листалкой
  if (x && x.colors) return brandkitHTML({ colors: x.colors });
  if (x && x.slides) return campSlides(x);
  if (x && x.formula) return formulaHTML(x.formula);
  if (x && x.login) return loginHTML(x.login);
  if (x && x.mail) return mailHTML(x.mail);
  if (x && x.laptop) return laptopHTML(x.laptop);
  if (x && x.papers) return papersHTML(x.papers);
  if (x && x.swing) return swingHTML(x.swing);
  if (x && x.facts) return factsHTML(x.facts);
  if (x && x.stats) return statsHTML(x.stats);
  if (x && x.zoom) return zoomHTML(x.zoom);
  if (x && x.steps) return stepsHTML(x.steps);
  if (x && x.rules) return rulesHTML(x.rules);
  // { bigTitle, sub } — крупный заголовок блока и строка пояснения под ним
  if (x && x.bigTitle) return `<div class="wrap"><h2 class="deck-title big-title">${T(x.bigTitle)}</h2>${x.sub ? `<p class="case-sub big-sub">${T(x.sub)}</p>` : ''}</div>`;
  if (x && x.sizes) return sizesHTML(x.sizes);
  if (x && x.safe) return safeHTML(x.safe);
  if (x && x.clips) return clipsHTML(x);
  if (x && x.phones) return phonesHTML(x);
  if (x && x.morph) return morphHTML(x);
  if (x && x.fold) return foldHTML(x.fold);
  if (x && x.pipe) return pipeHTML(x.pipe);
  if (x && x.frames) return framesHTML(x.frames);
  // { ctPlayer } — рабочий плеер со сценами, { ctStories } — сторис по очереди; оба рисует cartoon.js (см. «мультик созданный кодом»)
  if (x && (x.ctPlayer || x.ctStories)) return `<div class="ct-mount"></div>`;
  if (x && x.row) return campRow(x.row, x.caption, x.narrow);
  if (x && x.collage) return campCollage(x);
  // { film: 'img/….mp4', poster, caption } — ролик для просмотра: со звуком и плеером, сам не запускается, грузится по нажатию;
  // film: 'kinescope:ID' и другие плееры — встраиваются окном, с теми же отступами
  // film: 'vimeo:ID' с poster — сначала легкая картинка с кнопкой, плеер грузится только по нажатию (Vimeo в России тянется долго)
  if (x && x.film) return `<div class="wrap case-film">${/\.mp4$/.test(x.film) ? `<div class="case-shot" data-reveal><video src="${x.film}" style="aspect-ratio:16/9"${x.poster ? ` poster="${x.poster}"` : ''} controls playsinline preload="none"></video></div>` : x.poster ? filmCoverHTML(x.film, x.poster) : shotHTML(x.film)}${x.caption ? `<p class="case-note shot-note">${T(x.caption)}</p>` : ''}</div>`;
  // { src: 'kinescope:ID', caption: 'подпись' } — ролик или картинка с подписью под ней
  if (x && x.src) return `<div class="wrap">${shotHTML(x.src)}${x.caption ? `<p class="case-note shot-note">${T(x.caption)}</p>` : ''}</div>`;
  return `<div class="wrap">${shotHTML(x)}</div>`;
}
/* 3D-пространство (поле world у проекта): обложка, поверх нее — мир Marble, который можно покрутить.
   Сам просмотрщик — в world.js, грузится, только когда блок подъезжает к экрану */
function worldHTML(w){
  const touch = matchMedia('(pointer:coarse)').matches;
  const hint = w.hint && (touch ? w.hint.touch : w.hint.mouse);
  return `<div class="wrap case-world"><div class="world" tabindex="0" role="application" aria-label="${T(w.label || '3D-пространство')}" data-src="${w.src}" data-lite="${w.lite || ''}">
    ${w.poster ? `<img src="${w.poster}" alt="">` : ''}<canvas></canvas></div>
    ${hint ? `<p class="case-note world-hint">${T(hint)}</p>` : ''}</div>`;
}
const worldWatcher = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  worldWatcher.unobserve(e.target);
  import(SCRIPT_BASE + 'world.js?v=' + VER)
    .then(m => m.mountWorld(e.target)).catch(err => console.warn('3D-пространство не загрузилось', err));
}), { rootMargin: '400px 0px' });
function watchWorld(el){ worldWatcher.observe(el); }

/* ЖИВОЙ 3D-ЗНАК (элемент { mark3d } в галерее, см. «упаковку агентства Штурман дизайн»):
   обложка агентства — серый фон, белая сетка, надпись, слоган, кнопка-капля и список направлений,
   по центру серебряный знак из блендера поворачивается за курсором. Сам 3D — в mark3d.js, грузится у экрана */
const PILL = 'M143.16 52.4C147.22 48.35 149.25 46.32 150.52 44.25C154.56 37.66 154.56 29.36 150.52 22.78C149.25 20.7 147.22 18.68 143.16 14.63L138.85 10.33C134.81 6.3 132.79 4.28 130.72 3.02C124.15 -1.01 115.87 -1.01 109.3 3.02C107.23 4.28 105.21 6.3 101.17 10.33L91.18 20.3C88.63 22.84 85.18 24.27 81.58 24.27H73.26C70.36 24.27 68 21.91 68 19V19C68 16.1 65.64 13.74 62.74 13.74H19.95C8.93 13.74 0 22.68 0 33.69V33.69C0 44.71 8.93 53.65 19.95 53.65H62.56C65.56 53.65 68 51.21 68 48.2V48.2C68 45.2 70.44 42.76 73.44 42.76H81.58C85.18 42.76 88.63 44.18 91.17 46.72L101.17 56.7C105.21 60.73 107.23 62.75 109.3 64.01C115.87 68.03 124.15 68.03 130.72 64.01C132.79 62.75 134.81 60.73 138.85 56.7L143.16 52.4Z';
function mark3dHTML(m){
  const touch = matchMedia('(pointer:coarse)').matches;
  const hint = m.hint && (touch ? m.hint.touch : m.hint.mouse);
  return `<div class="wrap case-m3d">${hint ? `<p class="m3d-hint">${T(hint)}</p>` : ''}<div class="m3d" data-model="${m.model}" style="--m3d-bg:${m.bg || '#BFBFBD'};--m3d-accent:${m.accent || '#B3F843'}">
    <i class="m3d-grid" aria-hidden="true"></i>
    ${m.word ? `<img class="m3d-word" src="${m.word}" alt="${T(m.label || '')}">` : ''}
    ${m.poster ? `<img class="m3d-poster" src="${m.poster}" alt="">` : ''}
    <canvas aria-hidden="true"></canvas>
    ${m.slogan ? `<p class="m3d-slogan">${T(m.slogan)}</p>` : ''}
    ${m.button ? `<a class="m3d-pill" href="${m.button.link}" target="_blank" rel="noopener"><svg viewBox="0 0 155 68" aria-hidden="true"><path d="${PILL}"/><path class="m3d-arr" d="M111 34h19M122 25l9 9-9 9"/></svg><span>${T(m.button.text)}</span></a>` : ''}
    ${m.list ? `<ul class="m3d-dirs">${m.list.map((x, i) => `<li style="--i:${i}">${T(x)}</li>`).join('')}</ul>` : ''}
  </div></div>`;
}
/* ЖИВОЙ ЗНАК-ЛЕНТА (элементы { stars } и { sky } в галерее, см. MTS STARS).
   Векторы знака лежат у проекта в поле mark: a, b — контуры двух петель (как в исходнике, с разрывами
   на перехлестах), la, lb — их осевые линии. По осевой линии знак прорисовывается, по ней же бежит блик.
   mode: 'hero' — крупный цветной знак; 'versions' — цветная, монохромная и белая версии; 'crop' — графические
   элементы: увеличенный знак, обрезанный полями */
let caseMark = null, starUid = 0;
const STAR_FILL = {
  // петля «острая»: оранжевый внизу слева, фиолетовый внизу справа, розовая вершина
  a: [['#FF3C00', 0], ['#FF0A8C', .5], ['#6A00FF', 1]], aTop: '#FF1A5E',
  // петля «широкая»: фиолетовый слева, красный справа
  b: [['#5A10FF', 0], ['#C21490', .5], ['#FF001F', 1]],
};
function starSVG(m, o = {}){
  const id = 'st' + (++starUid);
  const stops = l => l.map(([c, k]) => `<stop offset="${k}" stop-color="${c}"/>`).join('');
  const spin = `<animateTransform attributeName="gradientTransform" type="rotate" values="0 450 470;28 450 470;-22 450 470;0 450 470" dur="11s" repeatCount="indefinite"/>`;
  const color = !o.fill;
  const defs = `<defs>
    ${color ? `<linearGradient id="${id}a" gradientUnits="userSpaceOnUse" x1="180" y1="700" x2="680" y2="800">${stops(STAR_FILL.a)}${spin}</linearGradient>
    <linearGradient id="${id}t" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="480"><stop offset="0" stop-color="${STAR_FILL.aTop}"/><stop offset="1" stop-color="${STAR_FILL.aTop}" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}b" gradientUnits="userSpaceOnUse" x1="80" y1="520" x2="850" y2="240">${stops(STAR_FILL.b)}${spin}</linearGradient>` : ''}
    <mask id="${id}m" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1100" height="1140">
      <path class="st-draw a" d="${m.la}" pathLength="1"/><path class="st-draw b" d="${m.lb}" pathLength="1"/></mask>
    <clipPath id="${id}c"><path d="${m.a}"/><path d="${m.b}"/></clipPath>
  </defs>`;
  const body = color
    ? `<path d="${m.a}" fill="url(#${id}a)"/><path d="${m.a}" fill="url(#${id}t)"/><path d="${m.b}" fill="url(#${id}b)"/>`
    : `<path d="${m.a}" fill="${o.fill}"/><path d="${m.b}" fill="${o.fill}"/>`;
  // блик: короткий отрезок осевой линии, обрезанный по контуру — на перехлесте он ныряет под ленту
  const glint = o.glint ? `<g clip-path="url(#${id}c)" class="st-glint"><path d="${m.la}" pathLength="1"/><path class="b" d="${m.lb}" pathLength="1"/></g>` : '';
  return `<svg class="st-svg" viewBox="${o.view || '0 0 900 940'}"${o.view ? ' preserveAspectRatio="xMidYMid slice"' : ''} aria-hidden="true">${defs}<g mask="url(#${id}m)">${body}</g>${glint}</svg>`;
}
function starsHTML(x){
  const m = caseMark; if (!m) return '';
  const touch = matchMedia('(pointer:coarse)').matches;
  const hint = x.hint && (touch && x.hint.touch ? x.hint.touch : x.hint.mouse || x.hint);
  if (x.mode === 'versions') return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="st st-vers">${(x.items || []).map((v, i) =>
    `<figure class="st-ver ${v.bg}" style="--i:${i}"><div class="st-tilt">${starSVG(m, { fill: v.fill })}</div><figcaption>${T(v.name)}</figcaption></figure>`).join('')}</div></div>`;
  if (x.mode === 'crop') return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="st st-crops">
    <div class="st-crop light">${starSVG(m, { view: '330 120 620 660' })}</div>
    <div class="st-crop grad">${starSVG(m, { fill: '#fff', view: '-60 260 640 700' })}</div></div></div>`;
  return `<div class="wrap case-st">${hint ? `<p class="m3d-hint">${T(hint)}</p>` : ''}<div class="st st-hero"><div class="st-tilt">${starSVG(m, { glint: true })}</div></div></div>`;
}
// прорисовка стартует, когда знак доезжает до экрана; наклон за курсором — только у крупного знака
const starReveal = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  starReveal.unobserve(e.target);
  e.target.classList.add('in');
}), { threshold: 0.35 });
function watchStars(el){
  starReveal.observe(el);
  if (!el.classList.contains('st-hero') || reduced) return;
  const tilt = el.querySelector('.st-tilt');
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tilt.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 18}deg) translate(${x * 12}px, ${y * 12}px)`;
  });
  el.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
}
/* { sky: { items: [{ img, k }], hint, top } } (top — подсказка над блоком) — звездное небо отклоненных вариантов: знаки разлетаются из центра,
   плывут каждый по-своему (k: turn — вращается, sway — качается в объеме, breathe — дышит),
   слоями откликаются на курсор; наведенный выходит вперед, остальные приглушаются */
const SKY_SPOTS = [[16, 27], [39, 22], [62, 29], [85, 23], [10, 72], [30, 76], [50, 69], [70, 77], [90, 70],
  [50, 48], [26, 48], [74, 48]];
function skyHTML(x){
  const touch = matchMedia('(pointer:coarse)').matches;
  const hint = x.hint && (touch && x.hint.touch ? x.hint.touch : x.hint.mouse || x.hint);
  const top = x.top && hint ? `<p class="m3d-hint">${T(hint)}</p>` : '';
  return `<div class="wrap camp-rowbox">${capHTML(x.caption)}${top}<div class="sky" role="img" aria-label="${uesc(pick(x.label) || 'отклоненные варианты знака')}">${x.items.map((s, i) => {
    const [l, t] = SKY_SPOTS[i % SKY_SPOTS.length], d = .4 + (i * 37 % 10) / 10;
    return `<span class="sky-it ${s.k || 'turn'}" style="--l:${l}%;--t:${t}%;--d:${d.toFixed(2)};--i:${i};--s:${s.s || 1};--dur:${(7 + i * 13 % 6).toFixed(1)}s"><i><img src="${s.img}" alt="" loading="lazy" draggable="false"></i></span>`;
  }).join('')}</div>${hint && !x.top ? `<p class="camp-cap">${T(hint)}</p>` : ''}</div>`;
}
function watchSky(el){
  starReveal.observe(el);
  if (reduced) return;
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
  const step = () => {
    cx += (tx - cx) * .08; cy += (ty - cy) * .08;
    el.style.setProperty('--mx', cx.toFixed(3)); el.style.setProperty('--my', cy.toFixed(3));
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .002 ? requestAnimationFrame(step) : 0;
  };
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5;
    if (!raf) raf = requestAnimationFrame(step);
  });
  el.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(step); });
  el.addEventListener('pointerover', e => el.classList.toggle('focus', !!e.target.closest('.sky-it')));
}
// { pages: { items: [img...], caption } } — страницы брендбука маленьким коллажем: без увеличения, появляются волной
function pagesHTML(x){
  return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="st-pages">${x.items.map((src, i) =>
    `<img src="${src}" alt="" loading="lazy" style="--i:${i}">`).join('')}</div></div>`;
}
// { grads: { items: [[цвет, цвет], ...] } } — фирменные градиенты: полосы проявляются слева направо, подписи — коды цветов на концах
function gradsHTML(x){
  return `<div class="wrap camp-rowbox">${capHTML(x.caption)}<div class="st-grads">${x.items.map((g, i) =>
    `<div class="st-grad" style="--g1:${g[0]};--g2:${g[1]};--i:${i}"><span>${g[0]}</span><span>${g[1]}</span></div>`).join('')}</div></div>`;
}
function sheetHTML(rows, bg, cls){
  return `<div class="wrap camp-rowbox"><div class="case-sheet${cls ? ' ' + cls : ''}" style="--sheet:${bg || '#E9E9E7'}">${
    rows.map(r => `<div class="camp-row">${(Array.isArray(r) ? r : [r]).map(campCell).join('')}</div>`).join('')}</div></div>`;
}
// знак грузится сразу при открытии кейса: модуль маленький (свой WebGL, без three.js), модель ~100 КБ,
// а рисовать он начинает, только когда блок на экране
const markMount = el => import(SCRIPT_BASE + 'mark3d.js?v=' + VER)
  .then(m => m.mountMark(el)).catch(err => console.warn('3D-знак не загрузился', err));
// список направлений: подсвечивается по очереди, пока блок на экране; при наведении на направление
// перебор останавливается, а знак плавно загорается лаймовыми бликами (класс hot читает mark3d.js)
function watchMark(el){
  markMount(el);
  const li = [...el.querySelectorAll('.m3d-dirs li')]; if (!li.length) return;
  let k = 0, t = 0, seen = false, held = false;
  const show = i => li.forEach((x, j) => x.classList.toggle('on', i === j));
  const step = () => { if (held) return; show(k); k = (k + 1) % li.length; };
  const run = () => { clearInterval(t); if (seen && !matchMedia('(prefers-reduced-motion: reduce)').matches) t = setInterval(step, 1500); };
  step();
  li.forEach((x, i) => {
    x.addEventListener('pointerenter', () => { held = true; show(i); k = (i + 1) % li.length; el.classList.add('hot'); });
    x.addEventListener('pointerleave', () => { held = false; el.classList.remove('hot'); run(); });
  });
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(); }).observe(el);
}

/* ================================================================
   КЕЙС-СТРАНИЦА ЦЕЛИКОМ В ОКНЕ (поле embed у проекта, см. «Новый век»)
   Отдельная страница из репозитория (embed: 'nda/novyi-vek/index.html')
   открывается в окне кейса. С GitHub файлы .html приходят простым текстом,
   поэтому страница скачивается и вставляется в окно как есть, с адресом
   своей папки (<base>), — так находятся ее стили, картинки и скрипты.
   ================================================================ */
function embedHTML(html, url){
  const dir = url.replace(/[^/]*([?#].*)?$/, '');
  const search = (url.match(/\?[^#]*/) || [''])[0];
  const head = `<base href="${dir}"><style>.page>.back{display:none!important}</style>` +
    `<script>window.NDA_EMBED=true;window.NV_SEARCH=${JSON.stringify(search)};(${embedBridge})()<\/script>`;
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + head) : head + html;
}
window.kdEmbedHTML = embedHTML;
// работает внутри окна: ссылки «назад» закрывают кейс, вложенные окна с прототипом (*.html) вставляются так же
function embedBridge(){
  // адрес '#main' считается от <base> и уходит на GitHub — в окне такое запрещено; меняется только хвост с #
  ['replaceState', 'pushState'].forEach(k => {
    const orig = history[k].bind(history);
    history[k] = (s, t, u) => {
      if (typeof u === 'string' && u[0] === '#') u = location.href.split('#')[0] + u;
      try { orig(s, t, u); } catch (e) {}
    };
  });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (h === '../' || h === './') { e.preventDefault(); top.postMessage({ kdEmbed: 'close' }, '*'); }
    else if (/\.html/.test(h)) {   // «открыть на весь экран» — окно прототипа на весь экран
      e.preventDefault();
      const f = document.querySelector('.frame iframe') || document.querySelector('iframe');
      if (f && f.requestFullscreen) f.requestFullscreen();
    }
  }, true);
  const fix = f => {
    const s = f.getAttribute('src');
    if (!s || !/\.html/.test(s)) return;
    const u = new URL(s, document.baseURI).href;
    f.removeAttribute('src');
    fetch(u).then(r => r.text()).then(t => { f.srcdoc = top.kdEmbedHTML(t, u); });
  };
  new MutationObserver(ms => ms.forEach(m => {
    if (m.type === 'attributes') { if (m.target.tagName === 'IFRAME') fix(m.target); return; }
    m.addedNodes.forEach(n => { if (n.tagName === 'IFRAME') fix(n); else if (n.querySelectorAll) n.querySelectorAll('iframe[src]').forEach(fix); });
  })).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
}
function renderEmbed(p){
  const url = SCRIPT_BASE + p.embed;
  caseContent.innerHTML = `<iframe class="case-embed" title="${pick(p.title)}" allow="fullscreen" allowfullscreen></iframe>`;
  const f = caseContent.querySelector('iframe');
  fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + VER).then(r => r.text()).then(t => { if (f.isConnected) f.srcdoc = embedHTML(t, url); });
}
addEventListener('message', e => { if (e.data && e.data.kdEmbed === 'close' && caseIndex != null) $('#caseBack').click(); });

function renderCase(k, keepScroll){
  // следующий проект — без отдельных страниц (page) и без самого себя
  const W = SITE.works, items = caseItems(), p = items[k];
  if (p.embed) { caseEl.classList.add('embed'); renderEmbed(p); caseEl.scrollTop = 0; return; }
  caseEl.classList.remove('embed');
  let nk = (k + 1) % items.length;
  while (nk !== k && items[nk].page != null) nk = (nk + 1) % items.length;
  const next = nk !== k ? items[nk] : null;
  // story: один список абзацев или пара [формальный, дружеский]
  const raw = p.story || [];
  const story = Array.isArray(raw[0]) ? pick(raw) || [] : raw;
  // блоки: подпись слева + абзац справа
  let blocks = [];
  if (p.scheme) blocks = ['task', 'role', 'solution', 'result'].map(f => [W.scheme[f], pick(p.scheme[f]) || '', f]).filter(b => b[1]);
  else if (p.headed) for (let i = 0; i < story.length; i += 2) blocks.push([story[i], story[i + 1] || '']);
  else blocks = story.map((par, i) => [p.labels ? p.labels[i] || '' : i === 0 ? p.tag || '' : '', par]);
  const gallery = p.gallery || [];
  caseMark = p.mark || null;   // векторы знака для блоков { stars }
  let body = '', g = 0;
  // schemeCols: все блоки схемы одной строкой, колонками (как текст кампаний);
  // число — столько колонок в ряд, остальные блоки переносятся ниже (schemeCols: 2 — сетка 2 × 2, см. Ростех)
  if (p.schemeCols) {
    const per = typeof p.schemeCols === 'number' ? p.schemeCols : blocks.length;
    body += `<div class="wrap"><div class="camp-head scheme-cols">${
      blocks.map(([label, par]) => `<div class="camp-col" style="grid-column:span ${Math.floor(12 / per)}"><span class="camp-label">${T(label)}</span><p>${T(par)}</p></div>`).join('')}</div></div>`;
    blocks = [];
  }
  // twoCols: ['solution'] — длинный блок схемы набран мельче, в две колонки
  const twoCols = p.twoCols || [];
  blocks.forEach(([label, par, key], i) => {
    // award — ярлык премии слева от текста результата: черная лента, кольцо и блестки
    const text = key === 'result' && p.award ? `<div class="case-award-row">${awardHTML(p.award)}<p>${T(par)}</p></div>` : `<p>${T(par)}</p>`;
    body += `<div class="wrap"><div class="case-text${twoCols.includes(key) ? ' cols2' : ''}" data-reveal><span class="case-label">${T(label)}</span>${text}${
      key === 'role' && p.team ? teamHTML(p.team) : ''}</div></div>`;
    if (p.thermal && p.thermal.after === key) body += thermalHTML(p.thermal);
    if (!p.galleryEnd && g < gallery.length) body += galleryItem(gallery[g++]);
    if (p.brandkit && p.brandkit.after === key) body += brandkitHTML(p.brandkit);
    // world.after — ключ схемы ('solution') или номер абзаца story, считая с нуля
    if (p.world && p.world.after != null && (p.world.after === key || p.world.after === i)) body += worldHTML(p.world);
  });
  // galleryEnd — картинки gallery не между текстом, а в самом конце, после живых глав (см. русский офис)
  if (!p.galleryEnd) while (g < gallery.length) body += galleryItem(gallery[g++]);
  // кампании внутри кейса: меню, у каждой — текст в три колонки (название, задача, решение) и макеты рядами
  if (p.campaigns && p.campaigns.length) body += campaignsHTML(p.campaigns, W.campaigns);
  // audit — аудит как дизайн-кейс: главы с живой инфографикой, их рисует audit.js
  // auditTheme — палитра бренда для схем ('edb' — цвета ЕАБР), по умолчанию — divan.ru
  if (p.audit) body += `<div class="au au-mount${p.auditTheme ? ' au-' + p.auditTheme : ''}"></div>`;
  // adhd — кейс «Где моё внимание?»: мысли, наброски, версии футболок с живыми анимациями; рисует adhd.js
  if (p.adhd) body += `<div class="adhd adhd-mount"></div>`;
  // fleet — кейс Nέofleet как дорога: слоганы на полосах, цвета рядами, живая разметка, фары; рисует fleet.js
  if (p.fleet) body += `<div class="fleet fleet-mount"></div>`;
  // clip — музыкальный клип: история по ступеням, голос на дорожки, 120 фото в лицо, полоска клипа, звонок; рисует clip.js
  if (p.clip) body += `<div class="cl cl-mount"></div>`;
  // casa — кейс Armani/Casa: огурцы режиссера, раскадровка-плеер, квартира с нуля, выбор света, правки; рисует armani.js
  if (p.casa) body += `<div class="casa casa-mount"></div>`;
  // kav — кейс «Одна кавычка»: стикеры перевешиваются, лупа над кавычкой, лейбл печатает текст, мягкий брелок; рисует kav.js
  if (p.kav) body += `<div class="kv kv-mount"></div>`;
  // akbars — знаки отличия Ак Барс Банка: идеи на полке, правки, три металла, рендер ⇄ чертеж, подставка, коробка, витрина; рисует akbars.js
  if (p.akbars) body += `<div class="ab ab-mount"></div>`;
  // stand — универсальный стенд VK Play: план сверху, точки на общем виде, шторка «один бренд или три», куб, бегущая строка; рисует vkplay.js
  if (p.stand) body += `<div class="vp vp-mount"></div>`;
  // suit — парашютный костюм Skolkovo: партнеры в небе с ползунком, три идеи, цепочка этапов, точки на рендере; рисует suit.js
  if (p.suit) body += `<div class="su su-mount"></div>`;
  // ventures — The Ventures Japan: живой принт в шапке (плитки с сакурой тают к середине), плитка, съемка, Токио; рисует ventures.js
  if (p.ventures) body += `<div class="vn vn-mount"></div>`;
  // vector — векторизатор: из Иллюстратора остается одна функция, лупа растр/вектор, пять шагов трассировки, регулятор точек, генерация; рисует vector.js
  if (p.vector) body += `<div class="vc vc-mount"></div>`;
  // navi — студия дизайна навигации: 3D-ролик кодом в шапке, конструктор таблички, 3D-кампус для студии и заказчика; рисует navi.js
  if (p.navi) body += `<div class="nv nv-mount"></div>`;
  // anon — анонимайзер: слово меняется на выдуманное той же длины, документ до и после, что чистится внутри файла, возврат; рисует anon.js
  if (p.anon) body += `<div class="an an-mount"></div>`;
  // poll — интерактивные презентации: лес рук и телефоны, вход по QR и коду, облако / график / рейтинг, свой PDF, без интернета; рисует poll.js
  if (p.poll) body += `<div class="pl pl-mount"></div>`;
  // office — «русский офис»: три редактора в одном окне, рядом, шаблоны, QR, мини-лендинг, закрытый контур, сменный набор; рисует office.js
  if (p.office) body += `<div class="ro ro-mount"></div>`;
  // fix — исправлятор: фотограф снимает толпу, оплата не прошла, до и после, сила нейросети и края, где работает; рисует fix.js
  if (p.fix) body += `<div class="fx fx-mount"></div>`;
  if (p.galleryEnd) while (g < gallery.length) body += galleryItem(gallery[g++]);
  // heroEnd — ролик из шапки уходит в самый конец кейса, после живых глав (см. интерактивные презентации)
  if (p.heroEnd) body += `<div class="wrap case-hero-end"><div class="case-hero"${p.ratio ? ` style="aspect-ratio:${p.ratio}"` : ''}>${heroHTML(p)}</div></div>`;
  // презентация — в самом конце, перед ссылками
  // deck: 'drive:ID' — PDF листается во встроенном окне; список картинок — слайды крупно, один под другим,
  // по нажатию увеличиваются и листаются стрелками
  // deckTitle — крупная надпись над презентацией
  if (p.deck && p.deckTitle) body += `<div class="wrap"><h2 class="deck-title">${T(p.deckTitle)}</h2></div>`;
  // deckBg — слайды лентой сверху вниз на серой подложке
  if (Array.isArray(p.deck) && p.deckBg) body += sheetHTML(p.deck, p.deckBg, 'deck-sheet');
  else if (Array.isArray(p.deck)) body += p.deck.map(s => campRow([s])).join('');
  else if (p.deck) body += `<div class="wrap case-deck">${shotHTML(p.deck)}</div>`;
  // links: [] — ссылок в конце нет; поле не указано — ссылка на старую страницу
  const links = p.links || [{ text: W.more, link: p.link }];
  if (links.length) body += `<div class="wrap"><div class="case-text case-links" data-reveal>${links.map(l => `<a class="link" href="${l.link}">${T(l.text)}</a>`).join('')}</div></div>`;

  caseContent.innerHTML = `
    <div class="wrap case-head">
      <div class="case-ttl"><h1 class="case-title split" id="caseTitle"></h1>${yearHTML(p)}</div>
      ${p.badge ? `<p class="case-badge">${T(p.badge)}</p>` : ''}
      ${p.short ? `<p class="case-sub" data-reveal>${T(p.short)}</p>` : ''}
      ${p.note ? `<p class="case-note" data-reveal>${T(p.note)}</p>` : ''}
    </div>
    ${p.noHero || p.heroEnd ? '' : `<div class="case-hero"${p.heroRatio ? ` style="aspect-ratio:${p.heroRatio};max-width:min(100%,calc(92vh * ${p.heroRatio}));margin:0 auto${p.heroPhone ? `;--hp:${p.heroPhone}` : ''}"` : p.ratio ? ` style="aspect-ratio:${p.ratio}"` : ''}>${heroHTML(p)}</div>`}
    ${p.heroNote ? `<div class="wrap"><p class="case-note hero-note">${T(p.heroNote)}</p></div>` : ''}
    <div class="case-body${p.noHero || p.heroEnd ? ' no-hero' : ''}">${body}</div>
    <div class="wrap case-end">
      <button class="btn btn-line case-to-list"><span class="arr">←</span><span class="spell">${T(isNdaPage ? SITE.ndaPage.back : W.back)}</span></button>
    </div>
    ${next ? `<div class="wrap">
      <button class="case-next" data-next="${nk}">
        <span class="case-label">${T(W.next)}</span>
        <span class="case-title">${T(next.title)}</span>
        <span class="media">${mediaHTML(next)}</span>
      </button>
    </div>` : ''}`;
  spellOut(caseContent);
  splitWords($('#caseTitle'), pick(p.title));
  requestAnimationFrame(() => requestAnimationFrame(() => $('#caseTitle').classList.add('in')));
  caseContent.querySelectorAll('.case-next .media').forEach(watchMedia);
  // в кейсе всё видно сразу, без анимации появления — так текст точно не пропадет
  caseContent.querySelectorAll('[data-reveal]').forEach(el => el.removeAttribute('data-reveal'));
  caseContent.querySelectorAll('.bk').forEach(watchBrandkit);
  markArticles(caseContent);
  watchCampaigns(caseContent);
  caseContent.querySelectorAll('.logo-wall').forEach(watchLogoWall);
  caseContent.querySelectorAll('.gd').forEach(el => gdReveal.observe(el));
  caseContent.querySelectorAll('.swing').forEach(watchSwing);
  caseContent.querySelectorAll('.pano').forEach(watchPano);
  caseContent.querySelectorAll('.gd-sizes').forEach(fitSizes);
  caseContent.querySelectorAll('.ui-papers, .ui-login, .ui-mail, .ui-laptop').forEach(el => gdReveal.observe(el));
  caseContent.querySelectorAll('.ys, .zm, .yst, .yru').forEach(el => ysReveal.observe(el));
  caseContent.querySelectorAll('.clip video, .camp-row video').forEach(v => clipPlayer.observe(v));   // ролики играют только на экране
  phonesInit(caseContent);   // ролики в телефонах — по наведению
  filmInit(caseContent);     // плееры по нажатию
  caseContent.querySelectorAll('.world').forEach(watchWorld);
  caseContent.querySelectorAll('.m3d').forEach(watchMark);
  caseContent.querySelectorAll('.st, .st-grads, .st-pages').forEach(watchStars);
  caseContent.querySelectorAll('.sky').forEach(watchSky);
  caseContent.querySelectorAll('.fold').forEach(watchFold);
  caseContent.querySelectorAll('.pp, .frames').forEach(el => gdReveal.observe(el));
  // листалка прямо в галерее кейса (без рядов макетов watchCampaigns ее не найдет)
  if (!caseContent.querySelector('.camp-row')) caseContent.querySelectorAll('.case-body .slides').forEach(watchSlides);
  const au = caseContent.querySelector('.au-mount');
  if (au) caseImport('audit')
    .then(m => m.mountAudit(au, p, { T, pick, worldHTML, watchWorld, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('аудит не загрузился', err));
  const ad = caseContent.querySelector('.adhd-mount');
  if (ad) caseImport('adhd')
    .then(m => m.mountADHD(ad, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс СДВГ не загрузился', err));
  const fl = caseContent.querySelector('.fleet-mount');
  if (fl) caseImport('fleet')
    .then(m => m.mountFleet(fl, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс Nέofleet не загрузился', err));
  const cl = caseContent.querySelector('.cl-mount');
  if (cl) caseImport('clip')
    .then(m => m.mountClip(cl, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс клипа не загрузился', err));
  const ca = caseContent.querySelector('.casa-mount');
  if (ca) caseImport('armani')
    .then(m => m.mountCasa(ca, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс Armani/Casa не загрузился', err));
  const kv = caseContent.querySelector('.kv-mount');
  if (kv) caseImport('kav')
    .then(m => m.mountKav(kv, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс «Одна кавычка» не загрузился', err));
  const cts = (p.gallery || []).flat().filter(x => x && (x.ctPlayer || x.ctStories));
  const ctm = caseContent.querySelectorAll('.ct-mount');
  if (ctm.length) caseImport('cartoon')
    .then(m => ctm.forEach((el, i) => m.mountCartoon(el, cts[i], { T, pick, openViewer, base: SCRIPT_BASE })))
    .catch(err => console.warn('кейс мультика не загрузился', err));
  const ab = caseContent.querySelector('.ab-mount');
  if (ab) caseImport('akbars')
    .then(m => m.mountAkbars(ab, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс знаков отличия Ак Барс Банка не загрузился', err));
  const su = caseContent.querySelector('.su-mount');
  if (su) caseImport('suit')
    .then(m => m.mountSuit(su, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс парашютного костюма не загрузился', err));
  const vn = caseContent.querySelector('.vn-mount');
  if (vn) caseImport('ventures')
    .then(m => m.mountVentures(vn, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс The Ventures Japan не загрузился', err));
  const vc = caseContent.querySelector('.vc-mount');
  if (vc) caseImport('vector')
    .then(m => m.mountVector(vc, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс векторизатора не загрузился', err));
  const nv = caseContent.querySelector('.nv-mount');
  if (nv) caseImport('navi')
    .then(m => m.mountNavi(nv, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс студии навигации не загрузился', err));
  const an = caseContent.querySelector('.an-mount');
  if (an) caseImport('anon')
    .then(m => m.mountAnon(an, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс анонимайзера не загрузился', err));
  const pl = caseContent.querySelector('.pl-mount');
  if (pl) caseImport('poll')
    .then(m => m.mountPoll(pl, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс интерактивных презентаций не загрузился', err));
  const ro = caseContent.querySelector('.ro-mount');
  if (ro) caseImport('office')
    .then(m => m.mountOffice(ro, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс «русский офис» не загрузился', err));
  const fx = caseContent.querySelector('.fx-mount');
  if (fx) caseImport('fix')
    .then(m => m.mountFix(fx, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс исправлятора не загрузился', err));
  const vp = caseContent.querySelector('.vp-mount');
  if (vp) caseImport('vkplay')
    .then(m => m.mountStand(vp, p, { T, pick, openViewer, base: SCRIPT_BASE }))
    .catch(err => console.warn('кейс стенда VK Play не загрузился', err));
  const morphs = (p.gallery || []).filter(x => x && x.morph);
  caseContent.querySelectorAll('.morph').forEach((box, i) => startMorph(box, morphs[i].morph));
  caseContent.querySelectorAll('.thermo-box').forEach(box => startThermal(box, p.thermal));
  caseContent.querySelectorAll('.levit').forEach(startFloat);
  caseContent.querySelectorAll('.reel').forEach(startReel);
  caseContent.querySelectorAll('.t-counter').forEach(startCounter);
  caseContent.querySelectorAll('.mix,.spin,.two-grid,.combo,.reel').forEach(el => brandWatcher.observe(el));
  if (!keepScroll) caseEl.scrollTop = 0;
}

/* Скелет загрузки: картинки кейса, пока грузятся, — серые плашки с переливом (класс sk-wait);
   у картинки без размеров плашка 16:10 (sk-box), чтобы ее было видно. Следит и за картинками,
   которые живые главы дорисовывают позже */
function skMark(img){
  if (img.dataset.sk || (img.complete && img.naturalWidth)) return;
  img.dataset.sk = '1';
  img.classList.add('sk-wait');
  if (img.getBoundingClientRect().height < 2) img.classList.add('sk-box');
  // в плашку загрузки идут обычные картинки и ленивые (loading="lazy") только с первого экрана:
  // ниже браузер ленивые не грузит, пока не долистают, и плашка висела бы до прокрутки
  const counted = caseLoad.on && (img.loading !== 'lazy' || img.getBoundingClientRect().top < innerHeight);
  if (counted) caseLoad.add();
  const done = () => { img.classList.remove('sk-wait', 'sk-box'); if (counted) caseLoad.tick(); };
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
}
/* ПЛАШКА ЗАГРУЗКИ КЕЙСА: сколько примерно осталось ждать. Считает картинки первых экранов,
   ролик в шапке и живые главы; время — по скорости, с которой они уже загрузились.
   Появляется, только если загрузка дольше 0,7 с; тексты — works.loading в content.js */
const caseLoad = {
  on: false, total: 0, done: 0, t0: 0, shown: 0, eta: Infinity, timer: 0, el: null,
  start(){
    this.on = true; this.total = 0; this.done = 0; this.t0 = performance.now(); this.eta = Infinity; this.shown = 0;
    clearInterval(this.timer); this.timer = setInterval(() => this.draw(), 250);
  },
  add(){ if (this.on) this.total++; },
  tick(){ if (!this.on) return; this.done++; this.draw(); },
  pill(){
    if (this.el) return this.el;
    let el = document.getElementById('caseWait');
    if (!el) { el = document.createElement('div'); el.id = 'caseWait'; el.className = 'case-wait'; el.setAttribute('role', 'status'); el.innerHTML = '<b></b><span></span><i></i>'; caseEl.appendChild(el); }
    return (this.el = el);
  },
  draw(){
    if (!this.on) return;
    const L = SITE.works.loading || {}, el = this.pill(), t = (performance.now() - this.t0) / 1000;
    const frac = this.total ? this.done / this.total : 0;
    if (this.total && this.done >= this.total) return this.stop();
    if (t < 0.7 && !this.shown) return;
    if (!this.total) return this.stop();   // ждать нечего (ролики грузятся по нажатию или наведению) — плашку не показываем, иначе она висит вечно
    if (!el.querySelector('b')) el.innerHTML = '<b></b><span></span><i></i>';
    this.shown = 1;
    // оставшееся время: прошедшее × доля, которая еще не загрузилась; число только уменьшается
    if (frac > 0.04) this.eta = Math.min(this.eta, Math.max(1, Math.ceil(t * (1 - frac) / frac)));
    const left = isFinite(this.eta) ? (this.eta <= 1 || frac > 0.92 ? T(L.almost) : T(L.left).replace('{s}', this.eta)) : T(L.start);
    el.querySelector('b').innerHTML = left;
    el.querySelector('span').innerHTML = T(L.wait);
    el.style.setProperty('--p', Math.max(0.06, frac).toFixed(3));
    el.classList.add('show');
    if (isFinite(this.eta) && this.eta > 1) this.eta = Math.max(1, this.eta - 0.25);   // отсчет идет и между загрузками
  },
  stop(){
    this.on = false; clearInterval(this.timer);
    const el = document.getElementById('caseWait');
    if (el) { el.style.setProperty('--p', 1); setTimeout(() => el.classList.remove('show'), 350); }
  },
};
// живые главы: пока их код грузится, контейнер пуст; первый ребенок — глава готова
function trackMounts(){
  caseContent.querySelectorAll('.case-body [class*="-mount"]').forEach(m => {
    if (m.firstChild) return;
    caseLoad.add();
    const mo = new MutationObserver(() => { if (m.firstChild) { mo.disconnect(); caseLoad.tick(); } });
    mo.observe(m, { childList: true });
  });
  // ролик в шапке кейса
  caseContent.querySelectorAll('.case-hero video').forEach(v => {
    if (v.readyState >= 2) return;
    caseLoad.add();
    const ok = () => caseLoad.tick();
    v.addEventListener('loadeddata', ok, { once: true }); v.addEventListener('error', ok, { once: true });
  });
}
const skScan = scope => scope.querySelectorAll && scope.querySelectorAll('img').forEach(skMark);
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
  if (n.nodeType !== 1) return;
  if (n.tagName === 'IMG') skMark(n); else skScan(n);
}))).observe(caseContent, { childList: true, subtree: true });
// снять скелет страницы, который показала разметка окна кейса до загрузки кода
function unboot(){ caseEl.classList.remove('boot'); root.classList.remove('case-boot'); }

function openCase(k){
  caseIndex = k;
  unboot();
  caseLoad.start();
  renderCase(k);
  skScan(caseContent);
  trackMounts();
  caseLoad.draw();
  caseEl.classList.add('open');
  placeFab(); setTimeout(placeToTop, 100);
  document.body.classList.add('locked');
  caseEl.focus?.();
}
function closeCase(){
  caseLoad.stop();
  if (caseIndex == null) return;
  caseIndex = null;
  caseEl.classList.remove('open');
  placeFab(); setTimeout(placeToTop, 100);
  document.body.classList.remove('locked');
  setTimeout(() => { if (caseIndex == null) caseContent.innerHTML = ''; }, 900);
}
function readHash(){
  const m = /^#case-(\d+)$/.exec(location.hash);
  const k = m ? +m[1] - 1 : null;
  if (k != null && caseItems()[k] && caseItems()[k].page == null) { openedByClick = openedByClick || false; openCase(k); }
  else {
    if (caseEl.classList.contains('boot')) { unboot(); caseEl.classList.remove('open'); caseContent.innerHTML = ''; }
    closeCase();
  }
}
addEventListener('hashchange', () => { openedByClick = true; readHash(); });
$('#caseBack').addEventListener('click', () => {
  if (openedByClick) history.back();
  else { history.replaceState(null, '', location.pathname + location.search); closeCase(); }
});
addEventListener('keydown', e => { if (e.key === 'Escape' && caseIndex != null) $('#caseBack').click(); });
caseContent.addEventListener('click', e => {
  const play = e.target.closest('.hero-play');
  if (play) { play.outerHTML = `<iframe src="${play.dataset.src}" allow="${FRAME_ALLOW}" allowfullscreen></iframe>`; return; }
  // кнопка внизу кейса — то же, что «назад» в верхней полоске
  if (e.target.closest('.case-to-list')) { $('#caseBack').click(); return; }
  const n = e.target.closest('.case-next');
  if (n) history.replaceState(null, '', '#case-' + (+n.dataset.next + 1)), openCase(+n.dataset.next);
});
caseEl.addEventListener('scroll', () => {
  if (caseEl.scrollTop + caseEl.clientHeight >= caseEl.scrollHeight - 4) joke('sheet');
}, { passive: true });


/* ================================================================
   АНИМАЦИИ: появление блоков, шапка, параллакс превью
   ================================================================ */
const revealers = new Map();
function watchReveals(scope, showVisibleNow, scrollRoot = null){
  if (!revealers.has(scrollRoot)) revealers.set(scrollRoot, new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealers.get(scrollRoot).unobserve(e.target); }
  }), { root: scrollRoot, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }));
  const io = revealers.get(scrollRoot);
  scope.querySelectorAll('[data-reveal]:not(.in), .split:not(.in)').forEach(el => {
    if (showVisibleNow) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) { el.classList.add('in'); return; }
    }
    io.observe(el);
  });
}

const head = $('#head');
let lastY = scrollY, lastT = performance.now();
addEventListener('scroll', () => {
  const y = scrollY, now = performance.now();
  const max = root.scrollHeight - innerHeight;
  head.classList.toggle('solid', y > 40);
  placeToTop();
  if (Math.abs(y - lastY) / Math.max(1, now - lastT) > 6) joke('fast');
  if (y >= max - 4) joke('bottom');
  lastY = y; lastT = now;
  parallax();
}, { passive: true });

function parallax(){
  if (reduced) return;
  $$('#workList .media').forEach(m => {
    const r = m.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    m.style.setProperty('--py', (k * -24).toFixed(1) + 'px');
  });
}


/* ================================================================
   ШУТКИ (только в дружеской версии, каждая — один раз)
   ================================================================ */
const shownJokes = new Set();
let pendingJoke = null;
/* на первом экране сообщения не показываем — ждем, пока его пролистают */
addEventListener('scroll', () => { if (pendingJoke && scrollY > innerHeight * 0.6) { const k = pendingJoke; pendingJoke = null; joke(k); } }, { passive: true });
function joke(key){
  if (!isFun() || shownJokes.has(key) || !SITE.jokes[key]) return;
  if (scrollY < innerHeight * 0.6 && !document.body.classList.contains('locked')) { pendingJoke = key; return; }
  shownJokes.add(key);
  // одновременно на экране только одно сообщение: остальные ждут своей очереди
  jokeQueue.push(key);
  if (!jokeShowing) nextJoke();
}
const jokeQueue = [];
let jokeShowing = false;
function nextJoke(){
  const key = jokeQueue.shift();
  if (!key || !isFun()) { jokeShowing = false; jokeQueue.length = 0; return; }
  jokeShowing = true;
  const box = $('#toasts'), el = document.createElement('div');
  // выглядит как сообщение в Telegram: аватарка, имя, пузырь, время и галочки
  el.className = 'toast';
  const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const text = T(SITE.jokes[key]);
  el.innerHTML = `<span class="toast-ava" aria-hidden="true">${SITE.chat.initials}</span>
    <span class="toast-msg"><b class="toast-name">${T(SITE.chat.name)}</b><span class="toast-text">${text}</span><span class="toast-time">${time}<svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5.5 3.8 8.5 9.5 1.5M6.5 8.5 7 9l6.5-7.5"/></svg></span></span>`;
  box.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  // сообщение висит, пока его можно спокойно дочитать: 6 секунд плюс время на каждую букву
  const stay = 6000 + SITE.jokes[key].length * 70;
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.remove(); setTimeout(nextJoke, 800); }, 600); }, stay);
}

let leechTimer = setTimeout(function tell(){ if (isFun()) joke('leech'); else leechTimer = setTimeout(tell, 40000); }, 40000);
let idleTimer;
const resetIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => joke('idle'), TUNE.idleJokeAfter); };
['pointermove', 'keydown', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, resetIdle, { passive: true }));
resetIdle();

let teases = 0;
document.addEventListener('pointerover', e => {
  const t = e.target.closest && e.target.closest('.tease');
  if (t && !t.contains(e.relatedTarget) && ++teases === 3) joke('tease');
});
document.addEventListener('copy', () => joke('copy'));
/* ================================================================
   КНОПКА «НАВЕРХ» — на всех длинных страницах и в кейсах.
   Правило (Nielsen Norman Group и дизайн-системы, которые на него опираются):
   кнопка нужна, только если страница длиннее 2 экранов на компьютере и 4 экранов на телефоне;
   появляется, когда пролистали больше экрана (на телефоне — больше двух), и не мешает в начале
   ================================================================ */
const TOTOP = { longDesktop: 2, longPhone: 4, showDesktop: 1, showPhone: 2 };
const toTopBtn = document.getElementById('toTop') || (() => {
  // на страницах без готовой кнопки (например, на новых страницах Тильды) она создается здесь
  const b = document.createElement('button');
  b.className = 'to-top'; b.id = 'toTop'; b.type = 'button'; b.setAttribute('aria-label', 'Наверх');
  b.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 16V4M5 9l5-5 5 5"/></svg>';
  document.body.appendChild(b);
  return b;
})();
function placeToTop(){
  const phone = innerWidth < 760;
  const inCase = caseIndex != null && caseEl.scrollHeight > 0;
  const length = inCase ? caseEl.scrollHeight : root.scrollHeight;
  const y = inCase ? caseEl.scrollTop : scrollY;
  const long = length > innerHeight * (phone ? TOTOP.longPhone : TOTOP.longDesktop);
  toTopBtn.classList.toggle('show', long && y > innerHeight * (phone ? TOTOP.showPhone : TOTOP.showDesktop));
}
toTopBtn.addEventListener('click', () => {
  const target = caseIndex != null ? caseEl : window;
  target.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
});
caseEl.addEventListener('scroll', placeToTop, { passive: true });
addEventListener('resize', placeToTop);
addEventListener('hashchange', () => setTimeout(placeToTop, 50));
placeToTop();
addEventListener('fun:joke', e => joke(e.detail));   // шутки от бегающих кнопок и многоножки (fun.js)
document.addEventListener('contextmenu', () => joke('context'));
$('#portrait').addEventListener('click', () => joke('photo'));
let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { joke('resize'); layoutStrings(); }, 200);
});
document.addEventListener('visibilitychange', () => {
  if (!isFun()) return;
  if (document.hidden) document.title = SITE.jokes.away;
  else { document.title = pick(SITE.pageTitle); joke('back'); }
});


/* ================================================================
   КРЕСТИКИ-НОЛИКИ В КОНТАКТАХ (видны только в дружеской версии)
   Сайт играет неидеально — иногда ошибается, чтобы выиграть было можно.
   ================================================================ */
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const MISTAKES = 0.3;   // как часто сайт делает случайный ход вместо лучшего
let board = Array(9).fill(''), gameOver = false;
const winnerOf = b => { for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]], line: l }; return b.every(Boolean) ? { who: 'draw' } : null; };
function minimax(b, me){
  const w = winnerOf(b);
  if (w) return { score: w.who === 'o' ? 1 : w.who === 'x' ? -1 : 0 };
  let best = { score: me ? -2 : 2 };
  b.forEach((c, i) => {
    if (c) return;
    b[i] = me ? 'o' : 'x';
    const r = minimax(b, !me);
    b[i] = '';
    if (me ? r.score > best.score : r.score < best.score) best = { score: r.score, i };
  });
  return best;
}
const MARK = {
  x: '<svg viewBox="0 0 40 40"><path class="draw" d="M9 9L31 31"/><path class="draw" style="animation-delay:.15s" d="M31 9L9 31"/></svg>',
  o: '<svg viewBox="0 0 40 40"><circle class="draw" cx="20" cy="20" r="12"/></svg>',
};
function renderGame(status){
  const G = SITE.game, box = $('#ttt');
  const w = winnerOf(board);
  let after = '';
  // две галочки по 152-ФЗ: без них форма не отправится; ссылки — на страницы согласия и политики
  const agree = G.agree ? `<div class="ttt-consent">
      <label><input type="checkbox" name="agree" required><span>${T(G.agree[0])}<a href="${G.agreeLink}" target="_blank" rel="noopener">${T(G.agree[1])}</a></span></label>
      <label><input type="checkbox" name="policy" required><span>${T(G.policy[0])}<a href="${G.policyLink}" target="_blank" rel="noopener">${T(G.policy[1])}</a></span></label>
    </div>` : '';
  // три обязательных поля: имя, телефон, ник в Telegram
  const inp = (name, ph, type, extra = '') => `<input class="ttt-input" name="${name}" type="${type}" required placeholder="${ph}" aria-label="${ph}"${extra}>`;
  if (w && w.who === 'x') after = `<form class="ttt-form" id="tttForm"><div class="ttt-fields">${inp('name', G.fName, 'text', ' autocomplete="name"')}${inp('phone', G.fPhone, 'tel', ' autocomplete="tel" pattern="[+0-9()\\s-]{7,}"')}${inp('tg', G.fTg, 'text', ' pattern="@?[A-Za-z0-9_]{4,}|https?://t\\.me/.+"')}</div><button class="btn btn-accent"><span class="spell">${T(G.send)}</span><span class="arr">→</span></button>${agree}</form>`;
  if (w && w.who !== 'x') after = `<a class="btn btn-accent" href="${SITE.telegram}"><span class="spell">${T(G.write)}</span><span class="arr">→</span></a>`;
  box.innerHTML = `
    <h3 class="ttt-title"><span class="iris" data-t="${G.title}">${T(G.title)}</span></h3>
    <p class="ttt-rules">${T(G.rules)}</p>
    <div class="ttt-board" role="grid">${board.map((c, i) =>
      `<button class="ttt-cell${w && w.line && w.line.includes(i) ? ' win' : ''}" data-i="${i}" ${c || gameOver ? 'disabled' : ''} aria-label="клетка ${i + 1}${c ? ', ' + (c === 'x' ? 'крестик' : 'нолик') : ''}">${c ? MARK[c] : ''}</button>`).join('')}</div>
    <p class="ttt-status" aria-live="polite">${T(status)}</p>
    <div class="ttt-after">${after}${w ? `<button class="link ttt-again">${T(G.again)}</button>` : ''}</div>`;
  spellOut(box);
}
function resetGame(){ board = Array(9).fill(''); gameOver = false; renderGame(SITE.game.yourTurn); }
function finish(){
  const w = winnerOf(board), G = SITE.game;
  if (!w) return false;
  gameOver = true;
  renderGame(w.who === 'x' ? G.win : w.who === 'o' ? G.lose : G.draw);
  return true;
}
$('#ttt').addEventListener('click', e => {
  if (e.target.closest('.ttt-again')) { resetGame(); return; }
  const cell = e.target.closest('.ttt-cell');
  if (!cell || gameOver || board[+cell.dataset.i]) return;
  board[+cell.dataset.i] = 'x';
  if (finish()) return;
  gameOver = true; renderGame(SITE.game.myTurn);           // пока сайт «думает», ходить нельзя
  setTimeout(() => {
    const free = board.map((c, i) => c ? -1 : i).filter(i => i >= 0);
    const i = Math.random() < MISTAKES ? free[Math.floor(Math.random() * free.length)] : minimax(board.slice(), true).i;
    board[i] = 'o'; gameOver = false;
    if (!finish()) renderGame(SITE.game.yourTurn);
  }, 650);
});
/* КОНТАКТ ИЗ ИГРЫ уходит заявкой через спрятанную форму Тильды (блок в «Подвале» с полем kd_contact):
   Тильда сама отправит ее туда, куда подключены формы, — в Tilda CRM, на почту, в Telegram.
   Если такой формы на странице нет (прототип) или она не ответила, — как раньше: готовое сообщение в Telegram */
function tildaGameForm(){
  // своя форма с полем kd_contact или — если имена полей не меняли — первая обычная форма Тильды на странице
  const inp = document.querySelector('form input[name="kd_contact"]');
  const f = inp ? inp.closest('form') : document.querySelector('#allrecords form.t-form, form.t-form');
  if (f) f.closest('.t-rec')?.classList.add('kd-hidden-form');   // на странице ее не видно
  return f;
}
tildaGameForm();   // сразу спрятать форму Тильды, если она есть на странице
addEventListener('load', tildaGameForm);
// поле формы Тильды для контакта: kd_contact, иначе Имя / Email / Телефон / первое текстовое
function contactField(f){
  return f.querySelector('[name="kd_contact"]') || f.querySelector('[name="Name"], [name="name"]')
    || f.querySelector('input[type="text"]:not([type="hidden"])') || f.querySelector('[name="Email"], [name="email"], input[type="email"]')
    || f.querySelector('[name="Phone"], [name="phone"], input[type="tel"]');
}
function sendGameContact(contact, data = {}){
  const f = tildaGameForm();
  if (!f) return Promise.reject(new Error('нет формы Тильды'));
  const set = (name, v) => { const el = f.querySelector(`[name="${name}"]`); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } };
  const field = contactField(f), src = 'крестики-нолики на сайте: победа посетителя';
  if (!field) return Promise.reject(new Error('в форме нет поля для контакта'));
  // контакт может быть ником, почтой или телефоном: снимаем у полей формы обязательность и проверку формата,
  // чтобы Тильда не отказала (например, если в форме обязательный Email, а оставили ник в Telegram)
  f.querySelectorAll('[data-tilda-req]').forEach(el => el.removeAttribute('data-tilda-req'));
  f.querySelectorAll('[data-tilda-rule]').forEach(el => el.removeAttribute('data-tilda-rule'));
  // ограничения длины тоже снимаем: поле телефона Тильды ждет строго «+7 (000) 000-00-00» (minlength 18)
  f.querySelectorAll('[data-tilda-rule-minlength], [data-tilda-rule-maxlength]').forEach(el => { el.removeAttribute('data-tilda-rule-minlength'); el.removeAttribute('data-tilda-rule-maxlength'); });
  set(field.name, data.name || (f.querySelector('[name="kd_source"]') ? contact : `${contact} (${src})`));
  set('kd_source', src);
  // телефон — в поле телефона Тильды (видимая часть и скрытое итоговое значение), Telegram и источник — отдельными полями:
  // Tilda CRM сама заведет для них колонки
  if (data.phone) {
    // российский номер (11 цифр с 7 или 8, или 10 цифр) приводим к виду маски Тильды: +7 (000) 000-00-00;
    // в видимую часть поля — без кода страны, в скрытое итоговое поле — целиком
    let d = data.phone.replace(/\D/g, '');
    if (d.length === 10) d = '7' + d;
    if (d.length === 11 && /^[78]/.test(d)) d = '7' + d.slice(1);
    const ru = d.length === 11 && d[0] === '7';
    const local = ru ? `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}` : data.phone;
    const full = ru ? `+7 ${local}` : data.phone;
    f.querySelectorAll('input[type="tel"]').forEach(el => { el.value = local; });
    f.querySelectorAll('.js-phonemask-result, [name="Phone"], [name="phone"], [name="Телефон"]').forEach(el => { el.value = full; });
    data.phone = full;
  }
  // остальные видимые поля формы заполняем по их подписи: обязательные поля Тильда проверяет и на сервере
  // (поле в форме могут добавить в Тильде в любой момент — например, «Telegram» с именем Input)
  f.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(el => {
    if (el.value.trim() || el.name === 'form-spec-comments' || el.type === 'hidden') return;
    const g = el.closest('[data-field-name]');
    const label = [el.placeholder, el.name, g && g.dataset.fieldName, g && g.textContent].join(' ').toLowerCase();
    const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const v = /telegram|телеграм|\btg\b|\bтг\b|ник/.test(label) ? data.tg
      : /mail|почт/.test(label) ? (mailOk ? contact : '')
      : /имя|name|фио/.test(label) ? data.name
      : /телефон|phone/.test(label) ? data.phone
      : `${contact} (${src})`;
    if (v) el.value = v;
  });
  const extra = (name, v) => { let el = f.querySelector(`input[name="${name}"]`); if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; f.appendChild(el); } el.value = v; };
  if (data.tg) extra('Telegram', data.tg);
  if (data.name) extra('Источник', src);
  // если оставили почту — она идет и в поле Email
  const mail = f.querySelector('[name="Email"], [name="email"], input[type="email"]');
  if (mail && mail !== field && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) set(mail.name, contact);
  f.querySelectorAll('input[type="checkbox"]').forEach(c => { if (!c.checked) c.click(); });   // галочки посетитель уже отметил в игре
  // успех Тильда показывает по-разному: класс у формы, блок «спасибо» в форме или всплывающее окно (data-success-popup);
  // плюс событие tildaform:aftersuccess. Ошибку — блоком ошибок в форме
  let done = false;
  // видимость считаем по display: окно «спасибо» Тильды на время отправки только невидимо (visibility, см. style.css)
  const vis = el => el && getComputedStyle(el).display !== 'none';
  const ok = () => done || f.classList.contains('js-send-form-success')
    || [...f.querySelectorAll('.js-successbox, .t-form__successbox')].some(vis)
    || [...document.querySelectorAll('.t-form-success-popup')].some(vis);
  root.classList.add('kd-sending');
  const bad = () => [...f.querySelectorAll('.js-errorbox-all, .t-form__errorbox-wrapper')].some(vis);
  f.addEventListener('tildaform:aftersuccess', () => { done = true; }, { once: true });
  window.jQuery?.(f).one?.('tildaform:aftersuccess', () => { done = true; });
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (f.querySelector('[type="submit"], .t-submit') || {}).click?.();
    const iv = setInterval(() => {
      if (ok()) { clearInterval(iv); document.querySelectorAll('.t-form-success-popup').forEach(p => { p.style.display = 'none'; }); document.body.classList.remove('t-body_success-popup-showed'); setTimeout(() => root.classList.remove('kd-sending'), 300); resolve(); }
      else if (bad() || Date.now() - t0 > 12000) { clearInterval(iv); root.classList.remove('kd-sending'); reject(new Error('форма Тильды не приняла заявку')); }
    }, 200);
  });
}
$('#ttt').addEventListener('submit', e => {
  e.preventDefault();
  const G = SITE.game, form = e.target;
  const el = n => form.elements.namedItem(n);   // form.name — это имя самой формы, поэтому поля берем так
  const data = { name: el('name')?.value.trim(), phone: el('phone')?.value.trim(), tg: el('tg')?.value.trim() };
  if (data.tg && !data.tg.startsWith('@') && !/^https?:/.test(data.tg)) data.tg = '@' + data.tg;
  const contact = el('contact') ? el('contact').value.trim() : [data.name, data.phone, data.tg].filter(Boolean).join(', ');
  if (!contact) return;
  const status = $('.ttt-status'), btn = form.querySelector('.btn');
  btn.disabled = true; status.innerHTML = T(G.sending || '');
  sendGameContact(contact, data).then(() => {
    status.innerHTML = T(G.sent);
    form.remove();
  }).catch(() => {
    // не получилось (на странице нет формы Тильды или она не приняла заявку) — сами никуда не уводим,
    // показываем ссылку: готовое сообщение в Telegram с контактом
    btn.disabled = false;
    status.innerHTML = `${T(G.failed)} <a href="${SITE.telegram}?text=${encodeURIComponent(G.message + contact)}" target="_blank" rel="noopener">Telegram</a>`;
  });
});


/* ================================================================
   БЕНЗИНОВАЯ ПЛЕНКА НА ЗАГОЛОВКЕ ПЕРВОГО ЭКРАНА (серьезная версия)
   Под курсором по буквам едва заметно текут кольца-переливы,
   как пятно бензина на асфальте. Сила и размер — в OIL.
   ================================================================ */
const OIL = {
  radius: 260,     // размер пятна, px
  strength: 0.42,  // насколько заметно: 0 — не видно, 1 — ярко
  rings: 14,       // сколько цветных колец в пятне
  speed: 0.35,     // как быстро текут переливы
  colors: ['#C86BD8', '#4F7BF2', '#3FD3C9', '#9BE36A', '#E9E36A', '#3FD3C9', '#4F7BF2'],   // без оранжевого
};
{
  const h1 = document.querySelector('#hero .h1');
  if (h1) {
    let tx = -999, ty = -999, x = -999, y = -999, r = 0, tr = 0, running = false;
    const rgbOf = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const cols = OIL.colors.map(rgbOf);
    h1.classList.add('heat');
    h1.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; tr = isFun() || reduced ? 0 : OIL.radius; if (x < -900) { x = tx; y = ty; } start(); });
    h1.addEventListener('pointerleave', () => { tr = 0; start(); });
    const start = () => { if (!running) { running = true; requestAnimationFrame(step); } };
    function stops(t){
      // цвета плавно перетекают из кольца в кольцо и уходят в прозрачность к краю
      const out = [];
      for (let i = 0; i <= OIL.rings; i++){
        const k = i / OIL.rings, f = (k * 3.2 + t) % cols.length, j = Math.floor(f), m = f - j;
        const a = cols[j], b = cols[(j + 1) % cols.length];
        const c = a.map((v, n) => Math.round(v + (b[n] - v) * m));
        const alpha = OIL.strength * Math.pow(1 - k, 1.6) * (0.75 + 0.25 * Math.sin(k * 19 + t * 4));
        out.push(`rgba(${c},${alpha.toFixed(3)}) ${(k * 100).toFixed(1)}%`);
      }
      return out.join(',');
    }
    function step(now){
      x += (tx - x) * 0.12; y += (ty - y) * 0.12; r += (tr - r) * 0.08;
      h1.style.setProperty('--oil', stops(now / 1000 * OIL.speed));
      h1.querySelectorAll('.w > span').forEach(sp => {
        const b = sp.getBoundingClientRect();
        sp.style.setProperty('--hx', (x - b.left).toFixed(1) + 'px');
        sp.style.setProperty('--hy', (y - b.top).toFixed(1) + 'px');
        sp.style.setProperty('--hr', r.toFixed(1) + 'px');
      });
      if (r > 0.5 || tr > 0) requestAnimationFrame(step);   // пока пятно на месте, переливы текут
      else running = false;
    }
  }
}


/* ================================================================
   МЕНЮ НА ТЕЛЕФОНЕ И ПЛАНШЕТЕ
   Пункты шапки прячутся под кнопку «меню»; кнопка создается здесь,
   поэтому разметку шапки на Тильде менять не нужно
   ================================================================ */
{
  const head = document.querySelector('.head'), nav = document.getElementById('nav');
  if (head && nav && !document.getElementById('menuBtn')) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'menuBtn'; b.className = 'menu-btn';
    b.setAttribute('aria-controls', 'nav'); b.setAttribute('aria-expanded', 'false');
    b.textContent = 'меню';
    nav.after(b);
    const set = open => { head.classList.toggle('menu-open', open); b.setAttribute('aria-expanded', open); b.textContent = open ? 'закрыть' : 'меню'; };
    b.addEventListener('click', () => set(!head.classList.contains('menu-open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }
}


/* ================================================================
   ЗАПУСК
   ================================================================ */
let saved = 'light';
try { saved = localStorage.getItem('kd-mode') || 'light'; } catch (e) {}
root.dataset.theme = saved;
document.querySelectorAll('.switch').forEach(s => s.setAttribute('aria-checked', saved === 'dark'));
renderTexts();
renderLists();
/* на страницах NDA кнопки «связаться» нет */
if (isNdaPage) document.querySelector('#fab')?.remove();
setTimeout(() => $('#fab').classList.add('in'), 700);   // «связаться» проявляется по буквам
/* «связаться» прячется на первом экране; в дружеской версии «поболтать» появляется ближе к середине страницы */
function placeFab(){
  const far = isFun() ? (document.documentElement.scrollHeight - innerHeight) * 0.4 : innerHeight * 0.8;
  $('#fab').classList.toggle('away', caseIndex == null && scrollY < far);
}
addEventListener('scroll', placeFab, { passive: true });
addEventListener('resize', placeFab);
addEventListener('theme:apply', placeFab);

/* ================================================================
   ОБЯЗАТЕЛЬНОЕ ПО ЗАКОНУ: ссылки на политику и согласие в подвале и окно про cookie.
   Тексты — SITE.legal в content.js. Разметку Тильды не трогаем: всё добавляется кодом
   ================================================================ */
function renderLegal(){
  const L = SITE.legal; if (!L) return;
  document.querySelectorAll('.foot').forEach(f => {
    let box = f.querySelector('.foot-legal');
    if (!box) { box = document.createElement('span'); box.className = 'foot-legal'; f.appendChild(box); }
    box.innerHTML = L.links.map(x => `<a href="${x.link}" target="_blank" rel="noopener">${T(x.text)}</a>`).join('');
  });
  let ok = false; try { ok = localStorage.getItem('kd-cookie') === '1'; } catch (e) {}
  let bar = document.getElementById('cookieBar');
  if (ok) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('div'); bar.id = 'cookieBar'; bar.className = 'cookie-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'cookie');
    document.body.appendChild(bar);
    bar.addEventListener('click', e => {
      if (!e.target.closest('.cookie-ok')) return;
      try { localStorage.setItem('kd-cookie', '1'); } catch (er) {}
      bar.classList.remove('show'); root.classList.remove('cookie-on'); setTimeout(() => bar.remove(), 400);
    });
    // кнопки «связаться» и «наверх» поднимаются над плашкой на ее высоту (только на телефоне, см. style.css)
    // насколько поднять: низ кнопки (без текущего подъема) должен оказаться на 8 px выше верха плашки
    const lift = () => {
      const fab = document.getElementById('fab'); if (!fab) return;
      // низ кнопки без подъема — из ее bottom в стилях (не зависит от анимации); верх плашки — тоже из стилей
      const fabBottom = innerHeight - (parseFloat(getComputedStyle(fab).bottom) || 0);
      const barTop = innerHeight - (parseFloat(getComputedStyle(bar).bottom) || 0) - bar.offsetHeight;
      const need = fabBottom - (barTop - 8);
      root.style.setProperty('--cookie-h', Math.max(0, Math.round(need)) + 'px');
    };
    setTimeout(() => { bar.classList.add('show'); lift(); root.classList.add('cookie-on'); }, 600);
    let liftQ = 0;
    const relift = () => { if (!bar.isConnected || liftQ) return; liftQ = requestAnimationFrame(() => { liftQ = 0; lift(); }); };
    addEventListener('resize', relift); addEventListener('scroll', relift, { passive: true });
  }
  const C = L.cookie;
  bar.innerHTML = `<p>${T(C.text)} <a href="${L.links[0].link}" target="_blank" rel="noopener">${T(C.policy)}</a></p><button class="cookie-ok" type="button">${T(C.accept)}</button>`;
}
renderLegal();
addEventListener('theme:apply', renderLegal);

/* у кнопки «связаться» — значок Telegram, чтобы было понятно, куда она ведет (разметку Тильды не трогаем) */
{
  const fab = document.getElementById('fab');
  if (fab && !fab.querySelector('.fab-tg')) fab.insertAdjacentHTML('afterbegin',
    '<svg class="fab-tg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.4 4.3 2.9 11.4c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.8.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.3-1.9Zm-3.3 4-8 7.2-.3 3.3-1.5-4.6 9.4-5.9c.4-.3.8 0 .4 0Z"/></svg>');
}
placeFab();
requestAnimationFrame(() => requestAnimationFrame(() => watchReveals(document, true)));
if (document.fonts) document.fonts.ready.then(layoutStrings);
readHash();
})();
