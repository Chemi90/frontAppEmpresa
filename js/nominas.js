/* js/nominas.js */
import { api } from './api.js';

let $f,$id,$sub,$can,$file;

export function init() {
  $f   = document.getElementById('nominas-form');
  $id  = document.getElementById('nomina-current-id');
  $sub = document.getElementById('nomina-submit-btn');
  $can = document.getElementById('nomina-cancel-btn');
  $file= document.getElementById('nomina-documento');

  $f.addEventListener('submit', onSubmit);
  $can.addEventListener('click', reset);

  document.getElementById('nomina-autofill-btn').addEventListener('click', autofill);
  document.getElementById('nominas-filter-btn').addEventListener('click', onFilter);
  document.getElementById('nominas-export-btn').addEventListener('click', exportPDF);

  document.addEventListener('click', delegate);
}

/* ---------- autofill IA ---------- */
async function autofill() {
  if (!$file.files.length) { alert('Selecciona archivo'); return; }
  const fd = new FormData(); fd.append('documento', $file.files[0]);
  try {
    const d = await api('/nominas/autofill', { method:'POST', body:fd });
    if (d.empresa)            $('#nomina-empresa').value          = d.empresa;
    if (d.cif)                $('#nomina-cif').value              = d.cif;
    if (d.fecha_contrato) {
      const p = d.fecha_contrato.split('/');
      $('#nomina-fecha-contrato').value =
        p.length === 3 ? `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}` : d.fecha_contrato;
    }
    if (d.categoria)          $('#nomina-categoria').value        = d.categoria;
    if (d.total_devengo)      $('#nomina-total-devengo').value    = (+d.total_devengo).toFixed(2);
    if (d.liquido_percibir)   $('#nomina-liquido').value          = (+d.liquido_percibir).toFixed(2);
    if (d.total_deducciones)  $('#nomina-total-deducciones').value= (+d.total_deducciones).toFixed(2);
  } catch (err) { alert(err.message); }
}
const $ = id => document.getElementById(id);

/* ---------- submit ---------- */
async function onSubmit(e) {
  e.preventDefault();
  if ($id.value) {                       // UPDATE
    const data = Object.fromEntries(new FormData($f));
    try {
      await api(`/nominas/${$id.value}`, {
        method : 'PUT',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify(data)
      });
      alert('Nómina actualizada'); reset(); onFilter();
    } catch (err) { alert(err.message); }
  } else {                               // INSERT
    const fd = new FormData($f);
    try {
      await api('/nominas', { method:'POST', body:fd });
      alert('Nómina agregada'); reset(); onFilter();
    } catch (err) { alert(err.message); }
  }
}

function reset() {
  $f.reset(); $id.value=''; $sub.textContent='Agregar Nómina';
  $can.style.display='none';
}

/* ---------- filtrado ---------- */
async function onFilter() {
  const s=$('nominas-filter-start').value, e=$('nominas-filter-end').value;
  if (!s || !e) { alert('Fechas necesarias'); return; }
  try { render(await api(`/nominas?start=${s}&end=${e}`)); }
  catch (err) { alert(err.message); }
}

/* ---------- render tabla ---------- */
function render(rows) {
  const $r=$('nominas-results');
  if (!rows.length) { $r.innerHTML='<p>No se encontraron nóminas.</p>'; return; }

  const head=['ID','Empresa','CIF','Fecha','Categoría','Devengo','Líquido','Deducciones','Acc.']
             .map(h=>`<th>${h}</th>`).join('');
  const body=rows.map(n=>`
    <tr>
      <td>${n.id}</td><td>${n.empresa}</td><td>${n.cif}</td><td>${n.fecha_contrato}</td>
      <td>${n.categoria}</td><td>${n.total_devengo}</td><td>${n.liquido_percibir}</td><td>${n.total_deducciones}</td>
      <td>
        <button class="edit-nomina" data-row='${JSON.stringify(n)}'>✏️</button>
        <button class="delete-nomina" data-id='${n.id}'>🗑️</button>
      </td>
    </tr>`).join('');

  $r.innerHTML=`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/* ---------- delegación ---------- */
function delegate(e){
  if(e.target.matches('.delete-nomina')){
    const id=e.target.dataset.id;
    if(!confirm('Eliminar?')) return;
    api(`/nominas/${id}`,{method:'DELETE'})
      .then(()=>e.target.closest('tr').remove())
      .catch(err=>alert(err.message));
  }
  if(e.target.matches('.edit-nomina')){
    const n=JSON.parse(e.target.dataset.row);
    Object.entries({
      'nomina-current-id':n.id,'nomina-empresa':n.empresa,'nomina-cif':n.cif,
      'nomina-fecha-contrato':n.fecha_contrato,'nomina-categoria':n.categoria,
      'nomina-total-devengo':(+n.total_devengo).toFixed(2),
      'nomina-liquido':(+n.liquido_percibir).toFixed(2),
      'nomina-total-deducciones':(+n.total_deducciones).toFixed(2)
    }).forEach(([i,v])=>$(i).value=v);
    $sub.textContent='Actualizar Nómina';
    $can.style.display='inline-block';
  }
}

/* ---------- exportar PDF ---------- */
function exportPDF(){
  const s=$('nominas-filter-start').value, e=$('nominas-filter-end').value;
  const q=(s&&e)?`?start=${s}&end=${e}&format=pdf`:'?format=pdf';
  window.open(`/api/nominas/export${q}`,'_blank');
}
