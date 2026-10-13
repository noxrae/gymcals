import { useEffect, useState } from 'react'
import { ACTIVITY, DEFICIT, type Activity, type Profile, type Sex } from '../lib/body'
import { calorieTarget } from '../lib/coach'
import { actions, useStore } from '../lib/store'

/** Settings section: height, age, sex and activity → maintenance and fat-loss calorie target. */
export function BodyProfile() {
  const state = useStore((s) => s)
  const p: Profile = state.settings.profile ?? {}
  const set = (patch: Partial<Profile>) => actions.setSettings({ profile: { ...p, ...patch } })
  const cal = calorieTarget(state)
  const adjust = state.settings.calorieAdjust ?? 0

  return (
    <>
      <div className="group">
        <NumField label="Height" unit="cm" value={p.heightCm} onChange={(v) => set({ heightCm: v })} />
        <NumField label="Age" unit="years" value={p.age} onChange={(v) => set({ age: v })} />
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <span style={{ flex: 1 }}>Sex</span>
          <span className="seg" role="group" aria-label="Sex" style={{ width: 170 }}>
            {(['male', 'female'] as Sex[]).map((x) => (
              <button key={x} type="button" aria-pressed={p.sex === x} onClick={() => set({ sex: x })}>{x === 'male' ? 'Male' : 'Female'}</button>
            ))}
          </span>
        </div>
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <span>Daily life outside the gym</span>
          <span className="seg" role="group" aria-label="Activity" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {(Object.keys(ACTIVITY) as Activity[]).map((a) => (
              <button key={a} type="button" aria-pressed={p.activity === a} onClick={() => set({ activity: a })} style={{ minHeight: 36 }}>{ACTIVITY[a].label}</button>
            ))}
          </span>
        </div>
      </div>

      {cal ? (
        <div className="group" style={{ marginTop: 12 }}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <span className="grow">
              <span className="small muted">Fat-loss target</span>
              <span className="num" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>{cal.target.toLocaleString()} <span style={{ fontSize: 15, color: 'var(--label-2)', fontWeight: 500 }}>kcal / day</span></span>
            </span>
            <span className="small muted" style={{ textAlign: 'right' }}>Maintenance<br /><b className="num" style={{ color: 'var(--label)' }}>{cal.maintenance.toLocaleString()}</b></span>
          </div>
          <div className="row">
            <span style={{ flex: 1 }}>Fine-tune</span>
            <span className="num muted" style={{ minWidth: 70, textAlign: 'right' }}>{adjust > 0 ? '+' : ''}{adjust} kcal</span>
            <span className="seg" style={{ width: 96 }}>
              <button type="button" aria-label="Lower the calorie target by 50" onClick={() => actions.setSettings({ calorieAdjust: adjust - 50 })} style={{ fontSize: 18 }}>−</button>
              <button type="button" aria-label="Raise the calorie target by 50" onClick={() => actions.setSettings({ calorieAdjust: adjust + 50 })} style={{ fontSize: 18 }}>+</button>
            </span>
          </div>
        </div>
      ) : null}
      <p className="sec-foot">
        {cal
          ? `About ${DEFICIT} kcal under maintenance, which works out to roughly 0.4 kg of fat a week. It updates as your weekly weight changes. If the coach says you’re losing too fast or have stalled, fine-tune by 150.`
          : 'Belly and side fat can’t be trained away directly; they go with a steady calorie deficit. Fill these in to get your daily target.'}
      </p>
    </>
  )
}

function NumField({ label, unit, value, onChange }: { label: string; unit: string; value?: number; onChange: (v: number | undefined) => void }) {
  const [text, setText] = useState(value != null ? String(value) : '')
  useEffect(() => {
    if (value != null && String(value) !== text) setText(String(value))
  }, [value])
  const id = `p-${label}`
  return (
    <label className="row" htmlFor={id}>
      <span style={{ flex: 1 }}>{label}</span>
      <input
        id={id}
        className="field num"
        inputMode="numeric"
        placeholder="—"
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d.]/g, '')
          setText(t)
          const n = parseFloat(t)
          onChange(t === '' ? undefined : Number.isFinite(n) && n > 0 ? n : undefined)
        }}
      />
      <span className="muted" style={{ minWidth: 44 }}>{unit}</span>
    </label>
  )
}
