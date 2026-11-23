/* core/loop.js - Ciclo principale: 60 aggiornamenti al secondo (offline o online) e disegno. */
function loop(ts){requestAnimationFrame(loop);acc+=Math.min(50,ts-last);last=ts;while(acc>=16.67){if(G&&G.net&&!netCan()){acc=Math.min(acc,33.4);break}acc-=16.67;if(G&&G.net){netStep();acc-=netLag()}else step()}render();selAnim()}
