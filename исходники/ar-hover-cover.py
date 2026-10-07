# Обложка AR мерч для превью при наведении в «других работах»: рисуется кодом, без нейросетей.
# Черно-белая: сетка пространства в перспективе, в нем каркасная футболка в рамке-объеме,
# телефон сканирует ее — лучи от камеры к рамке, на экране та же футболка и линия сканирования.
# Запуск: python3 исходники/ar-hover-cover.py → img/armerch/hover-cover.jpg (1280 × 800, как рамка превью 16:10)
import math, random
from PIL import Image, ImageDraw

W, H = 2560, 1600             # рисуем вдвое крупнее и уменьшаем — линии гладкие
random.seed(3)
BG = (10, 10, 12)

img = Image.new('RGBA', (W, H), BG + (255,))

def layer(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))

# простая перспектива: камера в начале координат смотрит вдоль z
F, CX, CY = 1600, 1380, 560
def P(x, y, z): return (CX + F * x / z, CY - F * y / z)

def line3(dr, a, b, color, width):
    dr.line([P(*a), P(*b)], fill=color, width=width)

def dashed(dr, p, q, color, width, dash=18, gap=14):
    L = math.dist(p, q); n = int(L // (dash + gap)) + 1
    for i in range(n):
        t0, t1 = i * (dash + gap) / L, min(1, (i * (dash + gap) + dash) / L)
        if t0 >= 1: break
        dr.line([(p[0] + (q[0]-p[0])*t0, p[1] + (q[1]-p[1])*t0), (p[0] + (q[0]-p[0])*t1, p[1] + (q[1]-p[1])*t1)], fill=color, width=width)

FLOOR, WALL = -2.7, 17.0

# сетка: пол и задняя стена, вдали бледнее
g = layer(); dg = ImageDraw.Draw(g)
z = 2.2
while z <= WALL:
    a = int(150 * max(.12, 1 - (z - 2.2) / (WALL - 2.2)))
    line3(dg, (-30, FLOOR, z), (30, FLOOR, z), (255, 255, 255, a), 2)
    z += .6
for i in range(-50, 51):
    x = i * .6
    dg.line([P(x, FLOOR, 2.2), P(x, FLOOR, WALL)], fill=(255, 255, 255, 70), width=2)
    dg.line([P(x, FLOOR, WALL), P(x, 7, WALL)], fill=(255, 255, 255, 34), width=2)
y = FLOOR
while y <= 7:
    line3(dg, (-30, y, WALL), (30, y, WALL), (255, 255, 255, 34), 2)
    y += .6
img.alpha_composite(g)

# футболка: силуэт спереди, объем — изгиб по глубине; рисуется сеткой из линий
SX, SY, SZ, SC, YAW = 1.25, -.1, 7.2, 1.55, math.radians(34)
HALF = [(0, .95), (.12, .97), (.22, 1.03), (.30, 1.12), (.62, 1.14), (.84, 1.06), (1.04, .93),
        (1.46, .56), (1.24, .30), (.90, .50), (.86, .20), (.85, -.3), (.88, -1.0), (.90, -1.22), (0, -1.25)]
# правая половина от ворота по часовой: ворот дугой, плечо, рукав с четким краем, бок, подол
OUT = HALF + [(-x, y) for x, y in reversed(HALF[1:-1])]

def inside(x, y, poly=OUT):
    c = False
    for i in range(len(poly)):
        (x1, y1), (x2, y2) = poly[i], poly[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c

def depth(x, y):   # передняя сторона выпуклая, к краям и рукавам уходит назад
    return -.38 * math.sqrt(max(0, 1 - (x / 1.5) ** 2)) * (1 - .25 * max(0, y - .4))

def R(x, y, z):                                   # точка футболки в мире: масштаб и поворот вокруг вертикали
    x, y, z = x * SC, y * SC, z * SC
    return (SX + x * math.cos(YAW) + z * math.sin(YAW), SY + y, SZ - x * math.sin(YAW) + z * math.cos(YAW))

def S(x, y): return P(*R(x, y, depth(x, y)))

def mesh(dr, alpha_h, alpha_v):
    yy = -1.2                                    # горизонтальные линии каркаса
    while yy < 1.18:
        seg = []; xx = -1.5
        while xx <= 1.5:
            if inside(xx, yy): seg.append(S(xx, yy))
            else:
                if len(seg) > 1: dr.line(seg, fill=(255, 255, 255, alpha_h), width=2)
                seg = []
            xx += .02
        if len(seg) > 1: dr.line(seg, fill=(255, 255, 255, alpha_h), width=2)
        yy += .12
    xx = -1.4                                    # вертикальные
    while xx <= 1.4:
        seg = []; yy = -1.3
        while yy <= 1.2:
            if inside(xx, yy): seg.append(S(xx, yy))
            else:
                if len(seg) > 1: dr.line(seg, fill=(255, 255, 255, alpha_v), width=2)
                seg = []
            yy += .02
        if len(seg) > 1: dr.line(seg, fill=(255, 255, 255, alpha_v), width=2)
        xx += .14

t = layer(); dt = ImageDraw.Draw(t)
mesh(dt, 150, 110)
dt.line([S(x, y) for x, y in OUT + [OUT[0]]], fill=(255, 255, 255, 255), width=6, joint='curve')   # контур
for _ in range(1500):                             # облако точек по поверхности
    x, y = random.uniform(-1.5, 1.5), random.uniform(-1.3, 1.2)
    if inside(x, y):
        px, py = S(x, y); r = random.choice((2.2, 3, 4))
        dt.ellipse([px - r, py - r, px + r, py + r], fill=(255, 255, 255, random.randint(120, 255)))
img.alpha_composite(t)

# линия сканирования: светлая полоса и четкая линия поперек футболки
scan_y = .25
sc = layer(); ds = ImageDraw.Draw(sc)
a1, a2 = P(*R(-1.56, scan_y, -.42)), P(*R(1.56, scan_y, -.42))      # полоса идет по передней стороне рамки
b1, b2 = P(*R(-1.56, scan_y - .3, -.42)), P(*R(1.56, scan_y - .3, -.42))
ds.polygon([a1, a2, b2, b1], fill=(255, 255, 255, 26))
ds.line([a1, a2], fill=(255, 255, 255, 255), width=6)
img.alpha_composite(sc)

# рамка-объем вокруг футболки: пунктир, уголки сплошные
C = [R(x, y, z) for z in (-.42, .3) for y in (-1.36, 1.24) for x in (-1.56, 1.56)]
E = [(0, 1), (2, 3), (0, 2), (1, 3), (4, 5), (6, 7), (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7)]
b = layer(); db = ImageDraw.Draw(b)
for i, j in E: dashed(db, P(*C[i]), P(*C[j]), (255, 255, 255, 120), 2, 10, 10)
for i, j in E:
    for a_, c_ in ((i, j), (j, i)):
        p, q = P(*C[a_]), P(*C[c_]); L = math.dist(p, q); k = min(.22, 46 / L)
        db.line([p, (p[0] + (q[0]-p[0])*k, p[1] + (q[1]-p[1])*k)], fill=(255, 255, 255, 255), width=7)
for _ in range(420):                             # точки на полу под футболкой
    x, z = random.gauss(SX, .8), random.gauss(SZ, .55)
    px, py = P(x, FLOOR, z); r = 1.8
    db.ellipse([px - r, py - r, px + r, py + r], fill=(255, 255, 255, random.randint(60, 160)))
img.alpha_composite(b)

# телефон: впереди слева, наклонен; камера — точка у верхнего края
PW, PH = 560, 1150
ph = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
d = ImageDraw.Draw(ph)
d.rounded_rectangle([0, 0, PW - 1, PH - 1], radius=92, fill=(236, 236, 238, 255))
d.rounded_rectangle([22, 22, PW - 23, PH - 23], radius=72, fill=(16, 16, 19, 255))
sw, sh = PW - 44, PH - 44                        # на экране: та же сетка и футболка в рамке
scr = Image.new('RGBA', (sw, sh), (0, 0, 0, 0)); ds2 = ImageDraw.Draw(scr)
hy = sh * .5
for k in range(1, 14):
    yk = hy + (sh - hy) * (k / 13) ** 1.6
    ds2.line([(0, yk), (sw, yk)], fill=(255, 255, 255, 60), width=2)
for k in range(-8, 9):
    ds2.line([(sw / 2 + k * 14, hy), (sw / 2 + k * 90, sh)], fill=(255, 255, 255, 50), width=2)
cxs, cys, ss = sw / 2, sh * .46, 140
pts = [(cxs + x * ss, cys - y * ss) for x, y in OUT]
ds2.polygon(pts, fill=(16, 16, 19, 255))
for yv in [i * .2 - 1.2 for i in range(12)]:
    xs = [x for x in [i * .02 - 1.5 for i in range(151)] if inside(x, yv)]
    if xs: ds2.line([(cxs + xs[0] * ss, cys - yv * ss), (cxs + xs[-1] * ss, cys - yv * ss)], fill=(255, 255, 255, 90), width=2)
ds2.line(pts + [pts[0]], fill=(255, 255, 255, 255), width=4, joint='curve')
fx0, fy0, fx1, fy1 = cxs - 1.68 * ss, cys - 1.45 * ss, cxs + 1.68 * ss, cys + 1.5 * ss
for (x, y, dx, dy) in ((fx0, fy0, 1, 1), (fx1, fy0, -1, 1), (fx0, fy1, 1, -1), (fx1, fy1, -1, -1)):
    ds2.line([(x, y), (x + dx * 46, y)], fill=(255, 255, 255, 255), width=6)
    ds2.line([(x, y), (x, y + dy * 46)], fill=(255, 255, 255, 255), width=6)
ys = cys - .25 * ss
ds2.rectangle([fx0, ys, fx1, ys + 46], fill=(255, 255, 255, 28))
ds2.line([(fx0, ys), (fx1, ys)], fill=(255, 255, 255, 255), width=3)
ds2.ellipse([sw / 2 - 46, sh - 136, sw / 2 + 46, sh - 44], outline=(255, 255, 255, 255), width=5)
m = Image.new('L', (sw, sh), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=72, fill=255)
ph.paste(scr, (22, 22), m)
d.rounded_rectangle([PW // 2 - 70, 46, PW // 2 + 70, 82], radius=18, fill=(236, 236, 238, 255))   # вырез камеры
ang = 11
ph = ph.rotate(ang, resample=Image.BICUBIC, expand=True)
ox, oy = 270, 470
a = math.radians(ang); rx, ry = 0, 64 - PH / 2           # точка камеры после поворота
cam = (ox + ph.width / 2 + rx * math.cos(a) + ry * math.sin(a), oy + ph.height / 2 - rx * math.sin(a) + ry * math.cos(a))
r = layer(); dr = ImageDraw.Draw(r)
for i in (0, 2, 4, 6, 1):
    dashed(dr, cam, P(*C[i]), (255, 255, 255, 110), 2)
img.alpha_composite(r)
img.alpha_composite(ph, (ox, oy))

img.convert('RGB').resize((1280, 800), Image.LANCZOS).save('img/armerch/hover-cover.jpg', quality=90)
print('ok')
