# Разбор постов кейса Воскресенска на слои для живых постов в телефоне (рисует vosk.js).
# python3 исходники/vosk-posts.py — из img/voskresensk/post-N.webp делает img/voskresensk/posts/*.webp (640 px, с прозрачностью)
import cv2, numpy as np, json, subprocess, os
from scipy import ndimage as nd
SRC = 'img/voskresensk/'; OUT = SRC + 'posts/'; OW = 640
def save(name, rgb, alpha=None):
    h, w = rgb.shape[:2]; s = OW / w
    img = cv2.resize(rgb, (OW, round(h * s)), interpolation=cv2.INTER_AREA)
    if alpha is not None:
        a = cv2.resize((alpha * 255).astype(np.uint8), (OW, round(h * s)), interpolation=cv2.INTER_AREA)
        img = np.dstack([img, a])
    cv2.imwrite('/tmp/_l.png', img)
    subprocess.run(['cwebp', '-quiet', '-q', '86', '-alpha_q', '90', '/tmp/_l.png', '-o', OUT + name + '.webp'], check=True)
def grid_mask(gray, light, H, W):
    cols = light.sum(0) > .4 * H; rows = light.sum(1) > .4 * W
    g = np.zeros_like(light); g[:, cols] = True; g[rows, :] = True
    return g
dots = json.load(open(os.environ['DOTS']))
def dot_mask(n, H, W, pad=4):
    m = np.zeros((H, W), np.uint8)
    for x, y, rx, ry, c in dots[n]['d']:
        cv2.ellipse(m, (round(x), round(y)), (round(rx + pad), round(ry + pad)), 0, 0, 360, 1, -1)
    return m.astype(bool)

# ---- 1. блины: фон без стопки и тарелки и без кругов, слой кругов, тарелка, стопка
im = cv2.imread(SRC + 'post-1-orig.webp'); H, W = im.shape[:2]   # исходник поста; post-1.webp — исправленный (пятна внутри блина)
b, g, r = [im[:, :, i].astype(int) for i in range(3)]; gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(int)
yel = (r > 150) & (g > 100) & (b < 110)
lab, n = nd.label(yel); big = np.argmax(nd.sum(yel, lab, range(1, n + 1))) + 1
stack = nd.binary_fill_holes(lab == big); stack = nd.binary_dilation(stack, iterations=1)
# тарелка — черная дуга под стопкой: самый широкий темный нейтральный кусок; эллипс по ее точкам
dk = (gray < 90) & (np.abs(r - g) < 20) & (np.abs(g - b) < 20)
ld, nd_ = nd.label(dk); objs = nd.find_objects(ld)
pi = max(range(len(objs)), key=lambda i: objs[i][1].stop - objs[i][1].start) + 1
pys, pxs = np.nonzero(ld == pi)
el = cv2.fitEllipse(np.stack([pxs, pys], 1).astype(np.int32).reshape(-1, 1, 2))
plate = np.zeros((H, W), np.uint8); cv2.ellipse(plate, (tuple(map(round, el[0])), tuple(round(v + 8) for v in el[1]), el[2]), 1, -1)
plate = plate.astype(bool)   # тарелка целиком: под стопкой — белая
neutral = (np.abs(r - g) < 14) & (np.abs(g - b) < 14)
light = (gray > 170) & (gray < 248) & neutral
grid = grid_mask(gray, light, H, W) & light
near_dark = nd.binary_dilation(gray < 150, iterations=3)
circ = light & ~grid & ~near_dark & ~nd.binary_dilation(stack | plate, iterations=4)
subj = nd.binary_dilation(stack | plate, iterations=3)
cols = light.sum(0) > .4 * H; rows = light.sum(1) > .4 * W
gc = np.median(im[grid], axis=0) if grid.any() else (230, 230, 230)
bg = np.full_like(im, 255)
bg[:, cols] = gc; bg[rows, :] = gc
keep = nd.binary_dilation(gray < 140, iterations=1) & ~nd.binary_dilation(subj, iterations=6)   # текст и подписи
bg[keep] = im[keep]
save('p1-bg', bg)
ca = np.clip((255 - gray) / (255 - 200), 0, 1) * circ
save('p1-circles', im, ca)
pl = im.copy(); pl[stack] = 255
save('p1-plate', pl, plate.astype(float))
top = (r > 232) & (g > 196) & (b < 40)
lt, nt = nd.label(top); tb = np.argmax(nd.sum(top, lt, range(1, nt + 1))) + 1
tc, _ = cv2.findContours(nd.binary_fill_holes(lt == tb).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
te = cv2.fitEllipse(max(tc, key=cv2.contourArea)); tcx, tcy = te[0]; ta_, tb_ = max(te[1]) / 2, min(te[1]) / 2
surf = np.median(im[top].reshape(-1, 3), axis=0)
sp = dots['post-1']['d']
stk = im.copy(); stk[dot_mask('post-1', H, W, 3) & stack] = surf
worst = max(np.hypot((abs(x - tcx) + rx) / ta_, (abs(y - tcy) + ry) / tb_) for x, y, rx, ry, c in sp)
k = min(1, .84 / worst)
spots = [[round(tcx + (x - tcx) * k, 1), round(tcy + (y - tcy) * k, 1), rx, ry, c] for x, y, rx, ry, c in sp]
# кусочки старых пятен, торчавшие над краем верхнего блина, срезаем
inside = np.zeros((H, W), np.uint8); cv2.ellipse(inside, te, 1, -1)
yy = np.arange(H)[:, None]
stack = stack & ~(dot_mask('post-1', H, W, 4) & ~inside.astype(bool) & (yy < tcy))
# край верхнего блина там, где торчало пятно, достраиваем по эллипсу его поверхности
ins = inside.astype(bool); outer = nd.binary_dilation(ins, iterations=5)
edge_c = np.median(im[(outer & ~ins) & (lab == big)].reshape(-1, 3), axis=0) if ((outer & ~ins) & (lab == big)).any() else surf
ring = outer & ~ins & ~nd.binary_dilation(lab == big, iterations=1)
stk[ring] = edge_c
stack = stack | outer
stk[inside.astype(bool) & ~(lab == big) & ~nd.binary_dilation(lab == big, iterations=1)] = surf
save('p1-stack', stk, stack.astype(float))
# статичная картинка поста: стопка без старых пятен + пятна на новых местах
fixed = im.copy(); fixed[dot_mask('post-1', H, W, 5) & ~outer & (yy < tcy)] = 255; fixed[stack] = stk[stack]
for x, y, rx, ry, c in spots:
    col = tuple(int(c[i:i + 2], 16) for i in (5, 3, 1))
    cv2.ellipse(fixed, (round(x), round(y)), (round(rx), round(ry)), 0, 0, 360, col, -1, cv2.LINE_AA)
cv2.imwrite('/tmp/_fixed.png', fixed)
meta = {'p1': {'plate': [float(el[0][0]), float(el[0][1]), float(el[1][0]) / 2, float(el[1][1]) / 2, float(el[2])], 'spots': spots, 'cx': float(el[0][0]), 'cy': float(el[0][1]) - 60, 'stackTop': int(np.nonzero(stack.any(1))[0][0]), 'stackBot': int(np.nonzero(stack.any(1))[0][-1])}}

# ---- 2. сердце: фон без точек и без линии, сердце без линии, линия пульса
im = cv2.imread(SRC + 'post-2.webp'); H, W = im.shape[:2]
b, g, r = [im[:, :, i].astype(int) for i in range(3)]; gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(int)
red = (r > 150) & (g < 90) & (b < 90)
lab, n = nd.label(red); big = np.argmax(nd.sum(red, lab, range(1, n + 1))) + 1
heart = nd.binary_fill_holes(lab == big)
inner = nd.binary_erosion(heart, iterations=3)
line = inner & ~red
rc = np.median(im[red], axis=0)
hearted = im.copy(); hearted[nd.binary_dilation(line, iterations=2) & heart] = rc
la = np.clip((gray - 60) / (255 - 60), 0, 1) * nd.binary_dilation(line, iterations=1) * heart
bg = hearted.copy()
bg = cv2.inpaint(bg, (dot_mask('post-2', H, W) * 255).astype(np.uint8), 5, cv2.INPAINT_TELEA)
save('p2-bg', bg)
save('p2-heart', hearted, nd.binary_dilation(heart, iterations=1).astype(float))
white = np.full_like(im, 255); save('p2-line', white, la)
ys, xs = np.nonzero(heart)
meta['p2'] = {'cx': float(xs.mean()), 'cy': float(ys.mean())}

# ---- 3. снегопад: фон без снега, машина отдельно, текст поверх снега
im = cv2.imread(SRC + 'post-3.webp'); H, W = im.shape[:2]
gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(int)
bgc = np.median(im[40:120, 20:60].reshape(-1, 3), axis=0)
diff = np.abs(im.astype(int) - bgc).sum(2) > 40
sn = dot_mask('post-3', H, W)
band = np.zeros_like(diff); band[380:820, :] = True
carm = diff & band & ~sn
carm = cv2.morphologyEx(carm.astype(np.uint8), cv2.MORPH_OPEN, np.ones((9, 1), np.uint8)).astype(bool)
lab, n = nd.label(carm); sizes = nd.sum(carm, lab, range(1, n + 1)); big = np.argmax(sizes) + 1
ys, xs = np.nonzero(lab == big); x0, x1, y0, y1 = xs.min() - 20, xs.max() + 20, ys.min() - 10, ys.max() + 140
car = np.zeros_like(carm)
for i, sz in enumerate(sizes, 1):
    if sz < 400: continue
    yy, xx = np.nonzero(lab == i)
    if xx.min() >= x0 and xx.max() <= x1 and yy.min() >= y0 and yy.max() <= y1: car |= lab == i
wheels = diff & band & ~sn & (gray < 120)
lw, nw = nd.label(wheels)
for i, sz in enumerate(nd.sum(wheels, lw, range(1, nw + 1)), 1):
    yy, xx = np.nonzero(lw == i)
    if sz > 800 and xx.min() >= x0 and xx.max() <= x1 and (xx.max() - xx.min()) < 300: car |= lw == i
car = nd.binary_dilation(nd.binary_fill_holes(car), iterations=2)
bg = cv2.inpaint(im, (sn * 255).astype(np.uint8), 5, cv2.INPAINT_TELEA)
save('p3-bg', bg)
save('p3-car', im, car.astype(float))
txt = np.zeros((H, W), bool); txt[:330, :] = True; txt[H - 140:, :] = True
ta = np.clip((float(np.mean(bgc)) - gray) / (float(np.mean(bgc)) - 30), 0, 1) * txt
save('p3-text', im, ta)

# ---- 4. салют: фон без точек салюта (ядро с В и подписи остаются)
im = cv2.imread(SRC + 'post-4.webp'); H, W = im.shape[:2]
dots['post-4']['d'] = [p for p in dots['post-4']['d'] if np.hypot(p[0] - 459, p[1] - 537) > 60]   # кусочек буквы В — не точка
bg = im.copy(); bg[dot_mask('post-4', H, W, 5)] = np.median(im[30:90, 30:90].reshape(-1, 3), axis=0)
save('p4-bg', bg)
meta['p4'] = {'cx': 459.0, 'cy': 537.0}
json.dump(meta, open(OUT + 'meta.json', 'w'))
print(meta)
