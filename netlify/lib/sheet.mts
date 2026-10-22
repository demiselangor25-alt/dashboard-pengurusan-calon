import { dataContoh, tindakanContoh } from "./contoh.mts"

const TTL_MS = 60 * 1000
const cache = new Map<string, { masa: number; data: unknown }>()

function modContoh(): boolean {
  return Netlify.env.get("MOCK_SHEET") === "1"
}

/** Panggil web app Apps Script yang dipasang pada Google Sheet. */
export async function panggilSheet(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  if (modContoh()) return action === "data" ? dataContoh(String(payload.dun)) : tindakanContoh(action, payload)

  const url = Netlify.env.get("APPS_SCRIPT_URL")
  const key = Netlify.env.get("APPS_SCRIPT_KEY")
  if (!url || !key) throw new Error("APPS_SCRIPT_URL / APPS_SCRIPT_KEY belum ditetapkan.")

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, key, action }),
    redirect: "follow",
  })
  const teks = await res.text()
  let json: any
  try {
    json = JSON.parse(teks)
  } catch {
    throw new Error(`Pangkalan data tidak memberi respons yang sah (HTTP ${res.status}).`)
  }
  if (!json.ok) throw new Error(json.error || "Ralat dari pangkalan data.")
  return json.data
}

export async function dataDun(dun: "N15" | "N13", segar = false): Promise<any> {
  const kunci = `data:${dun}`
  const ada = cache.get(kunci)
  if (!segar && ada && Date.now() - ada.masa < TTL_MS) return ada.data
  const data = await panggilSheet("data", { dun })
  cache.set(kunci, { masa: Date.now(), data })
  return data
}

export function kosongkanCache() {
  cache.clear()
}
