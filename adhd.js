/* ================================================================
   КЕЙС «ГДЕ МОЁ ВНИМАНИЕ?» (поле adhd у проекта, см. СДВГ)
   Страница ведет себя как рассеянное внимание: мысли расплываются,
   наброски разбросаны и собираются при прокрутке, футболки сами
   перескакивают между версиями. Тексты — в content.js, оформление — adhd.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);
// следит, на экране ли блок: живые анимации крутятся только там
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);

// hint — подсказка к живой схеме: стоит в той же колонке, что и текст главы
const head = (ch, hint) => `<div class="sd-head">
  <span class="case-label sd-label">${H.T(ch.label)}</span>
  <h2 class="sd-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="sd-text">${H.T(ch.text)}</p>` : ''}
  ${hint ? `<p class="sd-cap sd-head-cap">${H.T(hint)}</p>` : ''}
</div>`;
const cap = (t, cls) => t ? `<p class="sd-cap${cls ? ' ' + cls : ''}">${H.T(t)}</p>` : '';

/* ---------- мысли: одна в фокусе, остальные расплываются и дрейфуют ---------- */
function thoughtsHTML(c){
  return `<div class="sd-thoughts" aria-label="${c.items.map(x => H.pick(x)).join(', ')}">
    ${c.items.map((t, i) => `<span class="sd-th" style="--i:${i}" aria-hidden="true">${H.T(t)}</span>`).join('')}
  </div>`;
}
function liveThoughts(box){
  const els = [...box.querySelectorAll('.sd-th')];
  const n = els.length;
  let pos = [], seen = false, raf = 0, t0 = performance.now();
  // fk — фраза в фокусе: она всегда полностью резкая, остальные расплываются тем сильнее, чем дальше от нее
  let fk = 0, mine = 0, hover = false, jumpAt = 0, stealUntil = 0, blur = els.map(() => 3), op = els.map(() => .5);
  // раскладка: ячейки сетки, внутри — случайный сдвиг, чтобы не выглядело таблицей
  const lay = () => {
    // поле внутри отступа: с запасом на дрейф, чтобы фразы не уезжали за край
    const P = Math.min(40, box.clientWidth * .05) + 16, w = box.clientWidth - P * 2, h = box.clientHeight - P * 2;
    const cols = box.clientWidth < 640 ? 2 : 3, rows = Math.ceil(n / cols);
    pos = els.map((el, i) => {
      const cw = w / cols, ch = h / rows, c = i % cols, r = Math.floor(i / cols);
      el.style.maxWidth = (cw - 16) + 'px';
      const ew = el.offsetWidth, eh = el.offsetHeight;
      return { x: P + c * cw + rnd(0, Math.max(0, cw - ew)), y: P + r * ch + rnd(0, Math.max(0, ch - eh - 28)), w: ew, h: eh,   // запас снизу на дрейф: соседние строки не наезжают
        ph: rnd(0, 6.28), sp: rnd(.25, .5), amp: rnd(6, 16) };
    });
  };
  const other = () => { let k; do k = Math.floor(Math.random() * n); while (k === fk && n > 1); return k; };
  const draw = t => {
    const s = (t - t0) / 1000;
    // само по себе внимание перескакивает; с курсором — держится за фразой под ним, но иногда все равно убегает
    if (!hover && t > jumpAt) { fk = other(); jumpAt = t + rnd(1300, 2600); }
    if (hover && t > jumpAt) { if (Math.random() < .35) { fk = other(); stealUntil = t + 900; } jumpAt = t + rnd(3500, 6000); }
    if (hover && t > stealUntil) fk = mine;
    const R = Math.max(box.clientWidth, 400) * .3;
    const cen = els.map((el, i) => {
      const p = pos[i];
      const dx = Math.sin(s * p.sp + p.ph) * p.amp, dy = Math.cos(s * p.sp * .8 + p.ph) * p.amp * .7;
      el.style.transform = `translate(${(p.x + dx).toFixed(1)}px,${(p.y + dy).toFixed(1)}px)`;
      return [p.x + p.w / 2 + dx, p.y + p.h / 2 + dy];
    });
    els.forEach((el, i) => {
      const d = i === fk ? 0 : Math.min(1, .35 + Math.hypot(cen[i][0] - cen[fk][0], cen[i][1] - cen[fk][1]) / R);
      blur[i] += (d * 3.6 - blur[i]) * .14; op[i] += (1 - d * .6 - op[i]) * .14;
      el.style.filter = blur[i] < .05 ? 'none' : `blur(${blur[i].toFixed(2)}px)`;
      el.style.opacity = op[i].toFixed(2);
    });
    if (seen) raf = requestAnimationFrame(draw);
  };
  const start = () => { lay(); };
  start();
  new ResizeObserver(() => { lay(); }).observe(box);
  if (still()) {   // без движения: все мысли резкие и стоят на местах
    els.forEach((el, i) => { el.style.transform = `translate(${pos[i].x}px,${pos[i].y}px)`; });
    box.classList.add('still'); return;
  }
  // фраза под курсором — ближайшая к нему по центру
  box.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (!hover) jumpAt = performance.now() + rnd(3500, 6000);
    hover = true;
    let best = 1e9;
    pos.forEach((p, i) => { const d = Math.hypot(p.x + p.w / 2 - x, p.y + p.h / 2 - y); if (d < best) { best = d; mine = i; } });
  });
  box.addEventListener('pointerleave', () => { hover = false; jumpAt = 0; });
  onScreen(box, v => {
    if (v && !seen) { seen = true; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- наброски: разбросаны по столу и собираются в сетку при прокрутке ---------- */
function boardHTML(c){
  return `<div class="sd-board">${c.items.map((x, i) => {
    const it = typeof x === 'string' ? { img: x } : x;
    return `<button class="sd-sk${it.fit ? ' fit' : ''}" style="--i:${i}" aria-label="Увеличить набросок"><img src="${it.img}" alt="" loading="lazy" draggable="false"></button>`;
  }).join('')}</div>${cap(c.hint)}`;
}
function liveBoard(box){
  const tiles = [...box.querySelectorAll('.sd-sk')];
  tiles.forEach(t => {
    t.style.setProperty('--dx', rnd(-40, 40).toFixed(1) + '%');
    t.style.setProperty('--dy', rnd(-30, 50).toFixed(1) + '%');
    t.style.setProperty('--r', rnd(-16, 16).toFixed(1) + 'deg');
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('.sd-sk'); if (!b) return;
    const imgs = tiles.map(t => t.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), tiles.indexOf(b), imgs);
  });
  if (still()) { box.style.setProperty('--p', 1); return; }
  // 0 — блок только показался снизу (всё вразброс), 1 — середина блока на середине экрана (всё по местам)
  let raf = 0, seen = false;
  const sc = box.closest('.case') || window;
  const upd = () => {
    raf = 0;
    const r = box.getBoundingClientRect(), vh = innerHeight;
    const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * .5 + r.height * .5)));
    box.style.setProperty('--p', (1 - Math.pow(1 - p, 3)).toFixed(3));
  };
  const req = () => { if (seen && !raf) raf = requestAnimationFrame(upd); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  onScreen(box, v => { seen = v; req(); }, '200px 0px');
}

/* ---------- живая типографика из набросков ---------- */
// кольцо «многоозадаченность» крутится; на наведении — быстрее, как будто взялась за всё сразу
function ringSVG(t){
  const word = (H.pick(t.ring) + '\u00A0\u00A0').repeat(2);   // неразрывные пробелы: на стыке кольца отступ не пропадает
  return `<svg class="sd-type sd-ring" viewBox="0 0 400 400" aria-hidden="true">
    <defs><path id="adRing" d="M200 200m-150 0a150 150 0 1 1 300 0a150 150 0 1 1-300 0"/></defs>
    <g class="sd-spin"><text><textPath href="#adRing" textLength="938" lengthAdjust="spacing">${word}</textPath></text></g>
    <text class="sd-core" x="200" y="208" text-anchor="middle">${H.pick(t.core)}</text>
  </svg>`;
}
// «всё вокруг в слоумо»: фраза без конца медленно едет по крючку, как принт на футболке;
// крючок нарисован от хвоста к верху, чтобы текст читался слева направо и стоял ровно по середине полосы
const HOOK = 'M40 352C80 352 130 346 176 322C214 302 246 330 224 354C200 380 150 360 168 306C190 236 290 150 336 44';
function slowSVG(t){
  return `<svg class="sd-type sd-slow" viewBox="0 0 400 400" aria-hidden="true">
    <path id="adHook" d="${HOOK}" fill="none"/>
    <path class="sd-hook" d="${HOOK}" fill="none"/>
    <text dominant-baseline="central"><textPath class="sd-slow-path" href="#adHook" startOffset="0" data-s="${H.pick(t.slow)}"></textPath></text>
  </svg>`;
}
// «я вас слушаю очень невнимательно»: строчки повторяются, и с каждой следующей у фразы отваливается конец —
// буквы по одной соскальзывают и падают, как внимание на долгом созвоне; потом «ой, простите» — и всё снова на месте
function waveSVG(t){
  return `<svg class="sd-type sd-wave" viewBox="0 0 400 400" aria-hidden="true" data-s="${H.pick(t.wave)}"></svg>`;
}
// подписей под схемами нет: у кольца — живая подсказка-курсор, она подъезжает к кольцу и «нажимает»,
// пока на кольцо не навели в первый раз
const HINT_CURSOR = `<span class="sd-hint" aria-hidden="true"><i class="sd-hint-ripple"></i>
  <svg viewBox="0 0 24 24" width="34" height="34"><path d="M5 3l14 7.5-6.2 1.6L10 18.5z" fill="#1D222A" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/></svg></span>`;
function typeHTML(c){
  return `<div class="sd-types">
    <figure class="sd-ring-fig"><div class="sd-sq">${ringSVG(c)}${HINT_CURSOR}</div></figure>
    <figure><div class="sd-sq">${slowSVG(c)}</div></figure>
    <figure><div class="sd-sq">${waveSVG(c)}</div></figure>
  </div>${cap(c.hint)}`;
}
function liveSlow(svg){
  const tp = svg.querySelector('.sd-slow-path'), word = tp.dataset.s + '   ';
  const L = svg.querySelector('#adHook').getTotalLength();
  // мерим одну фразу и повторяем ее с запасом: строка всегда закрывает крючок целиком
  tp.textContent = word;
  const one = tp.parentNode.getComputedTextLength() || 200;
  tp.textContent = word.repeat(Math.ceil(L / one) + 2);
  return s => tp.setAttribute('startOffset', (-(s * 14 % one)).toFixed(2));   // 14 единиц в секунду — слоумо
}
function liveFall(svg){
  const NS = 'http://www.w3.org/2000/svg', txt = svg.dataset.s, rows = 7, X0 = 20, Y0 = 64, DY = 44;
  // раскладываем буквы одной строки по ширине, потом размножаем строки
  const probe = document.createElementNS(NS, 'text');
  probe.textContent = txt; svg.appendChild(probe);
  const xs = [...txt].map((_, j) => probe.getStartPositionOfChar(j).x);
  probe.remove();
  const letters = [];
  for (let i = 0; i < rows; i++) [...txt].forEach((ch, j) => {
    if (ch === ' ') return;
    const el = document.createElementNS(NS, 'text');
    el.textContent = ch; el.setAttribute('x', X0 + xs[j]); el.setAttribute('y', Y0 + i * DY);
    svg.appendChild(el);
    // чем ниже строка, тем больше букв с конца отваливается и тем раньше
    const tail = (j + 1) / txt.length, lost = i / (rows - 1);
    letters.push({ el, falls: tail > 1 - lost * .85, at: .6 + (1 - tail) * 3.2 * (1 - lost * .5) + Math.random() * .6,
      rot: (Math.random() - .5) * 140, drift: (Math.random() - .3) * 30, ox: X0 + xs[j], oy: Y0 + i * DY });
  });
  const CYCLE = 7.5;
  return s => {
    const t = s % CYCLE;
    // последние полсекунды буквы возвращаются на место — внимание вернули
    const back = t > CYCLE - .7 ? 1 - (t - (CYCLE - .7)) / .7 : 1;
    letters.forEach(l => {
      if (!l.falls) return;
      const d = Math.max(0, t - l.at), k = back * back * (3 - 2 * back);
      const y = 140 * d * d * k, x = l.drift * d * k, r = l.rot * d * k;
      l.el.setAttribute('transform', d ? `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)} ${l.ox} ${l.oy})` : '');
      l.el.style.opacity = Math.max(0, 1 - y / 260).toFixed(2);
    });
  };
}
function liveType(box){
  const slow = liveSlow(box.querySelector('.sd-slow'));
  const fall = liveFall(box.querySelector('.sd-wave'));
  const ring = box.querySelector('.sd-spin');
  let raf = 0, seen = false, t0 = performance.now(), ang = 0, speed = .05, goal = .05, last = t0;
  slow(0); fall(0);
  if (still()) return;
  ring.closest('figure').addEventListener('pointerenter', e => { goal = .6; e.currentTarget.classList.add('used'); });   // подсказка-курсор больше не нужна
  ring.closest('figure').addEventListener('pointerleave', () => { goal = .05; });
  const draw = t => {
    const s = (t - t0) / 1000, dt = Math.min(64, t - last); last = t;
    speed += (goal - speed) * .05; ang = (ang + speed * dt / 16) % 360;
    ring.setAttribute('transform', `rotate(${ang.toFixed(2)} 200 200)`);
    slow(s); fall(s);
    if (seen) raf = requestAnimationFrame(draw);
  };
  onScreen(box, v => {
    if (v && !seen) { seen = true; last = performance.now(); raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- версии: каждая футболка сама перескакивает между вариантами ---------- */
function versionsHTML(c){
  return `<div class="sd-vers">${c.items.map((x, i) => `
    <figure class="sd-ver" style="--i:${i}" data-k="0">
      <div class="sd-ver-stack">${x.imgs.map((src, j) => `<img class="${j ? '' : 'on'}" src="${src}" alt="" loading="lazy" draggable="false">`).join('')}
        ${x.tag ? `<span class="sd-tag">${H.T(x.tag)}</span>` : ''}</div>
      <figcaption>
        <span class="sd-ver-name">${H.T(x.phrase)}</span>
        <span class="sd-dots">${x.imgs.map((_, j) => `<button class="${j ? '' : 'on'}" aria-label="Вариант ${j + 1} из ${x.imgs.length}"></button>`).join('')}</span>
      </figcaption>
    </figure>`).join('')}</div>${cap(c.hint)}`;
}
function liveVersions(box){
  const cards = [...box.querySelectorAll('.sd-ver')];
  let seen = false;
  cards.forEach(card => {
    const imgs = [...card.querySelectorAll('.sd-ver-stack img')], dots = [...card.querySelectorAll('.sd-dots button')];
    let k = 0, timer = 0, held = false;
    const show = i => {
      k = (i + imgs.length) % imgs.length;
      imgs.forEach((im, j) => im.classList.toggle('on', j === k));
      dots.forEach((d, j) => d.classList.toggle('on', j === k));
    };
    // у каждой карточки свой ритм: внимание прыгает неровно
    const tick = () => {
      clearTimeout(timer);
      if (!seen || held || still()) return;
      timer = setTimeout(() => { show(k + 1); tick(); }, rnd(1400, 3800));
    };
    card._tick = tick;
    const stack = card.querySelector('.sd-ver-stack');
    // мышью: курсор ведет по версиям слева направо, автоперебор на паузе
    stack.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      held = true; clearTimeout(timer); card.classList.add('held');
      const r = stack.getBoundingClientRect();
      show(Math.min(imgs.length - 1, Math.floor((e.clientX - r.left) / r.width * imgs.length)));
    });
    stack.addEventListener('pointerleave', () => { held = false; card.classList.remove('held'); tick(); });
    stack.addEventListener('click', e => {
      // пальцем — следующая версия; мышью — увеличить все версии и листать
      if (e.pointerType && e.pointerType !== 'mouse') { show(k + 1); return; }
      H.openViewer(imgs.map(i => i.currentSrc || i.src), k, imgs);
    });
    dots.forEach((d, j) => d.addEventListener('click', () => { show(j); clearTimeout(timer); held = true; setTimeout(() => { held = false; tick(); }, 4000); }));
  });
  onScreen(box, v => { seen = v; cards.forEach(c => c._tick()); });
}

/* ---------- фурнитура: детали кружат солнышком вокруг подписи ---------- */
// по кругу медленно вращаются круглые фото; та, что «в фокусе», подрастает, а ее подпись встает в центр;
// наведение останавливает круг и показывает подпись под курсором
function detailsHTML(c){
  const n = c.items.length;
  return `<div class="sd-orbit" style="--n:${n}">
    <div class="sd-orb-ring">${c.items.map((x, i) => `
      <button class="sd-orb" style="--a:${(360 / n * i).toFixed(2)}deg" data-i="${i}" aria-label="${H.pick(x.note) || 'Увеличить'}">
        <span class="sd-orb-in"><img src="${x.img}" alt="" loading="lazy" draggable="false"></span>
      </button>`).join('')}</div>
    <div class="sd-orb-core">
      ${c.center ? `<b class="sd-orb-title">${H.T(c.center)}</b>` : ''}
      <div class="sd-orb-notes">${c.items.map((x, i) => `<p class="sd-orb-note${i ? '' : ' on'}" data-i="${i}">${H.T(x.note)}</p>`).join('')}</div>
    </div>
  </div>${cap(c.hint)}`;
}
function liveDetails(box){
  const orbs = [...box.querySelectorAll('.sd-orb')], notes = [...box.querySelectorAll('.sd-orb-note')];
  const ring = box.querySelector('.sd-orb-ring'), n = orbs.length;
  let ang = 0, k = 0, held = false, seen = false, raf = 0, last = 0, next = 0;
  const show = i => {
    k = i;
    orbs.forEach((o, j) => o.classList.toggle('on', j === i));
    notes.forEach((p, j) => p.classList.toggle('on', j === i));
  };
  show(0);
  const place = () => {
    ring.style.setProperty('--rot', ang.toFixed(2) + 'deg');
  };
  const draw = t => {
    const dt = Math.min(64, t - (last || t)); last = t;
    if (!held) ang = (ang + dt * .006) % 360;   // полный круг примерно за минуту
    place();
    if (!held && t > next) { show((k + 1) % n); next = t + 2600; }
    if (seen) raf = requestAnimationFrame(draw);
  };
  orbs.forEach((o, i) => {
    o.addEventListener('pointerenter', () => { held = true; show(i); });
    o.addEventListener('pointerleave', () => { held = false; next = performance.now() + 2600; });
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('.sd-orb'); if (!b) return;
    const i = orbs.indexOf(b);
    // пальцем: первое касание — подпись, второе — увеличить
    if (e.pointerType && e.pointerType !== 'mouse' && k !== i) { show(i); held = true; setTimeout(() => { held = false; }, 4000); return; }
    const imgs = orbs.map(t => t.querySelector('img'));
    H.openViewer(imgs.map(im => im.currentSrc || im.src), i, imgs);
  });
  if (still()) return;
  onScreen(box, v => {
    if (v && !seen) { seen = true; last = 0; raf = requestAnimationFrame(draw); }
    else if (!v) { seen = false; cancelAnimationFrame(raf); }
  });
}

/* ---------- что вышло: четыре футболки, которые пошли в производство ---------- */
// у каждой — подпись и ряд фото и роликов; ролики играют без звука, только когда на экране
function finMedia(src){
  return /\.mp4$/.test(src)
    ? `<div class="sd-fin vid"><video src="${src}" muted loop playsinline preload="metadata"></video></div>`
    : `<button class="sd-fin" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy"></button>`;
}
function finalHTML(c){
  return `<div class="sd-finals">${c.items.map((g, i) => `
    <div class="sd-fin-group" style="--i:${i}">
      <p class="sd-fin-name">${H.T(g.name)}</p>
      <div class="sd-final">${g.media.map(finMedia).join('')}</div>
    </div>`).join('')}</div>${cap(c.hint)}`;
}
function liveFinal(box){
  const btns = [...box.querySelectorAll('button.sd-fin')];
  box.addEventListener('click', e => {
    const b = e.target.closest('button.sd-fin'); if (!b) return;
    const imgs = btns.map(t => t.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), btns.indexOf(b), imgs);
  });
  box.querySelectorAll('video').forEach(v => onScreen(v, on => {
    if (on && !still()) v.play().catch(() => {}); else v.pause();
  }));
}

/* ---------- о проекте писали: названия изданий крупно ---------- */
function pressHTML(c){
  return `<ul class="sd-press">${c.items.map((x, i) => `<li style="--i:${i}"><a class="sd-press-a" href="${x.link}" target="_blank" rel="noopener">
    <b>${H.T(x.name)}</b><span>${H.T(x.note)}</span></a></li>`).join('')}</ul>`;
}

/* ---------- карусель для соцсетей: три слайда в ряд, лента сама сдвигается на слайд ---------- */
// стрелки — по бокам, вне картинок; наведение — пауза; нажатие на слайд — увеличить; свайп пальцем
const CAR_MS = 3500;
function carouselHTML(c){
  const arrow = d => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2"><path d="${d}"/></svg>`;
  return `<div class="sd-car">
    <button class="sd-car-btn prev" aria-label="Предыдущий слайд">${arrow('M12 4l-6 6 6 6')}</button>
    <div class="sd-car-view" tabindex="0" aria-label="Карусель, ${c.items.length} слайдов" aria-roledescription="carousel">
      <div class="sd-car-track">${c.items.map((src, i) => `<button class="sd-car-card" aria-label="Слайд ${i + 1}, увеличить"><img src="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>
    </div>
    <button class="sd-car-btn next" aria-label="Следующий слайд">${arrow('M8 4l6 6-6 6')}</button>
    <div class="sd-car-dots"></div>
  </div>${cap(c.hint)}`;
}
function liveCarousel(box){
  const view = box.querySelector('.sd-car-view'), track = box.querySelector('.sd-car-track'), cards = [...track.children];
  const dotsBox = box.querySelector('.sd-car-dots');
  let k = 0, seen = false, held = false, timer = 0;
  const per = () => Math.max(1, Math.round(view.clientWidth / cards[0].offsetWidth));   // сколько слайдов видно
  const last = () => cards.length - per();
  const drawDots = () => {
    dotsBox.innerHTML = Array.from({ length: last() + 1 }, (_, i) => `<span${i === k ? ' class="on"' : ''}></span>`).join('');
  };
  const go = i => {
    const L = last();
    k = i > L ? 0 : i < 0 ? L : i;   // по кругу: после последнего — снова первый
    track.style.transform = `translateX(${-cards[k].offsetLeft}px)`;
    [...dotsBox.children].forEach((d, j) => d.classList.toggle('on', j === k));
    tick();
  };
  const tick = () => {
    clearTimeout(timer);
    // на первой карточке задерживаемся дольше: ее успевают рассмотреть
    if (seen && !held && !still()) timer = setTimeout(() => go(k + 1), k ? CAR_MS : CAR_MS * 1.6);
  };
  box.querySelector('.prev').addEventListener('click', () => go(k - 1));
  box.querySelector('.next').addEventListener('click', () => go(k + 1));
  view.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { held = true; clearTimeout(timer); } });
  view.addEventListener('pointerleave', () => { held = false; tick(); });
  view.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(k + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
  let x0 = null, swiped = false;
  view.addEventListener('pointerdown', e => { swiped = false; if (e.pointerType !== 'mouse') x0 = e.clientX; });
  view.addEventListener('pointerup', e => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { swiped = true; go(k + (dx < 0 ? 1 : -1)); }
  });
  track.addEventListener('click', e => {
    const b = e.target.closest('.sd-car-card'); if (!b || swiped) return;
    const imgs = cards.map(c => c.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), cards.indexOf(b), imgs);
  });
  new ResizeObserver(() => { drawDots(); go(Math.min(k, last())); }).observe(view);
  // лента трогается, только когда видна почти целиком, и каждый раз начинает с первой — самой эффектной — карточки
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !seen) { seen = true; go(0); }
    else if (!e.isIntersecting && seen) { seen = false; clearTimeout(timer); }
  }, { threshold: .6 }).observe(view);
}

/* ---------- первые эскизы: коллаж, кадры проявляются шторкой по очереди ---------- */
// { img, big: true } — ячейка 2 × 2, { img, wide: true } — 2 × 1; остальные — по одной клетке
function firstHTML(c){
  return `<div class="sd-first">${c.items.map((x, i) => {
    const it = typeof x === 'string' ? { img: x } : x;
    return `<button class="sd-fs${it.big ? ' big' : it.wide ? ' wide' : ''}" style="--i:${i}" aria-label="Увеличить эскиз"><img src="${it.img}" alt="" loading="lazy" draggable="false"></button>`;
  }).join('')}</div>${cap(c.hint)}`;
}
function liveFirst(box){
  const tiles = [...box.querySelectorAll('.sd-fs')];
  box.addEventListener('click', e => {
    const b = e.target.closest('.sd-fs'); if (!b) return;
    const imgs = tiles.map(t => t.querySelector('img'));
    H.openViewer(imgs.map(i => i.currentSrc || i.src), tiles.indexOf(b), imgs);
  });
}

const KINDS = {
  first:    [firstHTML, liveFirst, '.sd-first'],
  thoughts: [thoughtsHTML, liveThoughts, '.sd-thoughts'],
  board:    [boardHTML, liveBoard, '.sd-board'],
  type:     [typeHTML, liveType, '.sd-types'],
  versions: [versionsHTML, liveVersions, '.sd-vers'],
  details:  [detailsHTML, liveDetails, '.sd-orbit'],
  final:    [finalHTML, liveFinal, '.sd-final'],
  press:    [pressHTML, null, '.sd-press'],
  carousel: [carouselHTML, liveCarousel, '.sd-car'],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'adhd.css?v=' + (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5));
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: на Тильде style.css стоит в body, стили кейса должны идти после него
  });
  return cssReady;
}
// глава появляется, когда доезжает до экрана
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });   // без порога по доле: длинная глава на телефоне выше нескольких экранов

export async function mountADHD(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  mount.innerHTML = p.adhd.map(ch => {
    const kind = Object.keys(KINDS).find(k => ch[k]);
    return `<section class="sd-ch wrap sd-${kind}-ch">${head(ch, kind === 'thoughts' && ch.thoughts.hint)}<div class="sd-viz">${kind ? KINDS[kind][0](ch[kind]) : ''}</div></section>`;
  }).join('');
  mount.querySelectorAll('.sd-ch').forEach(s => reveal.observe(s));
  Object.values(KINDS).forEach(([, live, sel]) => live && mount.querySelectorAll(sel).forEach(live));
}
