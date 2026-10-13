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
  it('tells a bad key apart from other bad requests (real server bodies)', async () => {
    const invalid = JSON.stringify({ error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(invalid, { status: 400 })))
    await expect(askGemini('k', 's', [{ role: 'user', text: 'q' }])).rejects.toMatchObject({ kind: 'key' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { status: 'INVALID_ARGUMENT', message: 'contents is empty' } }), { status: 400 })))
    await expect(askGemini('k', 's', [{ role: 'user', text: 'q' }])).rejects.toMatchObject({ kind: 'other' })
  })
  it('handles no internet and a hung connection', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    await expect(askGemini('k', 's', [{ role: 'user', text: 'q' }])).rejects.toMatchObject({ kind: 'network', message: 'No internet connection.' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('timed out', 'TimeoutError') }))
    await expect(askGemini('k', 's', [{ role: 'user', text: 'q' }])).rejects.toMatchObject({ kind: 'network', message: 'Gemini took too long to answer.' })
  })
  it('starts the conversation with a user turn and sends the system prompt', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ok('fine'))
    vi.stubGlobal('fetch', fetchMock)
    await askGemini('k', 'SYSTEM', [{ role: 'coach', text: 'old answer' }, { role: 'user', text: 'new question' }])
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string)
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'new question' }] }])
    expect(body.system_instruction.parts[0].text).toBe('SYSTEM')
  })
  it('reports quota and bad keys clearly', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })))
    await expect(askGemini('k', 's', [{ role: 'user', text: 'q' }])).rejects.toMatchObject({ kind: 'quota' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 400 })))
    await expect(askGemini('k', 's', [{ role: 'user', text: 'q' }])).rejects.toBeInstanceOf(AiError)
  })
})

describe('built-in coach understands everyday questions', () => {
  const cases: [string, RegExp][] = [
    ['what is my workout tomorrow', /^Tomorrow · week 6\. \*\*Skills/],
    ['I only have 30 minutes', /^Short session plan/],
    ['I have no time today, what to do', /^Short session plan/],
    ['what should I eat for dinner', /paneer/],
    ['is whey protein safe', /Whey/],
    ['how much water should i drink', /2\.5–3\.5 L/],
    ['can I drink beer on weekend', /weekly average/],
    ['why is my weight not going down', /plateau/],
    ['weight increased today why', /7-day average/],
    ['best ab exercises', /already trains abs/],
    ['can i train abs every day', /already trains abs/],
    ['how to get v shape body', /V-taper/],
    ['how to get bigger arms', /progressive overload/],
    ['deadlift tips', /Romanian Deadlift/],
    ['I slept only 5 hours', /feel drained/],
    ['I cant do a single pull up', /Path to the first pull-up/],
    ['how to increase push ups', /Build to 3 × 15–20/],
    ['is running good for fat loss', /calorie deficit matters more/],
    ['what happens after 12 weeks', /4 months/],
    ['progress photos', /every 4 weeks/],
    ['stretching after workout', /dynamic warm-ups/],
    ['can i do workout twice a day', /Once a day/],
    ['is lateral raise enough for shoulders', /Lateral Raise/],
    ['should I change my program', /12 weeks/],
  ]
  it.each(cases)('%s', (q, re) => expect(ans(q)).toMatch(re))
})
