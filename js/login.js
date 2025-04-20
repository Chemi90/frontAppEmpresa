if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs =>
      regs.forEach(r => r.unregister())
    );
  }
  

import{post}from'./api.js';
export async function initLogin(selector){
  const c=document.querySelector(selector);
  c.innerHTML=await fetch('partials/login.html').then(r=>r.text());
  document.getElementById('login-button').onclick=onLogin;
  document.getElementById('login-password').onkeydown=e=>e.key==='Enter'&&onLogin();
  async function onLogin(){
    try{await post('login',{password:document.getElementById('login-password').value});loadDashboard(c)}
    catch{document.getElementById('login-error').textContent='Clave incorrecta.'}
  }
}
async function loadDashboard(c){
  c.innerHTML=await fetch('partials/dashboard.html').then(r=>r.text());
  const tabs=await import('./tabs.js');tabs.init('#main-nav','#main-sections');
}