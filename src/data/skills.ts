// Monthly calisthenics targets: 2–3 clear, testable steps a month (from the reviewed Mastery plan).
// Months 1–3 fit the 12-week program; months 4–6 continue the same ladders for 4- and 6-month programs.

export interface SkillGoal { id: string; name: string; test: string; ex: string }
export interface SkillMonth { month: number; goals: SkillGoal[] }

export const SKILL_MONTHS: SkillMonth[] = [
  { month: 1, goals: [
    { id: 'm1-pushups-15', name: '15 strict push-ups', test: 'Chest to a fist-high target, elbows locked at the top, body in one straight line.', ex: 'push-up' },
    { id: 'm1-scap-hang', name: '10 scapular pull-ups + 30 s hang', test: '10 clean scapular pull-ups, then a 30-second dead hang with active shoulders.', ex: 'scapular-pull-up' },
    { id: 'm1-tuck-15', name: '15 s tuck L-sit', test: 'On parallettes or blocks: arms locked, shoulders down, hips off the floor for 15 s.', ex: 'tuck-l-sit' },
  ] },
  { month: 2, goals: [
    { id: 'm2-negatives', name: '3 × 5 slow pull-up negatives', test: 'Chin over the bar, then lower for 5 seconds on every rep, 3 sets of 5.', ex: 'negative-pull-up' },
    { id: 'm2-pushups-20', name: '20 push-ups or 5 diamond push-ups', test: '20 strict push-ups in one set, or 5 clean diamond push-ups.', ex: 'push-up' },
    { id: 'm2-pike', name: '3 × 8 pike push-ups', test: 'Feet on the floor, hips high, head to a point in front of the hands, 3 sets of 8.', ex: 'pike-push-up' },
  ] },
  { month: 3, goals: [
    { id: 'm3-pullup', name: 'First 1–3 strict pull-ups', test: 'From a dead hang, chin over the bar, no kicking or swinging.', ex: 'pull-up' },
    { id: 'm3-lsit-leg', name: '10 s one-leg L-sit', test: 'Tuck L-sit with one leg straight out, 10 s each side.', ex: 'tuck-l-sit' },
    { id: 'm3-wall-hs', name: '30 s chest-to-wall handstand', test: 'Walk up the wall to a straight line, chest facing the wall, hold 30 s.', ex: 'elevated-pike-push-up' },
  ] },
  { month: 4, goals: [
    { id: 'm4-pullups-5', name: '3–5 strict pull-ups', test: 'One set from a dead hang, full range, no kipping.', ex: 'pull-up' },
    { id: 'm4-adv-tuck', name: '15 s advanced tuck L-sit', test: 'Knees away from the chest, thighs level with the floor, 15 s.', ex: 'advanced-tuck-l-sit' },
    { id: 'm4-elev-pike', name: '3 × 8 elevated pike push-ups', test: 'Feet on a box, hips over shoulders, 3 sets of 8.', ex: 'elevated-pike-push-up' },
  ] },
  { month: 5, goals: [
    { id: 'm5-pullups-8', name: '6–8 strict pull-ups', test: 'One set, full range, controlled lowering.', ex: 'pull-up' },
    { id: 'm5-legraise', name: '10 strict hanging leg raises', test: 'Straight legs to hip height or higher, no swinging.', ex: 'hanging-leg-raise' },
    { id: 'm5-diamond-15', name: '15 diamond push-ups', test: 'One set, elbows close, chest nearly touching the hands.', ex: 'diamond-push-up' },
  ] },
  { month: 6, goals: [
    { id: 'm6-pullups-10', name: '10 strict pull-ups', test: 'One set from a dead hang, chin over the bar every rep.', ex: 'pull-up' },
    { id: 'm6-lsit', name: '10 s full L-sit', test: 'Both legs straight and level with the floor, 10 s. A stretch goal for some.', ex: 'advanced-tuck-l-sit' },
    { id: 'm6-wall-hs-45', name: '45 s wall handstand', test: 'Chest-to-wall, straight line, 45 s.', ex: 'elevated-pike-push-up' },
  ] },
]

/** Program month for a training week (weeks 1–4 = month 1). */
export const monthOf = (week: number, totalWeeks: number) => Math.min(Math.ceil(Math.max(1, week) / 4), Math.ceil(totalWeeks / 4), SKILL_MONTHS.length)
