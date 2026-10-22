import { ambilData, esc, IKON, KATEGORI, nilaiTarikh, tajukKes, terapTetapan } from './umum.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const DUN = q.get('dun') === 'N13' ? 'N13' : 'N15';
const BIL = q.get('bil');
let tab = ['Ziarah', 'Al Malak', 'Komuniti'].includes(q.get('tab')) ? q.get('tab') : 'Ziarah';
let U = null;
let REKOD = [];
let DATA = null;

const KOLUM = {
  Ziarah: [['tarikh', 'Tarikh'], ['cawangan', 'Cawangan'], ['nama', 'Ziarah'], ['pic', 'PIC'], ['catatan', 'Catatan']],
  'Al Malak': [['nama', 'Nama'], ['cawangan', 'Cawangan'], ['tarikh', 'Tarikh dijumpai'], ['pic', 'PIC'], ['catatan', 'Catatan / maklum balas']],
  Komuniti: [['tarikh', 'Tarikh'], ['nama', 'Komuniti / program'], ['cawangan', 'Cawangan'], ['pic', 'PIC'], ['catatan', 'Catatan']],
};
const TAJUK = { Ziarah: 'Semua ziarah di UDM ini', 'Al Malak': 'Al Malak yang telah dijumpai', Komuniti: 'Komuniti yang telah di-engage' };

async function mula() {
  $('kembali').href = DUN === 'N13' ? '/kuang' : '/';
  $('tambah').href = `/admin?dun=${DUN}&bil=${encodeURIComponent(BIL || '')}`;
  try {
    DATA = await ambilData(DUN);
    U = DATA.udm.find((u) => String(u.bil) === String(BIL));
    if (!U) throw new Error('UDM tidak dijumpai. Sila kembali ke dashboard.');
    REKOD = DATA.rekod.filter((r) => r.udm === U.udm).sort((a, b) => nilaiTarikh(b.tarikh) - nilaiTarikh(a.tarikh));
    lukis();
  } catch (err) {
    $('ralat').innerHTML = IKON.amaran + '<div>' + esc(err.message) + '</div>';
    $('ralat').classList.remove('tersembunyi');
  } finally {
    $('memuat').classList.add('tersembunyi');
  }
}

function sel(r, k) {
  const v = r[k];
  if (!v) return '<span class="kecil">—</span>';
  if (k === 'cawangan') return esc((r.kod ? r.kod + ' · ' : '') + v);
  return esc(v);
}

function lukis() {
  const t = DATA.tetapan || {};
  terapTetapan(t);
  document.title = `${tajukKes(U.udm)} · ${DATA.namaDun}`;
  $('tajuk').textContent = t.tajuk || 'Dashboard Pengurusan Calon';
  $('subtajuk').textContent = DATA.namaDun;
  $('lencana').textContent = DUN;

  const kira = Object.fromEntries(KATEGORI.map((k) => [k.id, REKOD.filter((r) => r.kategori === k.id).length]));
  const kodAda = new Set(REKOD.map((r) => r.kod).filter(Boolean));
  const namaAda = REKOD.map((r) => (r.cawangan || '').toLowerCase()).filter(Boolean);
  const cawAda = (c) => (c.kod && kodAda.has(c.kod)) || namaAda.some((n) => n === c.nama.toLowerCase() || (c.nama.length > 5 && n.includes(c.nama.toLowerCase())));
  const kt = (U.keutamaan || '').toLowerCase();
  const jadual = (DATA.jadual || []).filter((j) => j.udm === U.udm).sort((a, b) => nilaiTarikh(b.tarikh) - nilaiTarikh(a.tarikh));
  const rekodTab = REKOD.filter((r) => r.kategori === tab);
  const kol = KOLUM[tab];

  $('isi').innerHTML = `
  <section class="panel kepala-udm">
    <div class="seksyen-kepala" style="align-items:flex-start">
      <div class="kad-nama" style="gap:14px">
        <span class="bil bil-besar">${esc(U.bil)}</span>
        <div style="display:flex;flex-direction:column;gap:4px">
          <h1>${esc(tajukKes(U.udm))}</h1>
          <div class="kecil" style="font-size:14px">${U.cawangan.length} cawangan${U.profil ? ' · ' + esc(U.profil) : ''} · PIC: ${U.pic ? esc(U.pic) : '<span class="merah-teks">belum diisi</span>'}</div>
        </div>
      </div>
      ${U.keutamaan ? `<span class="pil ${['tinggi', 'sederhana', 'rendah'].includes(kt) ? kt : 'kelabu'}" style="font-size:13px;padding:6px 12px">Keutamaan ${esc(U.keutamaan)}</span>` : ''}
    </div>
    <div class="tab-metrik" role="tablist" aria-label="Kategori rekod">
      ${KATEGORI.map((k) => `<button type="button" role="tab" class="metrik ${k.kelas}" data-tab="${k.id}" aria-selected="${tab === k.id}"><b>${kira[k.id]}</b><span>${k.label}</span></button>`).join('')}
    </div>
  </section>

  <section class="panel" role="tabpanel">
    <div class="pad seksyen-kepala">
      <div><h2 style="font-size:18px">${TAJUK[tab]}</h2><div class="kecil">${rekodTab.length} rekod · dari tab Rekod Lapangan</div></div>
      <a class="btn kecil" style="display:inline-flex;align-items:center;text-decoration:none;color:#fff" href="/admin?dun=${DUN}&bil=${encodeURIComponent(U.bil)}&kategori=${encodeURIComponent(tab)}">+ Tambah ${esc(tab)}</a>
    </div>
    ${rekodTab.length ? `<div class="kotak-jadual"><table>
      <thead><tr>${kol.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead>
      <tbody>${rekodTab.map((r) => `<tr>${kol.map(([k]) => `<td class="${k === 'nama' ? 'tebal' : ''}">${sel(r, k)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>` : `<div class="pad" style="padding-top:0"><div class="kosong">Belum ada rekod ${esc(tab)} untuk UDM ini.</div></div>`}
  </section>

  <div class="dua-lajur">
    <section class="panel pad lebar" style="display:flex;flex-direction:column;gap:14px">
      <div class="seksyen-kepala"><div><h2 style="font-size:18px">${U.cawangan.length} cawangan dalam UDM ini</h2></div><span class="kecil">Hijau = ada rekod lapangan</span></div>
      <div class="grid-cawangan">${U.cawangan.map((c) => `<div class="cawangan ${cawAda(c) ? 'ada' : ''}">${esc(c.kod ? c.kod + ' · ' : '')}${esc(c.nama)}</div>`).join('')}</div>
    </section>
    <aside class="sempit">
      <section class="panel pad" style="display:flex;flex-direction:column;gap:14px">
        <h3>Profil &amp; status</h3>
        ${U.kluster ? `<div class="blok"><div class="label-kecil">Kluster / lokaliti utama</div><div style="font-size:14px">${esc(U.kluster)}</div></div>` : ''}
        ${U.aktivitiSesuai ? `<div class="blok"><div class="label-kecil">Aktiviti sesuai</div><div class="senarai-cip">${U.aktivitiSesuai.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((s) => `<span class="cip-statik">${esc(s)}</span>`).join('')}</div></div>` : ''}
        <div class="blok"><div class="label-kecil">Status</div><div>${U.status ? `<span class="pil ${U.status === 'Selesai' ? 'hijau' : 'kelabu'}">${esc(U.status)}</span>` : '<span class="pil merah">Kosong</span>'}</div></div>
        <div class="blok"><div class="label-kecil">Peratus selesai cula</div><div style="font-size:14px;font-weight:700">${U.cula === null || U.cula === undefined ? '<span class="kecil">Belum diisi</span>' : esc(U.cula) + '%'}</div></div>
        ${U.aktivitiDijalankan ? `<div class="blok"><div class="label-kecil">Aktiviti dijalankan (tab DUN)</div><div class="prawacana">${esc(U.aktivitiDijalankan)}</div></div>` : ''}
        ${U.catatan ? `<div class="blok"><div class="label-kecil">Catatan isu &amp; susulan</div><div class="prawacana">${esc(U.catatan)}</div></div>` : ''}
      </section>
      ${DUN === 'N15' ? `<section class="panel pad" style="display:flex;flex-direction:column;gap:12px">
        <h3>Jadual Operasi UDM ini</h3>
        ${jadual.length ? jadual.map((j) => `<div class="blok" style="gap:2px;border-top:1px solid var(--garis-2);padding-top:10px">
          <div class="kecil" style="font-weight:700">${esc(j.tarikh)}${j.masa ? ' · ' + esc(j.masa) : ''}</div>
          <div style="font-weight:700;font-size:14px">${esc(j.program || j.jenis)}</div>
          <div class="kecil">${esc(j.jenis)}${j.lokaliti ? ' · ' + esc(j.lokaliti) : ''} · ${j.status ? esc(j.status) : '<span class="merah-teks">Status kosong</span>'}</div>
        </div>`).join('') : '<div class="kosong">Tiada program dalam Jadual Operasi.</div>'}
      </section>` : ''}
    </aside>
  </div>`;
  $('isi').classList.remove('tersembunyi');
}

document.addEventListener('DOMContentLoaded', () => {
  $('isi').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    const u = new URL(location.href);
    u.searchParams.set('tab', tab);
    history.replaceState(null, '', u);
    lukis();
  });
  mula();
});
