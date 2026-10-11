/* ================================================================
   КЕЙС «SHOWREEL BRIGHT SIDE» (поле flip у проекта)
   Как музыка переворачивает ролик: каждая полоска — полсекунды
   чернового монтажа. Высота — громкость музыки, цвет — главный цвет
   кадра. До переворота полоски идут вверх, после — вниз: график виден
   сразу, целиком и в один экран. Наведение (на телефоне — касание)
   показывает кадр над полоской.
   Данные посчитаны по img/showreel/draft.mp4: LOUD — громкость (0–100),
   COLORS — главный цвет кадра: самый заметный насыщенный оттенок (6 знаков на полсекунды), кадры — спрайт
   img/showreel/frames.webp (12 × 15, по два кадра в секунду, кадр 440 × 187: весь спрайт меньше 16 Мп — больше Safari на iPhone не показывает). Тексты — в content.js, оформление — showreel.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);

const LOUD = [27,27,27,28,32,35,31,37,35,34,34,32,37,33,34,35,33,46,68,86,71,82,92,61,85,91,71,85,87,74,87,76,78,74,84,88,72,87,85,89,63,72,85,73,82,90,58,90,86,76,87,85,74,92,73,81,77,83,87,76,91,86,88,60,50,59,51,53,54,70,91,81,85,87,86,93,91,66,94,95,93,76,88,88,89,91,89,70,42,44,75,67,71,94,72,88,89,86,89,71,65,91,91,93,89,89,88,85,89,94,65,55,66,56,57,55,71,92,89,81,90,85,100,94,75,89,97,94,75,92,91,91,91,97,79,46,49,73,75,77,96,81,85,92,88,92,68,60,95,94,95,93,92,92,90,95,96,73,49,52,54,60,53,55,54,60,63,58,61,57,53,55,58,58,60,59,60,87,98,100];
const COLORS = '5f889f717a58495c37376e7c10cce1bf934f76643f9163252f626c827142000000000000000000000000000000000000000000cdb6a0b09d87af9c8bc29b7eaf886a4c462fb18d73a08975a2866f31393b141316434e51586b7029323848575d14151b323a3a7b869179869164b7f467bcf482c7f35199ca66acdb33515638555b161b1b74736a7f7b6e66a0ba609cb865abbcb39f7ba89b7ca28164a09176a965505f25204a8cd7488ad6828c947b889158616a454b50474c51868d97495055737b85a4acb25c5c563234340d0b1099afb03f4e51697d7c6073732e36313d4d4f5a6c71121416282f3229303393a4ac9aaab27797a85372805a7179627a84486b815186a638657e67374c8a0b68940c6e82064b42223f352e733b207b434cad1938982c324c030303500c06040304921c0c640f060a06090303040404050f07035146365146343b2e1f503d2a52402d5b422e5d4c355d4c363a3124655e4a2f271c5e4d34655d45474234625f4ea3231ba72e216b2f1d7e4c35b69f7a9f8d6fb59a7492503fbd343b84131e36190f8b6c4a725735a6885e603f2b745f4c6989a67b91a62324134135241714068760309d724a887b5c8b7d5e748ea4020003607d8f86a2b78caac2403d273d3b26868749e3d650e1c93aafcd40b0cf3dc59f85a8c5d63236470f0305111b311110129f7d53889d8a79bc394554239c865742381d787e5781896389926b0505050b0b0b090909090909090909090909';

const FROM = 17, TO = 174;   // с 8,5 до 87 секунды: без заставок с логотипами в начале и в конце
const FLIP = 88;              // 44 секунда: музыка проседает и переворачивается
const COLS = 12, ROWS = 15;   // сетка спрайта с кадрами
const color = i => '#' + COLORS.slice(i * 6, i * 6 + 6);
const time = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

function frameAt(el, i){
  const c = i % COLS, r = Math.floor(i / COLS);
  el.style.backgroundPosition = `${c / (COLS - 1) * 100}% ${r / (ROWS - 1) * 100}%`;
}

/* «креативные и яркие»: по слову проходит плавный градиент, буквы по очереди разворачиваются волной.
   Буквы — отдельные span, поэтому градиент у каждой свой, но сдвинут на ее место в слове (--x),
   и вместе они читаются как один сплошной перелив. Цвета без оранжевого */
const jumpy = text => [...text].map((ch, k) => ch === ' ' ? ' ' : `<span style="--k:${k}" aria-hidden="true">${ch}</span>`).join('');
// место каждой буквы в слове — для сплошного градиента
function gradientLetters(tag){
  const spans = [...tag.querySelectorAll('span')];
  const set = () => {
    const x0 = tag.getBoundingClientRect().left;
    tag.style.setProperty('--w', tag.scrollWidth + 'px');
    spans.forEach(s => s.style.setProperty('--x', (s.offsetLeft) + 'px'));
  };
  set();
  document.fonts && document.fonts.ready.then(set);
  addEventListener('resize', set, { passive: true });
}

// на телефоне полоска на секунду, а не на полсекунды: иначе они тоньше пикселя
let STEP = 1;
/* подсказка без слов: курсор (на сенсорных экранах — точка касания) ездит над маленькими полосками, над ним всплывает кадр.
   Пропадает, как только посетитель сам навел курсор на график */
const hintHTML = f => `<span class="sr-hint" role="img" aria-label="${H.T(f.hint)}">
  <svg viewBox="0 0 96 48" width="96" height="48" fill="none" aria-hidden="true">
    <g class="sr-hint-bars">${[14, 22, 18, 26, 20, 16, 24].map((h, k) => `<rect x="${6 + k * 12}" y="${44 - h}" width="4" height="${h}" rx="2"/>`).join('')}</g>
    <g class="sr-hint-move">
      <rect class="sr-hint-frame" x="-12" y="2" width="24" height="12" rx="2.5"/>
      <path class="sr-hint-cur" d="M0 18v19l5-5 4 8 3.5-1.6-4-8H15z"/>
      <circle class="sr-hint-tap" cx="0" cy="26" r="6"/>
    </g>
  </svg>
</span>`;

function chartHTML(f){
  STEP = innerWidth < 760 ? 2 : 1;
  let bars = '';
  for (let i = FROM; i <= TO; i += STEP)
    bars += `<span class="sr-b${i >= FLIP ? ' a' : ''}" style="--c:${color(i)};--h:${Math.max(6, LOUD[i])}"><i></i></span>`;
  const at = (FLIP - FROM) / (TO - FROM + 1) * 100;
  return `<div class="sr-viz" style="--at:${at}%">
    <span class="sr-tag sr-tag-1">${H.T(f.before)}</span>
    <span class="sr-mark"><span>${H.T(f.flipLabel)}</span></span>
    <div class="sr-bars">${bars}
      <div class="sr-pop" aria-hidden="true"><span class="sr-frame"></span><span class="sr-time"></span></div>
      ${hintHTML(f)}
    </div>
    <span class="sr-tag sr-tag-2" aria-label="${H.T(f.after)}">${jumpy(H.pick(f.after))}</span>
  </div>`;
}

function live(box){
  const bars = box.querySelector('.sr-bars'), list = [...bars.querySelectorAll('.sr-b')];
  const pop = box.querySelector('.sr-pop'), frame = pop.querySelector('.sr-frame'), stamp = pop.querySelector('.sr-time');
  const n = list.length;
  let on = -1;
  // кадры грузятся заранее, когда график подъезжает к экрану, — к наведению они уже готовы
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return;
    o.disconnect(); frame.style.backgroundImage = `url('${H.base}img/showreel/frames.webp')`;
  }, { rootMargin: '600px 0px' }).observe(box);

  const pick = e => {
    const r = bars.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left) / r.width * n)));
  };
  const show = k => {
    if (k === on) return;
    if (on >= 0) list[on].classList.remove('on');
    on = k; list[k].classList.add('on');
    const i = FROM + k * STEP, b = list[k];
    frameAt(frame, i); stamp.textContent = time(i / 2);
    // окно с кадром над полоской (у второй половины — под осью), не выходит за края графика
    const w = pop.offsetWidth, W = bars.clientWidth, x = b.offsetLeft + b.offsetWidth / 2;
    pop.style.left = Math.max(0, Math.min(W - w, x - w / 2)) + 'px';
    pop.classList.toggle('low', i >= FLIP);
    box.classList.add('hov');
  };
  const hide = () => { if (on >= 0) list[on].classList.remove('on'); on = -1; box.classList.remove('hov'); };
  bars.addEventListener('pointermove', e => show(pick(e)));
  bars.addEventListener('pointerdown', e => show(pick(e)));
  bars.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
  document.addEventListener('pointerdown', e => { if (!bars.contains(e.target)) hide(); });
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'showreel.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}

export async function mountShowreel(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const f = p.flip;
  mount.innerHTML = `<section class="wrap sr-ch">
    <div class="sr-intro">
      <span class="case-label">${H.T(f.label)}</span>
      <h2 class="sr-title">${H.T(f.title)}</h2>
      <p class="sr-text">${H.T(f.text)}</p>
    </div>
    ${chartHTML(f)}
  </section>`;
  live(mount.querySelector('.sr-viz'));
  gradientLetters(mount.querySelector('.sr-tag-2'));
}
