import { dayFor, isDeload, isMaintenance, phaseOf, programOf } from '../data/plan'
import { dayIdOf, today, weekOf } from './dates'
import { useStore } from './store'

export function useToday() {
  const start = useStore((s) => s.settings.startDate)
  const fiveDay = useStore((s) => s.settings.fiveDay)
  const program = programOf(useStore((s) => s.settings.program))
  const date = today()
  const rawWeek = weekOf(date, start)
  const dayId = dayIdOf(date)
  const week = Math.min(program.weeks, Math.max(1, rawWeek))
  const ctx = { fiveDay, week, program }
  return {
    date,
    start,
    rawWeek,
    week,
    beforeStart: rawWeek === 0,
    finished: rawWeek > program.weeks,
    dayId,
    day: dayFor(dayId, fiveDay, ctx),
    fiveDay,
    program,
    ctx,
    phase: phaseOf(week, program),
    deload: isDeload(week, program),
    maintenanceWeek: isMaintenance(week, program),
  }
}
