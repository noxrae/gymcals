// Muscle catalog. `wger` is the overlay id from wger.de's muscle map (null = not drawn on the map).
// Marker positions are % of the 200×369 map, measured from the overlay shapes.

export type View = 'front' | 'back'

export type MuscleId =
  | 'chest' | 'front-delts' | 'side-delts' | 'rear-delts'
  | 'biceps' | 'brachialis' | 'triceps' | 'forearms'
  | 'lats' | 'mid-back' | 'traps' | 'lower-back'
  | 'abs' | 'obliques' | 'serratus'
  | 'glutes' | 'quads' | 'hamstrings' | 'calves' | 'adductors' | 'hip-flexors'

export interface Muscle {
  name: string
  latin: string
  does: string
  wger: number[]
  /** our own overlay (e.g. 'forearms'), drawn as `<p|s>-<name>-<view>.svg` for muscles wger doesn't draw */
  custom?: string
  views: View[]
  marker?: { view: View; x: number; y: number }
}

export const MUSCLES: Record<MuscleId, Muscle> = {
  chest: { name: 'Chest', latin: 'Pectoralis major', does: 'Pushes your arms forward and together.', wger: [4], views: ['front'], marker: { view: 'front', x: 59.5, y: 23 } },
  'front-delts': { name: 'Front shoulders', latin: 'Anterior deltoid', does: 'Raises your arms forward and overhead.', wger: [2], views: ['front'], marker: { view: 'front', x: 32.2, y: 22.1 } },
  'side-delts': { name: 'Side shoulders', latin: 'Lateral deltoid', does: 'Lifts your arms out to the side. Builds shoulder width.', wger: [2], views: ['front', 'back'], marker: { view: 'front', x: 32.2, y: 22.1 } },
  'rear-delts': { name: 'Rear shoulders', latin: 'Posterior deltoid', does: 'Pulls your arms back. Balances the shoulder and improves posture.', wger: [2], views: ['back'], marker: { view: 'back', x: 32.2, y: 22.1 } },
  biceps: { name: 'Biceps', latin: 'Biceps brachii', does: 'Bends your elbow and turns your palm up.', wger: [1], views: ['front'], marker: { view: 'front', x: 71.3, y: 30.4 } },
  brachialis: { name: 'Brachialis', latin: 'Brachialis', does: 'Bends your elbow, strongest with a neutral grip.', wger: [13], views: ['front'], marker: { view: 'front', x: 25.2, y: 31.3 } },
  triceps: { name: 'Triceps', latin: 'Triceps brachii', does: 'Straightens your elbow.', wger: [5], views: ['back'], marker: { view: 'back', x: 73.3, y: 30.4 } },
  forearms: { name: 'Forearms', latin: 'Wrist & finger flexors and extensors', does: 'Grip, wrist strength and forearm size. Flexors on the palm side, extensors on the back.', wger: [], custom: 'forearms', views: ['front', 'back'], marker: { view: 'front', x: 19, y: 43 } },
  lats: { name: 'Lats', latin: 'Latissimus dorsi', does: 'Pulls your elbows down and back. The main muscle behind a V-taper.', wger: [12], views: ['back'], marker: { view: 'back', x: 61, y: 33.3 } },
  'mid-back': { name: 'Mid back', latin: 'Rhomboids & middle trapezius', does: 'Squeezes your shoulder blades together.', wger: [9], views: ['back'], marker: { view: 'back', x: 40, y: 24.5 } },
  traps: { name: 'Traps', latin: 'Trapezius', does: 'Moves and steadies your shoulder blades.', wger: [9], views: ['back'], marker: { view: 'back', x: 40, y: 21.5 } },
  'lower-back': { name: 'Lower back', latin: 'Erector spinae', does: 'Keeps your spine straight under load. Not drawn on the map.', wger: [], views: [] },
  abs: { name: 'Abs', latin: 'Rectus abdominis', does: 'Curls your trunk and keeps it from arching.', wger: [6], views: ['front'], marker: { view: 'front', x: 46.2, y: 40.4 } },
  obliques: { name: 'Obliques', latin: 'External obliques', does: 'Twists and side-bends your trunk, and resists both.', wger: [14], views: ['front'], marker: { view: 'front', x: 60.3, y: 39.3 } },
  serratus: { name: 'Serratus', latin: 'Serratus anterior', does: 'Pushes your shoulder blades forward around the ribs.', wger: [3], views: ['front'], marker: { view: 'front', x: 63.5, y: 30.8 } },
  glutes: { name: 'Glutes', latin: 'Gluteus maximus', does: 'Extends your hips. Powers squats, hinges and lunges.', wger: [8], views: ['back'], marker: { view: 'back', x: 59.8, y: 53.3 } },
  quads: { name: 'Quads', latin: 'Quadriceps femoris', does: 'Straightens your knee.', wger: [10], views: ['front'], marker: { view: 'front', x: 61, y: 58.9 } },
  hamstrings: { name: 'Hamstrings', latin: 'Biceps femoris & co.', does: 'Bends your knee and extends your hip.', wger: [11], views: ['back'], marker: { view: 'back', x: 39, y: 65.3 } },
  calves: { name: 'Calves', latin: 'Gastrocnemius & soleus', does: 'Points your foot and pushes you off the ground.', wger: [7, 15], views: ['back'], marker: { view: 'back', x: 58.3, y: 82.9 } },
  adductors: { name: 'Inner thighs', latin: 'Adductors', does: 'Pull your legs together and steady the knee. Not drawn on the map.', wger: [], views: [] },
  'hip-flexors': { name: 'Hip flexors', latin: 'Iliopsoas', does: 'Lift your knees toward your chest. Not drawn on the map.', wger: [], views: [] },
}

export const muscleOverlay = (wgerId: number, primary: boolean) => `muscles/${primary ? 'p' : 's'}-${wgerId}.svg`
export const customOverlay = (name: string, view: View, primary: boolean) => `muscles/${primary ? 'p' : 's'}-${name}-${view}.svg`
