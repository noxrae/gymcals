import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '../data/exercises'
import { ctxForSession, dayFor, daysFor, planKey, planLabel } from '../data/plan'
import { avgWeight, calorieTarget, fmtNum, insights } from '../lib/coach'
import { addDays, daysBetween, fmtLong, mondayOf } from '../lib/dates'
import { useStore } from '../lib/store'
import { weekReview } from '../lib/review'
import { useToday } from '../lib/useToday'
import { WeekReviewCard } from '../components/WeekReviewCard'
import { mixText } from '../components/TypeBadge'
import { CoachBriefing } from '../components/CoachBits'
import { Chevron, IconAlert, IconCheck, IconGear, IconMoon, IconPlay, IconSpark } from '../components/Icons'

export default function TodayScreen() {
  const { date, week, beforeStart, finished, start, day, fiveDay, dayId, ctx, program, deload } = useToday()
  const state = useStore((s) => s)
  const session = state.sessions[date]
  const checkin = state.checkins[date] ?? {}
  const avg = avgWeight(state.checkins, date)
  const cal = calorieTarget(state, date)
  const rank = { warn: 0, accent: 1, good: 2 }
  const tips = insights(state, date).sort((a, b) => rank[a.tone] - rank[b.tone])
  const [allTips, setAllTips] = useState(false)
  const monday = mondayOf(date)
  // If a different day's workout was done today (e.g. a missed session), show that one.
  const shown = session ? dayFor(session.dayId, fiveDay, ctxForSession(ctx, session.plan)) : day

  return (
    <div className="screen">
      <div className="title-head">
        <div>
          <div className="eyebrow">{fmtLong(date)}</div>
          <h1 className="large-title">Today</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15 }}>
            {beforeStart ? `Starts in ${daysBetween(date, start!)} d` : finished ? 'Plan complete' : <><b>Week {week}</b> <span className="muted">of {program.weeks}</span></>}
          </span>
          <Link to="/settings" aria-label="Settings" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-2)' }}>
            <IconGear size={22} />
          </Link>
        </div>
      </div>

      {shown.groups.length ? (
        <Link to={session ? `/workout/${shown.id}` : `/day/${shown.id}`} className="hero" style={{ height: 'min(118vw, 470px)' }}>
          <img src={photoUrl(shown.hero)} alt="" style={{ objectPosition: '50% 30%' }} />
          <div className="content">
            <span className="kicker">{session && (session.plan ?? 'original') !== planKey(ctx.template ?? 'original', !!ctx.extended) ? `${session.finishedAt ? 'Done' : 'Started'} with ${planLabel(session.plan)}` : deload ? 'Deload week · lighter' : `${shown.short} day`}</span>
            <span className="disp" style={{ fontSize: 'clamp(48px, 15vw, 64px)' }}>{shown.name}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,.85)' }}>
                {session?.finishedAt ? `Done · ${Math.round((session.finishedAt - session.startedAt) / 60000)} min` : `${mixText(shown)} · ${shown.minutes} min`}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 20px', borderRadius: 999, background: '#fff', color: '#000', fontSize: 16, fontWeight: 600, flex: 'none' }}>
                {session?.finishedAt ? <>Review</> : session ? <>Continue</> : <>Start <IconPlay size={14} /></>}
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <div className="hero" style={{ height: 300, background: 'var(--ink-card)' }}>
          <div className="content">
            <IconMoon size={32} />
            <span className="disp" style={{ fontSize: 60 }}>Rest day</span>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', lineHeight: 1.45 }}>No gym today. Walk, eat well and sleep 7–9 hours. Recovery is when you get stronger.</span>
          </div>
        </div>
      )}

      <CoachBriefing state={state} />

      {dayId === 'sun' && !beforeStart && start! <= monday && <WeekReviewCard week={week} review={weekReview(state, monday, week)} />}

      {tips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(allTips ? tips : tips.slice(0, 2)).map((t) => (
            <Link key={t.title} to={t.to ?? '/'} className={`callout ${t.tone}`} style={{ color: 'var(--label)' }}>
              {t.tone === 'warn' ? <IconAlert size={20} style={{ color: 'var(--warn)' }} /> : <IconSpark size={20} style={{ color: t.tone === 'good' ? 'var(--good)' : 'var(--accent-ink)' }} />}
              <div style={{ flex: 1 }}><b>{t.title}</b><div className="muted" style={{ fontSize: 14 }}>{t.text}</div></div>
              <Chevron />
            </Link>
          ))}
          {tips.length > 2 && (
            <button type="button" className="link-btn" style={{ alignSelf: 'flex-start', fontSize: 15 }} onClick={() => setAllTips(!allTips)}>
              {allTips ? 'Show less' : `Show ${tips.length - 2} more`}
            </button>
          )}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginRight: 16 }}>
          <h2 className="sec">This week</h2>
          <span className="small muted num" style={{ marginBottom: 8 }}>
            {daysFor(fiveDay, ctx).filter((d, i) => d.groups.length && state.sessions[addDays(monday, i)]?.finishedAt).length} of {daysFor(fiveDay, ctx).filter((d) => d.groups.length).length} done
          </span>
        </div>
        <div className="group" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', padding: '14px 4px' }}>
          {daysFor(fiveDay, ctx).map((d, i) => {
            const dDate = addDays(monday, i)
            const done = !!state.sessions[dDate]?.finishedAt
            const isToday = dDate === date
            return (
              <Link key={d.id} to={`/day/${d.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--label)' }} aria-label={`${d.name}${done ? ', done' : ''}`}>
                <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 600, color: isToday ? 'var(--accent-ink)' : 'var(--label-2)' }}>{d.id.slice(0, 1).toUpperCase()}</span>
                <span
                  style={{
                    width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600,
                    background: done ? 'var(--label)' : !d.groups.length ? 'transparent' : 'var(--surface-2)',
                    color: done ? 'var(--bg)' : 'var(--label-2)',
                    boxShadow: isToday && !done ? 'inset 0 0 0 2px var(--accent)' : undefined,
                  }}
                >
                  {done ? <IconCheck size={13} /> : !d.groups.length ? <IconMoon size={16} /> : Number(dDate.slice(8))}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="sec">Daily targets</h2>
        <div className="group">
          <Link to={cal ? '/log' : '/settings?profile=1'} className="row">
            <span style={{ flex: 1 }}>Calories</span>
            <span className="value num">{cal ? `${(checkin.calories ?? 0).toLocaleString()} of ${cal.target.toLocaleString()} kcal` : 'Set your target'}</span>
            <Chevron />
          </Link>
          <Link to="/log" className="row">
            <span style={{ flex: 1 }}>Protein</span>
            <span className="value num">{checkin.protein ?? 0} of {state.settings.proteinTarget} g</span>
            <Chevron />
          </Link>
          <Link to="/log" className="row">
            <span style={{ flex: 1 }}>Steps</span>
            <span className="value num">{checkin.steps != null ? checkin.steps.toLocaleString() : '—'} of {state.settings.stepTarget.toLocaleString()}</span>
            <Chevron />
          </Link>
          <Link to="/progress" className="row">
            <span style={{ flex: 1 }}>Weight</span>
            <span className="value num">{avg != null ? `${fmtNum(Math.round(avg * 10) / 10)} kg avg` : 'Log a weigh-in'}</span>
            <Chevron />
          </Link>
          <Link to="/log" className="row">
            <span style={{ flex: 1 }}>Sleep</span>
            <span className="value num">{checkin.sleep != null ? `${fmtNum(checkin.sleep)} h` : '—'}</span>
            <Chevron />
          </Link>
        </div>
      </div>
    </div>
  )
}
