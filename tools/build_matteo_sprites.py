"""Genera i fogli sprite di MATTEO da assets/characters/matteo/sorgenti/IMG_54xx.JPG (sfondo magenta).
Stesso formato di Beppe: 1 PNG per animazione, celle a larghezza uguale, rivolto a destra,
piedi sul bordo inferiore, corpo in piedi ~400px. Uso: python3 tools/build_matteo_sprites.py"""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from spritekey import key, figures, crop

SRC = 'assets/characters/matteo/sorgenti/'
DST = 'assets/characters/matteo/'
K = 400 / 797          # altezza in piedi nelle tavole (797px) -> 400px come Beppe
K_KO = 470 / 1138      # tavola KO disegnata piu grande: lunghezza disteso ~470px
# tavole disegnate piu piccole (misurato sulla larghezza dell'afro: ~150px nelle tavole standard)
K_SPECIAL = K * 150 / 115
K_JUMP = K * 1.10

_cache = {}
def fig(img, i, k=K):
    if img not in _cache:
        o = key(SRC + 'IMG_%d.JPG' % img)
        if img == 5413:  # rimuove le linee divisorie verticali (a tutta altezza) del foglio carrello
            col = (o[..., 3] > 40).sum(0) > 0.9 * o.shape[0]
            o[:, np.convolve(col, np.ones(9), 'same') > 0, 3] = 0
        _cache[img] = (o, figures(o))
    o, fs = _cache[img]
    c = crop(o, fs[i])
    h, w = c.shape[:2]
    a = c[..., 3:4] / 255.0
    pm = np.concatenate([c[..., :3] * a, c[..., 3:4]], -1)        # alpha premoltiplicata
    im = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), 'RGBA')
    im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    r = np.asarray(im).astype(np.float32)
    al = r[..., 3:4]
    rgb = np.where(al > 0, r[..., :3] * 255.0 / np.maximum(al, 1), 0)
    r = np.concatenate([np.clip(rgb, 0, 255), al], -1)
    r[r[..., 3] < 8] = 0
    # ancora orizzontale: mediana x dei pixel del busto (fascia 30-60% dell'altezza)
    band = r[int(r.shape[0] * .30):int(r.shape[0] * .60), :, 3] > 128
    ax = float(np.median(np.where(band)[1])) if band.any() else r.shape[1] / 2
    return dict(px=r, ax=ax)

def blend(a, b):
    """frame interpolato: media dei due frame allineati su ancora e piedi"""
    H = max(a['px'].shape[0], b['px'].shape[0])
    L = int(max(a['ax'], b['ax'])) + 2
    R = int(max(a['px'].shape[1] - a['ax'], b['px'].shape[1] - b['ax'])) + 2
    def place(f):
        c = np.zeros((H, L + R, 4), np.float32)
        h, w = f['px'].shape[:2]
        x = int(round(L - f['ax']))
        c[H - h:, x:x + w] = f['px']
        return c
    pa, pb = place(a), place(b)
    al = (pa[..., 3:4] + pb[..., 3:4]) / 2
    rgb = (pa[..., :3] * pa[..., 3:4] + pb[..., :3] * pb[..., 3:4]) / np.maximum(pa[..., 3:4] + pb[..., 3:4], 1)
    return dict(px=np.concatenate([rgb, al], -1), ax=float(L))

def sheet(name, frames, top=3, bot=2):
    H = max(f['px'].shape[0] for f in frames) + top + bot
    half = int(max(max(f['ax'], f['px'].shape[1] - f['ax']) for f in frames)) + 3
    cw = 2 * half
    out = np.zeros((H, cw * len(frames), 4), np.float32)
    for i, f in enumerate(frames):
        h, w = f['px'].shape[:2]
        x = i * cw + int(round(half - f['ax']))
        out[H - bot - h:H - bot, x:x + w] = f['px']
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save(DST + 'matteo-%s.png' % name, optimize=True)
    print(name, len(frames), 'x', (cw, H))

# niente frame interpolati (sovrapposizioni in trasparenza = effetto "mosso"):
# solo pose nitide; negli attacchi la posa di colpo compare gia' dal 2o frame per una risposta immediata
idle0, walk2 = fig(5408, 0), fig(5408, 2)
sheet('idle', [idle0])                                        # respiro fatto in gioco (leggero bob)
sheet('walk', [idle0, walk2])
p = [fig(5409, i) for i in range(3)]
sheet('punch', [p[0], p[1], p[1], p[1], p[2]])
k = [fig(5410, i) for i in range(3)]
sheet('kick', [k[0], k[1], k[1], k[1], k[2]])
h = [fig(5411, i) for i in range(3)]
sheet('heavy', [h[0], h[1], h[2], h[2], idle0])
sheet('special', [fig(5412, i, K_SPECIAL) for i in range(3)])  # spinge carrello, lo solleva, lancia
j = [fig(5414, i, K_JUMP) for i in range(4)]
# la posa di stacco (j[1]) ha il braccio tagliato nella tavola: stacco/atterraggio in guardia, raccolto all'apice
sheet('jump', [j[3], j[2], j[3]])
sheet('block', [fig(5415, 0)])
sheet('crouch', [fig(5415, 3)])
f = [fig(5416, i) for i in range(3)]
sheet('hit', [f[0]])
sheet('fall', f)
sheet('ko', [fig(5417, 0, K_KO)])
sheet('win', [fig(5418, i) for i in range(3)])
# proiettile: carrello che rotola (3 pose), stessa scala dei personaggi
sheet('cart', [fig(5413, i, K * .62) for i in range(3)], top=1, bot=1)
