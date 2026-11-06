
// ============================================================
// FUNCIONES AUXILIARES DE TAREAS Y LISTADOS
// ============================================================

/**
 * Genera las filas HTML de una lista de tareas.
 *
 * @param {Array} l - Lista de tareas.
 * @param {boolean} sd - Indica si se muestran detalles y botones de gestión.
 * @returns {string} HTML de las filas.
 */
function rows(l, sd) {

    if (!l.length) {
        return '<div class="mute">Nada por aquí</div>';
    }

    const today = ds(new Date());

    return l.map(t => {

        // Obtener el color asociado a la tarea.
        const color = wcol(t);

        // Información adicional que se muestra en las vistas
        // que permiten gestionar las tareas.
        const label = sd
            ? `
                <small>
                    ${
                        t.rep
                            ? '↻ ' +
                              (t.rep === 'w' ? 'cada semana' : 'cada mes') +
                              (t.date ? ' desde ' + fdate(t.date) : '')
                            : (
                                t.date
                                    ? fdate(t.date) +
                                      (
                                          t.date < today && !t.done
                                              ? ' · atrasada'
                                              : ''
                                      )
                                    : 'sin fecha'
                            )
                    }
                </small>
            `
            : '';

        // Las tareas recurrentes sin instancia propia (_d)
        // muestran el símbolo de repetición en lugar del checkbox.
        const isRecurringTemplate = sd && t.rep && !t._d;

        const control = isRecurringTemplate
            ? `
                <span
                    class="mute"
                    style="width:38px;text-align:center;font-size:22px"
                >
                    ↻
                </span>
            `
            : `
                <button
                    class="ck${t.done ? ' on' : ''}"
                    data-a="tdone"
                    data-id="${t.id}"
                    data-d="${t._d || ''}"
                >
                    ${t.done ? '✓' : ''}
                </button>
            `;

        // Botón de eliminación: solo aparece en modo de gestión.
        const deleteButton = sd
            ? `
                <button
                    class="x"
                    data-a="tdel"
                    data-id="${t.id}"
                >
                    ✕
                </button>
            `
            : '';

        return `
            <div class="row${t.done ? ' ok' : ''}">
                ${control}

                <span class="t">
                    ${color ? `<span class="dot2" style="background:${color}"></span>` : ''}
                    ${esc(t.text)}
                    ${label}
                </span>

                ${deleteButton}
            </div>
        `;

    }).join('');
}


// ============================================================
// LISTA DE LA COMPRA
// ============================================================

/**
 * Devuelve los productos que todavía no están marcados
 * como comprados.
 *
 * @returns {Array} Productos pendientes de compra.
 */
function pend() {
    return S.shop.filter(s => !s.done);
}


// ============================================================
// EVENTOS DEL CALENDARIO
// ============================================================

/**
 * Obtiene los eventos correspondientes a una fecha.
 *
 * @param {string} x - Fecha en formato utilizado por la aplicación.
 * @returns {Array} Eventos de esa fecha.
 */
function evOf(x) {
    return S.events.filter(e => e.date === x);
}


/**
 * Genera las filas de los eventos programados para hoy.
 *
 * Los eventos importantes muestran una estrella.
 *
 * @returns {string} HTML de los eventos de hoy.
 */
function evHoy() {

    const events = evOf(ds(new Date()));

    return events.map(e => `
        <div class="row">
            <span style="font-size:22px">
                ${e.imp ? '⭐' : '📌'}
            </span>

            <span class="t">
                ${esc(e.text)}
            </span>
        </div>
    `).join('');
}


// ============================================================
// BLOQUE DE INFORMACIÓN ADICIONAL
// CUENTA ATRÁS Y NOTAS
// ============================================================

/**
 * Genera los bloques de cuenta atrás y notas rápidas.
 *
 * La cuenta atrás muestra los próximos cuatro eventos
 * importantes cuya fecha sea hoy o posterior.
 *
 * @returns {string} HTML de los bloques adicionales.
 */
function vExtra() {

    const today = ds(new Date());

    // Seleccionar eventos importantes futuros o de hoy.
    const importantEvents = S.events
        .filter(e => e.imp && e.date >= today)
        .sort((a, b) => a.date < b.date ? -1 : 1)
        .slice(0, 4);

    let html = `
        <div class="g2" style="margin-top:14px">

            <div class="card">
                <h3>Cuenta atrás</h3>
    `;

    // --------------------------------------------------------
    // CUENTA ATRÁS
    // --------------------------------------------------------

    if (importantEvents.length) {

        html += importantEvents.map(e => {

            const days = dleft(e.date);

            const countdown = days <= 1
                ? `<b>${days === 0 ? 'Hoy' : 'Mañana'}</b>`
                : `
                    <span>
                        <span class="cd">${days}</span>
                        días
                    </span>
                `;

            return `
                <div class="row">
                    <span class="t">${esc(e.text)}</span>
                    ${countdown}
                </div>
            `;

        }).join('');

    } else {

        html += `
            <div class="mute">
                Marca un evento como importante (★) en la pestaña Mes.
            </div>
        `;
    }

    // --------------------------------------------------------
    // NOTAS
    // --------------------------------------------------------

    html += `
            </div>

            <div class="card">
                <h3>Notas</h3>
    `;

    html += S.notes.map(n => `
        <div class="note">
            <span class="t">${esc(n.text)}</span>

            <button
                class="x"
                style="color:inherit"
                data-a="ndel"
                data-id="${n.id}"
            >
                ✕
            </button>
        </div>
    `).join('');

    // Formulario para añadir notas rápidas.
    html += `
                <form data-f="note">
                    <input
                        class="g"
                        name="t"
                        placeholder="Nota rápida…"
                        required
                    >

                    <button class="btn">Añadir</button>
                </form>

            </div>
        </div>
    `;

    return html;
}


// ============================================================
// FORMULARIO PARA AÑADIR TAREAS
// ============================================================

/**
 * Genera el formulario para crear una tarea.
 *
 * @param {string} def - Fecha predeterminada del formulario.
 *                       Si no se indica, utiliza la fecha de hoy.
 * @returns {string} HTML del formulario.
 */
function tf(def) {

    const defaultDate = def === undefined
        ? ds(new Date())
        : def;

    let html = `
        <form data-f="task">

            <input
                class="g"
                name="t"
                placeholder="Añadir tarea (ej. cena: gyozas)"
                required
            >

            <input
                type="date"
                name="d"
                value="${defaultDate}"
            >

            <select name="r">
                <option value="">No se repite</option>
                <option value="w">Cada semana</option>
                <option value="m">Cada mes</option>
            </select>
    `;

    // Si existe un hogar compartido, permitir asignar
    // la tarea a una persona concreta o a todos.
    if (FB.hid) {

        html += `
            <select name="w">
                <option value="">Para todos</option>
        `;

        Object.keys(FB.members).forEach(id => {

            html += `
                <option value="${id}">
                    ${esc(FB.members[id].name)}
                </option>
            `;

        });

        html += '</select>';
    }

    html += `
            <button class="btn">Añadir</button>

        </form>
    `;

    return html;
}


// ============================================================
// AGRUPACIÓN DE TAREAS POR PERSONA
// ============================================================

/**
 * Agrupa las tareas según el miembro del hogar asignado.
 *
 * Las tareas cuyo responsable no corresponde a un miembro
 * conocido se agrupan bajo "Para todos".
 *
 * @param {Array} l - Lista de tareas que se van a agrupar.
 * @returns {string} HTML de los grupos de tareas.
 */
function people(l) {

    let html = '';

    // Añadir un grupo vacío para las tareas de todos.
    const ids = Object.keys(FB.members || {}).concat(['']);

    ids.forEach(id => {

        // Seleccionar las tareas asignadas al miembro actual.
        const group = l.filter(t =>
            (FB.members[t.who] ? t.who : '') === id
        );

        if (!group.length) {
            return;
        }

        const member = FB.members[id];

        const name = member
            ? esc(member.name)
            : 'Para todos';

        const color = member
            ? member.color
            : '#9aa79d';

        html += `
            <div
                class="pb"
                style="border-top:4px solid ${color}"
            >
                <h3>${name}</h3>

                ${rows(group, true)}
            </div>
        `;
    });

    // Si no hay tareas, conservar el mensaje de lista vacía.
    return html || rows([], true);
}


// ============================================================
// VISTA PRINCIPAL DE HOY
// ============================================================

/**
 * Construye la pantalla principal del día.
 *
 * Incluye:
 * - Reloj y fecha.
 * - Control del modo nocturno.
 * - Acceso para cerrar sesión.
 * - Información meteorológica.
 * - Próxima tarea pendiente.
 * - Tareas y eventos de hoy.
 * - Lista de la compra pendiente.
 * - Cuenta atrás y notas.
 *
 * @returns {string} HTML completo de la vista.
 */
function vHoy() {

    const today = ds(new Date());

    // Obtener las tareas correspondientes al día actual.
    const todayTasks = todayList();

    // Separar las tareas que todavía están pendientes.
    const pendingTasks = todayTasks.filter(t => !t.done);

    // Obtener los productos pendientes de compra.
    const pendingShopping = pend();

    // --------------------------------------------------------
    // CABECERA: RELOJ, FECHA, CUENTA Y TIEMPO
    // --------------------------------------------------------

    const accountButton = FB.user
        ? `
            <button
                class="btn s"
                data-a="logout"
                style="margin:12px 0 0 8px"
            >
                👤 ${esc(FB.user.email)} · Salir
            </button>
        `
        : '';

    const header = `
        <div class="top">

            <div>
                <div id="hora" class="clock"></div>

                <div
                    id="fecha"
                    class="sub"
                    style="text-transform:capitalize"
                ></div>

                <button
                    class="btn s"
                    id="nbtn"
                    data-a="night"
                    style="margin-top:12px"
                ></button>

                ${accountButton}
            </div>

            ${wx()}

        </div>
    `;

    // --------------------------------------------------------
    // PRÓXIMA TAREA
    // --------------------------------------------------------

    const nextTask = `
        <div class="next">

            <small>Próxima tarea · hoy</small>

            <h2>
                ${
                    pendingTasks.length
                        ? esc(pendingTasks[0].text)
                        : 'Hoy no queda nada pendiente'
                }
            </h2>

        </div>
    `;

    // --------------------------------------------------------
    // TARJETA DE TAREAS Y EVENTOS
    // --------------------------------------------------------

    const taskContent = FB.hid
        ? people(todayTasks)
        : rows(todayTasks, true);

    const tasksCard = `
        <div class="card">

            <h3>Tareas de hoy</h3>

            ${evHoy()}

            ${taskContent}

            ${tf()}

        </div>
    `;

    // --------------------------------------------------------
    // TARJETA DE LA COMPRA
    // --------------------------------------------------------

    const shoppingContent = pendingShopping.length
        ? pendingShopping
            .slice(0, 8)
            .map(s => esc(s.name))
            .join(' · ')
        : '<span class="mute">Todo en casa</span>';

    const shoppingCard = `
        <div class="card">

            <h3>
                Compra · ${pendingShopping.length} por comprar
            </h3>

            ${shoppingContent}

        </div>
    `;

    // --------------------------------------------------------
    // CONSTRUIR VISTA COMPLETA
    // --------------------------------------------------------

    return `
        ${header}

        ${nextTask}

        <div class="g2">
            ${tasksCard}
            ${shoppingCard}
        </div>

        ${vExtra()}
    `;
}
