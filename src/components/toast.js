// =============================================
// components/toast.js
// Notificaciones toast no bloqueantes.
// =============================================

/**
 * showToast(message, type)
 * type: 'success' | 'error' | 'info'
 * Las notificaciones se eliminan solas después de 3 segundos.
 */
export function showToast(message, type = 'info') {
  // Si no existe el contenedor, lo creamos
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Click para cerrar manualmente
  toast.addEventListener('click', () => toast.remove());

  container.appendChild(toast);

  // Auto-eliminar después de 3 segundos
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300); // espera a que termine la animación
  }, 3000);
}
