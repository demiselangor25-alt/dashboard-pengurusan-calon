// Data contoh untuk ujian tempatan sahaja (aktif bila MOCK_SHEET=1). Bentuk sama seperti respons Apps Script.

const tetapan: Record<string, string> = {
  tajuk: "Dashboard Pengurusan Calon",
  subtajuk_N15: "DUN N.15 Taman Templer · Parlimen P.097 Selayang · Selangor",
  subtajuk_N13: "DUN N.13 Kuang · Parlimen P.097 Selayang · Selangor",
  pengumuman: "Mesyuarat jentera UDM setiap Khamis, 9 malam.",
  pengumuman_aktif: "YA",
  warna: "#146C43",
}

const c = (n: number, nama: string[]) => nama.map((x, i) => ({ kod: String(n + i).padStart(3, "0"), nama: x }))

const udmN15 = [
  { bil: 1, udm: "BATU 16 RAWANG", profil: "Kampung + taman + ladang + perumahan", kluster: "Kg Melayu Bt 16, Batu 16/17", aktivitiSesuai: "Ziarah, Komuniti, Masjid/Surau, Wanita, Anak Muda, Warga Emas", keutamaan: "Tinggi", aktivitiDijalankan: "Ziarah,", pic: "", status: "", catatan: "", cula: null, baris: 4, cawangan: c(1, ["TMN TEMPLER BAIDURI", "TEMPLER SAUJANA", "BT 16 RAWANG"]) },
  { bil: 10, udm: "BANDAR BARU SELAYANG SELATAN", profil: "Bandar padat + apartment", kluster: "Jalan 3, Apt Dahlia", aktivitiSesuai: "Komuniti, Anak Muda, Wanita", keutamaan: "Tinggi", aktivitiDijalankan: "", pic: "", status: "Dalam Proses", catatan: "", cula: 35, baris: 7, cawangan: c(31, ["APT DAHLIA", "APT (A) DAHLIA", "APT (B) DAHLIA"]) },
  { bil: 11, udm: "KAMPUNG BENDAHARA", profil: "Kampung + perumahan + apartment", kluster: "Kg Bendahara, Bukit Botak, Selayang Mulia", aktivitiSesuai: "Ziarah, Komuniti, Masjid/Surau, Wanita, Anak Muda, Apartment", keutamaan: "Tinggi", aktivitiDijalankan: "1. Ziarah Kasih Apt Nilam & Kampung Bendahara\n2. Gempur Cakna Pengundi", pic: "HAK & Kempen", status: "", catatan: "", cula: null, baris: 10, cawangan: [{ kod: "013", nama: "KG BENDAHARA" }, { kod: "022", nama: "APT NILAM" }, { kod: "017", nama: "APT JULIA" }] },
  { bil: 15, udm: "TAMAN SELAYANG INDAH", profil: "Taman perumahan", kluster: "Tmn Selayang Indah / Tmn Seri Murni", aktivitiSesuai: "Ziarah, Komuniti", keutamaan: "Sederhana", aktivitiDijalankan: "", pic: "", status: "", catatan: "", cula: null, baris: 13, cawangan: c(1, ["TMN SELAYANG INDAH / TMN SERI MURNI"]) },
]

const udmN13 = [
  { bil: 1, udm: "PENGKALAN KUNDANG", profil: "", kluster: "", aktivitiSesuai: "", keutamaan: "", aktivitiDijalankan: "", pic: "", status: "", catatan: "", cula: null, baris: 4, cawangan: c(1, ["KG PENGKALAN KUNDANG", "TMN KUNDANG"]) },
  { bil: 2, udm: "SUNGAI SERAI", profil: "", kluster: "", aktivitiSesuai: "", keutamaan: "", aktivitiDijalankan: "", pic: "", status: "", catatan: "", cula: null, baris: 6, cawangan: c(1, ["KG SG SERAI"]) },
]

const rekod = [
  { baris: 2, tarikh: "25 September 2026", dun: "N15", udm: "KAMPUNG BENDAHARA", kod: "013", cawangan: "KG BENDAHARA", kategori: "Ziarah", nama: "Ziarah Kasih bersama komuniti", pic: "", catatan: "Sasaran: Pengundi Muda", sumber: "Jadual Operasi" },
  { baris: 3, tarikh: "22 September 2026", dun: "N15", udm: "KAMPUNG BENDAHARA", kod: "", cawangan: "Kg Bendahara", kategori: "Komuniti", nama: "Kunjungan Hormat NGO MCM", pic: "", catatan: "Engagement", sumber: "Jadual Operasi" },
  { baris: 4, tarikh: "20 Oktober 2026", dun: "N15", udm: "KAMPUNG BENDAHARA", kod: "022", cawangan: "APT NILAM", kategori: "Al Malak", nama: "[Nama contoh]", pic: "Aizun", catatan: "Contoh catatan <b>bukan html</b>", sumber: "/admin" },
  { baris: 5, tarikh: "30 Ogos 2026", dun: "N15", udm: "BANDAR BARU SELAYANG SELATAN", kod: "", cawangan: "Persiaran Pegawai BBS", kategori: "Komuniti", nama: "Briskwalk MAF 2026", pic: "", catatan: "", sumber: "Jadual Operasi" },
  { baris: 6, tarikh: "30 Ogos 2026", dun: "N15", udm: "BBS Utara & Selatan", kod: "", cawangan: "Taman BBS", kategori: "Komuniti", nama: "Pertemuan Geng Netball", pic: "", catatan: "", sumber: "Jadual Operasi" },
]

const jadual = [
  { baris: 2, tarikh: "18 Oktober 2026", hari: "Ahad", masa: "9pg", udm: "BANDAR BARU SELAYANG UTARA", dm: "BANDAR BARU SELAYANG UTARA", lokaliti: "Selayang Height", jenis: "SPR Tukar Tempat Pengundi", program: "Bersama SPR", sasaran: "DUN Taman Templer", calon: "", pic: "", jentera: "", status: "", isu: "", tindakan: "" },
  { baris: 3, tarikh: "26 September 2026", hari: "Sabtu", masa: "8.30pm", udm: "KAMPUNG BENDAHARA", dm: "KAMPUNG BENDAHARA", lokaliti: "Kg Bendahara", jenis: "Culaan", program: "Gempur Cakna Pengundi", sasaran: "", calon: "", pic: "", jentera: "", status: "Selesai", isu: "", tindakan: "" },
  { baris: 4, tarikh: "30 Ogos 2026", hari: "Ahad", masa: "10.00am", udm: "BBS Utara & Selatan", dm: "BBS Utara & Selatan", lokaliti: "Taman BBS", jenis: "Komuniti Geng Netball", program: "Pertemuan Geng Netball Court Taman BBS", sasaran: "", calon: "", pic: "", jentera: "", status: "", isu: "", tindakan: "" },
]

export function dataContoh(dun: string) {
  const d = dun === "N13" ? "N13" : "N15"
  return structuredClone({
    dun: d,
    namaDun: d === "N13" ? "N.13 Kuang" : "N.15 Taman Templer",
    tetapan,
    udm: d === "N13" ? udmN13 : udmN15,
    rekod: rekod.filter((r) => r.dun === d),
    jadual: d === "N15" ? jadual : [],
    senarai: { kategori: ["Ziarah", "Al Malak", "Komuniti"], status: ["Belum Mula", "Dalam Proses", "Selesai"], keutamaan: ["Tinggi", "Sederhana", "Rendah"] },
  })
}

export function tindakanContoh(action: string, payload: Record<string, unknown>) {
  if (action === "tambahRekod") {
    rekod.push({ baris: rekod.length + 2, tarikh: String(payload.tarikh), dun: String(payload.dun), udm: String(payload.udm), kod: String(payload.kod || ""), cawangan: String(payload.cawangan || ""), kategori: String(payload.kategori), nama: String(payload.nama), pic: String(payload.pic || ""), catatan: String(payload.catatan || ""), sumber: "/admin" })
    return { baris: rekod.length + 1 }
  }
  if (action === "simpanTetapan") {
    Object.assign(tetapan, payload.tetapan || {})
    return tetapan
  }
  return { ok: true }
}
