import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Sheet } from '../components/Chrome'
import { IconCheck, IconChevronLeft, IconInfo, IconSpark } from '../components/Icons'
import { ExerciseThumb } from '../components/Media'
import { RestBar } from '../components/RestBar'
import { EXERCISES, type Exercise } from '../data/exercises'
import { allItems, DAY_BY_ID, setsFor, type DayId, type PlanItem } from '../data/plan'
import { fmtNum, lastSets, rangeText, restText, suggest } from '../lib/coach'
import { fmtClock } from '../lib/dates'
import { actions, useStore, type SetLog } from '../lib/store'
import { restTimer } from '../lib/timer'
import { useToday } from '../lib/useToday'

export default function WorkoutScreen() {
  const { dayId } = useParams<{ dayId: DayId }>()
  const day = dayId ? DAY_BY_ID[dayId] : undefined
  const { date, week } = useToday()
  const session = useStore((s) => s.sessions[date])
  const navigate = useNavigate()
  const [finishing, setFinishing] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (day && (!session || session.dayId !== day.id)) actions.startSession(date, day.id)
  }, [day, session, date])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!day || !day.groups.length) return <Navigate to="/" replace />
  if (!session || session.dayId !== day.id) return null

  const items = allItems(day)
  const finished = !!session.finishedAt
  const elapsed = ((session.finishedAt ?? now) - session.startedAt) / 1000
  const total = items.reduce((n, it) => n + setsFor(it, week), 0)
  const done = Object.values(session.log).reduce((n, sets) => n + sets.filter((s) => s.done).length, 0)

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
        {items.map((it, i) => (
          <ExerciseBlock key={it.ex} item={it} week={week} date={date} log={session.log[it.ex]} isLast={i === items.length - 1} />
        ))}
      </div>

      {day.optionalCardio && <p className="sec-foot" style={{ margin: '20px 16px 0' }}>Optional cardio: {day.optionalCardio}.</p>}

      <RestBar bottom="calc(env(safe-area-inset-bottom) + 16px)" />

      {finishing && (
        <FinishSheet
          done={done}
          total={total}
          minutes={Math.round(elapsed / 60)}
          onClose={() => setFinishing(false)}
          onSave={() => {
            actions.finishSession(date)
            restTimer.stop()
            navigate('/', { replace: true })
          }}
          onDiscard={() => {
            if (!window.confirm('Discard this workout? Logged sets will be deleted.')) return
            actions.discardSession(date)
            restTimer.stop()
            navigate('/', { replace: true })
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

function ExerciseBlock({ item, week, date, log, isLast }: { item: PlanItem; week: number; date: string; log?: SetLog[]; isLast: boolean }) {
  const ex = EXERCISES[item.ex]
  const state = useStore((s) => s)
  const tip = useMemo(() => suggest(state, item, week), [state, item, week])
  const prev = useMemo(() => lastSets(state, item.ex, date), [state, item.ex, date])
  const count = setsFor(item, week)
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
    if (nowDone) {
      if ('vibrate' in navigator) navigator.vibrate(12)
      const lastSet = i === sets.length - 1
      if (!(isLast && lastSet) && item.rest[0] > 0) restTimer.start(Math.round((item.rest[0] + item.rest[1]) / 2), ex.name)
    }
  }

  const summary = sets
    .filter((s) => s.done)
    .map((s) => (cols.load && s.load != null ? `${fmtNum(s.load)}×${s.reps ?? 0}` : `${s.reps ?? 0}`))
    .join(', ')

  if (!open) {
    return (
      <button type="button" className="row" onClick={() => setOpen(true)} style={{ minHeight: 64, background: 'var(--good-soft)', margin: '0 12px', width: 'auto', borderRadius: 14 }}>
        <span style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--good-fill)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><IconCheck size={14} /></span>
        <span className="grow"><span style={{ fontWeight: 600 }}>{ex.name}</span><span className="sub num">{summary}</span></span>
        <span className="small muted">Edit</span>
      </button>
    )
  }

  const grid = cols.load ? '34px minmax(0,1fr) 78px 62px 44px' : '34px minmax(0,1fr) 78px 44px'

  return (
    <section style={{ padding: '10px 0 14px', borderBottom: '1px solid var(--sep)', animation: 'fade .3s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 8px 16px' }}>
        <ExerciseThumb ex={ex} size={44} radius={8} />
        <Link to={`/exercise/${ex.key}`} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 17, fontWeight: 600 }}>{ex.name}</span>
          <span className="small muted">{rangeText(item, count)}{item.rest[0] ? ` · rest ${restText(item.rest)}` : ''}</span>
        </Link>
        <Link to={`/exercise/${ex.key}?tab=muscles`} aria-label={`Muscles and video: ${ex.name}`} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconInfo size={22} /></Link>
      </div>

      {ex.kind !== 'cardio' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '0 16px 10px', fontSize: 14, lineHeight: 1.4, color: tip.up ? 'var(--accent-ink)' : 'var(--label-2)' }}>
          <IconSpark size={16} style={{ flex: 'none', marginTop: 2 }} />
          <span>{tip.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 8, alignItems: 'center', padding: '0 16px', minHeight: 26, fontSize: 12, fontWeight: 600, color: 'var(--label-2)', letterSpacing: '.04em' }}>
        <span>SET</span>
        <span>PREVIOUS</span>
        {cols.load && <span style={{ textAlign: 'center' }}>{cols.load}</span>}
        <span style={{ textAlign: 'center' }}>{cols.reps}</span>
        <span />
      </div>

      {sets.map((s, i) => {
        const p = prev?.sets[i]
        const prevText = p ? (cols.load && p.load != null ? `${fmtNum(p.load)} × ${p.reps ?? 0}` : `${p.reps ?? 0}`) : '—'
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: grid, gap: 8, alignItems: 'center', padding: '5px 16px', background: s.done ? 'var(--good-soft)' : 'transparent', transition: 'background-color .3s ease' }}>
            <span className="num" style={{ fontWeight: 600 }}>{i + 1}</span>
            <span className="num muted" style={{ fontSize: 15 }}>{prevText}</span>
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

      <div style={{ display: 'flex', gap: 8, padding: '10px 16px 0' }}>
        <button type="button" className="chip" style={{ flex: 1, minHeight: 40 }} onClick={() => save([...sets, { load: sets.at(-1)?.load ?? tip.load, reps: sets.at(-1)?.reps ?? tip.reps, done: false }])}>+ Add set</button>
        {sets.length > 1 && <button type="button" className="chip" style={{ minHeight: 40 }} onClick={() => save(sets.slice(0, -1))}>Remove set</button>}
      </div>
    </section>
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
        if (Number.isFinite(n)) onChange(n)
      }}
      style={{ minHeight: 38, width: '100%', border: 0, borderRadius: 10, background: 'var(--surface-2)', textAlign: 'center', fontSize: 17, fontWeight: 600 }}
    />
  )
}

function FinishSheet({ done, total, minutes, onClose, onSave, onDiscard }: { done: number; total: number; minutes: number; onClose: () => void; onSave: () => void; onDiscard: () => void }) {
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
        <SheetStat value={`${pct}%`} label="Done" />
      </div>
      {done < total && <p className="muted" style={{ fontSize: 15, padding: '0 4px' }}>Unfinished sets are fine. Consistency beats perfect sessions.</p>}
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
