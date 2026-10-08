/* ================================================================
   КЕЙС «ИНТЕРАКТИВНЫЕ ПРЕЗЕНТАЦИИ» (поле poll у проекта)
   Всё объясняется картинкой, почти без слов:
   hands — заголовок и текст главы написаны на экране зала, перед
   экраном ряд людей с поднятыми руками: руки тянутся к курсору,
   без курсора по ряду гуляет волна;
   join — камера телефона ловит QR с экрана зала, на телефоне
   появляются те же вопрос и варианты, что на экране; палец
   выбирает вариант — голос летит на экран, полоска растет;
   results — экран зала, как в «Вслухе»: десять видов ответов
   (рост ответов, шарики, круговая, сетка, облако слов, число, матрица,
   свои слова, вопросы вам, порядок), плитки-иконки, как в меню
   «Добавить слайд», переключаются сами;
   Цвета и формы — как в самом интерфейсе «Вслуха»: темный экран
   зала, фиолетовый акцент, серые варианты, без обводок.
   deck — PDF раскладывается на слайды, между ними встает слайд
   с опросом, кружки меняют оформление;
   local — схема: ноутбук с пультом, проектор, телефоны; связь
   с интернетом рвется, а ответы идут дальше; телефон стучится
   в пульт — замок не пускает. Справа под текстом — демо.
   Тексты — в content.js, оформление — poll.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// следит, виден ли блок
const onScreen = (el, cb, threshold = .3) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

/* ---------- точка-ответ: летит по дуге от одного элемента к другому ---------- */
function fly(stage, from, to, { dur = 760, lift = 70, cls = '' } = {}){
  if (!stage.isConnected) return Promise.resolve();
  const s = stage.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const x1 = a.left + a.width / 2 - s.left, y1 = a.top + a.height / 2 - s.top;
  const x2 = b.left + b.width / 2 - s.left, y2 = b.top + b.height / 2 - s.top;
  const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - lift;
  const d = document.createElement('i');
  d.className = 'pl-dot ' + cls;
  stage.append(d);
  // кривая Безье по десяти точкам, чтобы шла дугой, а не ломаной
  const frames = Array.from({ length: 11 }, (_, k) => {
    const t = k / 10, u = 1 - t;
    const x = u * u * x1 + 2 * u * t * cx + t * t * x2, y = u * u * y1 + 2 * u * t * cy + t * t * y2;
    return { transform: `translate(${x}px,${y}px) scale(${k === 0 ? .3 : k === 10 ? .7 : 1})`, opacity: k === 0 ? 0 : 1 };
  });
  const an = d.animate(frames, { duration: dur, easing: 'cubic-bezier(.4,0,.3,1)' });
  return an.finished.then(() => d.remove(), () => d.remove());
}

/* ---------- заголовок главы: слова поднимаются из-под строки ---------- */
function splitWords(el){
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  let n = 0;
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    // делим только по обычным пробелам: неразрывные типографа держат предлог со словом
    node.textContent.split(/([ \t\n]+)/).forEach(part => {
      if (!part) return;
      if (/^[ \t\n]+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement('span'); w.className = 'pl-w';
      const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--i', n++);
      w.append(i); frag.append(w);
    });
    node.replaceWith(frag);
  });
}

const head = ch => `<div class="pl-head">
  <span class="case-label pl-label">${H.T(ch.label)}</span>
  <h2 class="pl-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="pl-text">${H.T(ch.text)}</p>` : ''}
</div>`;
const side = (ch, extra = '') => `<div class="pl-side">
  <span class="case-label pl-label">${H.T(ch.label)}</span>
  <h2 class="pl-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="pl-text">${H.T(ch.text)}</p>` : ''}
  ${extra}
</div>`;

// QR-код из простых квадратиков: три «глаза» по углам и шум — сканировать нечего, но читается как QR
function qrSVG(seed = 11){
  let s = seed;
  const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  const eye = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  let d = eye(0, 0) + eye(14, 0) + eye(0, 14);
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    if (x < 8 && y < 8 || x > 12 && y < 8 || x < 8 && y > 12) continue;
    if (r() < .48) d += `M${x} ${y}h1v1h-1z`;
  }
  return `<svg class="pl-qr" viewBox="-2 -2 25 25" aria-hidden="true" shape-rendering="crispEdges"><rect x="-2" y="-2" width="25" height="25" fill="#fff"/><path d="${d}" fill="#1D222A" fill-rule="evenodd"/></svg>`;
}

/* ================================================================
   hands — лес рук: текст главы написан на экране зала, перед экраном
   ряд людей с поднятыми руками; руки тянутся к курсору, рядом с ним
   поднимаются выше; без курсора по ряду гуляет волна
   ================================================================ */
// ладонь в силуэте: ладонь, четыре пальца и большой палец; рисуется вверх от конца руки
const palm = L => `<rect x="-12" y="${-L - 24}" width="24" height="27" rx="9"/>
  ${[-11.5, -5.5, .5, 6.5].map((x, k) => `<rect x="${x}" y="${-L - 38 + (k === 0 || k === 3 ? 5 : 0)}" width="5.4" height="18" rx="2.7"/>`).join('')}
  <rect x="-5" y="-6" width="6" height="16" rx="3" transform="translate(-10 ${-L - 12}) rotate(-38)"/>`;
function hallHTML(c){
  const N = 15, W = 1000;
  let ppl = '';
  for (let i = 0; i < N; i++) {
    const x = (i + .5) * W / N + (i % 2 ? 6 : -6);
    const side = i % 3 === 1 ? -1 : 1;             // кто-то поднимает левую, кто-то правую
    const L = 92 + (i * 37 % 46);                   // руки разной длины — лес, а не забор
    ppl += `<g class="pl-p" transform="translate(${x.toFixed(1)} 0)">
      <g class="pl-arm" data-x="${(x + side * 20).toFixed(1)}" data-l="${L}" transform="translate(${side * 20} 236)"><path d="M0 0V${-L + 2}"/>${palm(L)}</g>
      <path class="pl-body" d="M-34 300V266C-34 250-20 240 0 240s34 10 34 26v34z"/>
      <circle class="pl-hd" cy="214" r="25"/>
    </g>`;
  }
  return `<div class="pl-stage pl-hall">
    <div class="pl-wall">${head(c)}</div>
    <svg class="pl-crowd" viewBox="0 0 ${W} 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${ppl}</svg>
  </div>`;
}
function liveHands(box){
  const stage = box.querySelector('.pl-hall');
  const svg = box.querySelector('.pl-crowd');
  const arms = [...box.querySelectorAll('.pl-arm')].map((g, i) => ({
    g, x: +g.dataset.x, side: +g.getAttribute('transform').match(/translate\((-?\d+)/)[1],
    a: 0, s: .8, ph: i * 1.7,
  }));
  let tx = null, ty = 0, on = false, raf = 0, t0 = performance.now();
  // курсор в координатах ряда: x от 0 до 1000, y — от верха ряда (выше ряда — отрицательный)
  const toXY = e => { const r = svg.getBoundingClientRect(); const k = 300 / r.height;
    return [(e.clientX - r.left - r.width / 2) * k + 500, (e.clientY - r.top) * k]; };
  stage.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') [tx, ty] = toXY(e); });
  stage.addEventListener('pointerleave', () => { tx = null; });
  const frame = now => {
    const t = (now - t0) / 1000;
    // без курсора «цель» плавно ходит над рядом туда-обратно — по рукам идет волна
    const gx = tx ?? 500 + Math.sin(t * .55) * 430, gy = tx == null ? -120 + Math.sin(t * .9) * 40 : ty;
    arms.forEach(h => {
      const dx = gx - h.x, dy = Math.min(-30, gy - 236);
      // рука показывает прямо на курсор; ближние тянутся выше
      const wantA = Math.max(-50, Math.min(50, Math.atan2(dx, -dy) * 180 / Math.PI)) + Math.sin(t * 2.2 + h.ph) * 3;
      const near = Math.exp(-(dx * dx) / (2 * 190 * 190));
      const wantS = .6 + near * .45 + Math.sin(t * 1.6 + h.ph) * .03;
      h.a += (wantA - h.a) * .12; h.s += (wantS - h.s) * .1;
      h.g.setAttribute('transform', `translate(${h.side} 236) rotate(${h.a.toFixed(2)}) scale(1 ${h.s.toFixed(3)})`);
    });
    if (on) raf = requestAnimationFrame(frame);
  };
  if (still()) return;
  onScreen(stage, v => { on = v; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(frame); }, .1);
}

/* ================================================================
   join — навел камеру на QR, на телефоне те же варианты, что на экране,
   нажал — голос сразу виден на экране зала
   ================================================================ */
// полоска ответа, как на экране «Вслуха»: подпись и проценты сверху, дорожка с заливкой снизу
const rbar = (label, i) => `<div class="pl-rb" data-i="${i}"><div class="row">${label}<em>0%</em></div><div class="tr"><b></b></div></div>`;
// подпись-заглушка: серая строка вместо слов
const ln = w => `<i class="pl-ln0" style="width:${w}%"></i>`;
function joinHTML(c){
  const q = H.T(c.question);
  const opts = H.pick(c.options);
  return `<div class="pl-stage pl-join" data-s="0">
    <div class="pl-scr pl-jscr">
      <div class="pl-slide pl-jjoin">${qrSVG()}<div class="pl-jside"><i class="pl-ln0" style="width:70%"></i><i class="pl-ln0" style="width:46%"></i><b class="pl-jcode">${esc(c.code)}</b></div></div>
      <div class="pl-slide pl-jq"><p class="pl-st">${q}</p><div class="pl-rbs">${opts.map((o, i) => rbar(`<span>${esc(o)}</span>`, i)).join('')}</div></div>
    </div>
    <div class="pl-tel">
      <div class="pl-tel-in">
        <div class="pl-cam">${qrSVG()}<i class="pl-corners"></i><i class="pl-scan"></i></div>
        <div class="pl-pp">
          <p class="pl-pq">${q}</p>
          ${opts.map((o, i) => `<div class="pl-opt" data-i="${i}" style="--i:${i}"><i></i><span>${esc(o)}</span></div>`).join('')}
          <div class="pl-send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        </div>
        <i class="pl-flash"></i>
      </div>
      <i class="pl-finger" aria-hidden="true"></i>
    </div>
  </div>`;
}
function liveJoin(box, c){
  const stage = box.querySelector('.pl-join');
  const tel = box.querySelector('.pl-tel');
  const finger = box.querySelector('.pl-finger');
  const opts = [...box.querySelectorAll('.pl-opt')];
  const send = box.querySelector('.pl-send');
  const rows = [...box.querySelectorAll('.pl-jq .pl-rb')];
  const n = rows.map(() => 0);
  const S = v => { stage.dataset.s = v; };
  const draw = () => {
    const sum = n.reduce((a, b) => a + b, 0) || 1;
    rows.forEach((r, i) => { const p = Math.round(n[i] / sum * 100); r.style.setProperty('--w', p / 100); r.querySelector('em').textContent = p + '%'; });
  };
  // палец: полупрозрачный кружок касания, едет к нужному месту на телефоне
  const touch = async el => {
    const t = tel.getBoundingClientRect(), r = el.getBoundingClientRect();
    finger.style.transform = `translate(${r.left - t.left + r.width * .3}px,${r.top - t.top + r.height / 2}px)`;
    finger.classList.add('on');
    await wait(650);
    finger.classList.add('tap'); await wait(260); finger.classList.remove('tap');
  };
  let on = false, busy = false;
  const reset = () => {
    S(0); n.fill(0); draw();
    opts.forEach(o => o.classList.remove('sel'));
    send.classList.remove('ready', 'sent');
    finger.classList.remove('on');
  };
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      reset(); await wait(900); if (!on) break;
      S(1); await wait(1900); if (!on) break;          // камера ловит QR с экрана
      S(2); await wait(1300); if (!on) break;          // на телефоне — тот же вопрос и те же варианты, что на экране
      const pick = opts[0];
      await touch(pick); pick.classList.add('sel'); send.classList.add('ready');
      await wait(450); if (!on) break;
      await touch(send); send.classList.add('sent');
      finger.classList.remove('on');
      await fly(stage, send, rows[0].querySelector('.tr'), { dur: 900, lift: 90 });
      n[0]++; draw(); rows[0].classList.remove('hit'); void rows[0].offsetWidth; rows[0].classList.add('hit');
      await wait(700);
      // остальной зал тоже отвечает
      for (let k = 0; k < 14 && on; k++) { n[[0, 0, 1, 2, 1, 0][rnd(6)]]++; draw(); await wait(170); }
      await wait(2600);
    }
    busy = false;
  };
  if (still()) { S(2); opts[0].classList.add('sel'); n.splice(0, 3, 9, 5, 2); draw(); return; }
  onScreen(stage, v => { on = v; if (on) loop(); }, .35);
}

/* ================================================================
   results — экран зала: десять способов показать ответы
   ================================================================ */
// оттенки вариантов — как в «Вслухе»: белый с убывающей плотностью
const FADE = [1, .74, .55, .41, .31, .24];
const fade = i => `rgba(255,255,255,${FADE[i % FADE.length]})`;
// выбор с весами: частые ответы приходят чаще
const pickW = w => { let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0; while ((r -= w[i]) > 0) i++; return i; };
// иконки плиток — как в меню «Добавить слайд»: серые фигуры, без подписей
const TILE = {
  grow: '<path d="M3 28V20l7-6 6 4 7-9 6-4v23z" opacity=".4"/><path d="M3 20l7-6 6 4 7-9 6-4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  dots: '<circle cx="8" cy="23" r="3"/><circle cx="8" cy="16" r="3"/><circle cx="16" cy="23" r="3"/><circle cx="16" cy="16" r="3"/><circle cx="16" cy="9" r="3"/><circle cx="24" cy="23" r="3" opacity=".5"/>',
  pie: '<path d="M16 4a12 12 0 1 1-12 12h12z"/><path d="M14 2.2A12 12 0 0 0 2.2 14H14z" opacity=".45"/>',
  grid: '<rect x="4" y="6" width="5" height="5" rx="1.5"/><rect x="11" y="6" width="5" height="5" rx="1.5"/><rect x="18" y="6" width="5" height="5" rx="1.5"/><rect x="4" y="14" width="5" height="5" rx="1.5"/><rect x="11" y="14" width="5" height="5" rx="1.5"/><rect x="4" y="22" width="5" height="5" rx="1.5" opacity=".5"/>',
  cloud: '<rect x="3" y="8" width="11" height="5" rx="2.5" opacity=".5"/><rect x="16" y="7" width="13" height="7" rx="3.5"/><rect x="5" y="16" width="16" height="8" rx="4"/><rect x="23" y="18" width="6" height="4" rx="2" opacity=".5"/>',
  number: '<rect x="4" y="18" width="4" height="8" rx="1.5" opacity=".5"/><rect x="10" y="10" width="4" height="16" rx="1.5"/><rect x="16" y="6" width="4" height="20" rx="1.5"/><rect x="22" y="14" width="4" height="12" rx="1.5" opacity=".5"/>',
  matrix: '<rect x="15" y="3" width="2" height="26" rx="1" opacity=".45"/><rect x="3" y="15" width="26" height="2" rx="1" opacity=".45"/><circle cx="9" cy="9" r="3"/><circle cx="23" cy="10" r="3"/><circle cx="22" cy="23" r="3"/><circle cx="10" cy="22" r="3" opacity=".5"/>',
  open: '<path d="M5 6h22a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H13l-6 5v-5H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><rect x="8" y="11" width="16" height="2.4" rx="1.2" fill="#E6E9EF"/><rect x="8" y="15.5" width="10" height="2.4" rx="1.2" fill="#E6E9EF"/>',
  qa: '<path d="M5 6h22a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H13l-6 5v-5H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M13.5 11.2a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1.9-1.1 1.6" fill="none" stroke="#E6E9EF" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="18.4" r="1.3" fill="#E6E9EF"/>',
  rank: '<rect x="4" y="6" width="16" height="5" rx="2.5"/><rect x="4" y="14" width="16" height="5" rx="2.5" opacity=".6"/><rect x="4" y="22" width="16" height="5" rx="2.5" opacity=".35"/><path d="M24 11l3-4 3 4z"/><path d="M24 21l3 4 3-4z" opacity=".5"/>',
};
const KINDS = Object.keys(TILE);

// у каждого вида: разметка, голос, сброс. Слова — только там, где они и есть суть (облако)
const V = {
  grow(el){
    // рост ответов: линия и заливка тянутся вправо, число рядом догоняет его как счетчик, у конца линии всплывает прибавка
    el.innerHTML = `<div class="pv-grow"><div class="ch"><svg viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="plArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B7BFF" stop-opacity=".5"/><stop offset="1" stop-color="#5B4BFF" stop-opacity="0"/></linearGradient></defs>
      <path class="ar" fill="url(#plArea)"/><path class="li"/></svg><i class="hd"></i><em class="dl"></em></div><b class="big">0</b></div>`;
    const ar = el.querySelector('.ar'), li = el.querySelector('.li'), hd = el.querySelector('.hd'), dl = el.querySelector('.dl'), big = el.querySelector('.big');
    const S = 36;
    let pts = [0], total = 0, shown = 0, raf = 0;
    const draw = () => {
      const ymax = Math.max(12, total * 1.18), n = pts.length;
      const X = i => i / (S - 1) * 600, Y = v => 236 - v / ymax * 216;
      const d = pts.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
      li.setAttribute('d', d);
      ar.setAttribute('d', `${d}L${X(n - 1).toFixed(1)} 240L0 240Z`);
      hd.style.left = dl.style.left = X(n - 1) / 6 + '%';
      hd.style.top = dl.style.top = Y(pts[n - 1]) / 2.4 + '%';
    };
    const count = () => {
      cancelAnimationFrame(raf);
      const step = () => { shown = Math.min(total, shown + Math.max(1, Math.ceil((total - shown) / 5)));
        big.textContent = shown; if (shown < total) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    return {
      vote(){ const add = 1 + rnd(5); total += add; pts.push(total); if (pts.length > S) pts.shift();
        draw(); count();
        dl.textContent = '+' + add; dl.classList.remove('up'); void dl.offsetWidth; dl.classList.add('up'); },
      reset(){ total = shown = 0; pts = [0]; big.textContent = '0'; draw(); },
    };
  },
  dots(el){
    el.innerHTML = `<div class="pv-dots">${[0, 1, 2, 3].map(i => `<div class="col"><div class="pile"></div><b>0</b>${ln([70, 50, 64, 40][i])}</div>`).join('')}</div>`;
    const cols = [...el.querySelectorAll('.col')], wt = [3, 5, 2, 1.2], n = [0, 0, 0, 0];
    return {
      vote(){ const i = pickW(wt); n[i]++;
        const d = document.createElement('i'); d.style.background = fade(i);
        cols[i].querySelector('.pile').append(d); cols[i].querySelector('b').textContent = n[i]; },
      reset(){ n.fill(0); cols.forEach(c => { c.querySelector('.pile').innerHTML = ''; c.querySelector('b').textContent = 0; }); },
    };
  },
  pie(el){
    const R = 52, C = 2 * Math.PI * R;
    el.innerHTML = `<div class="pv-pie"><svg viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-90 60 60)">${[0, 1, 2, 3].map(i =>
      `<circle r="${R}" cx="60" cy="60" fill="none" stroke="${fade(i)}" stroke-width="16"/>`).join('')}</g></svg>
      <div class="leg">${[0, 1, 2, 3].map(i => `<div><i style="background:${fade(i)}"></i>${ln([80, 56, 68, 44][i])}<em>0%</em></div>`).join('')}</div></div>`;
    const segs = [...el.querySelectorAll('circle')], ems = [...el.querySelectorAll('em')], wt = [5, 3, 2, 1], n = [0, 0, 0, 0];
    const draw = () => { const s = n.reduce((a, b) => a + b, 0); let acc = 0;
      segs.forEach((g, i) => { const part = s ? n[i] / s : 0;
        g.setAttribute('stroke-dasharray', `${C * part} ${C}`); g.setAttribute('stroke-dashoffset', -C * acc); acc += part;
        ems[i].textContent = Math.round(part * 100) + '%'; }); };
    return { vote(){ n[pickW(wt)]++; draw(); }, reset(){ n.fill(0); draw(); } };
  },
  grid(el){
    el.innerHTML = `<div class="pv-grid">${[0, 1, 2].map(i => `<div class="row"><div class="lb">${ln([30, 22, 26][i])}<b>0</b></div><div class="cells"></div></div>`).join('')}</div>`;
    const rows = [...el.querySelectorAll('.row')], wt = [5, 3, 1.5], n = [0, 0, 0];
    return {
      vote(){ const i = pickW(wt); n[i]++;
        const d = document.createElement('i'); d.style.background = fade(i);
        rows[i].querySelector('.cells').append(d); rows[i].querySelector('b').textContent = n[i]; },
      reset(){ n.fill(0); rows.forEach(r => { r.querySelector('.cells').innerHTML = ''; r.querySelector('b').textContent = 0; }); },
    };
  },
  cloud(el, c){
    const words = c.words;
    el.innerHTML = `<div class="pv-cloud">${words.map(w => `<span>${esc(w)}</span>`).join('')}</div>`;
    const sp = [...el.querySelectorAll('span')], n = words.map(() => 0);
    const wt = words.map((_, i) => [6, 4, 3.4, 2.6, 2, 1.6, 1.2, 1, .8, .6][i] || .5);
    const draw = () => { const max = Math.max(1, ...n);
      // частое слово крупнее и плотнее, редкое — мельче и бледнее, как в «Вслухе»
      sp.forEach((s, i) => { const k = n[i] / max;
        s.style.setProperty('--f', (n[i] ? 18 + 58 * k : 0).toFixed(1));
        s.style.opacity = n[i] ? FADE[Math.min(5, Math.round((1 - k) * 4))] : 0; }); };
    return { vote(){ n[pickW(wt)]++; draw(); }, reset(){ n.fill(0); draw(); } };
  },
  number(el){
    el.innerHTML = `<div class="pv-num"><div class="hist">${Array.from({ length: 12 }, () => '<i></i>').join('')}</div><b class="big">0</b></div>`;
    const bars = [...el.querySelectorAll('.hist i')], big = el.querySelector('.big'), n = bars.map(() => 0);
    const wt = bars.map((_, i) => Math.exp(-((i - 6.2) ** 2) / 7) + .05);
    const draw = () => { const max = Math.max(1, ...n), s = n.reduce((a, b) => a + b, 0);
      bars.forEach((b, i) => b.style.setProperty('--h', n[i] / max));
      big.textContent = s ? (n.reduce((a, v, i) => a + v * (i + 1), 0) / s).toFixed(1).replace('.', ',') : '0'; };
    return { vote(){ n[pickW(wt)]++; draw(); }, reset(){ n.fill(0); draw(); } };
  },
  matrix(el){
    el.innerHTML = `<div class="pv-mx"><i class="ax x"></i><i class="ax y"></i></div>`;
    const box = el.querySelector('.pv-mx');
    const CL = [[.26, .3], [.72, .24], [.7, .74], [.3, .7]];
    return {
      vote(){ const i = pickW([3, 4, 2, 1.4]); const [cx, cy] = CL[i];
        const p = document.createElement('i'); p.className = 'pt'; p.style.background = fade(i);
        p.style.left = (cx + (Math.random() - .5) * .3) * 100 + '%'; p.style.top = (cy + (Math.random() - .5) * .3) * 100 + '%';
        box.append(p); },
      reset(){ box.querySelectorAll('.pt').forEach(p => p.remove()); },
    };
  },
  open(el){
    el.innerHTML = `<div class="pv-open"></div>`;
    const box = el.querySelector('.pv-open');
    return {
      vote(){ if (box.children.length >= 9) box.firstElementChild.remove();
        const d = document.createElement('div'); d.className = 'card';
        d.innerHTML = ln(60 + rnd(36)) + ln(30 + rnd(40));
        box.append(d); },
      reset(){ box.innerHTML = ''; },
    };
  },
  qa(el){
    el.innerHTML = `<div class="pv-qa">${[0, 1, 2, 3].map(i => `<div class="q" style="--r:${i}"><b>▲0</b><div>${ln([86, 70, 92, 64][i])}${ln([50, 34, 58, 40][i])}</div></div>`).join('')}</div>`;
    const qs = [...el.querySelectorAll('.q')], wt = [1, 4, 2, 3], n = [0, 0, 0, 0];
    // за вопрос голосуют стрелкой, популярный поднимается наверх
    const draw = () => { const ord = n.map((v, i) => i).sort((a, b) => n[b] - n[a] || a - b);
      ord.forEach((i, r) => { qs[i].style.setProperty('--r', r); qs[i].querySelector('b').textContent = '▲' + n[i]; }); };
    return { vote(){ n[pickW(wt)]++; draw(); }, reset(){ n.fill(0); draw(); } };
  },
  rank(el){
    const L = [40, 28, 50, 34];
    el.innerHTML = `<div class="pv-rank">${L.map((w, i) => `<div class="pl-rb" style="--r:${i}"><div class="row"><span class="no">${i + 1}</span>${ln(w)}<em>0</em></div><div class="tr"><b></b></div></div>`).join('')}</div>`;
    const rows = [...el.querySelectorAll('.pl-rb')], wt = [1, 3, 5, 2], n = [0, 0, 0, 0];
    // порядок: за первое место больше очков, строки сами переставляются
    const draw = () => { const max = Math.max(1, ...n);
      const ord = n.map((v, i) => i).sort((a, b) => n[b] - n[a] || a - b);
      ord.forEach((i, r) => { rows[i].style.setProperty('--r', r); rows[i].style.setProperty('--w', n[i] / max);
        rows[i].querySelector('.no').textContent = r + 1; rows[i].querySelector('em').textContent = n[i]; }); };
    return { vote(){ const i = pickW(wt); n[i] += 1 + rnd(4); draw(); }, reset(){ n.fill(0); draw(); } };
  },
};
function resHTML(c){
  const names = H.pick(c.types);
  return `<div class="pl-stage pl-res">
    <div class="pl-scr pl-rscr"><div class="pl-slide"><div class="pl-sth"><i class="pl-ln0" style="width:46%"></i><i class="pl-ln0" style="width:28%"></i></div><div class="pl-vz"></div></div></div>
    <div class="pl-tiles">${KINDS.map((k, i) =>
      `<button class="pl-tile" type="button" data-k="${k}" aria-label="${esc(names[i] || k)}" aria-pressed="false"><svg viewBox="0 0 32 32" aria-hidden="true">${TILE[k]}</svg><i class="pl-tile-t"></i></button>`).join('')}</div>
  </div>`;
}
function liveRes(box, c){
  const vz = box.querySelector('.pl-vz');
  const tiles = [...box.querySelectorAll('.pl-tile')];
  const MS = 4800;
  let cur = -1, viz = null, touched = false, on = false, timer = 0, ticking = false;
  const show = (i, user) => {
    if (user) touched = true;
    cur = i;
    tiles.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-pressed', k === i); t.classList.remove('run'); });
    vz.className = 'pl-vz is-' + KINDS[i];
    viz = V[KINDS[i]](vz, c);
    viz.reset();
    for (let k = 0; k < 3; k++) viz.vote();   // пара первых ответов уже есть
    clearTimeout(timer);
    if (!touched && on && !still()) {
      const t = tiles[i]; void t.offsetWidth; t.classList.add('run');
      timer = setTimeout(() => show((cur + 1) % KINDS.length), MS);
    }
  };
  tiles.forEach((t, i) => t.addEventListener('click', () => show(i, true)));
  const tick = async () => {
    if (ticking) return; ticking = true;
    let k = 0;
    while (on) {
      viz.vote();
      // у вручную выбранного вида ответы со временем начинаются заново, чтобы рост был виден снова
      if (touched && ++k > 40) { k = 0; await wait(1600); if (!on) break; viz.reset(); }
      await wait(220 + rnd(240));
    }
    ticking = false;
  };
  show(0);
  if (still()) { for (let k = 0; k < 20; k++) viz.vote(); return; }
  onScreen(vz, v => { on = v; clearTimeout(timer); if (on) { show(cur); tick(); } else tiles.forEach(t => t.classList.remove('run')); }, .3);
}

/* ================================================================
   deck — свой PDF и свое оформление
   ================================================================ */
// оформления: фон слайда, текст, акцент; у последнего — шрифт с засечками
// оформления — настоящие темы «Вслуха»: Монохром, Полночь, Бумага (со шрифтом с засечками, как «Журнал»), Графит, Сигнал
const THEMES = [
  { bg: '#0E0E12', ink: '#FFFFFF', acc: '#FFFFFF' },
  { bg: '#0B0B14', ink: '#FFFFFF', acc: '#5B4BFF' },
  { bg: '#F4F5F7', ink: '#17181C', acc: '#5B4BFF', serif: true },
  { bg: '#20242B', ink: '#F2F4F7', acc: '#4C8DFF' },
  { bg: '#FFD933', ink: '#17181C', acc: '#17181C' },
];
// рисунки слайдов — из простых форм, слов нет
const SLIDE = {
  title: () => `<b class="pl-aa">Аа</b><i class="pl-ln s"></i>`,
  text: () => `<i class="pl-ln h"></i><i class="pl-ln"></i><i class="pl-ln"></i><i class="pl-ln s"></i>`,
  pic: () => `<div class="pl-two"><div><i class="pl-ln h"></i><i class="pl-ln"></i><i class="pl-ln s"></i></div><i class="pl-pic"></i></div>`,
  poll: () => `<i class="pl-ln h"></i><div class="pl-mini">${[.9, .55, .3].map((h, i) => `<i style="--h:${h};--i:${i}"></i>`).join('')}</div>`,
  nums: () => `<div class="pl-dots3"><i></i><i></i><i></i></div><i class="pl-ln s"></i>`,
  end: () => `<i class="pl-circ"></i>`,
};
function deckHTML(c){
  const names = H.pick(c.themes);
  const kinds = ['title', 'text', 'poll', 'pic', 'nums', 'end'];
  return `<div class="pl-stage pl-deck" data-s="0">
    <div class="pl-pdf" aria-hidden="true"><svg viewBox="0 0 60 76"><path d="M4 2h36l16 16v54a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path class="f" d="M40 2v16h16"/></svg><span>PDF</span></div>
    <div class="pl-grid">${kinds.map((k, i) => `<div class="pl-sl pl-sl-${k}" style="--i:${i}">${SLIDE[k]()}</div>`).join('')}</div>
    <div class="pl-themes">${THEMES.map((t, i) =>
      `<button class="pl-th${i ? '' : ' on'}" type="button" data-t="${i}" style="--a:${t.bg};--b:${t.acc};--c:${t.ink}" aria-label="${esc(names[i] || '')}"></button>`).join('')}</div>
  </div>`;
}
function liveDeck(box){
  const stage = box.querySelector('.pl-deck');
  const grid = box.querySelector('.pl-grid');
  const slides = [...grid.children];
  const poll = grid.querySelector('.pl-sl-poll');
  const btns = [...box.querySelectorAll('.pl-th')];
  let theme = 0, touched = false, on = false, busy = false;
  const setTheme = (t, user) => {
    if (user) touched = true;
    theme = t;
    const T = THEMES[t];
    grid.style.setProperty('--sb', T.bg); grid.style.setProperty('--si', T.ink); grid.style.setProperty('--sa', T.acc);
    grid.classList.toggle('serif', !!T.serif);
    btns.forEach((b, i) => { b.classList.toggle('on', i === t); b.setAttribute('aria-pressed', i === t); });
  };
  btns.forEach((b, i) => b.addEventListener('click', () => setTheme(i, true)));
  setTheme(0);
  // слайд с опросом встает между слайдами PDF, соседи плавно расступаются
  const flip = change => {
    const others = slides.filter(s => s !== poll);
    const r0 = others.map(s => s.getBoundingClientRect());
    change();
    others.forEach((s, i) => {
      const r1 = s.getBoundingClientRect();
      const dx = r0[i].left - r1.left, dy = r0[i].top - r1.top;
      if (dx || dy) s.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  };
  const S = v => { stage.dataset.s = v; };
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      S(0); grid.classList.remove('has-poll'); await wait(500); if (!on) break;
      S(1); await wait(1300); if (!on) break;          // файл PDF
      S(2); await wait(1500); if (!on) break;          // раскладывается на слайды
      flip(() => grid.classList.add('has-poll'));      // между ними — опрос
      S(3); await wait(1700);
      for (let k = 0; k < 3 && on; k++) {              // оформление меняется само, пока не выбрали свое
        if (!touched) setTheme((theme + 1) % THEMES.length);
        await wait(1500);
      }
      if (!on) break;
      if (!touched) setTheme(0);
      await wait(900);
      S(4); await wait(700);
    }
    busy = false;
  };
  if (still()) { S(3); grid.classList.add('has-poll'); return; }
  onScreen(stage, v => { on = v; if (on) loop(); }, .35);
}

/* ================================================================
   local — свой компьютер, без интернета
   ================================================================ */
// координаты схемы: ноутбук в центре, проектор слева сверху, интернет справа сверху, телефоны внизу
const LAP = { x: 330, y: 250 };
const PHONES = [100, 245, 415, 560];
function localHTML(){
  const phones = PHONES.map((x, i) => `<g class="pl-lph" data-i="${i}" transform="translate(${x} 400)">
      <rect x="-21" y="-34" width="42" height="68" rx="8"/><rect class="s" x="-15" y="-26" width="30" height="46" rx="3"/></g>`).join('');
  const wires = PHONES.map(x => `<path class="pl-wire" d="M${x} 362L${LAP.x} 300"/>`).join('');
  return `<div class="pl-stage pl-local">
    <svg class="pl-net" viewBox="0 0 660 460" aria-hidden="true">
      <defs><linearGradient id="plGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5B4BFF"/><stop offset="1" stop-color="#8B7BFF"/></linearGradient></defs>
      <path class="pl-wire" d="M262 214L208 150"/>
      ${wires}
      <g class="pl-web">
        <path class="pl-cut a" d="M400 205L466 152"/>
        <path class="pl-cut b" d="M466 152L522 108"/>
        <path class="pl-slash" d="M452 134l28 36"/>
        <g class="pl-globe" transform="translate(560 80)"><circle r="38"/><ellipse rx="16" ry="38"/><path d="M-38 0h76M-33-19h66M-33 19h66"/></g>
      </g>
      <g class="pl-scrn" transform="translate(40 30)">
        <rect width="190" height="118" rx="8"/>
        ${[0, 1, 2].map(i => `<rect class="pl-pb" data-i="${i}" x="${40 + i * 42}" y="22" width="26" height="78" rx="3"/>`).join('')}
        <path class="pl-leg" d="M95 118v18M70 136h50"/>
      </g>
      <g class="pl-lap" transform="translate(${LAP.x} ${LAP.y})">
        <rect class="pl-lap-s" x="-78" y="-62" width="156" height="102" rx="8"/>
        <path class="pl-lap-b" d="M-98 40h196l-12 16h-172z"/>
        <g class="pl-lock" transform="translate(0 -12)"><circle r="26"/><path class="sh" d="M-8-4v-7a8 8 0 0 1 16 0v7"/><rect x="-12" y="-4" width="24" height="19" rx="3"/></g>
      </g>
      ${phones}
    </svg>
  </div>`;
}
function liveLocal(box){
  const svg = box.querySelector('.pl-net');
  const bars = [...box.querySelectorAll('.pl-pb')];
  const phones = [...box.querySelectorAll('.pl-lph')];
  const lock = box.querySelector('.pl-lock');
  const count = [0, 0, 0];
  const NS = 'http://www.w3.org/2000/svg';
  const draw = () => bars.forEach((b, i) => b.style.setProperty('--h', Math.min(1, .06 + count[i] / 9).toFixed(3)));
  // точка-ответ в координатах схемы: по ломаной, с равной скоростью
  const run = (pts, { dur = 1300, cls = 'pl-ldot' } = {}) => {
    const d = document.createElementNS(NS, 'circle');
    d.setAttribute('r', 7); d.setAttribute('class', cls);
    svg.append(d);
    const len = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    const all = len.reduce((a, b) => a + b, 0);
    let acc = 0;
    const frames = pts.map((p, i) => { if (i) acc += len[i - 1]; return { transform: `translate(${p[0]}px,${p[1]}px)`, offset: acc / all }; });
    return d.animate(frames, { duration: dur, easing: 'ease-in-out' }).finished.then(() => d, () => d);
  };
  let on = false, busy = false, gen = 0;
  const send = g => {
    const i = rnd(PHONES.length), ch = Math.random() < .5 ? 0 : Math.random() < .6 ? 1 : 2;
    const b = bars[ch];
    const bx = 40 + +b.getAttribute('x') + 13;
    phones[i].classList.remove('tap'); void phones[i].getBoundingClientRect(); phones[i].classList.add('tap');
    run([[PHONES[i], 366], [LAP.x, 300], [LAP.x, 236], [262, 214], [208, 150], [bx, 112]], { dur: 1700 })
      .then(d => { d.remove(); if (g === gen) { count[ch]++; draw(); } });
  };
  // телефон из зала пробует открыть пульт: замок вздрагивает, точка гаснет
  const knock = () => {
    const i = 3;
    phones[i].classList.remove('tap'); void phones[i].getBoundingClientRect(); phones[i].classList.add('tap');
    run([[PHONES[i], 366], [LAP.x + 4, 250]], { dur: 1000, cls: 'pl-ldot no' }).then(d => {
      lock.classList.remove('deny'); void lock.getBoundingClientRect(); lock.classList.add('deny');
      d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).finished.then(() => d.remove(), () => d.remove());
    });
  };
  const loop = async () => {
    if (busy) return; busy = true;
    while (on) {
      const g = ++gen;
      count.fill(0); draw(); svg.classList.remove('cut');
      await wait(900); if (!on) break;
      for (let k = 0; k < 4 && on; k++) { send(g); await wait(520); }
      svg.classList.add('cut');                                    // интернет пропал
      await wait(700);
      for (let k = 0; k < 12 && on; k++) { if (k === 5) knock(); else send(g); await wait(480); }   // а ответы идут
      await wait(2600);
    }
    busy = false;
  };
  if (still()) { svg.classList.add('cut'); count.splice(0, 3, 6, 4, 2); draw(); return; }
  draw();
  onScreen(svg, v => { on = v; if (on) loop(); }, .35);
}

/* ---------- демо: кнопка под текстом последней главы ---------- */
const tryHTML = t => t ? `<div class="pl-try">
  <h3 class="pl-try-title">${H.T(t.title)}</h3>
  ${H.pick(t.text) ? `<p class="pl-try-text">${H.T(t.text)}</p>` : ''}
  <a class="btn btn-accent pl-try-btn" href="${esc(t.link)}" target="_blank" rel="noopener">${H.T(t.btn)}</a>
</div>` : '';

/* ---------- запуск ---------- */
// split — иллюстрация слева, текст справа; иначе заголовок сверху и сцена во всю ширину
const CHAPTERS = [
  { k: 'hands', html: hallHTML, live: liveHands, inner: true },   // текст главы — на самом экране
  { k: 'join', html: joinHTML, live: liveJoin },
  { k: 'results', html: resHTML, live: liveRes },
  { k: 'deck', html: deckHTML, live: liveDeck, split: () => '' },
  { k: 'local', html: localHTML, live: liveLocal, split: (c, a) => tryHTML(a.try) },
];

let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'poll.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -14% 0px' });

export async function mountPoll(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const a = p.poll;
  const list = CHAPTERS.filter(ch => a[ch.k]);
  mount.innerHTML = list.map(({ k, html, split, inner }) => inner
    ? `<section class="pl-ch wrap pl-${k}-ch"><div class="pl-viz">${html(a[k])}</div></section>`
    : split
    ? `<section class="pl-ch wrap pl-${k}-ch pl-split"><div class="pl-viz">${html(a[k])}</div>${side(a[k], split(a[k], a))}</section>`
    : `<section class="pl-ch wrap pl-${k}-ch">${head(a[k])}<div class="pl-viz">${html(a[k])}</div></section>`).join('');
  mount.querySelectorAll('.pl-title').forEach(splitWords);
  mount.querySelectorAll('.pl-ch').forEach(s => reveal.observe(s));
  list.forEach(({ k, live }) => live(mount.querySelector(`.pl-${k}-ch`), a[k]));
}
