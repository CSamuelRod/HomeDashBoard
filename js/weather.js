
// ============================================================
// RELOJ Y FECHA
// ============================================================

/**
 * Actualiza la hora, la fecha y el día de la semana.
 *
 * Utiliza la zona horaria proporcionada por Open-Meteo
 * cuando está disponible.
 */
function reloj() {
    const date = new Date();
    const minutes = date.getMinutes();
    const hours = date.getHours();

    // Día de la semana: lunes = 0, domingo = 6
    HOY = (date.getDay() + 6) % 7;

    const hourElement = $('hora');
    const dateElement = $('fecha');

    // Aplicar o quitar el modo nocturno
    document.body.className = S.night === 'on' ? 'night' : '';

    // Actualizar el texto del botón de modo nocturno
    const nightButton = $('nbtn');

    if (nightButton) {
        nightButton.textContent = S.night === 'on'
            ? '☀️ Quitar modo noche'
            : '🌙 Modo noche';
    }

    // Utilizar la zona horaria de la ubicación meteorológica
    const timezone = W && W.timezone
        ? W.timezone
        : undefined;

    try {
        // Mostrar la hora
        if (hourElement) {
            hourElement.textContent = date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
                timeZone: timezone
            });
        }

        // Mostrar la fecha
        if (dateElement) {
            dateElement.textContent = date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: timezone
            });
        }

    } catch (error) {
        // Si falla la zona horaria, utilizar la hora local
        if (hourElement) {
            hourElement.textContent =
                `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
        }

        if (dateElement) {
            dateElement.textContent = date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
    }
}


// Actualizar el reloj cada 30 segundos
setInterval(reloj, 30000);


// ============================================================
// INTERPRETACIÓN DE LOS CÓDIGOS METEOROLÓGICOS
// ============================================================

/**
 * Traduce los códigos meteorológicos de Open-Meteo
 * a un icono y una descripción en español.
 *
 * @param {number} code - Código meteorológico de Open-Meteo.
 * @returns {Array} Icono y descripción del tiempo.
 */
function wc(code) {

    // Cielo despejado
    if (code === 0) {
        return ['☀️', 'Despejado'];
    }

    // Parcialmente nublado
    if (code <= 2) {
        return ['⛅', 'Parcialmente nublado'];
    }

    // Nublado
    if (code === 3) {
        return ['☁️', 'Nublado'];
    }

    // Niebla
    if (code === 45 || code === 48) {
        return ['🌫️', 'Niebla'];
    }

    // Llovizna
    if (code >= 51 && code <= 57) {
        return ['🌦️', 'Llovizna'];
    }

    // Lluvia
    if (code >= 61 && code <= 67) {
        return ['🌧️', 'Lluvia'];
    }

    // Nieve
    if (code >= 71 && code <= 77) {
        return ['❄️', 'Nieve'];
    }

    // Chubascos
    if (code >= 80 && code <= 82) {
        return ['🌦️', 'Chubascos'];
    }

    // Tormentas
    if (code >= 95) {
        return ['⛈️', 'Tormenta'];
    }

    // Código no contemplado
    return ['🌡️', '—'];
}


// ============================================================
// CONFIGURACIÓN DE UBICACIÓN
// ============================================================

// Ubicación inicial: Madrid
var LOC = {
    lat: 40.42,
    lon: -3.70,
    name: 'Madrid',
    mode: 'manual'
};

// Resultados de búsqueda de ciudades
var LRES = [];

// Indica si está abierto el selector de ubicación
var LOCF = false;

// Mensaje informativo sobre la ubicación
var LMSG = '';


// ============================================================
// PETICIONES HTTP
// ============================================================

/**
 * Realiza una petición GET y procesa la respuesta JSON.
 *
 * @param {string} url - Dirección de la petición.
 * @param {Function} onSuccess - Función ejecutada si todo va bien.
 * @param {Function} onError - Función ejecutada si ocurre un error.
 */
function xget(url, onSuccess, onError) {
    const request = new XMLHttpRequest();

    request.open('GET', url);

    // Procesar la respuesta
    request.onload = () => {
        try {
            onSuccess(JSON.parse(request.responseText));
        } catch (error) {
            if (onError) {
                onError();
            }
        }
    };

    // Gestionar errores de conexión
    request.onerror = () => {
        if (onError) {
            onError();
        }
    };

    request.send();
}


// ============================================================
// OBTENER INFORMACIÓN METEOROLÓGICA
// ============================================================

/**
 * Consulta la previsión meteorológica de la ubicación actual.
 *
 * Obtiene:
 * - Temperatura actual.
 * - Código del estado meteorológico.
 * - Previsión de máximas y mínimas.
 * - Probabilidad máxima de precipitación.
 * - Previsión para los próximos siete días.
 */
function fetchW() {

    const url =
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${LOC.lat}` +
        `&longitude=${LOC.lon}` +
        `&current=temperature_2m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto` +
        `&forecast_days=7`;

    xget(
        url,

        // -----------------------------------------------
        // RESPUESTA CORRECTA
        // -----------------------------------------------

        result => {
            W = result;
            WERR = false;

            // Actualizar el reloj con la nueva zona horaria
            reloj();

            // Redibujar únicamente si estamos en la vista de hoy
            if (tab === 'hoy') {
                draw();
            }
        },

        // -----------------------------------------------
        // ERROR DE CONEXIÓN
        // -----------------------------------------------

        () => {
            WERR = true;

            if (tab === 'hoy') {
                draw();
            }
        }
    );
}


// ============================================================
// CAMBIAR LA UBICACIÓN
// ============================================================

/**
 * Establece una nueva ubicación y guarda la configuración.
 *
 * @param {Object} location - Datos de la nueva ubicación.
 */
function setLoc(location) {
    LOC = location;
    S.loc = location;

    LMSG = '';

    // Guardar la ubicación seleccionada
    save();

    // Actualizar la previsión meteorológica
    fetchW();
}


// ============================================================
// OBTENER LA UBICACIÓN ACTUAL DEL DISPOSITIVO
// ============================================================

/**
 * Solicita permiso al navegador para obtener la ubicación.
 *
 * Después intenta identificar la ciudad mediante
 * el servicio de geocodificación inversa de BigDataCloud.
 */
function geo() {

    // Comprobar si el navegador permite obtener la ubicación
    if (!navigator.geolocation) {
        LMSG =
            'Este navegador no da la ubicación. Busca tu ciudad.';

        fetchW();
        return;
    }

    navigator.geolocation.getCurrentPosition(

        // -----------------------------------------------
        // UBICACIÓN OBTENIDA CORRECTAMENTE
        // -----------------------------------------------

        position => {

            // Redondear las coordenadas a dos decimales
            const latitude = Math.round(
                position.coords.latitude * 100
            ) / 100;

            const longitude = Math.round(
                position.coords.longitude * 100
            ) / 100;

            // Consultar el nombre de la ciudad
            const url =
                'https://api.bigdatacloud.net/data/reverse-geocode-client?' +
                `latitude=${latitude}` +
                `&longitude=${longitude}` +
                '&localityLanguage=es';

            xget(
                url,

                // Ciudad identificada correctamente
                result => {
                    setLoc({
                        mode: 'auto',
                        lat: latitude,
                        lon: longitude,
                        name: result.city ||
                            result.locality ||
                            'Mi ubicación'
                    });
                },

                // Si falla la identificación de la ciudad,
                // conservar las coordenadas obtenidas
                () => {
                    setLoc({
                        mode: 'auto',
                        lat: latitude,
                        lon: longitude,
                        name: 'Mi ubicación'
                    });
                }
            );
        },

        // -----------------------------------------------
        // ERROR AL OBTENER LA UBICACIÓN
        // -----------------------------------------------

        () => {
            LMSG =
                'No he podido obtener la ubicación ' +
                '(permiso o navegador). Busca tu ciudad.';

            fetchW();

            if (tab === 'hoy') {
                draw();
            }
        },

        // Opciones de geolocalización
        {
            timeout: 15000,
            maximumAge: 600000
        }
    );
}


// ============================================================
// CARGA AUTOMÁTICA DEL TIEMPO
// ============================================================

/**
 * Decide cómo obtener la información meteorológica:
 *
 * - Ubicación automática: vuelve a solicitar la posición.
 * - Ubicación manual: utiliza las coordenadas guardadas.
 */
function loadW() {
    if (LOC.mode === 'auto') {
        geo();
    } else {
        fetchW();
    }
}


// ============================================================
// SELECTOR DE UBICACIÓN
// ============================================================

/**
 * Genera el HTML del selector de ubicación.
 *
 * Permite:
 * - Consultar la ubicación actual.
 * - Buscar una ciudad.
 * - Seleccionar una ciudad de los resultados.
 *
 * @returns {string} HTML del selector.
 */
function locBar() {

    // Botón principal con la ubicación actual
    let html = `
        <div style="margin-bottom:6px">
            <button class="btn s" data-a="locf">
                📍 ${esc(LOC.name || 'Madrid')}${LOC.mode === 'auto' ? ' (auto)' : ''} · cambiar
            </button>
        </div>
    `;

    // Mostrar mensajes informativos o errores
    if (LMSG) {
        html += `
            <div class="mute" style="margin-bottom:6px">
                ${esc(LMSG)}
            </div>
        `;
    }

    // Si el selector está cerrado, devolver el contenido actual
    if (!LOCF) {
        return html;
    }

    // Panel de selección y búsqueda
    html += `
        <div class="card">

            <button
                class="btn w"
                style="margin:0 0 8px"
                data-a="geo"
            >
                📍 Usar mi ubicación actual
            </button>

            <form data-f="city">
                <input
                    class="g"
                    name="q"
                    placeholder="Buscar ciudad (ej. Zúrich)"
                    required
                >

                <button class="btn">
                    Buscar
                </button>
            </form>
    `;

    // Mostrar las ciudades encontradas
    LRES.forEach((result, index) => {

        const locationName =
            result.name +
            (result.admin1 ? `, ${result.admin1}` : '') +
            ' · ' +
            (result.country || '');

        html += `
            <button
                class="chip"
                data-a="locset"
                data-id="${index}"
            >
                ${esc(locationName)}
            </button>
        `;
    });

    html += '</div>';

    return html;
}


// ============================================================
// BLOQUE METEOROLÓGICO COMPLETO
// ============================================================

/**
 * Combina el selector de ubicación con la previsión meteorológica.
 *
 * @returns {string} HTML del bloque meteorológico.
 */
function wx() {
    return `
        <div>
            ${locBar()}
            ${wx0()}
        </div>
    `;
}


// ============================================================
// PREVISIÓN METEOROLÓGICA
// ============================================================

/**
 * Genera el contenido visual de la previsión meteorológica.
 *
 * Muestra:
 * - Temperatura actual.
 * - Estado del cielo.
 * - Temperaturas máximas y mínimas de hoy.
 * - Aviso de lluvia.
 * - Previsión de los próximos siete días.
 *
 * @returns {string} HTML de la previsión.
 */
function wx0() {

    // --------------------------------------------------------
    // ESTADO DE CARGA O ERROR
    // --------------------------------------------------------

    if (!W) {
        return `
            <div class="mute">
                ${WERR
                    ? 'Sin conexión: no hay tiempo.'
                    : 'Cargando el tiempo…'
                }
            </div>
        `;
    }

    // --------------------------------------------------------
    // DATOS ACTUALES
    // --------------------------------------------------------

    const current = W.current;
    const weather = wc(current.weather_code);
    const daily = W.daily;

    // Mensaje meteorológico predeterminado
    let rain = 'Sin lluvia a la vista esta semana.';

    // --------------------------------------------------------
    // DETECTAR POSIBILIDAD DE LLUVIA
    // --------------------------------------------------------

    for (let index = 0; index < daily.time.length; index++) {

        if (daily.precipitation_probability_max[index] >= 50) {

            const rainDay = index === 0
                ? 'hoy'
                : 'el ' + new Date(
                    `${daily.time[index]}T12:00:00`
                ).toLocaleDateString('es-ES', {
                    weekday: 'long'
                });

            rain = `Lluvia probable ${rainDay}.`;

            break;
        }
    }

    // --------------------------------------------------------
    // BLOQUE DE TEMPERATURA ACTUAL
    // --------------------------------------------------------

    let html = `
        <div>

            <div class="wr">

                <span class="e">
                    ${weather[0]}
                </span>

                <span class="n">
                    ${Math.round(current.temperature_2m)}°
                </span>

                <div>
                    ${weather[1]}

                    <div class="mute">
                        Hoy: máx ${Math.round(daily.temperature_2m_max[0])}°
                        · mín ${Math.round(daily.temperature_2m_min[0])}°
                    </div>
                </div>

            </div>

            <div class="sub">
                ${rain}
            </div>

            <div class="hrs">
    `;

    // --------------------------------------------------------
    // PREVISIÓN DE LOS PRÓXIMOS SIETE DÍAS
    // --------------------------------------------------------

    for (let index = 0; index < daily.time.length; index++) {

        const date = new Date(
            `${daily.time[index]}T12:00:00`
        );

        const dayName = index === 0
            ? 'Hoy'
            : date.toLocaleDateString('es-ES', {
                weekday: 'short'
            });

        const dayWeather = wc(daily.weather_code[index]);

        const maximum = Math.round(
            daily.temperature_2m_max[index]
        );

        const minimum = Math.round(
            daily.temperature_2m_min[index]
        );

        html += `
            <div>

                <b>${dayName}</b>

                <br>

                <span class="e2">
                    ${dayWeather[0]}
                </span>

                <br>

                ${maximum}°

                <span class="mute">
                    ${minimum}°
                </span>

            </div>
        `;
    }

    // Cerrar los contenedores HTML
    html += `
            </div>
        </div>
    `;

    return html;
}
