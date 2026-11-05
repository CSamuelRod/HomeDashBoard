function vTareas(){
 var l=S.tasks.slice().sort(function(a,b){return (a.done-b.done)||((a.date||'9')<(b.date||'9')?-1:1)});
 return'<h1>Tareas de la casa</h1><div class="card">'+rows(l,true)+'</div>'+tf()+'<form><button type="button" class="btn s" data-a="tclean">Quitar completadas</button></form>'+accCard();}
function accCard(){return'<div class="card" style="margin-top:14px"><h3>Cuenta</h3>'+(FB.err?'<div style="color:var(--r);margin-bottom:8px">⚠️ No se pudo guardar en la nube ('+esc(FB.err)+'). Revisa las reglas de Firestore.</div>':'')+(FB.user?esc(FB.user.email)+' <button class="btn s" data-a="logout">Salir</button>':'<span class="mute">Modo local: Firebase no está configurado, los datos solo se guardan en este navegador.</span>')+'</div>'}
