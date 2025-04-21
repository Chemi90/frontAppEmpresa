const PLACE=document.getElementById('tab-placeholder');

async function load(id){
  PLACE.innerHTML=await (await fetch(`partials/${id}.html`)).text();
  const m=await import(`./${id}.js`);
  m.init();
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.tab-button').forEach(b=>b.addEventListener('click',()=>load(b.dataset.target)));
});
