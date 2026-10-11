import { useSyncExternalStore } from 'react'
import type { DayId } from '../data/plan'

// All data lives on the device (localStorage). Export/import gives a JSON backup.

export interface SetLog {
  /** kg lifted, or kg of assistance for assisted exercises */
  load?: number
  /** reps, seconds (time) or minutes (cardio) */
  reps?: number
  done: boolean
}

export interface Session {
  date: string
  dayId: DayId
  startedAt: number
  finishedAt?: number
  log: Record<string, SetLog[]>
  /** planned exercise -> exercise actually done (busy equipment) */
  swaps?: Record<string, string>
}

export interface Checkin {
  weight?: number
  waist?: number
  protein?: number
  steps?: number
  sleep?: number
  recovery?: number
}

export interface Baseline {
  date: string
  weight?: number
  waist?: number
  pushups?: number
  deadHang?: number
  pullAssist?: number
}

export type SkillTestId = 'pushups' | 'deadHang' | 'lsit'
export interface SkillTest { date: string; value: number }

export interface Settings {
  startDate: string | null
  proteinTarget: number
  stepTarget: number
  sound: boolean
  vibrate: boolean
  fiveDay: boolean
}

export interface State {
  version: 1
  settings: Settings
  baseline?: Baseline
  sessions: Record<string, Session>
  checkins: Record<string, Checkin>
  tests: Record<SkillTestId, SkillTest[]>
  /** dates that have progress photos (the photos themselves live in IndexedDB) */
  photoDates?: string[]
}

const KEY = 'gymcals:v1'

const initial: State = {
  version: 1,
  settings: { startDate: null, proteinTarget: 130, stepTarget: 8000, sound: true, vibrate: true, fiveDay: false },
  sessions: {},
  checkins: {},
  tests: { pushups: [], deadHang: [], lsit: [] },
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as State
    return { ...initial, ...parsed, settings: { ...initial.settings, ...parsed.settings }, tests: { ...initial.tests, ...parsed.tests } }
  } catch {
    return initial
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full or blocked — keep working in memory
  }
}

export function update(fn: (s: State) => State) {
  state = fn(state)
  persist()
  listeners.forEach((l) => l())
}

export function getState() {
  return state
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state))
}

// ---------- actions ----------

export const actions = {
  finishSetup(startDate: string, baseline: Baseline) {
    update((s) => ({
      ...s,
      settings: { ...s.settings, startDate },
      baseline,
      checkins: {
        ...s.checkins,
        [baseline.date]: { ...s.checkins[baseline.date], weight: baseline.weight, waist: baseline.waist },
      },
      tests: {
        pushups: baseline.pushups != null ? [{ date: baseline.date, value: baseline.pushups }] : [],
        deadHang: baseline.deadHang != null ? [{ date: baseline.date, value: baseline.deadHang }] : [],
        lsit: [],
      },
    }))
  },

  setSettings(patch: Partial<Settings>) {
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  },

  setCheckin(date: string, patch: Partial<Checkin>) {
    update((s) => ({ ...s, checkins: { ...s.checkins, [date]: { ...s.checkins[date], ...patch } } }))
  },

  startSession(date: string, dayId: DayId) {
    update((s) => {
      const existing = s.sessions[date]
      if (existing && existing.dayId === dayId) return s
      // Carry over equipment swaps from the last time this day was trained.
      const prev = Object.values(s.sessions).filter((x) => x.dayId === dayId && x.date < date).sort((a, b) => b.date.localeCompare(a.date))[0]
      return { ...s, sessions: { ...s.sessions, [date]: { date, dayId, startedAt: Date.now(), log: {}, swaps: prev?.swaps } } }
    })
  },

  setSets(date: string, ex: string, sets: SetLog[]) {
    update((s) => {
      const session = s.sessions[date]
      if (!session) return s
      return { ...s, sessions: { ...s.sessions, [date]: { ...session, log: { ...session.log, [ex]: sets } } } }
    })
  },

  /** Swap a planned exercise for an alternative (`to` = null swaps back). Unfinished sets of the old one are dropped. */
  setSwap(date: string, planned: string, to: string | null) {
    update((s) => {
      const session = s.sessions[date]
      if (!session) return s
      const current = session.swaps?.[planned] ?? planned
      const log = { ...session.log }
      if (!log[current]?.some((x) => x.done)) delete log[current]
      const swaps = { ...session.swaps }
      if (to && to !== planned) swaps[planned] = to
      else delete swaps[planned]
      return { ...s, sessions: { ...s.sessions, [date]: { ...session, log, swaps } } }
    })
  },

  finishSession(date: string) {
    update((s) => {
      const session = s.sessions[date]
      if (!session) return s
      return { ...s, sessions: { ...s.sessions, [date]: { ...session, finishedAt: Date.now() } } }
    })
  },

  discardSession(date: string) {
    update((s) => {
      const sessions = { ...s.sessions }
      delete sessions[date]
      return { ...s, sessions }
    })
  },

  addTest(id: SkillTestId, date: string, value: number) {
    update((s) => ({
      ...s,
      tests: { ...s.tests, [id]: [...s.tests[id].filter((t) => t.date !== date), { date, value }].sort((a, b) => a.date.localeCompare(b.date)) },
    }))
  },

  importData(json: string) {
    const parsed = JSON.parse(json) as State
    if (parsed.version !== 1 || !parsed.settings) throw new Error('This file is not a GymCals backup.')
    update(() => ({ ...initial, ...parsed }))
  },

  reset() {
    update(() => initial)
  },
}

export const exportData = () => JSON.stringify(state, null, 2)
