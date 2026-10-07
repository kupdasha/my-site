/* ================================================================
   КЕЙС «ПАРАШЮТНЫЙ КОСТЮМ SKOLKOVO» (поле suit у проекта)
   Главы: sky — два парашютиста в небе (облака из шума, солнце,
   дымка; фигуры со шлемом, ранцем и стропами), ползунок отодвигает
   их, и видно, что черные грипсы пропадают, а полосатые читаются;
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
let diverN = 0;
// парашютист сверху, лежит на потоке: видно спину с ранцем, шлем, перчатки, ботинки; руки и ноги согнуты
function diverSVG(colored){
  const id = 'sd' + (++diverN);
  const suit = `url(#${id}s)`, dark = '#0E0F12', seam = '#2E3139', strap = '#3A3D46', metal = '#B5BAC4';
  const seg = (a, b, w, color = suit) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // грипс — полосы вдоль отрезка, с темной окантовкой; на костюме без узора полосы того же цвета, что костюм
  const grip = (a, b, w) => {
    const n = STRIPES.length, out = [seg(mid(a, b, -.04), mid(a, b, 1.04), w + 4, dark)];
    for (let i = 0; i < n; i++) {
      const p0 = mid(a, b, i / n), p1 = mid(a, b, (i + 1) / n);
      out.push(`<line x1="${p0[0].toFixed(1)}" y1="${p0[1].toFixed(1)}" x2="${p1[0].toFixed(1)}" y2="${p1[1].toFixed(1)}" stroke="${colored ? STRIPES[i] : '#24262C'}" stroke-width="${w}"/>`);
    }
    return `<g>${out.join('')}</g>`;
  };
  // точки фигуры: плечо → локоть → кисть, бедро → колено → стопа (стопы подняты к небу, поэтому голени коротки)
  const L = { sh: [80, 72], el: [40, 66], hd: [28, 28], hip: [86, 134], kn: [58, 174], ft: [54, 202] };
  const R = { sh: [120, 72], el: [160, 66], hd: [172, 28], hip: [114, 134], kn: [142, 174], ft: [146, 202] };
  const limbs = s => seg(s.sh, s.el, 19) + seg(s.el, s.hd, 17) + seg(s.hip, s.kn, 21) + seg(s.kn, s.ft, 19)
    // складки у локтя и колена
    + `<circle cx="${s.el[0]}" cy="${s.el[1]}" r="7" fill="#fff" opacity=".06"/><circle cx="${s.kn[0]}" cy="${s.kn[1]}" r="8" fill="#fff" opacity=".06"/>`
    // перчатка с пальцами и ботинок
    + `<circle cx="${s.hd[0]}" cy="${s.hd[1]}" r="10.5" fill="${dark}"/><path d="M${s.hd[0] - 5} ${s.hd[1] - 7}l1 -5M${s.hd[0]} ${s.hd[1] - 8}l0 -6M${s.hd[0] + 5} ${s.hd[1] - 7}l-1 -5" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`
    + `<ellipse cx="${s.ft[0]}" cy="${s.ft[1] + 3}" rx="10" ry="12" fill="${dark}"/><ellipse cx="${s.ft[0]}" cy="${s.ft[1] + 1}" rx="7" ry="8" fill="#fff" opacity=".07"/>`;
  const grips = s => grip(mid(s.sh, s.el, .24), mid(s.sh, s.el, .86), 11) + grip(mid(s.hip, s.kn, .22), mid(s.hip, s.kn, .84), 12);
  // ножные обхваты подвески
  const legStrap = s => seg(mid(s.hip, s.kn, .04), mid(s.hip, s.kn, .14), 23, strap);
  return `<svg viewBox="0 0 200 222" aria-hidden="true">
    <defs>
      <linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="40" y1="30" x2="170" y2="210"><stop offset="0" stop-color="#2C2F37"/><stop offset=".55" stop-color="#1A1C21"/><stop offset="1" stop-color="#101114"/></linearGradient>
      <radialGradient id="${id}h" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#4A4E58"/><stop offset=".6" stop-color="#1C1E24"/><stop offset="1" stop-color="#0B0C0F"/></radialGradient>
      <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262930"/><stop offset="1" stop-color="#15171B"/></linearGradient>
    </defs>
    ${limbs(L)}${limbs(R)}
    <path d="M72 64Q100 52 128 64L124 142Q100 152 76 142Z" fill="${suit}"/>
    <path d="M100 66v76" stroke="${seam}" stroke-width="2" stroke-linecap="round"/>
    ${legStrap(L)}${legStrap(R)}
    <path d="M84 78L78 66M116 78L122 66" stroke="${strap}" stroke-width="7" stroke-linecap="round"/>
    <rect x="83" y="76" width="34" height="60" rx="11" fill="url(#${id}r)" stroke="${strap}" stroke-width="2"/>
    <path d="M100 80v52M86 104h28" stroke="#0B0C0F" stroke-width="1.6" opacity=".8"/>
    <rect x="88" y="123" width="24" height="10" rx="4" fill="#15171B" stroke="${strap}" stroke-width="1.5"/>
    <circle cx="80" cy="79" r="3.2" fill="${metal}"/><circle cx="120" cy="79" r="3.2" fill="${metal}"/>
    <circle cx="100" cy="40" r="20" fill="url(#${id}h)"/>
    <path d="M83 33q17 -10 34 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".18"/>
    <path d="M82 46q18 8 36 0" fill="none" stroke="#0B0C0F" stroke-width="3" stroke-linecap="round"/>
    ${grips(L)}${grips(R)}
  </svg>`;
}
// облака — из шума: слой дальних и слой ближних, каждый своей картинкой, чтобы двигаться без пересчета
function cloudsSVG(id, freq, seed, cut){
  return `<svg class="su-cl ${id}" viewBox="0 0 3200 800" preserveAspectRatio="none" aria-hidden="true">
    <filter id="${id}f" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="5" seed="${seed}"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${cut[0]} ${cut[1]}"/>
      <feGaussianBlur stdDeviation="2.5"/>
    </filter>
    <rect width="3200" height="800" filter="url(#${id}f)"/>
  </svg>`;
}
function skyHTML(c){
  const names = c.names || [];
  return `<div class="su-sky-box">
    <div class="su-sky">
      ${cloudsSVG('su-cl-far', '0.0016 0.0045', 11, [12, -6.6])}
      ${cloudsSVG('su-cl-near', '0.0024 0.0062', 4, [16, -8.9])}
      <div class="su-sun"></div><div class="su-haze"></div>
      <div class="su-fly" style="--x:30%"><div class="su-bob">${diverSVG(false)}</div></div>
      <div class="su-fly rev" style="--x:70%"><div class="su-bob">${diverSVG(true)}</div></div>
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
