// =============================================
// views/reservations.js
// Vista principal de reservas.
// Admin: ve y gestiona TODO.
// User: ve y gestiona solo las suyas.
// =============================================

import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  checkConflict,
  getSpaces,
} from '../services/reservations.service.js';
import { showToast } from '../components/toast.js';

// Variables de módulo — persisten mientras la vista está activa
let currentUser = null;
let allReservations = [];
let spaces = [];

/**
 * renderReservations(user)
 * Retorna HTML inicial (tabla vacía) y programa initView.
 */
export async function renderReservations(user) {
  currentUser = user;

  // Precargamos datos en paralelo con Promise.all (más rápido que await secuenciales)
  [allReservations, spaces] = await Promise.all([
    getReservations(user.role === 'admin' ? null : user.id),
    getSpaces(),
  ]);

  window.__initView = initReservationsListeners;

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
      <h1 class="page-title" style="margin:0">
        ${user.role === 'admin' ? 'Todas las Reservas' : 'Mis Reservas'}
      </h1>
      <button id="btn-new-reservation" class="btn btn-primary">+ Nueva Reserva</button>
    </div>

    <!-- Filtro de búsqueda (bonus) -->
    <div class="card mb-2" style="padding:1rem">
      <input type="text" id="search-input" placeholder="Buscar por espacio, motivo o usuario..."
             style="width:100%; background:var(--surface2); border:1px solid var(--border);
                    border-radius:8px; padding:0.6rem 1rem; color:var(--text); outline:none">
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Espacio</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Motivo</th>
              ${user.role === 'admin' ? '<th>Solicitante</th>' : ''}
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="reservations-tbody">
            ${buildTableRows(allReservations, user)}
          </tbody>
        </table>
        ${allReservations.length === 0 ? `<div class="empty-state">No hay reservas aún</div>` : ''}
      </div>
    </div>

    <!-- Modal (oculto por defecto, se inyecta al hacer clic) -->
    <div id="modal-container"></div>
  `;
}

// =============================================
// CONSTRUIR FILAS DE LA TABLA
// =============================================
function buildTableRows(reservations, user) {
  if (reservations.length === 0) return '';

  return reservations.map(r => {
    const canEdit   = user.role === 'admin' || (r.userId === user.id && r.status === 'pending');
    const canDelete = user.role === 'admin';
    const canCancel = r.userId === user.id && (r.status === 'pending' || r.status === 'approved');
    const canApprove = user.role === 'admin' && r.status === 'pending';

    return `
      <tr data-id="${r.id}">
        <td>${r.spaceName}</td>
        <td>${formatDate(r.date)}</td>
        <td>${r.startTime} – ${r.endTime}</td>
        <td>${r.reason}</td>
        ${user.role === 'admin' ? `<td>${r.userName}</td>` : ''}
        <td><span class="badge badge-${r.status}">${translateStatus(r.status)}</span></td>
        <td>
          <div class="flex gap-1">
            ${canEdit   ? `<button class="btn btn-sm btn-outline btn-edit" data-id="${r.id}">Editar</button>` : ''}
            ${canApprove? `<button class="btn btn-sm btn-success btn-approve" data-id="${r.id}">Aprobar</button>
                           <button class="btn btn-sm btn-danger btn-reject"  data-id="${r.id}">Rechazar</button>` : ''}
            ${canCancel && !canApprove ? `<button class="btn btn-sm btn-warning btn-cancel" data-id="${r.id}">Cancelar</button>` : ''}
            ${canDelete ? `<button class="btn btn-sm btn-danger btn-delete" data-id="${r.id}">Eliminar</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// =============================================
// INICIALIZAR EVENT LISTENERS
// Se llama desde el router DESPUÉS de que el HTML está en el DOM.
// =============================================
function initReservationsListeners() {
  // Botón nueva reserva
  document.getElementById('btn-new-reservation').addEventListener('click', () => {
    openModal(); // sin argumentos = modo creación
  });

  // Búsqueda en tiempo real con delegación
  document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allReservations.filter(r =>
      r.spaceName.toLowerCase().includes(query) ||
      r.reason.toLowerCase().includes(query) ||
      (r.userName && r.userName.toLowerCase().includes(query))
    );
    document.getElementById('reservations-tbody').innerHTML = buildTableRows(filtered, currentUser);
    attachTableListeners(); // re-adjuntar listeners a las nuevas filas
  });

  attachTableListeners();
}

/**
 * attachTableListeners()
 * Event delegation: adjuntamos UN solo listener en el tbody,
 * y verificamos qué botón fue clickeado (data-id).
 * Esto es más eficiente que un listener por botón.
 */
function attachTableListeners() {
  const tbody = document.getElementById('reservations-tbody');
  if (!tbody) return;

  // Removemos listener anterior para evitar duplicados
  tbody.replaceWith(tbody.cloneNode(true));
  const newTbody = document.getElementById('reservations-tbody');

  newTbody.addEventListener('click', async (e) => {
    // e.target es el elemento exacto que recibió el click
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;

    const id = parseInt(btn.dataset.id); // dataset.id lee el atributo data-id
    const reservation = allReservations.find(r => r.id === id);

    if (btn.classList.contains('btn-edit'))    openModal(reservation);
    if (btn.classList.contains('btn-delete'))  await handleDelete(id);
    if (btn.classList.contains('btn-cancel'))  await handleStatusChange(id, 'cancelled');
    if (btn.classList.contains('btn-approve')) await handleStatusChange(id, 'approved');
    if (btn.classList.contains('btn-reject'))  await handleStatusChange(id, 'rejected');
  });
}

// =============================================
// MODAL — Crear / Editar reserva
// =============================================
function openModal(reservation = null) {
  const isEdit = reservation !== null;
  const title  = isEdit ? 'Editar Reserva' : 'Nueva Reserva';

  // Opciones del select de espacios
  const spaceOptions = spaces.map(s =>
    `<option value="${s.id}" data-name="${s.name}" ${isEdit && reservation.spaceId === s.id ? 'selected' : ''}>
      ${s.name} (${s.type}) — Cap. ${s.capacity}
    </option>`
  ).join('');

  document.getElementById('modal-container').innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" id="modal-close">&times;</button>
        </div>

        <div class="form-group">
          <label>Espacio</label>
          <select id="modal-space">
            <option value="">Seleccionar espacio...</option>
            ${spaceOptions}
          </select>
          <span class="error-msg">Selecciona un espacio</span>
        </div>

        <div class="form-group">
          <label>Fecha</label>
          <input type="date" id="modal-date" value="${isEdit ? reservation.date : ''}" min="${today()}" />
          <span class="error-msg">Selecciona una fecha</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem">
          <div class="form-group">
            <label>Hora inicio</label>
            <input type="time" id="modal-start" value="${isEdit ? reservation.startTime : ''}" />
            <span class="error-msg">Ingresa hora de inicio</span>
          </div>
          <div class="form-group">
            <label>Hora fin</label>
            <input type="time" id="modal-end" value="${isEdit ? reservation.endTime : ''}" />
            <span class="error-msg">Ingresa hora de fin</span>
          </div>
        </div>

        <div class="form-group">
          <label>Motivo</label>
          <textarea id="modal-reason" rows="3" placeholder="Describe el motivo de la reserva...">${isEdit ? reservation.reason : ''}</textarea>
          <span class="error-msg">Ingresa el motivo</span>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" id="modal-cancel-btn">Cancelar</button>
          <button class="btn btn-primary" id="modal-submit">
            ${isEdit ? 'Guardar cambios' : 'Crear reserva'}
          </button>
        </div>
      </div>
    </div>
  `;

  // Cerrar modal al hacer clic fuera o en X
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.getElementById('modal-submit').addEventListener('click', () =>
    handleSubmit(reservation)
  );
}

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

// =============================================
// SUBMIT — Crear o editar reserva
// =============================================
async function handleSubmit(existing = null) {
  // Leemos los valores del formulario
  const spaceSelect = document.getElementById('modal-space');
  const date        = document.getElementById('modal-date').value;
  const startTime   = document.getElementById('modal-start').value;
  const endTime     = document.getElementById('modal-end').value;
  const reason      = document.getElementById('modal-reason').value.trim();

  const spaceId     = parseInt(spaceSelect.value);
  const spaceName   = spaceSelect.options[spaceSelect.selectedIndex]?.dataset.name || '';

  // --- VALIDACIÓN ---
  let hasError = false;

  // Helper: marcar campo como error
  function validate(selector, condition) {
    const group = document.querySelector(selector).closest('.form-group');
    group.classList.toggle('has-error', !condition);
    if (!condition) hasError = true;
  }

  validate('#modal-space',  spaceId > 0);
  validate('#modal-date',   date !== '');
  validate('#modal-start',  startTime !== '');
  validate('#modal-end',    endTime !== '');
  validate('#modal-reason', reason !== '');

  if (hasError) return;

  if (startTime >= endTime) {
    showToast('La hora de fin debe ser mayor a la hora de inicio', 'error');
    return;
  }

  // Verificar conflicto de horario
  const conflict = await checkConflict(
    spaceId, date, startTime, endTime,
    existing?.id || null
  );

  if (conflict) {
    showToast('⚠️ Ya existe una reserva para ese espacio y horario', 'error');
    return;
  }

  // --- CONSTRUIR OBJETO ---
  const data = {
    userId:    currentUser.id,
    userName:  currentUser.name,
    spaceId,
    spaceName,
    date,
    startTime,
    endTime,
    reason,
    status:    existing ? existing.status : 'pending', // nueva reserva siempre inicia pendiente
  };

  try {
    if (existing) {
      // EDITAR: PATCH solo los campos del formulario
      await updateReservation(existing.id, data);
      showToast('Reserva actualizada', 'success');
    } else {
      // CREAR: POST
      await createReservation(data);
      showToast('Reserva creada', 'success');
    }

    closeModal();
    await refreshTable(); // recargamos la tabla para ver los cambios
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// =============================================
// ACCIONES DE ESTADO
// =============================================
async function handleStatusChange(id, newStatus) {
  const labels = { cancelled: 'cancelar', approved: 'aprobar', rejected: 'rechazar' };
  if (!confirm(`¿Seguro que deseas ${labels[newStatus]} esta reserva?`)) return;

  try {
    await updateReservation(id, { status: newStatus });
    showToast('Estado actualizado', 'success');
    await refreshTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDelete(id) {
  if (!confirm('¿Eliminar esta reserva permanentemente?')) return;

  try {
    await deleteReservation(id);
    showToast('Reserva eliminada', 'success');
    await refreshTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// =============================================
// HELPERS
// =============================================

// Recarga los datos y vuelve a pintar la tabla (sin recargar la página)
async function refreshTable() {
  allReservations = await getReservations(
    currentUser.role === 'admin' ? null : currentUser.id
  );
  document.getElementById('reservations-tbody').innerHTML =
    buildTableRows(allReservations, currentUser);
  attachTableListeners();
}

function formatDate(dateStr) {
  // '2026-06-10' → '10/06/2026'
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function translateStatus(status) {
  const map = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' };
  return map[status] || status;
}

function today() {
  // Fecha mínima para el input date (no reservas en el pasado)
  return new Date().toISOString().split('T')[0];
}
