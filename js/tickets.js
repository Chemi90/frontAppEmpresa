import { api } from './api.js';

let $f,$id,$sub,$can,$pct,$bruto,$neto,$iva;
export function init(){
  $f   = document.getElementById('tickets-form');
  $id  = document.getElementById('ticket-current-id');
  $sub = document.getElementById('ticket-submit-btn');
  $can = document.getElementById('ticket-cancel-btn');

  $pct   = document.getElementById('ticket-iva-pct');
  $bruto = document.getElementById('ticket-bruto');
  $neto  = document.getElementById('ticket-neto');
  $iva   = document.getElementById('ticket-iva-imp');

  const calc = () => {
    const p = +$pct.value || 0, b = +$bruto.value || 0;
    const base = (b / (1 + p/100)).toFixed(2);
    const iva  = (b - base).toFixed(2);
    $neto.value = base;
    $iva.value  = iva;
  };
  $pct.addEventListener('input', calc);
  $bruto.addEventListener('input', calc);

  $f.addEventListener('submit',onSubmit);
  $can.addEventListener('click',reset);

  document.getElementById('ticket-filter-btn').addEventListener('click',onFilter);
  document.getElementById('ticket-export-btn').addEventListener('click',exportExcel);
  document.addEventListener('click',delegate);
}

async function onSubmit(e){
  e.preventDefault();
  const fd=new FormData($f);                // contiene iva_porcentaje y dinero_bruto
  try{
    if($id.value){
      await api(`/tickets/${$id.value}`,{method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(Object.fromEntries(fd))
      });
      alert('Ticket actualizado');
    }else{
      const {id}=await api('/tickets',{method:'POST',body:fd});
      alert('Ticket creado ID '+id);
    }
    reset();
  }catch(err){alert(err.message);}
}
function reset(){$f.reset();$id.value='';$sub.textContent='Agregar Ticket';$can.style.display='none';}

async function onFilter(){
  const s=document.getElementById('ticket-filter-start').value;
  const e=document.getElementById('ticket-filter-end').value;
  if(!s||!e)return alert('Fechas necesarias');
  const rows=await api(`/tickets?start=${s}&end=${e}`);
  render(rows);
}
function render(rows){
  const $r=document.getElementById('ticket-results');
  if(!rows.length){$r.innerHTML='<p>Sin resultados</p>';return;}
  const head=['ID','Localización','Base (€)','IVA (€)','%','Motivo','Fecha','Acc.']
    .map(h=>`<th>${h}</th>`).join('');
  const body=rows.map(t=>`
    <tr>
      <td>${t.id}</td><td>${t.localizacion}</td><td>${t.dinero}</td>
      <td>${t.iva_importe}</td><td>${t.iva_porcentaje}</td>
      <td>${t.motivo}</td><td>${t.fecha}</td>
      <td>
        <button class="edit-ticket" data-row='${JSON.stringify(t)}'>✏️</button>
        <button class="delete-ticket" data-id='${t.id}'>🗑️</button>
      </td>
    </tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
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
