"""Proiettile della speciale di PORTE: la scatola di cartone che vola ruotando.

Sorgente: assets/characters/porte/sorgenti/scatola.jpeg, 3 disegni in fila (scatola ruotata di 0, 30 e
60 gradi, con le linee di movimento a sinistra). Scrive porte-box.png: 3 celle uguali con la scatola
centrata (le linee di movimento staccate si uniscono alla scatola alla loro destra). In gioco i 3
fotogrammi si ripetono e la scatola sembra rotolare in aria.
Stampa pjh e pjy per SPRSET. Le pose della speciale si fanno con tools/build_special.py.

Uso: python3 -B tools/build_porte_special.py [--larga PX] [--sc 1]"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spritekey import key, figures                       # noqa: E402
from spritebuild import frame_from_mask, SPRITE_H        # noqa: E402

DIR = os.path.join(HERE, '..', 'assets', 'characters', 'porte')
SPR_WORLD = 0.55 * 384 / 2      # altezza in gioco di uno sprite alto SPRITE_H (SPR_H in index.html)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--larga', type=float, default=110, help='larghezza della scatola dritta (1o disegno), px sprite')
    ap.add_argument('--sc', type=float, default=1.0, help='scala del personaggio in SPRSET (sc)')
    a = ap.parse_args()
    o = key(os.path.join(DIR, 'sorgenti', 'scatola.jpeg'))
    allf = figures(o)
    big = max(f['mask'].sum() for f in allf)
    boxes = sorted([f for f in allf if f['mask'].sum() > 0.3 * big], key=lambda f: f['x0'])
    if len(boxes) != 3:
        sys.exit('ERRORE: attese 3 scatole, trovate %d. Nessun file scritto.' % len(boxes))
    for f in allf:
        if any(f is b for b in boxes):
            continue
        cx = (f['x0'] + f['x1']) / 2
        right = [b for b in boxes if b['x0'] >= cx - 20]
        if right:
            b = min(right, key=lambda b: b['x0'])
            b['mask'] = b['mask'] | f['mask']
    k = a.larga / (boxes[0]['x1'] - boxes[0]['x0'])
    frames = []
    for b in boxes:
        fr = frame_from_mask(o, b['mask'], k)['px']
        # centro della scatola = centro dei pixel marroni (le linee bianche non contano)
        R, G, B, A = (fr[..., i] for i in range(4))
        brown = (A > 128) & (R > G) & (G > B) & (R - B > 30)
        ys, xs = np.where(brown)
        frames.append((fr, xs.mean(), ys.mean()))
    hw = max(max(cx, fr.shape[1] - cx) for fr, cx, cy in frames) + 2
    hh = max(max(cy, fr.shape[0] - cy) for fr, cx, cy in frames) + 2
    cw, ch = int(np.ceil(2 * hw)), int(np.ceil(2 * hh))
    out = np.zeros((ch, cw * 3, 4), np.float32)
    for i, (fr, cx, cy) in enumerate(frames):
        x, y = int(round(i * cw + hw - cx)), int(round(hh - cy))
        out[y:y + fr.shape[0], x:x + fr.shape[1]] = fr
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(DIR, 'porte-box.png'), optimize=True)
    kw = SPR_WORLD / SPRITE_H * a.sc
    print('porte-box.png: 3 fotogrammi, celle %dx%d, scala %.3f' % (cw, ch, k))
    print('SPRSET: pjn:3,pjh:%.1f,pjy:%.1f' % (ch * kw, -hh * kw))


if __name__ == '__main__':
    main()
