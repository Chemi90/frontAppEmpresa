/* js/gastos.js
 * Gestión integral del módulo “Gastos” con:
 *   – Cálculo de IVA + deducible
 *   – División opcional en 4 años
 *   – CRUD, filtro y EXPORT‑PDF
 */

import { api } from './api.js';

let
  $form, $id, $submit, $cancel,
  $pctIVA, $bruto, $neto, $impIVA,
  $pctDed, $impDed,
  $chkDiv, $boxDivInfo, $impCuota;

/* ---------- inicializar ---------- */
export function init() {
  /* refs */
  $form    = document.getElementById('gastos-form');
  $id      = document.getElementById('gasto-current-id');
  $submit  = document.getElementById('gasto-submit-btn');
  $cancel  = document.getElementById('gasto-cancel-btn');

  $pctIVA  = document.getElementById('gasto-iva-pct');
  $bruto   = document.getElementById('gasto-bruto');
  $neto    = document.getElementById('gasto-neto');
  $impIVA  = document.getElementById('gasto-iva-imp');

  $pctDed  = document.getElementById('gasto-porcentaje');
  $impDed  = document.getElementById('gasto-deducible');

  $chkDiv     = document.getElementById('gasto-dividir');
  $boxDivInfo = document.getElementById('dividir-info');
  $impCuota   = document.getElementById('gasto-dividir-imp');

  /* eventos */
  [$pctIVA, $bruto].forEach(el => el.addEventListener('input', calcIVA));
  $pctDed.addEventListener('input', calcDeductible);
  $chkDiv.addEventListener('change', () => {
    $boxDivInfo.style.display = $chkDiv.checked ? 'block' : 'none';
    calcDeductible();
  });

  $form .addEventListener('submit', onSubmit);
  $cancel.addEventListener('click', reset);

  document.getElementById('gastos-filter-btn').addEventListener('click', onFilter);
  document.getElementById('gastos-export-btn').addEventListener('click', exportPDF);

  document.addEventListener('click', delegate);

  calcIVA();          // precálculo inicial
}

/* ---------- cálculos ---------- */
function calcIVA() {
  const pct = +$pctIVA.value || 0,
        b   = +$bruto.value  || 0;

  const base = (b / (1 + pct / 100)).toFixed(2);
  const iva  = (b - base).toFixed(2);

  $neto.value   = base;
  $impIVA.value = iva;

  calcDeductible();
}

function calcDeductible() {
  const base = +$neto.value || 0;
  const pct  = +$pctDed.value || 0;
  const ded  = (base * pct / 100).toFixed(2);

  $impDed.value = ded;

  if ($chkDiv.checked) {
    $impCuota.value = (ded / 4).toFixed(2);
  }
}

/* ---------- helpers ---------- */
function buildPayload() {
  return {
    fecha               : document.getElementById('gasto-fecha').value,
    tipo                : document.getElementById('gasto-tipo').value,
    iva_porcentaje      : $pctIVA.value,
    importe_bruto       : $bruto.value,
    porcentaje_deducible: $pctDed.value,
    importe_deducible   : $impDed.value,
    nota                : document.getElementById('gasto-nota').value,
    gasto_compartido    : document.getElementById('gasto-compartido')?.checked ? 1 : 0,
    dividir_deduccion   : $chkDiv.checked ? 1 : 0
  };
}

/* ---------- submit ---------- */
async function onSubmit(e) {
  e.preventDefault();
  const data = buildPayload();

  if (!data.fecha || !data.tipo || !data.importe_bruto) {
    alert('Fecha, tipo e importe bruto son obligatorios');
    return;
  }

  try {
    if ($id.value) {                         // UPDATE
      await api(`/gastos/${$id.value}`, {
        method : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(data)
      });
      alert('Gasto actualizado');
    } else {                                 // INSERT
      await api('/gastos', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(data)
      });
      alert('Gasto agregado');
    }
    reset();
    onFilter();
  } catch (err) { alert(err.message); }
}

/* ---------- reset ---------- */
function reset() {
  $form.reset();
  $id.value = '';
  $submit.textContent = 'Agregar Gasto';
  $cancel.style.display = 'none';
  $boxDivInfo.style.display = 'none';
  $neto.value = $impIVA.value = $impDed.value = $impCuota.value = '';
}

/* ---------- filtro ---------- */
async function onFilter() {
  const s = document.getElementById('gastos-filter-start').value,
        e = document.getElementById('gastos-filter-end').value;
  if (!s || !e) { alert('Seleccione ambas fechas'); return; }

  try { render(await api(`/gastos?start=${s}&end=${e}`)); }
  catch (err) { alert(err.message); }
}

/* ---------- render ---------- */
function render(rows) {
  const $res = document.getElementById('gastos-results');
  if (!rows.length) {
    $res.innerHTML = '<p>No se encontraron gastos.</p>';
    document.getElementById('gastos-total').textContent = '0.00';
    return;
  }

  const th = h => `<th>${h}</th>`;
  const head = ['ID','Fecha','Tipo','Base (€)','IVA (€)','% IVA',
                '% Ded','Ded (€)','Dividido','Nota','Acc.'].map(th).join('');

  const body = rows.map(g => `
    <tr>
      <td>${g.id}</td>
      <td>${g.fecha.split(' ')[0]}</td>
      <td>${g.tipo}</td>
      <td>${g.importe_total}</td>
      <td>${g.iva_importe}</td>
      <td>${g.iva_porcentaje}</td>
      <td>${g.porcentaje_deducible}</td>
      <td>${g.importe_deducible}</td>
      <td>${g.dividir_deduccion ? 'Sí' : 'No'}</td>
      <td>${g.nota || ''}</td>
      <td>
        <button class="edit-gasto" data-row='${JSON.stringify(g)}'>✏️</button>
        <button class="delete-gasto" data-id='${g.id}'>🗑️</button>
      </td>
    </tr>`).join('');

  $res.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;

  const total = rows.reduce((s,r) => s + (+r.importe_total || 0), 0).toFixed(2);
  document.getElementById('gastos-total').textContent = total;
}

/* ---------- delegación editar / borrar ---------- */
function delegate(e) {
  /* borrar */
  if (e.target.matches('.delete-gasto')) {
    const id = e.target.dataset.id;
    if (!confirm('¿Eliminar gasto?')) return;
    api(`/gastos/${id}`, { method: 'DELETE' })
      .then(() => e.target.closest('tr').remove())
      .catch(err => alert(err.message));
  }

  /* editar */
  if (e.target.matches('.edit-gasto')) {
    const g = JSON.parse(e.target.dataset.row);

    $id.value                               = g.id;
    document.getElementById('gasto-fecha').value = g.fecha.split(' ')[0];
    document.getElementById('gasto-tipo').value  = g.tipo;

    $bruto.value  = (+g.importe_total + +g.iva_importe).toFixed(2);
    $pctIVA.value = g.iva_porcentaje;
    $pctDed.value = g.porcentaje_deducible;
    document.getElementById('gasto-nota').value = g.nota || '';
    document.getElementById('gasto-compartido').checked = !!g.gasto_compartido;

    $chkDiv.checked = !!g.dividir_deduccion;
    $boxDivInfo.style.display = $chkDiv.checked ? 'block' : 'none';

    calcIVA();
    $submit.textContent = 'Actualizar Gasto';
    $cancel.style.display = 'inline-block';
  }
}

/* ---------- exportar PDF ---------- */
function exportPDF() {
    const s = document.getElementById('gastos-filter-start').value,
          e = document.getElementById('gastos-filter-end').value;
    const q = (s && e) ? `?start=${s}&end=${e}&format=pdf` : '?format=pdf';
    window.open(`${API_BASE}/gastos/export${q}`, '_blank');
  }
  