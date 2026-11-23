/* core/input.js - Comandi: tastiera e controlli touch (levetta e pulsanti). */
const KM={KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r',KeyW:'u',ArrowUp:'u',KeyS:'d',ArrowDown:'d',KeyJ:'h',KeyK:'k',KeyL:'p',KeyI:'s',Space:'b',ShiftLeft:'b',ShiftRight:'b'};
addEventListener('keydown',e=>{if(e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName)){if(e.code=='Enter'&&e.target.tagName=='INPUT'){e.preventDefault();$('#'+(e.target.dataset.ok||'pff-ok')).click()}else if(e.code=='Escape')e.target.blur();return}
if($('#s-title').classList.contains('on')){$('#s-title').click();return}
const sc=vis();if(sc&&!(sc.id=='s-pause'&&(e.code=='Escape'||e.code=='KeyP'))){menuKey(e,sc);return}
if(e.code=='Escape'||e.code=='KeyP'){pause(G&&!G.pz&&!$('#s-pause').classList.contains('on')?1:0);return}const k=KM[e.code];if(!k)return;e.preventDefault();if(!keys[k]&&'pkhs'.includes(k))TR[k]=T;keys[k]=1});
addEventListener('keyup',e=>{const k=KM[e.code];if(k)keys[k]=0});
/* la finestra perde il focus (cambio scheda, notifica, alt-tab): il keyup non arriva, quindi si rilascia tutto */
const releaseAll=()=>{for(const k in keys)keys[k]=0;if(typeof touchReset=='function')touchReset()};
addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll()});
/* comandi touch. Levetta: compare dove si appoggia il pollice e lo segue se si allontana; sinistra/destra
   muovono, su salta, giu' abbassa. Pulsanti: zona unica, vale il pulsante piu' vicino al dito e si puo'
   scorrere da uno all'altro senza staccare. Piu' dita insieme (pointerId). */
const TCH={},stick=$('#stick'),sBase=stick.querySelector('.base'),sKnob=stick.querySelector('.knob'),acts=$('#acts'),AB=[...acts.querySelectorAll('.a')],SPB=acts.querySelector('.ss');
const vib=ms=>{if(O.vib&&navigator.vibrate)navigator.vibrate(ms)};
const cap=(el,e)=>{try{el.setPointerCapture(e.pointerId)}catch(_){}};
function stickPos(x,y,bx,by){sBase.style.left=bx+'px';sBase.style.top=by+'px';sKnob.style.left=x+'px';sKnob.style.top=y+'px'}
stick.addEventListener('pointerdown',e=>{e.preventDefault();au();cap(stick,e);const r=stick.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;TCH[e.pointerId]={t:'s',ox:x,oy:y};stickPos(x,y,x,y);stick.classList.add('on')});
stick.addEventListener('pointermove',e=>{const s=TCH[e.pointerId];if(!s)return;e.preventDefault();const r=stick.getBoundingClientRect(),R=sBase.offsetWidth/2;let dx=e.clientX-r.left-s.ox,dy=e.clientY-r.top-s.oy;const m=Math.hypot(dx,dy);
if(m>R){s.ox+=dx*(1-R/m);s.oy+=dy*(1-R/m);dx*=R/m;dy*=R/m}
stickPos(s.ox+dx,s.oy+dy,s.ox,s.oy);const u=dy<-R*.5;if(u&&!tk.u)vib(8);tk.l=dx<-R*.3;tk.r=dx>R*.3;tk.u=u;tk.d=dy>R*.5});
function stickEnd(e){if(!TCH[e.pointerId])return;delete TCH[e.pointerId];tk.l=tk.r=tk.u=tk.d=0;stick.classList.remove('on');for(const el of[sBase,sKnob])el.style.left=el.style.top=''}
function hitBtn(x,y){let best=null,bd=1e9;for(const b of AB){const r=b.getBoundingClientRect(),d=Math.hypot(x-r.left-r.width/2,y-r.top-r.height/2)/(r.width/2);if(d<bd){bd=d;best=b}}return bd<1.45?best:null}
const held=k=>Object.values(TCH).some(s=>s.t=='a'&&s.k==k);
function actSet(id,b){const s=TCH[id],old=s.k,k=b?b.dataset.k:null;if(old==k)return;s.k=k;
if(old&&!held(old)){tk[old]=0;AB.find(x=>x.dataset.k==old).classList.remove('on')}
if(k){tk[k]=1;b.classList.add('on');if('pkhs'.includes(k))TR[k]=T;vib(k=='b'?8:15)}}
acts.addEventListener('pointerdown',e=>{e.preventDefault();au();cap(acts,e);TCH[e.pointerId]={t:'a',k:null};actSet(e.pointerId,hitBtn(e.clientX,e.clientY))});
acts.addEventListener('pointermove',e=>{if(TCH[e.pointerId]){e.preventDefault();actSet(e.pointerId,hitBtn(e.clientX,e.clientY))}});
function actEnd(e){if(!TCH[e.pointerId])return;actSet(e.pointerId,null);delete TCH[e.pointerId]}
for(const n of['pointerup','pointercancel','lostpointercapture']){stick.addEventListener(n,stickEnd);acts.addEventListener(n,actEnd)}
function touchReset(){for(const id in TCH)delete TCH[id];for(const k of'lrudbpkhs')tk[k]=0;AB.forEach(b=>b.classList.remove('on'));stick.classList.remove('on');for(const el of[sBase,sKnob])el.style.left=el.style.top=''}
$('#tc').addEventListener('contextmenu',e=>e.preventDefault());
