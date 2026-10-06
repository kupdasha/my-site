/* ================================================================
   АУДИТ КАК ДИЗАЙН-КЕЙС (поле audit у проекта, см. «аудит сайта divan.ru»)
   Тексты и цифры — в content.js, оформление — audit.css.
   Каждая глава: подпись, заголовок, абзац и одна живая схема.
   Схемы оживают, когда доезжают до экрана (класс in).
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, worldHTML, watchWorld, openViewer, base

const esc = s => String(s).replace(/"/g, '&quot;');

/* ---------- схемы ---------- */

// кто покупает: фото и три аудитории, которые выезжают по очереди
function audience(a){
  return `<div class="au-aud">
    <div class="au-aud-photo au-zoomable"><img src="${a.photo}" alt="" loading="lazy"></div>
    <ul class="au-aud-list">${a.items.map((x, i) => `<li style="--i:${i}"><b>${H.T(x.name)}</b><span>${H.T(x.note)}</span></li>`).join('')}</ul>
  </div>`;
}

// формула: два слова съезжаются, между ними появляется плюс
function formula(f){
  return `<div class="au-formula">
    <div class="au-f-line">
      <span class="au-f-word a">${H.T(f[0].word)}</span><span class="au-f-nb"><span class="au-f-plus" aria-hidden="true">+</span><span class="au-f-word b">${H.T(f[1].word)}</span></span>
    </div>
    <div class="au-f-notes"><p>${H.T(f[0].note)}</p><p>${H.T(f[1].note)}</p></div>
  </div>`;
}

// трафик: полоски растут, переключатель меняет показатель
const num = (v, d) => v.toFixed(d).replace('.', ',');
function traffic(t){
  const max = { visits: Math.max(...t.rows.map(r => r.visits)), cr: Math.max(...t.rows.map(r => r.cr)) };
  return `<div class="au-traffic" data-mode="${t.modes[0].key}" style="--avg:${(t.avg.cr / max.cr * 100).toFixed(2)}%">
    <div class="au-modes" role="tablist">${t.modes.map((m, i) => `<button class="au-mode${i ? '' : ' on'}" role="tab" aria-selected="${!i}" data-mode="${m.key}">${H.T(m.name)}</button>`).join('')}</div>
    <div class="au-bars">${t.rows.map((r, i) => `
      <div class="au-bar${r.mark ? ' mark' : ''}" style="--i:${i};--v:${(r.visits / max.visits * 100).toFixed(2)}%;--c:${(r.cr / max.cr * 100).toFixed(2)}%">
        <span class="au-bar-name">${H.T(r.name)}</span>
        <span class="au-bar-track"><i></i></span>
        <span class="au-bar-val"><span class="v">${num(r.visits, 1)}%</span><span class="c">${num(r.cr, 2)}%</span></span>
      </div>`).join('')}
      <span class="au-avg" aria-hidden="true"><span>${H.T(t.avg.note)} ${num(t.avg.cr, 2)}%</span></span>
    </div>
    <p class="au-source">${t.markNote ? `<span class="au-legend"></span>${H.T(t.markNote)}<br>` : ''}${H.T(t.source)}</p>
    <div class="au-notes">${t.notes.map((n, i) => `<div class="au-note" style="--i:${i}"><b>${n.big}</b><p>${H.T(n.text)}</p></div>`).join('')}</div>
  </div>`;
}

// путь покупателя: линия прорисовывается через три остановки
function journey(j){
  return `<div class="au-journey">
    <span class="au-j-line" aria-hidden="true"></span>
    ${j.map((s, i) => `<div class="au-stop ${s.color}" style="--i:${i}">
      <span class="au-dot" aria-hidden="true"></span>
      <span class="au-track">${H.T(s.track)}</span>
      <b class="au-goal">${H.T(s.goal)}</b>
      <span class="au-page">${H.T(s.page)}</span>
      <p>${H.T(s.fix)}</p>
    </div>`).join('')}
  </div>`;
}

// живая шапка: в поиске печатается запрос, слова «для бизнеса / дома / вау» меняют подборку
function search(s){
  return `<div class="au-search" data-color="${s.tabs[0].color || 'green'}">
    <div class="au-s-head">
      <span class="au-s-logo">divan.ru</span>
      <span class="au-s-menu">${s.menu.map(m => `<span>${H.T(m)}</span>`).join('')}</span>
      <span class="au-s-field"><span class="au-s-q"></span><i class="au-s-caret"></i>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></span>
    </div>
    <div class="au-s-lead"><span>${H.T(s.lead)}</span>${s.tabs.map((t, i) => `<button class="au-s-tab${i ? '' : ' on'}" data-k="${i}" data-q="${esc(t.query)}" data-color="${t.color || 'green'}">${H.T(t.word)}</button>`).join('')}</div>
    ${s.hint ? `<p class="au-s-hint">${H.T(s.hint)}</p>` : ''}
    <div class="au-s-shots">${s.tabs.map((t, i) => `<img class="${i ? '' : 'on'}" src="${t.img}" alt="" loading="lazy">`).join('')}</div>
  </div>
  ${s.note ? `<p class="au-cap">${H.T(s.note)}</p>` : ''}`;
}

// было / стало: шторку тянут мышью, пальцем или стрелками; при появлении она сама проезжает туда и обратно
function compare(list){
  return list.map(c => `<div class="au-cmp" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="${esc(H.pick(c.labels[0]))} и ${esc(H.pick(c.labels[1]))}" style="--x:50%">
    <img src="${c.after}" alt="" loading="lazy">
    <div class="au-cmp-before"><img src="${c.before}" alt="" loading="lazy"></div>
    <span class="au-cmp-lab l">${H.T(c.labels[0])}</span><span class="au-cmp-lab r">${H.T(c.labels[1])}</span>
    <span class="au-cmp-handle" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg></span>
  </div>`).join('');
}

// две картинки и плюс между ними
function plus(ch){
  return `<div class="au-plus">${ch.plus.map((src, i) => `<figure class="au-zoomable" style="--i:${i}"><img src="${src}" alt="" loading="lazy">${ch.plusLabels ? `<figcaption>${H.T(ch.plusLabels[i])}</figcaption>` : ''}</figure>`).join('<span class="au-plus-sign" aria-hidden="true">+</span>')}</div>`;
}

// где спотыкается покупка: этапы на линии, под каждым — что мешает
function friction(f){
  return `<div class="au-fric">${f.map((s, i) => `<div class="au-fr-stage" style="--i:${i}">
    <span class="au-fr-name">${H.T(s.stage)}</span>
    <ul>${s.issues.map((x, k) => `<li style="--k:${k}">${H.T(x)}</li>`).join('')}</ul>
  </div>`).join('')}</div>`;
}

// строчные: первая буква переворачивается из заглавной в строчную, теги выезжают голубыми
function lowercase(l){
  // слово целиком уезжает вверх, снизу приходит то же слово строчными
  const word = w => `<span class="au-lw"><span class="up">${w}</span><span class="lo">${w.toLowerCase()}</span></span>`;
  return `<div class="au-lower">
    <div class="au-lw-menu">${l.words.map(word).join('')}</div>
    ${l.logo ? `<img class="au-lw-logo" src="${l.logo}" alt="divan.ru">` : '<div class="au-lw-logo">divan.ru</div>'}
    <div class="au-lw-tags">${l.tags.map((t, i) => `<span style="--i:${i}">${H.T(t)}</span>`).join('')}</div>
  </div>
  ${l.note ? `<p class="au-cap">${H.T(l.note)}</p>` : ''}`;
}

// стекло → жирная «d»; рядом — профиль в соцсети
function glass(g){
  return `<div class="au-glass">
    <div class="au-g-pair">
      <span class="au-g-old au-zoomable"><img src="${g.from}" alt="«Стеклянная» иконка"></span>
      <svg class="au-g-arrow" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>
      <span class="au-g-new" role="img" aria-label="Жирная иконка в стиле «d»"><i class="o"></i><i class="l"></i></span>
    </div>
    <div class="au-g-profile au-zoomable"><img src="${g.profile}" alt="" loading="lazy"></div>
  </div>`;
}

// ряд картинок одной высоты, увеличиваются по нажатию
function rows(list){
  return list.map(r => `<div class="au-rowbox">${r.caption ? `<p class="au-cap top">${H.T(r.caption)}</p>` : ''}
    <div class="au-row">${r.row.map(src => `<button class="au-cell au-zoomable" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div></div>`).join('');
}

// подсказка к 3D: клавиши и мышь (на телефоне — палец)
function worldHint(w){
  const touch = matchMedia('(pointer:coarse)').matches;
  const text = w.hint && (touch ? w.hint.touch : w.hint.mouse);
  const key = (k, cls = '') => `<span class="au-key ${cls}" data-key="${k}">${k}</span>`;
  const keys = touch
    ? `<span class="au-swipe" aria-hidden="true"><svg width="64" height="40" viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20h48M16 12l-8 8 8 8M48 12l8 8-8 8"/></svg></span>`
    : `<span class="au-mouse" aria-hidden="true"><i></i></span>
       <span class="au-keys" aria-hidden="true"><span class="au-kr">${key('W')}</span><span class="au-kr">${key('A')}${key('S')}${key('D')}</span></span>
       <span class="au-keys arrows" aria-hidden="true"><span class="au-kr">${key('↑', 'ar')}</span><span class="au-kr">${key('←', 'ar')}${key('↓', 'ar')}${key('→', 'ar')}</span></span>`;
  return `<div class="au-whint">${keys}<p>${H.T(text || '')}</p></div>`;
}

// русское название: латинский знак уезжает, приходит русский; ниже меню и теги
function rename(r){
  return `<div class="au-rename">
    <div class="au-rn-logos">
      <img class="au-rn-from" src="${r.from}" alt="divan.ru">
      <svg class="au-rn-arrow" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>
      <img class="au-rn-to" src="${r.to}" alt="диван.ру">
    </div>
    <div class="au-rn-menu">${r.menu.map((m, i) => `<span style="--i:${i}">${H.T(m)}</span>`).join('')}</div>
    <div class="au-lw-tags">${r.tags.map((t, i) => `<span style="--i:${i}">${H.T(t)}</span>`).join('')}</div>
  </div>`;
}

// товар и то, что к нему подходит: маленькая карточка, плюс и лента сочетаний — картинки не крупнее, чем они есть
function bundle(b){
  return `<div class="au-bundle">
    <div class="au-bd-card au-zoomable"><img src="${b.card}" alt="" loading="lazy"></div>
    <span class="au-plus-sign" aria-hidden="true">+</span>
    <div class="au-bd-set">
      <b>${H.T(b.title)}</b>
      <div class="au-zoomable"><img src="${b.together}" alt="" loading="lazy"></div>
    </div>
  </div>
  ${b.note ? `<p class="au-cap">${H.T(b.note)}</p>` : ''}`;
}

// переписки со знакомыми: три скриншота, как сообщения в ленте
function chats(list){
  return `<div class="au-chats">${list.map((src, i) => `<button class="au-chat au-zoomable" style="--i:${i}" aria-label="Увеличить переписку"><img src="${src}" alt="Переписка о покупке на divan.ru" loading="lazy"></button>`).join('')}</div>`;
}

// набросок единого шаблона сообществ: одна обложка, меняется только город
function cities(c){
  return `<div class="au-cities">${c.cities.map((name, i) => `<div class="au-city" style="--i:${i}">
    <div class="au-city-cover${c.photo ? ' ph' : ''}"${c.photo ? ` style="--ph:url('${c.photo}')"` : ''}>${c.logo ? `<img class="au-city-logo" src="${c.logo}" alt="divan.ru">` : '<span class="au-city-logo">divan.ru</span>'}<span class="au-city-line">${H.T(c.line)}</span></div>
    <div class="au-city-row"><span class="au-city-ava" aria-hidden="true"><i class="o"></i><i class="l"></i></span><b>divan.ru ${H.T(name)}</b></div>
    <div class="au-city-tabs"><span>каталог</span><span>акции</span><span>шоурумы</span></div>
  </div>`).join('')}</div>`;
}

const ARROW_SVG = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
// проблема → решение: «сейчас» и «предлагаю», под каждым свои картинки
const fixMedia = m => !m ? '' : m.cities ? cities(m) : `<div class="au-row${m.length > 2 ? ' stack' : ''}">${m.map(src => `<button class="au-cell au-zoomable" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>`;
function fix(f){
  const L = f.labels || ['сейчас', 'предлагаю'];
  const slide = f.slider && f.before && f.after;
  return `<div class="au-fix${slide ? ' slide' : ''}">
    <div class="au-fix-col now"><span class="au-fix-tag">${H.T(L[0])}</span><p>${H.T(f.now)}</p>${slide ? '' : fixMedia(f.before)}</div>
    <div class="au-fix-col next"><span class="au-fix-tag">${H.T(L[1])}</span><p>${H.T(f.next)}</p>${slide ? '' : fixMedia(f.after)}</div>
  </div>
  ${slide ? `<div class="au-cmps n1">${compare([{ before: f.before[0], after: f.after[0], labels: L }])}</div>` : ''}
  ${f.pairs ? `<div class="au-pairs">${f.pairs.map(pr => `<div class="au-pair-row">${
    pr.map((src, k) => `<button class="au-pair-cell au-zoomable${k ? ' next' : ''}" aria-label="Увеличить"><img src="${src}" alt="" loading="lazy"></button>`).join('')
  }<span class="au-pair-arrow" aria-hidden="true">${ARROW_SVG}</span></div>`).join('')}</div>` : ''}`;
}

/* ---------- схемы для кейса ЕАБР: сухие цифры банка превращаются в графики ----------
   Цвета — из айдентики ЕАБР (бюро «Щука»), см. .au-edb в audit.css */
const n1 = v => String(v).replace('.', ',');
const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', ',');

// абзац → график: цифры в тексте подсвечиваются по очереди, из каждой вырастает полоска.
// В тексте цифра отмечена так: [[8,7%|0]] — номер полоски после черты
function textChart(c){
  const max = Math.max(...c.bars.map(b => Math.abs(b.v)));
  const neg = c.bars.some(b => b.v < 0);
  const text = H.T(c.text).replace(/\[\[(.+?)\|(\d+)\]\]/g, (_, s, k) => `<mark class="au-tc-mark" data-k="${k}" style="--k:${k}">${s}</mark>`);
  return `<div class="au-tc">
    <div class="au-tc-src"><span class="au-tc-tag">${H.T(c.from)}</span><p>${text}</p></div>
    <span class="au-tc-arrow" aria-hidden="true">${ARROW_SVG}</span>
    <div class="au-tc-chart${neg ? ' neg' : ''}"><span class="au-tc-tag">${H.T(c.to)}</span>
      ${c.bars.map((b, k) => `<div class="au-tc-bar${b.v < 0 ? ' minus' : ''}" data-k="${k}" style="--k:${k};--w:${(Math.abs(b.v) / max * 100).toFixed(1)}%">
        <span class="au-tc-name">${H.T(b.name)}</span>
        <span class="au-tc-track"><i></i><b>${pct(b.v)}%</b></span>
      </div>`).join('')}
    </div>
  </div>`;
}

// плавная кривая через точки: x и y в долях 0…1
function smooth(pts, w, h){
  const P = pts.map(([x, y]) => [x * w, y * h]);
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = P[Math.max(0, i - 1)], [x1, y1] = P[i], [x2, y2] = P[i + 1], [x3, y3] = P[Math.min(P.length - 1, i + 2)];
    d += ` C${(x1 + (x2 - x0) / 6).toFixed(1)},${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)},${(y2 - (y3 - y1) / 6).toFixed(1)} ${x2},${y2}`;
  }
  return d;
}

// рост ВВП: кривая с градиентом, у каждой страны точка; наведите на точку или на строку списка
function curve(c){
  const max = Math.max(...c.items.map(x => x.v)) * 1.15;
  const pts = c.items.map((x, i) => [(i + .5) / c.items.length, 1 - x.v / max]);
  const line = smooth(pts, 1000, 400);
  return `<div class="au-cv">
    <div class="au-cv-plot">
      <svg viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="au-cv-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--eb-mint)" stop-opacity=".55"/><stop offset="1" stop-color="var(--eb-cyan)" stop-opacity="0"/></linearGradient>
        <linearGradient id="au-cv-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--eb-green)"/><stop offset="1" stop-color="var(--eb-cyan)"/></linearGradient></defs>
        <path class="au-cv-area" d="${line} L${pts.at(-1)[0] * 1000},400 L${pts[0][0] * 1000},400Z" fill="url(#au-cv-fill)"/>
        <path class="au-cv-line" d="${line}" pathLength="1" fill="none" stroke="url(#au-cv-line)" stroke-width="4" vector-effect="non-scaling-stroke"/>
      </svg>
      ${c.items.map((x, i) => `<button class="au-cv-dot${i ? i === c.items.length - 1 ? ' r' : '' : ' l'}" data-k="${i}" style="--k:${i};left:${(pts[i][0] * 100).toFixed(2)}%;top:${(pts[i][1] * 100).toFixed(2)}%" aria-label="${esc(x.name)} ${n1(x.v)}%"><span class="au-cv-tip">${H.T(x.name)} <b>${n1(x.v)}%</b></span></button>`).join('')}
    </div>
    <ul class="au-cv-list">${c.items.map((x, i) => `<li data-k="${i}" style="--k:${i}"><i style="background:var(--eb-c${i % 6})"></i><span>${H.T(x.name)}</span><b>${n1(x.v)}%</b></li>`).join('')}</ul>
  </div>
  ${c.note ? `<p class="au-cap">${H.T(c.note)}</p>` : ''}`;
}

// столбцы по годам: растут из нуля, цифры отсчитываются
function columns(c){
  const max = Math.max(...c.items.map(x => x.v));
  return `<div class="au-col">${c.items.map((x, i) => `<div class="au-col-it" style="--i:${i};--h:${(x.v / max * 100).toFixed(1)}%">
      <span class="au-col-bar"><b>${n1(x.v)}</b></span><span class="au-col-year">${x.year}</span>
    </div>`).join('')}</div>
  ${c.note ? `<p class="au-cap">${H.T(c.note)}</p>` : ''}`;
}

// сдвиги: что выросло, что сократилось — полоски вправо и влево от нуля
function shift(c){
  const max = Math.max(...c.items.map(x => Math.abs(x.v)));
  return `<div class="au-sh">${c.items.map((x, i) => `<div class="au-sh-row${x.v < 0 ? ' minus' : ''}" style="--i:${i};--w:${(Math.abs(x.v) / max * 50).toFixed(2)}%">
      <span class="au-sh-name">${H.T(x.name)}${x.note ? `<small>${H.T(x.note)}</small>` : ''}</span>
      <span class="au-sh-track"><i></i><b>${pct(x.v)}%</b></span>
    </div>`).join('')}</div>
  ${c.note ? `<p class="au-cap">${H.T(c.note)}</p>` : ''}`;
}

// рейтинг по годам: столбики стран и линии, кто куда переместился; наведите на страну
function rank(r){
  const N = r.cols[0].list.length;
  const link = (a, b) => `<svg class="au-rk-link" viewBox="0 0 100 ${N * 10}" preserveAspectRatio="none" aria-hidden="true">${
    a.list.map((name, i) => { const j = b.list.indexOf(name); return `<path data-n="${esc(name)}" d="M0,${i * 10 + 5} C50,${i * 10 + 5} 50,${j * 10 + 5} 100,${j * 10 + 5}" vector-effect="non-scaling-stroke"/>`; }).join('')}</svg>`;
  return `<div class="au-rk" style="--n:${N}" data-on="${esc(r.start || '')}">${r.cols.map((c, k) => `${k ? link(r.cols[k - 1], c) : ''}
    <div class="au-rk-col" style="--k:${k}"><span class="au-rk-year">${c.year}</span>${c.list.map((name, i) => `<button class="au-rk-it" data-n="${esc(name)}" style="--i:${i}">${H.T(name)}</button>`).join('')}</div>`).join('')}
  </div>
  ${r.note ? `<p class="au-cap">${H.T(r.note)}</p>` : ''}`;
}

// таблица → телефон: слева таблица как на сайте, справа та же таблица карточками на телефоне
function phoneTable(t){
  const head = `<tr><th rowspan="2">${H.T(t.first)}</th>${t.groups.map(g => `<th colspan="${t.years.length}">${H.T(g.name)}${g.sub ? `<small>${H.T(g.sub)}</small>` : ''}</th>`).join('')}</tr>
    <tr>${t.groups.map(() => t.years.map(y => `<th>${y}</th>`).join('')).join('')}</tr>`;
  const body = t.rows.map((r, i) => `<tr data-k="${i}"${r.total ? ' class="total"' : ''}><td>${H.T(r.name)}</td>${r.vals.map(v => `<td>${v}</td>`).join('')}</tr>`).join('');
  const num = v => parseFloat(String(v).replace(',', '.'));
  const card = (r, i) => `<div class="au-pt-card${i ? '' : ' on'}" data-k="${i}">${t.groups.map((g, gi) => {
      const a = r.vals[gi * 2], b = r.vals[gi * 2 + 1], m = Math.max(num(a), num(b)) || 1;
      return `<div class="au-pt-ind"><span class="au-pt-g">${H.T(g.name)}</span>${isNaN(num(a)) ? `<span class="au-pt-empty">${H.T(t.empty)}</span>` :
        t.years.map((y, yi) => { const v = yi ? b : a; return `<span class="au-pt-y"><span>${y}</span><span class="au-pt-bar"><i style="--w:${(num(v) / m * 100).toFixed(1)}%"></i></span><b>${v}</b></span>`; }).join('')}</div>`;
    }).join('')}</div>`;
  return `<div class="au-pt">
    <div class="au-pt-desk"><span class="au-tc-tag">${H.T(t.labels[0])}</span><div class="au-pt-scroll"><table>${head}${body}</table></div></div>
    <div class="au-pt-mob"><span class="au-tc-tag">${H.T(t.labels[1])}</span>
      <div class="au-phone"><div class="au-phone-scr">
        <p class="au-pt-ttl">${H.T(t.title)}</p>
        <div class="au-pt-chips">${t.rows.map((r, i) => `<button class="au-pt-chip${i ? '' : ' on'}" data-k="${i}">${H.T(r.short || r.name)}</button>`).join('')}</div>
        <div class="au-pt-cards">${t.rows.map(card).join('')}</div>
      </div></div>
    </div>
  </div>
  ${t.note ? `<p class="au-cap">${H.T(t.note)}</p>` : ''}`;
}

// «увеличить»: на телефоне график целиком, по кнопке телефон поворачивается и график раскрывается на весь экран
function zoomPhone(z){
  const max = Math.max(...z.items.map(x => x.v));
  const bars = cls => `<div class="au-zp-bars ${cls}">${z.items.map((x, i) => `<span style="--i:${i};--h:${(x.v / max * 100).toFixed(1)}%"><i></i><em>${x.year}</em></span>`).join('')}</div>`;
  return `<div class="au-zp">
    <div class="au-zp-stage">
      <div class="au-phone au-zp-phone"><div class="au-phone-scr">
        <div class="au-zp-port">
          <p class="au-pt-ttl">${H.T(z.title)}</p>
          ${bars('mini')}
          <div class="au-zp-foot"><button class="au-zp-btn">${H.T(z.button)}</button><span>${H.T(z.source)}</span></div>
          <span class="au-zp-lines" aria-hidden="true"><i></i><i></i><i></i></span>
        </div>
        <div class="au-zp-land">
          <p class="au-pt-ttl">${H.T(z.title)}</p>
          ${bars('big')}
        </div>
      </div></div>
    </div>
    <ul class="au-zp-steps">${z.steps.map((s, i) => `<li style="--i:${i}">${H.T(s)}</li>`).join('')}</ul>
  </div>`;
}

// палитра айдентики: цвета-полоски раскрываются при наведении, ниже — градиенты
function palette(p){
  return `<div class="au-pal">
    <div class="au-pal-row">${p.colors.map((c, i) => `<button class="au-pal-c${dark(c.hex) ? ' dk' : ''}" style="--c:${c.hex};--i:${i}"><span>${H.T(c.name)}</span><b>${c.hex}</b></button>`).join('')}</div>
    <div class="au-pal-grads">${p.grads.map((g, i) => `<span style="--i:${i};background:linear-gradient(120deg,${g.join(',')})"></span>`).join('')}</div>
  </div>`;
}
const dark = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return r * .299 + g * .587 + b * .114 < 140; };

/* ---------- глава ---------- */
function chapter(ch, p){
  let viz = '';
  if (ch.rename)    viz += rename(ch.rename);
  if (ch.audience)  viz += audience(ch.audience);
  if (ch.formula)   viz += formula(ch.formula);
  if (ch.traffic)   viz += traffic(ch.traffic);
  if (ch.journey)   viz += journey(ch.journey);
  if (ch.search)    viz += search(ch.search);
  if (ch.compare)   viz += `<div class="au-cmps n${ch.compare.length}">${compare(ch.compare)}</div>`;
  if (ch.bundle)    viz += bundle(ch.bundle);
  if (ch.plus)      viz += plus(ch);
  if (ch.chats)     viz += chats(ch.chats);
  if (ch.friction)  viz += friction(ch.friction);
  if (ch.fix)       viz += fix(ch.fix);
  if (ch.lowercase) viz += lowercase(ch.lowercase);
  if (ch.glass)     viz += glass(ch.glass);
  if (ch.world && p.world) viz += worldHint(p.world) + H.worldHTML({ ...p.world, hint: null });
  if (ch.textChart) viz += textChart(ch.textChart);
  if (ch.curve)     viz += curve(ch.curve);
  if (ch.columns)   viz += columns(ch.columns);
  if (ch.shift)     viz += shift(ch.shift);
  if (ch.rank)      viz += rank(ch.rank);
  if (ch.phoneTable) viz += phoneTable(ch.phoneTable);
  if (ch.zoomPhone) viz += zoomPhone(ch.zoomPhone);
  if (ch.palette)   viz += palette(ch.palette);
  if (ch.rows)      viz += rows(ch.rows);
  return `<section class="au-ch${ch.color ? ' c-' + ch.color : ''}">
    <div class="wrap">
      <div class="au-head">
        ${ch.label ? `<span class="case-label au-label">${H.T(ch.label)}</span>` : ''}
        <h2 class="au-title">${H.T(ch.title)}</h2>
        ${ch.text ? `<p class="au-text">${H.T(ch.text)}</p>` : ''}
      </div>
      <div class="au-viz">${viz}</div>
    </div>
  </section>`;
}

/* ---------- оживление ---------- */
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); reveal.unobserve(e.target);
  e.target.dispatchEvent(new CustomEvent('au:in'));
}), { rootMargin: '0px 0px -12% 0px' });

function liveTraffic(box){
  box.addEventListener('click', e => {
    const b = e.target.closest('.au-mode'); if (!b) return;
    box.dataset.mode = b.dataset.mode;
    box.querySelectorAll('.au-mode').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
  });
}

function liveSearch(box){
  const q = box.querySelector('.au-s-q'), tabs = [...box.querySelectorAll('.au-s-tab')], shots = [...box.querySelectorAll('.au-s-shots img')];
  let k = 0, typing = 0, auto = true, timer;
  const type = text => {
    clearInterval(typing); let n = 0; q.textContent = '';
    typing = setInterval(() => { q.textContent = text.slice(0, ++n); if (n >= text.length) clearInterval(typing); }, 70);
  };
  const show = i => {
    k = i;
    tabs.forEach((t, j) => t.classList.toggle('on', j === i));
    shots.forEach((s, j) => s.classList.toggle('on', j === i));
    box.dataset.color = tabs[i].dataset.color;   // у каждого слова свой фон из палитры бренда
    type(tabs[i].dataset.q);
  };
  // пока никто не нажимал — слова меняются сами
  const loop = () => { timer = setTimeout(() => { if (!auto) return; show((k + 1) % tabs.length); loop(); }, 3800); };
  box.addEventListener('click', e => {
    const t = e.target.closest('.au-s-tab'); if (!t) return;
    auto = false; clearTimeout(timer); show(+t.dataset.k);
  });
  const start = () => { show(0); loop(); };
  box.closest('.au-ch').addEventListener('au:in', start, { once: true });
}

function liveCompare(el){
  let drag = false, played = false;
  const set = x => { x = Math.max(0, Math.min(100, x)); el.style.setProperty('--x', x + '%'); el.setAttribute('aria-valuenow', Math.round(x)); };
  const at = e => { const r = el.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
  el.addEventListener('pointerdown', e => { drag = true; played = true; el.classList.remove('sweep'); el.setPointerCapture(e.pointerId); at(e); });
  el.addEventListener('pointermove', e => drag && at(e));
  el.addEventListener('pointerup', () => drag = false);
  el.addEventListener('pointercancel', () => drag = false);
  el.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); e.stopPropagation(); played = true;
    set(parseFloat(el.style.getPropertyValue('--x')) + (e.key === 'ArrowRight' ? 5 : -5));
  });
  // подсказка: шторка сама проезжает туда и обратно
  new IntersectionObserver(([en], o) => {
    if (!en.isIntersecting || played) return; o.disconnect();
    el.classList.add('sweep'); setTimeout(() => el.classList.remove('sweep'), 2600);
  }, { threshold: 0.6 }).observe(el);
}

/* ---------- оживление схем ЕАБР ---------- */
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// перебор по кругу, пока никто не трогает; наведение или нажатие — останавливает
function cycle(box, count, show, ms = 2200){
  let k = 0, t = 0, held = false;
  const go = i => { k = i; show(i); };
  const loop = () => { clearTimeout(t); if (held || still()) return; t = setTimeout(() => { go((k + 1) % count); loop(); }, ms); };
  box.closest('.au-ch').addEventListener('au:in', () => setTimeout(() => { go(0); loop(); }, 1400), { once: true });
  return {
    hold: i => { held = true; clearTimeout(t); go(i); },
    free: () => { held = false; loop(); },
    stop: i => { held = true; clearTimeout(t); go(i); },
  };
}
// абзац ↔ полоски: наведение на цифру подсвечивает полоску и наоборот
function liveTextChart(box){
  const all = [...box.querySelectorAll('[data-k]')];
  const on = k => all.forEach(el => el.classList.toggle('hot', k != null && el.dataset.k === String(k)));
  box.addEventListener('pointerover', e => { const el = e.target.closest('[data-k]'); on(el ? el.dataset.k : null); });
  box.addEventListener('pointerleave', () => on(null));
}
function liveCurve(box){
  const dots = [...box.querySelectorAll('.au-cv-dot')], li = [...box.querySelectorAll('.au-cv-list li')];
  const show = i => [dots, li].forEach(a => a.forEach((el, j) => el.classList.toggle('on', j === i)));
  const c = cycle(box, dots.length, show);
  [...dots, ...li].forEach(el => {
    el.addEventListener('pointerenter', () => c.hold(+el.dataset.k));
    el.addEventListener('pointerleave', c.free);
    el.addEventListener('click', () => c.stop(+el.dataset.k));
  });
}
function liveRank(box){
  const names = [...new Set([...box.querySelectorAll('.au-rk-it')].map(b => b.dataset.n))];
  const show = i => {
    box.dataset.on = names[i];
    box.querySelectorAll('[data-n]').forEach(el => el.classList.toggle('on', el.dataset.n === names[i]));
  };
  const c = cycle(box, names.length, show, 2000);
  box.querySelectorAll('.au-rk-it').forEach(el => {
    const i = names.indexOf(el.dataset.n);
    el.addEventListener('pointerenter', () => c.hold(i));
    el.addEventListener('pointerleave', c.free);
    el.addEventListener('click', () => c.stop(i));
  });
}
function livePhoneTable(box){
  const chips = [...box.querySelectorAll('.au-pt-chip')], cards = [...box.querySelectorAll('.au-pt-card')], rows = [...box.querySelectorAll('tbody tr, table tr[data-k]')];
  const show = i => {
    chips.forEach((el, j) => el.classList.toggle('on', j === i));
    cards.forEach((el, j) => el.classList.toggle('on', j === i));
    rows.forEach(el => el.classList.toggle('on', el.dataset.k === String(i)));
    const ch = chips[i], strip = ch.parentNode;
    strip.scrollTo({ left: ch.offsetLeft - strip.clientWidth / 2 + ch.offsetWidth / 2, behavior: still() ? 'auto' : 'smooth' });
  };
  const c = cycle(box, chips.length, show, 2600);
  chips.forEach((el, i) => el.addEventListener('click', () => c.stop(i)));
  rows.forEach(el => {
    el.addEventListener('pointerenter', () => c.hold(+el.dataset.k));
    el.addEventListener('pointerleave', c.free);
  });
}
// телефон сам поворачивается туда и обратно; кнопка «увеличить» делает то же по нажатию
function liveZoom(box){
  let t = 0, auto = true;
  const set = big => box.classList.toggle('big', big);
  const loop = () => { clearTimeout(t); if (!auto || still()) return; t = setTimeout(() => { set(!box.classList.contains('big')); loop(); }, box.classList.contains('big') ? 3600 : 2600); };
  box.closest('.au-ch').addEventListener('au:in', () => setTimeout(loop, 600), { once: true });
  box.querySelector('.au-zp-phone').addEventListener('click', () => { auto = false; clearTimeout(t); set(!box.classList.contains('big')); });
}

// подсветка клавиш, когда по комнате ходят
function liveKeys(hint){
  const map = { KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D', ArrowUp: '↑', ArrowLeft: '←', ArrowDown: '↓', ArrowRight: '→' };
  const world = hint.nextElementSibling?.querySelector('.world');
  if (!world) return;
  let over = false;
  world.addEventListener('pointerenter', () => over = true);
  world.addEventListener('pointerleave', () => over = false);
  const light = (e, on) => {
    if (!map[e.code] || !(over || document.activeElement === world)) return;
    hint.querySelectorAll(`[data-key="${map[e.code]}"]`).forEach(k => k.classList.toggle('down', on));
  };
  addEventListener('keydown', e => light(e, true), true);
  addEventListener('keyup', e => { const k = map[e.code]; if (k) hint.querySelectorAll(`[data-key="${k}"]`).forEach(x => x.classList.remove('down')); });
}

/* ---------- плавные появления ---------- */
// заголовок главы: каждое слово поднимается из-под строки по очереди
function splitTitle(h){
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) {
      const parts = c.textContent.split(/( )/);
      const frag = document.createDocumentFragment();
      parts.forEach(t => {
        if (t === ' ' || !t) { frag.append(t); return; }
        const w = document.createElement('span'); w.className = 'au-w';
        const i = document.createElement('span'); i.textContent = t; w.append(i); frag.append(w);
      });
      c.replaceWith(frag);
    } else if (c.nodeType === 1) walk(c);
  });
  walk(h);
  h.querySelectorAll('.au-w > span').forEach((s, k) => s.style.setProperty('--w', k));
}

// каждая деталь оживает, когда сама доезжает до экрана (а не вся глава сразу)
const bit = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('on'); bit.unobserve(e.target);
  if (e.target.dataset.count != null) countUp(e.target);
}), { rootMargin: '0px 0px -8% 0px' });

// цифры отсчитываются от нуля: «0,33%», «81», «35,1%»
function countUp(el){
  const raw = el.dataset.count, m = /^([^\d]*)([\d\s]+(?:,\d+)?)(.*)$/.exec(raw);
  if (!m || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dec = (m[2].split(',')[1] || '').length, to = parseFloat(m[2].replace(/\s/g, '').replace(',', '.'));
  const t0 = performance.now(), dur = 1300;
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = m[1] + (to * e).toFixed(dec).replace('.', ',') + m[3];
    if (k < 1) requestAnimationFrame(step); else el.textContent = raw;
  };
  requestAnimationFrame(step);
}

// фото чуть отстают от прокрутки — появляется глубина
function parallax(mount){
  const box = mount.closest('#case') || window;
  const items = [...mount.querySelectorAll('.au-aud-photo img, .au-plus figure img, .au-g-profile img')];
  if (!items.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let raf = 0;
  const run = () => {
    raf = 0;
    const vh = innerHeight;
    items.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const k = (r.top + r.height / 2 - vh / 2) / vh;   // -1…1 вокруг центра экрана
      img.style.setProperty('--py', (k * -6).toFixed(2) + '%');
    });
  };
  box.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
  run();
}

function animate(mount){
  mount.querySelectorAll('.au-title').forEach(splitTitle);
  // картинки раскрываются шторкой снизу, с легким приближением
  mount.querySelectorAll('.au-aud-photo, .au-cell, .au-plus figure, .au-pair-cell, .au-bd-card, .au-bd-set > div, .au-g-profile, .au-s-shots, .au-cmp').forEach((el, i) => {
    el.classList.add('au-rv'); el.style.setProperty('--rd', (i % 3) * 0.12 + 's'); bit.observe(el);
  });
  // ряды картинок: каждая следующая ячейка — чуть позже
  mount.querySelectorAll('.au-row').forEach(row => [...row.children].forEach((c, k) => c.style.setProperty('--rd', k * 0.14 + 's')));
  // карточки «что мешает купить» вылетают по одной
  mount.querySelectorAll('.au-fr-stage li').forEach((li, k) => { li.classList.add('au-fly'); li.style.setProperty('--fd', (k % 4) * 0.1 + 's'); bit.observe(li); });
  mount.querySelectorAll('.au-city, .au-stop, .au-note, .au-fix-col, .au-chat').forEach(el => bit.observe(el));
  // цифры
  mount.querySelectorAll('.au-note b, .au-bar-val .v, .au-col-bar b, .au-cv-list b').forEach(el => { el.dataset.count = el.textContent; bit.observe(el); });
  parallax(mount);
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'audit.css?v=' + Math.floor(Date.now() / 36e5);
    l.onload = l.onerror = res; document.head.appendChild(l);
  });
  return cssReady;
}

export async function mountAudit(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  mount.innerHTML = p.audit.map(ch => chapter(ch, p)).join('');
  animate(mount);
  mount.querySelectorAll('.au-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.au-traffic').forEach(liveTraffic);
  mount.querySelectorAll('.au-search').forEach(liveSearch);
  mount.querySelectorAll('.au-cmp').forEach(liveCompare);
  mount.querySelectorAll('.au-whint').forEach(liveKeys);
  mount.querySelectorAll('.au-tc').forEach(liveTextChart);
  mount.querySelectorAll('.au-cv').forEach(liveCurve);
  mount.querySelectorAll('.au-rk').forEach(liveRank);
  mount.querySelectorAll('.au-pt').forEach(livePhoneTable);
  mount.querySelectorAll('.au-zp').forEach(liveZoom);
  mount.querySelectorAll('.world').forEach(H.watchWorld);
  // ряды одной высоты: пропорции ячейки берутся из самой картинки
  mount.querySelectorAll('.au-pair-row').forEach(row => {
    const img = row.querySelector('img');
    const set = () => img.naturalWidth && row.style.setProperty('--ar', img.naturalWidth / img.naturalHeight);
    img.complete ? set() : img.addEventListener('load', set, { once: true });
  });
  mount.querySelectorAll('.au-cell img, .au-chat img').forEach(img => {
    const set = () => img.naturalWidth && img.parentNode.style.setProperty('--ar', img.naturalWidth / img.naturalHeight);
    img.complete ? set() : img.addEventListener('load', set, { once: true });
  });
  // увеличение по нажатию: листаются все картинки аудита подряд
  mount.addEventListener('click', e => {
    const z = e.target.closest('.au-zoomable'); if (!z) return;
    const imgs = [...mount.querySelectorAll('.au-zoomable img')];
    H.openViewer(imgs.map(i => i.currentSrc || i.src), imgs.indexOf(z.querySelector('img')), imgs);
  });
}
