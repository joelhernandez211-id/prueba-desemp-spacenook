// =============================================
// views/spaces.js
// Gestión de espacios — SOLO ADMIN (bonus).
// =============================================

import { showToast } from '../components/toast.js';

const API = 'http://localhost:3001';

let spaces = [];

export async function renderSpaces(user) {
  spaces = await fetchSpaces();
  window.__initView = initSpacesListeners;

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
      <h1 class="page-title" style="margin:0">Gestión de Espacios</h1>
      <button id="btn-new-space" class="btn btn-primary">+ Nuevo Espacio</button>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Capacidad</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="spaces-tbody">
            ${buildSpaceRows(spaces)}
          </tbody>
        </table>
      </div>
    </div>
    <div id="space-modal-container"></div>
  `;
}

function buildSpaceRows(spaceList) {
  return spaceList.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.type}</td>
      <td>${s.capacity} personas</td>
      <td>${s.location}</td>
      <td>
        <span class="badge ${s.status === 'available' ? 'badge-approved' : 'badge-rejected'}">
          ${s.status === 'available' ? 'Disponible' : 'No disponible'}
        </span>
      </td>
      <td>
        <div class="flex gap-1">
          <button class="btn btn-sm btn-outline btn-edit-space" data-id="${s.id}">Editar</button>
          <button class="btn btn-sm btn-danger btn-delete-space" data-id="${s.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function initSpacesListeners() {
  document.getElementById('btn-new-space').addEventListener('click', () => openSpaceModal());

  document.getElementById('spaces-tbody').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id    = parseInt(btn.dataset.id);
    const space = spaces.find(s => s.id === id);

    if (btn.classList.contains('btn-edit-space'))   openSpaceModal(space);
    if (btn.classList.contains('btn-delete-space')) await handleDeleteSpace(id);
  });
}

function openSpaceModal(space = null) {
  const isEdit = space !== null;

  document.getElementById('space-modal-container').innerHTML = `
    <div class="modal-overlay" id="space-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h2>${isEdit ? 'Editar Espacio' : 'Nuevo Espacio'}</h2>
          <button class="modal-close" id="sc-close">&times;</button>
        </div>
        <div class="form-group">
          <label>Nombre</label>
          <input id="sc-name" value="${isEdit ? space.name : ''}" placeholder="Ej: Sala Alfa" />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="sc-type">
            ${['Sala de reuniones','Oficina privada','Espacio de coworking','Auditorio'].map(t =>
              `<option ${isEdit && space.type === t ? 'selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Capacidad</label>
          <input type="number" id="sc-capacity" value="${isEdit ? space.capacity : ''}" min="1" />
        </div>
        <div class="form-group">
          <label>Ubicación</label>
          <input id="sc-location" value="${isEdit ? space.location : ''}" placeholder="Ej: Piso 2" />
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="sc-status">
            <option value="available" ${!isEdit || space.status === 'available' ? 'selected' : ''}>Disponible</option>
            <option value="unavailable" ${isEdit && space.status === 'unavailable' ? 'selected' : ''}>No disponible</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" id="sc-cancel">Cancelar</button>
          <button class="btn btn-primary" id="sc-submit">${isEdit ? 'Guardar' : 'Crear'}</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('sc-close').addEventListener('click', closeSpaceModal);
  document.getElementById('sc-cancel').addEventListener('click', closeSpaceModal);
  document.getElementById('sc-submit').addEventListener('click', () => handleSpaceSubmit(space));
}

function closeSpaceModal() {
  document.getElementById('space-modal-container').innerHTML = '';
}

async function handleSpaceSubmit(existing = null) {
  const data = {
    name:     document.getElementById('sc-name').value.trim(),
    type:     document.getElementById('sc-type').value,
    capacity: parseInt(document.getElementById('sc-capacity').value),
    location: document.getElementById('sc-location').value.trim(),
    status:   document.getElementById('sc-status').value,
  };

  if (!data.name || !data.location || !data.capacity) {
    showToast('Completa todos los campos', 'error');
    return;
  }

  try {
    if (existing) {
      await fetch(`${API}/spaces/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      showToast('Espacio actualizado', 'success');
    } else {
      await fetch(`${API}/spaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      showToast('Espacio creado', 'success');
    }
    closeSpaceModal();
    spaces = await fetchSpaces();
    document.getElementById('spaces-tbody').innerHTML = buildSpaceRows(spaces);
    initSpacesListeners();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDeleteSpace(id) {
  if (!confirm('¿Eliminar este espacio?')) return;
  try {
    await fetch(`${API}/spaces/${id}`, { method: 'DELETE' });
    showToast('Espacio eliminado', 'success');
    spaces = await fetchSpaces();
    document.getElementById('spaces-tbody').innerHTML = buildSpaceRows(spaces);
    initSpacesListeners();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function fetchSpaces() {
  const res = await fetch(`${API}/spaces`);
  return res.json();
}
