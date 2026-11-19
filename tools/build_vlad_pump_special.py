"""Mossa speciale della skin VLAD IN PUMP: lancio del manubrio.

Sorgente: assets/characters/vlad/skin-pump/sorgenti/speciale.jpeg (sfondo magenta), su due righe:
  in alto 3 pose (manubrio sulla spalla, carica, braccio teso dopo il lancio);
  in basso il manubrio in volo 3 volte (dritto, inclinato, verticale), con linee di movimento a sinistra.
Scrive in assets/characters/vlad/skin-pump/:
  vlad-special.png  le 3 pose alla scala degli altri sprite della skin (--scala, quella stampata da
                    tools/build_character.py per i fogli pose della skin);
  vlad-spray.png    il proiettile (stesso nome del proiettile di Vlad, cosi' la skin lo sostituisce):
                    3 celle uguali con il manubrio centrato; in gioco i fotogrammi si ripetono e il
                    manubrio sembra girare in aria. Le linee di movimento staccate si uniscono al
                    manubrio alla loro destra.
Stampa i valori pjh e pjy per l'ov della skin in SKINS (index.html).

Uso: python3 -B tools/build_vlad_pump_special.py [--scala 1.17] [--largo 120] [--sc 1.05]"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spritekey import key, figures                                  # noqa: E402
from spritebuild import frame_from_mask, write_sheet, SPRITE_H      # noqa: E402

DIR = os.path.join(HERE, '..', 'assets', 'characters', 'vlad', 'skin-pump')
SPR_WORLD = 0.55 * 384 / 2      # altezza in gioco di uno sprite alto SPRITE_H (SPR_H in index.html)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--scala', type=float, default=1.17, help='scala delle pose (come i fogli pose della skin)')
    ap.add_argument('--largo', type=float, default=120, help='larghezza del manubrio dritto in volo, px sprite')
    ap.add_argument('--sc', type=float, default=1.05, help='scala del personaggio in SPRSET (sc)')
    a = ap.parse_args()
    o = key(os.path.join(DIR, 'sorgenti', 'speciale.jpeg'))
    H = o.shape[0]
    # il disegno ha una riga scura lungo il bordo destro, attaccata alla terza posa: via i bordi
    o[:6, :, 3] = 0
    o[-6:, :, 3] = 0
    o[:, :6, 3] = 0
    o[:, -6:, 3] = 0
    allf = figures(o)
    big = max(f['mask'].sum() for f in allf)
    main_f = [f for f in allf if f['mask'].sum() > 0.08 * big]
    top = sorted([f for f in main_f if (f['y0'] + f['y1']) / 2 < H / 2], key=lambda f: f['x0'])
    bot = sorted([f for f in main_f if (f['y0'] + f['y1']) / 2 >= H / 2], key=lambda f: f['x0'])
    if len(top) != 3 or len(bot) != 3:
        sys.exit('ERRORE: attese 3 pose e 3 manubri, trovati %d e %d. Nessun file scritto.' % (len(top), len(bot)))
    # pezzi staccati: in alto (dita, manubrio) alla posa piu' vicina; in basso (linee) al manubrio a destra
    for f in allf:
        if any(f is g for g in top + bot):
            continue
        cx, cy = (f['x0'] + f['x1']) / 2, (f['y0'] + f['y1']) / 2
        if f['y1'] - f['y0'] > 0.3 * H:     # bordi e righe lunghe dell'immagine: non sono della figura
            continue
        if cy < H / 2:
            g = min(top, key=lambda g: abs((g['x0'] + g['x1']) / 2 - cx))
            if g['x0'] - 40 <= cx <= g['x1'] + 40:
                g['mask'] = g['mask'] | f['mask']
        else:
            right = [g for g in bot if g['x0'] >= cx - 20]
            if right:
                g = min(right, key=lambda g: g['x0'])
                g['mask'] = g['mask'] | f['mask']
    frames = [frame_from_mask(o, f['mask'], a.scala) for f in top]
    cw, ch = write_sheet(os.path.join(DIR, 'vlad-special.png'), frames)
    print('vlad-special.png: 3 pose, scala %.3f, celle %dx%d' % (a.scala, cw, ch))

    k = a.largo / (bot[0]['x1'] - bot[0]['x0'])
    bf = []
    for g in bot:
        fr = frame_from_mask(o, g['mask'], k)['px']
        # centro del manubrio = centro dei pixel scuri (dischi) e cromati, non delle linee di movimento
        R, G, B, A = (fr[..., i] for i in range(4))
        solid = (A > 128) & ((np.maximum(np.maximum(R, G), B) < 110) | ((abs(R - B) < 25) & (abs(R - G) < 25)))
        ys, xs = np.where(solid)
        bf.append((fr, xs.mean(), ys.mean()))
    hw = max(max(cx, fr.shape[1] - cx) for fr, cx, cy in bf) + 2
    hh = max(max(cy, fr.shape[0] - cy) for fr, cx, cy in bf) + 2
    cw, ch = int(np.ceil(2 * hw)), int(np.ceil(2 * hh))
    out = np.zeros((ch, cw * 3, 4), np.float32)
    for i, (fr, cx, cy) in enumerate(bf):
        x, y = int(round(i * cw + hw - cx)), int(round(hh - cy))
        out[y:y + fr.shape[0], x:x + fr.shape[1]] = fr
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(DIR, 'vlad-spray.png'), optimize=True)
    kw = SPR_WORLD / SPRITE_H * a.sc
    print('vlad-spray.png (manubrio): 3 fotogrammi, celle %dx%d, scala %.3f' % (cw, ch, k))
    print('ov: pjn:3,pjs:0,pji:0,pjh:%.1f,pjy:%.1f' % (ch * kw, -hh * kw))


if __name__ == '__main__':
    main()
