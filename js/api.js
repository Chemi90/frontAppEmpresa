import { apiCore } from './api_core.js';

export function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  const uid = localStorage.getItem('user_id');
  if (uid) opts.headers['X-USER-ID'] = uid;
  return apiCore(path, opts);
}
