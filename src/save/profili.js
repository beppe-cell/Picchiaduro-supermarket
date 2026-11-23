/* save/profili.js - Profili salvati nel browser, codice di salvataggio, nomi sicuri (cleanName, esc). */
/* i progressi stanno nel browser (localStorage), un profilo per giocatore: n = nome, ced = cedolini,
   own/eq = skin possedute e indossate per personaggio. PF.cur = profilo in uso. Per spostarli su un altro
   dispositivo c'e' il CODICE DI SALVATAGGIO (exportCode/importCode) */
const PFK='superrissa-profili',PFK0='grossetto-profili';/* PFK0: nome di prima, letto se manca il nuovo */let PF={cur:null,list:{}};
const obj=v=>v&&typeof v=='object'&&!Array.isArray(v)?v:{};
/* sicurezza: nomi (profili, avversari online) solo con le lettere ammesse; e tutto cio' che viene da fuori e
   finisce in innerHTML passa da esc() */
const cleanName=(v,d)=>{const t=String(v==null?'':v).toUpperCase().replace(/[^A-Z0-9ÀÈÉÌÒÙ ]/g,'').replace(/\s+/g,' ').trim().slice(0,12);return t||d};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* dati delle partite RANKED nel profilo (vedi la sezione RANKED) */
const normRk=r=>{r=obj(r);const ch={},P=obj(r.pend),n=v=>Math.max(0,Math.min(99999,v|0));
for(const[k,v]of Object.entries(obj(r.ch)))if(CH.some(L=>L.n==k))ch[k]=n(v);
return{e:typeof r.e=='number'&&isFinite(r.e)?Math.max(0,Math.min(4000,Math.round(r.e))):1000,w:n(r.w),l:n(r.l),top:Math.max(0,Math.min(4,r.top|0)),ch,
nk:/^[0-9a-f]{64}$/.test(r.nk)?r.nk:null,pk:/^[0-9a-f]{64}$/.test(r.pk)?r.pk:null,pend:typeof P.e=='number'&&isFinite(P.e)?{e:P.e}:null}};
const norm=p=>{const own={},eq={};for(const[k,v]of Object.entries(obj(p.own)))if(Array.isArray(v))own[k]=v.filter(x=>typeof x=='string');
for(const[k,v]of Object.entries(obj(p.eq)))if(typeof v=='string')eq[k]=v;
for(const o of[own,eq])for(const[a,b]of[['FALSA','HELA'],['ELA','HELA'],['PAULUX','BIGBOSS'],['ZANI','ZANNA'],['PELATA','ASTREA']])if(a in o){o[b]=o[a];delete o[a]}/* vecchi nomi */
const prog={},unl={};const NEW={FALSA:'HELA',ELA:'HELA',PAULUX:'BIGBOSS',ZANI:'ZANNA',PELATA:'ASTREA'};for(const[k,v]of Object.entries(obj(p.prog)))prog[NEW[k]||k]=Math.max(0,Math.min(999,v|0));for(const[k,v]of Object.entries(obj(p.unl)))if(v)unl[NEW[k]||k]=1;
return{n:cleanName(p.n,'GIOCATORE'),ced:Math.max(0,Math.min(9999999,p.ced|0)),own,eq,prog,unl,rk:normRk(p.rk)}};
try{const v=JSON.parse(localStorage.getItem(PFK)||localStorage.getItem(PFK0)||'null');if(v&&v.list){for(const k in obj(v.list))PF.list[k]=norm(v.list[k]);PF.cur=v.cur}}catch(e){}
if(!PF.list[PF.cur])PF.cur=Object.keys(PF.list)[0]||null;
let SAVE=PF.cur?PF.list[PF.cur]:norm({});/* senza profilo (prima del primo avvio) non si salva nulla */
function save(){if(!PF.cur)return;try{localStorage.setItem(PFK,JSON.stringify(PF))}catch(e){}}
/* nome valido: 1-12 tra lettere, numeri e spazi, diverso dagli altri profili; restituisce un errore o '' */
function nameErr(n,skip){if(!/^[A-Z0-9ÀÈÉÌÒÙ ]{1,12}$/.test(n))return'Da 1 a 12 lettere o numeri';if(Object.entries(PF.list).some(([k,p])=>k!=skip&&p.n==n))return'Esiste già un profilo con questo nome';return''}
function newProfile(data){const id='p'+Date.now().toString(36)+(Math.random()*1e6|0).toString(36);PF.list[id]=norm(data);PF.cur=id;SAVE=PF.list[id];save();return id}
function useProfile(id){if(PF.list[id]){PF.cur=id;SAVE=PF.list[id];save()}}
function delProfile(id){delete PF.list[id];if(PF.cur==id){PF.cur=Object.keys(PF.list)[0]||null;SAVE=PF.cur?PF.list[PF.cur]:norm({})}
try{localStorage.setItem(PFK,JSON.stringify(PF))}catch(e){}}
/* codice di salvataggio: SPR1-<controllo>-<dati in base64> (si leggono anche i vecchi GRS1-); il controllo scarta codici copiati male */
const ck=t=>{let h=7;for(const ch of t)h=(h*31+ch.charCodeAt(0))%1679616;return h.toString(36).toUpperCase().padStart(4,'0')};
function exportCode(){const b=btoa(unescape(encodeURIComponent(JSON.stringify({n:SAVE.n,c:SAVE.ced,o:SAVE.own,e:SAVE.eq,g:SAVE.prog,u:SAVE.unl,r:SAVE.rk})))).replace(/=+$/,'');return'SPR1-'+ck(b)+'-'+b}
function importCode(code){const m=String(code).replace(/\s+/g,'').match(/^(?:SPR1|GRS1)-([0-9A-Z]{4})-([A-Za-z0-9+/]+)$/i);if(!m||ck(m[2])!=m[1].toUpperCase())return null;
try{const d=JSON.parse(decodeURIComponent(escape(atob(m[2]))));return norm({n:d.n,ced:d.c,own:d.o,eq:d.e,prog:d.g,unl:d.u,rk:d.r})}catch(e){return null}}
