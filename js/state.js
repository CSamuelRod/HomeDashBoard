
// Estado global de la aplicación.
var S = {};
var KEY = 'casa-v3-local';
var tab = 'hoy';
var W = null;
var WERR = false;
var HOY = 0;
var FB = { members: {} };

// Claves que se sincronizan como datos compartidos y personales.
var SH = ['tasks', 'shop', 'custom', 'events', 'notes', 'last'];
var PE = ['fit', 'night', 'loc', 'mail', 'phone'];

// Selecciona determinadas propiedades de un objeto.
function pick(o, ks) {
    var result = {};

    ks.forEach(function (key) {
        if (o[key] !== undefined) {
            result[key] = o[key];
        }
    });

    return result;
}

// Identificador único de esta instalación.
var DEV = (function () {
    try {
        var deviceId = localStorage.getItem('casa-dev');

        if (!deviceId) {
            deviceId = String(Math.random()).slice(2);
            localStorage.setItem('casa-dev', deviceId);
        }

        return deviceId;
    } catch (e) {
        return 'x';
    }
})();

// Devuelve la estructura inicial del estado.
function blank() {
    return {
        tasks: [],
        shop: []
    };
}

// Completa y normaliza las propiedades necesarias del estado.
function norm() {
    S.tasks = S.tasks || [];
    S.shop = S.shop || [];

    S.fit = S.fit || {};
    S.fit.goal = S.fit.goal || {
        per: 'dia',
        km: 5
    };
    S.fit.runs = S.fit.runs || [];
    S.fit.routine = S.fit.routine || [];
    S.fit.done = S.fit.done || {};

    S.custom = S.custom || [];
    S.events = S.events || [];
    S.notes = S.notes || [];

    S.night = S.night === 'on' ? 'on' : 'off';
}

// Migra las tareas antiguas que utilizaban el campo day.
function migrate() {
    var monday = new Date();

    monday.setDate(
        monday.getDate() - ((monday.getDay() + 6) % 7)
    );

    S.tasks.forEach(function (task) {
        if (task.date === undefined) {
            task.date = (
                typeof task.day === 'number' &&
                task.day >= 0
            )
                ? ds(
                    new Date(
                        monday.getFullYear(),
                        monday.getMonth(),
                        monday.getDate() + task.day
                    )
                )
                : '';

            delete task.day;
        }
    });
}

// Carga los datos locales y aplica las normalizaciones necesarias.
function loadLocal() {
    try {
        var stored = localStorage.getItem(KEY);
        S = stored ? JSON.parse(stored) : blank();
    } catch (e) {
        S = blank();
    }

    norm();
    migrate();
}

// Temporizador utilizado para agrupar las escrituras en Firebase.
var saveT = null;

// Envía el estado actual a Firebase.
function pushNow() {
    if (!FB.uref) {
        return;
    }

    var by = DEV;
    var ts = Date.now();
    var writes = [];

    if (FB.hid) {
        writes.push(
            FB.uref.set({
                hid: FB.hid,
                state: JSON.stringify(pick(S, PE)),
                by: by,
                updated: ts
            })
        );

        if (FB.hready) {
            writes.push(
                FB.href.update({
                    shared: JSON.stringify(pick(S, SH)),
                    by: by,
                    updated: ts
                })
            );
        }
    } else {
        writes.push(
            FB.uref.set({
                state: JSON.stringify(S),
                by: by,
                updated: ts
            })
        );
    }

    Promise.all(writes).then(
        function () {
            FB.err = null;
        },
        function (e) {
            FB.err = e.code || 'error';
            console.error(e);
        }
    );
}

// Guarda localmente y programa la sincronización remota.
function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {}

    if (FB.uref) {
        clearTimeout(saveT);
        saveT = setTimeout(pushNow, 700);
    }
}

// Comprueba si una tarea corresponde a una fecha concreta.
function occ(task, date) {
    if (!task.date || date < task.date) {
        return false;
    }

    if (!task.rep) {
        return task.date === date;
    }

    var startDate = new Date(task.date + 'T12:00:00');
    var currentDate = new Date(date + 'T12:00:00');

    if (task.rep === 'w') {
        return startDate.getDay() === currentDate.getDay();
    }

    return currentDate.getDate() === Math.min(
        startDate.getDate(),
        new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        ).getDate()
    );
}

// Genera la representación de una tarea para una fecha.
function occv(task, date) {
    return {
        id: task.id,
        text: task.text,
        who: task.who,
        rep: task.rep,
        date: task.date,
        _d: date,
        done: task.rep
            ? !!(task.doneOn && task.doneOn[date])
            : !!task.done
    };
}

// Obtiene las tareas correspondientes a una fecha.
function tasksOn(date) {
    return S.tasks
        .filter(function (task) {
            return occ(task, date);
        })
        .map(function (task) {
            return occv(task, date);
        });
}

// Obtiene las tareas que deben aparecer en la lista de hoy.
function todayList() {
    var today = ds(new Date());

    return S.tasks
        .filter(function (task) {
            return (
                !task.date ||
                (
                    task.rep
                        ? occ(task, today)
                        : (
                            task.date === today ||
                            (task.date < today && !task.done)
                        )
                )
            );
        })
        .map(function (task) {
            return occv(task, today);
        });
}

// Obtiene el color asignado a la persona responsable de una tarea.
function wcol(task) {
    var member = FB.members && FB.members[task.who];

    return member ? member.color : '';
}

// Genera el atributo de estilo correspondiente al responsable.
function wst(task) {
    var color = wcol(task);

    return color
        ? ' style="border-left:4px solid ' + color + '"'
        : '';
}

// Formatea una fecha en español.
function fdate(date) {
    return new Date(date + 'T12:00:00').toLocaleDateString(
        'es-ES',
        {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        }
    );
}

// Genera el HTML de una tarea en formato de botón.
function chipT(task) {
    var color = wcol(task);

    return (
        '<button class="chip' +
        (task.done ? ' on' : '') +
        '" data-a="tdone" data-id="' +
        task.id +
        '" data-d="' +
        (task._d || '') +
        '"' +
        (color ? ' style="border-left:6px solid ' + color + '"' : '') +
        '>' +
        (task.rep ? '↻ ' : '') +
        esc(task.text) +
        '</button>'
    );
}

// Escapa caracteres especiales para evitar que se interpreten como HTML.
function esc(value) {
    return String(value).replace(/[&<>"]/g, function (char) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;'
        }[char];
    });
}

// Atajo para obtener elementos del documento por su ID.
function $(id) {
    return document.getElementById(id);
}

// Genera un identificador numérico.
function uid() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Nombres de los días de la semana.
var DIAS = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
];

// Categorías y productos predefinidos de la lista de la compra.
var PRE = [
    ['Fruta', [
        'Uva',
        'Piña cortada',
        'Plátano',
        'Manzana'
    ]],
    ['Verdura', [
        'Lechuga',
        'Zanahoria',
        'Tomate pera',
        'Cebolla',
        'Patata'
    ]],
    ['Carne y pescado', [
        'Pollo',
        'Carne picada',
        'Pescado fresco'
    ]],
    ['Charcutería y quesos', [
        'Chorizo oreado',
        'Bacon',
        'Jamón cocido',
        'Queso rallado ',
        'Salchichas'
    ]],
    ['Lácteos y huevos', [
        'Huevos (24)',
        'Leche',
        'Yogur',
        'Margarina con sal'
    ]],
    ['Pan', [
        'Tortillas',
        'Pan de leche',
        'Pan de molde'
    ]],
    ['Despensa', [
        'Soja',
        'Ketchup',
        'Mayonesa',
        'Tomate frito artesano',
        'Tomate frito',
        'Aceite girasol',
        'Aceite oliva',
        'Macarrón',
        'Fideos',
        'Espagueti',
        'Ñoquis',
        'Arroz largo',
        'Atún natural',
        'Azúcar blanco',
        'Mermelada de fresa',
        'Galletas María dorada',
        'Muesli de chocolate',
        'Pastillas de caldo de pollo',
        'Caldo de pollo brick'
    ]],
    ['Congelados', [
        'Gyozas',
        'Batatas',
        'Patatas',
        'Merluza'
    ]],
    ['Bebidas', [
        'Zumitos',
        'Zumo de maracuyá',
        'Zumo de naranja',
        'Agua'
    ]],
    ['Limpieza y casa', [
        'Papel cocina',
        'Papel higiénico',
        'Toallitas WC',
        'Protegeslips',
        'Compresas normal',
        'Compresas noche',
        'Detergente'
    ]]
];

// Colores asociados a las categorías de compra.
var TINT = [
    '#e3f0dc',
    '#dcebd6',
    '#f4e3d3',
    '#f6ecd2',
    '#e8f0e6',
    '#efe6d5',
    '#e4eddc',
    '#dbe9e4',
    '#f1e8dc',
    '#e7efe0'
];

// Añade un cero inicial a los números inferiores a diez.
function p2(number) {
    return number < 10 ? '0' + number : '' + number;
}

// Convierte una fecha al formato YYYY-MM-DD.
function ds(date) {
    return (
        date.getFullYear() +
        '-' +
        p2(date.getMonth() + 1) +
        '-' +
        p2(date.getDate())
    );
}

// Calcula los días que faltan hasta una fecha.
function dleft(date) {
    var today = new Date();

    today.setHours(0, 0, 0, 0);

    return Math.round(
        (new Date(date + 'T00:00:00') - today) / 864e5
    );
}

// Busca un elemento por ID dentro de un array.
function find(array, id) {
    for (var i = 0; i < array.length; i++) {
        if (String(array[i].id) === String(id)) {
            return array[i];
        }
    }
}

// Elimina del array el primer elemento que coincida con el ID.
function rm(array, id) {
    for (var i = 0; i < array.length; i++) {
        if (String(array[i].id) === String(id)) {
            array.splice(i, 1);
            return;
        }
    }
}
