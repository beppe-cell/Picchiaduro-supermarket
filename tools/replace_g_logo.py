"""Sostituisce la "G" bianca del logo sulle divise (felpa rossa, gilet nero, cappellino di FABIO)
con una "S" (il gioco si chiama SUPERRISSA) in tutti gli sprite dei personaggi.

Come trova la G: gruppi di pixel bianchi piccoli (la G e' disegnata a pixel, circa 12x16, a volte in 2-3
pezzi), circondati dalla stoffa (rosso della felpa o nero del gilet), con la forma della G: si confronta
il gruppo, ridotto a una griglia 6x8, con la G di riferimento (presa da beppe-front.png) e con le sue
versioni ruotate (pose a terra) e specchiate. Occhi, maniche bianche e dita non le somigliano; i cartellini e le fibbie
(anelli bianchi chiusi, con un buco dentro) si scartano, la G e' aperta.
Come la sostituisce: copre la G con la stoffa intorno (riempimento dai bordi, con le pieghe) e disegna
nel suo riquadro una S a blocchi, con lo stesso spessore di tratto e lo stesso bianco, nello stesso
verso della G (dritta, ruotata o specchiata).

Uso: python3 -B tools/replace_g_logo.py [nomi...] [--prova DIR] [--soglia 0.3]
  senza nomi: tutti i personaggi (e le skin); --prova scrive in DIR un foglio di controllo per
  personaggio con i riquadri trovati e non tocca gli sprite. Poi python3 -B tools/to_webp.py."""
import argparse
import glob
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'characters')
GW, GH = 6, 8
# G che il riconoscimento automatico non prende (coperte in parte da un braccio, su un bordo, gia'
# mezze cancellate): posizione (x, y) dell'angolo in alto a sinistra dei pixel bianchi nel foglio.
# Trovate con --prova --soglia 0.5 e controllate una per una.
FORZA = {
    'andrei-kick': [(158, 141)], 'angel-jump': [(431, 115)],
    'beppe-idle': [(113, 112), (293, 112), (477, 112), (657, 112)],
    'beppe-kick': [(561, 109), (925, 109), (1289, 109)], 'fabio-block': [(105, 11)],
    'fabio-kick': [(479, 122), (797, 122), (1115, 122)], 'hela-jump': [(337, 114)],
    'matteo-kick': [(159, 112), (441, 119), (737, 119), (1033, 119)], 'matteo-walk': [(324, 122)],
    'matteo-win': [(162, 131)], 'porte-heavy': [(1212, 128)], 'porte-idle': [(102, 128)],
    'porte-kick': [(1374, 128)], 'porte-punch': [(1509, 132)], 'porte-special': [(174, 236)],
    'porte-walk': [(120, 128)], 'porte-win': [(186, 139)], 'vlad-block': [(104, 105)],
    'zanna-win': [(390, 134)],
}


def white(a):
    R, G, B, A = (a[..., i].astype(int) for i in range(4))
    mx, mn = np.maximum(np.maximum(R, G), B), np.minimum(np.minimum(R, G), B)
    return (A > 128) & (mn > 165) & (mx - mn < 60)


def cloth(a):
    R, G, B, A = (a[..., i].astype(int) for i in range(4))
    red = (R > 80) & (R > 2.3 * G) & (R > 1.8 * B)
    dark = (R + G + B < 200)
    return (A > 128) & (red | dark)


def grid(m):
    """maschera -> griglia GWxGH di frazioni (forma normalizzata)"""
    im = Image.fromarray((m * 255).astype(np.uint8))
    return np.asarray(im.resize((GW, GH), Image.BILINEAR), float) / 255


def to_canon(m, k, flip):
    """porta la maschera nel verso dritto della G: specchio (flip) e poi k rotazioni di 90 gradi"""
    return np.rot90(m[:, ::-1] if flip else m, k)


def from_canon(m, k, flip):
    m = np.rot90(m, -k)
    return m[:, ::-1] if flip else m


def reference():
    a = np.asarray(Image.open(os.path.join(ROOT, 'beppe', 'beppe-front.png')).convert('RGBA'))
    m = white(a[110:132, 120:138])
    ys, xs = np.where(m)
    return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def s_glyph(h, w, t):
    """S a blocchi alta h, larga w, tratto t (stesso disegno della G: barre piene, angoli squadrati)"""
    m = np.zeros((h, w), bool)
    mid = (h - t) // 2
    m[:t, :] = True                 # barra in alto
    m[:mid + t, :t] = True          # verticale in alto a sinistra
    m[mid:mid + t, :] = True        # barra in mezzo
    m[mid:, w - t:] = True          # verticale in basso a destra
    m[h - t:, :] = True             # barra in basso
    m[:t, 0] = m[h - t:, w - 1] = True
    # punte arrotondate come nella G: via gli spigoli esterni
    m[0, 0] = m[h - 1, w - 1] = False
    return m


def fill(px, m, it=60):
    out = px[..., :3].astype(float)
    known = ~m
    k = np.ones((3, 3))
    for _ in range(it):
        if known.all():
            break
        s = np.stack([nd.convolve(out[..., c] * known, k, mode='nearest') for c in range(3)], -1)
        n = nd.convolve(known.astype(float), k, mode='nearest')
        new = (~known) & (n > 0)
        out[new] = s[new] / n[new][:, None]
        known |= new
    return out


def g_parts(m):
    """la struttura della G nel verso dritto: lato sinistro pieno, barre in alto e in basso,
    apertura a destra sopra la meta', gamba a destra sotto, centro vuoto. Frazioni 0-1 per zona."""
    b = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((8, 10), Image.BILINEAR), float) / 255 > 0.35
    z = lambda r0, r1, c0, c1: b[r0:r1, c0:c1].mean()
    return dict(sx=z(2, 8, 0, 2), su=z(0, 2, 2, 8), giu=z(8, 10, 2, 8), apre=z(2, 4, 5, 8),
                dx=z(4, 8, 6, 8), barra=z(4, 6, 4, 8), centro=z(2, 8, 2, 4))


def is_g(m):
    p = g_parts(m)
    return (p['sx'] >= 0.5 and p['su'] >= 0.35 and p['giu'] >= 0.35 and p['apre'] <= 0.5
            and p['dx'] >= 0.35 and p['barra'] >= 0.25 and p['centro'] <= 0.55)


def is_g_parziale(p):
    """G coperta in parte (da un braccio, da una piega): resta la C con l'apertura a destra"""
    return p['sx'] >= 0.5 and p['su'] >= 0.3 and p['apre'] <= 0.5 and p['centro'] <= 0.5


def find(a, ref, soglia, ruota=False, forza=()):
    w = white(a)
    lab, n = nd.label(nd.binary_dilation(w, iterations=2))
    found = []
    for i, sl in enumerate(nd.find_objects(lab)):
        m = (lab[sl] == i + 1) & w[sl]
        if not m.any():
            continue
        ys, xs = np.where(m)                # riquadro stretto sui pixel bianchi
        sl = (slice(sl[0].start + ys.min(), sl[0].start + ys.max() + 1),
              slice(sl[1].start + xs.min(), sl[1].start + xs.max() + 1))
        h, wd = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if not (7 <= max(h, wd) <= 26 and 5 <= min(h, wd) <= 22):
            continue
        m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        if (sl[1].start, sl[0].start) in forza:
            found.append(merge_parts(w, sl, m) + ((1.0, 0, 0),))
            continue
        if m.sum() < 18 or m.sum() > 0.8 * h * wd:
            continue
        hole = nd.binary_fill_holes(m) & ~m           # cartellini e fibbie: anello bianco chiuso
        if hole.sum() > 3:
            continue
        y0, x0 = max(sl[0].start - 3, 0), max(sl[1].start - 3, 0)
        y1, x1 = min(sl[0].stop + 3, a.shape[0]), min(sl[1].stop + 3, a.shape[1])
        ring = np.ones((y1 - y0, x1 - x0), bool)
        ring[sl[0].start - y0:sl[0].stop - y0, sl[1].start - x0:sl[1].stop - x0] = False
        op = ring & (a[y0:y1, x0:x1, 3] > 128)        # intorno, senza lo sfondo trasparente
        if (cloth(a[y0:y1, x0:x1]) & op).sum() < 0.5 * max(op.sum(), 1):
            continue
        if m.sum() > 0.6 * h * wd:      # blocchi bianchi pieni (mani, polsini, colletti)
            continue
        cand = []
        for k in (range(4) if ruota else (0,)):
            for f in ((0, 1) if ruota else (0,)):
                c = to_canon(m, k, f)
                sc = 1 - np.abs(grid(c) - ref).mean()
                if c.shape[0] < 0.9 * c.shape[1]:   # la G e' piu' alta che larga (la fibbia no)
                    continue
                dritta = k == 0 and f == 0
                if is_g(c) or (dritta and sc >= 0.55 and is_g_parziale(g_parts(c))):
                    cand.append((dritta, sc, k, f))
        # la G e' quasi sempre dritta: le altre direzioni (pose a terra) solo se dritta non lo e'
        best = max(cand)[1:] if cand else None
        if best and best[0] >= soglia:
            found.append(merge_parts(w, sl, m) + (best,))
    return found


def merge_parts(w, sl, m, pad=4):
    """aggiunge alla G i suoi pezzi bianchi staccati (a volte e' disegnata in 2 pezzi a 3 pixel di
    distanza): i pezzi interamente dentro il riquadro allargato di pad pixel"""
    y0, x0 = max(sl[0].start - pad, 0), max(sl[1].start - pad, 0)
    y1, x1 = min(sl[0].stop + pad, w.shape[0]), min(sl[1].stop + pad, w.shape[1])
    win = w[y0:y1, x0:x1]
    lab, n = nd.label(win)
    keep = np.zeros_like(win)
    keep[sl[0].start - y0:sl[0].stop - y0, sl[1].start - x0:sl[1].stop - x0] = m
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    for i in range(1, n + 1):
        if i not in border:
            keep |= lab == i
    ys, xs = np.where(keep)
    nsl = (slice(y0 + ys.min(), y0 + ys.max() + 1), slice(x0 + xs.min(), x0 + xs.max() + 1))
    return nsl, keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def replace(a, sl, m, best):
    y, x = sl[0].start, sl[1].start
    h, w = m.shape
    col = np.median(a[y:y + h, x:x + w][m][:, :3], 0)
    # spessore del tratto: lo spessore mediano dei tratti della G
    t = max(2, int(round(np.median(nd.distance_transform_edt(m)[m]) * 2)))
    t = min(t, max(2, min(h, w) // 3))
    _, k, flip = best
    P = 5                              # margine: i pezzi della G staccati restano qui dentro
    region = a[max(y - P, 0):y + h + P, max(x - P, 0):x + w + P]
    oy, ox = y - max(y - P, 0), x - max(x - P, 0)
    mm = np.zeros(region.shape[:2], bool)
    # via la G e i suoi bordi sfumati (rosati sulla felpa, grigi sul gilet): i pixel piu' chiari
    # della stoffa intorno che toccano la G (anche i pezzi staccati di 1-2 pixel)
    lum = region[..., :3].astype(float) @ [0.3, 0.59, 0.11]
    box = np.zeros(region.shape[:2], bool)
    box[max(oy - 1, 0):oy + h + 1, max(ox - 1, 0):ox + w + 1] = True
    edge = np.zeros(region.shape[:2], bool)
    edge[max(oy - 3, 0):oy + h + 3, max(ox - 3, 0):ox + w + 3] = True
    stoffa = np.median(lum[edge & ~box]) if (edge & ~box).any() else lum.min()
    mm[oy:oy + h, ox:ox + w] = nd.binary_dilation(m, iterations=1)
    light = (lum > stoffa + 25) & (region[..., 3] > 128)
    lab, _ = nd.label(light)
    near = nd.binary_dilation(mm, iterations=2)
    ids = [i for i in np.unique(lab[near & light]) if i]
    # solo pezzi piccoli (avanzi della G): maniche e colletti bianchi vicini restano
    ids = [i for i in ids if ((lab == i) & ~box).sum() <= 30]
    grow = np.isin(lab, ids) & edge
    mm |= nd.binary_dilation(grow, iterations=1) & edge
    region[..., :3] = np.clip(fill(region, mm), 0, 255).astype(np.uint8)
    ch, cw = to_canon(m, k, flip).shape
    s = from_canon(s_glyph(ch, cw, t), k, flip)
    s = s[:h, :w]
    reg = a[y:y + s.shape[0], x:x + s.shape[1]]
    reg[s, :3] = col
    reg[s, 3] = 255


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('names', nargs='*')
    ap.add_argument('--prova')
    ap.add_argument('--soglia', type=float, default=0.3)
    a = ap.parse_args()
    ref = grid(reference())
    names = a.names or sorted(os.listdir(ROOT))
    for name in names:
        pngs = sorted(glob.glob(os.path.join(ROOT, name, name + '-*.png')) +
                      glob.glob(os.path.join(ROOT, name, 'skin-*', '*.png')))
        pngs = [p for p in pngs if not p.endswith('-anteprima.png')]
        sheet, tot = [], 0
        for p in pngs:
            im = np.asarray(Image.open(p).convert('RGBA')).copy()
            ruota = os.path.basename(p).split('-')[-1][:-4] in ('fall', 'ko')   # a terra: G anche girata
            f = find(im, ref, a.soglia, ruota, FORZA.get(os.path.basename(p)[:-4], ()))
            tot += len(f)
            if a.prova:
                v = Image.fromarray(im)
                d = ImageDraw.Draw(v)
                for sl, m, b in f:
                    d.rectangle((sl[1].start - 2, sl[0].start - 2, sl[1].stop + 1, sl[0].stop + 1), outline=(0, 255, 0, 255))
                    d.text((sl[1].stop + 3, sl[0].start), '%.2f' % b[0], fill=(0, 255, 0, 255))
                sheet.append(v)
            elif f:
                for sl, m, b in f:
                    replace(im, sl, m, b)
                Image.fromarray(im).save(p, optimize=True)
        print('%s: %d G in %d fogli' % (name, tot, len(pngs)))
        if a.prova and sheet:
            W = max(s.width for s in sheet)
            H = sum(s.height for s in sheet)
            out = Image.new('RGBA', (W, H), (70, 70, 70, 255))
            yy = 0
            for s in sheet:
                out.alpha_composite(s, (0, yy))
                yy += s.height
            os.makedirs(a.prova, exist_ok=True)
            out.save(os.path.join(a.prova, name + '.png'))


if __name__ == '__main__':
    main()
