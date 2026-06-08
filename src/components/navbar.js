// =============================================
// components/navbar.js
// Renderiza la barra de navegación dinámica.
// Muestra links distintos según el rol.
// =============================================

import { logout } from '../services/auth.service.js';
import { navigate } from '../router/router.js';

export function renderNavbar(user) {
  const navbar = document.getElementById('navbar');

  // Construimos los links según el rol
  // El admin ve "Espacios", el usuario normal no
  const adminLinks = user.role === 'admin'
    ? `<a href="#/spaces" class="nav-link">Espacios</a>`
    : '';

  navbar.innerHTML = `
    <span class="nav-logo">SpaceBook</span>
    <div class="nav-links">
      <a href="#/dashboard" class="nav-link">Inicio</a>
      <a href="#/reservations" class="nav-link">Reservas</a>
      ${adminLinks}
      <span class="text-muted" style="padding: 0.5rem">|</span>
      <span style="color: var(--text-muted); font-size:0.85rem; padding: 0.5rem 0">${user.name}</span>
      <button id="btn-logout" class="btn btn-outline btn-sm">Cerrar sesión</button>
    </div>
  `;

  // Event listener para el botón de logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    logout();          // limpia localStorage
    navigate('#/login'); // redirige al login
    // Necesitamos limpiar el navbar también porque next render lo recreará
    document.getElementById('app').innerHTML = '';
  });

  // Marcar el link activo según el hash actual
  highlightActiveLink();
}

function highlightActiveLink() {
  const hash = window.location.hash;
  // Quitamos la clase active de todos, la ponemos solo al que coincide
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}

// Cada vez que cambia el hash, actualizamos el link activo
window.addEventListener('hashchange', highlightActiveLink);
