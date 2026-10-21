import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Sheet } from '../components/Chrome'
import { HoldTimer } from '../components/HoldTimer'
import { Chevron, IconCheck, IconChevronLeft, IconInfo, IconSpark, IconTimer } from '../components/Icons'
import { ExerciseThumb } from '../components/Media'
import { RestBar } from '../components/RestBar'
import { groupType, TypeBadge } from '../components/TypeBadge'
import { ALTERNATIVES, BARBELL, EXERCISES, type Exercise } from '../data/exercises'
import { MUSCLES } from '../data/muscles'
import { allItems, ctxForSession, dayFor, programOf, setsFor, type DayId, type PlanItem } from '../data/plan'
import { fmtNum, isPersonalBest, lastSets, rangeText, restText, setText, suggest } from '../lib/coach'
import { fmtClock } from '../lib/dates'
import { actions, useStore, type SetLog } from '../lib/store'
import { restTimer } from '../lib/timer'
import { showToast, undoable } from '../lib/toast'
import { useWakeLock } from '../lib/wakeLock'
import { useToday } from '../lib/useToday'
import { plateText, warmupSets } from '../lib/warmup'

export default function WorkoutScreen() {
  const { dayId } = useParams<{ dayId: DayId }>()
  const { date, week, fiveDay, ctx, program } = useToday()
  const session = useStore((s) => s.sessions[date])
  // A workout already started keeps the plan it was started with.
  const day = dayId ? dayFor(dayId, fiveDay, session && session.dayId === dayId ? ctxForSession(ctx, session.plan) : ctx) : undefined
  const keepAwake = useStore((s) => s.settings.keepAwake)
  const state = useStore((s) => s)
  const navigate = useNavigate()
  const [finishing, setFinishing] = useState(false)
  const leaving = useRef(false)
  const [now, setNow] = useState(Date.now())

  // Another day's workout already has sets logged today: never overwrite it silently.
  const conflict = !!(day && session && session.dayId !== day.id && Object.keys(session.log).length)
  useEffect(() => {
    if (!leaving.current && day && !conflict && (!session || session.dayId !== day.id)) actions.startSession(date, day.id)
  }, [day, session, date, conflict])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  // Screen stays on while you train (Settings → Keep screen on).
  useWakeLock(keepAwake && !!session && !session.finishedAt)

  if (!day || !day.groups.length) return <Navigate to="/" replace />
  if (conflict) return <Navigate to={`/workout/${session!.dayId}`} replace />
  if (!session || session.dayId !== day.id) return null

  const swaps = session.swaps ?? {}
  const items = allItems(day)
  const inDay = new Set(items.map((it) => swaps[it.ex] ?? it.ex))
  // Logged exercises the plan no longer has (e.g. the plan changed after this workout): never hide them.
  const extra: PlanItem[] = Object.entries(session.log)
    .filter(([ex, sets]) => !inDay.has(ex) && EXERCISES[ex] && sets.some((x) => x.done))
    .map(([ex, sets]) => {
      const reps = sets.map((x) => x.reps ?? 0)
      return { ex, sets: sets.length, min: Math.min(...reps), max: Math.max(...reps), rest: [0, 0] as [number, number] }
    })
  const finished = !!session.finishedAt
  const elapsed = ((session.finishedAt ?? now) - session.startedAt) / 1000
  const total = items.reduce((n, it) => n + setsFor(it, week, program), 0)
  const done = Object.values(session.log).reduce((n, sets) => n + sets.filter((s) => s.done).length, 0)
  const records = Object.entries(session.log)
    .filter(([ex, sets]) => sets.some((x) => x.done && isPersonalBest(state, ex, x, date)))
    .map(([ex]) => EXERCISES[ex].name)
  const volume = Object.entries(session.log).reduce(
    (v, [ex, sets]) => v + (EXERCISES[ex].kind === 'weight' ? sets.filter((x) => x.done).reduce((a, x) => a + (x.load ?? 0) * (x.reps ?? 0), 0) : 0),
    0,
  )

  return (
    <div className="screen flush no-tabs" style={{ background: 'var(--surface)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 140px)' }}>
      <header className="navbar" style={{ background: 'var(--bar)' }}>
        <button type="button" className="back" onClick={() => navigate(`/day/${day.id}`)} aria-label="Back to workout overview"><IconChevronLeft /></button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="num" style={{ fontSize: 17, fontWeight: 600 }}>{fmtClock(elapsed)}</span>
          <span className="small muted">{day.short} · {done}/{total} sets</span>
        </div>
        <span className="end" style={{ paddingRight: 8 }}>
          {finished ? (
            <span className="small" style={{ color: 'var(--good)', fontWeight: 600 }}>Saved</span>
          ) : (
            <button type="button" className="btn accent small" style={{ minHeight: 36 }} onClick={() => setFinishing(true)}>Finish</button>
          )}
        </span>
      </header>
      <div style={{ height: 3, background: 'var(--fill)' }}>
        <div style={{ width: `${total ? (done / total) * 100 : 0}%`, height: '100%', background: 'var(--accent)', transition: 'width .4s var(--ease)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
        {!finished && <WarmupCard steps={day.warmup} />}
        {day.groups.map((g) => (
          <div key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="sec" style={{ margin: '10px 0 0', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TypeBadge type={groupType(g)} />
              <span>{g.title}</span>
            </h2>
            {g.items.map((it) => {
              const i = items.indexOf(it)
              const actual = swaps[it.ex] ?? it.ex
              return (
                <ExerciseBlock
                  key={it.ex}
                  index={i}
                  planned={it.ex}
                  item={{ ...it, ex: actual }}
                  week={week}
                  date={date}
                  log={session.log[actual]}
                  isLast={i === items.length - 1}
                  alternatives={[it.ex, ...(ALTERNATIVES[it.ex] ?? [])].filter((k) => k !== actual && (k === it.ex || !inDay.has(k)))}
                />
              )
            })}
          </div>
        ))}
        {extra.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="sec" style={{ margin: '10px 0 0', padding: '0 16px' }}>Also logged</h2>
            {extra.map((it, j) => (
              <ExerciseBlock key={it.ex} index={items.length + j} planned={it.ex} item={it} week={week} date={date} log={session.log[it.ex]} isLast={false} alternatives={[]} />
            ))}
          </div>
        )}
      </div>

      {day.optionalCardio && <p className="sec-foot" style={{ margin: '20px 16px 0' }}>Optional cardio: {day.optionalCardio}.</p>}

      <RestBar bottom="calc(env(safe-area-inset-bottom) + 16px)" />

      {finishing && (
        <FinishSheet
          done={done}
          total={total}
          minutes={Math.round(elapsed / 60)}
          records={records}
          volume={volume}
          onClose={() => setFinishing(false)}
          onSave={() => {
            actions.finishSession(date)
            restTimer.stop()
            navigate('/', { replace: true })
          }}
          onDiscard={() => {
            const copy = session
            leaving.current = true
            actions.discardSession(date)
            restTimer.stop()
            navigate('/', { replace: true })
            undoable('Workout discarded', () => {
              actions.restoreSession(copy)
              navigate(`/workout/${copy.dayId}`)
            })
          }}
        />
      )}
    </div>
  )
}

function columns(ex: Exercise) {
  switch (ex.kind) {
    case 'weight': return { load: 'KG', reps: 'REPS' }
    case 'assist': return { load: 'ASSIST KG', reps: 'REPS' }
    case 'time': return { load: null, reps: 'SEC' }
    case 'cardio': return { load: null, reps: 'MIN' }
    default: return { load: null, reps: 'REPS' }
  }
}

function ExerciseBlock({ item, index, planned, alternatives, week, date, log, isLast }: { item: PlanItem; index: number; planned: string; alternatives: string[]; week: number; date: string; log?: SetLog[]; isLast: boolean }) {
  const ex = EXERCISES[item.ex]
  const [swapping, setSwapping] = useState(false)
  const state = useStore((s) => s)
  const tip = useMemo(() => suggest(state, item, week), [state, item, week])
  const prev = useMemo(() => lastSets(state, item.ex, date), [state, item.ex, date])
  const count = setsFor(item, week, programOf(state.settings.program, state.settings.plan))
  const sets: SetLog[] = log ?? Array.from({ length: count }, () => ({ load: tip.load, reps: tip.reps, done: false }))
  const allDone = sets.length > 0 && sets.every((s) => s.done)
  const [open, setOpen] = useState(!allDone)
  const cols = columns(ex)

  useEffect(() => {
    if (allDone) setOpen(false)
  }, [allDone])

  const save = (next: SetLog[]) => actions.setSets(date, item.ex, next)
  const patch = (i: number, p: Partial<SetLog>) => save(sets.map((s, j) => (j === i ? { ...s, ...p } : s)))
  const toggle = (i: number) => {
    const nowDone = !sets[i].done
    patch(i, { done: nowDone })
    if (nowDone) afterDone(i, sets[i])
  }
  /** Built-in timer finished: log the time and tick the set (same feedback as tapping ✓). */
  const timerSaved = (i: number, value: number) => {
    const set = { ...sets[i], reps: value, done: true }
    save(sets.map((x, j) => (j === i ? set : x)))
    afterDone(i, set)
  }
  const [timing, setTiming] = useState<number | null>(null)
  const nextSet = sets.findIndex((x) => !x.done)
  const afterDone = (i: number, set: SetLog) => {
    const best = isPersonalBest(state, item.ex, set, date)
    if ('vibrate' in navigator) navigator.vibrate(best ? [30, 60, 30, 60, 60] : 12)
    if (best) showToast(`New personal best · ${ex.name} ${setText(item.ex, set)}`, { tone: 'good', ms: 4000 })
    const finishesExercise = sets.every((x, j) => j === i || x.done)
    if (!(isLast && finishesExercise) && item.rest[0] > 0) restTimer.start(Math.round((item.rest[0] + item.rest[1]) / 2), ex.name)
    // Glide to the next exercise once this one is complete.
    if (finishesExercise) setTimeout(() => document.getElementById(`ex-${index + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450)
  }
  const removeSet = () => {
    const before = sets
    save(sets.slice(0, -1))
    undoable('Set removed', () => save(before))
  }

  const summary = sets
    .filter((s) => s.done)
    .map((s) => (cols.load && s.load != null ? `${fmtNum(s.load)}×${s.reps ?? 0}` : `${s.reps ?? 0}`))
    .join(', ')

  if (!open) {
    return (
      <div id={`ex-${index}`} className="ex-anchor" style={{ padding: '0 12px' }}>
        <button type="button" className="row" onClick={() => setOpen(true)} style={{ minHeight: 60, background: 'var(--good-soft)', borderRadius: 14 }}>
          <span style={{ width: 26, height: 26, borderRadius: 13, background: 'var(--good-fill)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><IconCheck size={13} /></span>
          <span className="grow"><span style={{ fontWeight: 600 }}>{ex.name}</span><span className="sub num">{summary}</span></span>
          <span className="small muted">Edit</span>
        </button>
      </div>
    )
  }

  // Narrower inputs on small phones (≤ 360 px) so the Previous column stays on one line.
  const narrow = typeof window !== 'undefined' && window.innerWidth <= 360
  const grid = cols.load ? (narrow ? '24px minmax(0,1fr) 62px 48px 40px' : '34px minmax(0,1fr) 78px 62px 44px') : narrow ? '24px minmax(0,1fr) 62px 40px' : '34px minmax(0,1fr) 78px 44px'

  return (
    <section id={`ex-${index}`} className="ex-anchor" aria-label={ex.name} style={{ padding: '12px 0 14px', borderBottom: '1px solid var(--sep)', animation: 'fade .3s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 8px 16px' }}>
        <ExerciseThumb ex={ex} size={44} radius={10} />
        <Link to={`/exercise/${ex.key}`} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1, color: 'var(--label)' }}>
          <span style={{ fontSize: 17, fontWeight: 650, letterSpacing: '-0.015em' }}>{ex.name}</span>
          <span className="small muted">{rangeText(item, count)}{item.rest[0] ? ` · rest ${restText(item.rest)}` : ''}</span>
          {planned !== item.ex && <span className="small" style={{ color: 'var(--accent-ink)' }}>Swapped for {EXERCISES[planned].name}</span>}
        </Link>
        {alternatives.length > 0 && !sets.some((s) => s.done) && (
          <button type="button" className="link-btn" style={{ fontSize: 14, fontWeight: 600, minHeight: 40 }} onClick={() => setSwapping(true)}>Swap</button>
        )}
        <Link to={`/exercise/${ex.key}?tab=muscles`} aria-label={`Muscles and video: ${ex.name}`} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-2)' }}><IconInfo size={21} /></Link>
      </div>

      {ex.kind !== 'cardio' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '0 16px 10px', fontSize: 14, lineHeight: 1.4, color: tip.up ? 'var(--accent-ink)' : 'var(--label-2)' }}>
          <IconSpark size={16} style={{ flex: 'none', marginTop: 2 }} />
          <span>{tip.text}</span>
        </div>
      )}

      {BARBELL.has(item.ex) && (sets[0]?.load ?? 0) > 20 && <WarmupSets work={sets[0].load!} />}

      <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 8, alignItems: 'center', padding: narrow ? '0 12px' : '0 16px', minHeight: 26, fontSize: 12, fontWeight: 600, color: 'var(--label-2)', letterSpacing: '.04em' }}>
        <span>SET</span>
        <span>PREVIOUS</span>
        {cols.load && <span style={{ textAlign: 'center' }}>{cols.load}</span>}
        <span style={{ textAlign: 'center' }}>{cols.reps}</span>
        <span />
      </div>

      {sets.map((s, i) => {
        const p = prev?.sets[i]
        const prevText = p ? (cols.load && p.load != null ? `${fmtNum(p.load)}×${p.reps ?? 0}` : `${p.reps ?? 0}`) : '—'
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: grid, gap: 8, alignItems: 'center', padding: narrow ? '5px 12px' : '5px 16px', background: s.done ? 'var(--good-soft)' : 'transparent', transition: 'background-color .3s ease' }}>
            <span className="num" style={{ fontWeight: 600 }}>{i + 1}</span>
            <span className="num muted" style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prevText}</span>
            {cols.load && <NumBox label={`Set ${i + 1} ${cols.load.toLowerCase()}`} value={s.load} onChange={(v) => patch(i, { load: v })} />}
            <NumBox label={`Set ${i + 1} ${cols.reps.toLowerCase()}`} value={s.reps} onChange={(v) => patch(i, { reps: v })} integer />
            <button
              type="button"
              aria-label={`Set ${i + 1} done`}
              aria-pressed={s.done}
              onClick={() => toggle(i)}
              style={{ width: 44, height: 38, borderRadius: 10, border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.done ? 'var(--good-fill)' : 'var(--fill)', color: s.done ? '#fff' : 'var(--label-3)' }}
            >
              <IconCheck size={16} />
            </button>
          </div>
        )
      })}

      {(ex.kind === 'time' || ex.kind === 'cardio') && nextSet >= 0 && (
        <div style={{ padding: '8px 16px 2px' }}>
          <button type="button" className="btn secondary" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => setTiming(nextSet)}>
            <IconTimer size={18} /> Start timer · set {nextSet + 1}
          </button>
        </div>
      )}
      {timing != null && (
        <HoldTimer
          ex={ex}
          item={item}
          setNo={timing + 1}
          onClose={() => setTiming(null)}
          onSave={(v) => {
            const i = timing
            setTiming(null)
            timerSaved(i, v)
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px 0' }}>
        <button type="button" className="link-btn" style={{ fontSize: 15, fontWeight: 600 }} onClick={() => save([...sets, { load: sets.at(-1)?.load ?? tip.load, reps: sets.at(-1)?.reps ?? tip.reps, done: false }])}>+ Add set</button>
        {sets.length > 1 && <button type="button" className="link-btn" style={{ fontSize: 15, color: 'var(--label-2)' }} onClick={removeSet}>Remove last</button>}
      </div>

      {swapping && (
        <Sheet onClose={() => setSwapping(false)} label={`Swap ${ex.name}`}>
          <div style={{ padding: '4px 4px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="kicker" style={{ color: 'var(--accent-ink)' }}>Equipment busy?</span>
            <h2 className="disp" style={{ fontSize: 44 }}>Swap {ex.name}</h2>
            <p className="muted" style={{ fontSize: 15 }}>These work the same main muscles. The app remembers your choice for next time.</p>
          </div>
          <div className="group">
            {alternatives.map((k) => {
              const alt = EXERCISES[k]
              return (
                <button
                  key={k}
                  type="button"
                  className="row"
                  style={{ ['--inset' as string]: '84px', minHeight: 72 }}
                  onClick={() => {
                    actions.setSwap(date, planned, k === planned ? null : k)
                    setSwapping(false)
                  }}
                >
                  <ExerciseThumb ex={alt} />
                  <span className="grow">
                    <span style={{ fontWeight: 600 }}>{alt.name}{k === planned ? ' · planned' : ''}</span>
                    <span className="sub">{alt.primary.map((m) => MUSCLES[m].name).join(' · ')} · {alt.equipment}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Sheet>
      )}
    </section>
  )
}

/** General warm-up from the plan, as a quick checklist. */
const GENERAL_WARMUP = ['3–5 min easy walk, bike or elliptical', 'Shoulder circles, band pull-aparts, hip hinges, bodyweight squats', 'Ramp-up sets before your first big lift (shown under it)']

function WarmupCard({ steps = GENERAL_WARMUP }: { steps?: string[] }) {
  const [open, setOpen] = useState(false)
  const [ticks, setTicks] = useState<boolean[]>(() => steps.map(() => false))
  const count = ticks.filter(Boolean).length
  const all = count === steps.length
  useEffect(() => {
    if (all) setOpen(false)
  }, [all])
  return (
    <section style={{ margin: '0 12px', borderRadius: 14, background: all ? 'var(--good-soft)' : 'var(--surface-2)', transition: 'background-color .3s ease' }}>
      <button type="button" className="row" onClick={() => setOpen(!open)} aria-expanded={open} style={{ minHeight: 52 }}>
        <span style={{ flex: 'none', width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: all ? 'var(--good-fill)' : 'var(--surface)', boxShadow: all ? undefined : 'inset 0 0 0 1.5px var(--chevron)', color: all ? '#fff' : 'var(--label)', fontSize: 11, fontWeight: 700 }}>
          {all ? <IconCheck size={13} /> : `${count}/${steps.length}`}
        </span>
        <span className="grow"><span style={{ fontWeight: 600 }}>{all ? 'Warmed up' : 'Warm-up · 8–12 min'}</span></span>
        <span style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .25s var(--ease)', display: 'flex' }}><Chevron /></span>
      </button>
      {open &&
        steps.map((st, i) => (
          <button
            key={st}
            type="button"
            className="row"
            aria-pressed={ticks[i]}
            onClick={() => setTicks(ticks.map((t, j) => (j === i ? !t : t)))}
            style={{ alignItems: 'flex-start' }}
          >
            <span style={{ flex: 'none', width: 24, height: 24, borderRadius: 12, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ticks[i] ? 'var(--good-fill)' : 'transparent', border: ticks[i] ? 0 : '2px solid var(--chevron)', color: '#fff', transition: 'background-color .2s ease' }}>
              {ticks[i] && <IconCheck size={12} />}
            </span>
            <span style={{ fontSize: 15, lineHeight: 1.4, color: ticks[i] ? 'var(--label-2)' : 'var(--label)' }}>{st}</span>
          </button>
        ))}
    </section>
  )
}

/** Ramp-up sets with plate loading for barbell lifts. */
function WarmupSets({ work }: { work: number }) {
  const [open, setOpen] = useState(false)
  const sets = warmupSets(work)
  return (
    <div style={{ margin: '0 16px 10px', borderRadius: 12, background: 'var(--surface-2)' }}>
      <button type="button" className="row" onClick={() => setOpen(!open)} aria-expanded={open} style={{ minHeight: 44, fontSize: 15 }}>
        <span style={{ flex: 1, fontWeight: 600 }}>Warm-up sets · {sets.length}</span>
        <span className="small muted">{open ? 'Hide' : `${sets.map((w) => fmtNum(w.kg)).join(' → ')} kg`}</span>
      </button>
      {open && (
        <>
          {sets.map((w, i) => (
            <div key={i} className="row" style={{ minHeight: 44, fontSize: 15 }}>
              <span className="num" style={{ width: 92, fontWeight: 600 }}>{fmtNum(w.kg)} kg × {w.reps}</span>
              <span className="small muted">{plateText(w.kg)}</span>
            </div>
          ))}
          <div className="row" style={{ minHeight: 44, fontSize: 15 }}>
            <span className="num" style={{ width: 92, fontWeight: 600, color: 'var(--accent-ink)' }}>{fmtNum(work)} kg</span>
            <span className="small muted">Working sets: {plateText(work)}</span>
          </div>
        </>
      )}
    </div>
  )
}

/** Number input that keeps partial text like "27." while typing. */
function NumBox({ value, onChange, label, integer }: { value?: number; onChange: (v: number | undefined) => void; label: string; integer?: boolean }) {
  const [text, setText] = useState(value != null ? fmtNum(value) : '')
  useEffect(() => {
    const parsed = parseFloat(text.replace(',', '.'))
    if ((value ?? NaN) !== parsed && !(value == null && text === '')) setText(value != null ? fmtNum(value) : '')
  }, [value])
  return (
    <input
      aria-label={label}
      className="num"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const v = e.target.value
        setText(v)
        if (v.trim() === '') return onChange(undefined)
        const n = parseFloat(v.replace(',', '.'))
        if (Number.isFinite(n) && n >= 0) onChange(n)
      }}
      style={{ minHeight: 38, width: '100%', border: 0, borderRadius: 10, background: 'var(--surface-2)', textAlign: 'center', fontSize: 17, fontWeight: 600 }}
    />
  )
}

function FinishSheet({ done, total, minutes, records, volume, onClose, onSave, onDiscard }: { done: number; total: number; minutes: number; records: string[]; volume: number; onClose: () => void; onSave: () => void; onDiscard: () => void }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <Sheet onClose={onClose} label="Finish workout">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 4px 0' }}>
        <span className="kicker" style={{ color: 'var(--accent-ink)' }}>{pct >= 100 ? 'Every set done' : `${total - done} sets left`}</span>
        <h2 className="disp" style={{ fontSize: 52 }}>{pct >= 100 ? <>Workout<br />complete</> : <>Finish<br />workout?</>}</h2>
      </div>
      <div className="group" style={{ display: 'flex' }}>
        <SheetStat value={`${minutes}`} label="Minutes" />
        <SheetStat value={`${done}/${total}`} label="Sets" />
        <SheetStat value={volume >= 1000 ? `${fmtNum(Math.round(volume / 100) / 10)}t` : `${Math.round(volume)}`} label={volume >= 1000 ? 'Lifted' : 'kg lifted'} />
      </div>
      {records.length > 0 && (
        <div className="callout good">
          <IconSpark size={20} style={{ color: 'var(--good)' }} />
          <div><b>{records.length === 1 ? 'New personal best' : `${records.length} new personal bests`}</b><div style={{ fontSize: 14 }}>{records.join(', ')}</div></div>
        </div>
      )}
      {done < total && <p className="muted" style={{ fontSize: 15, padding: '0 4px' }}>Unfinished sets are fine. Consistency beats perfect sessions.</p>}
      <Link to="/coach?q=How%20am%20I%20doing%3F" className="small" style={{ alignSelf: 'center' }}>Ask your coach how you’re progressing →</Link>
      <button type="button" className="btn" onClick={onSave}>Save Workout</button>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" className="link-btn" onClick={onClose}>Keep going</button>
        <button type="button" className="link-btn" style={{ color: 'var(--label-2)' }} onClick={onDiscard}>Discard</button>
      </div>
    </Sheet>
  )
}

function SheetStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
      <span className="small muted">{label}</span>
    </div>
  )
}
