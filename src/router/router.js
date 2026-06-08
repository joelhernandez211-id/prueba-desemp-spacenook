import { getSession } from '../services/auth.service.js';
import { renderLogin }        from '../views/login.js';
import { renderDashboard }    from '../views/dashboard.js';
import { renderReservations } from '../views/reservations.js';
import { renderSpaces }       from '../views/spaces.js';
import { renderDenied }       from '../views/denied.js';
import { renderNavbar }       from '../components/navbar.js';

const routes = {
  '#/login':        { render: renderLogin,        requiresAuth: false },
  '#/dashboard':    { render: renderDashboard,    requiresAuth: true  },
  '#/reservations': { render: renderReservations, requiresAuth: true  },
  '#/spaces':       { render: renderSpaces,       requiresAuth: true, adminOnly: true },
  '#/denied':       { render: renderDenied,       requiresAuth: false },
};

export function navigate(hash) {
  window.location.hash = hash;
}

export async function router() {
  const hash = window.location.hash || '#/login';
  const route = routes[hash];

  if (!route) {
    navigate(getSession() ? '#/dashboard' : '#/login');
    return;
  }

  const user = getSession();

  if (route.requiresAuth && !user) {
    navigate('#/login');
    return;
  }

  if (route.adminOnly && user?.role !== 'admin') {
    navigate('#/denied');
    return;
  }

  if (hash === '#/login' && user) {
    navigate('#/dashboard');
    return;
  }

  const app = document.getElementById('app');

  if (user) {
    let navbar = document.getElementById('navbar');
    if (!navbar) {
      app.innerHTML = `<nav id="navbar"></nav><main id="main-content"></main>`;
      renderNavbar(user);
    }
    const main = document.getElementById('main-content');
    main.innerHTML = await route.render(user);
    if (typeof window.__initView === 'function') {
      window.__initView();
      window.__initView = null;
    }
  } else {
    app.innerHTML = await route.render();
    if (typeof window.__initView === 'function') {
      window.__initView();
      window.__initView = null;
    }
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);