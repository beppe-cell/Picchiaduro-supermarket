"""Pose della mossa speciale da una tavola a parte (sfondo magenta), per qualsiasi personaggio.
Prende le figure intere della tavola da sinistra a destra, le porta alla scala dello sprite da fermo
del personaggio (stessa distanza vita-piedi) e scrive <nome>-special.png.
Il proiettile, se c'e', si prepara a parte (vedi tools/build_luis_special.py).

Uso: python3 -B tools/build_special.py <nome> <tavola> [--pose N] [--out CARTELLA] [--scala K]"""
import argparse
import os
import sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spritekey import key, figures                       # noqa: E402
from spritebuild import frame_from_mask, write_sheet     # noqa: E402


def red_bottom(p):
    """riga piu' bassa con molta maglia rossa (la vita)"""
    R, G, B, A = (p[..., i].astype(int) for i in range(4))
    red = (A > 128) & (R > 90) & (R > 2.2 * G) & (R > 2.2 * B)
    return int(np.where(red.sum(1) > 25)[0].max())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('name')
    ap.add_argument('sheet')
    ap.add_argument('--pose', type=int, default=3, help='numero di pose attese (predefinito 3)')
    ap.add_argument('--taglio', action='append', default=[], metavar='X0,Y1,X1[,Y2,X2...]',
                    help='separa due pose che si toccano con un confine a gradini (coordinate della '
                         'tavola): x=X0 sopra la riga Y1, x=X1 tra Y1 e Y2, e cosi\' via; ripetibile')
    ap.add_argument('--griglia', action='store_true',
                    help='la tavola ha la griglia azzurra dei fogli pose: toglie linee ed etichette e '
                         'ordina le pose per righe (prima la riga in alto, da sinistra)')
    ap.add_argument('--linee', action='store_true',
                    help='la tavola e\' divisa da linee scure a tutta lunghezza: le toglie e ordina '
                         'le pose per righe (prima la riga in alto, da sinistra)')
    ap.add_argument('--usa', metavar='I,J,...',
                    help='quali figure usare e in che ordine (indici dopo l\'ordinamento, da 0)')
    ap.add_argument('--scala', type=float,
                    help='fattore di scala fisso (es. quello stampato da build_character.py) invece '
                         'della misura vita-piedi sulla maglia rossa')
    ap.add_argument('--out', help='cartella di uscita (predefinita assets/characters/<nome>/; per una skin '
                                  'assets/characters/<nome>/skin-<id>/)')
    a = ap.parse_args()
    dst = a.out or os.path.join(HERE, '..', 'assets', 'characters', a.name)
    if a.griglia:
        from build_character import load_sheet
        o = load_sheet(a.sheet, 'A')
    else:
        o = key(a.sheet)
    H, W = o.shape[:2]
    if a.linee:
        dark = (o[..., 3] > 40) & (o[..., :3].max(-1) < 90)
        for axis, n in ((0, H), (1, W)):
            full = np.convolve(dark.sum(axis) > 0.8 * n, np.ones(7), 'same') > 0
            if axis == 0:
                o[:, full, 3] = 0
            else:
                o[full, :, 3] = 0
    full_alpha = o[..., 3].copy()
    yy, xx = np.mgrid[:H, :W]
    lines = []
    for t in a.taglio:
        v = [int(s) for s in t.split(',')]
        line = np.full((H, W), v[0])
        for i in range(1, len(v) - 1, 2):
            line[yy >= v[i]] = v[i + 1]
        # fessura di 9 px (la segmentazione unisce pezzi a meno di 7 px), anche lungo i gradini orizzontali
        gap = np.abs(xx - line) <= 4
        for i in range(1, len(v) - 1, 2):
            lo, hi = sorted((v[i - 1], v[i + 1]))
            gap |= (np.abs(yy - v[i]) <= 4) & (xx >= lo) & (xx <= hi)
        o[..., 3][gap] = 0
        lines.append(line)
    if a.griglia or a.linee:
        allf = figures(o)
        big = max(f['mask'].sum() for f in allf)
        figs = sorted([f for f in allf if f['mask'].sum() > 0.25 * big],
                      key=lambda f: ((f['y0'] + f['y1']) / 2 >= H / 2, f['x0']))
    else:
        figs = sorted([f for f in figures(o) if f['y1'] - f['y0'] > 0.35 * H], key=lambda f: f['x0'])
    if a.usa:
        figs = [figs[int(i)] for i in a.usa.split(',')]
    if lines:
        # la fessura serve solo a separare: ogni figura si riprende i suoi pixel dal suo lato del confine
        from scipy import ndimage as nd
        o[..., 3] = full_alpha
        for f in figs:
            near = nd.binary_dilation(f['mask'], iterations=8)
            cy, cx = nd.center_of_mass(f['mask'])
            for line in lines:
                left = cx < line[int(cy), int(cx)]
                near &= (xx < line) if left else (xx >= line)
            f['mask'] = near & (full_alpha > 0)
    if len(figs) != a.pose:
        sys.exit('ERRORE: attese %d pose, trovate %d. Nessun file scritto.' % (a.pose, len(figs)))
    if a.scala:
        k = a.scala
    else:
        idle = np.asarray(Image.open(os.path.join(dst, '%s-idle.png' % a.name))).astype(np.float32)
        ys = np.where(idle[..., 3].max(1) > 128)[0]
        idle = idle[ys.min():ys.max() + 1]
        f0 = figs[0]
        p0 = o[f0['y0']:f0['y1'] + 1, f0['x0']:f0['x1'] + 1].copy()
        p0[..., 3] *= f0['mask'][f0['y0']:f0['y1'] + 1, f0['x0']:f0['x1'] + 1]
        k = (idle.shape[0] - red_bottom(idle)) / (p0.shape[0] - red_bottom(p0))
    frames = [frame_from_mask(o, f['mask'], k) for f in figs]
    cw, ch = write_sheet(os.path.join(dst, '%s-special.png' % a.name), frames)
    print('%s-special.png: %d pose, scala %.3f, celle %dx%d' % (a.name, len(frames), k, cw, ch))


if __name__ == '__main__':
    main()
