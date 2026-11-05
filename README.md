# Casa · dashboard del hogar

## Estructura
- `index.html`: estructura y carga de scripts.
- `css/styles.css`: todos los estilos (claro, modo noche, login).
- `js/state.js`: estado, guardado local y sincronización, utilidades.
- `js/weather.js`: reloj, ubicación y tiempo.
- `js/views-*.js`: una pestaña por archivo (hoy, calendario/semana, tareas, compra, fitness).
- `js/auth.js`: login, cuentas y sincronización con Firestore.
- `js/app.js`: pintado, clics y formularios. Se carga el último.
- `firebase-config.js`: tu configuración de Firebase.
- `firestore.rules` y `firebase.json`: reglas de seguridad y hosting.

## Poner Firebase (una vez)
1. En https://console.firebase.google.com crea un proyecto.
2. Authentication > Método de acceso: activa **Correo y contraseña**.
3. Firestore Database > Crear base de datos.
4. Configuración del proyecto > Tus apps > Web (`</>`): copia el objeto de configuración en `firebase-config.js`.
5. Publica las reglas de `firestore.rules` (pestaña Reglas de Firestore, o `firebase deploy --only firestore`).
6. Sube la carpeta a un hosting con HTTPS (por ejemplo `firebase deploy --only hosting`).
   Authentication > Configuración > Dominios autorizados debe incluir ese dominio.

Mientras `firebase-config.js` tenga los valores `TU_...`, la app funciona en **modo local**, sin login, guardando en el navegador.

## Hogar compartido
Pestaña **Hogar**: un usuario crea el hogar y recibe un código de 6 caracteres; otro se une con él.
Se comparten tareas, calendario, notas, lista de la compra y productos añadidos. Fitness, modo noche y ubicación son personales.
**Hay que volver a publicar `firestore.rules`**: incluyen las colecciones `codes` y `households`.

## Cómo se guardan los datos
Cada usuario tiene un documento `users/{uid}` con todo su estado. Las reglas solo le dejan leer y escribir el suyo.
Los cambios se envían 0,7 s después de editar y llegan en directo a otros dispositivos con la misma cuenta.
