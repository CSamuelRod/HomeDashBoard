function draw(){
 var a=document.activeElement;
 if(a&&a.tagName==='INPUT'&&a.value)return;
 var v={hogar:vHogar,fitness:vFit,mes:vMes,hoy:vHoy,semana:vSemana,compra:vCompra,tareas:vTareas};
 $('m').innerHTML=v[tab]();
 var b=$('side').children,i;
 for(i=0;i<b.length;i++)b[i].className='nv'+(b[i].getAttribute('data-t')===tab?' on':'');
 var c=pend().length,t=todayList().filter(function(x){return !x.done}).length;
 $('b-compra').textContent=c||'';$('b-tareas').textContent=t||'';
 reloj();}
document.addEventListener('click',function(e){
 var el=e.target;while(el&&el.getAttribute&&!el.getAttribute('data-t')&&!el.getAttribute('data-a'))el=el.parentNode;if(!el||!el.getAttribute)return;
 var t=el.getAttribute&&el.getAttribute('data-t');
 if(t){tab=t;draw();return}
 var a=el.getAttribute&&el.getAttribute('data-a');if(!a)return;
 var id=el.getAttribute('data-id'),o;
 if(a==='tdone'){o=find(S.tasks,id);var dd=el.getAttribute('data-d')||ds(new Date());if(o.rep){o.doneOn=o.doneOn||{};if(o.doneOn[dd])delete o.doneOn[dd];else o.doneOn[dd]=true}else o.done=!o.done}
 else if(a==='tdel')rm(S.tasks,id);
 else if(a==='tclean')S.tasks=S.tasks.filter(function(x){return x.rep||!x.done});
 else if(a==='chip'){o=has(el.getAttribute('data-n'));if(o)rm(S.shop,o.id);else S.shop.push({id:uid(),name:el.getAttribute('data-n'),cat:el.getAttribute('data-c'),done:false})}
 else if(a==='sdone'){o=find(S.shop,id);o.done=!o.done}
 else if(a==='sdel')rm(S.shop,id);
 else if(a==='sclean')S.shop=S.shop.filter(function(x){return !x.done});
 else if(a==='sel'){SEL=el.getAttribute('data-d')}
 else if(a==='mnav'){var n=parseInt(id,10);MO=n===0?0:MO+n}
 else if(a==='edel')rm(S.events,id);
 else if(a==='eimp'){o=find(S.events,id);o.imp=!o.imp}
 else if(a==='ndel')rm(S.notes,id);
 else if(a==='night')S.night=S.night==='on'?'off':'on';
 else if(a==='ft')FT=id;
 else if(a==='rnav')RM+=parseInt(id,10);
 else if(a==='rdel')rm(S.fit.runs,id);
 else if(a==='ex'){var en=el.getAttribute('data-n');o=inR(en);if(o)rm(S.fit.routine,o.id);else S.fit.routine.push({id:uid(),name:en,sets:3,reps:10})}
 else if(a==='rquit')rm(S.fit.routine,id);
 else if(a==='rsets'){o=find(S.fit.routine,id);o.sets=Math.max(1,o.sets+parseInt(el.getAttribute('data-d'),10))}
 else if(a==='rreps'){o=find(S.fit.routine,id);o.reps=Math.max(1,o.reps+parseInt(el.getAttribute('data-d'),10))}
 else if(a==='rdone'){var tk=ds(new Date());if(S.fit.done[tk])delete S.fit.done[tk];else S.fit.done[tk]=true}
 else if(a==='cdel')rm(S.custom,id);
 else if(a==='locf')LOCF=!LOCF;
 else if(a==='geo'){LMSG='Buscando tu ubicación…';LOCF=false;geo()}
 else if(a==='locset'){var lr=LRES[parseInt(id,10)];if(lr){setLoc({mode:'manual',lat:lr.latitude,lon:lr.longitude,name:lr.name});LOCF=false;LRES=[]}}
 else if(a==='undo'){S.shop=S.last||[];S.last=null}
 else if(a==='mail'){wa(a);return}
 else if(a==='pcol'){keepName();PCOL=el.getAttribute('data-c');PEDIT=true}
 else if(a==='hcreate'||a==='hjoin'||a==='hsave'||a==='hleave'){hAct(a);return}
 else if(a==='signin'||a==='signup'){doAuth(a);return}
 else if(a==='reset'){doReset();return}
 else if(a==='logout'){FB.auth.signOut();return}
 save();draw();});
document.addEventListener('submit',function(e){
 e.preventDefault();var f=e.target,k=f.getAttribute('data-f'),v=function(n){return f.elements[n].value.trim()};
 if(k==='task'){var rp=v('r');S.tasks.push({id:uid(),text:v('t'),date:v('d')||(rp?ds(new Date()):''),done:false,rep:rp,who:f.elements['w']?v('w'):''})}
 else if(k==='shop'&&!has(v('n')))S.shop.push({id:uid(),name:v('n'),cat:'Otros',done:false});
 else if(k==='event'){var ed=v('d')||SEL||ds(new Date()),A=new Date(),B=new Date(ed+'T12:00:00');S.events.push({id:uid(),date:ed,text:v('t'),imp:f.elements['i'].checked});SEL=ed;MO=(B.getFullYear()-A.getFullYear())*12+B.getMonth()-A.getMonth()}
 else if(k==='note')S.notes.push({id:uid(),text:v('t')});
 else if(k==='newprod'){var pn=v('n'),pc=v('c');if(pn){if(!has(pn))S.shop.push({id:uid(),name:pn,cat:pc,done:false});if(f.elements['s'].checked&&!inCat(pn))S.custom.push({id:uid(),name:pn,cat:pc})}}
 else if(k==='city')xget('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(v('q'))+'&count=5&language=es&format=json',function(j){LRES=j.results||[];LMSG=LRES.length?'':'No encuentro esa ciudad.';draw()},function(){LMSG='Sin conexión para buscar.';draw()});
 else if(k==='goal')S.fit.goal={per:v('p'),km:parseFloat(v('k').replace(',','.'))||5};
 else if(k==='run'){var rk=parseFloat(v('k').replace(',','.'));if(rk>0)S.fit.runs.push({id:uid(),date:v('d')||ds(new Date()),km:rk,v:parseFloat(v('v').replace(',','.'))||0})}
 f.reset();if(document.activeElement)document.activeElement.blur();save();draw();});
function fit(){document.body.style.height=window.innerHeight+"px"}
window.addEventListener("resize",fit);window.addEventListener("orientationchange",fit);fit();
startApp();
