/* js/facturas.js */
import { api, API_BASE } from './api.js';

let $f,$id,$sub,$can,$pct,$bruto,$neto,$iva;

export function init(){
  $f=document.getElementById('facturas-form');
  $id=document.getElementById('factura-current-id');
  $sub=document.getElementById('factura-submit-btn');
  $can=document.getElementById('factura-cancel-btn');

  $pct=document.getElementById('factura-iva-pct');
  $bruto=document.getElementById('factura-bruto');
  $neto=document.getElementById('factura-neta');
  $iva=document.getElementById('factura-iva-imp');

  const calc=()=>{
    const p=+$pct.value||0,b=+$bruto.value||0;
    const base=(b/(1+p/100)).toFixed(2);const imp=(b-base).toFixed(2);
    $neto.value=base;$iva.value=imp;
  };
  [$pct,$bruto].forEach(el=>el.addEventListener('input',calc));

  $f.addEventListener('submit',onSubmit);$can.addEventListener('click',reset);
  document.getElementById('factura-filter-btn').addEventListener('click',onFilter);
  document.getElementById('factura-export-btn').addEventListener('click',exportPDF);
  document.getElementById('factura-autofill-btn').addEventListener('click',autofill);
  document.addEventListener('click',delegate);
}

async function autofill(){ /* mantiene la implementación original */ }

async function onSubmit(e){
  e.preventDefault();
  const fd=new FormData($f);
  try{
    if($id.value){
      await api(`/facturas/${$id.value}`,{
        method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(fd))
      });
      alert('Factura actualizada');
    }else{
      await api('/facturas',{method:'POST',body:fd});
      alert('Factura creada');
    }
    reset();onFilter();
  }catch(err){alert(err.message);}
}
function reset(){$f.reset();$id.value='';$sub.textContent='Agregar Factura';$can.style.display='none';$neto.value=$iva.value='';}

async function onFilter(){
  const s=flt('start'),e=flt('end');if(!s||!e)return alert('Fechas');
  render(await api(`/facturas?start=${s}&end=${e}`));
}
function flt(s){return document.getElementById('factura-filter-'+s).value;}

function render(rows){
  const $r=document.getElementById('factura-results');
  if(!rows.length){$r.innerHTML='<p>Sin resultados</p>';tot(0,0);return;}
  const head=['ID','Fecha','Base (€)','IVA (€)','% IVA','Retención','Empresa','Archivo','Acc.']
        .map(h=>`<th>${h}</th>`).join('');
  const body=rows.map(f=>`
   <tr><td>${f.id}</td><td>${f.fecha}</td><td>${f.cantidad_bruta}</td>
       <td>${f.iva_importe}</td><td>${f.iva_porcentaje}</td><td>${f.retencion}</td>
       <td>${f.nombre_empresa}</td><td>${f.archivo||''}</td>
       <td><button class="edit-factura" data-row='${JSON.stringify(f)}'>✏️</button>
           <button class="delete-factura" data-id='${f.id}'>🗑️</button></td></tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  tot(rows.reduce((t,r)=>t+ +r.cantidad_bruta,0),
      rows.reduce((t,r)=>t+ +r.cantidad_neta,0));
}
function tot(b,n){document.getElementById('factura-total-bruto').textContent=b.toFixed(2);
                  document.getElementById('factura-total-neto').textContent=n.toFixed(2);}
function delegate(e){
  if(e.target.matches('.delete-factura')){
    const id=e.target.dataset.id;if(!confirm('Eliminar?'))return;
    api(`/facturas/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove());
  }
  if(e.target.matches('.edit-factura')){
    const f=JSON.parse(e.target.dataset.row);
    Object.entries({
      'factura-current-id':f.id,'factura-fecha':f.fecha,
      'factura-iva-pct':f.iva_porcentaje,'factura-bruto':(+f.cantidad_bruta+ +f.iva_importe).toFixed(2),
      'factura-retencion':f.retencion,'factura-empresa':f.nombre_empresa
    }).forEach(([i,v])=>document.getElementById(i).value=v);
    $sub.textContent='Actualizar Factura';$can.style.display='inline-block';
    $pct.dispatchEvent(new Event('input'));
  }
}

/* ---- exportar PDF ---- */
function exportPDF() {
    const s = document.getElementById('factura-filter-start')?.value,
          e = document.getElementById('factura-filter-end')  ?.value;
  
    const q = (s && e) ? `?start=${s}&end=${e}&format=pdf`
                        : '?format=pdf';
  
    window.open(`${API_BASE}/facturas/export${q}`, '_blank');
  }
  