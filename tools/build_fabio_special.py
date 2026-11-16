"""Mossa speciale di FABIO (il sollevatore) e la sua onda d'urto.

Sorgenti in assets/characters/fabio/sorgenti/:
  speciale.jpeg  4 pose da sinistra: sale sulle forche, in alto sulle forche, tuffo, pugni a terra;
  onda.jpeg      l'onda d'urto in 3 grandezze, da sinistra.
Scrive fabio-special.png e fabio-shock.png.

Le pose sono scalate in modo che la testa di Fabio sia grande come nella guardia (--scala): nel disegno
Gemini l'ha fatto piu' grosso, quindi la scala e' piu' piccola di quella stampata da build_character.py.
L'ancora di ogni posa e' il busto di Fabio (la maglia rossa), non il centro della figura: cosi' il
sollevatore resta davanti a lui e Fabio non salta di lato tra la guardia e la speciale. Il tuffo (3a
posa) e' sollevato da terra di --volo px. Nella 2a posa Fabio e le forche sono abbassati di --abbassa
px lungo il montante: alzati fino in cima uscirebbero dallo schermo.
L'onda nel disegno corre verso sinistra (la mezzaluna e' davanti, i detriti dietro): qui viene
specchiata, perche' gli sprite guardano a destra, e la coda (tagliata dal bordo del disegno) e' sfumata. Le 3 grandezze stanno in celle uguali, appoggiate
sul bordo inferiore e centrate: in gioco l'onda si disegna sul pavimento e cresce frame dopo frame.

Uso: python3 -B tools/build_fabio_special.py [--scala K] [--volo PX] [--abbassa PX]"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spritekey import key, figures                       # noqa: E402
from spritebuild import frame_from_mask, write_sheet     # noqa: E402

DIR = os.path.join(HERE, '..', 'assets', 'characters', 'fabio')


def shirt_x(px):
    """x mediana della maglia rossa di Fabio nel frame (ancora orizzontale)"""
    R, G, B, A = (px[..., i] for i in range(4))
    red = (A > 128) & (R > 90) & (R > 2.2 * G) & (R > 2.2 * B)
    return float(np.median(np.where(red)[1]))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--scala', type=float, default=0.9)
    ap.add_argument('--abbassa', type=int, default=170,
                    help='di quanti px abbassare Fabio e le forche nella 2a posa (0 = come nel disegno)')
    ap.add_argument('--volo', type=int, default=110, help='altezza da terra del tuffo, in px dello sprite')
    a = ap.parse_args()

    o = key(os.path.join(DIR, 'sorgenti', 'speciale.jpeg'))
    H = o.shape[0]
    figs = sorted([f for f in figures(o) if f['y1'] - f['y0'] > 0.25 * H], key=lambda f: f['x0'])
    if len(figs) != 4:
        sys.exit('ERRORE: attese 4 pose, trovate %d. Nessun file scritto.' % len(figs))
    frames = []
    for i, f in enumerate(figs):
        fr = frame_from_mask(o, f['mask'], a.scala)
        fr['ax'] = shirt_x(fr['px'])
        if i == 1 and a.abbassa:   # forche a meta' montante: Fabio resta dentro lo schermo
            px = fr['px']
            R, G, B, A = (px[..., j] for j in range(4))
            grey = (A > 128) & (abs(R - G) < 14) & (abs(G - B) < 20) & (R > 90)
            xm = int(np.where(grey.sum(0) > 0.4 * px.shape[0])[0].min()) - 8   # bordo sinistro del montante (con il contorno)
            rows = np.where((A[:, :xm] > 0).any(1))[0]
            y1 = int(rows[np.where(np.diff(rows) > 1)[0][0]]) + 1          # fine di Fabio + forche
            up = px[:y1, :xm].copy()
            px[:y1, :xm] = 0
            sub = px[a.abbassa:a.abbassa + y1, :xm]
            m = up[..., 3:4] > 0
            px[a.abbassa:a.abbassa + y1, :xm] = np.where(m, up, sub)
            fr['px'] = px[a.abbassa:]
        if i == 2:   # tuffo: in aria
            px = fr['px']
            fr['px'] = np.concatenate([px, np.zeros((a.volo,) + px.shape[1:], px.dtype)], 0)
        frames.append(fr)
    cw, ch = write_sheet(os.path.join(DIR, 'fabio-special.png'), frames)
    print('fabio-special.png: 4 pose, scala %.3f, celle %dx%d' % (a.scala, cw, ch))

    w = key(os.path.join(DIR, 'sorgenti', 'onda.jpeg'))
    H = w.shape[0]
    big = max(f['mask'].sum() for f in figures(w))
    parts = sorted([f for f in figures(w) if f['mask'].sum() > 0.05 * big], key=lambda f: f['x0'])
    # i detriti staccati appartengono all'onda piu' vicina (a sinistra del loro centro)
    waves = [p for p in parts if p['y1'] > 0.55 * H and p['x1'] - p['x0'] > 0.06 * w.shape[1]]
    if len(waves) != 3:
        sys.exit('ERRORE: attese 3 onde, trovate %d. Nessun file scritto.' % len(waves))
    masks = [p['mask'].copy() for p in waves]
    for p in figures(w):
        if any(p is q for q in waves):
            continue
        cx = (p['x0'] + p['x1']) / 2
        j = max([j for j, q in enumerate(waves) if q['x0'] - 20 <= cx] or [0])
        masks[j] |= p['mask']
    out = []
    for m in masks:
        fr = frame_from_mask(w, m, a.scala)
        fr['px'] = fr['px'][:, ::-1].copy()
        # la coda di detriti dell'onda piu' grande e' tagliata dal bordo del disegno: la sfumo
        w0 = fr['px'].shape[1]
        ramp = np.clip(np.arange(w0) / (0.3 * w0), 0, 1)
        fr['px'][..., 3] *= ramp[None, :]
        fr['px'][fr['px'][..., 3] < 8] = 0
        fr['ax'] = fr['px'].shape[1] / 2
        out.append(fr)
    cw, ch = write_sheet(os.path.join(DIR, 'fabio-shock.png'), out, top=1, bot=1)
    print('fabio-shock.png: 3 onde, celle %dx%d' % (cw, ch))


if __name__ == '__main__':
    main()
