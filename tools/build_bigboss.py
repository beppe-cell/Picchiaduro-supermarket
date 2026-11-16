"""Rigenera tutti gli sprite di BIGBOSS dalle sorgenti e ne corregge le proporzioni.

Nei fogli pose Gemini ha disegnato BIGBOSS alto quanto Matteo: portato all'altezza di VLAD, testa e
busto risultavano piu' grandi di quelli degli altri. Qui le gambe (dalla cima dei jeans arancioni
in giu') vengono allungate in verticale di LEG, cosi' in gioco BIGBOSS si puo' scalare di meno
(SPRSET.BIGBOSS.sc) e restare alto come VLAD con testa e busto della stessa grandezza degli altri.
KO e caduta (gambe non verticali) non vengono allungati.
Uso: python3 -B tools/build_bigboss.py"""
import os
import subprocess
import sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
CH = os.path.join(ROOT, 'assets', 'characters', 'bigboss')
SRC = os.path.join(CH, 'sorgenti')
LEG = 1.16      # allungamento delle gambe
FRAMES = {'idle': 1, 'walk': 2, 'punch': 5, 'kick': 5, 'heavy': 5, 'jump': 3, 'block': 1, 'crouch': 1,
          'special': 4, 'hit': 1, 'win': 2, 'front': 1}
SKIP = {'fall', 'ko'}


def run(*args):
    subprocess.run([sys.executable, '-B'] + [os.path.join(HERE, args[0])] + list(args[1:]), check=True,
                   cwd=ROOT, stdout=subprocess.DEVNULL)


def stretch_frame(c):
    """c: RGBA uint8 di una cella. Allunga in verticale le righe dalla cima dei jeans in giu'."""
    R, G, B, A = (c[..., i].astype(int) for i in range(4))
    orange = (A > 128) & (R > 170) & (G > 70) & (G < 175) & (B < 90) & (R - B > 110)
    rows = np.where(orange.sum(1) > 4)[0]
    if not len(rows):
        return c
    top = rows.min()
    low = Image.fromarray(c[top:])
    low = np.asarray(low.resize((low.width, round(low.height * LEG)), Image.NEAREST))
    return np.concatenate([c[:top], low], 0)


def main():
    # 1. sprite dalle sorgenti (stesse opzioni usate per l'importazione)
    run('build_character.py', 'bigboss', os.path.join(SRC, 'IMG_5477.jpeg'), os.path.join(SRC, 'IMG_5478.jpeg'),
        os.path.join(SRC, 'IMG_5479.jpeg'))
    run('build_extra_poses.py', 'bigboss', 'A', os.path.join(SRC, 'IMG_5477.jpeg'), 'crouch=jump_up', '--scala', '1.096')
    run('build_special.py', 'bigboss', os.path.join(SRC, 'IMG_5480.jpeg'), '--linee', '--pose', '4', '--scala', '1.096')
    run('build_fronts.py')
    # 2. gambe allungate, celle ricomposte con i piedi sul bordo inferiore
    for anim, n in FRAMES.items():
        p = os.path.join(CH, 'bigboss-%s.png' % anim)
        a = np.asarray(Image.open(p).convert('RGBA'))
        cw = a.shape[1] // n
        cells = [stretch_frame(a[:, i * cw:(i + 1) * cw]) for i in range(n)]
        H = max(c.shape[0] for c in cells)
        out = np.zeros((H, cw * n, 4), np.uint8)
        for i, c in enumerate(cells):
            out[H - c.shape[0]:, i * cw:(i + 1) * cw] = c
        Image.fromarray(out, 'RGBA').save(p, optimize=True)
        print('bigboss-%s.png: gambe x%.2f' % (anim, LEG))


if __name__ == '__main__':
    main()
