// Fungsi kongsi untuk semua halaman.

export const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const BULAN_KENAL = [['jan', 0], ['feb', 1], ['mac', 2], ['mar', 2], ['apr', 3], ['mei', 4], ['may', 4], ['jun', 5], ['jul', 6], ['ogo', 7], ['aug', 7], ['sep', 8], ['okt', 9], ['oct', 9], ['nov', 10], ['dis', 11], ['dec', 11]];
export const KATEGORI = [
  { id: 'Ziarah', kelas: 'ziarah', label: 'Ziarah' },
  { id: 'Al Malak', kelas: 'malak', label: 'Al Malak' },
  { id: 'Komuniti', kelas: 'komuniti', label: 'Komuniti' },
];

/** Warna petak bilangan: 0–5 merah, 6–9 biru, 10 ke atas hijau. */
export function tahap(n) {
  const x = Number(n) || 0;
  if (x >= 10) return 'tahap-hijau';
  if (x >= 6) return 'tahap-biru';
  return 'tahap-merah';
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const KEKAL_BESAR = new Set(['BBS', 'APT', 'KRTS', 'JKR', 'SPR', 'NGO', 'MCM', 'PASTI', 'SRITI', 'DUN', 'UDM', 'IPPD', 'PIC', 'II', 'III']);
export function tajukKes(s) {
  return String(s ?? '').toLowerCase().replace(/(^|[\s(/&-])([a-z])/g, (m, a, b) => a + b.toUpperCase())
    .split(' ').map((w) => (KEKAL_BESAR.has(w.toUpperCase()) ? w.toUpperCase() : w)).join(' ');
}

export function huraiTarikh(s) {
  const t = String(s ?? '').toLowerCase().trim();
  if (!t) return null;
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = t.match(/(\d{1,2})[\s\-/.]+([a-z]+)[\s\-/.,]+(\d{2,4})/);
  if (!m) return null;
  const b = BULAN_KENAL.find(([p]) => m[2].startsWith(p));
  if (!b) return null;
  let y = +m[3];
  if (y < 100) y += 2000;
  return new Date(y, b[1], +m[1]);
}

export function nilaiTarikh(s) {
  const d = huraiTarikh(s);
  return d ? d.getTime() : 0;
}

export function tarikhPendek(s) {
  const d = huraiTarikh(s);
  return d ? { hari: String(d.getDate()), bulan: BULAN[d.getMonth()].slice(0, 3).toUpperCase() } : { hari: '–', bulan: '' };
}

export function hariIniIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function api(laluan, pilihan = {}) {
  const res = await fetch(laluan, {
    credentials: 'same-origin',
    ...pilihan,
    headers: { 'content-type': 'application/json', 'x-dashboard': '1', ...(pilihan.headers || {}) },
  });
  if (res.status === 401 && !laluan.startsWith('/api/log-masuk')) {
    location.href = '/log-masuk?ke=' + encodeURIComponent(location.pathname + location.search);
    throw new Error('Sila log masuk.');
  }
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('Pelayan tidak memberi respons yang sah.');
  }
  if (!json.ok) throw new Error(json.error || 'Ralat tidak diketahui.');
  return json;
}

export async function ambilData(dun, segar = false) {
  const r = await api(`/api/data?dun=${dun}${segar ? '&segar=1' : ''}`);
  return r.data;
}

export async function logKeluar() {
  try { await api('/api/log-keluar', { method: 'POST', body: '{}' }); } catch { /* abaikan */ }
  location.href = '/log-masuk';
}

/** Kira bilangan rekod mengikut kategori bagi setiap UDM. */
export function kiraIkutUdm(udmList, rekod) {
  const peta = new Map(udmList.map((u) => [u.udm, { Ziarah: 0, 'Al Malak': 0, Komuniti: 0 }]));
  const takPadan = [];
  rekod.forEach((r) => {
    const k = peta.get(r.udm);
    if (k && r.kategori in k) k[r.kategori] += 1;
    else takPadan.push(r);
  });
  return { peta, takPadan };
}

export function terapTetapan(t) {
  if (!t) return;
  if (/^#[0-9a-f]{6}$/i.test(t.warna || '')) {
    const root = document.documentElement.style;
    root.setProperty('--utama', t.warna);
    root.setProperty('--utama-gelap', gelapkan(t.warna, 0.25));
  }
}

function gelapkan(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - f)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

let pemasaToast;
export function toast(mesej, ralat = false) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = mesej;
  el.classList.toggle('ralat-toast', ralat);
  el.classList.remove('tersembunyi');
  clearTimeout(pemasaToast);
  pemasaToast = setTimeout(() => el.classList.add('tersembunyi'), 4000);
}

export const IKON = {
  pengumuman: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"></path><path d="M16 9a3 3 0 0 1 0 6"></path></svg>',
  amaran: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v5"></path><path d="M12 16h.01"></path></svg>',
  cari: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>',
};
