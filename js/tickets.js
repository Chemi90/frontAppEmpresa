/* js/tickets.js */
import { api } from './api.js';

let
  $form, $id, $sub, $can,
  $pct, $bruto, $neto, $impIVA,
  $loc, $mot, $fecha, $file;

export function init() {
  /* nodos */
  $form  = document.getElementById('tickets-form');
  $id    = document.getElementById('ticket-current-id');
  $sub   = document.getElementById('ticket-submit-btn');
  $can   = document.getElementById('ticket-cancel-btn');

  $pct   = document.getElementById('ticket-iva-pct');
  $bruto = document.getElementById('ticket-bruto');
  $neto  = document.getElementById('ticket-neto');
  $impIVA= document.getElementById('ticket-iva-imp');

  $loc   = document.getElementById('ticket-localizacion');
  $mot   = document.getElementById('ticket-motivo');
  $fecha = document.getElementById('ticket-fecha');
  $file  = document.getElementById('ticket-foto');

  /* cálculo IVA */
  const calcIVA = () => {
    const pct = +$pct.value || 0, b = +$bruto.value || 0;
    const base = (b / (1 + pct/100)).toFixed(2);
    const imp  = (b - base).toFixed(2);
    $neto.value   = base;
    $impIVA.value = imp;
  };
  [$pct, $bruto].forEach(el => el.addEventListener('input', calcIVA));
  calcIVA();

  /* eventos generales */
  $form .addEventListener('submit', onSubmit);
  $can  .addEventListener('click', reset);

  document.getElementById('ticket-filter-btn')
          .addEventListener('click', onFilter);
  document.getElementById('ticket-export-btn')
          .addEventListener('click', exportExcel);
  document.getElementById('ticket-autofill-btn')
          .addEventListener('click', autofill);

  document.addEventListener('click', delegate);
}

/* -------- autofill IA (sin cambios de IVA) -------- */
async function autofill() {
  if (!$file.files.length) { alert('Selecciona una imagen PDF/JPG'); return; }
  const fd = new FormData();
  fd.append('foto', $file.files[0]);
  try {
    const res = await api('/tickets/autofill', { method:'POST', body: fd });
    if (res.localizacion) $loc.value = res.localizacion;
    if (res.motivo)       $mot.value = res.motivo;
    if (res.dinero)       $bruto.value = (+res.dinero).toFixed(2);
    if (res.fecha)        $fecha.value = res.fecha.split('/').reverse().join('-');
    calcIVA();
  } catch (err) { alert(err.message); }
}

/* -------- submit (alta / edición) -------- */
async function onSubmit(e) {
  e.preventDefault();

  /* validaciones mínimas */
  if (!$fecha.value || !$bruto.value) {
    alert('Fecha e importe son obligatorios'); return;
  }

  const fd = new FormData();
  if ($file.files.length) fd.append('foto', $file.files[0]);
  fd.append('localizacion', $loc.value);
  fd.append('motivo',       $mot.value);
  fd.append('fecha',        $fecha.value);
  fd.append('iva_porcentaje', $pct.value);
  fd.append('importe_bruto',  $bruto.value);

  try {
    if ($id.value) {                     // UPDATE (PUT JSON)
      const json = {
        localizacion  : $loc.value,
        motivo        : $mot.value,
        fecha         : $fecha.value,
        iva_porcentaje: $pct.value,
        importe_bruto : $bruto.value
      };
      await api(`/tickets/${$id.value}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(json)
      });
      alert('Ticket actualizado');
    } else {                            // CREATE (POST multipart)
      await api('/tickets', { method:'POST', body: fd });
      alert('Ticket agregado');
    }
    reset();
    onFilter();
  } catch (err) { alert(err.message); }
}

/* -------- reset formulario -------- */
function reset() {
  $form.reset();
  $id.value = '';
  $sub.textContent = 'Agregar Ticket';
  $can.style.display = 'none';
  $neto.value = $impIVA.value = '';
}

/* -------- filtro / render -------- */
async function onFilter() {
  const s = document.getElementById('ticket-filter-start').value,
        e = document.getElementById('ticket-filter-end').value;
  if (!s || !e) { alert('Seleccione ambas fechas'); return; }
  try {
    const rows = await api(`/tickets?start=${s}&end=${e}`);
    render(rows);
  } catch (err) { alert(err.message); }
}

function render(rows) {
  const $r = document.getElementById('ticket-results');
  if (!rows.length) {
    $r.innerHTML = '<p>No se encontraron tickets.</p>';
    document.getElementById('ticket-total').textContent = '0.00';
    return;
  }

  const head = [
    'ID','Fecha','Localización',
    'Base (€)','IVA (€)','% IVA',
    'Motivo','Foto','Acc.'
  ].map(h => `<th>${h}</th>`).join('');

  const body = rows.map(t => `
    <tr>
      <td>${t.id}</td>
      <td>${t.fecha}</td>
      <td>${t.localizacion}</td>
      <td>${t.dinero}</td>
      <td>${t.iva_importe}</td>
      <td>${t.iva_porcentaje}</td>
      <td>${t.motivo}</td>
      <td>${t.foto ? '📄' : ''}</td>
      <td>
        <button class="edit-ticket" data-row='${JSON.stringify(t)}'>✏️</button>
        <button class="delete-ticket" data-id='${t.id}'>🗑️</button>
      </td>
    </tr>
  `).join('');

  $r.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;

  const total = rows.reduce((s,r) => s + (+r.dinero || 0), 0).toFixed(2);
  document.getElementById('ticket-total').textContent = total;
}

/* -------- editar / borrar -------- */
function delegate(e) {
  /* borrar */
  if (e.target.matches('.delete-ticket')) {
    const id = e.target.dataset.id;
    if (!confirm('¿Eliminar ticket?')) return;
    api(`/tickets/${id}`, { method:'DELETE' })
      .then(() => e.target.closest('tr').remove())
      .catch(err => alert(err.message));
  }

  /* editar */
  if (e.target.matches('.edit-ticket')) {
    const t = JSON.parse(e.target.dataset.row);

    $id.value   = t.id;
    $loc.value  = t.localizacion;
    $mot.value  = t.motivo;
    $fecha.value= t.fecha.split(' ')[0];

    /* bruto = base + IVA */
    $bruto.value= (+t.dinero + +t.iva_importe).toFixed(2);
    $pct.value  = t.iva_porcentaje;

    calcIVA();
    $sub.textContent = 'Actualizar Ticket';
    $can.style.display = 'inline-block';
  }
}

/* -------- export -------- */
function exportExcel() {
  const s = document.getElementById('ticket-filter-start').value,
        e = document.getElementById('ticket-filter-end').value;
  const q = (s && e) ? `?start=${s}&end=${e}` : '';
  window.open(`/api/tickets/export${q}`, '_blank');
}
