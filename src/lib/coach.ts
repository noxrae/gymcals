import { EXERCISES, type Exercise } from '../data/exercises'
import { DELOAD_WEEK, type PlanItem } from '../data/plan'
import { addDays, daysBetween, today, weekOf } from './dates'
import type { Checkin, SetLog, State } from './store'

export const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export const unitOf = (ex: Exercise) =>
  ex.kind === 'time' ? 's' : ex.kind === 'cardio' ? 'min' : 'reps'

export const rangeText = (item: PlanItem, sets?: number) => {
  const ex = EXERCISES[item.ex]
  const n = sets ?? item.sets
  const range = item.min === item.max ? `${item.min}` : `${item.min}–${item.max}`
  if (ex.kind === 'cardio') return `${range} min`
  const unit = ex.kind === 'time' ? ' sec' : ''
  return `${n} × ${range}${unit}${item.perSide ? ' each side' : ''}`
}

export const restText = ([a, b]: [number, number]) => {
  if (!a) return ''
  const f = (s: number) => (s >= 120 && s % 60 === 0 ? `${s / 60} min` : `${s} s`)
  return a === b ? f(a) : b >= 120 ? `${fmtNum(a / 60)}–${fmtNum(b / 60)} min` : `${a}–${b} s`
}

/** Most recent logged sets for an exercise before a date. */
export function lastSets(state: State, ex: string, before = today()): { date: string; sets: SetLog[] } | null {
  const dates = Object.keys(state.sessions).filter((d) => d < before).sort().reverse()
  for (const d of dates) {
    const sets = state.sessions[d].log[ex]?.filter((s) => s.done)
    if (sets?.length) return { date: d, sets }
  }
  return null
}

export function history(state: State, ex: string) {
  return Object.keys(state.sessions)
    .sort()
    .map((d) => ({ date: d, sets: (state.sessions[d].log[ex] ?? []).filter((s) => s.done) }))
    .filter((h) => h.sets.length)
}

export interface Suggestion { load?: number; reps: number; text: string; up: boolean }

/** Double progression: stay at a load until every set reaches the top of the range, then step up. */
export function suggest(state: State, item: PlanItem, week: number): Suggestion {
  const ex = EXERCISES[item.ex]
  const last = lastSets(state, item.ex)
  const deload = week === DELOAD_WEEK

  if (!last) {
    const first =
      ex.kind === 'assist' ? 'First time: pick assistance that allows clean reps with 2 to spare.'
      : ex.kind === 'weight' ? 'First time: pick a weight you could lift 2–3 more reps with.'
      : ex.kind === 'time' ? `Hold for ${item.min}–${item.max} seconds with good form.`
      : ex.kind === 'cardio' ? 'Steady pace. You should still be able to talk.'
      : 'Clean reps only. Stop 2 reps before failure.'
    const baseAssist = ex.kind === 'assist' ? state.baseline?.pullAssist : undefined
    if (baseAssist != null) return { load: baseAssist, reps: item.min, text: `Starting from your baseline: ${fmtNum(baseAssist)} kg assist. Adjust if reps aren’t clean.`, up: false }
    return { reps: item.min, text: first, up: false }
  }

  const loads = last.sets.map((s) => s.load ?? 0)
  const lastLoad = ex.kind === 'assist' ? Math.min(...loads) : Math.max(...loads)
  const reps = last.sets.map((s) => s.reps ?? 0)
  const topped = reps.length >= Math.min(item.sets, 2) && reps.every((r) => r >= item.max)
  const repsTarget = Math.min(item.max, Math.max(item.min, Math.min(...reps) + 1))
  const was = reps.join(', ')

  if (deload) {
    return { load: lastLoad || undefined, reps: Math.max(item.min, Math.min(...reps)), text: 'Deload week: same weight, fewer sets, stop well short of failure.', up: false }
  }

  switch (ex.kind) {
    case 'weight':
      if (topped) {
        const next = lastLoad + ex.step
        return { load: next, reps: item.min, text: `You hit ${item.max} on every set. Try ${fmtNum(next)} kg and rebuild the reps.`, up: true }
      }
      return { load: lastLoad, reps: repsTarget, text: `Same ${fmtNum(lastLoad)} kg. Beat last time (${was}) by a rep.`, up: false }
    case 'assist':
      if (topped) {
        const next = Math.max(0, lastLoad - ex.step)
        return next === 0
          ? { load: 0, reps: 1, text: 'You topped out the lightest assistance. Try a full, unassisted pull-up!', up: true }
          : { load: next, reps: item.min, text: `You hit ${item.max} on every set. Drop to ${fmtNum(next)} kg assist.`, up: true }
      }
      return { load: lastLoad, reps: repsTarget, text: `Same ${fmtNum(lastLoad)} kg assist. Beat last time (${was}) by a rep.`, up: false }
    case 'time':
      if (topped) return { reps: item.max + 5, text: `You held ${item.max} s on every set. Try ${item.max + 5} s.`, up: true }
      return { reps: repsTarget, text: `Last time: ${was} s. Add a few seconds.`, up: false }
    case 'cardio':
      return { reps: Math.min(item.max, (reps[0] ?? item.min) + 5), text: 'Add about 5 minutes if you are recovering well.', up: false }
    default:
      if (topped) {
        const harder = ex.key === 'push-up' ? 'Try decline or slow-tempo push-ups.' : 'Make it harder with a slower tempo.'
        return { reps: item.max, text: `You hit ${item.max} on every set. ${harder}`, up: true }
      }
      return { reps: repsTarget, text: `Last time: ${was}. Beat it by a rep.`, up: false }
  }
}

// ---------- body-weight trend ----------

export function weightSeries(checkins: Record<string, Checkin>) {
  return Object.entries(checkins)
    .filter(([, c]) => c.weight != null)
    .map(([date, c]) => ({ date, value: c.weight as number }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Rolling 7-day average ending on a date. */
export function avgWeight(checkins: Record<string, Checkin>, end = today()) {
  const start = addDays(end, -6)
  const vals = weightSeries(checkins).filter((p) => p.date >= start && p.date <= end).map((p) => p.value)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

/** Plan-week averages for charts: [{ week, value }]. */
export function weeklyAverages(checkins: Record<string, Checkin>, start: string | null, key: 'weight' | 'waist' = 'weight') {
  const buckets = new Map<number, number[]>()
  for (const [date, c] of Object.entries(checkins)) {
    const v = c[key]
    if (v == null) continue
    const w = start ? weekOf(date, start) : 1
    if (w < 1) continue
    buckets.set(w, [...(buckets.get(w) ?? []), v])
  }
  return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([week, vals]) => ({ week, value: vals.reduce((a, b) => a + b, 0) / vals.length }))
}

// ---------- coach insights ----------

export interface Insight { tone: 'good' | 'warn' | 'accent'; title: string; text: string; to?: string }

export function insights(state: State, date = today()): Insight[] {
  const out: Insight[] = []
  const week = weekOf(date, state.settings.startDate)

  if (week === DELOAD_WEEK) out.push({ to: '/plan', tone: 'accent', title: 'Deload week', text: 'About 40% fewer sets at the same weights. It lets your body catch up so weeks 8–12 go better.' })
  if (week === DELOAD_WEEK - 1) out.push({ to: '/plan', tone: 'accent', title: 'Lighter week next', text: 'Week 7 is a deload. Push well this week, but don’t chase personal records.' })

  const now = avgWeight(state.checkins, date)
  const before = avgWeight(state.checkins, addDays(date, -7))
  if (now != null && before != null) {
    const change = now - before
    if (change < -0.75) out.push({ to: '/progress', tone: 'warn', title: 'Losing weight fast', text: `Down ${fmtNum(-change)} kg in a week. Aim for 0.25–0.5 kg. Eat a little more to protect your strength.` })
    else if (change <= -0.2) out.push({ to: '/progress', tone: 'good', title: 'Right on pace', text: `Down ${fmtNum(-change)} kg this week. A steady, sustainable rate.` })
  }
  const twoAgo = avgWeight(state.checkins, addDays(date, -14))
  if (now != null && before != null && twoAgo != null && Math.abs(now - before) < 0.15 && Math.abs(before - twoAgo) < 0.15) {
    out.push({ to: '/progress?tab=waist', tone: 'warn', title: 'Weight has stalled', text: 'No change for 2 weeks. Check your waist first. If that’s flat too, make one small change: slightly less food or a bit more walking.' })
  }

  const recent = Object.keys(state.checkins).filter((d) => d <= date && daysBetween(d, date) < 4).map((d) => state.checkins[d].recovery).filter((v): v is number => v != null)
  if (recent.length >= 2 && recent.reduce((a, b) => a + b, 0) / recent.length <= 2) {
    out.push({ to: '/log', tone: 'warn', title: 'Recovery is low', text: 'Skip the optional cardio and one or two accessory exercises today. Keep the main lifts.' })
  }

  const proteinDays = Object.keys(state.checkins).filter((d) => d < date && daysBetween(d, date) <= 7).map((d) => state.checkins[d].protein).filter((v): v is number => v != null)
  if (proteinDays.length >= 3) {
    const avg = proteinDays.reduce((a, b) => a + b, 0) / proteinDays.length
    if (avg < state.settings.proteinTarget * 0.8) out.push({ to: '/log', tone: 'warn', title: 'Protein is low', text: `Averaging ${Math.round(avg)} g. Aim for about ${state.settings.proteinTarget} g to keep muscle while losing fat.` })
  }

  const lastPhoto = state.photoDates?.at(-1)
  const sinceStart = state.settings.startDate ? daysBetween(state.settings.startDate, date) : 0
  if ((lastPhoto ? daysBetween(lastPhoto, date) >= 28 : sinceStart >= 0) && week <= 12) {
    out.push({ to: '/progress?tab=photos', tone: 'accent', title: 'Progress photos due', text: lastPhoto ? 'It’s been 4 weeks. Take front, side and back photos in the same light and pose.' : 'Take your starting photos: front, side and back. You’ll be glad you did in week 12.' })
  }

  return out
}
