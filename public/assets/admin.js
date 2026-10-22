import { ambilData, api, esc, hariIniIso, IKON, KATEGORI, logKeluar, nilaiTarikh, tajukKes, terapTetapan, toast } from './umum.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const cache = {};
let kategori = KATEGORI.some((k) => k.id === q.get('kategori')) ? q.get('kategori') : 'Ziarah';

async function data(dun, segar = false) {
  if (!cache[dun] || segar) cache[dun] = await ambilData(dun, segar);
  return cache[dun];
}

function ralat(err) {
  $('ralat').innerHTML = IKON.amaran + '<div>' + esc(err.message || err) + '</div>';
  $('ralat').classList.remove('tersembunyi');
}

async function hantar(action, payload, butang) {
  butang.disabled = true;
  const asal = butang.textContent;
  butang.textContent = 'Menyimpan…';
  try {
    await api('/api/admin', { method: 'POST', body: JSON.stringify({ action, ...payload }) });
    toast('Disimpan ke Google Sheet.');
    return true;
  } catch (err) {
    toast(err.message, true);
    return false;
  } finally {
    butang.disabled = false;
    butang.textContent = asal;
  }
}

/* ---------- Menu ---------- */
function pilihSeksyen(id) {
  document.querySelectorAll('#menu [data-seksyen]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.seksyen === id)));
  document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('tersembunyi', p.dataset.panel !== id));
  if (id === 'jadual') lukisJadual();
  if (id === 'tetapan') isiTetapan();
}

/* ---------- Tambah rekod ---------- */
function lukisKategori() {
  $('kategori').innerHTML = KATEGORI.map((k) =>
    `<button type="button" class="cip" role="radio" data-kat="${k.id}" aria-checked="${kategori === k.id}" aria-pressed="${kategori === k.id}">${k.label}</button>`).join('');
  $('label-nama').textContent = kategori === 'Al Malak' ? 'Nama Al Malak' : kategori === 'Ziarah' ? 'Ziarah (cth: Ziarah Kasih Apt Nilam)' : 'Komuniti / program (cth: NGO MCM)';
}

function isiUdm(select, d, pilihBil) {
  select.innerHTML = d.udm.map((u) => `<option value="${esc(u.udm)}" data-bil="${esc(u.bil)}">${esc(u.bil)} · ${esc(tajukKes(u.udm))}</option>`).join('');
  if (pilihBil) {
    const o = [...select.options].find((x) => x.dataset.bil === String(pilihBil));
    if (o) select.value = o.value;
  }
}

async function segarRekodUdm(pilihBil) {
  const d = await data($('rekod-dun').value);
  isiUdm($('rekod-udm'), d, pilihBil);
  isiCawangan();
}

function isiCawangan() {
  const d = cache[$('rekod-dun').value];
  const u = d && d.udm.find((x) => x.udm === $('rekod-udm').value);
  $('rekod-caw').innerHTML = '<option value="">— Umum / tidak spesifik —</option>' +
    (u ? u.cawangan.map((c, i) => `<option value="${i}">${esc(c.kod ? c.kod + ' · ' : '')}${esc(c.nama)}</option>`).join('') : '');
}

async function simpanRekod(e) {
  e.preventDefault();
  const f = e.target;
  const d = cache[f.dun.value];
  const u = d.udm.find((x) => x.udm === f.udm.value);
  const c = f.cawangan.value === '' ? null : u.cawangan[Number(f.cawangan.value)];
  const ok = await hantar('tambahRekod', {
    dun: f.dun.value, udm: f.udm.value, kod: c ? c.kod : '', cawangan: c ? c.nama : '',
    kategori, tarikh: f.tarikh.value, nama: f.nama.value.trim(), pic: f.pic.value.trim(), catatan: f.catatan.value.trim(),
  }, f.querySelector('[type=submit]'));
  if (ok) {
    f.nama.value = '';
    f.catatan.value = '';
    await data(f.dun.value, true);
  }
}

/* ---------- Kemas kini UDM ---------- */
async function segarBorangUdm(pilihBil) {
  const d = await data($('udm-dun').value);
  isiUdm($('udm-udm'), d, pilihBil);
  isiNilaiUdm();
}

function isiNilaiUdm() {
  const f = $('borang-udm');
  const u = cache[f.dun.value].udm.find((x) => x.udm === f.udm.value);
  if (!u) return;
  f.pic.value = u.pic || '';
  f.keutamaan.value = ['Tinggi', 'Sederhana', 'Rendah'].includes(u.keutamaan) ? u.keutamaan : '';
  f.status.value = ['Belum Mula', 'Dalam Proses', 'Selesai'].includes(u.status) ? u.status : '';
  f.cula.value = u.cula === null || u.cula === undefined ? '' : u.cula;
  f.catatan.value = u.catatan || '';
  f.status.style.borderColor = f.status.value ? '' : '#D92D20';
}

async function simpanUdm(e) {
  e.preventDefault();
  const f = e.target;
  const ok = await hantar('kemaskiniUdm', {
    dun: f.dun.value, udm: f.udm.value,
    medan: { pic: f.pic.value.trim(), keutamaan: f.keutamaan.value, status: f.status.value, catatan: f.catatan.value.trim(), cula: f.cula.value === '' ? '' : Number(f.cula.value) },
  }, f.querySelector('[type=submit]'));
  if (ok) { await data(f.dun.value, true); isiNilaiUdm(); }
}

/* ---------- Jadual Operasi ---------- */
async function lukisJadual() {
  const d = await data('N15');
  const rasmi = new Set(d.udm.map((u) => u.udm).concat(['PERINGKAT DUN', 'PERINGKAT PARLIMEN']));
  const pilihanUdm = [...rasmi];
  const baris = [...d.jadual].sort((a, b) => nilaiTarikh(b.tarikh) - nilaiTarikh(a.tarikh));
  $('tbl-jadual').innerHTML = '<thead><tr><th>Tarikh</th><th>UDM</th><th>Program</th><th>Status</th><th></th></tr></thead><tbody>' +
    baris.map((r) => {
      const udmSah = rasmi.has(r.udm);
      return `<tr data-baris="${r.baris}" class="${r.status ? '' : 'sel-merah'}">
        <td class="tebal">${esc(r.tarikh)}</td>
        <td>${udmSah ? esc(tajukKes(r.udm)) : `<label class="medan"><span class="merah-teks" style="font-size:12px">${esc(r.udm || 'Tiada UDM')} — pilih UDM</span><select data-medan="udm"><option value="">— Pilih —</option>${pilihanUdm.map((n) => `<option value="${esc(n)}">${esc(tajukKes(n))}</option>`).join('')}</select></label>`}</td>
        <td><strong>${esc(r.program || r.jenis)}</strong><div class="kecil">${esc(r.jenis)} · ${esc(r.lokaliti)}</div></td>
        <td class="status"><label class="medan"><span class="sr">Status</span><select data-medan="status" style="${r.status ? '' : 'border-color:#D92D20'}">
          <option value="">— Kosong —</option>${d.senarai.status.map((s) => `<option ${s === r.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label></td>
        <td><button type="button" class="btn kecil" data-simpan>Simpan</button></td>
      </tr>`;
    }).join('') + '</tbody>';
}

async function simpanJadual(e) {
  const b = e.target.closest('[data-simpan]');
  if (!b) return;
  const tr = b.closest('tr');
  const medan = {};
  tr.querySelectorAll('[data-medan]').forEach((s) => { if (s.dataset.medan !== 'udm' || s.value) medan[s.dataset.medan] = s.value; });
  const ok = await hantar('kemaskiniJadual', { baris: Number(tr.dataset.baris), medan }, b);
  if (ok) { await data('N15', true); lukisJadual(); }
}

/* ---------- Tetapan ---------- */
async function isiTetapan() {
  const t = (await data('N15')).tetapan || {};
  const f = $('borang-tetapan');
  ['tajuk', 'subtajuk_N15', 'subtajuk_N13', 'pengumuman'].forEach((k) => { f[k].value = t[k] || ''; });
  f.pengumuman_aktif.checked = String(t.pengumuman_aktif).toUpperCase() === 'YA';
  f.warna.value = /^#[0-9a-f]{6}$/i.test(t.warna || '') ? t.warna : '#146C43';
}

async function simpanTetapan(e) {
  e.preventDefault();
  const f = e.target;
  const tetapan = {
    tajuk: f.tajuk.value.trim(), subtajuk_N15: f.subtajuk_N15.value.trim(), subtajuk_N13: f.subtajuk_N13.value.trim(),
    pengumuman: f.pengumuman.value.trim(), pengumuman_aktif: f.pengumuman_aktif.checked ? 'YA' : 'TIDAK', warna: f.warna.value,
  };
  const ok = await hantar('simpanTetapan', { tetapan }, f.querySelector('[type=submit]'));
  if (ok) { terapTetapan(tetapan); delete cache.N15; delete cache.N13; }
}

/* ---------- Mula ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  $('log-keluar').addEventListener('click', logKeluar);
  $('menu').addEventListener('click', (e) => { const b = e.target.closest('[data-seksyen]'); if (b) pilihSeksyen(b.dataset.seksyen); });
  $('kategori').addEventListener('click', (e) => { const b = e.target.closest('[data-kat]'); if (b) { kategori = b.dataset.kat; lukisKategori(); } });
  $('rekod-dun').addEventListener('change', () => segarRekodUdm().catch(ralat));
  $('rekod-udm').addEventListener('change', isiCawangan);
  $('borang-rekod').addEventListener('submit', simpanRekod);
  $('udm-dun').addEventListener('change', () => segarBorangUdm().catch(ralat));
  $('udm-udm').addEventListener('change', isiNilaiUdm);
  $('borang-udm').addEventListener('submit', simpanUdm);
  $('tbl-jadual').addEventListener('click', simpanJadual);
  $('borang-tetapan').addEventListener('submit', simpanTetapan);

  const dun = q.get('dun') === 'N13' ? 'N13' : 'N15';
  $('rekod-dun').value = dun;
  $('udm-dun').value = dun;
  $('rekod-tarikh').value = hariIniIso();
  lukisKategori();
  try {
    const d = await data(dun);
    terapTetapan(d.tetapan);
    await segarRekodUdm(q.get('bil'));
    await segarBorangUdm(q.get('bil'));
  } catch (err) {
    ralat(err);
  }
});
