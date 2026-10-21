import { useSyncExternalStore } from 'react'
import { planKey, templateOf, type DayId, type TemplateId } from '../data/plan'
import type { Profile } from './body'

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
  /** which plan this workout followed ('original', 'athletic', 'athletic-extended') */
  plan?: string
}

export interface Checkin {
  weight?: number
  waist?: number
  /** monthly tape measurements (cm) for the V-taper ratio and body-fat estimate */
  shoulders?: number
  neck?: number
  hip?: number
  calories?: number
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
  /** keep the screen on while a workout is open */
  keepAwake: boolean
  /** date of the last exported backup */
  lastBackup?: string
  /** height, age, sex, activity — for the calorie target and body-fat estimate */
  profile?: Profile
  /** manual fine-tune of the calorie target, kcal */
  calorieAdjust?: number
  /** program length in weeks: 12, 16 (4 months) or 24 (6 months) */
  program?: number
  /** which weekly plan: the original PDF plan or the Athletic plan */
  plan?: TemplateId
  /** Athletic plan: the extended (heavier, fuller) version */
  extended?: boolean
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
  /** monthly calisthenics targets passed: goal id -> date */
  skillGoals?: Record<string, string>
}

const KEY = 'gymcals:v1'

const initial: State = {
  version: 1,
  settings: { startDate: null, proteinTarget: 130, stepTarget: 8000, sound: true, vibrate: true, fiveDay: false, keepAwake: true },
  sessions: {},
  checkins: {},
  tests: { pushups: [], deadHang: [], lsit: [] },
}

/** Fills in defaults for anything an older or partial save/backup is missing. */
export function mergeState(parsed: Partial<State>): State {
  return {
    ...initial,
    ...parsed,
    version: 1,
    settings: { ...initial.settings, ...parsed.settings },
    sessions: parsed.sessions ?? {},
    checkins: parsed.checkins ?? {},
    tests: { ...initial.tests, ...parsed.tests },
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? mergeState(JSON.parse(raw) as State) : initial
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
  finishSetup(startDate: string, baseline: Baseline, program = 24, plan: TemplateId = 'original', extended = false) {
    update((s) => ({
      ...s,
      settings: { ...s.settings, startDate, program, plan, extended },
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

  setSkillGoal(id: string, date: string | null) {
    update((s) => {
      const goals = { ...s.skillGoals }
      if (date) goals[id] = date
      else delete goals[id]
      return { ...s, skillGoals: goals }
    })
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
      const plan = planKey(templateOf(s.settings.plan), !!s.settings.extended)
      return { ...s, sessions: { ...s.sessions, [date]: { date, dayId, startedAt: Date.now(), log: {}, swaps: prev?.swaps, plan } } }
    })
  },

  /** Switch the weekly plan. Today's workout follows along if nothing has been logged in it yet. */
  setPlan(template: TemplateId, extended: boolean, date: string) {
    update((s) => {
      const settings = { ...s.settings, plan: template, extended }
      const today = s.sessions[date]
      const untouched = today && !today.finishedAt && !Object.values(today.log).some((sets) => sets.some((x) => x.done))
      return { ...s, settings, sessions: untouched ? { ...s.sessions, [date]: { ...today, plan: planKey(template, extended) } } : s.sessions }
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

  /** Puts a session back exactly as it was (used by Undo). */
  restoreSession(session: Session) {
    update((s) => ({ ...s, sessions: { ...s.sessions, [session.date]: session } }))
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
    let parsed: State
    try {
      parsed = JSON.parse(json) as State
    } catch {
      throw new Error('This file is not a GymCals backup.')
    }
    if (!parsed || parsed.version !== 1 || typeof parsed.settings !== 'object') throw new Error('This file is not a GymCals backup.')
    update(() => mergeState(parsed))
  },

  reset() {
    update(() => initial)
  },
}

export const exportData = () => JSON.stringify(state, null, 2)
