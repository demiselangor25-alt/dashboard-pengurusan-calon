import type { Config, Context } from "@netlify/functions"
import { jsonRes, sudahLogMasuk } from "../lib/sesi.mts"

export default async (_req: Request, context: Context) => {
  return jsonRes({ ok: await sudahLogMasuk(context) })
}

export const config: Config = { path: "/api/sesi", method: "GET" }
