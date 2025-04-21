import {api} from './api.js';

let $f,$id,$sub,$can,$tipo,$total,$chk,$por,$ded,$divChk,$divInfo,$divImp;
export function init(){
  $f=document.getElementById('gastos-form');
  $id=document.getElementById('gasto-current-id');
  $sub=document.getElementById('gasto-submit-btn');
  $can=document.getElementById('gasto-cancel-btn');

  $tipo=document.getElementById('gasto-tipo');
  $total=document.getElementById('gasto-total');
  $chk=document.getElementById('gasto-compartido');
  $por=document.getElementById('gasto-porcentaje');
  $ded=document.getElementById('gasto-deducible');
  $divChk=document.getElementById('gasto-dividir');
  $divInfo=document.getElementById('dividir-info');
  $divImp=document.getElementById('gasto-dividir-importe');

  setDefault();updateDed();
  $tipo.addEventListener('change',()=>{setDefault();updateDed();});
  $chk.addEventListener('change',()=>{$por.disabled=!$chk.checked;if(!$chk.checked)setDefault();updateDed();});
  $total.addEventListener('input',updateDed);$por.addEventListener('input',updateDed);

  $divChk.addEventListener('change',()=>{
    $divInfo.style.display=$divChk.checked?'block':'none';
    if($divChk.checked)$divImp.value=(+$ded.value/4).toFixed(2);
  });

  $f.addEventListener('submit',onSubmit);$can.addEventListener('click',reset);

  document.getElementById('gastos-filter-btn').addEventListener('click',onFilter);
  document.getElementById('gastos-export-btn').addEventListener('click',exportExcel);

  document.addEventListener('click',delegate);
}
function setDefault(){
  const m={'Terminal móvil':50,'ChatGPT Plus':100,'Electricidad':33,'Internet':26.16,'Seguro coche':40,'Gasolina':40,'IBI vivienda':33,'Comunidad de vecinos':33};
  $por.value=m[$tipo.value]??100;
}
function updateDed(){
  const d=(+$total.value||0)*(+$por.value||0)/100;$ded.value=d.toFixed(2);
  if($divChk.checked)$divImp.value=(d/4).toFixed(2);
}
async function onSubmit(e){
  e.preventDefault();
  if(!$divChk.checked){singleSubmit();return;}
  // dividir en 4 años
  const fecha=document.getElementById('gasto-fecha').value;if(!fecha)return alert('Fecha requerida');
  const dTotal=parseFloat($ded.value)||0;const cuota=(dTotal/4).toFixed(2);
  const [y,m,d]=fecha.split('-').map(Number);
  const promises=[];
  for(let i=0;i<4;i++){
    const fd=new FormData($f);
    fd.set('fecha',`${y+i}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    fd.set('importe_deducible',cuota);
    fd.set('gasto_compartido',$chk.checked?'1':'0');
    promises.push(api('/gastos',{method:'POST',body:fd}));
  }
  try{await Promise.all(promises);alert('Gasto dividido agregado');reset();}catch(err){alert(err.message);}
}
async function singleSubmit(){
  const fd=new FormData($f);fd.set('gasto_compartido',$chk.checked?'1':'0');
  try{
    if($id.value){
      await api(`/gastos/${$id.value}`,{method:'PUT',body:Object.fromEntries(fd)});alert('Gasto actualizado');
    }else{
      const {id}=await api('/gastos',{method:'POST',body:fd});alert('Gasto agregado. ID:'+id);
    }reset();
  }catch(err){alert(err.message);}
}
function reset(){$f.reset();$id.value='';$sub.textContent='Agregar Gasto';$can.style.display='none';setDefault();updateDed();$divInfo.style.display='none';}

async function onFilter(){
  const s=document.getElementById('gastos-filter-start').value;
  const e=document.getElementById('gastos-filter-end').value;
  if(!s||!e)return alert('Fechas necesarias');
  try{render(await api(`/gastos?start=${s}&end=${e}`));}catch(err){alert(err.message);}
}
function render(rows){
  const $r=document.getElementById('gastos-results');
  if(!rows.length){$r.innerHTML='<p>No se encontraron gastos.</p>';document.getElementById('gastos-total').textContent='0.00';return;}
  const h=['ID','Fecha','Tipo','Importe total','% Ded','Importe ded','Nota','Compartido','Acciones'].map(x=>`<th>${x}</th>`).join('');
  const b=rows.map(g=>`
    <tr>
      <td>${g.id}</td><td>${g.fecha}</td><td>${g.tipo}</td>
      <td>${g.importe_total}</td><td>${g.porcentaje_deducible}</td><td>${g.importe_deducible}</td>
      <td>${g.nota||''}</td><td>${g.gasto_compartido==1?'Sí':'No'}</td>
      <td>
        <button class="edit-gasto" data-row='${JSON.stringify(g)}'>✏️</button>
        <button class="delete-gasto" data-id='${g.id}'>🗑️</button>
      </td>
    </tr>`).join('');
  $r.innerHTML=`<table><thead><tr>${h}</tr></thead><tbody>${b}</tbody></table>`;
  document.getElementById('gastos-total').textContent=rows.reduce((t,{importe_total})=>t+(+importe_total||0),0).toFixed(2);
}
function delegate(e){
  if(e.target.matches('.delete-gasto')){
    const id=e.target.dataset.id;if(!confirm('Eliminar?'))return;
    api(`/gastos/${id}`,{method:'DELETE'}).then(()=>e.target.closest('tr').remove()).catch(err=>alert(err.message));
  }
  if(e.target.matches('.edit-gasto')){
    const g=JSON.parse(e.target.dataset.row);
    Object.entries({
      'gasto-current-id':g.id,'gasto-fecha':g.fecha,'gasto-tipo':g.tipo,'gasto-total':g.importe_total,
      'gasto-porcentaje':g.porcentaje_deducible,'gasto-deducible':g.importe_deducible,'gasto-nota':g.nota
    }).forEach(([i,v])=>document.getElementById(i).value=v);
    $chk.checked=g.gasto_compartido==1;$por.disabled=!$chk.checked;
    $sub.textContent='Actualizar Gasto';$can.style.display='inline-block';updateDed();
  }
}
function exportExcel(){
  const s=document.getElementById('gastos-filter-start').value;
  const e=document.getElementById('gastos-filter-end').value;
  const q=s&&e?`?start=${s}&end=${e}`:'';
  window.open(`https://josemiguelruizguevara.com:5000/api/gastos/export${q}`,'_blank');
}
