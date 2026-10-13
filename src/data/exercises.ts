import type { MuscleId } from './muscles'
import videos from './videos.json' with { type: 'json' }

// How a set is logged:
//   weight — kg × reps         assist — assistance kg × reps (less is harder)
//   reps   — bodyweight reps   time   — seconds held      cardio — minutes
export type LogKind = 'weight' | 'assist' | 'reps' | 'time' | 'cardio'

export interface Exercise {
  key: string
  name: string
  kind: LogKind
  /** smallest sensible load change in kg */
  step: number
  equipment: string
  primary: MuscleId[]
  secondary: MuscleId[]
  steps: string[]
  mistake: string
  photos: number
  video?: { id: string; title: string; channel: string }
}

type Def = Omit<Exercise, 'key' | 'video' | 'photos'> & { photos?: number }

const DEFS: Record<string, Def> = {
  'bench-press': {
    name: 'Bench Press', kind: 'weight', step: 2.5, equipment: 'Barbell · flat bench',
    primary: ['chest'], secondary: ['front-delts', 'triceps'],
    steps: ['Eyes under the bar, feet flat, shoulder blades pulled back and down.', 'Grip just wider than shoulders and unrack with straight arms.', 'Lower under control to your mid-chest, elbows about 45° from your body.', 'Press up and slightly back until your arms are straight.'],
    mistake: 'Bouncing the bar off your chest or letting your shoulders roll forward.',
  },
  'incline-dumbbell-press': {
    name: 'Incline Dumbbell Press', kind: 'weight', step: 2, equipment: 'Dumbbells · bench at 30°',
    primary: ['chest', 'front-delts'], secondary: ['triceps'],
    steps: ['Set the bench to about 30° and sit with the dumbbells on your knees.', 'Kick them up and start with them over your upper chest.', 'Lower until they are level with your chest, elbows slightly tucked.', 'Press up and slightly together without clanking them.'],
    mistake: 'Setting the bench too steep, which turns it into a shoulder press.',
  },
  'lat-pulldown': {
    name: 'Lat Pulldown', kind: 'weight', step: 2.5, equipment: 'Cable machine · wide bar',
    primary: ['lats'], secondary: ['biceps', 'mid-back', 'rear-delts'],
    steps: ['Thighs locked under the pad, grip a little wider than shoulders.', 'Lean back slightly and pull your shoulder blades down first.', 'Drive your elbows toward your ribs until the bar reaches your upper chest.', 'Let the bar rise slowly to a full stretch.'],
    mistake: 'Swinging your torso back to move the weight.',
  },
  'seated-cable-row': {
    name: 'Seated Cable Row', kind: 'weight', step: 2.5, equipment: 'Cable row · V-handle',
    primary: ['mid-back', 'lats'], secondary: ['biceps', 'rear-delts'],
    steps: ['Sit tall with a slight knee bend and grab the handle.', 'Pull the handle to your lower ribs, squeezing your shoulder blades.', 'Pause for a second with your chest up.', 'Reach forward slowly, letting your shoulders stretch.'],
    mistake: 'Rocking your torso back and forth to move the weight.',
  },
  'lateral-raise': {
    name: 'Lateral Raise', kind: 'weight', step: 1, equipment: 'Dumbbells',
    primary: ['side-delts'], secondary: ['traps'],
    steps: ['Stand tall with light dumbbells at your sides, slight bend in the elbows.', 'Raise your arms out to the side, leading with your elbows.', 'Stop at shoulder height, pinkies roughly level with thumbs.', 'Lower slowly over two to three seconds.'],
    mistake: 'Using momentum or shrugging your shoulders up to your ears.',
  },
  'triceps-pushdown': {
    name: 'Triceps Pushdown', kind: 'weight', step: 2.5, equipment: 'Cable · rope or bar',
    primary: ['triceps'], secondary: [],
    steps: ['Stand close to the cable with elbows pinned to your sides.', 'Push down until your arms are fully straight.', 'Spread the rope apart at the bottom.', 'Let your forearms rise back to about 90° under control.'],
    mistake: 'Letting your elbows drift forward so your shoulders do the work.',
  },
  'push-up': {
    name: 'Push-up', kind: 'reps', step: 0, equipment: 'Bodyweight',
    primary: ['chest'], secondary: ['triceps', 'front-delts', 'abs'],
    steps: ['Hands slightly wider than shoulders, body in one straight line.', 'Brace your abs and squeeze your glutes.', 'Lower until your chest is a fist from the floor, elbows at about 45°.', 'Push the floor away until your arms are straight.'],
    mistake: 'Letting your hips sag or flaring your elbows straight out.',
  },
  'scapular-push-up': {
    name: 'Scapular Push-up', kind: 'reps', step: 0, equipment: 'Bodyweight',
    primary: ['serratus'], secondary: ['chest'],
    steps: ['Start at the top of a push-up with straight arms.', 'Keep your elbows locked and let your chest sink between your shoulder blades.', 'Push the floor away so your upper back rounds slightly.', 'Move slowly. Only your shoulder blades move.'],
    mistake: 'Bending your elbows. It turns into a tiny push-up.',
  },
  squat: {
    name: 'Squat', kind: 'weight', step: 2.5, equipment: 'Barbell · rack',
    primary: ['quads', 'glutes'], secondary: ['adductors', 'lower-back'],
    steps: ['Bar on your upper back, feet shoulder-width, toes slightly out.', 'Brace your core with a deep breath.', 'Sit down between your heels, knees tracking over your toes.', 'Drive up through your whole foot, chest staying up.'],
    mistake: 'Knees caving in or heels lifting off the floor.',
  },
  'hack-squat': {
    name: 'Hack Squat', kind: 'weight', step: 5, equipment: 'Hack squat machine',
    primary: ['quads'], secondary: ['glutes'],
    steps: ['Back flat on the pad, feet shoulder-width in the middle of the platform.', 'Release the safeties and lower under control.', 'Go as deep as you can with your lower back on the pad.', 'Push through your whole foot to the top without locking your knees hard.'],
    mistake: 'Cutting the depth short to lift more weight.',
  },
  'romanian-deadlift': {
    name: 'Romanian Deadlift', kind: 'weight', step: 2.5, equipment: 'Barbell or dumbbells',
    primary: ['hamstrings', 'glutes'], secondary: ['lower-back', 'forearms'],
    steps: ['Stand tall holding the bar, soft bend in your knees.', 'Push your hips back, sliding the bar down your thighs.', 'Stop when your hamstrings are fully stretched, back flat.', 'Squeeze your glutes to stand back up.'],
    mistake: 'Rounding your back or turning it into a squat.',
  },
  'leg-press': {
    name: 'Leg Press', kind: 'weight', step: 5, equipment: 'Leg press machine',
    primary: ['quads'], secondary: ['glutes', 'hamstrings'],
    steps: ['Feet shoulder-width in the middle of the platform.', 'Release the safeties and lower until your knees reach about 90°.', 'Keep your lower back and hips on the seat.', 'Press back up without locking your knees.'],
    mistake: 'Lowering so far that your hips curl off the seat.',
  },
  'leg-curl': {
    name: 'Leg Curl', kind: 'weight', step: 2.5, equipment: 'Leg curl machine',
    primary: ['hamstrings'], secondary: ['calves'],
    steps: ['Line your knees up with the machine pivot.', 'Curl the pad toward your glutes as far as you can.', 'Squeeze for a moment at the top.', 'Lower slowly over two to three seconds.'],
    mistake: 'Lifting your hips to cheat the weight up.',
  },
  'calf-raise': {
    name: 'Calf Raise', kind: 'weight', step: 2.5, equipment: 'Machine or step',
    primary: ['calves'], secondary: [],
    steps: ['Balls of your feet on the edge, heels hanging free.', 'Lower your heels into a deep stretch and pause.', 'Rise as high as you can onto your toes.', 'Pause at the top, then lower slowly. No bouncing.'],
    mistake: 'Bouncing through short reps instead of using the full range.',
  },
  'dead-hang': {
    name: 'Dead Hang', kind: 'time', step: 0, equipment: 'Pull-up bar',
    primary: ['forearms'], secondary: ['lats'],
    steps: ['Grip the bar shoulder-width, thumbs wrapped around.', 'Hang with straight arms and relaxed legs.', 'Keep a gentle brace, breathe slowly.', 'Step down before your grip fully gives out.'],
    mistake: 'Hanging until your grip fails. Stop with a little left.',
  },
  'scapular-pull-up': {
    name: 'Scapular Pull-up', kind: 'reps', step: 0, equipment: 'Pull-up bar',
    primary: ['lats', 'mid-back'], secondary: ['traps'],
    steps: ['Start from a dead hang with straight arms.', 'Pull your shoulder blades down and back. Your body rises a few centimetres.', 'Hold for a second without bending your elbows.', 'Lower back to a full hang slowly.'],
    mistake: 'Bending your elbows. This is a shoulder-blade movement only.',
  },
  'assisted-pull-up': {
    name: 'Assisted Pull-up', kind: 'assist', step: 2.5, equipment: 'Assisted machine or band',
    primary: ['lats'], secondary: ['biceps', 'mid-back', 'brachialis'],
    steps: ['Grip slightly wider than shoulders, knees on the pad or foot in the band.', 'Pull your shoulder blades down first.', 'Drive your elbows toward your ribs until your chin clears the bar.', 'Lower for two to three seconds to a full hang.'],
    mistake: 'Kicking or swinging. Use more assistance instead.',
  },
  'negative-pull-up': {
    name: 'Negative Pull-up', kind: 'reps', step: 0, equipment: 'Pull-up bar · box',
    primary: ['lats'], secondary: ['biceps', 'mid-back'],
    steps: ['Step or jump up so your chin is over the bar.', 'Hold the top with your shoulders down.', 'Lower yourself as slowly as you can, aiming for 3–5 seconds.', 'Step back up and repeat. Don\'t jump into the next one.'],
    mistake: 'Dropping the last half of the rep. Control the whole way down.',
  },
  'one-arm-dumbbell-row': {
    name: 'One-arm Dumbbell Row', kind: 'weight', step: 2, equipment: 'Dumbbell · bench',
    primary: ['lats', 'mid-back'], secondary: ['biceps', 'rear-delts'],
    steps: ['One hand and knee on the bench, back flat.', 'Let the dumbbell hang straight down from your shoulder.', 'Pull it toward your hip, elbow close to your body.', 'Lower to a full stretch. Do all reps, then switch sides.'],
    mistake: 'Twisting your torso to heave the weight up.',
  },
  'chest-supported-row': {
    name: 'Chest-supported Row', kind: 'weight', step: 2, equipment: 'Incline bench · dumbbells',
    primary: ['mid-back', 'lats'], secondary: ['rear-delts', 'biceps'],
    steps: ['Lie chest-down on an incline bench, dumbbells hanging.', 'Pull your elbows back past your torso.', 'Squeeze your shoulder blades together at the top.', 'Lower to a full stretch without shrugging.'],
    mistake: 'Lifting your chest off the pad to cheat.',
  },
  'face-pull': {
    name: 'Face Pull', kind: 'weight', step: 2.5, equipment: 'Cable · rope at face height',
    primary: ['rear-delts'], secondary: ['mid-back', 'traps'],
    steps: ['Set the rope at face height and step back with arms straight.', 'Pull the rope toward your forehead, elbows high.', 'Pull the ends apart and rotate your hands back.', 'Return slowly with control.'],
    mistake: 'Going too heavy and pulling with your lower back.',
  },
  'dumbbell-curl': {
    name: 'Dumbbell Curl', kind: 'weight', step: 1, equipment: 'Dumbbells',
    primary: ['biceps'], secondary: ['forearms'],
    steps: ['Stand tall, elbows at your sides, palms forward.', 'Curl the dumbbells up without moving your elbows.', 'Squeeze at the top.', 'Lower slowly to straight arms.'],
    mistake: 'Swinging your body to get the weight up.',
  },
  'hammer-curl': {
    name: 'Hammer Curl', kind: 'weight', step: 1, equipment: 'Dumbbells',
    primary: ['brachialis', 'biceps'], secondary: ['forearms'],
    steps: ['Hold the dumbbells with palms facing each other.', 'Curl up, keeping your elbows pinned to your sides.', 'Stop when your forearms are vertical.', 'Lower slowly.'],
    mistake: 'Letting your elbows drift forward.',
  },
  'hanging-knee-raise': {
    name: 'Hanging Knee Raise', kind: 'reps', step: 0, equipment: 'Pull-up bar',
    primary: ['abs'], secondary: ['hip-flexors', 'obliques'],
    steps: ['Hang from the bar with your shoulders pulled down.', 'Curl your knees up toward your chest, tilting your pelvis.', 'Pause at the top.', 'Lower slowly without swinging.'],
    mistake: 'Swinging. If you swing, pause at the bottom before each rep.',
  },
  'cable-crunch': {
    name: 'Cable Crunch', kind: 'weight', step: 2.5, equipment: 'Cable · rope',
    primary: ['abs'], secondary: ['obliques'],
    steps: ['Kneel facing the cable, rope held beside your head.', 'Keep your hips still and crunch your ribs toward your hips.', 'Squeeze your abs at the bottom.', 'Rise slowly back to the start.'],
    mistake: 'Sitting your hips back instead of curling your spine.',
  },
  'dead-bug': {
    name: 'Dead Bug', kind: 'reps', step: 0, equipment: 'Floor',
    primary: ['abs'], secondary: ['obliques', 'hip-flexors'],
    steps: ['Lie on your back, arms up, knees bent at 90° over your hips.', 'Press your lower back into the floor.', 'Slowly lower the opposite arm and leg toward the floor.', 'Return and switch sides. Count each side as one rep.'],
    mistake: 'Letting your lower back arch off the floor.',
  },
  'side-plank': {
    name: 'Side Plank', kind: 'time', step: 0, equipment: 'Floor',
    primary: ['obliques'], secondary: ['abs', 'glutes'],
    steps: ['Lie on your side, elbow under your shoulder.', 'Lift your hips so your body forms a straight line.', 'Hold without letting your hips drop.', 'Switch sides. The time is per side.'],
    mistake: 'Letting your hips sag or roll backward.',
  },
  'pike-push-up': {
    name: 'Pike Push-up', kind: 'reps', step: 0, equipment: 'Bodyweight',
    primary: ['front-delts'], secondary: ['triceps', 'traps'],
    steps: ['Start in a downward-dog shape, hips high.', 'Bend your elbows to lower the top of your head toward the floor.', 'Keep your elbows at about 45°, not flared.', 'Press back up to straight arms.'],
    mistake: 'Dropping your hips into a regular push-up.',
  },
  'tuck-l-sit': {
    name: 'Tuck L-sit', kind: 'time', step: 0, equipment: 'Parallettes or dip bars',
    primary: ['abs'], secondary: ['triceps', 'hip-flexors'],
    steps: ['Hands on parallettes or the floor beside your hips.', 'Push down hard with locked elbows, shoulders down.', 'Lift your feet and tuck your knees to your chest.', 'Hold tall. Don\'t let your shoulders shrug up.'],
    mistake: 'Shoulders collapsing up to your ears.',
  },
  'incline-bench-press': {
    name: 'Incline Bench Press', kind: 'weight', step: 2.5, equipment: 'Barbell · incline bench',
    primary: ['chest', 'front-delts'], secondary: ['triceps'],
    steps: ['Bench at about 30°, shoulder blades pulled back.', 'Unrack with straight arms over your upper chest.', 'Lower to just below your collarbone.', 'Press up to straight arms.'],
    mistake: 'Arching so much that it becomes a flat press.',
  },
  'chest-press': {
    name: 'Chest Press', kind: 'weight', step: 2.5, equipment: 'Machine or dumbbells',
    primary: ['chest'], secondary: ['triceps', 'front-delts'],
    steps: ['Set the seat so the handles line up with your mid-chest.', 'Shoulder blades back against the pad.', 'Press forward until your arms are almost straight.', 'Return slowly to a good stretch.'],
    mistake: 'Shoulders rolling forward off the pad at the end of each rep.',
  },
  'dumbbell-shoulder-press': {
    name: 'Dumbbell Shoulder Press', kind: 'weight', step: 2, equipment: 'Dumbbells · upright bench',
    primary: ['front-delts', 'side-delts'], secondary: ['triceps'],
    steps: ['Sit tall with the dumbbells at shoulder height, palms forward.', 'Brace your abs so your back doesn\'t arch.', 'Press up until your arms are straight overhead.', 'Lower to ear level under control.'],
    mistake: 'Leaning back so far that it becomes an incline press.',
  },
  'triceps-extension': {
    name: 'Triceps Extension', kind: 'weight', step: 2.5, equipment: 'Cable · rope overhead',
    primary: ['triceps'], secondary: [],
    steps: ['Face away from the cable with the rope behind your head.', 'Keep your elbows pointing forward.', 'Straighten your arms fully overhead.', 'Lower slowly into a deep stretch.'],
    mistake: 'Elbows flaring wide apart.',
  },
  'bulgarian-split-squat': {
    name: 'Bulgarian Split Squat', kind: 'weight', step: 2, equipment: 'Bench · dumbbells',
    primary: ['quads', 'glutes'], secondary: ['adductors', 'hamstrings'],
    steps: ['Rear foot on a bench, front foot a big step forward.', 'Lower straight down until your back knee nearly touches the floor.', 'Keep your front knee tracking over your toes.', 'Drive up through your front heel. Finish one leg, then switch.'],
    mistake: 'Front foot too close to the bench, which loads your knee.',
  },
  'leg-extension': {
    name: 'Leg Extension', kind: 'weight', step: 2.5, equipment: 'Leg extension machine',
    primary: ['quads'], secondary: [],
    steps: ['Line your knees up with the machine pivot.', 'Straighten your legs fully.', 'Squeeze your quads for a second at the top.', 'Lower slowly.'],
    mistake: 'Kicking the weight up with momentum.',
  },
  'farmers-carry': {
    name: "Farmer's Carry", kind: 'time', step: 0, equipment: 'Heavy dumbbells or kettlebells',
    primary: ['forearms', 'traps'], secondary: ['abs', 'obliques', 'glutes'],
    steps: ['Pick up a heavy weight in each hand like a deadlift.', 'Stand tall, shoulders down and back.', 'Walk with short, controlled steps.', 'Set the weights down with a flat back.'],
    mistake: 'Leaning to one side or letting your shoulders round forward.',
  },
  'walking-lunge': {
    name: 'Walking Lunge', kind: 'reps', step: 0, equipment: 'Bodyweight or dumbbells',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'],
    steps: ['Stand tall and take a long step forward.', 'Lower until both knees are about 90°.', 'Push through your front heel and step into the next lunge.', 'Count reps per leg.'],
    mistake: 'Short steps that push your front knee far past your toes.',
  },
  'mountain-climber': {
    name: 'Mountain Climbers', kind: 'time', step: 0, equipment: 'Floor',
    primary: ['abs'], secondary: ['hip-flexors', 'front-delts', 'quads'],
    steps: ['Start in a high plank, hands under your shoulders.', 'Drive one knee toward your chest.', 'Switch legs in a steady, controlled rhythm.', 'Keep your hips level, not bouncing.'],
    mistake: 'Going frantic and letting your hips pike up.',
  },
  'reverse-fly': {
    name: 'Reverse Fly', kind: 'weight', step: 1, equipment: 'Dumbbells · incline bench',
    primary: ['rear-delts'], secondary: ['mid-back'],
    steps: ['Hinge forward or lie chest-down, light dumbbells hanging.', 'Soft bend in the elbows.', 'Raise your arms out wide until they line up with your body.', 'Lower slowly.'],
    mistake: 'Going heavy and turning it into a row.',
  },
  plank: {
    name: 'Plank', kind: 'time', step: 0, equipment: 'Floor',
    primary: ['abs'], secondary: ['obliques', 'glutes'],
    steps: ['Forearms under your shoulders, legs straight.', 'Squeeze your glutes and brace your abs.', 'Keep a straight line from head to heels.', 'Breathe steadily and hold.'],
    mistake: 'Hips sagging or piking high.',
  },
  'incline-walk': {
    name: 'Incline Walk / Bike', kind: 'cardio', step: 0, equipment: 'Treadmill, bike or elliptical',
    primary: [], secondary: [],
    steps: ['Pick an incline walk, bike or elliptical.', 'Keep a pace where you can still speak in short sentences.', 'Stay steady. This is conditioning, not punishment.'],
    mistake: 'Turning easy cardio into a hard interval session.',
  },
}

const PHOTO_COUNT: Record<string, number> = { 'dead-hang': 1, 'scapular-push-up': 1, 'pike-push-up': 1, 'tuck-l-sit': 1 }
const VIDEOS = videos as Record<string, { id: string; title: string; channel: string } | null>

export const EXERCISES: Record<string, Exercise> = Object.fromEntries(
  Object.entries(DEFS).map(([key, def]) => [
    key,
    {
      ...def,
      key,
      photos: def.photos ?? PHOTO_COUNT[key] ?? 2,
      video: VIDEOS[key] ?? undefined,
    },
  ]),
)

/** Equivalent exercises for when equipment is busy (same main muscles). */
export const ALTERNATIVES: Record<string, string[]> = {
  squat: ['hack-squat', 'leg-press'],
  'hack-squat': ['squat', 'leg-press'],
  'leg-press': ['hack-squat', 'squat'],
  'bench-press': ['chest-press', 'incline-dumbbell-press'],
  'chest-press': ['bench-press', 'incline-dumbbell-press'],
  'incline-bench-press': ['incline-dumbbell-press', 'chest-press'],
  'incline-dumbbell-press': ['incline-bench-press', 'chest-press'],
  'lat-pulldown': ['assisted-pull-up'],
  'assisted-pull-up': ['lat-pulldown', 'negative-pull-up'],
  'seated-cable-row': ['chest-supported-row', 'one-arm-dumbbell-row'],
  'chest-supported-row': ['seated-cable-row', 'one-arm-dumbbell-row'],
  'one-arm-dumbbell-row': ['chest-supported-row', 'seated-cable-row'],
  'triceps-pushdown': ['triceps-extension'],
  'triceps-extension': ['triceps-pushdown'],
  'dumbbell-curl': ['hammer-curl'],
  'hammer-curl': ['dumbbell-curl'],
  'face-pull': ['reverse-fly'],
  'reverse-fly': ['face-pull'],
  'bulgarian-split-squat': ['walking-lunge', 'leg-press'],
  'cable-crunch': ['dead-bug', 'plank'],
  'hanging-knee-raise': ['dead-bug', 'plank'],
}

/** Gym (machines, barbells, dumbbells, cables) vs calisthenics (bodyweight / bar skills) vs cardio. */
export type ExType = 'gym' | 'cali' | 'cardio'
const CALISTHENICS = new Set([
  'push-up', 'scapular-push-up', 'pike-push-up', 'dead-hang', 'scapular-pull-up', 'assisted-pull-up', 'negative-pull-up',
  'hanging-knee-raise', 'dead-bug', 'side-plank', 'plank', 'tuck-l-sit', 'walking-lunge', 'mountain-climber',
])
export const typeOf = (key: string): ExType => (EXERCISES[key]?.kind === 'cardio' ? 'cardio' : CALISTHENICS.has(key) ? 'cali' : 'gym')
export const TYPE_LABEL: Record<ExType, string> = { gym: 'Gym', cali: 'Calisthenics', cardio: 'Cardio' }

/** How the form demo animates: a held position, or start ↔ finish reps (fast for climbers). */
export const HOLDS = new Set(['dead-hang', 'plank', 'side-plank', 'tuck-l-sit', 'farmers-carry'])
export const FAST = new Set(['mountain-climber'])
/** No free photos exist for these, so the demo is an animated figure. */
export const FIGURE_DEMO = new Set(['pike-push-up', 'scapular-push-up', 'tuck-l-sit'])

export const BARBELL = new Set(['bench-press', 'incline-bench-press', 'squat', 'romanian-deadlift'])

export const photoUrl =(key: string, i = 0) => `exercises/${key}-${i}.jpg`
