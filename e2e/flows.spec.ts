import { expect, test } from '@playwright/test'
import { history, iso, noErrors, open, shift, START, stored, WED_WEEK6 } from './helpers'

const TODAY = iso(WED_WEEK6)

test.describe('first launch', () => {
  test('onboarding saves start date and baseline, then lands on Today', async ({ page }) => {
    const errors = await open(page, null)
    await expect(page.getByRole('heading', { name: /Stronger/ })).toBeVisible()
    await page.getByRole('button', { name: 'Get started' }).click()
    await page.getByRole('radio', { name: /Today/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Weight').fill('77.2')
    await page.getByLabel('Waist at navel').fill('89')
    await page.getByLabel('Max clean push-ups').fill('8')
    await page.getByLabel('Longest dead hang').fill('20')
    await page.getByLabel('Pull-up assist for 5 clean reps').fill('45')
    await page.getByRole('button', { name: 'Start my 12 weeks' }).click()

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
    await expect(page.getByText('Week 1', { exact: true })).toBeVisible()
    const s = await stored(page)
    expect(s.settings.startDate).toBe(TODAY)
    expect(s.baseline).toMatchObject({ weight: 77.2, waist: 89, pushups: 8, deadHang: 20, pullAssist: 45 })
    expect(s.checkins[TODAY]).toMatchObject({ weight: 77.2, waist: 89 })
    expect(s.tests.pushups[0].value).toBe(8)
    await noErrors(errors)
  })

  test('back button on the baseline step keeps the chosen date', async ({ page }) => {
    await open(page, null)
    await page.getByRole('button', { name: 'Get started' }).click()
    await page.getByRole('radio', { name: /Next week/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByRole('radio', { name: /Next week/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('a future start date shows a countdown', async ({ page }) => {
    await open(page, { settings: { startDate: shift(TODAY, 5) } })
    await expect(page.getByText('Starts in 5 d')).toBeVisible()
  })

  test('after week 12 the plan shows as complete', async ({ page }) => {
    await open(page, { settings: { startDate: shift(TODAY, -90) } })
    await expect(page.getByText('Plan complete')).toBeVisible()
  })
})

test.describe('workout logging', () => {
  test('coach pre-fills from last time, rest timer runs, sets save and the workout finishes', async ({ page }) => {
    const errors = await open(page, history())
    await page.locator('a.hero').click()
    await expect(page).toHaveURL(/#\/day\/wed/)
    await page.getByRole('button', { name: 'Start Workout' }).click()
    await expect(page).toHaveURL(/#\/workout\/wed/)

    // Last week: 30 kg assist × 8,8,8,8 → coach drops to 27.5 kg.
    const pull = page.getByRole('region', { name: 'Assisted Pull-up', exact: true })
    await expect(pull.getByText(/Drop to 27.5 kg assist/)).toBeVisible()
    await expect(pull.getByLabel('Set 1 assist kg')).toHaveValue('27.5')
    await expect(pull.getByText('30×8').first()).toBeVisible()

    await pull.getByLabel('Set 1 reps').fill('7')
    await pull.getByRole('button', { name: 'Set 1 done' }).click()
    const timer = page.getByRole('timer')
    await expect(timer).toBeVisible()
    await expect(timer).toContainText(/2:2\d|2:30/)
    await page.getByRole('button', { name: '+15' }).click()
    await expect(timer).toContainText(/2:[34]\d/)
    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(timer).toBeHidden()

    for (const n of [2, 3, 4]) await pull.getByRole('button', { name: `Set ${n} done` }).click()
    await page.getByRole('button', { name: 'Skip' }).click()
    // A finished exercise collapses to a green summary; tapping it reopens.
    const summary = page.getByRole('button', { name: /Assisted Pull-up.*27\.5×7, 27\.5×5/ })
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(page.getByLabel('Set 1 reps').first()).toBeVisible()

    let s = await stored(page)
    expect(s.sessions[TODAY].log['assisted-pull-up']).toEqual([
      // After a weight change the coach restarts at the bottom of the range (5 reps) — double progression.
      { load: 27.5, reps: 7, done: true }, { load: 27.5, reps: 5, done: true }, { load: 27.5, reps: 5, done: true }, { load: 27.5, reps: 5, done: true },
    ])

    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page.getByRole('dialog')).toContainText('sets left')
    await page.getByRole('button', { name: 'Save Workout' }).click()
    await expect(page).toHaveURL(/#\/$/)
    await expect(page.locator('a.hero')).toContainText('Review')
    s = await stored(page)
    expect(s.sessions[TODAY].finishedAt).toBeGreaterThan(0)

    await page.reload()
    await expect(page.locator('a.hero')).toContainText('Done')
    await noErrors(errors)
  })

  test('rest timer alerts when rest is over (vibration + Go!)', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { vibrations: unknown[] }).vibrations = []
      navigator.vibrate = (p: VibratePattern) => { (window as unknown as { vibrations: unknown[] }).vibrations.push(p); return true }
    })
    const seed = history()
    seed.settings = { vibrate: true, sound: false }
    await open(page, seed, { path: '/workout/wed' })
    await page.getByRole('region', { name: 'Dumbbell Curl', exact: true }).getByRole('button', { name: 'Set 1 done' }).click()
    await expect(page.getByRole('timer')).toContainText('1:15')
    await page.clock.fastForward(80_000)
    await expect(page.getByRole('timer')).toContainText('Go!')
    const v = await page.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations)
    expect(v).toContainEqual([250, 120, 250, 120, 400])
    await page.getByRole('timer').getByRole('button', { name: 'Done' }).click()
    await expect(page.getByRole('timer')).toBeHidden()
  })

  test('add and remove sets, decimal entry, and no negative numbers', async ({ page }) => {
    await open(page, history(), { path: '/workout/wed' })
    const curl = page.getByRole('region', { name: 'Dumbbell Curl', exact: true })
    await curl.getByRole('button', { name: '+ Add set' }).click()
    await expect(curl.getByLabel('Set 4 kg')).toBeVisible()
    await curl.getByLabel('Set 4 kg').fill('12.5')
    await expect(curl.getByLabel('Set 4 kg')).toHaveValue('12.5')
    await curl.getByLabel('Set 1 kg').fill('-5')
    expect((await stored(page)).sessions[TODAY].log['dumbbell-curl'][0].load).not.toBe(-5)
    await curl.getByRole('button', { name: 'Remove set' }).click()
    await expect(curl.getByLabel('Set 4 kg')).toHaveCount(0)
  })

  test('opening another day’s workout never overwrites sets already logged today', async ({ page }) => {
    const seed = history()
    seed.sessions![TODAY] = { date: TODAY, dayId: 'mon', startedAt: Date.now(), log: { 'bench-press': [{ load: 55, reps: 8, done: true }] } }
    await open(page, seed, { path: '/workout/wed' })
    await expect(page).toHaveURL(/#\/workout\/mon/)
    expect((await stored(page)).sessions[TODAY].log['bench-press'][0].load).toBe(55)
  })

  test('starting a different day asks first, and Cancel keeps today’s log', async ({ page }) => {
    const seed = history()
    seed.sessions![TODAY] = { date: TODAY, dayId: 'mon', startedAt: Date.now(), log: { 'bench-press': [{ load: 55, reps: 8, done: true }] } }
    await open(page, seed, { path: '/day/wed' })
    page.once('dialog', (d) => d.dismiss())
    await page.getByRole('button', { name: /Start Workout|today/ }).click()
    expect((await stored(page)).sessions[TODAY].dayId).toBe('mon')
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: /Start Workout|today/ }).click()
    await expect(page).toHaveURL(/#\/workout\/wed/)
    expect((await stored(page)).sessions[TODAY].dayId).toBe('wed')
  })

  test('Today shows the workout actually done today, not the scheduled one', async ({ page }) => {
    const seed = history()
    seed.sessions![TODAY] = { date: TODAY, dayId: 'mon', startedAt: Date.now() - 3_000_000, finishedAt: Date.now(), log: {} }
    await open(page, seed)
    await expect(page.locator('a.hero')).toContainText('Upper A')
    await expect(page.locator('a.hero')).toContainText('Review')
  })

  test('discard deletes the session after confirmation', async ({ page }) => {
    await open(page, history(), { path: '/workout/wed' })
    await page.getByRole('button', { name: 'Set 1 done' }).first().click()
    await page.getByRole('button', { name: 'Finish' }).click()
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Discard' }).click()
    await expect(page).toHaveURL(/#\/$/)
    expect((await stored(page)).sessions[TODAY]).toBeUndefined()
  })

  test('swap busy equipment, and the swap carries over to next week', async ({ page }) => {
    const tuesday = new Date('2026-10-13T18:00:00')
    await open(page, history(), { at: tuesday, path: '/workout/tue' })
    const squat = page.getByRole('region', { name: 'Squat', exact: true })
    await squat.getByRole('button', { name: 'Swap' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Hack Squat')
    await expect(dialog).not.toContainText('Leg Press · planned')
    await dialog.getByRole('button', { name: /Hack Squat/ }).click()
    await expect(page.getByText('Swapped for Squat')).toBeVisible()
    const hack = page.getByRole('region', { name: 'Hack Squat', exact: true })
    await hack.getByLabel('Set 1 kg').fill('60')
    await hack.getByRole('button', { name: 'Set 1 done' }).click()
    const s = await stored(page)
    expect(s.sessions['2026-10-13'].swaps).toEqual({ squat: 'hack-squat' })
    expect(s.sessions['2026-10-13'].log['hack-squat'][0]).toMatchObject({ load: 60, done: true })
    // Swap button hides once a set is done, so history can't be split by accident.
    await expect(hack.getByRole('button', { name: 'Swap' })).toHaveCount(0)
  })

  test('barbell warm-up sets and plates are shown under the first lift', async ({ page }) => {
    await open(page, history(), { at: new Date('2026-10-12T18:00:00'), path: '/workout/mon' })
    const bench = page.getByRole('region', { name: 'Bench Press', exact: true })
    // Last week 55 kg × 10,9,8 → stays 55 kg.
    await expect(bench.getByLabel('Set 1 kg')).toHaveValue('55')
    await bench.getByRole('button', { name: /Warm-up sets/ }).click()
    await expect(bench.getByText('20 kg × 10')).toBeVisible()
    await expect(bench.getByText('Working sets: 15 + 2.5 each side')).toBeVisible()
  })

  test('deload week cuts the sets', async ({ page }) => {
    await open(page, history(), { at: new Date('2026-10-21T10:00:00'), path: '/day/wed' })
    await expect(page.getByText(/Deload week: sets are cut/)).toBeVisible()
    await expect(page.getByRole('link', { name: /Assisted Pull-up 2 × 5–8/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Bench|Dead Hang 2 × 20–40 sec/ }).first()).toBeVisible()
  })
})

test.describe('plan modes and review', () => {
  test('5-day mode turns Thursday into recovery and spreads its work', async ({ page }) => {
    await open(page, history(), { path: '/settings' })
    await page.getByRole('switch', { name: '5-day mode' }).click()
    await page.goto('/#/plan')
    await expect(page.getByText('Recovery Day')).toBeVisible()
    await page.goto('/#/day/mon')
    await expect(page.getByText('Pike Push-up')).toBeVisible()
    await page.goto('/#/day/thu')
    await expect(page.getByRole('heading', { name: 'Recovery Day' })).toBeVisible()
  })

  test('Sunday shows the week-in-review, other days do not', async ({ page }) => {
    await open(page, history(), { at: new Date('2026-10-11T10:00:00') })
    const review = page.getByRole('region', { name: /in review/ })
    await expect(review).toBeVisible()
    await expect(review).toContainText('3/6')
    await expect(review).toContainText('New bests')
    await page.clock.setFixedTime(WED_WEEK6)
    await page.reload()
    await expect(page.getByRole('region', { name: /in review/ })).toHaveCount(0)
  })

  test('coach tips are tappable and show at most two at first', async ({ page }) => {
    const seed = history()
    for (let i = 0; i < 4; i++) seed.checkins![shift(TODAY, -i)] = { recovery: 1, protein: 60 }
    await open(page, seed)
    const tips = page.locator('a.callout')
    await expect(tips).toHaveCount(2)
    await page.getByRole('button', { name: /Show \d more/ }).click()
    expect(await tips.count()).toBeGreaterThan(2)
    await page.getByRole('link', { name: /Recovery is low/ }).click()
    await expect(page).toHaveURL(/#\/log/)
  })
})

test.describe('check-in', () => {
  test('saves while typing, keeps decimals, and survives a reload', async ({ page }) => {
    await open(page, history(), { path: '/log' })
    const w = page.getByLabel('Morning weight')
    await w.fill('')
    await w.pressSequentially('75.')
    await expect(w).toHaveValue('75.')
    await w.pressSequentially('3')
    expect((await stored(page)).checkins[TODAY].weight).toBe(75.3)
    await page.getByLabel('Steps').fill('9,250')
    await page.getByRole('button', { name: /3 eggs/ }).click()
    await page.getByRole('button', { name: /Whey/ }).click()
    await page.getByLabel('Custom protein grams').fill('15')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await page.getByRole('button', { name: '5, Great' }).click()
    await page.reload()
    const c = (await stored(page)).checkins[TODAY]
    expect(c).toMatchObject({ weight: 75.3, steps: 9250, recovery: 5 })
    expect(c.protein).toBe(18 + 24 + 15)
    await expect(page.getByLabel('Morning weight')).toHaveValue('75.3')
  })

  test('previous days are editable and next is disabled on today', async ({ page }) => {
    await open(page, history(), { path: '/log' })
    await expect(page.getByRole('button', { name: 'Next day' })).toBeDisabled()
    await page.getByRole('button', { name: 'Previous day' }).click()
    await page.getByLabel('Sleep').fill('6.5')
    expect((await stored(page)).checkins[shift(TODAY, -1)].sleep).toBe(6.5)
  })

  test('clearing a field removes the value', async ({ page }) => {
    await open(page, history(), { path: '/log' })
    await page.getByLabel('Sleep').fill('7')
    expect((await stored(page)).checkins[TODAY].sleep).toBe(7)
    await page.getByLabel('Sleep').fill('')
    expect((await stored(page)).checkins[TODAY].sleep).toBeUndefined()
  })
})

test.describe('progress, skills and photos', () => {
  test('weight, waist, strength and tests tabs show the history', async ({ page }) => {
    const errors = await open(page, history(), { path: '/progress' })
    await expect(page.getByRole('img', { name: /weight weekly averages/ })).toBeVisible()
    await expect(page.getByText(/started at 76.7 kg/)).toBeVisible()
    await page.getByRole('tab', { name: 'Waist' }).click()
    await expect(page.getByText(/started at 88 cm/)).toBeVisible()
    await page.getByRole('tab', { name: 'Strength' }).click()
    await expect(page.getByRole('link', { name: /Bench Press.*55 kg × 10/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Assisted Pull-up.*30 kg assist/ })).toContainText('−10 kg since first')
    await page.getByRole('tab', { name: 'Tests' }).click()
    await expect(page.getByRole('link', { name: /Max push-ups/ })).toContainText('9 reps')
    await noErrors(errors)
  })

  test('empty states guide a brand-new user', async ({ page }) => {
    await open(page, { checkins: {} }, { path: '/progress' })
    await expect(page.getByText('No weigh-ins yet')).toBeVisible()
    await page.getByRole('tab', { name: 'Strength' }).click()
    await expect(page.getByText('No lifts logged yet')).toBeVisible()
    await page.goto('/#/exercise/bench-press?tab=history')
    await expect(page.getByText('No sets logged yet.')).toBeVisible()
  })

  test('skill test is logged from a sheet and levels update', async ({ page }) => {
    await open(page, history(), { path: '/skills' })
    await expect(page.getByText('25%')).toBeVisible() // 40 → 30 kg assist
    await page.getByRole('button', { name: /^Push/ }).click()
    await page.getByRole('dialog').locator('input').fill('21')
    await page.getByRole('button', { name: 'Save Result' }).click()
    await expect(page.getByRole('button', { name: /^Push/ })).toContainText('Level 3 of 4')
    expect((await stored(page)).tests.pushups.at(-1)).toEqual({ date: TODAY, value: 21 })
  })

  test('progress photos: add, compare across months, delete', async ({ page }) => {
    await open(page, history(), { path: '/progress?tab=photos' })
    const add = async (pose: string) => {
      const chooser = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: new RegExp(`(Add|Retake) ${pose} photo`) }).click()
      await (await chooser).setFiles('public/exercises/push-up-0.jpg')
    }
    await add('front')
    await expect(page.getByRole('img', { name: 'Front today' })).toBeVisible()
    expect((await stored(page)).photoDates).toEqual([TODAY])

    await page.clock.setFixedTime(new Date('2026-11-11T10:00:00'))
    await page.reload()
    await add('front')
    await expect(page.getByRole('heading', { name: 'Compare' })).toBeVisible()
    await expect(page.getByText('Start').first()).toBeVisible()

    await page.getByRole('button', { name: /Front photo from/ }).first().click()
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('heading', { name: 'Compare' })).toHaveCount(0)
    expect((await stored(page)).photoDates).toHaveLength(1)
  })
})

test.describe('settings and data', () => {
  test('targets, toggles and start date update the app', async ({ page }) => {
    await open(page, history(), { path: '/settings' })
    await page.getByRole('button', { name: 'More protein' }).click()
    await page.getByRole('button', { name: 'Less steps' }).click()
    await page.getByRole('switch', { name: 'Sound' }).click()
    const s = await stored(page)
    expect(s.settings).toMatchObject({ proteinTarget: 135, stepTarget: 7500, sound: true })
    await page.getByLabel('Start date').fill(shift(START, 7))
    await page.goto('/#/')
    await expect(page.getByText('Week 5')).toBeVisible()
  })

  test('backup export → erase → import restores everything', async ({ page }) => {
    await open(page, history(), { path: '/settings' })
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export backup' }).click()
    const file = await (await download).path()
    expect((await download).suggestedFilename()).toBe(`gymcals-backup-${TODAY}.json`)

    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Erase everything' }).click()
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible()
    expect((await stored(page)).settings.startDate).toBeNull()

    // Restore through the hidden file input on the Settings screen.
    await page.getByRole('button', { name: 'Get started' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Start my 12 weeks' }).click()
    await page.goto('/#/settings')
    await page.locator('input[type=file]').setInputFiles(file!)
    await expect(page.getByRole('status')).toHaveText('Backup restored.')
    const s = await stored(page)
    expect(s.settings.startDate).toBe(START)
    expect(Object.keys(s.sessions)).toHaveLength(15)
  })

  test('importing a wrong file shows a clear error and changes nothing', async ({ page }) => {
    await open(page, history(), { path: '/settings' })
    await page.locator('input[type=file]').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') })
    await expect(page.getByRole('status')).toHaveText('This file is not a GymCals backup.')
    await page.locator('input[type=file]').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('not json') })
    await expect(page.getByRole('status')).toHaveText('This file is not a GymCals backup.')
    expect((await stored(page)).settings.startDate).toBe(START)
  })
})
