// Ujian API melalui pelayan ujian (perlu pelayan berjalan di PORT 8888).
import assert from 'node:assert';

const ASAS = process.env.ASAS || 'http://localhost:8888';
const H = { 'content-type': 'application/json', 'x-dashboard': '1' };
let lulus = 0;
async function uji(nama, fn) { await fn(); lulus++; console.log('✓', nama); }

let kuki = '';

await uji('data dilindungi tanpa log masuk', async () => {
  const r = await fetch(`${ASAS}/api/data?dun=N15`);
  assert.strictEqual(r.status, 401);
});

await uji('kata laluan salah ditolak', async () => {
  const r = await fetch(`${ASAS}/api/log-masuk`, { method: 'POST', headers: H, body: JSON.stringify({ kataLaluan: 'salah' }) });
  assert.strictEqual(r.status, 401);
});

await uji('permintaan tanpa header khas ditolak', async () => {
  const r = await fetch(`${ASAS}/api/log-masuk`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kataLaluan: 'ujian123' }) });
  assert.strictEqual(r.status, 400);
});

await uji('log masuk berjaya & kuki HttpOnly', async () => {
  const r = await fetch(`${ASAS}/api/log-masuk`, { method: 'POST', headers: H, body: JSON.stringify({ kataLaluan: process.env.SITE_PASSWORD || 'ujian123' }) });
  assert.strictEqual(r.status, 200);
  const sc = r.headers.getSetCookie();
  assert.ok(sc[0].includes('HttpOnly'));
  kuki = sc[0].split(';')[0];
});

await uji('kuki palsu ditolak', async () => {
  const r = await fetch(`${ASAS}/api/data?dun=N15`, { headers: { cookie: 'pc_sesi=v1.9999999999.palsu' } });
  assert.strictEqual(r.status, 401);
});

await uji('baca data N15 & N13', async () => {
  const a = await (await fetch(`${ASAS}/api/data?dun=N15`, { headers: { cookie: kuki } })).json();
  assert.ok(a.ok);
  assert.strictEqual(a.data.dun, 'N15');
  assert.ok(a.data.udm.length > 0);
  const b = await (await fetch(`${ASAS}/api/data?dun=N13`, { headers: { cookie: kuki } })).json();
  assert.strictEqual(b.data.dun, 'N13');
  assert.strictEqual(b.data.jadual.length, 0);
});

await uji('admin: tindakan tidak dikenali ditolak', async () => {
  const r = await fetch(`${ASAS}/api/admin`, { method: 'POST', headers: { ...H, cookie: kuki }, body: JSON.stringify({ action: 'padamSemua' }) });
  assert.strictEqual(r.status, 400);
});

await uji('admin: tambah rekod Al Malak lalu muncul dalam data', async () => {
  const r = await fetch(`${ASAS}/api/admin`, { method: 'POST', headers: { ...H, cookie: kuki }, body: JSON.stringify({ action: 'tambahRekod', dun: 'N15', udm: 'KAMPUNG BENDAHARA', kategori: 'Al Malak', tarikh: '22 Oktober 2026', nama: 'Ujian Al Malak' }) });
  assert.strictEqual(r.status, 200);
  const d = await (await fetch(`${ASAS}/api/data?dun=N15`, { headers: { cookie: kuki } })).json();
  assert.ok(d.data.rekod.some((x) => x.nama === 'Ujian Al Malak'));
});

await uji('log keluar membuang kuki', async () => {
  const r = await fetch(`${ASAS}/api/log-keluar`, { method: 'POST', headers: { ...H, cookie: kuki }, body: '{}' });
  assert.ok(r.headers.getSetCookie()[0].includes('Max-Age=0'));
});

console.log(`\n${lulus} ujian web lulus`);
