// =============================================
// views/login.js
// Vista de inicio de sesión.
// Retorna HTML string, los event listeners
// se adjuntan después via window.__initView.
// =============================================

import { login } from '../services/auth.service.js';
import { navigate } from '../router/router.js';
import { showToast } from '../components/toast.js';

/**
 * renderLogin()
 * Retorna el HTML del formulario de login.
 * Define window.__initView para adjuntar los listeners una vez que el HTML está en el DOM.
 */
export function renderLogin() {
  // Programamos los listeners para cuando el HTML ya esté en el DOM
  window.__initView = initLoginListeners;

  return `
    <div class="login-wrapper">
      <div class="card login-card">
        <h1>SpaceBook</h1>
        <p>Reserva tu espacio de trabajo</p>

        <div id="login-error" class="login-error"></div>

        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input type="email" id="email" placeholder="tu@empresa.com" />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" placeholder="••••••••" />
        </div>

        <button id="btn-login" class="btn btn-primary btn-full">Ingresar</button>

        <p class="text-muted" style="margin-top:1.5rem; font-size:0.8rem">
          <strong>Admin:</strong> admin@company.com / admin123<br>
          <strong>User:</strong> ana@company.com / user123
        </p>
      </div>
    </div>
  `;
}

function initLoginListeners() {
  const btnLogin  = document.getElementById('btn-login');
  const inputPass = document.getElementById('password');
  const errorDiv  = document.getElementById('login-error');

  // Permitir hacer login con Enter en el campo de contraseña
  inputPass.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  btnLogin.addEventListener('click', handleLogin);

  async function handleLogin() {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validación básica en frontend antes de llamar la API
    if (!email || !password) {
      showError('Por favor completa todos los campos');
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Ingresando...';

    try {
      // login() busca en json-server y guarda en localStorage
      await login(email, password);
      showToast('¡Bienvenido!', 'success');
      // Limpiamos el app completo para que el router reconstruya con navbar
      document.getElementById('app').innerHTML = '';
      navigate('#/dashboard');
    } catch (err) {
      showError(err.message);
    } finally {
      // finally siempre se ejecuta, haya error o no
      btnLogin.disabled = false;
      btnLogin.textContent = 'Ingresar';
    }
  }

  function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.add('show');
  }
}
