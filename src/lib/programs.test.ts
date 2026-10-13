import { describe, expect, it } from 'vitest'
import { EXERCISES, typeOf } from '../data/exercises'
import { allItems, dayFor, daysFor, isDeload, isMaintenance, phaseOf, PROGRAMS, setsFor } from '../data/plan'
import { calorieTarget } from './coach'
import type { State } from './store'

const P = PROGRAMS
const item = (day: ReturnType<typeof dayFor>, ex: string) => allItems(day).find((i) => i.ex === ex)

describe('programs', () => {
  it('phases cover every week with no gaps', () => {
    for (const p of Object.values(P)) {
      for (let w = 1; w <= p.weeks; w++) expect(p.phases.some((x) => w >= x.weeks[0] && w <= x.weeks[1]), `${p.id}:${w}`).toBe(true)
      expect(p.phases.at(-1)!.weeks[1]).toBe(p.weeks)
    }
  })
  it('places lighter and maintenance weeks', () => {
    expect(P[12].deloads).toEqual([7])
    expect(P[16].deloads).toEqual([7, 13])
    expect(P[24].deloads).toEqual([7, 13, 19])
    expect(isMaintenance(13, P[24]) && isMaintenance(19, P[24])).toBe(true)
    expect(setsFor({ ex: 'bench-press', sets: 3, min: 6, max: 10, rest: [120, 180] }, 19, P[24])).toBe(2)
    expect(isDeload(19, P[12])).toBe(false)
  })
  it('every day of every week stays valid: real exercises, no repeats, one type per section', () => {
    for (const p of Object.values(P)) for (let w = 1; w <= p.weeks; w++) for (const five of [false, true]) {
      for (const d of daysFor(five, { week: w, program: p })) {
        const keys = allItems(d).map((i) => i.ex)
        expect(new Set(keys).size, `${p.id}w${w} ${d.id}`).toBe(keys.length)
        for (const k of keys) expect(EXERCISES[k], k).toBeDefined()
        for (const g of d.groups) expect(new Set(g.items.map((i) => typeOf(i.ex))).size).toBe(1)
      }
    }
  })
  it('weeks 1–12 are identical in every program', () => {
    for (let w = 1; w <= 12; w++) expect(daysFor(false, { week: w, program: P[24] })).toEqual(daysFor(false, { week: w, program: P[12] }))
  })
  it('6 months · hypertrophy: higher reps, extra V-taper sets, harder calisthenics', () => {
    const ctx = { week: 14, program: P[24] }
    expect(phaseOf(14, P[24]).id).toBe('hypertrophy')
    expect(item(dayFor('mon', false, ctx), 'bench-press')).toMatchObject({ min: 8, max: 12 })
    expect(item(dayFor('mon', false, ctx), 'decline-push-up')).toBeDefined()
    expect(item(dayFor('mon', false, ctx), 'lateral-raise')!.sets).toBe(4)
    expect(item(dayFor('wed', false, ctx), 'pull-up')).toBeDefined()
    expect(item(dayFor('thu', false, ctx), 'hanging-leg-raise')).toBeDefined()
  })
  it('6 months · strength and 4 months · peak: heavier lifts, full pull-ups', () => {
    for (const ctx of [{ week: 20, program: P[24] }, { week: 14, program: P[16] }]) {
      expect(item(dayFor('mon', false, ctx), 'bench-press')).toMatchObject({ min: 5, max: 8, rest: [150, 210] })
      expect(item(dayFor('wed', false, ctx), 'pull-up')).toBeDefined()
      expect(item(dayFor('wed', false, ctx), 'assisted-pull-up')).toBeUndefined()
      expect(item(dayFor('fri', false, ctx), 'diamond-push-up')).toBeDefined()
      expect(item(dayFor('thu', false, ctx), 'advanced-tuck-l-sit')).toBeDefined()
    }
  })
  it('the calorie target switches to maintenance in maintenance weeks', () => {
    const base: State = {
      version: 1, sessions: {}, tests: { pushups: [], deadHang: [], lsit: [] },
      checkins: { '2026-12-01': { weight: 75 } },
      settings: { startDate: '2026-09-07', proteinTarget: 130, stepTarget: 8000, sound: true, vibrate: true, fiveDay: false, keepAwake: true, program: 24, profile: { heightCm: 175, age: 25, sex: 'male', activity: 'medium' } },
    }
    const week13 = calorieTarget(base, '2026-12-01')!
    expect(week13.maintenanceWeek).toBe(true)
    expect(week13.target).toBe(week13.maintenance)
    const normal = calorieTarget(base, '2026-12-15')!
    expect(normal.target).toBeLessThan(normal.maintenance)
  })
})
