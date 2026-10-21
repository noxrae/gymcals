import { describe, expect, it } from 'vitest'
import { EXERCISES, typeOf } from '../data/exercises'
import { allItems, dayFor, daysFor, isDeload, planKey, programOf, PROGRAMS, templateOf, weekFocus, type DayId, type PlanDay } from '../data/plan'
import { monthOf, SKILL_MONTHS } from '../data/skills'
import { daysTraining, weeklySets } from '../data/volume'
import videos from '../data/videos.json' with { type: 'json' }

const M = (week = 3) => ({ template: 'mastery' as const, week })
const line = (d: PlanDay) => allItems(d).map((i) => `${i.ex} ${i.sets}×${i.min}–${i.max}`)
const week = (w = 3) => daysFor(false, M(w))

describe('Mastery plan', () => {
  const PLAN: Record<string, string[]> = {
    mon: ['bench-press 3×6–10', 'incline-dumbbell-press 3×8–12', 'lat-pulldown 3×8–12', 'seated-cable-row 3×8–12', 'lateral-raise 4×12–20', 'triceps-pushdown 2×10–15', 'push-up 2×6–15'],
    tue: ['squat 3×6–10', 'hip-thrust 3×8–12', 'bulgarian-split-squat 3×8–12', 'seated-leg-curl 3×10–15', 'leg-extension 2×10–15', 'calf-raise 4×8–12', 'cable-crunch 3×10–15'],
    wed: ['scapular-pull-up 2×5–8', 'assisted-pull-up 4×5–8', 'negative-pull-up 3×3–3', 'chest-supported-row 3×8–12', 'straight-arm-pulldown 2×12–15', 'reverse-pec-deck 3×12–20', 'incline-dumbbell-curl 3×8–12', 'hammer-curl 2×10–15', 'reverse-curl 2×12–15', 'dead-hang 2×20–45'],
    thu: ['tuck-l-sit 4×10–20', 'pike-push-up 3×5–10', 'hanging-knee-raise 3×8–12', 'hollow-hold 3×20–30', 'side-plank 2×30–45', 'incline-walk 1×25–35'],
    fri: ['assisted-pull-up 2×5–8', 'incline-bench-press 3×8–12', 'dumbbell-shoulder-press 3×8–12', 'cable-lateral-raise 4×12–20', 'reverse-pec-deck 2×12–20', 'preacher-curl 3×8–12', 'triceps-extension 3×10–15', 'triceps-pushdown 2×10–15'],
    sat: ['leg-press 3×12–15', 'back-extension 3×10–15', 'seated-leg-curl 2×12–15', 'seated-calf-raise 3×12–20', 'lateral-raise 3×15–20', 'wrist-curl 2×15–20', 'reverse-wrist-curl 2×15–20', 'farmers-carry 2×30–45', 'hanging-knee-raise 3×8–12', 'incline-walk 1×15–20', 'mobility 1×5–10'],
    sun: [],
  }
  it.each(Object.keys(PLAN))('%s matches the reviewed plan (from week 3)', (id) => {
    expect(line(dayFor(id as DayId, false, M(3)))).toEqual(PLAN[id])
  })

  it('meets the goals the reviews set', () => {
    const d = week()
    expect(weeklySets(d, 'side-delts')).toBeGreaterThanOrEqual(12)
    expect(daysTraining(d, 'side-delts')).toBe(3)
    expect(weeklySets(d, 'lats')).toBeGreaterThanOrEqual(12)
    expect(daysTraining(d, 'lats')).toBe(3)
    expect(daysTraining(d, 'rear-delts')).toBe(2)
    expect(daysTraining(d, 'abs')).toBeGreaterThanOrEqual(3)
    expect(weeklySets(d, 'forearms')).toBeGreaterThanOrEqual(8)
    expect(daysTraining(d, 'forearms')).toBeGreaterThanOrEqual(2)
    expect(daysTraining(d, 'hamstrings')).toBe(2)
    expect(daysTraining(d, 'glutes')).toBeGreaterThanOrEqual(2)
    expect(daysTraining(d, 'calves')).toBe(2)
    expect(d.filter((x) => allItems(x).some((i) => i.ex === 'assisted-pull-up')).length).toBe(2)
    expect(d.flatMap(allItems).some((i) => i.ex === 'romanian-deadlift')).toBe(false)
  })

  it('keeps sessions to about 75 min and groups to one kind of training', () => {
    for (const d of week()) {
      expect(d.minutes).toBeLessThanOrEqual(75)
      for (const g of d.groups) expect(new Set(g.items.map((i) => typeOf(i.ex))).size, `${d.id} ${g.title}`).toBe(1)
      if (d.groups.length) expect(d.warmup?.length, d.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('every exercise exists with a video', () => {
    for (const it of week().flatMap(allItems)) {
      expect(EXERCISES[it.ex], it.ex).toBeTruthy()
      expect((videos as Record<string, unknown>)[it.ex] || EXERCISES[it.ex].kind === 'cardio', it.ex).toBeTruthy()
    }
  })

  it('weeks 1–2 ease in: one set fewer on bigger exercises, negatives start in week 3', () => {
    const w1 = line(dayFor('wed', false, M(1)))
    expect(w1).toContain('assisted-pull-up 3×5–8')
    expect(w1.some((l) => l.startsWith('negative-pull-up'))).toBe(false)
    expect(line(dayFor('mon', false, M(2)))).toContain('lateral-raise 3×12–20')
    expect(line(dayFor('mon', false, M(2)))).toContain('triceps-pushdown 2×10–15')
    expect(line(dayFor('wed', false, M(3)))).toContain('negative-pull-up 3×3–3')
  })

  it('deloads in week 6 (other plans keep week 7)', () => {
    expect(isDeload(6, programOf(12, 'mastery'))).toBe(true)
    expect(isDeload(7, programOf(12, 'mastery'))).toBe(false)
    expect(programOf(24, 'mastery').deloads).toEqual([6, 13, 19])
    expect(isDeload(7, programOf(12, 'athletic'))).toBe(true)
    expect(programOf(12)).toBe(PROGRAMS[12])
    expect(weekFocus(6, programOf(12, 'mastery'))).toMatch(/^Deload/)
    expect(weekFocus(1, programOf(12, 'mastery'))).toMatch(/one set fewer/)
  })

  it('works with 5-day mode and long programs', () => {
    expect(dayFor('sat', true, M()).groups).toHaveLength(0)
    expect(allItems(dayFor('wed', false, { ...M(14), program: PROGRAMS[16] }))[1].ex).toBe('pull-up')
    expect(planKey('mastery', true)).toBe('mastery')
    expect(templateOf('mastery')).toBe('mastery')
  })
})

describe('monthly skill targets', () => {
  it('has 2–3 testable targets each month for 6 months, all linked to real exercises', () => {
    expect(SKILL_MONTHS).toHaveLength(6)
    for (const m of SKILL_MONTHS) {
      expect(m.goals.length).toBeGreaterThanOrEqual(2)
      expect(m.goals.length).toBeLessThanOrEqual(3)
      for (const g of m.goals) expect(EXERCISES[g.ex], g.ex).toBeTruthy()
    }
    expect(new Set(SKILL_MONTHS.flatMap((m) => m.goals.map((g) => g.id))).size).toBe(18)
  })
  it('maps weeks to months within the chosen length', () => {
    expect(monthOf(1, 12)).toBe(1)
    expect(monthOf(4, 12)).toBe(1)
    expect(monthOf(5, 12)).toBe(2)
    expect(monthOf(12, 12)).toBe(3)
    expect(monthOf(20, 24)).toBe(5)
    expect(monthOf(0, 12)).toBe(1)
  })
})
