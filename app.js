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
const isAboutPage = document.body.classList.contains('page-about');
const isSpeakerPage = document.body.classList.contains('page-speaker');
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
  document.title = pick(isSpeakerPage ? SITE.speaker.pageTitle : isAboutPage ? SITE.about.pageTitle : SITE.pageTitle);
  $('#photo').src = SITE.about.photo;
}

function renderLists(){
  const here = location.pathname.split('/').pop() || 'index.html';
  $('#nav').innerHTML = SITE.nav.map(n => {
    const page = n.link.split('#')[0];
    return page === here && !n.link.includes('#')
      ? `<span class="nav-here" aria-current="page">${T(n.text)}</span>`
      : `<a class="link" href="${page === here ? '#' + n.link.split('#')[1] : n.link}">${T(n.text)}</a>`;
  }).join('');

  $('#facts').innerHTML = SITE.about.facts.map((f, k) =>
    `<div class="fact" data-reveal style="--d:${k * 0.06}s"><span>${T(f.name)}</span><span>${T(f.detail)}</span></div>`).join('');

  $('#clients').innerHTML = SITE.clients.items.map((c, k) => {
    const i = c.project ? SITE.works.items.findIndex(w => w.title === c.project) : -1;
    const style = `--d:${(k * 0.03).toFixed(2)}s;${c.color ? `--c:${c.color}` : ''}`;
    const cls = `client${c.color ? ' tinted' : ''}`;
    return i >= 0
      ? `<a class="${cls}" href="index.html#case-${i + 1}" data-k="${k}" data-reveal style="${style}">${T(c.name)}</a>`
      : `<span class="${cls}" data-k="${k}" data-reveal style="${style}">${T(c.name)}</span>`;
  }).join('');
  $('#clientsWhat').innerHTML = T(SITE.clients.hint);

  $('#contactLinks').innerHTML = SITE.contact.links.map((l, k) =>
    `<a class="btn ${k === 0 ? 'btn-accent' : 'btn-line'} big-btn${k === 0 ? ' tease' : ''}" href="${l.link}"><span class="spell">${T(l.text)}</span><span class="arr">→</span></a>`).join('');

  renderPodcast();
  renderAboutExtras();
  renderSpeaker();
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
  if (SITE.articles) $('#articleList').innerHTML = SITE.articles.items.map((a, k) =>
    `<a class="article" href="${a.link}" data-reveal style="--d:${(k * 0.05).toFixed(2)}s"><span class="article-source">${T(a.source)}</span><span class="article-title">${T(a.title)}</span><span class="go">${ARROW}</span></a>`).join('');
  if (SITE.podcast && SITE.podcast.links) $('#podLinks').innerHTML = SITE.podcast.links.map(l => `<a class="link" href="${l.link}">${T(l.text)}</a>`).join('');
}


/* фото по клику открывается на весь экран; листать — стрелками, закрыть — клик или Esc */
const viewer = document.createElement('div');
viewer.className = 'viewer'; viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-label', 'Фото');
viewer.innerHTML = '<img alt=""><button class="viewer-close" aria-label="Закрыть"><svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l12 12M16 4L4 16"/></svg></button>';
document.body.appendChild(viewer);
let viewList = [], viewAt = 0;
function openViewer(list, k){ viewList = list; viewAt = k; viewer.querySelector('img').src = list[k]; viewer.classList.add('open'); }
function closeViewer(){ viewer.classList.remove('open'); }
viewer.addEventListener('click', closeViewer);
addEventListener('keydown', e => {
  if (!viewer.classList.contains('open')) return;
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    viewAt = (viewAt + (e.key === 'ArrowRight' ? 1 : -1) + viewList.length) % viewList.length;
    viewer.querySelector('img').src = viewList[viewAt];
  }
});
document.addEventListener('click', e => {
  const f = e.target.closest('.photo');
  if (!f) return;
  const group = [...f.parentElement.querySelectorAll('.photo img')];
  openViewer(group.map(i => i.src), group.indexOf(f.querySelector('img')));
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

function setMode(mode){
  const apply = () => {
    root.dataset.theme = mode;
    sw.setAttribute('aria-checked', mode === 'dark');
    renderTexts(); renderLists();
    if (caseIndex != null) renderCase(caseIndex, true);
    try { localStorage.setItem('kd-mode', mode); } catch (e) {}
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

sw.addEventListener('click', e => {
  switchSeen = true;
  sw.classList.remove('unseen', 'nudge');
  try { localStorage.setItem('kd-switch-seen', '1'); } catch (e) {}
  setMode(isFun() ? 'light' : 'dark');
});


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

/* Видео и презентации: файл mp4 или ролик с площадки — 'vimeo:ID', 'vk:OID_ID',
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
    case 'vimeo': return preview
      ? `https://player.vimeo.com/video/${m.id}?background=1&muted=1&loop=1&autopause=0&dnt=1`
      : `https://player.vimeo.com/video/${m.id}?autoplay=1&muted=1&loop=1&dnt=1&title=0&byline=0&portrait=0`;
    case 'vk': { const [oid, id] = m.id.split(/_(?=\d+$)/); return `https://vkvideo.ru/video_ext.php?oid=${oid}&id=${id}&hd=2${preview ? '' : '&autoplay=1'}`; }
    case 'kinescope': return `https://kinescope.io/embed/${m.id}${preview ? '?autoplay=1&muted=1&loop=1&controls=0' : ''}`;
    case 'rutube': return `https://rutube.ru/play/embed/${m.id}`;
    case 'drive': return `https://drive.google.com/file/d/${m.id}/preview`;
  }
  return '';
}
const FRAME_ALLOW = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write';
const legacyVideo = p => p.video || (p.vimeo ? 'vimeo:' + p.vimeo : '');

/* Превью проекта в сетке: картинка; поверх — тихое видео (mp4 или Vimeo).
   Если картинки нет — сам проигрыватель площадки с его обложкой */
function mediaHTML(p){
  const m = parseMedia(legacyVideo(p));
  const img = p.image ? `<img src="${p.image}" alt="" loading="lazy">` : '';
  if (m && m.type === 'file') return `<video muted loop playsinline autoplay preload="auto" ${p.image ? `poster="${p.image}"` : ''} src="${m.src}"></video>`;
  if (m && m.type === 'vimeo') return img + `<iframe data-src="${embedURL(m, true)}" allow="autoplay" tabindex="-1" aria-hidden="true"></iframe>`;
  if (img) return img;
  if (m && m.type !== 'image') return `<iframe class="still" data-src="${embedURL(m, true)}" allow="${FRAME_ALLOW}" tabindex="-1" aria-hidden="true"></iframe>`;
  return '';
}

/* Сетка раскладывается сама, если у проекта не указаны size и side */
const PATTERN = [['большой', 'слева'], ['маленький', 'слева'], ['средний', 'справа'], ['большой', 'справа'], ['средний', 'слева'], ['маленький', 'справа']];
let workFilter = '';
function renderWorks(){
  const W = SITE.works;
  $('#workFilters').innerHTML = (W.filters || []).map(f =>
    `<button class="chip${f.key === workFilter ? ' on' : ''}" data-cat="${f.key}">${T(f.text)}</button>`).join('');
  let n = 0;
  $('#workList').innerHTML = W.items.map((p, k) => {
    if (workFilter && p.cat !== workFilter) return '';
    const [size, side] = p.size ? [p.size, p.side] : PATTERN[n % PATTERN.length];
    n++;
    const ratio = p.ratio || (size === 'большой' ? '16/9' : '16/10');
    return `
    <button class="work ${SIZE[size] || 'm'} ${side === 'справа' ? 'right' : ''}" data-k="${k}" data-reveal>
      <span class="media" style="aspect-ratio:${ratio}">${mediaHTML(p)}</span>
      <span class="meta"><h3>${T(p.title)}</h3>${p.tag ? `<span class="tag">${T(p.tag)}</span>` : ''}</span>
      ${p.short ? `<p>${T(p.short)}</p>` : ''}
    </button>`;
  }).join('');
  $$('#workList .media').forEach(watchMedia);
}
function setFilter(cat){
  workFilter = cat;
  renderWorks();
  spellOut($('#workList'));
  watchReveals($('#workList'), true);
  dispatchEvent(new CustomEvent('works:rendered'));
}
$('#workFilters').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) setFilter(c.dataset.cat); });

/* Видео играет, только пока проект на экране; Vimeo грузится при первом показе */
const mediaSizer = new ResizeObserver(es => es.forEach(e => {
  e.target.style.setProperty('--pw', e.contentRect.width + 'px');
  e.target.style.setProperty('--ph', e.contentRect.height + 'px');
}));
const mediaWatcher = new IntersectionObserver(es => es.forEach(e => {
  const video = e.target.querySelector('video'), frame = e.target.querySelector('iframe[data-src]');
  if (video) e.isIntersecting ? video.play().catch(() => {}) : video.pause();
  if (frame && e.isIntersecting && !frame.src) {
    frame.addEventListener('load', () => setTimeout(() => frame.classList.add('ready'), 600), { once: true });
    frame.src = frame.dataset.src;
  }
}), { threshold: 0.15 });
function watchMedia(el){ mediaSizer.observe(el); mediaWatcher.observe(el); }

$('#workList').addEventListener('click', e => {
  const w = e.target.closest('.work');
  if (w) location.hash = 'case-' + (+w.dataset.k + 1);
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
  showClientPreview(c);
  if (!c || !c.what) { $('#clientsWhat').innerHTML = T(SITE.clients.hint); return; }
  $('#clientsWhat').innerHTML = `${T(c.name)} — ${T(c.what)}` + (c.project ? `<span class="client-open">${T(SITE.clients.open)} →</span>` : '');
}
/* превью проекта рядом с курсором, пока он над именем клиента */
const clientPreview = document.createElement('div');
clientPreview.className = 'client-preview'; clientPreview.setAttribute('aria-hidden', 'true');
document.body.appendChild(clientPreview);
function showClientPreview(c){
  const w = c && c.project && SITE.works.items.find(x => x.title === c.project);
  const m = w && parseMedia(legacyVideo(w));
  const img = w && (w.image || (m && m.type === 'drive' ? `https://drive.google.com/thumbnail?id=${m.id}&sz=w800` : ''));
  clientPreview.classList.toggle('show', !!img);
  if (img) clientPreview.innerHTML = `<img src="${img}" alt=""><span>${T(w.title)}</span>`;
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
});
$('#clients').addEventListener('pointerleave', () => {
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
    const picture = p.image ? `<img src="${p.image}" alt="" loading="lazy">` : `<span class="waves" data-waves data-speed="2.6" data-colors="${cols}"></span>`;
    return `<a class="nda-item" href="${N.link}" data-reveal style="--d:${(k % 2) * 0.1}s">
      <span class="nda-media">${picture}<span class="nda-lock">${LOCK}</span></span>
      <span class="meta"><h3>${T(p.title)}</h3>${p.tag ? `<span class="tag">${T(p.tag)}</span>` : ''}</span>
    </a>`;
  }).join('');
}


/* ================================================================
   СТРАНИЦА КЕЙСА (верстка как у ONY)
   Заголовок → превью во всю ширину экрана → абзацы в правой колонке
   чередуются с макетами на всю ширину → следующий проект.
   Адрес кейса — #case-1, #case-2..., поэтому работает кнопка «назад».
   ================================================================ */
const caseEl = $('#case'), caseContent = $('#caseContent');
let caseIndex = null, openedByClick = false;

function shotHTML(src){
  const m = parseMedia(src);
  if (m.type === 'image') return `<div class="case-shot" data-reveal><img src="${m.src}" alt="" loading="lazy"></div>`;
  if (m.type === 'file') return `<div class="case-shot" data-reveal><video src="${m.src}" muted loop playsinline autoplay controls></video></div>`;
  return `<div class="case-shot frame ${m.type}" data-reveal><iframe src="${embedURL(m, false).replace('&autoplay=1', '').replace('autoplay=1&', '')}" allow="${FRAME_ALLOW}" allowfullscreen loading="lazy"></iframe></div>`;
}
function heroHTML(p){
  const m = parseMedia(legacyVideo(p));
  if (m && m.type === 'file') return `<video src="${m.src}" ${p.image ? `poster="${p.image}"` : ''} muted loop playsinline autoplay></video>`;
  if (m && m.type !== 'image') return `<iframe src="${embedURL(m, false)}" allow="${FRAME_ALLOW}" allowfullscreen></iframe>`;
  return p.image ? `<img src="${p.image}" alt="">` : '';
}

function renderCase(k, keepScroll){
  const W = SITE.works, p = W.items[k], next = W.items[(k + 1) % W.items.length];
  // story: один список абзацев или пара [формальный, дружеский]
  const raw = p.story || [];
  const story = Array.isArray(raw[0]) ? pick(raw) || [] : raw;
  // блоки: подпись слева + абзац справа
  let blocks = [];
  if (p.headed) for (let i = 0; i < story.length; i += 2) blocks.push([story[i], story[i + 1] || '']);
  else blocks = story.map((par, i) => [p.labels ? p.labels[i] || '' : i === 0 ? p.tag || '' : '', par]);
  const gallery = p.gallery || [];
  let body = '', g = 0;
  blocks.forEach(([label, par]) => {
    body += `<div class="wrap"><div class="case-text" data-reveal><span class="case-label">${T(label)}</span><p>${T(par)}</p></div></div>`;
    if (g < gallery.length) body += `<div class="wrap">${shotHTML(gallery[g++])}</div>`;
  });
  while (g < gallery.length) body += `<div class="wrap">${shotHTML(gallery[g++])}</div>`;
  const links = p.links && p.links.length ? p.links : [{ text: W.more, link: p.link }];
  body += `<div class="wrap"><div class="case-text case-links" data-reveal>${links.map(l => `<a class="link" href="${l.link}">${T(l.text)}</a>`).join('')}</div></div>`;

  caseContent.innerHTML = `
    <div class="wrap case-head">
      <h1 class="case-title split" id="caseTitle"></h1>
      ${p.short ? `<p class="case-sub" data-reveal>${T(p.short)}</p>` : ''}
    </div>
    <div class="case-hero">${heroHTML(p)}</div>
    <div class="case-body">${body}</div>
    <div class="wrap">
      <button class="case-next" data-next="${(k + 1) % W.items.length}">
        <span class="case-label">${T(W.next)}</span>
        <span class="case-title">${T(next.title)}</span>
        <span class="media">${mediaHTML(next)}</span>
      </button>
    </div>`;
  spellOut(caseContent);
  splitWords($('#caseTitle'), pick(p.title));
  requestAnimationFrame(() => requestAnimationFrame(() => $('#caseTitle').classList.add('in')));
  caseContent.querySelectorAll('.case-next .media').forEach(watchMedia);
  // в кейсе всё видно сразу, без анимации появления — так текст точно не пропадет
  caseContent.querySelectorAll('[data-reveal]').forEach(el => el.removeAttribute('data-reveal'));
  if (!keepScroll) caseEl.scrollTop = 0;
}

function openCase(k){
  caseIndex = k;
  renderCase(k);
  caseEl.classList.add('open');
  document.body.classList.add('locked');
  caseEl.focus?.();
}
function closeCase(){
  if (caseIndex == null) return;
  caseIndex = null;
  caseEl.classList.remove('open');
  document.body.classList.remove('locked');
  setTimeout(() => { if (caseIndex == null) caseContent.innerHTML = ''; }, 900);
}
function readHash(){
  const m = /^#case-(\d+)$/.exec(location.hash);
  const k = m ? +m[1] - 1 : null;
  if (k != null && SITE.works.items[k]) { openedByClick = openedByClick || false; openCase(k); }
  else closeCase();
}
addEventListener('hashchange', () => { openedByClick = true; readHash(); });
$('#caseBack').addEventListener('click', () => {
  if (openedByClick) history.back();
  else { history.replaceState(null, '', location.pathname + location.search); closeCase(); }
});
addEventListener('keydown', e => { if (e.key === 'Escape' && caseIndex != null) $('#caseBack').click(); });
caseContent.addEventListener('click', e => {
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
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 600); }, stay);
  while (box.children.length > 3) box.firstChild.remove();
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
   ТЕПЛОВОЕ ПЯТНО НА ЗАГОЛОВКЕ ПЕРВОГО ЭКРАНА (серьезная версия)
   Под курсором буквы переливаются цветами тепловизора, остальной
   текст остается обычным. Пятно плавно растет и тает.
   ================================================================ */
{
  const h1 = document.querySelector('#hero .h1');
  if (h1) {
    let tx = -999, ty = -999, x = -999, y = -999, r = 0, tr = 0, running = false;
    const RADIUS = 190;
    h1.classList.add('heat');
    h1.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; tr = isFun() || reduced ? 0 : RADIUS; if (x < -900) { x = tx; y = ty; } start(); });
    h1.addEventListener('pointerleave', () => { tr = 0; start(); });
    const start = () => { if (!running) { running = true; requestAnimationFrame(step); } };
    function step(){
      x += (tx - x) * 0.18; y += (ty - y) * 0.18; r += (tr - r) * 0.12;
      h1.querySelectorAll('.w > span').forEach(sp => {
        const b = sp.getBoundingClientRect();
        sp.style.setProperty('--hx', (x - b.left).toFixed(1) + 'px');
        sp.style.setProperty('--hy', (y - b.top).toFixed(1) + 'px');
        sp.style.setProperty('--hr', r.toFixed(1) + 'px');
      });
      if (Math.abs(tr - r) > 0.5 || Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) requestAnimationFrame(step);
      else running = false;
    }
  }
}


/* ================================================================
   ЗАПУСК
   ================================================================ */
let saved = 'light';
try { saved = localStorage.getItem('kd-mode') || 'light'; } catch (e) {}
root.dataset.theme = saved;
sw.setAttribute('aria-checked', saved === 'dark');
renderTexts();
renderLists();
setTimeout(() => $('#fab').classList.add('in'), 700);   // «связаться» проявляется по буквам
requestAnimationFrame(() => requestAnimationFrame(() => watchReveals(document, true)));
if (document.fonts) document.fonts.ready.then(layoutStrings);
readHash();
})();
