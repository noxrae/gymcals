// Optional AI models — all free:
//   • Google Gemini with the user's own free API key (from aistudio.google.com, no card needed).
//     The request goes straight from the phone to Google; the key is stored only on this device.
//   • Chrome's built-in on-device model (Prompt API) when the browser offers it: free, private, no key.

export interface Turn { role: 'user' | 'coach'; text: string }

const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash']
const KEY = 'gymcals:gemini-key'
const TIMEOUT_MS = 25_000

export const geminiKey = () => {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}
export const setGeminiKey = (k: string) => {
  try {
    if (k) localStorage.setItem(KEY, k.trim())
    else localStorage.removeItem(KEY)
  } catch {
    // storage blocked — the key just isn't remembered
  }
}

export class AiError extends Error {
  constructor(message: string, public kind: 'key' | 'quota' | 'network' | 'other') {
    super(message)
  }
}

export async function askGemini(key: string, system: string, turns: Turn[], signal?: AbortSignal): Promise<string> {
  const recent = turns.slice(-10)
  // Gemini expects the conversation to open with a user turn.
  while (recent.length > 1 && recent[0].role !== 'user') recent.shift()
  const contents = recent.map((t) => ({ role: t.role === 'user' ? 'user' : 'model', parts: [{ text: t.text }] }))
  let lastErr: AiError | null = null
  for (const model of GEMINI_MODELS) {
    let res: Response
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
        }),
        signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (e) {
      throw new AiError((e as Error)?.name === 'TimeoutError' ? 'Gemini took too long to answer.' : 'No internet connection.', 'network')
    }
    if (res.status === 404) {
      lastErr = new AiError('Model not available.', 'other')
      continue
    }
    if (res.status === 400) {
      const body = await res.text().catch(() => '')
      if (/API_KEY_INVALID|API key not valid/i.test(body) || !body) throw new AiError('The Gemini key was rejected. Check it in Settings.', 'key')
      throw new AiError('Gemini could not answer that request.', 'other')
    }
    if (res.status === 401 || res.status === 403) throw new AiError('The Gemini key was rejected. Check it in Settings.', 'key')
    if (res.status === 429) throw new AiError('Gemini’s free daily limit is used up for now.', 'quota')
    if (!res.ok) throw new AiError(`Gemini error ${res.status}.`, 'other')
    const data = await res.json().catch(() => null)
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
    if (!text.trim()) throw new AiError('Gemini returned an empty answer.', 'other')
    return text.trim()
  }
  throw lastErr ?? new AiError('Gemini is unavailable.', 'other')
}

// ---- Chrome built-in AI (Prompt API), feature-detected ----
interface LM { prompt: (q: string) => Promise<string>; destroy?: () => void }
interface LMFactory { availability: () => Promise<string>; create: (o: unknown) => Promise<LM> }
const lmFactory = () => (globalThis as unknown as { LanguageModel?: LMFactory }).LanguageModel

export async function onDeviceAvailable() {
  try {
    const f = lmFactory()
    return !!f && (await f.availability()) === 'available'
  } catch {
    return false
  }
}

export async function askOnDevice(system: string, turns: Turn[]): Promise<string> {
  const f = lmFactory()
  if (!f) throw new AiError('On-device AI not available.', 'other')
  const history = turns.slice(-6, -1).map((t) => ({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text }))
  const session = await f.create({ initialPrompts: [{ role: 'system', content: system }, ...history] })
  try {
    const answer = await Promise.race([
      session.prompt(turns.at(-1)!.text),
      new Promise<never>((_, rej) => setTimeout(() => rej(new AiError('On-device AI took too long.', 'other')), 60_000)),
    ])
    if (!answer.trim()) throw new AiError('On-device AI returned an empty answer.', 'other')
    return answer.trim()
  } finally {
    session.destroy?.()
  }
}
