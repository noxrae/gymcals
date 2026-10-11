import { JS_DAY, TOTAL_WEEKS, type DayId } from '../data/plan'

const pad = (n: number) => String(n).padStart(2, '0')

export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => iso(new Date())
export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)
export const dayIdOf = (s: string): DayId => JS_DAY[parse(s).getDay()]

/** Plan week (1–12) for a date; 0 before the start, 13+ after the end. */
export const weekOf = (date: string, start: string | null) => {
  if (!start) return 1
  const diff = daysBetween(start, date)
  if (diff < 0) return 0
  return Math.floor(diff / 7) + 1
}
export const clampWeek = (w: number) => Math.min(TOTAL_WEEKS, Math.max(1, w))

/** Monday of the week containing a date. */
export const mondayOf = (s: string) => {
  const d = parse(s)
  const shift = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - shift)
  return iso(d)
}

export const fmtLong = (s: string) => parse(s).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
export const fmtShort = (s: string) => parse(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
export const fmtWeekday = (s: string) => parse(s).toLocaleDateString(undefined, { weekday: 'long' })

export const fmtClock = (secs: number) => {
  const s = Math.max(0, Math.round(secs))
  return `${Math.floor(s / 60)}:${pad(s % 60)}`
}
