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

export const daysFor = (fiveDay: boolean) => (fiveDay ? FIVE_DAYS : DAYS)
export const dayFor = (id: DayId, fiveDay: boolean) => daysFor(fiveDay).find((d) => d.id === id)!

export const DAY_BY_ID = Object.fromEntries(DAYS.map((d) => [d.id, d])) as Record<DayId, PlanDay>
export const JS_DAY: DayId[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const TOTAL_WEEKS = 12
export const DELOAD_WEEK = 7

export const PHASES = [
  { name: 'Foundation', weeks: [1, 4], text: 'Learn the technique, use manageable weights, build push-ups, hangs and assisted pull-ups.' },
  { name: 'Progression', weeks: [5, 8], text: 'Add reps or small amounts of weight, reduce pull-up assistance, improve push-up endurance.' },
  { name: 'Performance', weeks: [9, 12], text: 'Keep progressing, attempt your first clean pull-up, harder push-up and core variations.' },
] as const

export const WEEK_FOCUS: Record<number, string> = {
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

export const phaseOf = (week: number) => PHASES.find((p) => week >= p.weeks[0] && week <= p.weeks[1]) ?? PHASES[2]

export const setsFor = (item: PlanItem, week: number) =>
  week === DELOAD_WEEK && item.ex !== 'incline-walk' ? Math.max(1, Math.round(item.sets * 0.6)) : item.sets

export const allItems = (day: PlanDay) => day.groups.flatMap((g) => g.items)
