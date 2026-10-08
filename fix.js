/* ================================================================
   КЕЙС «ИСПРАВЛЯТОР» (поле fix у проекта)
   Главы почти без слов — иконки и простые фигуры:
   crowd — толпа на ивенте, видоискатель фотографа ходит по людям,
   вспышка; вы — с краю, блестите и моргаете ровно на вспышке, под
   сценой копятся кадры, в последнем вас разрезало краем кадра;
   pay — карта к телефону с приложением-лицом, оплата не проходит,
   то же лицо зажигается на ноутбуке; fix — настоящие фото до и после,
   шторка ходит сама, пока ее не тронули; power — ползунок силы
   нейросети: блеск уходит, потом прическа и макияж, на краю
   дорисованного — шов, кисть обходит его, на максимуме — другой
   человек (знак «≠» рядом с вами настоящей); where — ноутбук без сети
   и окно браузера с облаком, справа под текстом — кнопка демо.
   Тексты — в content.js, оформление — fix.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

/* ---------- лицо: одно на весь кейс, состояния — классами ----------
   data-hair: messy (растрепано), neat (пучок), other (чужие длинные волосы);
   классы: wet — блеск и капли пота, blink — глаза закрыты, mk — макияж */
// растрепанные волосы: лохматая шапка и несколько коротких прядей наружу
const MESSY = 'M27 56C22 46 23 37 28 32C26 25 32 19 37 22C37 14 46 11 49 17C53 10 63 12 63 19C69 16 76 22 73 29C79 33 79 42 75 47C77 51 75 55 72 57C70 47 64 41 58 39C53 42 46 41 42 39C36 41 31 47 29 57Z';
const STRANDS = ['M37 22C33 16 28 15 25 18', 'M63 19C66 12 72 11 75 14', 'M75 47C81 49 82 55 80 59', 'M27 50C21 52 20 58 22 63', 'M49 17C48 11 51 8 54 6', 'M30 31C24 29 21 32 21 36'];
const DROP = 'M0-4C1.8-1 2.4.6 2.4 1.4A2.4 2.4 0 0 1-2.4 1.4C-2.4.6-1.8-1 0-4Z';
// attrs — положение, когда лицо вложено в большую сцену: x, y, width, height, свой viewBox
function faceSVG(state = 'messy wet', cls = '', attrs = 'viewBox="0 0 100 100"'){
  const hair = /neat|other/.exec(state)?.[0] || 'messy';
  const flags = state.replace(/messy|neat|other/, '').trim();
  return `<svg class="fx-face ${flags} ${cls}" data-hair="${hair}" ${attrs} aria-hidden="true">
    <path class="fx-oth" d="M25 56C23 31 36 20 50 20S77 31 75 56L80 100H63L65 58H35L37 100H20Z" fill="var(--fx-hair2)"/>
    <rect x="44" y="70" width="12" height="14" fill="var(--fx-skin2)"/>
    <path d="M13 100C15 85 32 79 50 79S85 85 87 100V160H13Z" fill="var(--fx-top)"/>
    <g class="fx-head"><ellipse cx="50" cy="54" rx="21" ry="25" fill="var(--fx-skin)"/></g>
    <g class="fx-eyes"><circle cx="42" cy="55" r="2.5"/><circle cx="58" cy="55" r="2.5"/></g>
    <g class="fx-shut"><path d="M38.5 55Q42 57.6 45.5 55M54.5 55Q58 57.6 61.5 55"/></g>
    <g class="fx-blush"><circle cx="37" cy="63" r="4.2"/><circle cx="63" cy="63" r="4.2"/></g>
    <g class="fx-wet"><ellipse cx="50" cy="40" rx="6.5" ry="2.2"/><ellipse cx="37.5" cy="61" rx="3.2" ry="1.6"/><ellipse cx="62.5" cy="61" rx="3.2" ry="1.6"/><ellipse cx="50" cy="60" rx="1.3" ry="2.6"/>
      <path class="d" transform="translate(69 45)" d="${DROP}"/><path class="d" transform="translate(31 49)" d="${DROP}"/><path class="d" transform="translate(57 36)" d="${DROP}"/></g>
    <path class="fx-mouth" d="M45 68Q50 70.5 55 68"/>
    <path class="fx-lips" d="M44.5 67.6Q47.5 65.6 50 66.9Q52.5 65.6 55.5 67.6Q50 72.6 44.5 67.6Z"/>
    <path class="fx-cap" d="M29 51C28 33 38 25 50 25S72 33 71 51C66 41 58 36 50 37C43 37 35 40 29 51Z" fill="var(--fx-hair)"/>
    <g class="fx-messy"><path class="cap" d="${MESSY}"/>${STRANDS.map(d => `<path d="${d}"/>`).join('')}</g>
    <circle class="fx-bun" cx="50" cy="20" r="9.5" fill="var(--fx-hair)"/>
    <path class="fx-fringe" d="M28 49C29 31 43 24 56 26C67 28 73 37 72 50C65 39 55 34 45 40C38 44 33 46 28 49Z" fill="var(--fx-hair2)"/>
  </svg>`;
}

/* ---------- заголовок главы: слова поднимаются из-под строки ---------- */
function splitWords(el){
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  let n = 0;
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/([ \t\n]+)/).forEach(part => {
      if (!part) return;
      if (/^[ \t\n]+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement('span'); w.className = 'fx-w';
      const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--i', n++);
      w.append(i); frag.append(w);
    });
    node.replaceWith(frag);
  });
}
const head = ch => `<div class="fx-head-t">
  <span class="case-label fx-label">${H.T(ch.label)}</span>
  <h2 class="fx-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="fx-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const side = (ch, t) => `<div class="fx-side">
  <span class="case-label fx-label">${H.T(ch.label)}</span>
  <h2 class="fx-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="fx-text">${H.T(ch.text)}</p>` : ''}
  ${t ? `<div class="fx-try">
    <h3 class="fx-try-title">${H.T(t.title)}</h3>
    <p class="fx-try-text">${H.T(t.text)}</p>
    <a class="btn btn-accent fx-try-btn" href="${esc(t.link)}" target="_blank" rel="noopener">${H.T(t.btn)}</a>
  </div>` : ''}
</div>`;

/* ================================================================
   crowd — видоискатель ходит по толпе, вы с краю
   ================================================================ */
// люди: x, y — левый верх фигуры, s — масштаб; задний ряд светлее
const BACK = [[-10, 40, 1.3], [105, 30, 1.3], [215, 44, 1.3], [325, 34, 1.3], [430, 42, 1.3]];
const FRONT = [[-50, 92, 1.75], [100, 100, 1.75], [255, 88, 1.75], [395, 104, 1.75]];
const YOU = [528, 86, 1.75];
// кадры фотографа: левый верх видоискателя 4 : 3; последний задевает вас краем
const SHOTS = [[24, 34], [196, 26], [376, 44]];
const VF = [260, 195];
const person = ([x, y, s], row) => `<g class="fx-p ${row}" transform="translate(${x} ${y}) scale(${s})">
  <path d="M13 100C15 85 32 79 50 79S85 85 87 100V220H13Z" class="b"/>
  <rect x="44" y="70" width="12" height="14" class="n"/>
  <ellipse cx="50" cy="54" rx="20" ry="24" class="h"/>
  <path d="M30 50C29 33 38 26 50 26S71 33 70 50C65 41 58 37 50 38C43 38 35 41 30 50Z" class="c"/>
</g>`;
const corners = (w, h, k = 22) => `<path d="M0 ${k}V0H${k}M${w - k} 0H${w}V${k}M${w} ${h - k}V${h}H${w - k}M${k} ${h}H0V${h - k}"/>`;
function crowdHTML(){
  const [x, y, s] = YOU;
  return `<div class="fx-stage fx-crowd">
    <svg class="fx-scene" viewBox="0 0 640 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g class="fx-people">
        ${BACK.map(p => person(p, 'bk')).join('')}
        ${FRONT.slice(0, 3).map(p => person(p, 'fr')).join('')}
        ${faceSVG('messy wet', 'fx-you', `x="${x}" y="${y}" width="${100 * s}" height="${100 * s}" viewBox="0 0 100 100" overflow="visible"`)}
        ${person(FRONT[3], 'fr')}
      </g>
      <g class="fx-vf" style="transform:translate(${SHOTS[0][0]}px,${SHOTS[0][1]}px)">${corners(...VF)}<circle cx="${VF[0] / 2}" cy="${VF[1] / 2}" r="7"/></g>
      <rect class="fx-flash" x="0" y="0" width="640" height="280"/>
    </svg>
    <div class="fx-roll">${SHOTS.map(() => `<div class="fx-shot"></div>`).join('')}</div>
  </div>`;
}
function liveCrowd(box){
  const scene = box.querySelector('.fx-scene');
  const people = box.querySelector('.fx-people');
  const you = box.querySelector('.fx-you');
  const vf = box.querySelector('.fx-vf');
  const cells = [...box.querySelectorAll('.fx-shot')];
  const stage = box.querySelector('.fx-crowd');
  // снимок: копия толпы в окне видоискателя — в миниатюре ровно то, что попало в кадр
  const snap = (k, [sx, sy]) => {
    const svg = `<svg viewBox="${sx} ${sy} ${VF[0]} ${VF[1]}" preserveAspectRatio="xMidYMid slice">${people.outerHTML}</svg>`;
    cells[k].innerHTML = svg;
    cells[k].classList.add('on');
  };
  const goTo = ([sx, sy]) => { vf.style.transform = `translate(${sx}px,${sy}px)`; };
  if (still()) { you.classList.add('blink'); SHOTS.forEach((p, k) => snap(k, p)); stage.classList.add('done'); return; }
  let on = false, busy = false;
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      cells.forEach(c => { c.classList.remove('on'); });
      stage.classList.remove('done');
      for (let k = 0; k < SHOTS.length && on; k++) {
        goTo(SHOTS[k]); await wait(1100);
        // вы моргаете ровно на вспышке
        you.classList.add('blink'); await wait(90);
        scene.classList.remove('flash'); void scene.getBoundingClientRect(); scene.classList.add('flash');
        snap(k, SHOTS[k]); await wait(260);
        you.classList.remove('blink'); await wait(500);
      }
      if (!on) break;
      // в последнем кадре — вы: разрезаны краем и с закрытыми глазами
      stage.classList.add('done'); await wait(3200);
      goTo(SHOTS[0]); await wait(600);
    }
    busy = false;
  };
  onScreen(box.querySelector('.fx-crowd'), v => { on = v; if (on) loop(); }, .35);
}

/* ================================================================
   pay — оплата не проходит, приложение переезжает на ноутбук
   ================================================================ */
const APP = (x, y, s, cls) => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})">
  <rect width="60" height="60" rx="16" class="ic"/>
  <circle cx="30" cy="30" r="16" class="gf"/><circle cx="24.5" cy="27.5" r="2.2" class="ey"/><circle cx="35.5" cy="27.5" r="2.2" class="ey"/>
  <path d="M23.5 34.5Q30 40 36.5 34.5" class="sm"/>
</g>`;
function payHTML(){
  return `<div class="fx-stage fx-pay" data-step="0">
    <svg viewBox="0 0 640 300" aria-hidden="true">
      <g class="fx-phone">
        <rect x="80" y="22" width="140" height="256" rx="24" class="dev"/>
        <rect x="88" y="30" width="124" height="240" rx="17" class="scr"/>
        ${APP(120, 72, 1, 'fx-app')}
        <rect x="102" y="196" width="96" height="36" rx="18" class="paybtn"/>
        <rect x="134" y="206" width="32" height="20" rx="4" class="paycard"/>
      </g>
      <g class="fx-card"><g class="in">
        <rect width="104" height="66" rx="10" class="cd"/><rect x="14" y="20" width="18" height="14" rx="3" class="chip"/><rect x="14" y="46" width="52" height="6" rx="3" class="ln"/>
      </g></g>
      <g class="fx-no"><circle cx="0" cy="0" r="20"/><path d="M-7-7L7 7M7-7L-7 7"/></g>
      <path class="fx-path" d="M232 150C290 150 300 130 336 130" pathLength="100"/>
      <g class="fx-laptop">
        <rect x="352" y="56" width="236" height="156" rx="12" class="dev"/>
        <rect x="361" y="65" width="218" height="138" rx="5" class="scr"/>
        <path d="M330 220H610L596 236H344Z" class="dev"/>
        ${APP(440, 104, 1, 'fx-app fx-mine')}
        <g transform="translate(512 98)"><g class="fx-spark"><path d="M0-11C1.4-3 3-1.4 11 0C3 1.4 1.4 3 0 11C-1.4 3-3 1.4-11 0C-3-1.4-1.4-3 0-11Z"/></g></g>
        <g transform="translate(546 180)"><g class="fx-ok"><circle r="17"/><path d="M-7 0.5L-2 5.5L7.5-5"/></g></g>
      </g>
    </svg>
  </div>`;
}
function livePay(box){
  const st = box.querySelector('.fx-pay');
  if (still()) { st.dataset.step = 4; return; }
  let on = false, busy = false;
  // 1 — карта едет к телефону; 2 — оплата не прошла; 3 — телефон гаснет, путь к ноутбуку; 4 — свое приложение
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      st.dataset.step = 0; await wait(700); if (!on) break;
      st.dataset.step = 1; await wait(1300); if (!on) break;
      st.dataset.step = 2; await wait(1500); if (!on) break;
      st.dataset.step = 3; await wait(1100); if (!on) break;
      st.dataset.step = 4; await wait(3200);
    }
    busy = false;
  };
  onScreen(st, v => { on = v; if (on) loop(); }, .35);
}

/* ================================================================
   fix — настоящие фото до и после, шторка
   ================================================================ */
function fixHTML(c){
  const [a, b] = H.pick(c.pair);
  return `<div class="fx-cmp" style="aspect-ratio:${c.w} / ${c.h};--x:50%" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="${esc(a)} / ${esc(b)}">
    <img class="fx-cmp-b" src="${esc(c.after)}" width="${c.w}" height="${c.h}" alt="" loading="lazy" decoding="async">
    <div class="fx-cmp-a"><img src="${esc(c.before)}" width="${c.w}" height="${c.h}" alt="" loading="lazy" decoding="async"></div>
    <span class="fx-tag l">${H.T(a)}</span><span class="fx-tag r">${H.T(b)}</span>
    <div class="fx-cmp-line" aria-hidden="true"><span class="fx-cmp-knob"><svg viewBox="0 0 24 24"><path d="M9 7L4 12L9 17M15 7L20 12L15 17"/></svg></span></div>
  </div>`;
}
function liveFix(box){
  const cmp = box.querySelector('.fx-cmp');
  let x = 50, touched = false, on = false, raf = 0, t0 = 0;
  const set = v => { x = Math.max(0, Math.min(100, v)); cmp.style.setProperty('--x', x + '%'); cmp.setAttribute('aria-valuenow', Math.round(x)); };
  // шторка ходит сама: показывает то одно, то другое, задерживаясь у краев
  const tick = now => {
    if (!on || touched) { raf = 0; return; }
    if (!t0) t0 = now;
    const ph = ((now - t0) / 7000) % 1;
    const k = .5 - .5 * Math.cos(ph * Math.PI * 2);
    set(14 + 72 * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));
    raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!raf && on && !touched && !still()) raf = requestAnimationFrame(tick); };
  const at = e => { const r = cmp.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
  let drag = false;
  cmp.addEventListener('pointerdown', e => { touched = true; drag = true; cmp.setPointerCapture(e.pointerId); at(e); });
  cmp.addEventListener('pointermove', e => { if (drag || e.pointerType === 'mouse') { touched = true; at(e); } });
  cmp.addEventListener('pointerup', () => { drag = false; });
  cmp.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { touched = true; set(x + (e.key === 'ArrowLeft' ? -5 : 5)); e.preventDefault(); }
  });
  onScreen(cmp, v => { on = v; go(); }, .3);
}

/* ================================================================
   power — сила нейросети, шов на краю и кисть
   ================================================================ */
// шов — неровное кольцо вокруг дорисованной области (прически); начинается сверху и идет по часовой
function seamPath(cx, cy, r, n = 120){
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + i / n * Math.PI * 2;
    const rr = r + (i % 2 ? 2.5 : -2.5);
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return d;
}
const ICON = {
  // блеск: капля
  shine: '<path d="M12 3C15 8 18 11 18 15A6 6 0 0 1 6 15C6 11 9 8 12 3Z"/><path d="M9.5 15.5A2.5 2.5 0 0 0 12 18"/>',
  // прическа и макияж: расческа
  hair: '<rect x="3" y="5" width="18" height="5" rx="2"/><path d="M6 10V19M9 10V19M12 10V19M15 10V19M18 10V19"/>',
  // другой человек: два профиля
  other: '<circle cx="8.5" cy="9" r="3.5"/><circle cx="16" cy="9" r="3.5"/><path d="M2.5 20C3 16 5.5 14.5 8.5 14.5S14 16 14.5 20M13.5 15C14.3 14.7 15.1 14.5 16 14.5C19 14.5 21 16 21.5 20"/>',
};
const MARKS = [['shine', 22], ['hair', 58], ['other', 100]];
function powerHTML(){
  return `<div class="fx-stage fx-power" data-lvl="0">
    <svg class="fx-pw" viewBox="0 0 600 320" aria-hidden="true">
      ${faceSVG('messy wet', 'fx-big', 'x="135" y="10" width="300" height="300" viewBox="0 0 100 100" overflow="visible"')}
      <path class="fx-seam" d="${seamPath(285, 132, 96)}" pathLength="100"/>
      <g class="fx-brush"><g transform="rotate(35)"><rect x="-5" y="-38" width="10" height="26" rx="3" class="hd"/><path d="M-7-12H7V0C7 6 3 10 0 12C-3 10-7 6-7 0Z" class="br"/></g></g>
      <g class="fx-ref" transform="translate(510 150)">
        <circle r="46" class="bg"/>
        ${faceSVG('messy', 'fx-mini', 'x="-40" y="-40" width="80" height="80" viewBox="0 0 100 100"')}
      </g>
      <g class="fx-eq" transform="translate(432 150)"><path d="M-14-6H14M-14 6H14"/><path class="no" d="M8-16L-8 16"/></g>
    </svg>
    <div class="fx-slider" aria-hidden="true">
      <div class="fx-track"><i class="fx-fill"></i><i class="fx-knob"></i></div>
      <div class="fx-marks">${MARKS.map(([k, v]) => `<span class="fx-mark" data-k="${k}" style="left:${v}%"><svg viewBox="0 0 24 24">${ICON[k]}</svg></span>`).join('')}</div>
    </div>
  </div>`;
}
function livePower(box){
  const st = box.querySelector('.fx-power');
  const big = box.querySelector('.fx-big');
  const seam = box.querySelector('.fx-seam');
  const brush = box.querySelector('.fx-brush');
  const fill = box.querySelector('.fx-fill'), knob = box.querySelector('.fx-knob');
  const marks = [...box.querySelectorAll('.fx-mark')];
  let v = 0;
  // лицо по силе: блеск уходит с 20, прическа и макияж — с 55, с 90 — уже другой человек
  const paint = () => {
    fill.style.width = v + '%'; knob.style.left = v + '%';
    big.classList.toggle('wet', v < 20);
    big.classList.toggle('mk', v >= 55 && v < 90);
    big.dataset.hair = v >= 90 ? 'other' : v >= 55 ? 'neat' : 'messy';
    st.classList.toggle('other', v >= 90);
    marks.forEach((m, i) => m.classList.toggle('on', v >= MARKS[i][1] - 2));
  };
  const slide = (to, ms) => new Promise(res => {
    const from = v, t0 = performance.now();
    const f = now => {
      const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      v = from + (to - from) * e; paint();
      if (k < 1) requestAnimationFrame(f); else res();
    };
    requestAnimationFrame(f);
  });
  // кисть идет по шву, и шов стирается за ней
  const L = seam.getTotalLength();
  const sweep = ms => new Promise(res => {
    const t0 = performance.now();
    st.classList.add('brushing');
    const f = now => {
      const k = Math.min(1, (now - t0) / ms);
      const p = seam.getPointAtLength(k * L);
      brush.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      seam.style.strokeDashoffset = -k * 100;
      if (k < 1) requestAnimationFrame(f); else { st.classList.remove('brushing'); res(); }
    };
    requestAnimationFrame(f);
  });
  if (still()) { v = 58; paint(); return; }
  paint();
  let on = false, busy = false;
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      seam.style.strokeDashoffset = 0; st.classList.remove('seam');
      await wait(900); if (!on) break;
      await slide(22, 1100); await wait(1100); if (!on) break;
      await slide(58, 1200);
      // на стыке нового и старого — шов
      st.classList.add('seam'); await wait(900); if (!on) break;
      await sweep(2200); st.classList.remove('seam'); await wait(1200); if (!on) break;
      await slide(100, 1100); await wait(2200); if (!on) break;
      await slide(0, 1300);
    }
    busy = false;
  };
  onScreen(st, on_ => { on = on_; if (on) loop(); }, .35);
}

/* ================================================================
   where — ноутбук без сети и браузер с облаком, демо
   ================================================================ */
const PHOTO = cls => `<g class="${cls}"><rect x="-22" y="-28" width="44" height="56" rx="6" class="ph"/>
  ${faceSVG('messy wet', '', 'x="-18" y="-24" width="36" height="48" viewBox="12 10 76 100" preserveAspectRatio="xMidYMid slice"')}</g>`;
function whereHTML(){
  return `<div class="fx-stage fx-where" data-step="0">
    <svg viewBox="0 0 640 340" aria-hidden="true">
      <g class="fx-local">
        <rect x="44" y="120" width="236" height="150" rx="12" class="dev"/>
        <rect x="53" y="129" width="218" height="132" rx="5" class="scr"/>
        <path d="M22 278H302L288 294H36Z" class="dev"/>
        <g class="fx-nonet" transform="translate(162 64)"><path d="M-30-6A44 44 0 0 1 30-6M-20 6A28 28 0 0 1 20 6M-10 18A13 13 0 0 1 10 18"/><circle cy="28" r="3.5" class="dot"/><path class="x" d="M-28-22L28 34"/></g>
        <g class="fx-lock" transform="translate(246 252)"><circle r="20" class="bg"/><rect x="-9" y="-3" width="18" height="14" rx="3"/><path d="M-5.5-3V-8A5.5 5.5 0 0 1 5.5-8V-3"/></g>
      </g>
      <g class="fx-online">
        <rect x="360" y="150" width="236" height="150" rx="12" class="win"/>
        <path d="M360 162A12 12 0 0 1 372 150H584A12 12 0 0 1 596 162V178H360Z" class="bar"/>
        <circle cx="378" cy="164" r="4" class="dt"/><circle cx="392" cy="164" r="4" class="dt"/><circle cx="406" cy="164" r="4" class="dt"/>
        <g class="fx-cloud" transform="translate(478 62)"><path d="M-52 22H50A24 24 0 0 0 46-24A34 34 0 0 0-18-30A26 26 0 0 0-52 22Z"/><text y="9" text-anchor="middle">SD 1.5</text></g>
        <path class="fx-up" d="M478 150V96" pathLength="100"/>
      </g>
      ${PHOTO('fx-ph fx-ph-l')}
      ${PHOTO('fx-ph fx-ph-r')}
    </svg>
  </div>`;
}
function liveWhere(box){
  const st = box.querySelector('.fx-where');
  if (still()) { st.dataset.step = 5; return; }
  let on = false, busy = false;
  // 1 — фото входит в ноутбук и правится там же; 2 — держим; 3 — фото в окне браузера; 4 — летит в облако; 5 — возвращается исправленным
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      st.dataset.step = 0; await wait(600); if (!on) break;
      st.dataset.step = 1; await wait(1700); if (!on) break;
      st.dataset.step = 2; await wait(900); if (!on) break;
      st.dataset.step = 3; await wait(1100); if (!on) break;
      st.dataset.step = 4; await wait(1400); if (!on) break;
      st.dataset.step = 5; await wait(2800);
    }
    busy = false;
  };
  onScreen(st, v => { on = v; if (on) loop(); }, .35);
}

/* ---------- запуск ---------- */
const CHAPTERS = [
  ['crowd', crowdHTML, liveCrowd],
  ['pay', payHTML, livePay],
  ['fix', fixHTML, liveFix],
  ['power', powerHTML, livePower],
  ['where', whereHTML, liveWhere],
];

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
  // до и после, сила нейросети и «где работает» — картинка слева, текст справа; остальные — заголовок над сценой
  const SPLIT = { fix: 1, power: 1, where: 1 };
  mount.innerHTML = CHAPTERS.filter(([k]) => f[k]).map(([k, html]) => SPLIT[k]
    ? `<section class="fx-ch wrap fx-${k}-ch fx-split"><div class="fx-viz">${html(f[k])}</div>${side(f[k], k === 'where' ? f.try : null)}</section>`
    : `<section class="fx-ch wrap fx-${k}-ch">${head(f[k])}<div class="fx-viz">${html(f[k])}</div></section>`).join('');
  mount.querySelectorAll('.fx-title').forEach(splitWords);
  mount.querySelectorAll('.fx-ch').forEach(s => reveal.observe(s));
  CHAPTERS.filter(([k]) => f[k]).forEach(([k, , live]) => live(mount.querySelector(`.fx-${k}-ch`), f[k]));
}
