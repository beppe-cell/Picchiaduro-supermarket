"""Genera i fogli sprite di VLAD da assets/characters/vlad/sorgenti/IMG_54xx.JPG (sfondo magenta).
Uso: python3 tools/build_vlad_sprites.py

Tavole: 5422 riferimento (non usata) · 5424 guardia/camminata · 5426 calcio · 5429 spruzzino (speciale)
5430 nuvola dello spruzzino (proiettile) · 5433 colpito/caduta · 5434 KO · 5435 vittoria · 5437 accovacciato + pugno
Mancano pose dedicate per salto e parata: si riusano pose simili (vedi sotto)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from spritebuild import Builder, SPRITE_H

K = SPRITE_H / 786       # altezza in piedi nelle tavole: 786px
# scale misurate sulla larghezza del ciuffo biondo (~124px nelle tavole standard)
K_5437 = K * 124 / 109   # tavola accovacciato/pugno disegnata piu piccola
K_KO = K * 124 / 209     # tavola KO disegnata piu grande

b = Builder('vlad', 'assets/characters/vlad/sorgenti/', 'assets/characters/vlad/', K)
fig, sheet = b.fig, b.sheet

idle0, guard1, walk2 = fig(5424, 0), fig(5424, 1), fig(5424, 2)
crouch0, punch1 = fig(5437, 0, K_5437), fig(5437, 1, K_5437)   # il 3o frame di 5437 e' tagliato sul bordo
k = [fig(5426, i) for i in range(3)]

sheet('idle', [idle0])                                    # respiro fatto in gioco (leggero bob)
sheet('walk', [idle0, walk2])
sheet('punch', [idle0, punch1, punch1, punch1, idle0])
sheet('heavy', [crouch0, crouch0, punch1, punch1, idle0])  # carica accovacciato e scatta col pugno
sheet('kick', [k[0], k[1], k[1], k[1], k[2]])
# speciale: estrae lo spruzzino, mira, spruzza. Nella tavola la 2a e la 3a figura si toccano con gli
# stivali: la 2a si ritaglia a gradini (busto e spruzzino < x828, gamba < x760, stivale < x790).
aim = fig(5429, 1, keep=lambda yy, xx: xx < ((yy < 560) * 828 + ((yy >= 560) & (yy < 690)) * 760 + (yy >= 690) * 790))
sheet('special', [fig(5429, 0), aim, aim])
sheet('jump', [k[0], k[0], idle0])                         # nessuna tavola salto: ginocchio alto, poi guardia
sheet('block', [guard1])                                   # nessuna tavola parata: guardia frontale
sheet('crouch', [crouch0])
f = [fig(5433, i) for i in range(3)]
sheet('hit', [f[0]])
sheet('fall', f)
sheet('ko', [fig(5434, 0, K_KO)])
sheet('win', [fig(5435, i) for i in range(2)])
# proiettile: nuvola dello spruzzino (sbuffo iniziale, getto, nube che si allarga)
sheet('spray', [fig(5430, i) for i in range(3)], top=1, bot=1)
