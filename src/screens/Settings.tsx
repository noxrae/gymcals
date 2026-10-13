import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BodyProfile } from '../components/BodyProfile'
import { NavBar } from '../components/Chrome'
import { fmtLong, today } from '../lib/dates'
import { clearPhotos } from '../lib/photos'
import { actions, exportData, useStore } from '../lib/store'

export default function SettingsScreen() {
  const s = useStore((st) => st.settings)
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied')

  const [params] = useSearchParams()
  const backupRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (params.get('backup')) backupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (params.get('profile')) profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [params])

  /** On phones: share sheet (Drive, WhatsApp, Files…). Elsewhere: a normal download. */
  const download = async () => {
    const name = `gymcals-backup-${today()}.json`
    const blob = new Blob([exportData()], { type: 'application/json' })
    const file = new File([blob], name, { type: 'application/json' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'GymCals backup' })
        actions.setSettings({ lastBackup: today() })
        setMsg('Backup shared. Keep it somewhere safe, like Google Drive.')
        return
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
    actions.setSettings({ lastBackup: today() })
    setMsg('Backup saved to your Downloads.')
  }

  return (
    <div className="screen flush no-tabs">
      <NavBar title="Settings" back="Today" />
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 className="sec">Plan</h2>
          <div className="group">
            <label className="row">
              <span style={{ flex: 1 }}>Start date</span>
              <input type="date" className="field" style={{ width: 150 }} value={s.startDate ?? ''} onChange={(e) => e.target.value && actions.setSettings({ startDate: e.target.value })} />
            </label>
          </div>
          <div className="group" style={{ marginTop: 12 }}>
            <Toggle label="5-day mode" on={s.fiveDay} onChange={(v) => actions.setSettings({ fiveDay: v })} />
          </div>
          <p className="sec-foot">
            {s.startDate ? `Week 1 began ${fmtLong(s.startDate)}. ` : ''}
            5-day mode makes Thursday a recovery day, spreads its skill and core work over Mon/Wed/Fri/Sat and drops optional cardio. Use it for weeks when six days feels like too much.
          </p>
        </div>

        <div ref={profileRef} style={{ scrollMarginTop: 70 }}>
          <h2 className="sec">Your body · calories</h2>
          <BodyProfile />
        </div>

        <div>
          <h2 className="sec">Daily targets</h2>
          <div className="group">
            <Stepper label="Protein" unit="g" value={s.proteinTarget} step={5} onChange={(v) => actions.setSettings({ proteinTarget: v })} />
            <Stepper label="Steps" value={s.stepTarget} step={500} onChange={(v) => actions.setSettings({ stepTarget: v })} />
          </div>
          <p className="sec-foot">Your plan suggests 125–140 g of protein and 7,000–10,000 steps.</p>
        </div>

        <div>
          <h2 className="sec">Rest timer</h2>
          <div className="group">
            <Toggle label="Sound" on={s.sound} onChange={(v) => actions.setSettings({ sound: v })} />
            <Toggle label="Vibration" on={s.vibrate} onChange={(v) => actions.setSettings({ vibrate: v })} />
            <Toggle label="Keep screen on during workouts" on={s.keepAwake} onChange={(v) => actions.setSettings({ keepAwake: v })} />
            <div className="row">
              <span style={{ flex: 1 }}>Notifications</span>
              {perm === 'granted' ? (
                <span className="value">On</span>
              ) : perm === 'denied' ? (
                <span className="value small">Blocked in browser settings</span>
              ) : (
                <button type="button" className="link-btn" onClick={async () => setPerm(await Notification.requestPermission())}>Turn on</button>
              )}
            </div>
          </div>
          <p className="sec-foot">Notifications alert you when rest ends while you’re in another app. On iPhone, add GymCals to your Home Screen first.</p>
        </div>

        <div ref={backupRef}>
          <h2 className="sec">Your data</h2>
          <div className="group">
            <button type="button" className="row" onClick={download}><span className="grow"><span style={{ color: 'var(--accent-ink)' }}>Back up now</span><span className="sub">{s.lastBackup ? `Last backup ${fmtLong(s.lastBackup)}` : 'Never backed up'}</span></span></button>
            <button type="button" className="row" onClick={() => file.current?.click()}><span style={{ color: 'var(--accent-ink)' }}>Restore from a backup</span></button>
            <button
              type="button"
              className="row"
              onClick={() => {
                if (!window.confirm('Erase all workouts, check-ins, photos and settings? This cannot be undone.')) return
                void clearPhotos().catch(() => {})
                actions.reset()
              }}
            >
              <span style={{ color: 'var(--danger)' }}>Erase everything</span>
            </button>
          </div>
          <input
            ref={file}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              try {
                actions.importData(await f.text())
                setMsg('Backup restored.')
              } catch (err) {
                setMsg(err instanceof Error ? err.message : 'Could not read that file.')
              }
              e.target.value = ''
            }}
          />
          <p className="sec-foot" role="status">{msg || 'Everything is stored only on this device. Export a backup now and then.'}</p>
        </div>

        <div>
          <h2 className="sec">Credits</h2>
          <div className="group">
            <a className="row" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer"><span className="grow"><span>Exercise photos</span><span className="sub">free-exercise-db · public domain</span></span></a>
            <a className="row" href="https://wger.de" target="_blank" rel="noreferrer"><span className="grow"><span>Muscle illustrations</span><span className="sub">wger.de · CC BY-SA 3.0</span></span></a>
            <div className="row"><span className="grow"><span>Form videos</span><span className="sub">Embedded from each creator’s YouTube channel</span></span></div>
          </div>
          <p className="sec-foot">GymCals is educational, not medical advice. Stop and get qualified help if you feel sharp or unusual pain.</p>
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="row" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span style={{ flex: 1 }}>{label}</span>
      <span aria-hidden style={{ width: 51, height: 31, borderRadius: 16, background: on ? 'var(--good-fill)' : 'var(--fill)', position: 'relative', transition: 'background-color .25s ease' }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 27, height: 27, borderRadius: 14, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,.2)', transition: 'left .25s var(--ease)' }} />
      </span>
    </button>
  )
}

function Stepper({ label, unit, value, step, onChange }: { label: string; unit?: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="row">
      <span style={{ flex: 1 }}>{label}</span>
      <span className="num" style={{ minWidth: 70, textAlign: 'right' }}>{value.toLocaleString()}{unit ? ` ${unit}` : ''}</span>
      <span className="seg" style={{ width: 96 }}>
        <button type="button" aria-label={`Less ${label.toLowerCase()}`} onClick={() => onChange(Math.max(0, value - step))} style={{ fontSize: 18 }}>−</button>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} onClick={() => onChange(value + step)} style={{ fontSize: 18 }}>+</button>
      </span>
    </div>
  )
}
