/* js/tickets.js */
import { api } from './api.js';

let
  $form,$id,$sub,$can,
  $pct,$bruto,$neto,$impIVA,
  $loc,$mot,$fecha,$file;

export function init(){
  /* nodos */
  $form  = $('#tickets-form');
  $id    = $('#ticket-current-id');
  $sub   = $('#ticket-submit-btn');
  $can   = $('#ticket-cancel-btn');

  $pct   = $('#ticket-iva-pct');
  $bruto = $('#ticket-bruto');
  $neto  = $('#ticket-neto');
  $impIVA= $('#ticket-iva-imp');

  $loc   = $('#ticket-localizacion');
  $mot   = $('#ticket-motivo');
  $fecha = $('#ticket-fecha');
  $file  = $('#ticket-foto');

  /* cálculo IVA */
  const calc=()=>{
    const p=+$pct.value||0,b=+$bruto.value||0;
    const base=(b/(1+p/100)).toFixed(2), iva=(b-base).toFixed(2);
    $neto.value=base; $impIVA.value=iva;
  };
  [$pct,$bruto].forEach(el=>el.addEventListener('input',calc)); calc();

  /* eventos */
  $form.addEventListener('submit',onSubmit);
  $can .addEventListener('click',reset);

  $('#ticket-filter-btn').addEventListener('click',onFilter);
  $('#ticket-export-btn').addEventListener('click',exportPDF);
  $('#ticket-autofill-btn').addEventListener('click',autofill);

  document.addEventListener('click',delegate);
}
const $=id=>document.getElementById(id);

/* ---------- autofill ---------- */
async function autofill(){
  if(!$file.files.length){alert('Selecciona imagen');return;}
  const fd=new FormData();fd.append('foto',$file.files[0]);
  try{
    const r=await api('/tickets/autofill',{method:'POST',body:fd});
    if(r.localizacion)$loc.value=r.localizacion;
    if(r.motivo)$mot.value=r.motivo;
    if(r.dinero)$bruto.value=(+r.dinero).toFixed(2);
    if(r.fecha)$fecha.value=r.fecha.split('/').reverse().join('-');
    calc();
  }catch(err){alert(err.message);}
}

/* ---------- submit ---------- */
async function onSubmit(e){
  e.preventDefault();
  if(!$fecha.value||!$bruto.value){alert('Fecha e importe requeridos');return;}

  const fd=new FormData();
  if($file.files.length)fd.append('foto',$file.files[0]);
  fd.append('localizacion',$loc.value); fd.append('motivo',$mot.value);
  fd.append('fecha',$fecha.value); fd.append('iva_porcentaje',$pct.value);
  fd.append('importe_bruto',$bruto.value);

  try{
    if($id.value){
      await api(`/tickets/${$id.value}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          localizacion:$loc.value,motivo:$mot.value,fecha:$fecha.value,
          iva_porcentaje:$pct.value,importe_bruto:$bruto.value
        })
      });
      alert('Ticket actualizado');
    }else{
      await api('/tickets',{method:'POST',body:fd});
      alert('Ticket agregado');
    }
    reset(); onFilter();
  }catch(err){alert(err.message);}
}

function reset(){
  $form.reset(); $id.value=''; $sub.textContent='Agregar Ticket';
  $can.style.display='none'; $neto.value=$impIVA.value='';
}

/* ---------- filtro ---------- */
async function onFilter(){
  const s=$('ticket-filter-start').value, e=$('ticket-filter-end').value;
  if(!s||!e){alert('Seleccione fechas');return;}
  try{render(await api(`/tickets?start=${s}&end=${e}`));}
  catch(err){alert(err.message);}
}

/* ---------- render ---------- */
function render(rows){
  const $r=$('ticket-results');
  if(!rows.length){$r.innerHTML='<p>No se encontraron tickets.</p>';$('#ticket-total').textContent='0.00';return;}

  const head=['ID','Fecha','Localización','Base','IVA','%','Motivo','Foto','Acc'].map(h=>`<th>${h}</th>`).join('');
  const body=rows.map(t=>`
    <tr>
      <td>${t.id}</td><td>${t.fecha}</td><td>${t.localizacion}</td>
      <td>${t.dinero}</td><td>${t.iva_importe}</td><td>${t.iva_porcentaje}</td>
      <td>${t.motivo}</td><td>${t.foto?'📄':''}</td>
      <td>
        <button class="edit-ticket" data-row='${JSON.stringify(t)}'>✏️</button>
        <button class="delete-ticket" data-id='${t.id}'>🗑️</button>
      </td>
    </tr>`).join('');

  $r.innerHTML=`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  $('#ticket-total').textContent = rows.reduce((s,r)=>s+(+r.dinero||0),0).toFixed(2);
}

/* ---------- delegación ---------- */
function delegate(e){
  if(e.target.matches('.delete-ticket')){
    const id=e.target.dataset.id;if(!confirm('Eliminar ticket?'))return;
    api(`/tickets/${id}`,{method:'DELETE'})
      .then(()=>e.target.closest('tr').remove())
      .catch(err=>alert(err.message));
  }
  if(e.target.matches('.edit-ticket')){
    const t=JSON.parse(e.target.dataset.row);
    $id.value=t.id;$loc.value=t.localizacion;$mot.value=t.motivo;
    $fecha.value=t.fecha.split(' ')[0];
    $bruto.value=(+t.dinero + +t.iva_importe).toFixed(2);
    $pct.value=t.iva_porcentaje; calc();
    $sub.textContent='Actualizar Ticket'; $can.style.display='inline-block';
  }
}

/* ---------- exportar PDF ---------- */
function exportPDF() {
    const s = document.getElementById('ticket-filter-start').value,
          e = document.getElementById('ticket-filter-end').value;
    const q = (s && e) ? `?start=${s}&end=${e}&format=pdf` : '?format=pdf';
    window.open(`${API_BASE}/tickets/export${q}`, '_blank');
  }
  