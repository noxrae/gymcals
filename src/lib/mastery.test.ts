import { describe, expect, it } from 'vitest'
import { EXERCISES, typeOf } from '../data/exercises'
import { allItems, dayFor, daysFor, isDeload, planKey, programOf, PROGRAMS, templateOf, weekFocus, type DayId, type PlanDay } from '../data/plan'
import { monthOf, SKILL_MONTHS } from '../data/skills'
import { daysTraining, weeklySets } from '../data/volume'
import videos from '../data/videos.json' with { type: 'json' }

const M = (week = 5) => ({ template: 'mastery' as const, week })
const line = (d: PlanDay) => allItems(d).map((i) => `${i.ex} ${i.sets}×${i.min}–${i.max}`)
const week = (w = 5) => daysFor(false, M(w))

describe('Mastery plan', () => {
  // The full plan from week 5 (weeks 1–4 bring the upper-back lifts back in stages; see below).
  const PLAN: Record<string, string[]> = {
    mon: ['tuck-l-sit 2×10–15', 'bench-press 3×6–10', 'incline-dumbbell-press 3×8–12', 'lat-pulldown 3×8–12', 'seated-cable-row 3×8–12', 'lateral-raise 3×12–20', 'triceps-pushdown 2×10–15', 'diamond-push-up 2×5–12', 'cable-crunch 3×10–15'],
    tue: ['squat 3×6–10', 'hip-thrust 3×8–12', 'back-extension 3×8–12', 'seated-leg-curl 3×8–12', 'bulgarian-split-squat 2×8–12', 'leg-extension 2×10–15', 'calf-raise 4×8–12'],
    wed: ['scapular-pull-up 2×5–8', 'negative-pull-up 3×3–3', 'assisted-pull-up 3×5–8', 'chest-supported-row 3×8–12', 'reverse-pec-deck 3×12–20', 'incline-dumbbell-curl 3×8–12', 'hammer-curl 2×10–15', 'reverse-curl 2×12–15', 'dead-hang 2×20–45'],
    thu: ['tuck-l-sit 4×10–20', 'pike-push-up 3×5–10', 'wall-handstand 3×15–30', 'hanging-knee-raise 3×8–12', 'hollow-hold 3×20–30', 'side-plank 2×30–45', 'calf-raise 2×10–15', 'incline-walk 1×25–35'],
    fri: ['assisted-pull-up 2×5–8', 'incline-bench-press 3×8–12', 'dumbbell-shoulder-press 3×8–12', 'cable-fly 2×12–15', 'cable-lateral-raise 3×12–20', 'reverse-pec-deck 3×12–20', 'preacher-curl 3×8–12', 'triceps-extension 3×10–15', 'triceps-pushdown 2×10–15'],
    sat: ['leg-press 3×12–15', 'cable-pull-through 3×12–15', 'seated-leg-curl 3×12–15', 'seated-calf-raise 3×12–20', 'lateral-raise 3×15–20', 'hanging-knee-raise 3×8–12', 'farmers-carry 2×30–45', 'wrist-curl 2×15–20', 'reverse-wrist-curl 2×15–20'],
    sun: [],
  }
  it.each(Object.keys(PLAN))('%s matches the reviewed plan (from week 5)', (id) => {
    expect(line(dayFor(id as DayId, false, M(5)))).toEqual(PLAN[id])
  })

  it('weeks 1–2 (stage 1): fewer sets, light re-entry of the upper-back lifts, no negatives or wall handstands', () => {
    const wed = line(dayFor('wed', false, M(1)))
    expect(wed).toContain('assisted-pull-up 3×5–8')
    expect(wed).toContain('hammer-curl 1×10–15')
    expect(wed).toContain('reverse-curl 1×12–15')
    expect(wed).toContain('dead-hang 2×10–20')
    expect(wed.some((l) => l.startsWith('negative-pull-up'))).toBe(false)
    const thu = line(dayFor('thu', false, M(2)))
    expect(thu.some((l) => l.startsWith('wall-handstand') || l.startsWith('hanging-knee-raise'))).toBe(false)
    expect(thu).toContain('dead-bug 2×8–10')
    expect(line(dayFor('mon', false, M(1)))).toContain('push-up 2×6–15')
    const squat = allItems(dayFor('tue', false, M(1))).find((i) => i.ex === 'squat')!
    expect(squat.sets).toBe(2)
    expect(squat.note).toMatch(/^Weeks 1–2: empty bar or goblet/)
    expect(allItems(dayFor('sat', false, M(1))).find((i) => i.ex === 'farmers-carry')!.max).toBe(30)
  })

  it('weeks 3–4 (stage 2): full sets, moderate loads, curls and L-sit still reduced', () => {
    const wed = line(dayFor('wed', false, M(3)))
    expect(wed).toContain('assisted-pull-up 4×5–8')
    expect(wed).toContain('hammer-curl 1×10–15')
    expect(wed.some((l) => l.startsWith('negative-pull-up'))).toBe(false)
    expect(line(dayFor('thu', false, M(4)))).toContain('tuck-l-sit 3×10–20')
    expect(line(dayFor('thu', false, M(4)))).toContain('hanging-knee-raise 3×8–12')
    expect(allItems(dayFor('tue', false, M(3))).find((i) => i.ex === 'squat')!.note).toMatch(/^Weeks 3–4: moderate/)
  })

  it('45° hip extension has one-tap alternatives by name', () => {
    const hip = allItems(dayFor('tue', false, M(5))).find((i) => i.ex === 'back-extension')!
    expect(hip.alt).toEqual(['cable-pull-through', 'reverse-hyper'])
    for (const k of hip.alt!) expect(EXERCISES[k].primary).toEqual(expect.arrayContaining(['glutes', 'hamstrings']))
    expect(allItems(dayFor('tue', false, M(1))).find((i) => i.ex === 'back-extension')!.alt).toHaveLength(2)
  })

  it('the one heavy leg day is dedicated: hinge, glutes, hamstrings and quads, no RDLs', () => {
    const tue = allItems(dayFor('tue', false, M(5))).map((i) => i.ex)
    for (const ex of ['squat', 'hip-thrust', 'back-extension', 'seated-leg-curl', 'bulgarian-split-squat']) expect(tue).toContain(ex)
    expect(allItems(dayFor('sat', false, M(5))).map((i) => i.ex)).toContain('cable-pull-through')
    const d = week(5)
    expect(weeklySets(d, 'hamstrings')).toBeGreaterThanOrEqual(10)
    expect(weeklySets(d, 'glutes')).toBeGreaterThanOrEqual(10)
    expect(weeklySets(d, 'quads')).toBeGreaterThanOrEqual(10)
    expect(weeklySets(d, 'calves')).toBeGreaterThanOrEqual(9)
  })

  it('meets the goals the reviews set', () => {
    const d = week()
    expect(weeklySets(d, 'side-delts')).toBeGreaterThanOrEqual(12)
    expect(weeklySets(d, 'chest')).toBeGreaterThanOrEqual(13)
    expect(daysTraining(d, 'chest')).toBeGreaterThanOrEqual(2)
    expect(daysTraining(d, 'side-delts')).toBeGreaterThanOrEqual(3)
    expect(weeklySets(d, 'lats')).toBeGreaterThanOrEqual(12)
    expect(weeklySets(d, 'rear-delts')).toBeGreaterThanOrEqual(6)
    expect(daysTraining(d, 'lats')).toBe(3)
    expect(daysTraining(d, 'rear-delts')).toBe(2)
    expect(daysTraining(d, 'abs')).toBeGreaterThanOrEqual(3)
    expect(d.flatMap(allItems).filter((i) => i.ex === 'tuck-l-sit').length).toBe(2)
    expect(weeklySets(d, 'forearms')).toBeGreaterThanOrEqual(8)
    expect(daysTraining(d, 'forearms')).toBeGreaterThanOrEqual(2)
    expect(daysTraining(d, 'hamstrings')).toBe(2)
    expect(daysTraining(d, 'glutes')).toBeGreaterThanOrEqual(2)
    expect(daysTraining(d, 'calves')).toBe(3)
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

  it('deloads in week 6 (other plans keep week 7)', () => {
    expect(isDeload(6, programOf(12, 'mastery'))).toBe(true)
    expect(isDeload(7, programOf(12, 'mastery'))).toBe(false)
    expect(programOf(24, 'mastery').deloads).toEqual([6, 13, 19])
    expect(isDeload(7, programOf(12, 'athletic'))).toBe(true)
    expect(programOf(12)).toBe(PROGRAMS[24]) // 12 weeks is no longer offered; old settings run as 6 months
    expect(programOf(16)).toBe(PROGRAMS[16])
    expect(programOf()).toBe(PROGRAMS[24])
    expect(weekFocus(6, programOf(12, 'mastery'))).toMatch(/^Deload/)
    expect(weekFocus(1, programOf(12, 'mastery'))).toMatch(/one set fewer/)
  })

  it('weekly notes match the staged start (negatives and handstands from week 5)', () => {
    const p = programOf(24, 'mastery')
    expect(weekFocus(3, p)).not.toMatch(/negative/i)
    expect(weekFocus(5, p)).toMatch(/negatives, wall handstands and diamond push-ups start/)
    expect(weekFocus(6, p)).toMatch(/^Deload/)
  })

  it('works with 5-day mode and long programs', () => {
    expect(dayFor('sat', true, M()).groups).toHaveLength(0)
    expect(allItems(dayFor('wed', false, { ...M(14), program: PROGRAMS[16] })).map((i) => i.ex)).toContain('pull-up')
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
