/* ================================================================
   КЕЙС «МУЛЬТИК СОЗДАННЫЙ КОДОМ» (блоки ctPlayer и ctStories в gallery)
   ctPlayer — рабочий плеер, в котором собирался мультик: кнопки сцен,
   кадр, субтитр под ним, перемотка и темп. Кадры и субтитры настоящие,
   отрендерены из кода мультика.
   ctStories — вертикальные сторис по очереди, как в телефоне: полоски
   сверху, нажатие слева — назад, справа — вперед, удержание — пауза.
   Тексты и кадры — в content.js, оформление — cartoon.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, openViewer, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtNum = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
const fmt = v => String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(Math.floor(v % 60)).padStart(2, '0');
// следит, виден ли блок: играем только на экране
const watch = (el, cb) => new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold: .35 }).observe(el);

/* ---------- рабочий плеер ---------- */
const HOLD = 2.8;   // сколько секунд держится один кадр при темпе 100

function playerHTML(d){
  return `<div class="wrap ct-wrap">
    ${d.caption ? `<p class="camp-cap">${H.T(d.caption)}</p>` : ''}
    <div class="ct-player">
      <div class="ct-eps" role="group" aria-label="Сцены">${d.scenes.map((s, i) =>
        `<button class="ct-ep" data-i="${i}" aria-label="Сцена ${i + 1}: ${s.title}">${i + 1}</button>`).join('')}</div>
      <div class="ct-screen"><img class="ct-a" alt=""><img class="ct-b" alt=""></div>
      <div class="ct-subs"><p class="ct-sub"></p><div class="ct-pace"><i></i></div></div>
      <div class="ct-bar">
        <button class="ct-play ct-btn-main">пауза</button>
        <button class="ct-again ct-btn">заново</button>
        <input class="ct-scrub" type="range" min="0" max="1000" value="0" aria-label="Перемотка">
        <span class="ct-clock">00:00</span>
        <span class="ct-tempo">темп<input class="ct-tempo-in" type="range" min="65" max="150" value="100" aria-label="Темп"><span class="ct-len"></span></span>
      </div>
      <p class="ct-title"></p>
    </div>
  </div>`;
}

function livePlayer(box, d){
  const $ = s => box.querySelector(s);
  const imgs = [$('.ct-a'), $('.ct-b')], eps = [...box.querySelectorAll('.ct-ep')];
  const sub = $('.ct-sub'), pace = $('.ct-pace i'), clock = $('.ct-clock'), scrub = $('.ct-scrub'),
        play = $('.ct-play'), tempo = $('.ct-tempo-in'), len = $('.ct-len'), title = $('.ct-title');
  let si = 0, fi = -1, front = 0, u = 0, rate = 1, playing = !still(), seen = false, last = 0;
  const sc = () => d.scenes[si];
  // время кадра в сцене: от его отметки к отметке следующего
  const timeAt = (f, k) => { const fr = sc().frames, a = fr[f].t, b = f + 1 < fr.length ? fr[f + 1].t : sc().dur; return a + (b - a) * k; };

  function show(f){
    if (f === fi) return;
    fi = f; const fr = sc().frames[f];
    const next = imgs[1 - front];
    next.src = fr.src;
    next.classList.add('on'); imgs[front].classList.remove('on'); front = 1 - front;
    sub.innerHTML = fr.sub ? H.T(fr.sub) : '&nbsp;';
  }
  function scene(i){
    si = i; fi = -1; u = 0;
    eps.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
    title.innerHTML = H.T('сцена ' + (i + 1) + ': ' + sc().title);
    len.textContent = Math.round(sc().dur * rate) + ' с';
    sc().frames.forEach(f => { const im = new Image(); im.src = f.src; });   // подгрузить кадры сцены заранее
    show(0); sync();
  }
  function sync(){
    const n = sc().frames.length, f = Math.min(n - 1, Math.floor(u)), k = u - f;
    show(f);
    const t = timeAt(f, k) * rate;
    clock.textContent = fmt(t) + ' / ' + fmt(sc().dur * rate);
    scrub.value = Math.round(clamp(u / n, 0, 1) * 1000);
    pace.style.width = (k * 100) + '%';
  }
  function frame(now){
    const dt = clamp((now - last) / 1000, 0, .05); last = now;
    if (playing && seen && box.isConnected){
      u += dt / (HOLD * rate);
      if (u >= sc().frames.length) scene((si + 1) % d.scenes.length); else sync();
    }
    if (box.isConnected) requestAnimationFrame(frame);
  }
  const setPlay = on => { playing = on; play.textContent = on ? 'пауза' : 'играть'; };
  play.onclick = () => setPlay(!playing);
  $('.ct-again').onclick = () => { u = 0; fi = -1; setPlay(true); sync(); };
  eps.forEach(b => b.onclick = () => { scene(+b.dataset.i); setPlay(true); });
  scrub.oninput = () => { u = scrub.value / 1000 * sc().frames.length * .999; sync(); };
  tempo.oninput = () => { rate = tempo.value / 100; len.textContent = Math.round(sc().dur * rate) + ' с'; sync(); };
  $('.ct-screen').onclick = () => setPlay(!playing);
  watch(box, v => { seen = v; last = performance.now(); });
  scene(0);
  requestAnimationFrame(t => { last = t; frame(t); });
}

/* ---------- сторис по очереди ---------- */
// значок Instagram для кнопки «смотреть» — белый, цветом текста кнопки
const IG = '<svg class="ct-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>';
const STORY = 6;   // секунд на одну сторис

function storiesHTML(d){
  const it = d.items;
  const noted = it.filter(s => s.note);
  return `<div class="wrap ct-wrap">
    ${d.caption ? `<p class="camp-cap">${H.T(d.caption)}</p>` : ''}
    <div class="ct-st">
      <div class="ct-phone" tabindex="0" aria-label="Сторис: нажатие слева — назад, справа — вперед">
        <div class="ct-bars">${it.map(() => '<span><i></i></span>').join('')}</div>
        <img class="ct-a" alt=""><img class="ct-b" alt="">
      </div>
      <div class="ct-side">
        <ol class="ct-list">${it.map((s, i) => `<li><button class="ct-item" data-i="${i}">${H.T(s.title)}</button></li>`).join('')}</ol>
        ${noted.map(s => `<div class="ct-hit">
          <b class="ct-num" data-to="${s.views || 0}">${s.views ? fmtNum(s.views) : ''}</b>
          <p class="ct-hit-text">${H.T(s.note)}</p>
          ${s.link ? `<div class="ct-hit-go"><a class="ct-go" href="${s.link}" target="_blank" rel="noopener">${IG}${H.T(s.linkText || 'смотреть')}</a><p class="ct-hit-note">${s.vpn ? `<span>${H.T(s.vpn)}</span>` : ''}${d.warning ? `<span>${H.T(d.warning)}</span>` : ''}</p></div>` : ''}
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// число просмотров считается от нуля, когда блок доезжает до экрана
function countUp(){
  document.querySelectorAll('.ct-num:not(.done)').forEach(el => {
    const to = +el.dataset.to; if (!to) return;
    el.classList.add('done');
    if (still()) { el.textContent = fmtNum(to); return; }
    const t0 = performance.now(), D = 1600;
    const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtNum(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
function liveStories(box, d){
  const phone = box.querySelector('.ct-phone'), imgs = [...phone.querySelectorAll('img')];
  const bars = [...box.querySelectorAll('.ct-bars i')], items = [...box.querySelectorAll('.ct-item')];
  let si = 0, t = 0, fi = -1, front = 0, held = false, seen = false, last = 0;
  const auto = !still();
  d.items.forEach(s => s.frames.forEach(src => { const im = new Image(); im.src = src; }));

  function show(f){
    if (f === fi) return;
    fi = f;
    const next = imgs[1 - front];
    next.src = d.items[si].frames[f];
    next.classList.add('on'); imgs[front].classList.remove('on'); front = 1 - front;
  }
  function go(i){
    si = (i + d.items.length) % d.items.length; t = 0; fi = -1;
    items.forEach((b, k) => b.setAttribute('aria-current', k === si ? 'true' : 'false'));
    draw();
  }
  function draw(){
    const fr = d.items[si].frames;
    show(Math.min(fr.length - 1, Math.floor(t / STORY * fr.length)));
    bars.forEach((b, k) => b.style.width = (k < si ? 100 : k > si ? 0 : t / STORY * 100) + '%');
  }
  function frame(now){
    const dt = clamp((now - last) / 1000, 0, .05); last = now;
    if (auto && seen && !held && box.isConnected){
      t += dt;
      if (t >= STORY) go(si + 1); else draw();
    }
    if (box.isConnected) requestAnimationFrame(frame);
  }
  // удержание — пауза; короткое нажатие слева — назад, справа — вперед
  let downAt = 0;
  phone.addEventListener('pointerdown', () => { held = true; downAt = performance.now(); });
  phone.addEventListener('pointerleave', () => { held = false; });
  phone.addEventListener('pointerup', e => {
    held = false;
    if (performance.now() - downAt > 350) return;
    const r = phone.getBoundingClientRect();
    go(e.clientX - r.left < r.width / 3 ? si - 1 : si + 1);
  });
  phone.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go(si + 1);
    else if (e.key === 'ArrowLeft') go(si - 1);
  });
  items.forEach(b => b.onclick = () => go(+b.dataset.i));
  watch(box, v => { seen = v; last = performance.now(); if (v) countUp(); });
  go(0);
  requestAnimationFrame(n => { last = n; frame(n); });
}

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'cartoon.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}

export async function mountCartoon(mount, x, helpers){
  H = helpers;
  if (!x) return;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  if (x.ctPlayer){ mount.innerHTML = playerHTML(x.ctPlayer); livePlayer(mount, x.ctPlayer); }
  else if (x.ctStories){ mount.innerHTML = storiesHTML(x.ctStories); liveStories(mount, x.ctStories); }
}
