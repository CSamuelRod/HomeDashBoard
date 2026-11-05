# 🏡 Home Super Dashboard

Dashboard multitarea para el hogar diseñado para tablets y pantallas compartidas. Sincronizado en tiempo real, con soporte multiusuario mediante hogares compartidos, autenticación segura y despliegue automatizado.

---

## 🏗️ Arquitectura y Estructura del Proyecto

El proyecto está desacoplado en módulos de JavaScript puro (Vanilla JS), siguiendo los principios de separación de incumbencias (SoC), manejo centralizado de estado y sincronización reactiva.

```text
├── index.html                  # Shell de la aplicación (SPA)
├── css/
│   └── styles.css              # Estilos unificados (Modo claro/oscuro, login, widgets)
├── js/
│   ├── state.js                # Gestión centralizada del estado y persistencia local/remota
│   ├── weather.js              # Integración de reloj, geolocalización y clima
│   ├── views-hoy.js            # Vista diaria (Resumen, tareas atrasadas, eventos)
│   ├── views-calendario.js     # Vista mensual y semanal con soporte de eventos y tareas
│   ├── views-tareas.js         # Gestión de tareas, asignación por colores y recurrencias
│   ├── views-compra.js         # Lista de la compra compartida en tiempo real
│   ├── views-fitness.js        # Módulo de seguimiento de fitness (personal)
│   ├── auth.js                 # Autenticación (Email/Password) y gestión de sesiones
│   └── app.js                  # Orquestador principal, eventos UI y renderizado (Entry point)
├── firebase-config.js          # Configuración del cliente (Ignorado en Git por seguridad)
├── firestore.rules             # Reglas de seguridad y control de acceso basado en roles/hogares
└── firebase.json               # Configuración de despliegue y hosting

🚀 Características Técnicas Destacadas
Gestión de Estado Reactiva: Sincronización bidireccional entre el estado local en memoria y la persistencia remota.

Hogares Compartidos (Multi-tenant logic): Sistema de códigos de invitación únicos (6 caracteres) que agrupan a múltiples usuarios bajo un mismo documento en Firestore (households/{code}), compartiendo de forma atómica tareas, eventos y la lista de la compra.

Seguridad a Nivel de Base de Datos (Firestore Rules): Reglas estrictas que validan la pertenencia del usuario al hogar antes de permitir operaciones de lectura/escritura (request.auth.uid in resource.data.members).

DevOps & CI/CD: Despliegue continuo en Netlify con inyección dinámica de secretos (API Keys de Firebase) mediante variables de entorno en tiempo de compilación (Build Commands), evitando exponer credenciales en el repositorio público de GitHub.