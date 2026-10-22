import type { Config, Context } from "@netlify/functions"
import { jsonRes, sudahLogMasuk } from "../lib/sesi.mts"
import { dataDun } from "../lib/sheet.mts"

export default async (req: Request, context: Context) => {
  if (!(await sudahLogMasuk(context))) return jsonRes({ ok: false, error: "Sila log masuk." }, 401)
  const url = new URL(req.url)
  const dun = url.searchParams.get("dun") === "N13" ? "N13" : "N15"
  const segar = url.searchParams.get("segar") === "1"
  try {
    const data = await dataDun(dun, segar)
    return jsonRes({ ok: true, data, dikemaskini: new Date().toISOString() })
  } catch (err) {
    console.error(err)
    return jsonRes({ ok: false, error: (err as Error).message || "Gagal membaca Google Sheet." }, 502)
  }
}

export const config: Config = { path: "/api/data", method: "GET" }
