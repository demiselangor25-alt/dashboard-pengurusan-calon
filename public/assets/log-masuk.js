import { api } from './umum.js';

function tujuan() {
  const ke = new URLSearchParams(location.search).get('ke') || '/';
  return ke.startsWith('/') && !ke.startsWith('//') && !ke.startsWith('/log-masuk') ? ke : '/';
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const s = await fetch('/api/sesi', { credentials: 'same-origin' }).then((r) => r.json());
    if (s.ok) { location.replace(tujuan()); return; }
  } catch { /* teruskan */ }

  const borang = document.getElementById('borang');
  const ralat = document.getElementById('ralat');
  borang.addEventListener('submit', async (e) => {
    e.preventDefault();
    const butang = borang.querySelector('button');
    ralat.textContent = '';
    butang.disabled = true;
    try {
      await api('/api/log-masuk', { method: 'POST', body: JSON.stringify({ kataLaluan: document.getElementById('kata-laluan').value }) });
      location.replace(tujuan());
    } catch (err) {
      ralat.textContent = err.message;
      butang.disabled = false;
    }
  });
});
