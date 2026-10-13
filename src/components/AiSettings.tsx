import { useEffect, useState } from 'react'
import { AiError, askGemini, geminiKey, onDeviceAvailable, setGeminiKey } from '../lib/ai/llm'

/** Settings → AI coach: optional free Gemini key, on-device AI status, privacy note. */
export function AiSettings() {
  const [saved, setSaved] = useState(geminiKey())
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [device, setDevice] = useState(false)
  useEffect(() => {
    void onDeviceAvailable().then(setDevice)
  }, [])

  const test = async (key: string) => {
    setBusy(true)
    setStatus('Checking the key…')
    try {
      await askGemini(key, 'Reply with the single word OK.', [{ role: 'user', text: 'Test' }])
      setGeminiKey(key)
      setSaved(key)
      setDraft('')
      setStatus('Connected. The coach now uses Gemini when you’re online.')
    } catch (e) {
      setStatus(e instanceof AiError ? e.message : 'Could not reach Gemini.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="group">
        <div className="row">
          <span style={{ flex: 1 }}>Coach answers with</span>
          <span className="value">{saved ? 'Gemini (free key)' : device ? 'On-device AI' : 'Built-in coach'}</span>
        </div>
        {saved ? (
          <div className="row">
            <span className="grow"><span>Gemini key</span><span className="sub num">•••• {saved.slice(-4)}</span></span>
            <button type="button" className="link-btn" style={{ color: 'var(--danger)' }} onClick={() => { setGeminiKey(''); setSaved(''); setStatus('Key removed. The built-in coach answers offline.') }}>Remove</button>
          </div>
        ) : (
          <form className="row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (draft.trim()) void test(draft.trim()) }}>
            <input
              aria-label="Gemini API key"
              type="password"
              autoComplete="off"
              placeholder="Paste your key"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{ flex: 1, minWidth: 0, minHeight: 40, border: 0, background: 'transparent', fontSize: 16 }}
            />
            <button type="submit" className="btn small" disabled={!draft.trim() || busy}>{busy ? '…' : 'Connect'}</button>
          </form>
        )}
        {!saved && (
          <a className="row" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-ink)', fontWeight: 600 }}>
            <span style={{ flex: 1 }}>Get a free Gemini key</span>
            <span aria-hidden>↗</span>
          </a>
        )}
      </div>
      {status && <p className="sec-foot" role="status" style={{ marginBottom: 0 }}><b>{status}</b></p>}
      <p className="sec-foot">
        The built-in coach is free, offline and private. For full AI chat, get a <b>free</b> key (no card needed) from Google AI Studio and paste it above.
        The key stays on this phone. When you ask a question, the question and a short summary of your plan and stats go to Google, and Google may use
        free-tier data to improve its products. Remove the key any time.
      </p>
    </>
  )
}
