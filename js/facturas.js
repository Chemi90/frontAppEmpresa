/* js/facturas.js */
import { api, API_BASE } from './api.js';

let $f,$id,$sub,$can;
let $pct,$bruto,$neto,$iva;

export function init(){
  $f   = $('#facturas-form');
  $id  = $('#factura-current-id');
  $sub = $('#factura-submit-btn');
  $can = $('#factura-cancel-btn');

  $pct   = $('#factura-iva-pct');
  $bruto = $('#factura-bruto');
  $neto  = $('#factura-neto');
  $iva   = $('#factura-iva-imp');

  const calc = () => {
    const p=+$pct.value||0, b=+$bruto.value||0;
    const base=(b/(1+p/100)).toFixed(2), imp=(b-base).toFixed(2);
    $neto.value=base; $iva.value=imp;
  };
  [$pct,$bruto].forEach(el=>el.addEventListener('input',calc));

  $f.addEventListener('submit',onSubmit);
  $can.addEventListener('click',reset);

  $('#factura-filter-btn').addEventListener('click',e=>{e.preventDefault();onFilter();});
  $('#factura-export-btn').addEventListener('click',exportPDF);
  $('#factura-autofill-btn').addEventListener('click',autofill);

  document.addEventListener('click',delegate);
}
const $=id=>document.getElementById(id);

/* ---------- autofill ---------- */
async function autofill(){
  const file=$('#factura-archivo').files[0];
  if(!file){alert('Selecciona archivo');return;}
  const fd=new FormData(); fd.append('archivo',file);
  try{
    const d=await api('/facturas/autofill',{method:'POST',body:fd});
    if(d.fecha)$('#factura-fecha').value=d.fecha.split('/').reverse().join('-');
    if(d.cantidad_bruta)$bruto.value=(+d.cantidad_bruta).toFixed(2);
    if(d.iva_importe){
      const imp=+d.iva_importe, b=+d.cantidad_bruta+imp;
      $pct.value=((imp/b)*100).toFixed(2);
    }
    if(d.retencion)$('#factura-retencion').value=d.retencion;
    if(d.nombre_empresa)$('#factura-empresa').value=d.nombre_empresa;
    const event=new Event('input'); $bruto.dispatchEvent(event);
  }catch(err){alert(err.message);}
}

/* ---------- submit ---------- */
async function onSubmit(e){
  e.preventDefault();
  if(!$bruto.value||!$('#factura-fecha').value){
    alert('Fecha e importe requeridos');return;
  }

  if($id.value){ // update
    const data=Object.fromEntries(new FormData($f));
    try{
      await api(`/facturas/${$id.value}`,{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
      });
      alert('Factura actualizada'); reset(); onFilter();
    }catch(err){alert(err.message);}
  }else{         // insert
    const fd=new FormData($f);
    try{
      await api('/facturas',{method:'POST',body:fd});
      alert('Factura agregada'); reset(); onFilter();
    }catch(err){alert(err.message);}
  }
}

/* ---------- reset ---------- */
function reset(){
  $f.reset(); $id.value=''; $sub.textContent='Agregar Factura';
  $can.style.display='none'; $neto.value=$iva.value='';
}

/* ---------- filtro ---------- */
async function onFilter(){
  const s=$('factura-filter-start').value, e=$('factura-filter-end').value;
  if(!s||!e){alert('Seleccione fechas');return;}
  try{render(await api(`/facturas?start=${s}&end=${e}`));}
  catch(err){alert(err.message);}
}

/* ---------- render ---------- */
function render(rows){
  const $r=$('factura-results');
  if(!rows.length){
    $r.innerHTML='<p>No se encontraron facturas.</p>';
    $('#factura-total-bruto').textContent='0.00';
    $('#factura-total-neto').textContent='0.00';
    return;
  }

  const th=h=>`<th>${h}</th>`;
  const head=['ID','Fecha','Base','IVA','%','Retención','Empresa','Archivo','Acc.']
             .map(th).join('');
  const body=rows.map(f=>`
    <tr>
      <td>${f.id}</td><td>${f.fecha}</td><td>${f.cantidad_bruta}</td>
      <td>${f.iva_importe}</td><td>${f.iva_porcentaje}</td>
      <td>${f.retencion}</td><td>${f.nombre_empresa}</td><td>${f.archivo||''}</td>
      <td>
        <button class="edit-factura" data-row='${JSON.stringify(f)}'>✏️</button>
        <button class="delete-factura" data-id='${f.id}'>🗑️</button>
      </td>
    </tr>`).join('');

  $r.innerHTML=`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  $('#factura-total-bruto').textContent =
    rows.reduce((t,r)=>t+(+r.cantidad_bruta||0),0).toFixed(2);
  $('#factura-total-neto').textContent =
    rows.reduce((t,r)=>t+(+r.cantidad_neta||0),0).toFixed(2);
}

/* ---------- delegación ---------- */
function delegate(e){
  if(e.target.matches('.delete-factura')){
    const id=e.target.dataset.id;
    if(!confirm('¿Eliminar factura?'))return;
    api(`/facturas/${id}`,{method:'DELETE'})
      .then(()=>e.target.closest('tr').remove())
      .catch(err=>alert(err.message));
  }
  if(e.target.matches('.edit-factura')){
    const f=JSON.parse(e.target.dataset.row);
    $id.value=f.id; $('#factura-fecha').value=f.fecha;
    $pct.value = f.iva_porcentaje;
    $bruto.value=(+f.cantidad_bruta + +f.iva_importe).toFixed(2);
    $('#factura-retencion').value=f.retencion;
    $('#factura-empresa').value=f.nombre_empresa;
    const event=new Event('input'); $bruto.dispatchEvent(event);
    $sub.textContent='Actualizar Factura'; $can.style.display='inline-block';
  }
}

/* ---------- export PDF / Excel ---------- */
function exportPDF(){
  const s=$('factura-filter-start').value, e=$('factura-filter-end').value;
  const q=(s&&e)?`?start=${s}&end=${e}&format=pdf`:'?format=pdf';
  window.open(`${API_BASE}/facturas/export${q}`,'_blank');
}
