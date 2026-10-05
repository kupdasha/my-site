/* ================================================================
   ТЕКУЧИЕ ВОЛНЫ ЦВЕТА — как перелив на первом экране
   ----------------------------------------------------------------
   Любой элемент с атрибутом data-waves превращается в медленно
   текущие цветные волны. Цвета — в data-colors через запятую
   (четыре цвета, по кругу), скорость — data-speed (по умолчанию 1).
   С атрибутом data-scroll волны на компьютере текут только при прокрутке
   страницы, на телефоне — сами по себе.

   Все блоки рисуются одной видеокарточной сценой по очереди, поэтому
   волн на странице может быть сколько угодно — браузер не тормозит.
   ================================================================ */
const WAVES = {
  scale: 0.4,    // детализация: волны мягкие, высокое разрешение им не нужно
  speed: 1,      // общая скорость течения
  scroll: 0.004, // для data-scroll: насколько продвигаются волны за пиксель прокрутки
};

(() => {
'use strict';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const glc = document.createElement('canvas');
const gl = glc.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
if (!gl) return;

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime, uSeed;
uniform vec3 uC0, uC1, uC2, uC3;
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
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * vec2(uRes.x / uRes.y, 1.) * .5 + uSeed;   // крупные плавные волны
  float t = uTime * .12;
  // волны: шум, дважды искривленный другим шумом, — течет и закручивается
  vec2 q = vec2(snoise(p + vec2(t, -t * .7)), snoise(p * 1.3 + vec2(-t * .6, t) + 4.));
  vec2 r = vec2(snoise(p + q * .8 + vec2(t * .4, 1.7)), snoise(p + q * .8 + vec2(8.3, -t * .5)));
  float f = snoise(p + r * .7) * .5 + .5;
  float g = clamp(uv.x * .55 + f * .85 - .2, 0., 1.) * 3.;
  vec3 col = g < 1. ? mix(uC0, uC1, smoothstep(0., 1., g))
           : g < 2. ? mix(uC1, uC2, smoothstep(1., 2., g))
           :          mix(uC2, uC3, smoothstep(2., 3., g));
  // мягкие гребни волн — светлее по краю каждой волны
  float ridge = sin((f + r.x * .2) * 6. + t * 2.) * .5 + .5;
  col = mix(col, min(col * 1.1 + .04, 1.), smoothstep(.5, 1., ridge) * .18);
  gl_FragColor = vec4(col, 1.);
}`;
function sh(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
gl.linkProgram(prog); gl.useProgram(prog);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = {}; ['uRes', 'uTime', 'uSeed', 'uC0', 'uC1', 'uC2', 'uC3'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.trim().slice(i, i + 2), 16) / 255);

/* блоки с волнами: находим новые, забываем удаленные */
const targets = new Map();
const io = new IntersectionObserver(es => es.forEach(e => { const t = targets.get(e.target); if (t) t.visible = e.isIntersecting; }));
function scan(){
  document.querySelectorAll('[data-waves]').forEach(el => {
    if (targets.has(el)) return;
    const cv = document.createElement('canvas');
    cv.className = 'waves-canvas'; cv.setAttribute('aria-hidden', 'true');
    el.prepend(cv);
    targets.set(el, { cv, ctx: cv.getContext('2d'), seed: Math.random() * 40, visible: false, time: 0, drawn: false });
    io.observe(el);
  });
  targets.forEach((t, el) => { if (!el.isConnected) { io.unobserve(el); targets.delete(el); } });
}
new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
scan();

const desktop = matchMedia('(min-width: 901px) and (hover: hover)');
let prev = performance.now(), lastScroll = scrollY;
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  const scrolled = Math.abs(scrollY - lastScroll); lastScroll = scrollY;
  targets.forEach((t, el) => {
    if (!t.visible || el.style.opacity === '0' || parseFloat(el.style.opacity) < 0.01) return;   // погашенный блок не рисуем
    const r = el.getBoundingClientRect();
    const w = Math.max(16, Math.round(r.width * WAVES.scale)), h = Math.max(16, Math.round(r.height * WAVES.scale));
    const speed = (parseFloat(el.dataset.speed) || 1) * WAVES.speed;
    const same = t.cv.width === w && t.cv.height === h;
    if (reduced) { if (t.drawn && same) return; }
    else if ('scroll' in el.dataset && desktop.matches) { if (!scrolled && t.drawn && same) return; t.time += scrolled * WAVES.scroll * speed; }
    else t.time += dt * speed;
    t.drawn = true;
    if (glc.width !== w || glc.height !== h) { glc.width = w; glc.height = h; }
    if (t.cv.width !== w || t.cv.height !== h) { t.cv.width = w; t.cv.height = h; }
    gl.viewport(0, 0, w, h);
    const cols = (el.dataset.colors || '#9867F9,#4480F3,#1FAFC1,#E2FB5A').split(',').map(rgb);
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uTime, t.time);
    gl.uniform1f(U.uSeed, t.seed);
    gl.uniform3fv(U.uC0, cols[0]); gl.uniform3fv(U.uC1, cols[1 % cols.length]);
    gl.uniform3fv(U.uC2, cols[2 % cols.length]); gl.uniform3fv(U.uC3, cols[3 % cols.length]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    t.ctx.drawImage(glc, 0, 0);
  });
}
requestAnimationFrame(frame);
})();
