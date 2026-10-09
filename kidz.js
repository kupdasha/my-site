/* ================================================================
   КЕЙС «VK, ДЕТСКИЕ ЗОНЫ В КИДЗАНИИ. ДВЕ ЛОКАЦИИ» (поле kidz у проекта)
   Две локации в одном кейсе. В начале — развилка: два домика,
   нажатие ведет к своей локации. Дальше липкое меню из двух
   половин с полоской прогресса: видно, в какой локации вы
   и сколько ее осталось. У каждой локации — заставка, живые главы
   и фото в конце. Сначала дом блогеров, потом VK Праздники.
   VK Праздники: рендеры концепции каруселью, фасад в темноте (светятся
   только лайтбоксы), план на три зоны, магнитная стена (впишите имя).
   Дом блогеров: фасад (лишнее появляется и стирается, узор упирается
   в 70 см) и рендеры «как было / варианты», точки на общем виде, узор
   в кадре телефона и лайтбокс, фартук синий или бежевый с фото формы,
   настоящее меню и рендеры зала кухни переключателем.
   В конце каждой локации — фото с площадки каруселью с кружками.
   Тексты — в content.js, оформление — kidz.css, фото — img/kidzania.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const small = src => src.replace(/\.webp$/, '-s.webp');   // легкая копия 900 px
const onScreen = (el, cb, margin = '0px') =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
// перебор по кругу, пока блок на экране и его не трогали; возвращает «стоп»
function autoTour(box, n, show, ms = 2800){
  let i = 0, t = 0, touched = false;
  const step = () => show(i = (i + 1) % n);
  onScreen(box, v => {
    clearInterval(t);
    if (v && !touched && !still()) t = setInterval(step, ms);
  });
  return k => { touched = true; clearInterval(t); if (k != null) i = k; };
}
// цвета сцены: синий VK, праздничные розовый, голубой и фиолетовый, розовый VK Клипов
const C = { blue: '#0077FF', pink: '#FF2E8B', cyan: '#4FD8EA', violet: '#8A3FFC', mag: '#E82AC4', ink: '#1D222A' };
// логотип VK: белая плашка, буквы — прорезь (сквозь них виден фон)
const VK = 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z';
// только буквы (без плашки) — для логотипа-прорези в лайтбоксе
// (после z точка возвращается в начало плашки, 15.684 0, — поэтому первое относительное m переводим в абсолютное M)
const VK_GLYPH = 'M19.376 17.123' + VK.slice(VK.indexOf('zm3.692 17.123') + 14);
const vk = (x, y, s, fill = '#fff', cls = '') => `<path class="${cls}" fill="${fill}" fill-rule="evenodd" transform="translate(${x} ${y}) scale(${s / 24})" d="${VK}"/>`;

// aside — картинки коллажем справа от текста (по нажатию — крупно)
const head = ch => `<div class="kz-head${ch.aside ? ' has-aside' : ''}">
  <span class="case-label kz-label">${H.T(ch.label)}</span>
  <h2 class="kz-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="kz-text">${H.T(ch.text)}</p>` : ''}
  ${ch.aside ? `<div class="kz-aside">${ch.aside.map((src, i) =>
    `<button class="kz-aside-pic" data-i="${i}" aria-label="Увеличить"><img src="${small(src)}" data-full="${src}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>` : ''}
</div>`;
function liveAside(sec){
  const imgs = [...sec.querySelectorAll('.kz-aside img')];
  sec.querySelectorAll('.kz-aside-pic').forEach(b => b.addEventListener('click', () =>
    H.openViewer(imgs.map(x => x.dataset.full), +b.dataset.i, imgs)));
}

/* ================================================================
   ДОМИКИ: из них собрана развилка в начале и заставки локаций
   ================================================================ */
// VK Праздники: каменный павильон со скатной крышей, вывеска и лайтбоксы с шевронами, внутри — праздник
function partyHouse(){
  const chev = (x, y, w, h) => {
    let d = '';
    for (let i = x + 6; i < x + w; i += 16) d += `M${i + 9} ${y + 5}L${i} ${y + h / 2}L${i + 9} ${y + h - 5}`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${C.blue}"/><path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  return `<svg class="kz-house" viewBox="0 0 400 380" aria-hidden="true">
    <g class="kz-balloons">
      <g class="kz-bl" style="--d:0s"><path d="M150 96q-6 24 4 48" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/><circle cx="150" cy="80" r="17" fill="${C.pink}"/></g>
      <g class="kz-bl" style="--d:1.3s"><path d="M250 92q8 26-2 50" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/><circle cx="250" cy="76" r="15" fill="${C.cyan}"/></g>
      <g class="kz-bl" style="--d:2.6s"><path d="M200 84q-5 30 3 58" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/><circle cx="200" cy="66" r="19" fill="#fff"/></g>
    </g>
    <path d="M44 150L112 70H288L356 150Z" fill="#3A3E4C"/>
    <path d="M112 70H288L300 84H100Z" fill="#4A4F5F"/>
    <rect x="44" y="150" width="312" height="214" fill="#A9ABB2"/>
    <rect x="44" y="150" width="20" height="214" fill="#9A9CA4"/><rect x="336" y="150" width="20" height="214" fill="#9A9CA4"/>
    <rect x="104" y="196" width="192" height="168" fill="${C.pink}"/>
    <path d="M104 196h120c-10 30 20 40 6 70s-40 20-60 50H104Z" fill="${C.cyan}"/>
    <path d="M200 364c10-40 50-40 60-80s36-30 36-30v110Z" fill="${C.blue}"/>
    <circle cx="140" cy="300" r="22" fill="#fff" opacity=".95"/><circle cx="132" cy="296" r="3.5" fill="${C.ink}"/><circle cx="148" cy="296" r="3.5" fill="${C.ink}"/>
    <path d="M122 282l-4-14 12 8M158 282l4-14-12 8" fill="#fff"/>
    <rect x="182" y="330" width="80" height="6" rx="3" fill="#fff"/><path d="M190 336v28M254 336v28" stroke="#fff" stroke-width="4"/>
    <rect x="104" y="160" width="192" height="32" rx="2" fill="${C.blue}"/>
    ${vk(116, 166, 20)}<rect x="144" y="170" width="70" height="7" rx="3.5" fill="#fff"/><rect x="144" y="181" width="40" height="5" rx="2.5" fill="#fff" opacity=".7"/>
    ${chev(64, 160, 32, 30)}${chev(304, 160, 32, 30)}
    <rect x="68" y="196" width="24" height="168" fill="#C7D9E6" opacity=".6"/><rect x="308" y="196" width="24" height="168" fill="#C7D9E6" opacity=".6"/>
    <path d="M96 150v214M304 150v214" stroke="#8E9098" stroke-width="8"/>
  </svg>`;
}
// Дом блогеров: экран над входом с предметами из зон, стеклянная витрина, узор внизу
function blogHouse(){
  return `<svg class="kz-house" viewBox="0 0 400 380" aria-hidden="true">
    <defs><pattern id="kzCheck" width="28" height="28" patternUnits="userSpaceOnUse">
      <rect width="28" height="28" fill="${C.blue}"/><path d="M0 0h14v14H0zM14 14h14v14H14z" fill="${C.mag}"/></pattern>
      <linearGradient id="kzScr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A86FF"/><stop offset="1" stop-color="#0050E0"/></linearGradient></defs>
    <rect x="20" y="40" width="360" height="324" rx="4" fill="#2A2D36"/>
    <rect x="36" y="56" width="328" height="108" rx="6" fill="url(#kzScr)"/>
    ${vk(170, 76, 34)}<rect x="152" y="120" width="70" height="7" rx="3.5" fill="#fff"/><rect x="160" y="132" width="54" height="7" rx="3.5" fill="#fff"/>
    <g class="kz-float" style="--d:0s"><path d="M70 120c-12 0-14-18-2-20 0-12 18-14 22-4 10-6 22 4 14 14 6 6 0 14-6 12v10H70Z" fill="#fff"/></g>
    <g class="kz-float" style="--d:.8s"><path d="M300 78v34" stroke="${C.pink}" stroke-width="6" stroke-linecap="round"/><ellipse cx="292" cy="114" rx="11" ry="8" fill="${C.pink}"/><path d="M300 78l18 6v10l-18-6" fill="${C.pink}"/></g>
    <g class="kz-float" style="--d:1.6s"><path d="M330 104l7 13 14 2-10 10 2 14-13-7-13 7 3-14-10-10 14-2z" fill="${C.cyan}"/></g>
    <g class="kz-float" style="--d:2.4s"><rect x="112" y="96" width="14" height="30" rx="3" fill="#D8DCE3"/><path d="M114 96v-12l10-6v18" fill="${C.pink}"/></g>
    <rect x="44" y="180" width="312" height="184" fill="#9FB6CB"/>
    <path d="M60 184l60 100M150 184l70 120M250 184l70 110" stroke="#fff" stroke-width="10" opacity=".18"/>
    <path d="M200 180v184M122 180v184M278 180v184" stroke="#555A66" stroke-width="5"/>
    <path d="M188 260v40M212 260v40" stroke="#D6DAE0" stroke-width="4" stroke-linecap="round"/>
    <rect x="44" y="322" width="312" height="42" fill="url(#kzCheck)"/>
    <rect x="20" y="364" width="360" height="12" fill="#3A3D47"/>
  </svg>`;
}
// маленькие значки для липкого меню
const ICON = {
  party: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M12 15l-1.5 2h3zM12 17c0 2-2 2.5-1 5" fill="none"/></svg>`,
  blog: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3" fill="none"/><circle cx="12" cy="11" r="2.6"/></svg>`,
};

/* ---------- развилка: два домика, нажатие ведет к локации ---------- */
function twoHTML(places){
  return `<div class="kz-two">${places.map(pl => `
    <button class="kz-pick kz-pick-${pl.key}" data-go="${pl.key}">
      <span class="kz-pick-pic">${pl.key === 'party' ? partyHouse() : blogHouse()}</span>
      <span class="kz-pick-name">${H.T(pl.name)}<span class="kz-arr" aria-hidden="true">↓</span></span>
      <span class="kz-pick-text">${H.T(pl.text)}</span>
    </button>`).join('')}</div>`;
}

/* ================================================================
   VK ПРАЗДНИКИ
   ================================================================ */
/* ---------- фасад: свет на площадке гаснет, лайтбоксы и вывеска остаются ---------- */
function glowHTML(){
  const chev = (x, y, w, h) => {
    let d = '';
    for (let i = x + 14; i < x + w - 20; i += 44) d += `M${i + 24} ${y + 14}L${i} ${y + h / 2}L${i + 24} ${y + h - 14}`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.blue}"/><path d="${d}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const chair = x => `<path d="M${x} 470c0-30 8-40 22-40s22 10 22 40M${x + 2} 470v58M${x + 42} 470v58M${x - 4} 470h52" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;
  const balls = [[150, 290, 26, C.blue], [196, 274, 22, C.pink], [236, 296, 28, C.cyan], [282, 278, 22, C.blue], [324, 300, 26, C.pink], [366, 282, 20, C.cyan], [404, 300, 24, C.blue], [440, 286, 20, C.pink], [478, 300, 26, C.cyan]]
    .map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
  const silver = [[200, 90, 22], [280, 70, 16], [360, 100, 20], [700, 84, 22], [790, 62, 15], [880, 96, 19], [980, 76, 16]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#C9CCD3"/><circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .3}" fill="#fff" opacity=".8"/>`).join('');
  // интерьер — под своей тенью: изнутри тоже светло, но с улицы он виден, только если подойти
  return `<div class="kz-stage kz-glow"><svg viewBox="0 0 1200 640" aria-hidden="true">
    <defs><radialGradient id="kzSpill"><stop offset="0" stop-color="#9CC6FF" stop-opacity=".4"/><stop offset="1" stop-color="#9CC6FF" stop-opacity="0"/></radialGradient></defs>
    <rect width="1200" height="640" fill="#CFC8BE"/>
    <rect x="120" y="30" width="960" height="540" fill="#F4F4F6"/>
    <g>${silver}</g>
    <g class="kz-in">
      <rect x="130" y="250" width="390" height="320" fill="#F6F2F4"/>
      <rect x="130" y="380" width="390" height="190" fill="${C.pink}"/>
      ${balls}
      <rect x="250" y="320" width="120" height="70" rx="4" fill="#20232B"/>
      <rect x="610" y="250" width="460" height="320" fill="${C.pink}"/>
      <path d="M610 250h260c-20 50 30 80 0 130s-90 40-120 100-140 20-140 20Z" fill="${C.cyan}"/>
      <path d="M800 570c30-80 120-60 160-130s110-60 110-60v190Z" fill="${C.blue}"/>
      <path d="M690 560c-30 0-40-40-30-80s10-70 40-80c10-20 20-24 30-10 14 0 22 10 22 24 20 30 10 146-62 146Z" fill="#fff"/>
      <circle cx="704" cy="452" r="6" fill="${C.ink}"/><circle cx="728" cy="452" r="6" fill="${C.ink}"/>
      ${chair(760)}${chair(880)}<rect x="800" y="462" width="120" height="10" rx="4" fill="#fff"/><path d="M820 472v60M900 472v60" stroke="#fff" stroke-width="6"/>
      ${chair(160)}${chair(420)}
      <rect class="kz-in-dim" x="130" y="250" width="940" height="320" fill="#0B0E18"/>
    </g>
    <g class="kz-stone">
      <rect x="80" y="20" width="50" height="560" fill="#B9B3AA"/><rect x="520" y="20" width="90" height="560" fill="#B9B3AA"/><rect x="1070" y="20" width="50" height="560" fill="#B9B3AA"/>
      <path d="M548 30v540M582 30v540" stroke="#A39C92" stroke-width="6"/>
      <rect x="0" y="570" width="1200" height="70" fill="#9C968C"/>
      <path d="M0 596h1200M0 620h1200" stroke="#8B857B" stroke-width="3"/>
    </g>
    <rect class="kz-dark" width="1200" height="640" fill="#0B0E18"/>
    <ellipse class="kz-spill" cx="325" cy="250" rx="300" ry="190" fill="url(#kzSpill)"/>
    <ellipse class="kz-spill" cx="840" cy="250" rx="380" ry="200" fill="url(#kzSpill)"/>
    <g class="kz-lit">
      ${chev(130, 170, 190, 80)}${chev(330, 170, 190, 80)}
      <rect x="610" y="150" width="460" height="100" fill="${C.blue}"/>
      ${vk(668, 168, 46)}<rect x="734" y="174" width="180" height="22" rx="11" fill="#fff"/><rect x="760" y="210" width="120" height="14" rx="7" fill="#fff" opacity=".8"/>
      <rect x="536" y="300" width="14" height="40" rx="4" fill="#FFF6E0"/><rect x="580" y="300" width="14" height="40" rx="4" fill="#FFF6E0"/>
    </g>
  </svg></div>`;
}
function liveGlow(box){
  const st = box.querySelector('.kz-glow');
  // свет на площадке гаснет и снова загорается, пока глава на экране; курсор над фасадом — сразу темно
  onScreen(st, v => st.classList.toggle('run', v && !still()));
  st.addEventListener('pointerenter', () => st.classList.add('night'));
  st.addEventListener('pointerleave', () => st.classList.remove('night'));
  st.addEventListener('click', () => st.classList.toggle('night'));
}

/* ---------- план на три зоны: зоны подсвечиваются по очереди, рядом — фото зоны ---------- */
const ZONE_ICON = {
  table: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="11" width="22" height="4" rx="1"/><path d="M8 15v11M24 15v11M3 22h6M23 22h6" fill="none"/></svg>`,
  wall: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="5" width="26" height="17" rx="2" fill="none"/><path d="M8 11h7M8 16h11M10 22v5h12v-5" fill="none"/></svg>`,
  photo: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 10h6l2-3h8l2 3h6v16H4z" fill="none"/><circle cx="16" cy="17" r="5" fill="none"/></svg>`,
};
function planSVG(){
  // комната 24,6 м²: ниша магнитной стены сверху слева, срезанный угол со стеклом, дуга фотозоны справа
  const grid = [];
  for (let x = 40; x < 520; x += 30) grid.push(`M${x} 20V560`);
  for (let y = 40; y < 560; y += 30) grid.push(`M20 ${y}H520`);
  const chair = (x, y, r) => `<rect x="${x - 14}" y="${y - 12}" width="28" height="24" rx="8" transform="rotate(${r} ${x} ${y})"/>`;
  return `<svg class="kz-plan-svg" viewBox="0 0 540 580" aria-hidden="true">
    <clipPath id="kzRoom"><path d="M20 20H390V100H520V560H250L20 340Z"/></clipPath>
    <g clip-path="url(#kzRoom)">
      <rect width="540" height="580" class="kz-floor"/>
      <path class="kz-grid" d="${grid.join('')}"/>
      <path class="kz-z kz-z-photo" d="M520 112C380 180 360 470 520 548Z"/>
      <path class="kz-art" d="M520 112C380 180 360 470 520 548Z" fill="${C.blue}"/>
      <path class="kz-art" d="M520 112C450 150 430 230 470 300 500 350 520 330 520 330Z" fill="${C.pink}"/>
      <path class="kz-art" d="M520 400c-60 10-90 60-60 120 20 30 60 28 60 28Z" fill="${C.cyan}"/>
      <rect class="kz-z kz-z-wall" x="20" y="20" width="370" height="78"/>
      ${[[50, 44, 20, C.blue], [86, 38, 16, C.cyan], [120, 50, 22, C.pink], [170, 40, 18, C.cyan], [216, 48, 22, C.pink], [262, 40, 16, C.blue], [300, 50, 22, C.blue], [346, 42, 20, C.pink]]
        .map(([x, y, r, c]) => `<circle class="kz-art" cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}
      <rect class="kz-art" x="40" y="70" width="320" height="22" rx="3" fill="${C.violet}"/>
      <circle class="kz-z kz-z-table" cx="250" cy="300" r="120"/>
      <g class="kz-furn">
        <rect x="214" y="264" width="72" height="72" rx="4"/>
        ${chair(250, 238, 0)}${chair(250, 362, 0)}${chair(188, 300, 90)}${chair(312, 300, 90)}
        <circle cx="140" cy="170" r="18"/><circle cx="182" cy="200" r="18"/><circle cx="130" cy="232" r="18"/>
      </g>
      <path class="kz-art" d="M444 520a22 22 0 1 0 44 0a22 22 0 1 0-44 0M470 486a20 20 0 1 0 40 0a20 20 0 1 0-40 0" fill="#FFE04A"/>
    </g>
    <path class="kz-walls" d="M20 20H390V100H520V560H250L20 340Z"/>
    <path class="kz-glass" d="M40 359L232 543"/>
  </svg>`;
}
function planHTML(c){
  return `<div class="kz-plan">
    <div class="kz-plan-map">
      <p class="kz-area"><span class="kz-area-n" data-n="${esc(c.area)}">0</span><span class="kz-area-u">м²</span></p>
      ${planSVG()}
    </div>
    <div class="kz-plan-side">
      <div class="kz-plan-photos">${c.zones.map((z, i) =>
        `<img src="${small(z.img)}" data-full="${z.img}" alt="" draggable="false" loading="lazy" data-i="${i}">`).join('')}</div>
      <ul class="kz-zones">${c.zones.map((z, i) =>
        `<li data-i="${i}" data-z="${z.key}"><span class="kz-zi">${ZONE_ICON[z.key] || ''}</span><h3>${H.T(z.name)}</h3><p>${H.T(z.text)}</p></li>`).join('')}</ul>
    </div>
  </div>`;
}
function livePlan(box, c){
  const map = box.querySelector('.kz-plan-map'), imgs = [...box.querySelectorAll('.kz-plan-photos img')];
  const items = [...box.querySelectorAll('.kz-zones li')];
  const show = i => {
    map.dataset.on = c.zones[i].key;
    imgs.forEach((im, k) => im.classList.toggle('on', k === i));
    items.forEach((li, k) => li.classList.toggle('on', k === i));
  };
  show(0);
  const stop = autoTour(map, c.zones.length, show);
  items.forEach((li, i) => {
    li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { stop(i); show(i); } });
    li.addEventListener('click', () => { stop(i); show(i); });
  });
  box.querySelector('.kz-plan-photos').addEventListener('click', e => {
    const im = e.target.closest('img'); if (!im) return;
    H.openViewer(imgs.map(x => x.dataset.full), +im.dataset.i, imgs);
  });
  // площадь досчитывается до 24,6, когда план показался
  const n = box.querySelector('.kz-area-n'), to = parseFloat(n.dataset.n.replace(',', '.'));
  let done = false;
  onScreen(map, v => {
    if (!v || done) return; done = true;
    if (still()) { n.textContent = n.dataset.n; return; }
    const t0 = performance.now();
    const tick = t => {
      const k = clamp((t - t0) / 1400, 0, 1), e = 1 - Math.pow(1 - k, 3);
      n.textContent = (to * e).toFixed(1).replace('.', ',');
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- магнитная стена: имя собирается из букв, кубы работают втройне ---------- */
const MAG = [C.blue, C.pink, C.violet, C.cyan];
function wallHTML(c){
  const cube = (cls, fill, inner = '') => `<div class="kz-cube ${cls}" style="--c:${fill}"><svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="56" r="26" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="5"/><circle cx="50" cy="56" r="12" fill="rgba(0,0,0,.22)"/><circle cx="50" cy="20" r="8" fill="rgba(0,0,0,.2)"/></svg>${inner}</div>`;
  return `<div class="kz-stage kz-wall">
    <div class="kz-wall-scene">
      <div class="kz-balloon-set kz-bs-l">${[[8, 14, 15, C.blue], [2, 34, 12, C.cyan], [12, 50, 16, C.pink], [3, 66, 12, C.blue], [14, 74, 10, C.cyan]]
        .map(([x, y, s, c2], i) => `<i style="left:${x}%;top:${y}%;--s:${s};--c:${c2};--d:${i * .4}s"></i>`).join('')}</div>
      <div class="kz-balloon-set kz-bs-r">${[[86, 10, 13, C.pink], [92, 26, 15, C.blue], [84, 44, 11, C.cyan], [93, 56, 14, C.pink]]
        .map(([x, y, s, c2], i) => `<i style="left:${x}%;top:${y}%;--s:${s};--c:${c2};--d:${i * .5 + .2}s"></i>`).join('')}</div>
      <div class="kz-board"><div class="kz-board-in" aria-live="polite"><p class="kz-mags kz-mags-name"></p><p class="kz-mags kz-mags-line"></p></div></div>
      <div class="kz-cubes">
        ${cube('kz-cube-gift', C.pink, `<span class="kz-gift"><svg viewBox="0 0 60 60" aria-hidden="true"><rect x="6" y="22" width="48" height="34" rx="3" fill="${C.cyan}"/><rect x="2" y="14" width="56" height="12" rx="3" fill="${C.blue}"/><path d="M26 14h8v42h-8z" fill="#fff"/><path d="M30 14c-8-12-20-8-14 0M30 14c8-12 20-8 14 0" fill="none" stroke="#fff" stroke-width="4"/></svg></span>`)}
        ${cube('kz-cube-tech', C.violet, `<span class="kz-tech"><svg viewBox="0 0 100 100" aria-hidden="true"><rect x="16" y="30" width="68" height="22" rx="3" fill="#2B2F3A"/><circle cx="28" cy="41" r="3" fill="#7CF0FF"/><circle cx="38" cy="41" r="3" fill="#fff"/><path d="M24 52c0 20 30 10 30 30M60 52c0 14 18 16 18 30" fill="none" stroke="#2B2F3A" stroke-width="4"/></svg></span><span class="kz-hatch"></span>`)}
        ${cube('kz-cube-seat', C.blue, `<span class="kz-speaker"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M10 22l4-12 8 8M50 22l-4-12-8 8" fill="#FFC9DA"/><rect x="8" y="16" width="44" height="40" rx="18" fill="#FFC9DA"/><path d="M8 44h44v4a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" fill="#F7A9C2"/><path d="M22 30v4M38 30v4" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M26 40c2 3 6 3 8 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg><i></i><i></i></span>`)}
      </div>
    </div>
    <form class="kz-form" autocomplete="off">
      <input name="t" maxlength="12" placeholder="${esc(H.pick(c.placeholder))}" aria-label="${esc(H.pick(c.placeholder))}">
      <button class="btn btn-line" type="submit"><span>${H.T(c.button)}</span></button>
    </form>
  </div>`;
}
function setMags(el, text, delay = 0){
  const old = [...el.children];
  old.forEach((s, i) => { s.style.setProperty('--d', i * 18 + 'ms'); s.classList.add('off'); });
  setTimeout(() => {
    el.innerHTML = [...text].map((ch, i) => ch === ' ' ? '<span class="kz-sp"></span>'
      : `<span class="kz-mag" style="--c:${MAG[i % MAG.length]};--r:${((i * 37) % 11 - 5) * 1.4}deg;--d:${delay + i * 55}ms">${esc(ch)}</span>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.kz-mag').forEach(s => s.classList.add('on'))));
  }, old.length ? 320 : 0);
}
function liveWall(box, c){
  const name = box.querySelector('.kz-mags-name'), line = box.querySelector('.kz-mags-line');
  const names = c.names.map(n => H.pick(n));
  let i = 0, started = false;
  const show = n => { setMags(name, n.toLowerCase()); };
  onScreen(box.querySelector('.kz-wall'), v => {
    box.querySelector('.kz-wall').classList.toggle('run', v && !still());
    if (v && !started) { started = true; show(names[0]); setMags(line, H.pick(c.line), 500); }
  });
  const stop = autoTour(box.querySelector('.kz-wall'), names.length, k => show(names[i = k]), 4200);
  const form = box.querySelector('.kz-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = form.t.value.trim().replace(/\s+/g, ' ');
    if (!t) { form.t.focus(); return; }
    stop(); show(t);
  });
}

/* ================================================================
   ДОМ БЛОГЕРОВ
   ================================================================ */
/* ---------- фасад: экран с предметами из зон; лишнее появляется и стирается; узор упирается в 70 см ---------- */
function frontHTML(c){
  // справа поле под линейку и подпись «70 см»; витрина 270–700 по высоте — это примерно 2,6 м, поэтому 70 см от пола — линия 584
  const items = [
    `<path d="M190 200c-26 0-30-38-4-42 0-26 38-30 46-8 22-12 46 8 30 30 12 12 0 30-14 26v22h-58Z" fill="#fff"/><rect x="192" y="226" width="58" height="12" fill="#E6E9EF"/>`,
    `<path d="M960 108v74" stroke="${C.pink}" stroke-width="12" stroke-linecap="round"/><ellipse cx="943" cy="186" rx="22" ry="16" fill="${C.pink}"/><path d="M960 108l38 12v22l-38-12" fill="${C.pink}"/>`,
    `<path d="M880 190l12 24 26 4-19 18 5 26-24-13-24 13 5-26-19-18 26-4z" fill="${C.cyan}"/>`,
    `<rect x="300" y="150" width="26" height="62" rx="5" fill="#D8DCE3"/><rect x="300" y="176" width="26" height="8" fill="#AEB4BF"/><path d="M304 150v-26l18-12v38" fill="${C.pink}"/>`,
    `<path d="M1006 222c0-14 22-14 22 0 0-14 22-14 22 0 0 16-22 26-22 30 0-4-22-14-22-30z" fill="#fff"/>`,
  ];
  const lines = [
    `<path d="M186 196c-22-4-22-34 2-36 2-22 34-24 40-6 20-10 40 8 26 26 10 10 0 26-12 22v20h-56z" fill="none"/>`,
    `<path d="M960 108v74M960 108l38 12v22l-38-12M921 186a22 16 0 1 0 44 0a22 16 0 1 0-44 0" fill="none"/>`,
    `<path d="M880 190l12 24 26 4-19 18 5 26-24-13-24 13 5-26-19-18 26-4z" fill="none"/>`,
  ];
  return `<div class="kz-stage kz-front"><svg viewBox="0 0 1320 760" aria-hidden="true">
    <defs>
      <linearGradient id="kzScr2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A86FF"/><stop offset="1" stop-color="#0047D9"/></linearGradient>
      <pattern id="kzCheck2" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" fill="${C.blue}"/><path d="M0 0h28v28H0zM28 28h28v28H28z" fill="${C.mag}"/></pattern>
      <clipPath id="kzGlass"><rect x="160" y="270" width="880" height="430"/></clipPath>
    </defs>
    <rect width="1320" height="760" fill="#1F222A"/>
    <rect x="120" y="40" width="960" height="216" rx="12" fill="url(#kzScr2)"/>
    <g class="kz-scr-items">${items.map((d, i) => `<g class="kz-float" style="--d:${i * .7}s">${d}</g>`).join('')}</g>
    <g class="kz-ghost kz-g-lines">${lines.join('')}<path class="kz-strike" d="M150 90L1050 230" pathLength="1"/></g>
    ${vk(540, 70, 84)}
    <rect x="510" y="172" width="180" height="20" rx="10" fill="#fff"/><rect x="530" y="204" width="140" height="20" rx="10" fill="#fff"/>
    <g class="kz-ghost kz-g-name"><rect x="644" y="84" width="200" height="22" rx="11"/><rect x="644" y="118" width="140" height="22" rx="11"/><path class="kz-strike" d="M630 132L860 72" pathLength="1"/></g>
    <rect x="160" y="270" width="880" height="430" fill="#9DB4C9"/>
    <path d="M220 270l120 200M440 270l170 300M700 270l150 260" stroke="#fff" stroke-width="26" opacity=".14"/>
    <path d="M640 330h170v240H640z" fill="${C.mag}" opacity=".25"/><path d="M660 560c40-60 80-40 120-110" stroke="${C.mag}" stroke-width="14" fill="none" opacity=".35"/>
    <g clip-path="url(#kzGlass)"><rect class="kz-pat" x="160" y="584" width="880" height="116" fill="url(#kzCheck2)"/></g>
    <g class="kz-ghost kz-g-mascot"><path d="M300 560c-50 0-70-60-56-110 6-24 20-40 40-46-6-30 20-40 30-14 14-4 28-4 42 0 10-26 36-16 30 14 20 6 34 22 40 46 14 50-6 110-56 110z"/><circle cx="316" cy="470" r="8"/><circle cx="356" cy="470" r="8"/><path class="kz-strike" d="M230 400L460 580" pathLength="1"/></g>
    <path d="M380 270v430M600 270v430M820 270v430" stroke="#4A4F5C" stroke-width="12"/>
    <rect x="160" y="270" width="880" height="430" fill="none" stroke="#4A4F5C" stroke-width="14"/>
    <path d="M578 440v70M622 440v70" stroke="#D6DAE0" stroke-width="8" stroke-linecap="round"/>
    <path class="kz-limit" d="M150 584H1050"/>
    <rect y="700" width="1320" height="60" fill="#30333C"/>
    <path class="kz-ruler" d="M1100 700V584M1086 700h28M1086 584h28"/>
  </svg><span class="kz-limit-tag">${H.T(c.limit)}</span></div>`;
}
function liveFront(box){
  const st = box.querySelector('.kz-front');
  // по кругу: узор пробует вырасти выше 70 см и упирается в линию; потом по очереди появляются и стираются маскот на стекле,
  // линейные иконки на экране и надпись рядом с логотипом
  const steps = ['push', 'kz-g-mascot', 'kz-g-lines', 'kz-g-name'];
  let i = 0, t = 0;
  const step = () => {
    const s = steps[i]; i = (i + 1) % steps.length;
    st.querySelectorAll('.kz-ghost').forEach(g => g.classList.remove('show', 'gone'));
    st.classList.remove('push');
    if (s === 'push') { void st.offsetWidth; st.classList.add('push'); return; }
    const g = st.querySelector('.' + s);
    g.classList.add('show');
    st.classList.toggle('lines', s === 'kz-g-lines');   // линейные иконки встают на место объемных
    setTimeout(() => { g.classList.add('gone'); st.classList.remove('lines'); }, 1500);
  };
  onScreen(st, v => {
    st.classList.toggle('run', v && !still());
    clearInterval(t);
    if (v && !still()) { step(); t = setInterval(step, 2900); }
  });
}

/* ---------- что внутри: точки на общем виде ---------- */
function spotsHTML(c){
  return `<div class="kz-spots">
    <div class="kz-stage kz-spots-pic">
      <img src="${small(c.img)}" srcset="${small(c.img)} 900w, ${c.img} 2000w" sizes="100vw" alt="" draggable="false" loading="lazy">
      ${c.items.map((s, i) => `<button class="kz-spot" data-i="${i}" style="left:${s.x}%;top:${s.y}%" aria-label="${esc(H.pick(s.name))}"><i></i></button>`).join('')}
      <div class="kz-tip" aria-live="polite"><b></b><span></span></div>
    </div>
    <p class="kz-spots-cap"><b></b><span></span></p>
  </div>`;
}
function liveSpots(box, c){
  const pic = box.querySelector('.kz-spots-pic'), tip = box.querySelector('.kz-tip'), mob = box.querySelector('.kz-spots-cap');
  const spots = [...box.querySelectorAll('.kz-spot')];
  const show = i => {
    const s = c.items[i];
    spots.forEach((el, k) => el.classList.toggle('on', k === i));
    [tip, mob].forEach(el => {
      el.querySelector(':scope > b').innerHTML = H.T(s.name);
      el.querySelector(':scope > span').innerHTML = H.T(s.text);
    });
    tip.style.left = s.x + '%'; tip.style.top = s.y + '%';
    tip.classList.toggle('left', s.x > 58);
    tip.classList.remove('show'); void tip.offsetWidth; tip.classList.add('show');
  };
  show(0);
  const stop = autoTour(pic, c.items.length, show, 3000);
  spots.forEach(el => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { stop(+el.dataset.i); show(+el.dataset.i); } });
    el.addEventListener('click', () => { stop(+el.dataset.i); show(+el.dataset.i); });
  });
}

/* ---------- бьюти-зона: узор в кадре телефона и лайтбокс, который видно с двух сторон ---------- */
// плитка паттерна VK — дуги рядами
// (одинарные кавычки кодируются: url() стоит внутри атрибута style="…")
const ARCS = c => `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M5 -2C7 16 18 30 37 38' fill='none' stroke='${c}' stroke-width='6.5' stroke-linecap='round'/></svg>`).replace(/'/g, '%27')}')`;
const MARK = {
  ok: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19"/><path d="M12 20.5l5.5 5.5L29 14.5" fill="none"/></svg>`,
  no: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19"/><path d="M13.5 13.5l13 13M26.5 13.5l-13 13" fill="none"/></svg>`,
};
function beautyHTML(){
  const glyph = (cls, flip) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${VK_GLYPH}"${flip ? ' transform="translate(24 0) scale(-1 1)"' : ''}/></svg>`;
  return `<div class="kz-beauty">
    <div class="kz-stage kz-scale">
      <div class="kz-scale-wall" style="--arcs:${ARCS('#E59BBB')}"></div>
      <div class="kz-phone"><span class="kz-person"></span></div>
      <span class="kz-mark kz-mark-ok">${MARK.ok}</span><span class="kz-mark kz-mark-no">${MARK.no}</span>
    </div>
    <div class="kz-stage kz-box">
      <div class="kz-box-3d">
        <div class="kz-face kz-face-front">${glyph('kz-cut')}<span class="kz-plate">${glyph('kz-solid')}</span></div>
        <div class="kz-face kz-face-back">${glyph('kz-cut kz-cut-back', true)}</div>
      </div>
      <span class="kz-side"><span class="kz-side-a"></span><span class="kz-side-b"></span></span>
      <span class="kz-mark kz-mark-ok">${MARK.ok}</span><span class="kz-mark kz-mark-no">${MARK.no}</span>
    </div>
  </div>`;
}
function liveBeauty(box){
  const sc = box.querySelector('.kz-scale'), bx = box.querySelector('.kz-box');
  // узор: крупный — в телефоне непонятная полоса, мелкий — узнаваемые ряды дуг
  autoTour(sc, 2, i => sc.classList.toggle('big', i === 1), 2600);
  sc.classList.remove('big');
  // лайтбокс: сквозной логотип поворачивается — сзади, из гардероба, он задом наперед; серебряный не сквозной — сзади чисто
  const states = ['cut', 'cut back', 'solid', 'solid back'];
  autoTour(bx, states.length, i => { bx.dataset.s = states[i]; }, 2200);
  bx.dataset.s = states[0];
}

/* ---------- форма поваров: синий фартук синит лицо, бежевый держит теплый тон ---------- */
function apronHTML(c){
  const skin = '#F1C6A6';
  const body = `<circle cx="300" cy="222" r="64"/><rect x="282" y="280" width="36" height="34" rx="10"/><rect x="176" y="330" width="40" height="190" rx="20"/><rect x="384" y="330" width="40" height="190" rx="20"/>`;
  // повар слева, справа — телефон снимает лицо крупно: в кадре видно, как синий фартук синит кожу
  // (повар нарисован дважды, а не через <use>: внутри <use> не работают классы состояния)
  const kid = `        <g fill="${skin}">${body}</g>
        <path d="M236 200c0-50 30-72 64-72s64 22 64 72c-10-22-28-30-64-30s-54 8-64 30z" fill="#6B4B3A"/>
        <g class="kz-hat"><circle cx="262" cy="118" r="32" fill="#fff"/><circle cx="300" cy="96" r="38" fill="#fff"/><circle cx="338" cy="118" r="32" fill="#fff"/><rect x="246" y="118" width="108" height="40" rx="6" fill="#fff"/><rect x="246" y="146" width="108" height="14" fill="#E8EAEE"/>
          ${vk(290, 124, 20, C.blue)}</g>
        <circle cx="278" cy="226" r="7" fill="${C.ink}"/><circle cx="322" cy="226" r="7" fill="${C.ink}"/>
        <circle cx="266" cy="250" r="9" fill="#F29BAF" opacity=".55"/><circle cx="334" cy="250" r="9" fill="#F29BAF" opacity=".55"/>
        <path d="M284 252c8 9 24 9 32 0" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
        <path d="M220 330c0-14 20-26 80-26s80 12 80 26v200H220z" fill="#F7F7F9"/>
        <rect x="252" y="530" width="40" height="96" rx="10" fill="#384056"/><rect x="308" y="530" width="40" height="96" rx="10" fill="#384056"/>
        <g class="kz-ap"><path d="M268 300v40M332 300v40" stroke="var(--ap)" stroke-width="10"/><path d="M256 336h88v40c34 4 44 18 44 40v150H212V416c0-22 10-36 44-40z" fill="var(--ap)"/>
          ${vk(282, 360, 36, '#fff')}</g>
        <g class="kz-tint">${body}</g>`;
  return `<div class="kz-apron">
    <div class="kz-stage kz-apron-st"><svg viewBox="0 0 1100 640" aria-hidden="true">
      <defs><clipPath id="kzPhoneScr"><rect x="728" y="112" width="244" height="436" rx="26"/></clipPath></defs>
      <path class="kz-tiles" d="${Array.from({ length: 12 }, (_, i) => `M0 ${i * 56 + 20}H1100`).join('')}${Array.from({ length: 12 }, (_, i) => Array.from({ length: 12 }, (_, j) => `M${j * 100 + (i % 2) * 50} ${i * 56 + 20}v56`).join('')).join('')}"/>
      <path class="kz-cross" d="M470 60h44v44h44v44h-44v44h-44v-44h-44v-44h44z"/>
      ${kid}
      <path class="kz-beam" d="M716 200L392 150M716 460L392 300"/>
      <rect x="716" y="100" width="268" height="460" rx="36" fill="#1D222A"/>
      <rect x="728" y="112" width="244" height="436" rx="26" fill="#F4F2EF"/>
      <g clip-path="url(#kzPhoneScr)"><g transform="translate(850 320) scale(1.9) translate(-300 -230)">${kid}</g></g>
      <circle cx="850" cy="520" r="18" fill="none" stroke="#fff" stroke-width="5"/><circle cx="850" cy="520" r="11" fill="${C.pink}"/>
    </svg></div>
    <div class="kz-bar">${c.colors.map((n, i) => `<button class="btn kz-chip" data-i="${i}">${H.T(n)}</button>`).join('')}</div>
  </div>`;
}
function liveApron(box){
  const st = box.querySelector('.kz-apron'), chips = [...box.querySelectorAll('.kz-chip')];
  const show = i => { st.classList.toggle('blue', i === 0); chips.forEach((b, k) => b.classList.toggle('on', k === i)); };
  show(0);
  const stop = autoTour(st, 2, show, 2800);
  chips.forEach((b, i) => b.addEventListener('click', () => { stop(i); show(i); }));
}

/* ---------- карусель: один кадр на всю ширину, сменяются сами, под ними кружки по числу кадров ---------- */
// смахнуть — следующий кадр, короткое нажатие — крупно
function carouselHTML(c){
  const list = c.items;
  return `<div class="kz-car" tabindex="0" role="region" aria-roledescription="слайды">
    <div class="kz-car-row">${list.map((src, k) =>
      `<figure class="kz-car-shot${k ? '' : ' on'}"><img src="${small(src)}" srcset="${small(src)} 900w, ${src} 2000w" sizes="(max-width:760px) 100vw, 80vw" alt="" loading="lazy" draggable="false"></figure>`).join('')}</div>
    <div class="kz-dots">${list.map((_, k) =>
      `<button class="kz-dot${k ? '' : ' on'}" type="button" aria-label="${k + 1} из ${list.length}"><i></i></button>`).join('')}</div>
  </div>`;
}
function liveCarousel(box, c){
  const car = box.querySelector('.kz-car'), row = car.querySelector('.kz-car-row');
  const shots = [...row.children], imgs = shots.map(f => f.querySelector('img')), dots = [...car.querySelectorAll('.kz-dot')];
  let cur = 0, on = false, timer = 0;
  const run = () => { clearTimeout(timer); if (on && !still()) timer = setTimeout(() => go(cur + 1), 4000); };
  const go = k => {
    cur = (k + shots.length) % shots.length;
    shots.forEach((f, n) => f.classList.toggle('on', n === cur));
    dots.forEach((d, n) => d.classList.toggle('on', n === cur));
    // следующий кадр грузится заранее, чтобы смена не мигала пустым
    const nx = imgs[(cur + 1) % imgs.length]; if (nx.loading === 'lazy') nx.loading = 'eager';
    run();
  };
  dots.forEach((d, n) => d.addEventListener('click', () => go(n)));
  onScreen(row, v => { on = v; if (v) imgs.slice(0, 2).forEach(i => { i.loading = 'eager'; }); run(); });
  let x0 = null;
  row.addEventListener('pointerdown', e => { x0 = e.clientX; });
  row.addEventListener('pointerup', e => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
    else H.openViewer(c.items, cur, imgs);
  });
  car.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });
}

/* ---------- меню Café de Persik: буклет один в один с макетом, листается ---------- */
// обложка, разворот из двух колонок и задняя сторона; на телефоне — по одной странице
// узоры напечатаны глянцем по матовой бумаге: поверх рисунка тот же рисунок бликом (градиент kzGloss), блик проезжает по нему
const K_D = 'M48.5 0V213M48.5 117C68 117 86 114 100 110M48.5 117C68 117 86 120 100 124M0 190C18 203 34 208 48.5 208';
const BOOK_K = `<svg class="kz-bk-k" viewBox="0 0 100 213" preserveAspectRatio="none" aria-hidden="true"><path d="${K_D}"/><path class="kz-gl" d="${K_D}"/></svg>`;
// градиент блика — один на кейс: страницы книжки собираются из копий шаблонов
const GLOSS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="kzGloss" x1="-1" y1="0" x2="0" y2=".6">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    <animate attributeName="x1" values="-1;1.2;1.2" keyTimes="0;.6;1" dur="4.5s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="0;2.2;2.2" keyTimes="0;.6;1" dur="4.5s" repeatCount="indefinite"/>
  </linearGradient></defs></svg>`;
function bookPat(){
  let d = '';
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
    const x = k * 34, y = 109 + r * 35;
    d += `M${x} ${y}h14C${x + 18} ${y + 14} ${x + 26} ${y + 28} ${x + 34} ${y + 35}h-14C${x + 13} ${y + 28} ${x + 4} ${y + 14} ${x} ${y}Z`;
  }
  return `<svg class="kz-bk-pat" viewBox="0 0 100 213" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/><path class="kz-gl" d="${d}"/></svg>`;
}
const BOOK_CAT = `<svg class="kz-bk-cat" viewBox="0 0 120 160" aria-hidden="true"><path d="M20 60L26 14 50 40M100 60L94 14 70 40M18 74C18 44 38 36 60 36S102 44 102 74 84 112 60 112 18 104 18 74ZM30 66h24v10c0 6-24 6-24 0zM66 66h24v10c0 6-24 6-24 0zM54 70h12M46 92c6-6 10-6 14 0 4-6 8-6 14 0M60 112v8M44 124l16-8 16 8-16 8zM30 112c-8 20-10 36-6 48M90 112c8 20 10 36 6 48"/></svg>`;
function menuHTML(c){
  const col = list => list.map(([h, items]) => `<section><h4>${esc(h)}</h4>${items.map(t => `<p>${H.T(t)}</p>`).join('')}</section>`).join('');
  const pages = {
    front: `<div class="kz-bk-page kz-bk-front">${BOOK_K}<span class="kz-bk-vk"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" fill-rule="evenodd" d="${VK}"/></svg></span><h3>${esc(c.title).replace(' de ', '<br>de ')}</h3></div>`,
    col1: `<div class="kz-bk-page kz-bk-col">${col(c.cols[0])}</div>`,
    col2: `<div class="kz-bk-page kz-bk-col">${BOOK_CAT}${col(c.cols[1])}</div>`,
    back: `<div class="kz-bk-page kz-bk-back">${bookPat()}</div>`,
  };
  return `<div class="kz-menu">
    <div class="kz-book">${GLOSS}
      <div class="kz-book-stage" tabindex="0" role="region" aria-roledescription="меню" aria-label="${esc(c.title)}">
        <div hidden>${Object.entries(pages).map(([k, h]) => `<template data-k="${k}">${h}</template>`).join('')}</div>
      </div>
    </div>
    ${c.render ? `<button class="kz-stage kz-bk-render" aria-label="Увеличить"><img src="${small(c.render)}" srcset="${small(c.render)} 900w, ${c.render} 2000w" sizes="(max-width:1100px) 100vw, 45vw" data-full="${c.render}" alt="" loading="lazy" draggable="false"></button>` : ''}
  </div>`;
}
// Прототип листания: меню перелистывается само по кругу, пока оно на экране, без кнопок.
// Широкий экран — настоящая книжка: два листа на корешке посередине, лист переворачивается вокруг корешка
// (обложка → разворот → задняя сторона → разворот → обложка; закрытая книжка сдвигается в центр).
// Узкий экран — по одной странице: страница уходит ребром, следующая выходит с другой стороны
function liveMenu(box, c){
  const stage = box.querySelector('.kz-book-stage');
  const tpl = k => box.querySelector(`template[data-k="${k}"]`).innerHTML;
  const singles = ['front', 'col1', 'col2', 'back'];
  let wide = null, cur = 0, leaves = [], timer = 0, on = false, k = 0;
  // сколько держать каждую страницу: разворот читают дольше
  const PLAN = { wide: [[0, 2800], [1, 4600], [2, 2800], [1, 4600]], narrow: [[0, 2600], [1, 3800], [2, 3800], [3, 2600]] };
  const layout = () => {
    const w = stage.clientWidth >= 560;
    if (w === wide) return;
    wide = w; cur = 0; k = 0;
    stage.querySelectorAll('.kz-bk3d, .kz-bk-spread').forEach(x => x.remove());
    if (w) {
      stage.insertAdjacentHTML('beforeend', `<div class="kz-bk3d">
        <div class="kz-bk-leaf"><div class="kz-bk-face">${tpl('front')}</div><div class="kz-bk-face kz-bk-rev">${tpl('col1')}</div></div>
        <div class="kz-bk-leaf"><div class="kz-bk-face">${tpl('col2')}</div><div class="kz-bk-face kz-bk-rev">${tpl('back')}</div></div>
      </div>`);
      leaves = [...stage.querySelectorAll('.kz-bk-leaf')];
      book(0, true);
    } else stage.insertAdjacentHTML('beforeend', `<div class="kz-bk-spread">${tpl(singles[0])}</div>`);
    run();
  };
  // листы слева от корешка — перевернутые; переворачиваемый лист лежит поверх остальных
  const book = (to, instant) => {
    const bk = stage.querySelector('.kz-bk3d');
    bk.classList.toggle('instant', !!instant);
    bk.dataset.step = to;
    leaves.forEach((l, i) => {
      const turned = i < to;
      if (l.classList.contains('turned') !== turned) l.style.zIndex = 5;
      l.classList.toggle('turned', turned);
    });
    setTimeout(() => leaves.forEach((l, i) => { l.style.zIndex = i < to ? i + 1 : leaves.length - i; }), instant ? 0 : 900);
    if (instant) requestAnimationFrame(() => bk.classList.remove('instant'));
    cur = to;
  };
  const page = to => {
    const dir = to > cur || (cur === 3 && to === 0) ? 1 : -1, old = stage.querySelector('.kz-bk-spread');
    old.classList.add(dir > 0 ? 'out-l' : 'out-r');
    setTimeout(() => {
      old.remove();
      stage.insertAdjacentHTML('beforeend', `<div class="kz-bk-spread">${tpl(singles[to])}</div>`);
      const nw = stage.querySelector('.kz-bk-spread');
      nw.classList.add(dir > 0 ? 'in-r' : 'in-l'); nw.getBoundingClientRect(); nw.classList.remove('in-r', 'in-l');
    }, 300);
    cur = to;
  };
  const run = () => {
    clearTimeout(timer);
    if (!on) return;
    const plan = PLAN[wide ? 'wide' : 'narrow'];
    timer = setTimeout(() => {
      k = (k + 1) % plan.length;
      const to = plan[k][0];
      if (wide) book(to); else page(to);
      run();
    }, plan[k][1]);
  };
  const r = box.querySelector('.kz-bk-render');
  if (r) r.addEventListener('click', () => { const im = r.querySelector('img'); H.openViewer([im.dataset.full], 0, [im]); });
  layout();
  addEventListener('resize', layout);
  // без анимаций — сразу разворот, и ничего не листается
  if (still()) { if (wide) book(1, true); else { stage.querySelector('.kz-bk-spread').remove(); stage.insertAdjacentHTML('beforeend', `<div class="kz-bk-spread">${tpl('col1')}</div>`); } return; }
  onScreen(stage, v => { on = v; run(); });
}

/* ---------- коллаж: одна картинка крупно, остальные вокруг; по нажатию — крупно ---------- */
function collageHTML(c){
  return `<div class="kz-col">${c.items.map((it, i) =>
    `<button class="kz-stage kz-col-it${it.big ? ' big' : ''}${it.tall ? ' tall' : ''}" data-i="${i}" aria-label="Увеличить"><img src="${it.img}" alt="" loading="lazy" draggable="false"></button>`).join('')}</div>`;
}
function liveCollage(box){
  const imgs = [...box.querySelectorAll('.kz-col-it img')];
  box.querySelectorAll('.kz-col-it').forEach(b => b.addEventListener('click', () =>
    H.openViewer(imgs.map(x => x.currentSrc || x.src), +b.dataset.i, imgs)));
}

/* ---------- было и варианты: рендеры из презентации рядом, по нажатию — крупно ---------- */
// zoom: { s, x, y } — все картинки ряда увеличены в одно место: варианты отличаются деталью, и ее должно быть видно
function compareHTML(c){
  const z = c.zoom ? ` style="--zs:${c.zoom.s};--zx:${c.zoom.x}%;--zy:${c.zoom.y}%"` : '';
  return `<div class="kz-cmp${c.zoom ? ' zoom' : ''}" style="--n:${c.items.length}">${c.items.map((it, i) =>
    `<figure class="kz-cmp-it"><button class="kz-stage kz-cmp-pic" data-i="${i}" aria-label="Увеличить"><img src="${c.zoom ? it.img : small(it.img)}" data-full="${it.img}" alt="" loading="lazy" draggable="false"${z}></button>${
      it.name ? `<figcaption>${H.T(it.name)}</figcaption>` : ''}</figure>`).join('')}</div>`;
}
function liveCompare(box){
  const imgs = [...box.querySelectorAll('.kz-cmp-pic img')];
  box.querySelectorAll('.kz-cmp-pic').forEach(b => b.addEventListener('click', () =>
    H.openViewer(imgs.map(x => x.dataset.full), +b.dataset.i, imgs)));
}

/* ---------- переключатель рендеров: кнопки — варианты, картинки сменяются сами, пока их не трогали ---------- */
function viewsHTML(c){
  return `<div class="kz-views${c.side ? ' side' : ''}">
    <div class="kz-stage kz-views-pic" style="aspect-ratio:${c.ratio || '16/10'}">${c.items.map((it, i) =>
      `<div class="kz-view${i ? '' : ' on'}" data-i="${i}">${(it.imgs || [it.img]).map(src =>
        `<img src="${small(src)}" srcset="${small(src)} 900w, ${src} 2000w" sizes="${c.side ? '(max-width:760px) 100vw, 55vw' : '(max-width:760px) 100vw, 90vw'}" data-full="${src}" alt="" loading="lazy" draggable="false">`).join('')}</div>`).join('')}</div>
    <div class="kz-bar">${c.items.map((it, i) => `<button class="btn kz-chip${i ? '' : ' on'}" data-i="${i}">${H.T(it.name)}</button>`).join('')}</div>
  </div>`;
}
function liveViews(box, c){
  const views = [...box.querySelectorAll('.kz-view')], chips = [...box.querySelectorAll('.kz-chip')];
  const show = i => { views.forEach((v, k) => v.classList.toggle('on', k === i)); chips.forEach((b, k) => b.classList.toggle('on', k === i)); };
  const stop = autoTour(box.querySelector('.kz-views-pic'), c.items.length, show, 3600);
  chips.forEach((b, i) => b.addEventListener('click', () => { stop(i); show(i); }));
  onScreen(box, v => { if (v) box.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; }); }, '300px 0px');
  box.querySelector('.kz-views-pic').addEventListener('click', e => {
    const im = e.target.closest('img'); if (!im) return;
    const all = [...box.querySelectorAll('.kz-view img')];
    H.openViewer(all.map(x => x.dataset.full), all.indexOf(im), all);
  });
}

const KINDS = {
  glow:   [glowHTML, liveGlow],
  plan:   [planHTML, livePlan],
  wall:   [wallHTML, liveWall],
  front:  [frontHTML, liveFront],
  spots:  [spotsHTML, liveSpots],
  beauty: [beautyHTML, liveBeauty],
  apron:  [apronHTML, liveApron],
  views:  [viewsHTML, liveViews],
  menu:   [menuHTML, liveMenu],
  collage: [collageHTML, liveCollage],
  carousel: [carouselHTML, liveCarousel],
  compare:  [compareHTML, liveCompare],   // идет после основной картинки главы, если она есть
};

/* ================================================================
   НАВИГАЦИЯ: развилка, липкое меню с прогрессом, кнопка «дальше»
   ================================================================ */
function navHTML(places){
  return `<nav class="kz-nav" aria-label="Локации"><div class="wrap"><div class="kz-nav-in">${places.map(pl =>
    `<button class="kz-tab" data-go="${pl.key}"><span class="kz-tab-ic">${ICON[pl.key] || ''}</span><span class="kz-tab-name">${H.T(pl.name)}</span><i class="kz-prog"><b></b></i></button>`).join('')}</div></div></nav>`;
}
function placeHTML(pl){
  const chs = pl.chapters.map(ch => {
    const ks = Object.keys(KINDS).filter(x => ch[x]);
    return `<section class="kz-ch wrap" data-kind="${ks[0] || ''}">${head(ch)}${ks.map(k => `<div class="kz-viz kz-viz-${k}">${KINDS[k][0](ch[k])}</div>`).join('')}</section>`;
  }).join('');
  return `<div class="kz-place kz-place-${pl.key}" data-place="${pl.key}">
    <header class="kz-door"><div class="wrap">
      <h2 class="kz-door-name">${H.T(pl.name)}</h2><p class="kz-door-sub">${H.T(pl.text)}</p>
    </div></header>
    ${chs}
    ${pl.photos ? `<section class="kz-ch wrap" data-kind="photos">${head(pl.photos)}<div class="kz-viz">${carouselHTML(pl.photos)}</div></section>` : ''}
    ${pl.next && pl.nextKey ? `<div class="wrap kz-next-row"><button class="btn btn-line kz-next" data-go="${pl.nextKey}"><span>${H.T(pl.next)}</span><span class="kz-arr" aria-hidden="true">↓</span></button></div>` : ''}
  </div>`;
}
function liveNav(mount){
  const sc = mount.closest('.case') || document.scrollingElement;
  const nav = mount.querySelector('.kz-nav'), tabs = [...nav.querySelectorAll('.kz-tab')];
  const places = [...mount.querySelectorAll('.kz-place')];
  // верх липкого меню — под полоской «все работы»: прокручиваем так, чтобы заставка локации встала сразу под меню
  const go = key => {
    const pl = mount.querySelector(`.kz-place[data-place="${key}"]`); if (!pl) return;
    const under = nav.getBoundingClientRect().height + parseFloat(getComputedStyle(nav).top || 0);
    const top = pl.getBoundingClientRect().top - (sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top) - under + 1;
    sc.scrollTo({ top: sc.scrollTop + top, behavior: still() ? 'auto' : 'smooth' });
  };
  mount.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  let raf = 0;
  const upd = () => {
    raf = 0;
    const line = nav.getBoundingClientRect().bottom;
    let on = -1;
    places.forEach((pl, i) => {
      const r = pl.getBoundingClientRect();
      const k = clamp((line - r.top) / Math.max(1, r.height - (innerHeight - line)), 0, 1);
      tabs[i].style.setProperty('--k', k.toFixed(3));
      if (r.top <= line + 2 && r.bottom > line + 2) on = i;
    });
    tabs.forEach((t, i) => t.classList.toggle('on', i === on));
    nav.classList.toggle('stuck', on >= 0);
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(upd); };
  sc.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  upd();
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'kidz.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountKidz(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const K = p.kidz, places = K.places;
  places.forEach((pl, i) => { pl.nextKey = places[i + 1] ? places[i + 1].key : null; });
  mount.innerHTML = `
    <section class="kz-ch wrap kz-intro">${head(K.intro)}<div class="kz-viz">${twoHTML(places)}</div></section>
    <div class="kz-places">${navHTML(places)}${places.map(placeHTML).join('')}</div>`;
  mount.querySelectorAll('.kz-ch, .kz-door').forEach(s => reveal.observe(s));
  places.forEach(pl => {
    const sec = [...mount.querySelectorAll(`.kz-place[data-place="${pl.key}"] .kz-ch`)];
    pl.chapters.forEach((ch, i) => Object.keys(KINDS).forEach(k => {
      if (ch[k]) KINDS[k][1](sec[i].querySelector('.kz-viz-' + k), ch[k]);
    }));
    if (pl.photos) liveCarousel(sec[pl.chapters.length].querySelector('.kz-viz'), pl.photos);
    pl.chapters.forEach((ch, i) => { if (ch.aside) liveAside(sec[i]); });
  });
  liveNav(mount);
}
