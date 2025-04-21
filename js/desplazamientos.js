/* js/desplazamientos.js */
import { api } from './api.js';

let $f,$id,$sub,$can;

export function init(){
  $f   = document.getElementById('desplazamientos-form');
  $id  = document.getElementById('desp-current-id');
  $sub = document.getElementById('desp-submit-btn');
  $can = document.getElementById('desp-cancel-btn');

  $f.addEventListener('submit', onSubmit);
  $can.addEventListener('click', reset);

  document.getElementById('desp-filter-btn')
          .addEventListener('click', onFilter);
  document.getElementById('desplazamientos-export-btn')
          .addEventListener('click', exportExcel);

  document.addEventListener('click', delegate);
}

function grabData() {
  /* recolecta los valores del formulario */
  return {
    fecha      : document.getElementById('desp-fecha').value,
    origen     : document.getElementById('desp-origen').value,
    destino    : document.getElementById('desp-destino').value,
    distancia  : document.getElementById('desp-km').value,
    descripcion: document.getElementById('desp-descripcion').value,
    dia        : document.getElementById('desp-dia').value,
    cliente    : document.getElementById('desp-cliente').value,
    deduccion  : document.getElementById('desp-deduccion').value,
    gasto      : document.getElementById('desp-gasto').value
  };
}

async function onSubmit(e){
  e.preventDefault();
  const data = grabData();

  if(!data.fecha){
    alert('La fecha es obligatoria'); return;
  }
  if(!data.destino){
    alert('El destino es obligatorio'); return;
  }

  try{
    if($id.value){            // ---- UPDATE ----
      await api(`/desplazamientos/${$id.value}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      alert('Desplazamiento actualizado');
    }else{                    // ---- INSERT ----
      const {id}=await api('/desplazamientos',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      alert('Desplazamiento creado ID '+id);
    }
    reset();
  }catch(err){ alert(err.message); }
}

function reset(){
  $f.reset(); $id.value='';
  $sub.textContent='Agregar Desplazamiento';
  $can.style.display='none';
}

async function onFilter(){
  const s=document.getElementById('desp-filter-start').value;
  const e=document.getElementById('desp-filter-end').value;
  if(!s||!e) return alert('Fechas necesarias');
  const rows=await api(`/desplazamientos?start=${s}&end=${e}`);
  render(rows);
}

function render(rows){
  const $r=document.getElementById('desp-results');
  if(!rows.length){
    $r.innerHTML='<p>No se encontraron desplazamientos.</p>';
    document.getElementById('desp-total').textContent='0.00'; return;
  }
  const head=['ID','Fecha','Origen','Destino','Km','Descripción','Día','Cliente','Deducción','Gasto','Acc.']
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
  const total=rows.reduce((t,r)=>t+(+r.gasto||0),0).toFixed(2);
  document.getElementById('desp-total').textContent=total;
}

function delegate(e){
  if(e.target.matches('.delete-desp')){
    const id=e.target.dataset.id;
    if(!confirm('Eliminar?'))return;
    api(`/desplazamientos/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove());
  }
  if(e.target.matches('.edit-desp')){
    const d=JSON.parse(e.target.dataset.row);
    document.getElementById('desp-current-id').value = d.id;
    document.getElementById('desp-fecha').value      = d.fecha;
    document.getElementById('desp-origen').value     = d.origen;
    document.getElementById('desp-destino').value    = d.destino;
    document.getElementById('desp-km').value         = d.distancia;
    document.getElementById('desp-descripcion').value= d.descripcion;
    document.getElementById('desp-dia').value        = d.dia;
    document.getElementById('desp-cliente').value    = d.cliente;
    document.getElementById('desp-deduccion').value  = d.deduccion;
    document.getElementById('desp-gasto').value      = d.gasto;
    $sub.textContent='Actualizar Desplazamiento';
    $can.style.display='inline-block';
  }
}

function exportExcel(){
  const s=document.getElementById('desp-filter-start').value;
  const e=document.getElementById('desp-filter-end').value;
  const q=s&&e?`?start=${s}&end=${e}`:'';
  window.open(`/api/desplazamientos/export${q}`,'_blank');
}
