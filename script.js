document.addEventListener('DOMContentLoaded', function() {
  // ----------------- Login -----------------
  const loginScreen = document.getElementById('login-screen');
  const mainContent = document.getElementById('main-content');
  const loginButton = document.getElementById('login-button');
  const loginPasswordInput = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');

  // Permitir enviar la clave al presionar Enter
  loginPasswordInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      loginButton.click();
    }
  });

  loginButton.addEventListener('click', function() {
    const password = loginPasswordInput.value;
    fetch('https://josemiguelruizguevara.com:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    })
    .then(response => {
      if (!response.ok) throw new Error('Clave incorrecta');
      return response.json();
    })
    .then(data => {
      loginScreen.style.display = 'none';
      mainContent.style.display = 'block';
    })
    .catch(error => {
      loginError.textContent = "Clave incorrecta. Inténtalo de nuevo.";
    });
  });

  // ----------------- Navegación por pestañas -----------------
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const target = button.getAttribute('data-target');
      tabContents.forEach(content => {
        content.style.display = (content.id === target) ? 'block' : 'none';
      });
    });
  });

  // ----------------- Desplazamientos -----------------
  const despKmInput = document.getElementById('desp-km');
  const despDeduccionInput = document.getElementById('desp-deduccion');
  const despGastoInput = document.getElementById('desp-gasto');
  const despCurrentId = document.getElementById('desp-current-id');
  const despSubmitBtn = document.getElementById('desp-submit-btn');
  const despCancelBtn = document.getElementById('desp-cancel-btn');

  function updateTotalCost() {
    const km = parseFloat(despKmInput.value) || 0;
    const costPerKm = parseFloat(despDeduccionInput.value) || 0;
    despGastoInput.value = (km * costPerKm).toFixed(2);
  }
  despKmInput.addEventListener('input', updateTotalCost);
  despDeduccionInput.addEventListener('input', updateTotalCost);

  const despForm = document.getElementById('desplazamientos-form');
  despForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = {
      fecha: document.getElementById('desp-fecha').value,
      destino: document.getElementById('desp-destino').value,
      distancia: document.getElementById('desp-km').value,
      descripcion: document.getElementById('desp-descripcion').value,
      dia: document.getElementById('desp-dia').value,
      cliente: document.getElementById('desp-cliente').value,
      deduccion: document.getElementById('desp-deduccion').value,
      gasto: document.getElementById('desp-gasto').value
    };

    if (despCurrentId.value) {
      fetch(`https://josemiguelruizguevara.com:5000/api/desplazamientos/${despCurrentId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (!response.ok) throw new Error('Error al actualizar desplazamiento');
        return response.json();
      })
      .then(data => {
        alert("Desplazamiento actualizado exitosamente.");
        despForm.reset();
        despCurrentId.value = "";
        despSubmitBtn.textContent = "Agregar Desplazamiento";
        despCancelBtn.style.display = "none";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    } else {
      fetch('https://josemiguelruizguevara.com:5000/api/desplazamientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(err.error || 'Error al agregar desplazamiento'); 
          });
        }
        return response.json();
      })
      .then(data => {
        alert("Desplazamiento agregado exitosamente. ID: " + data.id);
        despForm.reset();
        despGastoInput.value = "";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    }
  });

  despCancelBtn.addEventListener('click', function() {
    despForm.reset();
    despCurrentId.value = "";
    despSubmitBtn.textContent = "Agregar Desplazamiento";
    despCancelBtn.style.display = "none";
  });

  // ----------------- Tickets de Comida -----------------
  const ticketsForm = document.getElementById('tickets-form');
  const ticketAutofillBtn = document.getElementById('ticket-autofill-btn');
  const ticketCancelBtn = document.getElementById('ticket-cancel-btn');
  
  if(ticketAutofillBtn) {
    ticketAutofillBtn.addEventListener('click', function() {
      const formData = new FormData();
      const fotoInput = document.getElementById('ticket-foto');
      if (fotoInput.files.length > 0) {
        formData.append('foto', fotoInput.files[0]);
      } else {
        alert("Por favor, selecciona un archivo para autorrellenar.");
        return;
      }
      fetch('https://josemiguelruizguevara.com:5000/api/tickets/autofill', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if(data.localizacion)
          document.getElementById('ticket-localizacion').value = data.localizacion;
        if(data.dinero)
          document.getElementById('ticket-dinero').value = parseFloat(data.dinero).toFixed(2);
        if(data.motivo)
          document.getElementById('ticket-motivo').value = data.motivo;
        if(data.fecha) {
          const parts = data.fecha.split('/');
          if (parts.length === 3) {
            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            document.getElementById('ticket-fecha').value = isoDate;
          } else {
            document.getElementById('ticket-fecha').value = data.fecha;
          }
        }
      })
      .catch(error => {
        alert("Error en autofill del ticket: " + error.message);
      });
    });
  }

  ticketsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const ticketCurrentId = document.getElementById('ticket-current-id').value;
    if (ticketCurrentId) {
      const data = {
        localizacion: document.getElementById('ticket-localizacion').value,
        dinero: document.getElementById('ticket-dinero').value,
        motivo: document.getElementById('ticket-motivo').value,
        fecha: document.getElementById('ticket-fecha').value
      };
      fetch(`https://josemiguelruizguevara.com:5000/api/tickets/${ticketCurrentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) throw new Error('Error al actualizar ticket');
        return response.json();
      })
      .then(data => {
        alert("Ticket actualizado exitosamente.");
        ticketsForm.reset();
        document.getElementById('ticket-submit-btn').textContent = "Agregar Ticket";
        document.getElementById('ticket-current-id').value = "";
        ticketCancelBtn.style.display = "none";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    } else {
      const formData = new FormData(ticketsForm);
      fetch('https://josemiguelruizguevara.com:5000/api/tickets', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(err.error || "Error al agregar ticket"); 
          });
        }
        return response.json();
      })
      .then(data => {
        alert("Ticket agregado exitosamente. ID: " + data.id);
        ticketsForm.reset();
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    }
  });

  ticketCancelBtn.addEventListener('click', function() {
    ticketsForm.reset();
    document.getElementById('ticket-current-id').value = "";
    document.getElementById('ticket-submit-btn').textContent = "Agregar Ticket";
    ticketCancelBtn.style.display = "none";
  });

  // ----------------- Facturas -----------------
  const facturasForm = document.getElementById('facturas-form');
  const facturaAutofillBtn = document.getElementById('factura-autofill-btn');
  const facturaCancelBtn = document.getElementById('factura-cancel-btn');
  
  if(facturaAutofillBtn) {
    facturaAutofillBtn.addEventListener('click', function() {
      const formData = new FormData();
      const archivoInput = document.getElementById('factura-archivo');
      if (archivoInput.files.length > 0) {
        formData.append('archivo', archivoInput.files[0]);
      } else {
        alert("Por favor, selecciona un archivo para autorrellenar.");
        return;
      }
      fetch('https://josemiguelruizguevara.com:5000/api/facturas/autofill', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if(data.fecha) {
          const parts = data.fecha.split('/');
          if (parts.length === 3) {
            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            document.getElementById('factura-fecha').value = isoDate;
          } else {
            document.getElementById('factura-fecha').value = data.fecha;
          }
        }
        if(data.cantidad_bruta) 
          document.getElementById('factura-bruta').value = parseFloat(data.cantidad_bruta).toFixed(2);
        if(data.cantidad_neta) 
          document.getElementById('factura-neta').value = parseFloat(data.cantidad_neta).toFixed(2);
        if(data.retencion) {
          document.getElementById('factura-retencion').value = parseFloat(data.retencion).toFixed(2);
        }
        if(data.nombre_empresa)
          document.getElementById('factura-empresa').value = data.nombre_empresa;
      })
      .catch(error => {
        alert("Error en autofill de factura: " + error.message);
      });
    });
  }

  facturasForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const facturaCurrentId = document.getElementById('factura-current-id').value;
    if (facturaCurrentId) {
      const data = {
        fecha: document.getElementById('factura-fecha').value,
        bruta: document.getElementById('factura-bruta').value,
        neta: document.getElementById('factura-neta').value,
        retencion: document.getElementById('factura-retencion').value,
        empresa: document.getElementById('factura-empresa').value
      };
      fetch(`https://josemiguelruizguevara.com:5000/api/facturas/${facturaCurrentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) throw new Error('Error al actualizar factura');
        return response.json();
      })
      .then(data => {
        alert("Factura actualizada exitosamente.");
        facturasForm.reset();
        document.getElementById('factura-submit-btn').textContent = "Agregar Factura";
        document.getElementById('factura-current-id').value = "";
        facturaCancelBtn.style.display = "none";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    } else {
      const formData = new FormData();
      formData.append('fecha', document.getElementById('factura-fecha').value);
      formData.append('bruta', document.getElementById('factura-bruta').value);
      formData.append('neta', document.getElementById('factura-neta').value);
      formData.append('retencion', document.getElementById('factura-retencion').value);
      formData.append('empresa', document.getElementById('factura-empresa').value);
      const archivoInput = document.getElementById('factura-archivo');
      if (archivoInput.files.length > 0) {
        formData.append('archivo', archivoInput.files[0]);
      }
      fetch('https://josemiguelruizguevara.com:5000/api/facturas', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error || "Error al agregar factura");
          });
        }
        return response.json();
      })
      .then(data => {
        alert("Factura agregada exitosamente. ID: " + data.id);
        facturasForm.reset();
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    }
  });

  facturaCancelBtn.addEventListener('click', function() {
    facturasForm.reset();
    document.getElementById('factura-current-id').value = "";
    document.getElementById('factura-submit-btn').textContent = "Agregar Factura";
    facturaCancelBtn.style.display = "none";
  });

  // ----------------- Gastos Varios -----------------
  const gastosForm = document.getElementById('gastos-form');
  // Elementos de Gastos:
  const gastoTipoSelect = document.getElementById('gasto-tipo');
  const gastoTotalInput = document.getElementById('gasto-total');
  const gastoCheckbox = document.getElementById('gasto-compartido');
  const gastoPorcentajeInput = document.getElementById('gasto-porcentaje');
  const gastoDeducibleInput = document.getElementById('gasto-deducible');
  const gastoCurrentId = document.getElementById('gasto-current-id');
  const gastoSubmitBtn = document.getElementById('gasto-submit-btn');
  const gastoCancelBtn = document.getElementById('gasto-cancel-btn');
  const dividirDeduccionCheckbox = document.getElementById('dividir-deduccion');

  function setDefaultPercentageGastos() {
    const tipo = gastoTipoSelect.value;
    let defaultPercentage = 100;
    if (tipo === "Terminal móvil") {
      defaultPercentage = 50;
    } else if (tipo === "ChatGPT Plus") {
      defaultPercentage = 100;
    } else if (tipo === "Electricidad") {
      defaultPercentage = 33;
    } else if (tipo === "Internet") {
      defaultPercentage = 26.16;
    } else if (tipo === "Seguro coche") {
      defaultPercentage = 40;
    } else if (tipo === "Gasolina") {
      defaultPercentage = 40;
    } else if (tipo === "IBI vivienda") {
      defaultPercentage = 33;
    } else if (tipo === "Comunidad de vecinos") {
      defaultPercentage = 33;
    }
    gastoPorcentajeInput.value = defaultPercentage;
  }

  gastoTipoSelect.addEventListener('change', function() {
    setDefaultPercentageGastos();
    updateGastoDeducible();
  });

  gastoCheckbox.addEventListener('change', function() {
    if (gastoCheckbox.checked) {
      gastoPorcentajeInput.disabled = false;
    } else {
      gastoPorcentajeInput.disabled = true;
      setDefaultPercentageGastos();
    }
    updateGastoDeducible();
  });

  function updateGastoDeducible() {
    const total = parseFloat(gastoTotalInput.value) || 0;
    const porcentaje = parseFloat(gastoPorcentajeInput.value) || 0;
    const overallDeduction = total * (porcentaje / 100);
  
    if (total > 300 && dividirDeduccionCheckbox.checked) {
      gastoDeducibleInput.value = (overallDeduction / 4).toFixed(2);
    } else {
      gastoDeducibleInput.value = overallDeduction.toFixed(2);
    }
  }
  
  gastoTotalInput.addEventListener('input', updateGastoDeducible);
  gastoPorcentajeInput.addEventListener('input', updateGastoDeducible);
  dividirDeduccionCheckbox.addEventListener('change', updateGastoDeducible);

  gastosForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(gastosForm);
    formData.set('gasto_compartido', gastoCheckbox.checked ? '1' : '0');
    formData.set('dividir_deduccion', dividirDeduccionCheckbox.checked ? '1' : '0');

    if (dividirDeduccionCheckbox.checked) {
      let originalDateStr = document.getElementById('gasto-fecha').value;
      let originalDate = new Date(originalDateStr);
      let responses = [];
      // Realiza 4 llamadas consecutivas con fechas ajustadas.
      for (let i = 0; i < 4; i++) {
        let newDate = new Date(originalDate);
        newDate.setFullYear(newDate.getFullYear() + i);
        let newDateStr = newDate.toISOString().substring(0, 10);
        let formDataClone = new FormData(gastosForm);
        formDataClone.set('fecha', newDateStr);
        const response = await fetch('https://josemiguelruizguevara.com:5000/api/gastos', {
          method: 'POST',
          body: formDataClone
        });
        if (!response.ok) {
          const errorData = await response.json();
          alert("Error al agregar gasto: " + (errorData.error || ''));
          return;
        }
        const data = await response.json();
        responses.push(data);
      }
      alert("Gastos agregados exitosamente. IDs: " + responses.map(r => r.id).join(', '));
      gastosForm.reset();
      setDefaultPercentageGastos();
      gastoDeducibleInput.value = "";
    } else {
      fetch('https://josemiguelruizguevara.com:5000/api/gastos', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(err.error || 'Error al agregar gasto'); 
          });
        }
        return response.json();
      })
      .then(data => {
        alert("Gasto agregado exitosamente. ID: " + data.id);
        gastosForm.reset();
        setDefaultPercentageGastos();
        gastoDeducibleInput.value = "";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    }
  });

  gastoCancelBtn.addEventListener('click', function() {
    gastosForm.reset();
    gastoCurrentId.value = "";
    gastoSubmitBtn.textContent = "Agregar Gasto";
    gastoCancelBtn.style.display = "none";
  });

  const gastosFilterBtn = document.getElementById('gastos-filter-btn');
  gastosFilterBtn.addEventListener('click', function() {
    const startDate = document.getElementById('gastos-filter-start').value;
    const endDate = document.getElementById('gastos-filter-end').value;
    if (!startDate || !endDate) {
      alert("Por favor, seleccione ambas fechas de filtro.");
      return;
    }
    fetch(`https://josemiguelruizguevara.com:5000/api/gastos?start=${startDate}&end=${endDate}`)
      .then(response => response.json())
      .then(data => {
        let totalGastos = 0;
        let html = "";
        if (data.length === 0) {
          html = "<p>No se encontraron gastos en esas fechas.</p>";
          document.getElementById('gastos-total').textContent = "0.00";
        } else {
          html += "<table border='1' style='width:100%;'><thead><tr>";
          const cols = ["ID", "Fecha", "Tipo", "Importe Total (€)", "% Deducible", "Importe Deducible (€)", "Nota", "Gasto Compartido", "Acciones"];
          cols.forEach(col => {
            html += `<th>${col}</th>`;
          });
          html += "</tr></thead><tbody>";
          data.forEach(item => {
            html += "<tr>";
            html += `<td>${item.id}</td>`;
            html += `<td>${item.fecha}</td>`;
            html += `<td>${item.tipo}</td>`;
            html += `<td>${item.importe_total}</td>`;
            html += `<td>${item.porcentaje_deducible}</td>`;
            html += `<td>${item.importe_deducible}</td>`;
            html += `<td>${item.nota || ''}</td>`;
            html += `<td>${item.gasto_compartido == 1 ? 'Sí' : 'No'}</td>`;
            html += `<td>
              <button class="edit-gasto" 
                data-id="${item.id}"
                data-fecha="${item.fecha}"
                data-tipo="${item.tipo}"
                data-importe_total="${item.importe_total}"
                data-porcentaje_deducible="${item.porcentaje_deducible}"
                data-importe_deducible="${item.importe_deducible}"
                data-nota="${item.nota}"
                data-gasto_compartido="${item.gasto_compartido}"
              >✏️</button>
              <button class="delete-gasto" data-id="${item.id}">🗑️</button>
              </td>`;
            html += "</tr>";
            totalGastos += parseFloat(item.importe_total) || 0;
          });
          html += "</tbody></table>";
          document.getElementById('gastos-total').textContent = totalGastos.toFixed(2);
        }
        document.getElementById('gastos-results').innerHTML = html;
      })
      .catch(error => {
        alert("Error al filtrar gastos: " + error.message);
      });
  });

  document.getElementById('gastos-export-btn').addEventListener('click', function() {
    const startDate = document.getElementById('gastos-filter-start').value;
    const endDate = document.getElementById('gastos-filter-end').value;
    let url = 'https://josemiguelruizguevara.com:5000/api/gastos/export';
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    window.open(url, '_blank');
  });

  // ----------------- Service Worker -----------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registrado con éxito:', registration.scope);
        })
        .catch(err => {
          console.log('Error al registrar el ServiceWorker:', err);
        });
    });
  }
});
