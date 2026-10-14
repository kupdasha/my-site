/* ================================================================
   КЕЙС «СПОРТИВНАЯ ФОРМА VK» (поле sport у проекта, страница NDA)
   Слайды презентации не показываем — главы собраны из ее элементов:
   teams   — фото команд VK в своей форме мозаикой;
   palette — палитра из гайдбука VK полосами (наведение — имя, HEX
             и Pantone), под ней двенадцать градиентов: сначала полосы
             цветов, потом они сами перетекают друг в друга;
   kit     — конструктор: силуэт формы — векторы из самой презентации,
             зоны (рукава, половины переда, шорты, воротник) перекраши-
             ваются элементами конструктора; нажатие на зону — новая
             заливка, кнопка — другая команда, без касания собирается сам;
   honor   — графика достижений на canvas: фото команды → гравюра из
             волнистых линий → в паттерн → на форме (строка этапов
             с полоской таймера);
   art     — шторка «оригинальная графика / перерисованная»;
   lineup  — все двенадцать форм из презентации лентой, крупно по нажатию.
   Картинки — img/vksport. Тексты — в content.js, оформление — sport.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
const img = n => H.base + 'img/vksport/' + n;
const rnd = a => a[Math.floor(Math.random() * a.length)];
let uid = 0;

/* ---------- цвета гайдбука VK ---------- */
const PAL = { blue: '#0077FF', magenta: '#FF3985', purple: '#8024C0', mint: '#7CEDF8', black: '#000000', grey: '#F5F5F5', white: '#FFFFFF', cyan: '#00E9FF' };
/* градиенты — цвета сняты со слайда «Градиенты» (сверху вниз, у 11 и 12 — по диагонали) */
const GRADS = [
  { a: 180, c: ['#77EBF8', '#50D3FF', '#8CAEFF', '#D87BE6', '#FD3D8D'] },
  { a: 180, c: ['#7CE9F7', '#7D88DC', '#7F27C1'] },
  { a: 180, c: ['#0076FF', '#005EFF'] },
  { a: 180, c: ['#76EBF8', '#00BAFF', '#0079FF'] },
  { a: 180, c: ['#9E2DCD', '#DD18A9', '#FD3786'] },
  { a: 180, c: ['#7F25C1', '#5E54E3', '#0975FD'] },
  { a: 180, c: ['#006DE8', '#003F80', '#001124'] },
  { a: 135, c: ['#4CADF6', '#4FAFF5', '#FC3989', '#D04297'] },
  { a: 180, c: ['#77E9F4', '#007681', '#000709'] },
  { a: 180, c: ['#7D23BC', '#401261', '#030004'] },
  { a: 135, c: ['#007DFE', '#000000', '#000000', '#FF3885'] },
  { a: 135, c: ['#F93882', '#0B1125', '#016AE3'] },
];
const light = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11) > 170; };

/* ---------- силуэт формы: векторы из презентации (слайд «пример комбинаций») ---------- */
const KIT = {
  body: 'M498.5 440.4L499.3 431.3L500.4 422.3L501.9 413.2L503.7 404.1L505.9 394.9L508.5 385.7L511.5 376.5L515 367.2L519 357.8L516.7 356.8C513.6 355.5 510.5 354.2 507.4 352.9C505.2 352 502.7 350.8 500.7 349.7C499.6 349.1 497.6 347.8 496.6 347.1L494.7 345.6L492.8 344L491.1 342.2L489.4 340.3L487.9 338.1L486.6 335.7L485.4 333.1L484.3 330.2L483.4 327L482.7 323.5L482.2 319.7L481.9 315.6L481.7 313.1C481.2 304.7 479.7 296.3 476.9 288.3C472.2 275.1 464.1 264.9 452.9 256.5C448.9 253.5 445.1 251.2 440.7 248.7L414.8 234.6C409.4 247.8 401 259.6 390.4 269.9C380.8 279.1 372.7 287.8 359.3 295.2C345.8 287.7 337.7 279.1 328.1 269.9C317.5 259.6 309 247.8 303.7 234.6L277.7 248.8C275.5 250 273.4 251.2 271.3 252.5C258.7 260.5 249.1 270.5 243.1 284.3C239.9 291.9 238.1 300 237.2 308.1C236.9 310.7 236.7 313 236.6 315.6L236.3 319.7L235.7 323.5L235 327L234.1 330.1L233.1 333L231.9 335.7L230.5 338.1L229.1 340.2L227.4 342.2L225.7 344L223.9 345.6L221.9 347.1L219.9 348.4C218.6 349.2 216.9 350.1 215.6 350.8C212.7 352.2 209.5 353.5 206.5 354.8L199.5 357.8L203.5 367.1L207 376.4L210 385.7L212.6 394.9L214.8 404L216.7 413.1L218.1 422.2L219.2 431.3L220 440.3L220.5 449.4L220.7 458.5L220.7 467.5L220.5 476.6L220 485.7L219.4 494.8L218.7 504L217.8 513.2C216.5 525.6 215 538.1 213.5 550.5C211.9 563.4 210.4 576.2 209.1 589.1L208.1 598.9L207.3 608.9L206.6 619.1L206 629.3C217.7 631.3 229.3 633 241.1 634.4C246.6 635 252 635.5 257.5 636.1C272.4 637.5 287.6 638.3 302.4 639C314.3 639.4 326.1 639.7 338 639.8C345.9 640 353.7 640 361.6 640L382.9 639.8L401.9 639.4C407.4 639.3 412.9 639.1 418.4 638.9C425.6 638.6 432.6 638.2 439.7 637.7C447.6 637.2 455.5 636.6 463.3 635.8C479.6 634.3 496.5 632.1 512.5 629.3L512 619.1L511.3 609L510.4 599C509 582.8 507 566.6 505.1 550.5C503.2 535.1 501.2 519.4 499.9 504L499.1 494.8L498.5 485.7L498.1 476.6L497.8 467.5L497.8 458.5L498 449.4L498.5 440.4Z',
  bodyR: 'M360.1 638.9L360.1 295.3C371.9 288.8 379.6 281.3 387.8 273.3C388.9 272.2 390 271.2 391.1 270.1C401.6 259.9 410 248.1 415.3 235L441.2 249C445.6 251.5 449.3 253.8 453.4 256.8C464.5 265.1 472.5 275.3 477.2 288.5C480 296.4 481.5 304.8 482.1 313.1L482.2 315.7L482.5 319.8L483.1 323.6L483.8 327L484.6 330.2L485.7 333.1L486.9 335.7L488.2 338.1L489.7 340.3L491.4 342.2L493.1 344L494.9 345.6L496.9 347.1C497.9 347.8 499.9 349.1 501 349.6C503 350.8 505.5 351.9 507.6 352.8C509.2 353.5 510.9 354.2 512.5 354.9C514 355.5 515.4 356.1 516.9 356.7L519.2 357.7L515.2 367.1L511.8 376.3L508.7 385.5L506.1 394.7L503.9 403.8L502.1 412.9L500.7 422L499.6 431L498.8 440L498.3 449.1L498.1 458.1L498.1 467.1L498.3 476.1L498.8 485.2L499.4 494.3L500.1 503.4C501.4 517.5 503.1 531.9 504.9 546C505 547.3 505.2 548.5 505.3 549.8L505.4 550.4C507.3 566.2 509.2 582.2 510.7 598.1L511.5 608L512.2 618.1L512.8 628.3C496.7 631.1 479.9 633.3 463.7 634.8C455.9 635.6 448.1 636.2 440.2 636.7C433.1 637.2 426.1 637.6 419 637.8L418.4 637.9C413.1 638.1 407.8 638.3 402.5 638.4L383.6 638.8L362.4 638.9C361.6 638.9 360.8 638.9 360.1 638.9Z',
  sleeveL: 'M297.5 195.5L100.4 283L142.3 372.9C154.7 369.2 166.7 367.2 179 366.1C193.1 364.7 201.5 362.5 199.5 357.8C209.1 353.7 220.4 350 227.4 342.3C236.7 332 235.9 319.8 237.2 308.2C240.3 280.2 253 262.3 277.7 248.7L303.7 234.6C298.9 222.7 296.6 209.6 297.5 195.5Z',
  sleeveR: 'M421 195.5C422 209.6 419.6 222.7 414.8 234.6L440.7 248.7C465.5 262.3 478.2 280.2 481.3 308.2C482.6 319.9 481.9 332 491.1 342.3C498 350 509.4 353.8 519 357.8C517 362.5 525.4 364.8 539.5 366.1C551.8 367.2 563.8 369.3 576.1 372.9L618.1 283L421 195.5Z',
  collarL: 'M340.3 260.6C320.9 241.8 307.5 216.4 315.3 192C315.5 191.4 316.5 188.5 317.2 186.3L297.5 195.1C295.4 225.1 307.8 250.3 328.1 269.8C337.7 279.1 345.8 287.7 359.3 295.1L359.3 278.2C356.2 276.2 346.7 266.8 340.3 260.6Z',
  collarR: 'M421 195.1L401.3 186.3C402 188.5 403 191.4 403.2 192C411 216.4 397.6 241.8 378.2 260.6C371.8 266.8 360.6 277.4 359.2 278.3L359.2 295.2C372.7 287.7 380.8 279.1 390.4 269.8C410.7 250.3 423.2 225.1 421 195.1Z',
  neck: 'M308.7 195.7H415.3V282.9H308.7Z',
  collarB: 'M366.8 206.8C380.1 206.4 392.9 204.1 404.9 200C404.3 197.3 403.5 194.5 402.5 191.8C402.3 191.2 401.4 188.7 400.7 186.6L400.5 186.2C389.7 190.2 378.1 192.3 366 192.8C350.5 193.3 334.3 191 318.2 186L317.8 186.8C317 188.9 316.2 191.2 316 191.8C315.1 194.4 314.3 197.1 313.7 199.7C331.4 205 349.4 207.4 366.8 206.8Z',
  shorts: 'M360.4 871.9L342.5 970.7L184.8 951.6C199 871 213.2 790.3 227.4 709.6L242.8 690.6L246.5 669.7C322.4 669.7 398.3 669.7 474.2 669.7L477.8 690.6L493.3 709.6L528.1 907.4L535.9 951.6L377.7 970.8L360.4 871.9Z',
  shortsR: 'M477.8 690.6L474.2 669.7L360.4 669.7L360.4 871.9L377.7 970.8L535.9 951.6L528.1 907.4L493.3 709.6L477.8 690.6Z',
  belt: 'M246.5 669.7H474.2L477.8 690.6H242.8Z',
  hem: 'M185.8 946L343.5 965.1M376.7 965.1L534.9 946M360.4 690.6V871.9',
  string: 'M361.6 667.4C364.6 663.4 369 656.9 367 656.8C362.2 657.1 361.5 663.2 361.6 667.4M353.5 656.6C351.8 658.4 354.8 661.2 357.5 663.2C356.5 659.7 354.9 655.2 353.5 656.6M358.6 667.6C355.9 665.9 346.4 659.4 351.3 654.5C355 650.7 357.8 655.4 359.5 659.9C360.6 656.7 362.7 654 366.8 653.8C376.4 653.8 361.6 672.4 361.6 672.5C361 673.1 360.1 673.3 359.4 672.7C359.1 672.5 358.9 672.1 358.8 671.7C358.8 671.5 358.6 669.8 358.6 667.6Z',
  logo: 'M266.2 333.1C262.5 336.7 262.5 342.5 262.5 354.2L262.5 356.3C262.5 367.9 262.5 373.8 266.2 377.4C269.8 381 275.6 381 287.3 381L289.4 381C301 381 306.8 381 310.5 377.4C314.1 373.8 314.1 367.9 314.1 356.3L314.1 354.2C314.1 342.5 314.1 336.7 310.5 333.1C306.8 329.4 301 329.4 289.4 329.4L287.3 329.4C275.6 329.4 269.8 329.4 266.2 333.1ZM271.2 345.1C271.5 358.5 278.2 366.6 290 366.6L290.6 366.6L290.6 358.9C295 359.3 298.2 362.5 299.5 366.6L305.6 366.6C304 360.5 299.6 357.1 296.8 355.8C299.6 354.2 303.4 350.4 304.3 345.1L298.8 345.1C297.6 349.4 294 353.2 290.6 353.6L290.6 345.1L285.1 345.1L285.1 360C281.7 359.1 277.3 355 277.1 345.1Z',
  num: 'M547.1 304.6C553.5 289.6 563.7 284.1 573.3 288.3C583 292.4 586.4 303.8 579.5 319.8C573.9 332.8 564.8 340 555.3 340.3L557.7 330.6C563.8 329.9 568.9 325.1 572.5 316.9C577 306.3 575.1 299.6 569.5 297.1C563.9 294.7 558 298.1 553.6 308.3C550.4 315.7 550.1 321.4 551.6 326.5L548.3 334.1L522.3 319.2L540.3 277.5L547.3 280.5L532.2 315.6L543.9 322.3C543.3 316.9 544.2 311.2 547.1 304.6Z',
  numS: 'M493.8 902C510 900.1 519.9 906.1 521.1 916.6C522.3 927 514.2 935.7 497 937.7C482.8 939.4 472.1 935.1 467.1 927L476.6 924.2C480.3 929.2 487.1 931.2 495.9 930.2C507.3 928.8 512.2 923.8 511.5 917.7C510.8 911.6 504.9 908.2 493.9 909.5C485.8 910.5 480.8 913 477.2 916.9L468.9 917.9L468.8 887.9L513.9 882.5L514.8 890.2L476.9 894.6L476.9 908.1C481.2 904.9 486.6 902.9 493.8 902Z',
};
// паттерн «полосы VK» со слайда «варианты паттернов»: одна клетка 116,7 × 125
const BAND = 'M48 0C56.1 47.3 77.1 90.2 107.2 125L48 125C23.4 88.1 6.8 45.7 0 0Z';
const BAND_W = 116.7, BAND_H = 125;

/* зоны формы: что перекрашивается и в каком порядке рисуется */
const ZONES = [
  { z: 'sleeveL', d: ['sleeveL'] },
  { z: 'sleeveR', d: ['sleeveR'] },
  { z: 'body',    d: ['body'] },
  { z: 'bodyR',   d: ['bodyR'] },
  { z: 'collar',  d: ['collarB', 'collarL', 'collarR'] },
  { z: 'shorts',  d: ['shorts'] },
  { z: 'shortsR', d: ['shortsR'] },
];
const TEX = ['logos', 'waves', 'type', 'team'];
const ELEMS = ['logos', 'fill', 'waves', 'grad', 'type', 'team'];   // порядок — как на слайде «Конструктор»

/* ---------- общие для формы и легенды определения: градиенты и паттерны ---------- */
function defsHTML(k){
  const grads = GRADS.map((g, i) => {
    const r = g.a * Math.PI / 180;   // CSS-угол → вектор в рамке зоны
    const dx = Math.sin(r) / 2, dy = -Math.cos(r) / 2;
    return `<linearGradient id="${k}g${i}" x1="${.5 - dx}" y1="${.5 - dy}" x2="${.5 + dx}" y2="${.5 + dy}">${
      g.c.map((c, j) => `<stop offset="${j / (g.c.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  }).join('');
  return `<defs>${grads}
    <symbol id="${k}logo" viewBox="262.5 329.4 51.6 51.6"><path d="${KIT.logo}" fill-rule="evenodd"/></symbol>
    <pattern id="${k}logos" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)">
      <use href="#${k}logo" x="6" y="6" width="15" height="15" fill="#fff" opacity=".2"/></pattern>
    <pattern id="${k}waves" width="${BAND_W}" height="${BAND_H}" patternUnits="userSpaceOnUse" patternTransform="scale(.62)">
      <path d="${BAND}" fill="#000" opacity=".16"/></pattern>
    <pattern id="${k}type" width="230" height="230" patternUnits="userSpaceOnUse">
      <image href="${img('tex-type.webp')}" width="230" height="230" opacity=".3"/></pattern>
    <pattern id="${k}team" width="300" height="255" patternUnits="userSpaceOnUse">
      <image href="${img('tex-team.webp')}" width="300" height="255" opacity=".38"/></pattern>
    <clipPath id="${k}shirt"><path d="${KIT.body}"/><path d="${KIT.sleeveL}"/><path d="${KIT.sleeveR}"/></clipPath>
  </defs>`;
}
const baseFill = (k, b) => b.g != null ? `url(#${k}g${b.g})` : b.c;
const baseLight = b => b.g != null ? light(GRADS[b.g].c[0]) && light(GRADS[b.g].c.at(-1)) : light(b.c);
const layerHTML = (k, zone, f) => `<g class="vs-lay">${zone.d.map(n =>
  `<path d="${KIT[n]}" fill="${baseFill(k, f.b)}"/>${f.t ? `<path d="${KIT[n]}" fill="url(#${k}${f.t})"/>` : ''}`).join('')}</g>`;

/* ---------- случайная команда: как в примерах из презентации — один основной цвет,
   на одном-двух местах паттерн или графика, акцент на рукаве и половине шорт ---------- */
const ACC = ['magenta', 'mint', 'black', 'purple', 'cyan'];
const solid = n => ({ c: PAL[n] });
const anyGrad = () => ({ g: Math.floor(Math.random() * GRADS.length) });
function team(){
  const main = rnd(['blue', 'blue', 'blue', 'blue', 'black', 'purple']);
  const m = solid(main);
  const acc = () => Math.random() < .45 ? anyGrad() : solid(rnd(ACC.filter(a => a !== main)));
  const tex = () => rnd([null, ...TEX]);
  const body = { b: m, t: rnd(TEX) };
  const bodyR = rnd([{ b: m, t: tex() }, { b: m, t: null }, { b: acc(), t: Math.random() < .4 ? rnd(TEX) : null }]);
  const sleeveL = rnd([{ b: m, t: 'logos' }, { b: acc(), t: null }, { b: m, t: tex() }]);
  const sleeveR = { b: acc(), t: null };
  const shorts = rnd([body, bodyR, sleeveL, { b: m, t: rnd(TEX) }]);
  const shortsR = rnd([bodyR, sleeveR, { b: m, t: null }, { b: acc(), t: null }]);
  const collar = { b: Math.random() < .6 ? solid('white') : m, t: null };
  return { body, bodyR, sleeveL, sleeveR, shorts, shortsR, collar };
}
// элемент конструктора → новая заливка зоны (основа зоны по возможности сохраняется)
function apply(el, f){
  if (el === 'fill') return { b: solid(rnd(['blue', 'magenta', 'mint', 'purple', 'black', 'cyan'].filter(c => PAL[c] !== f.b.c))), t: null };
  if (el === 'grad') return { b: anyGrad(), t: null };
  return { b: f.b.g != null && Math.random() < .5 ? solid('blue') : f.b, t: el };
}

/* ---------- текст главы ---------- */
const block = (c, extra = '') => `<div class="vs-col">
  <span class="case-label vs-label">${H.T(c.label)}</span>
  <h2 class="vs-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="vs-text">${H.T(c.text)}</p>` : ''}${extra}
</div>`;
const chapter = (k, viz, c, rev, extra = '') =>
  `<section class="vs-ch wrap vs-split vs-${k}${rev ? ' rev' : ''}"><div class="vs-viz">${viz}</div>${block(c, extra)}</section>`;

/* ================================================================
   teams — фото команд мозаикой: каждое медленно наезжает,
   наведение выделяет одно, остальные гаснут
   ================================================================ */
const teamsHTML = c => `<div class="vs-mosaic">${c.photos.map((p, i) =>
  `<figure class="vs-ph vs-ph${i + 1}" style="--i:${i}"><img src="${img(p)}" alt="" loading="lazy" decoding="async"></figure>`).join('')}</div>`;

/* ================================================================
   palette — полосы палитры слетаются из разнобоя, под ними градиенты:
   сначала полосы цветов, потом они перетекают друг в друга (--vs-s)
   ================================================================ */
function gradCSS(g){
  const n = g.c.length;
  return `linear-gradient(${g.a}deg,${g.c.map((c, i) => {
    const a = i / n, b = (i + 1) / n, m = n > 1 ? i / (n - 1) : 0;
    return `${c} calc((${a.toFixed(3)} + ${(m - a).toFixed(3)} * var(--vs-s)) * 100%) calc((${b.toFixed(3)} + ${(m - b).toFixed(3)} * var(--vs-s)) * 100%)`;
  }).join(',')})`;
}
function paletteHTML(c){
  return `<div class="vs-pal">
    <div class="vs-stripes">${c.colors.map((s, i) => `<button type="button" class="vs-stripe" style="--c:${s.hex};--w:${s.w};--i:${i};--r:${(Math.random() * 50 - 25).toFixed(0)}deg;--y:${(Math.random() * 60 - 30).toFixed(0)}%"${light(s.hex) ? ' data-light' : ''}>
      <span class="vs-sw-t"><b>${esc(s.name)}</b><span>${esc(s.hex)}</span>${s.pantone ? `<span>Pantone ${esc(s.pantone)}</span>` : ''}</span></button>`).join('')}</div>
    <div class="vs-grads">${GRADS.map((g, i) => `<i style="background:${gradCSS(g)};--i:${i}"></i>`).join('')}</div>
  </div>`;
}
function livePalette(box){
  const pal = box.querySelector('.vs-pal');
  let t, soft = false, on = false;
  const tick = () => { soft = !soft; pal.classList.toggle('soft', soft); t = setTimeout(tick, soft ? 4200 : 2600); };
  onScreen(pal, v => {
    on = v;
    if (v) pal.classList.add('in');
    clearTimeout(t);
    if (v && !still()) t = setTimeout(tick, 1400);
    else if (still()) pal.classList.add('soft');
  }, .35);
  // на телефоне подпись полосы — по нажатию
  pal.querySelectorAll('.vs-stripe').forEach(s => s.addEventListener('click', () => {
    pal.querySelectorAll('.vs-stripe.on').forEach(o => o !== s && o.classList.remove('on'));
    s.classList.toggle('on');
  }));
}

/* ================================================================
   kit — конструктор формы
   ================================================================ */
function kitHTML(c, k){
  const z = ZONES.map(zz => `<g class="vs-z" data-z="${zz.z}"></g>`).join('');
  return `<div class="vs-kitbox">
    <svg class="vs-kitsvg" viewBox="80 175 560 805" role="img" aria-label="${esc(H.pick(c.aria))}">${defsHTML(k)}
      <path class="vs-neck" d="${KIT.neck}"/>
      ${z}
      <path class="vs-belt" d="${KIT.belt}"/>
      <g class="vs-line" fill="none"><path d="${KIT.body}"/><path d="${KIT.sleeveL}"/><path d="${KIT.sleeveR}"/><path d="${KIT.shorts}"/><path d="${KIT.collarL}"/><path d="${KIT.collarR}"/><path d="${KIT.collarB}"/><path d="${KIT.hem}"/></g>
      <path class="vs-str" d="${KIT.string}"/>
      <g class="vs-mark">
        <path class="vs-m-logo" d="${KIT.logo}" fill-rule="evenodd" transform="translate(71 0)"/>
        <path class="vs-m-num" d="${KIT.num}"/>
        <path class="vs-m-nums" d="${KIT.numS}"/>
        <path class="vs-m-logos" d="${KIT.logo}" fill-rule="evenodd" transform="translate(200 897) scale(.83) translate(-262.5 -329.4)"/>
      </g>
    </svg>
  </div>`;
}
const legendHTML = (c, k) => `<div class="vs-legend">${ELEMS.map((e, i) => {
  const sw = e === 'fill' ? `<rect width="40" height="40" fill="${PAL.cyan}"/>`
    : e === 'grad' ? `<rect width="40" height="40" fill="url(#${k}g0)"/>`
    : `<rect width="40" height="40" fill="${PAL.blue}"/><rect width="40" height="40" fill="url(#${k}${e})"/>`;
  return `<button type="button" class="vs-el" data-e="${e}" style="--i:${i}"><svg viewBox="0 0 40 40" aria-hidden="true">${sw}</svg><span>${H.T(c.parts[e])}</span></button>`;
}).join('')}</div>`;
function liveKit(box, c, k){
  const svg = box.querySelector('.vs-kitsvg');
  const els = Object.fromEntries([...box.querySelectorAll('.vs-el')].map(b => [b.dataset.e, b]));
  const groups = Object.fromEntries([...svg.querySelectorAll('.vs-z')].map(g => [g.dataset.z, g]));
  const st = {};
  const marks = () => {
    // логотип и номер белые; на светлой зоне — синие
    const on = (n, zs) => svg.querySelector(n).classList.toggle('dark', zs.some(z => st[z] && baseLight(st[z].b)));
    on('.vs-m-logo', ['body']); on('.vs-m-num', ['sleeveR']);
    on('.vs-m-nums', ['shortsR']); on('.vs-m-logos', ['shorts']);
  };
  const set = (z, f, delay = 0) => {
    st[z] = f;
    const g = groups[z], zone = ZONES.find(zz => zz.z === z);
    const go = () => {
      g.insertAdjacentHTML('beforeend', layerHTML(k, zone, f));
      const lay = g.lastElementChild;
      if (!still() && g.children.length > 1) {
        lay.classList.add('new');
        setTimeout(() => { while (g.children.length > 1) g.firstElementChild.remove(); lay.classList.remove('new'); }, 700);
      } else while (g.children.length > 1) g.firstElementChild.remove();
      marks();
    };
    delay ? setTimeout(go, delay) : go();
  };
  const ping = e => { const b = els[e]; if (!b || still()) return; b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); };
  const elOf = f => f.b.g != null ? 'grad' : f.t || 'fill';
  const whole = (stagger = 0) => { const t = team(); ZONES.forEach((zz, i) => set(zz.z, t[zz.z], stagger * i)); };
  whole();
  const change = (z, el) => {
    el = el || rnd(ELEMS);
    if (z === 'collar' && TEX.includes(el)) el = 'fill';
    set(z, apply(el, st[z])); ping(elOf(st[z]));
  };
  // нажатие на зону — новая заливка; элемент легенды — на следующую зону по кругу
  let idleUntil = 0, turn = 0;
  const touched = () => { idleUntil = performance.now() + 9000; };
  svg.addEventListener('click', e => {
    const g = e.target.closest('.vs-z'); if (!g) return;
    touched(); change(g.dataset.z);
  });
  const order = ['body', 'sleeveL', 'bodyR', 'shorts', 'sleeveR', 'shortsR'];
  Object.values(els).forEach(b => b.addEventListener('click', () => {
    touched(); change(order[turn++ % order.length], b.dataset.e);
  }));
  box.querySelector('.vs-again')?.addEventListener('click', () => { touched(); whole(70); });
  // без касания форма собирается сама: по одной зоне, иногда — целиком новая команда
  let on = false, n = 0, timer;
  const loop = () => {
    clearTimeout(timer);
    if (!on || still()) return;
    timer = setTimeout(() => {
      if (performance.now() > idleUntil) {
        if (++n % 5 === 0) whole(80);
        else change(rnd(order));
      }
      loop();
    }, 1900);
  };
  onScreen(box, v => { on = v; loop(); }, .3);
}

/* ================================================================
   honor — графика достижений на canvas
   0 фото → 1 гравюра (линия проходит слева направо) → 2 паттерн
   (полосы VK проявляются по одной) → 3 на форме (готовые формы)
   ================================================================ */
const HW = 960, HH = 667;
function honorHTML(c){
  return `<div class="vs-tabs" role="tablist">${c.steps.map((s, i) =>
    `<button type="button" class="vs-tab" role="tab" data-i="${i}" aria-selected="${i ? 'false' : 'true'}">${H.T(s)}<i class="vs-tick"></i></button>`).join('')}</div>
  <div class="vs-honor-box">
    <canvas class="vs-honor-cv" width="${HW}" height="${HH}"></canvas>
    <div class="vs-honor-kits">${c.kits.map(s => `<img src="${img(s)}" alt="" loading="lazy" decoding="async">`).join('')}</div>
  </div>`;
}
// гравюра: волнистые строки, толщина линии — по темноте фото (как фильтр Wave в Фотошопе)
function engrave(photo, ink){
  const cv = document.createElement('canvas'); cv.width = HW; cv.height = HH;
  const x = cv.getContext('2d');
  const sc = Math.max(HW / photo.naturalWidth, HH / photo.naturalHeight);
  x.drawImage(photo, (HW - photo.naturalWidth * sc) / 2, (HH - photo.naturalHeight * sc) / 2, photo.naturalWidth * sc, photo.naturalHeight * sc);
  const px = x.getImageData(0, 0, HW, HH).data;
  const lum = (X, Y) => {
    X = Math.max(0, Math.min(HW - 1, X | 0)); Y = Math.max(0, Math.min(HH - 1, Y | 0));
    const o = (Y * HW + X) * 4;
    return (px[o] * .3 + px[o + 1] * .59 + px[o + 2] * .11) / 255;
  };
  const out = document.createElement('canvas'); out.width = HW; out.height = HH;
  const o = out.getContext('2d');
  o.fillStyle = ink;
  const s = 7, k = Math.PI * 2 / 46, amp = 5;
  for (let r = -1; r * s < HH + s; r++) {
    const top = [], bot = [];
    for (let X = 0; X <= HW; X += 3) {
      const yc = r * s + s / 2 + Math.sin(X * k) * amp;
      let d = 1 - Math.pow(lum(X, yc), .72);   // синяя форма темная — светлее, чтобы проступили лица
      d = Math.max(0, Math.min(1, (d - .24) / .5));
      const t = Math.max(.45, d * s) / 2;
      top.push([X, yc - t]); bot.push([X, yc + t]);
    }
    o.beginPath();
    top.forEach(([X, Y], i) => i ? o.lineTo(X, Y) : o.moveTo(X, Y));
    for (let i = bot.length - 1; i >= 0; i--) o.lineTo(bot[i][0], bot[i][1]);
    o.closePath(); o.fill();
  }
  return out;
}
function liveHonor(box, c){
  const cv = box.querySelector('.vs-honor-cv'), x = cv.getContext('2d');
  const kits = box.querySelector('.vs-honor-kits');
  const tabs = [...box.querySelectorAll('.vs-tab')];
  const photo = new Image(); photo.crossOrigin = 'anonymous'; photo.decoding = 'async';
  let black, blue, ready = false;
  // полосы VK: три колонки по четыре клетки, на всю высоту кадра
  const sc = HH / (BAND_H * 4), cols = Math.ceil(HW / (BAND_W * sc)) + 1;
  const bands = [];
  for (let col = 0; col < cols; col++) for (let row = 0; row < 4; row++) {
    const p = new Path2D(), m = new DOMMatrix().translate(col * BAND_W * sc - BAND_W * sc * .35, row * BAND_H * sc).scale(sc);
    p.addPath(new Path2D(BAND), m);
    bands.push({ p, at: (col + row * .6) / (cols + 2.4) });
  }
  const cover = () => {
    const k = Math.max(HW / photo.naturalWidth, HH / photo.naturalHeight);
    x.drawImage(photo, (HW - photo.naturalWidth * k) / 2, (HH - photo.naturalHeight * k) / 2, photo.naturalWidth * k, photo.naturalHeight * k);
  };
  const DUR = [2600, 3000, 3200, 3400];
  let step = 0, t0 = 0, raf = 0, on = false, user = false;
  const draw = now => {
    const t = Math.min(1, (now - t0) / DUR[step]);
    x.clearRect(0, 0, HW, HH);
    if (step === 0) { cover(); }
    if (step === 1) {
      const p = Math.min(1, t / .75), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, X = e * HW;
      cover();
      x.save(); x.beginPath(); x.rect(0, 0, X, HH); x.clip();
      x.fillStyle = '#fff'; x.fillRect(0, 0, X, HH); x.drawImage(black, 0, 0); x.restore();
      if (p < 1) { x.fillStyle = PAL.blue; x.fillRect(X - 2, 0, 4, HH); }
    }
    if (step >= 2) {
      // вне полос — синий с тенью гравюры, в полосах — гравюра целиком на светлом
      x.fillStyle = PAL.blue; x.fillRect(0, 0, HW, HH);
      x.globalAlpha = .3; x.drawImage(blue, 0, 0); x.globalAlpha = 1;
      bands.forEach(b => {
        const a = step === 3 ? 1 : Math.max(0, Math.min(1, (t * 1.25 - b.at) / .22));
        if (!a) return;
        x.save(); x.clip(b.p); x.globalAlpha = a;
        x.fillStyle = '#E6F0FF'; x.fillRect(0, 0, HW, HH);
        x.drawImage(blue, 0, 0); x.restore();
      });
    }
    kits.classList.toggle('on', step === 3);
    if (t >= 1 && !user) go((step + 1) % 4, now);
    if (on && !still()) raf = requestAnimationFrame(draw);
  };
  const go = (i, now = performance.now()) => {
    step = i; t0 = now;
    tabs.forEach((b, j) => {
      b.setAttribute('aria-selected', String(j === i));
      b.style.setProperty('--ms', DUR[i] + 'ms');
      b.classList.remove('run'); if (j === i && !user && !still()) { void b.offsetWidth; b.classList.add('run'); }
    });
  };
  tabs.forEach((b, i) => b.addEventListener('click', () => {
    user = true; go(i); t0 = performance.now() - (i === 1 || i === 2 ? 0 : DUR[i]);
    if (still() || !on) requestAnimationFrame(draw);
  }));
  photo.onload = () => {
    try { black = engrave(photo, '#000'); blue = engrave(photo, '#0047B8'); } catch (e) { console.warn('гравюра не собралась', e); return; }
    ready = true;
    if (still()) { go(2); t0 = -1e9; draw(performance.now()); }
    else if (on) { go(0); raf = requestAnimationFrame(draw); }
  };
  photo.src = img(c.photo);
  onScreen(box, v => {
    on = v; cancelAnimationFrame(raf);
    if (v && ready && !still()) { go(step, performance.now() - (DUR[step] * .0)); raf = requestAnimationFrame(draw); }
  }, .3);
}

/* ================================================================
   art — шторка «оригинальная графика / перерисованная»:
   ходит сама, пока не тронули; курсор или палец двигает
   ================================================================ */
function artHTML(c){
  const src = n => `${img(n + '.webp')}" srcset="${img(n + '-s.webp')} 900w, ${img(n + '.webp')} 1800w" sizes="(max-width: 900px) 100vw, 58vw`;
  return `<div class="vs-shut" style="--x:50%">
    <img class="vs-shut-b" src="${src(c.to)}" alt="" loading="lazy" decoding="async">
    <img class="vs-shut-a" src="${src(c.from)}" alt="" loading="lazy" decoding="async">
    <span class="vs-shut-line" aria-hidden="true"><i></i></span>
    <span class="vs-shut-l a">${H.T(c.fromLabel)}</span><span class="vs-shut-l b">${H.T(c.toLabel)}</span>
  </div>`;
}
function liveArt(box){
  const sh = box.querySelector('.vs-shut');
  let raf = 0, on = false, user = 0, t0 = performance.now();
  const set = p => sh.style.setProperty('--x', (p * 100).toFixed(2) + '%');
  const move = e => {
    const r = sh.getBoundingClientRect();
    set(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); user = performance.now();
  };
  sh.addEventListener('pointermove', move);
  sh.addEventListener('pointerdown', e => { move(e); sh.setPointerCapture?.(e.pointerId); });
  const loop = now => {
    if (now - user > 3500) set(.5 + Math.sin((now - t0) / 1700) * .38);
    if (on) raf = requestAnimationFrame(loop);
  };
  onScreen(sh, v => { on = v; cancelAnimationFrame(raf); if (v && !still()) raf = requestAnimationFrame(loop); }, .2);
}

/* ================================================================
   lineup — двенадцать форм из презентации лентой: едут сами,
   наведение останавливает, нажатие — крупно
   ================================================================ */
function lineupHTML(c){
  const one = c.kits.map((s, i) => `<button type="button" class="vs-k" data-i="${i}" aria-label="${esc(H.pick(c.open))}"><img src="${img(s)}" alt="" loading="lazy" decoding="async"></button>`).join('');
  return `<div class="vs-line-wrap"><div class="vs-belt-row"><div class="vs-run">${one}</div><div class="vs-run" aria-hidden="true">${one}</div></div></div>`;
}
function liveLineup(box, c){
  const first = [...box.querySelectorAll('.vs-run:first-child .vs-k img')];
  const list = c.kits.map(s => img(s));
  box.querySelectorAll('.vs-k').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i;
    H.openViewer(list, i, first);
  }));
  onScreen(box, v => box.classList.toggle('run', v && !still()), .1);
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'sport.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountSport(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const s = p.sport, k = 'vs' + (++uid) + '-';
  const kitCol = s.kit ? legendHTML(s.kit, k) + (s.kit.again ? `<button type="button" class="btn btn-line vs-again">${H.T(s.kit.again)}</button>` : '') : '';
  mount.innerHTML =
      (s.teams   ? chapter('teams', teamsHTML(s.teams), s.teams) : '')
    + (s.palette ? chapter('palette', paletteHTML(s.palette), s.palette, true) : '')
    + (s.kit     ? chapter('kit', kitHTML(s.kit, k), s.kit, false, kitCol) : '')
    + (s.honor   ? chapter('honor', honorHTML(s.honor), s.honor, true) : '')
    + (s.art     ? chapter('art', artHTML(s.art), s.art) : '')
    + (s.lineup  ? `<section class="vs-ch vs-lineup"><div class="wrap vs-lineup-head">${block(s.lineup)}</div>${lineupHTML(s.lineup)}</section>` : '');
  mount.querySelectorAll('.vs-ch').forEach(el => reveal.observe(el));
  const q = c => mount.querySelector(c);
  if (s.palette) livePalette(q('.vs-palette'));
  if (s.kit) liveKit(q('section.vs-kit'), s.kit, k);
  if (s.honor) liveHonor(q('.vs-honor'), s.honor);
  if (s.art) liveArt(q('.vs-art'));
  if (s.lineup) liveLineup(q('.vs-lineup'), s.lineup);
}
