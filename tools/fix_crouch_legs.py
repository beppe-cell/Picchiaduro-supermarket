"""Ripara la posa da accovacciato quando nel foglio pose Gemini ha tagliato le gambe sulla linea dei
piedi (la figura finisce alle ginocchia e in gioco sembra affondata nel pavimento).

Sotto la figura accovacciata si attaccano stinchi e stivali presi dalla posa di stacco del salto
(<nome>-jump.png, 1o fotogramma), che ha le gambe piegate allo stesso modo: si prende la parte del
salto sotto la riga --da (frazione dell'altezza, all'altezza delle ginocchia), la si centra sotto
il bordo inferiore dell'accovacciato (senza le ultime --taglia righe, sporche della linea guida
azzurra) e la si sovrappone di --sopra px, dietro la figura.
Lavora sul PNG gia' costruito (dopo tools/build_character.py) e lo riscrive; poi tools/to_webp.py.

Uso: python3 -B tools/fix_crouch_legs.py <nome> [<nome> ...] [--da 0.62] [--sopra 10] [--taglia 5]"""
import argparse
import os

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'characters')


def crop(a):
    ys, xs = np.where(a[..., 3] > 0)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def span(row):
    xs = np.where(row > 128)[0]
    return xs.min(), xs.max()


def fix(name, da, sopra, taglia):
    d = os.path.join(ROOT, name)
    cr = crop(np.asarray(Image.open(os.path.join(d, name + '-crouch.png')).convert('RGBA')))
    jp = np.asarray(Image.open(os.path.join(d, name + '-jump.png')).convert('RGBA'))
    jp = crop(jp[:, :jp.shape[1] // 3])
    cr = crop(cr[:-taglia])                  # ultime righe: avanzi azzurri della linea dei piedi
    legs = jp[int(jp.shape[0] * da):].copy()
    lab, n = nd.label(legs[..., 3] > 0)      # solo le gambe: via i pezzi staccati (mani del salto)
    if n > 1:
        sz = nd.sum(legs[..., 3] > 0, lab, range(1, n + 1))
        keep = [i + 1 for i, v in enumerate(sz) if v > 0.15 * sz.max()]   # le due gambe
        legs[~np.isin(lab, keep)] = 0
        legs = crop(legs)
    # allineamento orizzontale: centro delle gambe in basso all'accovacciato = centro della parte presa
    c0, c1 = span(cr[-3, :, 3])
    l0, l1 = span(legs[sopra, :, 3])
    dx = int(round((c0 + c1) / 2 - (l0 + l1) / 2))
    H = cr.shape[0] + legs.shape[0] - sopra
    x0 = min(0, dx)
    W = max(cr.shape[1], dx + legs.shape[1]) - x0
    out = np.zeros((H + 2, W, 4), np.uint8)
    ly = cr.shape[0] - sopra
    out[ly:ly + legs.shape[0], dx - x0:dx - x0 + legs.shape[1]] = legs
    top = out[:cr.shape[0], -x0:-x0 + cr.shape[1]]
    m = cr[..., 3:4] > 0
    out[:cr.shape[0], -x0:-x0 + cr.shape[1]] = np.where(m, cr, top)
    Image.fromarray(out, 'RGBA').save(os.path.join(d, name + '-crouch.png'), optimize=True)
    print('%s-crouch.png: %dx%d -> %dx%d' % (name, cr.shape[1], cr.shape[0], W, H + 2))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('names', nargs='+')
    ap.add_argument('--da', type=float, default=0.62, help='da che altezza del salto prendere le gambe (0-1)')
    ap.add_argument('--taglia', type=int, default=5, help='righe tolte in fondo all\'accovacciato (linea guida)')
    ap.add_argument('--sopra', type=int, default=10, help='px di sovrapposizione sotto l\'accovacciato')
    a = ap.parse_args()
    for n in a.names:
        fix(n, a.da, a.sopra, a.taglia)


if __name__ == '__main__':
    main()
