/**
 * Dashboard Pengurusan Calon — Apps Script (dipasang pada Google Sheet
 * "DATABASE PENGURUSAN CALON").
 *
 * Dua tugas:
 *  1. persediaanAwal()  — dijalankan SEKALI: buat backup fail, susun semula tab
 *     DUN (satu baris setiap cawangan), betulkan Jadual Operasi, cipta tab
 *     "Rekod Lapangan" dan "Tetapan".
 *  2. doPost()          — API untuk website (baca data, tambah rekod, kemas kini
 *     UDM / Jadual / Tetapan). Dilindungi kunci API dalam Script Properties.
 */

// ID Google Sheet "DATABASE PENGURUSAN CALON". Skrip boleh dipasang terus pada Sheet
// (Extensions → Apps Script) atau sebagai projek Apps Script berasingan.
var SHEET_ID = '1yh98K55yRin0w03jD8N2krh0sS_1XM6nDGNrAWxL2x4';

var CFG = {
  DUN: {
    N15: { tab: 'N.15 Templer', nama: 'N.15 Taman Templer' },
    N13: { tab: 'N.13 Kuang', nama: 'N.13 Kuang' }
  },
  TAB_JADUAL: 'Jadual Operasi',
  TAB_REKOD: 'Rekod Lapangan',
  TAB_TETAPAN: 'Tetapan',
  KATEGORI: ['Ziarah', 'Al Malak', 'Komuniti'],
  STATUS: ['Belum Mula', 'Dalam Proses', 'Selesai'],
  KEUTAMAAN: ['Tinggi', 'Sederhana', 'Rendah'],
  PERINGKAT: ['PERINGKAT DUN', 'PERINGKAT PARLIMEN'],
  WARNA_UTAMA: '#146C43'
};

var BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
var HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

// Susunan lajur tab DUN yang baharu (baris 1 tajuk, baris 2 subtajuk, baris 3 header, data dari baris 4).
var DUN_HEADER = ['Bil', 'UDM', 'Kod Cawangan', 'Cawangan', 'Profil Kawasan', 'Kluster/Lokaliti Utama',
  'Aktiviti Sesuai', 'Keutamaan', 'Aktiviti Dijalankan & Tarikh', 'PIC', 'Status', 'Catatan Isu & Susulan',
  'Peratus Selesai Cula'];
var DUN_COL = { bil: 0, udm: 1, kod: 2, cawangan: 3, profil: 4, kluster: 5, aktivitiSesuai: 6, keutamaan: 7,
  aktivitiDijalankan: 8, pic: 9, status: 10, catatan: 11, cula: 12 };
var DUN_GROUP_COLS = [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // lajur peringkat UDM (digabung menegak)
var DUN_DATA_ROW = 4;

var JADUAL_HEADER = ['Tarikh', 'Hari', 'Masa', 'UDM', 'Daerah Mengundi', 'Lokaliti', 'Jenis Aktiviti',
  'Nama Program', 'Sasaran', 'Calon', 'PIC', 'Bil. Jentera', 'Status', 'Isu Dikenal Pasti',
  'Tindakan Susulan'];
var JC = { tarikh: 0, hari: 1, masa: 2, udm: 3, dm: 4, lokaliti: 5, jenis: 6, program: 7, sasaran: 8, calon: 9,
  pic: 10, jentera: 11, status: 12, isu: 13, tindakan: 14 };

var REKOD_HEADER = ['Tarikh', 'DUN', 'UDM', 'Kod Cawangan', 'Cawangan', 'Kategori',
  'Nama / Program / Komuniti', 'PIC', 'Catatan', 'Sumber', 'Direkod Pada'];
var RC = { tarikh: 0, dun: 1, udm: 2, kod: 3, cawangan: 4, kategori: 5, nama: 6, pic: 7, catatan: 8, sumber: 9, direkod: 10 };

var TETAPAN_LALAI = [
  ['tajuk', 'Dashboard Pengurusan Calon'],
  ['subtajuk_N15', 'DUN N.15 Taman Templer · Parlimen P.097 Selayang · Selangor'],
  ['subtajuk_N13', 'DUN N.13 Kuang · Parlimen P.097 Selayang · Selangor'],
  ['pengumuman', ''],
  ['pengumuman_aktif', 'TIDAK'],
  ['warna', CFG.WARNA_UTAMA]
];

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Dashboard')
    .addItem('1. Persediaan awal (sekali sahaja)', 'persediaanAwal')
    .addItem('2. Papar kunci API untuk Netlify', 'paparKunci')
    .addSeparator()
    .addItem('Semak bilangan data', 'semakData')
    .addToUi();
}

/* ------------------------------------------------------------------ */
/* Fungsi tulen (tiada panggilan Apps Script) — diuji di luar Sheet     */
/* ------------------------------------------------------------------ */

function ialahTarikh_(v) {
  return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
}

function bersih_(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\s+/g, ' ').trim();
}

/** "🔹 001 - TMN TEMPLER BAIDURI\n🔹 002 - ..." -> [{kod:'001', nama:'TMN TEMPLER BAIDURI'}, ...] */
function pecahCawangan_(teks) {
  var out = [];
  String(teks || '').split(/\r?\n/).forEach(function (baris) {
    var t = baris.replace(/[\u{1F539}\u{1F538}\u{2022}\u{25CF}\u{25AA}\u{FE0F}]/gu, '').trim();
    if (!t) return;
    var m = t.match(/^(\d{1,4})\s*[-–]\s*(.+)$/);
    if (m) out.push({ kod: ('000' + m[1]).slice(-Math.max(3, m[1].length)), nama: bersih_(m[2]) });
    else out.push({ kod: '', nama: bersih_(t) });
  });
  return out;
}

/** "01 - Pengkalan Kundang" -> "PENGKALAN KUNDANG"; "BATU 16 RAWANG" kekal. */
function namaUdm_(teks) {
  return bersih_(String(teks || '').replace(/^\s*\d{1,3}\s*[-–.]\s*/, '')).toUpperCase();
}

var BULAN_KENAL = [
  ['jan', 0], ['feb', 1], ['mac', 2], ['mar', 2], ['apr', 3], ['mei', 4], ['may', 4], ['jun', 5],
  ['jul', 6], ['ogo', 7], ['aug', 7], ['sep', 8], ['okt', 9], ['oct', 9], ['nov', 10], ['dis', 11], ['dec', 11]
];

/** Terima Date atau teks ("27 Ogos 2026", "11-Sep-26", "16 Sept 2026", "2026-10-22"). Pulang {y,m,d} atau null. */
function hurai_Tarikh_(v) {
  if (ialahTarikh_(v)) return { y: v.getFullYear(), m: v.getMonth(), d: v.getDate() };
  var s = bersih_(v).toLowerCase();
  if (!s) return null;
  var iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return { y: +iso[1], m: +iso[2] - 1, d: +iso[3] };
  var m = s.match(/(\d{1,2})[\s\-\/.]+([a-z]+)[\s\-\/.,]+(\d{2,4})/);
  if (m) {
    var bulan = -1;
    for (var i = 0; i < BULAN_KENAL.length; i++) {
      if (m[2].indexOf(BULAN_KENAL[i][0]) === 0) { bulan = BULAN_KENAL[i][1]; break; }
    }
    if (bulan < 0) return null;
    var y = +m[3];
    if (y < 100) y += 2000;
    return { y: y, m: bulan, d: +m[1] };
  }
  var dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    var yy = +dmy[3];
    if (yy < 100) yy += 2000;
    return { y: yy, m: +dmy[2] - 1, d: +dmy[1] };
  }
  return null;
}

function formatTarikh_(t) {
  return t ? t.d + ' ' + BULAN[t.m] + ' ' + t.y : '';
}

function hariBagi_(t) {
  return t ? HARI[new Date(t.y, t.m, t.d).getDay()] : '';
}

/** Nilai masa dari Sheet (Date bertarikh 1899) -> "4:00 PM". */
function formatMasa_(d) {
  var h = d.getHours();
  var m = d.getMinutes();
  return (h % 12 || 12) + ':' + ('0' + m).slice(-2) + ' ' + (h >= 12 ? 'PM' : 'AM');
}

/**
 * Seragamkan nama UDM dalam Jadual Operasi ke nama rasmi dalam tab DUN.
 * Pulang {nama, ragu, nota}. ragu=true bila tidak dapat dipastikan.
 */
function seragamUdm_(udm, dm, lokaliti, program, senaraiRasmi) {
  var asal = bersih_(udm) || bersih_(dm);
  var u = asal.toLowerCase();
  var l = bersih_(lokaliti).toLowerCase();
  var p = bersih_(program).toLowerCase();
  var rasmi = senaraiRasmi || [];
  if (!u) return { nama: '', ragu: false };
  var tepat = rasmi.filter(function (n) { return n.toLowerCase() === u; });
  if (tepat.length) return { nama: tepat[0], ragu: false };
  if (u.indexOf('parlimen') >= 0) return { nama: 'PERINGKAT PARLIMEN', ragu: false };
  if (/^dun\b|keseluruhan dun/.test(u)) return { nama: 'PERINGKAT DUN', ragu: false };
  if (/\bbbs\b|bandar baru selayang/.test(u)) {
    var utara = /selayang height/.test(l);
    var selatan = /dahlia|persiaran pegawai|seroja|kenanga|melor|cempaka/.test(l);
    if (utara && !selatan) return { nama: 'BANDAR BARU SELAYANG UTARA', ragu: false };
    if (selatan && !utara) return { nama: 'BANDAR BARU SELAYANG SELATAN', ragu: false };
    return { nama: asal, ragu: true, nota: 'Sila pilih BANDAR BARU SELAYANG UTARA atau BANDAR BARU SELAYANG SELATAN.' };
  }
  if (/bukit idaman/.test(u)) return { nama: 'BUKIT IDAMAN', ragu: false };
  if (/permai/.test(u)) return { nama: 'KAMPUNG SELAYANG PERMAI', ragu: false };
  if (/pandang/.test(u)) return { nama: 'SELAYANG PANDANG', ragu: false };
  if (/selayang indah/.test(u)) {
    if (/^(taman|tmn)\b/.test(u)) return { nama: 'TAMAN SELAYANG INDAH', ragu: false };
    return { nama: 'KAMPUNG SELAYANG INDAH', ragu: false };
  }
  if (/selayang ba(ha)?ru/.test(u)) {
    if (/\bsatu\b/.test(u)) return { nama: 'SELAYANG BAHARU SATU', ragu: false };
    if (/\bdua\b/.test(u)) return { nama: 'SELAYANG BAHARU DUA', ragu: false };
    if (/\btiga\b/.test(u)) return { nama: 'SELAYANG BAHARU TIGA', ragu: false };
    if (/^(taman|tmn)\b/.test(u)) return { nama: 'TAMAN SELAYANG BAHARU', ragu: false };
    if (/hari malaysia|centre point/.test(p + ' ' + l)) return { nama: 'SELAYANG BAHARU SATU', ragu: false };
    var jm = l.match(/\b(?:jalan|jln)\s*(\d{1,2})/);
    if (jm) {
      var n = +jm[1];
      if (n >= 30 && n <= 39) return { nama: 'SELAYANG BAHARU SATU', ragu: false };
      if ((n >= 40 && n <= 44) || n === 46 || n === 49) return { nama: 'SELAYANG BAHARU DUA', ragu: false };
      if ([11, 13, 15, 20, 21, 22, 23, 24, 25, 29, 45, 47, 48, 60, 62, 63].indexOf(n) >= 0) return { nama: 'SELAYANG BAHARU TIGA', ragu: false };
    }
    return { nama: asal, ragu: true, nota: 'Sila pilih SELAYANG BAHARU SATU, DUA atau TIGA.' };
  }
  if (/batu 16/.test(u)) return { nama: 'BATU 16 RAWANG', ragu: false };
  if (/bendahara/.test(u)) return { nama: 'KAMPUNG BENDAHARA', ragu: false };
  if (/lembah mutiara/.test(u)) return { nama: 'LEMBAH MUTIARA', ragu: false };
  if (/sri melati/.test(u)) return { nama: 'SRI MELATI', ragu: false };
  if (/prima selayang/.test(u)) return { nama: 'PRIMA SELAYANG', ragu: false };
  var separa = rasmi.filter(function (n) { return n.toLowerCase().indexOf(u) >= 0; });
  if (separa.length === 1) return { nama: separa[0], ragu: false };
  return { nama: asal, ragu: true, nota: 'Nama UDM tidak dikenal pasti. Sila pilih dari senarai.' };
}

/** Kategori Rekod Lapangan bagi satu baris Jadual Operasi, atau '' jika tidak berkenaan. */
function kategoriDariJadual_(jenis, program, sasaran) {
  var j = bersih_(jenis).toLowerCase();
  var s = bersih_(sasaran).toLowerCase();
  if (!j) return '';
  if (/ziarah/.test(j)) {
    if (/ziarah udm/.test(j) || /petugas/.test(s)) return ''; // mesyuarat dalaman petugas, bukan ziarah pengundi
    return 'Ziarah';
  }
  if (/komuniti|engagement|walkabout/.test(j)) return 'Komuniti';
  return '';
}

function nomborCula_(v) {
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v === 'number') return v <= 1 ? Math.round(v * 1000) / 10 : v;
  var m = String(v).match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  var n = parseFloat(m[0].replace(',', '.'));
  return n <= 1 && String(v).indexOf('%') < 0 ? Math.round(n * 1000) / 10 : n;
}

/** Baca baris tab DUN asal (satu baris setiap UDM) kepada objek. */
function huraiBarisDunAsal_(row, dunKey) {
  // Lajur pertama yang berupa nombor = Bil.
  var iBil = -1;
  for (var i = 0; i < Math.min(row.length, 3); i++) {
    var v = row[i];
    if (typeof v === 'number' || /^\s*\d{1,3}\s*$/.test(String(v))) { iBil = i; break; }
  }
  if (iBil < 0) return null;
  var nama = namaUdm_(row[iBil + 1]);
  if (!nama) return null;
  var iSenarai = iBil + 2;
  var f = function (k) { return row[iSenarai + k] === undefined ? '' : row[iSenarai + k]; };
  var u = {
    bil: Number(String(row[iBil]).trim()),
    udm: nama,
    cawangan: pecahCawangan_(row[iSenarai]),
    profil: f(1), kluster: f(2), aktivitiSesuai: f(3), keutamaan: f(4),
    aktivitiDijalankan: f(5), pic: f(6), status: f(7), catatan: f(8), cula: dunKey === 'N15' ? f(9) : ''
  };
  ['profil', 'kluster', 'aktivitiSesuai', 'keutamaan', 'aktivitiDijalankan', 'pic', 'status', 'catatan'].forEach(function (k) {
    u[k] = String(u[k] === null || u[k] === undefined ? '' : u[k]).trim();
  });
  if (!u.cawangan.length) u.cawangan = [{ kod: '', nama: '' }];
  return u;
}

/** Bina baris tab DUN baharu dari senarai UDM. Pulang {values, groups:[{start, size}]}. */
function binaBarisDun_(udms) {
  var values = [];
  var groups = [];
  udms.forEach(function (u) {
    groups.push({ start: values.length, size: u.cawangan.length });
    u.cawangan.forEach(function (c, idx) {
      var r = new Array(DUN_HEADER.length).fill('');
      r[DUN_COL.kod] = c.kod;
      r[DUN_COL.cawangan] = c.nama;
      if (idx === 0) {
        r[DUN_COL.bil] = u.bil;
        r[DUN_COL.udm] = u.udm;
        r[DUN_COL.profil] = u.profil;
        r[DUN_COL.kluster] = u.kluster;
        r[DUN_COL.aktivitiSesuai] = u.aktivitiSesuai;
        r[DUN_COL.keutamaan] = u.keutamaan;
        r[DUN_COL.aktivitiDijalankan] = u.aktivitiDijalankan;
        r[DUN_COL.pic] = u.pic;
        r[DUN_COL.status] = u.status;
        r[DUN_COL.catatan] = u.catatan;
        r[DUN_COL.cula] = u.cula;
      }
      values.push(r);
    });
  });
  return { values: values, groups: groups };
}

/** Baca tab DUN baharu (nilai dari baris DUN_DATA_ROW) kepada senarai UDM. */
function bacaBarisDun_(values, rowOffset) {
  var udms = [];
  var semasa = null;
  values.forEach(function (r, i) {
    var namaUdm = bersih_(r[DUN_COL.udm]);
    if (namaUdm) {
      semasa = {
        bil: r[DUN_COL.bil] === '' ? udms.length + 1 : Number(r[DUN_COL.bil]),
        udm: namaUdm,
        profil: bersih_(r[DUN_COL.profil]),
        kluster: bersih_(r[DUN_COL.kluster]),
        aktivitiSesuai: bersih_(r[DUN_COL.aktivitiSesuai]),
        keutamaan: bersih_(r[DUN_COL.keutamaan]),
        aktivitiDijalankan: String(r[DUN_COL.aktivitiDijalankan] || '').trim(),
        pic: bersih_(r[DUN_COL.pic]),
        status: bersih_(r[DUN_COL.status]),
        catatan: String(r[DUN_COL.catatan] || '').trim(),
        cula: nomborCula_(r[DUN_COL.cula]),
        baris: i + rowOffset,
        cawangan: []
      };
      udms.push(semasa);
    }
    if (semasa && (bersih_(r[DUN_COL.kod]) || bersih_(r[DUN_COL.cawangan]))) {
      semasa.cawangan.push({ kod: bersih_(r[DUN_COL.kod]), nama: bersih_(r[DUN_COL.cawangan]) });
    }
  });
  return udms;
}

/** Normalkan baris Jadual Operasi (tarikh dibawa ke bawah, format tarikh, nama UDM). */
function normalJadual_(rows, senaraiRasmi) {
  var tarikhLepas = null;
  var hariLepas = '';
  var out = [];
  var ragu = [];
  rows.forEach(function (raw) {
    var r = raw.slice(0, JADUAL_HEADER.length);
    while (r.length < JADUAL_HEADER.length) r.push('');
    var adaIsi = r.slice(2).some(function (v) { return bersih_(v) !== ''; });
    if (!adaIsi && !bersih_(r[0])) return;
    var t = hurai_Tarikh_(r[JC.tarikh]);
    if (t) { tarikhLepas = t; hariLepas = ''; }
    else if (!bersih_(r[JC.tarikh])) t = tarikhLepas;
    var baris = r.map(function (v, i) {
      if (ialahTarikh_(v)) return i === JC.tarikh ? v : formatMasa_(v);
      return v === null || v === undefined ? '' : v;
    });
    if (t) {
      baris[JC.tarikh] = formatTarikh_(t);
      baris[JC.hari] = hariBagi_(t);
    } else {
      baris[JC.tarikh] = bersih_(r[JC.tarikh]);
      baris[JC.hari] = bersih_(r[JC.hari]) || hariLepas;
    }
    hariLepas = baris[JC.hari];
    var s = seragamUdm_(r[JC.udm], r[JC.dm], r[JC.lokaliti], r[JC.program], senaraiRasmi);
    baris[JC.udm] = s.nama;
    if (s.nama && !s.ragu) baris[JC.dm] = s.nama;
    ['masa', 'lokaliti', 'jenis', 'program', 'sasaran', 'calon', 'pic', 'jentera', 'status', 'isu', 'tindakan'].forEach(function (k) {
      baris[JC[k]] = bersih_(baris[JC[k]]);
    });
    if (s.ragu) ragu.push({ index: out.length, nota: s.nota });
    out.push(baris);
  });
  return { rows: out, ragu: ragu };
}

/** Baris Rekod Lapangan yang dijana dari Jadual Operasi (seed awal). */
function rekodDariJadual_(jadualRows, cap) {
  var out = [];
  jadualRows.forEach(function (r) {
    var kat = kategoriDariJadual_(r[JC.jenis], r[JC.program], r[JC.sasaran]);
    if (!kat) return;
    if (CFG.PERINGKAT.indexOf(r[JC.udm]) >= 0) return;
    var rec = new Array(REKOD_HEADER.length).fill('');
    rec[RC.tarikh] = r[JC.tarikh];
    rec[RC.dun] = 'N15';
    rec[RC.udm] = r[JC.udm];
    rec[RC.cawangan] = r[JC.lokaliti];
    rec[RC.kategori] = kat;
    rec[RC.nama] = r[JC.program] || r[JC.jenis];
    rec[RC.pic] = r[JC.pic];
    rec[RC.catatan] = [r[JC.jenis], r[JC.sasaran] ? 'Sasaran: ' + r[JC.sasaran] : ''].filter(Boolean).join(' · ');
    rec[RC.sumber] = 'Jadual Operasi';
    rec[RC.direkod] = cap || '';
    out.push(rec);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Persediaan awal (sekali sahaja)                                     */
/* ------------------------------------------------------------------ */

function persediaanAwal() {
  var props = PropertiesService.getScriptProperties();
  var ui = ui_();
  if (props.getProperty('PERSEDIAAN_SIAP')) {
    beritahu_('Persediaan awal sudah dijalankan pada ' + props.getProperty('PERSEDIAAN_SIAP') + '. Tiada apa diubah.');
    return;
  }
  if (ui) {
    var jawapan = ui.alert('Persediaan awal',
      'Skrip akan:\n• Buat salinan backup fail ini dalam Google Drive\n• Susun semula tab N.15 Templer & N.13 Kuang (satu baris setiap cawangan; tab asal disimpan & disembunyikan)\n• Betulkan tab Jadual Operasi (tajuk, tarikh, nama UDM, Status kosong merah)\n• Cipta tab Rekod Lapangan dan Tetapan\n\nTeruskan?',
      ui.ButtonSet.YES_NO);
    if (jawapan !== ui.Button.YES) return;
  }

  var ss = ss_();
  var zon = ss.getSpreadsheetTimeZone();
  var cap = Utilities.formatDate(new Date(), zon, 'yyyy-MM-dd HH:mm');

  // 1. Backup
  var backup = DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + ' (BACKUP ' + cap + ')');

  // 2. Tab DUN
  var rasmi = [];
  Object.keys(CFG.DUN).forEach(function (key) {
    var udms = susunSemulaTabDun_(ss, key);
    udms.forEach(function (u) { rasmi.push(u.udm); });
  });

  // 3. Jadual Operasi
  var jadual = betulkanJadual_(ss, rasmi);

  // 4. Rekod Lapangan (seed dari Jadual Operasi)
  var bilRekod = sediakanRekod_(ss, jadual.rows, rasmi, cap);

  // 5. Tetapan
  sediakanTetapan_(ss);

  props.setProperty('PERSEDIAAN_SIAP', cap);
  beritahu_('Selesai\n' +
    'Backup: ' + backup.getName() + '\n' +
    'UDM dikenal pasti: ' + rasmi.length + '\n' +
    'Baris Jadual Operasi: ' + jadual.rows.length + ' (perlu semakan nama UDM: ' + jadual.ragu.length + ', ditanda kuning)\n' +
    'Rekod Lapangan awal: ' + bilRekod);
}

function ui_() {
  try { return SpreadsheetApp.getUi(); } catch (e) { return null; }
}

function beritahu_(mesej) {
  Logger.log(mesej);
  var ui = ui_();
  if (ui) ui.alert(mesej);
}

function susunSemulaTabDun_(ss, key) {
  var cfg = CFG.DUN[key];
  var asal = ss.getSheetByName(cfg.tab);
  if (!asal) throw new Error('Tab "' + cfg.tab + '" tidak dijumpai.');
  var namaAsal = cfg.tab + ' (asal)';
  if (ss.getSheetByName(namaAsal)) throw new Error('Tab "' + namaAsal + '" sudah wujud. Persediaan mungkin pernah dijalankan.');

  var nilai = asal.getDataRange().getValues();
  var tajuk = bersih_(nilai[0] && nilai[0].filter(function (v) { return bersih_(v); })[0]);
  var subtajuk = bersih_(nilai[1] && nilai[1].filter(function (v) { return bersih_(v); })[0]);
  var udms = [];
  nilai.forEach(function (row, i) {
    if (i < 2) return;
    var u = huraiBarisDunAsal_(row, key);
    if (u) udms.push(u);
  });
  if (udms.length < 3) throw new Error('Hanya ' + udms.length + ' UDM dijumpai dalam "' + cfg.tab + '". Tiada perubahan dibuat pada tab ini.');

  var index = asal.getIndex();
  asal.setName(namaAsal);
  var baru = ss.insertSheet(cfg.tab, index - 1);
  asal.hideSheet();

  var bina = binaBarisDun_(udms);
  var lebar = DUN_HEADER.length;
  baru.getRange(1, 1).setValue(tajuk || ('MASTER MATRIX – ' + cfg.nama)).setFontWeight('bold').setFontSize(14);
  baru.getRange(2, 1).setValue(subtajuk).setFontColor('#55625A');
  baru.getRange(3, 1, 1, lebar).setValues([DUN_HEADER])
    .setFontWeight('bold').setBackground(CFG.WARNA_UTAMA).setFontColor('#FFFFFF').setWrap(true).setVerticalAlignment('middle');
  baru.setFrozenRows(3);
  if (bina.values.length) {
    var data = baru.getRange(DUN_DATA_ROW, 1, bina.values.length, lebar);
    data.setNumberFormat('@').setValues(bina.values.map(function (r) {
      return r.map(function (v) { return v === null || v === undefined ? '' : String(v); });
    }));
    baru.getRange(DUN_DATA_ROW, DUN_COL.cula + 1, bina.values.length, 1).setNumberFormat('0"%"');
    data.setVerticalAlignment('middle').setWrap(true).setFontSize(10);
    bina.groups.forEach(function (g, gi) {
      var mula = DUN_DATA_ROW + g.start;
      baru.getRange(mula, 1, g.size, lebar).setBackground(gi % 2 ? '#F3F7F4' : '#FFFFFF')
        .setBorder(true, null, true, null, null, null, '#9FB3A6', SpreadsheetApp.BorderStyle.SOLID);
      if (g.size > 1) {
        DUN_GROUP_COLS.forEach(function (c) { baru.getRange(mula, c + 1, g.size, 1).merge(); });
      }
    });
    var akhir = DUN_DATA_ROW + bina.values.length - 1;
    pasangValidasiDun_(baru, akhir);
  }
  [50, 190, 70, 260, 170, 200, 200, 90, 220, 120, 110, 220, 90].forEach(function (w, i) { baru.setColumnWidth(i + 1, w); });
  // Nombor Bil & cula sebagai nombor, bukan teks
  if (bina.values.length) {
    var bil = baru.getRange(DUN_DATA_ROW, 1, bina.values.length, 1);
    bil.setNumberFormat('0').setValues(bina.values.map(function (r) { return [r[0] === '' ? '' : Number(r[0])]; }))
      .setHorizontalAlignment('center').setFontWeight('bold');
  }
  return udms;
}

function pasangValidasiDun_(sheet, akhir) {
  var n = akhir - DUN_DATA_ROW + 1;
  var status = sheet.getRange(DUN_DATA_ROW, DUN_COL.status + 1, n, 1);
  status.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CFG.STATUS, true).setAllowInvalid(true).build());
  sheet.getRange(DUN_DATA_ROW, DUN_COL.keutamaan + 1, n, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CFG.KEUTAMAAN, true).setAllowInvalid(true).build());
  var formula = '=AND(LEN($B' + DUN_DATA_ROW + ')>0,LEN($K' + DUN_DATA_ROW + ')=0)';
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula)
    .setBackground('#F8D7DA').setFontColor('#9B1C1C').setRanges([status]).build());
  sheet.setConditionalFormatRules(rules);
}

function betulkanJadual_(ss, rasmi) {
  var sh = ss.getSheetByName(CFG.TAB_JADUAL);
  if (!sh) throw new Error('Tab "' + CFG.TAB_JADUAL + '" tidak dijumpai.');
  var nilai = sh.getDataRange().getValues();
  // Cari baris header: sel pertama yang bermula dengan "Tarikh"
  var h = 0;
  for (var i = 0; i < Math.min(nilai.length, 10); i++) {
    if (/^tarikh\b/i.test(bersih_(nilai[i][0])) && /hari/i.test(bersih_(nilai[i][1]))) { h = i; break; }
  }
  var dataAsal = nilai.slice(h + 1);
  // Jika sel header bercantum dengan data (cth "Tarikh 18 Oktober 2026"), pisahkan
  var hdr = nilai[h];
  var tercantum = hurai_Tarikh_(bersih_(hdr[0]).replace(/^tarikh\s*/i, ''));
  if (tercantum) {
    var barisPisah = hdr.map(function (v, idx) {
      return bersih_(v).replace(new RegExp('^' + JADUAL_HEADER[idx].replace(/[.*+?^$(){}|[\]\\]/g, '\\$&') + '\\s*', 'i'), '');
    });
    dataAsal.unshift(barisPisah);
  }
  var norm = normalJadual_(dataAsal, rasmi);

  var backupNama = CFG.TAB_JADUAL + ' (asal)';
  if (!ss.getSheetByName(backupNama)) {
    sh.copyTo(ss).setName(backupNama).hideSheet();
  }
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  sh.clearConditionalFormatRules();
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();
  var lebar = JADUAL_HEADER.length;
  sh.getRange(1, 1, 1, lebar).setValues([JADUAL_HEADER]).setFontWeight('bold')
    .setBackground(CFG.WARNA_UTAMA).setFontColor('#FFFFFF').setWrap(true).setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  if (norm.rows.length) {
    var rg = sh.getRange(2, 1, norm.rows.length, lebar);
    rg.setNumberFormat('@').setValues(norm.rows.map(function (r) {
      return r.map(function (v) { return ialahTarikh_(v) ? formatTarikh_(hurai_Tarikh_(v)) : String(v); });
    })).setWrap(true).setVerticalAlignment('middle');
    norm.ragu.forEach(function (q) {
      sh.getRange(2 + q.index, JC.udm + 1).setBackground('#FFF3BF').setNote(q.nota);
    });
  }
  pasangValidasiJadual_(sh, rasmi);
  return norm;
}

function pasangValidasiJadual_(sh, rasmi) {
  var n = Math.max(sh.getMaxRows() - 1, 1);
  var senarai = rasmi.concat(CFG.PERINGKAT);
  sh.getRange(2, JC.udm + 1, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(senarai, true).setAllowInvalid(true).build());
  var status = sh.getRange(2, JC.status + 1, n, 1);
  status.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CFG.STATUS, true).setAllowInvalid(true).build());
  sh.getRange(2, 1, n, 1).setNumberFormat('@');
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(LEN($A2)>0,LEN($M2)=0)')
      .setBackground('#F8D7DA').setFontColor('#9B1C1C').setRanges([status]).build()
  ]);
}

function sediakanRekod_(ss, jadualRows, rasmi, cap) {
  var sh = ss.getSheetByName(CFG.TAB_REKOD);
  if (!sh) sh = ss.insertSheet(CFG.TAB_REKOD);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, REKOD_HEADER.length).setValues([REKOD_HEADER]).setFontWeight('bold')
      .setBackground(CFG.WARNA_UTAMA).setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  var seed = rekodDariJadual_(jadualRows, cap);
  if (seed.length) {
    sh.getRange(sh.getLastRow() + 1, 1, seed.length, REKOD_HEADER.length).setNumberFormat('@').setValues(seed);
  }
  var n = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, RC.kategori + 1, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CFG.KATEGORI, true).setAllowInvalid(false).build());
  sh.getRange(2, RC.dun + 1, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(CFG.DUN), true).setAllowInvalid(false).build());
  sh.getRange(2, RC.udm + 1, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(rasmi, true).setAllowInvalid(true).build());
  sh.getRange(2, 1, n, 1).setNumberFormat('@');
  [130, 60, 210, 90, 220, 90, 240, 120, 260, 120, 130].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  return seed.length;
}

function sediakanTetapan_(ss) {
  var sh = ss.getSheetByName(CFG.TAB_TETAPAN);
  if (!sh) sh = ss.insertSheet(CFG.TAB_TETAPAN);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 2).setValues([['Kunci', 'Nilai']]).setFontWeight('bold');
    sh.getRange(2, 1, TETAPAN_LALAI.length, 2).setValues(TETAPAN_LALAI);
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(2, 480);
  }
}

/* ------------------------------------------------------------------ */
/* Kunci API                                                           */
/* ------------------------------------------------------------------ */

function kunciApi_() {
  var props = PropertiesService.getScriptProperties();
  var k = props.getProperty('API_KEY');
  if (!k) {
    k = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty('API_KEY', k);
  }
  return k;
}

function paparKunci() {
  var k = kunciApi_();
  beritahu_('Salin kunci ini ke Netlify sebagai environment variable APPS_SCRIPT_KEY:\n\n' + k +
    '\n\nJangan kongsi kunci ini di tempat awam.');
}

function semakData() {
  var d = {};
  Object.keys(CFG.DUN).forEach(function (k) { d[k] = bacaDun_(k).length + ' UDM'; });
  d.rekod = bacaRekod_(null).length + ' rekod';
  d.jadual = bacaJadual_().length + ' program';
  beritahu_(JSON.stringify(d, null, 2));
}

/* ------------------------------------------------------------------ */
/* Baca data                                                           */
/* ------------------------------------------------------------------ */

function ss_() {
  try {
    var aktif = SpreadsheetApp.getActiveSpreadsheet();
    if (aktif && aktif.getId() === SHEET_ID) return aktif;
  } catch (e) { /* skrip berasingan */ }
  return SpreadsheetApp.openById(SHEET_ID);
}

function bacaDun_(key) {
  var cfg = CFG.DUN[key];
  if (!cfg) throw new Error('DUN tidak sah: ' + key);
  var sh = ss_().getSheetByName(cfg.tab);
  if (!sh) throw new Error('Tab "' + cfg.tab + '" tidak dijumpai.');
  var akhir = sh.getLastRow();
  if (akhir < DUN_DATA_ROW) return [];
  var values = sh.getRange(DUN_DATA_ROW, 1, akhir - DUN_DATA_ROW + 1, DUN_HEADER.length).getValues();
  return bacaBarisDun_(values, DUN_DATA_ROW);
}

function bacaRekod_(dun) {
  var sh = ss_().getSheetByName(CFG.TAB_REKOD);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, REKOD_HEADER.length).getDisplayValues();
  var out = [];
  values.forEach(function (r, i) {
    if (!bersih_(r[RC.kategori]) && !bersih_(r[RC.udm])) return;
    if (dun && bersih_(r[RC.dun]) !== dun) return;
    out.push({
      baris: i + 2,
      tarikh: bersih_(r[RC.tarikh]), dun: bersih_(r[RC.dun]), udm: bersih_(r[RC.udm]),
      kod: bersih_(r[RC.kod]), cawangan: bersih_(r[RC.cawangan]), kategori: bersih_(r[RC.kategori]),
      nama: bersih_(r[RC.nama]), pic: bersih_(r[RC.pic]), catatan: String(r[RC.catatan] || '').trim(),
      sumber: bersih_(r[RC.sumber])
    });
  });
  return out;
}

function bacaJadual_() {
  var sh = ss_().getSheetByName(CFG.TAB_JADUAL);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, JADUAL_HEADER.length).getDisplayValues();
  var out = [];
  values.forEach(function (r, i) {
    if (!r.some(function (v) { return bersih_(v); })) return;
    var o = { baris: i + 2 };
    Object.keys(JC).forEach(function (k) { o[k] = bersih_(r[JC[k]]); });
    out.push(o);
  });
  return out;
}

function bacaTetapan_() {
  var t = {};
  TETAPAN_LALAI.forEach(function (kv) { t[kv[0]] = kv[1]; });
  var sh = ss_().getSheetByName(CFG.TAB_TETAPAN);
  if (sh && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getDisplayValues().forEach(function (r) {
      if (bersih_(r[0])) t[bersih_(r[0])] = String(r[1]);
    });
  }
  return t;
}

/* ------------------------------------------------------------------ */
/* Tulis data                                                          */
/* ------------------------------------------------------------------ */

function tambahRekod_(p) {
  var kat = bersih_(p.kategori);
  if (CFG.KATEGORI.indexOf(kat) < 0) throw new Error('Kategori mesti Ziarah, Al Malak atau Komuniti.');
  var dun = bersih_(p.dun);
  if (!CFG.DUN[dun]) throw new Error('DUN tidak sah.');
  var udms = bacaDun_(dun);
  var udm = udms.filter(function (u) { return u.udm === bersih_(p.udm); })[0];
  if (!udm) throw new Error('UDM tidak dijumpai dalam ' + CFG.DUN[dun].nama + '.');
  var t = hurai_Tarikh_(p.tarikh);
  if (!t) throw new Error('Tarikh tidak sah.');
  var nama = bersih_(p.nama);
  if (!nama) throw new Error(kat === 'Al Malak' ? 'Nama Al Malak wajib diisi.' : 'Nama program / komuniti wajib diisi.');
  var sh = ss_().getSheetByName(CFG.TAB_REKOD);
  if (!sh) throw new Error('Tab Rekod Lapangan tidak dijumpai. Jalankan persediaan awal.');
  var cap = Utilities.formatDate(new Date(), ss_().getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm');
  var rec = new Array(REKOD_HEADER.length).fill('');
  rec[RC.tarikh] = formatTarikh_(t);
  rec[RC.dun] = dun;
  rec[RC.udm] = udm.udm;
  rec[RC.kod] = bersih_(p.kod);
  rec[RC.cawangan] = bersih_(p.cawangan);
  rec[RC.kategori] = kat;
  rec[RC.nama] = nama.slice(0, 300);
  rec[RC.pic] = bersih_(p.pic).slice(0, 120);
  rec[RC.catatan] = String(p.catatan || '').trim().slice(0, 2000);
  rec[RC.sumber] = '/admin';
  rec[RC.direkod] = cap;
  var baris = sh.getLastRow() + 1;
  sh.getRange(baris, 1, 1, rec.length).setNumberFormat('@').setValues([rec]);
  return { baris: baris };
}

function kemaskiniUdm_(p) {
  var dun = bersih_(p.dun);
  var cfg = CFG.DUN[dun];
  if (!cfg) throw new Error('DUN tidak sah.');
  var udm = bacaDun_(dun).filter(function (u) { return u.udm === bersih_(p.udm); })[0];
  if (!udm) throw new Error('UDM tidak dijumpai.');
  var sh = ss_().getSheetByName(cfg.tab);
  var f = p.medan || {};
  var peta = { pic: DUN_COL.pic, keutamaan: DUN_COL.keutamaan, status: DUN_COL.status, catatan: DUN_COL.catatan, cula: DUN_COL.cula };
  Object.keys(peta).forEach(function (k) {
    if (!(k in f)) return;
    var v = f[k];
    if (k === 'status' && v && CFG.STATUS.indexOf(v) < 0) throw new Error('Status tidak sah.');
    if (k === 'keutamaan' && v && CFG.KEUTAMAAN.indexOf(v) < 0) throw new Error('Keutamaan tidak sah.');
    if (k === 'cula') {
      v = v === '' || v === null ? '' : Math.max(0, Math.min(100, Number(v)));
      if (v !== '' && isNaN(v)) throw new Error('Peratus cula mesti nombor 0–100.');
    } else {
      v = String(v || '').trim().slice(0, 2000);
    }
    sh.getRange(udm.baris, peta[k] + 1).setValue(v);
  });
  return { baris: udm.baris };
}

function kemaskiniJadual_(p) {
  var sh = ss_().getSheetByName(CFG.TAB_JADUAL);
  var baris = Number(p.baris);
  if (!sh || !(baris >= 2) || baris > sh.getLastRow()) throw new Error('Baris jadual tidak sah.');
  var f = p.medan || {};
  var peta = { status: JC.status, pic: JC.pic, calon: JC.calon, isu: JC.isu, tindakan: JC.tindakan, udm: JC.udm };
  Object.keys(peta).forEach(function (k) {
    if (!(k in f)) return;
    var v = String(f[k] || '').trim().slice(0, 2000);
    if (k === 'status' && v && CFG.STATUS.indexOf(v) < 0) throw new Error('Status tidak sah.');
    sh.getRange(baris, peta[k] + 1).setValue(v);
    if (k === 'udm') {
      sh.getRange(baris, JC.dm + 1).setValue(v);
      sh.getRange(baris, JC.udm + 1).setBackground(null).clearNote();
    }
  });
  return { baris: baris };
}

function simpanTetapan_(p) {
  var sh = ss_().getSheetByName(CFG.TAB_TETAPAN);
  if (!sh) throw new Error('Tab Tetapan tidak dijumpai.');
  var dibenar = TETAPAN_LALAI.map(function (kv) { return kv[0]; });
  var data = sh.getLastRow() >= 2 ? sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues() : [];
  var t = p.tetapan || {};
  Object.keys(t).forEach(function (k) {
    if (dibenar.indexOf(k) < 0) return;
    var v = String(t[k] === null || t[k] === undefined ? '' : t[k]).slice(0, 1000);
    if (k === 'warna' && !/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error('Warna mesti dalam format #RRGGBB.');
    var idx = -1;
    for (var i = 0; i < data.length; i++) if (bersih_(data[i][0]) === k) { idx = i; break; }
    if (idx >= 0) sh.getRange(idx + 2, 2).setValue(v);
    else { sh.appendRow([k, v]); data.push([k, v]); }
  });
  return bacaTetapan_();
}

/* ------------------------------------------------------------------ */
/* Web app                                                             */
/* ------------------------------------------------------------------ */

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, perkhidmatan: 'dashboard-pengurusan-calon' });
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var kunci = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (!kunci || body.key !== kunci) return json_({ ok: false, error: 'Tidak dibenarkan.' });
    var tindakan = body.action;
    if (tindakan === 'data') {
      var dun = body.dun === 'N13' ? 'N13' : 'N15';
      return json_({ ok: true, data: {
        dun: dun,
        namaDun: CFG.DUN[dun].nama,
        tetapan: bacaTetapan_(),
        udm: bacaDun_(dun),
        rekod: bacaRekod_(dun),
        jadual: dun === 'N15' ? bacaJadual_() : [],
        senarai: { kategori: CFG.KATEGORI, status: CFG.STATUS, keutamaan: CFG.KEUTAMAAN }
      } });
    }
    if (tindakan === 'tetapan') return json_({ ok: true, data: bacaTetapan_() });
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var hasil;
      if (tindakan === 'tambahRekod') hasil = tambahRekod_(body);
      else if (tindakan === 'kemaskiniUdm') hasil = kemaskiniUdm_(body);
      else if (tindakan === 'kemaskiniJadual') hasil = kemaskiniJadual_(body);
      else if (tindakan === 'simpanTetapan') hasil = simpanTetapan_(body);
      else throw new Error('Tindakan tidak dikenali.');
      SpreadsheetApp.flush();
      return json_({ ok: true, data: hasil });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

// Untuk ujian di luar Apps Script (Node). Tiada kesan dalam Apps Script.
if (typeof module !== 'undefined') {
  module.exports = {
    pecahCawangan_: pecahCawangan_, namaUdm_: namaUdm_, hurai_Tarikh_: hurai_Tarikh_, formatTarikh_: formatTarikh_,
    hariBagi_: hariBagi_, formatMasa_: formatMasa_, seragamUdm_: seragamUdm_, kategoriDariJadual_: kategoriDariJadual_, nomborCula_: nomborCula_,
    huraiBarisDunAsal_: huraiBarisDunAsal_, binaBarisDun_: binaBarisDun_, bacaBarisDun_: bacaBarisDun_,
    normalJadual_: normalJadual_, rekodDariJadual_: rekodDariJadual_, JC: JC, DUN_COL: DUN_COL
  };
}
