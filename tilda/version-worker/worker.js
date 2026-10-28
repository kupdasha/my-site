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

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    // ролики из статики (/alfa/*.mp4) — частями по запросу Range: статика Cloudflare отдает файл только целиком, а Safari без 206 не играет
    if (env.ASSETS && u.pathname.endsWith('.mp4')) return rangeAsset(req, env);
    // /armysport — свежая сборка презентации «Армия спорта» прямо с GitHub, без Тильды:
    // index.html по последнему коммиту, файлы (as.css, as.js, img, fonts) — с jsDelivr по тому же номеру;
    // /armysport2 — второй этап (stage2.html), первый остается по старой ссылке
    // Страницы, у которых HTML берется с GitHub по последнему коммиту main, а файлы (css, js, img, fonts) — с jsDelivr
    // по номеру того же коммита: /armysport и /armysport2 — «Армия спорта», /alfa — тестовое в Альфа-Банк.
    // Так файлы не идут через workers.dev: в России его часто душат, а jsDelivr проходит.
    const PAGES = { '/armysport': ['army-sport', 'index.html'], '/armysport2': ['army-sport', 'stage2.html'], '/alfa': ['alfa', 'index.html'] };
    const pg = PAGES[u.pathname.replace(/\/$/, '')];
    if (pg) {
      const [repo, file] = pg;
      const r0 = await fetch(`https://github.com/kupdasha/${repo}.git/info/refs?service=git-upload-pack`, { headers: { 'User-Agent': 'git/2.40 kup-version' } });
      const sha = ((r0.ok && (await r0.text()).match(/([0-9a-f]{40}) refs\/heads\/main\b/)) || [])[1] || 'main';
      const page = await fetch(`https://raw.githubusercontent.com/kupdasha/${repo}/${sha}/${file}`);
      // репозитория (пока) нет — страница отдается из статики воркера (public/alfa), как раньше
      if (!page.ok) return env.ASSETS ? env.ASSETS.fetch(new Request(new URL('/alfa/index.html', req.url))) : new Response('нет страницы', { status: 502, headers: CORS });
      const html = (await page.text()).replace('<head>', `<head><base href="https://cdn.jsdelivr.net/gh/kupdasha/${repo}@${sha}/">`);
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    const f = u.pathname.match(/^\/f\/([0-9a-f]{40})\/(img\/.+)$/);
    if (f) return file(req, f[1], decodeURIComponent(f[2]));
    // ?repo=army-sport — номер версии другого репозитория kupdasha (презентация «Армия спорта»)
    const repo = (u.searchParams.get('repo') || 'my-site').replace(/[^a-z0-9-]/gi, '');
    const refs = `https://github.com/kupdasha/${repo}.git/info/refs?service=git-upload-pack`;
    const cache = caches.default, key = new Request('https://kup-version.cache/' + repo);
    const hit = await cache.match(key);
    if (hit) return new Response(await hit.text(), { headers: { ...CORS, 'Cache-Control': 'no-store' } });
    const r = await fetch(refs, { headers: { 'User-Agent': 'git/2.40 kup-version' } });
    const m = r.ok && (await r.text()).match(/([0-9a-f]{40}) refs\/heads\/main\b/);
    if (!m) return new Response('', { status: 502, headers: CORS });
    ctx.waitUntil(cache.put(key, new Response(m[1], { headers: { 'Cache-Control': 'max-age=5' } })));
    return new Response(m[1], { headers: { ...CORS, 'Cache-Control': 'no-store' } });
  },
};
