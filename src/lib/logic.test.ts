import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ALTERNATIVES, EXERCISES } from '../data/exercises'
import { MUSCLES } from '../data/muscles'
import { allItems, DAYS, daysFor, PROGRAMS, setsFor, weekFocus, type PlanItem } from '../data/plan'

const DELOAD_WEEK = 7
import { avgWeight, insights, rangeText, restText, suggest, weeklyAverages } from './coach'
import { addDays, daysBetween, fmtClock, mondayOf, weekOf } from './dates'
import { weekReview } from './review'
import { mergeState, type SetLog, type State } from './store'
import { plateText, platesPerSide, warmupSets } from './warmup'

const baseState = (patch: Partial<State> = {}): State => ({
  version: 1,
  settings: { startDate: '2026-09-07', proteinTarget: 130, stepTarget: 8000, sound: true, vibrate: true, fiveDay: false },
  sessions: {},
  checkins: {},
  tests: { pushups: [], deadHang: [], lsit: [] },
  ...patch,
})
const withLast = (ex: string, sets: SetLog[], date = '2026-10-01') =>
  baseState({ sessions: { [date]: { date, dayId: 'wed', startedAt: 0, finishedAt: 1, log: { [ex]: sets } } } })
const item = (ex: string, min: number, max: number, sets = 3): PlanItem => ({ ex, sets, min, max, rest: [60, 90] })
const done = (load: number | undefined, reps: number): SetLog => ({ load, reps, done: true })

describe('dates', () => {
  it('counts plan weeks from the start date', () => {
    expect(weekOf('2026-09-07', '2026-09-07')).toBe(1)
    expect(weekOf('2026-09-13', '2026-09-07')).toBe(1)
    expect(weekOf('2026-09-14', '2026-09-07')).toBe(2)
    expect(weekOf('2026-09-06', '2026-09-07')).toBe(0)
    expect(weekOf('2026-11-30', '2026-09-07')).toBe(13)
  })
  it('finds the Monday of any day, including Sunday', () => {
    expect(mondayOf('2026-10-11')).toBe('2026-10-05')
    expect(mondayOf('2026-10-05')).toBe('2026-10-05')
  })
  it('adds days across months and handles DST-free day differences', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31)
    expect(fmtClock(125)).toBe('2:05')
    expect(fmtClock(-3)).toBe('0:00')
  })
})

describe('warm-up calculator', () => {
  it('ramps 2–4 sets below the working weight', () => {
    expect(warmupSets(52.5)).toEqual([{ kg: 20, reps: 10 }, { kg: 30, reps: 5 }, { kg: 40, reps: 3 }])
    expect(warmupSets(100).map((s) => s.kg)).toEqual([20, 50, 70, 85])
    expect(warmupSets(20)).toEqual([{ kg: 20, reps: 10 }])
    // No pointless tiny jumps (seen on the phone: 20 → 22.5 → 30 for a 40 kg bench).
    expect(warmupSets(40).map((s) => s.kg)).toEqual([20, 30])
    for (const w of [22.5, 25, 30, 37.5, 45, 60, 77.5, 120]) {
      const sets = warmupSets(w)
      expect(sets.every((s) => s.kg < w || s.kg === 20)).toBe(true)
      expect(sets.map((s) => s.kg)).toEqual([...sets.map((s) => s.kg)].sort((a, b) => a - b))
    }
  })
  it('loads plates per side that add up exactly', () => {
    expect(platesPerSide(52.5)).toEqual([15, 1.25])
    expect(platesPerSide(20)).toEqual([])
    expect(platesPerSide(100)).toEqual([25, 15])
    for (const w of [22.5, 47.5, 62.5, 142.5]) expect(20 + 2 * platesPerSide(w).reduce((a, b) => a + b, 0)).toBeCloseTo(w)
  })
  it('says so when a weight cannot be loaded with standard plates', () => {
    expect(plateText(61.25)).toMatch(/= 60 kg; 1.25 kg needs micro-plates/)
    expect(plateText(62.5)).toBe('20 + 1.25 each side')
  })
})

describe('coach suggestions (double progression)', () => {
  it('gives a first-time hint with no history', () => {
    const s = suggest(baseState(), item('bench-press', 6, 10), 2)
    expect(s.load).toBeUndefined()
    expect(s.text).toMatch(/First time/)
  })
  it('uses the baseline assistance for the first assisted pull-up', () => {
    const st = baseState({ baseline: { date: '2026-09-07', pullAssist: 40 } })
    expect(suggest(st, item('assisted-pull-up', 5, 8, 4), 1).load).toBe(40)
  })
  it('adds weight only when every set hit the top of the range', () => {
    const it1 = item('bench-press', 6, 10)
    expect(suggest(withLast('bench-press', [done(50, 10), done(50, 10), done(50, 10)]), it1, 3)).toMatchObject({ load: 52.5, up: true })
    expect(suggest(withLast('bench-press', [done(50, 10), done(50, 9), done(50, 8)]), it1, 3)).toMatchObject({ load: 50, reps: 9, up: false })
  })
  it('reduces assistance when every set hit the top', () => {
    const s = suggest(withLast('assisted-pull-up', [8, 8, 8, 8].map((r) => done(30, r))), item('assisted-pull-up', 5, 8, 4), 4)
    expect(s).toMatchObject({ load: 27.5, up: true })
  })
  it('does not claim "unassisted pull-up" when the assistance was never entered', () => {
    const s = suggest(withLast('assisted-pull-up', [8, 8, 8, 8].map((r) => done(undefined, r))), item('assisted-pull-up', 5, 8, 4), 4)
    expect(s.text).not.toMatch(/unassisted/)
    expect(s.load).toBeUndefined()
  })
  it('does not suggest 0 kg when the weight was never entered', () => {
    const s = suggest(withLast('bench-press', [done(undefined, 8), done(undefined, 8)]), item('bench-press', 6, 10), 3)
    expect(s.text).not.toMatch(/0 kg/)
    expect(s.load).toBeUndefined()
  })
  it('keeps the weight but no progression in the deload week', () => {
    const s = suggest(withLast('bench-press', [done(50, 10), done(50, 10), done(50, 10)]), item('bench-press', 6, 10), DELOAD_WEEK)
    expect(s).toMatchObject({ load: 50, up: false })
    expect(s.text).toMatch(/Deload/)
  })
  it('adds 5 seconds to holds once the top is reached', () => {
    expect(suggest(withLast('dead-hang', [40, 40, 40].map((r) => done(undefined, r))), item('dead-hang', 20, 40), 3)).toMatchObject({ reps: 45, up: true })
  })
})

describe('formatting', () => {
  it('describes sets, reps and rest clearly', () => {
    expect(rangeText(item('bench-press', 6, 10))).toBe('3 × 6–10')
    expect(rangeText({ ...item('dead-bug', 10, 10), perSide: true })).toBe('3 × 10 each side')
    expect(rangeText(item('plank', 30, 45, 2))).toBe('2 × 30–45 sec')
    expect(rangeText(item('incline-walk', 20, 25, 1))).toBe('20–25 min')
    expect(restText([120, 180])).toBe('2–3 min')
    expect(restText([60, 90])).toBe('60–90 s')
    expect(restText([120, 120])).toBe('2 min')
    expect(restText([0, 0])).toBe('')
  })
})

describe('plan data integrity', () => {
  for (const five of [false, true]) {
    it(`${five ? '5' : '6'}-day plan: every exercise exists and appears once per day`, () => {
      for (const d of daysFor(five)) {
        const keys = allItems(d).map((i) => i.ex)
        expect(new Set(keys).size, `${d.id} has a duplicate exercise`).toBe(keys.length)
        for (const k of keys) expect(EXERCISES[k], `${k} missing`).toBeDefined()
      }
    })
  }
  it('has 6 training days, Sunday rest, and 5 in 5-day mode', () => {
    expect(DAYS.filter((d) => d.groups.length)).toHaveLength(6)
    expect(daysFor(true).filter((d) => d.groups.length)).toHaveLength(5)
  })
  it('cuts sets by ~40% only in the deload week', () => {
    expect(setsFor(item('bench-press', 6, 10, 3), DELOAD_WEEK)).toBe(2)
    expect(setsFor(item('assisted-pull-up', 5, 8, 4), DELOAD_WEEK)).toBe(2)
    expect(setsFor(item('bench-press', 6, 10, 3), 6)).toBe(3)
    expect(setsFor(item('incline-walk', 20, 25, 1), DELOAD_WEEK)).toBe(1)
  })
  it('has a focus text for every week of every program', () => {
    for (const p of Object.values(PROGRAMS)) for (let w = 1; w <= p.weeks; w++) expect(weekFocus(w, p), `${p.id}:${w}`).toBeTruthy()
  })
  it('every exercise has steps, a mistake, valid muscles, photos on disk and a video', () => {
    for (const ex of Object.values(EXERCISES)) {
      expect(ex.steps.length, ex.key).toBeGreaterThanOrEqual(3)
      expect(ex.mistake, ex.key).toBeTruthy()
      for (const m of [...ex.primary, ...ex.secondary]) expect(MUSCLES[m], `${ex.key}: ${m}`).toBeDefined()
      for (let i = 0; i < ex.photos; i++) expect(existsSync(`public/exercises/${ex.key}-${i}.jpg`), `${ex.key}-${i}.jpg`).toBe(true)
      if (ex.kind !== 'cardio') expect(ex.video?.id, `${ex.key} video`).toMatch(/^[\w-]{11}$/)
    }
  })
  it('every alternative is a real exercise', () => {
    for (const [k, alts] of Object.entries(ALTERNATIVES)) {
      expect(EXERCISES[k]).toBeDefined()
      for (const a of alts) expect(EXERCISES[a], `${k} → ${a}`).toBeDefined()
    }
  })
  it('every mapped muscle has its overlay file', () => {
    for (const m of Object.values(MUSCLES)) for (const w of m.wger) {
      expect(existsSync(`public/muscles/p-${w}.svg`)).toBe(true)
      expect(existsSync(`public/muscles/s-${w}.svg`)).toBe(true)
    }
  })
})

describe('body-weight trend and insights', () => {
  const daily = (from: string, n: number, start: number, perDay: number) =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [addDays(from, i), { weight: +(start + perDay * i).toFixed(2) }]))

  it('averages the last 7 days', () => {
    const c = daily('2026-10-01', 7, 76, 0)
    expect(avgWeight(c, '2026-10-07')).toBe(76)
    expect(avgWeight({}, '2026-10-07')).toBeNull()
  })
  it('groups weekly averages by plan week', () => {
    const w = weeklyAverages(daily('2026-09-07', 14, 76, -0.05), '2026-09-07')
    expect(w.map((x) => x.week)).toEqual([1, 2])
    expect(w[1].value).toBeLessThan(w[0].value)
  })
  it('warns when losing more than 0.75 kg a week', () => {
    const st = baseState({ checkins: daily('2026-09-24', 15, 78, -0.15) })
    expect(insights(st, '2026-10-08').map((i) => i.title)).toContain('Losing weight fast')
  })
  it('flags a 2-week stall', () => {
    const st = baseState({ checkins: daily('2026-09-17', 22, 76, 0) })
    expect(insights(st, '2026-10-08').map((i) => i.title)).toContain('Weight has stalled')
  })
  it('flags low recovery and low protein', () => {
    const checkins = Object.fromEntries(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].map((d) => [d, { recovery: 2, protein: 80 }]))
    const titles = insights(baseState({ checkins }), '2026-10-08').map((i) => i.title)
    expect(titles).toContain('Recovery is low')
    expect(titles).toContain('Protein is low')
  })
  it('announces the deload week and the week before it', () => {
    expect(insights(baseState(), '2026-10-19').map((i) => i.title)).toContain('Deload week')
    expect(insights(baseState(), '2026-10-12').map((i) => i.title)).toContain('Lighter week next')
  })
})

describe('weekly review', () => {
  it('counts sessions, sets and new personal bests', () => {
    const st = baseState({
      sessions: {
        '2026-09-28': { date: '2026-09-28', dayId: 'mon', startedAt: 0, finishedAt: 1, log: { 'bench-press': [done(50, 8)] } },
        '2026-10-05': { date: '2026-10-05', dayId: 'mon', startedAt: 0, finishedAt: 1, log: { 'bench-press': [done(52.5, 8), done(52.5, 7)] } },
        '2026-10-06': { date: '2026-10-06', dayId: 'tue', startedAt: 0, log: { squat: [done(60, 8)] } },
      },
    })
    const r = weekReview(st, '2026-10-05', 5)
    expect(r.sessions).toBe(1)
    expect(r.sets).toBe(2)
    expect(r.records).toEqual(['Bench Press'])
    expect(r.planned).toBe(6)
  })
})

describe('backup import', () => {
  it('fills in anything an older or partial backup is missing', () => {
    const merged = mergeState({ version: 1, settings: { startDate: '2026-09-07' }, sessions: {}, checkins: {}, tests: { pushups: [] } } as unknown as State)
    expect(merged.tests.lsit).toEqual([])
    expect(merged.tests.deadHang).toEqual([])
    expect(merged.settings.proteinTarget).toBe(150)
    expect(merged.settings.fiveDay).toBe(false)
  })
})
