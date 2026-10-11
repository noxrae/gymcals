import { hideToast, useToast } from '../lib/toast'
import { Portal } from './Chrome'
import { IconCheck } from './Icons'

export function ToastBar() {
  const t = useToast()
  if (!t) return null
  return (
    <Portal>
      <div
        key={t.id}
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top) + 10px)', left: 0, right: 0, marginInline: 'auto', zIndex: 40,
          width: 'calc(100% - 24px)', maxWidth: 496, minHeight: 52, borderRadius: 16, padding: '8px 8px 8px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: t.tone === 'good' ? 'var(--good-fill)' : 'var(--ink-card)', color: t.tone === 'good' ? '#03210f' : '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,.25)', animation: 'drop .35s var(--ease) both',
        }}
        onClick={() => !t.action && hideToast()}
      >
        {t.tone === 'good' && (
          <span style={{ flex: 'none', width: 26, height: 26, borderRadius: 13, background: 'rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck size={13} />
          </span>
        )}
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{t.text}</span>
        {t.action && (
          <button type="button" onClick={t.action.run} style={{ minHeight: 40, padding: '0 16px', borderRadius: 12, border: 0, background: 'rgba(255,255,255,.16)', color: 'inherit', fontSize: 15, fontWeight: 700 }}>
            {t.action.label}
          </button>
        )}
      </div>
    </Portal>
  )
}
