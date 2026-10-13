import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BodyStats } from '../components/BodyStats'
import { Chevron } from '../components/Icons'
import { ProgressPhotos } from '../components/ProgressPhotos'
import { LineChart, type Point } from '../components/LineChart'
import { ExerciseThumb } from '../components/Media'
import { EXERCISES } from '../data/exercises'
import { avgWeight, fmtNum, history, weeklyAverages, weightSeries } from '../lib/coach'
import { daysBetween, fmtShort, weekOf } from '../lib/dates'
import { useStore, type State } from '../lib/store'
import { useToday } from '../lib/useToday'

type Tab = 'weight' | 'body' | 'strength' | 'tests' | 'photos'
const LIFTS = ['bench-press', 'incline-bench-press', 'squat', 'romanian-deadlift', 'lat-pulldown', 'dumbbell-shoulder-press', 'assisted-pull-up']

export default function ProgressScreen() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'weight')
  const state = useStore((s) => s)
  return (
    <div className="screen">
      <h1 className="large-title" style={{ padding: '8px 4px 0' }}>Progress</h1>
      <div className="seg" role="tablist" aria-label="Metric">
        {(['weight', 'body', 'strength', 'tests', 'photos'] as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      <div key={tab} style={{ animation: 'fade .3s ease both', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {tab === 'weight' && <Body state={state} metric="weight" />}
        {tab === 'body' && (
          <>
            <BodyStats state={state} />
            <Body state={state} metric="waist" />
          </>
        )}
        {tab === 'strength' && <Strength state={state} />}
        {tab === 'tests' && <Tests state={state} />}
        {tab === 'photos' && <ProgressPhotos />}
      </div>
    </div>
  )
}

function Body({ state, metric }: { state: State; metric: 'weight' | 'waist' }) {
  const { date } = useToday()
  const unit = metric === 'weight' ? 'kg' : 'cm'
  const start = state.settings.startDate
  const base = state.baseline?.[metric] ?? weeklyAverages(state.checkins, start, metric)[0]?.value
  const weekly = weeklyAverages(state.checkins, start, metric)
  const series = Object.entries(state.checkins).filter(([, c]) => c[metric] != null).map(([d, c]) => ({ date: d, value: c[metric] as number })).sort((a, b) => a.date.localeCompare(b.date))
  const current = metric === 'weight' ? avgWeight(state.checkins, date) ?? weekly.at(-1)?.value : series.at(-1)?.value

  if (base == null || current == null) {
    return (
      <Empty
        title={metric === 'weight' ? 'No weigh-ins yet' : 'No waist measurements yet'}
        text={metric === 'weight' ? 'Weigh yourself after waking, 3–7 mornings a week. The app uses the weekly average so one heavy day never worries you.' : 'Measure at your navel every two weeks, relaxed, after breathing out.'}
      />
    )
  }

  const change = current - base
  const thisWeek = weekOf(date, start)
  // The current week's point uses the same rolling 7-day average as the headline.
  const points: Point[] = [{ x: 0, y: base }, ...weekly.filter((w) => w.week <= 12).map((w) => ({ x: w.week, y: metric === 'weight' && w.week === thisWeek ? current : w.value }))]
  const band = metric === 'weight' ? { from: { x: 0, y: base }, to: [base - 0.25 * 12, base - 0.5 * 12] as [number, number] } : undefined
  const lastWaist = metric === 'waist' ? series.at(-1) : undefined
  const waistDue = lastWaist ? 14 - daysBetween(lastWaist.date, date) : 0

  return (
    <>
      <div className="group" style={{ padding: '20px 8px 10px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="eyebrow" style={{ fontSize: 12 }}>{metric === 'weight' ? 'Weekly average · since start' : 'Waist at navel · since start'}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="disp" style={{ fontSize: 72 }}>{change > 0 ? '+' : change < 0 ? '−' : ''}{fmtNum(Math.abs(Math.round(change * 10) / 10))}</span>
            <span className="disp muted" style={{ fontSize: 32 }}>{unit}</span>
          </div>
          <span style={{ fontSize: 15 }}>{fmtNum(Math.round(current * 10) / 10)} {unit} now · started at {fmtNum(base)} {unit}</span>
        </div>
        {points.length > 1 ? (
          <LineChart points={points} unit={unit} band={band} label={`${metric} weekly averages from week 0`} />
        ) : (
          <p className="small muted" style={{ padding: '0 8px 8px' }}>The chart appears after your first full week.</p>
        )}
        {band && points.length > 1 && <p className="small muted" style={{ padding: '0 8px 6px' }}>Shaded area: the healthy pace of 0.25–0.5 kg a week.</p>}
      </div>

      {metric === 'waist' && (
        <div className={`callout ${waistDue <= 0 ? 'accent' : ''}`}>
          <span>{waistDue <= 0 ? 'Time to measure your waist. ' : `Next waist check in ${waistDue} days. `}<Link to="/log">Open check-in</Link></span>
        </div>
      )}

      <div>
        <h2 className="sec">Recent</h2>
        <div className="group">
          {(metric === 'weight' ? weightSeries(state.checkins) : series).slice(-7).reverse().map((p) => (
            <div key={p.date} className="row"><span style={{ flex: 1 }}>{fmtShort(p.date)}</span><span className="value num">{fmtNum(p.value)} {unit}</span></div>
          ))}
        </div>
      </div>
    </>
  )
}

function Strength({ state }: { state: State }) {
  const rows = LIFTS.map((key) => {
    const ex = EXERCISES[key]
    const h = history(state, key)
    if (!h.length) return { ex, first: null, last: null }
    const best = (sets: (typeof h)[number]['sets']) => {
      const pick = ex.kind === 'assist' ? sets.reduce((a, b) => ((b.load ?? 99) < (a.load ?? 99) ? b : a)) : sets.reduce((a, b) => ((b.load ?? 0) * 100 + (b.reps ?? 0) > (a.load ?? 0) * 100 + (a.reps ?? 0) ? b : a))
      return pick
    }
    return { ex, first: best(h[0].sets), last: best(h.at(-1)!.sets) }
  })
  const logged = rows.filter((r) => r.last)

  if (!logged.length) return <Empty title="No lifts logged yet" text="Finish your first workout and your best sets will show up here." />

  return (
    <div>
      <h2 className="sec">Best set · latest session</h2>
      <div className="group">
        {rows.map(({ ex, first, last }) => (
          <Link key={ex.key} to={`/exercise/${ex.key}?tab=history`} className="row" style={{ ['--inset' as string]: '84px', minHeight: 70 }}>
            <ExerciseThumb ex={ex} size={52} />
            <span style={{ flex: 1 }}>{ex.name}</span>
            {last ? (
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className="num" style={{ fontWeight: 600 }}>{last.load != null ? `${fmtNum(last.load)} kg${ex.kind === 'assist' ? ' assist' : ''} × ${last.reps}` : `${last.reps} reps`}</span>
                {first?.load != null && last.load != null && <Delta from={first.load} to={last.load} invert={ex.kind === 'assist'} />}
              </span>
            ) : (
              <span className="small muted">Not yet</span>
            )}
            <Chevron />
          </Link>
        ))}
      </div>
    </div>
  )
}

function Delta({ from, to, invert }: { from: number; to: number; invert?: boolean }) {
  const d = to - from
  if (!d) return <span className="small muted">Same as week 1</span>
  const good = invert ? d < 0 : d > 0
  return <span className="small num" style={{ color: good ? 'var(--good)' : 'var(--warn)', fontWeight: 600 }}>{d > 0 ? '+' : '−'}{fmtNum(Math.abs(d))} kg since first</span>
}

function Tests({ state }: { state: State }) {
  const items = [
    { id: 'pushups' as const, name: 'Max push-ups', unit: 'reps', goal: '15–20+ clean reps' },
    { id: 'deadHang' as const, name: 'Dead hang', unit: 'sec', goal: '60 seconds' },
    { id: 'lsit' as const, name: 'Tuck L-sit', unit: 'sec', goal: '20 seconds' },
  ]
  return (
    <div>
      <h2 className="sec">Re-test every 4 weeks</h2>
      <div className="group">
        {items.map((t) => {
          const list = state.tests[t.id]
          const first = list[0]
          const last = list.at(-1)
          return (
            <Link key={t.id} to="/skills" className="row" style={{ minHeight: 64 }}>
              <span className="grow"><span>{t.name}</span><span className="sub">Goal: {t.goal}</span></span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className="num" style={{ fontWeight: 600 }}>{last ? `${last.value} ${t.unit}` : '—'}</span>
                {first && last && last !== first && <span className="small num" style={{ color: 'var(--good)', fontWeight: 600 }}>{last.value - first.value >= 0 ? '+' : '−'}{Math.abs(last.value - first.value)} since start</span>}
              </span>
              <Chevron />
            </Link>
          )
        })}
      </div>
      <p className="sec-foot">Log a new test from the Skills tab.</p>
    </div>
  )
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 20, fontWeight: 700 }}>{title}</span>
      <span className="muted" style={{ lineHeight: 1.5 }}>{text}</span>
      <Link to="/log" className="btn small" style={{ marginTop: 8 }}>Open check-in</Link>
    </div>
  )
}
