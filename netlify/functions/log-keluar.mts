import type { Config, Context } from "@netlify/functions"
import { buangKuki, jsonRes } from "../lib/sesi.mts"

export default async (_req: Request, context: Context) => {
  buangKuki(context)
  return jsonRes({ ok: true })
}

export const config: Config = { path: "/api/log-keluar", method: "POST" }
