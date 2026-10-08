#!/bin/zsh
# ПОСЛЕ КАЖДОГО git push (publish.sh делает это сам):
# 1) записывает номер свежей версии в служебную ветку version (файл version.txt).
#    Сайт на Тильде читает его с raw.githubusercontent.com — без лимита GitHub API (60 запросов в час)
#    и без кеша jsDelivr, поэтому правки видны через секунды. Ветка main при этом не меняется:
#    коммит собирается отдельно от рабочей папки и не мешает чужим незаконченным правкам.
# 2) прогревает файлы новой версии на jsDelivr: по новому номеру он первый раз собирает их секунд десять.
#    Сначала прогрев (код, шрифты, картинки главной), потом запись номера — сайт переключается на уже готовую версию.
cd "$(dirname "$0")/.." || exit 1
git fetch -q origin main 2>/dev/null
sha=$(git rev-parse origin/main) || exit 1

# все скрипты и стили из корня и таплинк (его блок тоже берет файл по номеру версии), в том числе живые главы кейсов (office.js, anon.css…): иначе первый посетитель
# кейса ждет, пока jsDelivr соберет их по новому номеру (~2 с на файл, скрипт и стили по очереди). Параллельно, по 8
git ls-files -- '*.js' '*.css' 'taplink.html' | grep -v / | xargs -P 8 -I{} curl -s -o /dev/null --max-time 60 "https://cdn.jsdelivr.net/gh/kupdasha/my-site@$sha/{}"

# шрифты и всё, что видно на главной без кликов: обложки карточек (thumb, image), превью-ролики, картинки «других работ».
# Адрес картинки меняется с каждой версией, и холодный файл jsDelivr отдает 1–5 с, а бывает и не отдает вовсе —
# тогда у карточки на главной нет обложки. Прогреваем их ДО того, как сайт переключится на новую версию (ниже)
{ git ls-files -- 'fonts/*.woff2'; node -e "
global.window=global; require('./content.js');
const out=new Set(); const add=v=>{ if (typeof v==='string' && v.startsWith('img/')) out.add(v) };
SITE.works.items.forEach(p=>['thumb','image','preview','listPreview','video'].forEach(k=>add(p[k])));
(SITE.photos&&SITE.photos.events&&SITE.photos.events.items||[]).forEach(e=>{add(e.thumb)});
console.log([...out].join('\\n'));" 2>/dev/null; } | sort -u | xargs -P 16 -I{} curl -s -o /dev/null --max-time 40 "https://cdn.jsdelivr.net/gh/kupdasha/my-site@$sha/{}"

blob=$(print -n "$sha" | git hash-object -w --stdin)
tree=$(print "100644 blob $blob\tversion.txt" | git mktree)
commit=$(git commit-tree "$tree" -m "версия сайта: $sha")
ok=0; for i in 1 2 3 4 5 6; do git push -q -f origin "${commit}:refs/heads/version" 2>/dev/null && { ok=1; break; }; sleep 3; done
[ $ok = 1 ] || echo "НЕ УДАЛОСЬ записать версию (нет связи с GitHub) — запусти ./tilda/warm.sh еще раз"

echo "версия на сайте: ${sha:0:7}"
