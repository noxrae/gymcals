import { useEffect, useState } from 'react'
import { IconChevronLeft } from '../components/Icons'
import { fmtNum } from '../lib/coach'
import { addDays, daysBetween, fmtLong, today } from '../lib/dates'
import { actions, useStore, type Checkin } from '../lib/store'

const FOODS = [
  { name: '3 eggs', g: 18 },
  { name: 'Chicken 150 g', g: 45 },
  { name: 'Fish 150 g', g: 33 },
  { name: 'Paneer 100 g', g: 18 },
  { name: 'Whey scoop', g: 24 },
  { name: 'Curd / yogurt bowl', g: 10 },
  { name: 'Milk glass', g: 8 },
  { name: 'Dal cup', g: 9 },
  { name: 'Soy chunks 50 g', g: 26 },
]
const FEEL = ['Wrecked', 'Tired', 'OK', 'Good', 'Great']

export default function LogScreen() {
  const [date, setDate] = useState(today())
  const c = useStore((s) => s.checkins[date]) ?? {}
  const settings = useStore((s) => s.settings)
  const checkins = useStore((s) => s.checkins)
  const set = (patch: Partial<Checkin>) => actions.setCheckin(date, patch)
  const isToday = date === today()

  const lastWaist = Object.keys(checkins).filter((d) => checkins[d].waist != null && d < date).sort().at(-1)
  const waistDue = !lastWaist || daysBetween(lastWaist, date) >= 14
  const protein = c.protein ?? 0

  return (
    <div className="screen">
      <div className="title-head">
        <div>
          <div className="eyebrow">{isToday ? 'Today' : fmtLong(date)}</div>
          <h1 className="large-title">Check-in</h1>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" className="icon-btn" style={{ background: 'var(--surface)', color: 'var(--label)' }} aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><IconChevronLeft size={16} /></button>
          <button type="button" className="icon-btn" style={{ background: 'var(--surface)', color: 'var(--label)', transform: 'scaleX(-1)' }} aria-label="Next day" disabled={isToday} onClick={() => setDate(addDays(date, 1))}><IconChevronLeft size={16} /></button>
        </div>
      </div>

      <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade .3s ease both' }}>
        <div>
          <h2 className="sec">Body</h2>
          <div className="group">
            <NumRow label="Morning weight" unit="kg" value={c.weight} onChange={(v) => set({ weight: v })} />
            <NumRow label="Waist at navel" unit="cm" value={c.waist} onChange={(v) => set({ waist: v })} placeholder={waistDue ? 'Due' : '—'} />
          </div>
          <p className="sec-foot">Weigh in after waking. Measure your waist every 2 weeks{waistDue ? ' (due now)' : ''}.</p>
        </div>

        <div>
          <h2 className="sec">Protein</h2>
          <div className="group" style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 16px' }}>
              <span className="num" style={{ fontSize: 30, fontWeight: 700 }}>{protein} g</span>
              <span className="muted" style={{ fontSize: 15 }}>of {settings.proteinTarget} g</span>
            </div>
            <div className="bar" style={{ margin: '0 16px' }}><div style={{ width: `${Math.min(100, (protein / settings.proteinTarget) * 100)}%` }} /></div>
            <div className="chips" style={{ padding: '0 16px' }}>
              {FOODS.map((f) => (
                <button key={f.name} type="button" className="chip" onClick={() => set({ protein: protein + f.g })}>{f.name} <b>+{f.g}</b></button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
              <CustomProtein onAdd={(g) => set({ protein: protein + g })} />
              {protein > 0 && <button type="button" className="chip" onClick={() => set({ protein: 0 })}>Reset</button>}
            </div>
          </div>
        </div>

        <div>
          <h2 className="sec">Recovery</h2>
          <div className="group">
            <NumRow label="Sleep" unit="h" value={c.sleep} onChange={(v) => set({ sleep: v })} />
            <NumRow label="Steps" value={c.steps} onChange={(v) => set({ steps: v != null ? Math.round(v) : undefined })} integer />
            <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>How do you feel?</span><span className="muted">{c.recovery ? FEEL[c.recovery - 1] : 'Tap one'}</span></div>
              <div className="seg" role="group" aria-label="Recovery from 1 (wrecked) to 5 (great)" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-pressed={c.recovery === n} aria-label={`${n}, ${FEEL[n - 1]}`} onClick={() => set({ recovery: n })} style={{ minHeight: 38, fontSize: 15 }}>{n}</button>
                ))}
              </div>
            </div>
          </div>
          <p className="sec-foot">Everything saves automatically. Low recovery two days in a row? The coach will suggest an easier session.</p>
        </div>
      </div>
    </div>
  )
}

function NumRow({ label, unit, value, onChange, integer, placeholder = '—' }: { label: string; unit?: string; value?: number; onChange: (v: number | undefined) => void; integer?: boolean; placeholder?: string }) {
  const [text, setText] = useState(value != null ? (integer ? value.toLocaleString() : fmtNum(value)) : '')
  useEffect(() => {
    setText(value != null ? (integer ? value.toLocaleString() : fmtNum(value)) : '')
  }, [value, integer])
  const id = `f-${label.replace(/\W/g, '')}`
  return (
    <label className="row" htmlFor={id}>
      <span style={{ flex: 1 }}>{label}</span>
      <input
        id={id}
        className="field num"
        inputMode={integer ? 'numeric' : 'decimal'}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = parseFloat(text.replace(/,/g, integer ? '' : '.'))
          onChange(text.trim() === '' || !Number.isFinite(n) ? undefined : n)
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      {unit && <span className="muted" style={{ minWidth: 22 }}>{unit}</span>}
    </label>
  )
}

function CustomProtein({ onAdd }: { onAdd: (g: number) => void }) {
  const [v, setV] = useState('')
  const n = parseInt(v, 10)
  return (
    <form
      style={{ flex: 1, display: 'flex', gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault()
        if (n > 0) { onAdd(n); setV('') }
      }}
    >
      <input aria-label="Custom protein grams" className="chip num" style={{ flex: 1, minWidth: 0, textAlign: 'left' }} inputMode="numeric" placeholder="Other amount (g)" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ''))} />
      <button type="submit" className="chip" disabled={!(n > 0)} style={{ background: 'var(--btn)', color: 'var(--btn-ink)', opacity: n > 0 ? 1 : 0.4 }}>Add</button>
    </form>
  )
}
