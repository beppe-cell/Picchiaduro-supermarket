/* ---------- render ---------- */
function Tx(s,x,y,z,col,al){c.font=z+'px '+FT;c.textAlign=al||'center';c.fillStyle='#000';c.fillText(s,x+1,y+1);c.fillStyle=col||'#fff';c.fillText(s,x,y)}
function TxO(s,x,y,z,col,oc,al){c.font=z+'px '+FT;c.textAlign=al||'center';const o=Math.max(1,z/9|0);c.fillStyle='#000';c.fillText(s,x+o+1,y+o+1);c.fillStyle=oc||'#000';
for(const[dx,dy]of[[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,o],[-o,o],[o,-o]])c.fillText(s,x+dx,y+dy);c.fillStyle=col;c.fillText(s,x,y)}
/* ritratti HUD: testa ritagliata dalla posa idle (sprite reale o disegno procedurale), in cache quando gli sprite sono caricati */
const PT={};
function portrait(f){const L=f.L,ss=f.ss||SPRSET[L.n],ok=!ss||!!ss.im.idle,key=L.n+(ss&&ss.skin||'')+ok;if(PT[key])return PT[key];
const t=document.createElement('canvas');t.width=160;t.height=260;const sv=c;c=t.getContext('2d');c.imageSmoothingEnabled=false;
try{draw({L,ss,face:1,st:'idle',t:0,ext:0,cr:0},80,252,'idle',1.4)}finally{c=sv}
const d=t.getContext('2d').getImageData(0,0,160,260).data,A=(x,y)=>d[(y*160+x)*4+3]>128;let y0=-1,y1=0;
for(let y=0;y<260;y++)for(let x=0;x<160;x++)if(A(x,y)){if(y0<0)y0=y;y1=y;break}
const o=document.createElement('canvas');o.width=o.height=32;
if(y0>=0){const sd=Math.round((y1-y0)*.3);let sx=0,n=0;for(let y=y0;y<y0+sd;y++)for(let x=0;x<160;x++)if(A(x,y)){sx+=x;n++}
const cx=n?sx/n:80,g=o.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(t,Math.round(cx-sd/2),y0-2,sd,sd,0,0,32,32)}
if(ok)PT[key]=o;return o}
function hud(){const sec=Math.max(0,Math.ceil(G.tm/60));
for(const[f,d]of[[G.a,1],[G.b,-1]]){const px=d>0?4:W-32,bw=120,bx=d>0?35:W-35-bw;
/* ritratto con cornice oro: lampeggia rosso quando colpito, scuro se KO */
c.fillStyle='#000';c.fillRect(px-1,3,30,30);c.fillStyle='#ffd23f';c.fillRect(px,4,28,28);c.fillStyle='#1b2450';c.fillRect(px+1,5,26,26);
c.save();c.beginPath();c.rect(px+1,5,26,26);c.clip();const pt=portrait(f);
if(d<0){c.translate(px+27,5);c.scale(-1,1);c.drawImage(pt,0,0,26,26);c.setTransform(2,0,0,2,0,0)}else c.drawImage(pt,px+1,5,26,26);
if(T-(f.hT||-99)<8){c.fillStyle='rgba(255,50,50,.55)';c.fillRect(px+1,5,26,26)}
if(f.hp<=0){c.fillStyle='rgba(0,0,0,.6)';c.fillRect(px+1,5,26,26)}c.restore();
/* barra vita: cornice bianca, scia arancio del danno, colore per soglia, tacche ogni 25% */
c.fillStyle='#000';c.fillRect(bx-2,4,bw+4,14);c.fillStyle='#fff';c.fillRect(bx-1,5,bw+2,12);c.fillStyle='#3a0c0c';c.fillRect(bx,6,bw,10);
const tw=Math.max(0,f.tr)/100*bw,hw=Math.max(0,f.hp)/100*bw;
c.fillStyle='#ff9a3a';c.fillRect(d>0?bx:bx+bw-tw,6,tw,10);
const col=f.hp>50?['#a8ffb0','#2fc94a','#1d8a30']:f.hp>25?['#fff6a0','#f0c020','#a87a10']:(T%16<8?['#ffb0b0','#ff3b3b','#a01010']:['#ffe0e0','#ff7070','#b02020']);
const x0=d>0?bx:bx+bw-hw;c.fillStyle=col[1];c.fillRect(x0,6,hw,10);c.fillStyle=col[0];c.fillRect(x0,6,hw,2);c.fillStyle=col[2];c.fillRect(x0,14,hw,2);
c.fillStyle='rgba(0,0,0,.4)';for(let i=1;i<4;i++)c.fillRect(bx+(bw*i/4|0),6,1,10);
TxO(f.L.n,d>0?bx:bx+bw,28,6,'#fff','#000',d>0?'left':'right');
if(G.net){TxO((f==G.me?'TU · ':'')+(f.nm||''),d>0?bx+40:bx+bw-40,28,5,f==G.me?'#ffd23f':'#cfd6ff','#000',d>0?'left':'right');if(G.net.set)TxO('SET '+G.net.set[0]+'-'+G.net.set[1],176,44,5,'#ffd23f','#000','center');if(G.net.ds)TxO('DESYNC',176,G.net.set?52:44,5,'#ff6a6a','#000','center');const pg=netPing(NET,.5);if(pg!=null)TxO('PING '+Math.round(pg)+' MS',176,188,4,pg<120?'#9fe89f':pg<220?'#ffd23f':'#ff6a6a','#000','center')}/* online: chi e' chi */
/* round vinti: medaglie con la G */
for(let i=0;i<2;i++){const mx=d>0?bx+bw-5-i*11:bx+5+i*11,my=24;c.fillStyle='#000';c.beginPath();c.arc(mx,my,4.5,0,7);c.fill();
c.fillStyle=i<f.wins?'#ffd23f':'#2a2f45';c.beginPath();c.arc(mx,my,3.5,0,7);c.fill();if(i<f.wins){c.fillStyle='#d42a2a';c.font='5px '+FT;c.textAlign='center';c.fillText('G',mx+.5,my+2.5)}}
/* barra SUPER sotto il ritratto */
const sw=72,sx=d>0?px:W-4-sw,sy=36,full=f.sp>=100,fl=Math.min(100,f.sp)/100*sw;
c.fillStyle='#000';c.fillRect(sx-1,sy-1,sw+2,7);c.fillStyle='#10183a';c.fillRect(sx,sy,sw,5);
c.fillStyle=full?(T%10<5?'#fff':'#ffd23f'):'#35a8ff';c.fillRect(d>0?sx:sx+sw-fl,sy,fl,5);c.fillStyle='rgba(255,255,255,.45)';c.fillRect(d>0?sx:sx+sw-fl,sy,fl,1);
c.fillStyle='rgba(0,0,0,.5)';for(let i=1;i<4;i++)c.fillRect(sx+(sw*i/4|0),sy,1,5);
TxO(full?'SUPER MAX!':'SUPER',d>0?sx+sw+4:sx-4,sy+5,5,full?(T%10<5?'#fff':'#ffd23f'):'#9fd8ff','#000',d>0?'left':'right');
/* contatore colpi consecutivi */
if(f.cmb>=2&&T-f.cmbT<90){const a=T-f.cmbT;TxO(f.cmb+' COLPI!',d>0?px:W-4,56,a<6?11:8,'#ffd23f','#d42a2a',d>0?'left':'right')}}
/* timer centrale */
const tx=W/2;c.fillStyle='#000';c.fillRect(tx-17,2,34,27);c.fillStyle='#ffd23f';c.fillRect(tx-16,3,32,25);c.fillStyle='#1b2450';c.fillRect(tx-15,4,30,23);
TxO(String(sec),tx,22,12,sec<=10&&T%30<15?'#ff4040':'#fff','#000');
TxO('ROUND '+G.rd,tx,38,5,'#ffd23f','#000')}
/* annunci ROUND / COMBATTI / K.O. con effetto "pop" */
function announce(WH){const cy=WH*.36,gr=(sz)=>{const g=c.createLinearGradient(0,cy-sz,0,cy);g.addColorStop(0,'#fff6b0');g.addColorStop(1,'#ff9a1a');return g};
if(G.ph=='intro'){const r=G.pt>40,a=r?100-G.pt:40-G.pt,pop=Math.max(0,1-a/8);
const txt=r?(G.a.wins==1&&G.b.wins==1?'ROUND FINALE':'ROUND '+G.rd):'COMBATTI!',sz=(r?16:22)*(1+pop*.6);
c.save();c.globalAlpha=Math.min(1,.3+a/5);TxO(txt,W/2,cy,sz,r?'#fff':gr(sz),'#d42a2a');if(r&&G.rd==1)TxO(ARA.n,W/2,cy+16,7,'#9fe8ff','#000');c.restore()}
if(G.ph=='ko'){const a=150-G.pt,sz=26*(1+Math.max(0,1-a/8)*.8);TxO(G.txt,W/2,cy,sz,G.txt=='K.O.'?'#ff4040':gr(sz),'#000');
if(a>30){const w=G.w;TxO((w.hp>=100?'PERFETTO! ':'')+'VINCE '+w.L.n,W/2,cy+20,8,'#ffd23f','#000')}}}
