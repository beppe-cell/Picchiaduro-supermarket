/* BIGBOSS - personaggio n. 8 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* BIGBOSS (boss): pose da tools/build_character.py, speciale da tools/build_special.py --linee:
   sale sul transpallet e carica, corpo a corpo con scatto (dash).
   Alto come VLAD ma con testa e busto grandi come gli altri: tools/build_bigboss.py gli allunga le
   gambe (x1.16) e qui la scala totale e' 0.89 (L.big 1.12 x sc .795). fk = altezza in selezione */
character({
  n:'BIGBOSS',ms:'CARICA DEL TRANSPALLET',sp:1.3,pw:1.3,big:1,
  sprites:{d:'bigboss',sc:.795,fk:.9375,n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:4,hit:1,fall:2,ko:1,win:2},ml:62,dash:5,spT:[4,9,14]},
  price:5000,
  boss:{order:5,lv:5,final:1}
})
