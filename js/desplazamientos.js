import {api} from './api.js';

let $f,$id,$sub,$can,$km,$ded,$gas;
export function init(){
  $f=document.getElementById('desplazamientos-form');
  $id=document.getElementById('desp-current-id');
  $sub=document.getElementById('desp-submit-btn');
  $can=document.getElementById('desp-cancel-btn');
  $km=document.getElementById('desp-km');
  $ded=document.getElementById('desp-deduccion');
  $gas=document.getElementById('desp-gasto');

  const calc=()=>{$gas.value=((+$km.value||0)*(+$ded.value||0)).toFixed(2);}
  $km.addEventListener('input',calc);$ded.addEventListener('input',calc);

  $f.addEventListener('submit',onSubmit);$can.addEventListener('click',reset);

  document.getElementById('desp-filter-btn').addEventListener('click',onFilter);
  document.getElementById('desplazamientos-export-btn').addEventListener('click',exportExcel);

  document.addEventListener('click',delegate);
}

async function onSubmit(e){
  e.preventDefault();const data=Object.fromEntries(new FormData($f));
  try{
    if($id.value){
      await api(`/desplazamientos/${$id.value}`,{method:'PUT',body:data});
      alert('Desplazamiento actualizado');
    }else{
      const {id}=await api('/desplazamientos',{method:'POST',body:data});
      alert('Desplazamiento agregado. ID:'+id);
    } reset();
  }catch(err){alert(err.message);}
}
function reset(){$f.reset();$id.value='';$sub.textContent='Agregar Desplazamiento';$can.style.display='none';$gas.value='';}
async function onFilter(){
  const s=document.getElementById('desp-filter-start').value;
  const e=document.getElementById('desp-filter-end').value;
  if(!s||!e)return alert('Seleccione fechas');
  try{render(await api(`/desplazamientos?start=${s}&end=${e}`));}catch(err){alert(err.message);}
}
function render(rows){
  const $r=document.getElementById('desp-results');
  if(!rows.length){$r.innerHTML='<p>No se encontraron desplazamientos.</p>';document.getElementById('desp-total').textContent='0.00';return;}
  const h=['ID','Fecha','Origen','Destino','Km','Descripción','Día','Cliente','Deducción','Gasto','Acciones'].map(x=>`<th>${x}</th>`).join('');
  const b=rows.map(r=>`
    <tr>
      <td>${r.id}</td><td>${r.fecha}</td><td>${r.origen}</td><td>${r.destino}</td>
      <td>${r.distancia}</td><td>${r.descripcion}</td><td>${r.dia}</td><td>${r.cliente}</td>
      <td>${r.deduccion}</td><td>${r.gasto}</td>
      <td>
        <button class="edit-desp" data-row='${JSON.stringify(r)}'>✏️</button>
        <button class="delete-desp" data-id='${r.id}'>🗑️</button>
      </td>
    </tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${h}</tr></thead><tbody>${b}</tbody></table>`;
  document.getElementById('desp-total').textContent=rows.reduce((t,{gasto})=>t+(+gasto||0),0).toFixed(2);
}
function delegate(e){
  if(e.target.matches('.delete-desp')){
    const id=e.target.dataset.id;if(!confirm('¿Eliminar?'))return;
    api(`/desplazamientos/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove()).catch(err=>alert(err.message));
  }
  if(e.target.matches('.edit-desp')){
    const r=JSON.parse(e.target.dataset.row);
    Object.entries({
      'desp-current-id':r.id,'desp-fecha':r.fecha,'desp-destino':r.destino,'desp-km':r.distancia,
      'desp-descripcion':r.descripcion,'desp-dia':r.dia,'desp-cliente':r.cliente,
      'desp-deduccion':r.deduccion,'desp-gasto':r.gasto
    }).forEach(([i,v])=>document.getElementById(i).value=v);
    $sub.textContent='Actualizar Desplazamiento';$can.style.display='inline-block';
  }
}
function exportExcel(){
  const s=document.getElementById('desp-filter-start').value;
  const e=document.getElementById('desp-filter-end').value;
  const q=s&&e?`?start=${s}&end=${e}`:'';
  window.open(`https://josemiguelruizguevara.com:5000/api/desplazamientos/export${q}`,'_blank');
}
