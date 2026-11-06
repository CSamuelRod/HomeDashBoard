
// ============================================================
// VISTA DE TAREAS DE LA CASA
// ============================================================

/**
 * Genera la vista principal de tareas.
 *
 * Incluye:
 * - Título de la sección.
 * - Listado de tareas ordenadas.
 * - Formulario para añadir tareas.
 * - Botón para eliminar tareas completadas.
 * - Información de la cuenta y sincronización.
 *
 * @returns {string} HTML completo de la vista.
 */
function vTareas() {

    // Crear una copia del listado para no modificar
    // directamente el orden de las tareas originales.
    const tasks = S.tasks.slice().sort((a, b) => {

        // Las tareas pendientes aparecen antes que las completadas.
        const completionOrder = a.done - b.done;

        if (completionOrder !== 0) {
            return completionOrder;
        }

        // Ordenar las tareas por fecha.
        // Las tareas sin fecha mantienen el criterio original.
        const dateA = a.date || '9';
        const dateB = b.date || '9';

        return dateA < dateB ? -1 : 1;
    });

    // Construir la vista completa
    return `
        <h1>Tareas de la casa</h1>

        <div class="card">
            ${rows(tasks, true)}
        </div>

        ${tf()}

        <form>
            <button
                type="button"
                class="btn s"
                data-a="tclean"
            >
                Quitar completadas
            </button>
        </form>

        ${accCard()}
    `;
}


// ============================================================
// TARJETA DE CUENTA Y ESTADO DE SINCRONIZACIÓN
// ============================================================

/**
 * Genera la tarjeta de información de la cuenta.
 *
 * Muestra:
 * - Errores de sincronización con Firebase.
 * - Correo electrónico del usuario autenticado.
 * - Botón para cerrar sesión.
 * - Aviso de funcionamiento en modo local.
 *
 * @returns {string} HTML de la tarjeta de cuenta.
 */
function accCard() {

    // --------------------------------------------------------
    // MENSAJE DE ERROR DE FIREBASE
    // --------------------------------------------------------

    const errorMessage = FB.err
        ? `
            <div style="color:var(--r);margin-bottom:8px">
                ⚠️ No se pudo guardar en la nube
                (${esc(FB.err)}).
                Revisa las reglas de Firestore.
            </div>
        `
        : '';

    // --------------------------------------------------------
    // INFORMACIÓN DEL USUARIO
    // --------------------------------------------------------

    const accountInfo = FB.user
        ? `
            ${esc(FB.user.email)}

            <button
                class="btn s"
                data-a="logout"
            >
                Salir
            </button>
        `
        : `
            <span class="mute">
                Modo local: Firebase no está configurado,
                los datos solo se guardan en este navegador.
            </span>
        `;

    // --------------------------------------------------------
    // CONSTRUIR TARJETA COMPLETA
    // --------------------------------------------------------

    return `
        <div class="card" style="margin-top:14px">

            <h3>Cuenta</h3>

            ${errorMessage}

            ${accountInfo}

        </div>
    `;
}
