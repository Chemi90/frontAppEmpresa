// En caso de que ya uses un wrapper genérico, renómbralo api_core.js.
// (No cambies nada aquí.)
export function apiCore(path, opts = {}) {
    const BASE = 'https://josemiguelruizguevara.com:5000/api';
    return fetch(BASE + path, opts).then(r =>
      r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.error || r.statusText)))
    );
  }
  