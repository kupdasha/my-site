#!/usr/bin/env node
/* ================================================================
   ТЕКСТ В HTML ЗАРАНЕЕ (для поисковиков и нейросетей)
   ----------------------------------------------------------------
   Роботы Яндекса, Bing, GPTBot, PerplexityBot и другие обычно не запускают
   JavaScript и видели в блоках Тильды пустые теги. Этот скрипт открывает
   страницы прототипа в браузере без окна (серьезная версия), ждет, пока
   app.js все разложит, и сохраняет готовую разметку разделов
   в tilda/prerender.json. tilda/build.py вставляет ее в блоки вместо пустых
   тегов — после этого блоки надо один раз перевставить в Тильду.

   Для посетителя ничего не меняется: app.js перерисовывает те же разделы
   так же, как из пустых. Из готовой разметки убрано то, что app.js ставит
   сам: скрипты, ролики, iframe; у картинок нет адреса (только alt), чтобы
   браузер не качал их дважды; нет классов «in» (анимации появления идут
   как раньше). Корень раздела помечен data-pre: в дружеской версии он
   скрыт, пока app.js не подставит дружеские тексты (style.css), а app.js
   снимает пометку после первой отрисовки.

   Запуск:  node tilda/prerender.js           — собрать tilda/prerender.json
            node tilda/prerender.js --check   — проверить: страница с готовой
              разметкой после работы app.js совпадает со страницей из пустых тегов
   Когда запускать: после заметной правки текстов (content.js) или разметки
   страниц, потом python3 tilda/build.py и перевставить блоки в Тильду.
   Браузер: переменная CHROME, иначе Chromium из Playwright, Google Chrome
   или Яндекс Браузер. Управление — по протоколу DevTools (WebSocket в Node 22+).
   ================================================================ */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.dirname(__dirname);
const OUT = path.join(__dirname, 'prerender.json');
const CDN = 'https://cdn.jsdelivr.net/gh/kupdasha/my-site@main/';
const CHECK = process.argv.includes('--check');

/* страницы и их разделы (по id) — те же, что build.py кладет в блоки */
const PAGES = {
  index:   { file: 'index.html',   ids: ['head', 'hero', 'directions', 'works', 'nda', 'contact'] },
  about:   { file: 'about.html',   ids: ['about', 'photos', 'community', 'contact'] },
  speaker: { file: 'speaker.html', ids: ['speaker', 'topics', 'talks', 'bio', 'org', 'contact'] },
};

function findChrome(){
  const home = os.homedir();
  const pw = (() => { try {
    const dir = path.join(home, 'Library/Caches/ms-playwright');
    return fs.readdirSync(dir).filter(d => d.startsWith('chromium-')).sort().reverse()
      .map(d => path.join(dir, d, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'));
  } catch (e) { return []; } })();
  return [process.env.CHROME, ...pw, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Yandex.app/Contents/MacOS/Yandex']
    .find(p => p && fs.existsSync(p));
}

/* страница прототипа так, как ее видит Тильда: content.js и app.js подключены не по адресу «content.js»,
   поэтому app.js переводит ссылки на адреса сайта (index.html → /, about.html → /i и т. д.).
   pre — готовая разметка разделов для проверки (--check): ставится вместо пустых */
function page(name, pre, all){
  const { file } = PAGES[name];
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8')
    .replace(/<script>\(function\(\)\{var v=[^\n]*document\.write[^\n]*<\/script>/, '<script src="./content.js"></script><script src="./app.js"></script>')
    .replace('<script src="content.js"></script>', '<script src="./content.js"></script>')
    .replace('<script src="app.js"></script>', '<script src="./app.js"></script>');
  // FUN=1 — проверить дружескую версию (--check)
  if (process.env.FUN) html = html.replace('<head>', `<head><script>localStorage.setItem('kd-mode', 'dark')</script>`);
  // в готовую разметку — все проекты, а не только фильтр по умолчанию (app.js на сайте все равно выберет его сам)
  if (all) html = html.replace('<script src="./app.js"></script>', '<script>SITE.works.startFilter = \'\'</script><script src="./app.js"></script>');
  if (pre) for (const [id, el] of Object.entries(pre)) html = replaceById(html, id, el.split(CDN).join('/'));
  return html;
}

/* заменить элемент с данным id (вместе с вложенными) в тексте страницы */
function replaceById(html, id, el){
  const m = new RegExp(`<(header|section)\\b[^>]*\\bid="${id}"[^>]*>`).exec(html);
  if (!m) return html;
  const tag = m[1], start = m.index;
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = start + m[0].length;
  let depth = 1, r;
  while ((r = re.exec(html))) { depth += r[0][1] === '/' ? -1 : 1; if (!depth) break; }
  if (!r) return html;
  return html.slice(0, start) + el + html.slice(r.index + r[0].length);
}

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4' };

function serve(routes){
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = new URL(req.url, 'http://x');
      if (routes[u.pathname]) { rsp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return rsp.end(routes[u.pathname]()); }
      const f = path.join(ROOT, decodeURIComponent(u.pathname.replace(/^\/__pr\//, '/')));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

/* ---------- браузер по протоколу DevTools ---------- */
async function launch(chrome){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kup-pr-'));
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--mute-audio', '--autoplay-policy=user-gesture-required', `--user-data-dir=${dir}`, '--remote-debugging-port=0',
    '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  const portFile = path.join(dir, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
  const [port] = fs.readFileSync(portFile, 'utf8').split('\n');
  const close = () => { try { proc.kill('SIGKILL'); } catch (e) {} setTimeout(() => fs.rmSync(dir, { recursive: true, force: true }), 300); };
  return { port, close };
}
async function tab(port){
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const wait = {}, events = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } else if (m.method) {
    events.push(m.method);
    if (process.env.DEBUG && m.method === 'Runtime.exceptionThrown') console.error('  ошибка в странице:', m.params.exceptionDetails.exception?.description?.split('\n')[0]);
    if (process.env.DEBUG && m.method === 'Network.loadingFailed') console.error('  не загрузилось:', m.params.errorText); } };
  const send = (method, params = {}) => new Promise(ok => { const n = ++id; wait[n] = ok; ws.send(JSON.stringify({ id: n, method, params })); });
  return { send, events, close: () => ws.close() };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* открыть страницу, дождаться отрисовки и выполнить выражение в ней */
async function grab(port, url, expr){
  const t = await tab(port);
  try {
    await t.send('Page.enable');
    if (process.env.DEBUG) { await t.send('Runtime.enable'); await t.send('Network.enable'); }
    await t.send('Page.navigate', { url });
    for (let i = 0; i < 200 && !t.events.includes('Page.loadEventFired'); i++) await sleep(100);
    await sleep(3500);   // app.js и модули дорисовывают разделы
    if (process.env.DEBUG) console.error('  ', url, JSON.stringify((await t.send('Runtime.evaluate', { expression: '[location.href, typeof SITE, !!window.__kdAppOK, [...document.scripts].map(s=>s.src||"inline").join(" "), document.readyState]', returnByValue: true })).result.result.value));
    const r = await t.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'ошибка в странице');
    return r.result.result.value;
  } finally { t.close(); }
}

/* в странице: копии разделов без того, что app.js ставит сам */
const CLEAN = ids => `(() => {
  const out = {};
  for (const id of ${JSON.stringify(ids)}) {
    const el = document.getElementById(id); if (!el) continue;
    const c = el.cloneNode(true);
    c.querySelectorAll('script,video,iframe,audio,source,object,embed,.legs,.zzz').forEach(n => n.remove());
    // буквы заголовков app.js раскладывает по span.ch для анимации — роботу нужно целое слово
    c.querySelectorAll('.ch').forEach(n => n.replaceWith(n.textContent));
    c.normalize();
    c.querySelectorAll('img').forEach(i => { i.removeAttribute('src'); i.removeAttribute('srcset'); i.setAttribute('loading', 'lazy'); });
    [c, ...c.querySelectorAll('[class]')].forEach(n => { n.classList.remove('in', 'on', 'runner'); if (!n.getAttribute('class')) n.removeAttribute('class'); });
    c.querySelectorAll('[data-busy],[data-retry]').forEach(n => { n.removeAttribute('data-busy'); n.removeAttribute('data-retry'); });
    c.setAttribute('data-pre', '');
    out[id] = c.outerHTML.split(location.origin + '/__pr/').join(${JSON.stringify(CDN)}).split(location.origin + '/').join(${JSON.stringify(CDN)});
  }
  return out;
})()`;

/* в странице: «отпечаток» разделов после работы app.js — для сравнения двух загрузок */
const PRINT = ids => `(() => {
  const out = {};
  for (const id of ${JSON.stringify(ids)}) {
    const el = document.getElementById(id); if (!el) { out[id] = null; continue; }
    const tags = {};
    el.querySelectorAll('*').forEach(n => { const k = n.tagName + '.' + [...n.classList].filter(c => !['in','on','show','swap','pre'].includes(c)).sort().join('.'); tags[k] = (tags[k] || 0) + 1; });
    out[id] = { text: el.textContent.replace(/\\s+/g, ' ').trim(), tags, pre: el.hasAttribute('data-pre') || !!el.querySelector('[data-pre]') };
  }
  return out;
})()`;

/* ТАПЛИНК: верстка taplink.html, поверх нее — тексты и ссылки из настроек блока (window.TAPLINK)
   той же функцией apply, что стоит в блоке Тильды. Блок уже собран build.py — берем из него */
function tapPage(){
  const block = fs.readFileSync(path.join(__dirname, 'блоки/5 таплинк/1 таплинк целиком.txt'), 'utf8');
  const settings = block.slice(block.indexOf('<script>') + 8, block.indexOf('</script>'));
  const fns = block.slice(block.indexOf('function esc('), block.indexOf('function show('));
  const html = fs.readFileSync(path.join(ROOT, 'taplink.html'), 'utf8');
  const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root">${body}</div>
<script>${settings}\n${fns}\napply(document.getElementById('root'));</script></body></html>`;
}
const TAP_GRAB = `(() => { const r = document.getElementById('root');
  r.querySelectorAll('script,video,iframe,audio,canvas').forEach(n => n.remove());
  r.querySelectorAll('img').forEach(i => { i.removeAttribute('src'); i.removeAttribute('srcset'); });
  return r.innerHTML.replace(/\\n\\s*\\n/g, '\\n').trim(); })()`;

(async () => {
  const chrome = findChrome();
  if (!chrome) { console.error('prerender: не нашел браузер (Chromium, Chrome или Яндекс)'); process.exit(2); }
  const saved = CHECK && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  if (CHECK && !saved) { console.error('prerender: сначала соберите tilda/prerender.json'); process.exit(2); }
  const routes = { '/__pr/tap': tapPage };
  for (const name of Object.keys(PAGES)) {
    routes[`/__pr/${name}`] = () => page(name, null, !CHECK);
    routes[`/__pr/${name}-pre`] = () => page(name, saved && saved[name]);
  }
  const srv = await serve(routes);
  const base = `http://127.0.0.1:${srv.address().port}/__pr/`;
  const { port, close } = await launch(chrome);
  try {
    if (!CHECK) {
      const out = {};
      for (const [name, { ids }] of Object.entries(PAGES)) out[name] = await grab(port, base + name, CLEAN(ids));
      out.tap = await grab(port, base + 'tap', TAP_GRAB);
      fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
      for (const [name, v] of Object.entries(out)) {
        const s = typeof v === 'string' ? v : Object.values(v).join('');
        console.log(`${name}: ${(Buffer.byteLength(s) / 1024).toFixed(0)} КБ разметки`);
      }
      console.log('готово: tilda/prerender.json — теперь python3 tilda/build.py');
    } else {
      let bad = 0;
      for (const [name, { ids }] of Object.entries(PAGES)) {
        const a = await grab(port, base + name, PRINT(ids)), b = await grab(port, base + name + '-pre', PRINT(ids));
        for (const id of ids) {
          const x = a[id], y = b[id], diff = [];
          if (!x || !y) { diff.push('нет раздела'); }
          else {
            if (x.text !== y.text) diff.push(`текст разный (${x.text.length} и ${y.text.length} знаков)`);
            for (const k of new Set([...Object.keys(x.tags), ...Object.keys(y.tags)])) if ((x.tags[k] || 0) !== (y.tags[k] || 0)) diff.push(`${k}: ${x.tags[k] || 0} → ${y.tags[k] || 0}`);
            if (y.pre) diff.push('пометка data-pre не снята');
          }
          if (diff.length) bad++;
          console.log(`${name} #${id}: ${diff.length ? diff.slice(0, 8).join('; ') : 'совпадает'}`);
        }
      }
      process.exitCode = bad ? 1 : 0;
    }
  } finally { close(); srv.close(); }
})().catch(e => { console.error('prerender:', e.message); process.exit(1); });
