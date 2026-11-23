/* main.js - Avvio: adatta il canvas allo schermo, carica le immagini e parte il ciclo. */
/* il buffer del canvas segue le proporzioni dello schermo (crisp in portrait e landscape) */
function fit(){if(!cv.getBoundingClientRect)return;const r=cv.getBoundingClientRect();if(r.width<2||r.height<2)return;const h=Math.max(384,Math.min(1760,Math.round(704*r.height/r.width)));if(cv.width!=704||cv.height!=h){cv.width=704;cv.height=h}
ZP=h>704?Math.max(1,Math.min(2.2,h*.3/211)):1}/* il campo (XMIN..XMAX) lo imposta arenaFit; in verticale la telecamera scorre */
addEventListener('resize',fit);fit();
for(const f of LD.q1)f();LD.q1=[];ldShow();
requestAnimationFrame(loop);
