// Empty string = same origin. Right default for the single-container deploy,
// where the backend serves this build as static files. Dev mode overrides via
// frontend/.env (VITE_API_URL=http://localhost:3000) since Vite runs on its own port.
const API_URL = import.meta.env.VITE_API_URL || '';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res;
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Invalid credentials');
  }
  const { token } = await res.json();
  localStorage.setItem('token', token);
  return token;
}

export async function listFiles(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await request(`/files?${qs}`);
  return res.json();
}

export async function getFolders() {
  const res = await request('/folders');
  return res.json();
}

export async function createFolder(name) {
  const res = await request('/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function getTags() {
  const res = await request('/tags');
  return res.json();
}

export async function batchDelete(ids) {
  const res = await request('/files/batch-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  return res.json();
}

export async function batchMove(ids, folder) {
  const res = await request('/files/batch-move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, folder }),
  });
  return res.json();
}

export async function deleteFile(id) {
  await request(`/files/${id}`, { method: 'DELETE' });
}

export async function renameFile(id, updates) {
  const res = await request(`/files/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

// Upload has two phases: the multipart leg (browser -> us, usually fast)
// tracked via XHR progress, then us -> Telegram (the real bottleneck for
// large files) tracked via a Server-Sent Events stream the backend drives
// from GramJS's own progressCallback. onProgress(percent, phase) fires for
// both, phase being 'uploading' or 'sending'.
export function uploadFile(file, folder, tags, onProgress) {
  const form = new FormData();
  form.append('file', file);
  if (folder) form.append('folder', folder);
  if (tags) form.append('tags', tags);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/upload`);
    const token = localStorage.getItem('token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100), 'uploading');
    };

    xhr.onload = () => {
      if (xhr.status !== 202) return reject(new Error(xhr.responseText || 'Upload failed'));

      const { uploadId } = JSON.parse(xhr.responseText);
      onProgress?.(0, 'sending');

      const es = new EventSource(`${API_URL}/upload/${uploadId}/progress?token=${encodeURIComponent(token || '')}`);
      es.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.phase === 'uploading') {
          onProgress?.(Math.round((data.progress ?? 0) * 100), 'sending');
        } else if (data.phase === 'done') {
          onProgress?.(100, 'sending');
          es.close();
          resolve(data.file);
        } else if (data.phase === 'error') {
          es.close();
          reject(new Error(data.error || 'Upload failed'));
        }
      };
      es.onerror = () => {
        es.close();
        reject(new Error('Lost connection while sending to Telegram'));
      };
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(form);
  });
}

// ponytail: <img>/<a>/<video>/<iframe> can't set an Authorization header, so
// the backend also accepts ?token= for these GET routes. Fine for a personal
// single-user app; revisit (signed short-lived links) if this ever gets
// shared URLs.
function withToken(url, extra = {}) {
  const token = localStorage.getItem('token') || '';
  const qs = new URLSearchParams({ token, ...extra }).toString();
  return `${url}?${qs}`;
}

export function downloadUrl(id) {
  return withToken(`${API_URL}/files/${id}/download`);
}

// ponytail: no Range/206 support on the backend, so video/audio play
// sequentially from the start - seeking ahead re-buffers instead of jumping.
// Fine for short clips; add Range handling in downloadFile if scrubbing
// large video becomes a real need.
export function previewUrl(id) {
  return withToken(`${API_URL}/files/${id}/download`, { inline: 1 });
}

export function thumbnailUrl(id) {
  return withToken(`${API_URL}/files/${id}/thumbnail`);
}

export function logout() {
  localStorage.removeItem('token');
}
