import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { NavBar } from '../components/Chrome'
import { activeSource, ask, clearChat, useChat, type Source } from '../lib/ai/coach'
import { SUGGESTIONS } from '../lib/ai/local'

export const SOURCE_LABEL: Record<Source, string> = { gemini: 'Gemini · online', device: 'On-device AI', builtin: 'Built-in · offline' }

/** Renders the coach's light formatting: **bold**, numbered and bulleted lines. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const bullet = /^\s*(•|-|\*)\s+/.test(line)
        const numbered = /^\s*\d+\.\s+/.test(line)
        const body = line.replace(/^\s*(•|-|\*)\s+/, '')
        const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith('**') && p.endsWith('**') ? <b key={j}>{p.slice(2, -2)}</b> : <span key={j}>{p}</span>))
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginTop: i ? 4 : 0, paddingLeft: bullet || numbered ? 2 : 0 }}>
            {bullet && <span aria-hidden style={{ color: 'var(--accent)' }}>•</span>}
            <span>{parts}</span>
          </div>
        )
      })}
    </>
  )
}

export default function CoachScreen() {
  const { messages, thinking } = useChat()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState('')
  const [source, setSource] = useState<Source>('builtin')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void activeSource().then(setSource)
  }, [messages.length])
  // Questions sent from other screens arrive as ?q=…
  useEffect(() => {
    const q = params.get('q')
    if (q) {
      setParams({}, { replace: true })
      void ask(q)
    }
  }, [params, setParams])
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, thinking])

  const send = (q: string) => {
    setText('')
    void ask(q)
  }

  return (
    <div className="screen flush no-tabs" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}>
      <NavBar title="Coach" end={messages.length ? <button type="button" className="link-btn" style={{ fontSize: 15 }} onClick={clearChat}>Clear</button> : undefined} />
      <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <span className="small muted" style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--surface)' }}>{SOURCE_LABEL[source]}</span>
          {source === 'builtin' && <Link to="/settings?ai=1" className="small" style={{ padding: '8px 4px', fontWeight: 600 }}>Turn on full AI (free)</Link>}
        </div>

        {messages.length === 0 && (
          <div className="group" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="disp" style={{ fontSize: 40 }}>Your coach</span>
            <span className="muted" style={{ lineHeight: 1.5 }}>Ask about today’s workout, any exercise, food and protein, belly fat and abs, soreness or pain, missed days, or your progress. I use your own numbers to answer.</span>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 6, animation: 'enter .3s var(--ease) both' }}>
            <div
              style={{
                maxWidth: '86%', padding: '10px 14px', borderRadius: 18, fontSize: 15.5, lineHeight: 1.45,
                background: m.role === 'user' ? 'var(--btn)' : 'var(--surface)', color: m.role === 'user' ? 'var(--btn-ink)' : 'var(--label)',
                borderBottomRightRadius: m.role === 'user' ? 6 : 18, borderBottomLeftRadius: m.role === 'user' ? 18 : 6,
              }}
            >
              {m.role === 'coach' ? <RichText text={m.text} /> : m.text}
            </div>
            {m.role === 'coach' && (m.links?.length || m.note) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {m.links?.map((l) => <Link key={l.to} to={l.to} className="chip" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent-ink)', fontWeight: 600 }}>{l.label}</Link>)}
                {m.note && <span className="small muted">{m.note} Answered by the built-in coach.</span>}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div aria-live="polite" aria-label="Coach is thinking" style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: 18, background: 'var(--surface)', display: 'flex', gap: 5 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--label-3)', animation: `pop 1s ${i * 0.15}s infinite` }} />)}
          </div>
        )}
        <div ref={end} />
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, margin: '0 auto', maxWidth: 520, background: 'var(--bar)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderTop: '1px solid var(--sep)', padding: '8px 12px calc(env(safe-area-inset-bottom) + 10px)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
        <div className="chips">
          {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={thinking}>{s}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(text) }} style={{ display: 'flex', gap: 8 }}>
          <input
            aria-label="Ask your coach"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask anything…"
            enterKeyHint="send"
            style={{ flex: 1, minHeight: 46, borderRadius: 23, border: '1px solid var(--sep)', background: 'var(--surface)', padding: '0 16px', fontSize: 16 }}
          />
          <button type="submit" aria-label="Send" disabled={!text.trim() || thinking} style={{ width: 46, height: 46, borderRadius: 23, border: 0, background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: text.trim() ? 1 : 0.4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
          </button>
        </form>
      </div>
    </div>
  )
}
