import {api} from './api.js';

let $f,$id,$sub,$can,$file;
export function init(){
  $f=document.getElementById('nominas-form');
  $id=document.getElementById('nomina-current-id');
  $sub=document.getElementById('nomina-submit-btn');
  $can=document.getElementById('nomina-cancel-btn');
  $file=document.getElementById('nomina-documento');

  $f.addEventListener('submit',onSubmit);$can.addEventListener('click',reset);

  document.getElementById('nomina-autofill-btn').addEventListener('click',autofill);
  document.getElementById('nominas-filter-btn').addEventListener('click',onFilter);
  document.getElementById('nominas-export-btn').addEventListener('click',exportExcel);

  document.addEventListener('click',delegate);
}
async function autofill(){
  if(!$file.files.length)return alert('Selecciona archivo');
  const fd=new FormData();fd.append('documento',$file.files[0]);
  try{
    const d=await api('/nominas/autofill',{method:'POST',body:fd});
    if(d.empresa)document.getElementById('nomina-empresa').value=d.empresa;
    if(d.cif)document.getElementById('nomina-cif').value=d.cif;
    if(d.fecha_contrato){
      const p=d.fecha_contrato.split('/');document.getElementById('nomina-fecha-contrato').value=p.length===3?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:d.fecha_contrato;
    }
    if(d.categoria)document.getElementById('nomina-categoria').value=d.categoria;
    if(d.total_devengo)document.getElementById('nomina-total-devengo').value=parseFloat(d.total_devengo).toFixed(2);
    if(d.liquido_percibir)document.getElementById('nomina-liquido').value=parseFloat(d.liquido_percibir).toFixed(2);
    if(d.total_deducciones)document.getElementById('nomina-total-deducciones').value=parseFloat(d.total_deducciones).toFixed(2);
  }catch(err){alert(err.message);}
}

async function onSubmit(e){
  e.preventDefault();
  if($id.value){
    const data=Object.fromEntries(new FormData($f));
    try{await api(`/nominas/${$id.value}`,{method:'PUT',body:data});alert('Nómina actualizada');reset();}
    catch(err){alert(err.message);}
  }else{
    const fd=new FormData($f);
    try{
      const {id}=await api('/nominas',{method:'POST',body:fd});
      alert('Nómina agregada. ID:'+id);reset();
    }catch(err){alert(err.message);}
  }
}
function reset(){$f.reset();$id.value='';$sub.textContent='Agregar Nómina';$can.style.display='none';}

async function onFilter(){
  const s=document.getElementById('nominas-filter-start').value;
  const e=document.getElementById('nominas-filter-end').value;
  if(!s||!e)return alert('Fechas necesarias');
  try{render(await api(`/nominas?start=${s}&end=${e}`));}catch(err){alert(err.message);}
}
function render(rows){
  const $r=document.getElementById('nominas-results');
  if(!rows.length){$r.innerHTML='<p>No se encontraron nóminas.</p>';return;}
  const h=['ID','Empresa','CIF','Fecha','Categoría','Devengo','Líquido','Deducciones','Acciones'].map(x=>`<th>${x}</th>`).join('');
  const b=rows.map(n=>`
    <tr>
      <td>${n.id}</td><td>${n.empresa}</td><td>${n.cif}</td><td>${n.fecha_contrato}</td>
      <td>${n.categoria}</td><td>${n.total_devengo}</td><td>${n.liquido_percibir}</td><td>${n.total_deducciones}</td>
      <td>
        <button class="edit-nomina" data-row='${JSON.stringify(n)}'>✏️</button>
        <button class="delete-nomina" data-id='${n.id}'>🗑️</button>
      </td>
    </tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${h}</tr></thead><tbody>${b}</tbody></table>`;
}
function delegate(e){
  if(e.target.matches('.delete-nomina')){
    const id=e.target.dataset.id;if(!confirm('Eliminar?'))return;
    api(`/nominas/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove()).catch(err=>alert(err.message));
  }
  if(e.target.matches('.edit-nomina')){
    const n=JSON.parse(e.target.dataset.row);
    Object.entries({
      'nomina-current-id':n.id,'nomina-empresa':n.empresa,'nomina-cif':n.cif,
      'nomina-fecha-contrato':n.fecha_contrato,'nomina-categoria':n.categoria,
      'nomina-total-devengo':parseFloat(n.total_devengo).toFixed(2),
      'nomina-liquido':parseFloat(n.liquido_percibir).toFixed(2),
      'nomina-total-deducciones':parseFloat(n.total_deducciones).toFixed(2)
    }).forEach(([i,v])=>document.getElementById(i).value=v);
    $sub.textContent='Actualizar Nómina';$can.style.display='inline-block';
  }
}
function exportExcel(){
  const s=document.getElementById('nominas-filter-start').value;
  const e=document.getElementById('nominas-filter-end').value;
  const q=s&&e?`?start=${s}&end=${e}`:'';
  window.open(`https://josemiguelruizguevara.com:5000/api/nominas/export${q}`,'_blank');
}
