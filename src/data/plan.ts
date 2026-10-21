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
  /** one-tap alternatives shown by name next to the exercise (pick by equipment or comfort) */
  alt?: string[]
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
  /** day-specific warm-up checklist (otherwise the general one) */
  warmup?: string[]
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
      { title: 'Main lifts', items: [r('squat', 3, 6, 10, [120, 180], { note: 'Or hack squat — whichever you control best' }), r('hip-thrust', 3, 8, 10, [120, 150], { added: true, note: 'Replaces RDL (upper-back pain)' })] },
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
      { title: 'Main lifts', items: [r('bulgarian-split-squat', 3, 8, 10, [120, 120], { perSide: true }), r('back-extension', 3, 10, 12, [90, 120], { added: true, note: 'Replaces RDL · neutral spine' })] },
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

// ---------------- Athletic plan (user's recomposition & V-taper plan) ----------------
// Upper-body emphasis with one heavy and one light leg day. "Extended" is the fuller
// version of the same week: more exercises per session and a few wider rep ranges.

const SUN: PlanDay = DAYS[6]

const ATHLETIC: PlanDay[] = [
  {
    id: 'mon', name: 'Upper A · Chest & Back Width', short: 'Upper A', focus: 'Upper chest · Lats · Side delts · Triceps', minutes: 65, hero: 'bench-press',
    groups: [
      { title: 'Chest', items: [r('bench-press', 3, 6, 8, [120, 180], { note: 'Overall chest mass' }), r('incline-dumbbell-press', 3, 8, 10, [90, 150], { note: 'Upper chest shelf' })] },
      { title: 'Back width', items: [r('lat-pulldown', 3, 8, 12, [90, 150], { note: 'Wide grip · lat width (V-taper)' }), r('seated-cable-row', 3, 8, 12, [90, 150], { note: 'Mid-back thickness' })] },
      { title: 'Shoulders & arms', items: [r('lateral-raise', 4, 12, 15, [60, 90], { note: 'Side delts (shoulder width)' }), r('triceps-pushdown', 3, 10, 12, [60, 90], { note: 'Rope · triceps mass' })] },
    ],
  },
  {
    // Spine-safe Tuesday: the RDL is replaced (upper-back pain) by hip thrusts and 45° hip extensions.
    id: 'tue', name: 'Heavy Leg Day · Spine-safe', short: 'Heavy legs', focus: 'Quads · Glutes · Hamstrings · Calves', minutes: 70, hero: 'squat',
    optionalCardio: '10–15 min easy cycling or walking to flush out soreness',
    warmup: ['5 min light cardio on a bike or incline treadmill', '1–2 sets of 12–15 bodyweight squats', 'Dynamic leg swings, front-to-back and side-to-side', 'Light practice sets on squats before your heavy sets'],
    groups: [
      { title: 'Main lifts', items: [r('squat', 3, 6, 8, [120, 180], { note: 'Or hack squat · chest proud, core braced' }), r('hip-thrust', 3, 8, 10, [120, 180], { note: 'RDL replacement #1 · chin tucked' }), r('back-extension', 3, 10, 12, [90, 90], { note: 'RDL replacement #2 · neutral spine', alt: ['cable-pull-through', 'reverse-hyper'] })] },
      { title: 'Accessories', items: [r('bulgarian-split-squat', 2, 8, 10, [90, 90], { perSide: true, note: 'Upright torso' }), r('leg-curl', 3, 10, 12, [60, 90], { note: 'Lying or seated · pause at the top' }), r('calf-raise', 4, 12, 15, [60, 60], { note: 'Standing · full range' })] },
    ],
  },
  {
    id: 'wed', name: 'Back & Biceps + Pull-up Skills', short: 'Pull', focus: 'Back width · Rear delts · Biceps · Pull-up skill', minutes: 65, hero: 'assisted-pull-up',
    groups: [
      { title: 'Pull-up skill · do these fresh', items: [r('assisted-pull-up', 4, 5, 8, [120, 180], { note: 'Strict pull-up mastery' })] },
      { title: 'Back', items: [r('chest-supported-row', 3, 8, 12, [90, 150], { note: 'Mid-back thickness' }), r('straight-arm-pulldown', 3, 12, 15, [60, 90], { note: 'Lat isolation' }), r('reverse-pec-deck', 3, 12, 15, [60, 90], { note: 'Rear delts & posture' })] },
      { title: 'Arms', items: [r('incline-dumbbell-curl', 3, 8, 12, [60, 90], { note: 'Biceps long head' }), r('hammer-curl', 3, 10, 12, [60, 90], { note: 'Brachialis & forearms' })] },
    ],
  },
  {
    id: 'thu', name: 'Core, Abs & Tuck L-Sit + Cardio', short: 'Core', focus: 'Abs · Core compression · Fat loss', minutes: 55, hero: 'hanging-knee-raise',
    groups: [
      { title: 'Skill & lower abs', items: [r('tuck-l-sit', 4, 10, 15, [90, 120], { note: 'Core compression' }), r('hanging-knee-raise', 3, 10, 12, [60, 90], { note: 'Knee or leg raises · lower abs' })] },
      { title: 'Core · cable', items: [r('cable-crunch', 3, 12, 15, [60, 90], { note: 'Upper / mid abs' })] },
      { title: 'Core · bodyweight', items: [r('dead-bug-timed', 2, 45, 45, [45, 60], { note: 'Deep core stability' })] },
      { title: 'Cardio', items: [r('incline-walk', 1, 25, 30, [0, 0], { note: 'Zone 2: brisk walk or cycle' })] },
    ],
  },
  {
    id: 'fri', name: 'Upper B · 3D Shoulders, Upper Chest & Arms', short: 'Upper B', focus: 'Side delts · Upper chest · Biceps · Triceps', minutes: 65, hero: 'incline-bench-press',
    groups: [
      { title: 'Main lifts', items: [r('incline-bench-press', 3, 8, 10, [120, 180], { note: 'Upper chest' }), r('dumbbell-shoulder-press', 3, 8, 10, [90, 150], { note: 'Seated · front / side delts' })] },
      { title: 'Shoulders', items: [r('cable-lateral-raise', 4, 12, 15, [60, 90], { note: '3D side-delt caps' })] },
      { title: 'Arms', items: [r('preacher-curl', 3, 8, 12, [60, 90], { note: 'EZ-bar · biceps peak' }), r('triceps-extension', 3, 10, 12, [60, 90], { note: 'Overhead cable · long head' })] },
      { title: 'Push-ups', items: [r('push-up', 2, 8, 15, [90, 90], { note: 'Or scapular push-ups (Swap) · near failure' })] },
    ],
  },
  {
    id: 'sat', name: 'Light Legs, Grip & Conditioning', short: 'Light legs', focus: 'Legs · Grip · Conditioning', minutes: 45, hero: 'farmers-carry',
    groups: [
      { title: 'Light legs', items: [r('leg-extension', 3, 12, 15, [60, 90], { note: 'Quad pump without heavy fatigue' }), r('seated-leg-curl', 3, 12, 15, [60, 90], { note: 'Hamstring health' })] },
      { title: 'Grip', items: [r('farmers-carry', 3, 30, 45, [90, 120], { note: '40–50 m per carry (about 30–45 s)' })] },
      { title: 'Hang', items: [r('dead-hang', 3, 20, 60, [90, 90], { note: 'Max time · stop before your grip fails' })] },
      { title: 'Cardio & mobility', items: [r('incline-walk', 1, 15, 20, [0, 0], { note: 'Light cardio, then mobility' })] },
    ],
  },
  SUN,
]

const ATHLETIC_EXTENDED: PlanDay[] = [
  {
    id: 'mon', name: 'Upper A · Chest, Back & Triceps', short: 'Upper A', focus: 'Chest · Lats · Side delts · Triceps', minutes: 80, hero: 'bench-press',
    groups: [
      { title: 'Chest', items: [r('bench-press', 3, 6, 10, [120, 180], { note: 'Shoulder blades stable, controlled descent' }), r('incline-dumbbell-press', 3, 8, 12, [90, 150], { note: 'Modest incline' })] },
      { title: 'Back width', items: [r('lat-pulldown', 3, 8, 12, [90, 150], { note: 'Back width for the V-taper' }), r('seated-cable-row', 3, 8, 12, [90, 150], { note: 'No momentum' })] },
      { title: 'Shoulders & arms', items: [r('lateral-raise', 3, 12, 20, [60, 90]), r('triceps-pushdown', 2, 10, 15, [60, 90], { note: 'Rope' })] },
      { title: 'Push foundation', items: [r('push-up', 2, 6, 15, [90, 120], { note: 'Stop before technique breaks down' }), r('scapular-push-up', 2, 10, 15, [60, 60])] },
    ],
  },
  {
    // Tuesday without RDLs (upper-back pain): curls for hamstrings, abduction for glutes.
    // Glute-drive / hip thrust is left out until a clinician clears it.
    id: 'tue', name: 'Complete Leg Day · No RDL', short: 'Legs', focus: 'Quads · Hamstrings · Glutes · Calves', minutes: 80, hero: 'squat',
    groups: [
      { title: 'Main lift', items: [r('squat', 3, 6, 10, [120, 180], { note: 'Or hack squat' })] },
      { title: 'Hamstrings · replaces RDL', items: [r('seated-leg-curl', 3, 10, 15, [60, 120], { note: 'Hips and back supported, lower slowly' }), r('leg-curl', 2, 10, 15, [60, 120], { note: 'Lying · only if lying face-down is comfortable' })] },
      { title: 'Quads & glutes', items: [r('bulgarian-split-squat', 2, 8, 12, [90, 120], { perSide: true }), r('leg-extension', 2, 10, 15, [60, 120]), r('seated-hip-abduction', 2, 12, 20, [60, 120], { note: 'Glute medius' })] },
      { title: 'Calves', items: [r('calf-raise', 3, 10, 15, [60, 120], { note: 'Standing' }), r('seated-calf-raise', 2, 12, 20, [60, 120])] },
    ],
  },
  {
    id: 'wed', name: 'Back Width, Biceps + Pull-up Skills', short: 'Pull', focus: 'Lats · Back thickness · Rear delts · Biceps', minutes: 80, hero: 'assisted-pull-up',
    groups: [
      { title: 'Pull-up skill · do these fresh', items: [r('assisted-pull-up', 3, 5, 8, [120, 180], { note: 'No swinging, lower under control' })] },
      { title: 'Back', items: [r('lat-pulldown', 2, 8, 12, [90, 150]), r('chest-supported-row', 3, 8, 12, [90, 150]), r('straight-arm-pulldown', 2, 12, 15, [60, 90]), r('reverse-pec-deck', 3, 12, 20, [60, 90], { note: 'Or rear-delt fly' })] },
      { title: 'Arms', items: [r('dumbbell-curl', 3, 8, 12, [60, 90]), r('hammer-curl', 2, 10, 15, [60, 90])] },
      { title: 'Scapular control', items: [r('scapular-pull-up', 2, 5, 8, [60, 90], { note: 'Small, controlled movement' })] },
    ],
  },
  {
    id: 'thu', name: 'Abs, Core + Cardio', short: 'Core', focus: 'Abs · Core stability · Endurance', minutes: 65, hero: 'hanging-knee-raise',
    groups: [
      { title: 'Lower abs', items: [r('hanging-knee-raise', 3, 8, 12, [60, 90])] },
      { title: 'Core · cable', items: [r('cable-crunch', 3, 10, 15, [60, 90])] },
      { title: 'Core & L-sit', items: [r('dead-bug', 2, 10, 10, [45, 60], { perSide: true }), r('side-plank', 2, 30, 45, [45, 60], { perSide: true }), r('tuck-l-sit', 3, 10, 20, [90, 120], { note: 'Shoulders down, only as long as you control it' })] },
      { title: 'Cardio', items: [r('incline-walk', 1, 25, 35, [0, 0], { note: 'Moderate: you can still talk in short sentences' })] },
    ],
  },
  {
    id: 'fri', name: 'Upper B · Shoulders & Arms', short: 'Upper B', focus: '3D delts · Upper chest · Biceps · Triceps', minutes: 85, hero: 'incline-bench-press',
    groups: [
      { title: 'Main lifts', items: [r('incline-bench-press', 3, 8, 12, [120, 180]), r('dumbbell-shoulder-press', 3, 8, 12, [90, 150], { note: 'Seated' })] },
      { title: 'Shoulders & back', items: [r('cable-lateral-raise', 3, 12, 20, [60, 90]), r('reverse-pec-deck', 2, 12, 20, [60, 90], { note: 'Or rear-delt fly' }), r('seated-cable-row', 2, 10, 12, [60, 90])] },
      { title: 'Arms', items: [r('preacher-curl', 3, 8, 12, [60, 90], { note: 'EZ-bar or preacher' }), r('triceps-extension', 3, 10, 15, [60, 90], { note: 'Overhead cable' }), r('triceps-pushdown', 2, 10, 15, [60, 90], { note: 'Rope' })] },
      { title: 'Optional skill', items: [r('pike-push-up', 2, 5, 10, [90, 120], { note: 'Optional — only if shoulders and wrists feel good' })] },
    ],
  },
  {
    id: 'sat', name: 'Light Legs + Calisthenics', short: 'Light legs', focus: 'Leg accessories · Grip · Conditioning', minutes: 60, hero: 'farmers-carry',
    groups: [
      { title: 'Light legs', items: [r('leg-extension', 2, 12, 15, [60, 90], { note: 'Skip if still sore from Tuesday' }), r('seated-leg-curl', 2, 12, 15, [60, 90]), r('calf-raise', 3, 12, 20, [60, 90], { note: 'Standing' })] },
      { title: 'Hang', items: [r('dead-hang', 3, 20, 40, [90, 90])] },
      { title: 'Grip', items: [r('farmers-carry', 3, 30, 45, [90, 120])] },
      { title: 'Conditioning', items: [r('incline-walk', 1, 15, 20, [0, 0], { note: 'Brisk walk, cycling or sport' })] },
      { title: 'Mobility', items: [r('mobility', 1, 5, 10, [0, 0])] },
    ],
  },
  SUN,
]

// 5-day mode for the Athletic plan: Saturday (the light day) becomes recovery.
const fiveOf = (days: PlanDay[]) => days.map((d) => (d.id === 'sat' ? { ...d, name: 'Recovery Day', short: 'Recovery', focus: 'Easy walk · Mobility · Sleep', minutes: 0, hero: '', groups: [], optionalCardio: undefined } : { ...d, optionalCardio: undefined }))
const ATHLETIC_5 = fiveOf(ATHLETIC)
const ATHLETIC_EXTENDED_5 = fiveOf(ATHLETIC_EXTENDED)

// ---------------- Mastery plan (Athletic base, reviewed by a coach and a physio) ----------------
// V-taper priority (side delts and lats 3x a week, rear delts 2x), loaded abs 3x, pull-up practice
// 2x, direct forearm work 2x, calisthenics skills while fresh, every session ≤ ~75 min.
// No RDLs (they caused upper-back pain): hip thrust, loaded 45° hip extension, seated curls and
// cable pull-throughs cover the hamstrings and glutes. Weeks 1–4 bring the upper-back lifts back in
// stages; deload in week 6.

const UPPER_WARMUP = ['3 min easy bike or walk', 'Open-book thoracic rotations and wall slides', 'Light band pull-aparts and 2 min wrist prep', '1–2 light ramp-up sets of the first lift']
const LOWER_WARMUP = ['5 min easy bike or incline walk', 'Bodyweight squats 2 × 12–15 and leg swings', 'Glute bridges 1 × 15 and hip openers', 'Light practice sets before the first heavy lift']

// The full plan (week 5 onward). Weeks 1–4 are adjusted by masteryWeek() below.
const MASTERY: PlanDay[] = [
  {
    id: 'mon', name: 'Upper A · Chest & Back Width', short: 'Upper A', focus: 'Chest · Lats · Side delts · Triceps · Abs', minutes: 75, hero: 'bench-press',
    warmup: UPPER_WARMUP,
    groups: [
      { title: 'Skill practice', items: [r('tuck-l-sit', 2, 10, 15, [60, 90], { note: 'L-sit practice 1 of 2 · parallettes or blocks' })] },
      { title: 'Chest', items: [r('bench-press', 3, 6, 10, [120, 180], { note: 'Moderate arch, gentle shoulder-blade set' }), r('incline-dumbbell-press', 3, 8, 12, [90, 150])] },
      { title: 'Back width', items: [r('lat-pulldown', 3, 8, 12, [90, 150], { note: 'Wide grip, no lean-back' }), r('seated-cable-row', 3, 8, 12, [90, 150], { note: 'Torso still' })] },
      { title: 'Shoulders & arms', items: [r('lateral-raise', 3, 12, 20, [60, 90], { note: 'Side delts 1 of 3 · superset with pushdowns to save time' }), r('triceps-pushdown', 2, 10, 15, [60, 90], { note: 'Rope' })] },
      { title: 'Calisthenics finisher', items: [r('diamond-push-up', 2, 5, 12, [90, 90], { note: 'Stop 2 reps short' })] },
      { title: 'Abs', items: [r('cable-crunch', 3, 10, 15, [60, 90], { note: 'Abs 1 of 3' })] },
    ],
  },
  {
    // The one heavy leg day, fully dedicated: squat for quads, hip thrust for glutes, and the best
    // RDL alternatives for hamstrings (loaded 45° hip extension = hip hinge; seated leg curl,
    // which grows hamstrings more than lying curls — Maeo et al. 2021).
    id: 'tue', name: 'Leg Day · Quads, Glutes & Hamstrings', short: 'Legs', focus: 'Quads · Glutes · Hamstrings · Calves', minutes: 75, hero: 'squat',
    warmup: LOWER_WARMUP,
    groups: [
      { title: 'Main lifts', items: [r('squat', 3, 6, 10, [150, 180], { note: 'Stop where the pelvis starts to tuck · no grinding reps', alt: ['hack-squat', 'leg-press'] }), r('hip-thrust', 3, 8, 12, [120, 150], { note: 'Pad, bench just below the shoulder blades, ribs down' })] },
      { title: 'Hamstrings · RDL alternatives', items: [r('back-extension', 3, 8, 12, [90, 120], { note: 'Plate held low on the sternum · hip hinge, neutral spine', alt: ['cable-pull-through', 'reverse-hyper'] }), r('seated-leg-curl', 3, 8, 12, [60, 90], { note: 'Lean forward, slow lowering' })] },
      { title: 'Quads & calves', items: [r('bulgarian-split-squat', 2, 8, 12, [90, 120], { perSide: true }), r('leg-extension', 2, 10, 15, [60, 90]), r('calf-raise', 4, 8, 12, [60, 90], { note: 'Standing · 2 s pause at the bottom' })] },
    ],
  },
  {
    id: 'wed', name: 'Pull + Pull-up Skill', short: 'Pull', focus: 'Lats · Rear delts · Biceps · Forearms · Pull-ups', minutes: 75, hero: 'assisted-pull-up',
    warmup: UPPER_WARMUP,
    groups: [
      { title: 'Pull-up skill · do these fresh', items: [r('scapular-pull-up', 2, 5, 8, [60, 90]), r('negative-pull-up', 3, 3, 3, [120, 120], { note: '5 s lowering, before the assisted sets' }), r('assisted-pull-up', 3, 5, 8, [120, 180], { note: 'Pull-ups 1 of 2 · −2.5 kg assist at 8 clean reps' })] },
      { title: 'Back', items: [r('chest-supported-row', 3, 8, 12, [90, 150]), r('reverse-pec-deck', 3, 12, 20, [60, 90], { note: 'Rear delts 1 of 2' })] },
      { title: 'Arms & forearms', items: [r('incline-dumbbell-curl', 3, 8, 12, [60, 90]), r('hammer-curl', 2, 10, 15, [60, 90]), r('reverse-curl', 2, 12, 15, [60, 90], { note: 'Forearms 1 of 2' })] },
      { title: 'Grip finisher', items: [r('dead-hang', 2, 20, 45, [90, 90], { note: 'Active shoulders, stop before the grip fails' })] },
    ],
  },
  {
    id: 'thu', name: 'Core, Skills + Cardio', short: 'Core', focus: 'Abs · L-sit · Handstand · Calves · Fat loss', minutes: 70, hero: 'hanging-knee-raise',
    warmup: ['3 min easy bike or walk', '2 min wrist prep: circles, palm and finger stretches', 'Cat–cow and hip openers', 'Scapular push-ups 1 × 10'],
    groups: [
      { title: 'Skills · while fresh', items: [r('tuck-l-sit', 4, 10, 20, [90, 120], { note: 'L-sit practice 2 of 2 · parallettes or blocks' }), r('pike-push-up', 3, 5, 10, [90, 120], { note: 'Handstand prep' }), r('wall-handstand', 3, 15, 30, [90, 120], { note: 'From week 7 · ≤30 s, stop well before shaking' })] },
      { title: 'Abs', items: [r('hanging-knee-raise', 3, 8, 12, [60, 90], { note: 'Abs 2 of 3' }), r('hollow-hold', 3, 20, 30, [45, 60]), r('side-plank', 2, 30, 45, [45, 60], { perSide: true })] },
      { title: 'Calves', items: [r('calf-raise', 2, 10, 15, [60, 90], { note: 'Standing' })] },
      { title: 'Cardio', items: [r('incline-walk', 1, 25, 35, [0, 0], { note: 'Zone 2: you can still talk in short sentences' })] },
    ],
  },
  {
    id: 'fri', name: 'Upper B · 3D Shoulders & Arms', short: 'Upper B', focus: 'Side delts · Upper chest · Rear delts · Arms', minutes: 75, hero: 'incline-bench-press',
    warmup: UPPER_WARMUP,
    groups: [
      { title: 'Pull-up skill', items: [r('assisted-pull-up', 2, 5, 8, [120, 120], { note: 'Pull-ups 2 of 2 · technique, not failure' })] },
      { title: 'Main lifts', items: [r('incline-bench-press', 3, 8, 12, [120, 180]), r('dumbbell-shoulder-press', 3, 8, 12, [90, 150], { note: 'Seated, 2 reps in reserve, never to failure' })] },
      { title: 'Chest', items: [r('cable-fly', 2, 12, 15, [60, 90], { note: 'Chest 2 of 2 · full stretch, squeeze' })] },
      { title: 'Shoulders', items: [r('cable-lateral-raise', 3, 12, 20, [60, 90], { note: 'Side delts 2 of 3' }), r('reverse-pec-deck', 3, 12, 20, [60, 90], { note: 'Rear delts 2 of 2' })] },
      { title: 'Arms', items: [r('preacher-curl', 3, 8, 12, [60, 90], { note: 'EZ-bar · control the bottom' }), r('triceps-extension', 3, 10, 15, [60, 90], { note: 'Overhead cable' }), r('triceps-pushdown', 2, 10, 15, [60, 90], { note: 'Rope' })] },
    ],
  },
  {
    id: 'sat', name: 'Light Legs, Shoulders, Forearms + Abs', short: 'Light legs', focus: 'Hamstrings · Glutes · Side delts · Forearms · Abs', minutes: 70, hero: 'leg-press',
    warmup: LOWER_WARMUP.slice(0, 3),
    optionalCardio: 'your daily steps, plus a 5–10 min mobility routine at home this evening',
    groups: [
      { title: 'Legs · second hinge day', items: [r('leg-press', 3, 12, 15, [90, 120]), r('cable-pull-through', 3, 12, 15, [60, 90], { note: 'RDL alternative · hinge, squeeze the glutes' }), r('seated-leg-curl', 3, 12, 15, [60, 90]), r('seated-calf-raise', 3, 12, 20, [60, 90])] },
      { title: 'Shoulders', items: [r('lateral-raise', 3, 15, 20, [60, 60], { note: 'Light · side delts 3 of 3' })] },
      { title: 'Abs', items: [r('hanging-knee-raise', 3, 8, 12, [60, 90], { note: 'Abs 3 of 3 · before carries, while the grip is fresh' })] },
      { title: 'Grip & forearms', items: [r('farmers-carry', 2, 30, 45, [90, 120]), r('wrist-curl', 2, 15, 20, [45, 60], { note: 'Forearms 2 of 2 · back to back with reverse wrist curls' }), r('reverse-wrist-curl', 2, 15, 20, [45, 60])] },
    ],
  },
  SUN,
]

// Week-by-week adjustments for the first month (coach + physio review):
//   weeks 1–2: one set fewer on 3+ set exercises; the lifts that load the upper back come back light
//              (stage 1); no negatives; no wall handstands; hanging raises swapped for dead bugs.
//   weeks 3–4: full sets, moderate loads on those lifts (stage 2); fewer curl sets; still no negatives.
//   week 5+:   the full plan, including negatives (assisted pull-ups drop to 3 sets) and wall handstands.
type Tweak = Partial<Pick<PlanItem, 'ex' | 'sets' | 'min' | 'max' | 'note'>>
const STAGE_1: Record<string, Tweak> = {
  squat: { note: 'Weeks 1–2: empty bar or goblet squat, 4+ reps in reserve' },
  'hip-thrust': { note: 'Weeks 1–2: thick pad, about 60% load, bench below the shoulder blades' },
  'back-extension': { note: 'Weeks 1–2: bodyweight only' },
  'dead-hang': { min: 10, max: 20, note: 'Weeks 1–2: feet partly on a box' },
  'hanging-knee-raise': { ex: 'dead-bug', min: 8, max: 10, note: 'Weeks 1–2 instead of hanging raises' },
  'farmers-carry': { min: 20, max: 30, note: 'Weeks 1–2: light, about 15–20% of body weight per hand' },
  'pike-push-up': { note: 'Weeks 1–2: hands on a bench (incline pike)' },
}
const STAGE_2: Record<string, Tweak> = {
  squat: { note: 'Weeks 3–4: moderate load, 3+ reps in reserve' },
  'hip-thrust': { note: 'Weeks 3–4: moderate plate load, pad on' },
  'back-extension': { note: 'Weeks 3–4: add a light plate' },
  'pike-push-up': { note: 'Weeks 3–4: feet on the floor if the incline version felt easy' },
}
function masteryWeek(days: PlanDay[], week: number): PlanDay[] {
  if (week >= 9) return days
  if (week >= 5) {
    // Weeks 5–8: negatives and the hip-extension plate start; wall handstands wait until week 7,
    // diamond push-ups until week 9, so not everything new lands in the same week.
    return days.map((d) => ({
      ...d,
      groups: d.groups
        .map((g) => ({
          ...g,
          items: g.items
            .filter((it) => !(it.ex === 'wall-handstand' && week < 7))
            .map((it) => (d.id === 'mon' && it.ex === 'diamond-push-up' ? { ...it, ex: 'push-up', min: 6, max: 15, note: 'Regular push-ups until week 9 · stop 2 reps short' } : it)),
        }))
        .filter((g) => g.items.length),
    }))
  }
  const stage = week <= 2 ? STAGE_1 : STAGE_2
  return days.map((d) => ({
    ...d,
    groups: d.groups
      .map((g) => ({
        ...g,
        items: g.items
          .filter((it) => it.ex !== 'negative-pull-up' && it.ex !== 'wall-handstand')
          .map((it) => {
            let next: PlanItem = { ...it, ...stage[it.ex] }
            if (d.id === 'mon' && it.ex === 'diamond-push-up') next = { ...next, ex: 'push-up', min: 6, max: 15, note: 'Regular push-ups until week 9 · stop 2 reps short' }
            if (d.id === 'wed' && it.ex === 'assisted-pull-up') next = { ...next, sets: 4 }
            if (d.id === 'wed' && (it.ex === 'hammer-curl' || it.ex === 'reverse-curl')) next = { ...next, sets: 1 }
            if (d.id === 'thu' && it.ex === 'tuck-l-sit') next = { ...next, sets: 3 }
            if (week <= 2 && next.sets >= 3) next = { ...next, sets: next.sets - 1 }
            return next
          }),
      }))
      .filter((g) => g.items.length),
  }))
}
const MASTERY_5 = fiveOf(MASTERY)


export type TemplateId = 'original' | 'athletic' | 'mastery'
export const TEMPLATES: Record<TemplateId, { name: string; summary: string }> = {
  original: { name: 'Original', summary: 'Your PDF plan: upper/lower split with calisthenics every training day and two full leg days.' },
  athletic: { name: 'Athletic', summary: 'Upper-body and V-taper focus: one heavy and one light leg day, a core day, and 3D shoulders and arms.' },
  mastery: { name: 'Mastery', summary: 'The reviewed best-of plan: side delts and lats 3× a week, abs 3×, pull-ups 2×, direct forearm work, full glute and hamstring work without RDLs. A gentle 4-week start, deload in week 6. Best with 6 months.' },
}
export const templateOf = (id?: string): TemplateId => (id === 'athletic' || id === 'mastery' ? id : 'original')
/** Human name for a stored plan key ('athletic-extended' -> 'Athletic · Extended'). Old workouts without one are Original. */
export const planLabel = (key?: string) => (key === 'athletic-extended' ? 'Athletic · Extended' : TEMPLATES[templateOf(key)].name)
/** Short id stored on each workout so past sessions keep the exercises they were done with. */
export const planKey = (template: TemplateId, extended: boolean) => (template === 'athletic' ? (extended ? 'athletic-extended' : 'athletic') : template)

const daysBase = (fiveDay: boolean, template: TemplateId = 'original', extended = false, week = 1) =>
  template === 'mastery' ? masteryWeek(fiveDay ? MASTERY_5 : MASTERY, week)
  : template === 'athletic' ? (extended ? (fiveDay ? ATHLETIC_EXTENDED_5 : ATHLETIC_EXTENDED) : fiveDay ? ATHLETIC_5 : ATHLETIC) : fiveDay ? FIVE_DAYS : DAYS

export const JS_DAY: DayId[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// ---------------- programs: 12 weeks, 4 months, 6 months ----------------
// Periodised blocks: learn → progress → perform, then (longer plans) a higher-rep hypertrophy
// block and/or a heavier strength block, with a lighter deload week every ~6 weeks and a
// maintenance-calorie week at the start of each new block to make a long diet sustainable.

export type ProgramId = 12 | 16 | 24
export type PhaseId = 'foundation' | 'progression' | 'performance' | 'peak' | 'hypertrophy' | 'strength'

export interface Phase { id: PhaseId; name: string; weeks: [number, number]; text: string }
export interface Program { id: ProgramId; weeks: number; name: string; short: string; summary: string; phases: Phase[]; deloads: number[]; maintenance: number[]; focus?: Record<number, string> }

const BLOCK_1: Phase[] = [
  { id: 'foundation', name: 'Foundation', weeks: [1, 4], text: 'Learn the technique, use manageable weights, build push-ups, hangs and assisted pull-ups.' },
  { id: 'progression', name: 'Progression', weeks: [5, 8], text: 'Add reps or small amounts of weight, reduce pull-up assistance, improve push-up endurance.' },
  { id: 'performance', name: 'Performance', weeks: [9, 12], text: 'Keep progressing, attempt your first clean pull-up, harder push-up and core variations.' },
]

export const PROGRAMS: Record<ProgramId, Program> = {
  12: {
    id: 12, weeks: 12, name: '12 weeks', short: '12 wk',
    summary: 'Three 4-week phases: foundation, progression and performance, with a lighter week 7.',
    phases: BLOCK_1, deloads: [7], maintenance: [],
  },
  16: {
    id: 16, weeks: 16, name: '4 months', short: '4 mo',
    summary: 'Weeks 1–12 build the base (foundation, progression, performance), then a 4-week peak: heavier main lifts (5–8 reps), full pull-ups and harder calisthenics.',
    phases: [...BLOCK_1, { id: 'peak', name: 'Peak', weeks: [13, 16], text: 'Recover in week 13, then heavier main lifts (5–8 reps), full pull-ups, decline and diamond push-ups, advanced L-sit.' }],
    deloads: [7, 13], maintenance: [13],
  },
  24: {
    id: 24, weeks: 24, name: '6 months', short: '6 mo',
    summary: 'Three blocks: weeks 1–12 build the base, weeks 13–18 a hypertrophy block for size (extra shoulder and lat work), then weeks 19–24 strength and definition.',
    phases: [
      ...BLOCK_1,
      { id: 'hypertrophy', name: 'Hypertrophy', weeks: [13, 18], text: 'More muscle: main lifts 8–12 reps, extra side-delt and lat sets for the V-taper, harder calisthenics.' },
      { id: 'strength', name: 'Strength & definition', weeks: [19, 24], text: 'Heavier main lifts (5–8 reps), full pull-ups, advanced core skills, steady fat loss to reveal the work.' },
    ],
    deloads: [7, 13, 19], maintenance: [13, 19],
  },
}

const MASTERY_FOCUS: Record<number, string> = {
  1: 'Easy start: one set fewer on bigger exercises, light squats, hip thrusts and hangs. Learn the technique and note your starting weights.',
  2: 'Still one set fewer and light loads. Add a rep where you can.',
  3: 'Full sets from now, with moderate loads on squats and hip thrusts. Top of the range on every set? Add a little weight.',
  4: 'Moderate loads, clean reps. Next week the full plan starts.',
  5: 'Pull-up negatives and the hip-extension plate start. Next week is lighter.',
  6: 'Deload week: about 40% fewer sets at the same weights. Keep the skill practice.',
  7: 'Back to full volume, and wall handstands start. Re-test push-ups, hang and L-sit; check waist and photos.',
  8: 'Small increases in weight or reps. Aim for clean reps, not failure. Diamond push-ups start next week.',
}
/** The chosen length; the Mastery plan deloads earlier (week 6) and has its own weekly notes. */
/** The lengths offered in the app. 12 weeks is no longer offered; old 12-week settings run as 6 months. */
export const LENGTHS: ProgramId[] = [16, 24]
export const programOf = (id?: number, plan?: string): Program => {
  const base = PROGRAMS[id === 16 ? 16 : 24]
  if (plan !== 'mastery') return base
  return { ...base, summary: base.summary.replace('a lighter week 7', 'a lighter week 6'), deloads: base.deloads.map((w) => (w === 7 ? 6 : w)), focus: MASTERY_FOCUS }
}

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

export const weekFocus = (week: number, p: Program) => p.focus?.[week] ?? (p.id === 16 ? FOCUS_16[week] : p.id === 24 ? FOCUS_24[week] : undefined) ?? FOCUS[week] ?? ''
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
      if (phase === 'hypertrophy' && (next.ex === 'lateral-raise' || next.ex === 'cable-lateral-raise' || next.ex === 'lat-pulldown')) next = { ...next, sets: next.sets + 1 }
      used.add(next.ex)
      return next
    }),
  }))
  return { ...day, groups }
}

/** Everything the plan depends on: 5-day mode, the current week and the chosen program. */
export interface PlanCtx { fiveDay: boolean; week: number; program: Program; template?: TemplateId; extended?: boolean }
export const DEFAULT_CTX: PlanCtx = { fiveDay: false, week: 1, program: PROGRAMS[12] }

/** The plan context a past workout was done with (sessions remember their plan). */
export function ctxForSession<T extends Partial<PlanCtx>>(ctx: T, plan?: string): T {
  if (!plan) return { ...ctx, template: 'original', extended: false }
  return { ...ctx, template: templateOf(plan.split('-')[0]), extended: plan.endsWith('-extended') }
}

/** Mastery-only adjustments in the 6-month blocks (final coach + physio review). */
function masteryPhase(day: PlanDay, phase: PhaseId): PlanDay {
  if (phase !== 'hypertrophy' && phase !== 'strength' && phase !== 'peak') return day
  const heavy = phase === 'strength' || phase === 'peak'
  const groups = day.groups
    .map((g) => ({
      ...g,
      items: g.items
        // Strength: full pull-ups are the main lift now; negatives are dropped (elbow and grip load).
        .filter((it) => !(heavy && it.ex === 'negative-pull-up'))
        // Strength: Monday's L-sit block goes, to keep heavier Monday near 75 min (L-sit stays on Thursday).
        .filter((it) => !(heavy && day.id === 'mon' && (it.ex === 'tuck-l-sit' || it.ex === 'advanced-tuck-l-sit')))
        .map((it): PlanItem => {
          if (it.ex === 'bulgarian-split-squat') return { ...it, min: 8, max: 12, rest: [90, 120] }
          if (phase === 'hypertrophy' && it.ex === 'cable-fly') return { ...it, sets: 3 }
          if (phase === 'hypertrophy' && it.ex === 'incline-dumbbell-press') return { ...it, sets: 4 }
          if (heavy && it.ex === 'incline-dumbbell-press') return { ...it, min: 6, max: 10, rest: [120, 150] }
          if (heavy && it.ex === 'back-extension') return { ...it, sets: 2 }
          if (heavy && (it.ex === 'wrist-curl' || it.ex === 'reverse-wrist-curl')) return { ...it, sets: 1 }
          if (heavy && day.id === 'sat' && (it.ex === 'hanging-leg-raise' || it.ex === 'hanging-knee-raise')) return { ...it, ex: 'cable-crunch', min: 10, max: 15, note: 'Abs 3 of 3 · off the bar to rest grip and elbows' }
          if (heavy && it.ex === 'pull-up' && day.id === 'wed') return { ...it, note: 'Main lift now · band if you can’t get 3 clean reps' }
          return it
        }),
    }))
    .filter((g) => g.items.length)
  return { ...day, groups }
}

export const daysFor = (fiveDay: boolean, ctx: Partial<PlanCtx> = {}) => {
  const program = ctx.program ?? PROGRAMS[24]
  const phase = phaseOf(ctx.week ?? 1, program).id
  const days = daysBase(fiveDay, ctx.template, ctx.extended, ctx.week ?? 1).map((d) => applyPhase(d, phase))
  return ctx.template === 'mastery' ? days.map((d) => masteryPhase(d, phase)) : days
}
export const dayFor = (id: DayId, fiveDay: boolean, ctx: Partial<PlanCtx> = {}) => daysFor(fiveDay, ctx).find((d) => d.id === id)!

export const setsFor = (item: PlanItem, week: number, program: Program = PROGRAMS[12]) =>
  isDeload(week, program) && item.ex !== 'incline-walk' ? Math.max(1, Math.round(item.sets * 0.6)) : item.sets

export const allItems = (day: PlanDay) => day.groups.flatMap((g) => g.items)
