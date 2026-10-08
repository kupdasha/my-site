/* ================================================================
   КЕЙС «СТУДИЯ ДИЗАЙНА НАВИГАЦИИ» (поле navi у проекта)
   В шапке — микроанимация: камера по кругу пролетает над 3D-кампусом
   Бауманки (свой маленький рендерер на холсте), метки носителей
   в цветах статусов.
   Главы: build — конструктор: слева макет с размерами и выносками-
   иконками напротив строк, справа строки (стрелка поворачивается,
   текст любой, убрать, «+»), тип носителя и цвет плиты — иконками;
   подсказки — микроанимацией, а не текстом;
   campus — 3D-кампус, две роли без слов: студия (карандаш) правит
   текст плиты, заказчик (глаз, по ссылке) только ставит точки
   с замечаниями и согласует; замечание улетает к кнопке «студия»;
   rec — запись экрана настоящей студии (Kinescope), у заголовка —
   зеленая кнопка демо (поле demo у главы).
   Данные кампуса, графа дорожек и правила типов носителей —
   из демо студии. Тексты — в content.js, оформление — navi.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dark = () => document.documentElement.dataset.theme === 'dark';
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);

/* ---------- данные демо: объекты кампуса, узлы и дорожки ---------- */
const OBJECTS = [
  ['guk', 'Главный учебный корпус', 'Main Academic Building', 'ГУК', 'Main', '1', [37.6836, 55.7663], [210, 42, 26, -12]],
  ['slobod', 'Слободской дворец', 'Sloboda Palace', 'Слободской дворец', 'Palace', '', [37.6849, 55.7658], [95, 44, 22, -12]],
  ['ulk', 'Учебно-лабораторный корпус', 'Laboratory Building', 'УЛК', 'Lab', '2', [37.6874, 55.7686], [170, 34, 44, 22]],
  ['ntb', 'Научно-техническая библиотека', 'Research Library', 'Библиотека', 'Library', '', [37.6864, 55.7691], [62, 52, 30, 22]],
  ['dk', 'Дворец культуры', 'Palace of Culture', 'ДК', 'Culture', '', [37.6886, 55.7695], [72, 42, 19, 22]],
  ['sm', 'Корпус специального машиностроения', 'Mechanical Engineering', 'Корпус СМ', 'SM Block', '5', [37.6812, 55.7672], [84, 30, 21, -8]],
  ['energo', 'Энергомашиностроительный корпус', 'Power Engineering', 'Корпус Э', 'E Block', '4', [37.6822, 55.7668], [74, 30, 21, -8]],
  ['tblock', 'Корпус Т', 'T Block', 'Корпус Т', 'T Block', '6', [37.6846, 55.7678], [58, 30, 18, -12]],
  ['sport', 'Спортивный комплекс', 'Sports Centre', 'Спортзал', 'Sports', '', [37.682, 55.765], [64, 42, 15, 0]],
  ['dorm', 'Общежитие', 'Dormitory', 'Общежитие', 'Dorm', '11', [37.6792, 55.7642], [48, 22, 46, 0]],
  ['canteen', 'Столовая', 'Canteen', 'Столовая', 'Canteen', '', [37.6853, 55.7666], [40, 26, 11, -12]],
  ['clinic', 'Поликлиника', '', 'Поликлиника', '', '', [37.6845, 55.7648], [36, 22, 13, 0]],
  ['metro', 'Метро «Бауманская»', 'Baumanskaya Metro', 'Метро', 'Metro', '', [37.6791, 55.7722], [26, 26, 9, 0]],
  ['tech', 'Технопарк', 'Technopark', 'Технопарк', 'Technopark', '', [37.6866, 55.7672], [56, 34, 24, 18]],
].map(([id, name, nameEn, ru, en, no, coords, [w, d, h, rot]]) => ({ id, name, nameEn, ru, en, no, coords, shape: { w, d, h, rot } }));
const NODES = [
  ['gate', 37.6832, 55.7658, 1], ['guk_sq', 37.6841, 55.7665, 1], ['yard', 37.6848, 55.7672, 1], ['tech_j', 37.686, 55.7676, 0],
  ['ulk_sq', 37.687, 55.7683, 1], ['emb', 37.688, 55.769, 1], ['west', 37.6825, 55.7669, 1], ['south', 37.6829, 55.7654, 1],
  ['dorm_j', 37.68, 55.7645, 0], ['metro_j', 37.6802, 55.7712, 1],
].map(([id, lo, la, dp]) => ({ id, coords: [lo, la], decision: !!dp }));
const EDGES = [['gate', 'guk_sq'], ['guk_sq', 'yard'], ['yard', 'tech_j'], ['tech_j', 'ulk_sq'], ['ulk_sq', 'emb'], ['guk_sq', 'west'],
  ['west', 'south'], ['south', 'dorm_j'], ['yard', 'metro_j'], ['gate', 'south']];
const objById = new Map(OBJECTS.map(o => [o.id, o]));
const nodeById = new Map(NODES.map(n => [n.id, n]));

// типы носителей: размеры плиты в мм, дистанция чтения в м, поля
const TYPES = {
  D2: { name: 'Указатель направления', kind: 'direction', width: 700, height: 1800, dist: 10, maxMsg: 4, maxLines: 2, safe: [60, 40, 84, 40] },
  B1: { name: 'Табличка здания', kind: 'identification', width: 600, height: 900, dist: 10, maxMsg: 1, maxLines: 2, safe: [60, 45, 60, 45] },
  T1: { name: 'Тактильная табличка', kind: 'tactile', width: 300, height: 400, dist: .3, maxMsg: 1, maxLines: 3, safe: [24, 24, 24, 24] },
};
// правила набора: трекинг сжимается от 0,07 до 0 em, высота строчных = дистанция × 4 мм, у тактильной — 15 мм
const CFG = { trackBase: .07, trackMin: 0, trackStep: .005, K: 4, lh: 1.14, tactileX: 15, contrastMin: 70 };
// краски RAL: коэффициент отражения (LRV) и цвет для экрана
const RAL = {
  RAL9004: [4, '#2e3032', 'сигнальный черный'], RAL7016: [6, '#293133', 'антрацитово-серый'], RAL5011: [5, '#252d43', 'стальной синий'],
  RAL6005: [5, '#2f4538', 'мховый зеленый'], RAL9016: [87, '#f1f0ea', 'транспортный белый'], RAL1015: [68, '#e6d2b5', 'светлая слоновая кость'],
  RAL1023: [63, '#fad201', 'транспортный желтый'],
};
const PLATES = ['RAL9004', 'RAL7016', 'RAL5011', 'RAL6005', 'RAL9016', 'RAL1015'];
const INKS = ['RAL9016', 'RAL9004'];
const contrastOf = (a, b) => Math.abs(RAL[a][0] - RAL[b][0]);
const MARK = 'МГТУ им. Н. Э. Баумана';
const ARROWS = ['up', 'up_right', 'right', 'down_right', 'down', 'down_left', 'left', 'up_left'];
const ARROW_DEG = { up: 0, up_right: 45, right: 90, down_right: 135, down: 180, down_left: 225, left: 270, up_left: 315 };
const ARROW_CH = { up: '↑', up_right: '↗', right: '→', down_right: '↘', down: '↓', down_left: '↙', left: '←', up_left: '↖' };

/* ---------- граф дорожек и маршруты ---------- */
const rad = x => x * Math.PI / 180;
function bearing(a, b){
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
function hav(a, b){
  const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}
const edges = [];
for (const [f, t] of EDGES) {
  const a = nodeById.get(f).coords, b = nodeById.get(t).coords, L = hav(a, b);
  edges.push({ from: f, to: t, L, bd: bearing(a, b) }, { from: t, to: f, L, bd: bearing(b, a) });
}
// кратчайший путь по дорожкам (Дейкстра)
function path(from, to){
  if (from === to) return [];
  const d = new Map(NODES.map(n => [n.id, Infinity])), prev = new Map(), seen = new Set();
  d.set(from, 0);
  while (seen.size < NODES.length) {
    let u = null, ud = Infinity;
    for (const [k, v] of d) if (!seen.has(k) && v < ud) { ud = v; u = k; }
    if (u === null || u === to) break;
    seen.add(u);
    for (const e of edges) if (e.from === u && !seen.has(e.to) && ud + e.L < d.get(e.to)) { d.set(e.to, ud + e.L); prev.set(e.to, e); }
  }
  if (d.get(to) === Infinity) return null;
  const out = [];
  for (let c = to; c !== from; c = prev.get(c).from) out.unshift(prev.get(c));
  return out;
}
const nearNode = c => NODES.reduce((b, n) => hav(c, n.coords) < hav(c, b.coords) ? n : b, NODES[0]);
const zoneFor = c => c[1] > 55.768 ? 'Набережная Яузы' : c[1] < 55.7655 ? 'Южная зона' : 'Главный двор';
const fmtDist = m => !(m > 0) ? '' : m < 950 ? `${Math.round(m / 10) * 10} м` : `${(m / 1000).toFixed(1).replace('.', ',')} км`;
// стрелка и расстояние от узла до объекта
function route(nodeId, o){
  const pp = path(nodeId, nearNode(o.coords).id);
  if (!pp || !pp.length) return { ar: null, dist: '' };
  return { ar: ARROWS[Math.round(((pp[0].bd % 360) + 360) % 360 / 45) % 8], dist: fmtDist(pp.reduce((s, e) => s + e.L, 0)) };
}

/* ---------- носители демо: указатели на развилках, таблички зданий, тактильные ---------- */
const BOARDS = (() => {
  const S = [], id = t => t + '-' + String(S.length + 1).padStart(2, '0');
  for (const n of NODES) {
    if (!n.decision) continue;
    const objs = [...OBJECTS].sort((a, b) => hav(n.coords, a.coords) - hav(n.coords, b.coords)).slice(0, 8)
      .filter(o => nearNode(o.coords).id !== n.id).slice(0, 4);
    S.push({ id: id('D2'), type: 'D2', node: n.id, coords: n.coords, msgs: objs.map(o => o.id) });
  }
  for (const o of OBJECTS) S.push({ id: id('B1'), type: 'B1', node: nearNode(o.coords).id, coords: o.coords, msgs: [o.id] });
  for (const oid of ['clinic', 'canteen', 'guk']) {
    const o = objById.get(oid);
    S.push({ id: id('T1'), type: 'T1', node: nearNode(o.coords).id, coords: o.coords, msgs: [o.id] });
  }
  S.forEach((b, i) => { b.n = i + 1; b.zone = zoneFor(b.coords); });
  return S;
})();
const D2 = () => BOARDS.find(b => b.type === 'D2' && b.msgs.length >= 4);

/* ---------- типографика макета: подбор трекинга и переносов под ширину плиты ---------- */
let mctx, xr = .53, FONT = '"Golos Text", system-ui, sans-serif';
const mc = () => mctx || (mctx = document.createElement('canvas').getContext('2d'));
function measureX(){
  FONT = getComputedStyle(document.body).fontFamily || FONT;
  const c = mc(); c.font = `600 100px ${FONT}`;
  const m = c.measureText('x');
  if (m.actualBoundingBoxAscent > 0) xr = m.actualBoundingBoxAscent / 100;
}
const mw = (t, s, tr, w = 600) => { const c = mc(); c.font = `${w} ${s}px ${FONT}`; return c.measureText(t).width + tr * s * t.length; };
function wrapLines(t, av, s, tr, w){
  const ws = t.split(/\s+/).filter(Boolean), L = [];
  let c = '';
  for (const x of ws) {
    const cd = c ? c + ' ' + x : x;
    if (mw(cd, s, tr, w) <= av) c = cd;
    else { if (!c) return null; L.push(c); c = x; if (mw(x, s, tr, w) > av) return null; }
  }
  if (c) L.push(c);
  return L.length ? L : [''];
}
// сначала сжимаем трекинг, потом переносим строку, иначе — «не помещается»
function fit(t, av, ml, s, w){
  for (let tr = CFG.trackBase; tr >= CFG.trackMin - 1e-9; tr -= CFG.trackStep) if (mw(t, s, tr, w) <= av) return { tr, lines: [t] };
  if (ml > 1) { const L = wrapLines(t, av, s, CFG.trackMin, w); if (L && L.length <= ml) return { tr: CFG.trackMin, lines: L }; }
  return { tr: CFG.trackMin, lines: [t], over: true };
}
// prep: тип и строки → размеры набора и раскладка
// items: для указателя [{ ru, en, ar, dist }], для таблички [{ ru, en, no }]
function prep(type, items){
  const t = TYPES[type], tac = t.kind === 'tactile';
  const size = (tac ? CFG.tactileX : t.dist * CFG.K) / xr, lh = size * CFG.lh;
  const aw = t.kind === 'direction' ? size * .82 : 0, gap = t.kind === 'direction' ? size * .34 : 0;
  const av = t.width - t.safe[1] - t.safe[3] - aw - gap;
  const ms = items.map(m => ({ ...m, fr: fit(m.ru, av, t.maxLines, size, tac || t.kind === 'identification' ? 700 : 600) }));
  return { type, t, size, lh, aw, gap, ms, xh: tac ? CFG.tactileX : t.dist * CFG.K };
}
function prepBoard(b){
  if (b.type === 'D2') return prep('D2', b.msgs.map(id => { const o = objById.get(id); return { ru: o.ru, en: o.en, ...route(b.node, o) }; }));
  const o = objById.get(b.msgs[0]);
  return prep(b.type, [{ ru: o.ru, en: o.en, no: o.no }]);
}

/* ---------- макет носителя в HTML: плита в масштабе, набор, стрелки, пиктограммы ---------- */
const arrowSvg = (a, sz, c, i) => `<svg${i != null ? ` class="nv-ar" data-i="${i}"` : ''} width="${sz}" height="${sz}" viewBox="0 0 100 100" style="transform:rotate(${ARROW_DEG[a]}deg);display:block" aria-hidden="true"><g fill="none" stroke="${c}" stroke-width="11"><path d="M50 94V18"/><path d="M23 43L50 15L77 43"/></g></svg>`;
const picto = (kind, sz, c) => kind === 'ped'
  ? `<svg width="${sz}" height="${sz}" viewBox="0 0 40 40" style="display:block" aria-hidden="true"><g fill="${c}"><circle cx="20" cy="7" r="4.4"/><path d="M16.6 13.4h6.8l3.4 9.2-3.1 1.2-1.9-5.1V38h-3.3v-9.6h-1v9.6h-3.3V18.7l-1.9 5.1-3.1-1.2z"/></g></svg>`
  : `<svg width="${sz}" height="${sz}" viewBox="0 0 40 40" style="display:block" aria-hidden="true"><g fill="${c}"><circle cx="15.5" cy="6.6" r="4"/><path d="M12 12h6v8h8.5v3.4H18c-1.9 0-3.3-1-3.9-2.6z"/><path d="M22.5 22.6l3.1-1.1 2.9 7.6-3.1 1.1z"/><circle cx="19.5" cy="28" r="9.4" fill="none" stroke="${c}" stroke-width="3.1"/></g></svg>`;
function art(p, maxW, maxH, plateHex, inkHex){
  const t = p.t, k = Math.min(maxW / t.width, maxH / t.height), u = v => (v * k).toFixed(2) + 'px';
  const tac = t.kind === 'tactile';
  const plate = tac ? RAL.RAL1023[1] : plateHex || RAL.RAL9004[1], ink = tac ? '#0a0a0a' : inkHex || RAL.RAL9016[1];
  const small = v => `font-size:${u(v)};line-height:1.25`;
  const over = m => m.fr.over ? `;box-shadow:inset 0 -${u(10)} 0 rgba(139,92,246,.75)` : '';
  let body = '';
  if (t.kind === 'direction') {
    const rows = p.ms.map((m, i) => {
      const meta = [m.en, m.dist].filter(Boolean);
      return `<div style="display:flex;align-items:flex-start;gap:${u(p.gap)}">
        <div style="flex:1 1 auto;min-width:0">
          <div class="nv-nm" data-i="${i}" style="font-weight:600;font-size:${u(p.size)};line-height:${u(p.lh)};letter-spacing:${u(m.fr.tr * p.size)};white-space:nowrap${over(m)}">${m.fr.lines.map(esc).join('<br>')}</div>
          ${meta.length ? `<div style="display:flex;gap:${u(p.size * .34)};margin-top:${u(p.size * .14)};opacity:.72;${small(p.size * .52)}">${meta.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
        </div>
        <div style="flex:0 0 ${u(p.aw)};padding-top:${u(p.size * .06)}">${m.ar ? arrowSvg(m.ar, u(p.aw), ink, i) : ''}</div></div>`;
    }).join('');
    body = `<div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:${p.ms.length > 1 ? 'space-between' : 'flex-start'};padding-bottom:${u(p.size * .5)}">${rows}</div>`;
  } else {
    const m = p.ms[0] || { ru: '', en: '', fr: { lines: [''] } };
    const dots = [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${3.4 + (i % 3) * 8}" cy="${4 + Math.floor(i / 3) * 7.6}" r="2.1" fill="${ink}"/>`).join('');
    body = `<div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:${u(p.size * (tac ? .42 : .1))}">
      ${m.no ? `<div style="font-weight:700;font-size:${u(p.size * 1.6)};line-height:.88;margin-bottom:${u(p.size * .06)}">${esc(m.no)}</div>` : ''}
      <div class="nv-nm" data-i="0" style="font-weight:${tac ? 700 : 600};font-size:${u(p.size)};line-height:${u(p.lh)};white-space:nowrap${over(m)}">${m.fr.lines.map(esc).join('<br>')}</div>
      ${!tac && m.en ? `<div style="opacity:.72;${small(p.size * .52)}">${esc(m.en)}</div>` : ''}
      ${tac ? `<svg width="${u(p.size * 2.1)}" height="${u(p.size * .86)}" viewBox="0 0 27 14" style="display:block" aria-hidden="true">${dots}</svg>` : ''}</div>`;
  }
  const ff = Math.max(5, p.size * .24);
  const pictos = t.kind === 'direction' ? `<div style="display:flex;gap:${u(p.size * .2)}">${picto('ped', u(p.size * .46), ink)}${picto('acc', u(p.size * .46), ink)}</div>` : '';
  const footer = `<div style="flex:0 0 auto"><div style="background:${ink};opacity:.18;height:${u(1.6)};margin-bottom:${u(ff * .9)}"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:${u(ff)}"><div style="font-weight:600;opacity:.8;${small(ff)}">${tac ? 'Тактильная табличка' : esc(MARK)}</div>${pictos}</div></div>`;
  return `<div class="nv-plate" data-k="${k}" style="border-radius:${u(Math.min(18, t.width * .028))};${tac ? `box-shadow:inset 0 0 0 ${u(6)} ${ink},0 26px 60px -24px rgba(0,0,0,.45);` : ''}width:${u(t.width)};height:${u(t.height)};background:${plate};color:${ink};padding:${t.safe.map(u).join(' ')}">${body}${footer}</div>`;
}

/* ---------- монохромная 3D-сцена кампуса: свой маленький рендерер на холсте ---------- */
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const css = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => a.map(x => Math.min(255, x * k));
const mono = a => { const l = a[0] * .299 + a[1] * .587 + a[2] * .114; return [l, l, l]; };
const LIGHT = (() => { const v = [-.42, -.66, .62], L = Math.hypot(...v); return v.map(x => x / L); })();
// две палитры: темная (ролик и темная версия сайта) и светлая — как в самой студии
const PAL = {
  dark: { top: [10, 13, 18], low: [26, 33, 42], ground: mono(hex2rgb('#171a1d')), water: mono(hex2rgb('#16303c')), park: mono(hex2rgb('#1b2b1b')),
    road: mix(mono(hex2rgb('#33363b')), mono(hex2rgb('#171a1d')), .25), wall: mono(hex2rgb('#26262a')), roof: null, win: mono([92, 120, 150]),
    shadow: .34, trunk: mono([52, 44, 38]), leaf: mono([38, 66, 40]), label: '#8b8b93', none: '#8b8b93', sel: '#fafafa' },
  light: { top: [247, 247, 248], low: [232, 233, 236], ground: [238, 238, 240], water: [216, 220, 225], park: [228, 230, 229],
    road: [252, 252, 252], wall: [168, 168, 172], roof: [250, 250, 250], win: [140, 142, 148],
    shadow: .1, trunk: [130, 130, 134], leaf: [156, 156, 160], label: '#5d5f66', none: '#9a9ca3', sel: '#1D222A' },
};
const STATUS = { ok: '#16a34a', fix: '#8B5CF6' };
const CEN = (() => { let lo = 0, la = 0; for (const o of OBJECTS) { lo += o.coords[0]; la += o.coords[1]; } return [lo / OBJECTS.length, la / OBJECTS.length]; })();
const toM = (lon, lat) => [(lon - CEN[0]) * 111320 * Math.cos(rad(CEN[1])), (lat - CEN[1]) * 110540];
const NEAR = .6;
function depthAt(cam, p){
  const dx = p[0] - cam.tx, dy = p[1] - cam.ty, dz = p[2] - cam.tz;
  return (dx * Math.sin(cam.yaw) + dy * Math.cos(cam.yaw)) * Math.cos(cam.pitch) - dz * Math.sin(cam.pitch) + cam.dist;
}
function proj(cam, p, S){
  const dx = p[0] - cam.tx, dy = p[1] - cam.ty, dz = p[2] - cam.tz;
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const rx = dx * cy - dy * sy, ry = dx * sy + dy * cy, ey = ry * cp - dz * sp, ez = ry * sp + dz * cp, d = ey + cam.dist;
  if (d <= .55) return null;
  const f = S.focal / d;
  return [S.cx + rx * f, S.cy - ez * f, d];
}
// срезаем многоугольник у ближней плоскости — иначе вплотную к табличке грани выворачиваются
function clipNear(cam, pts){
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], da = depthAt(cam, a) - NEAR, db = depthAt(cam, b) - NEAR;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  }
  return out.length >= 3 ? out : null;
}
function boxOf(o){
  const [cx, cy] = toM(...o.coords), s = o.shape, a = rad(s.rot), ca = Math.cos(a), sa = Math.sin(a), hw = s.w / 2, hd = s.d / 2;
  return { c: [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => [cx + x * ca - y * sa, cy + x * sa + y * ca]), h: s.h };
}
const TREES = (() => {
  let s = 20260818;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff, out = [];
  for (const [a, b, c, d] of [[37.6802, 55.763, 37.6868, 55.7654], [37.6836, 55.7658, 37.6872, 55.767], [37.6876, 55.7684, 37.6898, 55.7702]]) {
    const n = Math.round((c - a) * (d - b) * 1.7e7);
    for (let i = 0; i < n; i++) out.push({ p: toM(a + rnd() * (c - a), b + rnd() * (d - b)), h: 6 + rnd() * 5, r: 2.4 + rnd() * 1.6 });
  }
  return out;
})();
// где стоит плита носителя: высота крепления и габарит в метрах
function plateGeo(b){
  const t = TYPES[b.type], [x, y] = toM(...b.coords);
  const mount = t.kind === 'direction' ? .5 : t.kind === 'identification' ? 2.8 : 1.25;
  return { x, y, w: t.width / 1000, h: t.height / 1000, mount, top: mount + t.height / 1000 };
}
// opt: pal, reveal (доля носителей), status {id: ok|fix}, pulse (id), sel (id), labels
function draw3d(g, W, H, cam, opt){
  const P = opt.pal, S = { cx: W / 2, cy: H / 2, focal: H * 1.15 }, items = [], top = [], hits = [];
  const F0 = cam.dist * .9, F1 = cam.dist * 2.9;
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, css(P.top)); grd.addColorStop(1, css(P.low));
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const fog = (c, d) => mix(c, P.low, clamp((d - F0) / (F1 - F0), 0, .82));
  function quad(pts, col, o = {}){
    const cl = clipNear(cam, pts);
    if (!cl) return null;
    const pr = cl.map(q => proj(cam, q, S));
    if (pr.some(x => !x)) return null;
    const d = pr.reduce((s, p) => s + p[2], 0) / pr.length;
    items.push({ d: (o.bias || 0) + d, f: () => {
      g.beginPath(); g.moveTo(pr[0][0], pr[0][1]);
      for (let i = 1; i < pr.length; i++) g.lineTo(pr[i][0], pr[i][1]);
      g.closePath(); g.fillStyle = css(fog(col, d)); g.fill();
      if (o.stroke) { g.strokeStyle = css(fog(o.stroke, d)); g.lineWidth = o.lw || 1; g.stroke(); }
    } });
    return pr;
  }
  const G = 2600;
  quad([[-G, -G, 0], [G, -G, 0], [G, G, 0], [-G, G, 0]], P.ground, { bias: 1e9 });
  const flat = (ll, col, z, b) => quad(ll.map(([lo, la]) => [...toM(lo, la), z]), col, { bias: b });
  flat([[37.6899, 55.7612], [37.6906, 55.7612], [37.6895, 55.774], [37.6888, 55.774]], P.water, .3, 6e5);   // Яуза
  flat([[37.68, 55.7628], [37.6872, 55.7628], [37.6872, 55.7656], [37.68, 55.7656]], P.park, .32, 5.5e5);   // сквер на юге
  for (const [f, t] of EDGES) {
    const A = toM(...nodeById.get(f).coords), B = toM(...nodeById.get(t).coords);
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * 4.5, ny = dx / L * 4.5;
    quad([[A[0] + nx, A[1] + ny, .5], [B[0] + nx, B[1] + ny, .5], [B[0] - nx, B[1] - ny, .5], [A[0] - nx, A[1] - ny, .5]], P.road, { bias: 4e5 });
  }
  for (const o of OBJECTS) {
    const { c, h } = boxOf(o);
    quad(c.map(([x, y]) => [x + h * .34, y - h * .5, .12]), mix(P.ground, [0, 0, 0], P.shadow), { bias: 3e5 });   // тень
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4, dx = c[j][0] - c[i][0], dy = c[j][1] - c[i][1], L = Math.hypot(dx, dy) || 1;
      const lam = Math.max(0, dy / L * LIGHT[0] - dx / L * LIGHT[1]), wall = mul(P.wall, .55 + .62 * lam);
      const pr = quad([[c[i][0], c[i][1], 0], [c[j][0], c[j][1], 0], [c[j][0], c[j][1], h], [c[i][0], c[i][1], h]], wall);
      if (!pr || Math.hypot(pr[1][0] - pr[0][0], pr[1][1] - pr[0][1]) < 34 || h < 6) continue;
      // окна полосами по этажам
      const floors = Math.max(1, Math.round(h / 3.6)), ins = .11;
      for (let f = 0; f < floors; f++) {
        const z0 = (f + .32) * (h / floors), z1 = z0 + (h / floors) * .46;
        const ax = c[i][0] + dx * ins, ay = c[i][1] + dy * ins, bx = c[j][0] - dx * ins, by = c[j][1] - dy * ins;
        quad([[ax, ay, z0], [bx, by, z0], [bx, by, z1], [ax, ay, z1]], mix(wall, P.win, .5), { bias: -.4 });
      }
    }
    const roof = P.roof || mul(P.wall, .94 + .3 * LIGHT[2]);
    quad(c.map(([x, y]) => [x, y, h]), roof, { bias: -1 });
    const cxm = (c[0][0] + c[2][0]) / 2, cym = (c[0][1] + c[2][1]) / 2;
    quad(c.map(([x, y]) => [cxm + (x - cxm) * .9, cym + (y - cym) * .9, h + .9]), P.roof ? mul(roof, .97) : mul(P.wall, 1.18), { bias: -2, stroke: mul(P.roof ? P.wall : P.wall, P.roof ? 1.1 : .7) });
    const tp = proj(cam, [cxm, cym, h + 7], S);
    // подписи зданий — только на широком кадре: на телефоне 16px перекрывают весь кампус
    if (tp && opt.labels && W >= 560) top.push({ d: tp[2] + 8e5, f: () => {
      g.font = `500 16px ${FONT}`; g.textAlign = 'center';
      g.lineWidth = 4; g.strokeStyle = css(P.low); g.strokeText(o.ru, tp[0], tp[1]);
      g.fillStyle = P.label; g.fillText(o.ru, tp[0], tp[1]);
    } });
  }
  for (const t of TREES) {
    const b = proj(cam, [t.p[0], t.p[1], 0], S), tp = proj(cam, [t.p[0], t.p[1], t.h], S);
    if (!b || !tp) continue;
    const r = t.r * S.focal / tp[2];
    if (r < 1.2) continue;
    const lc = fog(P.leaf, tp[2]), tc = fog(P.trunk, tp[2]);
    items.push({ d: tp[2], f: () => {
      g.strokeStyle = css(tc); g.lineWidth = Math.max(1, r * .24);
      g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(tp[0], tp[1]); g.stroke();
      g.beginPath(); g.arc(tp[0], tp[1], r, 0, 7); g.fillStyle = css(lc); g.fill();
      g.beginPath(); g.arc(tp[0] - r * .3, tp[1] - r * .3, r * .66, 0, 7); g.fillStyle = css(mul(lc, 1.12)); g.fill();
    } });
  }
  const reveal = opt.reveal == null ? 1 : opt.reveal;
  BOARDS.forEach((s, i) => {
    if (i / BOARDS.length > reveal) return;
    const q = plateGeo(s), t = TYPES[s.type], half = q.w / 2;
    const A = [q.x - half, q.y], B = [q.x + half, q.y];
    const face = [[A[0], A[1], q.mount], [B[0], B[1], q.mount], [B[0], B[1], q.top], [A[0], A[1], q.top]];
    const pr = face.map(p => proj(cam, p, S));
    const hpx = pr.every(Boolean) ? Math.hypot(pr[3][0] - pr[0][0], pr[3][1] - pr[0][1]) : 0;
    const col = STATUS[opt.status && opt.status[s.id]] || P.none;
    if (s.id === opt.sel && pr.every(Boolean)) hits.face = pr;   // углы плиты на экране — под настоящий макет вблизи
    if (hpx > 4) {
      const lam = Math.max(0, LIGHT[1]);
      const plateC = mono(hex2rgb(s.type === 'T1' ? '#fad201' : '#2e3032')), inkC = mono(hex2rgb(s.type === 'T1' ? '#0a0a0a' : '#f1f0ea'));
      const faceC = mul(plateC, .82 + .55 * lam);
      quad(face, faceC, { bias: -3, stroke: mix(faceC, inkC, .42), lw: 1.2 });
      // вблизи — строки набора полосками
      if (hpx > 11) {
        const rows = t.kind === 'direction' ? Math.max(1, s.msgs.length) : 1, inx = half * .16, pad = q.h * .08;
        for (let k = 0; k < rows; k++) {
          const seg = (q.h - pad * 2) / rows, z0 = q.top - pad - seg * (k + .62), z1 = z0 + seg * .3;
          quad([[A[0] + inx, A[1], z0], [B[0] - inx * 3.2, B[1], z0], [B[0] - inx * 3.2, B[1], z1], [A[0] + inx, A[1], z1]], inkC, { bias: -4 });
        }
      }
      if (t.kind === 'direction') quad([[q.x - .08, q.y, 0], [q.x + .08, q.y, 0], [q.x + .08, q.y, q.mount], [q.x - .08, q.y, q.mount]], mul(plateC, .6), { bias: -2 });
    }
    const chip = proj(cam, [q.x, q.y, q.top + 1.1], S), bs = proj(cam, [q.x, q.y, 0], S);
    if (!chip || !bs) return;
    hits.push({ id: s.id, x: chip[0], y: chip[1] });
    items.push({ d: chip[2] - 2, f: () => {
      g.globalAlpha = .85; g.strokeStyle = col; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(bs[0], bs[1]); g.lineTo(chip[0], chip[1]); g.stroke(); g.globalAlpha = 1;
    } });
    top.push({ d: chip[2], f: () => {
      const pulse = opt.pulse === s.id, r = pulse ? 11 : 8;
      if (pulse) { g.fillStyle = col; g.globalAlpha = .22; g.beginPath(); g.arc(chip[0], chip[1], r + 9, 0, 7); g.fill(); g.globalAlpha = 1; }
      if (opt.sel === s.id) { g.strokeStyle = P.sel; g.lineWidth = 2.5; g.beginPath(); g.arc(chip[0], chip[1], r + 6, 0, 7); g.stroke(); }
      // форма метки — тип носителя: круг — указатель, квадрат — табличка здания, ромб — тактильная
      g.fillStyle = col; g.strokeStyle = css(P.low); g.lineWidth = 2.2; g.beginPath();
      if (s.type === 'B1') { const k = r * .92; g.roundRect(chip[0] - k, chip[1] - k, k * 2, k * 2, k * .42); }
      else if (s.type === 'T1') { const k = r * 1.1; g.moveTo(chip[0], chip[1] - k); g.lineTo(chip[0] + k, chip[1]); g.lineTo(chip[0], chip[1] + k); g.lineTo(chip[0] - k, chip[1]); g.closePath(); }
      else g.arc(chip[0], chip[1], r, 0, 7);
      g.fill(); g.stroke();
    } });
  });
  items.sort((a, b) => b.d - a.d).forEach(i => i.f());
  top.sort((a, b) => b.d - a.d).forEach(i => i.f());
  return hits;
}
// камера встает перед лицевой стороной плиты
function faceCam(b, k = 3.4){
  const q = plateGeo(b);
  return { tx: q.x, ty: q.y, tz: (q.mount + q.top) / 2, dist: Math.max(1.6, q.h * k), pitch: .09, yaw: Math.PI };
}
function sizeCanvas(cv){
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, Hh = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [g, W, Hh];
}
const okIcon = ok => ok
  ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v8.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><circle cx="12" cy="18.6" r="1.7" fill="currentColor"/></svg>`;

/* ================================================================
   ШАПКА: камера по кругу пролетает над 3D-кампусом
   ================================================================ */
// точки пролета: yaw, pitch, dist, tx, ty, tz; между ними — плавный переход, по кругу
const FLY = [
  [.30, .82, 980, 0, 0, 0],      // весь кампус сверху
  [.62, .52, 420, -40, 10, 4],   // ниже, над главным корпусом
  [1.05, .34, 210, 20, 40, 8],   // низко вдоль двора
  [1.50, .44, 300, 90, 140, 6],  // к библиотеке и набережной
  [2.10, .62, 560, 40, 60, 0],   // разворот
  [2.60, .40, 260, -110, -30, 6],// над западными корпусами
  [3.10, .70, 760, 0, -20, 0],   // набор высоты
];
const LEG = 7;   // секунд на перелет между точками
// статусы меток: часть согласована, часть ждет правок — как в рабочей карте
const FLY_STATUS = Object.fromEntries(BOARDS.map((b, i) => [b.id, i % 5 === 0 ? 'fix' : i % 3 === 0 ? '' : 'ok']));
function liveFly(stage){
  const cv = stage.querySelector('.nv-cv'), cam = { yaw: 0, pitch: 0, dist: 0, tx: 0, ty: 0, tz: 0 };
  let t = 0, last = 0, timer = 0;
  const keys = ['yaw', 'pitch', 'dist', 'tx', 'ty', 'tz'];
  function frame(){
    const n = FLY.length, k = t / LEG, i = Math.floor(k) % n, a = FLY[i], b = FLY[(i + 1) % n];
    // последняя точка ведет в первую: yaw продолжает расти, чтобы камера не крутилась назад
    const e = ease(k - Math.floor(k)), turn = i === n - 1 ? 2 * Math.PI * Math.ceil((a[0] - b[0]) / (2 * Math.PI)) : 0;
    keys.forEach((key, j) => { cam[key] = j === 2 ? Math.exp(lerp(Math.log(a[j]), Math.log(b[j]), e)) : lerp(a[j], b[j] + (j ? 0 : turn), e); });
    const [g, W, Hh] = sizeCanvas(cv);
    draw3d(g, W, Hh, cam, { pal: dark() ? PAL.dark : PAL.light, status: FLY_STATUS, labels: cam.dist > 120 && cam.dist < 700 });
  }
  function tick(){
    if (!stage.isConnected) return clearInterval(timer);
    const now = performance.now();
    t += Math.min(.1, (now - last) / 1000); last = now;
    frame();
  }
  // цикл на таймере, а не на requestAnimationFrame: так анимация не глохнет во встроенных окнах предпросмотра;
  // идет, только пока шапка на экране
  onScreen(stage, v => {
    clearInterval(timer);
    if (v && !still()) { last = performance.now(); timer = setInterval(tick, 1000 / 30); }
  });
  new MutationObserver(frame).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('resize', () => { if (stage.isConnected) frame(); });
  frame();
}

/* ================================================================
   ГЛАВА build: конструктор таблички. Слева — макет с размерными
   линиями и выносками-иконками напротив нужных строк (буквы и
   дистанция, сколько направлений, влезает ли, есть ли на плане,
   спорит ли стрелка с маршрутом, контраст); справа — заголовок
   и строки: стрелка (нажатие поворачивает), текст, убрать, «+».
   Подсказки — микроанимацией: в начале одна строка сама
   перепечатывается, у первой стрелки пульсирует кольцо, пока
   ее не нажали; изменившаяся выноска подпрыгивает.
   ================================================================ */
const START = { D2: ['Библиотека', 'Спортзал', 'Столовая', 'УЛК'], B1: '6 Корпус Т', T1: 'Столовая' };
const DEMO = 'Технопарк';   // это слово печатается вместо последней строки, пока посетитель ничего не трогал
const FROM = 'guk_sq';      // указатель стоит на площади у главного корпуса
const findObj = s => {
  const q = s.trim().toLowerCase().replace(/ё/g, 'е');
  if (!q) return null;
  const n = x => x.toLowerCase().replace(/ё/g, 'е');
  return OBJECTS.find(o => n(o.ru) === q || n(o.name) === q) || OBJECTS.find(o => q.length > 2 && (n(o.ru).startsWith(q) || n(o.name).startsWith(q)));
};
const ICON = {
  del: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  none: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/></svg>',
  // типы носителей: указатель на стойке, здание, точки Брайля
  D2: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 21V3M5 5h11l3 3-3 3H5zM6 13h11v5H6z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
  B1: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V8l8-4 8 4v13M4 21h16M9 21v-6h6v6M8 10h2M14 10h2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  T1: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></g></svg>',
  // выноски
  size: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18L9 6l5 12M6 14h6M17 6v12M15 8l2-2 2 2M15 16l2 2 2-2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  route: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-6 4-8 7-8s5-2 5-6M13 5h4v4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="19" r="1.8" fill="currentColor"/></svg>',
  count: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 10h14M5 14h14M5 18h9" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  fit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5v14M20 5v14M8 12h8M10 9l-3 3 3 3M14 9l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>',
  contrast: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
};
const arrowIcon = a => a ? `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><path d="M50 88V16"/><path d="M24 42L50 14L76 42"/></g></svg>` : ICON.none;
function buildHTML(c, headHTML){
  return `<div class="nv-build">
    <div class="nv-build-plate">
      <div class="nv-types" role="group">${['D2', 'B1', 'T1'].map((k, i) =>
        `<button class="nv-type${i ? '' : ' on'}" data-t="${k}" aria-label="${esc(H.pick(c.types[i]))}">${ICON[k]}<span>${H.T(c.types[i])}</span></button>`).join('')}</div>
      <div class="nv-info">
        <div class="nv-dim nv-dim-h"><span></span></div>
        <div class="nv-plate-box"></div>
        <div class="nv-dim nv-dim-w"><span></span></div>
        <div class="nv-calls"></div>
      </div>
      <div class="nv-paint" role="group" aria-label="${esc(H.pick(c.plate))}">${PLATES.map((r, i) =>
        `<button class="nv-swatch${i ? '' : ' on'}" data-ral="${r}" style="--c:${RAL[r][1]}" aria-label="${r.replace('RAL', 'RAL ')}, ${RAL[r][2]}" title="${r.replace('RAL', 'RAL ')}, ${RAL[r][2]}"><i></i></button>`).join('')}</div>
    </div>
    <div class="nv-build-side">${headHTML}<div class="nv-rows"></div></div>
  </div>`;
}
function liveBuild(box, c){
  const plateBox = box.querySelector('.nv-plate-box'), calls = box.querySelector('.nv-calls'), rowsBox = box.querySelector('.nv-rows');
  const dimH = box.querySelector('.nv-dim-h span'), dimW = box.querySelector('.nv-dim-w span'), info = box.querySelector('.nv-info');
  // строки указателя: текст и стрелка; ar: null — стрелка по маршруту, иначе — поставлена вручную
  const st = { type: 'D2', plate: 'RAL9004', rows: START.D2.map(t => ({ t, ar: null })), one: { B1: START.B1, T1: START.T1 }, touched: false, turned: false };
  let prevCalls = {}, demo = 0;
  const ink = () => RAL[st.plate][0] > 50 ? 'RAL9004' : 'RAL9016';   // на светлой плите текст темный
  const autoOf = t => { const o = findObj(t); return o ? route(FROM, o).ar : null; };
  const L = (k, rep = {}) => Object.entries(rep).reduce((x, [a, b]) => x.replace(`{${a}}`, b), H.pick(c.calls[k]));
  function rowsHTML(){
    const ph = esc(H.pick(c.placeholder));
    if (st.type !== 'D2') return `<div class="nv-row"><span class="nv-arrow ghost">${ICON[st.type]}</span><input class="nv-line" value="${esc(st.one[st.type])}" placeholder="${ph}" aria-label="${ph}"></div>`;
    return st.rows.map((r, i) => `<div class="nv-row">
      <button class="nv-arrow${!i && !st.turned ? ' nudge' : ''}" data-i="${i}" aria-label="${esc(H.pick(c.turn))}" title="${esc(H.pick(c.turn))}"></button>
      <input class="nv-line" data-i="${i}" value="${esc(r.t)}" placeholder="${ph}" aria-label="${ph}">
      <button class="nv-del" data-i="${i}" aria-label="${esc(H.pick(c.del))}" title="${esc(H.pick(c.del))}">${ICON.del}</button></div>`).join('')
      + (st.rows.length < 6 ? `<button class="nv-add" aria-label="${esc(H.pick(c.add))}" title="${esc(H.pick(c.add))}">${ICON.add}</button>` : '');
  }
  function drawRows(){ rowsBox.innerHTML = rowsHTML(); render(); }
  function render(){
    const t = TYPES[st.type], tac = t.kind === 'tactile', out = [];
    let items;
    if (st.type === 'D2') {
      items = st.rows.map((r, i) => ({ r, i })).filter(x => x.r.t.trim()).map(({ r, i }) => {
        const o = findObj(r.t), auto = o ? route(FROM, o) : { ar: null, dist: '' };
        return { ru: r.t.trim(), en: o ? o.en : '', ar: r.ar || auto.ar, dist: auto.dist, row: i, known: !!o, wrong: !!(r.ar && o && auto.ar && r.ar !== auto.ar) };
      });
      // стрелки у полей поворачиваются плавно: угол растет, не сбрасываясь на 0
      rowsBox.querySelectorAll('.nv-arrow[data-i]').forEach(b => {
        const r = st.rows[+b.dataset.i], a = r.ar || autoOf(r.t);
        if (!b.firstElementChild || !!a !== !b.classList.contains('empty')) b.innerHTML = arrowIcon(a);
        b.classList.toggle('empty', !a);
        if (a) { const deg = ARROW_DEG[a], prev = +(b.dataset.deg || deg), next = prev + ((deg - prev % 360 + 540) % 360 - 180); b.dataset.deg = next; b.firstElementChild.style.transform = `rotate(${next}deg)`; }
        const it = items.find(x => x.row === +b.dataset.i);
        b.classList.toggle('bad', !!(it && it.wrong));
      });
    } else {
      const line = st.one[st.type].trim(), m = /^(\d{1,3})\s+(.+)$/.exec(line), ru = m ? m[2] : line, o = findObj(ru);
      items = ru ? [{ ru, en: o ? o.en : '', no: st.type === 'B1' ? (m ? m[1] : o ? o.no : '') : '' }] : [];
    }
    const p = prep(st.type, items);
    plateBox.innerHTML = art(p, plateBox.clientWidth || 220, (plateBox.clientHeight || 480) * (tac ? .5 : st.type === 'B1' ? .62 : 1), tac ? null : RAL[st.plate][1], tac ? null : RAL[ink()][1]);
    const plate = plateBox.querySelector('.nv-plate');
    dimH.textContent = `${t.height} мм`; dimW.textContent = `${t.width} мм`;
    info.style.setProperty('--pw', plate.offsetWidth + 'px'); info.style.setProperty('--ph', plate.offsetHeight + 'px');
    box.querySelector('.nv-paint').classList.toggle('off', tac);
    // выноски — напротив строк, к которым относятся
    const pr = plate.getBoundingClientRect(), cr = calls.getBoundingClientRect(), at = k => pr.top - cr.top + pr.height * k;
    const yOf = el => { if (!el) return at(.5); const r = el.getBoundingClientRect(); return r.top - cr.top + r.height / 2; };
    const nm = i => plate.querySelector(`.nv-nm[data-i="${i}"]`);
    out.push(['size', true, yOf(nm(0)), L(tac ? 'sizeT' : 'size', { mm: p.xh, m: t.dist })]);
    if (st.type === 'D2' && items.length > t.maxMsg) out.push(['count', false, at(.5), L('count', { n: items.length, max: t.maxMsg })]);
    p.ms.forEach((m, k) => {
      if (m.fr.over) out.push(['fit', false, yOf(nm(k)), L('fit')]);
      else if (st.type === 'D2' && !items[k].known) out.push(['map', false, yOf(nm(k)), L('unknown')]);
      else if (st.type === 'D2' && items[k].wrong) out.push(['route', false, yOf(plate.querySelector(`.nv-ar[data-i="${k}"]`)), L('wrong')]);
    });
    if (st.type === 'D2' && items.length && !out.some(x => !x[1] && x[0] !== 'count')) out.push(['route', true, yOf(plate.querySelector('.nv-ar[data-i="1"]') || nm(0)), L('route')]);
    const contrast = tac ? contrastOf('RAL1023', 'RAL9004') : contrastOf(st.plate, ink());
    out.push(['contrast', contrast >= CFG.contrastMin, at(.97), tac ? L('gost') : L('contrast', { c: contrast, n: CFG.contrastMin })]);
    calls.innerHTML = out.map(([icon, ok, top, txt]) => {
      const key = icon + txt, pop = !prevCalls[key] && Object.keys(prevCalls).length ? ' pop' : '';
      return `<p class="nv-call${ok ? '' : ' bad'}${pop}" style="top:${top}px"><span class="nv-ic">${ICON[icon]}</span><span>${H.T(txt)}</span></p>`;
    }).join('');
    prevCalls = Object.fromEntries(out.map(([icon, , , txt]) => [icon + txt, 1]));
    // выноски не наезжают друг на друга: каждая следующая — не выше низа предыдущей
    let floor = -Infinity;
    [...calls.children].map((el, i) => [el, out[i][2]]).sort((a, b) => a[1] - b[1]).forEach(([el, top]) => {
      const h = el.offsetHeight, y = Math.max(top, floor + h / 2 + 10);
      el.style.top = y + 'px'; floor = y + h / 2;
    });
  }
  const touch = () => { st.touched = true; clearTimeout(demo); };
  rowsBox.addEventListener('input', e => {
    touch();
    const i = e.target.dataset.i;
    if (st.type === 'D2') st.rows[+i].t = e.target.value; else st.one[st.type] = e.target.value;
    render();
  });
  rowsBox.addEventListener('focusin', touch);
  rowsBox.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    touch();
    if (b.classList.contains('nv-arrow')) {
      // нажатие поворачивает стрелку на 45° по часовой; полный круг до маршрута — снова «по маршруту»
      const r = st.rows[+b.dataset.i], auto = autoOf(r.t), cur = r.ar || auto || 'left';
      const next = ARROWS[(ARROWS.indexOf(cur) + 1) % 8];
      r.ar = next === auto ? null : next;
      if (!st.turned) { st.turned = true; rowsBox.querySelector('.nudge')?.classList.remove('nudge'); }
      render();
    } else if (b.classList.contains('nv-del')) { st.rows.splice(+b.dataset.i, 1); drawRows(); }
    else if (b.classList.contains('nv-add')) { st.rows.push({ t: '', ar: null }); drawRows(); rowsBox.querySelectorAll('.nv-line')[st.rows.length - 1].focus(); }
  });
  box.querySelectorAll('.nv-type').forEach(b => b.addEventListener('click', () => {
    touch(); st.type = b.dataset.t;
    box.querySelectorAll('.nv-type').forEach(x => x.classList.toggle('on', x === b));
    drawRows();
  }));
  box.querySelectorAll('.nv-swatch').forEach(b => b.addEventListener('click', () => {
    touch(); st.plate = b.dataset.ral;
    box.querySelectorAll('.nv-swatch').forEach(x => x.classList.toggle('on', x === b));
    render();
  }));
  // показ: последняя строка стирается и печатается заново, пока посетитель ничего не трогал
  function typeDemo(){
    const i = st.rows.length - 1, inp = () => rowsBox.querySelectorAll('.nv-line')[i];
    if (st.touched || st.type !== 'D2' || !inp()) return;
    const from = st.rows[i].t, steps = [...Array(from.length)].map((_, k) => from.slice(0, from.length - k - 1)).concat([...DEMO].map((_, k) => DEMO.slice(0, k + 1)));
    rowsBox.classList.add('typing');
    const step = k => {
      if (st.touched || !inp()) return rowsBox.classList.remove('typing');
      st.rows[i].t = steps[k]; inp().value = steps[k]; render();
      if (k + 1 < steps.length) demo = setTimeout(() => step(k + 1), k < from.length ? 90 : 120);
      else rowsBox.classList.remove('typing');
    };
    step(0);
  }
  onScreen(box, v => { if (v && !st.touched && !still() && !demo) demo = setTimeout(typeDemo, 1200); }, '0px 0px -30% 0px');
  new ResizeObserver(render).observe(plateBox);
  drawRows();
}

/* ================================================================
   ГЛАВА campus: одна карта, две роли — разница видна без слов.
   Студия (карандаш): рабочий проект — текст плиты правится в полях,
   иконки ТЗ, замечания заказчика с кнопкой-галочкой «учтено».
   Заказчик (глаз): ничего не правит — на табличке пульсирует
   мишень, нажатие ставит точку и открывает замечание; кнопка
   «согласовать». Отправленное замечание улетает точкой к кнопке
   «студия», на ней растет счетчик.
   Под окном — подпись (не часть интерфейса): у студии — программа
   на компьютере дизайнера, у заказчика — ссылка в браузере; у
   заказчика окно в фиолетовой рамке. В студии — ТЗ носителя;
   у заказчика поле замечания всегда открыто, точка — по желанию.
   Нажатие на метку — подлет вплотную, на плите настоящий макет;
   вблизи тянуть — обойти вокруг, стрелка назад — к карте.
   Подсказки: рука «нажимает» на метку, пока не нажали; вблизи —
   рука тянет, пока не потянули.
   ================================================================ */
const CI = {
  studio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  client: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  walk: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="2" fill="currentColor"/><path d="M10 21l2-6-2-3 1-4 4 3 3 1M12 15l3 2v4M11 8l-4 3v3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10l9-6 9 6M5 9v11h14V9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.5 15a1.5 1.5 0 0 1 2.4-1.8L9 15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  en: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2 19h20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 5-9 5-9-5zM3 14l9 5 9-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16L16 4l4 4L8 20zM8 12l2 2M11 9l2 2M14 6l2 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  export: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7 9l5-5 5 5M5 14v5h14v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
};
function campusHTML(c){
  const rb = (cls, icon, label) => `<button class="nv-round ${cls}" aria-label="${esc(H.pick(label))}" title="${esc(H.pick(label))}">${icon}</button>`;
  return `<div class="nv-campus">
    <div class="nv-roles" role="tablist">${['studio', 'client'].map((m, i) =>
      `<button class="nv-role-btn${i ? '' : ' on'}" data-m="${m}" role="tab" aria-selected="${!i}">${CI[m]}<span>${H.T(c.modes[i])}</span>${i ? '' : '<b class="nv-badge" hidden>0</b>'}</button>`).join('')}</div>
    <div class="nv-device">
      <div class="nv-device-body">
        <div class="nv-scene">
          <canvas class="nv-cv"></canvas>
          <div class="nv-face" aria-hidden="true"></div>
          <span class="nv-hand" aria-hidden="true">${CI.hand}</span>
          ${rb('nv-back', CI.back, c.back)}
          <div class="nv-zoom">${rb('nv-near', ICON.add, c.near)}${rb('nv-far', CI.minus, c.far)}${rb('nv-all', CI.home, c.all)}</div>
        </div>
        <aside class="nv-panel"></aside>
      </div>
    </div>
    <p class="nv-device-cap"></p>
  </div>`;
}
function liveCampus(box, c){
  const cv = box.querySelector('.nv-cv'), panel = box.querySelector('.nv-panel'), cap = box.querySelector('.nv-device-cap'), root = box.querySelector('.nv-campus');
  const badge = box.querySelector('.nv-badge'), scene = box.querySelector('.nv-scene');
  const HOME = { yaw: .46, pitch: .7, dist: 680, tx: 0, ty: -20, tz: 0 };
  const cam = { ...HOME };
  // texts — правки студии, notes — замечания заказчика [{x, y, t, done}], status — ok у согласованных
  const st = { mode: 'studio', sel: D2().id, texts: {}, notes: {}, status: {}, close: false, pin: null, pinned: false, edited: false };
  let hits = [], anim = 0, raf = 0;
  const board = () => BOARDS.find(b => b.id === st.sel);
  const open = id => (st.notes[id] || []).filter(n => !n.done);
  const openAll = () => BOARDS.reduce((s, b) => s + open(b.id).length, 0);
  function prepEdited(b){
    const tx = st.texts[b.id];
    if (!tx) return prepBoard(b);
    if (b.type === 'D2') return prep('D2', b.msgs.map((id, i) => { const o = objById.get(id); return { ru: tx[i] ?? o.ru, en: o.en, ...route(b.node, o) }; }));
    const o = objById.get(b.msgs[0]);
    return prep(b.type, [{ ru: tx[0] ?? o.ru, en: o.en, no: o.no }]);
  }
  const face = box.querySelector('.nv-face');
  function showFace(){
    const f = hits.face;
    if (!st.close || !f) return hideFace();
    const xs = f.map(p => p[0]), ys = f.map(p => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
    face.innerHTML = art(prepEdited(board()), w, h);
    face.style.cssText = `left:${x0 + w / 2}px;top:${y0 + h / 2}px`;
    face.classList.add('on');
  }
  function hideFace(){ face.classList.remove('on'); }
  function draw(){
    raf = 0;
    if (!box.isConnected) return;
    const [g, W, Hh] = sizeCanvas(cv), status = {};
    BOARDS.forEach(b => { status[b.id] = open(b.id).length ? 'fix' : st.mode === 'client' && st.status[b.id] === 'ok' ? 'ok' : ''; });
    hits = draw3d(g, W, Hh, cam, { pal: dark() ? PAL.dark : PAL.light, status, sel: st.sel, labels: cam.dist > 120 });
    placeHand();
  }
  const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };
  function fly(target, ms = 1100){
    cancelAnimationFrame(anim); hideFace();
    const from = { ...cam }, t0 = performance.now();
    let dy = target.yaw - from.yaw;
    while (dy > Math.PI) dy -= 2 * Math.PI;
    while (dy < -Math.PI) dy += 2 * Math.PI;
    const step = now => {
      const k = still() ? 1 : clamp((now - t0) / ms, 0, 1), e = ease(k);
      for (const key of ['tx', 'ty', 'tz', 'pitch']) cam[key] = lerp(from[key], target[key], e);
      cam.dist = Math.exp(lerp(Math.log(from.dist), Math.log(target.dist), e)); cam.yaw = from.yaw + dy * e;
      draw();
      if (k < 1) anim = requestAnimationFrame(step); else showFace();
    };
    anim = requestAnimationFrame(step);
  }
  const hand = box.querySelector('.nv-hand');
  // рука-подсказка: на карте «нажимает» на метку выбранной таблички, вблизи — тянет, чтобы обойти вокруг
  let tapped = false, walked = false;
  function placeHand(){
    if (st.close) { hand.className = 'nv-hand drag' + (walked ? ' gone' : ''); hand.style.left = hand.style.top = ''; return; }
    const h = hits.find(x => x.id === st.sel);
    hand.className = 'nv-hand tap' + (tapped || !h ? ' gone' : '');
    if (h) { hand.style.left = h.x + 'px'; hand.style.top = h.y + 'px'; }
  }
  const setClose = v => { st.close = v; scene.classList.toggle('close', v); placeHand(); };
  // замечания ТЗ — иконкой и двумя словами
  function issuesOf(b){
    const p = prepEdited(b), out = [];
    p.ms.forEach(m => { if (m.fr.over) out.push(['fit', `«${m.ru}» ${H.pick(c.fit)}`]); });
    if (b.type !== 'T1') p.ms.forEach(m => { if (!m.en) out.push(['en', H.pick(c.noEn)]); });
    return out;
  }
  const issueHTML = b => { const is = issuesOf(b); return `<ul class="nv-chips">${(is.length ? is : [['ok', H.pick(c.clean)]]).map(([k, t]) =>
    `<li class="${k === 'ok' ? 'ok' : 'bad'}"><span class="nv-ic">${k === 'ok' ? CI.check : k === 'en' ? CI.en : ICON.fit}</span>${H.T(t)}</li>`).join('')}</ul>`; };
  const plateWithPins = (b, w, h, target) => `<div class="nv-pinbox${target ? ' live' : ''}">${art(prepEdited(b), w, h)}${
    (st.notes[b.id] || []).map((n, i) => n.done ? '' : `<span class="nv-dot" style="left:${n.x}%;top:${n.y}%">${i + 1}</span>`).join('')}${
    st.pin ? `<span class="nv-dot new" style="left:${st.pin.x}%;top:${st.pin.y}%">${(st.notes[b.id] || []).length + 1}</span>` : ''}${
    target && !st.pinned && !st.pin ? '<span class="nv-target" aria-hidden="true"></span>' : ''}</div>`;
  // ТЗ носителя «для вида»: размеры, дистанция чтения, буквы, лимит строк, контраст и краски — из правил типа
  const specHTML = b => {
    const t = TYPES[b.type], tac = t.kind === 'tactile', L = c.spec;
    const rows = [
      [L.plate, `${t.width} × ${t.height} мм`],
      [L.dist, tac ? H.pick(L.touch) : `${t.dist} м`],
      [L.xh, `${tac ? CFG.tactileX : t.dist * CFG.K} мм`],
      b.type === 'D2' ? [L.dirs, `до ${t.maxMsg}`] : [L.lines, `до ${t.maxLines}`],
      [L.contrast, `от ${CFG.contrastMin}`],
      [L.paint, tac ? 'RAL 1023 / 9004' : 'RAL 9004 / 9016'],
    ];
    return `<div class="nv-spec"><span class="nv-mini-label">${H.T(L.title)}</span><dl>${rows.map(([k, v]) => `<dt>${H.T(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
  };
  const head = (b) => `<div class="nv-side-head"><span class="nv-type-ic" title="${esc(TYPES[b.type].name)}">${ICON[b.type]}</span><b>№${b.n}</b><span>${H.T(b.zone)}</span></div>`;
  function renderPanel(){
    const b = board(), notes = st.notes[b.id] || [], live = open(b.id);
    // подпись под окном, не часть интерфейса: где открыта карта
    cap.innerHTML = st.mode === 'studio' ? `${CI.laptop}<span>${H.T(c.studioCap)}</span>` : `${CI.link}<span>${H.T(c.clientCap)}</span>`;
    if (st.mode === 'studio') {
      const p = prepEdited(b);
      panel.innerHTML = `${head(b)}
        <div class="nv-side-body">${plateWithPins(b, 140, 220)}
          <div class="nv-edit">${p.ms.map((m, i) => `<label class="nv-pen${!i && !st.edited ? ' nudge' : ''}">${CI.studio}<input class="nv-line" data-i="${i}" value="${esc(m.ru)}" aria-label="${esc(H.pick(c.edit))}"></label>`).join('')}</div></div>
        <div class="nv-issues">${issueHTML(b)}</div>
        ${specHTML(b)}
        ${live.length ? `<div class="nv-notes">${notes.map((n, i) => n.done ? '' : `<div class="nv-note"><span class="nv-dot">${i + 1}</span><p>${esc(n.t)}</p><button class="nv-round nv-resolve" data-i="${i}" aria-label="${esc(H.pick(c.resolve))}" title="${esc(H.pick(c.resolve))}">${CI.check}</button></div>`).join('')}</div>` : ''}`;
      panel.querySelectorAll('.nv-edit .nv-line').forEach(inp => inp.addEventListener('input', () => {
        st.edited = true; panel.querySelector('.nudge')?.classList.remove('nudge');
        const tx = st.texts[b.id] || (st.texts[b.id] = prepBoard(b).ms.map(m => m.ru));
        tx[+inp.dataset.i] = inp.value;
        panel.querySelector('.nv-pinbox').outerHTML = plateWithPins(b, 140, 220);
        panel.querySelector('.nv-issues').innerHTML = issueHTML(b);
        if (st.close) showFace();
      }));
      panel.querySelectorAll('.nv-resolve').forEach(btn => btn.addEventListener('click', () => {
        notes[+btn.dataset.i].done = true; renderPanel(); redraw(); updBadge();
      }));
    } else {
      const done = BOARDS.filter(x => st.status[x.id] === 'ok').length, ok = st.status[b.id] === 'ok';
      panel.innerHTML = `${head(b)}
        <div class="nv-client-plate">${plateWithPins(b, 190, 280, true)}</div>
        <div class="nv-bubble"><textarea class="nv-input" rows="2" placeholder="${esc(H.pick(c.note))}" aria-label="${esc(H.pick(c.note))}"></textarea><button class="nv-round nv-send" aria-label="${esc(H.pick(c.send))}">${CI.send}</button></div>
        ${live.length ? `<div class="nv-notes">${notes.map((n, i) => n.done ? '' : `<div class="nv-note"><span class="nv-dot">${i + 1}</span><p>${esc(n.t)}</p></div>`).join('')}</div>` : ''}
        <div class="nv-approve"><button class="btn nv-ok${ok ? ' on' : ''}">${CI.check}<span class="spell">${H.T(ok ? c.done : c.ok)}</span></button><span class="nv-count">${done}/${BOARDS.length}</span></div>`;
      panel.querySelector('.nv-pinbox').addEventListener('click', e => {
        const r = e.currentTarget.getBoundingClientRect();
        st.pin = { x: clamp((e.clientX - r.left) / r.width * 100, 4, 96), y: clamp((e.clientY - r.top) / r.height * 100, 4, 96) };
        const draft = panel.querySelector('.nv-bubble textarea').value;
        st.pinned = true; renderPanel();
        const ta = panel.querySelector('.nv-bubble textarea'); ta.value = draft; ta.focus();
      });
      const send = () => {
        const inp = panel.querySelector('.nv-bubble textarea'), v = inp.value.trim();
        if (!v) return inp.focus();
        // без точки замечание крепится в правый верхний угол таблички
        const pin = st.pin || { x: 88, y: 8 };
        const from = (panel.querySelector('.nv-dot.new') || panel.querySelector('.nv-pinbox'))?.getBoundingClientRect();
        (st.notes[b.id] || (st.notes[b.id] = [])).push({ ...pin, t: v }); delete st.status[b.id];
        st.pin = null; renderPanel(); redraw();
        flyToStudio(from);
      };
      panel.querySelector('.nv-send')?.addEventListener('click', send);
      panel.querySelector('.nv-bubble textarea').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
      panel.querySelector('.nv-ok').addEventListener('click', () => { st.status[b.id] = ok ? '' : 'ok'; st.pin = null; renderPanel(); redraw(); });
    }
  }
  // замечание улетает точкой к кнопке «студия», счетчик подпрыгивает
  function updBadge(pop){
    const n = openAll();
    badge.hidden = !n; badge.textContent = n;
    if (pop) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
  }
  function flyToStudio(from){
    const to = badge.parentElement.getBoundingClientRect();
    if (!from || still()) return updBadge(true);
    const dot = document.createElement('span');
    dot.className = 'nv-flydot';
    dot.style.cssText = `left:${from.left + from.width / 2}px;top:${from.top + from.height / 2}px`;
    document.body.appendChild(dot);
    requestAnimationFrame(() => { dot.style.transform = `translate(${to.right - 14 - from.left - from.width / 2}px,${to.top + 6 - from.top - from.height / 2}px) scale(.6)`; });
    setTimeout(() => { dot.remove(); updBadge(true); }, 750);
  }
  // нажатие на метку — подлет вплотную к табличке; оттуда можно тянуть и обойти вокруг или вернуться к карте
  function select(id){
    st.sel = id; st.pin = null; tapped = true;
    renderPanel();
    setClose(true); fly(faceCam(board(), 1.7), 1300);
  }
  box.querySelectorAll('.nv-role-btn').forEach(b => b.addEventListener('click', () => {
    st.mode = b.dataset.m; st.pin = null;
    box.querySelectorAll('.nv-role-btn').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    root.classList.toggle('client', st.mode === 'client');
    renderPanel(); redraw();
  }));
  const toMap = () => { setClose(false); fly(HOME, 1300); };
  box.querySelector('.nv-back').addEventListener('click', toMap);
  box.querySelector('.nv-all').addEventListener('click', toMap);
  const zoom = k => { cancelAnimationFrame(anim); hideFace(); cam.dist = clamp(cam.dist * k, 3, 1800); if (cam.dist > 60) setClose(false); redraw(); };
  box.querySelector('.nv-near').addEventListener('click', () => zoom(.72));
  box.querySelector('.nv-far').addEventListener('click', () => zoom(1.38));
  // тянуть — повернуть; нажатие без сдвига — выбрать метку
  let drag = null;
  cv.addEventListener('pointerdown', e => {
    cancelAnimationFrame(anim);
    drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, moved: false };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    hideFace(); if (st.close) { walked = true; placeHand(); }
    cam.yaw = drag.yaw - dx * .006; cam.pitch = clamp(drag.pitch + dy * .004, .06, 1.3);
    redraw();
  });
  cv.addEventListener('pointerup', e => {
    if (drag && !drag.moved) {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = null, bd = 22;
      for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
      if (best) select(best.id);
    }
    drag = null;
  });
  cv.addEventListener('pointercancel', () => { drag = null; });
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new ResizeObserver(() => { redraw(); requestAnimationFrame(showFace); }).observe(cv);
  renderPanel(); redraw();
}

/* ---------- запись экрана ---------- */
// rec: 'kinescope:ID' или { src, w, h, crop } — размер записи и черные поля по бокам, зашитые в нее (px):
// окно плеера — по видео без полей, плеер чуть шире окна, поля уходят за края
const recHTML = v => {
  const o = typeof v === 'string' ? { src: v } : v, w = o.w || 1920, h = o.h || 1080, crop = o.crop || 0, cw = w - crop * 2;
  const id = String(o.src).replace(/^kinescope:/, '');
  return `<div class="nv-rec" style="--ar:${cw} / ${h};--fw:${(w / cw * 100).toFixed(3)}%;--fx:${(-crop / cw * 100).toFixed(3)}%"><iframe src="https://kinescope.io/embed/${esc(id)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen title="Запись экрана студии"></iframe></div>`;
};

/* ---------- сборка кейса ---------- */
const KINDS = {
  build: [buildHTML, liveBuild],
  campus: [campusHTML, liveCampus],
  rec: [recHTML, () => {}],
};
// demo — ярко-зеленая кнопка рядом с заголовком главы
const head = ch => `<div class="nv-head">
  <span class="case-label nv-label">${H.T(ch.label)}</span>
  <div class="nv-title-row"><h2 class="nv-title">${H.T(ch.title)}</h2>${ch.demo ? `<a class="btn nv-demo" href="${esc(ch.demo.link)}" target="_blank" rel="noopener"><span class="spell">${H.T(ch.demo.text)}</span></a>` : ''}</div>
  ${ch.text ? `<p class="nv-text">${H.T(ch.text)}</p>` : ''}
</div>`;
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'navi.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountNavi(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (document.fonts) await document.fonts.ready;
  if (!mount.isConnected) return;   // кейс успели закрыть
  measureX();
  const N = p.navi;
  // шапка кейса: вместо обложки — пролеты над 3D-кампусом (обложка видна, пока грузится код)
  const hero = (mount.closest('.case-body') || mount).parentElement?.querySelector('.case-hero');
  if (hero && N.fly) {
    hero.classList.add('nv-hero');
    hero.insertAdjacentHTML('beforeend', '<canvas class="nv-cv nv-fly" aria-hidden="true"></canvas>');
    liveFly(hero);
  }
  const ch = N.chapters || [];
  const kinds = ch.map(c => Object.keys(KINDS).find(k => c[k]));
  // у конструктора заголовок стоит внутри правой колонки — так вся глава помещается в один экран
  mount.innerHTML = ch.map((c, i) => kinds[i] === 'build'
    ? `<section class="nv-ch wrap nv-build-ch"><div class="nv-viz">${buildHTML(c.build, head(c))}</div></section>`
    : `<section class="nv-ch wrap nv-${kinds[i]}-ch">${head(c)}<div class="nv-viz">${kinds[i] ? KINDS[kinds[i]][0](c[kinds[i]]) : ''}</div></section>`).join('');
  mount.querySelectorAll('.nv-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.nv-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.nv-viz'), ch[i][k]); });
}
