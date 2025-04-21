import {api} from './api.js';

let $f,$id,$sub,$can,$file;
export function init(){
  $f=document.getElementById('facturas-form');
  $id=document.getElementById('factura-current-id');
  $sub=document.getElementById('factura-submit-btn');
  $can=document.getElementById('factura-cancel-btn');
  $file=document.getElementById('factura-archivo');

  $f.addEventListener('submit',onSubmit);$can.addEventListener('click',reset);

  document.getElementById('factura-filter-btn').addEventListener('click',onFilter);
  document.getElementById('factura-export-btn').addEventListener('click',exportExcel);
  document.getElementById('factura-autofill-btn').addEventListener('click',autofill);

  document.addEventListener('click',delegate);
}

async function autofill(){
  if(!$file.files.length)return alert('Selecciona archivo');
  const fd=new FormData();fd.append('archivo',$file.files[0]);
  try{
    const d=await api('/facturas/autofill',{method:'POST',body:fd});
    if(d.fecha){const p=d.fecha.split('/');document.getElementById('factura-fecha').value=p.length===3?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:d.fecha;}
    if(d.cantidad_bruta)document.getElementById('factura-bruta').value=parseFloat(d.cantidad_bruta).toFixed(2);
    if(d.cantidad_neta)document.getElementById('factura-neta').value=parseFloat(d.cantidad_neta).toFixed(2);
    if(d.retencion)document.getElementById('factura-retencion').value=parseFloat(d.retencion).toFixed(2);
    if(d.nombre_empresa)document.getElementById('factura-empresa').value=d.nombre_empresa;
  }catch(err){alert(err.message);}
}

async function onSubmit(e){
  e.preventDefault();
  if($id.value){
    const data=Object.fromEntries(new FormData($f));
    try{await api(`/facturas/${$id.value}`,{method:'PUT',body:data});alert('Factura actualizada');reset();}
    catch(err){alert(err.message);}
  }else{
    const fd=new FormData($f);
    try{
      const {id}=await api('/facturas',{method:'POST',body:fd});
      alert('Factura agregada. ID:'+id);reset();
    }catch(err){alert(err.message);}
  }
}
function reset(){$f.reset();$id.value='';$sub.textContent='Agregar Factura';$can.style.display='none';}

async function onFilter(){
  const s=document.getElementById('factura-filter-start').value;
  const e=document.getElementById('factura-filter-end').value;
  if(!s||!e)return alert('Fechas necesarias');
  try{render(await api(`/facturas?start=${s}&end=${e}`));}catch(err){alert(err.message);}
}
function render(rows){
  const $r=document.getElementById('factura-results');
  if(!rows.length){$r.innerHTML='<p>No se encontraron facturas.</p>';document.getElementById('factura-total-bruto').textContent='0.00';document.getElementById('factura-total-neto').textContent='0.00';return;}
  const h=['ID','Fecha','Bruta','Neta','Retención','Empresa','Archivo','Acciones'].map(x=>`<th>${x}</th>`).join('');
  const b=rows.map(f=>`
    <tr>
      <td>${f.id}</td><td>${f.fecha}</td><td>${f.cantidad_bruta}</td><td>${f.cantidad_neta}</td>
      <td>${f.retencion}</td><td>${f.nombre_empresa}</td><td>${f.archivo}</td>
      <td>
        <button class="edit-factura" data-row='${JSON.stringify(f)}'>✏️</button>
        <button class="delete-factura" data-id='${f.id}'>🗑️</button>
      </td>
    </tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${h}</tr></thead><tbody>${b}</tbody></table>`;
  document.getElementById('factura-total-bruto').textContent=rows.reduce((t,{cantidad_bruta})=>t+(+cantidad_bruta||0),0).toFixed(2);
  document.getElementById('factura-total-neto').textContent=rows.reduce((t,{cantidad_neta})=>t+(+cantidad_neta||0),0).toFixed(2);
}
function delegate(e){
  if(e.target.matches('.delete-factura')){
    const id=e.target.dataset.id;if(!confirm('Eliminar?'))return;
    api(`/facturas/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove()).catch(err=>alert(err.message));
  }
  if(e.target.matches('.edit-factura')){
    const f=JSON.parse(e.target.dataset.row);
    Object.entries({
      'factura-current-id':f.id,'factura-fecha':f.fecha,'factura-bruta':f.cantidad_bruta,
      'factura-neta':f.cantidad_neta,'factura-retencion':f.retencion,'factura-empresa':f.nombre_empresa
    }).forEach(([i,v])=>document.getElementById(i).value=v);
    $sub.textContent='Actualizar Factura';$can.style.display='inline-block';
  }
}
function exportExcel(){
  const s=document.getElementById('factura-filter-start').value;
  const e=document.getElementById('factura-filter-end').value;
  const q=s&&e?`?start=${s}&end=${e}`:'';
  window.open(`https://josemiguelruizguevara.com:5000/api/facturas/export${q}`,'_blank');
}
