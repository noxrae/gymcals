import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chevron, IconCheckCircle, IconMoon } from '../components/Icons'
import { ExerciseThumb } from '../components/Media'
import { mixText } from '../components/TypeBadge'
import { WhyPlan } from '../components/WhyPlan'
import { EXERCISES } from '../data/exercises'
import { daysFor, isDeload, isMaintenance, LENGTHS, planKey, planLabel, PROGRAMS, TEMPLATES, weekFocus, type ProgramId, type TemplateId } from '../data/plan'
import { Toggle } from '../components/Toggle'
import { addDays, mondayOf } from '../lib/dates'
import { actions, useStore } from '../lib/store'
import { showToast } from '../lib/toast'
import { useToday } from '../lib/useToday'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function PlanScreen() {
  const { date, week, rawWeek, dayId, fiveDay, ctx, program, template, extended, phase, deload, maintenanceWeek } = useToday()
  const sessions = useStore((s) => s.sessions)
  const [view, setView] = useState<'week' | 'all'>('week')
  const monday = mondayOf(date)

  const choose = (id: ProgramId) => {
    if (id === program.id) return
    actions.setSettings({ program: id })
    const next = PROGRAMS[id]
    showToast(rawWeek > next.weeks ? `Switched to ${next.name}. You’re past week ${next.weeks}, so this plan is complete.` : `Switched to ${next.name}. You’re in week ${Math.max(1, rawWeek)} of ${next.weeks}.`)
  }

  const planName = (t: TemplateId, x: boolean) => `${TEMPLATES[t].name}${t === 'athletic' && x ? ' · Extended' : ''}`
  const switchPlan = (t: TemplateId, x: boolean) => {
    if (t === template && x === extended) return
    const before = { t: template, x: extended }
    actions.setPlan(t, x, date)
    showToast(`Switched to the ${planName(t, x)} plan. Your history stays.`, { action: { label: 'Undo', run: () => actions.setPlan(before.t, before.x, date) } })
  }

  return (
    <div className="screen">
      <h1 className="large-title" style={{ padding: '8px 4px 0' }}>Plan</h1>

      <div>
        <h2 className="sec">Weekly plan</h2>
        <div className="seg" role="group" aria-label="Weekly plan">
          {(['original', 'athletic', 'mastery'] as TemplateId[]).map((t) => (
            <button key={t} type="button" aria-pressed={template === t} onClick={() => switchPlan(t, t === 'athletic' ? extended : false)}>{TEMPLATES[t].name}</button>
          ))}
        </div>
        {template === 'athletic' && (
          <div className="group" style={{ marginTop: 12 }}>
            <Toggle label="Extended" sub="Heavier version: more exercises and sets each day" on={extended} onChange={(v) => switchPlan('athletic', v)} />
          </div>
        )}
        <p className="sec-foot" style={{ marginLeft: 4 }}>{TEMPLATES[template].summary}</p>
      </div>

      <div>
        <h2 className="sec">Length</h2>
        <div className="seg" role="group" aria-label="Program length">
          {LENGTHS.map((id) => (
            <button key={id} type="button" aria-pressed={program.id === id} onClick={() => choose(id)}>{PROGRAMS[id].name}</button>
          ))}
        </div>
        <p className="sec-foot" style={{ marginLeft: 4 }}>{program.summary} Weeks 1–12 are the same in both lengths; from week 13, 4 months adds a peak block and 6 months adds a muscle-building block, then strength (see “All {program.weeks} weeks”). Switch any time; your history stays.</p>
      </div>

      <div style={{ borderRadius: 20, background: 'var(--ink-card)', color: '#fff', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="kicker">{phase.name}{deload ? ' · deload' : ''}{maintenanceWeek ? ' · maintenance' : ''}</span>
            <span className="disp" style={{ fontSize: 84 }}>Week {String(week).padStart(2, '0')}</span>
          </div>
          <span style={{ fontSize: 15, color: '#a1a1a6', paddingBottom: 6 }}>of {program.weeks}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${program.weeks}, minmax(0, 1fr))`, gap: program.weeks > 16 ? 2 : 4 }} role="img" aria-label={`Week ${week} of ${program.weeks}`}>
          {Array.from({ length: program.weeks }, (_, i) => (
            <span key={i} style={{ height: 6, borderRadius: 3, background: i + 1 < week ? '#fff' : i + 1 === week ? 'var(--accent)' : isDeload(i + 1, program) ? '#5a5a5e' : '#3a3a3c' }} />
          ))}
        </div>
        <span style={{ fontSize: 15, lineHeight: 1.45, color: '#d1d1d6' }}>{weekFocus(week, program)}</span>
      </div>

      <div className="seg" role="tablist" aria-label="Plan view">
        <button type="button" role="tab" aria-selected={view === 'week'} onClick={() => setView('week')}>This week</button>
        <button type="button" role="tab" aria-selected={view === 'all'} onClick={() => setView('all')}>All {program.weeks} weeks</button>
      </div>

      <div key={view} style={{ animation: 'fade .3s ease both', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {view === 'week' ? (
          <div className="group">
            {daysFor(fiveDay, ctx).map((d, i) => {
              const dDate = addDays(monday, i)
              const done = !!sessions[dDate]?.finishedAt
              const isToday = d.id === dayId
              return (
                <Link key={d.id} to={`/day/${d.id}`} className="row" style={{ ['--inset' as string]: '84px', minHeight: 72 }}>
                  {d.hero ? <ExerciseThumb ex={EXERCISES[d.hero]} /> : <span className="thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-2)' }}><IconMoon /></span>}
                  <span className="grow">
                    <span className="small" style={{ color: isToday ? 'var(--accent-ink)' : 'var(--label-2)', fontWeight: isToday ? 600 : 400 }}>{isToday ? 'Today' : WEEKDAYS[i]}</span>
                    <span style={{ fontWeight: isToday ? 600 : 400 }}>{d.name}</span>
                    {d.groups.length > 0 && <span className="sub">{mixText(d)}</span>}
                    {done && (sessions[dDate]?.plan ?? 'original') !== planKey(template, extended) && <span className="small" style={{ color: 'var(--good)', fontWeight: 600 }}>Done with {planLabel(sessions[dDate]?.plan)}</span>}
                  </span>
                  {done ? <IconCheckCircle /> : <span className="small muted">{d.minutes ? `${d.minutes} min` : 'Walk only'}</span>}
                  <Chevron />
                </Link>
              )
            })}
          </div>
        ) : (
          program.phases.map((p) => (
            <div key={p.id}>
              <h2 className="sec">{p.name} · weeks {p.weeks[0]}–{p.weeks[1]}</h2>
              <div className="group">
                {Array.from({ length: p.weeks[1] - p.weeks[0] + 1 }, (_, i) => p.weeks[0] + i).map((w) => (
                  <div key={w} className="row" style={{ alignItems: 'flex-start', background: w === week ? 'var(--accent-soft)' : undefined }}>
                    <span className="disp" style={{ fontSize: 28, width: 40, flex: 'none', color: w < week ? 'var(--label-3)' : w === week ? 'var(--accent-ink)' : 'var(--label)' }}>{String(w).padStart(2, '0')}</span>
                    <span className="grow">
                      {(isDeload(w, program) || isMaintenance(w, program)) && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-ink)', letterSpacing: '.06em' }}>
                          {[isDeload(w, program) && 'DELOAD', isMaintenance(w, program) && 'MAINTENANCE CALORIES'].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      <span style={{ fontSize: 15, lineHeight: 1.4, color: w < week ? 'var(--label-2)' : 'var(--label)' }}>{weekFocus(w, program)}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="sec-foot">{p.text}</p>
            </div>
          ))
        )}
      </div>

      <WhyPlan days={daysFor(fiveDay, ctx)} deload={program.deloads[0]} />
    </div>
  )
}
