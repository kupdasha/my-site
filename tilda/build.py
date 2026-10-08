# -*- coding: utf-8 -*-
"""
СБОРКА БЛОКОВ ДЛЯ ТИЛЬДЫ
------------------------
Берет прототип (content.js, style.css, app.js и т. д.) и раскладывает его
на готовые HTML-блоки (T123 «HTML-код»), которые вставляются в Тильду.

Запуск:  python3 tilda/build.py
Результат — папка tilda/блоки:
  1 шапка/    — блоки страницы «Шапка» (назначается шапкой всего сайта)
  2 главная/  — блоки главной страницы, по порядку сверху вниз
  9 подвал/   — блоки страницы «Подвал» (назначается подвалом всего сайта)
и tilda/проверка.html — все блоки подряд, как их соберет Тильда,
чтобы открыть локально и убедиться, что всё работает.
"""
import json
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'блоки')

def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()

# адреса страниц на Тильде
LINKS = [("'index.html#", "'/full#"), ("'index.html'", "'/full'"), ("'about.html'", "'/i'"), ("'speaker.html'", "'/speaker'"), ("'nda.html'", "'/n_d_a'")]

# Код, стили, картинки и видео лежат на GitHub (kupdasha/my-site) и раздаются через jsDelivr.
# Блоки в Тильде на них только ссылаются: обновил файлы на GitHub — сайт подхватил сам.
CDN = 'https://cdn.jsdelivr.net/gh/kupdasha/my-site@main/'

# Если картинку все же загрузили на Тильду, ее адрес можно вписать в tilda/адреса файлов.txt
# строкой «имя файла = адрес» — тогда возьмется он, а не GitHub
FILES = {}
MAP = os.path.join(HERE, 'адреса файлов.txt')
if os.path.exists(MAP):
    for line in open(MAP, encoding='utf-8'):
        if '=' in line and not line.lstrip().startswith('#'):
            name, url = (x.strip() for x in line.split('=', 1))
            if url: FILES[name] = url

def tildify(text):
    for a, b in LINKS:
        text = text.replace(a, b)
    def file(m):
        name = m.group(1)
        if name in FILES: return "'" + FILES[name] + "'"
        return "'" + CDN + 'img/' + name + "'"
    return re.sub(r"'img/([^']+)'", file, text)


# ---------- тексты: content.js режется на разделы верхнего уровня ----------
content = read('content.js')
lines = content.split('\n')
# начало текстов: «const SITE = {» или «var SITE = window.SITE = {»
start = next(i for i, l in enumerate(lines) if re.match(r'(const|var|let) SITE\b.*= \{', l))
end = max(i for i, l in enumerate(lines) if l.startswith('};'))
intro = '\n'.join(lines[:start]).rstrip()          # большой комментарий «как устроены тексты»

keys = [(i, m.group(1)) for i, l in enumerate(lines[start + 1:end], start + 1)
        if (m := re.match(r'^  ([A-Za-z]\w*):', l))]

def region_start(i):
    """строка, с которой начинается раздел: вместе с комментарием над ключом"""
    j = i
    while j - 1 > start:
        prev = lines[j - 1].strip()
        if prev.endswith('*/'):
            k = j - 1
            while '/*' not in lines[k]:
                k -= 1
            j = k
        elif prev == '':
            j -= 1
        else:
            break
    while lines[j].strip() == '':
        j += 1
    return j

starts = [region_start(i) for i, _ in keys]
regions = {}
for n, (i, key) in enumerate(keys):
    stop = starts[n + 1] if n + 1 < len(keys) else end
    regions[key] = '\n'.join(lines[starts[n]:stop]).rstrip()

def data(group, note):
    body = '\n\n'.join(regions[k] for k in group)
    return (f'<script>\n/* {note}\n   Правила записи текстов — в блоке «общие тексты» на странице «Шапка». */\n'
            f'Object.assign(SITE, {{\n\n{tildify(body)}\n\n}});\n</script>')

SHARED = ['name', 'pageTitle', 'telegram', 'switchLeft', 'switchRight', 'switchHint', 'contactButton', 'nav',
          'contact', 'game', 'footer', 'secret', 'chat', 'jokes']
missing = [k for _, k in keys if k not in SHARED + ['hero', 'directions', 'works', 'nda', 'about', 'photos',
           'community', 'articles', 'clients', 'podcast', 'speaker', 'ndaPage']]
assert not missing, f'новые разделы в content.js, их надо распределить по блокам: {missing}'


# ---------- разметка: index.html режется на части ----------
index = read('index.html')
def between(a, b, src=index):
    i = src.index(a); j = src.index(b, i)
    return src[i:j].strip()

header_html = between('<!-- Шапка -->', '<main>')
sections = {sid: re.search(r'(  <!--[^\n]*-->\n)?  <section class="[^"]*" id="%s".*?\n  </section>' % sid, index, re.S).group(0).strip()
            for sid in ['hero', 'directions', 'works', 'nda', 'contact']}
# страница NDA (nda.html) — один раздел
nda_html = read('nda.html')
nda_section = between('<!-- Проекты под NDA:', '<!-- Контакт -->', nda_html)
service_html = between('<!-- Кнопка «Связаться»', '<script src=')
# у страницы NDA свое окно кейса: кнопка «назад» ведет к проектам под NDA
nda_service_html = between('<!-- Кнопка «Связаться»', '<script src=', nda_html)
# страница «Обо мне» (about.html): все ее разделы целиком; data-page="about" — по нему код узнает страницу на Тильде
about_html = read('about.html')
about_sections = between('<!-- Обо мне -->', '</main>', about_html).replace(
    '<section class="about-page" id="about">', '<section class="about-page" id="about" data-page="about">', 1)
about_service_html = between('<!-- Кнопка «Связаться»', '<script src=', about_html)


# ---------- блоки ----------
# ЗАГРУЗЧИК. Блоки берут файлы с jsDelivr не по ветке main (ее копию jsDelivr держит до 12 часов),
# а по номеру последней версии: его отдает GitHub, и jsDelivr по номеру сразу отдает свежие файлы.
# Так любая публикация (и через publish.sh, и обычный git push из другого чата) видна на сайте за минуту.
# GitHub отвечает около секунды, поэтому номер запоминается в браузере: если он узнан меньше 10 минут назад,
# страница грузится по нему сразу, а свежий номер спрашивается в фоне — для следующего открытия
# (после публикации — обновить страницу два раза); тогда же браузер заранее подтягивает новые файлы.
# По новому номеру jsDelivr первый раз собирает файлы секунд десять — поэтому publish.sh и tilda/warm.sh
# сразу после отправки сами запрашивают их, и посетители получают уже готовое. Номера нет или он старый — страница ждет ответ GitHub
# до 2,5 с, не дождалась — берет прошлый номер или main. Скрипты (тексты, код) подключаются строго по порядку,
# стили пишутся сразу и, если номер оказался новее, тихо заменяются. На проверочной странице KUP_BASE = '../'.
LOADER = ("<script>(function(){if(window.KUP)return;"
          "var R='https://cdn.jsdelivr.net/gh/kupdasha/my-site@',"
          "W='https://kup-version.kupdaria26.workers.dev/',"
          "V='https://raw.githubusercontent.com/kupdasha/my-site/version/version.txt?t=',"
          "N='kup-sha',c=null,q=[],done=0,now=Date.now();"
          "try{c=JSON.parse(localStorage.getItem(N))}catch(e){}"
          "var base=window.KUP_BASE||(c&&c.s?R+c.s+'/':R+'main/');"
          "function keep(s){try{localStorage.setItem(N,JSON.stringify({s:s,t:Date.now()}))}catch(e){}}"
          "function get(u,h,ms,cb){var x=new XMLHttpRequest();x.open('GET',u);if(h)x.setRequestHeader('Accept',h);x.timeout=ms;"
          "x.onload=function(){var s=(x.status==200&&x.responseText||'').trim();cb(/^[0-9a-f]{40}$/.test(s)?s:null)};"
          "x.onerror=x.ontimeout=function(){cb(null)};x.send()}"
          # номер свежей версии: 1) воркер kup-version (tilda/version-worker) — читает main прямо из git, мгновенно и без лимита;
          # 2) GitHub API — мгновенно, но 60 запросов в час с адреса; 3) служебная ветка version на raw.githubusercontent
          # (пишет tilda/warm.sh) — без лимита, но с задержкой до 5 минут
          "function ask(ms,cb){get(W,0,ms,function(s){s?cb(s):get('https://api.github.com/repos/kupdasha/my-site/commits/main','application/vnd.github.sha',ms,function(s){s?cb(s):get(V+now,0,ms,cb)})})}"
          "function put(f){var s=document.createElement('script');s.src=base+f;s.async=false;document.head.appendChild(s)}"
          "function go(s){if(done)return;done=1;"
          "if(s){keep(s);if(!(c&&c.s===s)){var old=base;base=K.base=R+s+'/';"
          "var o=document.getElementById('kup-css');if(o){var n=document.createElement('link');n.rel='stylesheet';n.href=o.href.replace(old,base);"
          "n.onload=function(){o.parentNode&&o.parentNode.removeChild(o);n.id='kup-css'};o.parentNode.insertBefore(n,o.nextSibling)}}}"
          "q.forEach(put);q=[]}"
          "var K=window.KUP={L:{},"
          "css:function(f){if(!document.getElementById('kup-css'))document.write('<link rel=\"stylesheet\" id=\"kup-css\" href=\"'+base+f+'\">')},"
          "js:function(fs){fs.forEach(function(f){if(K.L[f])return;K.L[f]=1;done?put(f):q.push(f)})}};"
          "K.base=base;"
          "if(window.KUP_BASE)go();"
          # номер, узнанный меньше 30 секунд назад, берется сразу (переходы по страницам без задержки), свежесть проверяется в фоне
          "else if(c&&c.s&&now-c.t<3e4){go();ask(8000,function(s){if(s)keep(s)})}"
          "else ask(2500,go)"
          "})()</script>")

def css_block():
    fonts = re.search(r'<link href="https://fonts.googleapis.com[^>]+>', index).group(0)
    return ('<!-- ОФОРМЛЕНИЕ САЙТА: шрифты, стили и загрузчик файлов с GitHub. Это код, тексты здесь не правятся. -->\n'
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>\n'
            f'{fonts}\n'
            '<!-- версия (серьезная или дружеская) выставляется сразу, чтобы страница не мигала -->\n'
            "<script>try{document.documentElement.dataset.theme=localStorage.getItem('kd-mode')||'light'}catch(e){}</script>\n"
            f"{LOADER}\n"
            "<script>KUP.css('style.css')</script>")

def shared_block():
    # тексты и проекты (content.js) тоже приходят с GitHub — блок в Тильде не меняется, когда меняются тексты
    return (f'{header_html}\n\n'
            '<!-- ТЕКСТЫ И ПРОЕКТЫ сайта лежат на GitHub в content.js и подключаются отсюда. -->\n'
            "<script>KUP.js(['content.js'])</script>")

def page_block(sid, group, note):
    # в блоке страницы — только разметка раздела; тексты берутся из content.js с GitHub
    return sections[sid]

def js_block(names, note):
    # файлы кода подключаются загрузчиком (см. LOADER) по порядку, после текстов.
    # Если блок случайно вставлен на страницу дважды, каждый файл все равно подключится один раз
    files = ','.join(f"'{n}'" for n in names)
    return (f'<!-- {note} Это код, тексты здесь не правятся: сам код лежит на GitHub. -->\n'
            f"<script>KUP.js([{files}])</script>")

def once_block(html, note):
    # разметка выводится один раз: если такой блок на странице уже есть (окно кейса #case), копия ничего не добавляет
    js = json.dumps(html, ensure_ascii=False).replace('</', '<\\/')
    return (f'<!-- {note} -->\n'
            f"<script>(function(){{if(document.getElementById('case'))return;document.write({js})}})()</script>")

# Настройки таплинка, которые Даша может менять прямо в блоке Тильды, без GitHub (просьба 08.10).
# Блок их применяет поверх taplink.html: тексты и ссылки из блока главнее, оформление и анимация — с GitHub.
TAPLINK_SETTINGS = """<script>
/* ===================== НАСТРОЙКИ ТАПЛИНКА =====================
   Здесь можно самой поменять имя, описание, кнопки и ссылки.
   Как править:
   - меняйте только то, что внутри кавычек '...';
   - кавычки, запятые и квадратные скобки не трогайте;
   - если внутри текста нужен апостроф, поставьте перед ним \\ (например: 'It\\'s');
   - убрать кнопку — удалите ее строку целиком; добавить — скопируйте строку и поменяйте;
   - после правки нажмите «Сохранить» в блоке и «Опубликовать» страницу.
   Оформление, цвета и анимация приходят с GitHub, здесь их нет.
   ============================================================== */
window.TAPLINK = {

  // имя крупно наверху
  name: 'Даша Купцова',

  // описание под именем; слова «Одна кавычка» сами станут ссылкой на подкаст
  about: 'Делаю дизайн для брендов, спикерствую и организовываю мероприятия. Ex-лид дизайн-команды VK, в портфолио LEGO, Armani/Casa, МТС. Веду видеоподкаст «Одна кавычка»',
  podcast: 'https://onekavychka.mave.digital/',

  // главные кнопки сверху вниз:
  //  [ 'надпись в серьезной версии',   'надпись в веселой',  'куда ведет' ],
  buttons: [
    [ 'заказать дизайн-проект',         'что умею?',          'https://kupdasha.ru/full' ],
    [ 'позвать выступать',              'позвать',            'https://kupdasha.ru/profile' ],
    [ 'ИИ-воркшоп для вашей команды',   'ИИшнуться',          'https://kupdasha.ru/ai' ],
  ],

  // соцсети слева направо, сверху вниз (по три в ряд):
  //  [ 'надпись',     'ссылка' ],
  // цвет кнопки берется по адресу ссылки (linkedin, vk.com, max.ru, t.me, tiktok, youtube, instagram, unsplash, behance)
  socials: [
    [ 'LinkedIn',    'https://www.linkedin.com/in/kup-daria/' ],
    [ 'VK',          'https://vk.com/odnakavychka' ],
    [ 'MAX',         'https://max.ru/u/f9LHodD0cOJU0rsI79k2icd0oYLCiFJlULG1l3wRQRuGZlC1gIwtl1G3eF4' ],
    [ 'Telegram',    'https://t.me/kupdasha' ],
    [ 'TikTok',      'https://www.tiktok.com/@odnakav' ],
    [ 'YouTube',     'https://www.youtube.com/@kupyasha26' ],
    [ 'Instagram*',  'https://www.instagram.com/kupyasha/' ],
    [ 'Unsplash',    'https://unsplash.com/@kupdasha' ],
    [ 'Behance',     'https://www.behance.net/kupdaria' ],
  ],
};
</script>"""

def taplink_block():
    # таплинк — отдельная страница Тильды из одного блока. Сверху — настройки (тексты и ссылки), их можно
    # править прямо в Тильде; ниже — загрузчик: оформление, анимация и код лежат на GitHub в taplink.html.
    # Под медленную связь: номер свежей версии спрашиваем у воркера kup-version (40 байт); если в телефоне
    # уже лежит копия этой версии — показываем сразу, без загрузки. Иначе берем taplink.html по номеру
    # с jsDelivr (быстрый CDN, файл ~12 КБ), запасной путь — прямо с GitHub. Соединения со шрифтами и CDN
    # открываются заранее, пока ждем ответ.
    return ('<!-- ТАПЛИНК. Сверху — настройки: тексты и ссылки можно менять прямо здесь. Ниже — загрузчик, его не трогать. -->\n'
            + TAPLINK_SETTINGS + '\n\n'
            '<!-- ЗАГРУЗЧИК: дальше ничего не менять. Оформление и анимация лежат на GitHub в taplink.html. -->\n'
            '<div id="taplink-root" style="min-height:100vh;background:#FFFFFF"></div>\n'
            "<script>(function(){var R='https://cdn.jsdelivr.net/gh/kupdasha/my-site@',W='https://kup-version.kupdaria26.workers.dev/',\n"
            "G='https://raw.githubusercontent.com/kupdasha/my-site/main/taplink.html',K='tl-page',root=document.getElementById('taplink-root'),c=null,shown=0;\n"
            "['https://cdn.jsdelivr.net','https://fonts.googleapis.com','https://fonts.gstatic.com'].forEach(function(h){var l=document.createElement('link');l.rel='preconnect';l.href=h;l.crossOrigin='';document.head.appendChild(l)});\n"
            "try{if(localStorage.getItem('tl-mode')==='fun')root.style.background='#0E0F12'}catch(e){}\n"
            "try{c=JSON.parse(localStorage.getItem(K))}catch(e){}\n"
            "function get(u,ms,cb){var x=new XMLHttpRequest();x.open('GET',u);x.timeout=ms;x.onload=function(){cb(x.status==200?x.responseText:null)};x.onerror=x.ontimeout=function(){cb(null)};x.send()}\n"
            "function save(s,h){try{localStorage.setItem(K,JSON.stringify({s:s,h:h}))}catch(e){}}\n"
            # настройки из блока: тексты и ссылки поверх того, что пришло с GitHub
            "function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')}\n"
            "function nb(t){return t.replace(/(^|[\\s(«])([А-Яа-яЁёA-Za-z]{1,2})\\s/g,'$1$2\\u00a0').replace(/\\s—/g,'\\u00a0—')}\n"
            "function apply(r){var T=window.TAPLINK;if(!T)return;try{\n"
            "var h=r.querySelector('h1');if(h&&T.name)h.textContent=T.name;\n"
            "var b=r.querySelector('.bio'),w='«Одна кавычка»';if(b&&T.about){var t=esc(nb(T.about));b.innerHTML=T.podcast&&t.indexOf(w)>=0?t.replace(w,'<a href=\"'+esc(T.podcast)+'\" target=\"_blank\" rel=\"noopener\">«Одна\\u00a0кавычка»</a>'):t}\n"
            "function list(sel,items,fill){var box=r.querySelector(sel);if(!box||!items||!items.length)return;var tpl=box.children[0];if(!tpl)return;tpl=tpl.cloneNode(true);box.innerHTML='';\n"
            "items.forEach(function(it){var a=tpl.cloneNode(true);fill(a,it);box.appendChild(a)})}\n"
            "list('.actions',T.buttons,function(a,it){a.dataset.serious=it[0];a.dataset.fun=it[1]||it[0];a.href=it[2];var s=a.querySelector('.t');if(s)s.textContent=it[0]});\n"
            "list('.soc',T.socials,function(a,it){a.textContent=it[0];a.href=it[1]})\n"
            "}catch(e){}}\n"
            "function show(h){if(shown||!h)return;shown=1;var doc=new DOMParser().parseFromString(h,'text/html');\n"
            "[].slice.call(doc.querySelectorAll('head link, head style, body > link, body > style')).forEach(function(n){document.head.appendChild(n)});\n"
            "[].slice.call(doc.body.childNodes).forEach(function(n){root.appendChild(n)});\n"
            "apply(root);\n"
            # вставленные так скрипты сами не запускаются — пересоздаем их
            "[].slice.call(root.querySelectorAll('script')).forEach(function(s){var x=document.createElement('script');x.textContent=s.textContent;s.parentNode.replaceChild(x,s)});\n"
            "root.style.minHeight='';root.style.background=''}\n"
            # номер свежей версии спрашиваем сразу у трех источников, берем первый ответ: воркер kup-version
            # (в России *.workers.dev бывает закрыт), служебная ветка version на GitHub и GitHub API
            "var V=['https://raw.githubusercontent.com/kupdasha/my-site/version/version.txt?t='+Date.now(),'https://api.github.com/repos/kupdasha/my-site/commits/main'],got=0,left=3;\n"
            "function sha(t){t=(t||'').trim();return /^[0-9a-f]{40}$/.test(t)?t:''}\n"
            "function ask(u,h){var x=new XMLHttpRequest();x.open('GET',u);if(h)x.setRequestHeader('Accept',h);x.timeout=3500;\n"
            "x.onload=function(){done(x.status==200?sha(x.responseText):'')};x.onerror=x.ontimeout=function(){done('')};x.send()}\n"
            # страница: по номеру с jsDelivr, иначе последняя копия jsDelivr, иначе прямо с GitHub, иначе копия из телефона
            "function page(s){var u=[];if(s)u.push(R+s+'/taplink.html');u.push(R+'main/taplink.html?v='+Math.floor(Date.now()/36e5),G+'?t='+Date.now());\n"
            "(function next(){var x=u.shift();if(!x)return show(c&&c.h);get(x,20000,function(h){if(h&&h.indexOf('id=\"tl\"')>0){save(s,h);show(h)}else next()})})()}\n"
            "function done(s){left--;if(got)return;if(s){got=1;if(c&&c.s===s&&c.h)show(c.h);else page(s)}else if(!left){got=1;page('')}}\n"
            "ask(W);ask(V[0]);ask(V[1],'application/vnd.github.sha');\n"
            # медленная связь: если за 1,5 с номер не пришел, а копия в телефоне есть — показываем ее, не дожидаясь
            "setTimeout(function(){if(!got&&c&&c.h)show(c.h)},1500)})()</script>")

BLOCKS = {
    '1 шапка': [
        ('1 оформление', css_block()),
        ('2 шапка и общие тексты', shared_block()),
    ],
    '2 главная': [
        ('1 первый экран', page_block('hero', ['hero'], 'Первый экран: заголовок, текст и кнопки.')),
        ('2 направления', page_block('directions', ['directions'], 'Направления — строки со струнами (видны в дружеской версии).')),
        ('3 проекты', page_block('works', ['works'], 'Проекты: фильтры, карточки и тексты кейсов.')),
        ('4 проекты под NDA', page_block('nda', ['nda'], 'Проекты под NDA.')),
        ('5 контакт', page_block('contact', [], '')),
    ],
    # страница NDA — один самодостаточный блок: оформление, шапка с текстами, раздел, служебные кнопки и код,
    # чтобы не зависеть от общих шапки и подвала Тильды
    '4 страница NDA': [
        ('1 страница NDA целиком', '\n\n'.join([
            css_block(), shared_block(), nda_section,
            f'<!-- Кнопки «связаться» и «наверх», окно кейса, сообщения -->\n{nda_service_html}',
            js_block(['app.js', 'waves.js', 'fun.js', 'shimmer.js'], 'КОД САЙТА.')])),
    ],
    # таплинк — своя страница Тильды без общей шапки и подвала
    '5 таплинк': [
        ('1 таплинк целиком', taplink_block()),
    ],
    # страница «Обо мне» — тоже один самодостаточный блок (адрес страницы на Тильде: /i)
    '6 страница Обо мне': [
        ('1 страница Обо мне целиком', '\n\n'.join([
            css_block(), shared_block(), about_sections,
            f'<!-- Кнопки «связаться» и «наверх», сообщения -->\n{about_service_html}',
            js_block(['app.js', 'waves.js', 'fun.js'], 'КОД САЙТА.')])),
    ],
    '9 подвал': [
        ('1 служебные кнопки и окно кейса', once_block(service_html, 'Кнопки «связаться» и «наверх», окно кейса и сообщения. Тексты для них — в общих текстах.')),
        ('2 код сайта', js_block(['app.js', 'waves.js', 'fun.js', 'shimmer.js'], 'КОД САЙТА: движок, переливы и дружеская версия.')),
    ],
}

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
order = []
for folder, blocks in BLOCKS.items():
    os.makedirs(os.path.join(OUT, folder))
    for name, html in blocks:
        with open(os.path.join(OUT, folder, name + '.txt'), 'w', encoding='utf-8') as f:
            f.write(html + '\n')
        order.append((folder, name, html))
        kb = len(html.encode('utf-8')) / 1024
        print(f'{folder}/{name}.txt  {kb:.0f} КБ')

# проверочная страница: блоки в том порядке, в каком их выведет Тильда (шапка, страница, подвал)
with open(os.path.join(HERE, 'проверка.html'), 'w', encoding='utf-8') as f:
    f.write('<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Проверка блоков для Тильды</title>\n'
            "<script>window.KUP_BASE='../'</script>\n"
            '</head>\n<body>\n<div id="allrecords" class="t-records">\n')
    for folder, name, html in order:
        f.write(f'<div class="r t-rec" data-record-type="131"><!-- {folder} / {name} -->\n{html.replace(CDN, "../")}\n</div>\n')
    f.write('</div>\n</body>\n</html>\n')
print('готово: tilda/блоки и tilda/проверка.html')
