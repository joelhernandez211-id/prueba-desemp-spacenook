// =============================================
// views/denied.js
// Pantalla de acceso denegado.
// =============================================

export function renderDenied() {
  window.__initView = null;
  return `
    <div class="denied-wrapper">
      <h1>403</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
      <a href="#/dashboard" class="btn btn-primary">Volver al inicio</a>
    </div>
  `;
}
