// НОМЕР СВЕЖЕЙ ВЕРСИИ САЙТА для загрузчика на Тильде (LOADER в tilda/build.py).
// Читает ветку main прямо из git на GitHub (адрес, которым пользуется сам git): без лимита GitHub API
// и без кешей raw.githubusercontent и jsDelivr. Ответ — 40 знаков номера коммита, держится 5 секунд.
//
// /f/<номер коммита>/img/<путь> — РОЛИКИ И КАРТИНКИ С GITHUB для тех файлов, которые jsDelivr не отдает
// (репозиторий больше 50 МБ: крупные ролики на свежем коммите jsDelivr отдает с ошибкой или обрывает на 10 МБ).
// Берет файл с raw.githubusercontent по номеру коммита, ставит правильный тип (raw отдает octet-stream —
// Safari такое видео может не играть), пропускает Range для перемотки, держит в кеше Cloudflare год:
// по номеру коммита файл больше не меняется. Пример: в content.js video: 'https://kup-version.kupdaria26.workers.dev/f/<sha>/img/alia/film.mp4'
const REFS = 'https://github.com/kupdasha/my-site.git/info/refs?service=git-upload-pack';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain; charset=utf-8' };
const TYPES = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', avif: 'image/avif' };

async function file(req, sha, path) {
  const ext = (path.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
  if (!TYPES[ext] || path.includes('..')) return new Response('', { status: 404, headers: CORS });
  const headers = {};
  const range = req.headers.get('Range');
  if (range) headers.Range = range;
  const r = await fetch(`https://raw.githubusercontent.com/kupdasha/my-site/${sha}/${path}`, {
    headers, cf: { cacheEverything: true, cacheTtl: 31536000 },
  });
  const out = new Headers(r.headers);
  out.set('Content-Type', TYPES[ext]);
  out.set('Access-Control-Allow-Origin', '*');
  out.set('Cache-Control', r.ok ? 'public, max-age=31536000, immutable' : 'no-store');
  out.set('Accept-Ranges', 'bytes');
  ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'strict-transport-security'].forEach(h => out.delete(h));
  return new Response(r.body, { status: r.status, headers: out });
}

async function rangeAsset(req, env) {
  const r = await env.ASSETS.fetch(new Request(req.url));
  if (!r.ok) return r;
  const buf = await r.arrayBuffer(), size = buf.byteLength;
  // ETag — версия файла: если ролик перезалили под тем же адресом, телефон не склеит старые куски с новыми
  const etag = r.headers.get('ETag') || `"${size}"`;
  const h = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=600, must-revalidate', 'ETag': etag };
  const ir = req.headers.get('If-Range');
  if (ir && ir !== etag) return new Response(buf, { headers: { ...h, 'Content-Length': size } });
  const m = (req.headers.get('Range') || '').match(/bytes=(\d*)-(\d*)/);
  if (!m) return new Response(buf, { headers: { ...h, 'Content-Length': size } });
  let a = m[1] === '' ? size - +m[2] : +m[1], b = m[1] !== '' && m[2] !== '' ? Math.min(+m[2], size - 1) : size - 1;
  if (a >= size || a < 0) return new Response('', { status: 416, headers: { ...h, 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(a, b + 1), { status: 206, headers: { ...h, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 } });
}

// последний коммит main репозитория kupdasha/<repo>: читается из git на GitHub, держится в кеше узла 5 секунд.
// GitHub иногда не отвечает узлу Cloudflare — тогда второй путь (GitHub API), а если и он молчит — последний удачный номер
// (хранится в кеше узла год). Без этого страница уходила на jsDelivr @main, а там застряла старая копия (репозиторий > 50 МБ),
// и открывалась давняя версия. null — номера не знает никто.
async function latestSha(repo, ctx) {
  const cache = caches.default, key = new Request('https://kup-version.cache/' + repo), last = new Request('https://kup-version.cache/last/' + repo);
  const hit = await cache.match(key);
  if (hit) return hit.text();
  let sha = null;
  for (let i = 0; i < 2 && !sha; i++) {
    try {
      const r = await fetch(`https://github.com/kupdasha/${repo}.git/info/refs?service=git-upload-pack`, { headers: { 'User-Agent': 'git/2.40 kup-version' } });
      const m = r.ok && (await r.text()).match(/([0-9a-f]{40}) refs\/heads\/main\b/);
      if (m) sha = m[1];
    } catch (e) {}
  }
  if (!sha) {
    try {
      const r = await fetch(`https://api.github.com/repos/kupdasha/${repo}/commits/main`, { headers: { 'User-Agent': 'kup-version', 'Accept': 'application/vnd.github.sha' } });
      const t = r.ok ? (await r.text()).trim() : '';
      if (/^[0-9a-f]{40}$/.test(t)) sha = t;
    } catch (e) {}
  }
  if (!sha) { const old = await cache.match(last); return old ? old.text() : null; }
  ctx.waitUntil(Promise.all([
    cache.put(key, new Response(sha, { headers: { 'Cache-Control': 'max-age=5' } })),
    cache.put(last, new Response(sha, { headers: { 'Cache-Control': 'max-age=31536000' } }))
  ]));
  return sha;
}

async function checkPage(req, ctx) {
  const [a, m] = await Promise.all([latestSha('alfa', ctx), latestSha('army-sport', ctx)]);
  const cf = req.cf || {};
  const info = `узел Cloudflare: ${cf.colo || '?'}, сеть: ${cf.asOrganization || '?'}, город: ${cf.city || '?'}`;
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>проверка каналов</title>
<style>body{font:17px/1.4 system-ui,sans-serif;margin:20px;color:#121314}h1{font-size:22px;margin:0 0 6px}p{margin:0 0 14px;color:#6E7178}table{border-collapse:collapse;width:100%}td{padding:8px 6px;border-top:1px solid #E4E5E8;vertical-align:top}td:last-child{text-align:right;white-space:nowrap}.ok{color:#15803d}.fail{color:#EF3124;font-weight:600}.wait{color:#6E7178}textarea{width:100%;height:120px;margin-top:14px;font:13px/1.3 monospace}</style>
<h1>проверка каналов</h1><p>${info}<br>${(req.headers.get('User-Agent') || '').slice(0, 90)}</p>
<table id="t"></table><textarea id="log" readonly placeholder="итог — скопируйте и пришлите"></textarea>
<script>
const T=[
 ['HTML с воркера (workers.dev)','fetch','/alfa/?c='+Date.now()],
 ['стили с воркера (workers.dev)','fetch','/alfa/al.css?c='+Date.now()],
 ['код тестового с jsDelivr','script','https://cdn.jsdelivr.net/gh/kupdasha/alfa@${a}/al.js'],
 ['стили тестового с jsDelivr','fetch','https://cdn.jsdelivr.net/gh/kupdasha/alfa@${a}/al.css'],
 ['шрифт тестового с jsDelivr','fetch','https://cdn.jsdelivr.net/gh/kupdasha/alfa@${a}/fonts/GolosText-500-cyrillic.woff2'],
 ['картинка тестового с jsDelivr','img','https://cdn.jsdelivr.net/gh/kupdasha/alfa@${a}/img/v1-cover-s.webp'],
 ['код армии с jsDelivr','script','https://cdn.jsdelivr.net/gh/kupdasha/army-sport@${m}/as.js'],
 ['GitHub (raw)','nocors','https://raw.githubusercontent.com/kupdasha/alfa/${a}/index.html'],
 ['GitHub Pages (github.io)','nocors','https://kupdasha.github.io/'],
];
const t=document.getElementById('t'),log=document.getElementById('log'),res=[];
const row=n=>{const r=t.insertRow();r.insertCell().textContent=n;const c=r.insertCell();c.className='wait';c.textContent='…';return c};
const test=(kind,url)=>new Promise(r=>{const t0=performance.now(),done=ok=>r([ok,Math.round(performance.now()-t0)]);const to=setTimeout(()=>done(false),15000);
 if(kind==='script'||kind==='img'){const e=document.createElement(kind);e.onload=()=>{clearTimeout(to);done(true)};e.onerror=()=>{clearTimeout(to);done(false)};e.src=url;if(kind==='script')document.head.appendChild(e);}
 else fetch(url,{cache:'reload',mode:kind==='nocors'?'no-cors':'cors'}).then(x=>{clearTimeout(to);done(kind==='nocors'||x.ok)}).catch(()=>{clearTimeout(to);done(false)});});
(async()=>{for(const [n,k,u] of T){const c=row(n);const [ok,ms]=await test(k,u);c.className=ok?'ok':'fail';c.textContent=(ok?'ок ':'НЕТ ')+ms+' мс';res.push(n+': '+(ok?'ок':'НЕТ')+' '+ms+'мс');log.value=res.join('\\n');}
 log.value+='\\n'+${JSON.stringify(info)}+'\\n'+navigator.userAgent;})();
</script>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    // ролики из статики (/alfa/*.mp4) — частями по запросу Range: статика Cloudflare отдает файл только целиком, а Safari без 206 не играет
    if (env.ASSETS && u.pathname.endsWith('.mp4')) return rangeAsset(req, env);
    // /armysport — свежая сборка презентации «Армия спорта» прямо с GitHub, без Тильды:
    // index.html по последнему коммиту, файлы (as.css, as.js, img, fonts) — с jsDelivr по тому же номеру;
    // /armysport2 — второй этап (stage2.html), /armysport3 — третья доработка (stage3.html), /armysport4 — четвертая (stage4.html); прошлые остаются по своим ссылкам
    // Страницы, у которых HTML берется с GitHub по последнему коммиту main, а файлы (css, js, img, fonts) — с jsDelivr
    // по номеру того же коммита: /armysport, /armysport2, /armysport3 и /armysport4 — «Армия спорта», /alfa — тестовое в Альфа-Банк.
    // Так файлы не идут через workers.dev: в России его часто душат, а jsDelivr проходит.
    // /alfa/check — диагностика с телефона: какие каналы (workers.dev, jsDelivr, GitHub) доходят из сети посетителя
    if (u.pathname === '/alfa/check') return checkPage(req, ctx);
    const PAGES = { '/armysport': ['army-sport', 'index.html'], '/armysport2': ['army-sport', 'stage2.html'], '/armysport3': ['army-sport', 'stage3.html'], '/armysport4': ['army-sport', 'stage4.html'], '/alfa': ['alfa', 'index.html'] };
    const pg = PAGES[u.pathname.replace(/\/$/, '')];
    if (pg) {
      const [repo, file] = pg;
      // номер коммита — из кеша узла (5 с), HTML по номеру коммита не меняется — кеш на год:
      // без этого каждое открытие страницы ходило на GitHub дважды, с узла в России это секунды
      const sha = (await latestSha(repo, ctx)) || 'main';
      const page = await fetch(`https://raw.githubusercontent.com/kupdasha/${repo}/${sha}/${file}`, { cf: { cacheEverything: true, cacheTtl: sha === 'main' ? 30 : 31536000 } });
      // репозитория (пока) нет — страница отдается из статики воркера (public/alfa), как раньше
      if (!page.ok) return env.ASSETS ? env.ASSETS.fetch(new Request(new URL('/alfa/index.html', req.url))) : new Response('нет страницы', { status: 502, headers: CORS });
      const html = (await page.text()).replace('<head>', `<head><base href="https://cdn.jsdelivr.net/gh/kupdasha/${repo}@${sha}/">`);
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    const f = u.pathname.match(/^\/f\/([0-9a-f]{40})\/(img\/.+)$/);
    if (f) return file(req, f[1], decodeURIComponent(f[2]));
    // ?repo=army-sport — номер версии другого репозитория kupdasha (презентация «Армия спорта»)
    const repo = (u.searchParams.get('repo') || 'my-site').replace(/[^a-z0-9-]/gi, '');
    const sha = await latestSha(repo, ctx);
    if (!sha) return new Response('', { status: 502, headers: CORS });
    return new Response(sha, { headers: { ...CORS, 'Cache-Control': 'no-store' } });
  },
};
