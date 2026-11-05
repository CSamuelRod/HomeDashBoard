var MO=0,SEL='';
function vMes(){
 var now=new Date(),t0=ds(now),b=new Date(now.getFullYear(),now.getMonth()+MO,1),y=b.getFullYear(),m=b.getMonth(),i;
 if(!SEL)SEL=t0;
 var off=(b.getDay()+6)%7,nd=new Date(y,m+1,0).getDate();
 var h='<div class="top"><h1 style="text-transform:capitalize">'+b.toLocaleDateString('es-ES',{month:'long',year:'numeric'})+'</h1><div><button class="btn s" data-a="mnav" data-id="-1">‹</button> <button class="btn s" data-a="mnav" data-id="0">Hoy</button> <button class="btn s" data-a="mnav" data-id="1">›</button></div></div><div class="cal">';
 h+=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(function(x){return'<div class="wk">'+x+'</div>'}).join('');
 for(i=0;i<off;i++)h+='<div></div>';
 for(i=1;i<=nd;i++){
  var d=y+'-'+p2(m+1)+'-'+p2(i),l=evOf(d);
  h+='<button class="cell'+(d===t0?' today':'')+(d===SEL?' sel':'')+'" data-a="sel" data-d="'+d+'"><b>'+i+'</b>';
  var tl=tasksOn(d),it=l.map(function(e){return'<span class="ev'+(e.imp?' i':'')+'">'+esc(e.text)+'</span>'}).concat(tl.map(function(t){return'<span class="ev t'+(t.done?' d':'')+'"'+wst(t)+'>'+(t.done?'✓ ':'☐ ')+esc(t.text)+'</span>'}));
  h+=it.slice(0,3).join('');if(it.length>3)h+='<span class="mute">+'+(it.length-3)+' más</span>';
  h+='</button>';
 }
 h+='</div>';
 var l2=evOf(SEL),f=new Date(SEL+'T12:00:00');
 h+='<div class="card" style="margin-top:14px"><h3>'+f.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})+'</h3>';
 h+=l2.length?l2.map(function(e){return'<div class="row"><button class="ck'+(e.imp?' imp':'')+'"'+(e.imp?'':' style="color:#5b7a96"')+' data-a="eimp" data-id="'+e.id+'">★</button><span class="t">'+esc(e.text)+'</span><button class="x" data-a="edel" data-id="'+e.id+'">✕</button></div>'}).join(''):'<div class="mute">Sin eventos este día</div>';
 h+='<h3 style="margin-top:12px">Tareas</h3>'+rows(tasksOn(SEL),false)+tf(SEL);
 return h+'<form data-f="event"><input class="g" name="t" placeholder="Nuevo evento (ej. cumpleaños)" required><input type="date" name="d" value="'+SEL+'"><label><input type="checkbox" name="i"> Importante (cuenta atrás)</label><button class="btn">Añadir</button></form></div>';}
function vSemana(){
 var h='<h1>La semana</h1><div class="card">',d,l,mo=new Date();mo.setDate(mo.getDate()-HOY);
 for(d=0;d<7;d++){
  var f=new Date(mo.getFullYear(),mo.getMonth(),mo.getDate()+d),k=ds(f);
  l=tasksOn(k);
  h+='<div class="row"><div class="d'+(d===HOY?' hoy':'')+'">'+DIAS[d].slice(0,3)+' '+f.getDate()+'</div><div class="t">';
  evOf(k).forEach(function(e){h+='<span class="ev'+(e.imp?' i':'')+'" style="display:inline-block;margin-right:6px">'+(e.imp?'⭐ ':'📌 ')+esc(e.text)+'</span>'});
  h+=l.map(chipT).join('');
  if(!l.length&&!evOf(k).length)h+='<span class="mute">—</span>';
  h+='</div></div>';
 }
 l=S.tasks.filter(function(t){return !t.date});
 if(l.length)h+='<div class="row"><div class="d">Sin fecha</div><div class="t">'+l.map(chipT).join('')+'</div></div>';
 return h+'</div>'+tf();}
