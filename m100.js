/* ================================================================
   КЕЙС «РЕБРЕНДИНГ М100» (поле m100 у проекта, страница NDA)
   build    — в самом начале, выше задачи: синяя полоса во всю ширину
              сайта, узор из черточек и точек; элементы из середины
              слетаются в знак, потом появляется надпись (как в ролике
              презентации). Повторяется, когда полоса снова на экране,
              и по нажатию;
   before   — шторка «было / стало»: старый сайт и новый (экран ноутбука),
              под ней наброски заказчика по одному, без подложки;
   family   — на одном экране: иконки VK с М100 в цвете и ряд монохромных
              версий (на слайде их шесть) с М100 в середине;
   search   — шесть вариантов сразу, без подложек: три направления и опции
              первого; финальный — в ролике следующей главы;
   motion   — ролик из презентации: узор собирается в знак (играет, пока
              виден, без звука; кнопка «со звуком»);
   versions — знак на белом, синем, сером и черном; ниже три версии;
   space    — охранное поле: оба поля на схеме, подписи под ней;
   pattern  — фото решеток стоек и шкафов, ниже узор сразу на синем, белом
              и черном (три панели, без переключения): элементы мигают, курсор
              или палец переставляет черточки и точки; текст — в две колонки;
   palette  — полосы палитры в долях как на слайде, синие рядом;
   merch    — носители целыми кадрами (служебные подписи слайдов закрашены)
              журнальной сеткой: тонкая линия над строкой, название и подпись
              в колонке, раскладки строк чередуются; ежедневник и ланьярд —
              вырезки без белого фона прямо рядом с текстом; крупно по нажатию;
              надписи с мерча — в тексте и подписях (отдельной главы нет).
   Знак, варианты и надпись M100 — вектор прямо здесь (надпись обведена
   со слайда «финальная версия»). Картинки — img/m100.
   Тексты — в content.js, оформление — m100.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
const img = n => H.base + 'img/m100/' + n;
const pic = (n, sizes = '(max-width: 900px) 100vw, 50vw') =>
  `src="${img(n + '.webp')}" srcset="${img(n + '-s.webp')} 900w, ${img(n + '.webp')} 1800w" sizes="${sizes}"`;
// светлые картинки — с серой рамкой
const LIGHT = ['pen', 'diary', 'bottles', 'lanyard', 'email'];

/* ================================================================
   ЗНАК: viewBox 0 0 100 100
   ================================================================ */
const BLUE = '#0077FF', DARK = '#005EFF', BLACK = '#000', CYAN = '#00D3E6', SKY = '#77BEFF';
// форма иконок VK — суперэллипс
const SQ = (() => {
  const n = 4.3, p = [];
  for (let i = 0; i < 120; i++) {
    const a = i / 120 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    p.push((50 + 50 * Math.sign(c) * Math.abs(c) ** (2 / n)).toFixed(2) + ' ' + (50 + 50 * Math.sign(s) * Math.abs(s) ** (2 / n)).toFixed(2));
  }
  return 'M' + p.join('L') + 'Z';
})();
const rr = (x, y, w, h, r) => {
  r = Math.min(r, h / 2, w / 2);
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
};
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
// линия между синей и черной половинами чуть выгнута влево
const SPLIT = 'M52.3 -2C48 33 48 67 52.7 102H102V-2Z';
const ROWS = [24.2, 53.2], PX = 9.8, PW = 78.8, PH = 22.8, PR = 9;
const DASH = { x: 16.4, w: 32.4, h: 10, dy: 6.4 }, DOT = { cx: 57.9, r: 5.3 };
const server = (fill, inner) => ROWS.map(y => `<path d="${rr(PX, y, PW, PH, PR)}" fill="${fill}"/>` + inner(y)).join('');
const dash = (x, w, y, c) => `<path d="${rr(x, y + DASH.dy, w, DASH.h, DASH.h / 2)}" fill="${c}"/>`;
const dot = (cx, y, c, r = DOT.r) => `<circle cx="${cx}" cy="${y + PH / 2}" r="${r}" fill="${c}"/>`;

// варианты по порядку: три направления, три опции первого, финальный
const VARIANTS = [
  { L: BLUE, R: BLACK, body: () => server('#fff', y => dot(56.5, y, BLACK, 5.6)
      + `<path d="${rr(63, y + 5.9, 19, 11, 5.5)}" fill="${BLACK}"/><path d="${rr(66.2, y + 9.1, 12.6, 4.6, 2.3)}" fill="#fff"/>`) },
  { body: () => `<rect x="-2" y="-2" width="104" height="104" fill="${CYAN}"/>
      <path d="M-2 -2H102V3Q100 13 86 13H-2Z" fill="${BLACK}"/>
      <path d="${rr(-12, 19, 104, 37, 16)}" fill="${BLACK}"/><path d="${rr(-12, 61, 104, 44, 16)}" fill="${BLACK}"/>
      <circle cx="32" cy="37.5" r="8.5" fill="${CYAN}"/><path d="${rr(47, 31, 30, 13, 6.5)}" fill="${CYAN}"/>
      <circle cx="32" cy="80" r="8.5" fill="${CYAN}"/><path d="${rr(47, 73.5, 30, 13, 6.5)}" fill="${CYAN}"/>` },
  { L: CYAN, R: BLUE, body: () => server(BLACK, y => `<path d="${rr(68.5, y + 6.9, 15, 9, 4.5)}" fill="#fff"/>`) },
  { L: BLUE, R: BLACK, body: () => server('#fff', y => dash(DASH.x, 21, y, BLACK) + dot(45.5, y, BLACK)) },
  { L: BLUE, R: SKY,   body: () => server('#fff', y => dash(DASH.x, 31, y, SKY) + dot(56, y, SKY)) },
  { L: BLUE, R: BLACK, body: () => server('#fff', y => dash(DASH.x, 21, y, BLACK) + dot(80, y, BLACK)) },
  { L: BLUE, R: BLACK, body: () => server('#fff', y => dash(DASH.x, DASH.w, y, BLACK) + dot(DOT.cx, y, BLACK)), final: true },
];
const FINAL = VARIANTS[VARIANTS.length - 1];

let uid = 0;
// цветной знак: половины и панели, обрезанные по форме
const colorBody = v => {
  const id = 'mhc' + (++uid);
  return `<defs><clipPath id="${id}"><path d="${SQ}"/></clipPath></defs><g clip-path="url(#${id})">${
    v.L ? `<rect x="-2" y="-2" width="104" height="104" fill="${v.L}"/><path d="${SPLIT}" fill="${v.R}"/>` : ''}${v.body()}</g>`;
};
// монохромный: контур и панели, черточка и точка — вырезы (видно фон)
const PILLS_CUT = ROWS.map(y => rr(PX, y, PW, PH, PR) + rr(DASH.x, y + DASH.dy, DASH.w, DASH.h, DASH.h / 2) + circ(DOT.cx, y + PH / 2, DOT.r)).join('');
const monoBody = () => `<path d="${SQ}" fill="none" stroke="currentColor" stroke-width="4.4" transform="translate(2.2 2.2) scale(.956)"/>
  <path d="${PILLS_CUT}" fill="currentColor" fill-rule="evenodd"/>`;
// технический: залитая форма, панели — вырезы, черточка и точка — залиты
const techBody = () => `<path d="${SQ + ROWS.map(y => rr(PX, y, PW, PH, PR)).join('')}" fill="currentColor" fill-rule="evenodd"/>
  <path d="${ROWS.map(y => rr(DASH.x, y + DASH.dy, DASH.w, DASH.h, DASH.h / 2) + circ(DOT.cx, y + PH / 2, DOT.r)).join('')}" fill="currentColor"/>`;
const BODY = { color: () => colorBody(FINAL), mono: monoBody, tech: techBody };
const markSVG = (body, cls = '') => `<svg class="mh-mk ${cls}" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;

// надпись M100: обводка со слайда «финальная версия»
const WORD_D = 'M12860 7085 c-90 -8 -169 -21 -209 -35 -35 -12 -89 -26 -120 -32 -30 -5 -67 -18 -81 -27 -14 -10 -47 -23 -74 -30 -26 -6 -65 -23 -85 -36 -19 -14 -42 -25 -51 -25 -8 0 -35 -14 -60 -30 -25 -16 -48 -30 -53 -30 -10 0 -94 -56 -176 -117 -35 -27 -78 -58 -96 -70 -39 -26 -249 -234 -290 -287 -16 -22 -47 -61 -67 -88 -21 -27 -38 -52 -38 -57 0 -4 -9 -16 -20 -26 -11 -10 -31 -37 -44 -59 -12 -23 -40 -70 -61 -106 -37 -64 -67 -117 -98 -175 -28 -50 -87 -192 -87 -206 0 -8 -9 -29 -20 -47 -11 -17 -25 -53 -31 -80 -7 -26 -20 -63 -30 -83 -9 -19 -22 -64 -29 -100 -6 -35 -19 -84 -29 -109 -11 -25 -26 -92 -35 -150 -8 -58 -21 -123 -29 -145 -8 -22 -20 -114 -26 -205 -7 -91 -16 -212 -22 -269 -24 -275 19 -1025 65 -1099 3 -5 10 -48 16 -96 6 -49 19 -105 29 -125 10 -20 24 -70 31 -111 7 -41 22 -95 35 -120 12 -25 25 -62 28 -83 3 -20 15 -50 26 -66 11 -15 25 -49 31 -75 6 -26 22 -64 35 -84 14 -20 25 -43 25 -52 0 -8 14 -35 30 -60 16 -25 30 -52 30 -60 0 -8 14 -35 30 -60 16 -25 30 -49 30 -54 0 -4 12 -22 26 -40 14 -17 45 -61 68 -97 116 -182 316 -397 483 -519 121 -89 209 -145 251 -162 24 -9 50 -22 58 -29 20 -16 113 -56 189 -81 33 -11 79 -28 103 -39 24 -11 73 -24 110 -29 37 -6 96 -17 132 -26 144 -34 448 -44 600 -20 175 29 268 48 355 77 50 16 100 29 110 29 11 0 40 14 65 30 25 16 52 30 60 30 8 0 35 14 60 30 25 16 52 30 60 30 8 0 35 14 60 30 25 16 50 30 56 30 6 0 18 7 25 16 8 9 32 28 54 42 149 93 433 381 495 501 11 23 25 41 30 41 5 0 19 17 30 37 12 21 41 72 65 113 25 41 49 86 55 99 6 13 19 35 29 50 10 14 24 44 31 66 7 22 19 50 27 63 20 32 71 154 92 222 10 30 24 66 31 80 7 13 21 61 31 106 10 46 25 96 33 111 8 16 19 65 26 109 6 43 19 113 31 154 11 41 26 145 34 230 8 85 19 193 24 240 13 116 13 586 1 685 -6 44 -17 148 -25 231 -8 84 -26 198 -40 255 -14 57 -25 119 -25 137 0 17 -13 69 -29 115 -15 45 -31 104 -35 132 -5 27 -19 71 -32 97 -13 26 -24 55 -24 65 0 10 -11 40 -24 68 -25 51 -66 147 -93 219 -8 22 -22 51 -32 65 -10 14 -28 46 -40 71 -18 40 -100 175 -155 256 -11 16 -43 56 -71 89 -29 33 -56 68 -62 78 -17 32 -184 195 -245 239 -32 23 -58 46 -58 50 0 14 -237 166 -310 199 -14 6 -47 21 -75 34 -64 31 -179 74 -230 87 -22 5 -76 21 -119 35 -138 44 -492 62 -746 38z m494 -775 c54 -11 111 -27 125 -34 14 -7 50 -21 80 -31 30 -10 88 -41 129 -69 102 -69 320 -284 376 -371 25 -39 53 -81 63 -95 37 -51 84 -134 90 -159 3 -14 17 -48 30 -75 30 -59 67 -165 94 -265 11 -41 27 -87 34 -101 8 -15 19 -65 25 -111 5 -46 16 -104 24 -129 37 -121 60 -563 46 -888 -14 -311 -19 -364 -45 -482 -13 -58 -30 -139 -38 -180 -24 -115 -56 -229 -78 -271 -10 -21 -19 -46 -19 -55 0 -17 -59 -158 -85 -204 -8 -14 -28 -50 -45 -80 -42 -76 -87 -143 -173 -260 -33 -44 -211 -203 -278 -247 -19 -12 -54 -32 -79 -43 -24 -12 -51 -27 -59 -33 -18 -15 -160 -64 -226 -78 -28 -6 -139 -9 -265 -7 -196 3 -219 5 -255 24 -22 12 -56 25 -75 29 -50 10 -171 65 -200 91 -14 12 -39 29 -56 37 -68 34 -347 339 -371 405 -4 10 -22 39 -40 66 -18 26 -33 52 -33 58 0 5 -11 26 -25 46 -14 20 -25 46 -25 57 0 11 -14 47 -30 80 -16 33 -30 68 -30 78 0 10 -11 42 -24 70 -14 29 -30 80 -36 114 -6 34 -19 86 -30 117 -10 30 -21 81 -25 113 -9 78 -33 228 -46 283 -15 64 -23 672 -11 815 11 132 46 378 67 465 39 167 60 241 80 290 13 30 27 73 30 95 4 22 15 51 24 65 9 14 25 46 35 72 9 25 23 52 31 58 7 6 16 24 20 39 22 102 290 434 419 520 112 75 174 111 201 117 17 3 51 17 77 30 26 13 60 24 75 24 15 0 64 9 108 20 103 25 277 21 419 -10z M18085 7085 c-91 -8 -170 -21 -225 -38 -47 -14 -103 -28 -125 -32 -21 -4 -51 -15 -65 -24 -14 -10 -47 -23 -74 -30 -26 -6 -65 -23 -85 -36 -19 -14 -42 -25 -51 -25 -8 0 -35 -14 -60 -30 -25 -16 -48 -30 -53 -30 -10 0 -106 -65 -140 -95 -15 -14 -31 -25 -36 -25 -9 0 -49 -30 -130 -97 -120 -99 -319 -321 -360 -400 -12 -24 -25 -43 -30 -43 -4 0 -30 -37 -56 -82 -26 -46 -58 -100 -71 -120 -13 -21 -24 -41 -24 -45 0 -5 -11 -24 -24 -43 -12 -19 -29 -52 -36 -74 -7 -21 -25 -63 -41 -93 -16 -30 -29 -65 -29 -78 0 -12 -9 -34 -20 -47 -10 -14 -24 -47 -30 -72 -6 -26 -19 -64 -29 -84 -10 -21 -24 -68 -31 -107 -7 -38 -21 -88 -31 -111 -10 -22 -23 -81 -29 -130 -5 -49 -18 -114 -29 -144 -13 -38 -23 -108 -31 -230 -6 -96 -15 -215 -20 -265 -22 -209 2 -775 41 -970 11 -55 28 -150 38 -211 11 -61 26 -124 34 -140 8 -16 20 -63 27 -104 7 -41 22 -95 35 -120 12 -25 25 -62 28 -83 3 -20 15 -50 26 -66 11 -15 25 -49 31 -75 6 -26 22 -64 35 -84 14 -20 25 -43 25 -52 0 -8 14 -35 30 -60 16 -25 30 -52 30 -60 0 -8 14 -35 30 -60 16 -25 30 -49 30 -54 0 -4 12 -22 26 -40 14 -17 45 -61 68 -97 63 -100 191 -257 271 -334 99 -95 156 -145 192 -169 21 -15 79 -56 128 -91 50 -36 97 -68 105 -72 34 -13 96 -43 110 -52 29 -19 176 -79 210 -86 19 -4 52 -16 72 -26 20 -11 68 -23 105 -29 37 -5 106 -19 153 -30 175 -43 499 -38 720 10 25 5 76 14 113 20 37 5 85 19 107 30 21 11 58 22 82 26 23 4 64 19 89 35 25 16 52 29 60 29 8 0 34 14 59 30 25 16 52 30 60 30 8 0 35 14 60 30 25 16 49 30 54 30 4 0 23 12 42 27 18 16 56 44 85 63 140 95 392 357 448 467 12 24 26 43 31 43 5 0 19 17 30 37 12 21 41 72 65 113 25 41 49 86 55 99 6 13 19 36 30 50 10 15 27 49 38 77 11 27 37 87 57 134 20 47 45 110 54 140 10 30 25 69 33 85 8 17 21 62 28 100 7 39 21 86 31 106 9 19 22 66 28 105 5 38 21 119 35 179 13 61 27 157 31 215 3 58 10 128 15 155 20 105 31 418 21 590 -14 248 -39 510 -58 585 -17 73 -28 126 -42 220 -6 36 -19 88 -30 115 -11 28 -25 80 -31 115 -6 35 -22 84 -34 109 -13 25 -26 63 -29 83 -3 20 -17 54 -31 75 -14 21 -26 44 -26 52 0 15 -49 133 -78 186 -8 17 -29 55 -44 85 -16 30 -41 75 -56 100 -15 25 -36 60 -47 78 -25 43 -59 88 -132 180 -110 138 -168 200 -253 271 -47 39 -96 81 -110 94 -49 46 -236 165 -310 198 -14 6 -47 21 -75 34 -64 31 -179 74 -230 87 -22 5 -76 21 -120 35 -142 46 -464 62 -740 38z m489 -775 c54 -11 111 -27 125 -34 14 -7 50 -21 80 -31 54 -18 173 -94 241 -154 145 -128 254 -251 295 -332 10 -19 26 -43 36 -55 11 -11 28 -36 38 -55 10 -19 25 -47 34 -64 24 -45 63 -142 86 -214 11 -35 25 -69 30 -75 6 -6 17 -44 25 -83 8 -39 21 -84 30 -101 8 -16 20 -68 26 -115 6 -47 16 -103 24 -124 39 -110 62 -560 47 -903 -14 -306 -18 -346 -47 -465 -13 -55 -24 -114 -24 -130 0 -17 -7 -55 -16 -85 -8 -30 -24 -88 -35 -129 -11 -41 -29 -91 -40 -112 -10 -21 -19 -46 -19 -55 0 -9 -16 -53 -36 -98 -54 -123 -43 -103 -139 -264 -11 -19 -32 -50 -47 -70 -15 -21 -40 -55 -55 -76 -58 -82 -207 -219 -302 -279 -19 -12 -61 -38 -92 -59 -32 -20 -73 -39 -91 -43 -18 -4 -61 -18 -95 -31 -79 -32 -184 -40 -398 -33 -146 4 -176 8 -210 26 -22 11 -56 24 -75 28 -50 10 -171 65 -200 91 -14 12 -38 29 -55 37 -46 24 -225 202 -296 296 -63 83 -94 131 -142 221 -13 25 -32 59 -41 75 -9 17 -16 37 -16 45 0 8 -14 42 -30 75 -16 33 -30 70 -30 83 0 12 -10 42 -22 65 -12 23 -29 76 -39 117 -9 41 -26 113 -37 160 -21 84 -42 218 -68 420 -27 214 -15 814 19 947 9 32 21 108 27 168 7 61 23 142 35 180 13 39 26 90 30 115 4 25 16 61 26 81 10 20 23 58 30 85 12 51 83 209 99 219 4 3 11 18 15 34 22 102 289 433 419 520 112 75 174 111 201 117 17 3 51 17 77 30 26 13 60 24 75 24 15 0 64 9 108 20 103 25 277 21 419 -10z M828 7009 c-17 -9 -18 -154 -18 -2819 0 -2797 0 -2810 20 -2830 19 -19 33 -20 363 -20 188 0 352 -3 364 -6 14 -4 28 1 42 15 l21 21 0 2295 c0 2282 0 2295 20 2315 51 51 108 -1 156 -147 15 -43 34 -94 44 -113 9 -19 20 -52 23 -73 3 -20 15 -50 27 -66 11 -16 24 -49 29 -73 5 -24 23 -76 40 -117 17 -40 31 -78 31 -85 0 -6 11 -33 25 -61 13 -27 25 -59 25 -70 0 -11 14 -47 30 -80 16 -33 30 -67 30 -76 0 -9 11 -41 24 -70 14 -30 30 -76 37 -104 7 -27 20 -61 29 -75 10 -14 24 -50 33 -80 14 -54 34 -107 83 -220 13 -30 28 -76 34 -102 5 -25 18 -61 29 -80 10 -18 27 -60 36 -93 9 -33 25 -76 36 -97 10 -20 19 -45 19 -55 0 -10 14 -45 30 -78 16 -33 30 -69 30 -80 0 -11 12 -42 25 -70 14 -27 25 -55 25 -61 0 -7 14 -45 31 -85 17 -41 35 -93 40 -117 5 -24 18 -57 29 -73 12 -16 24 -46 27 -66 3 -21 14 -54 23 -73 10 -19 29 -71 44 -114 14 -44 31 -84 36 -91 5 -6 14 -33 20 -59 6 -27 20 -62 31 -77 11 -16 23 -46 26 -66 3 -21 14 -54 23 -73 10 -19 27 -66 39 -105 12 -38 28 -79 35 -90 8 -12 21 -46 29 -76 14 -53 35 -106 83 -219 13 -30 29 -77 34 -104 6 -27 19 -61 29 -75 10 -14 23 -48 30 -76 7 -27 23 -75 35 -105 59 -141 69 -169 83 -219 8 -30 21 -65 29 -76 8 -12 21 -46 30 -76 9 -30 26 -79 39 -109 13 -30 26 -71 29 -91 4 -21 19 -47 37 -65 l30 -29 360 -5 c198 -3 368 -2 378 2 24 9 78 106 91 163 6 26 19 58 29 73 11 15 22 45 26 66 4 22 19 65 35 96 16 31 32 74 36 96 4 21 18 59 31 83 12 24 23 52 23 61 0 9 11 37 23 61 13 24 27 62 31 83 4 22 20 65 36 96 16 31 31 74 35 96 4 21 15 51 26 66 10 15 23 48 29 75 6 26 20 62 31 79 10 17 19 39 19 49 0 9 15 52 34 95 19 43 38 95 41 117 4 21 15 50 25 64 10 14 24 46 30 70 7 24 21 61 31 81 10 20 19 45 19 55 0 10 14 47 31 83 16 35 36 91 44 123 7 32 19 65 27 74 7 9 23 43 34 77 48 136 58 164 85 226 15 36 30 81 34 100 4 19 16 51 26 70 10 19 27 60 38 90 10 30 34 93 51 140 18 47 41 112 52 145 12 33 31 82 44 109 13 28 24 57 24 65 0 8 13 44 28 80 27 63 39 93 83 221 11 30 28 73 38 95 11 22 28 67 39 100 10 33 28 83 39 110 22 53 32 82 67 181 11 34 27 68 34 77 8 9 20 42 27 74 8 32 28 88 44 123 17 36 31 73 31 84 0 10 9 33 19 50 11 17 25 53 31 79 6 27 19 60 29 75 11 15 22 45 26 67 9 54 73 183 100 201 26 17 68 6 79 -21 3 -9 6 -1046 6 -2304 0 -1865 2 -2290 13 -2305 12 -17 39 -18 380 -16 202 0 375 4 383 7 9 3 20 17 25 30 5 15 9 1136 9 2823 0 2757 0 2799 -19 2810 -29 15 -1242 14 -1275 -1 -17 -8 -31 -28 -42 -58 -9 -25 -23 -64 -31 -86 -36 -93 -76 -204 -95 -260 -11 -33 -26 -72 -34 -87 -8 -15 -25 -58 -38 -95 -13 -37 -38 -105 -55 -150 -44 -119 -86 -231 -122 -325 -17 -46 -44 -119 -61 -163 -16 -44 -39 -105 -49 -135 -11 -30 -28 -71 -38 -90 -10 -19 -22 -51 -26 -70 -4 -19 -19 -64 -34 -100 -27 -63 -39 -94 -87 -232 -12 -37 -29 -77 -37 -90 -8 -13 -18 -39 -22 -58 -4 -19 -19 -64 -34 -100 -15 -36 -36 -87 -45 -115 -10 -27 -27 -75 -37 -105 -11 -30 -28 -71 -38 -90 -10 -19 -22 -51 -26 -70 -4 -19 -19 -64 -34 -100 -27 -63 -39 -94 -87 -232 -12 -37 -29 -77 -37 -90 -8 -13 -18 -39 -22 -58 -4 -19 -19 -64 -34 -100 -27 -63 -39 -94 -87 -232 -12 -37 -29 -77 -37 -90 -8 -13 -18 -39 -22 -58 -4 -19 -19 -64 -34 -100 -27 -63 -39 -94 -87 -232 -12 -37 -29 -77 -37 -90 -8 -13 -18 -39 -22 -58 -4 -19 -19 -64 -34 -100 -26 -61 -36 -86 -82 -220 -11 -30 -26 -67 -35 -82 -8 -15 -22 -50 -30 -78 -16 -55 -44 -80 -89 -80 -47 0 -63 18 -94 107 -16 44 -36 94 -44 110 -8 15 -17 45 -20 66 -3 20 -15 51 -27 67 -12 16 -24 47 -27 67 -3 21 -15 55 -25 77 -11 21 -30 71 -43 110 -12 39 -30 85 -39 101 -9 17 -16 39 -16 50 0 11 -14 47 -30 80 -16 33 -30 68 -30 78 0 10 -11 39 -24 65 -12 26 -28 70 -35 97 -7 28 -21 65 -32 83 -11 19 -24 55 -29 80 -6 26 -21 73 -35 105 -14 31 -36 83 -50 115 -14 31 -30 79 -35 106 -6 27 -19 61 -29 75 -10 14 -23 49 -30 76 -7 28 -23 74 -37 104 -13 29 -24 61 -24 70 0 9 -14 43 -30 76 -16 33 -30 69 -30 80 0 11 -12 43 -25 70 -14 28 -25 55 -25 61 0 7 -14 45 -31 85 -17 41 -35 93 -40 117 -5 24 -18 56 -29 72 -11 16 -24 48 -29 72 -5 24 -23 76 -40 117 -17 40 -31 78 -31 85 0 6 -11 34 -25 61 -13 28 -25 59 -25 70 0 11 -14 47 -30 80 -16 33 -30 68 -30 78 0 10 -11 39 -24 65 -12 26 -29 70 -35 97 -7 28 -21 66 -32 85 -11 19 -25 58 -33 85 -13 49 -35 105 -82 215 -13 30 -29 77 -34 104 -6 27 -19 61 -29 75 -10 14 -23 49 -30 76 -7 28 -23 75 -35 105 -59 141 -69 169 -83 219 -8 30 -21 64 -28 75 -8 12 -25 57 -40 101 -14 44 -36 100 -48 125 l-22 45 -650 2 c-429 2 -656 -1 -667 -8z M8897 7005 c-13 -12 -16 -56 -16 -246 -1 -169 -5 -239 -15 -262 -22 -53 -73 -108 -139 -151 l-62 -41 -430 -5 c-236 -3 -436 -9 -442 -13 -21 -13 -18 -695 3 -725 l15 -22 523 0 c432 0 526 -2 535 -14 8 -10 12 -551 14 -2084 2 -1826 4 -2073 17 -2086 13 -13 73 -15 404 -16 363 -2 391 -1 403 16 18 25 19 5634 1 5652 -20 20 -792 17 -811 -3z';
const WORD = `<g transform="translate(0 756) scale(.1 -.1)"><path d="${WORD_D}"/></g>`;
// знак + надпись: пропорции и отступ как на слайде
const LOCK_W = 306.2;
const lockSVG = (ver, cls = '') => `<svg class="mh-lock ${cls}" viewBox="0 0 ${LOCK_W} 100" aria-hidden="true">
  <svg width="100" height="100" viewBox="0 0 100 100" overflow="visible">${BODY[ver]()}</svg>
  <svg x="134.2" y="24.6" width="172" height="50.84" viewBox="81 46 1976 584" class="mh-word" fill="currentColor">${WORD}</svg>
</svg>`;

/* ---------- текст главы ---------- */
const block = (c, extra = '') => `<div class="mh-col">
  <span class="case-label mh-label">${H.T(c.label)}</span>
  <h2 class="mh-title">${H.T(c.title)}</h2>
  ${c.text ? `<p class="mh-text">${H.T(c.text)}</p>` : ''}${extra}
</div>`;
const chapter = (k, viz, c, rev, extra = '') =>
  `<section class="mh-ch wrap mh-split mh-${k}${rev ? ' rev' : ''}"><div class="mh-viz">${viz}</div>${block(c, extra)}</section>`;

/* ---------- строка надписей с полоской таймера ---------- */
const tabsHTML = (tabs, cls = '') => `<div class="mh-tabs ${cls}" role="tablist">${tabs.map((t, i) =>
  `<button type="button" class="mh-tab" role="tab" data-k="${t.k}" aria-selected="${i ? 'false' : 'true'}">${H.T(t.t)}<i class="mh-tick"></i></button>`).join('')}</div>`;
// листает само, пока видно и пока не нажали; нажатие — дальше только руками
function autoTabs(box, tabsEl, ms, set){
  const tabs = [...tabsEl.querySelectorAll('.mh-tab')];
  let at = 0, t, on = false, hand = false;
  tabsEl.style.setProperty('--ms', ms + 'ms');
  const go = (i, run) => {
    at = (i + tabs.length) % tabs.length;
    tabs.forEach((b, j) => { b.setAttribute('aria-selected', j === at); b.classList.remove('run'); });
    if (run) { void tabs[at].offsetWidth; tabs[at].classList.add('run'); }
    set(tabs[at].dataset.k, at);
  };
  const next = () => {
    clearTimeout(t);
    if (!on || hand || still()) return;
    t = setTimeout(() => { go(at + 1, true); next(); }, ms);
  };
  tabs.forEach((b, i) => b.addEventListener('click', () => { hand = true; clearTimeout(t); go(i, false); }));
  onScreen(box, v => {
    on = v;
    if (v && !hand && !still()) { go(at, true); next(); } else clearTimeout(t);
  }, .35);
  go(0, false);
}

/* ================================================================
   узор: решетка, на каждой точке — пусто, точка или черточка;
   две черточки рядом не встают (как на слайде «паттерн»)
   ================================================================ */
function lattice(cols, rows, seed, empty = .55){
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const g = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const v = rnd(), prev = row[c - 1];
      row.push(v < empty ? 0 : v < empty + (1 - empty) * .45 ? 1 : (prev === 2 ? 0 : 2));   // 0 — пусто, 1 — точка, 2 — черточка
    }
    g.push(row);
  }
  return g;
}
// размеры элементов от шага сетки c: черточка 1,29c × 0,38c, точка 0,42c, строки через 0,52c
const EL = c => ({ dw: c * 1.29, dh: c * .38, d: c * .42, rh: c * .52 });

/* ================================================================
   build — узор слетается в знак
   ================================================================ */
const BW = 1600, BH = 800, BC = 80;
function buildHTML(c){
  return `<div class="mh-build" role="img" aria-label="${esc(H.pick(c.aria))}" title="${esc(H.pick(c.again))}">
    <svg class="mh-bd" viewBox="0 0 ${BW} ${BH}" preserveAspectRatio="xMidYMid slice">
      <g class="mh-bd-pat"></g>
      <g class="mh-bd-lock" transform="translate(${(BW - LOCK_W * 1.5) / 2} ${BH / 2 - 75}) scale(1.5)">
        <path class="mh-bd-sq" d="${SQ}" fill="none" stroke="#fff" stroke-width="4.4" transform="translate(2.2 2.2) scale(.956)" pathLength="1"/>
        <path class="mh-bd-pills" d="${PILLS_CUT}" fill="#fff" fill-rule="evenodd"/>
        <g class="mh-bd-word"><svg x="134.2" y="24.6" width="172" height="50.84" viewBox="81 46 1976 584" fill="#fff">${WORD}</svg></g>
      </g>
      <g class="mh-bd-fly"></g>
    </svg>
  </div>`;
}
function liveBuild(box){
  const svg = box.querySelector('svg'), pat = svg.querySelector('.mh-bd-pat'), fly = svg.querySelector('.mh-bd-fly');
  const e = EL(BC), cols = Math.ceil(BW / BC) + 1, rows = Math.ceil(BH / e.rh) + 1;
  const g = lattice(cols, rows, 7);
  // знак в координатах полосы
  const S = 1.5, MX = (BW - LOCK_W * S) / 2, MY = BH / 2 - 75;
  const zone = { x0: MX - 50, x1: MX + LOCK_W * S + 50, y0: MY - 40, y1: MY + 150 + 40 };
  const els = [];
  const NS = 'http://www.w3.org/2000/svg';
  g.forEach((row, r) => row.forEach((t, k) => {
    if (!t) return;
    const x = k * BC - BC * .3, y = r * e.rh + e.rh / 2;
    const w = t === 2 ? e.dw : e.d, h = t === 2 ? e.dh : e.d;
    const el = document.createElementNS(NS, 'rect');
    el.setAttribute('x', -w / 2); el.setAttribute('y', -h / 2); el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('rx', h / 2);
    el.setAttribute('fill', DARK);
    const inZone = x > zone.x0 && x < zone.x1 && y > zone.y0 && y < zone.y1;
    const near = Math.hypot((x - BW / 2) / 1.6, y - BH / 2);
    const item = { el, t, x, y, w, h, fly: inZone || (near < 330 && Math.random() < .35) };
    els.push(item);
    (item.fly ? fly : pat).appendChild(el);
    if (!item.fly) {
      el.setAttribute('transform', `translate(${x} ${y})`);
      if (Math.random() < .16) { el.classList.add('mh-blink'); el.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's'; }
    }
  }));
  // цели: две черточки и две точки встают в вырезы панелей, остальные «записываются» в панели и гаснут
  const flyers = els.filter(i => i.fly);
  const holes = [];
  ROWS.forEach(y => {
    holes.push({ t: 2, x: MX + (DASH.x + DASH.w / 2) * S, y: MY + (y + PH / 2) * S, w: DASH.w * S, h: DASH.h * S });
    holes.push({ t: 1, x: MX + DOT.cx * S, y: MY + (y + PH / 2) * S, w: DOT.r * 2 * S, h: DOT.r * 2 * S });
  });
  holes.forEach(hl => {
    let best, bd = 1e9;
    flyers.forEach(f => { if (f.t !== hl.t || f.target) return; const d = Math.hypot(f.x - hl.x, f.y - hl.y); if (d < bd) { bd = d; best = f; } });
    if (best) { best.target = hl; best.hole = true; }
  });
  flyers.forEach((f, i) => {
    if (f.target) return;
    const row = ROWS[i % 2];
    f.target = { x: MX + (PX + 8 + Math.random() * (PW - 16)) * S, y: MY + (row + PH / 2) * S, w: f.w * .35, h: f.h * .35 };
  });
  flyers.forEach(f => {
    f.delay = Math.random() * 520 + Math.hypot(f.x - BW / 2, f.y - BH / 2) * .55;
    f.bend = (Math.random() - .5) * 220;
  });
  const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  const DUR = 1500;
  let raf = 0, t0 = 0;
  const place = p => flyers.forEach(f => {
    const k = ease(Math.min(1, Math.max(0, (p - f.delay) / DUR)));
    const tg = f.target;
    const x = f.x + (tg.x - f.x) * k + Math.sin(k * Math.PI) * f.bend * .3;
    const y = f.y + (tg.y - f.y) * k + Math.sin(k * Math.PI) * f.bend * .12;
    const sx = 1 + (tg.w / f.w - 1) * k, sy = 1 + (tg.h / f.h - 1) * k;
    f.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
    // «записанные» гаснут, когда долетели; в вырезах — становятся цветом фона
    f.el.style.opacity = f.hole ? 1 : (1 - Math.max(0, (k - .7) / .3)).toFixed(3);
  });
  const END = Math.max(...flyers.map(f => f.delay)) + DUR;
  const frame = now => {
    const p = now - t0;
    place(p);
    if (p > END * .62) box.classList.add('lock');
    if (p > END + 300) box.classList.add('word');
    if (p < END + 400) raf = requestAnimationFrame(frame);
  };
  const run = () => {
    cancelAnimationFrame(raf);
    box.classList.remove('lock', 'word');
    if (still()) { place(1e9); box.classList.add('lock', 'word'); return; }
    place(0); void box.offsetWidth;
    t0 = performance.now() + 250;
    raf = requestAnimationFrame(frame);
  };
  place(0);
  let shown = false;
  onScreen(box, v => { if (v && !shown) run(); shown = v; }, .45);
  box.addEventListener('click', run);
}

/* ================================================================
   before — шторка «было / стало», под ней наброски заказчика
   ================================================================ */
function beforeHTML(c){
  return `<div class="mh-cmp" style="--p:52%" role="img" aria-label="${esc(H.pick(c.aria))}">
    <img ${pic('after-site', '(max-width: 900px) 100vw, 58vw')} alt="" loading="lazy" decoding="async">
    <div class="mh-cmp-a"><img ${pic('before-site', '(max-width: 900px) 100vw, 58vw')} alt="" loading="lazy" decoding="async"></div>
    <span class="mh-cmp-l mh-cmp-from">${H.T(c.fromLabel)}</span><span class="mh-cmp-l mh-cmp-to">${H.T(c.toLabel)}</span>
    <i class="mh-cmp-bar" aria-hidden="true"><b></b></i>
  </div>`;
}
// наброски по одному, без подложки: шестнадцать иконок и две надписи на синем
const OLD = 16;
const oldHTML = c => `<div class="wrap mh-old" role="img" aria-label="${esc(H.pick(c.logos))}">
  <p class="mh-cap mh-old-t">${H.T(c.logos)}</p>
  <div class="mh-old-in">
    <div class="mh-old-ic">${Array.from({ length: OLD }, (_, i) => `<img style="--d:${i}" src="${img('old-' + String(i + 1).padStart(2, '0') + '.webp')}" alt="" loading="lazy" decoding="async">`).join('')}</div>
    <div class="mh-old-lk">${[1, 2].map(i => `<img style="--d:${OLD + i}" src="${img('old-lock-' + i + '.webp')}" alt="" loading="lazy" decoding="async">`).join('')}</div>
  </div>
</div>`;
function liveBefore(box){
  const cmp = box.querySelector('.mh-cmp');
  let hand = false, raf = 0, on = false, drag = false;
  const t0 = performance.now();
  const set = p => cmp.style.setProperty('--p', (Math.min(1, Math.max(0, p)) * 100).toFixed(2) + '%');
  const at = e => { const r = cmp.getBoundingClientRect(); set((e.clientX - r.left) / r.width); };
  cmp.addEventListener('pointerdown', e => { hand = drag = true; at(e); cmp.setPointerCapture(e.pointerId); });
  cmp.addEventListener('pointermove', e => { if (drag || e.pointerType === 'mouse') { hand = true; at(e); } });
  cmp.addEventListener('pointerup', () => { drag = false; });
  // пока не тронули — шторка сама ходит туда-обратно
  const loop = now => {
    if (!hand) set(.5 + Math.sin((now - t0) / 1500) * .34);
    if (on && !hand) raf = requestAnimationFrame(loop);
  };
  onScreen(cmp, v => { on = v; cancelAnimationFrame(raf); if (v && !still()) raf = requestAnimationFrame(loop); }, .3);
}

/* ================================================================
   family — иконки VK с М100 в цвете, ниже — монохромные версии
   ================================================================ */
// порядок в сетке (номера файлов vk-NN); M — место М100. Иконки с оранжевым не берем.
const GRID = [1, 2, 3, 12, 5, 6, 15, 8, 9, 10, 11, 27, 13, 14, 'M', 21, 32, 17, 29, 19, 20, 22, 16, 23, 25, 26, 4, 30, 18, 7];
// монохромные версии со слайда: шесть продуктов VK и М100 в середине
const MONO = ['chart', 'x', 'layers', 'M', 'grid', 'mail', 'arrow'];
function familyHTML(c){
  let n = 0;
  const cell = (inner, i, cls = '') => `<span class="mh-ic${cls}" style="--o:${i * 2};--d:${i}">${inner}</span>`;
  const color = GRID.map((v, i) => v === 'M'
    ? cell(markSVG(BODY.color()), i, ' me')
    : cell(`<img src="${img('vk-' + String(v).padStart(2, '0') + '.webp')}" alt="" loading="lazy" decoding="async">`, i, n++ >= 19 ? ' x' : '')).join('');
  const mono = MONO.map((k, i) => k === 'M'
    ? cell(markSVG(BODY.mono()), GRID.length + i, ' me')
    : cell(`<img src="${img('vkm-' + k + '.webp')}" alt="" loading="lazy" decoding="async">`, GRID.length + i)).join('');
  return `<div class="mh-famw" role="img" aria-label="${esc(H.pick(c.aria))}">
    <p class="mh-cap mh-fam-t">${H.T(c.color)}</p><div class="mh-fam">${color}</div>
    <p class="mh-cap mh-fam-t">${H.T(c.mono)}</p><div class="mh-fam mh-fam-mono">${mono}</div>
  </div>`;
}

/* ================================================================
   search — все варианты сразу: направления, опции, финальный
   ================================================================ */
function searchHTML(c){
  const mark = (v, i) => `<span class="mh-var" style="--d:${i}">${markSVG(colorBody(v))}</span>`;
  return `<div class="mh-sg" role="img" aria-label="${esc(H.pick(c.aria))}">
    <div class="mh-sg-g"><p class="mh-cap mh-sg-t">${H.T(c.dirs)}</p><div class="mh-sg-row">${VARIANTS.slice(0, 3).map(mark).join('')}</div></div>
    <div class="mh-sg-g"><p class="mh-cap mh-sg-t">${H.T(c.opts)}</p><div class="mh-sg-row">${VARIANTS.slice(3, 6).map((v, i) => mark(v, i + 3)).join('')}</div></div>
  </div>`;
}

/* ================================================================
   motion — ролик из презентации: узор собирается в знак
   ================================================================ */
function motionHTML(c){
  const src = innerWidth < 900 ? 'logo-s.mp4' : 'logo.mp4';
  return `<div class="wrap mh-mv">
    <video class="mh-video" muted loop playsinline preload="none" poster="${img('logo-poster.webp')}" data-src="${img(src)}"></video>
    <button type="button" class="mh-snd" aria-pressed="false">${H.T(c.sound)}</button>
  </div>`;
}
function liveMotion(box, c){
  const v = box.querySelector('video'), b = box.querySelector('.mh-snd');
  let loaded = false;
  onScreen(v, on => {
    if (on) {
      if (!loaded) { v.src = v.dataset.src; loaded = true; }
      if (!still()) v.play().catch(() => {});
    } else v.pause();
  }, .35);
  b.addEventListener('click', () => {
    v.muted = !v.muted;
    b.setAttribute('aria-pressed', String(!v.muted));
    b.textContent = H.pick(v.muted ? c.sound : c.mute);
    if (!loaded) { v.src = v.dataset.src; loaded = true; }
    v.play().catch(() => {});
  });
}

/* ================================================================
   versions — все фоны сразу, знак в своей версии
   ================================================================ */
const BG_VER = { white: 'color', blue: 'mono', grey: 'mono', black: 'mono' };
function versionsHTML(c){
  return `<div class="mh-bgs" role="img" aria-label="${esc(H.pick(c.aria))}">${c.bgs.map((k, i) =>
    `<span class="mh-bg mh-bg-${k}" style="--d:${i}">${lockSVG(BG_VER[k])}</span>`).join('')}</div>`;
}
const versionsRow = c => `<div class="wrap mh-vers">${c.items.map(it => `<div class="mh-ver">
  <div class="mh-ver-pic">${lockSVG(it.k)}</div>
  <p class="mh-ver-t">${H.T(it.t)}</p><p class="mh-cap">${H.T(it.d)}</p></div>`).join('')}</div>`;

/* ================================================================
   space — охранное поле: оба поля сразу, подписи под схемой
   ================================================================ */
function spaceHTML(c){
  const ghost = (x, y) => `<path class="mh-gh" d="${SQ}" transform="translate(${x} ${y})"/>`;
  const W = LOCK_W + 200;
  return `<div class="mh-field" role="img" aria-label="${esc(H.pick(c.aria))}">
    <svg viewBox="-12 -12 ${W + 24} 324">
      ${ghost(0, 100)}${ghost(LOCK_W + 100, 100)}${ghost(100, 0)}${ghost(100, 200)}
      <rect class="mh-f mh-f-full" x="0" y="0" width="${W}" height="300" rx="2"/>
      <rect class="mh-f mh-f-half" x="50" y="50" width="${W - 100}" height="200" rx="2"/>
      <rect class="mh-f mh-f-in" x="100" y="100" width="${LOCK_W}" height="100"/>
      <g transform="translate(100 100)"><svg width="${LOCK_W}" height="100" viewBox="0 0 ${LOCK_W} 100" overflow="visible">
        <svg width="100" height="100" viewBox="0 0 100 100">${BODY.color()}</svg>
        <svg x="134.2" y="24.6" width="172" height="50.84" viewBox="81 46 1976 584" fill="#000">${WORD}</svg></svg></g>
    </svg>
  </div>`;
}
const spaceLegend = c => `<ul class="mh-legend">
  <li><i class="mh-lg mh-lg-half"></i>${H.T(c.half)}</li>
  <li><i class="mh-lg mh-lg-full"></i>${H.T(c.full)}</li>
</ul>`;

/* ================================================================
   pattern — живой узор
   ================================================================ */
// три панели рядом — синий, белый, черный фон; узор один и тот же, продолжается из панели в панель
const PW_ = 420, PH_ = 760, PC = 64, PATS = ['blue', 'white', 'black'];
function patternHTML(c){
  return `<div class="mh-pats" role="img" aria-label="${esc(H.pick(c.aria))}">${PATS.map((k, i) =>
    `<div class="mh-pat" data-k="${k}"><svg viewBox="${i * PW_} 0 ${PW_} ${PH_}" preserveAspectRatio="xMidYMid slice"></svg></div>`).join('')}</div>`;
}
const refsHTML = c => `<div class="wrap mh-refs-w"><div class="mh-refs">${c.refs.imgs.map(r =>
  `<button type="button" class="mh-zoom mh-ref" style="flex:${r.r}" data-n="${r.img}" aria-label="${esc(H.pick(c.refs.cap))}"><img${r.light ? ' class="mh-light"' : ''} src="${img(r.img + '.webp')}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div></div>`;
function liveRefs(box){
  const btns = [...box.querySelectorAll('.mh-ref')];
  btns.forEach((b, i) => b.addEventListener('click', () => H.openViewer(btns.map(x => img(x.dataset.n + '.webp')), i, btns.map(x => x.querySelector('img')))));
}
function livePattern(box){
  const e = EL(PC), cols = Math.ceil(PW_ * PATS.length / PC) + 2, rows = Math.ceil(PH_ / e.rh) + 1;
  const g = lattice(cols, rows, 31, .64);
  const NS = 'http://www.w3.org/2000/svg';
  const shape = (el, t) => {
    const w = t === 2 ? e.dw : e.d, h = t === 2 ? e.dh : e.d;
    el.setAttribute('x', -w / 2); el.setAttribute('y', -h / 2); el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('rx', h / 2);
    el.classList.toggle('off', !t);
  };
  // черточка не встает рядом с черточкой
  const ok = (r, k, t) => t !== 2 || ((g[r][k - 1] ?? 0) !== 2 && (g[r][k + 1] ?? 0) !== 2);
  box.querySelectorAll('.mh-pat').forEach((pat, i) => {
    const svg = pat.querySelector('svg'), x0 = i * PW_, cell = [];
    g.forEach((row, r) => row.forEach((t, k) => {
      const x = k * PC - PC * .2;
      if (x < x0 - PC || x > x0 + PW_ + PC) return;
      const el = document.createElementNS(NS, 'rect');
      el.setAttribute('transform', `translate(${x} ${r * e.rh + e.rh / 2})`);
      shape(el, t || 1);
      if (!t) el.classList.add('off');
      svg.appendChild(el);
      cell.push({ el, r, k, get t(){ return g[r][k]; } });
    }));
    const flip = (it, t) => {
      if (!ok(it.r, it.k, t)) t = 1;
      g[it.r][it.k] = t;
      if (t) shape(it.el, t); else it.el.classList.add('off');
      it.el.classList.add('pop'); setTimeout(() => it.el.classList.remove('pop'), 420);
    };
    // мигают, как индикаторы на стойке
    let on = false, tm;
    const tick = () => {
      clearTimeout(tm);
      if (!on || still()) return;
      for (let j = 0; j < 2; j++) {
        const it = cell[Math.floor(Math.random() * cell.length)];
        if (it.t) { it.el.classList.add('dim'); setTimeout(() => it.el.classList.remove('dim'), 500 + Math.random() * 900); }
      }
      tm = setTimeout(tick, 160);
    };
    onScreen(pat, v => { on = v; tick(); }, .2);
    // курсор или палец переставляет элементы на своих местах сетки
    let last = null;
    pat.addEventListener('pointermove', ev => {
      const rc = svg.getBoundingClientRect();
      const sc = Math.max(rc.width / PW_, rc.height / PH_);
      const ox = (rc.width - PW_ * sc) / 2, oy = (rc.height - PH_ * sc) / 2;
      const x = (ev.clientX - rc.left - ox) / sc + x0 + PC * .2, y = (ev.clientY - rc.top - oy) / sc;
      const k = Math.round(x / PC), r = Math.floor(y / e.rh);
      const it = cell.find(q => q.k === k && q.r === r);
      if (!it || it === last) return;
      last = it;
      flip(it, (it.t + 1) % 3);
    });
  });
}

/* ================================================================
   palette — полосы в долях
   ================================================================ */
function paletteHTML(c){
  return `<div class="mh-pal">${c.colors.map(x => `<div class="mh-sw${x.hex === '#FFFFFF' ? ' white' : ''}" style="--c:${x.hex};--w:${x.w}">
    <span class="mh-sw-t"><b>${esc(x.name)}</b><span>${x.hex}</span>${x.pantone ? `<span>Pantone ${esc(x.pantone)}</span>` : ''}</span></div>`).join('')}</div>`;
}

/* ================================================================
   merch — носители целыми кадрами: ноутбук во всю ширину, остальное по два
   ================================================================ */
function merchHTML(c){
  const meta = x => `<div class="mh-mt"><p class="mh-mt-n">${H.T(x.name)}</p><p class="mh-mt-c">${H.T(x.cap)}</p></div>`;
  const pic_ = (x, sizes, n = x.img) => `<button type="button" class="mh-zoom mh-mp" data-n="${n}" aria-label="${esc(H.pick(c.open))}"><img${x.light ? ' class="mh-light"' : ''} ${
    x.cut ? `src="${img(n + '.webp')}"` : pic(n, sizes)} alt="" loading="lazy" decoding="async"></button>`;
  const rows = [];
  for (let i = 0; i < c.items.length; i++) {
    const x = c.items[i];
    if (x.lay === 'pair' && c.items[i + 1]?.lay === 'pair') {
      const y = c.items[++i];
      rows.push(`<div class="mh-row mh-row-pair"><figure class="mh-cell">${pic_(x, '(max-width: 700px) 100vw, 58vw')}${meta(x)}</figure><figure class="mh-cell">${pic_(y, '(max-width: 700px) 100vw, 42vw')}${meta(y)}</figure></div>`);
    } else if (x.lay === 'diary') {
      rows.push(`<div class="mh-row mh-row-diary">${meta(x)}<div class="mh-dc">${x.cut.map((n, j) => `<div class="mh-dc-${j}">${pic_(x, '', n)}</div>`).join('')}</div></div>`);
    } else if (x.lay === 'cut') {
      rows.push(`<div class="mh-row mh-row-cut">${meta(x)}<div class="mh-cutpic">${pic_(x, '', x.cut[0])}</div></div>`);
    } else {
      rows.push(`<div class="mh-row mh-row-${x.lay}">${meta(x)}<div class="mh-rowpic">${pic_(x, x.lay === 'full' ? '100vw' : '(max-width: 900px) 100vw, 70vw')}</div></div>`);
    }
  }
  return `<div class="wrap mh-ed">${rows.join('')}</div>`;
}
// строки носителей появляются по одной, когда доходят до экрана
const rowIn = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); rowIn.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px', threshold: .12 });
function liveMerch(box){
  box.querySelectorAll('.mh-row').forEach(r => rowIn.observe(r));
  const btns = [...box.querySelectorAll('.mh-mp')];
  const list = btns.map(b => img(b.dataset.n + '.webp'));
  btns.forEach((b, i) => b.addEventListener('click', () => H.openViewer(list, i, btns.map(x => x.querySelector('img')))));
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'm100.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountM100(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;
  const s = p.m100;
  const head = (k, c, viz, after = '') => `<section class="mh-ch mh-${k}"><div class="wrap mh-head">${block(c)}</div>${viz}${after}</section>`;
  // заголовок слева, длинный текст справа в две колонки
  const wide = (k, c, viz) => `<section class="mh-ch mh-${k}"><div class="wrap mh-wide"><div class="mh-col">
      <span class="case-label mh-label">${H.T(c.label)}</span><h2 class="mh-title">${H.T(c.title)}</h2></div>
      <div class="mh-col"><p class="mh-text mh-cols">${H.T(c.text)}</p></div></div>${viz}</section>`;
  mount.innerHTML =
      (s.before   ? `<section class="mh-ch mh-before"><div class="wrap mh-split"><div class="mh-viz">${beforeHTML(s.before)}</div>${block(s.before)}</div>${oldHTML(s.before)}</section>` : '')
    + (s.family   ? wide('family', s.family, `<div class="wrap">${familyHTML(s.family)}</div>`) : '')
    + (s.search   ? chapter('search', searchHTML(s.search), s.search, true) : '')
    + (s.motion   ? head('motion', s.motion, motionHTML(s.motion)) : '')
    + (s.versions ? `<section class="mh-ch mh-versions"><div class="wrap mh-split"><div class="mh-viz">${versionsHTML(s.versions)}</div>${block(s.versions)}</div>${versionsRow(s.versions)}</section>` : '')
    + (s.space    ? chapter('space', spaceHTML(s.space), s.space, true, spaceLegend(s.space)) : '')
    + (s.pattern  ? wide('pattern', s.pattern, `${s.pattern.refs ? refsHTML(s.pattern) : ''}${patternHTML(s.pattern)}`) : '')
    + (s.palette  ? chapter('palette', paletteHTML(s.palette), s.palette, false) : '')
    + (s.merch    ? wide('merch', s.merch, merchHTML(s.merch)) : '');
  // знак из узора — в самом начале кейса, выше задачи и решения
  const scheme = mount.parentElement.querySelector(':scope > .wrap:has(.camp-head)');
  if (s.build) {
    const top = document.createElement('div');
    top.className = 'mh mh-top';
    top.innerHTML = buildHTML(s.build);
    (scheme || mount).before(top);
    liveBuild(top.querySelector('.mh-build'));
  }
  mount.querySelectorAll('.mh-ch').forEach(el => reveal.observe(el));
  const q = c => mount.querySelector(c);
  if (s.before) liveBefore(q('.mh-before'));
  if (s.motion) liveMotion(q('.mh-motion'), s.motion);
  if (s.pattern) { livePattern(q('.mh-pattern')); if (s.pattern.refs) liveRefs(q('.mh-pattern')); }
  if (s.merch) liveMerch(q('.mh-merch'));
  if (s.space) alignSpace(q('section.mh-space'));
}
// охранное поле: заголовок главы стоит вровень с верхним краем знака на схеме
function alignSpace(sec){
  const field = sec.querySelector('.mh-field'), col = sec.querySelector('.mh-col'), title = col.querySelector('.mh-title');
  // обе колонки прижаты к верху: схема начинается сверху, знак на ней — на 112/324 высоты;
  // считаем по offset* — они не зависят от сдвига анимации появления, поэтому ничего не прыгает
  const fit = () => {
    if (innerWidth <= 900) { sec.style.alignItems = ''; col.style.marginTop = ''; return; }
    sec.style.alignItems = 'start';
    if (!field.offsetHeight) return;
    const lockY = field.offsetHeight * (112 / 324);
    const titleY = title.offsetTop - col.offsetTop;   // от верха колонки, отступ колонки сюда не входит
    col.style.marginTop = Math.max(0, lockY - titleY).toFixed(1) + 'px';
  };
  new ResizeObserver(fit).observe(field);
  addEventListener('resize', fit);
  fit();
}
