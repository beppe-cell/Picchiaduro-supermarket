"""Riscrive la scritta sull'insegna appesa negli sfondi delle arene (assets/backgrounds/).

Il nome del gioco e' cambiato (SUPERRISSA): negli sfondi disegnati da Gemini l'insegna centrale
porta ancora il nome vecchio. Per ogni sfondo in SIGNS:
  1. nella zona indicata trova le lettere (pixel chiari e caldi sul pannello marrone);
  2. le cancella riempiendole dal pannello intorno (diffusione dei pixel vicini);
  3. scrive il testo nuovo nello stesso riquadro delle lettere vecchie, con il loro colore
     (e, se l'insegna e' illuminata, con lo stesso alone).
Riscrive il JPEG sul posto.

Uso: python3 -B tools/rename_sign.py [--testo SUPERRISSA]"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage as nd

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'backgrounds')
FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
# sfondo -> zona (x0, y0, x1, y1) che contiene le lettere, dentro il pannello; glow = insegna accesa
SIGNS = {
    'arena-casse': dict(box=(605, 118, 852, 178), glow=False),
    'arena-orizzontale': dict(box=(648, 118, 852, 182), glow=False),
    'arena-parcheggio': dict(box=(648, 118, 852, 182), glow=True),
}


def letters(px):
    """maschera delle lettere: piu' chiare del pannello, gialle/arancio"""
    R, G, B = (px[..., i].astype(float) for i in range(3))
    lum = 0.3 * R + 0.59 * G + 0.11 * B
    panel = np.median(lum)
    return (lum > panel + 45) & (R > B + 30)


def fill(px, m, it=400):
    """riempie i pixel della maschera con la media dei vicini, dal bordo verso l'interno"""
    out = px.astype(float)
    known = ~m
    k = np.ones((3, 3))
    for _ in range(it):
        if known.all():
            break
        s = np.stack([nd.convolve(out[..., c] * known, k, mode='nearest') for c in range(3)], -1)
        n = nd.convolve(known.astype(float), k, mode='nearest')
        new = (~known) & (n > 0)
        out[new] = s[new] / n[new][:, None]
        known = known | new
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--testo', default='SUPERRISSA')
    a = ap.parse_args()
    for name, s in SIGNS.items():
        path = os.path.join(DIR, name + '.jpeg')
        im = Image.open(path).convert('RGB')
        x0, y0, x1, y1 = s['box']
        px = np.asarray(im.crop(s['box'])).copy()
        m = letters(px)
        ys, xs = np.where(m)
        tx0, tx1, ty0, ty1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        col = np.median(px[m], 0)
        if s['glow']:
            col = np.percentile(px[m], 80, 0)
        mm = nd.binary_dilation(m, iterations=3 if s['glow'] else 2)
        base = fill(px, mm)
        # testo nuovo, disegnato grande e poi ridotto al riquadro delle lettere vecchie
        f = ImageFont.truetype(FONT, 200)
        bb = f.getbbox(a.testo)
        big = Image.new('L', (bb[2] - bb[0] + 20, bb[3] - bb[1] + 20), 0)
        ImageDraw.Draw(big).text((10 - bb[0], 10 - bb[1]), a.testo, font=f, fill=255,
                                 stroke_width=6, stroke_fill=255)
        big = big.crop(big.getbbox())
        tw, th = tx1 - tx0, ty1 - ty0
        al = np.zeros(px.shape[:2], float)
        al[ty0:ty1, tx0:tx1] = np.asarray(big.resize((tw, th), Image.LANCZOS), float) / 255
        out = base
        if s['glow']:
            g = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4)), float) / 255
            out = out + (col - out) * (0.45 * g)[..., None]
        out = out * (1 - al[..., None]) + col * al[..., None]
        im.paste(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), (x0, y0))
        im.save(path, quality=92)
        print('%s: %s -> %s (lettere %dx%d)' % (name, 'insegna', a.testo, tw, th))


if __name__ == '__main__':
    main()
