
// ============================================================
// FUNCIONES AUXILIARES DE PRODUCTOS
// ============================================================

/**
 * Busca un producto en la lista de la compra por su nombre.
 *
 * La comparación no distingue entre mayúsculas y minúsculas.
 *
 * @param {string} n - Nombre del producto.
 * @returns {Object|undefined} Producto encontrado o undefined.
 */
function has(n) {

    const normalizedName = n.toLowerCase();

    return S.shop.filter(s =>
        s.name.toLowerCase() === normalizedName
    )[0];
}


/**
 * Comprueba si un producto ya existe en el catálogo.
 *
 * Busca tanto en las categorías predefinidas como
 * en los productos personalizados.
 *
 * @param {string} n - Nombre del producto.
 * @returns {boolean} true si existe en el catálogo.
 */
function inCat(n) {

    const normalizedName = n.toLowerCase();
    let found = false;

    // Buscar en las categorías predefinidas.
    PRE.forEach(category => {

        category[1].forEach(product => {

            if (product.toLowerCase() === normalizedName) {
                found = true;
            }
        });
    });

    // Buscar también en los productos personalizados.
    S.custom.forEach(product => {

        if (product.name.toLowerCase() === normalizedName) {
            found = true;
        }
    });

    return found;
}


// ============================================================
// FORMULARIO PARA AÑADIR PRODUCTOS
// ============================================================

/**
 * Genera el formulario para añadir un producto
 * a la lista de la compra.
 *
 * Permite seleccionar una categoría y decidir si el producto
 * se guarda también en el catálogo personalizado.
 *
 * @returns {string} HTML del formulario.
 */
function npForm() {

    let html = `
        <form data-f="newprod">

            <input
                class="g"
                name="n"
                placeholder="Añadir producto…"
                required
            >

            <select name="c">
    `;

    // Crear una opción por cada categoría predefinida.
    PRE.forEach(category => {
        html += `<option>${category[0]}</option>`;
    });

    html += `
            </select>

            <label style="width:100%">
                <input type="checkbox" name="s" checked>
                Guardar en el catálogo para otras veces
            </label>

            <button class="btn">Añadir a la lista</button>

        </form>
    `;

    return html;
}


// ============================================================
// LISTADO DE PRODUCTOS PERSONALIZADOS
// ============================================================

/**
 * Muestra los productos que el usuario ha añadido
 * a su propio catálogo.
 *
 * Si no hay productos personalizados, no genera contenido.
 *
 * @returns {string} HTML del listado.
 */
function custList() {

    if (!S.custom.length) {
        return '';
    }

    let html = `
        <div class="card">

            <h3>Productos que has añadido</h3>
    `;

    html += S.custom.map(product => `
        <div class="row">

            <span class="t">
                ${esc(product.name)}
                <small>${esc(product.cat)}</small>
            </span>

            <button
                class="x"
                data-a="cdel"
                data-id="${product.id}"
            >
                ✕
            </button>

        </div>
    `).join('');

    html += '</div>';

    return html;
}


// ============================================================
// VISTA PRINCIPAL DE LA COMPRA
// ============================================================

/**
 * Construye la pantalla de la lista de la compra.
 *
 * Incluye:
 * - Catálogo de productos por categorías.
 * - Productos personalizados.
 * - Lista de productos pendientes y comprados.
 * - Formulario para añadir productos.
 * - Eliminación de productos comprados.
 * - Recuperación de la última lista enviada.
 * - Envío de la lista por Gmail.
 *
 * @returns {string} HTML completo de la vista.
 */
function vCompra() {

    let html = `
        <h1>
            Se acabó…
            <span class="sub">
                Toca lo que se acabe y pasa a la lista
            </span>
        </h1>

        <div class="cols">

            <div class="cg">
    `;

    // ========================================================
    // CATÁLOGO DE PRODUCTOS
    // ========================================================

    PRE.forEach((category, index) => {

        const categoryName = category[0];

        // Combinar los productos predefinidos con los
        // productos personalizados de esta categoría.
        const products = category[1].concat(
            S.custom
                .filter(product => product.cat === categoryName)
                .map(product => product.name)
        );

        // Contar cuántos productos de esta categoría
        // están actualmente en la lista de la compra.
        const productCount = products.filter(product =>
            has(product)
        ).length;

        html += `
            <div
                class="cat"
                style="background:${TINT[index]}"
            >

                <h3>
                    ${categoryName}
                    ${
                        productCount
                            ? `<span class="bg">${productCount}</span>`
                            : ''
                    }
                </h3>
        `;

        // Crear un botón para cada producto.
        products.forEach(product => {

            const isSelected = has(product);

            html += `
                <button
                    class="chip${isSelected ? ' on' : ''}"
                    data-a="chip"
                    data-c="${esc(categoryName)}"
                    data-n="${esc(product)}"
                >
                    ${esc(product)}
                </button>
            `;
        });

        html += '</div>';
    });

    // ========================================================
    // LISTA DE LA COMPRA
    // ========================================================

    html += `
            </div>

            <div>

                <div class="card">

                    <h3>
                        Lista de la compra · ${pend().length}
                    </h3>
    `;

    // Categorías predefinidas más la categoría adicional.
    const categories = PRE
        .map(category => category[0])
        .concat(['Otros']);

    let hasProducts = false;

    // Mostrar los productos agrupados por categoría.
    categories.forEach(category => {

        const products = S.shop.filter(product =>
            product.cat === category
        );

        if (!products.length) {
            return;
        }

        hasProducts = true;

        html += `
            <h3 style="margin-top:12px">
                ${category}
            </h3>
        `;

        products.forEach(product => {

            html += `
                <div class="row${product.done ? ' ok' : ''}">

                    <button
                        class="ck${product.done ? ' on' : ''}"
                        data-a="sdone"
                        data-id="${product.id}"
                    >
                        ${product.done ? '✓' : ''}
                    </button>

                    <span class="t">
                        ${esc(product.name)}
                    </span>

                    <button
                        class="x"
                        data-a="sdel"
                        data-id="${product.id}"
                    >
                        ✕
                    </button>

                </div>
            `;
        });
    });

    // Mensaje cuando la lista está vacía.
    if (!hasProducts) {

        html += `
            <div class="mute">
                Aún no falta nada.
            </div>
        `;
    }

    // ========================================================
    // FORMULARIO Y ACCIONES DE LA LISTA
    // ========================================================

    html += npForm();

    // Botón para quitar los productos ya comprados.
    html += `
        <form>
            <button
                type="button"
                class="btn s"
                data-a="sclean"
            >
                Quitar comprados
            </button>
        </form>
    `;

    // Mostrar la opción de recuperar la última lista
    // únicamente si existe una lista guardada.
    if (S.last && S.last.length) {

        html += `
            <form>
                <button
                    type="button"
                    class="btn s"
                    data-a="undo"
                >
                    Recuperar la última lista enviada
                </button>
            </form>
        `;
    }

    html += '</div>';

    // ========================================================
    // PRODUCTOS PERSONALIZADOS
    // ========================================================

    html += custList();

    // ========================================================
    // ENVÍO DE LA LISTA POR GMAIL
    // ========================================================

    html += `
        <div class="card">

            <h3>Enviar la lista</h3>

            <input
                id="mail"
                class="g"
                style="width:100%;margin-bottom:8px"
                placeholder="Correo de quien hace la compra"
                value="${esc(S.mail || '')}"
            >

            <button
                class="btn w"
                style="background:#c4553f"
                data-a="mail"
            >
                Enviar por Gmail
            </button>

        </div>

            </div>

        </div>
    `;

    return html;
}


// ============================================================
// ENVÍO Y RECUPERACIÓN DE LA LISTA
// ============================================================

/**
 * Prepara la lista de la compra y, si corresponde,
 * abre Gmail con un correo ya redactado.
 *
 * Después guarda una copia de la lista actual en S.last,
 * vacía S.shop y actualiza la vista.
 *
 * @param {string} mode - Modo de envío. "mail" abre Gmail.
 */
function wa(mode) {

    // --------------------------------------------------------
    // GUARDAR EL CORREO INTRODUCIDO
    // --------------------------------------------------------

    const emailInput = $('mail');

    S.mail = emailInput
        ? emailInput.value.trim()
        : '';

    save();

    // --------------------------------------------------------
    // OBTENER PRODUCTOS PENDIENTES
    // --------------------------------------------------------

    const products = pend();

    if (!products.length) {

        alert('No falta nada en la lista.');

        return;
    }

    // --------------------------------------------------------
    // CONSTRUIR EL MENSAJE
    // --------------------------------------------------------

    let message =
        '🛒 Lista de la compra · ' +
        new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        }) +
        '\n';

    // Agrupar los productos por categoría.
    const categories = PRE
        .map(category => category[0])
        .concat(['Otros']);

    categories.forEach(category => {

        const categoryProducts = products.filter(product =>
            product.cat === category
        );

        if (categoryProducts.length) {

            message +=
                '\n' +
                category +
                ':\n' +
                categoryProducts
                    .map(product => '- ' + product.name)
                    .join('\n') +
                '\n';
        }
    });

    // --------------------------------------------------------
    // ABRIR GMAIL SI EL MODO ES "mail"
    // --------------------------------------------------------

    if (mode === 'mail') {

        const gmailUrl =
            'https://mail.google.com/mail/?view=cm&fs=1' +
            '&to=' + encodeURIComponent(S.mail) +
            '&su=' + encodeURIComponent('Lista de la compra') +
            '&body=' + encodeURIComponent(message);

        window.open(gmailUrl, '_blank');
    }

    // --------------------------------------------------------
    // GUARDAR LA ÚLTIMA LISTA Y VACIAR LA ACTUAL
    // --------------------------------------------------------

    S.last = S.shop.slice();
    S.shop = [];

    save();

    // Quitar el foco del elemento activo, si existe.
    if (document.activeElement) {
        document.activeElement.blur();
    }

    // Volver a dibujar la aplicación.
    draw();
}
