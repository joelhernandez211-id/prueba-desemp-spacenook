// =============================================
// services/reservations.service.js
// CRUD completo de reservas contra json-server.
// =============================================

const API = 'http://localhost:3001';

/**
 * getReservations(userId)
 * 
 * Si recibe userId (usuario normal): filtra solo SUS reservas.
 * Si no recibe userId (admin): trae TODAS las reservas.
 * 
 * json-server permite filtrar con ?userId=2
 */
export async function getReservations(userId = null) {
  const url = userId
    ? `${API}/reservations?userId=${userId}`
    : `${API}/reservations`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudieron cargar las reservas');
  return res.json();
}

/**
 * createReservation(data)
 * 
 * POST a json-server con el objeto de la reserva.
 * json-server le asigna un id automáticamente.
 */
export async function createReservation(data) {
  const res = await fetch(`${API}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // OBLIGATORIO para que json-server entienda el body
    body: JSON.stringify(data),                        // convertimos el objeto JS a string JSON
  });
  if (!res.ok) throw new Error('Error al crear la reserva');
  return res.json(); // json-server retorna el objeto creado con su nuevo id
}

/**
 * updateReservation(id, data)
 * 
 * PATCH actualiza solo los campos que enviamos (no reemplaza todo el objeto).
 * PUT reemplazaría el objeto completo — usamos PATCH para actualizaciones parciales.
 */
export async function updateReservation(id, data) {
  const res = await fetch(`${API}/reservations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar la reserva');
  return res.json();
}

/**
 * deleteReservation(id)
 * 
 * DELETE elimina el recurso. json-server responde con {} si tiene éxito.
 */
export async function deleteReservation(id) {
  const res = await fetch(`${API}/reservations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar la reserva');
  return true;
}

/**
 * checkConflict(spaceId, date, startTime, endTime, excludeId)
 * 
 * Verifica si ya existe una reserva para el mismo espacio y horario.
 * excludeId se usa al EDITAR para ignorar la reserva actual.
 * 
 * REGLA DE NEGOCIO: no se pueden crear reservas duplicadas.
 */
export async function checkConflict(spaceId, date, startTime, endTime, excludeId = null) {
  // Traemos todas las reservas del espacio en esa fecha
  const res = await fetch(`${API}/reservations?spaceId=${spaceId}&date=${date}`);
  const existing = await res.json();

  return existing.some(r => {
    if (excludeId && r.id === excludeId) return false; // ignorar la reserva que estamos editando
    if (r.status === 'cancelled' || r.status === 'rejected') return false; // canceladas no cuentan

    // Hay conflicto si los horarios se solapan
    // Caso: nueva(09:00-11:00) vs existente(10:00-12:00) → se solapan
    return startTime < r.endTime && endTime > r.startTime;
  });
}

/**
 * getSpaces()
 * Trae todos los espacios disponibles para el formulario de reserva.
 */
export async function getSpaces() {
  const res = await fetch(`${API}/spaces`);
  if (!res.ok) throw new Error('Error al cargar espacios');
  return res.json();
}
