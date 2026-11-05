function fbReady() { return typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey.indexOf('TU_') !== 0 }
var booted = false;
function boot() { if (S.loc) LOC = S.loc; if (!booted) { booted = true; setInterval(loadW, 1800000) } loadW(); draw() }
function authMsg(c) { var m = { 'auth/invalid-email': 'Correo no válido.', 'auth/user-not-found': 'No existe esa cuenta.', 'auth/wrong-password': 'Contraseña incorrecta.', 'auth/invalid-credential': 'Correo o contraseña incorrectos.', 'auth/email-already-in-use': 'Ese correo ya tiene cuenta.', 'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.', 'auth/network-request-failed': 'Sin conexión.', 'auth/too-many-requests': 'Demasiados intentos, espera un poco.' }; return m[c] || 'No se pudo entrar (' + c + ').' }
function doAuth(mode) {
    var em = $('lem').value.trim(), pw = $('lpw').value; $('lerr').textContent = '';
    if (!em || !pw) { $('lerr').textContent = 'Escribe correo y contraseña.'; return }
    (mode === 'signup' ? FB.auth.createUserWithEmailAndPassword(em, pw) : FB.auth.signInWithEmailAndPassword(em, pw)).catch(function (e) { $('lerr').textContent = authMsg(e.code) })
}
function doReset() {
    var em = $('lem').value.trim(); if (!em) { $('lerr').textContent = 'Escribe tu correo arriba.'; return }
    FB.auth.sendPasswordResetEmail(em).then(function () { $('lerr').textContent = 'Te hemos enviado un correo para cambiarla.' }, function (e) { $('lerr').textContent = authMsg(e.code) })
}
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.id === 'lpw' && FB.auth) doAuth('signin') });
function stopSync() { if (FB.unsub) { FB.unsub(); FB.unsub = null } stopHouse(); FB.uref = null }
function applyP(d) { var P = JSON.parse(d.state); if (d.hid) Object.keys(P).forEach(function (k) { S[k] = P[k] }); else S = P }
function startSync(u) {
    stopSync(); FB.uref = FB.db.collection('users').doc(u.uid); var first = true;
    FB.unsub = FB.uref.onSnapshot(function (snap) {
        var d = snap.exists ? snap.data() : null;
        if (first) {
            first = false;
            if (d && d.state) { try { applyP(d) } catch (e) { } }
            else {
                var old = null; try { old = localStorage.getItem('casa-v2') } catch (e) { }
                if (old && confirm('Hay datos antiguos en este dispositivo. ¿Importarlos a tu cuenta?')) { try { S = JSON.parse(old) } catch (e) { } }
            }
            norm(); migrate(); if (d && d.hid) startHouse(d.hid); else pushNow(); draw(); return
        }
        if (!d || !d.state || d.by === DEV || snap.metadata.hasPendingWrites) return;
        try { applyP(d); norm(); migrate(); if (d.hid && d.hid !== FB.hid) startHouse(d.hid); draw() } catch (e) { }
    }, function (e) { 
        FB.err = e.code || 'error'; 
        console.error('Error en sync:', e);
        var errEl = $('lerr');
        if (errEl) {
            errEl.textContent = '⚠️ Error de conexión con la base de datos (Posible bloqueador de anuncios activo).';
            $('login').hidden = false;
        }
    })
}
function startApp() {
    if (!fbReady() || typeof firebase === 'undefined') {
        if (fbReady()) alert('No se pudo cargar Firebase. Se usa el modo local.');
        KEY = 'casa-v3-local'; loadLocal(); boot(); return
    }
    
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        FB.auth = firebase.auth(); 
        FB.db = firebase.firestore();
    } catch (err) {
        console.error('Error al inicializar Firebase:', err);
        KEY = 'casa-v3-local'; loadLocal(); boot();
        return;
    }

    $('login').hidden = false;
    
    FB.auth.onAuthStateChanged(function (u) {
        if (!u) { stopSync(); FB.user = null; S = blank(); norm(); $('m').innerHTML = ''; $('login').hidden = false; return }
        FB.user = u; KEY = 'casa-v3-' + u.uid; loadLocal(); $('login').hidden = true; boot(); startSync(u)
    }, function (error) {
        console.error('Fallo en Auth (posible bloqueo de red):', error);
        var errEl = $('lerr');
        if (errEl) {
            errEl.textContent = '⚠️ Bloqueo de red detectado (ERR_BLOCKED_BY_CLIENT). Revisa bloqueadores de anuncios o extensiones.';
        }
        $('login').hidden = false;
    });
}