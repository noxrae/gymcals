import { useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { BodyMap, MapLegend, numberMuscles } from '../components/BodyMap'
import { FloatingBack } from '../components/Chrome'
import { FormDemo, hasDemo } from '../components/FormDemo'
import { AskCoach } from '../components/CoachBits'
import { IconAlert } from '../components/Icons'
import { LineChart } from '../components/LineChart'
import { VideoCredit, VideoPlayer } from '../components/Media'
import { EXERCISES } from '../data/exercises'
import { MUSCLES, type MuscleId } from '../data/muscles'
import { allItems, dayFor, programOf, setsFor, type DayId } from '../data/plan'
import { fmtNum, history, rangeText, restText, suggest, unitOf } from '../lib/coach'
import { fmtShort, weekOf } from '../lib/dates'
import { useStore } from '../lib/store'
import { useToday } from '../lib/useToday'

type Tab = 'how' | 'muscles' | 'history'
const TABS: { id: Tab; label: string }[] = [
  { id: 'how', label: 'How to' },
  { id: 'muscles', label: 'Muscles' },
  { id: 'history', label: 'History' },
]

export default function ExerciseScreen() {
  const { key = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const ex = EXERCISES[key]
  const tab = (params.get('tab') as Tab) || 'how'
  const dayId = params.get('day') as DayId | null
  const { week, fiveDay, ctx } = useToday()
  if (!ex) return <Navigate to="/" replace />

  const item = dayId ? allItems(dayFor(dayId, fiveDay, ctx)).find((i) => i.ex === key) : undefined
  const setTab = (t: Tab) => setParams((p) => { p.set('tab', t); return p }, { replace: true })
  const muscleNames = [...ex.primary, ...ex.secondary].map((m) => MUSCLES[m].name).join(' · ')

  return (
    <div className="screen flush no-tabs" style={{ background: 'var(--surface)' }}>
      <div style={{ position: 'relative' }}>
        <VideoPlayer ex={ex} height={Math.min(300, Math.round(window.innerWidth * 0.75))} />
        <FloatingBack />
      </div>

      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="disp" style={{ fontSize: 'clamp(38px, 12vw, 48px)' }}>{ex.name}</h1>
          {muscleNames && <span className="muted" style={{ fontSize: 15 }}>{muscleNames}</span>}
          <VideoCredit ex={ex} />
        </div>

        {ex.kind !== 'cardio' && (
          <div className="seg" role="tablist" aria-label="Exercise sections">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
        )}

        <div key={tab} style={{ animation: 'fade .3s ease both', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {tab === 'how' && <HowTo exKey={key} item={item} week={week} />}
          {tab === 'muscles' && <Muscles primary={ex.primary} secondary={ex.secondary} />}
          {tab === 'history' && <History exKey={key} />}
        </div>
      </div>
    </div>
  )
}

function HowTo({ exKey, item, week }: { exKey: string; item?: ReturnType<typeof allItems>[number]; week: number }) {
  const ex = EXERCISES[exKey]
  const state = useStore((s) => s)
  const tip = item ? suggest(state, item, week) : null
  return (
    <>
      {item && (
        <div>
          <h2 className="sec" style={{ marginLeft: 0 }}>Today</h2>
          <div className="group" style={{ background: 'var(--surface-2)' }}>
            <div className="row"><span style={{ flex: 1 }}>Target</span><span className="value" style={{ color: 'var(--label)', fontWeight: 600 }}>{rangeText(item, setsFor(item, week, programOf(state.settings.program)))}</span></div>
            {item.rest[0] > 0 && <div className="row"><span style={{ flex: 1 }}>Rest</span><span className="value">{restText(item.rest)}</span></div>}
            {tip && <div className="row"><span style={{ flex: 1, fontSize: 15, lineHeight: 1.4 }}>{tip.text}</span></div>}
          </div>
        </div>
      )}

      {hasDemo(ex) && (
        <div>
          <h2 className="sec" style={{ marginLeft: 0 }}>Form demo</h2>
          <FormDemo ex={ex} />
        </div>
      )}

      <div>
        <h2 className="sec" style={{ marginLeft: 0 }}>How to</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ex.steps.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 12 }}>
              <span className="disp" style={{ fontSize: 26, color: 'var(--accent)', width: 34, flex: 'none', lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontSize: 16, lineHeight: 1.45 }}>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="callout warn">
        <IconAlert size={20} style={{ color: 'var(--warn)' }} />
        <div><b>Common mistake</b><div style={{ fontSize: 15 }}>{ex.mistake}</div></div>
      </div>
      <p className="small muted">Equipment: {ex.equipment}</p>
      <AskCoach questions={[`How do I do ${ex.name.toLowerCase()} properly?`, `What muscles does ${ex.name.toLowerCase()} work?`, `Easier alternative to ${ex.name.toLowerCase()}`, `${ex.name} hurts`]} />
    </>
  )
}

function Muscles({ primary, secondary }: { primary: MuscleId[]; secondary: MuscleId[] }) {
  const [focus, setFocus] = useState<MuscleId | null>(null)
  const list = numberMuscles(primary, secondary)
  return (
    <>
      <div className="group" style={{ background: 'var(--surface-2)', padding: '18px 10px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BodyMap muscles={list} focus={focus} />
        <MapLegend />
      </div>
      <div>
        <h2 className="sec" style={{ marginLeft: 0 }}>Tap a muscle to focus it</h2>
        <div className="group" style={{ background: 'var(--surface-2)' }}>
          {list.map((m) => {
            const info = MUSCLES[m.id]
            const on = focus === m.id
            return (
              <button
                key={m.id}
                type="button"
                className="row"
                aria-pressed={on}
                onClick={() => setFocus(on ? null : m.id)}
                style={{ ['--inset' as string]: '54px', alignItems: 'flex-start', background: on ? 'var(--accent-soft)' : undefined, minHeight: 64 }}
              >
                <span style={{ flex: 'none', width: 26, height: 26, borderRadius: 13, marginTop: 2, background: on ? 'var(--label)' : m.primary ? 'var(--muscle-1)' : 'var(--muscle-2)', color: on ? 'var(--bg)' : '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.n}</span>
                <span className="grow" style={{ gap: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{info.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', padding: '2px 8px', borderRadius: 999, background: m.primary ? 'var(--accent-soft)' : 'transparent', boxShadow: m.primary ? undefined : 'inset 0 0 0 1px var(--chevron)', color: m.primary ? 'var(--accent-ink)' : 'var(--label-2)' }}>{m.primary ? 'PRIMARY' : 'SECONDARY'}</span>
                  </span>
                  <span className="sub" style={{ lineHeight: 1.35 }}>{info.latin}. {info.does}</span>
                </span>
              </button>
            )
          })}
        </div>
        <p className="sec-foot" style={{ marginLeft: 0 }}>Anatomy illustration: wger.de (CC BY-SA 3.0)</p>
      </div>
    </>
  )
}

function History({ exKey }: { exKey: string }) {
  const ex = EXERCISES[exKey]
  const state = useStore((s) => s)
  const h = history(state, exKey).reverse()
  const unit = unitOf(ex)
  if (!h.length) {
    return <p className="muted" style={{ textAlign: 'center', padding: '24px 0', lineHeight: 1.5 }}>No sets logged yet.<br />Your history appears here after your first workout.</p>
  }

  const best = (sets: typeof h[number]['sets']) =>
    ex.kind === 'assist' ? Math.min(...sets.map((s) => s.load ?? 0)) : ex.kind === 'weight' ? Math.max(...sets.map((s) => s.load ?? 0)) : Math.max(...sets.map((s) => s.reps ?? 0))
  const loadKind = ex.kind === 'weight' || ex.kind === 'assist'
  const points = [...h].reverse().filter((e) => !loadKind || e.sets.some((s) => s.load != null)).map((e) => ({ x: weekOf(e.date, state.settings.startDate), y: best(loadKind ? e.sets.filter((s) => s.load != null) : e.sets) }))
  const chartUnit = ex.kind === 'weight' || ex.kind === 'assist' ? 'kg' : unit

  return (
    <>
      {points.length > 1 && (
        <div className="group" style={{ background: 'var(--surface-2)', padding: '14px 8px 6px' }}>
          <LineChart points={points} unit={chartUnit} label={`${ex.name}: best ${ex.kind === 'assist' ? 'assistance' : chartUnit} per session`} />
        </div>
      )}
      <div className="group" style={{ background: 'var(--surface-2)' }}>
        {h.map((e) => (
          <div key={e.date} className="row" style={{ alignItems: 'flex-start' }}>
            <span style={{ width: 70, flex: 'none', fontWeight: 600 }}>{fmtShort(e.date)}</span>
            <span className="grow">
              {e.sets.map((s, i) => (
                <span key={i} className="num" style={{ fontSize: 15 }}>
                  {s.load != null && ex.kind !== 'time' && ex.kind !== 'reps' ? `${fmtNum(s.load)} kg${ex.kind === 'assist' ? ' assist' : ''} × ` : ''}{s.reps} {unit === 'reps' ? '' : unit}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
