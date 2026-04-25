const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'fisherman-diary-backup.json';

function loadGIS() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function requestToken(clientId) {
  await loadGIS();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) =>
        resp.error ? reject(new Error(resp.error)) : resolve(resp.access_token),
    });
    client.requestAccessToken();
  });
}

async function driveGet(token, path) {
  const r = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Drive API ${r.status}`);
  return r.json();
}

export async function findBackupFile(token) {
  const { files } = await driveGet(
    token,
    `/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,modifiedTime)`,
  );
  return files[0] ?? null;
}

export async function saveBackupFile(token, data, fileId = null) {
  const form = new FormData();
  form.append('metadata', new Blob(
    [JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' })],
    { type: 'application/json' },
  ));
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const r = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Drive upload ${r.status}`);
  return r.json();
}

export async function loadBackupFile(token, fileId) {
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!r.ok) throw new Error(`Drive download ${r.status}`);
  return r.json();
}
