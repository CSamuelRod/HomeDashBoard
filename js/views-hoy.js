function rows(l,sd){
 if(!l.length)return'<div class="mute">Nada por aquí</div>';
 var t0=ds(new Date());
 return l.map(function(t){
  var c=wcol(t),lab=sd?' <small>'+(t.rep?'↻ '+(t.rep==='w'?'cada semana':'cada mes')+(t.date?' desde '+fdate(t.date):''):(t.date?fdate(t.date)+(t.date<t0&&!t.done?' · atrasada':''):'sin fecha'))+'</small>':'';
  return'<div class="row'+(t.done?' ok':'')+'">'+((sd&&t.rep&&!t._d)?'<span class="mute" style="width:38px;text-align:center;font-size:22px">↻</span>':'<button class="ck'+(t.done?' on':'')+'" data-a="tdone" data-id="'+t.id+'" data-d="'+(t._d||'')+'">'+(t.done?'✓':'')+'</button>')+'<span class="t">'+(c?'<span class="dot2" style="background:'+c+'"></span>':'')+esc(t.text)+lab+'</span>'+(sd?'<button class="x" data-a="tdel" data-id="'+t.id+'">✕</button>':'')+'</div>'}).join('');}
function pend(){return S.shop.filter(function(s){return !s.done})}

function evOf(x){return S.events.filter(function(e){return e.date===x})}
function evHoy(){return evOf(ds(new Date())).map(function(e){return'<div class="row"><span style="font-size:22px">'+(e.imp?'⭐':'📌')+'</span><span class="t">'+esc(e.text)+'</span></div>'}).join('')}
function vExtra(){
 var t0=ds(new Date()),im=S.events.filter(function(e){return e.imp&&e.date>=t0}).sort(function(a,b){return a.date<b.date?-1:1}).slice(0,4);
 var h='<div class="g2" style="margin-top:14px"><div class="card"><h3>Cuenta atrás</h3>';
 h+=im.length?im.map(function(e){var n=dleft(e.date);return'<div class="row"><span class="t">'+esc(e.text)+'</span>'+(n<=1?'<b>'+(n===0?'Hoy':'Mañana')+'</b>':'<span><span class="cd">'+n+'</span>días</span>')+'</div>'}).join(''):'<div class="mute">Marca un evento como importante (★) en la pestaña Mes.</div>';
 h+='</div><div class="card"><h3>Notas</h3>';
 h+=S.notes.map(function(n){return'<div class="note"><span class="t">'+esc(n.text)+'</span><button class="x" style="color:inherit" data-a="ndel" data-id="'+n.id+'">✕</button></div>'}).join('');
 return h+'<form data-f="note"><input class="g" name="t" placeholder="Nota rápida…" required><button class="btn">Añadir</button></form></div></div>';}
function tf(def){var h='<form data-f="task"><input class="g" name="t" placeholder="Añadir tarea (ej. cena: gyozas)" required><input type="date" name="d" value="'+(def===undefined?ds(new Date()):def)+'"><select name="r"><option value="">No se repite</option><option value="w">Cada semana</option><option value="m">Cada mes</option></select>';
 if(FB.hid){h+='<select name="w"><option value="">Para todos</option>';Object.keys(FB.members).forEach(function(id){h+='<option value="'+id+'">'+esc(FB.members[id].name)+'</option>'});h+='</select>'}
 return h+'<button class="btn">Añadir</button></form>'}
function people(l){var h='',ids=Object.keys(FB.members||{}).concat(['']);
 ids.forEach(function(id){var g=l.filter(function(t){return (FB.members[t.who]?t.who:'')===id});if(!g.length)return;var m=FB.members[id];
  h+='<div class="pb" style="border-top:4px solid '+(m?m.color:'#9aa79d')+'"><h3>'+(m?esc(m.name):'Para todos')+'</h3>'+rows(g,true)+'</div>'});
 return h||rows([],true)}
function vHoy(){
 var t0=ds(new Date()),hoy=todayList(),p=hoy.filter(function(t){return !t.done}),c=pend();
 return'<div class="top"><div><div id="hora" class="clock"></div><div id="fecha" class="sub" style="text-transform:capitalize"></div><button class="btn s" id="nbtn" data-a="night" style="margin-top:12px"></button>'+(FB.user?'<button class="btn s" data-a="logout" style="margin:12px 0 0 8px">👤 '+esc(FB.user.email)+' · Salir</button>':'')+'</div>'+wx()+'</div>'+
 '<div class="next"><small>Próxima tarea · hoy</small><h2>'+(p.length?esc(p[0].text):'Hoy no queda nada pendiente')+'</h2></div>'+
 '<div class="g2"><div class="card"><h3>Tareas de hoy</h3>'+evHoy()+(FB.hid?people(hoy):rows(hoy,true))+tf()+'</div>'+
 '<div class="card"><h3>Compra · '+c.length+' por comprar</h3>'+(c.length?c.slice(0,8).map(function(s){return esc(s.name)}).join(' · '):'<span class="mute">Todo en casa</span>')+'</div></div>'+vExtra();}
