import { describe, expect, it } from 'vitest'
import { EXERCISES, typeOf } from '../data/exercises'
import { allItems, ctxForSession, dayFor, daysFor, planKey, PROGRAMS, templateOf, type DayId, type PlanDay } from '../data/plan'
import { daysTraining, scheduleText, weeklySets } from '../data/volume'
import videos from '../data/videos.json' with { type: 'json' }

const A = { template: 'athletic' as const }
const X = { template: 'athletic' as const, extended: true }
const line = (d: PlanDay) => allItems(d).map((i) => `${i.ex} ${i.sets}×${i.min}–${i.max}`)

describe('Athletic plan (as written by the user)', () => {
  // Checked line by line against the user's plans. The only deliberate change is Tuesday (no RDLs, upper-back pain).
  const STANDARD: Record<string, string[]> = {
    mon: ['bench-press 3×6–8', 'incline-dumbbell-press 3×8–10', 'lat-pulldown 3×8–12', 'seated-cable-row 3×8–12', 'lateral-raise 4×12–15', 'triceps-pushdown 3×10–12'],
    tue: ['squat 3×6–8', 'hip-thrust 3×8–10', 'back-extension 3×10–12', 'bulgarian-split-squat 2×8–10', 'leg-curl 3×10–12', 'calf-raise 4×12–15'],
    wed: ['assisted-pull-up 4×5–8', 'chest-supported-row 3×8–12', 'straight-arm-pulldown 3×12–15', 'reverse-pec-deck 3×12–15', 'incline-dumbbell-curl 3×8–12', 'hammer-curl 3×10–12'],
    thu: ['tuck-l-sit 4×10–15', 'hanging-knee-raise 3×10–12', 'cable-crunch 3×12–15', 'dead-bug-timed 2×45–45', 'incline-walk 1×25–30'],
    fri: ['incline-bench-press 3×8–10', 'dumbbell-shoulder-press 3×8–10', 'cable-lateral-raise 4×12–15', 'preacher-curl 3×8–12', 'triceps-extension 3×10–12', 'push-up 2×8–15'],
    sat: ['leg-extension 3×12–15', 'seated-leg-curl 3×12–15', 'farmers-carry 3×30–45', 'dead-hang 3×20–60', 'incline-walk 1×15–20'],
    sun: [],
  }
  const EXTENDED: Record<string, string[]> = {
    mon: ['bench-press 3×6–10', 'incline-dumbbell-press 3×8–12', 'lat-pulldown 3×8–12', 'seated-cable-row 3×8–12', 'lateral-raise 3×12–20', 'triceps-pushdown 2×10–15', 'push-up 2×6–15', 'scapular-push-up 2×10–15'],
    tue: ['squat 3×6–10', 'seated-leg-curl 3×10–15', 'leg-curl 2×10–15', 'bulgarian-split-squat 2×8–12', 'leg-extension 2×10–15', 'seated-hip-abduction 2×12–20', 'calf-raise 3×10–15', 'seated-calf-raise 2×12–20'],
    wed: ['assisted-pull-up 3×5–8', 'lat-pulldown 2×8–12', 'chest-supported-row 3×8–12', 'straight-arm-pulldown 2×12–15', 'reverse-pec-deck 3×12–20', 'dumbbell-curl 3×8–12', 'hammer-curl 2×10–15', 'scapular-pull-up 2×5–8'],
    thu: ['hanging-knee-raise 3×8–12', 'cable-crunch 3×10–15', 'dead-bug 2×10–10', 'side-plank 2×30–45', 'tuck-l-sit 3×10–20', 'incline-walk 1×25–35'],
    fri: ['incline-bench-press 3×8–12', 'dumbbell-shoulder-press 3×8–12', 'cable-lateral-raise 3×12–20', 'reverse-pec-deck 2×12–20', 'seated-cable-row 2×10–12', 'preacher-curl 3×8–12', 'triceps-extension 3×10–15', 'triceps-pushdown 2×10–15', 'pike-push-up 2×5–10'],
    sat: ['leg-extension 2×12–15', 'seated-leg-curl 2×12–15', 'calf-raise 3×12–20', 'dead-hang 3×20–40', 'farmers-carry 3×30–45', 'incline-walk 1×15–20', 'mobility 1×5–10'],
    sun: [],
  }
  it.each(Object.keys(STANDARD))('standard %s matches the plan exactly, in order', (id) => {
    expect(line(dayFor(id as DayId, false, A))).toEqual(STANDARD[id])
  })
  it.each(Object.keys(EXTENDED))('extended %s matches the plan exactly, in order', (id) => {
    expect(line(dayFor(id as DayId, false, X))).toEqual(EXTENDED[id])
  })
  it('Tuesday extras: warm-up checklist and optional finisher', () => {
    expect(dayFor('tue', false, A).warmup).toHaveLength(4)
    expect(dayFor('tue', false, A).optionalCardio).toMatch(/10–15 min/)
    expect(allItems(dayFor('tue', false, A)).find((i) => i.ex === 'squat')!.rest).toEqual([120, 180])
    expect(allItems(dayFor('tue', false, A)).find((i) => i.ex === 'back-extension')!.rest).toEqual([90, 90])
  })
  it('Athletic Tuesday hip extension has the same one-tap alternatives', () => {
    expect(allItems(dayFor('tue', false, A)).find((i) => i.ex === 'back-extension')!.alt).toEqual(['cable-pull-through', 'reverse-hyper'])
  })
  it('no plan has RDLs any more; they stay available as a swap', () => {
    for (const v of [A, X, {}]) for (const five of [false, true]) expect(daysFor(five, v).flatMap(allItems).some((i) => i.ex === 'romanian-deadlift')).toBe(false)
    expect(line(dayFor('tue', false))).toContain('hip-thrust 3×8–10')
    expect(line(dayFor('sat', false))).toContain('back-extension 3×10–12')
  })

  it('keeps each group to one kind of training, so Gym / Calisthenics labels stay clear', () => {
    for (const v of [A, X]) for (const d of daysFor(false, v)) for (const g of d.groups) expect(new Set(g.items.map((i) => typeOf(i.ex))).size, `${d.id} ${g.title}`).toBe(1)
  })

  it('every exercise has a photo, a verified video and muscles', () => {
    for (const v of [A, X]) for (const d of daysFor(false, v)) for (const it of allItems(d)) {
      const ex = EXERCISES[it.ex]
      expect(ex, it.ex).toBeTruthy()
      if (ex.kind !== 'cardio') expect(ex.primary.length, it.ex).toBeGreaterThan(0)
      if (ex.kind !== 'cardio') expect((videos as Record<string, unknown>)[it.ex], it.ex).toBeTruthy()
    }
  })

  it('5-day mode makes Saturday the recovery day', () => {
    const sat = dayFor('sat', true, A)
    expect(sat.groups).toHaveLength(0)
    expect(sat.name).toBe('Recovery Day')
    expect(dayFor('thu', true, A).groups.length).toBeGreaterThan(0)
  })

  it('4- and 6-month programs progress the Athletic plan too', () => {
    const wed = dayFor('wed', false, { ...A, week: 14, program: PROGRAMS[16] })
    expect(allItems(wed)[0].ex).toBe('pull-up')
    const thu = dayFor('thu', false, { ...A, week: 20, program: PROGRAMS[24] })
    expect(allItems(thu).map((i) => i.ex)).toContain('hanging-leg-raise')
    expect(allItems(thu).map((i) => i.ex)).toContain('advanced-tuck-l-sit')
    const fri = dayFor('fri', false, { ...A, week: 14, program: PROGRAMS[24] })
    expect(allItems(fri).find((i) => i.ex === 'cable-lateral-raise')!.sets).toBe(5)
  })

  it('a past workout keeps the plan it was done with', () => {
    expect(planKey('athletic', true)).toBe('athletic-extended')
    expect(planKey('original', true)).toBe('original')
    expect(ctxForSession({ ...A }, 'original').template).toBe('original')
    expect(ctxForSession({}, 'athletic-extended')).toMatchObject({ template: 'athletic', extended: true })
    expect(ctxForSession({ ...X }, undefined)).toMatchObject({ template: 'original', extended: false })
    expect(templateOf('nonsense')).toBe('original')
  })

  it('the original plan is unchanged by default', () => {
    expect(dayFor('mon', false).name).toBe('Upper A + Push')
    expect(weeklySets(daysFor(false), 'side-delts')).toBe(14)
    expect(scheduleText(daysFor(false, A))).toMatch(/^Mon Upper A · Chest & Back Width, Tue Heavy Leg Day/)
  })
})
