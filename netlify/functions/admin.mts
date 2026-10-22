import type { Config, Context } from "@netlify/functions"
import { jsonRes, permintaanSah, sudahLogMasuk } from "../lib/sesi.mts"
import { kosongkanCache, panggilSheet } from "../lib/sheet.mts"

const TINDAKAN = new Set(["tambahRekod", "kemaskiniUdm", "kemaskiniJadual", "simpanTetapan"])

export default async (req: Request, context: Context) => {
  if (!(await sudahLogMasuk(context))) return jsonRes({ ok: false, error: "Sila log masuk." }, 401)
  if (!permintaanSah(req)) return jsonRes({ ok: false, error: "Permintaan tidak sah." }, 400)
  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonRes({ ok: false, error: "Permintaan tidak sah." }, 400)
  }
  const { action, ...payload } = body || {}
  if (!TINDAKAN.has(action)) return jsonRes({ ok: false, error: "Tindakan tidak dikenali." }, 400)
  try {
    const data = await panggilSheet(action, payload)
    kosongkanCache()
    return jsonRes({ ok: true, data })
  } catch (err) {
    console.error(err)
    return jsonRes({ ok: false, error: (err as Error).message || "Gagal menulis ke Google Sheet." }, 502)
  }
}

export const config: Config = { path: "/api/admin", method: "POST" }
