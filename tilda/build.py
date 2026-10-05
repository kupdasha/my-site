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
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'блоки')

def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()

# адреса страниц на Тильде
LINKS = [("'index.html#", "'/#"), ("'index.html'", "'/'"), ("'about.html'", "'/about'"), ("'speaker.html'", "'/speaker'")]

# свои картинки и видео из папки img: на Тильде у них другие адреса.
# Адреса записываются в tilda/адреса файлов.txt строками «имя файла = адрес»
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
        print(f'  нет адреса на Тильде для img/{name} — впишите его в «адреса файлов.txt»')
        return m.group(0)
    return re.sub(r"'img/([^']+)'", file, text)


# ---------- тексты: content.js режется на разделы верхнего уровня ----------
content = read('content.js')
lines = content.split('\n')
start = next(i for i, l in enumerate(lines) if l.startswith('const SITE = {'))
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
           'community', 'articles', 'clients', 'podcast', 'speaker']]
assert not missing, f'новые разделы в content.js, их надо распределить по блокам: {missing}'


# ---------- разметка: index.html режется на части ----------
index = read('index.html')
def between(a, b, src=index):
    i = src.index(a); j = src.index(b, i)
    return src[i:j].strip()

header_html = between('<!-- Шапка -->', '<main>')
sections = {sid: re.search(r'(  <!--[^\n]*-->\n)?  <section class="[^"]*" id="%s".*?\n  </section>' % sid, index, re.S).group(0).strip()
            for sid in ['hero', 'directions', 'works', 'nda', 'contact']}
service_html = between('<!-- Кнопка «Связаться»', '<script src=')


# ---------- блоки ----------
def css_block():
    fonts = re.search(r'<link href="https://fonts.googleapis.com[^>]+>', index).group(0)
    return ('<!-- ОФОРМЛЕНИЕ САЙТА: шрифты и стили. Это код, тексты здесь не правятся. -->\n'
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            f'{fonts}\n'
            '<!-- версия (серьезная или дружеская) выставляется сразу, чтобы страница не мигала -->\n'
            "<script>try{document.documentElement.dataset.theme=localStorage.getItem('kd-mode')||'light'}catch(e){}</script>\n"
            f'<style>\n{read("style.css")}\n</style>')

def shared_block():
    body = '\n\n'.join(regions[k] for k in SHARED)
    return (f'{header_html}\n\n<script>\n{intro}\n\n'
            '/* Общие тексты: они видны на всех страницах сайта */\n'
            'var SITE = window.SITE = window.SITE || {};\n'
            "SITE.homePage = '/';   // адрес главной страницы\n"
            f'Object.assign(SITE, {{\n\n{tildify(body)}\n\n}});\n</script>')

def page_block(sid, group, note):
    return f'{sections[sid]}\n\n' + (data(group, note) if group else '')

def js_block(names, note, extra=''):
    code = '\n\n'.join(read(n) for n in names)
    return f'<!-- {note} Это код, тексты здесь не правятся. -->\n{extra}<script>\n{code}\n</script>'

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
    '9 подвал': [
        ('1 служебные кнопки и окно кейса', f'<!-- Кнопки «связаться» и «наверх», окно кейса и сообщения. Тексты для них — в общих текстах. -->\n{service_html}'),
        ('2 движок сайта', js_block(['app.js'], 'ДВИЖОК: показ текстов, переключатель, кейсы, игра.')),
        ('3 переливы', js_block(['waves.js', 'shimmer.js'], 'ПЕРЕЛИВЫ: волны на обложках и точки на первом экране.')),
        ('4 дружеская версия', js_block(['fun.js'], 'ДРУЖЕСКАЯ ВЕРСИЯ: бегающие кнопки, многоножка, НЛО и прочее.')),
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
            '</head>\n<body>\n<div id="allrecords" class="t-records">\n')
    for folder, name, html in order:
        f.write(f'<div class="r t-rec" data-record-type="131"><!-- {folder} / {name} -->\n{html}\n</div>\n')
    f.write('</div>\n</body>\n</html>\n')
print('готово: tilda/блоки и tilda/проверка.html')
