import { expect, type Page } from '@playwright/test'

// Plan starts Monday 7 Sep 2026, so Wednesday 14 Oct 2026 is week 6.
export const START = '2026-09-07'
export const WED_WEEK6 = new Date('2026-10-14T10:00:00')

const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const shift = (date: string, days: number) => {
  const [y, m, d] = date.split('-').map(Number)
  return iso(new Date(y, m - 1, d + days))
}

type SetLog = { load?: number; reps?: number; done: boolean }
export interface Seed {
  settings?: Record<string, unknown>
  baseline?: Record<string, unknown>
  sessions?: Record<string, { date: string; dayId: string; startedAt: number; finishedAt?: number; log: Record<string, SetLog[]>; swaps?: Record<string, string> }>
  checkins?: Record<string, Record<string, number>>
  tests?: Record<string, { date: string; value: number }[]>
}

/** Five weeks of realistic history up to (not including) Wednesday of week 6. */
export function history(): Seed {
  const sessions: Seed['sessions'] = {}
  const checkins: Seed['checkins'] = {}
  for (let w = 0; w < 5; w++) {
    const mon = shift(START, w * 7)
    const tue = shift(mon, 1)
    const wed = shift(mon, 2)
    sessions[mon] = { date: mon, dayId: 'mon', startedAt: 0, finishedAt: 3_600_000, log: { 'bench-press': [10, 9, 8].map((r) => ({ load: 45 + w * 2.5, reps: r, done: true })) } }
    sessions[tue] = { date: tue, dayId: 'tue', startedAt: 0, finishedAt: 3_600_000, log: { squat: [8, 8, 7].map((r) => ({ load: 50 + w * 2.5, reps: r, done: true })) } }
    sessions[wed] = { date: wed, dayId: 'wed', startedAt: 0, finishedAt: 3_600_000, log: { 'assisted-pull-up': [8, 8, 8, 8].map((r) => ({ load: 40 - w * 2.5, reps: r, done: true })) } }
  }
  for (let i = 0; i < 37; i++) {
    const d = shift(START, i)
    checkins[d] = { weight: +(76.7 - i * 0.035).toFixed(2), protein: 120, sleep: 7.4, steps: 8000, recovery: 4 }
  }
  checkins[START].waist = 88
  checkins[shift(START, 28)].waist = 86.5
  return {
    baseline: { date: START, weight: 76.7, waist: 88, pushups: 9, deadHang: 25, pullAssist: 40 },
    sessions,
    checkins,
    tests: { pushups: [{ date: START, value: 9 }], deadHang: [{ date: START, value: 25 }], lsit: [] },
  }
}

/** Opens the app at a fixed time with seeded data (null = fresh install). Fails the test on any page error. */
export async function open(page: Page, seed: Seed | null, opts: { at?: Date; path?: string } = {}) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/youtube|ytimg|fonts\.g/i.test(m.text())) errors.push(m.text())
  })
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith('http://localhost')) errors.push(`${r.status()} ${r.url()}`)
  })
  await page.clock.install({ time: opts.at ?? WED_WEEK6 })
  await page.clock.resume()
  const state = seed
    ? {
        version: 1,
        settings: { startDate: START, proteinTarget: 130, stepTarget: 8000, sound: false, vibrate: false, fiveDay: false, ...seed.settings },
        baseline: seed.baseline,
        sessions: seed.sessions ?? {},
        checkins: seed.checkins ?? {},
        tests: { pushups: [], deadHang: [], lsit: [], ...seed.tests },
      }
    : null
  await page.addInitScript((s) => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.clear()
    if (s) localStorage.setItem('gymcals:v1', JSON.stringify(s))
  }, state)
  await page.goto(`/#${opts.path ?? '/'}`)
  return errors
}

export const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('gymcals:v1') ?? 'null'))

export async function noErrors(errors: string[]) {
  expect(errors, errors.join('\n')).toEqual([])
}
