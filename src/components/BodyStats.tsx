import { Link } from 'react-router-dom'
import { absZone, navyBodyFat, vTaper, V_TARGET } from '../lib/body'
import { fmtNum } from '../lib/coach'
import { fmtShort } from '../lib/dates'
import type { State } from '../lib/store'

/** Latest value of a check-in field and the first one ever recorded. */
function track(state: State, key: 'waist' | 'shoulders' | 'neck' | 'hip') {
  const pts = Object.entries(state.checkins).filter(([, c]) => c[key] != null).map(([date, c]) => ({ date, value: c[key] as number })).sort((a, b) => a.date.localeCompare(b.date))
  return { first: pts[0], last: pts.at(-1) }
}

/** V-taper ratio and body-fat estimate cards for the Progress → Body tab. */
export function BodyStats({ state }: { state: State }) {
  const p = state.settings.profile ?? {}
  const waist = track(state, 'waist')
  const shoulders = track(state, 'shoulders')
  const neck = track(state, 'neck')
  const hip = track(state, 'hip')

  const ratio = vTaper(shoulders.last?.value, waist.last?.value)
  const ratioStart = vTaper(shoulders.first?.value, waist.first?.value)
  const bf = navyBodyFat(p, waist.last?.value, neck.last?.value, hip.last?.value)
  const zone = absZone(p.sex)

  return (
    <>
      <div className="group" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="eyebrow" style={{ fontSize: 11 }}>V-taper · shoulders ÷ waist</span>
        {ratio ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <span className="disp" style={{ fontSize: 64 }}>{ratio.toFixed(2)}</span>
              <span className="small muted" style={{ textAlign: 'right' }}>Goal {V_TARGET}<br />{ratioStart && ratioStart !== ratio ? `Started at ${ratioStart.toFixed(2)}` : `Measured ${fmtShort(shoulders.last!.date)}`}</span>
            </div>
            <Scale min={1.2} max={1.75} value={ratio} marks={[{ at: 1.5, label: '1.5' }, { at: V_TARGET, label: V_TARGET.toString() }]} goal={[1.5, 1.7]} />
            <span className="small muted" style={{ lineHeight: 1.45 }}>
              {ratio >= 1.5 ? 'Clear V-taper. Keep building shoulders and lats while the waist comes down.' : `It moves from both ends: wider shoulders and lats, and a smaller waist (${fmtNum(Math.round(shoulders.last!.value / V_TARGET))} cm waist at today’s shoulders hits ${V_TARGET}). Gaining 0.05–0.1 in 12 weeks is excellent progress.`}
            </span>
          </>
        ) : (
          <Empty text="Measure around your shoulders (widest point, arms relaxed) and your waist. Add both in Check-in once a month." />
        )}
      </div>

      <div className="group" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="eyebrow" style={{ fontSize: 11 }}>Body fat · estimate</span>
        {bf != null && bf > 2 && bf < 60 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <span className="disp" style={{ fontSize: 64 }}>{bf.toFixed(1)}<span style={{ fontSize: 32, color: 'var(--label-2)' }}>%</span></span>
              <span className="small muted" style={{ textAlign: 'right' }}>Abs usually show<br /><b style={{ color: 'var(--label)' }}>{zone.from}–{zone.to}%</b></span>
            </div>
            <Scale min={6} max={30} value={bf} marks={[{ at: zone.to, label: `${zone.to}%` }, { at: 20, label: '20%' }]} goal={[zone.from, zone.to]} />
            <span className="small muted" style={{ lineHeight: 1.45 }}>
              {bf <= zone.to ? 'You’re in the six-pack range. Keep the deficit small and protect strength.' : `About ${fmtNum(Math.round(bf - zone.to))} points to the six-pack range. At a steady 0.25–0.5 kg a week, that’s a realistic goal; waist and photos show it first.`}
              {' '}US Navy tape formula, usually within 3–4 points.
            </span>
          </>
        ) : (
          <Empty text={!p.heightCm ? 'Add your height in Settings, then your waist and neck in Check-in.' : p.sex === 'female' ? 'Add waist, neck and hip measurements in Check-in.' : 'Add your waist and neck (just below the Adam’s apple) in Check-in.'} />
        )}
      </div>
    </>
  )
}

function Scale({ min, max, value, marks, goal }: { min: number; max: number; value: number; marks: { at: number; label: string }[]; goal: [number, number] }) {
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`
  return (
    <div style={{ position: 'relative', height: 34 }} aria-hidden>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 8, borderRadius: 4, background: 'var(--fill)' }} />
      <div style={{ position: 'absolute', top: 8, height: 8, borderRadius: 4, left: pos(goal[0]), width: `calc(${pos(goal[1])} - ${pos(goal[0])})`, background: 'var(--good-fill)', opacity: 0.55 }} />
      <div style={{ position: 'absolute', top: 2, width: 20, height: 20, marginLeft: -10, left: pos(value), borderRadius: 10, background: 'var(--accent)', border: '3px solid var(--surface)', boxShadow: '0 1px 4px rgba(0,0,0,.25)', transition: 'left .6s var(--ease)' }} />
      {marks.map((m) => (
        <span key={m.label} className="small muted num" style={{ position: 'absolute', top: 20, left: pos(m.at), transform: 'translateX(-50%)', fontSize: 11 }}>{m.label}</span>
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <span style={{ fontSize: 15, lineHeight: 1.45 }}>
      {text} <Link to="/log">Open check-in</Link>
    </span>
  )
}
