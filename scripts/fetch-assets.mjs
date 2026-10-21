// Downloads every free image the app uses into public/, so the app works offline.
//   Exercise photos: free-exercise-db (public domain) — github.com/yuhonas/free-exercise-db
//   Muscle maps:     wger.de (CC BY-SA 3.0) — recoloured to the app's accent
//   Fallback thumbs: YouTube's public thumbnail URLs for exercises with no photo
// Run with: npm run assets
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const DB = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'
const WGER = 'https://wger.de/static/images/muscles'

// app exercise key -> [free-exercise-db id, photo order]
const PHOTOS = {
  'bench-press': ['Barbell_Bench_Press_-_Medium_Grip', [0, 1]],
  'incline-dumbbell-press': ['Incline_Dumbbell_Press', [0, 1]],
  'lat-pulldown': ['Wide-Grip_Lat_Pulldown', [0, 1]],
  'seated-cable-row': ['Seated_Cable_Rows', [0, 1]],
  'lateral-raise': ['Side_Lateral_Raise', [0, 1]],
  'triceps-pushdown': ['Triceps_Pushdown_-_Rope_Attachment', [0, 1]],
  'push-up': ['Pushups', [0, 1]],
  squat: ['Barbell_Squat', [0, 1]],
  'hack-squat': ['Hack_Squat', [0, 1]],
  'romanian-deadlift': ['Romanian_Deadlift', [0, 1]],
  'leg-press': ['Leg_Press', [0, 1]],
  'leg-curl': ['Lying_Leg_Curls', [0, 1]],
  'calf-raise': ['Smith_Machine_Calf_Raise', [0, 1]],
  'dead-hang': ['Pullups', [0]],
  'scapular-pull-up': ['Scapular_Pull-Up', [0, 1]],
  'assisted-pull-up': ['Band_Assisted_Pull-Up', [0, 1]],
  'negative-pull-up': ['Pullups', [1, 0]],
  'one-arm-dumbbell-row': ['One-Arm_Dumbbell_Row', [0, 1]],
  'chest-supported-row': ['Dumbbell_Incline_Row', [0, 1]],
  'face-pull': ['Face_Pull', [0, 1]],
  'dumbbell-curl': ['Dumbbell_Bicep_Curl', [0, 1]],
  'hammer-curl': ['Hammer_Curls', [0, 1]],
  'hanging-knee-raise': ['Hanging_Leg_Raise', [0, 1]],
  'cable-crunch': ['Cable_Crunch', [0, 1]],
  'dead-bug': ['Dead_Bug', [0, 1]],
  'side-plank': ['Side_Bridge', [0, 1]],
  'incline-bench-press': ['Barbell_Incline_Bench_Press_-_Medium_Grip', [0, 1]],
  'chest-press': ['Machine_Bench_Press', [0, 1]],
  'dumbbell-shoulder-press': ['Dumbbell_Shoulder_Press', [0, 1]],
  'triceps-extension': ['Cable_Rope_Overhead_Triceps_Extension', [0, 1]],
  'bulgarian-split-squat': ['Split_Squat_with_Dumbbells', [0, 1]],
  'leg-extension': ['Leg_Extensions', [0, 1]],
  'farmers-carry': ['Farmers_Walk', [0, 1]],
  'walking-lunge': ['Bodyweight_Walking_Lunge', [0, 1]],
  'mountain-climber': ['Mountain_Climbers', [0, 1]],
  'reverse-fly': ['Reverse_Flyes', [0, 1]],
  plank: ['Plank', [0, 1]],
  'incline-walk': ['Jogging_Treadmill', [0, 1]],
  'pull-up': ['Pullups', [0, 1]],
  'decline-push-up': ['Decline_Push-Up', [0, 1]],
  'hanging-leg-raise': ['Hanging_Leg_Raise', [0, 1]],
  'diamond-push-up': ['Push-Ups_-_Close_Triceps_Position', [0, 1]],
  'straight-arm-pulldown': ['Straight-Arm_Pulldown', [0, 1]],
  'reverse-pec-deck': ['Reverse_Machine_Flyes', [0, 1]],
  'incline-dumbbell-curl': ['Incline_Dumbbell_Curl', [0, 1]],
  'cable-lateral-raise': ['Cable_Seated_Lateral_Raise', [0, 1]],
  'preacher-curl': ['Preacher_Curl', [0, 1]],
  'seated-calf-raise': ['Seated_Calf_Raise', [0, 1]],
  'seated-leg-curl': ['Seated_Leg_Curl', [0, 1]],
  'hip-thrust': ['Barbell_Hip_Thrust', [0, 1]],
  'back-extension': ['Hyperextensions_Back_Extensions', [0, 1]],
  'seated-hip-abduction': ['Thigh_Abductor', [0, 1]],
  'dead-bug-timed': ['Dead_Bug', [0, 1]],
  mobility: ['Worlds_Greatest_Stretch', [0, 1]],
  'reverse-curl': ['Reverse_Barbell_Curl', [0, 1]],
  'wrist-curl': ['Seated_Dumbbell_Palms-Up_Wrist_Curl', [0, 1]],
  'reverse-wrist-curl': ['Seated_Dumbbell_Palms-Down_Wrist_Curl', [0, 1]],
  'cable-pull-through': ['Pull_Through', [0, 1]],
  'reverse-hyper': ['Reverse_Hyperextension', [0, 1]],
}

// Exercises with no free-exercise-db photo use their form video's thumbnail instead.
const THUMB_ONLY = ['scapular-push-up', 'pike-push-up', 'tuck-l-sit', 'hollow-hold', 'wall-handstand']

const PRIMARY = '#ff4a12'
const SECONDARY = '#ff9a62'

async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function save(path, data) {
  await writeFile(path, data)
  console.log('saved', path)
}

async function main() {
  await mkdir('public/exercises', { recursive: true })
  await mkdir('public/muscles', { recursive: true })

  for (const [key, [id, order]] of Object.entries(PHOTOS)) {
    for (let i = 0; i < order.length; i++) {
      const out = `public/exercises/${key}-${i}.jpg`
      if (existsSync(out)) continue
      await save(out, await get(`${DB}/${id}/${order[i]}.jpg`))
    }
  }

  const videos = JSON.parse(await readFile('scripts/videos.json', 'utf8'))
  for (const key of THUMB_ONLY) {
    const out = `public/exercises/${key}-0.jpg`
    if (existsSync(out) || !videos[key]) continue
    await save(out, await get(`https://i.ytimg.com/vi/${videos[key].id}/hqdefault.jpg`))
  }

  for (const side of ['front', 'back']) {
    const out = `public/muscles/body-${side}.svg`
    if (!existsSync(out)) await save(out, await get(`${WGER}/muscular_system_${side}.svg`))
  }

  // One primary and one secondary overlay per wger muscle id, recoloured to the app accent.
  for (let id = 1; id <= 15; id++) {
    const svg = (await get(`${WGER}/main/muscle-${id}.svg`)).toString('utf8')
    const recolour = (color) =>
      svg
        .replace(/fill:#[0-9a-fA-F]{6}/g, `fill:${color}`)
        .replace(/([;"])opacity:0\.\d+/g, '$1opacity:1')
    await save(`public/muscles/p-${id}.svg`, recolour(PRIMARY))
    await save(`public/muscles/s-${id}.svg`, recolour(SECONDARY))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
