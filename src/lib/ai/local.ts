// Built-in coach: free, offline and private. Matches the question to a topic and answers
// from evidence-based guidance plus the user's own data. No network, no model download.
import { ALTERNATIVES, EXERCISES, type Exercise } from '../../data/exercises'
import { MUSCLES } from '../../data/muscles'
import { isDeload, nextDeload, phaseOf, PROGRAMS } from '../../data/plan'
import { absZone, V_TARGET } from '../body'
import { fmtNum, history } from '../coach'
import { personalBests, stats, todaysPlanLines, type CoachCtx } from './context'

export interface Answer { text: string; links?: { label: string; to: string }[] }

const r1 = (n: number) => fmtNum(Math.round(n * 10) / 10)
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${r1(Math.abs(n))}`

const SYNONYMS: Record<string, string[]> = {
  'bench-press': ['bench'], 'romanian-deadlift': ['rdl', 'romanian'], 'lat-pulldown': ['pulldown', 'lat pull'],
  'assisted-pull-up': ['assisted pull'], 'pull-up': ['pullup', 'pull up', 'chin up', 'chinup'], 'push-up': ['pushup', 'push up'],
  'lateral-raise': ['lateral', 'side raise'], 'triceps-pushdown': ['pushdown'], 'bulgarian-split-squat': ['bulgarian', 'split squat'],
  'hanging-knee-raise': ['knee raise'], 'hanging-leg-raise': ['leg raise'], 'tuck-l-sit': ['l-sit', 'l sit', 'lsit'],
  'farmers-carry': ['farmer'], 'dumbbell-shoulder-press': ['shoulder press', 'overhead press'], 'face-pull': ['face pull'],
  'one-arm-dumbbell-row': ['dumbbell row', 'db row'], 'seated-cable-row': ['cable row'], 'mountain-climber': ['mountain climber'],
  'incline-walk': ['incline walk', 'treadmill'], 'dead-hang': ['dead hang', 'hang'], 'squat': ['squat'],
}

/** Finds the exercise a question is about, preferring the longest matching name. */
export function findExercise(q: string): Exercise | null {
  let best: { ex: Exercise; len: number } | null = null
  for (const ex of Object.values(EXERCISES)) {
    const names = [ex.name.toLowerCase(), ex.key.replace(/-/g, ' '), ...(SYNONYMS[ex.key] ?? [])]
    for (const n of names) if (q.includes(n) && (!best || n.length > best.len)) best = { ex, len: n.length }
  }
  return best?.ex ?? null
}

const has = (q: string, re: RegExp) => re.test(q)

export function localAnswer(question: string, c: CoachCtx): Answer {
  const q = ` ${question.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()} `
  const s = stats(c)

  // ---- safety first ----
  if (has(q, /chest pain|dizz|faint|can'?t breathe|numb/)) {
    return { text: 'Stop training now. Chest pain, dizziness, fainting or numbness need a doctor. Please get checked before your next session.' }
  }
  if (has(q, /pain|hurt|injur|sharp|tweak|pulled|strain/)) {
    const ex = findExercise(q)
    return {
      text: `Muscle burn and next-day soreness are normal; **sharp, joint or worsening pain is not**. Stop that exercise today and don't push through it.\n• Swap it for a pain-free variation${ex && ALTERNATIVES[ex.key] ? ` (e.g. ${ALTERNATIVES[ex.key].map((k) => EXERCISES[k].name).join(' or ')})` : ''} or drop it for the session.\n• Lighter weight and a smaller range often help mild niggles.\n• If it lasts more than a few days, wakes you at night, or swells, see a doctor or physiotherapist.`,
      links: ex ? [{ label: `${ex.name} form`, to: `/exercise/${ex.key}` }] : undefined,
    }
  }

  // ---- exercise-specific ----
  // "How do I get my first pull-up?" is a progression question, not a form question.
  const journey = has(q, /first (pull|chin|push|muscle)|get (a|my|to) .*(pull|chin).?up|can'?t do (a |one |any )?(pull|chin)/)
  const ex = journey ? undefined : findExercise(q)
  if (ex && has(q, /muscle|work|target|hit/)) {
    return { text: `**${ex.name}** works mainly ${ex.primary.map((m) => MUSCLES[m].name.toLowerCase()).join(' and ')}${ex.secondary.length ? `, with help from ${ex.secondary.map((m) => MUSCLES[m].name.toLowerCase()).join(', ')}` : ''}.`, links: [{ label: 'See the muscle map', to: `/exercise/${ex.key}?tab=muscles` }] }
  }
  if (ex && has(q, /easier|harder|alternative|instead|replace|swap|substitut|busy|no machine/)) {
    const alts = ALTERNATIVES[ex.key] ?? []
    return { text: alts.length ? `Good swaps for **${ex.name}**: ${alts.map((k) => EXERCISES[k].name).join(', ')}. In the workout, tap **Swap** next to the exercise and the app remembers your choice.` : `There's no built-in swap for ${ex.name}, but you can lower the load or reps while you build up.`, links: [{ label: ex.name, to: `/exercise/${ex.key}` }] }
  }
  if (ex && (has(q, /how|form|technique|correct|proper|do |perform|tips?/) || q.trim().split(' ').length <= 3)) {
    const h = history(c.state, ex.key).at(-1)
    return {
      text: `**${ex.name}**\n${ex.steps.map((st, i) => `${i + 1}. ${st}`).join('\n')}\n**Avoid:** ${ex.mistake}${h ? `\nLast time: ${h.sets.map((x) => (x.load != null ? `${fmtNum(x.load)}×${x.reps}` : `${x.reps}`)).join(', ')}.` : ''}`,
      links: [{ label: 'Video + form demo', to: `/exercise/${ex.key}` }],
    }
  }

  // ---- today / plan ----
  if (has(q, /today'?s (workout|session|plan|training)|what.*(train|workout|session|exercises)|what (should|do) i do today|workout (for )?today|train today|plan for today| today \?? $/)) {
    const lines = todaysPlanLines(c)
    return { text: `Week ${c.week} · ${phaseOf(c.week, c.program).name}${isDeload(c.week, c.program) ? ' · deload' : ''}. **${c.day.name}**:\n${lines.join('\n')}`, links: c.day.groups.length ? [{ label: 'Open today’s workout', to: `/day/${c.day.id}` }] : undefined }
  }
  if (has(q, /month|program|which plan|longer|16 week|24 week|switch plan/)) {
    return { text: `You're on the **${c.program.name}** program (week ${c.week} of ${c.program.weeks}).\n• 12 weeks: your PDF plan.\n• 4 months: + a peak block with heavier lifts and full pull-ups.\n• 6 months: + a hypertrophy block for size, then strength & definition.\nLonger plans add planned lighter weeks and maintenance-calorie weeks. ${PROGRAMS[24].weeks > c.week ? 'Switching keeps all your history.' : ''}`, links: [{ label: 'Change program', to: '/plan' }] }
  }
  if (has(q, /deload|lighter week|rest week/)) {
    const nd = nextDeload(c.week, c.program)
    return { text: `A deload is a planned lighter week: about 40% fewer sets at the same weights. Fatigue drops, technique stays sharp, and you come back stronger. ${isDeload(c.week, c.program) ? 'This week is one, so enjoy it.' : nd ? `Your next one is week ${nd}.` : 'No more deloads in this program.'}` }
  }

  // ---- body goals ----
  if (has(q, /six.?pack|6.?pack| abs |abs\?|visible abs|ab definition/)) {
    const zone = absZone(c.state.settings.profile?.sex)
    if (s.bf) {
      const pts = Math.max(0, s.bf - zone.to)
      const weeks = pts / 0.45
      return { text: `Abs usually show around **${zone.from}–${zone.to}% body fat**. Your estimate is **${r1(s.bf)}%**${pts > 0 ? `, so about ${r1(pts)} points to go. At a steady 0.25–0.5 kg a week that's roughly **${Math.round(weeks * 0.8)}–${Math.round(weeks * 1.3)} weeks**.` : ', so you’re there: keep the deficit small and keep training abs.'}\nCrunches build the muscle; the deficit reveals it. Train abs 2–3× a week (it's in your plan).`, links: [{ label: 'Body tab', to: '/progress?tab=body' }] }
    }
    return { text: `Abs show when body fat is low, usually around ${zone.from}–${zone.to}% for ${c.state.settings.profile?.sex === 'female' ? 'women' : 'men'}. Ab training builds them; a calorie deficit reveals them. Add your waist, neck and height and I'll estimate how far you are.`, links: [{ label: 'Add measurements', to: '/log' }] }
  }
  if (has(q, /belly|stomach|tummy|love handle|side fat|spot|lose fat|fat loss|burn fat|lose weight|weight loss/)) {
    const trend = s.weekChange != null ? `This week your average moved **${signed(s.weekChange)} kg**${s.weekChange < -0.75 ? ', a bit fast: eat ~150 kcal more' : s.weekChange > -0.1 ? ', flat: check your waist, then trim ~150 kcal or add 2,000 steps if it stays flat' : ', right on pace'}.` : 'Log morning weigh-ins and I’ll track your weekly trend.'
    return { text: `Belly fat and love handles can't be spot-reduced. Ab and side exercises don't burn the fat on top of them. Fat comes off the whole body with a **steady calorie deficit** (${s.cal ? `your target is ${s.cal.target.toLocaleString()} kcal` : 'set your target in Settings'}), daily steps and cardio, while lifting keeps your muscle.\n${trend}${s.waistNow && s.waistStart ? `\nWaist: ${s.waistNow} cm (${signed(s.waistNow - s.waistStart)} cm since start). That's the best sign it's working.` : ''}`, links: s.cal ? [{ label: 'Check-in', to: '/log' }] : [{ label: 'Set calorie target', to: '/settings?profile=1' }] }
  }
  if (has(q, /v.?taper|wider|width|broad|shoulder size|bigger shoulder/)) {
    return { text: `A V-taper comes from **wider side delts and lats** plus a **smaller waist**. Your plan gives side delts 14 sets a week and lats ~28. ${s.ratio ? `Your shoulder-to-waist ratio is **${s.ratio.toFixed(2)}** (goal ${V_TARGET}).` : 'Measure shoulders and waist monthly to track your ratio.'} Progress lateral raises with strict form, and chase pull-up strength.`, links: [{ label: s.ratio ? 'Body tab' : 'Add measurements', to: s.ratio ? '/progress?tab=body' : '/log' }] }
  }

  // ---- food ----
  if (has(q, /protein/)) {
    const left = Math.max(0, s.proteinTarget - s.protein)
    return { text: `Today: **${s.protein} of ${s.proteinTarget} g** protein${left ? ` — ${left} g to go` : ' — done!'}.\nEasy Indian options: chicken 150 g (45 g), 3 eggs (18 g), paneer 100 g (18 g), soy chunks 50 g (26 g), whey scoop (24 g), curd bowl (10 g), dal cup (9 g).\nSpread it over 3–5 meals; the daily total matters most.`, links: [{ label: 'Add food', to: '/log' }] }
  }
  if (has(q, /calorie|kcal|how much.*eat|eat today|diet|meal|food|hungry/)) {
    if (!s.cal) return { text: 'Add your height, age, sex and activity in Settings and I’ll give you a daily calorie target for steady fat loss (about 0.4 kg a week).', links: [{ label: 'Set calorie target', to: '/settings?profile=1' }] }
    const left = s.calsEaten != null ? s.cal.target - s.calsEaten : null
    return { text: `Your target today is **${s.cal.target.toLocaleString()} kcal**${s.cal.maintenanceWeek ? ' (maintenance week)' : ''}${left != null ? `; you've logged ${s.calsEaten!.toLocaleString()}, so about **${left.toLocaleString()} left**` : ''}. Hit protein first (${s.protein}/${s.proteinTarget} g), fill up on vegetables and dal, and keep oil and sugary drinks in check. Hungry? Add volume: salad, curd, fruit, soups.`, links: [{ label: 'Log food', to: '/log' }] }
  }
  if (has(q, /creatine|supplement|whey|protein powder|pre.?workout|fat burner|bcaa/)) {
    return { text: '• **Creatine monohydrate**, 3–5 g daily, is the best-studied supplement for strength and is safe for healthy adults.\n• **Whey** is just convenient protein.\n• Skip fat burners and BCAAs: they don’t beat a calorie deficit and enough protein.\nFood, sleep and consistency matter far more.' }
  }
  if (has(q, /alcohol|beer|drink|cheat|party|junk|sweets|biryani/)) {
    return { text: 'One meal won’t ruin anything. It’s the weekly average that counts. Plan for it: eat lean and high-protein earlier in the day, keep portions sensible, and get back on plan at the next meal. Alcohol slows recovery and adds easy calories, so keep it occasional.' }
  }
  if (has(q, /water|hydrat|thirst/)) return { text: 'Aim for pale-yellow urine: roughly 2.5–3.5 L a day, more on hot days and training days. Sip during workouts.' }

  // ---- training questions ----
  if (has(q, /miss|skip|couldn'?t (go|train)|didn'?t (go|train)|no time|busy/)) {
    return { text: 'No problem: don’t double up. Just carry on with the next scheduled day. If you missed a main lift day, do it tomorrow and shift the week by one. Short on time? Do the main lifts and calisthenics and skip accessories. Something beats nothing.' }
  }
  if (has(q, /sore|doms|stiff/)) {
    return { text: 'Soreness 24–72 hours after training is normal, especially early on or after new exercises. Light movement, protein and sleep help. Train if it’s mild; if it’s severe, lighten that session. It lessens as you adapt.' }
  }
  if (has(q, /tired|exhaust|fatigue|sleep|recover|no energy|low energy/)) {
    const sleep = s.avgSleep ? `You’re averaging ${r1(s.avgSleep)} h of sleep${s.avgSleep < 7 ? ', below the 7–9 h target' : ''}. ` : ''
    return { text: `${sleep}If you feel drained for several days: drop optional cardio first, then 1–2 accessories, and keep the main lifts. Check protein and calories aren’t too low. For a tough stretch, **5-day mode** in Settings turns Thursday into recovery.`, links: [{ label: 'Settings', to: '/settings' }] }
  }
  if (has(q, /plateau|stall|stuck|not losing|not getting stronger|no progress/)) {
    return { text: 'Use 2–3 weeks of data before calling it a plateau.\n• **Weight stuck:** check your waist and photos first. If they’re flat too, cut about 150 kcal a day or add 2,000 steps (one change at a time).\n• **Strength stuck:** sleep, protein, and not training to failure too often. Keep weights where every rep is clean, and use the deload.' }
  }
  if (has(q, /cardio|running|run |walk|steps|hiit/)) {
    return { text: 'Your plan has 2–3 moderate cardio sessions (incline walk, bike or elliptical) where you can still talk, plus 7,000–10,000 steps a day. That burns extra calories without hurting recovery. Avoid hard HIIT every day; it eats into your lifting.' }
  }
  if (has(q, /warm.?up/)) return { text: 'Do 3–5 min easy cardio, then dynamic moves (arm circles, band pull-aparts, hip hinges, bodyweight squats), then 2–4 ramp-up sets before your first big lift. The logger shows the warm-up sets and plates under each barbell lift.' }
  if (has(q, /rest (time|between)|how long.*rest|rest period/)) return { text: 'Rest 2–3 min on heavy compound lifts, 90–150 s on other compounds, 60–90 s on isolation and core, longer for calisthenics skills. Ticking a set starts the timer automatically.' }
  if (has(q, /rir|reps in reserve|failure|how heavy|how many reps/)) return { text: 'Stop most sets with **2–3 reps in reserve**: you could do 2–3 more clean reps. Isolation moves can get to 1–2. Hit the top of the rep range on every set, then add the smallest weight increase. The coach line in each workout tells you when.' }
  if (has(q, /push.?up/)) {
    const t = c.state.tests.pushups
    return { text: `${t.length ? `Your best test: **${t.at(-1)!.value} push-ups** (${t.length > 1 ? `${signed(t.at(-1)!.value - t[0].value)} since start` : 'first test'}). ` : ''}Build to 3 × 15–20 clean reps, then make them harder: decline, diamond, slower tempo, pike push-ups. Re-test every 4 weeks in Skills.`, links: [{ label: 'Skills', to: '/skills' }] }
  }
  if (has(q, /pull.?up|chin.?up/)) {
    const h = history(c.state, 'assisted-pull-up').at(-1)
    const loads = h?.sets.map((x) => x.load).filter((x): x is number => x != null) ?? []
    return { text: `${loads.length ? `Your latest assistance: **${fmtNum(Math.min(...loads))} kg**. ` : ''}Path to the first pull-up: dead hangs → scapular pull-ups → assisted reps (reduce assistance by 2.5 kg whenever you get 8 clean reps) → slow negatives → first clean rep. Then build 1–2-rep sets, not failure.`, links: [{ label: 'Skills', to: '/skills' }] }
  }

  // ---- progress / motivation ----
  if (has(q, /progress|how am i doing|results|improv|summary|report|motivat/)) {
    const pbs = personalBests(c)
    return {
      text: [
        `Week ${c.week} of ${c.program.weeks} · ${s.sessionsDone} workouts done.`,
        s.totalChange != null ? `• Weight: ${signed(s.totalChange)} kg since start (7-day average ${r1(s.avgNow!)} kg).` : '• Weight: log a few morning weigh-ins to see your trend.',
        s.waistNow && s.waistStart ? `• Waist: ${signed(s.waistNow - s.waistStart)} cm.` : '',
        s.ratio ? `• V-taper ratio: ${s.ratio.toFixed(2)} (goal ${V_TARGET}).` : '',
        s.bf ? `• Body fat estimate: ${r1(s.bf)}%.` : '',
        pbs.length ? `• New personal bests in the last 2 weeks: ${pbs.join(', ')}.` : '',
        'Consistency beats intensity. Keep showing up.',
      ].filter(Boolean).join('\n'),
      links: [{ label: 'Progress', to: '/progress' }],
    }
  }

  // ---- app help ----
  if (has(q, /backup|export|restore|lose my data|new phone/)) return { text: 'Settings → **Back up now** saves a file (Drive, WhatsApp or Downloads). On a new phone, Settings → Restore from a backup. Progress photos stay on the phone.', links: [{ label: 'Settings', to: '/settings?backup=1' }] }
  if (has(q, /photo|picture/)) return { text: 'Progress → Photos: front, side and back every 4 weeks, in the same light and pose. Compare shows your first and latest side by side. Photos never leave your phone.', links: [{ label: 'Photos', to: '/progress?tab=photos' }] }
  if (has(q, /^ ?(hi|hello|hey|hii|vanakkam|namaste|good (morning|evening))\b/)) return { text: `Hi! I'm your coach. Ask me about today's workout, any exercise's form, food and protein, fat loss, abs, your progress, or what to do when you're sore or busy.` }
  if (has(q, /thank|thanks|great|awesome|nice/)) return { text: 'Anytime. Keep stacking good weeks.' }

  return {
    text: 'I can help with: today’s workout, how to do any exercise, what muscles it works, swaps, protein and calories, belly fat and abs, V-taper, soreness or pain, missed workouts, plateaus, cardio, and your progress. Try one of the suggestions below.',
  }
}

export const SUGGESTIONS = [
  'What’s my workout today?',
  'How am I doing?',
  'How much protein do I need today?',
  'How do I lose belly fat?',
  'When will my abs show?',
  'I missed a workout',
  'My shoulder hurts',
  'How do I get my first pull-up?',
]
