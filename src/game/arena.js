/* game/arena.js - Arene: sfondi, scelta, dimensioni del campo (arenaFit) e zoom (gz). */
/* arena: fondale orizzontale unico (11:6) per entrambi gli orientamenti, in coordinate di gioco.
   ARH = altezza nel mondo, la macchia di luce sul pavimento (87% dell'immagine) cade sui piedi (FY).
   In verticale la telecamera scorre (CAMX) e mostra i bordi quando i lottatori ci si avvicinano. */
/* le arene: f = file, fy = altezza (frazione dell'immagine) del centro della macchia di luce dove poggiano
   i piedi; luci per i lottatori: mul (multiply, dominante), top (luce dall'alto), fl (riflesso dal pavimento),
   side ([lato -1 sinistra/1 destra/0 entrambi, colore]), dust (colore del pulviscolo), dn/fg (quantita'
   di pulviscolo e fumo), nf (tremolio dei neon) */
const ARENAS=[
{n:'CORSIA CENTRALE',f:'arena-orizzontale',fy:.87,mul:'232,245,240',top:'110,160,148',ta:.22,fl:'110,85,35',fa:.26,side:[-1,'40,120,140'],dust:'220,255,240',dn:1,fg:1,nf:1},
{n:'MAGAZZINO',f:'arena-magazzino',fy:.87,mul:'246,238,220',top:'150,118,55',ta:.24,fl:'120,90,35',fa:.28,side:null,dust:'255,230,180',dn:1.6,fg:1.1,nf:0},
{n:'ZONA CASSE',f:'arena-casse',fy:.86,mul:'246,243,236',top:'150,140,115',ta:.2,fl:'120,95,45',fa:.24,side:null,dust:'255,245,225',dn:.5,fg:.4,nf:1},
{n:'REPARTO ORTOFRUTTA',f:'arena-ortofrutta',fy:.865,mul:'242,246,232',top:'120,150,80',ta:.22,fl:'125,95,40',fa:.26,side:[1,'60,120,90'],dust:'235,255,220',dn:.8,fg:.6,nf:0},
{n:'REPARTO SURGELATI',f:'arena-surgelati',fy:.84,mul:'205,226,238',top:'70,140,165',ta:.3,fl:'50,130,150',fa:.3,side:[0,'50,140,170'],dust:'200,240,255',dn:1.2,fg:1.8,nf:1},
{n:'PARCHEGGIO SUL TETTO',f:'arena-parcheggio',fy:.875,mul:'246,228,226',top:'130,85,125',ta:.22,fl:'135,85,30',fa:.3,side:[-1,'120,60,110'],dust:'255,220,200',dn:.6,fg:.5,nf:0}];
ARENAS.forEach((A,i)=>{A.c={top:'#1a2624',bot:'#3a3a30'};
A.im=ldImg('assets/backgrounds/'+A.f+'.jpeg',i?2:1,ok=>{if(!ok)return;const t=document.createElement('canvas');t.width=A.im.naturalWidth;t.height=A.im.naturalHeight;const g=t.getContext('2d');g.drawImage(A.im,0,0);
const avg=(y,h)=>{const d=g.getImageData(0,y,t.width,h).data;let r=0,gg=0,b=0,n=d.length/4;for(let i=0;i<d.length;i+=4){r+=d[i];gg+=d[i+1];b+=d[i+2]}return'rgb('+(r/n|0)+','+(gg/n|0)+','+(b/n|0)+')'};
A.c.top=avg(0,6);A.c.bot=avg(t.height-6,6)})});
let ARA=ARENAS[0],ARI=ARA.im,ARC=ARA.c;let CAMX=176,CAMHW=176,ARH,ARY,ARL,ARR;
/* sceglie l'arena dell'incontro (a caso tra quelle caricate) */
function pickArena(){const ok=ARENAS.filter(A=>A.im.complete&&A.im.naturalWidth);ARA=ok.length?ok[Math.random()*ok.length|0]:ARENAS[0];ARI=ARA.im;ARC=ARA.c;arenaFit(ARH||208)}
/* dimensiona il fondale: alto almeno h (mondo); in verticale abbastanza da arrivare in cima allo schermo.
   Il campo di gioco (XMIN..XMAX) e' sempre tutto il fondale meno un margine */
function arenaFit(h){ARH=Math.max(208,h);ARY=FY-(ARA?ARA.fy:.87)*ARH;const hw2=ARH*1408/768/2;ARL=176-hw2;ARR=176+hw2;XMIN=ARL+22;XMAX=ARR-22;
if(G&&G.net){XMIN=G.net.xmin;XMAX=G.net.xmax}}/* online il campo e' lo stesso per tutti e due, qualunque schermo */
/* zoom che conta per il gioco (distanze fra i lottatori): online quello concordato all'inizio */
const gz=()=>G&&G.net?G.net.zp:ZP;
