"""Strumenti comuni per generare i fogli sprite dei personaggi dalle tavole su sfondo magenta.

Formato prodotto (quello letto da index.html, SPRSET): un PNG per animazione, <nome>-<animazione>.png,
frame affiancati a larghezza uguale, personaggio rivolto a destra, piedi sul bordo inferiore,
corpo in piedi alto circa 400 px. I frame sono allineati sul busto, cosi' non "ballano".
"""
import os
import numpy as np
from PIL import Image
from spritekey import key, figures

SPRITE_H = 400
LEFT_PAD = 2


class Builder:
    def __init__(self, name, src, dst, k, prep=None):
        """name: prefisso dei file; src: cartella delle tavole IMG_<n>.JPG; dst: cartella di uscita;
        k: fattore di scala standard (SPRITE_H / altezza in piedi nelle tavole);
        prep: funzione opzionale (img, rgba) -> rgba per ritoccare una tavola prima della segmentazione."""
        self.name, self.src, self.dst, self.k, self.prep = name, src, dst, k, prep
        self._cache = {}

    def _sheet(self, img):
        if img not in self._cache:
            o = key(os.path.join(self.src, 'IMG_%d.JPG' % img))
            if self.prep:
                o = self.prep(img, o)
            self._cache[img] = (o, figures(o))
        return self._cache[img]

    def fig(self, img, i, k=None, keep=None):
        """Figura i-esima (ordinate da sinistra) della tavola img, scalata di k.
        keep: funzione (yy, xx) -> maschera booleana in coordinate della tavola, per separare
        figure che si toccano."""
        k = k or self.k
        o, fs = self._sheet(img)
        m = fs[i]['mask']
        if keep is not None:
            yy, xx = np.mgrid[:o.shape[0], :o.shape[1]]
            m = m & keep(yy, xx)
        ys, xs = np.where(m & (o[..., 3] > 40))
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        c = o.copy()
        c[..., 3] *= m
        c = c[y0:y1 + 1, x0:x1 + 1]
        h, w = c.shape[:2]
        a = c[..., 3:4] / 255.0
        pm = np.concatenate([c[..., :3] * a, c[..., 3:4]], -1)  # alpha premoltiplicata per il resize
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

    def sheet(self, anim, frames, top=3, bot=2, fname=None, left=False):
        """left=True (proiettili): ogni frame appoggiato al bordo sinistro della cella e centrato in
        verticale, cosi' il punto di partenza (es. la punta del getto) coincide con x=LEFT_PAD.
        Se un frame ha 'ay' (y del punto di partenza), quel punto finisce esattamente a meta' altezza."""
        H = max(f['px'].shape[0] for f in frames) + top + bot
        if left and all('ay' in f for f in frames):
            H = 2 * int(max(max(f['ay'], f['px'].shape[0] - f['ay']) for f in frames)) + 4
        if left:
            cw = max(f['px'].shape[1] for f in frames) + LEFT_PAD + 2
        else:
            half = int(max(max(f['ax'], f['px'].shape[1] - f['ax']) for f in frames)) + 3
            cw = 2 * half
        out = np.zeros((H, cw * len(frames), 4), np.float32)
        for i, f in enumerate(frames):
            h, w = f['px'].shape[:2]
            if left:
                x, y = i * cw + LEFT_PAD, int(round(H / 2 - f['ay'])) if 'ay' in f else (H - h) // 2
            else:
                x, y = i * cw + int(round(half - f['ax'])), H - bot - h
            out[y:y + h, x:x + w] = f['px']
        path = os.path.join(self.dst, fname or '%s-%s.png' % (self.name, anim))
        Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save(path, optimize=True)
        print(anim, len(frames), 'x', (cw, H))
