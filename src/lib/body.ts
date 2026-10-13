// Body maths for the fat-loss and V-taper goals. All estimates — the weekly trend is what counts.

export type Sex = 'male' | 'female'
export type Activity = 'low' | 'medium' | 'high'

export interface Profile {
  heightCm?: number
  age?: number
  sex?: Sex
  activity?: Activity
}

/** Daily-life activity on top of the 6 training days. */
export const ACTIVITY: Record<Activity, { label: string; factor: number }> = {
  low: { label: 'Desk job', factor: 1.45 },
  medium: { label: 'On my feet', factor: 1.6 },
  high: { label: 'Physical job', factor: 1.75 },
}

/** Deficit for roughly 0.4 kg of fat loss a week (in the plan's 0.25–0.5 kg range). */
export const DEFICIT = 450

const round10 = (n: number) => Math.round(n / 10) * 10

export const profileComplete = (p?: Profile): p is Required<Profile> =>
  !!p && !!p.heightCm && !!p.age && !!p.sex && !!p.activity

/** Mifflin–St Jeor resting energy, kcal/day. */
export function bmr(weightKg: number, p: Required<Profile>) {
  return 10 * weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161)
}

export function calories(weightKg: number, p: Required<Profile>, adjust = 0) {
  const rest = bmr(weightKg, p)
  const maintenance = round10(rest * ACTIVITY[p.activity].factor)
  // Never suggest less than resting energy or the usual safe floors.
  const floor = Math.max(round10(rest * 1.05), p.sex === 'male' ? 1600 : 1300)
  const target = Math.max(floor, round10(maintenance - DEFICIT + adjust))
  return { maintenance, target, floor }
}

/** US Navy body-fat estimate (%), from tape measurements in cm. Hip is needed for women. */
export function navyBodyFat(p: Profile, waist?: number, neck?: number, hip?: number) {
  if (!p.heightCm || !waist || !neck) return null
  if (p.sex === 'female') {
    if (!hip || waist + hip - neck <= 0) return null
    return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(p.heightCm)) - 450
  }
  if (waist - neck <= 0) return null
  return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(p.heightCm)) - 450
}

/** Body fat where the six-pack usually starts to show. */
export const absZone = (sex?: Sex) => (sex === 'female' ? { from: 18, to: 22 } : { from: 10, to: 12 })

/** Shoulder circumference ÷ waist. A clear V-taper is about 1.5–1.6 (1.618 is the "golden" ratio). */
export const vTaper = (shoulders?: number, waist?: number) => (shoulders && waist ? shoulders / waist : null)
export const V_TARGET = 1.6
