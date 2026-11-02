// Адрес презентации без имени аккаунта: armysport.pages.dev/5. Страницу собирает воркер kup-version
// (последний коммит army-sport, файлы с jsDelivr), здесь только переход к нему по служебной привязке.
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname.replace(/\/$/, '') !== '/5') return Response.redirect(u.origin + '/5', 302);
    return env.KUP.fetch(new Request('https://kup-version/armysport5'));
  }
};
