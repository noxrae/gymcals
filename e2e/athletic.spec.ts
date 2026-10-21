import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { history, noErrors, open, stored } from './helpers'

test.describe('Athletic plan', () => {
  test('switch on Plan, turn on Extended, undo, and history stays', async ({ page }) => {
    const errors = await open(page, history(), { path: '/plan' })
    await expect(page.getByText('Upper A + Push')).toBeVisible()
    await page.getByRole('group', { name: 'Weekly plan' }).getByRole('button', { name: 'Athletic' }).click()
    await expect(page.getByText('Switched to the Athletic plan')).toBeVisible()
    await expect(page.getByText('Upper A · Chest & Back Width')).toBeVisible()
    await expect(page.getByText('Heavy Leg Day')).toBeVisible()

    await page.getByRole('switch', { name: /Extended/ }).click()
    await expect(page.getByRole('switch', { name: /Extended/ })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('Complete Leg Day')).toBeVisible()
    let s = await stored(page)
    expect(s.settings).toMatchObject({ plan: 'athletic', extended: true })
    expect(Object.keys(s.sessions)).toHaveLength(15)

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('Heavy Leg Day')).toBeVisible()
    s = await stored(page)
    expect(s.settings).toMatchObject({ plan: 'athletic', extended: false })
    await noErrors(errors)
  })

  test('the day screens show the new exercises with Gym / Calisthenics labels', async ({ page }) => {
    const errors = await open(page, { ...history(), settings: { plan: 'athletic' } }, { path: '/day/wed' })
    await expect(page.getByRole('heading', { name: /Back & Biceps \+ Pull-up Skills/ })).toBeVisible()
    for (const n of ['Straight-arm Pulldown', 'Reverse Pec-Deck', 'Incline Dumbbell Curl']) await expect(page.getByText(n, { exact: true })).toBeVisible()
    await page.getByText('Reverse Pec-Deck', { exact: true }).click()
    await expect(page.getByText('Pec-deck machine (rear-delt setting)')).toBeVisible()
    await noErrors(errors)
  })

  test('a workout started on the old plan keeps its exercises after switching', async ({ page }) => {
    const seed = history()
    seed.sessions!['2026-10-14'] = { date: '2026-10-14', dayId: 'wed', startedAt: Date.parse('2026-10-14T09:30:00'), log: { 'dead-hang': [{ reps: 30, done: true }] } }
    const errors = await open(page, seed, { path: '/plan' })
    await page.getByRole('group', { name: 'Weekly plan' }).getByRole('button', { name: 'Athletic' }).click()
    await page.goto('/#/workout/wed')
    await expect(page.getByText('Negative Pull-up', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Straight-arm Pulldown', { exact: true })).toHaveCount(0)
    await noErrors(errors)
  })

  test('an empty workout follows the switch; new workouts remember their plan', async ({ page }) => {
    const errors = await open(page, history(), { path: '/day/wed' })
    await page.getByRole('button', { name: /Start/ }).first().click()
    await expect(page).toHaveURL(/#\/workout\/wed/)
    expect((await stored(page)).sessions['2026-10-14'].plan).toBe('original')
    await page.goto('/#/plan')
    await page.getByRole('group', { name: 'Weekly plan' }).getByRole('button', { name: 'Athletic' }).click()
    expect((await stored(page)).sessions['2026-10-14'].plan).toBe('athletic')
    await page.goto('/#/workout/wed')
    await expect(page.getByText('Straight-arm Pulldown', { exact: true }).first()).toBeVisible()
    await noErrors(errors)
  })

  test('5-day mode turns Saturday into recovery on the Athletic plan', async ({ page }) => {
    const errors = await open(page, { ...history(), settings: { plan: 'athletic', fiveDay: true } }, { path: '/day/sat' })
    await expect(page.getByText('Saturday · 5-day mode')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recovery Day' })).toBeVisible()
    await noErrors(errors)
  })

  test('onboarding can start the Athletic · Extended plan', async ({ page }) => {
    const errors = await open(page, null)
    await page.getByRole('button', { name: 'Get started' }).click()
    await page.getByRole('group', { name: 'Weekly plan' }).getByRole('button', { name: 'Athletic' }).click()
    await page.getByRole('switch', { name: /Extended/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Weight').fill('76.7')
    await page.getByRole('button', { name: 'Start my 6 months' }).click()
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
    expect((await stored(page)).settings).toMatchObject({ plan: 'athletic', extended: true })
    await noErrors(errors)
  })

  test('the coach knows which plan you are on', async ({ page }) => {
    const errors = await open(page, { ...history(), settings: { plan: 'athletic', extended: true } }, { path: '/coach?q=' + encodeURIComponent('which plan am I on') })
    await expect(page.getByText(/Athletic \(Extended\)/)).toBeVisible()
    await noErrors(errors)
  })
})

for (const scheme of ['light', 'dark'] as const) {
  test(`Athletic screens are accessible and fit a 320px phone (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.setViewportSize({ width: 320, height: 700 })
    await open(page, { ...history(), settings: { plan: 'athletic', extended: true } })
    const problems: string[] = []
    for (const r of ['/plan', '/day/wed', '/day/fri', '/workout/tue', '/exercise/reverse-pec-deck', '/exercise/preacher-curl?tab=muscles']) {
      await page.goto(`/#${r}`)
      await page.waitForTimeout(500)
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      for (const v of res.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) problems.push(`${r} · ${v.id}`)
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) problems.push(`${r} · sideways scroll`)
    }
    expect(problems, problems.join('\n')).toEqual([])
  })
}

test('a past workout still shows exercises the plan has since dropped (RDL → hip thrust)', async ({ page }) => {
  const seed = history()
  seed.sessions!['2026-10-13'] = { date: '2026-10-13', dayId: 'tue', startedAt: 0, finishedAt: 3_600_000, log: { squat: [{ load: 60, reps: 8, done: true }], 'romanian-deadlift': [10, 10, 9].map((r) => ({ load: 40, reps: r, done: true })) } }
  const errors = await open(page, seed, { at: new Date('2026-10-13T18:00:00'), path: '/workout/tue' })
  await expect(page.getByRole('region', { name: 'Barbell Hip Thrust', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Also logged' })).toBeVisible()
  await expect(page.getByText('40×10, 40×10, 40×9')).toBeVisible()
  await noErrors(errors)
})

test('Athletic Tuesday shows its own warm-up; Extended Saturday has a mobility timer', async ({ page }) => {
  const errors = await open(page, { ...history(), settings: { plan: 'athletic' } }, { at: new Date('2026-10-13T09:00:00'), path: '/workout/tue' })
  await page.getByRole('button', { name: /Warm-up · / }).click()
  for (const t of ['5 min light cardio on a bike or incline treadmill', 'Dynamic leg swings, front-to-back and side-to-side']) await expect(page.getByText(t)).toBeVisible()
  await expect(page.getByText('0/4')).toBeVisible()
  await expect(page.getByRole('region', { name: '45° Hip Extension', exact: true })).toBeVisible()
  await page.goto('/#/plan')
  await page.getByRole('switch', { name: /Extended/ }).click()
  await page.goto('/#/day/sat')
  await expect(page.getByText('Mobility Routine', { exact: true })).toBeVisible()
  await noErrors(errors)
})

test('Athletic Tuesday: switch 45° hip extension to cable pull-through by name', async ({ page }) => {
  const errors = await open(page, { ...history(), settings: { plan: 'athletic' } }, { at: new Date('2026-10-13T08:00:00'), path: '/workout/tue' })
  const pick = page.getByRole('group', { name: 'Choose 45° Hip Extension or an alternative' })
  await pick.getByRole('button', { name: 'Reverse Hyperextension' }).click()
  await expect(page.getByRole('region', { name: 'Reverse Hyperextension', exact: true })).toBeVisible()
  expect((await stored(page)).sessions['2026-10-13'].swaps).toEqual({ 'back-extension': 'reverse-hyper' })
  await noErrors(errors)
})
