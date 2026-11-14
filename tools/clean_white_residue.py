"""Toglie il bianco di sfondo residuo dagli sprite (bordini sul contorno e "buchi" di sfondo rimasti
chiusi tra braccia e busto), senza toccare il bianco del disegno (logo G, cartellino, riflessi).

Regola: si prende ogni zona di pixel chiari e poco saturi; la si rende trasparente se tocca la
trasparenza esterna oppure se e' racchiusa soprattutto dal contorno nero (= sfondo visto in un buco).
Una zona circondata da colori (rosso della maglia, grigio del cartellino) e' disegno e resta.

Uso: python3 tools/clean_white_residue.py assets/characters/beppe/*.png"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd


def clean(path):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.int32)
    R, G, B, A = (im[..., i] for i in range(4))
    mx, mn = np.maximum(np.maximum(R, G), B), np.minimum(np.minimum(R, G), B)
    light = (A > 0) & (mn > 165) & (mx - mn < 45)
    transparent = A < 20
    dark = (A > 128) & (mx < 70)
    lab, n = nd.label(light)
    remove = np.zeros_like(light)
    for i, sl in enumerate(nd.find_objects(lab), 1):
        y0, y1 = max(sl[0].start - 1, 0), sl[0].stop + 1
        x0, x1 = max(sl[1].start - 1, 0), sl[1].stop + 1
        comp = lab[y0:y1, x0:x1] == i
        ring = nd.binary_dilation(comp) & ~comp
        if not ring.any():
            continue
        touches_out = (transparent[y0:y1, x0:x1] & ring).any()
        dark_frac = (dark[y0:y1, x0:x1] & ring).sum() / ring.sum()
        if touches_out or dark_frac > 0.6:
            remove[y0:y1, x0:x1] |= comp
    out = im.copy()
    out[remove] = 0
    Image.fromarray(out.astype(np.uint8), 'RGBA').save(path, optimize=True)
    return int(remove.sum())


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(p, 'pixel tolti:', clean(p))
