// Módulo de Nóminas
(async function initNominas() {
    const form       = document.getElementById('nominas-form');
    const idInput    = document.getElementById('nomina-current-id');
    const autoBtn    = document.getElementById('nomina-autofill-btn');
    const cancelBtn  = document.getElementById('nomina-cancel-btn');
    const filterBtn  = document.getElementById('nominas-filter-btn');
    const resultsDiv = document.getElementById('nominas-results');
    const exportBtn  = document.getElementById('nominas-export-btn');
  
    autoBtn.addEventListener('click', async () => {
      const file = form['documento'].files[0];
      if (!file) { alert('Selecciona documento.'); return; }
      const fd = new FormData(); fd.append('documento', file);
      try {
        const res = await fetch('https://josemiguelruizguevara.com:5000/api/nominas/autofill',{method:'POST',body:fd});
        const d   = await res.json();
        ['empresa','cif','categoria','total_devengo','liquido_percibir','total_deducciones'].forEach(f=>{
          if (d[f]) form[f.replace('_','-')].value = d[f];
        });
        if (d.fecha_contrato) {
          const [dd,mm,yy] = d.fecha_contrato.split('/');
          form['fecha-contrato'].value = `${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
        }
      } catch(err){alert('Error autofill:'+err.message);}
    });
  
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        empresa:           form.empresa.value,
        cif:               form.cif.value,
        fecha_contrato:    form['fecha-contrato'].value,
        categoria:         form.categoria.value,
        total_devengo:     form['total-devengo'].value,
        liquido_percibir:  form.liquido.value,
        total_deducciones: form['total-deducciones'].value
      };
      const url    = idInput.value
        ? `https://josemiguelruizguevara.com:5000/api/nominas/${idInput.value}`
        : 'https://josemiguelruizguevara.com:5000/api/nominas';
      const opts   = idInput.value
        ? { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }
        : { method:'POST', body: new FormData(form) };
      try {
        const res = await fetch(url, opts);
        const json = !idInput.value? await res.json():null;
        alert(idInput.value? 'Nómina actualizada.':'Nómina agregada. ID:'+json.id);
        form.reset(); idInput.value=''; cancelBtn.style.display='none';
        loadResults();
      } catch(err){alert('Error:'+err.message);}
    });
  
    cancelBtn.addEventListener('click', () => {
      form.reset(); idInput.value=''; cancelBtn.style.display='none';
    });
  
    filterBtn.addEventListener('click', loadResults);
    exportBtn.addEventListener('click', () => {
      let url = 'https://josemiguelruizguevara.com:5000/api/nominas/export';
      const s = document.getElementById('nominas-filter-start').value;
      const e = document.getElementById('nominas-filter-end').value;
      if (s&&e) url += `?start=${s}&end=${e}`;
      window.open(url,'_blank');
    });
  
    async function loadResults() {
      const s = document.getElementById('nominas-filter-start').value;
      const e = document.getElementById('nominas-filter-end').value;
      if (!s||!e) { alert('Selecciona fechas.'); return; }
      try {
        const res  = await fetch(`https://josemiguelruizguevara.com:5000/api/nominas?start=${s}&end=${e}`);
        const data = await res.json();
        if (!data.length) {
          resultsDiv.innerHTML = '<p>No hay nóminas.</p>';
          return;
        }
        const hdrs = ['ID','Empresa','CIF','Fecha contrato','Categoría','Devengo','Líquido','Deducciones','Acciones']
          .reduce((h,t)=>h+`<th>${t}</th>`,'');
        const rows = data.map(item => `<tr>
          <td>${item.id}</td>
          <td>${item.empresa}</td>
          <td>${item.cif}</td>
          <td>${item.fecha_contrato}</td>
          <td>${item.categoria}</td>
          <td>${item.total_devengo}</td>
          <td>${item.liquido_percibir}</td>
          <td>${item.total_deducciones}</td>
          <td>
            <button class="edit" data-json='${JSON.stringify(item)}'>✏️</button>
            <button class="delete" data-id="${item.id}">🗑️</button>
          </td>
        </tr>`).join('');
        resultsDiv.innerHTML = `<table border="1" style="width:100%"><thead><tr>${hdrs}</tr></thead><tbody>${rows}</tbody></table>`;
      } catch(err){alert('Error:'+err.message);}
    }
  
    resultsDiv.addEventListener('click', async e => {
      if (e.target.classList.contains('delete')) {
        if (!confirm('¿Eliminar?')) return;
        try {
          await fetch(`https://josemiguelruizguevara.com:5000/api/nominas/${e.target.dataset.id}`,{method:'DELETE'});
          loadResults();
        } catch(err){alert('Error:'+err.message);}
      }
      if (e.target.classList.contains('edit')) {
        const it = JSON.parse(e.target.dataset.json);
        form.empresa.value       = it.empresa;
        form.cif.value           = it.cif;
        form['fecha-contrato'].value = it.fecha_contrato;
        form.categoria.value     = it.categoria;
        form['total-devengo'].value   = it.total_devengo;
        form.liquido.value       = it.liquido_percibir;
        form['total-deducciones'].value = it.total_deducciones;
        idInput.value            = it.id;
        cancelBtn.style.display  = 'inline-block';
      }
    });
  
    // carga inicial
    loadResults();
  })();
  