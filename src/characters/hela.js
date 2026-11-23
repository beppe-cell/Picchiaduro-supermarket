/* HELA - personaggio n. 6 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* HELA: pose da tools/build_character.py, speciale (risata al telefono) da tools/build_hela_special.py */
character({
  n:'HELA',ms:'RISATA AL TELEFONO',sp:1.8,pw:.9,
  sprites:{d:'hela',n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2}},
  special:lancio({oggetto:'hela-laugh', fotogrammi:3, scala:.7, uscita:[12.7,-89.5], cresce:1, tempi:[5,11]}),
  price:4000,
  boss:{order:4,lv:5}
})
