#!/bin/zsh
# ПУБЛИКАЦИЯ: пересобрать блоки, отправить файлы на GitHub и сбросить кеш jsDelivr,
# чтобы сайт на Тильде сразу получил новую версию кода, стилей и картинок.
# Сайт берет файлы по номеру последней версии (см. LOADER в build.py), сброс кеша main нужен только как запасной путь;
# в конце файлы новой версии прогреваются на jsDelivr (tilda/warm.sh).
cd "$(dirname "$0")/.." || exit 1
python3 tilda/build.py | grep -v '^  ' 
git add -A
git commit -q -m "${1:-Обновление сайта}" || echo "нечего коммитить"
git push -q origin main || exit 1
for f in content.js style.css app.js waves.js fun.js shimmer.js world.js mark3d.js audit.js audit.css adhd.js adhd.css fleet.js fleet.css clip.js clip.css armani.js armani.css kav.js kav.css akbars.js akbars.css vkplay.js vkplay.css suit.js suit.css cartoon.js cartoon.css navi.js navi.css anon.js anon.css taplink.html $(git diff --name-only HEAD~1 HEAD -- img 2>/dev/null); do
  curl -s -o /dev/null "https://purge.jsdelivr.net/gh/kupdasha/my-site@main/$f"
done
./tilda/warm.sh
echo "опубликовано"
