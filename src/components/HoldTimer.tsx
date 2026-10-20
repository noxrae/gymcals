import { useEffect, useRef, useState } from 'react'
import type { Exercise } from '../data/exercises'
import type { PlanItem } from '../data/plan'
import { chime, holdAlarm, restTimer, unlockAudio } from '../lib/timer'
import { useWakeLock } from '../lib/wakeLock'
import { Portal } from './Chrome'

// Built-in timer for timed sets: holds (plank, L-sit, dead hang…), carries, intervals and cardio.
// Counts 3-2-1, then up toward the target, with a cue at the bottom and the top of the range.
// Time comes from timestamps, so it stays right even if the phone freezes the page.

type Phase = 'ready' | 'run' | 'switch' | 'review'

const READY = 3
const SWITCH = 5
const fmt = (sec: number, minutes: boolean) => (minutes ? `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}` : String(Math.floor(sec)))

export function HoldTimer({ ex, item, setNo, onSave, onClose }: { ex: Exercise; item: PlanItem; setNo: number; onSave: (value: number) => void; onClose: () => void }) {
  const cardio = ex.kind === 'cardio'
  const scale = cardio ? 60 : 1
  const min = item.min * scale
  const max = item.max * scale
  const sides = item.perSide && !cardio ? 2 : 1

  const [phase, setPhase] = useState<Phase>('ready')
  const [side, setSide] = useState(0)
  const [phaseStart, setPhaseStart] = useState(() => Date.now())
  const [results, setResults] = useState<number[]>([])
  const [now, setNow] = useState(() => Date.now())
  const cues = useRef({ target: false, top: false, last: -1 })
  useWakeLock(phase !== 'review')

  // Android back closes the timer instead of leaving the workout.
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    let popped = false
    history.pushState({ ...history.state, sheet: true }, '')
    const onPop = () => {
      popped = true
      close.current()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      holdAlarm.cancel()
      if (!popped && history.state?.sheet) history.back()
    }
  }, [])

  useEffect(() => {
    unlockAudio()
    restTimer.stop()
  }, [])

  useEffect(() => {
    if (phase === 'review') return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [phase])

  const elapsed = Math.max(0, (now - phaseStart) / 1000)
  const startRun = () => {
    const t = Date.now()
    setPhase('run')
    setPhaseStart(t)
    setNow(t)
    cues.current = { target: false, top: false, last: -1 }
    chime('go')
    holdAlarm.set(t + min * 1000, `${ex.name}: target reached`, cardio ? `${item.min} min done. Stop when you're ready and log it.` : `${min} seconds done. Open the app to stop the timer.`)
  }

  // Countdown ticks, then go.
  useEffect(() => {
    if (phase !== 'ready' && phase !== 'switch') return
    const total = phase === 'ready' ? READY : SWITCH
    const left = Math.ceil(total - elapsed)
    if (left <= 0) return startRun()
    if (left <= 3 && left !== cues.current.last) {
      cues.current.last = left
      chime('tick')
    }
  })

  // Target cues while running.
  useEffect(() => {
    if (phase !== 'run') return
    if (!cues.current.target && elapsed >= min) {
      cues.current.target = true
      chime('target')
    }
    if (!cues.current.top && max > min && elapsed >= max) {
      cues.current.top = true
      chime('top')
    }
  })

  const stop = () => {
    holdAlarm.cancel()
    const value = cardio ? Math.max(1, Math.round(elapsed / 60)) : Math.round(elapsed)
    const next = [...results, value]
    setResults(next)
    if (next.length < sides) {
      setSide(1)
      setPhase('switch')
      setPhaseStart(Date.now())
      cues.current.last = -1
    } else setPhase('review')
  }
  const redo = () => {
    setResults([])
    setSide(0)
    setPhase('ready')
    setPhaseStart(Date.now())
    cues.current = { target: false, top: false, last: -1 }
  }

  const unit = cardio ? 'min' : 'sec'
  const sideName = sides === 2 ? (side === 0 ? 'Left side' : 'Right side') : ''
  const logged = results.length ? Math.min(...results) : 0
  const runProgress = Math.min(1, elapsed / (max || 1))
  const countdown = phase === 'ready' ? Math.ceil(READY - elapsed) : phase === 'switch' ? Math.ceil(SWITCH - elapsed) : 0
  const status =
    phase === 'ready' ? 'Get into position' :
    phase === 'switch' ? 'Switch sides' :
    phase === 'run' ? (elapsed >= max ? 'Top of the range. Stop now.' : elapsed >= min ? 'Target reached. Keep going while form is clean.' : cardio ? 'Steady pace. You can still talk.' : 'Hold. Breathe steadily.') :
    ''

  const R = 112
  const C = 2 * Math.PI * R
  const reached = phase === 'run' && elapsed >= min

  return (
    <Portal>
      <div role="dialog" aria-modal="true" aria-label={`${ex.name} timer`} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--ink-card)', color: '#fff', display: 'flex', flexDirection: 'column', padding: 'calc(env(safe-area-inset-top) + 16px) 20px calc(env(safe-area-inset-bottom) + 20px)', animation: 'fade .2s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <span className="kicker" style={{ color: 'var(--accent)' }}>Set {setNo}{sideName ? ` · ${sideName}` : ''}</span>
          <button type="button" onClick={onClose} style={{ minHeight: 44, padding: '0 4px', background: 'none', border: 0, color: '#d1d1d6', fontSize: 16 }}>Close</button>
        </div>
        <h2 className="disp" style={{ fontSize: 44, margin: '4px 0 0' }}>{ex.name}</h2>
        <span style={{ color: '#a1a1a6', fontSize: 15 }}>Target {item.min}–{item.max} {unit}{sides === 2 ? ' each side' : ''}</span>

        {phase !== 'review' ? (
          <>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 260, height: 260 }}>
                <svg width="260" height="260" viewBox="0 0 260 260" aria-hidden>
                  <circle cx="130" cy="130" r={R} fill="none" stroke="#3a3a3c" strokeWidth="10" />
                  {phase === 'run' && <circle cx="130" cy="130" r={R} fill="none" stroke={reached ? 'var(--good-fill)' : 'var(--accent)'} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - runProgress)} transform="rotate(-90 130 130)" />}
                  {phase === 'run' && max > min && <line x1="130" y1="10" x2="130" y2="30" stroke="#fff" strokeWidth="3" transform={`rotate(${(min / max) * 360} 130 130)`} />}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="disp num" role="timer" aria-live="off" style={{ fontSize: phase === 'run' ? (cardio ? 76 : 104) : 120, lineHeight: 1 }}>{phase === 'run' ? fmt(elapsed, cardio) : countdown}</span>
                  <span style={{ color: '#a1a1a6', fontSize: 15, marginTop: 6 }}>{phase === 'run' ? (cardio ? 'min : sec' : 'seconds') : 'starting in'}</span>
                </div>
              </div>
            </div>
            <p aria-live="polite" style={{ textAlign: 'center', margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: reached ? 'var(--good-fill)' : '#fff', minHeight: 24 }}>{status}</p>
            {phase === 'run' ? (
              <button type="button" className="btn" style={{ background: '#fff', color: '#000' }} onClick={stop}>{sides === 2 && side === 0 ? 'Stop · switch sides' : 'Stop'}</button>
            ) : (
              <button type="button" className="btn" style={{ background: '#fff', color: '#000' }} onClick={startRun}>Start now</button>
            )}
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="disp num" style={{ fontSize: 120, lineHeight: 1 }}>{logged}</span>
              <span style={{ color: '#a1a1a6', fontSize: 17 }}>{unit === 'sec' ? 'seconds' : 'minutes'}</span>
              {sides === 2 && <span style={{ color: '#d1d1d6', fontSize: 15 }}>Left {results[0]} s · Right {results[1]} s · logs the shorter side</span>}
              <span style={{ color: logged >= item.min ? 'var(--good-fill)' : '#d1d1d6', fontSize: 15, fontWeight: 600 }}>
                {logged > item.max ? 'Above the range. Make it harder next time.' : logged >= item.min ? 'In the target range.' : 'Below the target. That’s fine, build up.'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" className="btn" style={{ background: '#fff', color: '#000' }} onClick={() => onSave(logged)}>Save set · {logged} {unit}</button>
              <button type="button" className="btn secondary" style={{ background: '#2c2c2e', color: '#fff' }} onClick={redo}>Redo</button>
            </div>
          </>
        )}
      </div>
    </Portal>
  )
}
