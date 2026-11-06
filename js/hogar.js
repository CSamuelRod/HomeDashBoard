
// ============================================================
// ESTADO Y CONFIGURACIÓN DEL HOGAR
// ============================================================

// Mensaje de error o información mostrado en la vista.
var HMSG = '';

// Nombre del usuario que se está editando.
var HNAME = '';

// Color seleccionado para el perfil.
var PCOL = '#4f9a6b';

// Indica si el usuario está modificando su color.
var PEDIT = false;

// Colores disponibles para los miembros del hogar.
var COLS = [
    '#4f9a6b',
    '#3b6fd4',
    '#d9644a',
    '#e0963a',
    '#8a5cc2',
    '#2f9ea0'
];


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Guarda el nombre introducido en el campo de perfil.
 *
 * También quita el foco del elemento activo para evitar
 * que el teclado permanezca abierto en dispositivos móviles.
 */
function keepName() {

    const nameInput = $('hname');

    if (nameInput) {
        HNAME = nameInput.value;
    }

    if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
    }
}


/**
 * Genera los botones para seleccionar el color del perfil.
 *
 * El color seleccionado se destaca con un contorno.
 *
 * @returns {string} HTML de los botones de colores.
 */
function dots() {

    return COLS.map(color => {

        const selectedOutline = color === PCOL
            ? ';outline:3px solid var(--ink)'
            : '';

        return `
            <button
                class="dot"
                style="background:${color}${selectedOutline}"
                data-a="pcol"
                data-c="${color}"
            ></button>
        `;

    }).join('');
}


/**
 * Genera un código aleatorio de seis caracteres
 * para invitar a otros miembros al hogar.
 *
 * Utiliza crypto.getRandomValues cuando está disponible.
 * Como alternativa, utiliza Math.random.
 *
 * @returns {string} Código de invitación.
 */
function genCode() {

    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    let code = '';

    const randomValues = new Uint8Array(6);

    if (window.crypto && crypto.getRandomValues) {

        crypto.getRandomValues(randomValues);

    } else {

        for (let i = 0; i < 6; i++) {
            randomValues[i] = Math.floor(Math.random() * 256);
        }
    }

    for (let i = 0; i < 6; i++) {
        code += alphabet.charAt(randomValues[i] % alphabet.length);
    }

    return code;
}


/**
 * Traduce los errores de Firebase a mensajes comprensibles.
 *
 * Después de establecer el mensaje, actualiza la interfaz.
 *
 * @param {Object} error - Error recibido de Firebase.
 */
function herr(error) {

    const errorMessages = {
        'no-code': 'Ese código no existe.',
        'permission-denied': 'Sin permiso. Revisa las reglas de Firestore.'
    };

    HMSG = errorMessages[error && error.code] ||
        'No se pudo completar (' +
        ((error && (error.code || error.message)) || 'error') +
        ').';

    draw();
}


// ============================================================
// GESTIÓN DE LA CONEXIÓN AL HOGAR
// ============================================================

/**
 * Detiene la escucha de cambios del hogar actual
 * y limpia los datos asociados en el estado de Firebase.
 */
function stopHouse() {

    if (FB.hunsub) {
        FB.hunsub();
        FB.hunsub = null;
    }

    FB.hid = null;
    FB.href = null;
    FB.hready = false;
    FB.members = {};
    FB.code = '';
}


/**
 * Inicia la escucha en tiempo real de un hogar en Firestore.
 *
 * Cuando llegan cambios:
 * - Actualiza los miembros y el código de invitación.
 * - Sincroniza los datos compartidos cuando corresponde.
 * - Normaliza y migra los datos recibidos.
 * - Actualiza la interfaz.
 *
 * @param {string} hid - Identificador del hogar.
 */
function startHouse(hid) {

    // Detener cualquier conexión anterior.
    stopHouse();

    FB.hid = hid;

    FB.href = FB.db
        .collection('households')
        .doc(hid);

    let first = true;

    // Suscribirse a los cambios del documento del hogar.
    FB.hunsub = FB.href.onSnapshot(

        snap => {

            if (!snap.exists) {
                return;
            }

            const data = snap.data();

            FB.members = data.members || {};
            FB.code = data.code || '';

            // Sincronizar los datos compartidos:
            // - En la primera lectura.
            // - Cuando el cambio procede de otro dispositivo.
            if ((first || data.by !== DEV) && data.shared) {

                try {

                    const sharedData = JSON.parse(data.shared);

                    Object.keys(sharedData).forEach(key => {
                        S[key] = sharedData[key];
                    });

                    norm();
                    migrate();

                } catch (error) {
                    // Se conserva el comportamiento original:
                    // ignorar errores al interpretar los datos compartidos.
                }
            }

            first = false;

            FB.hready = true;

            draw();
        },

        error => {

            FB.err = error.code || 'error';

            console.error(error);
        }
    );
}


// ============================================================
// CREAR UN HOGAR
// ============================================================

/**
 * Crea un nuevo hogar en Firestore.
 *
 * También:
 * - Genera un código de invitación.
 * - Registra al usuario como primer miembro.
 * - Guarda los datos compartidos.
 * - Guarda el estado privado del usuario.
 * - Inicia la sincronización del nuevo hogar.
 *
 * @param {string} name - Nombre del usuario.
 * @param {string} color - Color elegido para su perfil.
 * @returns {Promise} Cadena de operaciones de Firestore.
 */
function createHouse(name, color) {

    const user = FB.user;

    const houseRef = FB.db
        .collection('households')
        .doc();

    const code = genCode();

    const members = {};

    members[user.uid] = {
        name: name,
        color: color,
        email: user.email
    };

    // Registrar primero el código de invitación.
    return FB.db
        .collection('codes')
        .doc(code)
        .set({
            hid: houseRef.id
        })

        // Crear el documento del hogar.
        .then(() => {

            return houseRef.set({
                code: code,
                memberIds: [user.uid],
                members: members,
                shared: JSON.stringify(pick(S, SH)),
                by: DEV,
                updated: Date.now()
            });
        })

        // Guardar el estado privado del usuario.
        .then(() => {

            return FB.uref.set({
                hid: houseRef.id,
                state: JSON.stringify(pick(S, PE)),
                by: DEV,
                updated: Date.now()
            });
        })

        // Limpiar el formulario e iniciar la sincronización.
        .then(() => {

            HNAME = '';
            PEDIT = false;

            startHouse(houseRef.id);
        });
}


// ============================================================
// UNIRSE A UN HOGAR
// ============================================================

/**
 * Permite unirse a un hogar utilizando un código.
 *
 * Antes de continuar:
 * - Normaliza el código.
 * - Comprueba que tenga una longitud mínima.
 * - Solicita confirmación al usuario.
 *
 * Al unirse, los datos compartidos actuales se sustituyen
 * por los datos del hogar al que se está accediendo.
 *
 * @param {string} code - Código de invitación.
 * @param {string} name - Nombre del usuario.
 * @param {string} color - Color elegido para su perfil.
 * @returns {Promise} Cadena de operaciones de Firestore.
 */
function joinHouse(code, name, color) {

    // Normalizar el código de invitación.
    code = String(code).trim().toUpperCase();

    if (code.length < 4) {
        return Promise.reject({
            code: 'no-code'
        });
    }

    // Confirmar que el usuario acepta sustituir
    // sus datos actuales por los del hogar compartido.
    if (!confirm(
        'Al unirte, tus tareas, notas y lista actuales ' +
        'se sustituirán por las de la casa. ¿Seguir?'
    )) {
        return Promise.resolve();
    }

    const user = FB.user;
    const db = FB.db;

    // Buscar el código de invitación.
    return db
        .collection('codes')
        .doc(code)
        .get()

        .then(snapshot => {

            if (!snapshot.exists) {
                throw {
                    code: 'no-code'
                };
            }

            const houseId = snapshot.data().hid;

            // Preparar la actualización de miembros.
            const update = {
                memberIds: firebase.firestore.FieldValue.arrayUnion(
                    user.uid
                )
            };

            update['members.' + user.uid] = {
                name: name,
                color: color,
                email: user.email
            };

            // Añadir al usuario al hogar.
            return db
                .collection('households')
                .doc(houseId)
                .update(update)
                .then(() => houseId);
        })

        .then(houseId => {

            // Eliminar los datos compartidos anteriores.
            SH.forEach(key => {
                delete S[key];
            });

            norm();

            HNAME = '';
            PEDIT = false;

            // Guardar la referencia al nuevo hogar
            // en el documento privado del usuario.
            return FB.uref
                .set({
                    hid: houseId,
                    state: JSON.stringify(pick(S, PE)),
                    by: DEV,
                    updated: Date.now()
                })

                // Iniciar la sincronización del hogar.
                .then(() => {
                    startHouse(houseId);
                });
        });
}


// ============================================================
// ACTUALIZAR EL PERFIL DEL MIEMBRO
// ============================================================

/**
 * Guarda el nombre y el color del usuario actual
 * dentro del documento del hogar.
 *
 * @param {string} name - Nuevo nombre.
 * @param {string} color - Nuevo color.
 */
function saveMe(name, color) {

    const update = {};

    update['members.' + FB.user.uid] = {
        name: name,
        color: color,
        email: FB.user.email
    };

    PEDIT = false;
    HNAME = '';

    FB.href
        .update(update)
        .then(draw, herr);
}


// ============================================================
// SALIR DEL HOGAR
// ============================================================

/**
 * Permite al usuario abandonar el hogar actual.
 *
 * Si es el último miembro, elimina el documento del hogar.
 * Si quedan otros miembros, únicamente elimina al usuario
 * actual de la lista de miembros.
 */
function leaveHouse() {

    const user = FB.user;
    const houseRef = FB.href;

    if (!houseRef || !user) {
        return;
    }

    // Leer primero el documento para comprobar
    // cuántos miembros quedan en el hogar.
    houseRef.get()

        .then(doc => {

            // Si el documento ya no existe,
            // limpiar directamente el estado local.
            if (!doc.exists) {
                finishLeavingHouse();
                return;
            }

            const houseData = doc.data();

            const memberIds = houseData.memberIds || [];

            const isLastMember =
                memberIds.length <= 1 &&
                memberIds.includes(user.uid);

            // ------------------------------------------------
            // CASO 1: EL USUARIO ES EL ÚLTIMO MIEMBRO
            // ------------------------------------------------

            if (isLastMember) {

                // Eliminar el hogar completo de Firestore.
                houseRef
                    .delete()
                    .then(() => {
                        finishLeavingHouse();
                    })
                    .catch(herr);

            } else {

                // ------------------------------------------------
                // CASO 2: QUEDAN OTROS MIEMBROS
                // ------------------------------------------------

                const update = {
                    memberIds: firebase.firestore.FieldValue.arrayRemove(
                        user.uid
                    )
                };

                update['members.' + user.uid] =
                    firebase.firestore.FieldValue.delete();

                // Detener la escucha y limpiar la referencia
                // local al hogar.
                stopHouse();

                // Eliminar al usuario de la casa.
                houseRef
                    .update(update)

                    .then(() => {

                        // Guardar una copia de sus datos
                        // en su documento privado.
                        return FB.uref.set({
                            state: JSON.stringify(S),
                            by: DEV,
                            updated: Date.now()
                        });
                    })

                    .then(draw, herr);
            }
        })

        .catch(herr);
}


/**
 * Finaliza la salida del hogar cuando el documento
 * ya no existe o se ha eliminado por ser el último miembro.
 *
 * Guarda primero el estado privado del usuario y después
 * elimina la referencia al hogar en su documento.
 */
function finishLeavingHouse() {

    stopHouse();

    FB.uref
        .set({
            state: JSON.stringify(S),
            by: DEV,
            updated: Date.now()
        })

        .then(() => {

            // Eliminar la referencia al hogar del usuario.
            return FB.uref.update({
                hid: firebase.firestore.FieldValue.delete()
            });
        })

        .then(draw, herr);
}


// ============================================================
// CONTROL DE ACCIONES DEL HOGAR
// ============================================================

/**
 * Gestiona las acciones relacionadas con el hogar.
 *
 * Acciones:
 * - hleave: abandonar el hogar.
 * - hcreate: crear un hogar.
 * - hjoin: unirse a un hogar.
 * - hsave: guardar el perfil.
 *
 * @param {string} action - Acción solicitada.
 */
function hAct(action) {

    // Recuperar el nombre introducido y quitar el foco.
    keepName();

    HMSG = '';

    const name = HNAME.trim();

    // --------------------------------------------------------
    // ABANDONAR EL HOGAR
    // --------------------------------------------------------

    if (action === 'hleave') {

        if (confirm(
            '¿Salir del hogar? Conservarás una copia ' +
            'de los datos en este dispositivo.'
        )) {
            leaveHouse();
        }

        return;
    }

    // --------------------------------------------------------
    // VALIDAR EL NOMBRE
    // --------------------------------------------------------

    if (!name) {

        HMSG = 'Escribe tu nombre.';

        draw();

        return;
    }

    // --------------------------------------------------------
    // CREAR UN HOGAR
    // --------------------------------------------------------

    if (action === 'hcreate') {

        createHouse(name, PCOL).then(draw, herr);

    }

    // --------------------------------------------------------
    // UNIRSE A UN HOGAR
    // --------------------------------------------------------

    else if (action === 'hjoin') {

        const codeInput = $('hcode');

        joinHouse(
            codeInput ? codeInput.value : '',
            name,
            PCOL
        ).then(draw, herr);

    }

    // --------------------------------------------------------
    // GUARDAR EL PERFIL
    // --------------------------------------------------------

    else {

        saveMe(name, PCOL);
    }
}


// ============================================================
// VISTA PRINCIPAL DEL HOGAR
// ============================================================

/**
 * Construye la pantalla de gestión del hogar.
 *
 * Si el usuario no ha iniciado sesión, muestra un aviso.
 *
 * Si todavía no pertenece a un hogar, permite:
 * - Configurar su nombre y color.
 * - Crear un hogar.
 * - Unirse a uno existente mediante un código.
 *
 * Si ya pertenece a un hogar, muestra:
 * - Código de invitación.
 * - Lista de miembros.
 * - Edición del perfil.
 * - Opción para abandonar el hogar.
 *
 * @returns {string} HTML completo de la vista.
 */
function vHogar() {

    let html = '<h1>Hogar</h1>';

    // --------------------------------------------------------
    // COMPROBAR SESIÓN
    // --------------------------------------------------------

    if (!FB.user) {

        return html + `
            <div class="card">
                Para compartir con tu casa tienes que iniciar
                sesión (con Firebase configurado).
            </div>
        `;
    }

    // Mostrar mensajes de error cuando existan.
    if (HMSG) {

        html += `
            <div class="card" style="color:var(--r)">
                ${esc(HMSG)}
            </div>
        `;
    }

    // --------------------------------------------------------
    // USUARIO QUE TODAVÍA NO PERTENECE A UN HOGAR
    // --------------------------------------------------------

    if (!FB.hid) {

        html += `
            <div class="card">

                <h3>Tu nombre y color</h3>

                <input
                    id="hname"
                    class="g"
                    style="width:100%"
                    placeholder="Tu nombre (ej. Samuel)"
                    value="${esc(HNAME)}"
                >

                <div style="margin-top:10px">
                    ${dots()}
                </div>

            </div>

            <div class="g2">

                <div class="card">

                    <h3>Crear un hogar</h3>

                    <p class="mute">
                        Tus tareas, calendario, notas y lista
                        de la compra pasan a ser compartidos.
                    </p>

                    <button
                        class="btn w"
                        data-a="hcreate"
                    >
                        Crear hogar
                    </button>

                </div>

                <div class="card">

                    <h3>Unirme con código</h3>

                    <input
                        id="hcode"
                        class="g"
                        style="width:100%;text-transform:uppercase"
                        placeholder="Código de 6 caracteres"
                    >

                    <button
                        class="btn w"
                        data-a="hjoin"
                    >
                        Unirme
                    </button>

                </div>

            </div>
        `;

        return html;
    }

    // --------------------------------------------------------
    // DATOS DEL MIEMBRO ACTUAL
    // --------------------------------------------------------

    const me = FB.members[FB.user.uid] || {};

    // Si no se está editando el perfil y el miembro
    // tiene un color guardado, utilizar ese color.
    if (!PEDIT && me.color) {
        PCOL = me.color;
    }

    // --------------------------------------------------------
    // CÓDIGO DE INVITACIÓN
    // --------------------------------------------------------

    html += `
        <div class="card">

            <h3>Código para invitar</h3>

            <div class="code">
                ${esc(FB.code || '')}
            </div>

            <div class="mute">
                Quien se una con este código verá y editará
                las tareas, el calendario, las notas y la
                lista de la compra de la casa.
            </div>

        </div>
    `;

    // --------------------------------------------------------
    // LISTADO DE MIEMBROS
    // --------------------------------------------------------

    html += `
        <div class="card">

            <h3>Miembros</h3>

            ${
                Object.keys(FB.members).map(id => {

                    const member = FB.members[id];

                    return `
                        <div class="row">

                            <span
                                class="dot2"
                                style="
                                    background:${member.color};
                                    width:18px;
                                    height:18px
                                "
                            ></span>

                            <span class="t">

                                ${esc(member.name)}

                                ${
                                    id === FB.user.uid
                                        ? ' <small>(tú)</small>'
                                        : ''
                                }

                                <small>
                                    ${esc(member.email || '')}
                                </small>

                            </span>

                        </div>
                    `;
                }).join('')
            }

        </div>
    `;

    // --------------------------------------------------------
    // PERFIL Y ACCIONES
    // --------------------------------------------------------

    html += `
        <div class="card">

            <h3>Mi perfil</h3>

            <input
                id="hname"
                class="g"
                style="width:100%"
                value="${esc(HNAME || me.name || '')}"
            >

            <div style="margin:10px 0">
                ${dots()}
            </div>

            <button
                class="btn"
                data-a="hsave"
            >
                Guardar
            </button>

            <button
                class="btn s"
                data-a="hleave"
            >
                Salir del hogar
            </button>

        </div>
    `;

    return html;
}
