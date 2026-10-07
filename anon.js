/* ================================================================
   КЕЙС «АНОНИМАЙЗЕР» (поле anon у проекта)
   Главы: swap — крупное слово меняется на выдуманное той же длины,
   под буквами — риски, их число не меняется; ниже падежи: одна
   замена на все формы, окончание остается; doc — лист договора
   слева, справа текст и тумблер «до / после», он переключается сам:
   слова перебираются буква за буквой, от логотипа и печати остаются
   пустые рамки; inside — инфографика: в окно браузера падают Word,
   Excel, PowerPoint и PDF, луч чистит их по очереди (имена и цифры —
   лаймовые, картинки — пустые рамки), счетчик запросов — ноль; back — ответ нейросети: кнопка
   возвращает настоящие имена, справа под текстом — попробовать демо
   (лаймовая кнопка, тексты в anon.try).
   Словарь замен общий на весь кейс: «Ромашка» везде одна и та же,
   как в самой программе, пока открыта вкладка.
   Тексты — в content.js, оформление — anon.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
// следит, виден ли блок
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

/* ---------- выдуманные слова: та же длина, тот же регистр ---------- */
// гласная остается гласной, согласная — согласной: выдумка читается как слово, а не как пароль
// SETS — чтобы узнать, гласная это или согласная; MAKE — из чего выдумывать: частые буквы чаще,
// без ъ, ь, щ, э, ю — иначе выходит «Эчичаз» вместо «Тавеслу»
const SETS = ['аеёиоуыэюя', 'бвгджзйклмнпрстфхцчшщъь', 'aeiouy', 'bcdfghjklmnpqrstvwxz'];
const MAKE = ['аааоооеееииуя', 'нннтттсссррвввллккммдпбгзф', 'aaeeiioou', 'nnttssrrllddmmkbcpvg'];
const rnd = a => a[Math.floor(Math.random() * a.length)];
const groupOf = ch => SETS.findIndex(s => s.includes(ch.toLowerCase()));
function setOf(ch){ const g = groupOf(ch); return g < 0 ? null : MAKE[g]; }
// похожий знак: той же группы и того же регистра; цифры — цифры, остальное не трогаем
function similar(ch, first){
  if (/\d/.test(ch)) return rnd(first ? '123456789' : '0123456789');
  const set = setOf(ch);
  if (!set) return ch;
  const up = ch !== ch.toLowerCase();
  let c = rnd(set);
  return up ? c.toUpperCase() : c;
}
function invent(word){
  let out = '';
  for (let t = 0; t < 20; t++) {
    out = [...word].map((c, i) => similar(c, i === 0 || !/\d/.test(word[i - 1] || ''))).join('');
    if (out !== word) break;
  }
  return out;
}
// общий словарь кейса: одно настоящее слово — одна замена
const DICT = new Map([['Ромашка', 'Тавеслу']]);   // пример из текста кейса — пусть совпадает
const fake = w => { if (!DICT.has(w)) DICT.set(w, invent(w)); return DICT.get(w); };

/* ---------- перебор букв: от одного слова к другому той же длины ---------- */
// el — элемент с текстом или список элементов по одной букве; to — строка той же длины
function morph(els, to, { dur = 420, step = 32 } = {}){
  const list = Array.isArray(els) ? els : null;
  const from = list ? list.map(e => e.textContent).join('') : els.textContent;
  const a = [...from], b = [...to];
  const put = s => {
    if (list) s.forEach((c, i) => { if (list[i].textContent !== c) list[i].textContent = c; });
    else els.textContent = s.join('');
  };
  if (still() || a.length !== b.length) { put(b); return Promise.resolve(); }
  const t0 = performance.now();
  const total = dur + step * b.length;
  return new Promise(res => {
    let last = 0;
    const frame = now => {
      const t = now - t0;
      // буквы перебираются не каждый кадр, а раз в 55 мс — иначе мельтешит
      if (now - last > 55 || t >= total) {
        last = now;
        put(b.map((c, i) => {
          const s = t - i * step;
          if (s < 0) return a[i];
          if (s >= dur || c === a[i] && !setOf(c) && !/\d/.test(c)) return c;
          return similar(c, false);
        }));
      }
      if (t < total) requestAnimationFrame(frame); else { put(b); res(); }
    };
    requestAnimationFrame(frame);
  });
}

// текст с {заменами}: типограф, потом слова в скобках становятся живыми
function tokens(src){
  return H.T(src).replace(/\{([^}]+)\}/g, (_, w) => {
    const real = w.replace(/&nbsp;/g, ' ');
    return `<span class="an-tok" data-real="${esc(real)}" data-fake="${esc(fake(real))}">${esc(real)}</span>`;
  });
}
// все замены в блоке: в настоящие (back = true) или в выдуманные
function swapAll(box, toFake){
  const toks = [...box.querySelectorAll('.an-tok')];
  box.classList.toggle('is-fake', toFake);
  return Promise.all(toks.map((t, i) =>
    wait(still() ? 0 : i * 40).then(() => morph(t, toFake ? t.dataset.fake : t.dataset.real))));
}

/* ---------- заголовок главы: слова поднимаются из-под строки ---------- */
function splitWords(el){
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  let n = 0;
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    // делим только по обычным пробелам: неразрывные типографа держат предлог со словом
    node.textContent.split(/([ \t\n]+)/).forEach(part => {
      if (!part) return;
      if (/^[ \t\n]+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement('span'); w.className = 'an-w';
      const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--i', n++);
      w.append(i); frag.append(w);
    });
    node.replaceWith(frag);
  });
}

const head = ch => `<div class="an-head">
  <span class="case-label an-label">${H.T(ch.label)}</span>
  <h2 class="an-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="an-text">${H.T(ch.text)}</p>` : ''}
</div>`;

/* ================================================================
   swap — одно слово крупно
   ================================================================ */
function swapHTML(c){
  const forms = c.endings.map(e => `<span class="an-form"><span class="an-stem">${esc(c.stem)}</span><span class="an-end">${esc(e)}</span></span>`).join('');
  return `<div class="an-stage an-swap">
    <div class="an-big" aria-live="off"><span class="an-word"></span></div>
    <div class="an-count"><span class="an-n">0</span><svg class="an-arrow" viewBox="0 0 40 14" aria-hidden="true"><path d="M1 7H38M32 1.5L38 7L32 12.5"/></svg><span class="an-n an-n2">0</span></div>
  </div>
  <div class="an-decl">
    <span class="an-decl-label">${H.T(c.caseLabel)}</span>
    <div class="an-forms">${forms}</div>
  </div>`;
}
const plural = n => { const a = n % 10, b = n % 100;
  return n + ' ' + (a === 1 && b !== 11 ? 'знак' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'знака' : 'знаков'); };
function liveSwap(box, c){
  const stage = box.querySelector('.an-swap');
  const big = box.querySelector('.an-big');
  const word = box.querySelector('.an-word');
  const [n1, n2] = box.querySelectorAll('.an-n');
  const stems = [...box.querySelectorAll('.an-stem')];
  const decl = box.querySelector('.an-decl');
  let k = 0, on = false, busy = false;

  // кегль подбирается так, чтобы самое длинное слово (почта) влезло в строку
  const fit = () => {
    word.style.fontSize = '';
    const max = big.clientWidth, w = word.scrollWidth;
    if (w > max) word.style.fontSize = (parseFloat(getComputedStyle(word).fontSize) * max / w * .98) + 'px';
  };
  const show = w => {
    word.innerHTML = [...w].map((ch, i) => `<span class="an-c${ch === ' ' ? ' sp' : ''}" style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
    fit();
    n1.textContent = plural([...w].length); n2.textContent = '';
    stage.classList.remove('is-fake', 'done'); stage.classList.add('enter');
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('enter')));
  };
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      const real = c.words[k % c.words.length];
      show(real);
      decl.classList.remove('is-fake');
      stems.forEach(s => { s.textContent = c.stem; });
      await wait(1500);
      if (!on) break;
      // первый круг — замены из общего словаря, дальше каждый раз новые, как в новой вкладке
      const f = k < c.words.length ? fake(real) : invent(real);   // первый круг — как в документе ниже
      const chars = [...word.querySelectorAll('.an-c')];
      stage.classList.add('is-fake');
      const fs = invent(c.stem);
      decl.classList.add('is-fake');
      await Promise.all([
        morph(chars, [...f].map(ch => ch === ' ' ? ' ' : ch).join(''), { dur: 520, step: 45 }),
        ...stems.map((s, i) => wait(i * 90).then(() => morph(s, fs))),
      ]);
      n2.textContent = plural([...f].length); stage.classList.add('done');
      await wait(2300);
      k++;
    }
    busy = false;
  };
  onScreen(stage, v => { on = v && !still(); if (on) loop(); });
  if (still()) show(c.words[0]);
  addEventListener('resize', fit, { passive: true });
}

/* ================================================================
   doc — лист договора до и после
   ================================================================ */
function docHTML(c){
  const s = c.sheet;
  const row = (r, th) => `<tr>${r.map((x, i) => `<${th ? 'th' : 'td'}${i ? ' class="num"' : ''}>${th ? H.T(x) : tokens(x)}</${th ? 'th' : 'td'}>`).join('')}</tr>`;
  return `<div class="an-stage an-desk">
    <article class="an-sheet">
      <div class="an-top">
        <div class="an-logo" aria-label="${esc(s.logo)}"><div class="an-pic">${daisy()}<span>${tokens('{Ромашка}')}</span></div></div>
        <div class="an-meta"><span>${tokens(s.city)}</span><span>${tokens(s.date)}</span></div>
      </div>
      <h3 class="an-doc-h">${tokens(s.head)}</h3>
      <p class="an-doc-p">${tokens(s.para)}</p>
      <table class="an-table"><thead>${row(s.cols, true)}</thead><tbody>${s.rows.map(r => row(r)).join('')}</tbody></table>
      <p class="an-doc-foot">${tokens(s.foot)}</p>
      <div class="an-sign"><span class="an-sign-line">${tokens(s.sign)}</span>
        <div class="an-seal" aria-label="${esc(s.seal)}"><div class="an-pic">${sealSVG()}</div></div></div>
    </article>
  </div>`;
}
// логотип-ромашка: лепестки по кругу
function daisy(){
  const petals = Array.from({ length: 10 }, (_, i) =>
    `<ellipse cx="20" cy="9" rx="4.2" ry="8" transform="rotate(${i * 36} 20 20)"/>`).join('');
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="#fff" stroke="#1D222A" stroke-width="1.6">${petals}</g><circle cx="20" cy="20" r="6" fill="#E2FB5A" stroke="#1D222A" stroke-width="1.6"/></svg>`;
}
// печать: два кольца, звездочки по кругу и ромашка в середине — синие, как штемпельная краска
function sealSVG(){
  const dots = Array.from({ length: 24 }, (_, i) => {
    const a = i / 24 * Math.PI * 2;
    return `<circle cx="${(60 + Math.cos(a) * 47).toFixed(1)}" cy="${(60 + Math.sin(a) * 47).toFixed(1)}" r="2.2"/>`;
  }).join('');
  const petals = Array.from({ length: 8 }, (_, i) =>
    `<ellipse cx="60" cy="46" rx="5" ry="11" transform="rotate(${i * 45} 60 60)"/>`).join('');
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="#3557C7" stroke-width="2.4" opacity=".82">
    <circle cx="60" cy="60" r="56"/><circle cx="60" cy="60" r="38"/><g fill="#3557C7" stroke="none">${dots}</g>
    <g stroke-width="2">${petals}</g><circle cx="60" cy="60" r="6" fill="#3557C7"/></g></svg>`;
}
// правая колонка главы: подпись, заголовок, абзац и тумблер «до / после»
function docSide(c){
  const [off, on] = H.pick(c.toggle);
  return `<div class="an-side">
    <span class="case-label an-label">${H.T(c.label)}</span>
    <h2 class="an-title">${H.T(c.title)}</h2>
    <p class="an-text">${H.T(c.text)}</p>
    <div class="an-switch">
      <span class="an-sw-l" data-v="0">${H.T(off)}</span>
      <button class="an-sw" type="button" role="switch" aria-checked="false" aria-label="${esc(off + ' / ' + on)}"><i class="an-knob"></i></button>
      <span class="an-sw-l" data-v="1">${H.T(on)}</span>
    </div>
  </div>`;
}
function liveDoc(box){
  const sheet = box.querySelector('.an-sheet');
  const sw = box.querySelector('.an-sw');
  const MS = 3400;
  let cur = 0, timer = 0, on = false, touched = false;
  // тумблер переключается сам, пока его не тронули; пока ждет, дорожка плавно перетекает в цвет следующего положения
  const run = () => {
    clearTimeout(timer);
    sw.classList.remove('run');
    if (!on || touched || still()) return;
    void sw.offsetWidth; sw.style.setProperty('--ms', MS + 'ms'); sw.classList.add('run');
    timer = setTimeout(() => set(1 - cur), MS);
  };
  const set = (v, user) => {
    if (user) touched = true;
    cur = v;
    sw.setAttribute('aria-checked', cur === 1);
    box.classList.toggle('after', cur === 1);
    sheet.classList.toggle('blank', cur === 1);
    swapAll(sheet, cur === 1);
    run();
  };
  sw.addEventListener('click', () => set(1 - cur, true));
  box.querySelectorAll('.an-sw-l').forEach(l => l.addEventListener('click', () => set(+l.dataset.v, true)));
  onScreen(sheet, v => { on = v; run(); }, .25);
}

/* ================================================================
   inside — окно браузера: файл разложен на части
   ================================================================ */
// файлы-рисунки из простых форм: .hl — то, что станет лаймовой заменой, .pic — картинка, от нее останется рамка
const FILE = {
  doc: () => `<b class="pic logo"></b><i class="h"></i><i></i><i class="hl"></i><i></i><i class="hl s"></i><i></i>`,
  sheet: () => `<div class="grid">${Array.from({ length: 18 }, (_, k) => {
      const col = k % 3, row = Math.floor(k / 3);
      return `<u class="${row === 0 ? 'th' : col === 0 || col === 2 && row % 2 ? 'hl' : ''}"></u>`;
    }).join('')}</div>`,
  slide: () => `<i class="h hl"></i><div class="sl"><div class="lines"><i></i><i class="hl"></i><i></i></div><b class="pic"><s></s></b></div>`,
  pdf: () => `<i class="h"></i><i class="hl"></i><i></i><i></i><i class="hl s"></i><i></i><b class="pic stamp"></b>`,
};
function insideHTML(c){
  return `<div class="an-stage an-win">
    <div class="an-flow" data-step="0">
      <div class="an-kinds">${c.files.map((f, i) =>
        `<figure class="an-f an-f-${f.kind}" style="--i:${i}"><div class="an-card">${FILE[f.kind]()}<i class="an-beam" aria-hidden="true"></i></div>
          <figcaption><span class="a">${H.T(f.name)}</span>${f.after ? `<span class="b">${H.T(f.after)}</span>` : ''}</figcaption></figure>`).join('')}</div>
    </div>
  </div>`;
}
// правая колонка главы: подпись, заголовок, абзац и крупный ноль — счетчик запросов, который не растет
function insideSide(c){
  return `<div class="an-side">
    <span class="case-label an-label">${H.T(c.label)}</span>
    <h2 class="an-title">${H.T(c.title)}</h2>
    ${c.text ? `<p class="an-text">${H.T(c.text)}</p>` : ''}
    <div class="an-zero" aria-label="0 ${esc(H.pick(c.net))}"><span class="an-zero-n"><b>0</b><b>0</b></span><span class="an-zero-l">${H.T(c.net)}</span></div>
  </div>`;
}
function liveInside(box){
  const flow = box.querySelector('.an-flow');
  const zero = box.querySelector('.an-zero');
  // ноль прокручивается и снова встает нулем: файлы обработаны, запросов не прибавилось
  const roll = () => { if (zero) { zero.classList.remove('roll'); void zero.offsetWidth; zero.classList.add('roll'); } };
  let on = false, busy = false;
  // 0 — пусто; 1 — файлы падают во вкладку; 2 — луч чистит их по очереди; 3 — уходят
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      flow.dataset.step = 1; await wait(1500); if (!on) break;
      flow.dataset.step = 2; roll(); await wait(4200); if (!on) break;
      flow.dataset.step = 3; await wait(800);
      flow.dataset.step = 0; await wait(500);
    }
    busy = false;
  };
  if (still()) { flow.dataset.step = 2; return; }
  onScreen(flow, v => { on = v; if (on) loop(); }, .35);
}

/* ================================================================
   back — ответ нейросети, кнопка возвращает настоящие данные
   ================================================================ */
function backHTML(c){
  return `<div class="an-stage an-reply">
    <div class="an-answer">
      <span class="an-who">${H.T(c.who)}</span>
      <p class="an-ans">${tokens(c.answer)}</p>
      <button class="btn btn-line an-back-btn" type="button">${H.T(H.pick(c.btn)[0])}</button>
    </div>
  </div>`;
}
function liveBack(box, c){
  const ans = box.querySelector('.an-answer');
  const btn = box.querySelector('.an-back-btn');
  const [toReal, toFake] = H.pick(c.btn);
  let real = false, on = false, touched = false, timer = 0;
  // нейросеть видела только выдумку — с нее и начинаем
  ans.querySelectorAll('.an-tok').forEach(t => { t.textContent = t.dataset.fake; });
  ans.classList.add('is-fake');
  const set = v => {
    real = v;
    btn.textContent = H.T(real ? toFake : toReal).replace(/&nbsp;/g, ' ');
    swapAll(ans, !real);
  };
  const tick = () => {
    clearTimeout(timer);
    if (!on || touched || still()) return;
    timer = setTimeout(() => { set(!real); tick(); }, real ? 3800 : 2600);
  };
  btn.addEventListener('click', () => { touched = true; clearTimeout(timer); set(!real); });
  onScreen(ans, v => { on = v; tick(); }, .4);
}

/* ================================================================
   try — кнопка демо
   ================================================================ */
// справа: «вернуть как было» и под ним — попробовать демо
const backSide = (c, t) => `<div class="an-side">
  <span class="case-label an-label">${H.T(c.label)}</span>
  <h2 class="an-title">${H.T(c.title)}</h2>
  <p class="an-text">${H.T(c.text)}</p>
  ${t ? `<div class="an-try">
    <h3 class="an-try-title">${H.T(t.title)}</h3>
    <p class="an-try-text">${H.T(t.text)}</p>
    <a class="btn btn-accent an-try-btn" href="${esc(t.link)}" target="_blank" rel="noopener">${H.T(t.btn)}</a>
  </div>` : ''}
</div>`;

/* ---------- запуск ---------- */
const CHAPTERS = [
  ['swap', swapHTML, liveSwap],
  ['doc', docHTML, liveDoc],
  ['inside', insideHTML, liveInside],
  ['back', backHTML, liveBack],
];

let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'anon.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountAnon(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const a = p.anon;
  const SIDES = { doc: docSide, inside: insideSide, back: c => backSide(c, a.try) };
  mount.innerHTML = CHAPTERS.filter(([k]) => a[k]).map(([k, html]) => SIDES[k]
    // документ, форматы и «вернуть как было» с демо: иллюстрация слева, текст справа
    ? `<section class="an-ch wrap an-${k}-ch an-split"><div class="an-viz">${html(a[k])}</div>${SIDES[k](a[k])}</section>`
    : `<section class="an-ch wrap an-${k}-ch">${head(a[k])}<div class="an-viz">${html(a[k])}</div></section>`).join('');
  mount.querySelectorAll('.an-title').forEach(splitWords);
  mount.querySelectorAll('.an-ch').forEach(s => reveal.observe(s));
  CHAPTERS.filter(([k]) => a[k]).forEach(([k, , live]) => live(mount.querySelector(`.an-${k}-ch`), a[k]));
}
