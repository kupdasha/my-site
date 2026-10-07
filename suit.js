/* ================================================================
   КЕЙС «ПАРАШЮТНЫЙ КОСТЮМ SKOLKOVO» (поле suit у проекта)
   Главы: sky — два парашютиста в небе, ползунок отодвигает их,
   и видно, что черные грипсы пропадают, а полосатые читаются;
   shot — картинка с подписью, по нажатию крупно; steps — цепочка
   этапов (разметка .yst из style.css); spots — точки на рендере,
   подсказка у точки, на телефоне подпись под картинкой.
   Тексты — в content.js, оформление — suit.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
// перебор по кругу, пока блок на экране и его не трогали
function autoTour(box, n, show, ms = 2600){
  let i = 0, t = 0, touched = false;
  const step = () => { show(i = (i + 1) % n); };
  onScreen(box, v => {
    clearInterval(t);
    if (v && !touched && !still()) t = setInterval(step, ms);
  });
  return () => { touched = true; clearInterval(t); };
}

const head = ch => `<div class="su-head">
  <span class="case-label su-label">${H.T(ch.label)}</span>
  <h2 class="su-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="su-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const cap = t => t ? `<p class="su-cap">${H.T(t)}</p>` : '';

/* ---------- небо: два парашютиста, ползунок отодвигает их ---------- */
// фирменные полосы — цвета сняты с рендера костюма
const STRIPES = ['#2EA44A', '#F2C94C', '#E53E3E', '#FFFFFF', '#8E44AD', '#2F6FE0', '#F2C94C', '#2EA44A', '#FFFFFF', '#E53E3E'];
// парашютист сверху, лежит на потоке: руки и ноги согнуты, как в групповой акробатике
function diverSVG(colored){
  const suit = '#17181C', seam = '#2B2D33';
  const limb = (a, b, w) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${suit}" stroke-width="${w}" stroke-linecap="round"/>`;
  // грипс — полосы вдоль отрезка; на черном костюме без узора полосы того же цвета, что костюм
  const grip = (a, b, w) => {
    const n = STRIPES.length, out = [];
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const x0 = a[0] + (b[0] - a[0]) * t0, y0 = a[1] + (b[1] - a[1]) * t0;
      const x1 = a[0] + (b[0] - a[0]) * t1, y1 = a[1] + (b[1] - a[1]) * t1;
      out.push(`<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${colored ? STRIPES[i] : seam}" stroke-width="${w}" stroke-linecap="butt"/>`);
    }
    return `<g>${out.join('')}</g>`;
  };
  // точки фигуры: плечо → локоть → кисть, бедро → колено → стопа (стопы подняты к небу, поэтому голени коротки)
  const L = { sh: [82, 70], el: [40, 64], hd: [30, 28], hip: [88, 132], kn: [60, 172], ft: [56, 200] };
  const R = { sh: [118, 70], el: [160, 64], hd: [170, 28], hip: [112, 132], kn: [140, 172], ft: [144, 200] };
  const side = s => limb(s.sh, s.el, 18) + limb(s.el, s.hd, 16) + limb(s.hip, s.kn, 20) + limb(s.kn, s.ft, 18);
  const grips = s => {
    const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    return grip(mid(s.sh, s.el, .22), mid(s.sh, s.el, .88), 11) + grip(mid(s.hip, s.kn, .2), mid(s.hip, s.kn, .85), 12);
  };
  return `<svg viewBox="0 0 200 210" aria-hidden="true">
    ${side(L)}${side(R)}
    <rect x="76" y="56" width="48" height="82" rx="22" fill="${suit}"/>
    <circle cx="100" cy="40" r="19" fill="${suit}"/>
    <path d="M85 38a15 15 0 0 1 30 0" fill="none" stroke="${seam}" stroke-width="4" stroke-linecap="round"/>
    ${grips(L)}${grips(R)}
    <path d="M100 66v60" stroke="${seam}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
function skyHTML(c){
  const names = c.names || [];
  return `<div class="su-sky-box">
    <div class="su-sky">
      <div class="su-cloud a"></div><div class="su-cloud b"></div><div class="su-cloud c"></div>
      <div class="su-fly" style="--x:30%">${diverSVG(false)}</div>
      <div class="su-fly rev" style="--x:70%">${diverSVG(true)}</div>
    </div>
    <div class="su-names">${names.map(n => `<span>${H.T(n)}</span>`).join('')}</div>
    <label class="su-ctl"><span>${H.T(c.near || 'ближе')}</span><input type="range" min="0" max="1000" value="0" aria-label="${esc(H.pick(c.far || 'дальше'))}"><span>${H.T(c.far || 'дальше')}</span></label>
    ${cap(c.hint)}
  </div>`;
}
function liveSky(box){
  const sky = box.querySelector('.su-sky'), range = box.querySelector('input');
  const MIN = .13;   // самый далекий партнер
  let touched = false, raf = 0, t0 = 0, on = false;
  const set = v => sky.style.setProperty('--k', (1 - (1 - MIN) * v).toFixed(3));
  // пока не тронули — партнер сам медленно отлетает и возвращается
  const drift = now => {
    if (!on || touched) return;
    if (!t0) t0 = now;
    const v = (1 - Math.cos((now - t0) / 9000 * Math.PI * 2)) / 2;   // 0 → 1 → 0 за 9 с
    range.value = Math.round(v * 1000); set(v);
    raf = requestAnimationFrame(drift);
  };
  onScreen(box, v => {
    on = v; cancelAnimationFrame(raf);
    if (v && !touched && !still()) raf = requestAnimationFrame(drift);
  });
  range.addEventListener('input', () => { touched = true; cancelAnimationFrame(raf); set(range.value / 1000); });
  set(0);
}

/* ---------- картинка с подписью, по нажатию крупно ---------- */
function shotHTML(c){
  return `<button type="button" class="su-shot" style="--ar:${c.ratio || '16/9'}" aria-label="Увеличить"><img src="${c.img}" alt="" loading="lazy"></button>${cap(c.caption)}`;
}
function liveShot(box){
  const b = box.querySelector('.su-shot'), img = b.querySelector('img');
  b.addEventListener('click', () => H.openViewer([img.currentSrc || img.src], 0, [img]));
}

/* ---------- цепочка этапов: разметка и стили .yst из style.css ---------- */
function stepsHTML(items){
  const arrow = '<svg class="yst-arrow" viewBox="0 0 48 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h40M33 3l10 9-10 9"/></svg>';
  return `<div class="yst su-steps" style="--n:${items.length}">${items.map((s, i) => `${i ? arrow : ''}
    <div class="yst-step" style="--i:${i}">${s.tag ? `<span class="yst-tag">${H.T(s.tag)}</span>` : ''}<b>${H.T(s.title)}</b><p>${H.T(s.text)}</p></div>`).join('')}</div>`;
}
const stepsReveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); stepsReveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -15% 0px' });
function liveSteps(box){ stepsReveal.observe(box.querySelector('.yst')); }

/* ---------- точки на рендере ---------- */
function spotsHTML(c){
  return `<div class="su-spots">
    <div class="su-stage su-spots-pic">
      <div class="su-spots-in"><img src="${c.img}" alt="" draggable="false">
      ${c.spots.map((s, i) => `<button type="button" class="su-spot" data-i="${i}" style="left:${s.x}%;top:${s.y}%" aria-label="${esc(H.pick(s.name))}"><i></i></button>`).join('')}</div>
      <div class="su-tip" aria-live="polite"><b></b><span></span></div>
    </div>
    <p class="su-spots-cap"><b></b><span></span></p>
    ${cap(c.hint)}
  </div>`;
}
function liveSpots(box, c){
  const pic = box.querySelector('.su-spots-pic'), tip = box.querySelector('.su-tip'), mob = box.querySelector('.su-spots-cap');
  const spots = [...box.querySelectorAll('.su-spot')];
  const show = i => {
    const s = c.spots[i];
    spots.forEach((el, k) => el.classList.toggle('on', k === i));
    [tip, mob].forEach(el => {
      el.querySelector(':scope > b').innerHTML = H.T(s.name);
      el.querySelector(':scope > span').innerHTML = s.text ? H.T(s.text) : '';
    });
    tip.style.left = s.x + '%'; tip.style.top = s.y + '%';
    tip.classList.toggle('left', s.x > 58);
    tip.classList.toggle('up', s.y > 62);
    tip.classList.remove('show'); void tip.offsetWidth; tip.classList.add('show');
  };
  show(0);
  const stop = autoTour(pic, c.spots.length, show, 3000);
  spots.forEach(el => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { stop(); show(+el.dataset.i); } });
    el.addEventListener('click', () => { stop(); show(+el.dataset.i); });
  });
}

const KINDS = {
  sky:   [skyHTML, liveSky],
  shot:  [shotHTML, liveShot],
  steps: [stepsHTML, liveSteps],
  spots: [spotsHTML, liveSpots],
};

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'suit.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountSuit(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const kinds = p.suit.map(ch => Object.keys(KINDS).find(k => ch[k]));
  mount.innerHTML = p.suit.map((ch, i) =>
    `<section class="su-ch wrap su-${kinds[i]}-ch">${head(ch)}<div class="su-viz">${kinds[i] ? KINDS[kinds[i]][0](ch[kinds[i]]) : ''}</div></section>`).join('');
  mount.querySelectorAll('.su-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.su-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.su-viz'), p.suit[i][k]); });
}
