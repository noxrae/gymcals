import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chevron, IconCheckCircle, IconMoon } from '../components/Icons'
import { ExerciseThumb } from '../components/Media'
import { EXERCISES } from '../data/exercises'
import { daysFor, DELOAD_WEEK, PHASES, phaseOf, TOTAL_WEEKS, WEEK_FOCUS } from '../data/plan'
import { addDays, mondayOf } from '../lib/dates'
import { useStore } from '../lib/store'
import { useToday } from '../lib/useToday'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function PlanScreen() {
  const { date, week, dayId, fiveDay } = useToday()
  const sessions = useStore((s) => s.sessions)
  const [view, setView] = useState<'week' | 'all'>('week')
  const phase = phaseOf(week)
  const monday = mondayOf(date)

  return (
    <div className="screen">
      <h1 className="large-title" style={{ padding: '8px 4px 0' }}>Plan</h1>

      <div style={{ borderRadius: 20, background: 'var(--ink-card)', color: '#fff', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="kicker">{phase.name} phase{week === DELOAD_WEEK ? ' · deload' : ''}</span>
            <span className="disp" style={{ fontSize: 84 }}>Week {String(week).padStart(2, '0')}</span>
          </div>
          <span style={{ fontSize: 15, color: '#a1a1a6', paddingBottom: 6 }}>of 12</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4 }} role="img" aria-label={`Week ${week} of 12`}>
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
            <span key={i} style={{ height: 6, borderRadius: 3, background: i + 1 < week ? '#fff' : i + 1 === week ? 'var(--accent)' : '#3a3a3c' }} />
          ))}
        </div>
        <span style={{ fontSize: 15, lineHeight: 1.45, color: '#d1d1d6' }}>{WEEK_FOCUS[week]}</span>
      </div>

      <div className="seg" role="tablist" aria-label="Plan view">
        <button type="button" role="tab" aria-selected={view === 'week'} onClick={() => setView('week')}>This week</button>
        <button type="button" role="tab" aria-selected={view === 'all'} onClick={() => setView('all')}>All 12 weeks</button>
      </div>

      <div key={view} style={{ animation: 'fade .3s ease both', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {view === 'week' ? (
          <div className="group">
            {daysFor(fiveDay).map((d, i) => {
              const dDate = addDays(monday, i)
              const done = !!sessions[dDate]?.finishedAt
              const isToday = d.id === dayId
              return (
                <Link key={d.id} to={`/day/${d.id}`} className="row" style={{ ['--inset' as string]: '84px', minHeight: 72 }}>
                  {d.hero ? <ExerciseThumb ex={EXERCISES[d.hero]} /> : <span className="thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-2)' }}><IconMoon /></span>}
                  <span className="grow">
                    <span className="small" style={{ color: isToday ? 'var(--accent-ink)' : 'var(--label-2)', fontWeight: isToday ? 600 : 400 }}>{isToday ? 'Today' : WEEKDAYS[i]}</span>
                    <span style={{ fontWeight: isToday ? 600 : 400 }}>{d.name}</span>
                  </span>
                  {done ? <IconCheckCircle /> : <span className="small muted">{d.minutes ? `${d.minutes} min` : 'Walk only'}</span>}
                  <Chevron />
                </Link>
              )
            })}
          </div>
        ) : (
          PHASES.map((p) => (
            <div key={p.name}>
              <h2 className="sec">{p.name} · weeks {p.weeks[0]}–{p.weeks[1]}</h2>
              <div className="group">
                {Array.from({ length: p.weeks[1] - p.weeks[0] + 1 }, (_, i) => p.weeks[0] + i).map((w) => (
                  <div key={w} className="row" style={{ alignItems: 'flex-start', background: w === week ? 'var(--accent-soft)' : undefined }}>
                    <span className="disp" style={{ fontSize: 28, width: 40, flex: 'none', color: w < week ? 'var(--label-3)' : w === week ? 'var(--accent-ink)' : 'var(--label)' }}>{String(w).padStart(2, '0')}</span>
                    <span className="grow">
                      {w === DELOAD_WEEK && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-ink)', letterSpacing: '.06em' }}>DELOAD</span>}
                      <span style={{ fontSize: 15, lineHeight: 1.4, color: w < week ? 'var(--label-2)' : 'var(--label)' }}>{WEEK_FOCUS[w]}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="sec-foot">{p.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
