
// ============================================================
// RENDERIZADO PRINCIPAL
// ============================================================

function draw() {
    // Evita reconstruir la vista mientras se escribe en un input.
    var active = document.activeElement;

    if (active && active.tagName === 'INPUT' && active.value) {
        return;
    }

    // Relaciona cada pestaña con su función de renderizado.
    var views = {
        hogar: vHogar,
        fitness: vFit,
        mes: vMes,
        hoy: vHoy,
        semana: vSemana,
        compra: vCompra,
        tareas: vTareas
    };

    $('m').innerHTML = views[tab]();

    // Actualiza el estado visual de la navegación lateral.
    var buttons = $('side').children;

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].className =
            'nv' +
            (
                buttons[i].getAttribute('data-t') === tab
                    ? ' on'
                    : ''
            );
    }

    // Actualiza los contadores de compra y tareas pendientes.
    var shoppingCount = pend().length;
    var taskCount = todayList().filter(function (task) {
        return !task.done;
    }).length;

    $('b-compra').textContent = shoppingCount || '';
    $('b-tareas').textContent = taskCount || '';

    reloj();
}


// ============================================================
// GESTIÓN CENTRALIZADA DE CLICS
// ============================================================

document.addEventListener('click', function (e) {
    var el = e.target;

    // Busca el elemento más cercano con una acción o pestaña definida.
    while (
        el &&
        el.getAttribute &&
        !el.getAttribute('data-t') &&
        !el.getAttribute('data-a')
    ) {
        el = el.parentNode;
    }

    if (!el || !el.getAttribute) {
        return;
    }

    // --------------------------------------------------------
    // Navegación entre pestañas
    // --------------------------------------------------------

    var t = el.getAttribute('data-t');

    if (t) {
        tab = t;
        draw();
        return;
    }

    // --------------------------------------------------------
    // Identificación de la acción
    // --------------------------------------------------------

    var action = el.getAttribute('data-a');

    if (!action) {
        return;
    }

    var id = el.getAttribute('data-id');
    var o;

    // --------------------------------------------------------
    // TAREAS
    // --------------------------------------------------------

    if (action === 'tdone') {
        o = find(S.tasks, id);

        var date = el.getAttribute('data-d') || ds(new Date());

        if (o.rep) {
            o.doneOn = o.doneOn || {};

            if (o.doneOn[date]) {
                delete o.doneOn[date];
            } else {
                o.doneOn[date] = true;
            }
        } else {
            o.done = !o.done;
        }
    } else if (action === 'tdel') {
        rm(S.tasks, id);
    } else if (action === 'tclean') {
        S.tasks = S.tasks.filter(function (task) {
            return task.rep || !task.done;
        });

    // --------------------------------------------------------
    // LISTA DE LA COMPRA
    // --------------------------------------------------------

    } else if (action === 'chip') {
        o = has(el.getAttribute('data-n'));

        if (o) {
            rm(S.shop, o.id);
        } else {
            S.shop.push({
                id: uid(),
                name: el.getAttribute('data-n'),
                cat: el.getAttribute('data-c'),
                done: false
            });
        }
    } else if (action === 'sdone') {
        o = find(S.shop, id);
        o.done = !o.done;
    } else if (action === 'sdel') {
        rm(S.shop, id);
    } else if (action === 'sclean') {
        S.shop = S.shop.filter(function (item) {
            return !item.done;
        });

    // --------------------------------------------------------
    // CALENDARIO
    // --------------------------------------------------------

    } else if (action === 'sel') {
        SEL = el.getAttribute('data-d');
    } else if (action === 'mnav') {
        var n = parseInt(id, 10);
        MO = n === 0 ? 0 : MO + n;
    } else if (action === 'edel') {
        rm(S.events, id);
    } else if (action === 'eimp') {
        o = find(S.events, id);
        o.imp = !o.imp;

    // --------------------------------------------------------
    // NOTAS
    // --------------------------------------------------------

    } else if (action === 'ndel') {
        rm(S.notes, id);

    // --------------------------------------------------------
    // MODO NOCTURNO
    // --------------------------------------------------------

    } else if (action === 'night') {
        S.night = S.night === 'on' ? 'off' : 'on';

    // --------------------------------------------------------
    // FITNESS Y ENTRENAMIENTO
    // --------------------------------------------------------

    } else if (action === 'ft') {
        FT = id;
    } else if (action === 'rnav') {
        RM += parseInt(id, 10);
    } else if (action === 'rdel') {
        rm(S.fit.runs, id);
    } else if (action === 'ex') {
        var exerciseName = el.getAttribute('data-n');
        o = inR(exerciseName);

        if (o) {
            rm(S.fit.routine, o.id);
        } else {
            S.fit.routine.push({
                id: uid(),
                name: exerciseName,
                sets: 3,
                reps: 10
            });
        }
    } else if (action === 'rquit') {
        rm(S.fit.routine, id);
    } else if (action === 'rsets') {
        o = find(S.fit.routine, id);

        o.sets = Math.max(
            1,
            o.sets + parseInt(el.getAttribute('data-d'), 10)
        );
    } else if (action === 'rreps') {
        o = find(S.fit.routine, id);

        o.reps = Math.max(
            1,
            o.reps + parseInt(el.getAttribute('data-d'), 10)
        );
    } else if (action === 'rdone') {
        var today = ds(new Date());

        if (S.fit.done[today]) {
            delete S.fit.done[today];
        } else {
            S.fit.done[today] = true;
        }

    // --------------------------------------------------------
    // ELEMENTOS PERSONALIZADOS
    // --------------------------------------------------------

    } else if (action === 'cdel') {
        rm(S.custom, id);

    // --------------------------------------------------------
    // UBICACIÓN Y METEOROLOGÍA
    // --------------------------------------------------------

    } else if (action === 'locf') {
        LOCF = !LOCF;
    } else if (action === 'geo') {
        LMSG = 'Buscando tu ubicación…';
        LOCF = false;
        geo();
    } else if (action === 'locset') {
        var locationResult = LRES[parseInt(id, 10)];

        if (locationResult) {
            setLoc({
                mode: 'manual',
                lat: locationResult.latitude,
                lon: locationResult.longitude,
                name: locationResult.name
            });

            LOCF = false;
            LRES = [];
        }

    // --------------------------------------------------------
    // COMPRA: DESHACER
    // --------------------------------------------------------

    } else if (action === 'undo') {
        S.shop = S.last || [];
        S.last = null;

    // --------------------------------------------------------
    // COMUNICACIÓN
    // --------------------------------------------------------

    } else if (action === 'mail') {
        wa(action);
        return;

    // --------------------------------------------------------
    // PERSONALIZACIÓN DEL HOGAR
    // --------------------------------------------------------

    } else if (action === 'pcol') {
        keepName();
        PCOL = el.getAttribute('data-c');
        PEDIT = true;

    // --------------------------------------------------------
    // GESTIÓN DEL HOGAR COMPARTIDO
    // --------------------------------------------------------

    } else if (
        action === 'hcreate' ||
        action === 'hjoin' ||
        action === 'hsave' ||
        action === 'hleave'
    ) {
        hAct(action);
        return;

    // --------------------------------------------------------
    // AUTENTICACIÓN
    // --------------------------------------------------------

    } else if (action === 'signin' || action === 'signup') {
        doAuth(action);
        return;
    } else if (action === 'reset') {
        doReset();
        return;
    } else if (action === 'logout') {
        FB.auth.signOut();
        return;
    }

    // Guarda los cambios y actualiza la interfaz.
    save();
    draw();
});


// ============================================================
// GESTIÓN CENTRALIZADA DE FORMULARIOS
// ============================================================

document.addEventListener('submit', function (e) {
    e.preventDefault();

    var form = e.target;
    var formType = form.getAttribute('data-f');

    // Obtiene y limpia el valor de un campo del formulario.
    var value = function (name) {
        return form.elements[name].value.trim();
    };

    // --------------------------------------------------------
    // NUEVA TAREA
    // --------------------------------------------------------

    if (formType === 'task') {
        var repetition = value('r');

        S.tasks.push({
            id: uid(),
            text: value('t'),
            date: value('d') || (
                repetition
                    ? ds(new Date())
                    : ''
            ),
            done: false,
            rep: repetition,
            who: form.elements['w'] ? value('w') : ''
        });

    // --------------------------------------------------------
    // NUEVO PRODUCTO EN LA COMPRA
    // --------------------------------------------------------

    } else if (formType === 'shop' && !has(value('n'))) {
        S.shop.push({
            id: uid(),
            name: value('n'),
            cat: 'Otros',
            done: false
        });

    // --------------------------------------------------------
    // NUEVO EVENTO
    // --------------------------------------------------------

    } else if (formType === 'event') {
        var eventDate = value('d') || SEL || ds(new Date());

        var currentDate = new Date();
        var selectedDate = new Date(eventDate + 'T12:00:00');

        S.events.push({
            id: uid(),
            date: eventDate,
            text: value('t'),
            imp: form.elements['i'].checked
        });

        SEL = eventDate;

        MO =
            (selectedDate.getFullYear() - currentDate.getFullYear()) * 12 +
            selectedDate.getMonth() -
            currentDate.getMonth();

    // --------------------------------------------------------
    // NUEVA NOTA
    // --------------------------------------------------------

    } else if (formType === 'note') {
        S.notes.push({
            id: uid(),
            text: value('t')
        });

    // --------------------------------------------------------
    // NUEVO PRODUCTO PERSONALIZADO
    // --------------------------------------------------------

    } else if (formType === 'newprod') {
        var productName = value('n');
        var productCategory = value('c');

        if (productName) {
            if (!has(productName)) {
                S.shop.push({
                    id: uid(),
                    name: productName,
                    cat: productCategory,
                    done: false
                });
            }

            if (
                form.elements['s'].checked &&
                !inCat(productName)
            ) {
                S.custom.push({
                    id: uid(),
                    name: productName,
                    cat: productCategory
                });
            }
        }

    // --------------------------------------------------------
    // BÚSQUEDA DE CIUDADES
    // --------------------------------------------------------

    } else if (formType === 'city') {
        xget(
            'https://geocoding-api.open-meteo.com/v1/search?name=' +
            encodeURIComponent(value('q')) +
            '&count=5&language=es&format=json',

            function (j) {
                LRES = j.results || [];
                LMSG = LRES.length
                    ? ''
                    : 'No encuentro esa ciudad.';

                draw();
            },

            function () {
                LMSG = 'Sin conexión para buscar.';
                draw();
            }
        );

    // --------------------------------------------------------
    // OBJETIVO DE FITNESS
    // --------------------------------------------------------

    } else if (formType === 'goal') {
        S.fit.goal = {
            per: value('p'),
            km: parseFloat(value('k').replace(',', '.')) || 5
        };

    // --------------------------------------------------------
    // REGISTRO DE CARRERA
    // --------------------------------------------------------

    } else if (formType === 'run') {
        var runDistance = parseFloat(
            value('k').replace(',', '.')
        );

        if (runDistance > 0) {
            S.fit.runs.push({
                id: uid(),
                date: value('d') || ds(new Date()),
                km: runDistance,
                v: parseFloat(value('v').replace(',', '.')) || 0
            });
        }
    }

    // Limpia el formulario y elimina el foco del elemento activo.
    form.reset();

    if (document.activeElement) {
        document.activeElement.blur();
    }

    // Guarda los cambios y vuelve a renderizar.
    save();
    draw();
});


// ============================================================
// AJUSTE DE ALTURA DE LA APLICACIÓN
// ============================================================

function fit() {
    document.body.style.height = window.innerHeight + 'px';
}

// Reajusta la altura al cambiar el tamaño o la orientación.
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', fit);

// Aplica el ajuste inicial.
fit();


// ============================================================
// ARRANQUE DE LA APLICACIÓN
// ============================================================

startApp();
