import { dayFor } from '../data/plan'
import { dayIdOf, today, weekOf } from './dates'
import { useStore } from './store'

export function useToday() {
  const start = useStore((s) => s.settings.startDate)
  const fiveDay = useStore((s) => s.settings.fiveDay)
  const date = today()
  const rawWeek = weekOf(date, start)
  const dayId = dayIdOf(date)
  return {
    date,
    start,
    rawWeek,
    week: Math.min(12, Math.max(1, rawWeek)),
    beforeStart: rawWeek === 0,
    finished: rawWeek > 12,
    dayId,
    day: dayFor(dayId, fiveDay),
    fiveDay,
  }
}
