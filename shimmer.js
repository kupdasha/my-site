/* ================================================================
   РАДУЖНЫЙ ШИММЕР НА ПЕРВОМ ЭКРАНЕ
   ----------------------------------------------------------------
   Мелкая россыпь искр, сквозь которую медленно течет радужный
   перелив, как по перламутру. Каждая искра мерцает в своем ритме,
   вокруг курсора они разгораются, клик или смена версии пускают
   по ним круговую волну. На телефоне перелив течет за наклоном.
   Под текстом искры почти гаснут, чтобы он читался.

   Рисуется видеокартой (WebGL), поэтому плавно даже на всю ширину.
   Ниже — всё, что можно спокойно менять.
   ================================================================ */
const SHIMMER = {
  light: {
    background: '#FCFCFA', // фон, совпадает с фоном страницы
    glow:  0.55,           // светлота радуги: больше — пастельнее
    vivid: 0.45,           // насыщенность радуги: больше — ярче
    wash:  0.45,           // перламутровая дымка между искрами (0 — без нее)
  },
  /* Дружеская версия — как на старом сайте: сплошной текучий перелив
     и частая сетка мелких светлых точек поверх него */
  dark: {
    background: '#0E0F12',
    original:   true,
    colors:     ['#A64BE3', '#4F5BE6', '#45C46E', '#D3EC52'], // перелив слева направо
    cell:       6,      // шаг сетки точек, px
    dots:       0.75,   // насколько точки радужные поверх перелива (0 — того же цвета, 1 — чистая радуга)
    glow:  0.62, vivid: 0.42, wash: 0.6,
  },
  cell:    7,     // шаг россыпи, px: меньше — мельче и гуще
  density: 1,     // сколько мест занято искрами (0–1)
  sparkle: 1,     // скорость мерцания
  speed:   2.2,   // скорость перелива: 1 — спокойно, 3 — очень быстро
  lens:    200,   // радиус, в котором искры разгораются вокруг курсора, px
  quiet:   0,     // яркость искр под текстом (0 — их там нет совсем, 1 — не гаснут)
};

(() => {
'use strict';
const canvas = document.getElementById('dots');
if (!canvas) return;
const hero = canvas.parentElement;
const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
if (!gl) return;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision highp float;
uniform vec2  uRes, uMouse, uTilt;
uniform float uTime, uCell, uLens, uMouseOn, uIntro, uWash, uGlow, uVivid, uDensity, uSparkle, uQuietMin, uDpr;
uniform vec4  uQuiet[3];   // прямоугольники с текстом: x, y, ширина, высота
uniform vec3  uBg, uO0, uO1, uO2, uO3;
uniform float uOrig, uDots;
uniform vec4  uRip[4];

vec3 permute(vec3 x){ return mod(((x * 34.) + 1.) * x, 289.); }
float snoise(vec2 v){
  const vec4 C = vec4(.211324865405187, .366025403784439, -.577350269189626, .024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.);
  vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
  m = m * m; m = m * m;
  vec3 x = 2. * fract(p * C.www) - 1.; vec3 h = abs(x) - .5; vec3 ox = floor(x + .5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - .85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}
// радуга без оранжевого: от желтого через зеленый, голубой и фиолетовый
// к пурпурному и плавно обратно
vec3 hue(float h){ return clamp(abs(mod(h * 6. + vec3(0., 4., 2.), 6.) - 3.) - 1., 0., 1.); }
vec3 rainbow(float x){
  float h = .15 + .75 * (1. - abs(fract(x) * 2. - 1.));   // до пурпурного: красный рядом с зеленым дает рыжину
  return clamp(uGlow + uVivid * (hue(h) * 2. - 1.), 0., 1.);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(){
  vec2 fc  = gl_FragCoord.xy;
  vec2 cid = floor(fc / uCell);
  float r1 = hash(cid), r2 = hash(cid + 17.3), r3 = hash(cid + 41.7);
  // искра сидит не по сетке, а чуть в стороне — получается россыпь
  vec2 ctr = (cid + .5 + (vec2(r1, r2) - .5) * .4) * uCell;
  vec2 p   = ctr / uRes.y;
  float t  = uTime;

  // течение: шум, искривленный другим шумом
  vec2 q = vec2(snoise(p * 1.1 + vec2(t * .05, -t * .04) + uTilt),
                snoise(p * 1.1 + vec2(-t * .04, t * .05) + 3.7 - uTilt));
  float n     = snoise(p * .8 + q * .9 + t * .03) * .5 + .5;
  float shade = snoise(p * .5 - q * .4 + t * .02) * .5 + .5;

  float lens = uMouseOn * smoothstep(uLens, 0., length(ctr - uMouse));

  float rip = 0.;
  for (int i = 0; i < 4; i++) {
    vec4 r = uRip[i];
    float age = t - r.z;
    if (age > 0. && age < 4.) {
      float d = length(ctr - r.xy) - age * 520. * uDpr;
      rip += r.w * exp(-age * 1.1) * exp(-d * d / (46. * 46. * uDpr * uDpr));
    }
  }

  // появление: россыпь проступает волной от левого верхнего угла
  float grow = clamp((uIntro * 1300. - length(ctr - vec2(0., uRes.y)) / uDpr) / 500., 0., 1.);

  // под текстом и шапкой искры гаснут
  float qd = 1e5;
  for (int i = 0; i < 3; i++) {
    vec4 b = uQuiet[i];
    if (b.z <= 0.) continue;
    // скругленный прямоугольник: углы мягкие, а не острые
    float rr = 48. * uDpr;
    vec2 dd = abs(ctr - (b.xy + b.zw * .5)) - b.zw * .5 + rr;
    qd = min(qd, length(max(dd, 0.)) + min(max(dd.x, dd.y), 0.) - rr);
  }
  // край зоны чуть волнистый и плавный — получается облако, а не прямоугольник
  qd += snoise(ctr / uRes.y * 3.2 + t * .08) * 26. * uDpr;
  float calm = mix(uQuietMin, 1., smoothstep(-16. * uDpr, 150. * uDpr, qd));
  calm *= mix(uQuietMin, 1., smoothstep(50. * uDpr, 170. * uDpr, uRes.y - ctr.y + snoise(vec2(ctr.x / uRes.y * 3., t * .1)) * 20. * uDpr));

  // ---------- дружеская версия: как на старом сайте ----------
  if (uOrig > .5) {
    vec2 g0 = (floor(fc / uCell) + .5) * uCell;               // ровная сетка
    vec2 pg = g0 / uRes.y;
    // перелив течет и закручивается: два слоя шума, второй искривляет первый
    vec2 fw = fc / uRes.y;
    float flow = fc.x / uRes.x
      + snoise(fw * .6 + vec2(t * .05, -t * .04) + uTilt + snoise(fw * 1.2 - t * .06) * .5) * .5;
    flow = clamp(flow, 0., 1.) * 3.;
    vec3 grad = flow < 1. ? mix(uO0, uO1, smoothstep(0., 1., flow))
              : flow < 2. ? mix(uO1, uO2, smoothstep(1., 2., flow))
              :             mix(uO2, uO3, smoothstep(2., 3., flow));
    float nd = snoise(pg * 2.2 + q * .6 + t * .05) * .5 + .5;
    float lensO = uMouseOn * smoothstep(uLens, 0., length(g0 - uMouse));
    float rO = ((.14 + .2 * nd) * grow + lensO * .2 + rip * .2) * uCell;
    float dotO = 1. - smoothstep(rO - .7 * uDpr, rO + .5 * uDpr, length(fc - g0));
    vec3 base = mix(uBg, grad, grow);
    // за текстом и шапкой точек нет, перелив остается чистым
    float calmO = calm;

    // точки радужные: свой оттенок течет по полю, у курсора ярче
    vec3 rb = rainbow(shade * 1.3 + g0.x / uRes.x * .8 + g0.y / uRes.y * .4 + t * .03);
    vec3 dcol = mix(grad, rb, uDots + lensO * .3);
    gl_FragColor = vec4(mix(base, dcol, dotO * (.5 + .5 * nd) * calmO), 1.);   // за текстом точек нет
    return;
  }

  // мерцание и пустоты
  float twinkle = .62 + .38 * sin(t * (1.2 + r3 * 3.) * uSparkle + r1 * 6.283);
  float here    = step(r3, uDensity * (.45 + .55 * n));
  // у нижнего края экрана искры и дымка плавно растворяются в фоне следующего блока
  float fadeOut = smoothstep(0., 200. * uDpr, ctr.y);
  float size = ((.11 + .2 * n) * twinkle * here * grow + lens * .1 + rip * .14) * calm * fadeOut;
  float rad  = min(size, .32) * uCell;
  float spark = 1. - smoothstep(rad - .8 * uDpr, rad + .5 * uDpr, length(fc - ctr));

  vec3 col = rainbow(shade * 1.2 + n * .5 + (ctr.x + ctr.y) / uRes.y * .3 + t * .02 + lens * .3 + rip * .3);

  // перламутровая дымка между искрами — по каждому пикселю, плавная
  vec2 pf = fc / uRes.y;
  float nw = snoise(pf * .8 + vec2(t * .03, -t * .025) + uTilt * .5) * .5 + .5;
  vec3 wcol = rainbow(nw * 1.3 + (pf.x + pf.y) * .3 + t * .015);
  float haze = uWash * smoothstep(.3, 1., nw) * grow * mix(.25, 1., calm) * smoothstep(0., 200. * uDpr, fc.y);
  vec3 bg = mix(uBg, wcol, haze * .4);
  gl_FragColor = vec4(mix(bg, col, spark), 1.);
}`;

function shader(type, src){
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
const prog = gl.createProgram();
gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
gl.linkProgram(prog); gl.useProgram(prog);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, 'p');
gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = {};
['uRes','uMouse','uTilt','uTime','uCell','uLens','uMouseOn','uIntro','uWash','uGlow','uVivid','uDensity','uSparkle','uQuietMin','uDpr','uQuiet','uBg','uRip','uO0','uO1','uO2','uO3','uOrig','uDots']
  .forEach(n => U[n] = gl.getUniformLocation(prog, n));

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);

/* ---------- размер ---------- */
let W = 0, H = 0, dpr = 1;
function resize(){
  dpr = Math.min(2, devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  W = r.width; H = r.height;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  measureText();
}
/* где на первом экране лежит текст — там точки затихают */
let quiet = new Float32Array(12);
function textBox(els){
  const rs = els.map(e => hero.querySelector(e)).filter(Boolean).flatMap(e => {
    // у заголовка берем строки текста, а не всю ширину блока
    const range = document.createRange(); range.selectNodeContents(e);
    return [...range.getClientRects()];
  });
  if (!rs.length) return [0, 0, 0, 0];
  const c = canvas.getBoundingClientRect(), pad = 10;
  const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top));
  const rr = Math.max(...rs.map(r => r.right)), b = Math.max(...rs.map(r => r.bottom));
  return [(l - c.left - pad) * dpr, (c.bottom - b - pad) * dpr, (rr - l + pad * 2) * dpr, (b - t + pad * 2) * dpr];
}
function measureText(){
  quiet = new Float32Array([...textBox(['.eyebrow', '.h1', '.hero-sub']), ...textBox(['.lead']), ...textBox(['.ctas'])]);
}
if (document.fonts) document.fonts.ready.then(measureText);
setTimeout(measureText, 1200);
new ResizeObserver(resize).observe(canvas);
resize();

/* ---------- курсор, касания, наклон ---------- */
let mx = -1e4, my = -1e4, smx = -1e4, smy = -1e4, mouseOn = 0, mouseTarget = 0;
let lastX = 0, lastY = 0, lastT = 0, lastRip = 0;
let tiltX = 0, tiltY = 0, stx = 0, sty = 0;
const ripples = [];
function ripple(x, y, strength = 1){
  ripples.push([x * dpr, (H - y) * dpr, time, strength]);
  if (ripples.length > 4) ripples.shift();
}
hero.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
  if (smx < -9e3) { smx = x; smy = y; }
  mx = x; my = y; mouseTarget = 1;
  // быстрое движение оставляет за курсором мягкие круги
  const speed = Math.hypot(x - lastX, y - lastY) / Math.max(1, now - lastT);
  if (speed > 1.6 && now - lastRip > 380) { ripple(x, y, 0.55); lastRip = now; }
  lastX = x; lastY = y; lastT = now;
});
hero.addEventListener('pointerleave', () => { mouseTarget = 0; });
hero.addEventListener('pointerdown', e => {
  const r = canvas.getBoundingClientRect();
  ripple(e.clientX - r.left, e.clientY - r.top, 1);
  // iOS спрашивает разрешение на наклон только после касания
  if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {});
});
addEventListener('deviceorientation', e => {
  if (e.gamma == null) return;
  tiltX = Math.max(-1, Math.min(1, e.gamma / 35)) * 0.9;
  tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 35)) * 0.9;
});
addEventListener('shimmer:ripple', () => { ripple(W / 2, H * 0.55, 1.4); measureText(); });

/* ---------- кадр ---------- */
let visible = true, time = 0, intro = 0, prev = performance.now();
const started = performance.now();
new IntersectionObserver(es => visible = es[0].isIntersecting).observe(hero);

function frame(now){
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  if (!reduced) requestAnimationFrame(frame);
  if (!visible || document.body.classList.contains('locked')) return;

  time  += reduced ? 0 : dt * SHIMMER.speed;
  intro  = reduced ? 9 : (now - started) / 1000;   // появление идет по реальному времени
  smx += (mx - smx) * 0.12; smy += (my - smy) * 0.12;
  mouseOn += (mouseTarget - mouseOn) * 0.08;
  stx += (tiltX - stx) * 0.05; sty += (tiltY - sty) * 0.05;

  const theme = document.documentElement.dataset.theme === 'dark' ? SHIMMER.dark : SHIMMER.light;
  gl.uniform2f(U.uRes, canvas.width, canvas.height);
  gl.uniform2f(U.uMouse, smx * dpr, (H - smy) * dpr);
  gl.uniform2f(U.uTilt, stx, sty);
  gl.uniform1f(U.uTime, time);
  gl.uniform1f(U.uCell, (theme.cell || SHIMMER.cell) * dpr);
  gl.uniform1f(U.uLens, SHIMMER.lens * dpr);
  gl.uniform1f(U.uMouseOn, mouseOn);
  gl.uniform1f(U.uIntro, intro);
  gl.uniform1f(U.uWash, theme.wash);
  gl.uniform1f(U.uGlow, theme.glow);
  gl.uniform1f(U.uVivid, theme.vivid);
  gl.uniform1f(U.uDensity, SHIMMER.density);
  gl.uniform1f(U.uSparkle, SHIMMER.sparkle);
  gl.uniform1f(U.uQuietMin, SHIMMER.quiet);
  gl.uniform1f(U.uDpr, dpr);
  gl.uniform4fv(U.uQuiet, quiet);
  if (intro < 3) measureText();   // пока заголовок выезжает по словам, обновляем зону
  gl.uniform3fv(U.uBg, rgb(theme.background));
  gl.uniform1f(U.uOrig, theme.original ? 1 : 0);
  gl.uniform1f(U.uDots, theme.dots || 0);
  const oc = (theme.colors || ['#000000', '#000000', '#000000', '#000000']).map(rgb);
  gl.uniform3fv(U.uO0, oc[0]); gl.uniform3fv(U.uO1, oc[1]); gl.uniform3fv(U.uO2, oc[2]); gl.uniform3fv(U.uO3, oc[3]);
  const rip = new Float32Array(16);
  ripples.forEach((r, i) => rip.set(r, i * 4));
  gl.uniform4fv(U.uRip, rip);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
requestAnimationFrame(frame);
/* при уменьшенном движении — один неподвижный кадр, перерисовка при смене версии */
if (reduced) addEventListener('shimmer:ripple', () => requestAnimationFrame(frame));
})();
