/* Кейс «айдентика Воскресенска» (поле vosk): в шапке вместо картинки — знак с обложки сообщества (слайд 11 презентации)
   собирается живьем: сетка построения прорисовывается от центра, орбиты обводятся, ядро с буквой В вырастает,
   электроны калия вылетают из ядра на свои места, по бокам загораются еще два ядра — всего три круга, как нимбы на «Троице».
   Желтый заменен золотом (градиент, по нему иногда проходит блик). Буква В — та же, что в презентации (с окнами храма),
   перерисована вектором по иконке и стоит ровно по центру круга: в иконке она съезжала вправо (LETTER — центр в нуле, высота 70) */
// золото рисует шейдер (goldShader ниже): мятая фольга, блики и отражения, свет — от курсора и наклона телефона
// (просьба 13.11: «не градиент и не старое коричневое — шейдер»). В SVG у золотых кругов data-gold и запасная заливка
const FOIL_DEF = id => `<linearGradient id="${id}"><stop stop-color="#EBC145"/></linearGradient>`;
// фирменный желтый значка и иконки В — без золота (просьба 13.11)
const YELLOW = '#F5D000';
const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'vosk.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);
  });
  return cssReady;
}

// геометрия — по обложке сообщества (2400 × 600, центр знака — начало координат)
const STEP = 150;                                   // шаг сетки
const ORBITS = [120, 180, 240, 300, 390, 480];      // радиусы орбит; на последней стоят боковые ядра
const LETTER = 'M-28.16 -34.88 L2.32 -35.00 C7.88 -34.54 12.52 -32.80 15.41 -30.48 C18.31 -27.58 19.70 -23.53 19.70 -19.47 C19.70 -13.10 16.23 -7.88 11.13 -5.10 L15.76 -3.82 C23.18 -0.70 28.16 6.03 28.16 15.53 C28.16 28.63 18.08 35.00 3.01 35.00 L-28.16 35.00 L-28.16 32.45 C-26.19 31.99 -24.57 30.36 -24.34 26.89 L-24.34 -27.00 C-24.57 -30.13 -25.96 -31.99 -28.16 -32.33 Z M-4.98 -6.84 L-4.98 -21.67 A3.59 3.59 0 0 1 2.20 -21.67 L2.20 -6.84 Z M-4.98 22.14 L-4.98 7.65 A5.39 5.39 0 0 1 5.79 7.65 L5.79 22.14 Z';
const CORE = 72, SIDE = 36, DOT = 15;               // радиусы ядер и электронов
// 19 электронов калия: сверху четыре, снизу три, по два слева и справа, по два на каждой диагонали
const DOTS = [
  [0, -120], [0, -180], [0, -240], [0, -300], [0, 120], [0, 180], [0, 240],
  [-180, 0], [-240, 0], [180, 0], [240, 0],
  [-120, -135], [-180, -160], [120, -135], [180, -160],
  [-120, 135], [-180, 160], [120, 135], [180, 160],
];

function svgHTML(id){
  const g = `url(#${id}-gold)`;
  const lines = [];
  for (let k = -16; k <= 16; k++) lines.push(`<line class="v" x1="${k * STEP}" y1="-1200" x2="${k * STEP}" y2="1200" style="--d:${Math.abs(k) * 0.05}s"/>`);
  for (let k = -8; k <= 8; k++) lines.push(`<line class="h" x1="-2600" y1="${k * STEP}" x2="2600" y2="${k * STEP}" style="--d:${Math.abs(k) * 0.07}s"/>`);
  // электроны — по радиусу, внутри орбиты по часовой стрелке от верха
  const dots = DOTS.map(([x, y]) => ({ x, y, r: Math.hypot(x, y), a: (Math.atan2(x, -y) + 2 * Math.PI) % (2 * Math.PI) }))
    .sort((a, b) => Math.round(a.r / 30) - Math.round(b.r / 30) || a.a - b.a);
  return `<svg class="vo-mark" role="img" aria-label="Знак Воскресенска: буква В в золотом круге — ядро атома калия, вокруг электроны, по бокам еще два ядра">
    <defs>
      ${FOIL_DEF(id + '-gold')}
    </defs>
    <g class="vo-grid">${lines.join('')}</g>
    <g class="vo-orbits">${ORBITS.map((r, i) => `<circle r="${r}" pathLength="1" transform="rotate(-90)" style="--d:${0.35 + i * 0.16}s"/>`).join('')}</g>
    <g class="vo-dots">${dots.map((d, i) => `<g style="--x:${-d.x}px;--y:${-d.y}px;--d:${1.25 + i * 0.07}s" transform="translate(${d.x} ${d.y})"><circle r="${DOT}"/></g>`).join('')}</g>
    <g class="vo-side vo-l" transform="translate(${-ORBITS[5]} 0)"><circle class="vo-ring" r="${SIDE}"/><circle r="${SIDE}" fill="${g}" data-gold/></g>
    <g class="vo-side vo-r" transform="translate(${ORBITS[5]} 0)"><circle class="vo-ring" r="${SIDE}"/><circle r="${SIDE}" fill="${g}" data-gold/></g>
    <g class="vo-core"><circle r="${CORE}" fill="${g}" data-gold data-ls="${1 / CORE}" data-lt=".035" data-ly="-.03"/><path class="vo-letter" fill-rule="evenodd" d="${LETTER}"/></g>
  </svg>`;
}

// кадр: на широком экране — полоса, как обложка; на узком — квадратнее, но атом и боковые ядра целиком
function fit(svg){
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const k = r.width / r.height;
  let w, h;
  if (k >= 1120 / 760) { h = 760; w = h * k; } else { w = 1120; h = w / k; }
  svg.setAttribute('viewBox', `${-w / 2} ${-h / 2} ${w} ${h}`);
  // единиц SVG в одном пикселе: контур электронов держим в 1,2 px, как линии сетки и орбит (у них non-scaling-stroke;
  // на точках он ломается вместе с CSS-трансформацией — контур пропадал)
  svg.style.setProperty('--u', (w / r.width).toFixed(3));
}

/* ---------- блоки с картинками: у каждой своя короткая подпись (просьба 13.11: меньше текста, больше иллюстраций) ----------
   { vosk: 'tiles', title, items: [{ draw: 'nucleus' | 'atoms' } | { img, pos, light }, cap] } — квадратные плитки в ряд;
   { vosk: 'cards', title, text, rows: [[{ img, ar, cap, light }]], credit } — ряды картинок в своих пропорциях (ar), подпись под каждой */
let H;
const tx = v => v == null ? '' : H.T(Array.isArray(v) ? H.pick(v) : v);
// формулы калия, азота и фосфора — точки сняты со слайда «Калий, азот, фосфор» презентации (центр — место ядра); ядро не рисуем
const FORMULAS = {
  K: [[0,-390],[0,-312],[0,-234],[-234,-207],[234,-207],[-156,-174],[156,-174],[0,-156],[-312,0],[-234,0],[234,0],[312,0],[0,156],[-156,174],[156,174],[-234,206],[234,206],[0,234],[0,312]],
  N: [[0,-390],[0,-312],[-312,-234],[312,-234],[-234,312],[0,312],[234,312]],
  P: [[0,-234],[-302,78],[302,78],[0,234]],
};
function formulaSVG(k, cx, cy, sc, i0){
  return `<circle class="vo-fbg" cx="${cx}" cy="${cy}" r="${(470 * sc).toFixed(1)}"/>` + FORMULAS[k].map(([x, y], j) => `<circle class="vo-e vo-ef" style="--d:${(i0 + j * 0.04).toFixed(2)}s" cx="${(cx + x * sc).toFixed(1)}" cy="${(cy + y * sc).toFixed(1)}" r="${(34 * sc).toFixed(1)}"/>`).join('');
}
const GOLD = () => `<defs>${FOIL_DEF('vo-tile-gold')}</defs>`;
const DRAW = {
  // круг из герба — ядро атома: золотой круг с буквой, вокруг орбита и электроны
  nucleus: () => `<svg viewBox="-100 -100 200 200" aria-hidden="true">${GOLD()}
    <g class="vo-spin"><circle class="vo-orb" r="66"/><circle class="vo-e" cx="0" cy="-66" r="7"/><circle class="vo-e" cx="0" cy="66" r="7"/>
    <circle class="vo-orb" r="86"/><circle class="vo-e" cx="-86" cy="0" r="7"/><circle class="vo-e" cx="86" cy="0" r="7"/><circle class="vo-e" cx="61" cy="-61" r="7"/><circle class="vo-e" cx="-61" cy="61" r="7"/></g>
    <circle r="42" fill="url(#vo-tile-gold)" data-gold data-ls="${.66 / 42}" data-lt="${2.5 / 42}" data-ly="-.02"/><path fill="#fff" fill-rule="evenodd" transform="translate(2.5 0) scale(.66)" d="${LETTER}"/></svg>`,
  // калий, азот, фосфор — три формулы удобрений в ряд, каждая в своем светлом круге; черные точки без контура, без ядра (просьба 13.11)
  atoms: () => `<svg viewBox="0 0 200 200" aria-hidden="true">${formulaSVG('K', 36, 100, .062, 0)}${formulaSVG('N', 100, 100, .062, .5)}${formulaSVG('P', 164, 100, .062, .8)}</svg>`,
};
function tilesHTML(b){
  return `${b.title ? `<h3 class="vo-title">${tx(b.title)}</h3>` : ''}${b.text ? `<p class="vo-text">${tx(b.text)}</p>` : ''}
    <div class="vo-tiles" style="--n:${b.items.length}">${b.items.map(it => `<figure class="vo-tile"><div class="vo-pic${it.light ? ' vo-light' : ''}${it.draw ? ' vo-draw' : ''}">${
      it.draw ? DRAW[it.draw]() : `<img src="${it.img}" srcset="${it.img.replace(/\.webp$/, '-s.webp')} 900w, ${it.img} 1600w" sizes="(max-width:760px) 46vw, 25vw" alt="" loading="lazy" style="object-position:${it.pos || 'center'}">`}</div><figcaption>${tx(it.cap)}</figcaption></figure>`).join('')}</div>`;
}
function cardsHTML(b){
  return `${b.title ? `<h3 class="vo-title">${tx(b.title)}</h3>` : ''}${b.text ? `<p class="vo-text">${tx(b.text)}</p>` : ''}
    ${b.rows.map(r => `<div class="vo-row">${r.map(it => `<figure class="vo-card" style="--ar:${it.ar || 1}"><button class="vo-pic${it.light ? ' vo-light' : ''}${it.pad ? ' vo-pad' : ''}" aria-label="Увеличить"><img src="${it.img}" srcset="${it.img.replace(/\.webp$/, '-s.webp')} 900w, ${it.img} 1600w" sizes="(max-width:760px) 92vw, 50vw" alt="" loading="lazy"></button>${it.cap ? `<figcaption>${tx(it.cap)}</figcaption>` : ''}</figure>`).join('')}</div>`).join('')}
    ${b.credit ? `<p class="vo-credit">${tx(b.credit)}</p>` : ''}`;
}

/* ---------- буква В: иконка, вкладка браузера, метка на карте (просьба 13.11: черная В, красная гладкая метка, не скриншот) ---------- */
const RED = '#C8232C';
const GOLD_DEF = id => `<defs>${FOIL_DEF(id)}</defs>`;
// значок-иконка: желтый круг и черная В (буква — половина круга, чуть правее центра — оптически)
const iconSVG = (id, size) => `<svg viewBox="-50 -50 100 100" width="${size}" height="${size}" aria-hidden="true"><circle r="50" fill="${YELLOW}"/><path fill="#141414" fill-rule="evenodd" transform="translate(1.6 0) scale(.66)" d="${LETTER}"/></svg>`;
let uid = 0;
function letterHTML(b){
  const g = () => 'vo-g' + (uid++);
  const sizes = [48, 32, 24, 16];
  return `${b.title ? `<h3 class="vo-title">${tx(b.title)}</h3>` : ''}
  <div class="vo-letter-grid">
    <figure class="vo-lt"><div class="vo-stage vo-stage-icon">${iconSVG(g(), 200)}</div><figcaption>${tx(b.caps[0])}</figcaption></figure>
    <figure class="vo-lt"><div class="vo-stage vo-stage-tab">
      <div class="vo-tabbar"><div class="vo-tab">${iconSVG(g(), 16)}<span>Воскресенск</span></div></div>
      <div class="vo-addr"></div>
      <div class="vo-sizes">${sizes.map((n, i) => `<div class="vo-size" style="--i:${i}">${iconSVG(g(), Math.round(n * 1.6))}<span>${n}</span></div>`).join('')}</div>
    </div><figcaption>${tx(b.caps[1])}</figcaption></figure>
    <figure class="vo-lt"><div class="vo-stage vo-stage-map">
      <svg class="vo-map" viewBox="0 0 300 300" aria-hidden="true">
        <path class="vo-river" d="M-10 238 C 60 212, 110 262, 170 236 S 270 196, 320 214"/>
        <path class="vo-park" d="M196 40 h70 a14 14 0 0 1 14 14 v46 a14 14 0 0 1 -14 14 h-70 a14 14 0 0 1 -14 -14 v-46 a14 14 0 0 1 14 -14z"/>
        <path class="vo-road" d="M-10 92 L310 128 M88 -10 L118 310 M-10 186 L310 168 M210 -10 C 190 90, 230 170, 310 260"/>
        <path class="vo-road vo-road-s" d="M40 -10 L52 310 M-10 40 L310 60 M160 -10 L176 310"/>
        <g class="vo-mini" style="--i:0" transform="translate(236 78)">${iconSVG(g(), 22).replace('<svg', '<svg x="-11" y="-11"')}</g>
        <g class="vo-mini" style="--i:1" transform="translate(56 206)">${iconSVG(g(), 22).replace('<svg', '<svg x="-11" y="-11"')}</g>
        <ellipse class="vo-pin-shadow" cx="122" cy="166" rx="16" ry="5"/>
        <circle class="vo-pin-pulse" cx="122" cy="166" r="10"/>
        <g class="vo-pin">
          <path d="M122 166 C 112 150, 94 136, 94 112 a28 28 0 0 1 56 0 C 150 136, 132 150, 122 166 Z" fill="${RED}"/>
          <g transform="translate(122 112)">${iconSVG(g(), 40).replace('<svg', '<svg x="-20" y="-20"')}</g>
        </g>
        <text class="vo-place" x="160" y="150">Главная площадь</text>
      </svg>
    </div><figcaption>${tx(b.caps[2])}</figcaption></figure>
  </div>`;
}

/* ---------- узоры: формулы собираются из ядра, узоры проступают волной, по ним время от времени бежит золотой блик ---------- */
function formulaBig(k){
  const pts = FORMULAS[k];
  return `<svg viewBox="-460 -460 920 920" aria-hidden="true">${GOLD_DEF('vo-pg-' + k)}${pts.map(([x, y], i) =>
    `<circle class="vo-fd" style="--x:${-x}px;--y:${-y}px;--d:${(0.25 + i * 0.05).toFixed(2)}s" cx="${x}" cy="${y}" r="30"/>`).join('')}
    <circle class="vo-fn" r="78" fill="url(#vo-pg-${k})" data-gold/></svg>`;
}
// узор: формула рядами со сдвигом, точки мельче, вместо ядра — пусто (как на слайдах)
// узор: формула рядами со сдвигом на все поле, без пустых углов (шаг свой у каждого элемента: у фосфора точек мало — ряды плотнее)
const PAT = { K: [820, .5], N: [660, .5], P: [560, .55] };
function patternSVG(k){
  const pts = FORMULAS[k], [step, sc] = PAT[k], vy = step * .6, W = 1800, out = [];
  for (let row = -1; row <= Math.ceil(W / vy) + 1; row++) for (let col = -1; col <= Math.ceil(W / step) + 1; col++) {
    const ox = col * step + (Math.abs(row) % 2 ? step / 2 : 0), oy = row * vy;
    pts.forEach(([x, y]) => {
      const cx = ox + x * sc, cy = oy + y * sc;
      if (cx < -40 || cx > W + 40 || cy < -40 || cy > W + 40) return;
      out.push(`<circle class="vo-pd" style="--t:${((cx + cy) / (2 * W)).toFixed(3)}" cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="18"/>`);
    });
  }
  return `<svg viewBox="0 0 ${W} ${W}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${out.join('')}</svg>`;
}
function patternsHTML(b){
  const ks = ['K', 'N', 'P'];
  return `${b.title ? `<h3 class="vo-title">${tx(b.title)}</h3>` : ''}${b.text ? `<p class="vo-text">${tx(b.text)}</p>` : ''}
  <div class="vo-pat-grid">${ks.map((k, i) => `<figure class="vo-pat" style="--i:${i}">
    <div class="vo-formula">${formulaBig(k)}</div><figcaption>${tx(b.caps[i])}</figcaption>
    <div class="vo-pattern">${patternSVG(k)}</div></figure>`).join('')}</div>`;
}

/* ---------- соцсети: живой телефон и карусель постов ----------
   Телефон: шапка сообщества и лента из четырех живых постов. Лента сама не едет (от дробной прокрутки дрожал текст) —
   о том, что ее можно листать, говорят анимированная подсказка рядом и ползунок прокрутки внутри экрана.
   Посты собраны из слоев (исходники/vosk-posts.py) и рисуются одним циклом requestAnimationFrame — все анимации зациклены:
   блины падают на тарелку по одному и их по одному забирают; сердце бьется, пробегает линия пульса (CSS);
   снег — формулы падают без остановки, каждая со своей скоростью; День города — пять залпов салюта вокруг ядер,
   а иконка в центре (буква В и ее 19 электронов) стоит на месте */
function coverSVG(){
  const dots = FORMULAS.K.map(([x, y]) => `<circle class="vo-cd" cx="${x * 0.16}" cy="${y * 0.16}" r="3.4"/>`).join('');
  let grid = '';
  for (let k = -6; k <= 6; k++) grid += `<line x1="${k * 30}" y1="-80" x2="${k * 30}" y2="80"/>`;
  for (let k = -2; k <= 2; k++) grid += `<line x1="-200" y1="${k * 30}" x2="200" y2="${k * 30}"/>`;
  // обложка — как на слайде: плоский фирменный желтый, без золота-шейдера (в телефоне он дрожал при прокрутке)
  return `<svg class="vo-cover" viewBox="-180 -56 360 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g class="vo-cgrid">${grid}</g><g class="vo-corb"><circle r="30"/><circle r="45"/><circle r="64"/><circle r="84"/></g>
    ${dots}<circle cx="-84" r="7" fill="${YELLOW}"/><circle cx="84" r="7" fill="${YELLOW}"/>
    <circle r="14" fill="${YELLOW}"/><path fill="#fff" fill-rule="evenodd" transform="translate(.5 -.3) scale(.19)" d="${LETTER}"/></svg>`;
}
const avatarSVG = s => `<svg viewBox="0 0 40 40" width="${s}" height="${s}" aria-hidden="true"><rect width="40" height="40" fill="${RED}"/><circle cx="20" cy="20" r="11" fill="${YELLOW}"/></svg>`;
const lyr = (src, cls) => `<img class="vo-ly ${cls}" src="${src}" alt="" loading="lazy">`;
const liveSVG = (x, cls, inner) => `<svg class="vo-ly ${cls}" viewBox="0 0 ${x.w} ${x.h}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;
const ell = d => d.map(([px, py, rx, ry, c]) => `<ellipse cx="${px}" cy="${py}" rx="${rx + .6}" ry="${ry + .6}" fill="${c}"/>`).join('');
const PAN_N = 9, PAN_STEP = 12.5, PAN_JX = [0, 6, -5, 4, -7, 5, -3, 4, 0];   // блинов в стопке, шаг по высоте, сдвиги вбок (верхний — без сдвига)
// группы точек по близости (формулы снега)
function groupDots(d, gap){
  const g = d.map((_, i) => i), find = i => g[i] === i ? i : (g[i] = find(g[i]));
  for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++)
    if (Math.hypot(d[i][0] - d[j][0], d[i][1] - d[j][1]) < gap) g[find(i)] = find(j);
  const out = {};
  d.forEach((p, i) => (out[find(i)] = out[find(i)] || []).push(p));
  return Object.values(out);
}
function livePost(x){
  const L = x.layers;
  let inner = '';
  if (x.live === 'pancakes') {
    const [cx, cy] = x.pan.c, [rx, ry] = x.pan.r;
    let pk = '';
    // узор — на каждом блине (просьба 13.11); тарелка — целый эллипс вектором, стоит всегда
    for (let i = 0; i < PAN_N; i++) pk += `<g class="vo-pk" opacity="0"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#F5D300" stroke="#C79E00" stroke-width="3"/>${ell(x.spots)}</g>`;
    const [px, py, prx, pry] = x.pan.plate;
    inner = lyr(L.bg, 'vo-bg') + lyr(L.circles, 'vo-p1c')
      + liveSVG(x, 'vo-p1svg', `<ellipse cx="${px}" cy="${py}" rx="${prx}" ry="${pry}" fill="#fff" stroke="#141414" stroke-width="5"/>${pk}`);
  }
  if (x.live === 'heart') inner = lyr(L.bg, 'vo-bg') + `<div class="vo-ly vo-p2h">${lyr(L.heart, '')}</div>`
    + `<div class="vo-ly vo-p2l">${lyr(L.line, '')}${liveSVG(x, '', ell(x.dots))}</div>`;
  if (x.live === 'snow') inner = lyr(L.bg, 'vo-bg')
    + liveSVG(x, 'vo-p3svg', groupDots(x.dots.flatMap(([px, py, rx, ry, c]) =>   // слипшаяся пара — две круглые снежинки
        ry > rx * 1.35 ? [[px, py - (ry - rx), rx, rx, c], [px, py + (ry - rx), rx, rx, c]]
        : rx > ry * 1.35 ? [[px - (rx - ry), py, ry, ry, c], [px + (rx - ry), py, ry, ry, c]] : [[px, py, Math.min(rx, ry), Math.min(rx, ry), c]]), 78)
        .map(g => `<g class="vo-fl">${ell(g)}</g>`).join(''))
    + lyr(L.car, '') + lyr(L.text, '');
  if (x.live === 'salute') {
    const [cx, cy] = x.c;
    const yel = c => parseInt(c.slice(1, 3), 16) > 220 && parseInt(c.slice(3, 5), 16) > 190 && parseInt(c.slice(5, 7), 16) < 60;
    const far = p => Math.hypot(p[0] - cx, p[1] - cy);
    const core = x.dots.filter(p => far(p) > 60 && far(p) < 290 && p[2] > 12 && !yel(p[4]));   // 19 электронов вокруг буквы В — иконка, стоит на месте
    const rest = x.dots.filter(p => !core.includes(p) && far(p) > 60);
    const nuclei = rest.filter(p => p[2] > 13 && yel(p[4]));   // желтые ядра залпов
    const bursts = nuclei.map(n => ({ n, d: [] }));
    rest.forEach(p => { if (nuclei.includes(p)) return;
      bursts.reduce((a, b) => Math.hypot(p[0] - b.n[0], p[1] - b.n[1]) < Math.hypot(p[0] - a.n[0], p[1] - a.n[1]) ? b : a).d.push(p); });
    inner = lyr(L.bg, 'vo-bg') + liveSVG(x, 'vo-p4svg', `<g class="vo-bst" data-core="1" data-c="${cx},${cy}">${ell(core)}</g>` + bursts.map(b =>
      `<g class="vo-bst" data-c="${b.n[0]},${b.n[1]}"><line class="vo-rk" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0"/>
        <circle class="vo-flash" cx="${b.n[0]}" cy="${b.n[1]}" r="0" fill="#FFF3B0" opacity="0"/>${ell(b.d)}${ell([b.n])}</g>`).join(''));
  }
  return `<div class="vo-post-pic vo-live vo-L-${x.live}" data-live="${x.live}" style="aspect-ratio:${x.w}/${x.h};--o:${x.c ? `${(x.c[0] / x.w * 100).toFixed(1)}% ${(x.c[1] / x.h * 100).toFixed(1)}%` : '50% 50%'}">${inner}</div>`;
}
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const outCubic = p => 1 - Math.pow(1 - p, 3);
const outBack = p => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2);
// обновление одного живого поста: t — секунды; все на атрибутах SVG, чтобы одинаково шло в любом браузере
const LIVE = {
  pancakes(el, x){
    const pk = [...el.querySelectorAll('.vo-pk')], circ = el.querySelector('.vo-p1c'), cy = x.pan.c[1], T = 8;
    return t => {
      const tt = t % T;
      // круги на фоне: расходятся от тарелки в начале цикла и сходятся обратно в конце
      const cr = tt < 1.1 ? outCubic(tt / 1.1) : tt > 6.9 ? 1 - outCubic(clamp01((tt - 6.9) / .9)) : 1;
      circ.style.clipPath = `circle(${(cr * 78).toFixed(1)}% at var(--o))`;
      pk.forEach((g, i) => {
        const fy = (PAN_N - 1 - i) * PAN_STEP, t0 = .5 + i * .24, p = clamp01((tt - t0) / .4);
        if (tt < t0) { g.setAttribute('opacity', 0); return; }
        let X = PAN_JX[i], Y = fy - (1 - p * p) * 210, sy = 1, op = Math.min(1, p * 3);   // падает с небольшой высоты — заголовок не заслоняет
        const q = clamp01((tt - t0 - .4) / .34);                         // шлепок при посадке
        if (p >= 1) sy = 1 - .16 * Math.sin(Math.PI * q) * (1 - q);
        // под новым блином стопка чуть проседает
        const hit = (tt - (.5 + (i + 1) * .24 + .4)) / .3;
        if (i < PAN_N - 1 && hit > 0 && hit < 1) Y += 3 * Math.sin(Math.PI * hit);
        const e = clamp01((tt - (5.6 + (PAN_N - 1 - i) * .12)) / .5);    // блины забирают по одному, сверху
        if (e > 0) { X += e * e * 620; Y -= Math.sin(e * Math.PI) * 46; op = 1 - e * e; }
        g.setAttribute('opacity', op.toFixed(3));
        g.setAttribute('transform', `translate(${X.toFixed(1)} ${(Y + cy * (1 - sy) + (1 - sy) * x.pan.r[1]).toFixed(1)}) scale(1 ${sy.toFixed(3)})`);
      });
    };
  },
  snow(el, x){
    const H = x.h + 160;
    const gs = [...el.querySelectorAll('.vo-fl')].map((g, i) => {
      const ys = [...g.children].map(c => +c.getAttribute('cy')), y0 = ys.reduce((a, b) => a + b, 0) / ys.length;
      return { g, y0, v: 62 + ((i * 37) % 11) * 5, ph: i * 1.7, amp: 6 + (i % 3) * 4 };
    });
    return t => gs.forEach(o => {
      const y = ((o.y0 + o.v * t + 80) % H + H) % H - 80;   // по кругу: ушла вниз — пришла сверху
      o.g.setAttribute('transform', `translate(${(Math.sin(t * .7 + o.ph) * o.amp).toFixed(1)} ${(y - o.y0).toFixed(1)})`);
    });
  },
  salute(el, x){
    const P = 5.4;
    const bs = [...el.querySelectorAll('.vo-bst')].map((g, k, all) => {
      const [cx, cy] = g.dataset.c.split(',').map(Number), es = [...g.querySelectorAll('ellipse')], core = !!g.dataset.core;
      const nuc = core ? null : es.pop();
      return { g, cx, cy, core, nuc, nr: nuc ? [+nuc.getAttribute('rx'), +nuc.getAttribute('ry')] : 0, rk: g.querySelector('.vo-rk'), fl: g.querySelector('.vo-flash'),
        off: core ? 0 : (.9 + ((k * 2) % all.length) / all.length * P), y0: Math.min(cy + 340, x.h * .8),
        d: es.map((e, i) => ({ e, x: +e.getAttribute('cx'), y: +e.getAttribute('cy'), ph: i * 2.1 })) };
    });
    return t => bs.forEach(b => {
      const lt = (((t - b.off) % P) + P) % P;
      if (b.core) {                                        // вспышка вокруг буквы В: точки вылетают от края круга, мерцают, гаснут
        const fade = clamp01((lt - 3.1) / 1), p = .28 + .72 * outCubic(clamp01(lt / .75));
        b.d.forEach(o => {
          o.e.setAttribute('cx', (b.cx + (o.x - b.cx) * p).toFixed(1));
          o.e.setAttribute('cy', (b.cy + (o.y - b.cy) * p + 36 * fade * fade).toFixed(1));
          o.e.setAttribute('opacity', lt > 4.1 ? 0 : (Math.min(1, lt * 7) * (1 - fade) * (.8 + .2 * Math.sin(t * 7 + o.ph))).toFixed(2));
        });
        return;
      }
      // ракета: светлый штрих взлетает к месту залпа
      const r = clamp01(lt / .6), hy = b.y0 + (b.cy - b.y0) * (1 - Math.pow(1 - r, 2)), len = 54 * (1 - r) + 8;
      b.rk.setAttribute('x1', b.cx); b.rk.setAttribute('x2', b.cx); b.rk.setAttribute('y1', hy.toFixed(1)); b.rk.setAttribute('y2', (hy + len).toFixed(1));
      b.rk.setAttribute('opacity', lt < .6 ? (.9 * Math.min(1, r * 6) * (1 - r * r * .4)).toFixed(2) : 0);
      const bt = lt - .6;                                  // время от вспышки
      const f = clamp01(bt / .4);
      b.fl.setAttribute('r', bt > 0 ? (18 + 110 * outCubic(f)).toFixed(1) : 0); b.fl.setAttribute('opacity', bt > 0 ? (.5 * (1 - f)).toFixed(2) : 0);
      const fade = clamp01((bt - 2.9) / 1.1), ns = bt <= 0 ? 0 : outBack(clamp01(bt / .45)) * (1 - .25 * fade);
      b.nuc.setAttribute('rx', (b.nr[0] * ns).toFixed(1)); b.nuc.setAttribute('ry', (b.nr[1] * ns).toFixed(1)); b.nuc.setAttribute('opacity', (1 - fade).toFixed(2));
      const p = outCubic(clamp01(bt / .7));
      b.d.forEach(o => {
        o.e.setAttribute('cx', (b.cx + (o.x - b.cx) * p).toFixed(1));
        o.e.setAttribute('cy', (b.cy + (o.y - b.cy) * p + 42 * fade * fade).toFixed(1));   // гаснут и осыпаются вниз
        o.e.setAttribute('opacity', bt <= 0 ? 0 : (Math.min(1, bt * 8) * (1 - fade) * (.78 + .22 * Math.sin(t * 7 + o.ph))).toFixed(2));
      });
    });
  },
};
function socialHTML(b){
  const posts = b.posts.map(x => `<article class="vo-post"><header>${avatarSVG(28)}<div><b>Воскресенск</b><span>${tx(x.time)}</span></div></header><p>${tx(x.text)}</p>${x.live ? livePost(x) : `<div class="vo-post-pic"><img src="${x.img}" alt="" loading="lazy"></div>`}<footer><button class="vo-like" aria-label="Нравится"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button><span class="vo-act" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-6l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/></svg></span><span class="vo-act" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M13 5l7 6.5-7 6.5v-4c-4.5 0-7 1.2-9 4 .4-5.5 3.2-9 9-9.5z"/></svg></span></footer></article>`).join('');
  return `${b.title ? `<h3 class="vo-title">${tx(b.title)}</h3>` : ''}
  <div class="vo-social">
    <div class="vo-phone-col"><div class="vo-phone"><div class="vo-screen">
      <div class="vo-status"><span>10:00</span><span class="vo-bat"></span></div>
      <div class="vo-feed"><div class="vo-feed-in">
        ${coverSVG()}
        <div class="vo-head"><div class="vo-profile">${avatarSVG(72)}<div><b>Воскресенск</b><span>${tx(b.sub)}</span></div></div>
        <button class="vo-follow">${tx(b.follow[0])}</button></div>
        <div class="vo-posts">${posts}</div>
      </div></div>
      <i class="vo-thumb"></i>
    </div>
    </div>
    <p class="vo-scrollhint"><svg viewBox="0 0 30 50" width="30" height="50" aria-hidden="true"><rect class="vo-sh-body" x="3" y="3" width="24" height="44" rx="12"/><rect class="vo-sh-wheel" x="13" y="11" width="4" height="9" rx="2"/></svg><span>${tx(b.hint)}</span><svg class="vo-sh-arrows" viewBox="0 0 24 34" width="24" height="34" aria-hidden="true"><path class="vo-sh-ch vo-sh-1" d="M5 5l7 7 7-7"/><path class="vo-sh-ch vo-sh-2" d="M5 18l7 7 7-7"/></svg></p>
    </div>
    <div class="vo-carousel"><div class="vo-track-wrap"><div class="vo-track">${b.posts.map(x => `<article class="vo-slide"><header>${avatarSVG(36)}<div><b>Воскресенск</b><span>${tx(x.time)}</span></div></header><button class="vo-slide-pic" aria-label="Увеличить"><img src="${x.img}" alt="" loading="lazy"></button></article>`).join('')}</div></div>
      <button class="vo-arrow vo-prev" aria-label="Предыдущий пост"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="vo-arrow vo-next" aria-label="Следующий пост"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 5l7 7-7 7"/></svg></button>
      <div class="vo-dots">${b.posts.map((_, i) => `<button aria-label="Пост ${i + 1}"${i ? '' : ' class="on"'}></button>`).join('')}</div></div>
  </div>`;
}
function liveSocial(el, b){
  // подписка
  const f = el.querySelector('.vo-follow');
  f.addEventListener('click', () => { const on = f.classList.toggle('on'); f.textContent = H.T(H.pick(b.follow[on ? 1 : 0])); });
  // лайки
  el.querySelectorAll('.vo-like').forEach(l => l.addEventListener('click', () => l.classList.toggle('on')));
  // лента: листают колесом или пальцем; ползунок справа показывает место, подсказка рядом гаснет после первой прокрутки
  const feed = el.querySelector('.vo-feed'), thumb = el.querySelector('.vo-thumb'), hint = el.querySelector('.vo-scrollhint');
  let vis = false;
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(feed);
  const place = () => {
    const k = feed.clientHeight / feed.scrollHeight, track = feed.clientHeight - 16;
    thumb.style.height = Math.max(28, track * k) + 'px';
    thumb.style.transform = `translateY(${(feed.scrollTop / Math.max(1, feed.scrollHeight - feed.clientHeight) * (track - Math.max(28, track * k))).toFixed(1)}px)`;
  };
  feed.addEventListener('scroll', place, { passive: true });
  new ResizeObserver(place).observe(feed.firstElementChild); place();
  // живые посты: один цикл на все, идет, пока телефон на экране; у каждого поста свои часы — они обнуляются, когда лента к нему подъезжает
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lives = [...el.querySelectorAll('.vo-live')], postEls = [...el.querySelectorAll('.vo-post')];
  const ups = lives.map((n, i) => LIVE[n.dataset.live] ? LIVE[n.dataset.live](n, b.posts[i]) : null);
  const t0 = lives.map(() => 0);
  // лента едет сама: шапка, потом пост за постом; на каждом стоит, пока его анимация не пройдет целиком
  const DWELL = [2.4, 8.3, 5.6, 7, 6.6];                  // шапка, блины (цикл 8 с), сердце, снег, салют
  let step = 0, next = 0, fhold = 0, was = false;
  const goStep = now => {
    const top = step === 0 ? 0 : postEls[step - 1].offsetTop - 6;
    feed.scrollTo({ top: Math.round(top), behavior: reduce ? 'auto' : 'smooth' });
    if (step > 0) t0[step - 1] = now + .55;               // анимация поста начинается, когда он доехал
    next = now + .55 + DWELL[step];
  };
  ['wheel', 'touchstart', 'pointerdown'].forEach(e => feed.addEventListener(e, () => { fhold = performance.now() / 1000 + 7; }, { passive: true }));
  const tick = ms => {
    if (!feed.isConnected) return;
    const now = ms / 1000;
    if (vis) {
      if (!was) { step = 0; goStep(now); }                 // телефон появился на экране — с начала
      else if (now > fhold && now > next) {
        if (fhold) { fhold = 0; step = postEls.reduce((b, p, i) => Math.abs(p.offsetTop - feed.scrollTop) < Math.abs(postEls[b].offsetTop - feed.scrollTop) ? i : b, 0); }
        step = (step + 1) % (postEls.length + 1); goStep(now);
      }
      ups.forEach((u, i) => u && u(reduce ? 4.5 : Math.max(0, now - t0[i])));
    }
    was = vis;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // карусель: листается сама раз в 3,5 с, кружки — к посту, палец и мышь — вручную
  const tr = el.querySelector('.vo-track'), dots = [...el.querySelectorAll('.vo-dots button')], slides = [...tr.children];
  const go = i => tr.scrollTo({ left: slides[i].offsetLeft - tr.offsetLeft, behavior: 'smooth' });
  let cur = 0, hold = 0;
  tr.addEventListener('scroll', () => {
    const i = slides.reduce((b, s, j) => Math.abs(s.offsetLeft - tr.offsetLeft - tr.scrollLeft) < Math.abs(slides[b].offsetLeft - tr.offsetLeft - tr.scrollLeft) ? j : b, 0);
    if (i !== cur) { cur = i; dots.forEach((d, j) => d.classList.toggle('on', j === i)); slides.forEach((sl, j) => sl.classList.toggle('on', j === i)); }
  }, { passive: true });
  ['pointerdown', 'wheel', 'touchstart'].forEach(e => tr.addEventListener(e, () => { hold = performance.now() + 6000; }, { passive: true }));
  dots.forEach((d, i) => d.addEventListener('click', () => { hold = performance.now() + 6000; go(i); }));
  slides[0].classList.add('on');
  // стрелки: на шаг назад и вперед, по кругу
  el.querySelector('.vo-prev').addEventListener('click', () => { hold = performance.now() + 6000; go((cur - 1 + slides.length) % slides.length); });
  el.querySelector('.vo-next').addEventListener('click', () => { hold = performance.now() + 6000; go((cur + 1) % slides.length); });
  const timer = setInterval(() => {
    if (!tr.isConnected) return clearInterval(timer);
    if (vis && performance.now() > hold) go(tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 4 ? 0 : cur + 1);
  }, 3500);
  const imgs = slides.map(s => s.querySelector('img'));
  slides.forEach((s, i) => s.querySelector('.vo-slide-pic').addEventListener('click', () => H.openViewer && H.openViewer(imgs.map(im => im.currentSrc || im.src), i, imgs)));
}
// логотипы: поля обрезаны, знак везде одного размера (h — высота картинки в высотах знака), полные версии — по левому краю, короткие — по правому
function logosHTML(b){
  return `${b.title ? `<h3 class="vo-title">${tx(b.title)}</h3>` : ''}<div class="vo-logos">${b.rows.map(r =>
    `<div class="vo-logo-row">${r.map(it => `<img src="${it.img}" alt="" loading="lazy" style="height:calc(var(--s) * ${it.h})">`).join('')}</div>`).join('')}</div>`;
}
const RENDER = { logos: logosHTML, tiles: tilesHTML, cards: cardsHTML, letter: letterHTML, patterns: patternsHTML, social: socialHTML };
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });
function mountBlocks(root, p){
  const data = (p.gallery || []).flat().filter(x => x && x.vosk);
  root.querySelectorAll('.vo-ch').forEach((el, i) => {
    const b = data[i]; if (!b) return;
    el.classList.add('vo-is-' + b.vosk);
    el.innerHTML = (RENDER[b.vosk] || cardsHTML)(b);
    reveal.observe(el);
    if (b.vosk === 'social') liveSocial(el, b);
    // крупно по нажатию — все картинки блока листаются
    const imgs = [...el.querySelectorAll('.vo-card img')];
    el.querySelectorAll('.vo-card .vo-pic').forEach((btn, j) => btn.addEventListener('click', () =>
      H.openViewer && H.openViewer(imgs.map(im => im.currentSrc || im.src), j, imgs)));
  });
}

/* ---------- золото шейдером ----------
   Один WebGL-холст вне страницы рисует фольгу для каждого золотого круга по очереди: рельеф из шума (крупные складки
   и мелкая «мятость»), нормали по рельефу, блик от источника света и отражение светлых полос окружения.
   Координаты — экранные, поэтому фольга непрерывна, а свет общий: от курсора, на телефоне — от наклона.
   Картинка копируется в маленький 2D-холст поверх круга (круглый по CSS); буква В дорисовывается сверху белым */
const FRAG = `precision highp float;
uniform vec2 uRes, uPos, uLight, uCenter; uniform float uT, uDpr;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return v; }
float height(vec2 p){ return fbm(p / 210.) * 1.3 + fbm(p / 52.) * .3 + noise(p / 7.) * .025; }
void main(){
  vec2 sp = uPos + vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;   // точка на экране, css px
  float e = 1.5, h = height(sp);
  vec3 n = normalize(vec3(-(height(sp + vec2(e, 0)) - h) * 16., (height(sp + vec2(0, e)) - h) * 16., 1.));
  // свет на постоянной высоте: за курсором поворачивается только направление — средняя яркость не прыгает
  vec2 dir = uLight - uCenter; dir = length(dir) > 1. ? normalize(dir) : vec2(0., -1.);
  vec3 L = normalize(vec3(dir * vec2(1, -1) * .75, .66));
  vec3 V = vec3(0, 0, 1), Hh = normalize(L + V), r = reflect(-V, n);
  float diff = clamp(dot(n, L), 0., 1.); diff = pow(diff, 3.);
  float spec = pow(max(dot(n, Hh), 0.), 90.) + .2 * pow(max(dot(n, Hh), 0.), 14.);
  float band = .5 + .5 * sin(r.x * 7. + r.y * 4. + atan(dir.y, dir.x) * 1.5 + uT * .15);
  vec3 deep = vec3(.66, .43, .05), mid = vec3(.93, .70, .15), lite = vec3(1., .87, .42);
  vec3 c = mix(deep, mid, smoothstep(.15, .95, diff));
  c = mix(c, lite, band * band * band * .45);
  c += vec3(1., .96, .78) * spec * .7;
  gl_FragColor = vec4(min(c, 1.), 1.);
}`;
let G = null;
function goldGL(){
  if (G !== null) return G;
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const gl = cv.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) return (G = false);
  const sh = (t, src) => { const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return (G = false);
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = n => gl.getUniformLocation(pr, n);
  return (G = { cv, gl, uCenter: u('uCenter'), uRes: u('uRes'), uPos: u('uPos'), uLight: u('uLight'), uT: u('uT'), uDpr: u('uDpr') });
}
function paintGold(g, c, light, t){
  const r = c.getBoundingClientRect();
  if (r.width < 2 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) { if (c._cv) c._cv.style.visibility = 'hidden'; if (c._lt) c._lt.style.visibility = 'hidden'; return; }
  const host = c.ownerSVGElement.parentElement;
  if (!c._cv) {
    c._cv = document.createElement('canvas'); c._cv.className = 'vo-goldcv';
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(c._cv);
  }
  const cv = c._cv, hr = host.getBoundingClientRect(), dpr = Math.min(3, Math.max(2, devicePixelRatio || 1));
  const w = Math.min(512, Math.ceil(r.width * dpr)), hgt = Math.min(512, Math.ceil(r.height * dpr));
  if (cv.width !== w || cv.height !== hgt) { cv.width = w; cv.height = hgt; }
  Object.assign(cv.style, { visibility: 'visible', left: (r.left - hr.left + host.scrollLeft) + 'px', top: (r.top - hr.top + host.scrollTop) + 'px', width: r.width + 'px', height: r.height + 'px' });
  const gl = g.gl;
  gl.viewport(0, 0, w, hgt);
  gl.uniform2f(g.uRes, w, hgt); gl.uniform2f(g.uCenter, r.left + r.width / 2, r.top + r.height / 2); gl.uniform2f(g.uPos, r.left, r.top); gl.uniform2f(g.uLight, light[0], light[1]);
  gl.uniform1f(g.uT, t / 1000); gl.uniform1f(g.uDpr, w / r.width);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  const ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, hgt);
  ctx.drawImage(g.cv, 0, 512 - hgt, w, hgt, 0, 0, w, hgt);
  // буква — векторная, отдельным SVG поверх золота (на холсте она выходила растровой); сдвиг — оптическое выравнивание, вправо и вверх
  if (c.dataset.ls) {
    if (!c._lt) {
      c._lt = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      c._lt.setAttribute('class', 'vo-goldlt'); c._lt.setAttribute('viewBox', '-1 -1 2 2'); c._lt.setAttribute('aria-hidden', 'true');
      c._lt.innerHTML = `<path fill="#fff" fill-rule="evenodd" transform="translate(${+c.dataset.lt} ${+(c.dataset.ly || 0)}) scale(${+c.dataset.ls})" d="${LETTER}"/>`;
      host.appendChild(c._lt);
    }
    Object.assign(c._lt.style, { visibility: 'visible', left: cv.style.left, top: cv.style.top, width: cv.style.width, height: cv.style.height });
  }
}
let foilOn = false;
function foilMotion(){
  if (foilOn) return; foilOn = true;
  const g = goldGL();
  if (!g) return;   // без WebGL остается ровная золотая заливка
  let tx = 0, ty = 0, x = 0, y = 0, lastInput = -1e9;
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; lastInput = performance.now(); }, { passive: true });
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 30)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); lastInput = performance.now();
  });
  // iPhone спрашивает разрешение на наклон — один раз, по первому касанию
  if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission)
    addEventListener('touchend', () => DeviceOrientationEvent.requestPermission().catch(() => {}), { once: true });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = t => {
    const cs = document.querySelectorAll('.vo-mark circle[data-gold], .vo-ch circle[data-gold]');
    if (cs.length) {
      // без курсора и наклона свет медленно ходит сам
      if (t - lastInput > 2500 && !reduce) { tx = Math.sin(t / 2300) * .6; ty = Math.cos(t / 3100) * .5; }
      x += (tx - x) * .08; y += (ty - y) * .08;
      const light = [(.5 + x * .7) * innerWidth, (.5 + y * .7) * innerHeight];
      cs.forEach(c => paintGold(g, c, light, reduce ? 0 : t));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
export { svgHTML, fit };   // для записи ролика-обложки (исходники/vosk-cover.mjs)
export async function mountVosk(mount, p, helpers){
  H = helpers;
  await loadCSS(helpers.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  mountBlocks((mount.closest('.case-body') || mount).parentElement || document, p);
  foilMotion();
  const hero = (mount.closest('.case-body') || mount).parentElement?.querySelector('.case-hero');
  if (!hero) { mount.remove(); return; }
  mount.remove();   // пустой mount сайт рисует серой заглушкой загрузки, а знак живет в шапке
  hero.classList.add('vo-hero');
  hero.querySelectorAll('img, video').forEach(el => el.remove());
  hero.insertAdjacentHTML('beforeend', svgHTML('vo' + Math.random().toString(36).slice(2, 7)));
  const svg = hero.querySelector('.vo-mark');
  fit(svg);
  new ResizeObserver(() => fit(svg)).observe(hero);
  // сборка запускается, когда шапка видна
  // сборка проигрывается каждый раз, когда шапка заезжает на экран; ушла с экрана — знак разбирается обратно
  let timer = 0;
  new IntersectionObserver(es => es.forEach(e => {
    clearTimeout(timer);
    if (e.isIntersecting) timer = setTimeout(() => svg.classList.add('in'), 500);
    else svg.classList.remove('in');
  }), { threshold: 0.35 }).observe(svg);
}
