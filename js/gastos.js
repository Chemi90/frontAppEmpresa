/* js/gastos.js */
import { api } from './api.js';

let $f,$id,$sub,$can;
let $pct,$bruto,$neto,$iva,$por,$ded,$chk,$info,$cuota;

export function init(){
  // nodos
  $f   = document.getElementById('gastos-form');
  $id  = document.getElementById('gasto-current-id');
  $sub = document.getElementById('gasto-submit-btn');
  $can = document.getElementById('gasto-cancel-btn');

  $pct   = document.getElementById('gasto-iva-pct');
  $bruto = document.getElementById('gasto-bruto');
  $neto  = document.getElementById('gasto-neto');
  $iva   = document.getElementById('gasto-iva-imp');
  $por   = document.getElementById('gasto-porcentaje');
  $ded   = document.getElementById('gasto-deducible');
  $chk   = document.getElementById('gasto-dividir');
  $info  = document.getElementById('dividir-info');
  $cuota = document.getElementById('gasto-dividir-imp');

  /* --- cálculo IVA --- */
  const calcIVA = () => {
    const p = +$pct.value||0, b = +$bruto.value||0;
    const base = (b / (1+p/100)).toFixed(2);
    const imp  = (b - base).toFixed(2);
    $neto.value = base; $iva.value = imp;
    calcDeducible();
  };
  /* --- deducción --- */
  const calcDeducible = () => {
    const d = (+$neto.value||0) * ((+$por.value||0)/100);
    $ded.value = d.toFixed(2);
    if($chk.checked){
      $cuota.value = (d/4).toFixed(2);
    }
  };

  /* --- listeners --- */
  [$pct,$bruto].forEach(el=>el.addEventListener('input', calcIVA));
  $por.addEventListener('input', calcDeducible);

  $chk.addEventListener('change',()=>{
    $info.style.display = $chk.checked ? 'block' : 'none';
    calcDeducible();
  });

  $f  .addEventListener('submit', onSubmit);
  $can.addEventListener('click', reset);

  document.getElementById('gastos-filter-btn')
          .addEventListener('click', onFilter);
  document.getElementById('gastos-export-btn')
          .addEventListener('click', exportExcel);

  document.addEventListener('click', delegate);

  calcIVA();        // inicial
}

function formDataJSON(){
  return {
    fecha                : document.getElementById('gasto-fecha').value,
    tipo                 : document.getElementById('gasto-tipo').value,
    iva_porcentaje       : $pct.value,
    importe_bruto        : $bruto.value,
    porcentaje_deducible : $por.value,
    importe_deducible    : $ded.value,
    nota                 : document.getElementById('gasto-nota').value,
    gasto_compartido     : document.getElementById('gasto-compartido')?.checked?1:0,
    dividir_deduccion    : $chk.checked ? 1 : 0
  };
}

async function onSubmit(e){
  e.preventDefault();
  const data = formDataJSON();
  if(!data.fecha || !data.tipo || !data.importe_bruto){
    alert('Fecha, tipo e importe son obligatorios'); return;
  }
  try{
    if($id.value){
      await api(`/gastos/${$id.value}`,{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      alert('Gasto actualizado');
    }else{
      const {message}=await api('/gastos',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      alert(message);
    }
    reset();
  }catch(err){alert(err.message);}
}

function reset(){
  $f.reset(); $id.value=''; $sub.textContent='Agregar Gasto';
  $can.style.display='none'; $info.style.display='none';
  $neto.value=''; $iva.value=''; $ded.value=''; $cuota.value='';
}

async function onFilter(){
  const s=document.getElementById('gastos-filter-start').value;
  const e=document.getElementById('gastos-filter-end').value;
  if(!s||!e) return alert('Fechas necesarias');
  const rows = await api(`/gastos?start=${s}&end=${e}`);
  render(rows);
}

function render(rows){
  const $r = document.getElementById('gastos-results');
  if(!rows.length){
    $r.innerHTML='<p>Sin resultados</p>';
    document.getElementById('gastos-total').textContent='0.00';
    return;
  }
  const head = ['ID','Fecha','Tipo','Base (€)','IVA (€)','%','% Ded','Ded (€)','Nota','Acc.']
               .map(h=>`<th>${h}</th>`).join('');
  const body = rows.map(g=>`
    <tr>
      <td>${g.id}</td><td>${g.fecha}</td><td>${g.tipo}</td>
      <td>${g.importe_total}</td><td>${g.iva_importe}</td><td>${g.iva_porcentaje}</td>
      <td>${g.porcentaje_deducible}</td><td>${g.importe_deducible}</td>
      <td>${g.nota||''}</td>
      <td>
        <button class="edit-gasto" data-row='${JSON.stringify(g)}'>✏️</button>
        <button class="delete-gasto" data-id='${g.id}'>🗑️</button>
      </td>
    </tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  const total = rows.reduce((t,r)=>t+(+r.importe_total||0),0).toFixed(2);
  document.getElementById('gastos-total').textContent = total;
}

function delegate(e){
  if(e.target.matches('.delete-gasto')){
    const id=e.target.dataset.id;
    if(!confirm('Eliminar?'))return;
    api(`/gastos/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove());
  }
  if(e.target.matches('.edit-gasto')){
    const g=JSON.parse(e.target.dataset.row);
    Object.entries({
      'gasto-current-id':g.id, 'gasto-fecha':g.fecha,'gasto-tipo':g.tipo,
      'gasto-bruto':(+g.importe_total + +g.iva_importe).toFixed(2),
      'gasto-iva-pct':g.iva_porcentaje, 'gasto-porcentaje':g.porcentaje_deducible,
      'gasto-nota':g.nota
    }).forEach(([i,v])=>document.getElementById(i).value=v);
    document.getElementById('gasto-submit-btn').textContent='Actualizar Gasto';
    $can.style.display='inline-block';
    document.getElementById('gasto-iva-pct').dispatchEvent(new Event('input'));
  }
}

function exportExcel(){
  const s=document.getElementById('gastos-filter-start').value;
  const e=document.getElementById('gastos-filter-end').value;
  const q=s&&e?`?start=${s}&end=${e}`:'';
  window.open(`/api/gastos/export${q}`,'_blank');
}
