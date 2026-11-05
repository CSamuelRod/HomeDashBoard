var FT='run',RM=0;
var EX=[['Piernas',['Sentadilla','Sentadilla sumo','Sentadilla con salto','Sentadilla búlgara','Sentadilla isométrica','Zancada','Zancada lateral','Zancada inversa','Puente de glúteo','Elevación de talones']],
['Flexiones',['Flexión estándar','Flexión inclinada','Flexión declinada','Flexión diamante','Flexión abierta','Flexión en pica','Flexión arquera']],
['Dominadas',['Dominada prona','Dominada supina','Dominada neutra','Dominada asistida','Dominada australiana','Dominada negativa']],
['Core',['Plancha','Plancha lateral','Abdominales','Elevación de piernas','Mountain climbers','Superman']],
['Fondos y otros',['Fondos en paralelas','Fondos en banco','Burpees']]];
function nf(n){return String(Math.round(n*100)/100).replace('.',',')}
function inR(n){return S.fit.routine.filter(function(x){return x.name===n})[0]}
function vFit(){
 return'<div class="top"><h1>Fitness</h1><div><button class="btn'+(FT==='run'?'':' s')+'" data-a="ft" data-id="run">🏃 Running</button> <button class="btn'+(FT==='mus'?'':' s')+'" data-a="ft" data-id="mus">💪 Musculación</button></div></div>'+(FT==='run'?vRun():vMus());}
function vRun(){
 var F=S.fit,g=F.goal,now=new Date(),t0=ds(now),mo=new Date(now);mo.setDate(now.getDate()-HOY);var m0=ds(mo);mo.setDate(mo.getDate()+6);var m1=ds(mo);
 var km=0;F.runs.forEach(function(r){if(g.per==='dia'?r.date===t0:(r.date>=m0&&r.date<=m1))km+=r.km});
 var pc=g.km>0?Math.min(100,Math.round(km/g.km*100)):0;
 var h='<div class="card"><h3>Meta '+(g.per==='dia'?'de hoy':'de esta semana')+'</h3><span class="cd">'+nf(km)+'</span>de '+nf(g.km)+' km · '+pc+'%<div class="bar"><i style="width:'+pc+'%"></i></div>'+(g.km>0&&km>=g.km?'<b>¡Meta cumplida! 🎉</b>':'')+
 '<form data-f="goal"><select name="p"><option value="dia"'+(g.per==='dia'?' selected':'')+'>Por día</option><option value="semana"'+(g.per==='semana'?' selected':'')+'>Por semana</option></select><input name="k" type="number" step="0.5" min="0.5" value="'+g.km+'" style="width:100px"><button class="btn s">Guardar meta</button></form></div>';
 h+='<div class="card"><h3>Apuntar salida</h3><form data-f="run"><input type="date" name="d" value="'+t0+'"><input name="k" type="number" step="0.01" min="0.1" placeholder="km" style="width:90px" required><input name="v" type="number" step="0.1" min="1" placeholder="km/h" style="width:90px"><button class="btn">Añadir</button></form></div>';
 var b=new Date(now.getFullYear(),now.getMonth()+RM,1),pre=b.getFullYear()+'-'+p2(b.getMonth()+1);
 var l=F.runs.filter(function(r){return r.date.slice(0,7)===pre}).sort(function(a,c){return a.date<c.date?1:-1}),tk=0,best=0,sv=0,nv=0;
 l.forEach(function(r){tk+=r.km;if(r.v){sv+=r.v;nv++;if(r.v>best)best=r.v}});
 h+='<div class="card"><div class="top"><h3 style="text-transform:capitalize">Histórico · '+b.toLocaleDateString('es-ES',{month:'long',year:'numeric'})+'</h3><div><button class="btn s" data-a="rnav" data-id="-1">‹</button> <button class="btn s" data-a="rnav" data-id="1">›</button></div></div>';
 h+='<div class="stats"><div><b>'+nf(tk)+'</b>km totales</div><div><b>'+l.length+'</b>salidas</div><div><b>'+(best?nf(best):'–')+'</b>mejor km/h</div><div><b>'+(nv?nf(sv/nv):'–')+'</b>km/h medio</div></div>';
 h+=l.length?l.map(function(r){return'<div class="row"><span class="t">'+r.date.slice(8)+'/'+r.date.slice(5,7)+' · <b>'+nf(r.km)+' km</b>'+(r.v?' · '+nf(r.v)+' km/h · '+Math.round(r.km/r.v*60)+' min':'')+'</span><button class="x" data-a="rdel" data-id="'+r.id+'">✕</button></div>'}).join(''):'<div class="mute">Sin salidas este mes</div>';
 return h+'</div>';}
function vMus(){
 var F=S.fit,t0=ds(new Date()),done=F.done[t0],pre=t0.slice(0,7),cnt=0,k;
 for(k in F.done)if(F.done[k]&&k.slice(0,7)===pre)cnt++;
 var h='<div class="card"><h3>Rutina de hoy</h3>';
 h+=F.routine.length?F.routine.map(function(x){return'<div class="row"><span class="t">'+esc(x.name)+'</span><button class="sm" data-a="rsets" data-id="'+x.id+'" data-d="-1">−</button><span class="q">'+x.sets+'</span><button class="sm" data-a="rsets" data-id="'+x.id+'" data-d="1">+</button><span class="mute">series ×</span><button class="sm" data-a="rreps" data-id="'+x.id+'" data-d="-1">−</button><span class="q">'+x.reps+'</span><button class="sm" data-a="rreps" data-id="'+x.id+'" data-d="1">+</button><button class="x" data-a="rquit" data-id="'+x.id+'">✕</button></div>'}).join(''):'<div class="mute">Elige ejercicios abajo para montar tu rutina.</div>';
 h+='<button class="btn w" style="background:'+(done?'#8a9a8f':'#3a6b4f')+'" data-a="rdone">'+(done?'✓ Rutina completada hoy (toca para deshacer)':'Rutina completada')+'</button><div class="mute" style="margin-top:8px">Días completados este mes: '+cnt+'</div></div>';
 h+='<h3>Ejercicios (sin peso) · toca para añadir o quitar</h3><div class="cg">';
 EX.forEach(function(c,i){
  h+='<div class="cat" style="background:'+TINT[i]+'"><h3>'+c[0]+'</h3>';
  c[1].forEach(function(x){h+='<button class="chip'+(inR(x)?' on':'')+'" data-a="ex" data-n="'+esc(x)+'">'+esc(x)+'</button>'});
  h+='</div>';
 });
 return h+'</div>';}
