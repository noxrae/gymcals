import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BottomBar, FloatingBack } from '../components/Chrome'
import { Chevron, IconInfo } from '../components/Icons'
import { ExerciseThumb } from '../components/Media'
import { dayMix, groupType, TypeBadge } from '../components/TypeBadge'
import { EXERCISES, photoUrl } from '../data/exercises'
import { allItems, ctxForSession, dayFor, setsFor, type DayId } from '../data/plan'
import { rangeText } from '../lib/coach'
import { actions, useStore } from '../lib/store'
import { useToday } from '../lib/useToday'

export default function DayScreen() {
  const { dayId } = useParams<{ dayId: DayId }>()
  const { date, week, dayId: todayId, fiveDay, ctx, program, deload, phase } = useToday()
  const session = useStore((s) => s.sessions[date])
  const day = dayId ? dayFor(dayId, fiveDay, session && session.dayId === dayId ? ctxForSession(ctx, session.plan) : ctx) : undefined
  const navigate = useNavigate()
  if (!day) return <Navigate to="/" replace />

  const items = allItems(day)
  const sets = items.reduce((n, it) => n + setsFor(it, week, program), 0)
  const isToday = day.id === todayId
  const inProgress = session && session.dayId === day.id && !session.finishedAt
  const doneToday = session && session.dayId === day.id && session.finishedAt

  const start = () => {
    if (session && session.dayId !== day.id && Object.keys(session.log).length) {
      const other = dayFor(session.dayId, fiveDay, ctxForSession(ctx, session.plan)).short
      if (!window.confirm(`You already logged ${other} today. Replace it with ${day.short}?`)) return
      actions.discardSession(date)
    }
    actions.startSession(date, day.id)
    navigate(`/workout/${day.id}`)
  }

  if (!day.groups.length) {
    return (
      <div className="screen no-tabs">
        <FloatingBack />
        <div style={{ paddingTop: 60, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="kicker" style={{ color: 'var(--accent-ink)' }}>{day.id === 'sun' ? 'Sunday' : `${{ mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' }[day.id]} · 5-day mode`}</span>
          <h1 className="disp" style={{ fontSize: 64 }}>{day.name}</h1>
          <p className="muted" style={{ lineHeight: 1.5 }}>No structured gym session and no hard calisthenics. Normal walking is fine. Prioritise sleep, food and water.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen flush no-tabs" style={{ background: 'var(--surface)' }}>
      <div className="hero" style={{ height: 'min(84vw, 340px)', borderRadius: 0 }}>
        <img src={photoUrl(day.hero)} alt="" style={{ objectPosition: '50% 28%' }} />
        <FloatingBack />
        <div className="content" style={{ left: 16, right: 16, bottom: 18, gap: 8 }}>
          <span className="kicker">{day.id.toUpperCase()} · Week {week} · {phase.name}{deload ? ' · deload' : ''}</span>
          <h1 className="disp" style={{ fontSize: 'clamp(44px, 14vw, 58px)' }}>{day.name}</h1>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '18px 16px', borderBottom: '1px solid var(--sep)' }}>
        <Stat value={dayMix(day).gym} label="Gym" />
        <span style={{ width: 1, background: 'var(--sep)' }} />
        <Stat value={dayMix(day).cali} label="Calisthenics" />
        <span style={{ width: 1, background: 'var(--sep)' }} />
        <Stat value={sets} label="Sets" />
        <span style={{ width: 1, background: 'var(--sep)' }} />
        <Stat value={day.minutes} label="Minutes" />
      </div>

      {deload && (
        <div className="callout accent" style={{ margin: '16px 16px 0' }}>
          <span>Deload week: sets are cut by about 40%. Keep the same weights and stop well short of failure.</span>
        </div>
      )}

      {day.groups.map((g) => (
        <section key={g.title}>
          <h2 className="sec" style={{ margin: 0, padding: '22px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TypeBadge type={groupType(g)} />
            <span>{g.title}</span>
          </h2>
          {g.items.map((it) => {
            const ex = EXERCISES[it.ex]
            return (
              <div key={it.ex} className="row" style={{ ['--inset' as string]: '84px', padding: '8px 8px 8px 16px' }}>
                <Link to={`/exercise/${ex.key}?day=${day.id}`} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--label)' }}>
                  <ExerciseThumb ex={ex} />
                  <span className="grow">
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {ex.name}
                      {it.added && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-ink)', background: 'var(--accent-soft)', padding: '2px 7px', borderRadius: 999 }}>NEW</span>}
                    </span>
                    <span className="sub">{rangeText(it, setsFor(it, week, program))}{it.note ? ` · ${it.note}` : ''}</span>
                    {it.alt && <span className="small" style={{ color: 'var(--accent-ink)', fontWeight: 600 }}>or {it.alt.map((k) => EXERCISES[k].name).join(' · ')} — switch in the workout</span>}
                  </span>
                </Link>
                {ex.primary.length > 0 && (
                  <Link to={`/exercise/${ex.key}?tab=muscles&day=${day.id}`} aria-label={`Muscles worked: ${ex.name}`} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 22, flex: 'none' }}>
                    <IconInfo size={22} />
                  </Link>
                )}
              </div>
            )
          })}
        </section>
      ))}

      {day.optionalCardio && <p className="sec-foot" style={{ margin: '16px 16px 0' }}>Optional cardio: {day.optionalCardio}. Skip it first if you feel tired.</p>}

      <BottomBar>
        {doneToday ? (
          <Link to={`/workout/${day.id}`} className="btn secondary">Review today’s workout <Chevron /></Link>
        ) : (
          <button type="button" className="btn" onClick={start}>
            {inProgress ? 'Continue Workout' : isToday ? 'Start Workout' : `Do ${day.short} today`}
          </button>
        )}
      </BottomBar>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{value}</span>
      <span className="small muted">{label}</span>
    </div>
  )
}
