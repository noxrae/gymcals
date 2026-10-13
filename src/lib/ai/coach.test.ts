import { afterEach, describe, expect, it, vi } from 'vitest'
import type { State } from '../store'
import { coachCtx } from './context'
import { AiError, askGemini } from './llm'
import { findExercise, localAnswer } from './local'

const state: State = {
  version: 1,
  settings: { startDate: '2026-09-07', proteinTarget: 130, stepTarget: 8000, sound: true, vibrate: true, fiveDay: false, keepAwake: true, profile: { heightCm: 178, age: 25, sex: 'male', activity: 'medium' } },
  baseline: { date: '2026-09-07', weight: 77, pullAssist: 40 },
  sessions: {
    '2026-10-07': { date: '2026-10-07', dayId: 'wed', startedAt: 0, finishedAt: 1, log: { 'assisted-pull-up': [{ load: 30, reps: 8, done: true }] } },
  },
  checkins: {
    '2026-09-07': { weight: 77, waist: 88 },
    '2026-10-12': { weight: 75.6 }, '2026-10-13': { weight: 75.4, waist: 85, neck: 38, shoulders: 119 },
    '2026-10-14': { weight: 75.5, protein: 60 },
  },
  tests: { pushups: [{ date: '2026-09-07', value: 9 }, { date: '2026-10-05', value: 14 }], deadHang: [], lsit: [] },
}
const ctx = coachCtx(state, '2026-10-14') // Wednesday, week 6
const ans = (q: string) => localAnswer(q, ctx).text

describe('built-in coach', () => {
  it('answers today’s workout from the plan', () => {
    const a = ans("what's my workout today?")
    expect(a).toContain('Pull + Pull-up Progression')
    expect(a).toContain('Assisted Pull-up')
    expect(a).toMatch(/Same 30 kg assist/)
    expect(ans('what should I do today')).toContain('Pull + Pull-up Progression')
  })
  it('follows a workout moved to another day', () => {
    const moved = { ...state, sessions: { ...state.sessions, '2026-10-13': { date: '2026-10-13', dayId: 'wed', startedAt: 0, log: {} } } }
    expect(localAnswer('what is my workout today', coachCtx(moved, '2026-10-13')).text).toContain('Pull + Pull-up Progression')
  })
  it('puts safety first', () => {
    expect(ans('I have chest pain when running')).toMatch(/doctor/)
    expect(ans('my knee hurts on squats')).toMatch(/sharp, joint or worsening pain is not/)
    expect(ans('my knee hurts on squats')).toMatch(/Hack Squat|Leg Press/)
  })
  it('knows every exercise: form, muscles and swaps', () => {
    expect(ans('how do I do a romanian deadlift properly')).toMatch(/Avoid:/)
    expect(ans('what muscles does lateral raise work')).toMatch(/side shoulders/)
    expect(ans('easier alternative to bench press')).toMatch(/Chest Press/)
    expect(findExercise(' incline bench press form ')!.key).toBe('incline-bench-press')
    expect(findExercise(' bench press ')!.key).toBe('bench-press')
    expect(findExercise(' rdl tips ')!.key).toBe('romanian-deadlift')
  })
  it('answers from the user’s own numbers', () => {
    expect(ans('how much protein do I need today')).toMatch(/60 of 130 g.*70 g to go/)
    expect(ans('how do I lose belly fat')).toMatch(/can't be spot-reduced/)
    expect(ans('how do I lose belly fat')).toMatch(/Waist: 85 cm \(−3 cm since start\)/)
    expect(ans('when will my abs show?')).toMatch(/16\.4%/)
    expect(ans('how am i doing')).toMatch(/Weight: −1\.5 kg since start/)
    expect(ans('how do I get my first pull-up')).toMatch(/30 kg/)
  })
  it('falls back helpfully for unknown questions', () => {
    expect(ans('what is the capital of france')).toMatch(/I can help with/)
  })
})

describe('Gemini (optional, user’s free key)', () => {
  afterEach(() => vi.unstubAllGlobals())
  const ok = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 })

  it('returns the model text and sends the key in a header, not the URL', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ok('Hello from Gemini'))
    vi.stubGlobal('fetch', fetchMock)
    expect(await askGemini('KEY123', 'sys', [{ role: 'user', text: 'hi' }])).toBe('Hello from Gemini')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).not.toContain('KEY123')
    expect((init!.headers as Record<string, string>)['x-goog-api-key']).toBe('KEY123')
  })
  it('tries the next model when one is unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(ok('second model'))
    vi.stubGlobal('fetch', fetchMock)
    expect(await askGemini('k', 's', [{ role: 'user', text: 'q' }])).toBe('second model')
  })
  it('reports quota and bad keys clearly', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })))
    await expect(askGemini('k', 's', [{ role: 'user', text: 'q' }])).rejects.toMatchObject({ kind: 'quota' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 400 })))
    await expect(askGemini('k', 's', [{ role: 'user', text: 'q' }])).rejects.toBeInstanceOf(AiError)
  })
})
