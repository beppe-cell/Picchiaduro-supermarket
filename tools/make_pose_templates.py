"""Genera in docs/sprite-guide/ i 3 fogli da dare a Gemini per un nuovo personaggio
(la mossa speciale e' esclusa: e' unica per ogni personaggio e si fa a parte):
  guida-<X>-<titolo>.png    griglia vuota: sfondo magenta, caselle, linea dei piedi e della testa
  esempio-<X>-<titolo>.png  la stessa griglia con le pose di Matteo, da far ridisegnare
Le linee guida e le etichette sono in ciano puro: tools/build_character.py le toglie da solo.
La disposizione viene da tools/pose_layout.json.  Uso: python3 -B tools/make_pose_templates.py"""
import json
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(__file__)
LAYOUT = json.load(open(os.path.join(HERE, 'pose_layout.json')))
OUT = os.path.join(HERE, '..', 'docs', 'sprite-guide')
CHARS = os.path.join(HERE, '..', 'assets', 'characters')
MAGENTA, CYAN = (255, 0, 255), (0, 255, 255)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

# pose di esempio: (file sprite di Matteo, numero di frame nel foglio, frame da usare)
EXAMPLE = {
    'idle': ('matteo-idle', 1, 0), 'walk': ('matteo-walk', 2, 1),
    # stacco: la preparazione al salto dalla tavola originale (nel foglio di gioco c'e' la guardia)
    'jump_up': ('src', 'matteo', 5414, 0), 'jump_tuck': ('matteo-jump', 3, 1),
    'crouch': ('matteo-crouch', 1, 0), 'block': ('matteo-block', 1, 0),
    'punch_0': ('matteo-punch', 5, 0), 'punch_1': ('matteo-punch', 5, 1),
    'kick_0': ('matteo-kick', 5, 0), 'kick_1': ('matteo-kick', 5, 1),
    'heavy_0': ('matteo-heavy', 5, 1), 'heavy_1': ('matteo-heavy', 5, 2),
    'hit': ('matteo-hit', 1, 0), 'fall': ('matteo-fall', 3, 2),
    'win_0': ('matteo-win', 3, 0), 'win_1': ('matteo-win', 3, 2), 'ko': ('matteo-ko', 1, 0),
}


def cell_box(c):
    """(x0, y0, x1, y1) della casella c in pixel del foglio."""
    s = LAYOUT['sheet']
    cw, ch = s['w'] / s['cols'], s['h'] / s['rows']
    x0, y0 = c['col'] * cw, c['row'] * ch
    return x0, y0, x0 + cw * c.get('span', 1), y0 + ch


def frame(name, n, i, *rest):
    """Frame i del foglio sprite name (n frame), ritagliato sui pixel visibili.
    ('src', personaggio, tavola, figura): figura presa dalla tavola originale in sorgenti/,
    portata alla scala degli sprite (in piedi = 400 px)."""
    if name == 'src':
        import sys
        sys.path.insert(0, HERE)
        from spritekey import key, figures
        from spritebuild import frame_from_mask, SPRITE_H
        o = key(os.path.join(CHARS, n, 'sorgenti', 'IMG_%d.JPG' % i))
        f = figures(o)[rest[0]]
        stand = max(g['y1'] - g['y0'] for g in figures(key(os.path.join(CHARS, n, 'sorgenti', 'IMG_5408.JPG'))))
        r = frame_from_mask(o, f['mask'], SPRITE_H / stand * 1.10)  # tavola salto disegnata ~10% piu' piccola
        return Image.fromarray(np.clip(r['px'], 0, 255).astype(np.uint8), 'RGBA')
    im = Image.open(os.path.join(CHARS, name.split('-')[0], name + '.png')).convert('RGBA')
    w = im.width // n
    f = im.crop((i * w, 0, (i + 1) * w, im.height))
    return f.crop(f.getbbox())


def draw_guides(img, cells):
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 15)
    g = LAYOUT['guides']
    for c in cells:
        x0, y0, x1, y1 = cell_box(c)
        h = y1 - y0
        d.rectangle([x0 + 1, y0 + 1, x1 - 2, y1 - 2], outline=CYAN, width=3)
        fy = y0 + g['feet'] * h
        d.line([x0 + 12, fy, x1 - 12, fy], fill=CYAN, width=3)
        hy = y0 + g['head'] * h
        if not c.get('lying') and not c.get('object'):
            for x in range(int(x0 + 12), int(x1 - 12), 18):
                d.line([x, hy, min(x + 9, x1 - 12), hy], fill=CYAN, width=2)
        d.text((x0 + 12, fy + 3), c['label'] + '   >> guarda a destra', fill=CYAN, font=font)


def main():
    os.makedirs(OUT, exist_ok=True)
    s, g = LAYOUT['sheet'], LAYOUT['guides']
    ch = s['h'] / s['rows']
    stand = (g['feet'] - g['head']) * ch          # altezza in piedi voluta nella casella
    k = stand / frame(*EXAMPLE['idle']).height    # scala comune per tutte le pose di esempio
    for key, sh in LAYOUT['sheets'].items():
        base = '%s-%s' % (key, sh['title'].lower())
        guide = Image.new('RGB', (s['w'], s['h']), MAGENTA)
        draw_guides(guide, sh['cells'])
        guide.save(os.path.join(OUT, 'guida-%s.png' % base))
        ex = Image.new('RGBA', (s['w'], s['h']), MAGENTA + (255,))
        for c in sh['cells']:
            f = frame(*EXAMPLE[c['id']])
            x0, y0, x1, y1 = cell_box(c)
            # scala comune; solo una posa che non entra nella casella (es. carrello sopra la testa)
            # viene rimpicciolita quanto basta
            room_h = g['feet'] * (y1 - y0) - 6
            kk = min(k, room_h / f.height, (x1 - x0 - 16) / f.width)
            f = f.resize((max(1, round(f.width * kk)), max(1, round(f.height * kk))), Image.LANCZOS)
            if c.get('object'):
                y = int((y0 + y1) / 2 - f.height / 2)
            else:
                y = int(y0 + g['feet'] * (y1 - y0)) - f.height
            ex.alpha_composite(f, (int((x0 + x1) / 2 - f.width / 2), max(int(y0) + 4, y)))
        ex = ex.convert('RGB')
        draw_guides(ex, sh['cells'])
        ex.save(os.path.join(OUT, 'esempio-%s.png' % base))
        print('foglio', key, sh['title'], '->', 'guida-%s.png' % base, 'esempio-%s.png' % base)


if __name__ == '__main__':
    main()
