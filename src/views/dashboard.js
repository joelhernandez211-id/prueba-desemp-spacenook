// =============================================
// views/dashboard.js
// Vista de inicio — estadísticas rápidas.
// =============================================

import { getReservations } from '../services/reservations.service.js';

export async function renderDashboard(user) {
  // Los admins ven TODAS las reservas, los users solo las suyas
  const reservations = await getReservations(user.role === 'admin' ? null : user.id);

  // Contamos por estado para las estadísticas
  const pending   = reservations.filter(r => r.status === 'pending').length;
  const approved  = reservations.filter(r => r.status === 'approved').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;

  const greeting = user.role === 'admin' ? 'Panel de Administración' : `Hola, ${user.name}`;

  window.__initView = null; // Esta vista no necesita listeners extra

  return `
    <h1 class="page-title">${greeting}</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${reservations.length}</div>
        <div class="stat-label">Total de reservas</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--warning)">${pending}</div>
        <div class="stat-label">Pendientes</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--success)">${approved}</div>
        <div class="stat-label">Aprobadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--text-muted)">${cancelled}</div>
        <div class="stat-label">Canceladas</div>
      </div>
    </div>

    <div class="card">
      <h2 style="font-family:var(--font-head); margin-bottom:1rem">Acceso rápido</h2>
      <div class="flex gap-1">
        <a href="#/reservations" class="btn btn-primary">Ver Reservas</a>
        ${user.role === 'admin' ? `<a href="#/spaces" class="btn btn-outline">Gestionar Espacios</a>` : ''}
      </div>
    </div>
  `;
}
