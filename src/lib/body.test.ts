import { describe, expect, it } from 'vitest'
import { EXERCISES, FIGURE_DEMO, typeOf } from '../data/exercises'
import { allItems, DAYS, daysFor } from '../data/plan'
import { absZone, bmr, calories, navyBodyFat, profileComplete, vTaper } from './body'

const me = { heightCm: 175, age: 25, sex: 'male' as const, activity: 'medium' as const }

describe('calorie target', () => {
  it('uses Mifflin–St Jeor and a ~400 kcal deficit (recomposition)', () => {
    expect(bmr(76.7, me)).toBeCloseTo(1740.75)
    expect(calories(76.7, me)).toMatchObject({ maintenance: 2790, target: 2390 })
  })
  it('applies the fine-tune and never goes below safe floors', () => {
    expect(calories(76.7, me, -150).target).toBe(2240)
    const tiny = calories(45, { heightCm: 150, age: 60, sex: 'female', activity: 'low' }, -1000)
    expect(tiny.target).toBeGreaterThanOrEqual(1300)
  })
  it('needs every profile field', () => {
    expect(profileComplete({ heightCm: 175, age: 25, sex: 'male' })).toBe(false)
    expect(profileComplete(me)).toBe(true)
  })
})

describe('body measurements', () => {
  it('estimates body fat with the US Navy formula', () => {
    expect(navyBodyFat({ heightCm: 178, sex: 'male' }, 85, 38)).toBeCloseTo(16.4, 1)
    expect(navyBodyFat({ heightCm: 178, sex: 'male' }, 85)).toBeNull()
    expect(navyBodyFat({ heightCm: 165, sex: 'female' }, 75, 33)).toBeNull()
    expect(navyBodyFat({ heightCm: 165, sex: 'female' }, 75, 33, 98)).toBeGreaterThan(15)
  })
  it('computes the V-taper ratio and the abs range', () => {
    expect(vTaper(120, 80)).toBe(1.5)
    expect(vTaper(undefined, 80)).toBeNull()
    expect(absZone('male')).toEqual({ from: 10, to: 12 })
  })
})

describe('plan structure', () => {
  it('every section is purely gym, calisthenics or cardio (clear labels)', () => {
    for (const five of [false, true]) for (const d of daysFor(five)) for (const g of d.groups) {
      const types = new Set(g.items.map((i) => typeOf(i.ex)))
      expect(types.size, `${d.id} · ${g.title}`).toBe(1)
    }
  })
  it('every training day has calisthenics in it', () => {
    for (const d of DAYS.filter((x) => x.groups.length)) expect(allItems(d).some((i) => typeOf(i.ex) === 'cali'), d.id).toBe(true)
  })
  it('side delts (V-taper width) get at least 14 sets a week', () => {
    const sets = DAYS.flatMap(allItems).filter((i) => EXERCISES[i.ex].primary.includes('side-delts')).reduce((n, i) => n + i.sets, 0)
    expect(sets).toBeGreaterThanOrEqual(14)
  })
  it('every exercise has a form demo (photos or an animated figure)', () => {
    for (const ex of Object.values(EXERCISES)) expect(ex.photos > 0 || FIGURE_DEMO.has(ex.key), ex.key).toBe(true)
  })
})
