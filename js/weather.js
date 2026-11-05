function reloj(){var d=new Date(),m=d.getMinutes();HOY=(d.getDay()+6)%7;
 var h=$('hora'),f=$('fecha'),hr=d.getHours();
 document.body.className=S.night==='on'?'night':'';
 var nb=$('nbtn');if(nb)nb.textContent=S.night==='on'?'☀️ Quitar modo noche':'🌙 Modo noche';
 
 var tz=W&&W.timezone?W.timezone:undefined;
 try{if(h)h.textContent=d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:tz});
  if(f)f.textContent=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',timeZone:tz})}
 catch(e){if(h)h.textContent=d.getHours()+':'+(m<10?'0':'')+m;if(f)f.textContent=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}}
setInterval(reloj,30000);

function wc(c){
 if(c===0)return['☀️','Despejado'];if(c<=2)return['⛅','Parcialmente nublado'];
 if(c===3)return['☁️','Nublado'];if(c===45||c===48)return['🌫️','Niebla'];
 if(c>=51&&c<=57)return['🌦️','Llovizna'];if(c>=61&&c<=67)return['🌧️','Lluvia'];
 if(c>=71&&c<=77)return['❄️','Nieve'];if(c>=80&&c<=82)return['🌦️','Chubascos'];
 if(c>=95)return['⛈️','Tormenta'];return['🌡️','—'];}
var LOC={lat:40.42,lon:-3.70,name:'Madrid',mode:'manual'},LRES=[],LOCF=false,LMSG='';
function xget(u,ok,ko){var x=new XMLHttpRequest();x.open('GET',u);x.onload=function(){try{ok(JSON.parse(x.responseText))}catch(e){if(ko)ko()}};x.onerror=function(){if(ko)ko()};x.send()}
function fetchW(){
 xget('https://api.open-meteo.com/v1/forecast?latitude='+LOC.lat+'&longitude='+LOC.lon+'&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7',
  function(j){W=j;WERR=false;reloj();if(tab==='hoy')draw()},
  function(){WERR=true;if(tab==='hoy')draw()});}
function setLoc(o){LOC=o;S.loc=o;LMSG='';save();fetchW()}
function geo(){
 if(!navigator.geolocation){LMSG='Este navegador no da la ubicación. Busca tu ciudad.';fetchW();return}
 navigator.geolocation.getCurrentPosition(function(p){
  var la=Math.round(p.coords.latitude*100)/100,lo=Math.round(p.coords.longitude*100)/100;
  xget('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+la+'&longitude='+lo+'&localityLanguage=es',
   function(j){setLoc({mode:'auto',lat:la,lon:lo,name:j.city||j.locality||'Mi ubicación'})},
   function(){setLoc({mode:'auto',lat:la,lon:lo,name:'Mi ubicación'})});
 },function(){LMSG='No he podido obtener la ubicación (permiso o navegador). Busca tu ciudad.';fetchW();if(tab==='hoy')draw()},{timeout:15000,maximumAge:600000});}
function loadW(){if(LOC.mode==='auto')geo();else fetchW()}
function locBar(){
 var h='<div style="margin-bottom:6px"><button class="btn s" data-a="locf">📍 '+esc(LOC.name||'Madrid')+(LOC.mode==='auto'?' (auto)':'')+' · cambiar</button></div>';
 if(LMSG)h+='<div class="mute" style="margin-bottom:6px">'+esc(LMSG)+'</div>';
 if(!LOCF)return h;
 h+='<div class="card"><button class="btn w" style="margin:0 0 8px" data-a="geo">📍 Usar mi ubicación actual</button><form data-f="city"><input class="g" name="q" placeholder="Buscar ciudad (ej. Zúrich)" required><button class="btn">Buscar</button></form>';
 LRES.forEach(function(r,i){h+='<button class="chip" data-a="locset" data-id="'+i+'">'+esc(r.name+(r.admin1?', '+r.admin1:'')+' · '+(r.country||''))+'</button>'});
 return h+'</div>';}
function wx(){return'<div>'+locBar()+wx0()+'</div>'}
function wx0(){
 if(!W)return'<div class="mute">'+(WERR?'Sin conexión: no hay tiempo.':'Cargando el tiempo…')+'</div>';
 var c=W.current,w=wc(c.weather_code),d=W.daily,k,dt,rain='Sin lluvia a la vista esta semana.';
 for(k=0;k<d.time.length;k++){if(d.precipitation_probability_max[k]>=50){rain='Lluvia probable '+(k===0?'hoy':'el '+new Date(d.time[k]+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long'}))+'.';break}}
 var s='<div><div class="wr"><span class="e">'+w[0]+'</span><span class="n">'+Math.round(c.temperature_2m)+'°</span><div>'+w[1]+'<div class="mute">Hoy: máx '+Math.round(d.temperature_2m_max[0])+'° · mín '+Math.round(d.temperature_2m_min[0])+'°</div></div></div><div class="sub">'+rain+'</div><div class="hrs">';
 for(k=0;k<d.time.length;k++){dt=new Date(d.time[k]+'T12:00:00');s+='<div><b>'+(k===0?'Hoy':dt.toLocaleDateString('es-ES',{weekday:'short'}))+'</b><br><span class="e2">'+wc(d.weather_code[k])[0]+'</span><br>'+Math.round(d.temperature_2m_max[k])+'° <span class="mute">'+Math.round(d.temperature_2m_min[k])+'°</span></div>'}
 return s+'</div></div>';}
