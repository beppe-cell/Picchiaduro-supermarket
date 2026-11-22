"""Mossa speciale "lancio di un oggetto" da un foglio Gemini su due righe (sfondo magenta), per qualsiasi
personaggio o skin:
  in alto 3 pose (oggetto in mano, carica, braccia tese dopo il lancio);
  in basso l'oggetto in volo 3 volte (dritto, inclinato, capovolto), con linee di movimento e pezzi
  staccati (monete, briciole...) che si uniscono all'oggetto piu' vicino.
Scrive nella cartella di uscita:
  <nome>-special.png   le 3 pose alla scala degli altri sprite (--scala: quella stampata da
                       tools/build_character.py per i fogli pose);
  <proiettile>.png     3 celle uguali con l'oggetto centrato (in gioco i fotogrammi si ripetono e
                       l'oggetto gira in aria).
Stampa i valori per SPRSET (pjn, pjh, pjy). I bordi dell'immagine (righe scure a tutta lunghezza) si tolgono.

Uso: python3 -B tools/build_throw_special.py <nome> <foglio> <proiettile> [--out CARTELLA]
         [--scala 1.2] [--largo 150] [--sc 1]
Esempio: python3 -B tools/build_throw_special.py karma assets/characters/karma/sorgenti/speciale.jpeg \\
         karma-cassa --scala 1.208 --sc .9"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spritekey import key, figures                                  # noqa: E402
from spritebuild import frame_from_mask, write_sheet, SPRITE_H      # noqa: E402

SPR_WORLD = 0.55 * 384 / 2      # altezza in gioco di uno sprite alto SPRITE_H (SPR_H in index.html)


def gap(f, g):
    """distanza tra i riquadri di due figure (0 se si toccano)"""
    dx = max(g['x0'] - f['x1'], f['x0'] - g['x1'], 0)
    dy = max(g['y0'] - f['y1'], f['y0'] - g['y1'], 0)
    return max(dx, dy)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('name')
    ap.add_argument('sheet')
    ap.add_argument('proj', help='nome del file del proiettile senza estensione (es. karma-cassa)')
    ap.add_argument('--out', help='cartella di uscita (predefinita assets/characters/<nome>/)')
    ap.add_argument('--scala', type=float, default=1.2, help='scala delle pose (come i fogli pose)')
    ap.add_argument('--largo', type=float, default=150, help="larghezza dell'oggetto dritto in volo, px sprite")
    ap.add_argument('--sc', type=float, default=1.0, help='scala del personaggio in SPRSET (sc)')
    a = ap.parse_args()
    dst = a.out or os.path.join(HERE, '..', 'assets', 'characters', a.name)
    o = key(a.sheet)
    H = o.shape[0]
    for sl in (np.s_[:6, :], np.s_[-6:, :], np.s_[:, :6], np.s_[:, -6:]):
        o[sl + (3,)] = 0
    allf = figures(o)
    big = max(f['mask'].sum() for f in allf)
    main_f = [f for f in allf if f['mask'].sum() > 0.08 * big]
    top = sorted([f for f in main_f if (f['y0'] + f['y1']) / 2 < H / 2], key=lambda f: f['x0'])
    bot = sorted([f for f in main_f if (f['y0'] + f['y1']) / 2 >= H / 2], key=lambda f: f['x0'])
    if len(top) != 3 or len(bot) != 3:
        sys.exit('ERRORE: attese 3 pose e 3 oggetti, trovati %d e %d. Nessun file scritto.' % (len(top), len(bot)))
    for f in allf:
        if any(f is g for g in top + bot) or f['y1'] - f['y0'] > 0.3 * H:
            continue
        row = top if (f['y0'] + f['y1']) / 2 < H / 2 else bot
        g = min(row, key=lambda g: gap(f, g))
        if gap(f, g) < 60:
            g['mask'] = g['mask'] | f['mask']
    frames = [frame_from_mask(o, f['mask'], a.scala) for f in top]
    cw, ch = write_sheet(os.path.join(dst, '%s-special.png' % a.name), frames)
    print('%s-special.png: 3 pose, scala %.3f, celle %dx%d' % (a.name, a.scala, cw, ch))

    k = a.largo / (bot[0]['x1'] - bot[0]['x0'])
    bf = []
    for g in bot:
        fr = frame_from_mask(o, g['mask'], k)['px']
        # centro dell'oggetto = centro dei pixel piu' scuri (il corpo), non di linee e pezzi staccati
        R, G, B, A = (fr[..., i] for i in range(4))
        solid = (A > 128) & (np.maximum(np.maximum(R, G), B) < 120)
        if solid.sum() < 50:
            solid = A > 128
        ys, xs = np.where(solid)
        bf.append((fr, xs.mean(), ys.mean()))
    hw = max(max(cx, fr.shape[1] - cx) for fr, cx, cy in bf) + 2
    hh = max(max(cy, fr.shape[0] - cy) for fr, cx, cy in bf) + 2
    cw, ch = int(np.ceil(2 * hw)), int(np.ceil(2 * hh))
    out = np.zeros((ch, cw * 3, 4), np.float32)
    for i, (fr, cx, cy) in enumerate(bf):
        x, y = int(round(i * cw + hw - cx)), int(round(hh - cy))
        out[y:y + fr.shape[0], x:x + fr.shape[1]] = fr
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(dst, a.proj + '.png'), optimize=True)
    kw = SPR_WORLD / SPRITE_H * a.sc
    print('%s.png: 3 fotogrammi, celle %dx%d, scala %.3f' % (a.proj, cw, ch, k))
    print("SPRSET: pj:'%s',pjn:3,pjh:%.1f,pjy:%.1f" % (a.proj, ch * kw, -hh * kw))


if __name__ == '__main__':
    main()
