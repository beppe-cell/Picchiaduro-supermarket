"""Costruisce le animazioni di un personaggio (o di una skin) scegliendo a mano le figure dai fogli,
per i fogli generati fuori dalla griglia standard (caselle in piu', pose doppie o sbagliate) dove
tools/build_character.py assegnerebbe le pose alle caselle sbagliate.

Prima si guardano le figure numerate di ogni foglio:
  python3 -B tools/build_figure_map.py --elenca FOGLIO [FOGLIO ...] [--dir CARTELLA]
    (stampa le figure con il loro numero e salva <foglio>-figure.png nella cartella indicata)
Poi si costruisce:
  python3 -B tools/build_figure_map.py <nome> --out CARTELLA --posa idle=FOGLIO:N [--posa ...]
    --posa ID=FOGLIO:N[+M...]  figura N del foglio (piu' numeri: figure unite, es. KO + cappello)
    --speciale FOGLIO:N,FOGLIO:N,...  pose della mossa speciale in ordine (facoltativo)
La guardia (idle) diventa alta 400 px; le altre figure seguono in proporzione alla risoluzione del
loro foglio. Le pose che mancano usano le stesse sostituzioni di build_character.py, e lo si dice.
Numerazione: prima le figure della meta' alta del foglio, poi quelle della meta' bassa, da sinistra."""
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_character import load_sheet, ANIMS, FALLBACK          # noqa: E402
from spritebuild import frame_from_mask, write_sheet, SPRITE_H   # noqa: E402


def sheet_figures(path):
    """(foglio RGBA, [maschere]) con le figure numerate come descritto sopra"""
    o = load_sheet(path, 'A')
    H = o.shape[0]
    msk = o[..., 3] > 40
    lab, _ = nd.label(nd.binary_dilation(msk, iterations=2))
    figs = []
    for j, sl in enumerate(nd.find_objects(lab), 1):
        m = (lab == j) & msk
        area = m.sum()
        bh, bw = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if area < 400 or (area / float(bh * bw) < 0.04 and max(bh, bw) > 100):
            continue   # macchie, cornici e linee rimaste
        figs.append((sl, m))
    figs.sort(key=lambda f: ((f[0][0].start + f[0][0].stop) / 2 > H / 2, f[0][1].start))
    return o, figs


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('name', nargs='?')
    ap.add_argument('--elenca', nargs='+', metavar='FOGLIO')
    ap.add_argument('--dir', default='.', help='dove salvare le immagini numerate di --elenca')
    ap.add_argument('--out')
    ap.add_argument('--posa', action='append', default=[], metavar='ID=FOGLIO:N[+M]')
    ap.add_argument('--speciale', metavar='FOGLIO:N,...')
    a = ap.parse_args()

    if a.elenca:
        for path in a.elenca:
            o, figs = sheet_figures(path)
            im = Image.open(path).convert('RGB')
            d = ImageDraw.Draw(im)
            for i, (sl, m) in enumerate(figs):
                d.rectangle([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop], outline=(0, 255, 0), width=3)
                d.text((sl[1].start + 4, sl[0].start + 4), str(i), fill=(255, 255, 0))
                print('%s %d: x %d-%d, y %d-%d, %d px' % (os.path.basename(path), i, sl[1].start, sl[1].stop,
                                                         sl[0].start, sl[0].stop, m.sum()))
            im.save(os.path.join(a.dir, os.path.splitext(os.path.basename(path))[0] + '-figure.png'))
        return
    if not a.name or not a.out:
        sys.exit('servono <nome> e --out (oppure --elenca)')

    cache = {}

    def fig(spec):
        path, _, idx = spec.rpartition(':')
        if path not in cache:
            cache[path] = sheet_figures(path)
        o, figs = cache[path]
        m = np.zeros(o.shape[:2], bool)
        for i in idx.split('+'):
            if int(i) >= len(figs):
                sys.exit('ERRORE: %s ha solo %d figure (chiesta la %s). Nessun file scritto.' % (path, len(figs), i))
            m |= figs[int(i)][1]
        return o, m

    poses = dict(p.split('=', 1) for p in a.posa)
    if 'idle' not in poses:
        sys.exit('ERRORE: serve --posa idle=FOGLIO:N (da la scala). Nessun file scritto.')
    oI, mI = fig(poses['idle'])
    ys = np.where(mI.any(1))[0]
    kI = SPRITE_H / float(ys.max() - ys.min() + 1)
    hI = oI.shape[0]
    frames, notes = {}, []
    for pid, spec in poses.items():
        o, m = fig(spec)
        frames[pid] = frame_from_mask(o, m, kI * hI / o.shape[0])
    for pid in sorted({p for _, ps in ANIMS for p in ps}):
        if pid in frames:
            continue
        fb = FALLBACK.get(pid)
        while fb and fb not in frames:
            fb = FALLBACK.get(fb)
        if not fb:
            sys.exit('ERRORE: manca %s e non ha sostituti. Nessun file scritto.' % pid)
        frames[pid] = frames[fb]
        notes.append('%s mancante: uso %s' % (pid, fb))
    os.makedirs(a.out, exist_ok=True)
    n = {}
    for anim, ps in ANIMS:
        write_sheet(os.path.join(a.out, '%s-%s.png' % (a.name, anim)), [frames[p] for p in ps])
        n[anim] = len(ps)
    if a.speciale:
        sp = []
        for spec in a.speciale.split(','):
            o, m = fig(spec)
            sp.append(frame_from_mask(o, m, kI * hI / o.shape[0]))
        write_sheet(os.path.join(a.out, '%s-special.png' % a.name), sp)
        n['special'] = len(sp)
    print('scritti in', os.path.normpath(a.out), '- scala guardia %.3f' % kI)
    for line in notes:
        print(' -', line)
    print('fotogrammi:', ','.join('%s:%d' % kv for kv in n.items()))


if __name__ == '__main__':
    main()
