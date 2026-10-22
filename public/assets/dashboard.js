import { ambilData, esc, IKON, kiraIkutUdm, logKeluar, nilaiTarikh, tajukKes, terapTetapan, toast } from './umum.js';

const DUN = location.pathname.replace(/\/+$/, '') === '/kuang' ? 'N13' : 'N15';
const $ = (id) => document.getElementById(id);

let DATA = null;
let tapis = 'semua';
let carian = '';
let semuaJadual = false;

function namaPapar(u) { return tajukKes(u); }

async function muat(segar = false) {
  try {
    $('ralat').classList.add('tersembunyi');
    DATA = await ambilData(DUN, segar);
    lukis();
    if (segar) toast('Data dikemas kini dari Google Sheet.');
  } catch (err) {
    $('ralat').innerHTML = IKON.amaran + '<div>' + esc(err.message) + '</div>';
    $('ralat').classList.remove('tersembunyi');
  } finally {
    $('memuat').classList.add('tersembunyi');
  }
}

function lukis() {
  const t = DATA.tetapan || {};
  terapTetapan(t);
  document.title = `${t.tajuk || 'Dashboard Pengurusan Calon'} · ${DATA.namaDun}`;
  $('tajuk').textContent = t.tajuk || 'Dashboard Pengurusan Calon';
  $('subtajuk').textContent = t[`subtajuk_${DUN}`] || DATA.namaDun;
  $('lencana').textContent = DUN === 'N13' ? 'N13' : 'N15';

  const p = $('pengumuman');
  if (String(t.pengumuman_aktif).toUpperCase() === 'YA' && (t.pengumuman || '').trim()) {
    p.innerHTML = IKON.pengumuman + '<div><strong>Pengumuman:</strong> ' + esc(t.pengumuman) + '</div>';
    p.classList.remove('tersembunyi');
  } else p.classList.add('tersembunyi');

  const { peta, takPadan } = kiraIkutUdm(DATA.udm, DATA.rekod);
  DATA._peta = peta;
  lukisKpi(peta);
  lukisTakPadan(takPadan);
  lukisPenapis(peta);
  lukisKad(peta);
  lukisJadual();
  $('kaki').textContent = `Sumber: Google Sheet “DATABASE PENGURUSAN CALON” · dikemas kini ${new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}`;
}

function jumlah(peta, kat) {
  let n = 0, udm = 0;
  peta.forEach((k) => { n += k[kat]; if (k[kat]) udm++; });
  return { n, udm };
}

function lukisKpi(peta) {
  const caw = DATA.udm.reduce((a, u) => a + u.cawangan.length, 0);
  const z = jumlah(peta, 'Ziarah'), a = jumlah(peta, 'Al Malak'), k = jumlah(peta, 'Komuniti');
  let belum = 0;
  peta.forEach((v) => { if (!v.Ziarah && !v['Al Malak'] && !v.Komuniti) belum++; });
  const kotak = (label, nilai, sub, kelas = '', kelasNilai = '') =>
    `<div class="panel"><div class="kpi-label ${kelas}">${label}</div><div class="kpi-nilai ${kelasNilai}">${nilai}</div><div class="kecil">${sub}</div></div>`;
  $('kpi').innerHTML =
    kotak('UDM', DATA.udm.length, `${caw} cawangan`) +
    kotak('Ziarah', z.n, z.n ? `di ${z.udm} UDM` : 'Belum ada rekod', 'ziarah') +
    kotak('Al Malak', a.n, a.n ? `di ${a.udm} UDM` : 'Belum ada rekod', 'malak') +
    kotak('Komuniti', k.n, k.n ? `di ${k.udm} UDM` : 'Belum ada rekod', 'komuniti') +
    kotak('UDM belum disentuh', belum, 'Tiada ziarah, Al Malak atau komuniti', '', belum ? 'merah' : '');
  $('kpi').classList.remove('tersembunyi');
}

function lukisTakPadan(senarai) {
  const el = $('tak-padan');
  if (!senarai.length) { el.classList.add('tersembunyi'); return; }
  el.className = 'notis kuning';
  el.innerHTML = IKON.amaran + `<div><strong>${senarai.length} rekod belum dipadankan dengan UDM</strong> dan tidak dikira dalam kad di bawah: ` +
    senarai.slice(0, 5).map((r) => esc(`${r.nama} (${r.udm || 'tiada UDM'})`)).join('; ') +
    (senarai.length > 5 ? '…' : '') + '. Betulkan nama UDM dalam tab Rekod Lapangan.</div>';
}

function belumDisentuh(k) { return !k.Ziarah && !k['Al Malak'] && !k.Komuniti; }

function lukisPenapis(peta) {
  const kira = (f) => DATA.udm.filter((u) => padanTapis(u, peta, f)).length;
  const pilihan = [
    ['semua', 'Semua'], ['Tinggi', 'Keutamaan Tinggi'], ['Sederhana', 'Sederhana'], ['belum', 'Belum disentuh'],
  ].filter(([id]) => id === 'semua' || id === 'belum' || kira(id) > 0);
  $('penapis').innerHTML = pilihan.map(([id, label]) =>
    `<button type="button" class="cip" data-tapis="${id}" aria-pressed="${tapis === id}">${label} (${kira(id)})</button>`).join('');
}

function padanTapis(u, peta, f) {
  if (f === 'semua') return true;
  if (f === 'belum') return belumDisentuh(peta.get(u.udm));
  return (u.keutamaan || '').toLowerCase() === f.toLowerCase();
}

function lukisKad(peta) {
  const q = carian.toLowerCase().trim();
  const senarai = DATA.udm.filter((u) => padanTapis(u, peta, tapis) &&
    (!q || u.udm.toLowerCase().includes(q) || u.cawangan.some((c) => c.nama.toLowerCase().includes(q))));
  $('grid-udm').innerHTML = senarai.map((u) => {
    const k = peta.get(u.udm);
    const belum = belumDisentuh(k);
    const kt = (u.keutamaan || '').toLowerCase();
    const pil = kt ? `<span class="pil ${['tinggi', 'sederhana', 'rendah'].includes(kt) ? kt : 'kelabu'}">${esc(u.keutamaan)}</span>` : '';
    return `<a class="kad-udm" href="/udm?dun=${DUN}&bil=${encodeURIComponent(u.bil)}">
      <div class="kad-atas">
        <div class="kad-nama"><span class="bil">${esc(u.bil)}</span><div><strong>${esc(namaPapar(u.udm))}</strong><span class="kecil">${u.cawangan.length} cawangan</span></div></div>
        ${pil}
      </div>
      <div class="tiga">
        <div class="metrik ziarah"><b>${k.Ziarah}</b><span>Ziarah</span></div>
        <div class="metrik malak"><b>${k['Al Malak']}</b><span>Al Malak</span></div>
        <div class="metrik komuniti"><b>${k.Komuniti}</b><span>Komuniti</span></div>
      </div>
      <div class="kad-bawah">
        <span>PIC: ${u.pic ? `<strong>${esc(u.pic)}</strong>` : '<span class="merah-teks">Belum diisi</span>'}</span>
        ${belum ? '<span class="merah-teks">Belum disentuh</span>' : '<span class="hijau-teks">Lihat butiran →</span>'}
      </div>
    </a>`;
  }).join('');
  $('tiada-udm').classList.toggle('tersembunyi', senarai.length > 0);
  $('udm').classList.remove('tersembunyi');
}

function lukisJadual() {
  const ada = DUN === 'N15' && DATA.jadual.length > 0;
  $('jadual').classList.toggle('tersembunyi', !ada);
  $('nav-jadual').classList.toggle('tersembunyi', !ada);
  if (!ada) return;
  const baris = [...DATA.jadual].sort((a, b) => nilaiTarikh(b.tarikh) - nilaiTarikh(a.tarikh));
  const kosong = baris.filter((r) => !r.status).length;
  $('jadual-ringkas').textContent = `${baris.length} program · ${kosong} status belum diisi (merah)`;
  const papar = semuaJadual ? baris : baris.slice(0, 10);
  $('semua-jadual').classList.toggle('tersembunyi', baris.length <= 10);
  $('semua-jadual').textContent = semuaJadual ? 'Tunjuk 10 terkini' : `Tunjuk semua ${baris.length}`;
  $('jadual-tbl').innerHTML = '<thead><tr><th>Tarikh</th><th>Masa</th><th>UDM</th><th>Lokaliti</th><th>Jenis aktiviti</th><th>Program</th><th>PIC</th><th>Status</th></tr></thead><tbody>' +
    papar.map((r) => `<tr class="${r.status ? '' : 'sel-merah'}">
      <td class="tebal">${esc(r.tarikh)}</td><td>${esc(r.masa)}</td><td>${esc(tajukKes(r.udm))}</td><td>${esc(r.lokaliti)}</td>
      <td>${esc(r.jenis)}</td><td class="tebal">${esc(r.program)}</td><td>${esc(r.pic) || '<span class="kecil">—</span>'}</td>
      <td class="status">${r.status ? `<span class="pil ${r.status === 'Selesai' ? 'hijau' : 'kelabu'}">${esc(r.status)}</span>` : '<span class="pil merah">Kosong</span>'}</td>
    </tr>`).join('') + '</tbody>';
}

// Acara
document.addEventListener('DOMContentLoaded', () => {
  $(DUN === 'N13' ? 'pautan-n13' : 'pautan-n15').setAttribute('aria-current', 'page');
  $('ikon-cari').innerHTML = IKON.cari;
  $('cari').addEventListener('input', (e) => { carian = e.target.value; if (DATA) lukisKad(DATA._peta); });
  $('penapis').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tapis]');
    if (!b) return;
    tapis = b.dataset.tapis;
    lukisPenapis(DATA._peta);
    lukisKad(DATA._peta);
  });
  $('semua-jadual').addEventListener('click', () => { semuaJadual = !semuaJadual; lukisJadual(); });
  $('muat-semula').addEventListener('click', () => muat(true));
  $('log-keluar').addEventListener('click', logKeluar);
  muat();
});
