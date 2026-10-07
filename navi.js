/* ================================================================
   КЕЙС «СТУДИЯ ДИЗАЙНА НАВИГАЦИИ» (поле navi у проекта)
   В шапке — 3D-ролик, написанный кодом: кампус Бауманки на холсте,
   камера и титры по сценам, плеер с паузой и перемоткой.
   Главы: build — конструктор таблички: текст → макет, цвет плиты
   и текста из красок RAL, сверка с техзаданием на лету;
   campus — 3D-кампус: тянуть — поворот, метка — табличка в панели,
   «подойти к табличке», переключатель «студия / заказчик»
   (замечание заказчика сразу видно в студии);
   rec — запись экрана настоящей студии (Kinescope).
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
const arrowSvg = (a, sz, c) => `<svg width="${sz}" height="${sz}" viewBox="0 0 100 100" style="transform:rotate(${ARROW_DEG[a]}deg);display:block" aria-hidden="true"><g fill="none" stroke="${c}" stroke-width="11"><path d="M50 94V18"/><path d="M23 43L50 15L77 43"/></g></svg>`;
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
    const rows = p.ms.map(m => {
      const meta = [m.en, m.dist].filter(Boolean);
      return `<div style="display:flex;align-items:flex-start;gap:${u(p.gap)}">
        <div style="flex:1 1 auto;min-width:0">
          <div style="font-weight:600;font-size:${u(p.size)};line-height:${u(p.lh)};letter-spacing:${u(m.fr.tr * p.size)};white-space:nowrap${over(m)}">${m.fr.lines.map(esc).join('<br>')}</div>
          ${meta.length ? `<div style="display:flex;gap:${u(p.size * .34)};margin-top:${u(p.size * .14)};opacity:.72;${small(p.size * .52)}">${meta.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
        </div>
        <div style="flex:0 0 ${u(p.aw)};padding-top:${u(p.size * .06)}">${m.ar ? arrowSvg(m.ar, u(p.aw), ink) : ''}</div></div>`;
    }).join('');
    body = `<div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:${p.ms.length > 1 ? 'space-between' : 'flex-start'};padding-bottom:${u(p.size * .5)}">${rows}</div>`;
  } else {
    const m = p.ms[0] || { ru: '', en: '', fr: { lines: [''] } };
    const dots = [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${3.4 + (i % 3) * 8}" cy="${4 + Math.floor(i / 3) * 7.6}" r="2.1" fill="${ink}"/>`).join('');
    body = `<div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:${u(p.size * (tac ? .42 : .1))}">
      ${m.no ? `<div style="font-weight:700;font-size:${u(p.size * 1.6)};line-height:.88;margin-bottom:${u(p.size * .06)}">${esc(m.no)}</div>` : ''}
      <div style="font-weight:${tac ? 700 : 600};font-size:${u(p.size)};line-height:${u(p.lh)};white-space:nowrap${over(m)}">${m.fr.lines.map(esc).join('<br>')}</div>
      ${!tac && m.en ? `<div style="opacity:.72;${small(p.size * .52)}">${esc(m.en)}</div>` : ''}
      ${tac ? `<svg width="${u(p.size * 2.1)}" height="${u(p.size * .86)}" viewBox="0 0 27 14" style="display:block" aria-hidden="true">${dots}</svg>` : ''}</div>`;
  }
  const ff = Math.max(5, p.size * .24);
  const pictos = t.kind === 'direction' ? `<div style="display:flex;gap:${u(p.size * .2)}">${picto('ped', u(p.size * .46), ink)}${picto('acc', u(p.size * .46), ink)}</div>` : '';
  const footer = `<div style="flex:0 0 auto"><div style="background:${ink};opacity:.18;height:${u(1.6)};margin-bottom:${u(ff * .9)}"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:${u(ff)}"><div style="font-weight:600;opacity:.8;${small(ff)}">${tac ? 'Тактильная табличка' : esc(MARK)}</div>${pictos}</div></div>`;
  return `<div class="nv-plate" style="border-radius:${u(Math.min(18, t.width * .028))};${tac ? `box-shadow:inset 0 0 0 ${u(6)} ${ink},0 26px 60px -24px rgba(0,0,0,.45);` : ''}width:${u(t.width)};height:${u(t.height)};background:${plate};color:${ink};padding:${t.safe.map(u).join(' ')}">${body}${footer}</div>`;
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
   3D-РОЛИК В ШАПКЕ: сцены по времени, камера между точками a и b
   ================================================================ */
// сцена: d — длительность, cam a → b, ov — картинка поверх кадра, dim — затемнение кадра под ней
// титры и тексты картинок — в content.js (film.scenes), по порядку
const SCENES = [
  { d: 6, cam: [[.10, .72, 1100], [.46, .66, 900]], reveal: [0, 1] },
  { d: 5, ov: 'chap', dim: .9, cam: [[.46, .66, 900], [.52, .66, 910]] },
  { d: 9, ov: 'grid', dim: .86, cam: [[.52, .66, 910], [.62, .66, 930]] },
  { d: 9, ov: 'gridBad', dim: .86, cam: [[.62, .66, 930], [.72, .66, 950]] },
  { d: 9, ov: 'pdf', dim: .88, cam: [[.72, .66, 950], [.82, .68, 965]] },
  { d: 6, ov: 'chap', dim: .9, cam: [[.82, .68, 965], [.88, .70, 955]] },
  { d: 12, ov: 'text', dim: .9, cam: [[.88, .70, 955], [.98, .72, 940]] },
  { d: 14, ov: 'checks', dim: .9, cam: [[.98, .72, 940], [1.08, .74, 930]] },
  { d: 11, ov: 'palette', dim: .9, cam: [[1.08, .74, 930], [1.16, .74, 920]] },
  { d: 13, approach: true },
  { d: 9, cam: [[.2, .5, 120, 3], [.38, .66, 430, 2]], place: true },
  { d: 12, ov: 'client', dim: .9, cam: [[.38, .66, 430, 2], [.50, .72, 700]], status: 'mix' },
  { d: 8, ov: 'stages', dim: .9, cam: [[.50, .72, 700], [.60, .74, 820]], status: 'ok' },
  { d: 8, ov: 'logo', dim: .55, cam: [[.60, .74, 820], [.96, .80, 1250]], status: 'ok' },
];
const TOTAL = SCENES.reduce((s, x) => s + x.d, 0);
const statusMap = kind => {
  const m = {};
  BOARDS.forEach((b, i) => { m[b.id] = kind === 'mix' ? (i % 5 === 0 ? 'fix' : i % 3 === 0 ? 'ok' : '') : (i % 7 === 0 ? 'fix' : 'ok'); });
  return m;
};
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// картинки поверх кадра; sh — высота кадра в px (макеты плит считаются в пикселях)
const OV = {
  chap: c => `<div class="nv-ov nv-ov-chap"><span class="nv-chip">${H.T(c.chap[0])}</span><b>${H.T(c.chap[1])}</b><p>${H.T(c.chap[2])}</p></div>`,
  grid: () => gridOv(false),
  gridBad: () => gridOv(true),
  pdf: c => `<div class="nv-ov nv-ov-two"><div class="nv-stack">${Array.from({ length: 7 }, (_, i) => `<i style="--i:${i}"><b></b><b></b><b></b><b></b><b></b></i>`).join('')}</div>
    <div class="nv-letter">«${H.T(c.quote || '')}»</div></div>`,
  text: (c, sh) => {
    const b = D2(), p = prepBoard(b);
    return `<div class="nv-ov nv-ov-two"><div class="nv-code"><span>указатель, ${esc(b.zone.toLowerCase())}</span>${p.ms.map(m => `<span>${esc(m.ru)} ${m.ar ? ARROW_CH[m.ar] : ''}</span>`).join('')}</div>
      <div>${art(p, sh * .24, sh * .62)}</div></div>`;
  },
  checks: (c, sh) => `<div class="nv-ov nv-ov-two"><div>${art(prepBoard(D2()), sh * .22, sh * .58)}</div>
    <div class="nv-checks">${(c.checks || []).map(([k, t]) => `<div class="nv-chk ${k}"><span class="nv-ic">${okIcon(k === 'ok')}</span>${H.T(t)}</div>`).join('')}</div></div>`,
  palette: c => `<div class="nv-ov nv-ov-two"><div class="nv-sw">${['RAL9004', 'RAL9016', 'RAL6005', 'RAL1015'].map(r => `<div><i style="background:${RAL[r][1]}"></i>${r.replace('RAL', 'RAL ')}</div>`).join('')}</div>
    <div class="nv-contrast"><b>${contrastOf('RAL9016', 'RAL9004')}</b><span>${H.T(c.contrast[0])}</span><em>${H.T(c.contrast[1])}</em></div></div>`,
  client: (c, sh) => {
    const b = BOARDS.find(x => x.type === 'B1' && objById.get(x.msgs[0]).no) || BOARDS.find(x => x.type === 'B1');
    return `<div class="nv-ov nv-ov-two"><div>${art(prepBoard(b), sh * .24, sh * .42)}</div>
      <div class="nv-sheet"><b>${H.T(c.sheet.title)} №${b.n}</b><div class="nv-pin"><span></span><p>${H.T(c.sheet.note)}</p></div>
      <div class="nv-sheet-btns"><span class="ok">${H.T(c.sheet.ok)}</span><span class="fix">${H.T(c.sheet.fix)}</span></div></div></div>`;
  },
  stages: c => `<div class="nv-ov nv-ov-col"><div class="nv-stages">${c.stages.map((s, i) => `<span${i === c.stages.length - 1 ? ' class="on"' : ''}>${H.T(s)}</span>`).join('<em>→</em>')}</div>
    <div class="nv-vector"><b>${H.T(c.vector[0])}</b><span>${H.T(c.vector[1])}</span></div></div>`,
  logo: c => `<div class="nv-ov nv-ov-col nv-ov-logo"><b>${H.T(c.logo[0])}</b><span>${H.T(c.logo[1])}</span></div>`,
};
function gridOv(bad){
  const red = [4, 9, 15, 21, 26, 31, 38, 44];
  return `<div class="nv-ov"><div class="nv-grid">${Array.from({ length: 48 }, (_, i) =>
    `<div class="nv-mini${bad && red.includes(i) ? ' bad' : ''}"><i style="width:62%"></i><i style="width:44%"></i><i style="width:70%"></i><i style="width:38%"></i></div>`).join('')}</div></div>`;
}

function filmHTML(F){
  return `<div class="nv-film">
    <div class="nv-stage"><canvas class="nv-cv" aria-label="3D-ролик о студии дизайна навигации"></canvas><div class="nv-scrim"></div><div class="nv-ui"></div></div>
    <div class="wrap nv-film-bar">
      <div class="nv-ctl">
        <button class="btn btn-line nv-pp"><span class="spell">${H.T(F.play)}</span></button>
        <button class="btn btn-line nv-rs"><span class="spell">${H.T(F.again)}</span></button>
        <div class="nv-track" role="slider" tabindex="0" aria-label="Перемотка" aria-valuemin="0" aria-valuemax="${TOTAL}"><div class="nv-ticks">${SCENES.map((s, i) =>
          i ? `<i style="left:${SCENES.slice(0, i).reduce((a, x) => a + x.d, 0) / TOTAL * 100}%"></i>` : '').join('')}</div><div class="nv-bar"></div></div>
        <span class="nv-tc">0:00 / ${fmtTime(TOTAL)}</span>
      </div>
      <div class="nv-cap"><h3 class="nv-cap-t"></h3><p class="nv-cap-s"></p></div>
    </div>
  </div>`;
}
function liveFilm(box, F){
  const cv = box.querySelector('.nv-cv'), stage = box.querySelector('.nv-stage'), ui = box.querySelector('.nv-ui'), scrim = box.querySelector('.nv-scrim');
  const capT = box.querySelector('.nv-cap-t'), capS = box.querySelector('.nv-cap-s'), cap = box.querySelector('.nv-cap');
  const bar = box.querySelector('.nv-bar'), tc = box.querySelector('.nv-tc'), pp = box.querySelector('.nv-pp'), track = box.querySelector('.nv-track');
  const cam = { yaw: .32, pitch: .7, dist: 900, tx: 0, ty: 0, tz: 0 };
  let elapsed = 0, playing = false, wanted = !still(), visible = false, cur = -1, t0 = 0, timer = 0, from = null, to = null;
  const label = () => { pp.querySelector('.spell').innerHTML = H.T(playing ? F.play : elapsed >= TOTAL ? F.again : F.resume); };
  const sceneAt = t => {
    let acc = 0;
    for (let i = 0; i < SCENES.length; i++) { if (t < acc + SCENES[i].d || i === SCENES.length - 1) return [i, t - acc]; acc += SCENES[i].d; }
  };
  function enter(i){
    cur = i;
    const sc = SCENES[i], c = F.scenes[i] || {};
    cap.classList.toggle('off', !!c.chap);
    capT.innerHTML = c.t ? H.T(c.t) : ''; capS.innerHTML = c.s ? H.T(c.s) : '';
    cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
    ui.innerHTML = sc.ov ? OV[sc.ov](c, stage.clientHeight) : '';
    ui.classList.toggle('on', !!sc.ov);
    scrim.style.opacity = sc.dim || 0;
    if (sc.approach) { from = { ...cam }; to = faceCam(D2()); }
  }
  function frame(){
    const [i, local] = sceneAt(elapsed), sc = SCENES[i], k = clamp(local / sc.d, 0, 1), e = ease(k);
    if (i !== cur) enter(i);
    if (sc.approach && to) {
      let dy = to.yaw - from.yaw;
      while (dy > Math.PI) dy -= 2 * Math.PI;
      while (dy < -Math.PI) dy += 2 * Math.PI;
      cam.tx = lerp(from.tx, to.tx, e); cam.ty = lerp(from.ty, to.ty, e); cam.tz = lerp(from.tz, to.tz, e);
      cam.dist = lerp(from.dist, to.dist, Math.pow(e, .7)); cam.pitch = lerp(from.pitch, to.pitch, e); cam.yaw = from.yaw + dy * e;
    } else if (sc.cam) {
      const [a, b] = sc.cam;
      cam.yaw = lerp(a[0], b[0], e); cam.pitch = lerp(a[1], b[1], e); cam.dist = lerp(a[2], b[2], e);
      cam.tz = lerp(a[3] || 0, b[3] || 0, e); cam.tx = 0; cam.ty = 0;
    }
    const [g, W, Hh] = sizeCanvas(cv);
    draw3d(g, W, Hh, cam, {
      pal: PAL.dark, reveal: sc.reveal ? lerp(sc.reveal[0], sc.reveal[1], e) : 1,
      status: sc.status ? statusMap(sc.status) : null,
      pulse: sc.approach ? D2().id : sc.place && k > .45 ? BOARDS[3].id : null,
      labels: cam.dist > 120,
    });
    bar.style.width = elapsed / TOTAL * 100 + '%';
    tc.textContent = `${fmtTime(elapsed)} / ${fmtTime(TOTAL)}`;
    track.setAttribute('aria-valuenow', Math.round(elapsed));
  }
  function tick(){
    if (!box.isConnected) return stop();
    const now = performance.now();
    elapsed = Math.min(TOTAL, elapsed + (now - t0) / 1000); t0 = now;
    frame();
    if (elapsed >= TOTAL) { stop(); wanted = false; label(); }
  }
  // цикл на таймере, а не на requestAnimationFrame: так ролик не глохнет во встроенных окнах предпросмотра
  function start(){ if (playing) return; playing = true; t0 = performance.now(); timer = setInterval(tick, 1000 / 30); label(); }
  function stop(){ playing = false; clearInterval(timer); label(); }
  const sync = () => (wanted && visible ? start() : stop());
  pp.addEventListener('click', () => {
    if (elapsed >= TOTAL) { elapsed = 0; cur = -1; }
    wanted = !playing; sync();
    if (!playing) frame();
  });
  box.querySelector('.nv-rs').addEventListener('click', () => { elapsed = 0; cur = -1; wanted = true; sync(); frame(); });
  // перемотка: нажать или тянуть по полоске
  const seek = e => { const r = track.getBoundingClientRect(); elapsed = clamp((e.clientX - r.left) / r.width, 0, 1) * TOTAL * .9999; cur = -1; frame(); label(); };
  track.addEventListener('pointerdown', e => { track.setPointerCapture(e.pointerId); seek(e); track.onpointermove = seek; });
  track.addEventListener('pointerup', () => { track.onpointermove = null; });
  track.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' ? 5 : e.key === 'ArrowLeft' ? -5 : 0;
    if (d) { e.preventDefault(); elapsed = clamp(elapsed + d, 0, TOTAL - .01); cur = -1; frame(); }
  });
  onScreen(stage, v => { visible = v; sync(); });
  addEventListener('resize', () => { if (box.isConnected && !playing) { cur = -1; frame(); } });
  frame(); label();
}

/* ================================================================
   ГЛАВА build: конструктор таблички — текст, цвет, сверка с ТЗ
   ================================================================ */
const START = { D2: 'Библиотека\nСпортзал\nСтоловая\nУЛК', B1: '6 Корпус Т', T1: 'Столовая' };
const FROM = 'guk_sq';   // указатель стоит на площади у главного корпуса
const findObj = s => {
  const q = s.trim().toLowerCase().replace(/ё/g, 'е');
  if (!q) return null;
  const n = x => x.toLowerCase().replace(/ё/g, 'е');
  return OBJECTS.find(o => n(o.ru) === q || n(o.name) === q) || OBJECTS.find(o => q.length > 2 && (n(o.ru).startsWith(q) || n(o.name).startsWith(q)));
};
function buildHTML(c){
  const sw = (list, kind) => list.map((r, i) => `<button class="nv-swatch${i ? '' : ' on'}" data-kind="${kind}" data-ral="${r}" style="--c:${RAL[r][1]}" aria-label="${RAL[r][2]}, ${r.replace('RAL', 'RAL ')}"><i></i><span>${r.replace('RAL', 'RAL ')}</span></button>`).join('');
  return `<div class="nv-build">
    <div class="nv-build-plate"><div class="nv-plate-box"></div><p class="nv-plate-cap"></p></div>
    <div class="nv-build-side">
      <div class="nv-bar-btns">${c.types.map((t, i) => `<button class="btn btn-line nv-type${i ? '' : ' on'}" data-t="${['D2', 'B1', 'T1'][i]}"><span class="spell">${H.T(t)}</span></button>`).join('')}</div>
      <label class="nv-field"><span class="nv-mini-label">${H.T(c.field)}</span>
        <textarea class="nv-input" rows="4" spellcheck="false">${START.D2}</textarea>
        <span class="nv-hint">${H.T(c.hint)}</span></label>
      <div class="nv-colors">
        <div class="nv-swatches"><span class="nv-mini-label">${H.T(c.plate)}</span><div>${sw(PLATES, 'plate')}</div></div>
        <div class="nv-swatches"><span class="nv-mini-label">${H.T(c.ink)}</span><div>${sw(INKS, 'ink')}</div></div>
        <p class="nv-gost">${H.T(c.gost)}</p>
      </div>
      <div class="nv-checks-box"><span class="nv-mini-label">${H.T(c.checks)}</span><ul class="nv-list"></ul></div>
    </div>
  </div>`;
}
function liveBuild(box, c){
  const area = box.querySelector('.nv-input'), plateBox = box.querySelector('.nv-plate-box'), list = box.querySelector('.nv-list');
  const colors = box.querySelector('.nv-colors'), hint = box.querySelector('.nv-hint'), plateCap = box.querySelector('.nv-plate-cap');
  const st = { type: 'D2', plate: 'RAL9004', ink: 'RAL9016', text: { ...START } };
  function render(){
    const t = TYPES[st.type], tac = t.kind === 'tactile';
    const lines = area.value.split('\n').map(s => s.trim()).filter(Boolean);
    let items, unknown = [], checks = [];
    if (st.type === 'D2') {
      items = lines.map(l => { const o = findObj(l); if (!o) unknown.push(l); return o ? { ru: l, en: o.en, ...route(FROM, o) } : { ru: l, en: '', ar: null, dist: '' }; });
    } else {
      const m = /^(\d{1,3})\s+(.+)$/.exec(lines[0] || ''), ru = m ? m[2] : lines[0] || '', o = findObj(ru);
      items = ru ? [{ ru, en: o ? o.en : '', no: st.type === 'B1' ? (m ? m[1] : o ? o.no : '') : '' }] : [];
    }
    const p = prep(st.type, items);
    // макет в рамке: высота рамки — по колонке, ширина — по пропорциям плиты
    // на телефоне макет ниже, чтобы рядом было видно поле с текстом
    const bw = plateBox.clientWidth || 300, bh = innerWidth < 860 ? innerHeight * .42 : Math.min(innerHeight * .7, 620);
    plateBox.innerHTML = art(p, bw, tac ? bh * .6 : bh, RAL[st.plate][1], RAL[st.ink][1]);
    plateCap.innerHTML = H.T(t.name) + `, <span class="nv-nw">${t.width}\u00a0×\u00a0${t.height}\u00a0мм</span>`;
    // сверка с техзаданием
    const contrast = tac ? contrastOf('RAL1023', 'RAL9004') : contrastOf(st.plate, st.ink);
    if (!items.length) checks.push([false, 'Пока пусто — напишите, что должно быть на носителе']);
    checks.push([true, tac ? `Высота букв ${p.xh} мм — по ГОСТу для тактильных табличек` : `Высота строчных ${p.xh} мм — читается с ${t.dist} метров`]);
    if (st.type === 'D2') checks.push([items.length <= t.maxMsg, items.length <= t.maxMsg
      ? `Направлений: ${items.length} из ${t.maxMsg}` : `${items.length} направлений при лимите ${t.maxMsg} — разделите развилку на два указателя`]);
    else if (lines.length > 1) checks.push([false, 'На табличке здания — одно название, остальные строки не попадут на плиту']);
    const over = p.ms.filter(m => m.fr.over);
    checks.push([!over.length, over.length ? `«${over[0].fr.lines[0]}» не помещается — сократите название или возьмите носитель крупнее` : 'Текст помещается на плите']);
    unknown.forEach(u => checks.push([false, `«${u}» нет на плане — стрелку и расстояние не посчитать`]));
    if (st.type === 'D2' && items.length && !unknown.length) checks.push([true, 'Стрелки и расстояния посчитаны по дорожкам']);
    checks.push([contrast >= CFG.contrastMin, `Контраст ${contrast} при норме ${CFG.contrastMin}`]);
    list.innerHTML = checks.map(([ok, txt]) => `<li class="${ok ? 'ok' : 'bad'}"><span class="nv-ic">${okIcon(ok)}</span><span>${H.T(txt)}</span></li>`).join('');
    colors.classList.toggle('tac', tac);
    hint.innerHTML = H.T(st.type === 'D2' ? c.hint : st.type === 'B1' ? 'Номер корпуса и название через пробел' : 'Название помещения или здания');
  }
  box.querySelectorAll('.nv-type').forEach(b => b.addEventListener('click', () => {
    st.text[st.type] = area.value;
    st.type = b.dataset.t;
    area.value = st.text[st.type];
    area.rows = st.type === 'D2' ? 4 : 2;
    box.querySelectorAll('.nv-type').forEach(x => x.classList.toggle('on', x === b));
    render();
  }));
  box.querySelectorAll('.nv-swatch').forEach(b => b.addEventListener('click', () => {
    st[b.dataset.kind] = b.dataset.ral;
    box.querySelectorAll(`.nv-swatch[data-kind="${b.dataset.kind}"]`).forEach(x => x.classList.toggle('on', x === b));
    render();
  }));
  area.addEventListener('input', render);
  new ResizeObserver(render).observe(plateBox);
  render();
}

/* ================================================================
   ГЛАВА campus: 3D-кампус, студия и заказчик на одной карте
   ================================================================ */
function campusHTML(c){
  return `<div class="nv-campus">
    <div class="nv-scene">
      <canvas class="nv-cv"></canvas>
      <div class="nv-face" aria-hidden="true"></div>
      <div class="nv-zoom">
        <button class="nv-round nv-near" aria-label="${esc(H.pick(c.near))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
        <button class="nv-round nv-far" aria-label="${esc(H.pick(c.far))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
      </div>
      <p class="nv-scene-hint">${H.T(c.hint)}</p>
    </div>
    <aside class="nv-side">
      <div class="nv-bar-btns nv-modes">${c.modes.map((m, i) => `<button class="btn btn-line nv-mode${i ? '' : ' on'}" data-m="${i ? 'client' : 'studio'}"><span class="spell">${H.T(m)}</span></button>`).join('')}</div>
      <div class="nv-panel"></div>
    </aside>
  </div>
  <div class="nv-bar-btns nv-campus-btns">
    <button class="btn btn-line nv-go"><span class="spell">${H.T(c.go)}</span></button>
    <button class="btn btn-line nv-all"><span class="spell">${H.T(c.all)}</span></button>
  </div>`;
}
function liveCampus(box, c){
  const cv = box.querySelector('.nv-cv'), panel = box.querySelector('.nv-panel'), go = box.querySelector('.nv-go');
  const HOME = { yaw: .46, pitch: .7, dist: 680, tx: 0, ty: -20, tz: 0 };
  const cam = { ...HOME };
  const st = { mode: 'studio', sel: D2().id, status: {}, notes: {}, close: false, writing: false };
  let hits = [], anim = 0, raf = 0;
  const board = () => BOARDS.find(b => b.id === st.sel);
  const face = box.querySelector('.nv-face');
  // вплотную — поверх плиты встает настоящий макет, в размер плиты на экране
  function showFace(){
    const f = hits.face;
    if (!st.close || !f) return hideFace();
    const xs = f.map(p => p[0]), ys = f.map(p => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
    face.innerHTML = art(prepBoard(board()), w, h);
    face.style.cssText = `left:${x0 + w / 2}px;top:${y0 + h / 2}px`;
    face.classList.add('on');
  }
  function hideFace(){ face.classList.remove('on'); }
  function draw(){
    raf = 0;
    if (!box.isConnected) return;
    const [g, W, Hh] = sizeCanvas(cv);
    const status = {};
    // в студии метка с замечанием заказчика — фиолетовая, в клиентской — цвет статуса
    BOARDS.forEach(b => { status[b.id] = st.mode === 'client' ? st.status[b.id] || '' : st.notes[b.id] ? 'fix' : ''; });
    hits = draw3d(g, W, Hh, cam, { pal: dark() ? PAL.dark : PAL.light, status, sel: st.sel, labels: cam.dist > 120 });
  }
  const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };
  // плавный перелет камеры
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
  function setClose(v){
    st.close = v;
    go.querySelector('.spell').innerHTML = H.T(v ? c.back : c.go);
  }
  function checksOf(b){
    const p = prepBoard(b), t = TYPES[b.type], out = [];
    if (b.type === 'D2' && b.msgs.length > t.maxMsg) out.push(`${b.msgs.length} направлений при лимите ${t.maxMsg}`);
    p.ms.filter(m => m.fr.over).forEach(m => out.push(`«${m.ru}» не помещается`));
    if (b.type !== 'T1') p.ms.filter(m => !m.en).forEach(m => out.push(`Нет английского названия у «${m.ru}»`));
    return out;
  }
  function renderPanel(){
    const b = board(), p = prepBoard(b), t = TYPES[b.type], note = st.notes[b.id], s = st.status[b.id];
    const plate = `<div class="nv-side-plate">${art(p, 150, 230)}</div>`;
    const head = `<div class="nv-side-head"><b>${H.T(`${t.name} №${b.n}`)}</b><span>${H.T(b.zone)}</span></div>`;
    if (st.mode === 'studio') {
      const issues = checksOf(b);
      panel.innerHTML = `${head}<div class="nv-side-body">${plate}<ul class="nv-list">${
        (issues.length ? issues.map(x => `<li class="bad"><span class="nv-ic">${okIcon(false)}</span><span>${H.T(x)}</span></li>`)
          : [`<li class="ok"><span class="nv-ic">${okIcon(true)}</span><span>${H.T(c.clean)}</span></li>`]).join('')}</ul></div>
        ${note ? `<div class="nv-note"><span class="nv-mini-label">${H.T(c.from)}</span><p>${esc(note)}</p></div>` : ''}`;
    } else {
      const done = BOARDS.filter(x => st.status[x.id] === 'ok').length;
      panel.innerHTML = `${head}<div class="nv-side-body">${plate}<p class="nv-state ${s || 'none'}">${H.T(s === 'ok' ? c.done : s === 'fix' ? c.wait : c.none)}</p></div>
        ${st.writing ? `<div class="nv-write"><textarea class="nv-input" rows="2" placeholder="${esc(H.pick(c.note))}">${esc(note || '')}</textarea>
          <button class="btn btn-line nv-send"><span class="spell">${H.T(c.send)}</span></button></div>`
        : `<div class="nv-bar-btns"><button class="btn btn-line nv-ok${s === 'ok' ? ' on' : ''}"><span class="spell">${H.T(c.ok)}</span></button>
          <button class="btn btn-line nv-fix${s === 'fix' ? ' on' : ''}"><span class="spell">${H.T(c.fix)}</span></button></div>`}
        ${note && !st.writing ? `<div class="nv-note"><p>${esc(note)}</p></div>` : ''}
        <p class="nv-count">${H.T(c.count)}: ${done} из ${BOARDS.length}</p>`;
      panel.querySelector('.nv-ok')?.addEventListener('click', () => { st.status[b.id] = 'ok'; delete st.notes[b.id]; renderPanel(); redraw(); });
      panel.querySelector('.nv-fix')?.addEventListener('click', () => { st.writing = true; renderPanel(); panel.querySelector('textarea').focus(); });
      panel.querySelector('.nv-send')?.addEventListener('click', () => {
        const v = panel.querySelector('textarea').value.trim();
        if (v) { st.notes[b.id] = v; st.status[b.id] = 'fix'; }
        st.writing = false; renderPanel(); redraw();
      });
    }
  }
  function select(id){
    st.sel = id; st.writing = false;
    renderPanel();
    if (st.close) fly(faceCam(board(), 2.3), 900); else redraw();
  }
  box.querySelectorAll('.nv-mode').forEach(b => b.addEventListener('click', () => {
    st.mode = b.dataset.m; st.writing = false;
    box.querySelectorAll('.nv-mode').forEach(x => x.classList.toggle('on', x === b));
    renderPanel(); redraw();
  }));
  go.addEventListener('click', () => {
    if (st.close) { setClose(false); fly(HOME); }
    else { setClose(true); cv.parentElement.classList.add('used'); fly(faceCam(board(), 2.3)); }
  });
  box.querySelector('.nv-all').addEventListener('click', () => { setClose(false); fly(HOME); });
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
    hideFace();
    cam.yaw = drag.yaw - dx * .006; cam.pitch = clamp(drag.pitch + dy * .004, .06, 1.3);
    cv.parentElement.classList.add('used');   // подсказка больше не нужна
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
const recHTML = v => {
  const id = String(v).replace(/^kinescope:/, '');
  return `<div class="nv-rec"><iframe src="https://kinescope.io/embed/${esc(id)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen title="Запись экрана студии"></iframe></div>`;
};

/* ---------- сборка кейса ---------- */
const KINDS = {
  build: [buildHTML, liveBuild],
  campus: [campusHTML, liveCampus],
  rec: [recHTML, () => {}],
};
const head = ch => `<div class="nv-head">
  <span class="case-label nv-label">${H.T(ch.label)}</span>
  <h2 class="nv-title">${H.T(ch.title)}</h2>
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
  // шапка кейса: вместо обложки — 3D-ролик кодом
  const hero = (mount.closest('.case-body') || mount).parentElement?.querySelector('.case-hero');
  if (hero && N.film) {
    hero.classList.add('nv-hero');
    hero.innerHTML = filmHTML(N.film);
    liveFilm(hero.querySelector('.nv-film'), N.film);
  }
  const ch = N.chapters || [];
  const kinds = ch.map(c => Object.keys(KINDS).find(k => c[k]));
  mount.innerHTML = ch.map((c, i) =>
    `<section class="nv-ch wrap nv-${kinds[i]}-ch">${head(c)}<div class="nv-viz">${kinds[i] ? KINDS[kinds[i]][0](c[kinds[i]]) : ''}</div></section>`).join('');
  mount.querySelectorAll('.nv-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.nv-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.nv-viz'), ch[i][k]); });
}
