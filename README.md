# Dashboard Pengurusan Calon

Dashboard progress pengurusan calon untuk **DUN N.15 Taman Templer** dan **DUN N.13 Kuang**. Data utama datang dari Google Sheet "DATABASE PENGURUSAN CALON".

- `/` ialah dashboard N.15 dan `/kuang` ialah dashboard N.13. Setiap UDM ada kad sendiri dengan bilangan **Ziarah**, **Al Malak** dan **Komuniti**.
- `/udm?dun=N15&bil=11` ialah butiran satu UDM: senarai penuh ziarah, Al Malak dan komuniti, serta cawangan, profil dan jadual.
- `/admin` digunakan untuk tambah rekod lapangan, kemas kini UDM, status Jadual Operasi dan tetapan laman. Semua perubahan ditulis terus ke Google Sheet.
- Semua halaman dilindungi kata laluan. Kata laluan yang sama digunakan untuk dashboard dan /admin.

## Struktur

```
apps-script/Code.gs        Skrip yang dipasang pada Google Sheet (persediaan awal + API)
netlify/functions/         API website: log-masuk, log-keluar, sesi, data, admin
netlify/lib/               Sesi (kuki bertandatangan HMAC) & panggilan ke Apps Script
public/                    Halaman (HTML/CSS/JS biasa, tiada langkah build)
test/                      Pelayan ujian tempatan & ujian API
```

## Langkah 1: Pasang skrip pada Google Sheet

1. Buka Sheet, kemudian pilih **Extensions → Apps Script**.
2. Padam kod sedia ada, tampal seluruh kandungan `apps-script/Code.gs`, dan tekan **Save**.
3. Muat semula Sheet. Menu **Dashboard** akan muncul.
4. Pilih **Dashboard → 1. Persediaan awal (sekali sahaja)**. Google akan minta kebenaran; klik *Allow*. Skrip ini akan:
   - buat salinan **backup** fail dalam Google Drive;
   - susun semula tab `N.15 Templer` dan `N.13 Kuang` supaya setiap cawangan ada baris sendiri, dikelompokkan di bawah UDM (tab asal disimpan sebagai `… (asal)` dan disembunyikan);
   - betulkan `Jadual Operasi`: baris tajuk diasingkan, tarikh diformat seperti "27 Ogos 2026", nama UDM diseragamkan, dan Status kosong ditanda merah;
   - cipta tab `Rekod Lapangan` (diisi awal dengan ziarah dan komuniti dari Jadual Operasi) dan tab `Tetapan`.
5. Pilih **Deploy → New deployment → Web app**, dengan tetapan:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**

   Tekan **Deploy**, kemudian salin URL web app (berakhir dengan `/exec`).
6. Pilih **Dashboard → 2. Papar kunci API** dan salin kunci tersebut.

## Langkah 2: Environment variables di Netlify

Tetapkan di Netlify (Site configuration → Environment variables). Skop mesti merangkumi **Functions**.

| Nama | Nilai |
|---|---|
| `SITE_PASSWORD` | Kata laluan dashboard & /admin |
| `SESSION_SECRET` | Teks rawak panjang (sekurang-kurangnya 32 aksara) |
| `APPS_SCRIPT_URL` | URL web app dari Langkah 1.5 |
| `APPS_SCRIPT_KEY` | Kunci dari Langkah 1.6 |

Selepas menukar mana-mana nilai, **redeploy** site.

## Langkah 3: GitHub → Netlify

Push repo ini ke GitHub, kemudian sambungkan repo itu kepada site Netlify. Tetapan build:
- Build command: kosong
- Publish directory: `public`
- Functions directory: `netlify/functions` (sudah ditetapkan dalam `netlify.toml`)

## Data dalam Google Sheet

| Tab | Kegunaan |
|---|---|
| `N.15 Templer`, `N.13 Kuang` | Senarai UDM → cawangan (satu baris setiap cawangan), profil, keutamaan, PIC, status, % cula |
| `Rekod Lapangan` | Satu baris setiap **Ziarah / Al Malak / Komuniti**. Angka dalam kad UDM dikira dari tab ini. |
| `Jadual Operasi` | Program yang dirancang dan dijalankan (N.15) |
| `Tetapan` | Tajuk, subtajuk, pengumuman dan warna laman |

Nama UDM dalam `Rekod Lapangan` mesti sama tepat dengan nama dalam tab DUN (gunakan dropdown). Rekod yang namanya tidak sepadan akan disenaraikan di dashboard sebagai "belum dipadankan".

## Ujian tempatan

```bash
node --experimental-strip-types test/pelayan-ujian.mjs   # guna data contoh (MOCK_SHEET=1), kata laluan: ujian123
node apps-script/test/ujian.cjs                          # ujian logik skrip Sheet
node test/ujian-web.mjs                                  # ujian API (pelayan mesti sedang berjalan)
```
