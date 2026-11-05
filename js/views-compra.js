function has(n){var x=n.toLowerCase();return S.shop.filter(function(s){return s.name.toLowerCase()===x})[0]}
function inCat(n){var x=n.toLowerCase(),r=false;PRE.forEach(function(c){c[1].forEach(function(y){if(y.toLowerCase()===x)r=true})});S.custom.forEach(function(z){if(z.name.toLowerCase()===x)r=true});return r}
function npForm(){var h='<form data-f="newprod"><input class="g" name="n" placeholder="Añadir producto…" required><select name="c">';PRE.forEach(function(c){h+='<option>'+c[0]+'</option>'});return h+'</select><label style="width:100%"><input type="checkbox" name="s" checked> Guardar en el catálogo para otras veces</label><button class="btn">Añadir a la lista</button></form>'}
function custList(){if(!S.custom.length)return'';return'<div class="card"><h3>Productos que has añadido</h3>'+S.custom.map(function(z){return'<div class="row"><span class="t">'+esc(z.name)+' <small>'+esc(z.cat)+'</small></span><button class="x" data-a="cdel" data-id="'+z.id+'">✕</button></div>'}).join('')+'</div>'}
function vCompra(){
 var h='<h1>Se acabó… <span class="sub">Toca lo que se acabe y pasa a la lista</span></h1><div class="cols"><div class="cg">';
 PRE.forEach(function(c,i){
  var L=c[1].concat(S.custom.filter(function(z){return z.cat===c[0]}).map(function(z){return z.name})),n=L.filter(function(x){return has(x)}).length;
  h+='<div class="cat" style="background:'+TINT[i]+'"><h3>'+c[0]+(n?'<span class="bg">'+n+'</span>':'')+'</h3>';
  L.forEach(function(x){h+='<button class="chip'+(has(x)?' on':'')+'" data-a="chip" data-c="'+esc(c[0])+'" data-n="'+esc(x)+'">'+esc(x)+'</button>'});
  h+='</div>';
 });
 h+='</div><div><div class="card"><h3>Lista de la compra · '+pend().length+'</h3>';
 var cats=PRE.map(function(c){return c[0]}).concat(['Otros']),any=false;
 cats.forEach(function(c){
  var l=S.shop.filter(function(s){return s.cat===c});
  if(!l.length)return;any=true;h+='<h3 style="margin-top:12px">'+c+'</h3>';
  l.forEach(function(s){h+='<div class="row'+(s.done?' ok':'')+'"><button class="ck'+(s.done?' on':'')+'" data-a="sdone" data-id="'+s.id+'">'+(s.done?'✓':'')+'</button><span class="t">'+esc(s.name)+'</span><button class="x" data-a="sdel" data-id="'+s.id+'">✕</button></div>'});
 });
 if(!any)h+='<div class="mute">Aún no falta nada.</div>';
 h+=''+npForm()+'<form><button type="button" class="btn s" data-a="sclean">Quitar comprados</button></form>'+(S.last&&S.last.length?'<form><button type="button" class="btn s" data-a="undo">Recuperar la última lista enviada</button></form>':'')+'</div>';
 h+=custList();
 h+='<div class="card"><h3>Enviar la lista</h3><input id="mail" class="g" style="width:100%;margin-bottom:8px" placeholder="Correo de quien hace la compra" value="'+esc(S.mail||'')+'"><button class="btn w" style="background:#c4553f" data-a="mail">Enviar por Gmail</button></div></div></div>';
 return h;}

function wa(mode){
 var em=$('mail');S.mail=em?em.value.trim():'';save();
 var p=pend();if(!p.length){alert('No falta nada en la lista.');return}
 var msg='🛒 Lista de la compra · '+new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})+'\n';
 PRE.map(function(c){return c[0]}).concat(['Otros']).forEach(function(c){
  var l=p.filter(function(s){return s.cat===c});
  if(l.length)msg+='\n'+c+':\n'+l.map(function(s){return'- '+s.name}).join('\n')+'\n';});
 if(mode==='mail')window.open('https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(S.mail)+'&su='+encodeURIComponent('Lista de la compra')+'&body='+encodeURIComponent(msg),'_blank');S.last=S.shop.slice();S.shop=[];save();if(document.activeElement)document.activeElement.blur();draw();}
