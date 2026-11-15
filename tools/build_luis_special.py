"""Mossa speciale di LUIS ("chitarra rock") da assets/characters/luis/sorgenti/IMG_5454.jpeg:
riga in alto 3 pose (chitarra in spalla, alzata, colpo in avanti), riga in basso l'onda sonora in 3
grandezze. Scrive luis-special.png e luis-wave.png e stampa i valori pjo da mettere in SPRSET.
Uso: python3 -B tools/build_luis_special.py"""
import os
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spritekey import key, figures                       # noqa: E402
from spritebuild import frame_from_mask, write_sheet     # noqa: E402

SRC = 'assets/characters/luis/sorgenti/IMG_5454.jpeg'
DST = 'assets/characters/luis/'
IDLE = DST + 'luis-idle.png'
SPRK = 0.55 * 384 / 2 / 400          # px sprite -> unita' di gioco (come SPRK in index.html)


def red_bottom(p):
    """riga piu' bassa con molta maglia rossa (la vita)"""
    R, G, B, A = (p[..., i].astype(int) for i in range(4))
    red = (A > 128) & (R > 90) & (R > 2.2 * G) & (R > 2.2 * B)
    return int(np.where(red.sum(1) > 25)[0].max())


o = key(SRC)
H, W = o.shape[:2]
dark = (o[..., 3] > 40) & (o[..., :3].max(-1) < 90)
# linee della griglia: colonne/righe quasi interamente scure e strette
for axis, n in ((0, H), (1, W)):
    full = dark.sum(axis) > 0.8 * n
    full = np.convolve(full, np.ones(7), 'same') > 0
    if axis == 0:
        o[:, full, 3] = 0
    else:
        o[full, :, 3] = 0
figs = figures(o)
top = sorted([f for f in figs if (f['y0'] + f['y1']) / 2 < H / 2 and f['y1'] - f['y0'] > 300], key=lambda f: f['x0'])
assert len(top) == 3, 'attese 3 pose in alto, trovate %d' % len(top)

# scala: distanza vita-piedi uguale a quella dello sprite da fermo
a = np.asarray(Image.open(IDLE)).astype(np.float32)
ys = np.where(a[..., 3].max(1) > 128)[0]
a = a[ys.min():ys.max() + 1]
ref = a.shape[0] - red_bottom(a)
p0 = o[top[0]['y0']:top[0]['y1'] + 1, top[0]['x0']:top[0]['x1'] + 1].copy()
p0[..., 3] *= top[0]['mask'][top[0]['y0']:top[0]['y1'] + 1, top[0]['x0']:top[0]['x1'] + 1]
k = ref / (p0.shape[0] - red_bottom(p0))
frames = [frame_from_mask(o, f['mask'], k) for f in top]
cw, ch = write_sheet(DST + 'luis-special.png', frames)
print('special: 3 pose, scala %.3f, celle %dx%d' % (k, cw, ch))

# onda: le parti della riga in basso, per colonna di griglia
cols = [(0, W / 3), (W / 3, 2 * W / 3), (2 * W / 3, W)]
waves = []
for x0, x1 in cols:
    m = np.zeros((H, W), bool)
    for f in figs:
        cx = (f['x0'] + f['x1']) / 2
        if (f['y0'] + f['y1']) / 2 > H / 2 and x0 <= cx < x1:
            m |= f['mask']
    fr = frame_from_mask(o, m, k)   # alla scala del personaggio; in gioco la riduce pjs
    al = fr['px'][..., 3] > 100
    c6 = np.where(al.any(0))[0][:8]
    fr['ay'] = float(np.where(al[:, c6].any(1))[0].mean())   # punta sinistra dell'onda
    waves.append(fr)
write_sheet(DST + 'luis-wave.png', waves, top=1, bot=1, left=True)

# punto di uscita: paletta della chitarra (pixel piu' a destra sopra la vita) nella posa del colpo
sp = np.asarray(Image.open(DST + 'luis-special.png')).astype(int)
c = sp[:, 2 * cw:3 * cw]
wy = red_bottom(c)
al = c[:wy, :, 3] > 128
xs = np.where(al.any(0))[0]
nx = xs.max()
ny = int(np.where(al[:, nx - 4:nx + 1].any(1))[0].mean())
print('pjo per index.html: [%.1f, %.1f]' % ((nx - cw / 2) * SPRK, -(c.shape[0] - ny) * SPRK))
