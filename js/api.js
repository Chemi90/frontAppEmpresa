/* js/api.js
 * Helper de peticiones con cabecera X‑USER-ID incluida.
 */

export const API_BASE = 'https://josemiguelruizguevara.com:5000/api';

export async function api(path, opts = {}) {
  const token = localStorage.getItem('user_id');   // ← ya lo guardas al hacer login
  opts.headers = Object.assign(
    { 'X-USER-ID': token || '' },
    opts.headers || {}
  );

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const txt = await res.text().catch(()=>'');
    throw new Error(txt || res.statusText);
  }
  // Si la respuesta es 204 no content
  if (res.status === 204) return {};
  return res.headers.get('content-type')?.includes('application/json')
        ? res.json()
        : res.text();
}
