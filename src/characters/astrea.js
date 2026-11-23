/* ASTREA - personaggio n. 12 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* ASTREA (mini boss): pose da tools/build_character.py, speciale da tools/build_special.py --pose 3 e rotolo di
   scontrino da tools/build_astrea_special.py. Bassa (sc). Il rotolo vola dritto dalla mano e si srotola (pjg);
   pjr = x del rotolo nella cella: il rotolo, davanti, e' il punto che colpisce, la carta resta dietro */
character({
  n:'ASTREA',ms:'ROTOLO DI SCONTRINO',sp:1.45,pw:1.05,
  sprites:{d:'astrea',sc:.9,n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2}},
  special:lancio({oggetto:'astrea-receipt', fotogrammi:3, cresce:1, alto:17.6, y:-8.7, punta:244, uscita:[35,-77], tempi:[5,11]}),
  price:3000,
  boss:{order:3,lv:4}
})
