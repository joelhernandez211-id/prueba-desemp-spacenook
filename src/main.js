// =============================================
// main.js — Punto de entrada de la aplicación.
// Vite carga este archivo primero.
// Solo necesitamos importar el router;
// él se encarga de todo al escuchar los eventos.
// =============================================

import './styles.css';           // estilos globales
import './router/router.js';     // importar el router ya registra los event listeners
                                 // (hashchange y load están en el archivo del router)

// No necesitamos hacer nada más aquí.
// El router se activa solo con el evento 'load'.
