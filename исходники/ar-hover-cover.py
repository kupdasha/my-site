# Обложка AR мерч для превью при наведении в «других работах»: рисуется кодом, без нейросетей.
# Телефон смотрит на черную сумку, из экрана вылетают AR-объекты: кубы, диско-шар, шары, ленты.
# Запуск: python3 исходники/ar-hover-cover.py → img/armerch/hover-cover.jpg (1280 × 800, как рамка превью 16:10)
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 1600                      # рисуем вдвое крупнее и уменьшаем — края гладкие
random.seed(7)

def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def vgrad(w, h, top, bottom):
    t = np.linspace(0, 1, h)[:, None, None]
    a, b = np.array(rgb(top)), np.array(rgb(bottom))
    arr = (a * (1 - t) + b * t).repeat(w, axis=1)
    return Image.fromarray(arr.astype('uint8'), 'RGB')

def soft(img, box, color, alpha, blur):
    """мягкое пятно: цвет сплошной, размывается только прозрачность — без серых ореолов"""
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).ellipse(box, fill=alpha)
    lay = Image.new('RGBA', img.size, color + (0,))
    lay.putalpha(m.filter(ImageFilter.GaussianBlur(blur)))
    img.alpha_composite(lay)

def blob(img, xy, r, color, alpha, blur):
    soft(img, [xy[0]-r, xy[1]-r, xy[0]+r, xy[1]+r], rgb(color), alpha, blur)

def shadow(img, box, alpha, blur):
    soft(img, box, (30, 28, 50), alpha, blur)

def sphere(img, c, r, base, light='#FFFFFF', dark=None):
    """шар с мягким светом сверху слева"""
    x0, y0 = c[0]-r, c[1]-r
    yy, xx = np.mgrid[0:2*r, 0:2*r].astype(float)
    dx, dy = (xx - r) / r, (yy - r) / r
    d = np.sqrt(dx**2 + dy**2)
    mask = np.clip((1 - d) * r / 1.5, 0, 1)                        # сглаженный край
    hl = np.clip(1 - np.sqrt((dx + .38)**2 + (dy + .42)**2) / .9, 0, 1) ** 1.6   # блик
    sh = np.clip((dx * .5 + dy * .7 + .2), 0, 1) ** 1.2              # тень снизу справа
    b, l = np.array(rgb(base), float), np.array(rgb(light), float)
    k = np.array(rgb(dark), float) if dark else b * .55
    col = b * (1 - sh[..., None] * .8) + k * sh[..., None] * .8
    col = col * (1 - hl[..., None] * .75) + l * hl[..., None] * .75
    arr = np.dstack([np.clip(col, 0, 255), mask * 255]).astype('uint8')
    img.alpha_composite(Image.fromarray(arr, 'RGBA'), (x0, y0))

def disco(img, c, r):
    """диско-шар: серебряный шар в зеркальной плитке"""
    sphere(img, c, r, '#B9BCC8', '#FFFFFF', '#5E6272')
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(lay)
    n = 16
    for i in range(n):                         # широта
        la0, la1 = -math.pi/2 + math.pi*i/n, -math.pi/2 + math.pi*(i+1)/n
        m = max(4, int(2 * n * math.cos((la0 + la1) / 2)))
        for j in range(m):                     # долгота, видна передняя половина
            lo0, lo1 = -math.pi/2 + math.pi*j/m, -math.pi/2 + math.pi*(j+1)/m
            pts = []
            for la, lo in ((la0, lo0), (la0, lo1), (la1, lo1), (la1, lo0)):
                pts.append((c[0] + r*.97*math.cos(la)*math.sin(lo), c[1] + r*.97*math.sin(la)))
            v = random.random()
            if v > .86: fill = (255, 255, 255, 210)
            elif v > .7: fill = (200, 210, 255, 120)
            elif v < .15: fill = (60, 64, 80, 90)
            else: fill = (255, 255, 255, 0)
            dr.polygon(pts, fill=fill, outline=(120, 124, 140, 45))
    img.alpha_composite(lay)

def cube(img, c, a, ang, top, left, right):
    """куб в изометрии, повернут на ang"""
    def p(x, y):
        ca, sa = math.cos(ang), math.sin(ang)
        return (c[0] + x*ca - y*sa, c[1] + x*sa + y*ca)
    h = a * .5
    T = [p(0, -a), p(a*.87, -h), p(0, 0), p(-a*.87, -h)]
    L = [p(-a*.87, -h), p(0, 0), p(0, a), p(-a*.87, h)]
    R = [p(0, 0), p(a*.87, -h), p(a*.87, h), p(0, a)]
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(lay)
    dr.polygon(L, fill=rgb(left)); dr.polygon(R, fill=rgb(right)); dr.polygon(T, fill=rgb(top))
    dr.line(T + [T[0]], fill=(255, 255, 255, 90), width=3)
    img.alpha_composite(lay)

def ribbon(img, pts, w, c1, c2):
    """лента: кривая Безье, цвет плавно меняется по длине, светлая кромка"""
    def bez(t):
        n = len(pts) - 1
        x = sum(math.comb(n, i) * (1-t)**(n-i) * t**i * pts[i][0] for i in range(n+1))
        y = sum(math.comb(n, i) * (1-t)**(n-i) * t**i * pts[i][1] for i in range(n+1))
        return x, y
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(lay)
    a, b = np.array(rgb(c1)), np.array(rgb(c2))
    N = 220
    for i in range(N):
        t = i / N
        x, y = bez(t)
        twist = .55 + .45 * math.cos(t * math.pi * 3)     # лента поворачивается — то шире, то уже
        col = tuple(int(v) for v in a * (1-t) + b * t)
        rr = w * twist / 2
        dr.ellipse([x-rr, y-rr, x+rr, y+rr], fill=col + (255,))
    img.alpha_composite(lay)
    hl = Image.new('RGBA', img.size, (0, 0, 0, 0))
    dh = ImageDraw.Draw(hl)
    for i in range(N):
        t = i / N
        x, y = bez(t)
        twist = .55 + .45 * math.cos(t * math.pi * 3)
        rr = w * twist / 7
        dh.ellipse([x-rr-w*.12, y-rr-w*.12, x+rr-w*.12, y+rr-w*.12], fill=(255, 255, 255, 70))
    a = hl.getchannel('A').filter(ImageFilter.GaussianBlur(4))
    hl = Image.new('RGBA', img.size, (255, 255, 255, 0)); hl.putalpha(a)
    img.alpha_composite(hl)

# фон: светлый, с мягкими пятнами цветов сайта
W = 2560
bg = vgrad(W, S, '#F3F0FB', '#FBFAF7').convert('RGBA')
blob(bg, (560, 420), 520, '#D9CCFA', 170, 200)
blob(bg, (2000, 560), 480, '#CDEBDD', 170, 200)
blob(bg, (1500, 1420), 560, '#D3DDFE', 140, 220)
img = Image.new('RGBA', (S, S), (0, 0, 0, 0))   # сцена: телефон и AR, потом встает по центру широкого фона

# телефон: рисуем отдельно и наклоняем
PW, PH = 500, 980
ph = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
d = ImageDraw.Draw(ph)
d.rounded_rectangle([0, 0, PW-1, PH-1], radius=84, fill=rgb('#16181C'))
SX, SY, SW, SH = 22, 22, PW-44, PH-44
screen = vgrad(SW, SH, '#E9E7EE', '#D8D5DF').convert('RGBA')
sd = ImageDraw.Draw(screen)
# стол и сумка на экране телефона — как снято камерой
sd.rectangle([0, int(SH*.62), SW, SH], fill=rgb('#CFCBD6'))
bx0, by0, bx1, by1 = int(SW*.17), int(SH*.40), int(SW*.83), int(SH*.86)
sd.arc([int(SW*.30), int(SH*.26), int(SW*.70), int(SH*.52)], 180, 360, fill=rgb('#0F1013'), width=22)
sd.polygon([(bx0, by0), (bx1, by0), (bx1+14, by1), (bx0-14, by1)], fill=rgb('#1B1D22'))
sd.polygon([(bx0, by0), (bx1, by0), (bx1, by0+18), (bx0, by0+18)], fill=rgb('#26292F'))
# рамка распознавания метки (без текста)
fx0, fy0, fx1, fy1 = int(SW*.34), int(SH*.52), int(SW*.66), int(SH*.70)
for (x, y, dx, dy) in ((fx0, fy0, 1, 1), (fx1, fy0, -1, 1), (fx0, fy1, 1, -1), (fx1, fy1, -1, -1)):
    sd.line([(x, y), (x + dx*44, y)], fill=(255, 255, 255, 230), width=8)
    sd.line([(x, y), (x, y + dy*44)], fill=(255, 255, 255, 230), width=8)
sd.rounded_rectangle([fx0+30, fy0+28, fx1-30, fy1-28], radius=18, fill=rgb('#5B6CF6'))
sd.ellipse([fx0+66, fy0+52, fx1-66, fy1-52], fill=rgb('#C9B6F5'))
# кнопка камеры
cx, cy = SW//2, int(SH*.93)
sd.ellipse([cx-54, cy-54, cx+54, cy+54], fill=(255, 255, 255, 235))
sd.ellipse([cx-40, cy-40, cx+40, cy+40], fill=rgb('#3D5BF5'))
mask = Image.new('L', (SW, SH), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, SW-1, SH-1], radius=64, fill=255)
ph.paste(screen, (SX, SY), mask)
d.rounded_rectangle([PW//2-64, 40, PW//2+64, 72], radius=16, fill=rgb('#16181C'))   # вырез камеры
ph = ph.rotate(-7, resample=Image.BICUBIC, expand=True)

shadow(img, (560, 1500, 1120, 1580), 45, 40)
img.alpha_composite(ph, (800 - ph.width//2 + 30, 1560 - ph.height))

# AR вылетает из экрана: ленты из верха экрана вверх, над ними диско-шар, вокруг кубы и шары
ribbon(img, [(740, 820), (520, 640), (900, 470), (600, 180)], 70, '#C9B6F5', '#9C86EE')
ribbon(img, [(880, 820), (1180, 640), (860, 420), (1150, 160)], 64, '#BFE6CF', '#7CCB9F')
disco(img, (830, 420), 140)
sphere(img, (500, 560), 44, '#8FD3A8')
sphere(img, (1230, 560), 34, '#C9B6F5')
sphere(img, (1060, 230), 26, '#B9BCC8', '#FFFFFF', '#5E6272')
sphere(img, (420, 330), 24, '#C9B6F5')
sphere(img, (1300, 860), 22, '#8FD3A8')
cube(img, (1140, 690), 100, .18, '#7B90FF', '#3D5BF5', '#2B44C9')
cube(img, (560, 230), 80, -.25, '#7B90FF', '#3D5BF5', '#2B44C9')
cube(img, (640, 760), 56, .4, '#A9B6FF', '#5B6CF6', '#3D50D8')
cube(img, (1300, 300), 50, -.1, '#C9B6F5', '#9C86EE', '#7E68D8')

# по бокам широкого кадра — еще немного AR, чтобы сцена не висела островом
side = Image.new('RGBA', (W, S), (0, 0, 0, 0))
sphere(side, (300, 1100), 40, '#8FD3A8')
cube(side, (420, 640), 70, .3, '#C9B6F5', '#9C86EE', '#7E68D8')
sphere(side, (230, 360), 22, '#B9BCC8', '#FFFFFF', '#5E6272')
cube(side, (2200, 1050), 76, -.2, '#7B90FF', '#3D5BF5', '#2B44C9')
sphere(side, (2330, 520), 36, '#C9B6F5')
sphere(side, (2120, 1380), 20, '#8FD3A8')
bg.alpha_composite(side)
bg.alpha_composite(img, ((W - S) // 2, 0))
bg.convert('RGB').resize((1280, 800), Image.LANCZOS).save('img/armerch/hover-cover.jpg', quality=88)
print('ok')
