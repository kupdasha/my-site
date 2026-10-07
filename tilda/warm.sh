#!/bin/zsh
# ПРОГРЕВ: сайт на Тильде берет файлы с jsDelivr по номеру последней версии на GitHub.
# По новому номеру jsDelivr первый раз собирает файлы секунд десять — запрашиваем их сами,
# чтобы посетители сразу получали готовое. Запускать после каждого git push (publish.sh делает это сам).
cd "$(dirname "$0")/.." || exit 1
git fetch -q origin main 2>/dev/null
sha=$(git rev-parse origin/main) || exit 1
for f in content.js app.js style.css waves.js fun.js shimmer.js; do
  curl -s -o /dev/null --max-time 60 "https://cdn.jsdelivr.net/gh/kupdasha/my-site@$sha/$f"
done
echo "прогрето: ${sha:0:7}"
