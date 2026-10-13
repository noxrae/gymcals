import { useState } from 'react'
import { Chevron } from './Icons'

// The evidence behind the plan, in plain words, with honest expectations for the goals.
const POINTS = [
  {
    title: 'Progressive overload',
    text: 'You add a rep or a little weight only when every set hits the top of the range (double progression). This steady, measurable increase is the core driver of strength and muscle in every major review (ACSM 2026).',
  },
  {
    title: 'Enough volume, twice a week',
    text: 'Most muscles get 12–20 hard sets a week, split over at least two sessions. Research shows growth rises with weekly sets up to roughly this range, with diminishing returns beyond it (Schoenfeld et al., 2017).',
  },
  {
    title: 'Gym + calisthenics together',
    text: 'Weights build muscle and strength efficiently; calisthenics adds relative strength and body control (pull-ups, L-sit, pike push-ups). Both count as training, so they’re integrated, not stacked as extra workouts.',
  },
  {
    title: 'Belly fat and love handles',
    text: 'Fat can’t be spot-reduced. Crunches and side bends don’t burn the fat over them. It comes off the whole body through a steady calorie deficit, steps and cardio, while lifting keeps your muscle. Your waist measurement is the best sign it’s working.',
  },
  {
    title: 'The V-taper',
    text: 'Width comes from side delts (14 sets a week) and lats (pull-ups, pulldowns, rows), while the waist gets smaller from fat loss. Track it with the shoulder-to-waist ratio in Progress → Body.',
  },
  {
    title: 'A visible six-pack',
    text: 'Abs are trained 2–3 times a week, but they only show when body fat is low, usually around 10–12% for men. Depending on where you start, that can take longer than 12 weeks. The body-fat estimate shows how close you are.',
  },
  {
    title: 'Protein, sleep and recovery',
    text: 'About 1.6–1.8 g of protein per kg (125–140 g for you) protects muscle in a deficit (Morton et al., 2018). Sleep 7–9 hours, keep 2–3 reps in reserve, and use the week 7 deload, because adaptation happens during recovery.',
  },
  {
    title: 'Cardio without losing muscle',
    text: 'Moderate cardio 2–3 times a week alongside lifting does not block muscle or strength gains when it’s kept away from heavy leg work (Schumann et al., 2022).',
  },
]

export function WhyPlan() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div>
      <h2 className="sec">Why this plan works</h2>
      <div className="group">
        {POINTS.map((p, i) => (
          <div key={p.title}>
            <button type="button" className="row" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span style={{ flex: 1, fontWeight: 600 }}>{p.title}</span>
              <span style={{ transform: open === i ? 'rotate(90deg)' : undefined, transition: 'transform .25s var(--ease)', display: 'flex' }}><Chevron /></span>
            </button>
            {open === i && <p style={{ margin: 0, padding: '0 16px 14px', fontSize: 15, lineHeight: 1.5, color: 'var(--label-2)', animation: 'fade .25s ease both' }}>{p.text}</p>}
          </div>
        ))}
      </div>
      <p className="sec-foot">Education, not medical advice. Results depend on consistency, food, sleep and genetics.</p>
    </div>
  )
}
