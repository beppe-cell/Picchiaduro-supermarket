"""Aggiunge singole animazioni a un personaggio gia' in gioco, prendendo le pose da UN foglio pose
(griglia di tools/pose_layout.json). Serve quando arriva solo una parte dei fogli (es. le vittorie).
La scala si prende dallo sprite da fermo del personaggio: stessa distanza vita-piedi sulla maglia
rossa, misurata sulla prima posa elencata (che deve essere in piedi), oppure --scala.

Uso: python3 -B tools/build_extra_poses.py <nome> <lettera foglio> <immagine> ANIM=CELLA[+CELLA...] ...
es.: python3 -B tools/build_extra_poses.py beppe C IMG_5475.jpeg hit=hit win=win_0+win_1"""
import argparse
import os
import sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_character import load_sheet, figures_by_cell   # noqa: E402
from build_special import red_bottom                      # noqa: E402
from spritebuild import frame_from_mask, write_sheet      # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('name')
    ap.add_argument('sheet', help='lettera del foglio in pose_layout.json (A, B, C)')
    ap.add_argument('image')
    ap.add_argument('anims', nargs='+', metavar='ANIM=CELLA[+CELLA]')
    ap.add_argument('--scala', type=float)
    a = ap.parse_args()
    dst = os.path.join(HERE, '..', 'assets', 'characters', a.name)
    notes = []
    o = load_sheet(a.image, a.sheet)
    figs = figures_by_cell(o, a.sheet, notes)
    plan = [(s.split('=')[0], s.split('=')[1].split('+')) for s in a.anims]
    missing = [c for _, cells in plan for c in cells if c not in figs]
    if missing:
        sys.exit('ERRORE: caselle vuote o assenti: %s. Nessun file scritto.' % ', '.join(missing))
    k = a.scala
    if not k:
        idle = np.asarray(Image.open(os.path.join(dst, '%s-idle.png' % a.name))).astype(np.float32)
        ys = np.where(idle[..., 3].max(1) > 128)[0]
        idle = idle[ys.min():ys.max() + 1]
        first = frame_from_mask(o, figs[plan[0][1][0]], 1.0)['px']
        ys = np.where(first[..., 3].max(1) > 128)[0]
        first = first[ys.min():ys.max() + 1]
        k = (idle.shape[0] - red_bottom(idle)) / float(first.shape[0] - red_bottom(first))
    for anim, cells in plan:
        write_sheet(os.path.join(dst, '%s-%s.png' % (a.name, anim)),
                    [frame_from_mask(o, figs[c], k) for c in cells])
        print('%s-%s.png: %d pose' % (a.name, anim, len(cells)))
    print('scala %.3f' % k)
    for n in notes:
        print(' -', n)


if __name__ == '__main__':
    main()
