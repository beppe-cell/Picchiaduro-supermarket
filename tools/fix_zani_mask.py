"""Toglie la mascherina chirurgica a ZANI negli sprite finiti (assets/characters/zani/).

Gemini l'ha disegnata in alcune pose del foglio A (guardia, passo, salto, accovacciato, parata), e la
guardia e' anche l'ultimo fotogramma di pugno, calcio e colpo forte. ZANI non porta la mascherina.
Per ogni fotogramma con la mascherina la testa viene sostituita con quella del 1o fotogramma del
calcio (stessa angolazione, senza mascherina): la posizione si trova confrontando i capelli, poi si
copiano capelli, viso e collo. Nella parata le mani coprono il viso: li' la testa nuova si copia
solo sopra le mani, che restano davanti.
I pixel della mascherina rimasti fuori dalla testa nuova diventano pelle (collo).
La mascherina e' il pezzo blu-grigio piu' grande in alto: i riflessi azzurri sparsi sui capelli non contano.

Uso: python3 -B tools/fix_zani_mask.py   (poi python3 -B tools/to_webp.py)
Si puo' rilanciare: i fotogrammi gia' corretti non hanno piu' mascherina e restano come sono."""
import os

import numpy as np
from PIL import Image
from scipy import ndimage as nd

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'characters', 'zani')
N = {'idle': 1, 'walk': 2, 'jump': 3, 'crouch': 1, 'block': 1, 'punch': 5, 'kick': 5, 'heavy': 5}
DONOR = ('kick', 0)                       # testa senza mascherina
DONOR_BOX = (8, 100, 90, 195)             # y0, y1, x0, x1 della testa nel fotogramma donatore
MIN_MASK = 300                            # mascherina piu' piccola (coperta dalle mani): solo ritocco
MIN_ANY = 40                              # sotto: non e' una mascherina (riflessi blu sui capelli)


def is_mask(a):
    R, G, B, A = (a[..., i].astype(int) for i in range(4))
    return (A > 128) & (B > R + 8) & (B < 150) & (abs(G - B) < 40) & (R < 110)


def is_hair(a):
    R, G, B, A = (a[..., i].astype(int) for i in range(4))
    return (A > 128) & (R > 150) & (G > 150) & (B > 140) & (abs(R - B) < 40)


def is_red(a):
    R, G, A = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 3]
    return (A > 0) & (R > 70) & (R > 1.9 * G)


def frames(name):
    a = np.asarray(Image.open(os.path.join(DIR, 'zani-%s.png' % name)).convert('RGBA')).copy()
    w = a.shape[1] // N[name]
    return a, w


def main():
    a, w = frames(DONOR[0])
    d = a[:, DONOR[1] * w:(DONOR[1] + 1) * w]
    y0, y1, x0, x1 = DONOR_BOX
    head = d[y0:y1, x0:x1]
    hmask = (head[..., 3] > 0) & ~is_red(head)
    hhair = is_hair(head)
    neck = head[(~is_red(head)) & (head[..., 3] > 128) & ~hhair]
    skin = np.median(neck[:, :3], 0)
    for name in N:
        a, w = frames(name)
        changed = []
        for i in range(N[name]):
            f = a[:, i * w:(i + 1) * w]
            top = np.zeros(f.shape[:2], bool)
            top[:170] = True
            lab, k = nd.label(is_mask(f) & top)
            if not k:
                continue
            sz = nd.sum(lab > 0, lab, range(1, k + 1))
            m = lab == int(sz.argmax()) + 1          # la mascherina e' il pezzo piu' grande
            if m.sum() < MIN_ANY:
                continue
            near = nd.binary_dilation(m, iterations=4)
            th = is_hair(f) & top
            best = None
            H, W = f.shape[:2]
            for dy in range(-40, 80):
                for dx in range(-x0 - 20, W - x0 - 40):
                    ya, xa = y0 + dy, x0 + dx
                    if ya < 0 or xa < 0 or ya + head.shape[0] > H or xa + head.shape[1] > W:
                        continue
                    win = th[ya:ya + head.shape[0], xa:xa + head.shape[1]]
                    s = (win & hhair).sum() - 0.5 * (win ^ hhair).sum()
                    if best is None or s > best[0]:
                        best = (s, ya, xa)
            _, ya, xa = best
            reg = f[ya:ya + head.shape[0], xa:xa + head.shape[1]]
            clip = hmask.copy()
            if m.sum() < MIN_MASK:
                # parata: le mani coprono il viso; la testa nuova solo sopra le mani (riga della
                # mascherina piu' alta di qualche pixel), e a destra non oltre il pugno davanti
                ys, xs = np.where(m)
                hy = ys.max() + 1 - ya
                yy, xx = np.mgrid[:head.shape[0], :head.shape[1]]
                clip &= (yy < hy) & ~((yy >= ys.min() - ya) & (xx >= xs.max() + 1 - xa))
            reg[clip] = head[clip]
            left = is_mask(f) & near
            if left.any():
                f[left, :3] = skin
            changed.append('%d (testa a %d,%d)' % (i, xa, ya))
        if changed:
            Image.fromarray(a, 'RGBA').save(os.path.join(DIR, 'zani-%s.png' % name), optimize=True)
            print('zani-%s.png: %s' % (name, ', '.join(changed)))


if __name__ == '__main__':
    main()
