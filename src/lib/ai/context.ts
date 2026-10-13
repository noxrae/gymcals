import { EXERCISES, typeOf } from '../../data/exercises'
import { allItems, dayFor, isDeload, isMaintenance, nextDeload, phaseOf, programOf, setsFor, type PlanDay, type Program } from '../../data/plan'
import { navyBodyFat, profileComplete, vTaper } from '../body'
import { avgWeight, calorieTarget, fmtNum, history, insights, rangeText, suggest, weightSeries } from '../coach'
import { addDays, dayIdOf, today, weekOf } from '../dates'
import type { State } from '../store'

/** Everything the coach knows about "now". Built fresh for every question. */
export interface CoachCtx {
  state: State
  date: string
  week: number
  program: Program
  day: PlanDay
}

export function coachCtx(state: State, date = today()): CoachCtx {
  const program = programOf(state.settings.program)
  const week = Math.min(program.weeks, Math.max(1, weekOf(date, state.settings.startDate)))
  const day = dayFor(dayIdOf(date), state.settings.fiveDay, { week, program })
  return { state, date, week, program, day }
}

const latest = (state: State, key: 'waist' | 'shoulders' | 'neck' | 'hip' | 'weight') =>
  Object.entries(state.checkins).filter(([, c]) => c[key] != null).sort(([a], [b]) => a.localeCompare(b)).map(([, c]) => c[key] as number)

export function stats(c: CoachCtx) {
  const { state, date } = c
  const avgNow = avgWeight(state.checkins, date)
  const start = state.baseline?.weight ?? weightSeries(state.checkins)[0]?.value
  const avgWeekAgo = avgWeight(state.checkins, addDays(date, -7))
  const waists = latest(state, 'waist')
  const shoulders = latest(state, 'shoulders')
  const necks = latest(state, 'neck')
  const hips = latest(state, 'hip')
  const today = state.checkins[date] ?? {}
  const cal = calorieTarget(state, date)
  const bf = navyBodyFat(state.settings.profile ?? {}, waists.at(-1), necks.at(-1), hips.at(-1))
  const ratio = vTaper(shoulders.at(-1), waists.at(-1))
  const sessionsDone = Object.values(state.sessions).filter((s) => s.finishedAt).length
  const recent = Object.keys(state.checkins).filter((d) => d <= date && d > addDays(date, -7))
  const avg = (k: 'protein' | 'sleep' | 'recovery') => {
    const v = recent.map((d) => state.checkins[d][k]).filter((x): x is number => x != null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  }
  return {
    avgNow, start, weekChange: avgNow != null && avgWeekAgo != null ? avgNow - avgWeekAgo : null,
    totalChange: avgNow != null && start != null ? avgNow - start : null,
    waistNow: waists.at(-1), waistStart: waists[0],
    bf, ratio, cal, sessionsDone,
    protein: today.protein ?? 0, proteinTarget: state.settings.proteinTarget,
    calsEaten: today.calories, avgProtein: avg('protein'), avgSleep: avg('sleep'), avgRecovery: avg('recovery'),
    profileSet: profileComplete(state.settings.profile),
  }
}

export function todaysPlanLines(c: CoachCtx) {
  const { day, week, program, state } = c
  if (!day.groups.length) return [`Today is ${day.name.toLowerCase()}: walking, food and sleep only.`]
  return allItems(day).map((it) => {
    const ex = EXERCISES[it.ex]
    const tip = ex.kind !== 'cardio' ? suggest(state, it, week).text : ''
    return `• ${ex.name} (${typeOf(it.ex) === 'cali' ? 'calisthenics' : typeOf(it.ex)}): ${rangeText(it, setsFor(it, week, program))}${tip ? ` — ${tip}` : ''}`
  })
}

export function personalBests(c: CoachCtx, days = 14) {
  const since = addDays(c.date, -days)
  const out: string[] = []
  for (const key of Object.keys(EXERCISES)) {
    const h = history(c.state, key)
    const recent = h.filter((e) => e.date >= since)
    const before = h.filter((e) => e.date < since)
    if (!recent.length || !before.length) continue
    const best = (sets: typeof h[number]['sets']) => Math.max(...sets.map((s) => (s.load ?? 0) * 100 + (s.reps ?? 0)))
    if (Math.max(...recent.map((e) => best(e.sets))) > Math.max(...before.map((e) => best(e.sets)))) out.push(EXERCISES[key].name)
  }
  return out
}

/** Compact, factual summary sent to an AI model (only when you ask it something). */
export function contextForModel(c: CoachCtx) {
  const s = stats(c)
  const p = c.state.settings.profile
  const ph = phaseOf(c.week, c.program)
  const lines = [
    `Program: ${c.program.name} (${c.program.weeks} weeks), currently week ${c.week}, phase "${ph.name}"${isDeload(c.week, c.program) ? ', deload week' : ''}${isMaintenance(c.week, c.program) ? ', maintenance-calorie week' : ''}. Next deload: ${nextDeload(c.week, c.program) ?? 'none'}.`,
    `Schedule: 6 days (Mon Upper A + push calisthenics, Tue Lower A + cardio, Wed Pull + pull-up skill, Thu calisthenics skills + core + cardio, Fri Upper B + calisthenics, Sat Lower B + athletic, Sun rest)${c.state.settings.fiveDay ? ' in 5-day mode (Thursday is recovery)' : ''}.`,
    `Today (${c.day.name}):`, ...todaysPlanLines(c),
    p && profileComplete(p) ? `Profile: ${p.sex}, ${p.age} y, ${p.heightCm} cm, activity ${p.activity}.` : 'Profile: not filled in.',
    s.avgNow != null ? `Weight: 7-day average ${fmtNum(Math.round(s.avgNow * 10) / 10)} kg${s.totalChange != null ? `, ${fmtNum(Math.round(s.totalChange * 10) / 10)} kg since start` : ''}${s.weekChange != null ? `, ${fmtNum(Math.round(s.weekChange * 10) / 10)} kg this week` : ''}.` : 'Weight: no weigh-ins yet.',
    s.waistNow ? `Waist ${s.waistNow} cm (start ${s.waistStart} cm).` : '',
    s.ratio ? `Shoulder-to-waist ratio ${s.ratio.toFixed(2)} (goal 1.6).` : '',
    s.bf ? `Estimated body fat ${s.bf.toFixed(1)}% (US Navy).` : '',
    s.cal ? `Calorie target ${s.cal.target} kcal (maintenance ${s.cal.maintenance})${s.calsEaten != null ? `, eaten today ${s.calsEaten}` : ''}.` : '',
    `Protein today ${s.protein} of ${s.proteinTarget} g${s.avgProtein ? `; 7-day average ${Math.round(s.avgProtein)} g` : ''}.`,
    s.avgSleep ? `Sleep average ${fmtNum(Math.round(s.avgSleep * 10) / 10)} h.` : '',
    `Workouts completed: ${s.sessionsDone}. Recent personal bests: ${personalBests(c).join(', ') || 'none'}.`,
    `Coach alerts: ${insights(c.state, c.date).map((i) => i.title).join('; ') || 'none'}.`,
  ]
  return lines.filter(Boolean).join('\n')
}

export const SYSTEM_PROMPT = `You are "Coach", the friendly, encouraging companion inside GymCals, a free 12-week / 4-month / 6-month gym + calisthenics app.
The user's goals: an athletic physique, lose belly fat and love handles, a V-taper, visible abs, strength and calisthenics skills.
Rules:
- Be concise and practical: 2–6 short sentences or a few bullets. Use their data below when relevant. Use kg and cm.
- Evidence-based only: no spot reduction, fat loss needs a calorie deficit, ~1.6–2.2 g/kg protein, progressive overload, 2–3 reps in reserve, sleep 7–9 h.
- Indian foods are welcome in food advice (dal, paneer, curd, eggs, chicken, fish, soy chunks, whey).
- Never diagnose. For sharp or persistent pain, dizziness or chest pain: stop and see a doctor or physiotherapist.
- No extreme diets, fat burners or steroids. Creatine monohydrate (3–5 g/day) and whey are fine to mention.
- If asked about the app, its features are: Today, Plan (program switch), workout logger with coach suggestions, rest timer, swaps, warm-up sets, form videos and demos, muscle maps, Progress (weight, body: V-taper ratio and body fat, strength, tests, photos), Skills, Check-in (weight, waist, shoulders, neck, calories, protein, sleep, steps, recovery), Settings (calorie target, 5-day mode, backup).`
