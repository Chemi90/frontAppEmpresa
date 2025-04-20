// Módulo de Tickets de Comida
(async function initTickets() {
    const form       = document.getElementById('tickets-form');
    const idInput    = document.getElementById('ticket-current-id');
    const autoBtn    = document.getElementById('ticket-autofill-btn');
    const cancelBtn  = document.getElementById('ticket-cancel-btn');
    const filterBtn  = document.getElementById('ticket-filter-btn');
    const resultsDiv = document.getElementById('ticket-results');
    const totalSpan  = document.getElementById('ticket-total');
    const exportBtn  = document.getElementById('ticket-export-btn');
  
    autoBtn.addEventListener('click', async () => {
      const file = form['foto'].files[0];
      if (!file) { alert('Selecciona foto.'); return; }
      const fd = new FormData(); fd.append('foto', file);
      try {
        const res = await fetch('https://josemiguelruizguevara.com:5000/api/tickets/autofill',{ method:'POST', body:fd });
        const d   = await res.json();
        ['localizacion','dinero','motivo','fecha'].forEach(f => {
          if (d[f]) form[f].value = f==='dinero'? parseFloat(d[f]).toFixed(2) : d[f];
        });
      } catch (err) { alert('Error autofill: ' + err.message); }
    });
  
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const url = idInput.value
        ? `https://josemiguelruizguevara.com:5000/api/tickets/${idInput.value}`
        : 'https://josemiguelruizguevara.com:5000/api/tickets';
      const method = idInput.value ? 'PUT' : 'POST';
      try {
        const res = await fetch(url, { method, body:method==='PUT'? JSON.stringify({
            localizacion: form.localizacion.value,
            dinero:       form.dinero.value,
            motivo:       form.motivo.value,
            fecha:        form.fecha.value
          }) : fd,
          headers: method==='PUT'? {'Content-Type':'application/json'}: {}
        });
        const json = method==='POST'? await res.json() : null;
        alert(method==='POST'? `Ticket agregado. ID: ${json.id}` : 'Ticket actualizado.');
        form.reset(); idInput.value=''; cancelBtn.style.display='none';
        loadResults();
      } catch (err) { alert('Error: ' + err.message); }
    });
  
    cancelBtn.addEventListener('click', () => {
      form.reset(); idInput.value=''; cancelBtn.style.display='none';
    });
  
    filterBtn.addEventListener('click', loadResults);
    exportBtn.addEventListener('click', () => {
      let url = 'https://josemiguelruizguevara.com:5000/api/tickets/export';
      const s = document.getElementById('ticket-filter-start').value;
      const e_ = document.getElementById('ticket-filter-end').value;
      if (s && e_) url += `?start=${s}&end=${e_}`;
      window.open(url,'_blank');
    });
  
    async function loadResults() {
      const s = document.getElementById('ticket-filter-start').value;
      const e_ = document.getElementById('ticket-filter-end').value;
      if (!s||!e_) { alert('Selecciona fechas.'); return; }
      try {
        const res  = await fetch(`https://josemiguelruizguevara.com:5000/api/tickets?start=${s}&end=${e_}`);
        const data = await res.json();
        let total = 0;
        if (!data.length) {
          resultsDiv.innerHTML = '<p>No hay tickets.</p>';
          totalSpan.textContent = '0.00';
          return;
        }
        const tbl = ['ID','Foto','Localización','Dinero','Motivo','Fecha','Acciones']
          .reduce((h,t)=> h+`<th>${t}</th>`,'');
        let rows = data.map(item => {
          total += parseFloat(item.dinero)||0;
          return `<tr>
            <td>${item.id}</td>
            <td>${item.foto}</td>
            <td>${item.localizacion}</td>
            <td>${item.dinero}</td>
            <td>${item.motivo}</td>
            <td>${item.fecha}</td>
            <td>
              <button class="edit" data-json='${JSON.stringify(item)}'>✏️</button>
              <button class="delete" data-id="${item.id}">🗑️</button>
            </td>
          </tr>`;
        }).join('');
        resultsDiv.innerHTML = `<table border="1" style="width:100%"><thead><tr>${tbl}</tr></thead><tbody>${rows}</tbody></table>`;
        totalSpan.textContent = total.toFixed(2);
      } catch (err) { alert('Error: '+err.message); }
    }
  
    resultsDiv.addEventListener('click', async e => {
      if (e.target.classList.contains('delete')) {
        if (!confirm('¿Eliminar?')) return;
        try {
          await fetch(`https://josemiguelruizguevara.com:5000/api/tickets/${e.target.dataset.id}`,{method:'DELETE'});
          loadResults();
        } catch (err){alert('Error: '+err.message);}
      }
      if (e.target.classList.contains('edit')) {
        const item = JSON.parse(e.target.dataset.json);
        form.localizacion.value = item.localizacion;
        form.dinero.value       = item.dinero;
        form.motivo.value       = item.motivo;
        form.fecha.value        = item.fecha;
        idInput.value           = item.id;
        cancelBtn.style.display = 'inline-block';
      }
    });
  })();
  