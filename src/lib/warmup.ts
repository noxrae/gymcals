// Warm-up sets and plate loading for barbell lifts (20 kg bar, plates per side).

export const BAR = 20
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]

const roundTo = (kg: number, step = 2.5) => Math.max(BAR, Math.round(kg / step) * step)

/** 2–4 ramp-up sets before the first working set (PDF: "2–4 progressive warm-up sets"). */
export function warmupSets(work: number): { kg: number; reps: number }[] {
  if (work <= BAR) return [{ kg: BAR, reps: 10 }]
  const sets = [{ kg: BAR, reps: 10 }]
  const ramp = work >= 80 ? [[0.5, 5], [0.7, 3], [0.85, 1]] : work >= 40 ? [[0.55, 5], [0.75, 3]] : [[0.7, 5]]
  for (const [pct, reps] of ramp) {
    const kg = roundTo(work * pct)
    if (kg > sets[sets.length - 1].kg && kg < work) sets.push({ kg, reps })
  }
  return sets
}

/** Plates for one side of the bar, heaviest first. */
export function platesPerSide(total: number): number[] {
  let left = Math.max(0, (total - BAR) / 2)
  const out: number[] = []
  for (const p of PLATES) {
    while (left >= p - 1e-9) {
      out.push(p)
      left -= p
    }
  }
  return out
}

export const plateText = (total: number) => {
  const p = platesPerSide(total)
  const loaded = BAR + 2 * p.reduce((a, b) => a + b, 0)
  const text = p.length ? `${p.join(' + ')} each side` : 'Empty bar'
  // Standard plates go down to 1.25 kg, so totals load in 2.5 kg steps.
  return total - loaded > 0.01 ? `${text} (= ${loaded} kg; ${+(total - loaded).toFixed(2)} kg needs micro-plates)` : text
}
