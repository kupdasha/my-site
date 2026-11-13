// запись ролика-обложки кейса Воскресенска: node исходники/vosk-cover.mjs (нужны playwright-core и кешированный Chromium)
// цикл 7,6 с: сборка знака 0–4,4 с, пауза до 6,4 с, исчезновение до 7,3 с, пусто до 7,6 с — ролик зациклен без шва
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
const OUT = process.argv[2], URL = process.argv[3], EXE = process.argv[4];
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await page.goto(URL);
await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
await page.waitForTimeout(800);
console.log('animations', await page.evaluate(() => window.build()));
const FPS = 30, T = 7.6;
for (let f = 0; f < Math.round(T * FPS); f++) {
  const t = f / FPS;
  const fade = t < 6.4 ? 1 : t < 7.3 ? 1 - (t - 6.4) / 0.9 : 0;
  await page.evaluate(([t, fade]) => window.at(t, fade), [t, fade]);
  await page.screenshot({ path: `${OUT}/f${String(f).padStart(4, '0')}.png` });
}
await browser.close();
