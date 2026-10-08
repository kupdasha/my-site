/* ================================================================
   ЖИВОЙ 3D-ЗНАК В КЕЙСЕ (элемент { mark3d } в галерее, см. «упаковку агентства Штурман дизайн»)
   Серебряный знак поворачивается вслед за курсором по всему экрану, на телефоне — вслед за пальцем;
   по нажатию делает полный оборот, как в исходной анимации. Наведение на направление (класс hot у блока)
   плавно зажигает знак лаймом.
   Рисует сам, на чистом WebGL, без three.js — так блок оживает почти сразу: весь код — этот файл,
   модель — img/…/mark.bin (~100 КБ после сжатия CDN).
   Модель (формат SHM3): «SHM3», число вершин, число индексов, масштаб; дальше побайтовые слои
   дельт координат и индексов — так файл хорошо сжимается. Как ее собрать — исходники/shturman-3d.
   Хром — «сфера отражений» (matcap): студия из мягких светлых и темных полос считается один раз
   в маленькую картинку, и каждая точка знака берет из нее цвет по своей нормали.
   Рисует только пока блок виден на экране.
   ================================================================ */
const TUNE = {
  turnX: 0.55,        // на сколько знак наклоняется вверх-вниз за курсором, радиан
  turnY: 0.85,        // на сколько поворачивается влево-вправо
  follow: 0.07,       // мягкость следования: меньше — плавнее
  sway: 0.18,         // пока курсор не двигается — знак сам слегка покачивается
  idle: 2200,         // через сколько миллисекунд покоя начинается покачивание
  spin: 1400,         // длительность полного оборота по нажатию, мс
  fov: 26,            // угол обзора камеры, градусов
  size: 0.6,          // высота знака от высоты блока
  drop: 0.1,          // на сколько знак ниже центра (доля высоты блока) — чтобы надпись сверху читалась, как на обложке
  tall: [0.42, -0.06],  // на вертикальном блоке (телефон): высота знака и сдвиг — знак между надписью и подписями
  mid: [0.48, 0.12],    // на почти квадратном блоке (планшет, 4:3)
  metal: '#F4F4F2',   // цвет серебра
  tint: '#C9FA6E',    // в какой цвет плавно уходит серебро при наведении на направление
  lime: '#B3F843',    // цвет лаймовых бликов
  glow: [0.12, 1],    // сила лаймовых бликов: в покое и при наведении
  glowEase: 0.06,     // плавность разгорания и угасания
  bright: 1.08,       // общая яркость хрома
};

// студия для отражений: сверху светло, снизу темнее, по кругу — размытые светлые и темные полосы
function studio(){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#FFFFFF'); sky.addColorStop(.45, '#F2F2F0'); sky.addColorStop(.52, '#C8C8C6'); sky.addColorStop(.6, '#5E5E5C'); sky.addColorStop(1, '#262626');
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  g.filter = 'blur(18px)'; g.globalAlpha = .9;
  [[60, 90, '#FFFFFF'], [200, 46, '#4A4A48'], [330, 130, '#FFFFFF'], [530, 56, '#585856'], [660, 80, '#FFFFFF'],
   [800, 64, '#4A4A48'], [930, 60, '#F4F4F2']].forEach(([x, w, col]) => { g.fillStyle = col; g.fillRect(x, 70, w, 300); });
  return g.getImageData(0, 0, 1024, 512);
}
// сфера отражений: для каждой нормали — куда отражается взгляд и какой там цвет студии
function matcap(S = 256){
  const env = studio(), E = env.data, out = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const nx = (x + .5) / S * 2 - 1, ny = 1 - (y + .5) / S * 2, q = nx * nx + ny * ny;
    const i = (y * S + x) * 4;
    if (q > 1) { out[i + 3] = 255; continue; }
    const nz = Math.sqrt(1 - q);
    const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;   // отражение взгляда (0, 0, -1)
    const u = Math.atan2(rz, rx) / (2 * Math.PI) + .5, v = Math.asin(Math.max(-1, Math.min(1, ry))) / Math.PI + .5;
    const j = (Math.min(511, Math.floor((1 - v) * 512)) * 1024 + Math.min(1023, Math.floor(u * 1024))) * 4;
    out[i] = E[j]; out[i + 1] = E[j + 1]; out[i + 2] = E[j + 2]; out[i + 3] = 255;
  }
  return out;
}

// модель: дельты координат и индексов, разложенные по байтам
function decode(buf){
  const h = new DataView(buf);
  if (h.getUint32(0, false) !== 0x53484D33) throw new Error('не SHM3');   // «SHM3»
  const nv = h.getUint32(4, true), ni = h.getUint32(8, true), Q = h.getUint32(12, true);
  const b = new Uint8Array(buf, 16);
  let o = 0;
  const plane = n => { const lo = b.subarray(o, o + n), hi = b.subarray(o + n, o + 2 * n); o += 2 * n; return k => lo[k] | hi[k] << 8; };
  const unzz = v => (v >>> 1) ^ -(v & 1);
  const pos = new Float32Array(nv * 3);
  for (let c = 0; c < 3; c++) { const get = plane(nv); let a = 0; for (let k = 0; k < nv; k++) { a += unzz(get(k)); pos[k * 3 + c] = a / Q; } }
  const idx = new Uint16Array(ni), get = plane(ni);
  for (let k = 0, hw = 0; k < ni; k++) { const i = hw - get(k); idx[k] = i; if (i === hw) hw++; }
  // гладкие нормали: сумма нормалей треугольников вокруг вершины
  const nrm = new Float32Array(nv * 3);
  for (let k = 0; k < ni; k += 3) {
    const a = idx[k] * 3, bb = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const ux = pos[bb] - pos[a], uy = pos[bb + 1] - pos[a + 1], uz = pos[bb + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const p of [a, bb, c]) { nrm[p] += nx; nrm[p + 1] += ny; nrm[p + 2] += nz; }
  }
  for (let k = 0; k < nrm.length; k += 3) { const l = Math.hypot(nrm[k], nrm[k + 1], nrm[k + 2]) || 1; nrm[k] /= l; nrm[k + 1] /= l; nrm[k + 2] /= l; }
  return { pos, nrm, idx };
}

const VERT = `attribute vec3 p; attribute vec3 n; uniform mat4 mvp; uniform mat3 nm; varying vec3 vn;
void main(){ vn = nm * n; gl_Position = mvp * vec4(p, 1.); }`;
const FRAG = `precision mediump float; varying vec3 vn; uniform sampler2D cap; uniform vec3 base, limeC; uniform float lime, bright;
void main(){
  vec3 n = normalize(vn);
  vec3 c = texture2D(cap, vec2(n.x * .495 + .5, .5 - n.y * .495)).rgb * base * bright;
  vec3 r = reflect(vec3(0., 0., -1.), n);
  c += pow(max(dot(r, normalize(vec3(-3., 4., 5.))), 0.), 40.) * .35;   // мягкий блик сверху слева
  float l = pow(max(dot(r, normalize(vec3(5., -1., 2.5))), 0.), 6.) + .7 * pow(max(dot(r, normalize(vec3(-4., -3., 1.5))), 0.), 6.);
  c += limeC * l * lime;
  gl_FragColor = vec4(min(c, 1.), 1.);
}`;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);

export async function mountMark(box){
  const canvas = box.querySelector('canvas');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) return;   // без WebGL блок остается без знака, остальное на месте
  const model = await fetch(box.dataset.model).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(decode);

  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const buf = (target, data, attr) => {
    gl.bindBuffer(target, gl.createBuffer()); gl.bufferData(target, data, gl.STATIC_DRAW);
    if (attr != null) { const a = gl.getAttribLocation(pr, attr); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 0, 0); }
  };
  buf(gl.ARRAY_BUFFER, model.pos, 'p'); buf(gl.ARRAY_BUFFER, model.nrm, 'n'); buf(gl.ELEMENT_ARRAY_BUFFER, model.idx);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, matcap(256));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const U = n => gl.getUniformLocation(pr, n);
  gl.uniform1i(U('cap'), 0); gl.uniform3fv(U('limeC'), hex(TUNE.lime)); gl.uniform1f(U('bright'), TUNE.bright);
  gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
  const silver = hex(TUNE.metal), tint = hex(TUNE.tint);
  const uBase = U('base'), uLime = U('lime'), uMvp = U('mvp'), uNm = U('nm');

  // камера: перспектива, знак отодвинут так, чтобы занимать нужную долю высоты
  let proj = null, camZ = 9, lift = 0;
  const size = () => {
    const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    const d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * d); canvas.height = Math.round(h * d); gl.viewport(0, 0, canvas.width, canvas.height);
    const asp = w / h, t = Math.tan(TUNE.fov * Math.PI / 360);
    const [k, drop] = asp < 1 ? TUNE.tall : asp < 1.5 ? TUNE.mid : [TUNE.size, TUNE.drop];
    const fit = 1 / (t * k);
    camZ = Math.max(fit, fit / Math.min(1, asp * 1.05));
    lift = -drop * 2 * camZ * t;
    const f = 1 / t, nr = .1, fr = 50;
    proj = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + nr) / (nr - fr), -1, 0, 0, 2 * fr * nr / (nr - fr), 0];
    draw();
  };

  // куда смотреть: курсор где угодно на экране, относительно центра блока
  let tx = 0, ty = 0, rx = 0, ry = 0, last = 0, spin = null, on = false, raf = 0, glow = TUNE.glow[0];
  const aim = (x, y) => {
    const r = box.getBoundingClientRect();
    const nx = (x - (r.left + r.width / 2)) / (innerWidth / 2), ny = (y - (r.top + r.height / 2)) / (innerHeight / 2);
    tx = Math.max(-1, Math.min(1, ny)) * TUNE.turnX; ty = Math.max(-1, Math.min(1, nx)) * TUNE.turnY;
    last = performance.now();
  };
  const touch = matchMedia('(pointer:coarse)').matches;
  if (!touch) addEventListener('pointermove', e => { if (on) aim(e.clientX, e.clientY); }, { passive: true });
  // на телефоне — вслед за пальцем по самому блоку (вертикальная прокрутка не мешает)
  box.addEventListener('pointermove', e => { if (touch && e.pointerType !== 'mouse') aim(e.clientX, e.clientY); }, { passive: true });
  box.addEventListener('click', () => { spin = { t0: performance.now() }; });
  // на телефоне направлений справа нет — знак загорается, пока палец на блоке
  if (touch) {
    box.addEventListener('pointerdown', () => box.classList.add('hot'), { passive: true });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => box.addEventListener(t, () => setTimeout(() => box.classList.remove('hot'), 600), { passive: true }));
  }

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(now = performance.now()){
    if (!proj) return;
    let sx = 0, sy = 0;
    const idle = now - last > TUNE.idle;
    if (!still && idle) { sx = Math.sin(now / 1700) * TUNE.sway * .5; sy = Math.sin(now / 2300) * TUNE.sway; }
    rx += (tx * (idle ? .3 : 1) + sx - rx) * TUNE.follow;
    ry += (ty * (idle ? .3 : 1) + sy - ry) * TUNE.follow;
    let extra = 0;
    if (spin) {
      const k = Math.min(1, (now - spin.t0) / TUNE.spin);
      extra = Math.PI * 2 * (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
      if (k >= 1) spin = null;
    }
    glow += ((box.classList.contains('hot') ? TUNE.glow[1] : TUNE.glow[0]) - glow) * TUNE.glowEase;
    const g = (glow - TUNE.glow[0]) / (TUNE.glow[1] - TUNE.glow[0]);
    gl.uniform3fv(uBase, silver.map((s, i) => s + (tint[i] - s) * g));
    gl.uniform1f(uLime, glow);
    // поворот: сначала вокруг вертикали, потом наклон (как Euler XYZ у three.js)
    const a = rx, b = ry + extra, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const R = [cb, sa * sb, -ca * sb, 0, ca, sa, sb, -sa * cb, ca * cb];   // по столбцам: Rx · Ry
    const M = [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, 0, lift, -camZ, 1];
    const P = proj, mvp = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * M[c * 4 + k]; mvp[c * 4 + r] = s;
    }
    gl.uniformMatrix4fv(uMvp, false, mvp);
    gl.uniformMatrix3fv(uNm, false, R);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, model.idx.length, gl.UNSIGNED_SHORT, 0);
  }
  const loop = now => { draw(now); if (on) raf = requestAnimationFrame(loop); };
  size(); new ResizeObserver(size).observe(box);
  box.classList.add('live');
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; raf = requestAnimationFrame(loop); }
    else if (!e.isIntersecting) { on = false; cancelAnimationFrame(raf); }
  }).observe(box);
}
