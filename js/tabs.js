export function init(navSel,secSel){
    const tabs=[
      {title:'Desplazamientos',html:'desplazamientos.html',css:'desplazamientos.css',js:'desplazamientos.js'},
      {title:'Tickets',html:'tickets.html',css:'tickets.css',js:'tickets.js'},
      {title:'Facturas',html:'facturas.html',css:'facturas.css',js:'facturas.js'},
      {title:'Gastos',html:'gastos.html',css:'gastos.css',js:'gastos.js'},
      {title:'Nóminas',html:'nominas.html',css:'nominas.css',js:'nominas.js'}
    ];
    const nav=document.querySelector(navSel),main=document.querySelector(secSel);
    tabs.forEach((t,i)=>{const b=document.createElement('button');b.textContent=t.title;b.onclick=()=>loadTab(i);nav.append(b)});
    loadTab(0);
    async function loadTab(i){const t=tabs[i];main.innerHTML=await fetch('partials/'+t.html).then(r=>r.text());
      document.head.append(Object.assign(document.createElement('link'),{rel:'stylesheet',href:'css/'+t.css}));
      await import('./'+t.js);
    }
  }