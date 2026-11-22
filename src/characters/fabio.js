/* FABIO - personaggio n. 10 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* FABIO (mini boss, si compra nel negozio: PRZ): pose da tools/build_character.py, speciale e onda da
   tools/build_fabio_special.py. Molto alto (sc). Speciale piu' lunga delle altre (mv sostituisce MV.s):
   sale sulle forche del sollevatore, in alto, tuffo, pugni a terra al tick mv.su; li' nasce l'onda
   d'urto (pjt: sul pavimento; pjg: cresce), larga pjw quando colpisce, e lo schermo trema (shk) */
character({
  n:'FABIO',ms:'SCHIANTO DAL SOLLEVATORE',sp:1.3,pw:1.2,
  sprites:{d:'fabio',sc:1.08,n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:4,hit:1,fall:2,ko:1,win:2},pj:'fabio-shock',pjn:3,pjg:1,pjt:1,pjh:66,pjy:-64,pjw:56,pjo:[40,0],shk:14,mv:{su:24,ac:6,re:18},spT:[7,15,24]},
  price:2000,
  boss:{order:1,lv:4}
})
