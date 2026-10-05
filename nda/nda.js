/* ================================================================
   РАЗДЕЛ NDA: ТЕКСТЫ И ПАРОЛЬ
   ----------------------------------------------------------------
   Тексты страниц NDA правятся здесь. Пустые строки '' не показываются.

   Пароль — Secret. Он хранится не открытым текстом, а «отпечатком»
   (строка PASS ниже). Это защита от случайных глаз, а не сейф:
   на Тильде лучше дополнительно включить настоящий пароль страницы
   (Настройки страницы → Ещё → «Пароль на страницу»).
   Сменить пароль: открыть любую страницу NDA, в консоли браузера
   набрать ndaHash('новый пароль') и вставить ответ в PASS.
   ================================================================ */
var NDA = window.NDA = {
  PASS: '1tj63yfiriw',

  gate: {
    title:  'проекты под NDA',
    text:   'Раздел закрыт: здесь работы, которые нельзя показывать публично. Введите пароль, который я прислала',
    field:  'пароль',
    button: 'открыть',
    wrong:  'Пароль не подошел. Проверьте раскладку и большую букву',
    back:   'на главную',
  },

  list: {
    title: 'проекты под NDA',
    text:  'Эти работы показываю только по ссылке. Пожалуйста, не пересылайте их дальше',
  },

  /* Открытые проекты внутри раздела. Остальные карточки берутся из content.js (SITE.nda.items)
     и показываются закрытыми */
  projects: [
    {
      title: 'Новый век',
      tag:   'сайт банка',
      short: 'Анимационный прототип сайта банка для бизнеса и частных лиц',
      link:  'novyi-vek/',
      cover: 'novyi-vek/img/hero-coin.webp',
      bg:    '#CED7DF',
    },
  ],
  closed: 'покажу на встрече',

  /* ---------- Страница «Новый век» ---------- */
  novyiVek: {
    title: 'Новый век',
    tags:  ['сайт банка', 'прототип', 'анимация'],
    /* Короткое описание под заголовком */
    lead:  'Сайт банка «Новый век» для бизнеса и частных лиц: главная с серебряными монетами, раздел услуг, курсы валют, калькулятор кредита и новости.',
    /* Факты слева направо. ВПИШИ — пустые не показываются */
    facts: [
      { name: 'клиент',  value: 'банк «Новый век»' },
      { name: 'год',     value: '' },          /* ВПИШИ */
      { name: 'роль',    value: '' },          /* ВПИШИ: например, арт-директор */
      { name: 'команда', value: '' },          /* ВПИШИ */
    ],
    /* Абзацы о задаче и решении. ВПИШИ — пока пусто, блок скрыт */
    story: [
      // 'Задача: …',
      // 'Решение: …',
    ],
    protoTitle: 'живой прототип',
    protoText:  'Сайт можно листать и нажимать: монеты в колонне переворачиваются при прокрутке, меню услуг открывается при наведении, калькулятор считает платеж',
    tabs: [
      { label: 'главная',     go: 'main' },
      { label: 'услуги',      go: 'services' },
      { label: 'калькулятор', go: 'credit' },
      { label: 'новости',     go: 'news' },
    ],
    full: 'открыть на весь экран',
    mockTitle: 'макеты',
    /* Исходные макеты из PDF: картинка и подпись */
    mocks: [
      { src: 'maket/main.jpg',     caption: 'главная', tall: true },
      { src: 'maket/ved.jpg',      caption: 'блок услуг' },
      { src: 'maket/ved-menu.jpg', caption: 'меню услуг при наведении' },
      { src: 'maket/credit.jpg',   caption: 'калькулятор кредита' },
      { src: 'maket/news.jpg',     caption: 'новости' },
    ],
    back: 'все проекты под NDA',
  },
};

/* ================= ЗАМОК (код, править не нужно) ================= */
function ndaHash(s){var a=0xdeadbeef,b=0x41c6ce57;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);return (4294967296*(2097151&b)+(a>>>0)).toString(36)}

function ndaGate(onOpen){
  var KEY='nda-pass', ok=false;
  try{ ok = sessionStorage.getItem(KEY)===NDA.PASS || localStorage.getItem(KEY)===NDA.PASS; }catch(e){}
  if(ok){ document.documentElement.classList.add('nda-open'); onOpen(); return; }
  var g=NDA.gate, home=document.documentElement.dataset.home||'../';
  var box=document.createElement('section'); box.className='gate';
  box.innerHTML='<a class="back" href="'+home+'">← '+g.back+'</a>'+
    '<h1>'+g.title+'</h1><p>'+g.text+'</p>'+
    '<form><input type="password" autocomplete="current-password" placeholder="'+g.field+'" aria-label="'+g.field+'"><button class="btn">'+g.button+'</button></form>'+
    '<p class="wrong" hidden>'+g.wrong+'</p>';
  document.body.appendChild(box);
  var input=box.querySelector('input'); input.focus();
  box.querySelector('form').addEventListener('submit',function(e){
    e.preventDefault();
    if(ndaHash(input.value.trim())===NDA.PASS){
      try{ sessionStorage.setItem(KEY,NDA.PASS); localStorage.setItem(KEY,NDA.PASS); }catch(err){}
      box.classList.add('leave');
      setTimeout(function(){ box.remove(); },500);
      document.documentElement.classList.add('nda-open'); onOpen();
    } else {
      box.querySelector('.wrong').hidden=false; input.select();
    }
  });
}
