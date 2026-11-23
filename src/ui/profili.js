/* ui/profili.js - Schermata dei profili e modulo nome / codice di salvataggio. */
/* profili: elenco (USA / ELIMINA), nuovo, codice di salvataggio da copiare o da inserire */
function fillProf(){const L=Object.entries(PF.list);$('#pfl').innerHTML=L.map(([id,p])=>'<div class="pf'+(id==PF.cur?' on':'')+'"><span>'+esc(p.n)+'</span><i>'+p.ced+' CEDOLINI'+(p.rk.w+p.rk.l?' · <b style="color:'+RKD[rkDiv(p.rk.e)].c+'">'+RKD[rkDiv(p.rk.e)].n+' '+p.rk.e+'</b>':'')+'</i>'+
(id==PF.cur?'<button class="b alt" disabled>IN USO</button>':'<button class="b" data-pu="'+id+'">USA</button>')+'<button class="b alt" data-pd="'+id+'">ELIMINA</button></div>').join('');
$('#pfl').querySelectorAll('.b').forEach(b=>b.addEventListener('mouseenter',()=>focusB(b)));
$('#pfl').querySelectorAll('[data-pu]').forEach(b=>b.onclick=()=>{au();sfx('ui');useProfile(b.dataset.pu);fillProf();wal()});
$('#pfl').querySelectorAll('[data-pd]').forEach(b=>b.onclick=()=>{au();sfx('ui');pform('del',0,b.dataset.pd)})}
/* modulo: m = 'new' (nome), 'imp' (incolla un codice), 'code' (mostra il proprio codice), 'del' (conferma);
   first = primo avvio, senza profili: non si puo' tornare indietro */
let PFM={};
function pform(m,first,id){PFM={m,first,id};const I=$('#pff-i'),C=$('#pff-c'),ok=$('#pff-ok'),b2=$('#pff-2');
$('#pff-e').textContent='';I.value='';C.value='';I.style.display=m=='new'?'':'none';C.style.display=m=='imp'||m=='code'?'':'none';C.readOnly=m=='code';
$('#pff-x').style.display=first?'none':'';b2.style.display=m=='code'||(first&&m=='new')||(first&&m=='imp')?'':'none';
const T={new:[first?'BENVENUTO!':'NUOVO PROFILO',first?'Scegli il tuo nome: cedolini e skin restano salvati in questo profilo.':'Nome del nuovo profilo:','CREA'],
imp:['INSERISCI CODICE','Incolla il codice di salvataggio copiato dall\'altro dispositivo:','CARICA'],
code:['IL MIO CODICE','Copia questo codice e inseriscilo nell\'altro dispositivo (PROFILI > INSERISCI CODICE). Contiene cedolini e skin di '+SAVE.n+'.','FATTO'],
del:['ELIMINA PROFILO','Eliminare '+(PF.list[id]||{}).n+'? Cedolini e skin andranno persi (salva prima il suo codice se ti serve).','ELIMINA']}[m];
$('#pff-t').textContent=T[0];$('#pff-l').textContent=T[1];ok.textContent=T[2];b2.textContent=m=='code'?'COPIA':m=='new'?'HO UN CODICE':'NUOVO PROFILO';
if(m=='code')C.value=exportCode();sh('s-pform');if(m=='new')I.focus();else if(m=='imp')C.focus()}
$('#pf-new').onclick=()=>pform('new');$('#pf-code').onclick=()=>pform('code');$('#pf-imp').onclick=()=>pform('imp');
$('#pff-x').onclick=()=>{fillProf();sh('s-prof')};
$('#pff-i').addEventListener('input',e=>{const v=e.target.value.toUpperCase();if(v!=e.target.value)e.target.value=v});
$('#pff-2').onclick=()=>{au();sfx('ui');const {m,first}=PFM;if(m=='code'){const C=$('#pff-c');C.select();
(navigator.clipboard?navigator.clipboard.writeText(C.value):Promise.reject()).then(()=>$('#pff-e').textContent='Copiato!',()=>{try{document.execCommand('copy');$('#pff-e').textContent='Copiato!'}catch(e){$('#pff-e').textContent='Selezionalo e copialo a mano'}})}
else pform(m=='new'?'imp':'new',first)};
$('#pff-ok').onclick=()=>{au();const {m,first,id}=PFM,er=t=>{$('#pff-e').textContent=t;sfx('ui')};
if(m=='new'){const n=$('#pff-i').value.trim().replace(/\s+/g,' ').toUpperCase(),e=nameErr(n);if(e)return er(e);newProfile({n})}
else if(m=='imp'){const d=importCode($('#pff-c').value);if(!d)return er('Codice non valido: controlla di averlo copiato tutto');
let n=d.n,i=2;while(nameErr(n))n=(d.n.slice(0,10)+' '+i++).slice(0,12);newProfile({...d,n})}
else if(m=='del'){delProfile(id);if(!PF.cur)return pform('new',1)}
sfx('ui');if(first){sh('s-menu');return}fillProf();sh('s-prof')};
