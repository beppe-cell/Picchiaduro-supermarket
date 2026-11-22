/* ANGEL - personaggio n. 7 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* ANGEL: pose da tools/build_character.py, speciale da tools/build_special.py; corpo a corpo con
   dash = velocita' dello scatto in avanti e hop = spinta verso l'alto (volo in picchiata) */
character({
  n:'ANGEL',ms:'PICCHIATA ANGELICA',sp:1.6,pw:1,
  sprites:{d:'angel',n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:4,hit:1,fall:2,ko:1,win:2},ml:50,dash:4.2,hop:4.2,spT:[4,9,13]},
  price:2500,
  boss:{order:2,lv:4}
})
