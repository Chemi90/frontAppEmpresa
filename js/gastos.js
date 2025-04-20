// Módulo de Gastos Varios
(async function initGastos() {
    const form        = document.getElementById('gastos-form');
    const idInput     = document.getElementById('gasto-current-id');
    const tipoSelect  = document.getElementById('gasto-tipo');
    const totalInput  = document.getElementById('gasto-total');
    const sharedChk   = document.getElementById('gasto-compartido');
    const pctInput    = document.getElementById('gasto-porcentaje');
    const deducInput  = document.getElementById('gasto-deducible');
    const divChk      = document.getElementById('gasto-dividir');
    const divInfo     = document.getElementById('dividir-info');
    const divAmtInput = document.getElementById('gasto-dividir-importe');
    const submitBtn   = document.getElementById('gasto-submit-btn');
    const cancelBtn   = document.getElementById('gasto-cancel-btn');
    const filterBtn   = document.getElementById('gastos-filter-btn');
    const resultsDiv  = document.getElementById('gastos-results');
    const totalSpan   = document.getElementById('gastos-total');
    const exportBtn   = document.getElementById('gastos-export-btn');
  
    function setDefaultPct() {
      const m = { 'Terminal móvil':50, 'ChatGPT Plus':100,
        'Electricidad':33, 'Internet':26.16, 'Seguro coche':40,
        'Gasolina':40,'IBI vivienda':33,'Comunidad de vecinos':33
      };
      pctInput.value = m[tipoSelect.value]||100;
    }
    tipoSelect.addEventListener('change', ()=>{ setDefaultPct(); updateDed(); });
    sharedChk.addEventListener('change', ()=>{
      pctInput.disabled = !sharedChk.checked;
      if (!sharedChk.checked) setDefaultPct();
      updateDed();
    });
  
    totalInput.addEventListener('input', updateDed);
    pctInput.addEventListener('input', updateDed);
  
    function updateDed() {
      const tot   = parseFloat(totalInput.value)||0;
      const pct   = parseFloat(pctInput.value)||0;
      const deduc = tot*(pct/100);
      deducInput.value = deduc.toFixed(2);
      if (divChk.checked) divAmtInput.value = (deduc/4).toFixed(2);
    }
  
    divChk.addEventListener('change', ()=>{
      divInfo.style.display = divChk.checked?'block':'none';
      if (divChk.checked) divAmtInput.value = ((parseFloat(deducInput.value) || 0) / 4).toFixed(2);
    });
  
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      fd.set('gasto_compartido', sharedChk.checked?'1':'0');
      if (!divChk.checked) {
        try {
          const res = await fetch('https://josemiguelruizguevara.com:5000/api/gastos',{method:'POST',body:fd});
          const j   = await res.json();
          alert('Gasto agregado. ID:'+j.id);
          form.reset(); setDefaultPct(); deducInput.value=''; divInfo.style.display='none';
          loadResults();
        } catch(err){alert('Error:'+err.message);}
        return;
      }
      // dividir en 4 años
      const origDate = form.fecha.value.split('-');
      const deducTot = parseFloat(deducInput.value)||0;
      const perYear  = (deducTot/4).toFixed(2);
      try {
        for(let i=0;i<4;i++){
          const ym = `${parseInt(origDate[0])+i}-${origDate[1]}-${origDate[2]}`;
          fd.set('fecha', ym);
          fd.set('importe_deducible', perYear);
          await fetch('https://josemiguelruizguevara.com:5000/api/gastos',{method:'POST',body:fd});
        }
        alert('Gasto dividido y agregado en 4 años.');
        form.reset(); setDefaultPct(); deducInput.value=''; divInfo.style.display='none';
        loadResults();
      } catch(err){alert('Error:'+err.message);}
    });
  
    cancelBtn.addEventListener('click', () => {
      form.reset(); setDefaultPct(); cancelBtn.style.display='none'; deducInput.value=''; divInfo.style.display='none';
    });
  
    filterBtn.addEventListener('click', loadResults);
    exportBtn.addEventListener('click', () => {
      let url = 'https://josemiguelruizguevara.com:5000/api/gastos/export';
      const s = document.getElementById('gastos-filter-start').value;
      const e = document.getElementById('gastos-filter-end').value;
      if (s&&e) url += `?start=${s}&end=${e}`;
      window.open(url,'_blank');
    });
  
    async function loadResults() {
      const s = document.getElementById('gastos-filter-start').value;
      const e = document.getElementById('gastos-filter-end').value;
      if (!s||!e) { alert('Selecciona fechas.'); return;}
      try {
        const res  = await fetch(`https://josemiguelruizguevara.com:5000/api/gastos?start=${s}&end=${e}`);
        const data = await res.json();
        let tot = 0;
        if (!data.length) {
          resultsDiv.innerHTML = '<p>No hay gastos.</p>';
          totalSpan.textContent = '0.00';
          return;
        }
        const hdrs = ['ID','Fecha','Tipo','Imp. Total','% Deducible','Deducible','Nota','Compartido','Acciones']
          .reduce((h,t)=>h+`<th>${t}</th>`,'');
        const rows = data.map(item => {
          tot += parseFloat(item.importe_total)||0;
          return `<tr>
            <td>${item.id}</td>
            <td>${item.fecha}</td>
            <td>${item.tipo}</td>
            <td>${item.importe_total}</td>
            <td>${item.porcentaje_deducible}</td>
            <td>${item.importe_deducible}</td>
            <td>${item.nota||''}</td>
            <td>${item.gasto_compartido==1?'Sí':'No'}</td>
            <td>
              <button class="edit" data-json='${JSON.stringify(item)}'>✏️</button>
              <button class="delete" data-id="${item.id}">🗑️</button>
            </td>
          </tr>`;
        }).join('');
        resultsDiv.innerHTML = `<table border="1" style="width:100%"><thead><tr>${hdrs}</tr></thead><tbody>${rows}</tbody></table>`;
        totalSpan.textContent = tot.toFixed(2);
      } catch(err){alert('Error:'+err.message);}
    }
  
    resultsDiv.addEventListener('click', async e=>{
      if(e.target.classList.contains('delete')){
        if(!confirm('¿Eliminar?'))return;
        try{await fetch(`https://josemiguelruizguevara.com:5000/api/gastos/${e.target.dataset.id}`,{method:'DELETE'});loadResults();}
        catch(err){alert('Error:'+err.message);}
      }
      if(e.target.classList.contains('edit')){
        const it = JSON.parse(e.target.dataset.json);
        form.fecha.value            = it.fecha;
        tipoSelect.value            = it.tipo;
        totalInput.value            = it.importe_total;
        sharedChk.checked           = it.gasto_compartido==1;
        pctInput.disabled           = !shared
        pctInput.value              = it.porcentaje_deducible;
        deducInput.value            = it.importe_deducible;
        divChk.checked              = false;
        divInfo.style.display       = 'none';
        idInput.value               = it.id;
        cancelBtn.style.display     = 'inline-block';
      }
    });
  
    // inicialización
    setDefaultPct();
    updateDed();
  })();
  