const BASE_URL = 'https://gnanodaya-lms-backend-production.up.railway.app';

function authHeaders() {
  const token = localStorage.getItem('lms_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function request(method, endpoint, body = null) {
  const options = { method, headers: authHeaders() };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  if (res.status === 401) { localStorage.clear(); window.location.href = '/index.html'; return; }
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || `Error ${res.status}`); }
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  get:    (url)       => request('GET',    url),
  post:   (url, data) => request('POST',   url, data),
  put:    (url, data) => request('PUT',    url, data),
  patch:  (url, data) => request('PATCH',  url, data),
  delete: (url)       => request('DELETE', url)
};