import type { Context } from "@netlify/functions"

export const NAMA_KUKI = "pc_sesi"
const TEMPOH_SAAT = 7 * 24 * 60 * 60 // 7 hari
const enc = new TextEncoder()

function base64url(buf: ArrayBuffer): string {
  let s = ""
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function samaMasa(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let beza = 0
  for (let i = 0; i < a.length; i++) beza |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return beza === 0
}

function env(nama: string): string {
  const v = Netlify.env.get(nama)
  if (!v) throw new Error(`Environment variable ${nama} belum ditetapkan.`)
  return v
}

async function tandatangan(data: string): Promise<string> {
  const kunci = await crypto.subtle.importKey(
    "raw",
    enc.encode(env("SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return base64url(await crypto.subtle.sign("HMAC", kunci, enc.encode(data)))
}

async function sha256(teks: string): Promise<string> {
  return base64url(await crypto.subtle.digest("SHA-256", enc.encode(teks)))
}

export async function sahKataLaluan(input: unknown): Promise<boolean> {
  if (typeof input !== "string" || !input || input.length > 200) return false
  const [a, b] = await Promise.all([sha256(input), sha256(env("SITE_PASSWORD"))])
  return samaMasa(a, b)
}

export async function ciptaToken(): Promise<string> {
  const tamat = Math.floor(Date.now() / 1000) + TEMPOH_SAAT
  const isi = `v1.${tamat}`
  return `${isi}.${await tandatangan(isi)}`
}

export async function sahToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const bahagian = token.split(".")
  if (bahagian.length !== 3 || bahagian[0] !== "v1") return false
  const tamat = Number(bahagian[1])
  if (!Number.isFinite(tamat) || tamat < Date.now() / 1000) return false
  return samaMasa(bahagian[2], await tandatangan(`${bahagian[0]}.${bahagian[1]}`))
}

export async function sudahLogMasuk(context: Context): Promise<boolean> {
  try {
    return await sahToken(context.cookies.get(NAMA_KUKI))
  } catch {
    return false
  }
}

export function pasangKuki(context: Context, token: string) {
  context.cookies.set({
    name: NAMA_KUKI,
    value: token,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    expires: new Date(Date.now() + TEMPOH_SAAT * 1000),
  })
}

export function buangKuki(context: Context) {
  context.cookies.delete({ name: NAMA_KUKI, path: "/" })
}

export function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })
}

/** Permintaan tulis mesti datang dari halaman kita sendiri (fetch dengan header khas). */
export function permintaanSah(req: Request): boolean {
  const ct = req.headers.get("content-type") || ""
  return ct.includes("application/json") && req.headers.get("x-dashboard") === "1"
}
