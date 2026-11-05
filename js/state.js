var S={},KEY='casa-v3-local',tab='hoy',W=null,WERR=false,HOY=0,FB={members:{}};
var SH=['tasks','shop','custom','events','notes','last'],PE=['fit','night','loc','mail','phone'];
function pick(o,ks){var r={};ks.forEach(function(k){if(o[k]!==undefined)r[k]=o[k]});return r}
var DEV=(function(){try{var d=localStorage.getItem('casa-dev');if(!d){d=String(Math.random()).slice(2);localStorage.setItem('casa-dev',d)}return d}catch(e){return'x'}})();
function blank(){return{tasks:[],shop:[]}}
function norm(){S.tasks=S.tasks||[];S.shop=S.shop||[];S.fit=S.fit||{};S.fit.goal=S.fit.goal||{per:'dia',km:5};S.fit.runs=S.fit.runs||[];S.fit.routine=S.fit.routine||[];S.fit.done=S.fit.done||{};
 S.custom=S.custom||[];S.events=S.events||[];S.notes=S.notes||[];S.night=S.night==='on'?'on':'off'}
function migrate(){var mo=new Date();mo.setDate(mo.getDate()-((mo.getDay()+6)%7));
 S.tasks.forEach(function(t){if(t.date===undefined){t.date=(typeof t.day==='number'&&t.day>=0)?ds(new Date(mo.getFullYear(),mo.getMonth(),mo.getDate()+t.day)):'';delete t.day}})}
function loadLocal(){try{var r=localStorage.getItem(KEY);S=r?JSON.parse(r):blank()}catch(e){S=blank()}norm();migrate()}
var saveT=null;
function pushNow(){
 if(!FB.uref)return;var by=DEV,ts=Date.now(),w=[];
 if(FB.hid){w.push(FB.uref.set({hid:FB.hid,state:JSON.stringify(pick(S,PE)),by:by,updated:ts}));
  if(FB.hready)w.push(FB.href.update({shared:JSON.stringify(pick(S,SH)),by:by,updated:ts}))}
 else w.push(FB.uref.set({state:JSON.stringify(S),by:by,updated:ts}));
 Promise.all(w).then(function(){FB.err=null},function(e){FB.err=e.code||'error';console.error(e)})}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(FB.uref){clearTimeout(saveT);saveT=setTimeout(pushNow,700)}}
function occ(t,d){if(!t.date||d<t.date)return false;if(!t.rep)return t.date===d;
 var a=new Date(t.date+'T12:00:00'),b=new Date(d+'T12:00:00');
 if(t.rep==='w')return a.getDay()===b.getDay();
 return b.getDate()===Math.min(a.getDate(),new Date(b.getFullYear(),b.getMonth()+1,0).getDate())}
function occv(t,d){return{id:t.id,text:t.text,who:t.who,rep:t.rep,date:t.date,_d:d,done:t.rep?!!(t.doneOn&&t.doneOn[d]):!!t.done}}
function tasksOn(d){return S.tasks.filter(function(t){return occ(t,d)}).map(function(t){return occv(t,d)})}
function todayList(){var t0=ds(new Date());return S.tasks.filter(function(t){return !t.date||(t.rep?occ(t,t0):(t.date===t0||(t.date<t0&&!t.done)))}).map(function(t){return occv(t,t0)})}
function wcol(t){var m=FB.members&&FB.members[t.who];return m?m.color:''}
function wst(t){var c=wcol(t);return c?' style="border-left:4px solid '+c+'"':''}
function fdate(x){return new Date(x+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})}
function chipT(t){var c=wcol(t);return'<button class="chip'+(t.done?' on':'')+'" data-a="tdone" data-id="'+t.id+'" data-d="'+(t._d||'')+'"'+(c?' style="border-left:6px solid '+c+'"':'')+'>'+(t.rep?'↻ ':'')+esc(t.text)+'</button>'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function $(i){return document.getElementById(i)}
function uid(){return Date.now()+Math.floor(Math.random()*1000)}
var DIAS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
var PRE=[['Fruta',['Uva','Piña cortada','Plátano','Manzana']],
['Verdura',['Lechuga','Zanahoria','Tomate pera','Cebolla','Patata']],
['Carne y pescado',['Pollo','Carne picada','Pescado fresco']],
['Charcutería y quesos',['Chorizo oreado','Bacon','Jamón cocido','Queso rallado ','Salchichas']],
['Lácteos y huevos',['Huevos (24)','Leche','Yogur','Margarina con sal']],
['Pan',['Tortillas','Pan de leche','Pan de molde']],
['Despensa',['Soja','Ketchup','Mayonesa','Tomate frito artesano','Tomate frito','Aceite girasol','Aceite oliva','Macarrón','Fideos','Espagueti','Ñoquis','Arroz largo','Atún natural','Azúcar blanco','Mermelada de fresa','Galletas María dorada','Muesli de chocolate','Pastillas de caldo de pollo','Caldo de pollo brick']],
['Congelados',['Gyozas','Batatas','Patatas','Merluza']],
['Bebidas',['Zumitos','Zumo de maracuyá','Zumo de naranja','Agua']],
['Limpieza y casa',['Papel cocina','Papel higiénico','Toallitas WC','Protegeslips','Compresas normal','Compresas noche','Detergente']]];
var TINT=['#e3f0dc','#dcebd6','#f4e3d3','#f6ecd2','#e8f0e6','#efe6d5','#e4eddc','#dbe9e4','#f1e8dc','#e7efe0'];

function p2(n){return n<10?'0'+n:''+n}
function ds(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())}
function dleft(x){var t=new Date();t.setHours(0,0,0,0);return Math.round((new Date(x+'T00:00:00')-t)/864e5)}
function find(a,id){for(var i=0;i<a.length;i++)if(String(a[i].id)===String(id))return a[i]}
function rm(a,id){for(var i=0;i<a.length;i++)if(String(a[i].id)===String(id)){a.splice(i,1);return}}
