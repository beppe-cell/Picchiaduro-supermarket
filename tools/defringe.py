"""Toglie l'alone chiaro sul contorno degli sprite (residuo di uno sfondo bianco o grigio chiaro):
rende trasparenti, a strati dal bordo verso l'interno, i pixel chiari e poco saturi che toccano la
trasparenza. Si ferma al primo pixel scuro o colorato (il contorno nero del disegno), quindi i
bianchi interni (G, cartellino, occhiali, camicia) restano. Al massimo --strati passate.
Uso: python3 -B tools/defringe.py FILE.png [...] [--strati 4]"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage as nd


def harden(path):
    """Bordo netto da pixel art: alfa tutto o niente (soglia 128) e, sul contorno, via i pixel
    grigio medio quasi neutri rimasti dall'alone sfumato. Il contorno nero (scuro) resta."""
    a = np.asarray(Image.open(path).convert('RGBA')).astype(np.int32)
    R, G, B = (a[..., i] for i in range(3))
    mx, mn = np.maximum(np.maximum(R, G), B), np.minimum(np.minimum(R, G), B)
    alpha = np.where(a[..., 3] >= 128, 255, 0)
    edge = nd.binary_dilation(alpha == 0) & (alpha > 0)
    gray = (mn > 58) & (mx - mn < 22)
    kill = edge & gray
    alpha[kill] = 0
    out = a.copy()
    out[..., 3] = alpha
    out[alpha == 0] = 0
    Image.fromarray(out.astype(np.uint8), 'RGBA').save(path, optimize=True)
    return int(kill.sum())


def defringe(path, layers=4):
    a = np.asarray(Image.open(path).convert('RGBA')).astype(np.int32)
    R, G, B, A = (a[..., i] for i in range(4))
    mx, mn = np.maximum(np.maximum(R, G), B), np.minimum(np.minimum(R, G), B)
    # bianco e grigio chiaro, piu' il grigio medio quasi neutro dell'alone sfumato del JPEG
    light = ((mn > 120) & (mx - mn < 50)) | ((mn > 85) & (mx - mn < 18))
    alpha = A.copy()
    removed = 0
    for _ in range(layers):
        edge = nd.binary_dilation(alpha < 20) & (alpha >= 20)
        kill = edge & light
        if not kill.any():
            break
        alpha[kill] = 0
        removed += int(kill.sum())
    # puntini staccati: piccoli gruppi isolati di pixel soprattutto chiari
    lab, n = nd.label(alpha >= 20)
    if n:
        sizes = nd.sum(np.ones_like(alpha), lab, range(1, n + 1))
        lightf = nd.mean(light.astype(float), lab, range(1, n + 1))
        for i in np.where((sizes < 40) & (lightf > 0.3))[0]:
            m = lab == i + 1
            removed += int(m.sum())
            alpha[m] = 0
    out = a.copy()
    out[..., 3] = alpha
    out[alpha == 0] = 0
    Image.fromarray(out.astype(np.uint8), 'RGBA').save(path, optimize=True)
    return removed


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('files', nargs='+')
    ap.add_argument('--strati', type=int, default=4)
    a = ap.parse_args()
    for f in a.files:
        print(f, 'pixel di alone tolti:', defringe(f, a.strati))
