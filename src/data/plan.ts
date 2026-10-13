// The 12-week plan from the PDF, with the agreed tweaks:
//   Thu skills before cardio · extra lateral raises Wed · reverse flyes Fri
//   Fri assisted pull-ups first · short core work Tue · deload in week 7

export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface PlanItem {
  ex: string
  sets: number
  min: number
  max: number
  /** rest range in seconds */
  rest: [number, number]
  perSide?: boolean
  note?: string
  added?: boolean
}

/** Each group holds one kind of training (gym, calisthenics or cardio) so the app can label it clearly. */
export interface PlanGroup { title: string; items: PlanItem[] }

export interface PlanDay {
  id: DayId
  name: string
  short: string
  focus: string
  minutes: number
  hero: string
  groups: PlanGroup[]
  optionalCardio?: string
}

const r = (ex: string, sets: number, min: number, max: number, rest: [number, number], extra: Partial<PlanItem> = {}): PlanItem => ({ ex, sets, min, max, rest, ...extra })

export const DAYS: PlanDay[] = [
  {
    id: 'mon', name: 'Upper A + Push', short: 'Upper A', focus: 'Chest · Back · Shoulders · Triceps', minutes: 75, hero: 'bench-press',
    optionalCardio: '10–15 min moderate incline walk',
    groups: [
      { title: 'Main lifts', items: [r('bench-press', 3, 6, 10, [120, 180], { note: 'Controlled descent' }), r('incline-dumbbell-press', 3, 8, 12, [90, 150])] },
      { title: 'Back', items: [r('lat-pulldown', 3, 8, 12, [90, 150]), r('seated-cable-row', 3, 8, 12, [90, 150])] },
      { title: 'Shoulders & arms', items: [r('lateral-raise', 3, 12, 15, [60, 90]), r('triceps-pushdown', 2, 10, 15, [60, 90])] },
      { title: 'Push foundation', items: [r('push-up', 3, 6, 12, [90, 120], { note: 'Stop 2–3 reps short' }), r('scapular-push-up', 2, 10, 15, [60, 60])] },
    ],
  },
  {
    id: 'tue', name: 'Lower A + Cardio', short: 'Lower A', focus: 'Quads · Hamstrings · Glutes · Calves', minutes: 70, hero: 'squat',
    groups: [
      { title: 'Main lifts', items: [r('squat', 3, 6, 10, [120, 180], { note: 'Or hack squat — whichever you control best' }), r('romanian-deadlift', 3, 8, 10, [120, 180])] },
      { title: 'Accessories', items: [r('leg-press', 2, 10, 12, [90, 150]), r('leg-curl', 3, 10, 15, [60, 90]), r('calf-raise', 3, 12, 15, [60, 90])] },
      { title: 'Core', items: [r('plank', 2, 30, 45, [45, 60], { added: true })] },
      { title: 'Cardio', items: [r('incline-walk', 1, 20, 25, [0, 0])] },
    ],
  },
  {
    id: 'wed', name: 'Pull + Pull-up Progression', short: 'Pull', focus: 'Back width · Biceps · Pull-up skill', minutes: 80, hero: 'dead-hang',
    optionalCardio: '10 min easy, if recovery is good',
    groups: [
      { title: 'Pull-up skill · do these fresh', items: [r('dead-hang', 3, 20, 40, [90, 90], { note: 'Stop before your grip fails' }), r('scapular-pull-up', 3, 5, 8, [90, 120]), r('assisted-pull-up', 4, 5, 8, [120, 180]), r('negative-pull-up', 2, 3, 3, [120, 120], { note: '3–5 s lowering' })] },
      { title: 'Back strength', items: [r('one-arm-dumbbell-row', 3, 8, 12, [90, 150], { perSide: true }), r('chest-supported-row', 2, 8, 12, [90, 150]), r('face-pull', 3, 12, 15, [60, 90])] },
      { title: 'Shoulders', items: [r('lateral-raise', 2, 12, 15, [60, 90], { added: true })] },
      { title: 'Arms', items: [r('dumbbell-curl', 3, 10, 12, [60, 90]), r('hammer-curl', 2, 10, 12, [60, 90])] },
    ],
  },
  {
    id: 'thu', name: 'Skills · Core · Cardio', short: 'Skills', focus: 'Body control · Abs · Conditioning', minutes: 60, hero: 'hanging-knee-raise',
    groups: [
      { title: 'Skills first · while fresh', items: [r('pike-push-up', 3, 5, 10, [90, 150]), r('tuck-l-sit', 3, 10, 20, [90, 150])] },
      { title: 'Core · bodyweight', items: [r('hanging-knee-raise', 3, 8, 12, [60, 90]), r('dead-bug', 3, 10, 10, [45, 60], { perSide: true }), r('side-plank', 3, 30, 45, [45, 60], { perSide: true })] },
      { title: 'Core · cable', items: [r('cable-crunch', 3, 10, 15, [60, 90])] },
      { title: 'Cardio', items: [r('incline-walk', 1, 30, 40, [0, 0])] },
    ],
  },
  {
    id: 'fri', name: 'Upper B + Calisthenics', short: 'Upper B', focus: 'Upper chest · Shoulders · Back · Arms', minutes: 80, hero: 'incline-bench-press',
    optionalCardio: '10–15 min easy',
    groups: [
      { title: 'Pull-up skill · moved first', items: [r('assisted-pull-up', 2, 5, 8, [120, 120], { note: 'Technique, not failure' })] },
      { title: 'Main lifts', items: [r('incline-bench-press', 3, 8, 10, [120, 180]), r('chest-press', 2, 10, 12, [90, 120]), r('lat-pulldown', 3, 8, 12, [90, 150]), r('seated-cable-row', 2, 10, 12, [90, 120])] },
      { title: 'Shoulders', items: [r('dumbbell-shoulder-press', 3, 8, 10, [120, 120]), r('lateral-raise', 3, 12, 15, [60, 90]), r('reverse-fly', 2, 12, 15, [60, 90], { added: true })] },
      { title: 'Arms', items: [r('dumbbell-curl', 2, 10, 12, [60, 90]), r('triceps-extension', 2, 10, 12, [60, 90])] },
      { title: 'Push-ups', items: [r('push-up', 2, 8, 15, [90, 90], { note: 'Leave ~2 reps in reserve' })] },
    ],
  },
  {
    id: 'sat', name: 'Lower B + Athletic', short: 'Lower B', focus: 'Legs · Balance · Conditioning', minutes: 70, hero: 'bulgarian-split-squat',
    optionalCardio: '10–15 min easy, if legs feel recovered',
    groups: [
      { title: 'Main lifts', items: [r('bulgarian-split-squat', 3, 8, 10, [120, 120], { perSide: true }), r('romanian-deadlift', 3, 8, 10, [120, 180])] },
      { title: 'Accessories', items: [r('leg-extension', 2, 12, 15, [60, 90]), r('leg-curl', 2, 12, 15, [60, 90]), r('calf-raise', 3, 12, 15, [60, 90])] },
      { title: 'Shoulders · V-taper', items: [r('lateral-raise', 3, 12, 15, [60, 90], { added: true, note: 'Extra width work for the V-taper' })] },
      { title: 'Loaded carry', items: [r('farmers-carry', 3, 30, 45, [90, 120])] },
      { title: 'Conditioning', items: [r('walking-lunge', 2, 10, 10, [90, 90], { perSide: true }), r('mountain-climber', 3, 30, 30, [60, 60])] },
    ],
  },
  {
    id: 'sun', name: 'Rest Day', short: 'Rest', focus: 'Sleep · Food · Easy walking', minutes: 0, hero: '', groups: [],
  },
]

// 5-day mode (from the PDF: "a consistent five-day week beats an unsustainable six-day week"):
// Thursday becomes a recovery day, its skill and core work is spread across the other days,
// and optional cardio is dropped.
const FIVE_DAY_EXTRAS: Partial<Record<DayId, PlanGroup>> = {
  mon: { title: 'Skill', items: [r('pike-push-up', 2, 5, 10, [90, 150])] },
  wed: { title: 'Core', items: [r('hanging-knee-raise', 3, 8, 12, [60, 90])] },
  fri: { title: 'Skill', items: [r('tuck-l-sit', 2, 10, 20, [90, 150])] },
  sat: { title: 'Core', items: [r('side-plank', 2, 30, 45, [45, 60], { perSide: true })] },
}

const FIVE_DAYS: PlanDay[] = DAYS.map((d) => {
  if (d.id === 'thu') {
    return { ...d, name: 'Recovery Day', short: 'Recovery', focus: 'Easy walk · Mobility · Sleep', minutes: 0, hero: '', groups: [] }
  }
  const extra = FIVE_DAY_EXTRAS[d.id]
  return { ...d, optionalCardio: undefined, groups: extra ? [...d.groups, extra] : d.groups }
})

const daysBase = (fiveDay: boolean) => (fiveDay ? FIVE_DAYS : DAYS)

export const JS_DAY: DayId[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// ---------------- programs: 12 weeks, 4 months, 6 months ----------------
// Periodised blocks: learn → progress → perform, then (longer plans) a higher-rep hypertrophy
// block and/or a heavier strength block, with a lighter deload week every ~6 weeks and a
// maintenance-calorie week at the start of each new block to make a long diet sustainable.

export type ProgramId = 12 | 16 | 24
export type PhaseId = 'foundation' | 'progression' | 'performance' | 'peak' | 'hypertrophy' | 'strength'

export interface Phase { id: PhaseId; name: string; weeks: [number, number]; text: string }
export interface Program { id: ProgramId; weeks: number; name: string; short: string; summary: string; phases: Phase[]; deloads: number[]; maintenance: number[] }

const BLOCK_1: Phase[] = [
  { id: 'foundation', name: 'Foundation', weeks: [1, 4], text: 'Learn the technique, use manageable weights, build push-ups, hangs and assisted pull-ups.' },
  { id: 'progression', name: 'Progression', weeks: [5, 8], text: 'Add reps or small amounts of weight, reduce pull-up assistance, improve push-up endurance.' },
  { id: 'performance', name: 'Performance', weeks: [9, 12], text: 'Keep progressing, attempt your first clean pull-up, harder push-up and core variations.' },
]

export const PROGRAMS: Record<ProgramId, Program> = {
  12: {
    id: 12, weeks: 12, name: '12 weeks', short: '12 wk',
    summary: 'Your PDF plan: foundation, progression and performance, with a lighter week 7.',
    phases: BLOCK_1, deloads: [7], maintenance: [],
  },
  16: {
    id: 16, weeks: 16, name: '4 months', short: '4 mo',
    summary: 'The 12-week plan plus a 4-week peak: heavier main lifts (5–8 reps), full pull-ups and harder calisthenics.',
    phases: [...BLOCK_1, { id: 'peak', name: 'Peak', weeks: [13, 16], text: 'Recover in week 13, then heavier main lifts (5–8 reps), full pull-ups, decline and diamond push-ups, advanced L-sit.' }],
    deloads: [7, 13], maintenance: [13],
  },
  24: {
    id: 24, weeks: 24, name: '6 months', short: '6 mo',
    summary: 'Three blocks: the 12-week plan, a 6-week hypertrophy block for size (extra shoulder and lat work), then 6 weeks of strength and definition.',
    phases: [
      ...BLOCK_1,
      { id: 'hypertrophy', name: 'Hypertrophy', weeks: [13, 18], text: 'More muscle: main lifts 8–12 reps, extra side-delt and lat sets for the V-taper, harder calisthenics.' },
      { id: 'strength', name: 'Strength & definition', weeks: [19, 24], text: 'Heavier main lifts (5–8 reps), full pull-ups, advanced core skills, steady fat loss to reveal the work.' },
    ],
    deloads: [7, 13, 19], maintenance: [13, 19],
  },
}

export const programOf = (id?: number): Program => PROGRAMS[(id as ProgramId) in PROGRAMS ? (id as ProgramId) : 12]

const FOCUS: Record<number, string> = {
  1: 'Learn the setup and technique for every exercise. Write down your starting weights and reps.',
  2: 'Repeat the same exercises. Add one rep where you can.',
  3: 'Hit the top of the rep range on every set? Make a small weight increase.',
  4: 'Consolidate. Don’t force progress if you feel tired.',
  5: 'Start the harder calisthenics progressions.',
  6: 'Keep adding reps or weight. Next week is lighter.',
  7: 'Deload week: about 40% fewer sets at the same weights. Keep the technique practice.',
  8: 'Back to full volume. Reduce pull-up assistance, check waist, photos and lifts.',
  9: 'Performance phase. Keep technique clean as weights climb.',
  10: 'Small increases in weight or reps.',
  11: 'Aim for your best clean reps, not failure.',
  12: 'Re-test your push-ups, hang and lifts. Compare with week 1.',
}
const FOCUS_16: Record<number, string> = {
  12: 'Mini re-test of push-ups and lifts, then keep going. Next week is a lighter, maintenance-calorie week.',
  13: 'Deload + maintenance calories: recover fully before the final push.',
  14: 'Peak: main lifts move to 5–8 reps. Add weight carefully, keep 2 reps in reserve.',
  15: 'Keep pushing the main lifts. Try clean, unassisted pull-ups.',
  16: 'Final re-test: lifts, push-ups, pull-ups, L-sit, measurements and photos. Compare with week 1.',
}
const FOCUS_24: Record<number, string> = {
  12: 'Mini re-test of push-ups and lifts. Next week is a lighter, maintenance-calorie week before block 2.',
  13: 'Deload + maintenance calories. Block 2 starts next week: higher reps, harder calisthenics.',
  14: 'Hypertrophy: main lifts 8–12 reps, extra side-delt and lat sets.',
  15: 'Add reps before weight. Decline push-ups and hanging leg raises now.',
  16: 'Take accessories close to failure (1–2 reps in reserve).',
  17: 'Check waist, V-taper ratio and photos.',
  18: 'Last hard hypertrophy week before the lighter week.',
  19: 'Deload + maintenance calories. Then the final block.',
  20: 'Strength & definition: main lifts 5–8 reps. Full pull-ups replace assisted.',
  21: 'Small weight jumps on the main lifts; keep the calorie deficit steady.',
  22: 'Advanced tuck L-sit and diamond push-ups. Keep the form clean.',
  23: 'Best clean reps, not failure. Keep cardio and steps up.',
  24: 'Final re-test: lifts, push-ups, pull-ups, L-sit, measurements and photos. Compare with week 1.',
}

export const weekFocus = (week: number, p: Program) => (p.id === 16 ? FOCUS_16[week] : p.id === 24 ? FOCUS_24[week] : undefined) ?? FOCUS[week] ?? ''
export const phaseOf = (week: number, p: Program = PROGRAMS[12]) => p.phases.find((x) => week >= x.weeks[0] && week <= x.weeks[1]) ?? p.phases[p.phases.length - 1]
export const isDeload = (week: number, p: Program = PROGRAMS[12]) => p.deloads.includes(week)
export const isMaintenance = (week: number, p: Program = PROGRAMS[12]) => p.maintenance.includes(week)
export const nextDeload = (week: number, p: Program) => p.deloads.find((w) => w > week)

// How later phases change the sessions (progressive overload in exercise choice and rep ranges).
const MAIN_LIFTS = new Set(['bench-press', 'incline-bench-press', 'incline-dumbbell-press', 'squat', 'romanian-deadlift', 'bulgarian-split-squat', 'dumbbell-shoulder-press', 'chest-press'])
type Swap = { to: string; min?: number; max?: number; sets?: number; note?: string }
const HARDER: Record<string, Swap> = {
  'push-up': { to: 'decline-push-up', min: 6, max: 12 },
  'hanging-knee-raise': { to: 'hanging-leg-raise', min: 6, max: 10 },
  'pike-push-up': { to: 'elevated-pike-push-up', min: 5, max: 10 },
}
const PHASE_SWAPS: Partial<Record<PhaseId, Record<string, Swap>>> = {
  hypertrophy: { ...HARDER, 'negative-pull-up': { to: 'pull-up', min: 1, max: 3, note: 'Clean reps only; swap to assisted if needed' } },
  peak: { ...HARDER, 'assisted-pull-up': { to: 'pull-up', min: 2, max: 5, note: 'Use a band if you can’t get 2 clean reps' }, 'tuck-l-sit': { to: 'advanced-tuck-l-sit', min: 8, max: 15 } },
  strength: { ...HARDER, 'assisted-pull-up': { to: 'pull-up', min: 3, max: 6, note: 'Use a band if you can’t get 3 clean reps' }, 'tuck-l-sit': { to: 'advanced-tuck-l-sit', min: 8, max: 15 } },
}

function applyPhase(day: PlanDay, phase: PhaseId): PlanDay {
  if (phase === 'foundation' || phase === 'progression' || phase === 'performance') return day
  const swaps = PHASE_SWAPS[phase] ?? {}
  const used = new Set<string>()
  const groups = day.groups.map((g) => ({
    ...g,
    items: g.items.map((it) => {
      let next: PlanItem = { ...it }
      const s = swaps[it.ex]
      // Friday push-ups become diamond push-ups in the heavy phases (Monday ones are decline).
      const sw = it.ex === 'push-up' && day.id === 'fri' && phase !== 'hypertrophy' ? { to: 'diamond-push-up', min: 6, max: 12 } : s
      if (sw && !used.has(sw.to)) next = { ...next, ex: sw.to, min: sw.min ?? it.min, max: sw.max ?? it.max, sets: sw.sets ?? it.sets, note: sw.note ?? it.note }
      if (MAIN_LIFTS.has(next.ex)) {
        if (phase === 'hypertrophy') next = { ...next, min: 8, max: 12 }
        else next = { ...next, min: 5, max: 8, rest: [150, 210] }
      }
      if (phase === 'hypertrophy' && (next.ex === 'lateral-raise' || next.ex === 'lat-pulldown')) next = { ...next, sets: next.sets + 1 }
      used.add(next.ex)
      return next
    }),
  }))
  return { ...day, groups }
}

/** Everything the plan depends on: 5-day mode, the current week and the chosen program. */
export interface PlanCtx { fiveDay: boolean; week: number; program: Program }
export const DEFAULT_CTX: PlanCtx = { fiveDay: false, week: 1, program: PROGRAMS[12] }

export const daysFor = (fiveDay: boolean, ctx: Partial<PlanCtx> = {}) => {
  const program = ctx.program ?? PROGRAMS[12]
  const phase = phaseOf(ctx.week ?? 1, program).id
  return daysBase(fiveDay).map((d) => applyPhase(d, phase))
}
export const dayFor = (id: DayId, fiveDay: boolean, ctx: Partial<PlanCtx> = {}) => daysFor(fiveDay, ctx).find((d) => d.id === id)!

export const setsFor = (item: PlanItem, week: number, program: Program = PROGRAMS[12]) =>
  isDeload(week, program) && item.ex !== 'incline-walk' ? Math.max(1, Math.round(item.sets * 0.6)) : item.sets

export const allItems = (day: PlanDay) => day.groups.flatMap((g) => g.items)
