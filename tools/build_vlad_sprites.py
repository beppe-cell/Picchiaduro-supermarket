"""Genera i fogli sprite di VLAD da assets/characters/vlad/sorgenti/IMG_54xx.JPG (sfondo magenta).
Uso: python3 tools/build_vlad_sprites.py

Tavole: 5422 riferimento (non usata) · 5424 guardia/camminata · 5426 calcio · 5429 spruzzino (speciale)
5430 nuvola dello spruzzino (proiettile) · 5433 colpito/caduta · 5434 KO · 5435 vittoria · 5437 accovacciato + pugno
Mancano pose dedicate per salto e parata: si riusano pose simili (vedi sotto)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from PIL import Image
from spritebuild import Builder, SPRITE_H

K = SPRITE_H / 786       # altezza in piedi nelle tavole: 786px
# scale misurate sulla larghezza del ciuffo biondo (~124px nelle tavole standard)
K_5437 = K * 124 / 109   # tavola accovacciato/pugno disegnata piu piccola
K_KO = K * 124 / 209     # tavola KO disegnata piu grande

b = Builder('vlad', 'assets/characters/vlad/sorgenti/', 'assets/characters/vlad/', K)
fig, sheet = b.fig, b.sheet

idle0, guard1, walk2 = fig(5424, 0), fig(5424, 1), fig(5424, 2)
crouch0, punch1 = fig(5437, 0, K_5437), fig(5437, 1, K_5437)   # il 3o frame di 5437 e' tagliato sul bordo
k = [fig(5426, i) for i in range(3)]

sheet('idle', [idle0])                                    # respiro fatto in gioco (leggero bob)
sheet('walk', [idle0, walk2])
sheet('punch', [idle0, punch1, punch1, punch1, idle0])
sheet('heavy', [crouch0, crouch0, punch1, punch1, idle0])  # carica accovacciato e scatta col pugno
sheet('kick', [k[0], k[1], k[1], k[1], k[2]])
# speciale: estrae lo spruzzino, mira, spruzza. Nella tavola la 2a e la 3a figura si toccano con gli
# stivali: la 2a si ritaglia a gradini (busto e spruzzino < x828, gamba < x760, stivale < x736, punta < x754:
# oltre c'e' lo stinco/tallone della figura accanto, che faceva da "terza gamba").
aim = fig(5429, 1, keep=lambda yy, xx: xx < ((yy < 560) * 828 + ((yy >= 560) & (yy < 700)) * 760 + ((yy >= 700) & (yy < 772)) * 736 + (yy >= 772) * 754))
sheet('special', [fig(5429, 0), aim, aim])
sheet('jump', [k[0], k[0], idle0])                         # nessuna tavola salto: ginocchio alto, poi guardia


def waist(f):
    """riga di vita (ultima riga con molta maglia rossa) e centro x della maglia su quella riga"""
    p = f['px']
    red = (p[..., 3] > 128) & (p[..., 0] > 90) & (p[..., 0] > p[..., 1] * 2.2) & (p[..., 0] > p[..., 2] * 2.2)
    rows = np.where(red.sum(1) > 25)[0]
    y = int(rows.max())
    xs = np.where(red[y - 6:y + 1].any(0))[0]
    return y, float(xs.mean())


def splice(top, bottom):
    """busto e braccia di 'top' sopra bacino e gambe di 'bottom', uniti alla vita"""
    yt, xt = waist(top)
    yb, xb = waist(bottom)
    T, Bp = top['px'][:yt + 1], bottom['px'][yb + 1:]
    L = int(max(xt, xb)) + 4
    Rw = int(max(T.shape[1] - xt, Bp.shape[1] - xb)) + 4
    out = np.zeros((T.shape[0] + Bp.shape[0], L + Rw, 4), np.float32)
    xo = int(round(L - xb))
    out[T.shape[0]:, xo:xo + Bp.shape[1]] = Bp
    xo = int(round(L - xt))
    region = out[:T.shape[0], xo:xo + T.shape[1]]
    m = T[..., 3:4] > 0
    region[:] = np.where(m, T, region)
    return dict(px=out, ax=L + (bottom['ax'] - xb))


# nessuna tavola parata: busto della posa accovacciata (braccio che copre il viso) sulle gambe in piedi
sheet('block', [splice(crouch0, idle0)])
sheet('crouch', [crouch0])
# la 1a figura di 5433 ha tre gambe nel disegno originale: si usano solo la 2a (colpito) e la 3a (cade)
f = [fig(5433, i) for i in (1, 2)]
sheet('hit', [f[0]])
sheet('fall', f)
sheet('ko', [fig(5434, 0, K_KO)])
sheet('win', [fig(5435, i) for i in range(2)])
# proiettile: nuvola dello spruzzino (sbuffo iniziale, getto, nube che si allarga)
# allineata a sinistra: la punta del getto e' il bordo sinistro della cella, che il gioco mette sull'ugello
spray = [fig(5430, i) for i in range(3)]
for f in spray:  # punto di partenza = altezza media dei pixel nelle prime colonne a sinistra (punta del getto)
    a = f['px'][..., 3] > 100
    cols = np.where(a.any(0))[0][:6]
    f['ay'] = float(np.where(a[:, cols].any(1))[0].mean())
sheet('spray', spray, top=1, bot=1, left=True)

# posizione dell'ugello (pixel blu piu' a destra nella posa di mira), in unita' del gioco rispetto ai piedi
im = np.asarray(Image.open('assets/characters/vlad/vlad-special.png')).astype(int)
cw = im.shape[1] // 3
c = im[:, cw:2 * cw]
blue = (c[..., 3] > 128) & (c[..., 2] > 150) & (c[..., 2] > c[..., 0] + 60)
ys, xs = np.where(blue)
nx = xs.max(); ny = ys[xs >= nx - 3].min()
SPRK = 0.55 * 384 / 2 / SPRITE_H
print('ugello (pjo per index.html): [%.1f, %.1f]' % ((nx - cw / 2) * SPRK, -(c.shape[0] - ny) * SPRK))
