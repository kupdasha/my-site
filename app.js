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
if (window.__kdApp) return; window.__kdApp = true;

/* На Тильде тексты (content.js) приходят с GitHub как есть, с адресами прототипа.
   Здесь они переводятся на адреса сайта: index.html → /, about.html → /about,
   а картинки img/… — на тот же GitHub, откуда пришел content.js */
{
  const src = document.currentScript?.src || [...document.scripts].map(s => s.src).find(s => /\/app\.js(\?|$)/.test(s)) || '';
  const onTilda = !document.querySelector('script[src="content.js"]');
  const base = src.replace(/app\.js(\?.*)?$/, '');
  if (onTilda && typeof SITE !== 'undefined') {
    const PAGES = [[/^index\.html/, '/'], [/^about\.html/, '/about'], [/^speaker\.html/, '/speaker'], [/^nda\.html/, '/n_d_a']];
    const fix = s => {
      if (s.startsWith('img/')) return base + s;
      for (const [re, to] of PAGES) if (re.test(s)) return s.replace(re, to).replace('/#', '/#').replace(/^\/\/+/, '/');
      return s;
    };
    const walk = o => { for (const k in o) { const v = o[k]; if (typeof v === 'string') o[k] = fix(v); else if (v && typeof v === 'object') walk(v); } };
    walk(SITE);
    SITE.homePage = SITE.homePage || '/';
  }
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
    if (isFun() && SITE.photos.dating) {
      // дружеская версия: колода, как в приложении знакомств
      const D = SITE.photos.dating;
      strip.className = 'deck-wrap';
      strip.innerHTML = `<div class="deck" id="deck">${SITE.photos.items.map(photo).map((ph, k) => `
        <div class="swipe-card" data-k="${k}">
          <img src="${ph.src}" alt="Дарья Купцова" draggable="false" style="object-position:${ph.pos}">
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
function viewShow(){
  viewer.querySelector('.viewer-count').textContent = viewList.length > 1 ? `${viewAt + 1} из ${viewList.length}` : '';
  viewer.classList.toggle('single', viewList.length < 2);
}
function openViewer(list, k, from){
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
    const [size, side] = p.size ? [p.size, p.side] : PATTERN[k % PATTERN.length];
    const ratio = p.ratio || (legacyVideo(p) || size === 'большой' ? '16/9' : '16/10');
    const inner = `
      <span class="media" style="aspect-ratio:${ratio}">${mediaHTML(p)}</span>
      <span class="meta"><span class="ttl"><h3>${T(p.title)}</h3>${yearHTML(p)}</span>${p.tag ? `<span class="tag">${T(p.tag)}</span>` : ''}</span>
      ${p.short ? `<p>${T(p.short)}</p>` : ''}`;
    const cls = `work ${SIZE[size] || 'm'} ${side === 'справа' ? 'right' : ''}`;
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
  strings = $$('#dirList .string').map(el => ({
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
  const img = p.image ? `<img src="${p.image}" alt="" loading="lazy"${p.pos ? ` style="object-position:${p.pos}"` : ''}>` : '';
  // ролик подгружается, только когда до карточки остается экран; до этого видна обложка
  if (m && m.type === 'file') return `<video muted loop playsinline preload="none" ${p.image ? `poster="${p.image}"` : ''} data-src="${m.src}"></video>`;
  // still: true — в сетке только статичная обложка, без ролика
  if (p.still && img) return img;
  if (m && (m.type === 'vimeo' || m.type === 'kinescope')) return img + `<iframe data-src="${embedURL(m, true)}"${p.ratio ? ` style="--vr:${p.ratio}"` : ''} allow="autoplay" tabindex="-1" aria-hidden="true"></iframe>`;
  if (img) return img;
  if (m && m.type !== 'image') return `<iframe class="still" data-src="${embedURL(m, true)}" allow="${FRAME_ALLOW}" tabindex="-1" aria-hidden="true"></iframe>`;
  return '';
}

/* Сетка раскладывается сама, если у проекта не указаны size и side */
const PATTERN = [['большой', 'слева'], ['маленький', 'слева'], ['средний', 'справа'], ['большой', 'справа'], ['средний', 'слева'], ['маленький', 'справа']];
let workFilter = '';
/* проект может быть в нескольких категориях: cat: ['продакшен', '3D'] */
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
  let n = 0;
  $('#workList').innerHTML = W.items.map((p, k) => {
    if (p.other || !inCat(p)) return '';
    const [size, side] = p.size ? [p.size, p.side] : PATTERN[n % PATTERN.length];
    n++;
    const ratio = p.ratio || (legacyVideo(p) || size === 'большой' ? '16/9' : '16/10');   // у видео всегда 16:9
    return `
    <button class="work ${SIZE[size] || 'm'} ${side === 'справа' ? 'right' : ''}" data-k="${k}" data-reveal>
      <span class="media" style="aspect-ratio:${ratio}">${mediaHTML(p)}</span>
      <span class="meta"><span class="ttl"><h3>${T(p.title)}</h3>${yearHTML(p)}</span>${p.tag ? `<span class="tag">${T(p.tag)}</span>` : ''}</span>
      ${p.short ? `<p>${T(p.short)}</p>` : ''}
    </button>`;
  }).join('');
  $$('#workList .media').forEach(watchMedia);
  // «другие работы» — простым списком под сеткой
  const other = W.items.map((p, k) => [p, k]).filter(([p]) => p.other && inCat(p));
  $('#otherWorks').hidden = !other.length;
  $('#otherList').innerHTML = other.map(([p, k]) =>
    `<button class="article" data-k="${k}"><span class="article-source">${T(p.tag || [].concat(p.cat)[0])}</span><span class="article-title">${T(p.title)}${yearHTML(p)}</span><span class="go">${ARROW}</span></button>`).join('');
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
  if (video) { if (e.isIntersecting && !video.src && video.dataset.src) video.src = video.dataset.src; e.isIntersecting ? video.play().catch(() => {}) : video.pause(); }
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
$('#ndaProjects').addEventListener('click', e => {
  const w = e.target.closest('button.work');
  if (w) openInTab(w.dataset.k);
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
const previewOf = w => { const m = parseMedia(legacyVideo(w)); return w.image || (m && m.type === 'drive' ? `https://drive.google.com/thumbnail?id=${m.id}&sz=w800` : ''); };
function showPreviewImage(img){
  clientPreview.classList.toggle('show', !!img);
  if (img && clientPreview.dataset.src !== img) { clientPreview.dataset.src = img; clientPreview.innerHTML = `<img src="${img}" alt="">`; }
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
  const m = parseMedia(legacyVideo(p));
  if (m && m.type === 'file') return `<video src="${m.src}" ${p.image ? `poster="${p.image}"` : ''} muted loop playsinline autoplay></video>`;
  const poster = p.image ? `<img src="${p.image}" alt=""${p.pos ? ` style="object-position:${p.pos}"` : ''}>` : '';
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
const blockHead = x => `<div class="case-text"><span class="case-label">${T(x.title)}</span><p>${T(x.text)}</p></div>`;
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
    const cls = 'camp-shot frame' + (src.blend ? ' blend' : '') + (src.frame ? ' cropped' : '');
    return html.replace('class="camp-shot frame"', `class="${cls}" style="--ar:${src.ratio || 16 / 9}${src.frame ? ';--fr:' + src.frame : ''}"`);
  }
  const m = parseMedia(src);
  if (m.type === 'image') return `<button class="camp-shot" aria-label="Увеличить"><img src="${m.src}" alt="" loading="lazy"></button>`;
  if (m.type === 'file') return `<div class="camp-shot frame"><video src="${m.src}" muted loop playsinline autoplay></video></div>`;
  // Kinescope играет сам без звука, как живая картинка; остальные — обычный плеер
  const url = m.type === 'kinescope' ? embedURL(m, true) : embedURL(m, false).replace('&autoplay=1', '');
  // ролик загружается, когда ячейка доезжает до экрана, — тогда Kinescope сам запускается
  return `<div class="camp-shot frame"><iframe data-src="${url}" allow="${FRAME_ALLOW}" allowfullscreen></iframe></div>`;
}
// narrow: true — ряд уже, по ширине текстовой колонки (для картинок низкого разрешения)
function campRow(items, caption, narrow){
  return `<div class="wrap camp-rowbox${narrow ? ' narrow' : ''}">${caption ? `<p class="camp-cap">${T(caption)}</p>` : ''}<div class="camp-row">${items.map(campCell).join('')}</div></div>`;
}
// коллаж: ячейки раскладываются по схеме areas, у каждой подпись сверху; фото увеличиваются по нажатию
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
    if (g && g.collage) { flush(); out.push(campCollage(g)); }
    else if (g && g.row) { flush(); out.push(campRow(g.row, g.caption)); }
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
  if (x && x.morph) return morphHTML(x);
  if (x && x.row) return campRow(x.row, x.caption, x.narrow);
  if (x && x.collage) return campCollage(x);
  // { src: 'kinescope:ID', caption: 'подпись' } — ролик или картинка с подписью под ней
  if (x && x.src) return `<div class="wrap">${shotHTML(x.src)}${x.caption ? `<p class="case-note shot-note">${T(x.caption)}</p>` : ''}</div>`;
  return `<div class="wrap">${shotHTML(x)}</div>`;
}
function renderCase(k, keepScroll){
  // следующий проект — без отдельных страниц (page) и без самого себя
  const W = SITE.works, items = caseItems(), p = items[k];
  let nk = (k + 1) % items.length;
  while (nk !== k && items[nk].page) nk = (nk + 1) % items.length;
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
  let body = '', g = 0;
  // schemeCols: все блоки схемы одной строкой, колонками (как текст кампаний)
  if (p.schemeCols) {
    body += `<div class="wrap"><div class="camp-head scheme-cols">${
      blocks.map(([label, par]) => `<div class="camp-col" style="grid-column:span ${Math.floor(12 / blocks.length)}"><span class="camp-label">${T(label)}</span><p>${T(par)}</p></div>`).join('')}</div></div>`;
    blocks = [];
  }
  // twoCols: ['solution'] — длинный блок схемы набран мельче, в две колонки
  const twoCols = p.twoCols || [];
  blocks.forEach(([label, par, key]) => {
    // award — ярлык премии слева от текста результата: черная лента, кольцо и блестки
    const text = key === 'result' && p.award ? `<div class="case-award-row">${awardHTML(p.award)}<p>${T(par)}</p></div>` : `<p>${T(par)}</p>`;
    body += `<div class="wrap"><div class="case-text${twoCols.includes(key) ? ' cols2' : ''}" data-reveal><span class="case-label">${T(label)}</span>${text}${
      key === 'role' && p.team ? teamHTML(p.team) : ''}</div></div>`;
    if (p.thermal && p.thermal.after === key) body += thermalHTML(p.thermal);
    if (g < gallery.length) body += galleryItem(gallery[g++]);
    if (p.brandkit && p.brandkit.after === key) body += brandkitHTML(p.brandkit);
  });
  while (g < gallery.length) body += galleryItem(gallery[g++]);
  // кампании внутри кейса: меню, у каждой — текст в три колонки (название, задача, решение) и макеты рядами
  if (p.campaigns && p.campaigns.length) body += campaignsHTML(p.campaigns, W.campaigns);
  // презентация — в самом конце, перед ссылками
  // deck: 'drive:ID' — PDF листается во встроенном окне; список картинок — слайды крупно, один под другим,
  // по нажатию увеличиваются и листаются стрелками
  // deckTitle — крупная надпись над презентацией
  if (p.deck && p.deckTitle) body += `<div class="wrap"><h2 class="deck-title">${T(p.deckTitle)}</h2></div>`;
  if (Array.isArray(p.deck)) body += p.deck.map(s => campRow([s])).join('');
  else if (p.deck) body += `<div class="wrap case-deck">${shotHTML(p.deck)}</div>`;
  // links: [] — ссылок в конце нет; поле не указано — ссылка на старую страницу
  const links = p.links || [{ text: W.more, link: p.link }];
  if (links.length) body += `<div class="wrap"><div class="case-text case-links" data-reveal>${links.map(l => `<a class="link" href="${l.link}">${T(l.text)}</a>`).join('')}</div></div>`;

  caseContent.innerHTML = `
    <div class="wrap case-head">
      <div class="case-ttl"><h1 class="case-title split" id="caseTitle"></h1>${yearHTML(p)}</div>
      ${p.short ? `<p class="case-sub" data-reveal>${T(p.short)}</p>` : ''}
      ${p.note ? `<p class="case-note" data-reveal>${T(p.note)}</p>` : ''}
    </div>
    <div class="case-hero"${p.ratio ? ` style="aspect-ratio:${p.ratio}"` : ''}>${heroHTML(p)}</div>
    ${p.heroNote ? `<div class="wrap"><p class="case-note hero-note">${T(p.heroNote)}</p></div>` : ''}
    <div class="case-body">${body}</div>
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
  const morphs = (p.gallery || []).filter(x => x && x.morph);
  caseContent.querySelectorAll('.morph').forEach((box, i) => startMorph(box, morphs[i].morph));
  caseContent.querySelectorAll('.thermo-box').forEach(box => startThermal(box, p.thermal));
  caseContent.querySelectorAll('.levit').forEach(startFloat);
  caseContent.querySelectorAll('.reel').forEach(startReel);
  caseContent.querySelectorAll('.t-counter').forEach(startCounter);
  caseContent.querySelectorAll('.mix,.spin,.two-grid,.combo,.reel').forEach(el => brandWatcher.observe(el));
  if (!keepScroll) caseEl.scrollTop = 0;
}

function openCase(k){
  caseIndex = k;
  renderCase(k);
  caseEl.classList.add('open');
  placeFab();
  document.body.classList.add('locked');
  caseEl.focus?.();
}
function closeCase(){
  if (caseIndex == null) return;
  caseIndex = null;
  caseEl.classList.remove('open');
  placeFab();
  document.body.classList.remove('locked');
  setTimeout(() => { if (caseIndex == null) caseContent.innerHTML = ''; }, 900);
}
function readHash(){
  const m = /^#case-(\d+)$/.exec(location.hash);
  const k = m ? +m[1] - 1 : null;
  if (k != null && caseItems()[k] && !caseItems()[k].page) { openedByClick = openedByClick || false; openCase(k); }
  else closeCase();
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
  $('#toTop').classList.toggle('show', y > innerHeight * 0.8);   // шапка всегда на месте; «наверх» — когда пролистали экран
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
$('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
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
  if (w && w.who === 'x') after = `<form class="ttt-form" id="tttForm"><input class="ttt-input" name="contact" required placeholder="${G.field}" aria-label="${G.field}"><button class="btn btn-accent"><span class="spell">${T(G.send)}</span><span class="arr">→</span></button></form>`;
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
$('#ttt').addEventListener('submit', e => {
  e.preventDefault();
  const contact = e.target.contact.value.trim();
  if (!contact) return;
  // контакт уходит Даше в Telegram готовым сообщением — посетителю остается нажать «отправить»
  location.href = `${SITE.telegram}?text=${encodeURIComponent(SITE.game.message + contact)}`;
  $('.ttt-status').innerHTML = T(SITE.game.sent);
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
setTimeout(() => $('#fab').classList.add('in'), 700);   // «связаться» проявляется по буквам
/* «связаться» прячется на первом экране; в дружеской версии «поболтать» появляется ближе к середине страницы */
function placeFab(){
  const far = isFun() ? (document.documentElement.scrollHeight - innerHeight) * 0.4 : innerHeight * 0.8;
  $('#fab').classList.toggle('away', caseIndex == null && scrollY < far);
}
addEventListener('scroll', placeFab, { passive: true });
addEventListener('resize', placeFab);
addEventListener('theme:apply', placeFab);
placeFab();
requestAnimationFrame(() => requestAnimationFrame(() => watchReveals(document, true)));
if (document.fonts) document.fonts.ready.then(layoutStrings);
readHash();
})();
