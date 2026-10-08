// НОМЕР СВЕЖЕЙ ВЕРСИИ САЙТА для загрузчика на Тильде (LOADER в tilda/build.py).
// Читает ветку main прямо из git на GitHub (адрес, которым пользуется сам git): без лимита GitHub API
// и без кешей raw.githubusercontent и jsDelivr. Ответ — 40 знаков номера коммита, держится 5 секунд.
const REFS = 'https://github.com/kupdasha/my-site.git/info/refs?service=git-upload-pack';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain; charset=utf-8' };

export default {
  async fetch(req, env, ctx) {
    const cache = caches.default, key = new Request('https://kup-version.cache/main');
    const hit = await cache.match(key);
    if (hit) return new Response(await hit.text(), { headers: { ...CORS, 'Cache-Control': 'no-store' } });
    const r = await fetch(REFS, { headers: { 'User-Agent': 'git/2.40 kup-version' } });
    const m = r.ok && (await r.text()).match(/([0-9a-f]{40}) refs\/heads\/main\b/);
    if (!m) return new Response('', { status: 502, headers: CORS });
    ctx.waitUntil(cache.put(key, new Response(m[1], { headers: { 'Cache-Control': 'max-age=5' } })));
    return new Response(m[1], { headers: { ...CORS, 'Cache-Control': 'no-store' } });
  },
};
