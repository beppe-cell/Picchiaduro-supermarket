"""Proiettile della speciale di PELATA: il rotolo di scontrino che vola e si srotola.

Sorgente: assets/characters/pelata/sorgenti/scontrino.jpeg, 3 disegni (in alto a sinistra il rotolo
intero, in alto a destra il rotolo con un pezzo di carta, in basso la lunga striscia srotolata).
Scrive pelata-receipt.png: 3 celle uguali, in ognuna il ROTOLO (davanti, a destra) sta sempre nello
stesso punto (a meta' altezza, a PJR px dal bordo sinistro) e la carta srotolata si allunga dietro.
Il rotolo si trova dal foro marrone al centro (il piu' a destra, nel disegno con la spirale).
Stampa i valori pjh, pjy, pjr per SPRSET (con la scala del personaggio --sc).
Le pose della speciale si fanno con tools/build_special.py.

Uso: python3 -B tools/build_pelata_special.py [--rotolo PX] [--sc 0.9]"""
import argparse
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as nd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spritekey import key, figures                       # noqa: E402
from spritebuild import frame_from_mask, SPRITE_H        # noqa: E402

DIR = os.path.join(HERE, '..', 'assets', 'characters', 'pelata')
SPR_WORLD = 0.55 * 384 / 2      # altezza in gioco di uno sprite alto SPRITE_H (SPR_H in index.html)


def hole(px):
    """centro (x, y) del foro marrone del rotolo piu' a destra"""
    R, G, B, A = (px[..., i] for i in range(4))
    br = (A > 128) & (R > 60) & (R < 170) & (G < 0.8 * R) & (B < 0.7 * R) & (R - B > 30)
    lab, n = nd.label(br)
    if not n:
        sys.exit('ERRORE: foro del rotolo non trovato. Nessun file scritto.')
    sz = nd.sum(br, lab, range(1, n + 1))
    best = [i for i in range(n) if sz[i] > 0.2 * sz.max()]
    cs = [nd.center_of_mass(br, lab, i + 1) for i in best]
    cy, cx = max(cs, key=lambda c: c[1])
    return cx, cy


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--rotolo', type=float, default=56, help='diametro del rotolo intero (1o disegno), px sprite')
    ap.add_argument('--sc', type=float, default=1.0, help='scala del personaggio in SPRSET (sc)')
    a = ap.parse_args()
    o = key(os.path.join(DIR, 'sorgenti', 'scontrino.jpeg'))
    H = o.shape[0]
    figs = [f for f in figures(o) if f['mask'].sum() > 2000]
    big = max(f['mask'].sum() for f in figs)
    figs = [f for f in figs if f['mask'].sum() > 0.1 * big]
    # ordine: prima la riga in alto da sinistra, poi quella in basso
    figs.sort(key=lambda f: ((f['y0'] + f['y1']) / 2 > H / 2, f['x0']))
    if len(figs) < 3:
        sys.exit('ERRORE: attesi 3 disegni, trovati %d. Nessun file scritto.' % len(figs))
    # le linee di movimento staccate del 1o disegno: si uniscono a quello piu' vicino
    main3 = figs[:3]
    for f in figures(o):
        if any(f is g for g in main3) or f['mask'].sum() < 30:
            continue
        cy, cx = (f['y0'] + f['y1']) / 2, (f['x0'] + f['x1']) / 2
        g = min(main3, key=lambda g: abs((g['y0'] + g['y1']) / 2 - cy) + abs((g['x0'] + g['x1']) / 2 - cx))
        if g['x0'] - 160 < cx < g['x1'] + 40 and g['y0'] - 60 < cy < g['y1'] + 60:
            g['mask'] = g['mask'] | f['mask']
    m0 = main3[0]['mask']
    ys, xs = np.where(m0)
    d0 = ys.max() - ys.min()          # il 1o disegno e' quasi tutto rotolo: la sua altezza ~ diametro
    k = a.rotolo / d0
    frames = []
    for g in main3:
        fr = frame_from_mask(o, g['mask'], k)['px']
        cx, cy = hole(fr)
        frames.append((fr, cx, cy))
    right = max(fr.shape[1] - cx for fr, cx, cy in frames) + 2
    left = max(cx for fr, cx, cy in frames) + 2
    half = max(max(cy, fr.shape[0] - cy) for fr, cx, cy in frames) + 2
    cw, ch = int(np.ceil(left + right)), int(np.ceil(2 * half))
    out = np.zeros((ch, cw * 3, 4), np.float32)
    for i, (fr, cx, cy) in enumerate(frames):
        x, y = int(round(i * cw + left - cx)), int(round(half - cy))
        h, w = fr.shape[:2]
        out[y:y + h, x:x + w] = fr
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(DIR, 'pelata-receipt.png'),
                                                                         optimize=True)
    kw = SPR_WORLD / SPRITE_H * a.sc
    print('pelata-receipt.png: 3 fotogrammi, celle %dx%d, scala %.3f' % (cw, ch, k))
    print("SPRSET: pjn:3,pjg:1,pjh:%.1f,pjy:%.1f,pjr:%d" % (ch * kw, -half * kw, int(round(left))))


if __name__ == '__main__':
    main()
