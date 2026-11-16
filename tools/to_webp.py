"""Converte gli sprite PNG dei personaggi nei WebP che il gioco carica davvero.

I PNG in assets/characters/<nome>/ restano i file di lavoro (li producono gli altri strumenti in
tools/); index.html carica i .webp accanto, circa 3 volte piu' leggeri a parita' di aspetto
(qualita' 90, trasparenza senza perdita). Va rilanciato dopo ogni modifica agli sprite.

Uso: python3 -B tools/to_webp.py [--tutti]
  senza opzioni converte solo i PNG piu' recenti del loro WebP; --tutti li rifa' tutti.
  Le anteprime (<nome>-anteprima.png) non servono al gioco e vengono saltate.
"""
import glob
import os
import sys

from PIL import Image

QUALITA = 90


def main():
    tutti = '--tutti' in sys.argv
    radice = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'characters')
    fatti = prima = dopo = 0
    for png in sorted(glob.glob(os.path.join(radice, '*', '*.png'))):
        if png.endswith('-anteprima.png'):
            continue
        webp = png[:-4] + '.webp'
        if tutti or not os.path.exists(webp) or os.path.getmtime(webp) < os.path.getmtime(png):
            Image.open(png).convert('RGBA').save(webp, 'WEBP', quality=QUALITA, alpha_quality=100, method=6)
            fatti += 1
        prima += os.path.getsize(png)
        dopo += os.path.getsize(webp)
    print(f'{fatti} convertiti; PNG {prima / 1e6:.1f} MB -> WebP {dopo / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
