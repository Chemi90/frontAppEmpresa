import {api} from './api.js';

export async function initLogin(){
  const $screen=document.getElementById('login-screen');
  $screen.innerHTML=await (await fetch('partials/login.html')).text();

  const $pwd=document.getElementById('login-password');
  const $btn=document.getElementById('login-button');
  const $err=document.getElementById('login-error');
  const $main=document.getElementById('main-content');

  $pwd.addEventListener('keydown',e=>e.key==='Enter'&&(e.preventDefault(),$btn.click()));
  $btn.addEventListener('click',async()=>{
    try{
      await api('/login',{method:'POST',body:{password:$pwd.value}});
      $screen.style.display='none';$main.style.display='block';
      document.querySelector('.tab-button[data-target="desplazamientos"]').click();
    }catch(e){$err.textContent=e.message;}
  });
}
initLogin();
