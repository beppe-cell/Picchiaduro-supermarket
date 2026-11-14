"""Ricostruisce beppe-special.png con l'ordine naturale della mossa:
  0 afferra il bancale in piedi (assets/characters/beppe/sorgenti/Beppe_frame1special.jpeg, specchiato
    perche' gli sprite guardano a destra)
  1 tiene il bancale (2a cella del foglio attuale)
  2 lo spinge via (3a cella del foglio attuale): qui il gioco lancia il bancale
I tre frame vengono centrati sul busto (mediana dei pixel rossi della maglia), piedi sul bordo inferiore.
Rieseguibile: le celle 1 e 2 restano le stesse.  Uso: python3 tools/build_beppe_special.py"""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from spritekey import key, figures
from clean_white_residue import clean

SHEET = 'assets/characters/beppe/beppe-special.png'
SRC = 'assets/characters/beppe/sorgenti/Beppe_frame1special.jpeg'
K = 0.35  # testa della stessa grandezza degli altri frame di Beppe


def trim(p):
    ys, xs = np.where(p[..., 3] > 8)
    return p[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def torso_x(p):
    red = (p[..., 3] > 128) & (p[..., 0] > 100) & (p[..., 0] > 2.2 * p[..., 1]) & (p[..., 0] > 2.2 * p[..., 2])
    return float(np.median(np.where(red)[1]))


cur = np.asarray(Image.open(SHEET).convert('RGBA')).astype(np.float32)
cw = cur.shape[1] // 3
hold, push = trim(cur[:, cw:2 * cw]), trim(cur[:, 2 * cw:])

o = key(SRC)
f = max(figures(o), key=lambda f: (f['x1'] - f['x0']) * (f['y1'] - f['y0']))
c = o[f['y0']:f['y1'] + 1, f['x0']:f['x1'] + 1].copy()
c[..., 3] *= f['mask'][f['y0']:f['y1'] + 1, f['x0']:f['x1'] + 1]
a = c[..., 3:4] / 255.0
im = Image.fromarray(np.clip(np.concatenate([c[..., :3] * a, c[..., 3:4]], -1), 0, 255).astype(np.uint8), 'RGBA')
im = im.transpose(Image.FLIP_LEFT_RIGHT).resize((round(c.shape[1] * K), round(c.shape[0] * K)), Image.LANCZOS)
r = np.asarray(im).astype(np.float32)
al = r[..., 3:4]
r = np.concatenate([np.where(al > 0, r[..., :3] * 255 / np.maximum(al, 1), 0), al], -1)
r[r[..., 3] < 8] = 0
grab = trim(r)

frames = [grab, hold, push]
half = int(max(max(torso_x(p), p.shape[1] - torso_x(p)) for p in frames)) + 3
H = max(p.shape[0] for p in frames) + 5
out = np.zeros((H, 2 * half * 3, 4), np.float32)
for i, p in enumerate(frames):
    x = i * 2 * half + int(round(half - torso_x(p)))
    out[H - 2 - p.shape[0]:H - 2, x:x + p.shape[1]] = p
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save(SHEET, optimize=True)
print('celle', 2 * half, 'x', H, '- bianco residuo tolto:', clean(SHEET))
