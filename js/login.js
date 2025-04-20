// js/login.js

import { post } from './api.js';

export async function initLogin(containerSelector) {
  // 1) Elimina cualquier Service Worker pendiente (solo para depuración)
//  if ('serviceWorker' in navigator) {
//    navigator.serviceWorker.getRegistrations().then(regs =>
//      regs.forEach(r => r.unregister())
//    );
//  }

  const container = document.querySelector(containerSelector);
  // 2) Carga la plantilla HTML
  const html = await fetch('partials/login.html').then(r => r.text());
  container.innerHTML = html;

  // 3) Referencias a elementos
  const passwordInput = document.getElementById('login-password');
  const loginButton   = document.getElementById('login-button');
  const loginError    = document.getElementById('login-error');

  // 4) Asegurar que input no esté deshabilitado ni readonly
  passwordInput.disabled = false;
  passwordInput.readOnly = false;

  // 5) Forzar foco para que detecte teclado
  passwordInput.focus();

  // 6) Enviar al hacer click
  loginButton.addEventListener('click', onLogin);

  // 7) Enviar al pulsar Enter
  passwordInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onLogin();
    }
  });

  async function onLogin() {
    loginError.textContent = '';
    try {
      await post('login', { password: passwordInput.value });
      // si OK, cargar dashboard:
      loadDashboard(container);
    } catch (err) {
      loginError.textContent = 'Clave incorrecta. Inténtalo de nuevo.';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }
}

async function loadDashboard(container) {
  // carga la vista principal tras login
  const html = await fetch('partials/dashboard.html').then(r => r.text());
  container.innerHTML = html;

  // inicializa pestañas
  const { init } = await import('./tabs.js');
  init('#main-nav', '#main-sections');
}
