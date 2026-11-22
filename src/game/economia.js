/* ---------- cedolini (moneta di gioco) e skin ---------- */
/* REW: cedolini guadagnati a fine incontro dal giocatore. win/lose = vittoria o sconfitta, round = per
   ogni round vinto, perfect = round vinto senza subire danni, tour = torneo completato. Il totale e'
   moltiplicato per la difficolta' della CPU: x(1 + (lv-2)*lvk), lv da 1 a 5 */
const REW={win:50,lose:15,round:10,perfect:20,tour:150,lvk:.15};
/* skin alternative in vendita nel negozio: SKINS.<NOME> = [{id,n,p}]
   id = cartella assets/characters/<d>/skin-<id>/ con gli stessi nomi di file dell'originale
   (<d>-<animazione>.webp, proiettile, <d>-front.webp): un file che manca resta quello originale.
   n = nome nel negozio, p = prezzo in cedolini, nf = fotogrammi delle animazioni che nella skin sono in
   numero diverso dall'originale (es. {fall:2,win:2}), ov = valori di SPRSET diversi (es. pjo, l'uscita
   del proiettile della speciale). ORIGINALE ('base') e' sempre posseduta.
   Esempio: BEPPE:[{id:'natale',n:'BABBO BEPPE',p:1500}] (prezzi tra 1500 e 5000) con i file in assets/characters/beppe/skin-natale/ */
