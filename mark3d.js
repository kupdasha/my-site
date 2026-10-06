/* ================================================================
   ЖИВОЙ 3D-ЗНАК В КЕЙСЕ (элемент { mark3d } в галерее, см. «упаковку агентства Штурман дизайн»)
   Серебряный знак из блендера поворачивается вслед за курсором по всему экрану,
   на телефоне — вслед за пальцем; по нажатию делает полный оборот, как в исходной анимации.
   Модель — img/…/mark.bin: [число вершин, число индексов] + координаты Int16 + индексы Uint16 + нормали Int8.
   Контур знака взят из кривых «Shturman motion.blend» и «надут» в круглые трубки, потом в Блендере
   перестроен мелким вокселем и сглажен — так края ровные, без ступенек исходного ремеша.
   Хром отражает студию из полос — свои светлые и темные «софтбоксы», как в исходном рендере.
   Рисует только пока блок виден на экране.
   ================================================================ */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';   // та же версия, что в world.js — из кеша

const TUNE = {
  turnX: 0.55,        // на сколько знак наклоняется вверх-вниз за курсором, радиан
  turnY: 0.85,        // на сколько поворачивается влево-вправо
  follow: 0.07,       // мягкость следования: меньше — плавнее
  sway: 0.18,         // пока курсор не двигается — знак сам слегка покачивается
  idle: 2200,         // через сколько миллисекунд покоя начинается покачивание
  spin: 1400,         // длительность полного оборота по нажатию, мс
  size: 0.6,          // высота знака от высоты блока
  drop: 0.1,          // на сколько знак ниже центра (доля высоты блока) — чтобы надпись сверху читалась, как на обложке
  tall: [0.4, -0.03], // на вертикальном блоке (телефон): высота знака и сдвиг — знак между надписью и подписями
  metal: '#F4F4F2',   // цвет серебра
  rough: 0.16,        // шероховатость: меньше — зеркальнее
  lime: '#B3F843',    // цвет бликов подсветки
  tint: '#C9FA6E',    // в какой цвет плавно уходит серебро при наведении на направление
  glow: [1.2, 12],     // сила лаймовых бликов: в покое и при наведении на направление
  glowEase: 0.06,     // плавность разгорания и угасания
};

// студия для отражений: вертикальные полосы света и тени, сверху светло, снизу темнее
function studio(THREE, renderer){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#FFFFFF'); sky.addColorStop(.45, '#F2F2F0'); sky.addColorStop(.52, '#C8C8C6'); sky.addColorStop(.6, '#5E5E5C'); sky.addColorStop(1, '#262626');
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  // мягкие софтбоксы: светлые и темные полосы с размытыми краями — блики на хроме ложатся плавно
  g.filter = 'blur(18px)';
  [[60, 90, '#FFFFFF'], [200, 46, '#4A4A48'], [330, 130, '#FFFFFF'], [530, 56, '#585856'], [660, 80, '#FFFFFF'],
   [800, 64, '#4A4A48'], [930, 60, '#F4F4F2']]
    .forEach(([x, w, col]) => { g.fillStyle = col; g.globalAlpha = .9; g.fillRect(x, 70, w, 300); });
  g.filter = 'none';
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromEquirectangular(tex).texture;
  tex.dispose(); pm.dispose();
  return env;
}

async function loadMark(THREE, url){
  const buf = await fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
  const [nv, ni] = new Uint32Array(buf, 0, 2);
  const q = new Int16Array(buf, 8, nv * 3), pos = new Float32Array(nv * 3);
  for (let i = 0; i < q.length; i++) pos[i] = q[i] / 32767;
  const off = 8 + Math.ceil(nv * 6 / 4) * 4;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, off, ni), 1));
  // после индексов могут идти готовые нормали (Int8): у «надутых» трубок они точные, без складок
  const nOff = off + ni * 2;
  if (buf.byteLength >= nOff + nv * 3) {
    const n8 = new Int8Array(buf, nOff, nv * 3), nrm = new Float32Array(nv * 3);
    for (let i = 0; i < n8.length; i++) nrm[i] = n8[i] / 127;
    geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  } else geo.computeVertexNormals();
  return geo;
}

export async function mountMark(box){
  const canvas = box.querySelector('canvas');
  if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) return;   // без WebGL остается картинка
  const THREE = await import(THREE_URL);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  scene.environment = studio(THREE, renderer);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0, 9);

  const geo = await loadMark(THREE, box.dataset.model);
  const mat = new THREE.MeshStandardMaterial({ color: TUNE.metal, metalness: 1, roughness: TUNE.rough, envMapIntensity: 1.05 });
  const mesh = new THREE.Mesh(geo, mat);
  const pivot = new THREE.Group(); pivot.add(mesh); scene.add(pivot);
  // мягкий блик сверху слева — как свет в исходной сцене
  const key = new THREE.DirectionalLight('#FFFFFF', 1.6); key.position.set(-3, 4, 5); scene.add(key);
  // лаймовые блики сбоку и снизу: слегка видны всегда, разгораются при наведении на направление
  const limeA = new THREE.DirectionalLight(TUNE.lime, 0), limeB = new THREE.DirectionalLight(TUNE.lime, 0);
  limeA.position.set(5, -1, 2.5); limeB.position.set(-4, -3, 1.5); scene.add(limeA, limeB);
  let glow = TUNE.glow[0];
  const silver = new THREE.Color(TUNE.metal), tint = new THREE.Color(TUNE.tint);

  const size = () => {
    const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // знак занимает TUNE.size высоты блока, но не вылезает по ширине на узком экране
    const [k, drop] = camera.aspect < 1 ? TUNE.tall : [TUNE.size, TUNE.drop];
    const fit = 2 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * k);
    camera.position.z = Math.max(fit, fit / Math.min(1, camera.aspect * 1.05));
    camera.updateProjectionMatrix();
    pivot.position.y = -drop * 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    draw();
  };

  // куда смотреть: курсор где угодно на экране, относительно центра блока
  let tx = 0, ty = 0, rx = 0, ry = 0, last = 0, spin = null, on = false, raf = 0;
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
  box.addEventListener('click', () => { spin = { t0: performance.now(), from: pivot.rotation.y }; });

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(now = performance.now()){
    let sx = 0, sy = 0;
    if (!still && now - last > TUNE.idle) { sx = Math.sin(now / 1700) * TUNE.sway * .5; sy = Math.sin(now / 2300) * TUNE.sway; }
    rx += (tx * (now - last > TUNE.idle ? .3 : 1) + sx - rx) * TUNE.follow;
    ry += (ty * (now - last > TUNE.idle ? .3 : 1) + sy - ry) * TUNE.follow;
    let extra = 0;
    if (spin) {
      const k = Math.min(1, (now - spin.t0) / TUNE.spin);
      extra = Math.PI * 2 * (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
      if (k >= 1) spin = null;
    }
    glow += ((box.classList.contains('hot') ? TUNE.glow[1] : TUNE.glow[0]) - glow) * TUNE.glowEase;
    limeA.intensity = glow; limeB.intensity = glow * .7;
    mat.color.lerpColors(silver, tint, (glow - TUNE.glow[0]) / (TUNE.glow[1] - TUNE.glow[0]));
    pivot.rotation.set(rx, ry + extra, 0);
    renderer.render(scene, camera);
  }
  const loop = now => { draw(now); if (on) raf = requestAnimationFrame(loop); };
  size(); new ResizeObserver(size).observe(box);
  box.classList.add('live');
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; raf = requestAnimationFrame(loop); }
    else if (!e.isIntersecting) { on = false; cancelAnimationFrame(raf); }
  }).observe(box);
}
