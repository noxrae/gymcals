import { typeOf, TYPE_LABEL, type ExType } from '../data/exercises'
import type { PlanDay, PlanGroup } from '../data/plan'

const STYLE: Record<ExType, { bg: string; fg: string }> = {
  gym: { bg: 'var(--label)', fg: 'var(--bg)' },
  cali: { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)' },
  cardio: { bg: 'var(--good-soft)', fg: 'var(--good)' },
}

export function TypeIcon({ type, size = 14 }: { type: ExType; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (type === 'gym') return <svg {...p}><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></svg>
  if (type === 'cali') return <svg {...p}><circle cx="12" cy="4.5" r="2" /><path d="M5 9l7 1.5L19 9M12 10.5v5M12 15.5l-3.5 5.5M12 15.5l3.5 5.5" /></svg>
  return <svg {...p}><path d="M3 12h4l3-7 4 14 3-7h4" /></svg>
}

export const groupType = (g: PlanGroup): ExType => typeOf(g.items[0].ex)

/** Small label that says which kind of training a section is. */
export function TypeBadge({ type }: { type: ExType }) {
  const s = STYLE[type]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px 3px 7px', borderRadius: 999, background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', flex: 'none' }}>
      <TypeIcon type={type} size={12} />
      {TYPE_LABEL[type]}
    </span>
  )
}

/** Exercise counts per kind for a day, e.g. { gym: 6, cali: 2, cardio: 1 }. */
export function dayMix(day: PlanDay) {
  const mix: Record<ExType, number> = { gym: 0, cali: 0, cardio: 0 }
  for (const g of day.groups) for (const it of g.items) mix[typeOf(it.ex)]++
  return mix
}

export function mixText(day: PlanDay) {
  const m = dayMix(day)
  return [m.gym && `${m.gym} gym`, m.cali && `${m.cali} calisthenics`, m.cardio && 'cardio'].filter(Boolean).join(' · ')
}
