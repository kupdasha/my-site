#!/bin/zsh
# ПОСЛЕ КАЖДОГО git push (publish.sh делает это сам):
# 1) записывает номер свежей версии в служебную ветку version (файл version.txt).
#    Сайт на Тильде читает его с raw.githubusercontent.com — без лимита GitHub API (60 запросов в час)
#    и без кеша jsDelivr, поэтому правки видны через секунды. Ветка main при этом не меняется:
#    коммит собирается отдельно от рабочей папки и не мешает чужим незаконченным правкам.
# 2) прогревает файлы новой версии на jsDelivr: по новому номеру он первый раз собирает их секунд десять.
cd "$(dirname "$0")/.." || exit 1
git fetch -q origin main 2>/dev/null
sha=$(git rev-parse origin/main) || exit 1

blob=$(print -n "$sha" | git hash-object -w --stdin)
tree=$(print "100644 blob $blob\tversion.txt" | git mktree)
commit=$(git commit-tree "$tree" -m "версия сайта: $sha")
ok=0; for i in 1 2 3 4 5 6; do git push -q -f origin "${commit}:refs/heads/version" 2>/dev/null && { ok=1; break; }; sleep 3; done
[ $ok = 1 ] || echo "НЕ УДАЛОСЬ записать версию (нет связи с GitHub) — запусти ./tilda/warm.sh еще раз"

for f in content.js app.js style.css waves.js fun.js shimmer.js; do
  curl -s -o /dev/null --max-time 60 "https://cdn.jsdelivr.net/gh/kupdasha/my-site@$sha/$f"
done
echo "версия на сайте: ${sha:0:7}"
