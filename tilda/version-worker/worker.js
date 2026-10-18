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

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    // /armysport — свежая сборка презентации «Армия спорта» прямо с GitHub, без Тильды:
    // index.html по последнему коммиту, файлы (as.css, as.js, img, fonts) — с jsDelivr по тому же номеру
    if (u.pathname === '/armysport' || u.pathname === '/armysport/') {
      const r0 = await fetch('https://github.com/kupdasha/army-sport.git/info/refs?service=git-upload-pack', { headers: { 'User-Agent': 'git/2.40 kup-version' } });
      const sha = ((r0.ok && (await r0.text()).match(/([0-9a-f]{40}) refs\/heads\/main\b/)) || [])[1] || 'main';
      const page = await fetch(`https://raw.githubusercontent.com/kupdasha/army-sport/${sha}/index.html`);
      if (!page.ok) return new Response('нет страницы', { status: 502, headers: CORS });
      const html = (await page.text()).replace('<head>', `<head><base href="https://cdn.jsdelivr.net/gh/kupdasha/army-sport@${sha}/">`);
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
