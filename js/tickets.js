import {api} from './api.js';

let $f,$id,$sub,$can,$foto;
export function init(){
  $f=document.getElementById('tickets-form');
  $id=document.getElementById('ticket-current-id');
  $sub=document.getElementById('ticket-submit-btn');
  $can=document.getElementById('ticket-cancel-btn');
  $foto=document.getElementById('ticket-foto');

  $f.addEventListener('submit',onSubmit);$can.addEventListener('click',reset);

  document.getElementById('ticket-filter-btn').addEventListener('click',onFilter);
  document.getElementById('ticket-export-btn').addEventListener('click',exportExcel);
  document.getElementById('ticket-autofill-btn').addEventListener('click',autofill);

  document.addEventListener('click',delegate);
}

async function autofill(){
  if(!$foto.files.length)return alert('Selecciona archivo');
  const fd=new FormData();fd.append('foto',$foto.files[0]);
  try{
    const d=await api('/tickets/autofill',{method:'POST',body:fd});
    if(d.localizacion)document.getElementById('ticket-localizacion').value=d.localizacion;
    if(d.dinero)document.getElementById('ticket-dinero').value=parseFloat(d.dinero).toFixed(2);
    if(d.motivo)document.getElementById('ticket-motivo').value=d.motivo;
    if(d.fecha){
      const p=d.fecha.split('/');document.getElementById('ticket-fecha').value=p.length===3?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:d.fecha;
    }
  }catch(err){alert(err.message);}
}

async function onSubmit(e){
  e.preventDefault();
  if($id.value){
    const data=Object.fromEntries(new FormData($f));
    try{await api(`/tickets/${$id.value}`,{method:'PUT',body:data});alert('Ticket actualizado');reset();}
    catch(err){alert(err.message);}
  }else{
    const fd=new FormData($f);
    try{
      const {id}=await api('/tickets',{method:'POST',body:fd});
      alert('Ticket agregado. ID:'+id);reset();
    }catch(err){alert(err.message);}
  }
}
function reset(){$f.reset();$id.value='';$sub.textContent='Agregar Ticket';$can.style.display='none';}

async function onFilter(){
  const s=document.getElementById('ticket-filter-start').value;
  const e=document.getElementById('ticket-filter-end').value;
  if(!s||!e)return alert('Fechas necesarias');
  try{render(await api(`/tickets?start=${s}&end=${e}`));}catch(err){alert(err.message);}
}
function render(rows){
  const $r=document.getElementById('ticket-results');
  if(!rows.length){$r.innerHTML='<p>No se encontraron tickets.</p>';document.getElementById('ticket-total').textContent='0.00';return;}
  const h=['ID','Foto','Localización','Dinero','Motivo','Fecha','Acciones'].map(x=>`<th>${x}</th>`).join('');
  const b=rows.map(t=>`
    <tr>
      <td>${t.id}</td><td>${t.foto}</td><td>${t.localizacion}</td><td>${t.dinero}</td>
      <td>${t.motivo}</td><td>${t.fecha}</td>
      <td>
        <button class="edit-ticket" data-row='${JSON.stringify(t)}'>✏️</button>
        <button class="delete-ticket" data-id='${t.id}'>🗑️</button>
      </td>
    </tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${h}</tr></thead><tbody>${b}</tbody></table>`;
  document.getElementById('ticket-total').textContent=rows.reduce((t,{dinero})=>t+(+dinero||0),0).toFixed(2);
}
function delegate(e){
  if(e.target.matches('.delete-ticket')){
    const id=e.target.dataset.id;if(!confirm('Eliminar?'))return;
    api(`/tickets/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove()).catch(err=>alert(err.message));
  }
  if(e.target.matches('.edit-ticket')){
    const t=JSON.parse(e.target.dataset.row);
    Object.entries({
      'ticket-current-id':t.id,'ticket-localizacion':t.localizacion,'ticket-dinero':t.dinero,
      'ticket-motivo':t.motivo,'ticket-fecha':t.fecha
    }).forEach(([i,v])=>document.getElementById(i).value=v);
    $sub.textContent='Actualizar Ticket';$can.style.display='inline-block';
  }
}
function exportExcel(){
  const s=document.getElementById('ticket-filter-start').value;
  const e=document.getElementById('ticket-filter-end').value;
  const q=s&&e?`?start=${s}&end=${e}`:'';
  window.open(`https://josemiguelruizguevara.com:5000/api/tickets/export${q}`,'_blank');
}
