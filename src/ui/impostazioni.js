/* ui/impostazioni.js - Schermata impostazioni. */
$('#o-mus').oninput=e=>O.mus=+e.target.value;$('#o-sfx').oninput=e=>O.sfx=+e.target.value;
$('#o-touch').onclick=e=>{O.touch=(O.touch+1)%3;e.target.textContent=['AUTO','SEMPRE','NASCOSTI'][O.touch]};
$('#o-fx').onclick=e=>{FXON=FXON?0:1;e.target.textContent=FXON?'SI':'NO'};
$('#o-vib').onclick=e=>{O.vib=!O.vib;e.target.textContent=O.vib?'SI':'NO'};
$('#o-mus').value=O.mus;$('#o-sfx').value=O.sfx;
