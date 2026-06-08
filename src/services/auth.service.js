// =============================================
// services/auth.service.js
// Toda la lógica de autenticación vive aquí.
// =============================================

const API = 'http://localhost:3001';

// SESSION_KEY es la clave con la que guardamos
// el usuario en localStorage/sessionStorage.
// Si cambias esto, también debes cambiarlo en getSession().
const SESSION_KEY = 'spacebook_user';

/**
 * login(email, password)
 * 
 * 1. Hace GET a json-server filtrando por email y password.
 * 2. json-server soporta ?email=x&password=y como query params.
 * 3. Si encuentra al usuario, lo guarda en localStorage.
 * 4. Retorna el usuario o lanza un error.
 */
export async function login(email, password) {
  // encodeURIComponent evita errores si el email tiene caracteres especiales
  const res = await fetch(`${API}/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  
  if (!res.ok) throw new Error('Error de conexión con el servidor');

  const users = await res.json(); // json-server siempre devuelve array

  if (users.length === 0) {
    throw new Error('Credenciales incorrectas'); // usuario no encontrado
  }

  const user = users[0]; // tomamos el primer (y único) resultado

  // Guardamos en localStorage para persistir entre pestañas y recargas.
  // Si quisieras solo para la sesión del navegador, usarías sessionStorage.
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));

  return user;
}

/**
 * logout()
 * Elimina la sesión del storage. Limpio y simple.
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * getSession()
 * Lee el usuario guardado en localStorage.
 * Retorna el objeto usuario, o null si no hay sesión.
 * Esta función se usa en cada guarda de ruta para saber quién está logueado.
 */
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  // JSON.parse(null) lanzaría error, por eso verificamos primero
  return raw ? JSON.parse(raw) : null;
}

/**
 * isAdmin()
 * Helper para no repetir user.role === 'admin' en todo el código.
 */
export function isAdmin() {
  const user = getSession();
  return user?.role === 'admin'; // optional chaining: si user es null, retorna undefined (falsy)
}
