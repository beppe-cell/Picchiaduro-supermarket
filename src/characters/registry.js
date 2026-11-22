/* ---------- personaggi ----------
   Ogni personaggio sta in src/characters/<nome>.js e si registra con character({...}):
     n, ms (nome della speciale), sp (velocita'), pw (potenza), big (boss grande)  -> dati di gioco (CH)
     sprites: {...}   -> come disegnarlo e la sua mossa speciale (SPRSET, campi spiegati sotto)
     skins: [...]     -> skin in vendita (SKINS: {id, n nome, p prezzo, ms speciale, nf fotogrammi, ov valori diversi})
     price: N         -> si compra nel negozio per N cedolini (PRZ) invece di essere giocabile da subito
     boss: {order, lv, final} -> mini boss / boss del TORNEO: posizione, livello della CPU, final = boss finale
   L'ordine dei file in index.html e' l'ordine dei personaggi (CH): non cambiarlo, l'online lo usa. */
const CH=[],SPRSET={},SKINS={},PRZ={},TBL={},BOSSES=[],MINI=[];
function character(def){const{sprites,skins=[],price,boss,...L}=def;CH.push(L);SPRSET[L.n]=sprites;SKINS[L.n]=skins;if(price)PRZ[L.n]=price;
if(boss){TBL[L.n]=boss.lv;const ord=(n,o)=>{n.push(L.n);n.sort((x,y)=>BO[x]-BO[y])};BO[L.n]=boss.order;ord(BOSSES);if(!boss.final)ord(MINI)}}
const BO={};
/* sprite dei personaggi: 1 riga per animazione in assets/characters/<nome>/, corpo in piedi normalizzato a 400px, piedi sul bordo inferiore, rivolti a destra.
   n = frame per animazione; pj = proiettile dello speciale (pjn frame); spT = soglie (tick) dei frame dello speciale se diverse dallo standard.
   hit/win sono opzionali: se mancano si usa la posa idle (inclinata quando colpito). */
