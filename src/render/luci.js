/* ---------- luci e atmosfera (solo estetica) ----------
   I lottatori vengono disegnati su un livello a parte e "illuminati" come l'arena: luce fredda dei
   neon dall'alto, dominante verde-azzurra, riflesso caldo della macchia di luce sul pavimento e
   bagliore azzurro dei frigoriferi sul lato sinistro. Poi pulviscolo nei fasci di luce e un velo di
   fumo basso sul pavimento. Tutto leggero; FXON=0 lo spegne. */
let FXON=1;const LYR=document.createElement('canvas'),lc=LYR.getContext('2d'),MSK=document.createElement('canvas');
const DUST=Array.from({length:38},(_,i)=>{const r=k=>{const s=Math.sin(i*127.1+k*311.7)*43758.5453;return s-Math.floor(s)};
return{u:r(1),v:r(2),vx:(r(3)-.5)*.05,vy:-.012-r(4)*.02,ph:r(5)*6.28,a:.18+r(6)*.3,front:r(7)<.3}});
const FOG=Array.from({length:6},(_,i)=>({u:i/6+.05,y:-2+(i%3)*5,r:46+(i*17)%30,vx:(i%2?1:-1)*(.012+i*.003),a:.05+(i%3)*.012}));
const BLOB=document.createElement('canvas');BLOB.width=BLOB.height=128;
{const g=BLOB.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(190,215,205,1)');gr.addColorStop(.55,'rgba(170,200,190,.45)');gr.addColorStop(1,'rgba(160,190,180,0)');g.fillStyle=gr;g.fillRect(0,0,128,128)}
/* tremolio dei neon: ogni tanto la luce dall'alto cala per qualche frame */
const neon=()=>{const k=(T/7|0)%173;return k<2||k==5?.55:1};
function dustPass(front){if(!FXON)return;const w=ARR-ARL,h=FY-(ARY+ARH*.18),y0=ARY+ARH*.18;
for(const d of DUST){if(d.front!=front)continue;let x=ARL+((d.u*w+d.vx*T)%w+w)%w,y=y0+((d.v*h+d.vy*T)%h+h)%h;
const tw=.6+.4*Math.sin(T*.05+d.ph),near=1-(y-y0)/h*.6;c.fillStyle='rgba('+ARA.dust+','+Math.min(.8,d.a*tw*near*ARA.dn).toFixed(3)+')';c.fillRect(x,y,front?1.2:.9,front?1.2:.9)}}
function fogPass(){if(!FXON)return;c.save();c.imageSmoothingEnabled=true;const w=ARR-ARL;
for(const f of FOG){const x=ARL+((f.u*w+f.vx*T)%w+w)%w,y=FY+f.y,br=1+.08*Math.sin(T*.01+f.u*9);
c.globalAlpha=Math.min(.25,f.a*br*ARA.fg);c.drawImage(BLOB,x-f.r*1.6,y-f.r*.45,f.r*3.2,f.r*.9)}c.restore()}
/* disegna fn() sul livello e la illumina come l'arena, poi la riporta sullo schermo */
function litLayer(fn,tr,xs){if(!FXON){fn();return}
if(LYR.width!=cv.width||LYR.height!=cv.height){LYR.width=cv.width;LYR.height=cv.height}
/* lavora solo nel riquadro dei lottatori (xs = loro x nel mondo): molto piu' leggero sul telefono */
const bx0=Math.max(0,Math.floor(tr[4]+(Math.min(...xs)-90)*tr[0])),bx1=Math.min(LYR.width,Math.ceil(tr[4]+(Math.max(...xs)+90)*tr[0])),by0=Math.max(0,Math.floor(tr[5]+(FY-200)*tr[3])),by1=Math.min(LYR.height,Math.ceil(tr[5]+(FY+14)*tr[3])),bw=bx1-bx0,bh=by1-by0;if(bw<=0||bh<=0){fn();return}
lc.setTransform(1,0,0,1,0,0);lc.clearRect(bx0,by0,bw,bh);lc.setTransform(...tr);lc.imageSmoothingEnabled=false;
const mc=c;c=lc;try{fn()}finally{c=mc}
/* maschera dei lottatori, poi: multiply per la dominante fredda (i neri restano neri), screen per le
   luci; alla fine la maschera ritaglia tutto sulla sagoma */
if(MSK.width!=LYR.width||MSK.height!=LYR.height){MSK.width=LYR.width;MSK.height=LYR.height}
const mk=MSK.getContext('2d');mk.setTransform(1,0,0,1,0,0);mk.clearRect(bx0,by0,bw,bh);mk.drawImage(LYR,bx0,by0,bw,bh,bx0,by0,bw,bh);
lc.save();lc.globalCompositeOperation='multiply';lc.fillStyle='rgb('+ARA.mul+')';lc.fillRect(ARL,ARY-200,ARR-ARL,ARH+400);
lc.globalCompositeOperation='screen';
const nl=ARA.nf?neon():1,top=lc.createLinearGradient(0,FY-118,0,FY-50);top.addColorStop(0,'rgba('+ARA.top+','+(ARA.ta*nl).toFixed(3)+')');top.addColorStop(1,'rgba('+ARA.top+',0)');
lc.fillStyle=top;lc.fillRect(ARL,FY-160,ARR-ARL,110);/* luce fredda dei neon su teste e spalle */
const fl=lc.createLinearGradient(0,FY,0,FY-38);fl.addColorStop(0,'rgba('+ARA.fl+','+ARA.fa+')');fl.addColorStop(1,'rgba('+ARA.fl+',0)');
lc.fillStyle=fl;lc.fillRect(ARL,FY-38,ARR-ARL,42);/* riflesso caldo della macchia di luce */
if(ARA.side)for(const sd of ARA.side[0]?[ARA.side[0]]:[-1,1]){/* bagliore laterale (frigoriferi, vetrine...) */
const e=sd<0?ARL:ARR,fr=lc.createLinearGradient(e-sd*ARH*.05,0,e-sd*ARH*.75,0);fr.addColorStop(0,'rgba('+ARA.side[1]+',.24)');fr.addColorStop(1,'rgba('+ARA.side[1]+',0)');
lc.fillStyle=fr;lc.fillRect(sd<0?ARL:ARR-ARH*.75,FY-170,ARH*.75,180)}
lc.globalCompositeOperation='destination-in';lc.setTransform(1,0,0,1,0,0);lc.drawImage(MSK,bx0,by0,bw,bh,bx0,by0,bw,bh);
lc.restore();
c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(LYR,bx0,by0,bw,bh,bx0,by0,bw,bh);c.restore()}
/* ombra morbida sotto i piedi */
function shadow(f){const k=Math.max(.35,1+f.y/90);c.save();c.imageSmoothingEnabled=true;c.globalAlpha=.32*k;c.fillStyle='#000';
c.beginPath();c.ellipse(f.x,FY+1,19*k,3.6*k,0,0,6.283);c.fill();c.restore()}
function render(){c.save();
const WH=cv.height/2;
c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);c.imageSmoothingEnabled=false;
let s2=2,tx=0,ty=0;const shx=G&&G.sh>0?(Math.random()-.5)*G.sh*.6:0,shy=G&&G.sh>0?(Math.random()-.5)*G.sh*.3:0;
if(WH>352){
/* verticale: camera zoomata (ZP), piedi sopra il pannello dei comandi */
s2=2*ZP;const gyRef=cv.height*.85,gy=$('#tc').classList.contains('on')?Math.min(gyRef,cv.height-.52*cv.width):gyRef;ty=gy-FY*s2;
if(!G||G.ph=='intro'||Math.abs(ARH-(FY+ty/s2+2)/.87)>40)arenaFit((FY+ty/s2+2)/.87)}/* si ridimensiona solo fuori dal combattimento o se cambia molto (rotazione) */
else{
/* orizzontale: arena alta 192 con margini sopra/sotto se lo schermo e' piu' alto */
const bot=WH>192?Math.min(WH-192,WH*.16):0,top=WH-192-bot;ty=2*top;if(ARH!=208)arenaFit(208)}
/* telecamera orizzontale: segue il punto medio dei lottatori senza uscire dal fondale */
const hw=352/s2;CAMHW=hw;if(!G)CAMX=176;else CAMX=Math.max(ARL+hw,Math.min(ARR-hw,CAMX));if(ARR-ARL<2*hw)CAMX=176;
tx=352-CAMX*s2;
c.setTransform(s2,0,0,s2,tx,ty);c.imageSmoothingEnabled=false;c.translate(shx,shy);
/* fondale nel mondo: macchia di luce sul pavimento (87% dell'immagine) sotto i piedi; sopra e sotto
   l'immagine il colore medio del soffitto e del pavimento */
if(ARI.complete&&ARI.naturalWidth){const vt=-ty/s2-4,vb=(cv.height-ty)/s2+4,vl=CAMX-hw-4;
c.fillStyle=ARC.top;c.fillRect(vl,vt,2*hw+8,ARY-vt+1);c.fillStyle=ARC.bot;c.fillRect(vl,ARY+ARH-1,2*hw+8,vb-ARY-ARH+1);
c.drawImage(ARI,ARL,ARY,ARR-ARL,ARH)}
else{c.fillStyle='#0b0d14';c.fillRect(-W,-2*H,3*W,5*H)}/* arena non ancora caricata */
dustPass(false);
const TR2=[s2,0,0,s2,tx+shx*s2,ty+shy*s2];
if(!G){if($('#s-sel').classList.contains('on')||$('#s-shop').classList.contains('on')){fogPass();c.restore();return}/* in selezione: solo lo sfondo, il protagonista e' il dipendente scelto */
const f=[...demo];f[0].x=176-88/ZP;f[1].x=176+88/ZP;for(const d of f){d.t++;d.st='idle';d.y=0;shadow(d)}litLayer(()=>{draw(f[0],176-88/ZP,FY);draw(f[1],176+88/ZP,FY)},TR2,[f[0].x,f[1].x]);fogPass();dustPass(true);c.restore();return}
const a=G.a,b=G.b;for(const f of[a,b])shadow(f);
const order=a.y<b.y?[b,a]:[a,b];for(const f of order)spFx(f);/* onda della speciale dietro ai lottatori: non copre l'animazione */litLayer(()=>{for(const f of order)draw(f,f.x,FY+f.y)},TR2,[a.x,b.x]);
fogPass();dustPass(true);
for(const p of PJ){const x=p.x,y=FY+(p.y==null?-30:p.y),d=p.vx>0?1:-1;c.save();c.translate(x,y);c.scale(d,1);c.imageSmoothingEnabled=false;
const ps=p.o.ss||SPRSET[p.o.L.n]||{},PI=ps.pi;
if(PI&&PI.complete&&PI.naturalWidth){if(ps.pjn>1){const n=ps.pjn,fw=PI.width/n,ph=ps.pjh||48,fi=ps.pjf!=null?ps.pjf:ps.pjg?Math.min(n-1,Math.max(0,p.t)/6|0):ps.pji?(p.t<5?0:1+((p.t/8|0)%(n-1))):(p.t/6|0)%n,k2=ph/PI.height;if(ps.pjs){const k3=SPRK*ps.pjs*(ps.sc||1);c.drawImage(PI,fi*fw,0,fw,PI.height,-2*k3,-PI.height*k3/2,fw*k3,PI.height*k3)}else c.drawImage(PI,fi*fw,0,fw,PI.height,ps.pjr!=null?-ps.pjr*k2:-fw*k2/2,ps.pjy||-18,fw*k2,ph)}
else{/* bancale di BEPPE: dritto, senza ruotare, largo come quello che tiene in mano */const ph=ps.pjh||30,pw=ps.pjw||PI.width*ph/PI.height;c.drawImage(PI,-pw/2,-ph/2,pw,ph)}}
c.restore()}
for(const p of PS){c.fillStyle=p.col;c.fillRect(p.x,FY+p.y,p.s||3,p.s||3)}
if(G.slow>0){const k=G.slow/60;c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='rgba(255,255,255,'+(k>.85?(k-.85)*4:0)+')';c.fillRect(0,0,cv.width,cv.height);/* lampo bianco iniziale e bordi scuri durante il rallentatore */
const g=c.createRadialGradient(cv.width/2,cv.height/2,cv.height*.3,cv.width/2,cv.height/2,cv.width*.7);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(.55*Math.min(1,k*3))+')');c.fillStyle=g;c.fillRect(0,0,cv.width,cv.height);c.restore()}
c.setTransform(2,0,0,2,0,0);
hud();SPB.classList.toggle('ready',G.a.sp>=100);
announce(WH);
c.restore()}
function loop(ts){requestAnimationFrame(loop);acc+=Math.min(50,ts-last);last=ts;while(acc>=16.67){if(G&&G.net&&!netCan()){acc=Math.min(acc,33.4);break}acc-=16.67;if(G&&G.net){netStep();acc-=netLag()}else step()}render();selAnim()}
