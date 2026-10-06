/* ================================================================
   3D-ПРОСТРАНСТВО В КЕЙСЕ (поле world у проекта, см. «аудит сайта divan.ru»)
   Мир из Marble (World Labs) — файл сплатов .spz, рисует Spark поверх three.js.
   Тянуть мышью или пальцем — осмотреться; W A S D или стрелки — пройтись.
   Сначала грузится легкая версия (lite), потом без перерыва подменяется подробной (src).
   Рисует только пока блок виден на экране.
   ================================================================ */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
const SPARK_URL = 'https://cdn.jsdelivr.net/npm/@sparkjsdev/spark@2.3.1/+esm';   // Spark сам берет three той же версии

const TUNE = {
  fov: 62,            // угол обзора камеры
  yaw: 80,            // насколько можно повернуться влево и вправо, градусов
  pitch: 30,          // насколько вверх и вниз
  walk: 1.1,          // на сколько метров можно отойти от точки съемки
  speed: 1.2,         // скорость шага, метров в секунду
  drag: 0.16,         // чувствительность мыши, градусов на пиксель
  sway: 6,            // пока никто не трогает — камера плавно поводит головой на столько градусов
};

export async function mountWorld(box){
  const canvas = box.querySelector('canvas');
  const test = canvas.getContext('webgl2');
  if (!test) return;   // старый браузер: остается картинка-обложка
  const [THREE, { SparkRenderer, SplatMesh }] = await Promise.all([import(THREE_URL), import(SPARK_URL)]);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(TUNE.fov, 16 / 9, 0.01, 200);
  scene.add(new SparkRenderer({ renderer }));

  // мир Marble снят в координатах OpenCV — переворачиваем, как советует Spark
  const load = url => {
    const m = new SplatMesh({ url });
    m.quaternion.set(1, 0, 0, 0);
    return m.initialized.then(() => m);
  };

  const size = () => {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(size).observe(box); size();

  // взгляд и шаги
  let yaw = 0, pitch = 0, touched = false;
  const pos = new THREE.Vector3(), keys = new Set();
  const rad = d => d * Math.PI / 180, clamp = (v, a) => Math.max(-a, Math.min(a, v));
  let drag = null;
  box.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, touch: e.pointerType === 'touch' };
    touched = true; box.classList.add('grab');
  });
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    yaw = clamp(yaw - dx * TUNE.drag, TUNE.yaw);   // мир тянется за курсором, как в Marble
    if (!drag.touch) pitch = clamp(pitch - dy * TUNE.drag, TUNE.pitch);   // на телефоне вертикальный жест листает страницу
  });
  const up = () => { drag = null; box.classList.remove('grab'); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);

  // клавиши работают, когда курсор над блоком или блок выбран табом
  let hover = false;
  box.addEventListener('pointerenter', () => hover = true);
  box.addEventListener('pointerleave', () => { hover = false; keys.clear(); });
  const KEY = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  addEventListener('keydown', e => {
    if (!KEY[e.code] || !(hover || document.activeElement === box)) return;
    e.preventDefault(); e.stopPropagation(); keys.add(KEY[e.code]); touched = true;
  }, true);
  addEventListener('keyup', e => keys.delete(KEY[e.code]));
  addEventListener('blur', () => keys.clear());

  let visible = false, last = 0, t0 = performance.now();
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { last = performance.now(); renderer.setAnimationLoop(frame); }
    else renderer.setAnimationLoop(null);
  }).observe(box);

  const fwd = new THREE.Vector3(), side = new THREE.Vector3();
  function frame(now){
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const sway = touched ? 0 : Math.sin((now - t0) / 2600) * TUNE.sway;
    camera.rotation.set(rad(-pitch), rad(-yaw - sway), 0, 'YXZ');
    if (keys.size) {
      fwd.set(-Math.sin(rad(-yaw)), 0, -Math.cos(rad(-yaw)));
      side.set(-fwd.z, 0, fwd.x);
      const s = TUNE.speed * dt;
      if (keys.has('f')) pos.addScaledVector(fwd, s);
      if (keys.has('b')) pos.addScaledVector(fwd, -s);
      if (keys.has('l')) pos.addScaledVector(side, -s);
      if (keys.has('r')) pos.addScaledVector(side, s);
      if (pos.length() > TUNE.walk) pos.setLength(TUNE.walk);
    }
    camera.position.copy(pos);
    renderer.render(scene, camera);
  }

  box._world = { frame, camera, look: (y, p = 0) => { yaw = y; pitch = p; touched = true; } };   // для отладки: повернуть и нарисовать кадр вручную
  // легкая версия — сразу, подробная — следом
  let mesh = await load(box.dataset.lite || box.dataset.src);
  scene.add(mesh);
  box.classList.add('ready');
  if (box.dataset.lite && box.dataset.src) {
    const full = await load(box.dataset.src);
    scene.add(full); scene.remove(mesh); mesh.dispose?.(); mesh = full;
  }
}
