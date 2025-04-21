import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const email = document.getElementById('login-email');
  const pwd   = document.getElementById('login-password');
  const btn   = document.getElementById('login-button');
  const err   = document.getElementById('login-error');
  const main  = document.getElementById('main-content');
  const scr   = document.getElementById('login-screen');

  btn.addEventListener('click', async () => {
    try {
      const { user_id } = await api('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value, password: pwd.value })
      });
      localStorage.setItem('user_id', user_id);
      scr.style.display = 'none'; main.style.display = 'block';
      document.querySelector('.tab-button[data-target="desplazamientos"]').click();
    } catch (e) {
      err.textContent = e.message;
    }
  });
});
