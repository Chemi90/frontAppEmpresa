/* js/gastos.js */
import { api } from './api.js';

let $f,$id,$sub,$can;
let $pct,$bruto,$neto,$iva,$por,$ded;

export function init(){
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

  const calcIVA = () => {
    const p = +$pct.value || 0, b = +$bruto.value || 0;
    const base = (b / (1 + p/100)).toFixed(2);
    const imp  = (b - base).toFixed(2);
    $neto.value = base;
    $iva.value  = imp;
    calcDeducible();
  };
  const calcDeducible = () => {
    const d = (+$neto.value||0) * ((+$por.value||0)/100);
    $ded.value = d.toFixed(2);
  };

  $pct.addEventListener('input', calcIVA);
  $bruto.addEventListener('input', calcIVA);
  $por.addEventListener('input', calcDeducible);

  $f.addEventListener('submit', onSubmit);
  $can.addEventListener('click', reset);

  document.getElementById('gastos-filter-btn')
          .addEventListener('click', onFilter);
  document.getElementById('gastos-export-btn')
          .addEventListener('click', exportExcel);

  document.addEventListener('click', delegate);
}

async function onSubmit(e){
  e.preventDefault();
  const fd = new FormData($f);  // incluye importe_bruto e iva_porcentaje
  try{
    if($id.value){
      await api(`/gastos/${$id.value}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(Object.fromEntries(fd))
      });
      alert('Gasto actualizado');
    } else {
      const {id} = await api('/gastos', {method:'POST', body:fd});
      alert('Gasto creado ID '+id);
    }
    reset();
  }catch(err){alert(err.message);}
}

function reset(){
  $f.reset(); $id.value=''; $sub.textContent='Agregar Gasto';
  $can.style.display='none'; $neto.value=''; $iva.value=''; $ded.value='';
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
