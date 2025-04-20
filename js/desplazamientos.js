// Módulo de Desplazamientos
(async function initDesplazamientos() {
    const kmInput       = document.getElementById('desp-km');
    const dedInput      = document.getElementById('desp-deduccion');
    const gastoInput    = document.getElementById('desp-gasto');
    const idInput       = document.getElementById('desp-current-id');
    const submitBtn     = document.getElementById('desp-submit-btn');
    const cancelBtn     = document.getElementById('desp-cancel-btn');
    const form          = document.getElementById('desplazamientos-form');
    const filterBtn     = document.getElementById('desp-filter-btn');
    const resultsDiv    = document.getElementById('desp-results');
    const totalSpan     = document.getElementById('desp-total');
    const exportBtn     = document.getElementById('desplazamientos-export-btn');
  
    function updateCost() {
      const km   = parseFloat(kmInput.value) || 0;
      const rate = parseFloat(dedInput.value) || 0;
      gastoInput.value = (km * rate).toFixed(2);
    }
    kmInput.addEventListener('input', updateCost);
    dedInput.addEventListener('input', updateCost);
  
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        fecha:       form['fecha'].value,
        destino:     form['destino'].value,
        distancia:   form['distancia'].value,
        descripcion: form['descripcion'].value,
        dia:         form['dia'].value,
        cliente:     form['cliente'].value,
        deduccion:   form['deduccion'].value,
        gasto:       form['gasto'].value,
      };
      try {
        if (idInput.value) {
          await fetch(`https://josemiguelruizguevara.com:5000/api/desplazamientos/${idInput.value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          alert('Desplazamiento actualizado.');
        } else {
          const res = await fetch('https://josemiguelruizguevara.com:5000/api/desplazamientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const json = await res.json();
          alert('Desplazamiento agregado. ID: ' + json.id);
        }
        form.reset();
        idInput.value = '';
        submitBtn.textContent = 'Agregar Desplazamiento';
        cancelBtn.style.display = 'none';
        gastoInput.value = '';
        loadResults(); // recarga lista si está filtrada
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  
    cancelBtn.addEventListener('click', () => {
      form.reset();
      idInput.value = '';
      submitBtn.textContent = 'Agregar Desplazamiento';
      cancelBtn.style.display = 'none';
      gastoInput.value = '';
    });
  
    filterBtn.addEventListener('click', loadResults);
  
    exportBtn.addEventListener('click', () => {
      let url = 'https://josemiguelruizguevara.com:5000/api/desplazamientos/export';
      const start = form['desp-filter-start']?.value;
      const end   = form['desp-filter-end']?.value;
      if (start && end) url += `?start=${start}&end=${end}`;
      window.open(url, '_blank');
    });
  
    async function loadResults() {
      const start = document.getElementById('desp-filter-start').value;
      const end   = document.getElementById('desp-filter-end').value;
      if (!start || !end) { alert('Selecciona ambas fechas.'); return; }
      try {
        const res  = await fetch(`https://josemiguelruizguevara.com:5000/api/desplazamientos?start=${start}&end=${end}`);
        const data = await res.json();
        let total   = 0;
        if (!data.length) {
          resultsDiv.innerHTML = '<p>No hay desplazamientos.</p>';
          totalSpan.textContent = '0.00';
          return;
        }
        const table = document.createElement('table');
        table.border = 1; table.style.width = '100%';
        const hdr = table.insertRow();
        ['ID','Fecha','Origen','Destino','Km','Descripción','Día','Cliente','Deducción','Gasto','Acciones']
          .forEach(t => hdr.insertCell().textContent = t);
        data.forEach(item => {
          const r = table.insertRow();
          r.insertCell().textContent = item.id;
          r.insertCell().textContent = item.fecha;
          r.insertCell().textContent = item.origen;
          r.insertCell().textContent = item.destino;
          r.insertCell().textContent = item.distancia;
          r.insertCell().textContent = item.descripcion;
          r.insertCell().textContent = item.dia;
          r.insertCell().textContent = item.cliente;
          r.insertCell().textContent = item.deduccion;
          r.insertCell().textContent = item.gasto;
          total += parseFloat(item.gasto)||0;
          const a = r.insertCell();
          a.innerHTML = `
            <button class="edit" data-json='${JSON.stringify(item)}'>✏️</button>
            <button class="delete" data-id="${item.id}">🗑️</button>
          `;
        });
        resultsDiv.innerHTML = '';
        resultsDiv.appendChild(table);
        totalSpan.textContent = total.toFixed(2);
      } catch (err) {
        alert('Error al cargar: ' + err.message);
      }
    }
  
    // Delegación de eventos de edición/eliminación
    resultsDiv.addEventListener('click', async e => {
      if (e.target.classList.contains('delete')) {
        if (!confirm('¿Eliminar?')) return;
        try {
          await fetch(`https://josemiguelruizguevara.com:5000/api/desplazamientos/${e.target.dataset.id}`, { method: 'DELETE' });
          loadResults();
        } catch (err) { alert('Error: ' + err.message); }
      }
      if (e.target.classList.contains('edit')) {
        const item = JSON.parse(e.target.dataset.json);
        Object.entries(item).forEach(([k,v]) => {
          const fld = document.getElementById('desp-' + k) || document.getElementById('desp-' + k.replace('id','current-id'));
          if (fld) fld.value = v;
        });
        updateCost();
        submitBtn.textContent = 'Actualizar Desplazamiento';
        cancelBtn.style.display = 'inline-block';
      }
    });
  })();
  