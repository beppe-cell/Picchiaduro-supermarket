/* ANDREI - personaggio n. 9 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* ANDREI: pose da tools/build_character.py, speciale da tools/build_special.py --pose 4: estrae il piede di
   porco, carica, fendente (colpisce dal 3o fotogramma), chiusura; corpo a corpo con portata ml */
character({
  n:'ANDREI',ms:'PIEDE DI PORCO',sp:1.75,pw:.95,
  sprites:{d:'andrei',n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:4,hit:1,fall:2,ko:1,win:2}},
  special:corpoACorpo({portata:58, tempi:[5,10,17]})
})
