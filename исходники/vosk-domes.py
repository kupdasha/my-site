# купола храма крупно: светлая ч/б фотография, золотые купола залиты желтым, как нимбы на «Троице» (просьба 14.11)
# python3 исходники/vosk-domes.py → img/voskresensk/domes.webp и domes-s.webp
import numpy as np, cv2
from PIL import Image
from scipy import ndimage
src = np.asarray(Image.open('img/voskresensk/church.webp').convert('RGB'))
x0, y0, s = 235, 72, 450                      # квадрат: купола крупно
c = src[y0:y0 + s, x0:x0 + s]
hsv = cv2.cvtColor(c, cv2.COLOR_RGB2HSV).astype(int)   # H 0..179
h, sat, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
m = (h >= 15) & (h <= 34) & (sat > 70) & (v > 90)       # золото
m = ndimage.binary_opening(m, iterations=1)
m = ndimage.binary_closing(m, iterations=3)
m = ndimage.binary_fill_holes(m)
lab, n = ndimage.label(m)
sizes = ndimage.sum(m, lab, range(1, n + 1))
m = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z > 25])
m[272 - y0:360 - y0, 310 - x0:345 - x0] = False   # золотой шарик под шатром колокольни не красим (просьба 14.11)
up = 2.5
big = cv2.resize(c, (int(s * up), int(s * up)), interpolation=cv2.INTER_LANCZOS4)
mask = cv2.resize(m.astype(np.float32), (int(s * up), int(s * up)), interpolation=cv2.INTER_LINEAR)
mask = cv2.GaussianBlur(mask, (0, 0), 1.2); mask = np.clip((mask - .5) * 3 + .5, 0, 1)[..., None]
g = cv2.cvtColor(big, cv2.COLOR_RGB2GRAY).astype(np.float32)[..., None] / 255
grey = (.64 + g * .33) * 255                     # светлая ч/б, как фон «Троицы»
yellow = np.array([245, 211, 1], np.float32)
out = grey * (1 - mask) + yellow * mask
img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8).repeat(1, 2) if out.shape[2] == 3 else np.clip(out, 0, 255).astype(np.uint8))
img.save('img/voskresensk/domes.webp', quality=82)
img.resize((900, 900), Image.LANCZOS).save('img/voskresensk/domes-s.webp', quality=80)
print(img.size, m.sum())
