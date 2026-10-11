import { fmtClock } from '../lib/dates'
import { Portal } from './Chrome'
import { restTimer, useRestTimer } from '../lib/timer'

/** Floating rest timer. Sits above the tab bar or bottom bar. */
export function RestBar({ bottom }: { bottom: string }) {
  const t = useRestTimer()
  if (!t) return null
  const pct = t.total ? (1 - t.left / t.total) * 100 : 100
  return (
    <Portal>
    <div
      role="timer"
      aria-live="polite"
      style={{
        position: 'fixed', left: 0, right: 0, marginInline: 'auto', bottom, zIndex: 20,
        width: 'calc(100% - 24px)', maxWidth: 496, borderRadius: 20, padding: '14px 16px',
        background: t.done ? 'var(--accent)' : '#111', color: t.done ? '#000' : '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,.28)', display: 'flex', flexDirection: 'column', gap: 12,
        animation: 'enter .35s var(--ease) both', transition: 'background-color .35s ease, color .35s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', opacity: 0.75 }}>{t.done ? 'REST OVER' : 'REST'}</span>
          <span className="num" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{t.done ? 'Go!' : fmtClock(t.left)}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {!t.done && (
            <>
              <TimerBtn onClick={() => restTimer.add(-15)}>−15</TimerBtn>
              <TimerBtn onClick={() => restTimer.add(15)}>+15</TimerBtn>
            </>
          )}
          <TimerBtn solid onClick={() => restTimer.stop()}>{t.done ? 'Done' : 'Skip'}</TimerBtn>
        </div>
      </div>
      {!t.done && (
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.16)' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: 'var(--accent)', transition: 'width .25s linear' }} />
        </div>
      )}
    </div>
    </Portal>
  )
}

function TimerBtn({ children, onClick, solid }: { children: string; onClick: () => void; solid?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: 56, minHeight: 40, borderRadius: 999, border: 0, fontSize: 14, fontWeight: 600,
        background: solid ? '#fff' : 'rgba(255,255,255,.14)', color: solid ? '#000' : 'inherit',
      }}
    >
      {children}
    </button>
  )
}
