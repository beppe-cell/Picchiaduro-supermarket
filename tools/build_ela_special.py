"""Mossa speciale di ELA ("risata al telefono") da assets/characters/ela/sorgenti/IMG_5474.jpeg:
riga in alto 3 pose disegnate a MEZZO BUSTO (telefono all'orecchio, inizia a ridere, ride forte),
riga in basso l'onda sonora della risata in 3 grandezze.

Le pose sono tagliate sopra le ginocchia, quindi il busto viene montato sulle gambe della posa da
fermo: la scala si prende dalla distanza testa-cartellino rosso (che porta alla cintura), il taglio
e' all'altezza della cintura e i due pezzi si allineano sul centro del busto.
Scrive ela-special.png e ela-laugh.png e stampa pjo (punto di uscita = bocca) per index.html.
Uso: python3 -B tools/build_ela_special.py"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spritekey import key, figures                       # noqa: E402
from spritebuild import frame_from_mask, write_sheet     # noqa: E402

SRC = 'assets/characters/ela/sorgenti/IMG_5474.jpeg'
DST = 'assets/characters/ela/'
SPRK = 0.55 * 384 / 2 / 400


def trim(p):
    ys, xs = np.where(p[..., 3] > 8)
    return p[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def badge(p):
    """riquadro del cartellino rosso: la macchia rossa piu' grande nella meta' bassa"""
    R, G, B, A = (p[..., i].astype(int) for i in range(4))
    m = (A > 128) & (R > 140) & (G < 100) & (B < 100) & (R > G + 70)
    m[:int(p.shape[0] * 0.35)] = False
    lab, n = nd.label(m)
    if not n:
        raise SystemExit('cartellino rosso non trovato')
    s = nd.sum(m, lab, range(1, n + 1))
    ys, xs = np.where(lab == 1 + int(np.argmax(s)))
    return ys.min(), ys.max(), xs.min(), xs.max()


def dark_x(p, y):
    """centro orizzontale dei pixel scuri (gilet/pantaloni) attorno alla riga y"""
    band = p[max(0, y - 6):y + 6]
    m = (band[..., 3] > 128) & (band[..., :3].max(-1) < 70)
    return float(np.median(np.where(m)[1]))


o = key(SRC)
H, W = o.shape[:2]
dark = (o[..., 3] > 40) & (o[..., :3].max(-1) < 90)
for axis, n in ((0, H), (1, W)):       # linee della griglia (scure, a tutta lunghezza)
    full = np.convolve(dark.sum(axis) > 0.8 * n, np.ones(7), 'same') > 0
    if axis == 0:
        o[:, full, 3] = 0
    else:
        o[full, :, 3] = 0
figs = figures(o)
top = sorted([f for f in figs if (f['y0'] + f['y1']) / 2 < H / 2 and f['mask'].sum() > 20000], key=lambda f: f['x0'])
bottom = [f for f in figs if (f['y0'] + f['y1']) / 2 >= H / 2]
assert len(top) == 3, 'attese 3 pose in alto, trovate %d' % len(top)

idle = trim(np.asarray(Image.open(DST + 'ela-idle.png')).astype(np.float32))
ib = badge(idle)
k = None
frames = []
for f in top:
    p = trim(frame_from_mask(o, f['mask'], 1.0)['px'])
    pb = badge(p)
    if k is None:   # scala dalla prima posa: testa -> cima del cartellino come nella posa da fermo
        k = ib[0] / float(pb[0])
    pi = Image.fromarray(np.clip(p, 0, 255).astype(np.uint8), 'RGBA')
    pi = pi.resize((round(p.shape[1] * k), round(p.shape[0] * k)), Image.LANCZOS)
    p = np.asarray(pi).astype(np.float32)
    p[p[..., 3] < 8] = 0
    pb = badge(p)
    cut_p = pb[0] - 4                          # appena sopra il cartellino: la cintura
    cut_i = ib[0] - 4
    upper, lower = p[:cut_p], idle[cut_i:]
    cu, cl = dark_x(p, cut_p), dark_x(idle, cut_i)
    L = int(max(cu, cl)) + 4
    Rw = int(max(upper.shape[1] - cu, lower.shape[1] - cl)) + 4
    out = np.zeros((upper.shape[0] + lower.shape[0], L + Rw, 4), np.float32)
    xl = int(round(L - cl))
    out[upper.shape[0]:, xl:xl + lower.shape[1]] = lower
    xu = int(round(L - cu))
    reg = out[:upper.shape[0], xu:xu + upper.shape[1]]
    reg[:] = np.where(upper[..., 3:4] > 0, upper, reg)
    frames.append(dict(px=out, ax=float(L)))
cw, ch = write_sheet(DST + 'ela-special.png', frames)
print('special: 3 pose (busto %.3f su gambe della guardia), celle %dx%d' % (k, cw, ch))

# onda: le parti della riga in basso, per colonna; alla scala del busto, in gioco la riduce pjs.
# L'onda e' rosa/viola: lo scontorno normale le toglierebbe il colore (e' vicina al magenta), quindi
# qui si toglie solo il magenta pieno dello sfondo e i colori restano quelli originali.
raw = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
d = np.sqrt((raw[..., 0] - 255) ** 2 + raw[..., 1] ** 2 + (raw[..., 2] - 255) ** 2)
strict = np.clip((d - 40) / 50, 0, 1) * 255
o[H // 2:, :, :3] = raw[H // 2:]
o[H // 2:, :, 3] = np.where(o[H // 2:, :, 3] > 0, strict[H // 2:], 0)
waves = []
for x0, x1 in ((0, W / 3), (W / 3, 2 * W / 3), (2 * W / 3, W)):
    m = np.zeros((H, W), bool)
    for f in bottom:
        if x0 <= (f['x0'] + f['x1']) / 2 < x1:
            m |= f['mask']
    fr = frame_from_mask(o, m, k)
    al = fr['px'][..., 3] > 100
    c8 = np.where(al.any(0))[0][:8]
    fr['ay'] = float(np.where(al[:, c8].any(1))[0].mean())
    waves.append(fr)
write_sheet(DST + 'ela-laugh.png', waves, top=1, bot=1, left=True)

# bocca nella posa 3: pelle piu' a destra nella parte alta della testa
sp = np.asarray(Image.open(DST + 'ela-special.png')).astype(int)
c = sp[:, 2 * cw:3 * cw]
ys = np.where(c[..., 3].max(1) > 128)[0]
top_y, hgt = ys.min(), ys.max() - ys.min()
R, G, B, A = (c[..., i] for i in range(4))
skin = (A > 128) & (R > 180) & (G > 110) & (B > 80) & (R > B + 30)
skin[top_y + int(0.25 * hgt):] = False
yy, xx = np.where(skin)
mx = xx.max()
my = int(yy[xx >= mx - 6].mean())
print('pjo per index.html: [%.1f, %.1f]' % ((mx - cw / 2) * SPRK, -(c.shape[0] - my) * SPRK))
