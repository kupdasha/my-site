// Адрес презентации без имени аккаунта: armysport.pages.dev. Страницу собирает воркер kup-version
// (последний коммит army-sport, файлы с jsDelivr), здесь только переход к нему по служебной привязке.
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const p = u.pathname.replace(/\/$/, '');
    if (p !== '/armysport5') return Response.redirect(u.origin + '/armysport5', 302);
    return env.KUP.fetch(new Request('https://kup-version/armysport5'));
  }
};
