/* render/sprite.js - Disegno di un lottatore (sprite, animazioni) e degli effetti della speciale. */
const SPR_H=0.55*384/2, SPRK=SPR_H/SPRB; /* altezza sprite ~55% del canvas, in coordinate mondo */
function draw(f,x,y,pose,sc){const L=f.L,s=pose||f.st,t=f.t,e=f.ext||0;const ss=f.ss||SPRSET[L.n],SPR=ss&&ss.im,SPRN=ss&&ss.n;sc=(sc||1)*(L.big?1.12:1)*(ss&&ss.sc||1);
if(!(SPR&&SPR.idle))return;/* niente sprite (ancora in caricamento): non si disegna nulla */
let name='idle',fi=0;
if(s=='walk'){name='walk';fi=(t/12|0)%SPRN.walk}
else if(s=='idle')fi=(t/20|0)%SPRN.idle;
else if(s=='jump'){name='jump';fi=f.vy<-3?0:f.vy<3?1:2}
else if(s=='block')name='block';
else if(s=='crouch')name='crouch';
else if(s=='hit'&&SPR.hit)name='hit';
else if(s=='atk'){name=f.atk=='s'?'special':f.atk=='p'?'punch':f.atk=='k'?'kick':'heavy';if(!SPR[name])name='idle';else if(name=='special'&&ss.spT)fi=ss.spT.filter(v=>t>=v).length;else{const m=MV[f.atk];fi=Math.min(t<m.su-2?0:t<m.su?1:t<m.su+m.ac?2:t<m.su+m.ac+2?3:4,SPRN[name]-1)}}
else if(s=='ko'){if(t<35&&SPR.fall){name='fall';fi=Math.min(t/12|0,SPRN.fall-1)}else if(SPR.ko){name='ko';fi=0}}
if(G&&G.ph=='ko'&&G.w===f&&SPR.win&&(s=='idle'||s=='walk')){name='win';fi=Math.min(SPRN.win-1,(150-G.pt)/14|0)}
if(!SPR[name])name='idle';
const src=SPR[name],fw=src.width/SPRN[name],fh=src.height,k=SPRK;
c.save();c.imageSmoothingEnabled=false;c.translate(x|0,y|0);c.scale(f.face*sc,sc);
if(s=='hit'&&name!='hit')c.rotate(-.08);
if(name=='idle'&&SPRN.idle==1)c.scale(1,1+Math.sin(t/14)*.012);
if(s=='atk'&&f.atk=='s'){c.fillStyle='rgba(255,210,63,.3)';c.fillRect(-34,-fh*k-6,68,fh*k+6)}
c.drawImage(src,fi*fw,0,fw,fh,-fw*k/2,-fh*k,fw*k,fh*k);c.restore()}
/* onda d'urto luminosa della mossa speciale (solo grafica, dipende da f.t; disegnata DIETRO ai lottatori): un primo anello quando parte
   la mossa, poi un anello piu' grande con lampo e cerchio a terra quando colpisce (tick su della mossa) */
function spFx(f){if(f.st!='atk'||f.atk!='s')return;const ss=f.ss||SPRSET[f.L.n]||{},m=ss.mv||MV.s,t=f.t,sc=(f.L.big?1.12:1)*(ss.sc||1),cy=FY+f.y-52*sc;
c.save();c.globalCompositeOperation='lighter';c.shadowColor='rgba(255,220,120,.9)';c.shadowBlur=10;
const ring=(age,dur,r0,r1,w,col)=>{if(age<0||age>dur)return;const q=age/dur,r=r0+(r1-r0)*(1-(1-q)*(1-q)),al=1-q;
 c.lineWidth=w*(1-q*.6);c.strokeStyle='rgba('+col+','+al+')';c.beginPath();c.ellipse(f.x,cy,r,r*.78,0,0,6.283);c.stroke();
 c.lineWidth=w*2.2*(1-q*.6);c.strokeStyle='rgba('+col+','+al*.25+')';c.stroke()};
ring(t,16,10,58*sc,5,'255,236,140');
const a2=t-m.su;ring(a2,22,14,100*sc,8,'255,250,210');ring(a2-3,22,8,74*sc,5,'255,170,60');ring(a2-7,20,6,50*sc,3,'255,255,255');
if(a2>=0&&a2<10){const g=c.createRadialGradient(f.x,cy,0,f.x,cy,60*sc);g.addColorStop(0,'rgba(255,245,200,'+(.35*(1-a2/10))+')');g.addColorStop(1,'rgba(255,200,80,0)');c.fillStyle=g;c.fillRect(f.x-60*sc,cy-60*sc,120*sc,120*sc)}
if(a2>=0&&a2<24){const q=a2/24;c.lineWidth=2;c.strokeStyle='rgba(255,230,150,'+(1-q)+')';c.beginPath();c.ellipse(f.x,FY+1,12+q*80*sc,3+q*9,0,0,6.283);c.stroke()}
c.restore()}
