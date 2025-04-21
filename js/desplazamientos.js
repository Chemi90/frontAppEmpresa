/* js/desplazamientos.js */
import { api } from './api.js';

let $f,$id,$sub,$can,$km,$ded,$gas;

export function init(){
  $f   = document.getElementById('desplazamientos-form');
  $id  = document.getElementById('desp-current-id');
  $sub = document.getElementById('desp-submit-btn');
  $can = document.getElementById('desp-cancel-btn');

  $km  = document.getElementById('desp-km');
  $ded = document.getElementById('desp-deduccion');
  $gas = document.getElementById('desp-gasto');

  const calcGasto = () => {
    $gas.value = ((+$km.value||0)* (+$ded.value||0)).toFixed(2);
  };
  [$km,$ded].forEach(el=>el.addEventListener('input',calcGasto));
  calcGasto();

  $f  .addEventListener('submit',onSubmit);
  $can.addEventListener('click',reset);

  document.getElementById('desp-filter-btn')
          .addEventListener('click',onFilter);
  document.getElementById('desplazamientos-export-btn')
          .addEventListener('click',exportPDF);

  document.addEventListener('click',delegate);
}

function grabData(){
  return{
    fecha:val('fecha'),origen:val('origen'),destino:val('destino'),
    distancia:$km.value,descripcion:val('descripcion'),
    dia:val('dia'),cliente:val('cliente'),
    deduccion:$ded.value,gasto:$gas.value
  };
}
function val(id){return document.getElementById('desp-'+id).value;}

async function onSubmit(e){
  e.preventDefault();
  const d=grabData();
  if(!d.fecha||!d.destino)return alert('Fecha y destino obligatorios');
  const opts={method:$id.value?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)};
  await api($id.value?`/desplazamientos/${$id.value}`:'/desplazamientos',opts);
  alert('Guardado');reset();onFilter();
}
function reset(){$f.reset();$id.value='';$sub.textContent='Agregar Desplazamiento';$can.style.display='none';$gas.value='';}

async function onFilter(){
  const s=flt('start'),e=flt('end');
  if(!s||!e)return alert('Fechas necesarias');
  render(await api(`/desplazamientos?start=${s}&end=${e}`));
}
function flt(s){return document.getElementById('desp-filter-'+s).value;}

function render(rows){
  const $r=document.getElementById('desp-results');
  if(!rows.length){$r.innerHTML='<p>No se encontraron desplazamientos.</p>';total(0);return;}
  const head=['ID','Fecha','Origen','Destino','Km','Descripción','Día','Cliente','€/km','Gasto','Acc.']
        .map(h=>`<th>${h}</th>`).join('');
  const body=rows.map(d=>`
    <tr>
     <td>${d.id}</td><td>${d.fecha}</td><td>${d.origen}</td><td>${d.destino}</td>
     <td>${d.distancia}</td><td>${d.descripcion}</td><td>${d.dia}</td>
     <td>${d.cliente||''}</td><td>${d.deduccion}</td><td>${d.gasto}</td>
     <td>
       <button class="edit-desp" data-row='${JSON.stringify(d)}'>✏️</button>
       <button class="delete-desp" data-id='${d.id}'>🗑️</button>
     </td>
    </tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  total(rows.reduce((t,r)=>t+ +r.gasto,0));
}
function total(v){document.getElementById('desp-total').textContent=v.toFixed(2);}

function delegate(e){
  if(e.target.matches('.delete-desp')){
    const id=e.target.dataset.id;if(!confirm('Eliminar?'))return;
    api(`/desplazamientos/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove());
  }
  if(e.target.matches('.edit-desp')){
    const d=JSON.parse(e.target.dataset.row);
    Object.entries({
      'desp-current-id':d.id,'desp-fecha':d.fecha,'desp-origen':d.origen,
      'desp-destino':d.destino,'desp-km':d.distancia,'desp-descripcion':d.descripcion,
      'desp-dia':d.dia,'desp-cliente':d.cliente,'desp-deduccion':d.deduccion,
      'desp-gasto':d.gasto
    }).forEach(([i,v])=>document.getElementById(i).value=v);
    $sub.textContent='Actualizar Desplazamiento';$can.style.display='inline-block';
  }
}

/* ---- exportar PDF ---- */
function exportPDF(){
  const s=flt('start'),e=flt('end');
  const q=(s&&e)?`?start=${s}&end=${e}&format=pdf`:'?format=pdf';
  window.open(`/api/desplazamientos/export${q}`,'_blank');
}
