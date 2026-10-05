#!/bin/zsh
# ПУБЛИКАЦИЯ: пересобрать блоки, отправить файлы на GitHub и сбросить кеш jsDelivr,
# чтобы сайт на Тильде сразу получил новую версию кода, стилей и картинок.
cd "$(dirname "$0")/.." || exit 1
python3 tilda/build.py | grep -v '^  ' 
git add -A
git commit -q -m "${1:-Обновление сайта}" || echo "нечего коммитить"
git push -q origin main || exit 1
for f in style.css app.js waves.js fun.js shimmer.js $(git diff --name-only HEAD~1 HEAD -- img 2>/dev/null); do
  curl -s -o /dev/null "https://purge.jsdelivr.net/gh/kupdasha/my-site@main/$f"
done
echo "опубликовано"
