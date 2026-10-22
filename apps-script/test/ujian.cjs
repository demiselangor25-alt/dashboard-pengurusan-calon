// Ujian fungsi tulen Code.gs dengan data sebenar yang dibaca dari Sheet (22 Okt 2026).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const kod = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
const sandbox = { module: { exports: {} }, console };
vm.createContext(sandbox);
vm.runInContext(kod, sandbox);
const G = sandbox.module.exports;

let lulus = 0;
function uji(nama, fn) { fn(); lulus++; console.log('✓', nama); }

uji('pecah senarai cawangan', () => {
  const c = G.pecahCawangan_('🔹 001 - TMN TEMPLER BAIDURI\n🔹 002 - TEMPLER SAUJANA\n🔹 301 - BEKAS POLIS BUKIT IDAMAN\n🔹 039 - SELAYANG HEIGHTS (');
  assert.strictEqual(c.length, 4);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(c[0])), { kod: '001', nama: 'TMN TEMPLER BAIDURI' });
  assert.strictEqual(c[2].kod, '301');
  assert.strictEqual(c[3].nama, 'SELAYANG HEIGHTS (');
});

uji('nama UDM Kuang', () => {
  assert.strictEqual(G.namaUdm_('01 - Pengkalan Kundang'), 'PENGKALAN KUNDANG');
  assert.strictEqual(G.namaUdm_('BATU 16 RAWANG'), 'BATU 16 RAWANG');
  assert.strictEqual(G.namaUdm_('BANDAR BARU SELAYANG UTARA'), 'BANDAR BARU SELAYANG UTARA');
});

uji('tarikh bercampur -> format "27 Ogos 2026"', () => {
  const f = (v) => G.formatTarikh_(G.hurai_Tarikh_(v));
  assert.strictEqual(f('27 Ogos 2026'), '27 Ogos 2026');
  assert.strictEqual(f('11-Sep-26'), '11 September 2026');
  assert.strictEqual(f('16 Sept 2026'), '16 September 2026');
  assert.strictEqual(f('18 Oktober 2026'), '18 Oktober 2026');
  assert.strictEqual(f('2026-10-22'), '22 Oktober 2026');
  assert.strictEqual(f(new Date(2026, 8, 13)), '13 September 2026');
  assert.strictEqual(G.hariBagi_(G.hurai_Tarikh_('27 Ogos 2026')), 'Khamis');
  assert.strictEqual(G.hariBagi_(G.hurai_Tarikh_('18 Oktober 2026')), 'Ahad');
  assert.strictEqual(G.hurai_Tarikh_(''), null);
});

const RASMI = ['BATU 16 RAWANG', 'BANDAR BARU SELAYANG UTARA', 'BUKIT IDAMAN', 'SELAYANG BAHARU TIGA', 'SELAYANG BAHARU DUA',
  'SELAYANG BAHARU SATU', 'TAMAN SELAYANG BAHARU', 'SELAYANG PANDANG', 'SRI MELATI', 'BANDAR BARU SELAYANG SELATAN',
  'KAMPUNG BENDAHARA', 'LEMBAH MUTIARA', 'KAMPUNG SELAYANG PERMAI', 'KAMPUNG SELAYANG INDAH', 'TAMAN SELAYANG INDAH', 'PRIMA SELAYANG'];

// Jadual Operasi sebenar (header + 21 baris), seperti dibaca.
const JADUAL = [
  ['18 Oktober 2026', 'Ahad', '9pg', 'BBS Utara & Selatan', 'BBS Utara & Selatan', 'Selayang Height', 'SPR Tukar Tempat Pengundi', 'Bersama SPR', 'DUN Taman Templer', '', '', '', '', '', ''],
  ['27 Ogos 2026', 'Khamis', '4:00 PM', 'Bukit Idaman', 'Bukit Idaman', 'Appartment Perdana Bukit Idaman', 'Ziarah Non Malay', 'Bersama Chiness', 'Pengundi Non Muslim', '', '', '', '', '', ''],
  ['', '', '', 'Selayang Baru', 'Selayang Baru', 'Jalan 46 Selayang Baru', 'Ziarah Non Malay', 'Bersama Chiness', 'Pengundi Non Muslim', '', '', '', '', '', ''],
  ['', '', '5:00 PM', 'Selayang Baru', 'Selayang Baru', 'Jalan 11 Selayang Baru', 'Walkabout', 'Edar Risalah & Bendera , Sempena Merdeka', '', '', '', '', '', '', ''],
  ['28 Ogos 2026', 'Jumaat', '5:00 PM', 'Selayang Permai', 'Selayang Permai', 'Kampung Selayang Permai & Jalan Permai 4', 'Ziarah Kasih', 'Bersama Komuniti', '', '', '', '', '', '', ''],
  ['', '', '7:00 PM', 'Selayang Indah', 'Selayang Indah', 'Kampung Selayang Indah', 'Program Komuniti', 'Maulidur Rasul Surau Hidayah', '', '', '', '', '', '', ''],
  ['29 Ogos 2026', 'Sabtu', '4:00 PM', 'Batu 16', 'Batu 16', 'Batu 17', 'Program Muslimat', 'Tamrin Qiadi Muslimat', '', '', '', '', '', '', ''],
  ['', '', '6:00 PM', 'Selayang Indah', 'Kampung Selayang Indah', 'Jalan Besar Selayang Indah', 'Walkabout', 'Edar Risalah & Bendera , Sempena Merdeka', '', '', '', '', '', '', ''],
  ['30 Ogos 2026', 'Ahad', '7.30am', 'BBS Utara & Selatan', 'BBS Utara & Selatan', 'Persiaran Pegawai BBS', 'Komuniti Masjid', 'Briskwalk MAF 2026', '', '', '', '', '', '', ''],
  ['', '', '10.00am', 'BBS Utara & Selatan', 'BBS Utara & Selatan', 'Taman BBS', 'Komuniti Geng Netball', 'Pertemuan Geng Netball Court Taman BBS', '', '', '', '', '', '', ''],
  [new Date(2026, 8, 11), 'Jumaat', '5.00pm', 'BBS Utara & Selatan', 'BBS Utara & Selatan', 'Dahlia A & B & Selayang Height', 'Ziarah Kasih', 'Bersama Komuniti', '', '', '', '', '', '', ''],
  ['13-Sep-26', 'Ahad', '8.00am', 'Parlimen Selayang', 'Parlimen Selayang', 'Parlimen Selayang', 'Program PASTI Selayang', 'Alam Ria PASTI Selayang', 'Ibu Bapa PASTI', '', '', '', '', '', ''],
  ['', '', '9.00am', 'DUN Taman Templer', 'Keseluruhan DUN Taman Templer', 'Keseluruhan DUN Taman Templer', 'Program Muslimat', 'Seminar Penyusuan Susu Ibu', 'Ibu Ayah Muda', '', '', '', '', '', ''],
  ['16 Sept 2026', 'Rabu', '7.30am', 'Parlimen Selayang', 'Parlimen Selayang', 'Parlimen Selayang', 'Program PASTI & SRITI', 'Fun Run PASTI Selayang', '', '', '', '', '', '', ''],
  ['17 Sept 2026', 'Khamis ', '9.00pm', 'Selayang Permai', 'Selayang Permai', 'Selayang Permai', 'Ziarah UDM', 'Pertemuan UDM Selayang Permai', 'Petugas UDM ', '', '', '', '', '', ''],
  ['18 Sept 2026', 'Jumaat', '5.00pm', 'Selayang Permai', 'Selayang Permai', 'Jalan 55 Selayang Baru', 'Ziarah Kasih', 'Ziarah Kasih ', 'Pengundi Muda', '', '', '', '', '', ''],
  ['19 Sept 2026', 'Sabtu ', '9.00pm', 'Selayang Permai', 'Selayang Permai', 'Selayang Permai', 'Culaan ', 'Gempur Cakna Pengundi ', '', '', '', '', '', '', ''],
  ['', '', '5.00pm', 'Selayang Baru ', 'Selayang Baru ', 'Selayang Baru ', 'Komuniti Taman', 'Sempena Hari Malaysia ', 'Penduduk Selayang Centre Point', '', '', '', '', '', ''],
  ['22 Sept 2026', 'Selasa', '3.30pm', 'Kg Bendahara', 'Kg Bendahara ', 'Kg Bendahara', 'Engagement', 'Kunjungan Hormat NGO MCM', '', '', '', '', '', '', ''],
  ['25 Sept 2026', 'Jumaat', '5.00pm', 'Kg Bendahara', 'Kg Bendahara ', 'Kg Bendahara', 'Ziarah Kasih ', 'Bersama Komuniti', 'Pengundi Muda', '', '', '', '', '', ''],
  ['26 Sept 2026', 'Sabtu ', '8.30pm', 'Kg Bendahara', 'Kg Bendahara ', 'Kg Bendahara', 'Culaan ', 'Gempur Cakna Pengundi ', '', '', '', '', '', '', '']
];

let norm;
uji('normal Jadual Operasi', () => {
  norm = G.normalJadual_(JADUAL, RASMI);
  const r = norm.rows;
  assert.strictEqual(r.length, 21);
  const JC = G.JC;
  // tarikh dibawa ke bawah dan diformat
  assert.strictEqual(r[2][JC.tarikh], '27 Ogos 2026');
  assert.strictEqual(r[2][JC.hari], 'Khamis');
  assert.strictEqual(r[10][JC.tarikh], '11 September 2026');
  assert.strictEqual(r[12][JC.tarikh], '13 September 2026');
  assert.strictEqual(r[17][JC.tarikh], '19 September 2026');
  // nama UDM
  const udm = r.map((x) => x[JC.udm]);
  assert.strictEqual(udm[0], 'BANDAR BARU SELAYANG UTARA');
  assert.strictEqual(udm[1], 'BUKIT IDAMAN');
  assert.strictEqual(udm[2], 'SELAYANG BAHARU DUA');
  assert.strictEqual(udm[3], 'SELAYANG BAHARU TIGA');
  assert.strictEqual(udm[4], 'KAMPUNG SELAYANG PERMAI');
  assert.strictEqual(udm[5], 'KAMPUNG SELAYANG INDAH');
  assert.strictEqual(udm[6], 'BATU 16 RAWANG');
  assert.strictEqual(udm[8], 'BANDAR BARU SELAYANG SELATAN');
  assert.strictEqual(udm[11], 'PERINGKAT PARLIMEN');
  assert.strictEqual(udm[12], 'PERINGKAT DUN');
  assert.strictEqual(udm[17], 'SELAYANG BAHARU SATU');
  assert.strictEqual(udm[18], 'KAMPUNG BENDAHARA');
  // ragu: Taman BBS (baris 9) dan Dahlia + Selayang Height (baris 10)
  assert.deepStrictEqual(Array.from(norm.ragu, (q) => q.index), [9, 10]);
  console.log('   UDM dinormalkan:', JSON.stringify(udm));
});

uji('rekod lapangan awal dari Jadual', () => {
  const rek = G.rekodDariJadual_(norm.rows, 'x');
  const kat = rek.map((x) => x[5]);
  const z = kat.filter((k) => k === 'Ziarah').length;
  const k = kat.filter((k2) => k2 === 'Komuniti').length;
  console.log('   Ziarah:', z, 'Komuniti:', k);
  rek.forEach((x) => console.log('   ', x[0], '|', x[2], '|', x[5], '|', x[6]));
  assert.strictEqual(z, 6);
  assert.strictEqual(k, 7);
});

uji('susun semula tab DUN dan baca balik', () => {
  const row1 = [1, 'BATU 16 RAWANG', '🔹 001 - TMN TEMPLER BAIDURI\n🔹 002 - TEMPLER SAUJANA\n🔹 003 - BT 16 RAWANG',
    'Kampung + taman', 'Kg Melayu Bt 16', 'Ziarah, Komuniti', 'Tinggi', 'Ziarah,', '', '', '', ''];
  const row2 = [11, 'KAMPUNG BENDAHARA', '🔹 013 - KG BENDAHARA\n🔹 022 - APT NILAM', 'Kampung + perumahan', 'Kg Bendahara',
    'Ziarah', 'Tinggi', '1. Ziarah Kasih Apt Nilam', 'HAK & Kempen', '', '', 0.4];
  const u1 = G.huraiBarisDunAsal_(row1, 'N15');
  const u2 = G.huraiBarisDunAsal_(row2, 'N15');
  assert.strictEqual(u1.cawangan.length, 3);
  assert.strictEqual(u2.pic, 'HAK & Kempen');
  assert.strictEqual(u2.keutamaan, 'Tinggi');
  const bina = G.binaBarisDun_([u1, u2]);
  assert.strictEqual(bina.values.length, 5);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(bina.groups)), [{ start: 0, size: 3 }, { start: 3, size: 2 }]);
  const balik = G.bacaBarisDun_(bina.values, 4);
  assert.strictEqual(balik.length, 2);
  assert.strictEqual(balik[0].cawangan.length, 3);
  assert.strictEqual(balik[1].baris, 7);
  assert.strictEqual(balik[1].cula, 40);
  assert.strictEqual(balik[1].cawangan[1].nama, 'APT NILAM');
  const k = G.huraiBarisDunAsal_([1, '01 - Pengkalan Kundang', '🔹 001 - KG PENGKALAN KUNDANG', '', '', '', '', '', '', '', ''], 'N13');
  assert.strictEqual(k.udm, 'PENGKALAN KUNDANG');
  assert.strictEqual(G.huraiBarisDunAsal_(['', '', '', ''], 'N15'), null);
});

uji('peratus cula', () => {
  assert.strictEqual(G.nomborCula_(0.5), 50);
  assert.strictEqual(G.nomborCula_(75), 75);
  assert.strictEqual(G.nomborCula_('60%'), 60);
  assert.strictEqual(G.nomborCula_(''), null);
});

console.log(`\n${lulus} ujian lulus`);
