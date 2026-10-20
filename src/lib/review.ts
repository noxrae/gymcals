import { EXERCISES } from '../data/exercises'
import { daysFor, programOf, templateOf, weekFocus } from '../data/plan'
import { avgWeight } from './coach'
import { addDays } from './dates'
import type { SetLog, State } from './store'

export interface WeekReview {
  sessions: number
  planned: number
  sets: number
  records: string[]
  weightChange: number | null
  waist: number | null
  protein: number | null
  sleep: number | null
  nextFocus: string
}

/** Score used to compare sets: heavier is better, except assistance where lighter is better. */
function bestScore(kind: string, sets: SetLog[]) {
  if (kind === 'assist') return -Math.min(...sets.map((s) => s.load ?? 99))
  if (kind === 'weight') return Math.max(...sets.map((s) => (s.load ?? 0) * 1000 + (s.reps ?? 0)))
  return Math.max(...sets.map((s) => s.reps ?? 0))
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/** Summary of the Monday–Sunday week that starts on `monday`. */
export function weekReview(state: State, monday: string, week: number): WeekReview {
  const sunday = addDays(monday, 6)
  const inWeek = (d: string) => d >= monday && d <= sunday
  const sessions = Object.values(state.sessions).filter((s) => inWeek(s.date) && s.finishedAt)

  const records: string[] = []
  const thisWeek: Record<string, SetLog[]> = {}
  for (const s of sessions) for (const [ex, sets] of Object.entries(s.log)) thisWeek[ex] = [...(thisWeek[ex] ?? []), ...sets.filter((x) => x.done)]
  for (const [key, sets] of Object.entries(thisWeek)) {
    const ex = EXERCISES[key]
    if (!ex || !sets.length || ex.kind === 'cardio') continue
    const before = Object.values(state.sessions).filter((s) => s.date < monday).flatMap((s) => (s.log[key] ?? []).filter((x) => x.done))
    if (before.length && bestScore(ex.kind, sets) > bestScore(ex.kind, before)) records.push(ex.name)
  }

  const now = avgWeight(state.checkins, sunday)
  const prev = avgWeight(state.checkins, addDays(monday, -1))
  const days = Object.entries(state.checkins).filter(([d]) => inWeek(d)).map(([, c]) => c)
  const waists = days.map((c) => c.waist).filter((v): v is number => v != null)

  return {
    sessions: sessions.length,
    planned: daysFor(state.settings.fiveDay, { template: templateOf(state.settings.plan), extended: !!state.settings.extended }).filter((d) => d.groups.length).length,
    sets: Object.values(thisWeek).reduce((n, s) => n + s.length, 0),
    records,
    weightChange: now != null && prev != null ? now - prev : null,
    waist: waists.at(-1) ?? null,
    protein: avg(days.map((c) => c.protein).filter((v): v is number => v != null)),
    sleep: avg(days.map((c) => c.sleep).filter((v): v is number => v != null)),
    nextFocus: weekFocus(week + 1, programOf(state.settings.program)) || 'Plan complete. Compare your numbers with week 1 and choose your next program in Settings.',
  }
}
