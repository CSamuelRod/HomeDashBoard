
// ============================================================
// ESTADO DEL CALENDARIO
// ============================================================

// Desplazamiento respecto al mes actual.
// 0 = mes actual, -1 = mes anterior, 1 = mes siguiente.
let MO = 0;

// Fecha seleccionada en el calendario.
let SEL = '';


// ============================================================
// VISTA DEL CALENDARIO MENSUAL
// ============================================================

/**
 * Construye el calendario del mes seleccionado.
 *
 * Muestra:
 * - Navegación entre meses.
 * - Días de la semana.
 * - Eventos y tareas de cada día.
 * - Detalle del día seleccionado.
 * - Formulario para añadir eventos y tareas.
 *
 * @returns {string} HTML del calendario mensual.
 */
function vMes() {

    const now = new Date();
    const today = ds(now);

    // Calcular el mes que se debe mostrar.
    const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() + MO,
        1
    );

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // Si todavía no hay una fecha seleccionada,
    // seleccionar automáticamente el día de hoy.
    if (!SEL) {
        SEL = today;
    }

    // Día de la semana en que comienza el mes.
    // Se adapta para que la semana empiece en lunes.
    const offset = (monthDate.getDay() + 6) % 7;

    // Número de días del mes.
    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    // --------------------------------------------------------
    // CABECERA Y NAVEGACIÓN
    // --------------------------------------------------------

    let html = `
        <div class="top">

            <h1 style="text-transform:capitalize">
                ${monthDate.toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric'
                })}
            </h1>

            <div>
                <button
                    class="btn s"
                    data-a="mnav"
                    data-id="-1"
                >
                    ‹
                </button>

                <button
                    class="btn s"
                    data-a="mnav"
                    data-id="0"
                >
                    Hoy
                </button>

                <button
                    class="btn s"
                    data-a="mnav"
                    data-id="1"
                >
                    ›
                </button>
            </div>

        </div>

        <div class="cal">
    `;

    // --------------------------------------------------------
    // ENCABEZADOS DE LOS DÍAS DE LA SEMANA
    // --------------------------------------------------------

    const weekdays = [
        'Lun',
        'Mar',
        'Mié',
        'Jue',
        'Vie',
        'Sáb',
        'Dom'
    ];

    html += weekdays
        .map(day => `<div class="wk">${day}</div>`)
        .join('');

    // Añadir espacios antes del primer día del mes
    // para colocarlo en la columna correspondiente.
    for (let i = 0; i < offset; i++) {
        html += '<div></div>';
    }

    // --------------------------------------------------------
    // GENERAR LOS DÍAS DEL MES
    // --------------------------------------------------------

    for (let day = 1; day <= daysInMonth; day++) {

        // Fecha en formato YYYY-MM-DD.
        const date =
            year + '-' +
            p2(month + 1) + '-' +
            p2(day);

        // Obtener los eventos del día.
        const events = evOf(date);

        // Obtener las tareas del día.
        const tasks = tasksOn(date);

        // Clases del día: hoy y seleccionado.
        const cellClasses =
            'cell' +
            (date === today ? ' today' : '') +
            (date === SEL ? ' sel' : '');

        html += `
            <button
                class="${cellClasses}"
                data-a="sel"
                data-d="${date}"
            >
                <b>${day}</b>
        `;

        // Generar elementos visuales para eventos y tareas.
        const eventItems = events.map(event => `
            <span class="ev${event.imp ? ' i' : ''}">
                ${esc(event.text)}
            </span>
        `);

        const taskItems = tasks.map(task => `
            <span
                class="ev t${task.done ? ' d' : ''}"
                ${wst(task)}
            >
                ${task.done ? '✓ ' : '☐ '}
                ${esc(task.text)}
            </span>
        `);

        // Mostrar primero los eventos y después las tareas.
        const items = eventItems.concat(taskItems);

        // Limitar la vista previa a tres elementos.
        html += items.slice(0, 3).join('');

        // Indicar cuántos elementos adicionales hay.
        if (items.length > 3) {

            html += `
                <span class="mute">
                    +${items.length - 3} más
                </span>
            `;
        }

        html += '</button>';
    }

    html += '</div>';

    // --------------------------------------------------------
    // DETALLE DEL DÍA SELECCIONADO
    // --------------------------------------------------------

    const selectedEvents = evOf(SEL);

    // Utilizar el mediodía para evitar posibles
    // desplazamientos de fecha por cambios horarios.
    const selectedDate = new Date(SEL + 'T12:00:00');

    html += `
        <div class="card" style="margin-top:14px">

            <h3>
                ${selectedDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                })}
            </h3>
    `;

    // --------------------------------------------------------
    // EVENTOS DEL DÍA
    // --------------------------------------------------------

    if (selectedEvents.length) {

        html += selectedEvents.map(event => {

            const importantClass = event.imp ? ' imp' : '';

            const starStyle = event.imp
                ? ''
                : ' style="color:#5b7a96"';

            return `
                <div class="row">

                    <button
                        class="ck${importantClass}"
                        ${starStyle}
                        data-a="eimp"
                        data-id="${event.id}"
                    >
                        ★
                    </button>

                    <span class="t">
                        ${esc(event.text)}
                    </span>

                    <button
                        class="x"
                        data-a="edel"
                        data-id="${event.id}"
                    >
                        ✕
                    </button>

                </div>
            `;
        }).join('');

    } else {

        html += `
            <div class="mute">
                Sin eventos este día
            </div>
        `;
    }

    // --------------------------------------------------------
    // TAREAS DEL DÍA
    // --------------------------------------------------------

    html += `
            <h3 style="margin-top:12px">
                Tareas
            </h3>

            ${rows(tasksOn(SEL), false)}

            ${tf(SEL)}
    `;

    // --------------------------------------------------------
    // FORMULARIO PARA AÑADIR EVENTOS
    // --------------------------------------------------------

    html += `
            <form data-f="event">

                <input
                    class="g"
                    name="t"
                    placeholder="Nuevo evento (ej. cumpleaños)"
                    required
                >

                <input
                    type="date"
                    name="d"
                    value="${SEL}"
                >

                <label>
                    <input type="checkbox" name="i">
                    Importante (cuenta atrás)
                </label>

                <button class="btn">Añadir</button>

            </form>

        </div>
    `;

    return html;
}


// ============================================================
// VISTA SEMANAL
// ============================================================

/**
 * Construye el resumen de la semana actual.
 *
 * Muestra los siete días de la semana, sus eventos,
 * las tareas programadas y las tareas sin fecha.
 *
 * @returns {string} HTML del resumen semanal.
 */
function vSemana() {

    let html = `
        <h1>La semana</h1>

        <div class="card">
    `;

    // Obtener la fecha actual y retroceder hasta el lunes
    // de la semana en curso.
    const weekStart = new Date();

    weekStart.setDate(
        weekStart.getDate() - HOY
    );

    // --------------------------------------------------------
    // GENERAR LOS SIETE DÍAS DE LA SEMANA
    // --------------------------------------------------------

    for (let day = 0; day < 7; day++) {

        // Crear la fecha correspondiente al día actual
        // de la semana que estamos recorriendo.
        const date = new Date(
            weekStart.getFullYear(),
            weekStart.getMonth(),
            weekStart.getDate() + day
        );

        const dateKey = ds(date);

        // Obtener las tareas y eventos del día.
        const tasks = tasksOn(dateKey);
        const events = evOf(dateKey);

        // Clase especial para destacar el día actual.
        const dayClass = day === HOY
            ? 'd hoy'
            : 'd';

        html += `
            <div class="row">

                <div class="${dayClass}">
                    ${DIAS[day].slice(0, 3)}
                    ${date.getDate()}
                </div>

                <div class="t">
        `;

        // Mostrar los eventos del día.
        events.forEach(event => {

            html += `
                <span
                    class="ev${event.imp ? ' i' : ''}"
                    style="display:inline-block;margin-right:6px"
                >
                    ${event.imp ? '⭐ ' : '📌 '}
                    ${esc(event.text)}
                </span>
            `;
        });

        // Mostrar las tareas del día.
        html += tasks.map(chipT).join('');

        // Si no hay eventos ni tareas, mostrar un guion.
        if (!tasks.length && !events.length) {
            html += '<span class="mute">—</span>';
        }

        html += `
                </div>

            </div>
        `;
    }

    // --------------------------------------------------------
    // TAREAS SIN FECHA
    // --------------------------------------------------------

    const undatedTasks = S.tasks.filter(task => !task.date);

    if (undatedTasks.length) {

        html += `
            <div class="row">

                <div class="d">
                    Sin fecha
                </div>

                <div class="t">
                    ${undatedTasks.map(chipT).join('')}
                </div>

            </div>
        `;
    }

    html += '</div>';

    // Formulario para añadir una nueva tarea.
    html += tf();

    return html;
}
