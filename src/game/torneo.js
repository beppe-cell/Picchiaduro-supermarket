/* game/torneo.js - Torneo: ordine degli avversari, mini boss e boss. */
/* TORNEO: prima tutti i dipendenti "normali" tranne quello scelto (in ordine casuale, CPU di livello 2-3),
   poi i mini boss e il boss in quest'ordine (BOSSES, livello TBL), anche se il giocatore ha scelto uno di loro */
let TOR=[],TLV=[];
function tourPlan(pi){const ix=n=>CH.findIndex(L=>L.n==n),reg=CH.map((L,i)=>i).filter(i=>i!=pi&&!BOSSES.includes(CH[i].n));
for(let i=reg.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[reg[i],reg[j]]=[reg[j],reg[i]]}
TOR=[...reg,...BOSSES.map(ix)];TLV=[...reg.map((_,i)=>i<reg.length/2?2:3),...BOSSES.map(n=>TBL[n])]}
