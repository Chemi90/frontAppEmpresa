import * as tickets  from './tickets.js';
import * as facturas from './facturas.js';

export function load(tabId) {
    fetch(`/partials/${tabId}.html`)
      .then(r => r.text())
      .then(html => {
        document.getElementById(tabId).innerHTML = html;
        // ─── llamar al init cuando el HTML YA está en la página ───
        if (tabId === 'tickets')  tickets.init();
        if (tabId === 'facturas') facturas.init();
      });
  }

const PLACE=document.getElementById('tab-placeholder');

async function load(id){
  PLACE.innerHTML=await (await fetch(`partials/${id}.html`)).text();
  const m=await import(`./${id}.js`);
  m.init();
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.tab-button').forEach(b=>b.addEventListener('click',()=>load(b.dataset.target)));
});
