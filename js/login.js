/* js/login.js */
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', initLogin);

async function initLogin() {
  // 1 ▸ inyecta el fragmento HTML del login
  const scr  = document.getElementById('login-screen');
  const resp = await fetch('partials/login.html');
  scr.innerHTML = await resp.text();

  // 2 ▸ ahora sí, obtenemos los nodos ya presentes en el DOM
  const email = document.getElementById('login-email');
  const pwd   = document.getElementById('login-password');
  const btn   = document.getElementById('login-button');
  const err   = document.getElementById('login-error');

  const main  = document.getElementById('main-content');

  // 3 ▸ manejador de login
  btn.addEventListener('click', async () => {
    err.textContent = '';
    try {
      const { user_id } = await api('/login', {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ email: email.value, password: pwd.value })
      });
      // guardamos la sesión
      localStorage.setItem('user_id', user_id);

      // cambiamos de pantalla
      scr.style.display  = 'none';
      main.style.display = 'block';

      // abrimos la primera pestaña
      document.querySelector('.tab-button[data-target="desplazamientos"]').click();
    } catch (e) {
      err.textContent = e.message;
    }
  });

  // permite pulsar Enter
  pwd.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
  });
}
