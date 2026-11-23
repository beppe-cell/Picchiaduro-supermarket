/* PORTE - personaggio n. 13 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* PORTE: pose da tools/build_character.py (accovacciato riparato con tools/fix_crouch_legs.py), speciale da
   tools/build_special.py --pose 3 --scala 0.655 e scatola da tools/build_porte_special.py: la scatola parte
   dalle mani e vola dritta ruotando (3 fotogrammi in ciclo); pjw = larghezza con cui colpisce */
character({
  n:'PORTE',ms:'LANCIO DELLA SCATOLA',sp:1.6,pw:1,
  sprites:{d:'porte',n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2}},
  special:lancio({oggetto:'porte-box', fotogrammi:3, alto:36.2, y:-18.0, largo:38, uscita:[37,-80], tempi:[5,11]})
})
