#!/bin/zsh
# ВЫПУСК НА САЙТ. Сайт kupdasha.ru показывает только утвержденную ветку live (ее читает воркер kup-version,
# запасные пути загрузчика тоже смотрят на live). Правки в main на сайт сами не попадают.
#
# Запускать ТОЛЬКО когда Даша сама написала «публикуй» в этом чате.
#   ./tilda/approve.sh          — показать, что уйдет на сайт (все коммиты main после live, в том числе чужие), и выпустить
#   ./tilda/approve.sh --list   — только показать, ничего не выпуская
#   ./tilda/approve.sh --back   — откатить сайт на предыдущую утвержденную версию
# Перед выпуском перескажи Даше список коммитов: если там есть чужие правки, о которых она не знает, — сначала спроси.
cd "$(dirname "$0")/.." || exit 1
git fetch -q origin main live version 2>/dev/null || { echo "нет связи с GitHub"; exit 1; }
live=$(git rev-parse origin/live) || exit 1

if [ "$1" = "--back" ]; then
  # предыдущая утвержденная версия — из истории ветки version (каждый выпуск — отдельный коммит с номером)
  prev=$(git log --format=%B origin/version | grep -o '[0-9a-f]\{40\}' | grep -v "^$live$" | head -1)
  [ -n "$prev" ] || { echo "не нашла предыдущую версию"; exit 1; }
  sha=$prev
  echo "откат: ${live:0:7} → ${sha:0:7}"
else
  sha=$(git rev-parse origin/main) || exit 1
  if [ "$sha" = "$live" ]; then echo "на сайте уже последняя версия ${sha:0:7}, выпускать нечего"; exit 0; fi
  git merge-base --is-ancestor "$live" "$sha" || { echo "ВНИМАНИЕ: live не предок main — проверь историю, выпуск остановлен"; exit 1; }
  echo "уйдет на сайт ($(git rev-list --count $live..$sha) коммит.):"
  git log --reverse --format='  %h %ad %s' --date=format:'%d.%m %H:%M' "$live..$sha"
  echo "затронуты файлы:"
  git diff --stat=120 "$live" "$sha" | tail -40 | sed 's/^/  /'
  [ "$1" = "--list" ] && exit 0
fi

# сначала файлы прогреваются на jsDelivr, потом сайт переключается на уже готовую версию
./tilda/warm.sh "$sha" | grep -v 'на сайт НЕ вышла'

ok=0; for i in 1 2 3 4 5 6; do git push -q -f origin "${sha}:refs/heads/live" 2>/dev/null && { ok=1; break; }; sleep 3; done
[ $ok = 1 ] || { echo "НЕ УДАЛОСЬ передвинуть live (нет связи с GitHub) — запусти еще раз"; exit 1; }

# служебная ветка version (файл version.txt) — третий запасной путь загрузчика и история выпусков для --back
blob=$(print -n "$sha" | git hash-object -w --stdin)
tree=$(print "100644 blob $blob\tversion.txt" | git mktree)
commit=$(git commit-tree "$tree" -p origin/version -m "версия сайта: $sha")
ok=0; for i in 1 2 3 4 5 6; do git push -q origin "${commit}:refs/heads/version" 2>/dev/null && { ok=1; break; }; sleep 3; done
[ $ok = 1 ] || echo "НЕ УДАЛОСЬ записать version.txt — запасной путь покажет прежнюю версию, запусти еще раз"

echo "версия на сайте: ${sha:0:7}"
