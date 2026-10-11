/* ================================================================
   КЕЙС «SHOWREEL BRIGHT SIDE» (поле flip у проекта)
   Как музыка переворачивает ролик: каждая полоска — полсекунды
   чернового монтажа. Высота — громкость музыки, цвет — главный цвет
   кадра. До переворота полоски растут вверх, после — переворачиваются
   вниз. Наведение показывает кадр, кнопка включает музыку.
   Данные посчитаны по img/showreel/draft.mp4: LOUD — громкость (0–100),
   COLORS — главный цвет кадра: самый заметный насыщенный оттенок (6 знаков на полсекунды), кадры — спрайт
   img/showreel/frames.jpg (12 × 15, по два кадра в секунду), звук —
   img/showreel/music.mp3. Тексты — в content.js, оформление — showreel.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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

function chartHTML(f){
  let bars = '';
  for (let i = FROM; i <= TO; i++) {
    const a = i >= FLIP, k = a ? i - FLIP : i - FROM;
    bars += `<span class="sr-b${a ? ' a' : ''}" style="--c:${color(i)};--h:${Math.max(4, LOUD[i])};--d1:${(i - FROM) * 7}ms;--d2:${k * 9}ms"><i></i></span>`;
  }
  const at = (FLIP - FROM) / (TO - FROM + 1) * 100;
  return `<div class="sr-viz">
    <div class="sr-frame" style="background-image:url('${H.base}img/showreel/frames.jpg')"><span class="sr-time">0:20</span></div>
    <div class="sr-chart" style="--at:${at}%">
      <span class="sr-tag sr-tag-1">${H.T(f.before)}</span>
      <span class="sr-tag sr-tag-2">${H.T(f.after)}</span>
      <span class="sr-mark"><span>${H.T(f.flipLabel)}</span></span>
      <div class="sr-bars">${bars}<span class="sr-head"></span><span class="sr-hover"></span></div>
    </div>
    <div class="sr-ctrl">
      <button class="btn btn-line sr-play" type="button"><span class="spell">${H.T(f.play)}</span></button>
      <p class="sr-hint">${H.T(f.hint)}</p>
    </div>
  </div>`;
}

function live(box, f){
  const frame = box.querySelector('.sr-frame'), stamp = box.querySelector('.sr-time');
  const bars = box.querySelector('.sr-bars'), list = [...bars.querySelectorAll('.sr-b')];
  const head = box.querySelector('.sr-head'), hover = box.querySelector('.sr-hover');
  const btn = box.querySelector('.sr-play'), label = btn.querySelector('.spell');
  const n = TO - FROM + 1;
  let audio = null, raf = 0, hoverIdx = -1, cur = 40;

  const show = i => { frameAt(frame, i); stamp.textContent = time(i / 2); };
  const pos = i => ((i - FROM + .5) / n * 100) + '%';
  show(cur);

  const paint = () => {
    const t = audio ? audio.currentTime : 0, i = Math.min(179, Math.floor(t * 2));
    cur = i;
    if (hoverIdx < 0) show(i);
    const inside = i >= FROM && i <= TO;
    head.style.left = pos(Math.max(FROM, Math.min(TO, i)));
    box.classList.toggle('play', !!audio && !audio.paused);
    list.forEach((b, k) => b.classList.toggle('later', k + FROM > i));
    head.style.opacity = inside || (audio && !audio.paused) ? 1 : 0;
  };
  const loop = () => {
    if (!box.isConnected) { audio && audio.pause(); return; }   // кейс закрыли — музыка выключается
    paint();
    if (audio && !audio.paused) raf = requestAnimationFrame(loop);
  };
  const ensure = () => {
    if (audio) return audio;
    audio = new Audio(H.base + 'img/showreel/music.mp3');
    audio.preload = 'auto';
    audio.addEventListener('play', () => { box.classList.add('in', 'flip'); label.textContent = H.pick(f.pause); cancelAnimationFrame(raf); loop(); });
    audio.addEventListener('pause', () => { label.textContent = H.pick(f.play); paint(); });
    audio.addEventListener('ended', () => { box.classList.remove('play'); list.forEach(b => b.classList.remove('later')); head.style.opacity = 0; });
    return audio;
  };
  // перемотка: пока файл не загрузился, время ставится после загрузки, иначе браузер начнет с нуля
  const seek = (a, t) => {
    if (a.readyState >= 1) a.currentTime = t;
    else a.addEventListener('loadedmetadata', () => { a.currentTime = t; }, { once: true });
  };
  btn.addEventListener('click', () => {
    const a = ensure();
    if (a.paused) { if (a.ended || a.currentTime < FROM / 2) seek(a, FROM / 2); a.play(); } else a.pause();
  });

  // наведение — кадр этого места; нажатие — музыка с этого места
  const idx = e => {
    const r = bars.getBoundingClientRect();
    return FROM + Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left) / r.width * n)));
  };
  bars.addEventListener('pointermove', e => {
    hoverIdx = idx(e); show(hoverIdx);
    hover.style.left = pos(hoverIdx); box.classList.add('hov');
  });
  bars.addEventListener('pointerleave', () => { hoverIdx = -1; box.classList.remove('hov'); show(cur); });
  bars.addEventListener('click', e => {
    const a = ensure(); seek(a, idx(e) / 2);
    if (a.paused) a.play(); else paint();
  });

  // появление: полоски растут слева направо, потом вторая половина переворачивается вниз
  if (still()) { box.classList.add('in', 'flip'); return; }
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return;
    o.disconnect();
    box.classList.add('in');
    setTimeout(() => box.classList.add('flip'), n * 7 + 700);
  }, { threshold: .35 }).observe(bars);
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
  live(mount.querySelector('.sr-viz'), f);
}
