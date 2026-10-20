import { Link } from 'react-router-dom'
import { coachCtx, stats } from '../lib/ai/context'
import { fmtNum, history, insights, suggest } from '../lib/coach'
import { allItems, isDeload, phaseOf } from '../data/plan'
import { EXERCISES } from '../data/exercises'
import type { State } from '../lib/store'
import { Portal } from './Chrome'

export function CoachIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="2.6" />
    </svg>
  )
}

/** Round "Coach" button that floats above the tab bar on the main screens. */
export function CoachFab() {
  return (
    <Portal>
      <Link
        to="/coach"
        aria-label="Ask your coach"
        style={{
          position: 'fixed', zIndex: 15, right: 'max(16px, calc(50% - 244px))', bottom: 'calc(var(--tabbar-h) + 14px)',
          width: 52, height: 52, borderRadius: 26, background: 'var(--btn)', color: 'var(--btn-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,.28)',
        }}
      >
        <CoachIcon size={24} />
      </Link>
    </Portal>
  )
}

/** Today's personal briefing from the coach (built-in, instant, offline). */
export function CoachBriefing({ state }: { state: State }) {
  const c = coachCtx(state)
  const s = stats(c)
  const lines: string[] = []
  const items = allItems(c.day)
  if (items.length) {
    // Highlight the lift the user has been progressing, else the day's first strength move.
    const main = items.find((i) => history(state, i.ex).length) ?? items.find((i) => EXERCISES[i.ex].kind !== 'cardio')
    const done = !!state.sessions[c.date]?.finishedAt
    lines.push(done ? `${c.day.short} done today. Nice work: now food, water and sleep.` : `${c.day.short} day, ${phaseOf(c.week, c.program).name.toLowerCase()} phase${isDeload(c.week, c.program) ? ', a lighter deload week' : ''}.`)
    if (main) lines.push(`${done ? 'Next time, ' : ''}${EXERCISES[main.ex].name}: ${suggest(state, main, c.week).text}`)
  } else lines.push('Rest day. A walk, good food and early sleep are today’s training.')
  const left = s.proteinTarget - s.protein
  if (left > 0) lines.push(`${left} g protein to go today${s.cal ? ` · ${s.cal.target.toLocaleString()} kcal target` : ''}.`)
  const tip = insights(state).find((i) => i.tone === 'warn')
  if (tip) lines.push(`${tip.title}: ${tip.text}`)
  return (
    <Link to="/coach" className="group" style={{ padding: '14px 16px', display: 'flex', gap: 12, color: 'var(--label)', alignItems: 'flex-start' }}>
      <span style={{ flex: 'none', width: 36, height: 36, borderRadius: 18, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CoachIcon size={19} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span className="small" style={{ fontWeight: 700, color: 'var(--accent-ink)' }}>Coach</span>
        {lines.slice(0, 3).map((l) => <span key={l} style={{ fontSize: 15, lineHeight: 1.4 }}>{l}</span>)}
        <span className="small muted">Tap to ask anything →</span>
      </span>
    </Link>
  )
}

/** A row of one-tap questions that open the coach with the question asked. */
export function AskCoach({ questions, title = 'Ask your coach' }: { questions: string[]; title?: string }) {
  return (
    <div>
      <h2 className="sec" style={{ marginLeft: 0 }}>{title}</h2>
      <div className="chips">
        {questions.map((q) => (
          <Link key={q} to={`/coach?q=${encodeURIComponent(q)}`} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--label)' }}>
            <span style={{ color: 'var(--accent-ink)', display: 'flex' }}><CoachIcon size={14} /></span>
            {q}
          </Link>
        ))}
      </div>
    </div>
  )
}

/** One-line coach feedback for the check-in screen. */
export function checkinFeedback(state: State) {
  const s = stats(coachCtx(state))
  const parts: string[] = []
  const left = s.proteinTarget - s.protein
  parts.push(left > 0 ? `${left} g protein to go. A chicken serving (45 g) or soy chunks (26 g) gets you close.` : 'Protein target hit. Nice.')
  if (s.cal && s.calsEaten != null) parts.push(s.calsEaten > s.cal.target ? `${(s.calsEaten - s.cal.target).toLocaleString()} kcal over target. Fine once in a while; the weekly average matters.` : `${(s.cal.target - s.calsEaten).toLocaleString()} kcal left today.`)
  if (s.avgSleep != null && s.avgSleep < 7) parts.push(`Sleep is averaging ${fmtNum(Math.round(s.avgSleep * 10) / 10)} h. Aim for 7+ to recover.`)
  return parts
}
