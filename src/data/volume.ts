import { EXERCISES } from './exercises'
import type { MuscleId } from './muscles'
import { allItems, type PlanDay } from './plan'

/** Hard sets a week where the muscle is a main target. */
export const weeklySets = (days: PlanDay[], muscle: MuscleId) =>
  days.flatMap(allItems).filter((it) => EXERCISES[it.ex].primary.includes(muscle)).reduce((n, it) => n + it.sets, 0)

/** How many days a week train the muscle directly. */
export const daysTraining = (days: PlanDay[], muscle: MuscleId) =>
  days.filter((d) => allItems(d).some((it) => EXERCISES[it.ex].primary.includes(muscle))).length

/** One line per training day, e.g. "Mon: Upper A + Push". */
export const scheduleText = (days: PlanDay[]) =>
  days.map((d) => `${d.id[0].toUpperCase()}${d.id.slice(1)} ${d.groups.length ? d.name : 'rest'}`).join(', ')
