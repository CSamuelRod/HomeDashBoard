
// ============================================================
// CONFIGURACIÓN DE FITNESS
// ============================================================

// Pestaña activa: "run" para running o "mus" para musculación.
let FT = 'run';

// Desplazamiento del histórico mensual.
// 0 = mes actual, -1 = mes anterior, 1 = mes siguiente.
let RM = 0;


// ============================================================
// CATÁLOGO DE EJERCICIOS
// ============================================================

// Categorías y ejercicios disponibles para crear la rutina.
const EX = [
    [
        'Piernas',
        [
            'Sentadilla',
            'Sentadilla sumo',
            'Sentadilla con salto',
            'Sentadilla búlgara',
            'Sentadilla isométrica',
            'Zancada',
            'Zancada lateral',
            'Zancada inversa',
            'Puente de glúteo',
            'Elevación de talones'
        ]
    ],
    [
        'Flexiones',
        [
            'Flexión estándar',
            'Flexión inclinada',
            'Flexión declinada',
            'Flexión diamante',
            'Flexión abierta',
            'Flexión en pica',
            'Flexión arquera'
        ]
    ],
    [
        'Dominadas',
        [
            'Dominada prona',
            'Dominada supina',
            'Dominada neutra',
            'Dominada asistida',
            'Dominada australiana',
            'Dominada negativa'
        ]
    ],
    [
        'Core',
        [
            'Plancha',
            'Plancha lateral',
            'Abdominales',
            'Elevación de piernas',
            'Mountain climbers',
            'Superman'
        ]
    ],
    [
        'Fondos y otros',
        [
            'Fondos en paralelas',
            'Fondos en banco',
            'Burpees'
        ]
    ]
];


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Redondea un número a dos decimales y utiliza coma
 * como separador decimal.
 *
 * @param {number} n - Número que se quiere formatear.
 * @returns {string} Número formateado.
 */
function nf(n) {
    return String(Math.round(n * 100) / 100).replace('.', ',');
}


/**
 * Busca un ejercicio dentro de la rutina actual.
 *
 * @param {string} n - Nombre del ejercicio.
 * @returns {Object|undefined} Ejercicio encontrado o undefined.
 */
function inR(n) {
    return S.fit.routine.filter(x => x.name === n)[0];
}


// ============================================================
// VISTA PRINCIPAL DE FITNESS
// ============================================================

/**
 * Muestra el encabezado de Fitness y la sección seleccionada.
 *
 * @returns {string} HTML de la vista.
 */
function vFit() {

    const runningButton = `
        <button
            class="btn${FT === 'run' ? '' : ' s'}"
            data-a="ft"
            data-id="run"
        >
            🏃 Running
        </button>
    `;

    const muscleButton = `
        <button
            class="btn${FT === 'mus' ? '' : ' s'}"
            data-a="ft"
            data-id="mus"
        >
            💪 Musculación
        </button>
    `;

    return `
        <div class="top">

            <h1>Fitness</h1>

            <div>
                ${runningButton}
                ${muscleButton}
            </div>

        </div>

        ${FT === 'run' ? vRun() : vMus()}
    `;
}


// ============================================================
// RUNNING
// ============================================================

/**
 * Construye la vista de running.
 *
 * Incluye:
 * - Progreso de la meta diaria o semanal.
 * - Formulario para registrar salidas.
 * - Histórico mensual.
 * - Estadísticas del mes.
 *
 * @returns {string} HTML de la vista de running.
 */
function vRun() {

    const fitness = S.fit;
    const goal = fitness.goal;

    const now = new Date();
    const today = ds(now);

    // --------------------------------------------------------
    // CALCULAR EL PERIODO DE LA META
    // --------------------------------------------------------

    const periodStart = new Date(now);

    periodStart.setDate(now.getDate() - HOY);

    const startDate = ds(periodStart);

    periodStart.setDate(periodStart.getDate() + 6);

    const endDate = ds(periodStart);

    // --------------------------------------------------------
    // CALCULAR LOS KILÓMETROS ACUMULADOS
    // --------------------------------------------------------

    let totalKm = 0;

    fitness.runs.forEach(run => {

        const matchesPeriod = goal.per === 'dia'
            ? run.date === today
            : run.date >= startDate && run.date <= endDate;

        if (matchesPeriod) {
            totalKm += run.km;
        }
    });

    // Porcentaje de cumplimiento de la meta.
    const progress = goal.km > 0
        ? Math.min(100, Math.round(totalKm / goal.km * 100))
        : 0;

    // --------------------------------------------------------
    // TARJETA DE OBJETIVO
    // --------------------------------------------------------

    let html = `
        <div class="card">

            <h3>
                Meta ${goal.per === 'dia' ? 'de hoy' : 'de esta semana'}
            </h3>

            <span class="cd">${nf(totalKm)}</span>
            de ${nf(goal.km)} km · ${progress}%

            <div class="bar">
                <i style="width:${progress}%"></i>
            </div>
    `;

    // Mostrar el mensaje cuando se alcanza el objetivo.
    if (goal.km > 0 && totalKm >= goal.km) {
        html += '<b>¡Meta cumplida! 🎉</b>';
    }

    // Formulario para configurar la meta.
    html += `
            <form data-f="goal">

                <select name="p">
                    <option
                        value="dia"
                        ${goal.per === 'dia' ? 'selected' : ''}
                    >
                        Por día
                    </option>

                    <option
                        value="semana"
                        ${goal.per === 'semana' ? 'selected' : ''}
                    >
                        Por semana
                    </option>
                </select>

                <input
                    name="k"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value="${goal.km}"
                    style="width:100px"
                >

                <button class="btn s">Guardar meta</button>

            </form>

        </div>
    `;

    // --------------------------------------------------------
    // FORMULARIO PARA REGISTRAR UNA SALIDA
    // --------------------------------------------------------

    html += `
        <div class="card">

            <h3>Apuntar salida</h3>

            <form data-f="run">

                <input
                    type="date"
                    name="d"
                    value="${today}"
                >

                <input
                    name="k"
                    type="number"
                    step="0.01"
                    min="0.1"
                    placeholder="km"
                    style="width:90px"
                    required
                >

                <input
                    name="v"
                    type="number"
                    step="0.1"
                    min="1"
                    placeholder="km/h"
                    style="width:90px"
                >

                <button class="btn">Añadir</button>

            </form>

        </div>
    `;

    // --------------------------------------------------------
    // DETERMINAR EL MES DEL HISTÓRICO
    // --------------------------------------------------------

    const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() + RM,
        1
    );

    const selectedMonth =
        monthDate.getFullYear() + '-' + p2(monthDate.getMonth() + 1);

    // Obtener las salidas correspondientes al mes seleccionado.
    const monthlyRuns = fitness.runs
        .filter(run => run.date.slice(0, 7) === selectedMonth)
        .sort((a, b) => a.date < b.date ? 1 : -1);

    // --------------------------------------------------------
    // CALCULAR ESTADÍSTICAS DEL MES
    // --------------------------------------------------------

    let monthlyKm = 0;
    let bestSpeed = 0;
    let speedTotal = 0;
    let speedCount = 0;

    monthlyRuns.forEach(run => {

        monthlyKm += run.km;

        if (run.v) {

            speedTotal += run.v;
            speedCount++;

            if (run.v > bestSpeed) {
                bestSpeed = run.v;
            }
        }
    });

    const averageSpeed = speedCount
        ? nf(speedTotal / speedCount)
        : '–';

    // Nombre del mes en español.
    const monthName = monthDate.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
    });

    // --------------------------------------------------------
    // TARJETA DEL HISTÓRICO
    // --------------------------------------------------------

    html += `
        <div class="card">

            <div class="top">

                <h3 style="text-transform:capitalize">
                    Histórico · ${monthName}
                </h3>

                <div>
                    <button
                        class="btn s"
                        data-a="rnav"
                        data-id="-1"
                    >
                        ‹
                    </button>

                    <button
                        class="btn s"
                        data-a="rnav"
                        data-id="1"
                    >
                        ›
                    </button>
                </div>

            </div>

            <div class="stats">

                <div>
                    <b>${nf(monthlyKm)}</b>
                    km totales
                </div>

                <div>
                    <b>${monthlyRuns.length}</b>
                    salidas
                </div>

                <div>
                    <b>${bestSpeed ? nf(bestSpeed) : '–'}</b>
                    mejor km/h
                </div>

                <div>
                    <b>${averageSpeed}</b>
                    km/h medio
                </div>

            </div>
    `;

    // --------------------------------------------------------
    // LISTADO DE SALIDAS DEL MES
    // --------------------------------------------------------

    if (monthlyRuns.length) {

        html += monthlyRuns.map(run => {

            const dateLabel =
                run.date.slice(8) + '/' + run.date.slice(5, 7);

            const speedInfo = run.v
                ? `
                    · ${nf(run.v)} km/h
                    · ${Math.round(run.km / run.v * 60)} min
                `
                : '';

            return `
                <div class="row">

                    <span class="t">
                        ${dateLabel} ·
                        <b>${nf(run.km)} km</b>
                        ${speedInfo}
                    </span>

                    <button
                        class="x"
                        data-a="rdel"
                        data-id="${run.id}"
                    >
                        ✕
                    </button>

                </div>
            `;

        }).join('');

    } else {

        html += `
            <div class="mute">
                Sin salidas este mes
            </div>
        `;
    }

    return html + '</div>';
}


// ============================================================
// MUSCULACIÓN
// ============================================================

/**
 * Construye la vista de musculación.
 *
 * Incluye:
 * - Rutina configurada para hoy.
 * - Controles para modificar series y repeticiones.
 * - Eliminación de ejercicios.
 * - Registro de rutina completada.
 * - Catálogo de ejercicios disponibles.
 *
 * @returns {string} HTML de la vista de musculación.
 */
function vMus() {

    const fitness = S.fit;
    const today = ds(new Date());

    // Comprobar si la rutina de hoy está completada.
    const isDone = fitness.done[today];

    // Mes actual en formato YYYY-MM.
    const currentMonth = today.slice(0, 7);

    // --------------------------------------------------------
    // CONTAR LOS DÍAS COMPLETADOS DURANTE EL MES
    // --------------------------------------------------------

    let completedDays = 0;

    for (const date in fitness.done) {

        if (
            fitness.done[date] &&
            date.slice(0, 7) === currentMonth
        ) {
            completedDays++;
        }
    }

    // --------------------------------------------------------
    // TARJETA DE LA RUTINA ACTUAL
    // --------------------------------------------------------

    let html = `
        <div class="card">

            <h3>Rutina de hoy</h3>
    `;

    if (fitness.routine.length) {

        // Mostrar los ejercicios configurados en la rutina.
        html += fitness.routine.map(exercise => {

            return `
                <div class="row">

                    <span class="t">
                        ${esc(exercise.name)}
                    </span>

                    <button
                        class="sm"
                        data-a="rsets"
                        data-id="${exercise.id}"
                        data-d="-1"
                    >
                        −
                    </button>

                    <span class="q">${exercise.sets}</span>

                    <button
                        class="sm"
                        data-a="rsets"
                        data-id="${exercise.id}"
                        data-d="1"
                    >
                        +
                    </button>

                    <span class="mute">series ×</span>

                    <button
                        class="sm"
                        data-a="rreps"
                        data-id="${exercise.id}"
                        data-d="-1"
                    >
                        −
                    </button>

                    <span class="q">${exercise.reps}</span>

                    <button
                        class="sm"
                        data-a="rreps"
                        data-id="${exercise.id}"
                        data-d="1"
                    >
                        +
                    </button>

                    <button
                        class="x"
                        data-a="rquit"
                        data-id="${exercise.id}"
                    >
                        ✕
                    </button>

                </div>
            `;

        }).join('');

    } else {

        html += `
            <div class="mute">
                Elige ejercicios abajo para montar tu rutina.
            </div>
        `;
    }

    // --------------------------------------------------------
    // BOTÓN DE FINALIZACIÓN DE LA RUTINA
    // --------------------------------------------------------

    const doneButtonText = isDone
        ? '✓ Rutina completada hoy (toca para deshacer)'
        : 'Rutina completada';

    const doneButtonColor = isDone
        ? '#8a9a8f'
        : '#3a6b4f';

    html += `
            <button
                class="btn w"
                style="background:${doneButtonColor}"
                data-a="rdone"
            >
                ${doneButtonText}
            </button>

            <div class="mute" style="margin-top:8px">
                Días completados este mes: ${completedDays}
            </div>

        </div>
    `;

    // --------------------------------------------------------
    // CATÁLOGO DE EJERCICIOS
    // --------------------------------------------------------

    html += `
        <h3>
            Ejercicios (sin peso) · toca para añadir o quitar
        </h3>

        <div class="cg">
    `;

    EX.forEach((category, index) => {

        const categoryName = category[0];
        const exercises = category[1];

        html += `
            <div
                class="cat"
                style="background:${TINT[index]}"
            >
                <h3>${categoryName}</h3>
        `;

        exercises.forEach(name => {

            // Marcar los ejercicios que ya están en la rutina.
            const isSelected = inR(name);

            html += `
                <button
                    class="chip${isSelected ? ' on' : ''}"
                    data-a="ex"
                    data-n="${esc(name)}"
                >
                    ${esc(name)}
                </button>
            `;
        });

        html += '</div>';
    });

    html += '</div>';

    return html;
}
