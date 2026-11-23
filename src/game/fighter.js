/* game/fighter.js - Il lottatore: mosse (MV), creazione, colpi e danni, aggiornamento a ogni fotogramma, CPU (AI). */
const MV={p:{su:5,ac:9,re:5,d:5,r:34,st:11,kb:2},k:{su:5,ac:9,re:5,d:7,r:41,st:13,kb:3},h:{su:12,ac:9,re:18,d:13,r:39,st:22,kb:7},s:{su:11,ac:6,re:16}};
/** Il lottatore in partita. Lo stato e' fatto solo di campi semplici (numeri, testi, piccoli oggetti): il rollback
    online lo copia e lo ripristina con {...f} e Object.assign (net/rollback.js), quindi niente riferimenti
    nascosti. Il comportamento sta nei metodi; la speciale e' una strategia del personaggio (characters/specials.js). */
class Fighter {
  /** @param L personaggio (CH), x posizione, face 1 = guarda a destra, ai true per la CPU, lv livello della CPU */
  constructor(L, x, face, ai, lv) {
    Object.assign(this, {L, x, y: 0, vx: 0, vy: 0, face, hp: 100, tr: 100, sp: 0, st: 'idle', t: 0, atk: null, did: 0, stun: 0, blk: 0, cr: 0,
      rep: {m: '', n: 0, t: -999}, ai, lv, ob: 0, hd: {}, wins: 0, ext: 0});
  }
  /** la mossa speciale del personaggio (strategia condivisa, non fa parte dello stato) */
  get special() { return (SPRSET[this.L.n] || {}).spc || DEFAULT_SPECIAL }
  /** un fotogramma: o avversario, i comandi {l,r,u,d,b,p,k,h,s} */
  update(o, i) { upd(this, o, i) }
}
const DEFAULT_SPECIAL = new ProjectileSpecial({});
function mk(L,x,face,ai,lv){return new Fighter(L,x,face,ai,lv)}
/* danno dei colpi ripetuti: x0.55 a ogni ripetizione, minimo 0.25 (tabella: identica su ogni browser) */
const REPK=[1,.55,.3025,.25];
function hitchk(a,d,m){const dx=(d.x-a.x)*a.face,dy=Math.abs(a.y-d.y);if(dx<-6||dx>m.r+8||dy>28)return;if(a.atk=='p'&&d.cr&&d.y>=0)return;a.did=1;dmg(a,d,m.d*a.L.pw,m)}
function dmg(a,d,base,m){if(G.ph!='play')return;const r=a.rep;if(r.m==a.atk&&G.fr-r.t<110)r.n++;else r.n=0;r.m=a.atk;r.t=G.fr;
let v=base*REPK[Math.min(r.n,REPK.length-1)];if(d.stun>0)v*=.7;
const bl=d.blk&&(a.x-d.x)*d.face>0&&d.st!='hit';
if(bl){v*=.1;d.vx=a.face*2;sfx('blk');sparkBlk(d.x+d.face*12,-64,-d.face)}
else{a.cmb=T-(a.cmbT||-999)<80?(a.cmb||0)+1:1;a.cmbT=T;d.hT=T;d.stun=m.st;d.st='hit';d.t=0;d.atk=null;d.vx=a.face*m.kb;if(d.y>=0&&m.kb>5)d.vy=-3;sfx('hit');spark(d.x-a.face*4,-36,'#ffd23f');if(O.vib&&navigator.vibrate&&!RB)navigator.vibrate(m.kb>5?40:15)}
d.hp-=v;a.sp=Math.min(100,a.sp+v*1.4);d.sp=Math.min(100,d.sp+v*.8);G.hs=bl?2:m.kb>5?7:4;G.sh=bl?0:m.kb>5?10:5;
if(d.hp<=0){d.hp=0;d.vx=a.face*3;d.vy=-4;endRound(a,'K.O.')}}
function upd(f,o,i){f.t++;
if(f.st=='ko'){f.vx*=.92;f.x+=f.vx;f.vy+=.5;f.y=Math.min(0,f.y+f.vy);if(f.y>=0)f.vy=0;return}
const gr=f.y>=0&&f.vy>=0;
if(f.stun>0){f.stun--;f.vx*=.85;f.st=f.stun>0?'hit':'idle'}
else if(f.st=='atk'){const m=f.atk=='s'&&(f.ss||SPRSET[f.L.n]||{}).mv||MV[f.atk],t=f.t;/* mv: speciale con tempi propri (FABIO) */f.ext=t<m.su?t/m.su:t<m.su+m.ac?1:Math.max(0,1-(t-m.su-m.ac)/m.re);f.vx*=.8;
if(f.atk=='s')f.special.tick(f,o,t,m);/* la speciale la fa la sua strategia (lancio, corpo a corpo...) */
else if(t>=m.su&&t<m.su+m.ac&&!f.did)hitchk(f,o,m);
if(t>=m.su+m.ac+m.re){f.st='idle';f.atk=null;f.ext=0}}
else{f.ext=0;f.blk=gr&&i.b;f.cr=gr&&i.d&&!i.b;if(gr)f.face=o.x>f.x?1:-1;
if(f.blk||f.cr)f.vx=0;else{const sp=f.L.sp;f.vx=i.l?-sp:i.r?sp:gr?0:f.vx;if(gr&&i.u){f.vy=-8.4;sfx('jp')}}
const k=i.s&&f.sp>=100?'s':i.h?'h':i.k?'k':i.p?'p':null;
if(k&&!f.blk){if(f.loc&&!RB)delete TR[k];f.st='atk';f.atk=k;f.t=0;f.did=0;f.cr=0;if(k=='s')f.sp=0;else sfx('whf')}
else f.st=!gr?'jump':f.blk?'block':f.cr?'crouch':f.vx?'walk':'idle'}
f.vy+=.45;f.y+=f.vy;if(f.y>=0){f.y=0;f.vy=0}f.x=Math.max(XMIN,Math.min(XMAX,f.x+f.vx))}
function AI(f,o){if(f.ob>0){f.ob--;return{...f.hd}}const mlS=f.special.closeRange;/* speciale da usare solo da vicino */
const lv=f.lv,dx=o.x-f.x,ad=Math.abs(dx),tw=dx>0?'r':'l',aw=dx>0?'l':'r',rn=Math.random(),hd={},dz=ZP;
f.ob=Math.max(4,20-lv*3)+(Math.random()*8|0);
const thr=o.st=='atk'&&ad<66/dz,rec=o.st=='atk'&&o.t>MV[o.atk].su+MV[o.atk].ac;
if(thr&&!rec&&rn<.22+.13*lv+(o.rep.n>1?.15:0)){hd.b=1;f.ob=12+(Math.random()*10|0)}
else if(rec&&ad<48/dz&&rn<.35+.12*lv){hd[rn<.5?'p':'k']=1}
else if(ad>120/dz){hd[tw]=1;if(f.sp>=100&&rn<.5&&!mlS)hd.s=1}
else if(ad>54/dz){if(rn<.55)hd[tw]=1;else if(rn<.65&&f.sp>=100&&!mlS)hd.s=1;else if(rn<.72)hd.u=1}
else{if(mlS&&f.sp>=100&&rn<.3)hd.s=1;/* speciale corpo a corpo: solo da vicino */else if(rn<.38)hd.p=1;else if(rn<.6)hd.k=1;else if(rn<.7)hd.h=1;else if(rn<.84)hd[aw]=1;else hd.b=1}
f.hd={l:hd.l,r:hd.r,d:hd.d,b:hd.b};return hd}
