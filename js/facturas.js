// Módulo de Facturas
(async function initFacturas() {
    const form       = document.getElementById('facturas-form');
    const idInput    = document.getElementById('factura-current-id');
    const autoBtn    = document.getElementById('factura-autofill-btn');
    const cancelBtn  = document.getElementById('factura-cancel-btn');
    const filterBtn  = document.getElementById('factura-filter-btn');
    const resultsDiv = document.getElementById('factura-results');
    const totalBr    = document.getElementById('factura-total-bruto');
    const totalNe    = document.getElementById('factura-total-neto');
    const exportBtn  = document.getElementById('factura-export-btn');
  
    autoBtn.addEventListener('click', async () => {
      const file = form['archivo'].files[0];
      if (!file) { alert('Selecciona archivo.'); return; }
      const fd = new FormData(); fd.append('archivo', file);
      try {
        const res = await fetch('https://josemiguelruizguevara.com:5000/api/facturas/autofill',{ method:'POST', body:fd });
        const d   = await res.json();
        if (d.fecha) {
          const [dd,mm,yy] = d.fecha.split('/');
          form.fecha.value = `${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
        }
        if (d.cantidad_bruta) form.bruta.value = parseFloat(d.cantidad_bruta).toFixed(2);
        if (d.cantidad_neta)  form.neta .value = parseFloat(d.cantidad_neta).toFixed(2);
        if (d.retencion)      form.retencion.value = parseFloat(d.retencion).toFixed(2);
        if (d.nombre_empresa) form.empresa.value = d.nombre_empresa;
      } catch (err) { alert('Error autofill: '+err.message); }
    });
  
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        fecha:   form.fecha.value,
        bruta:   form.bruta.value,
        neta:    form.neta.value,
        retencion: form.retencion.value,
        empresa: form.empresa.value
      };
      let url    = idInput.value
        ? `https://josemiguelruizguevara.com:5000/api/facturas/${idInput.value}`
        : 'https://josemiguelruizguevara.com:5000/api/facturas';
      let opts   = {
        method: idInput.value? 'PUT':'POST',
        headers: idInput.value? {'Content-Type':'application/json'}:{},
        body: idInput.value? JSON.stringify(data) : (() => {
          const fd = new FormData(form);
          if (form.archivo.files[0]) fd.append('archivo', form.archivo.files[0]);
          return fd;
        })()
      };
      try {
        const res = await fetch(url, opts);
        const json = !idInput.value? await res.json() : null;
        alert(idInput.value? 'Factura actualizada.' : 'Factura agregada. ID: '+json.id);
        form.reset(); idInput.value=''; cancelBtn.style.display='none';
        loadResults();
      } catch (err) { alert('Error: '+err.message); }
    });
  
    cancelBtn.addEventListener('click', () => {
      form.reset(); idInput.value=''; cancelBtn.style.display='none';
    });
  
    filterBtn.addEventListener('click', loadResults);
    exportBtn.addEventListener('click', () => {
      let url = 'https://josemiguelruizguevara.com:5000/api/facturas/export';
      const s = document.getElementById('factura-filter-start').value;
      const e = document.getElementById('factura-filter-end').value;
      if (s && e) url += `?start=${s}&end=${e}`;
      window.open(url,'_blank');
    });
  
    async function loadResults() {
      const s = document.getElementById('factura-filter-start').value;
      const e = document.getElementById('factura-filter-end').value;
      if (!s||!e) { alert('Selecciona fechas.'); return; }
      try {
        const res  = await fetch(`https://josemiguelruizguevara.com:5000/api/facturas?start=${s}&end=${e}`);
        const data = await res.json();
        let br=0, ne=0;
        if (!data.length) {
          resultsDiv.innerHTML = '<p>No hay facturas.</p>';
          totalBr.textContent = totalNe.textContent = '0.00';
          return;
        }
        const cols = ['ID','Fecha','Bruta','Neta','Retención','Empresa','Archivo','Acciones']
          .reduce((h,t)=>h+`<th>${t}</th>`,'');
        const rows = data.map(item => {
          br += parseFloat(item.cantidad_bruta)||0;
          ne += parseFloat(item.cantidad_neta)||0;
          return `<tr>
            <td>${item.id}</td>
            <td>${item.fecha}</td>
            <td>${item.cantidad_bruta}</td>
            <td>${item.cantidad_neta}</td>
            <td>${item.retencion}</td>
            <td>${item.nombre_empresa}</td>
            <td>${item.archivo}</td>
            <td>
              <button class="edit" data-json='${JSON.stringify(item)}'>✏️</button>
              <button class="delete" data-id="${item.id}">🗑️</button>
            </td>
          </tr>`;
        }).join('');
        resultsDiv.innerHTML = `<table border="1" style="width:100%"><thead><tr>${cols}</tr></thead><tbody>${rows}</tbody></table>`;
        totalBr.textContent = br.toFixed(2);
        totalNe.textContent = ne.toFixed(2);
      } catch (err) { alert('Error: '+err.message); }
    }
  
    resultsDiv.addEventListener('click', async e => {
      if (e.target.classList.contains('delete')) {
        if (!confirm('¿Eliminar?')) return;
        try {
          await fetch(`https://josemiguelruizguevara.com:5000/api/facturas/${e.target.dataset.id}`,{method:'DELETE'});
          loadResults();
        } catch(err){alert('Error: '+err.message);}
      }
      if (e.target.classList.contains('edit')) {
        const item = JSON.parse(e.target.dataset.json);
        form.fecha.value   = item.fecha;
        form.bruta.value   = item.cantidad_bruta;
        form.neta.value    = item.cantidad_neta;
        form.retencion.value = item.retencion;
        form.empresa.value = item.nombre_empresa;
        idInput.value      = item.id;
        cancelBtn.style.display='inline-block';
      }
    });
  })();
  