/* ================================================================
   КЕЙС «3D + AI. ИЛЛЮСТРАЦИИ» (поле isle у проекта)
   Остров-город: сначала 3D, спустя годы — тот же рендер после нейросети.
   path — от эскиза до нейросети: строка этапов сверху с полоской таймера,
     кадры сменяются сами, нажатие на кадр — крупно;
   shutter — шторка 3D / AI на одном кадре, ходит сама, пока не тронули;
   more — тот же прием на других проектах: строка проектов, у каждого
     шторка 3D / AI, у нескольких вариантов — миниатюры под шторкой;
     side — если ракурс у нейросети другой, вместо шторки две картинки рядом;
     lights — смена освещения на месте: 3D и варианты нейросети сменяются
     сами, миниатюры с подписями — переключатели.
   Тексты — в content.js, оформление — isle.css, картинки — img/isle.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => matchMedia('(max-width:760px)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// на телефоне — легкая копия 900 px
const src = s => phone() ? s.replace(/\.webp$/, '-s.webp') : s;
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

/* ---------- заголовок главы: подпись слева, заголовок и абзац справа ---------- */
const head = c => `<div class="ia-head">
  <span class="case-label ia-label">${H.T(c.label)}</span>
  <h2 class="ia-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="ia-text">${H.T(c.text)}</p>` : ''}
</div>`;

// строка надписей сверху: текущая темная, под ней бежит полоска таймера
const tabs = names => `<div class="ia-tabs" role="tablist">${names.map((n, i) =>
  `<button class="ia-tab" type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><span>${n}</span><i class="ia-tick"></i></button>`).join('')}</div>`;

// переключатель листает сам по кругу, пока блок на экране и его не трогали
function cycle(box, n, show, ms){
  const btns = [...box.querySelectorAll(':scope > .ia-tabs .ia-tab')];
  let cur = 0, timer = 0, seen = false, touched = false;
  const set = i => {
    cur = (i + n) % n;
    btns.forEach((b, j) => b.setAttribute('aria-selected', j === cur));
    // на телефоне строка — лента вбок: текущая подъезжает в видимую часть
    const bar = btns[cur].parentElement;
    if (bar.scrollWidth > bar.clientWidth + 2) {
      const d = btns[cur].getBoundingClientRect().left - bar.getBoundingClientRect().left;
      bar.scrollTo({ left: bar.scrollLeft + d - 20, behavior: still() ? 'auto' : 'smooth' });
    }
    show(cur);
    run();
  };
  const run = () => {
    clearTimeout(timer);
    box.style.setProperty('--ms', ms + 'ms');
    btns.forEach(b => b.classList.remove('run'));
    if (touched || !seen || still()) return;
    void box.offsetWidth; btns[cur].classList.add('run');
    timer = setTimeout(() => set(cur + 1), ms);
  };
  btns.forEach((b, i) => b.addEventListener('click', () => { touched = true; set(i); }));
  onScreen(box, v => { seen = v; run(); }, .35);
  set(0);
  return { stop: () => { touched = true; run(); } };
}

/* ================================================================
   path — этапы от эскиза до нейросети
   ================================================================ */
function pathHTML(c, years){
  const steps = c.steps;
  return `<section class="ia-ch ia-path wrap">
    ${head(c)}
    <div class="ia-box">
      ${tabs(steps.map(s => H.T(s.name) + (s.year ? ` <em>${years[s.year]}</em>` : '')))}
      <div class="ia-stage" role="button" tabindex="0" aria-label="Увеличить">
        ${steps.map((s, i) => `<img class="ia-shot${i ? '' : ' on'}" src="${esc(src(s.img))}" alt="" ${i ? 'loading="lazy" ' : ''}decoding="async" draggable="false">`).join('')}
      </div>
      <div class="ia-caps">${steps.map((s, i) => `<p class="ia-cap${i ? '' : ' on'}">${H.T(s.text)}</p>`).join('')}</div>
    </div>
  </section>`;
}
function livePath(sec, c){
  const box = sec.querySelector('.ia-box');
  const shots = [...sec.querySelectorAll('.ia-shot')], caps = [...sec.querySelectorAll('.ia-cap')];
  let cur = 0;
  const ctl = cycle(box, shots.length, i => {
    cur = i;
    shots.forEach((s, k) => s.classList.toggle('on', k === i));
    caps.forEach((s, k) => s.classList.toggle('on', k === i));
  }, 3600);
  const stage = sec.querySelector('.ia-stage');
  const zoom = () => { ctl.stop(); H.openViewer(c.steps.map(s => s.img), cur, shots); };
  stage.addEventListener('click', zoom);
  stage.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoom(); } });
}

/* ================================================================
   шторка 3D / AI: ходит сама, пока не тронули; курсор или палец двигает
   ================================================================ */
function cmpHTML(before, after, ratio, tags){
  return `<div class="ia-cmp" style="--x:50%;aspect-ratio:${ratio || '16 / 9'};width:min(100%,calc(70vh * ${ratio || '16 / 9'}));margin-inline:auto" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="${esc(tags[0])} / ${esc(tags[1])}">
    <img class="ia-cmp-b" src="${esc(src(after))}" alt="" loading="lazy" decoding="async" draggable="false">
    <div class="ia-cmp-a"><img src="${esc(src(before))}" alt="" loading="lazy" decoding="async" draggable="false"></div>
    <span class="ia-tag l">${H.T(tags[0])}</span><span class="ia-tag r">${H.T(tags[1])}</span>
    <div class="ia-cmp-line" aria-hidden="true"><span class="ia-cmp-knob"><svg viewBox="0 0 24 24"><path d="M9 7L4 12L9 17M15 7L20 12L15 17"/></svg></span></div>
  </div>`;
}
function liveCmp(cmp){
  let x = 50, touched = false, on = false, raf = 0, t0 = 0;
  const LAP = 6000;
  const set = v => { x = Math.max(0, Math.min(100, v)); cmp.style.setProperty('--x', x + '%'); cmp.setAttribute('aria-valuenow', Math.round(x)); };
  const tick = now => {
    if (!on || touched) { raf = 0; return; }
    if (!t0) t0 = now;
    const k = .5 - .5 * Math.cos((now - t0) / LAP * Math.PI * 2);
    set(12 + 76 * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));   // туда-обратно, у краев притормаживает
    raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!raf && on && !touched && !still()) { t0 = 0; raf = requestAnimationFrame(tick); } };
  const stop = () => { touched = true; };
  const at = e => { const r = cmp.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
  let drag = false;
  cmp.addEventListener('pointerdown', e => { stop(); drag = true; cmp.setPointerCapture(e.pointerId); at(e); });
  cmp.addEventListener('pointermove', e => { if (drag || e.pointerType === 'mouse') { stop(); at(e); } });
  cmp.addEventListener('pointerup', () => { drag = false; });
  cmp.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { stop(); set(x + (e.key === 'ArrowLeft' ? -5 : 5)); e.preventDefault(); }
  });
  onScreen(cmp, v => { on = v; go(); }, .3);
  return { reset: () => set(50) };
}

/* ================================================================
   more — склад и коридоры: шторка или две картинки рядом
   ================================================================ */
// две картинки рядом с подписями «3D» и «AI»: обе целиком на экране
const sideHTML = (before, after, ratio, tags) => `<div class="ia-side" style="width:min(100%,calc(64vh * 2 * ${ratio}))">
  ${[before, after].map((im, k) => `<div class="ia-half" style="aspect-ratio:${ratio}">
    <img src="${esc(src(im))}" alt="" loading="lazy" decoding="async" draggable="false">
    <span class="ia-tag l${k ? ' ai' : ''}">${H.T(tags[k])}</span>
  </div>`).join('')}
</div>`;
// смена света: кадры лежат друг на друге, сверху слева — подпись текущего
const lightsHTML = s => `<div class="ia-lights" style="aspect-ratio:${s.ratio};width:min(100%,calc(70vh * ${s.ratio}))">
  ${s.lights.map((l, k) => `<div class="ia-lt${k ? '' : ' on'}"><img src="${esc(src(l.img))}" alt="" loading="lazy" decoding="async" draggable="false"><span class="ia-tag l${k ? ' ai' : ''}">${H.T(l.name)}</span></div>`).join('')}
</div>`;
// листает свет по кругу, пока кадр на экране и его не трогали
function liveLights(it, ctl){
  const frames = [...it.querySelectorAll('.ia-lt')], vars = [...it.querySelectorAll('.ia-var')];
  let cur = 0, timer = 0, seen = false, touched = false;
  const show = i => {
    cur = (i + frames.length) % frames.length;
    frames.forEach((f, k) => f.classList.toggle('on', k === cur));
    vars.forEach((v, k) => v.classList.toggle('on', k === cur));
    run();
  };
  const run = () => {
    clearTimeout(timer);
    if (touched || !seen || still() || !it.classList.contains('on')) return;
    timer = setTimeout(() => show(cur + 1), 2400);
  };
  vars.forEach((v, k) => v.addEventListener('click', () => { touched = true; ctl.stop(); show(k); }));
  onScreen(it.querySelector('.ia-lights'), v => { seen = v; run(); }, .3);
  new MutationObserver(run).observe(it, { attributes: true, attributeFilter: ['class'] });
}
function moreHTML(c, tagsFor){
  const tg = tagsFor(c.pair);
  return `<section class="ia-ch ia-more wrap">
    ${head(c)}
    <div class="ia-box">
      ${tabs(c.items.map(s => H.T(s.name)))}
      <div class="ia-board">${c.items.map((s, i) => `<div class="ia-item${i ? '' : ' on'}" data-i="${i}">
        ${s.lights ? lightsHTML(s) : s.side ? sideHTML(s.before, s.after[0], s.ratio, tg) : cmpHTML(s.before, s.after[0], s.ratio, tg)}
        <div class="ia-under">
          <p class="ia-cap on">${H.T(s.text)}</p>
          ${s.lights ? `<div class="ia-vars">${s.lights.map((l, k) =>
            `<button class="ia-var${k ? '' : ' on'}" type="button" data-k="${k}"><img src="${esc(l.img.replace(/\.webp$/, '-s.webp'))}" alt="" loading="lazy" decoding="async"><span>${H.T(l.name)}</span></button>`).join('')}</div>` : ''}
          ${s.after && s.after.length > 1 ? `<div class="ia-vars">${s.after.map((a, k) =>
            `<button class="ia-var${k ? '' : ' on'}" type="button" data-k="${k}" aria-label="Вариант нейросети"><img src="${esc(a.replace(/\.webp$/, '-s.webp'))}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
        </div>
      </div>`).join('')}</div>
    </div>
  </section>`;
}
function liveMore(sec, c){
  const items = [...sec.querySelectorAll('.ia-item')];
  const ctl = cycle(sec.querySelector('.ia-box'), items.length, i => items.forEach((s, k) => s.classList.toggle("on", k === i)), 10000);
  items.forEach((it, i) => {
    if (c.items[i].lights) { liveLights(it, ctl); return; }
    const cmp = it.querySelector('.ia-cmp');
    if (!cmp) return;   // две картинки рядом — двигать нечего
    const live = liveCmp(cmp);
    cmp.addEventListener('pointerdown', ctl.stop);
    const vars = [...it.querySelectorAll('.ia-var')];
    const after = c.items[i].after;
    after.slice(1).forEach(a => { const im = new Image(); im.loading = 'lazy'; im.src = src(a); });
    vars.forEach(v => v.addEventListener('click', () => {
      ctl.stop();
      const img = cmp.querySelector('.ia-cmp-b');
      cmp.classList.add('swap');
      setTimeout(() => { img.src = src(after[+v.dataset.k]); cmp.classList.remove('swap'); }, 220);
      vars.forEach(b => b.classList.toggle('on', b === v));
      live.reset();
    }));
  });
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'isle.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountIsle(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const f = p.isle;
  const years = { from: f.from, to: f.to };
  // подписи шторки: «3D, 2021» и «AI, 2026»
  const tagsFor = pair => { const [a, b] = H.pick(pair || [['3D', 'AI'], ['3D', 'AI']]); return [a, b]; };
  let html = '';
  if (f.path) html += pathHTML(f.path, years);
  if (f.shutter) {
    const s = f.shutter;
    html += `<section class="ia-ch ia-shutter wrap">${head(s)}<div class="ia-box">${cmpHTML(s.before, s.after, s.ratio, [`3D, ${f.from}`, `AI, ${f.to}`])}</div></section>`;
  }
  if (f.more) html += moreHTML(f.more, tagsFor);
  mount.innerHTML = html;
  mount.querySelectorAll('.ia-ch').forEach(s => reveal.observe(s));
  const q = s => mount.querySelector(s);
  if (f.path) livePath(q('.ia-path'), f.path);
  if (f.shutter) liveCmp(q('.ia-shutter .ia-cmp'));
  if (f.more) liveMore(q('.ia-more'), f.more);
}
