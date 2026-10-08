/* ================================================================
   КЕЙС «ИСПРАВЛЯТОР» (поле fix у проекта)
   У каждой главы сверху — маленькая живая иконка, без иллюстраций:
   crowd — фотоаппарат со вспышкой; pay — карта, оплата не прошла;
   fix — искры; power — ползунок ходит; where — ноутбук и облако.
   crowd и pay — парой в ряд; fix — шторка до и после на настоящих
   фото (пары переключаются миниатюрами и сами), сразу под ней —
   ролик кейса (heroEnd: блок переносится сюда из конца кейса);
   power и where — парой в ряд, под where — лаймовая кнопка демо.
   Тексты — в content.js, оформление — fix.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

/* ---------- иконки: 48 × 48, линия цвета текста, лаймовое — то, что двигается ---------- */
const ICON = {
  // фотоаппарат: вспышка — лучи и лаймовый объектив мигают
  crowd: `<rect x="5" y="15" width="38" height="26" rx="6"/><path d="M16 15L19 10H29L32 15"/>
    <circle cx="24" cy="28" r="7.5" class="ac fl"/><g class="rays"><path d="M40 4V8M44.5 6.5L41.5 9.5M46 11H42"/></g>`,
  // карта: дрожит, сбоку выскакивает крестик
  pay: `<g class="card"><rect x="4" y="11" width="34" height="23" rx="4"/><path d="M4 18H38"/><rect x="9" y="24" width="8" height="5" rx="1.5" class="ac"/></g>
    <g class="no"><circle cx="37" cy="34" r="8.5"/><path d="M33.5 30.5L40.5 37.5M40.5 30.5L33.5 37.5"/></g>`,
  // искры: большая и маленькая мерцают по очереди
  fix: `<path class="ac s1" d="M20 6C21.5 15 24 17.5 33 19C24 20.5 21.5 23 20 32C18.5 23 16 20.5 7 19C16 17.5 18.5 15 20 6Z"/>
    <path class="ac s2" d="M36 27C36.8 31.5 38 32.7 42.5 33.5C38 34.3 36.8 35.5 36 40C35.2 35.5 34 34.3 29.5 33.5C34 32.7 35.2 31.5 36 27Z"/>`,
  // ползунок силы: ручка ходит от «чуть-чуть» до «максимум»
  power: `<path d="M6 24H42"/><path class="fillln" d="M6 24H42"/><path d="M6 31V35M42 31V35M24 31V35"/><circle cx="0" cy="24" r="6" class="ac knob"/>`,
  // ноутбук и облако: снимок поднимается по пунктиру и возвращается
  where: `<rect x="9" y="25" width="30" height="16" rx="2.5"/><path d="M4 45H44"/>
    <path d="M14 15H31A6 6 0 0 0 30 3.2A8.5 8.5 0 0 0 14.3 6.5A4.3 4.3 0 0 0 14 15Z"/>
    <path class="up" d="M24 23V17"/><circle cx="24" cy="20" r="2.3" class="ac dot"/>`,
};
const icon = k => `<span class="fx-ic fx-ic-${k}" aria-hidden="true"><svg viewBox="0 0 48 48">${ICON[k]}</svg></span>`;

/* ---------- текст главы: иконка, подпись, заголовок, абзац ---------- */
const block = (k, c, t) => `<div class="fx-col fx-${k}">
  ${icon(k)}
  <span class="case-label fx-label">${H.T(c.label)}</span>
  <h2 class="fx-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="fx-text">${H.T(c.text)}</p>` : ''}
  ${t ? `<div class="fx-try">
    <h3 class="fx-try-title">${H.T(t.title)}</h3>
    <p class="fx-try-text">${H.T(t.text)}</p>
    <a class="btn btn-accent fx-try-btn" href="${esc(t.link)}" target="_blank" rel="noopener">${H.T(t.btn)}</a>
  </div>` : ''}
</div>`;

/* ================================================================
   fix — шторка до и после, несколько пар
   ================================================================ */
function cmpHTML(c){
  const [a, b] = H.pick(c.pair);
  const pairs = c.pairs || [{ before: c.before, after: c.after }];
  return `<div class="fx-cmp" style="--x:50%" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="${esc(a)} / ${esc(b)}">
    <img class="fx-cmp-b" src="${esc(pairs[0].after)}" alt="" decoding="async">
    <div class="fx-cmp-a"><img src="${esc(pairs[0].before)}" alt="" decoding="async"></div>
    <span class="fx-tag l">${H.T(a)}</span><span class="fx-tag r">${H.T(b)}</span>
    <div class="fx-cmp-line" aria-hidden="true"><span class="fx-cmp-knob"><svg viewBox="0 0 24 24"><path d="M9 7L4 12L9 17M15 7L20 12L15 17"/></svg></span></div>
  </div>
  ${pairs.length > 1 ? `<div class="fx-pairs">${pairs.map((p, i) =>
    `<button class="fx-pair${i ? '' : ' on'}" type="button" data-i="${i}" aria-label="${i + 1}"><img src="${esc(p.after)}" alt="" loading="lazy" decoding="async"><i></i></button>`).join('')}</div>` : ''}`;
}
function liveCmp(box, c){
  const cmp = box.querySelector('.fx-cmp');
  const imgA = cmp.querySelector('.fx-cmp-a img'), imgB = cmp.querySelector('.fx-cmp-b');
  const btns = [...box.querySelectorAll('.fx-pair')];
  const pairs = c.pairs || [{ before: c.before, after: c.after }];
  // остальные пары грузим заранее, чтобы переключение было без мигания
  pairs.slice(1).forEach(p => { new Image().src = p.before; new Image().src = p.after; });
  let x = 50, cur = 0, touched = false, on = false, raf = 0, t0 = 0, lap = 0;
  const LAP = 6000;
  const set = v => { x = Math.max(0, Math.min(100, v)); cmp.style.setProperty('--x', x + '%'); cmp.setAttribute('aria-valuenow', Math.round(x)); };
  const show = i => {
    cur = (i + pairs.length) % pairs.length;
    cmp.classList.add('swap');
    setTimeout(() => { imgA.src = pairs[cur].before; imgB.src = pairs[cur].after; cmp.classList.remove('swap'); }, 220);
    btns.forEach((b, k) => b.classList.toggle('on', k === cur));
  };
  // шторка ходит сама; после каждого круга — следующая пара, полоска на миниатюре показывает, сколько осталось
  const tick = now => {
    if (!on || touched) { raf = 0; return; }
    if (!t0) t0 = now;
    const t = (now - t0) / LAP, n = Math.floor(t), ph = t - n;
    if (n !== lap) { lap = n; show(cur + 1); }
    const k = .5 - .5 * Math.cos(ph * Math.PI * 2);
    set(12 + 76 * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));
    btns.forEach((b, i) => b.style.setProperty('--p', i === cur ? ph : 0));
    raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!raf && on && !touched && !still()) { t0 = 0; lap = 0; raf = requestAnimationFrame(tick); } };
  const stop = () => { touched = true; btns.forEach(b => b.style.setProperty('--p', 0)); };
  const at = e => { const r = cmp.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
  let drag = false;
  cmp.addEventListener('pointerdown', e => { stop(); drag = true; cmp.setPointerCapture(e.pointerId); at(e); });
  cmp.addEventListener('pointermove', e => { if (drag || e.pointerType === 'mouse') { stop(); at(e); } });
  cmp.addEventListener('pointerup', () => { drag = false; });
  cmp.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { stop(); set(x + (e.key === 'ArrowLeft' ? -5 : 5)); e.preventDefault(); }
  });
  btns.forEach(b => b.addEventListener('click', () => { stop(); show(+b.dataset.i); set(50); }));
  onScreen(cmp, v => { on = v; go(); }, .3);
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'fix.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountFix(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const f = p.fix;
  const pair = (...ks) => {
    const list = ks.filter(k => f[k]);
    return list.length ? `<section class="fx-ch wrap fx-row">${list.map(k => block(k, f[k], k === 'where' ? f.try : null)).join('')}</section>` : '';
  };
  mount.innerHTML = pair('crowd', 'pay')
    + (f.fix ? `<section class="fx-ch wrap fx-split fx-fix-ch"><div class="fx-viz">${cmpHTML(f.fix)}</div>${block('fix', f.fix)}</section>` : '')
    + pair('power', 'where');
  // ролик кейса (heroEnd) — сразу под шторкой
  const fixCh = mount.querySelector('.fx-fix-ch');
  const film = mount.parentNode && mount.parentNode.querySelector('.case-hero-end');
  if (fixCh && film) { fixCh.after(film); film.classList.add('fx-film'); }
  mount.querySelectorAll('.fx-ch').forEach(s => reveal.observe(s));
  if (fixCh) liveCmp(fixCh, f.fix);
  // иконки двигаются, только пока их видно
  mount.querySelectorAll('.fx-ic').forEach(ic => onScreen(ic, v => ic.classList.toggle('run', v && !still()), .1));
}
