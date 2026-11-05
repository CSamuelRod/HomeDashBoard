var HMSG = '', HNAME = '', PCOL = '#4f9a6b', PEDIT = false, COLS = ['#4f9a6b', '#3b6fd4', '#d9644a', '#e0963a', '#8a5cc2', '#2f9ea0'];
function keepName() { var n = $('hname'); if (n) HNAME = n.value; if (document.activeElement && document.activeElement.blur) document.activeElement.blur() }
function dots() { return COLS.map(function (c) { return '<button class="dot" style="background:' + c + (c === PCOL ? ';outline:3px solid var(--ink)' : '') + '" data-a="pcol" data-c="' + c + '"></button>' }).join('') }
function genCode() {
  var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '', i, r = new Uint8Array(6);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(r); else for (i = 0; i < 6; i++)r[i] = Math.floor(Math.random() * 256);
  for (i = 0; i < 6; i++)s += a.charAt(r[i] % a.length); return s
}
function herr(e) { HMSG = ({ 'no-code': 'Ese código no existe.', 'permission-denied': 'Sin permiso. Revisa las reglas de Firestore.' })[e && e.code] || 'No se pudo completar (' + ((e && (e.code || e.message)) || 'error') + ').'; draw() }
function stopHouse() { if (FB.hunsub) { FB.hunsub(); FB.hunsub = null } FB.hid = null; FB.href = null; FB.hready = false; FB.members = {}; FB.code = '' }
function startHouse(hid) {
  stopHouse(); FB.hid = hid; FB.href = FB.db.collection('households').doc(hid); var first = true;
  FB.hunsub = FB.href.onSnapshot(function (snap) {
    if (!snap.exists) return; var d = snap.data(); FB.members = d.members || {}; FB.code = d.code || '';
    if ((first || d.by !== DEV) && d.shared) { try { var sh = JSON.parse(d.shared); Object.keys(sh).forEach(function (k) { S[k] = sh[k] }); norm(); migrate() } catch (e) { } }
    first = false; FB.hready = true; draw()
  }, function (e) { FB.err = e.code || 'error'; console.error(e) })
}
function createHouse(name, color) {
  var u = FB.user, href = FB.db.collection('households').doc(), code = genCode(), mem = {}; mem[u.uid] = { name: name, color: color, email: u.email };
  return FB.db.collection('codes').doc(code).set({ hid: href.id })
    .then(function () { return href.set({ code: code, memberIds: [u.uid], members: mem, shared: JSON.stringify(pick(S, SH)), by: DEV, updated: Date.now() }) })
    .then(function () { return FB.uref.set({ hid: href.id, state: JSON.stringify(pick(S, PE)), by: DEV, updated: Date.now() }) })
    .then(function () { HNAME = ''; PEDIT = false; startHouse(href.id) })
}
function joinHouse(code, name, color) {
  code = String(code).trim().toUpperCase();
  if (code.length < 4) return Promise.reject({ code: 'no-code' });
  if (!confirm('Al unirte, tus tareas, notas y lista actuales se sustituirán por las de la casa. ¿Seguir?')) return Promise.resolve();
  var u = FB.user, db = FB.db;
  return db.collection('codes').doc(code).get().then(function (s) {
    if (!s.exists) throw { code: 'no-code' };
    var hid = s.data().hid, up = { memberIds: firebase.firestore.FieldValue.arrayUnion(u.uid) }; up['members.' + u.uid] = { name: name, color: color, email: u.email };
    return db.collection('households').doc(hid).update(up).then(function () { return hid })
  })
    .then(function (hid) {
      SH.forEach(function (k) { delete S[k] }); norm(); HNAME = ''; PEDIT = false;
      return FB.uref.set({ hid: hid, state: JSON.stringify(pick(S, PE)), by: DEV, updated: Date.now() }).then(function () { startHouse(hid) })
    })
}
function saveMe(name, color) {
  var up = {}; up['members.' + FB.user.uid] = { name: name, color: color, email: FB.user.email }; PEDIT = false; HNAME = '';
  FB.href.update(up).then(draw, herr)
}
function leaveHouse() {
  var u = FB.user, ref = FB.href, up = { memberIds: firebase.firestore.FieldValue.arrayRemove(u.uid) }; up['members.' + u.uid] = firebase.firestore.FieldValue.delete();
  stopHouse(); ref.update(up).then(function () { return FB.uref.set({ state: JSON.stringify(S), by: DEV, updated: Date.now() }) }).then(draw, herr)
}
function hAct(a) {
  keepName(); HMSG = ''; var nm = HNAME.trim();
  if (a === 'hleave') { if (confirm('¿Salir del hogar? Conservarás una copia de los datos en este dispositivo.')) leaveHouse(); return }
  if (!nm) { HMSG = 'Escribe tu nombre.'; draw(); return }
  if (a === 'hcreate') createHouse(nm, PCOL).then(draw, herr);
  else if (a === 'hjoin') { var c = $('hcode'); joinHouse(c ? c.value : '', nm, PCOL).then(draw, herr) }
  else saveMe(nm, PCOL)
}
function vHogar() {
  var h = '<h1>Hogar</h1>';
  if (!FB.user) return h + '<div class="card">Para compartir con tu casa tienes que iniciar sesión (con Firebase configurado).</div>';
  if (HMSG) h += '<div class="card" style="color:var(--r)">' + esc(HMSG) + '</div>';
  if (!FB.hid) return h + '<div class="card"><h3>Tu nombre y color</h3><input id="hname" class="g" style="width:100%" placeholder="Tu nombre (ej. Samuel)" value="' + esc(HNAME) + '"><div style="margin-top:10px">' + dots() + '</div></div><div class="g2"><div class="card"><h3>Crear un hogar</h3><p class="mute">Tus tareas, calendario, notas y lista de la compra pasan a ser compartidos.</p><button class="btn w" data-a="hcreate">Crear hogar</button></div><div class="card"><h3>Unirme con código</h3><input id="hcode" class="g" style="width:100%;text-transform:uppercase" placeholder="Código de 6 caracteres"><button class="btn w" data-a="hjoin">Unirme</button></div></div>';
  var me = FB.members[FB.user.uid] || {}; if (!PEDIT && me.color) PCOL = me.color;
  h += '<div class="card"><h3>Código para invitar</h3><div class="code">' + esc(FB.code || '') + '</div><div class="mute">Quien se una con este código verá y editará las tareas, el calendario, las notas y la lista de la compra de la casa.</div></div>';
  h += '<div class="card"><h3>Miembros</h3>' + Object.keys(FB.members).map(function (id) { var m = FB.members[id]; return '<div class="row"><span class="dot2" style="background:' + m.color + ';width:18px;height:18px"></span><span class="t">' + esc(m.name) + (id === FB.user.uid ? ' <small>(tú)</small>' : '') + ' <small>' + esc(m.email || '') + '</small></span></div>' }).join('') + '</div>';
  return h + '<div class="card"><h3>Mi perfil</h3><input id="hname" class="g" style="width:100%" value="' + esc(HNAME || me.name || '') + '"><div style="margin:10px 0">' + dots() + '</div><button class="btn" data-a="hsave">Guardar</button> <button class="btn s" data-a="hleave">Salir del hogar</button></div>'
}
