import type { Config, Context } from "@netlify/functions"
import { ciptaToken, jsonRes, pasangKuki, permintaanSah, sahKataLaluan } from "../lib/sesi.mts"

export default async (req: Request, context: Context) => {
  if (!permintaanSah(req)) return jsonRes({ ok: false, error: "Permintaan tidak sah." }, 400)
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return jsonRes({ ok: false, error: "Permintaan tidak sah." }, 400)
  }
  try {
    if (!(await sahKataLaluan(body.kataLaluan))) {
      return jsonRes({ ok: false, error: "Kata laluan salah." }, 401)
    }
    pasangKuki(context, await ciptaToken())
    return jsonRes({ ok: true })
  } catch (err) {
    console.error(err)
    return jsonRes({ ok: false, error: "Konfigurasi pelayan belum lengkap." }, 500)
  }
}

export const config: Config = {
  path: "/api/log-masuk",
  method: "POST",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
}
