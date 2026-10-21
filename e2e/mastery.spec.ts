import { expect, test } from '@playwright/test'
import { history, noErrors, open, stored } from './helpers'

test('choose Mastery on Plan: its week shows, Extended is only for Athletic, history stays', async ({ page }) => {
  const errors = await open(page, history(), { path: '/plan' })
  await page.getByRole('group', { name: 'Weekly plan' }).getByRole('button', { name: 'Mastery' }).click()
  await expect(page.getByText('Switched to the Mastery plan')).toBeVisible()
  await expect(page.getByRole('switch', { name: /Extended/ })).toHaveCount(0)
  await expect(page.getByText('Leg Day · Quads, Glutes & Hamstrings')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'All 24 weeks' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Program length' }).getByRole('button')).toHaveText(['4 months', '6 months'])
  const s = await stored(page)
  expect(s.settings.plan).toBe('mastery')
  expect(Object.keys(s.sessions)).toHaveLength(15)
  await noErrors(errors)
})

test('Mastery Thursday has the hollow-hold timer; Wednesday has forearm work', async ({ page }) => {
  const errors = await open(page, { ...history(), settings: { plan: 'mastery' } }, { path: '/workout/thu' })
  await expect(page.getByRole('region', { name: 'Hollow Body Hold', exact: true }).getByRole('button', { name: 'Start timer · set 1' })).toBeVisible()
  await page.goto('/#/day/wed')
  await expect(page.getByText('Reverse EZ-bar Curl', { exact: true })).toBeVisible()
  await noErrors(errors)
})

test('Skills shows this month’s targets; passing one is saved and can be undone', async ({ page }) => {
  const errors = await open(page, history(), { path: '/skills' })
  // Week 6 → month 2.
  await expect(page.getByRole('heading', { name: 'Month 2 skills · 0 of 3 passed' })).toBeVisible()
  await page.getByRole('button', { name: '20 push-ups or 5 diamond push-ups: mark as passed' }).click()
  await expect(page.getByRole('heading', { name: 'Month 2 skills · 1 of 3 passed' })).toBeVisible()
  expect((await stored(page)).skillGoals).toEqual({ 'm2-pushups-20': '2026-10-14' })
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('heading', { name: 'Month 2 skills · 0 of 3 passed' })).toBeVisible()
  await page.getByRole('button', { name: 'See all months' }).click()
  await expect(page.getByRole('heading', { name: 'Month 3 · coming up' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Month 6 · coming up' })).toBeVisible()
  await noErrors(errors)
})

test('week 1 of Mastery brings the upper-back lifts back light; week 5 has the full plan', async ({ page }) => {
  // Start date 2026-10-12 → 14 Oct is week 1.
  const errors = await open(page, { ...history(), settings: { plan: 'mastery', startDate: '2026-10-12' } }, { at: new Date('2026-10-13T08:00:00'), path: '/day/tue' })
  await expect(page.getByText(/Weeks 1–2: empty bar or goblet squat/)).toBeVisible()
  await expect(page.getByText(/Weeks 1–2: thick pad/)).toBeVisible()
  await page.goto('/#/day/thu')
  await expect(page.getByText('Chest-to-wall Handstand', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Dead Bug', { exact: true })).toBeVisible()
  await noErrors(errors)
})

test('switch 45° hip extension to an alternative by name, and it is remembered', async ({ page }) => {
  const errors = await open(page, { ...history(), settings: { plan: 'mastery', startDate: '2026-09-07' } }, { at: new Date('2026-10-13T08:00:00'), path: '/day/tue' })
  await expect(page.getByText('or Cable Pull-through · Reverse Hyperextension — switch in the workout')).toBeVisible()
  await page.goto('/#/workout/tue')
  const pick = page.getByRole('group', { name: 'Choose 45° Hip Extension or an alternative' })
  await expect(pick.getByRole('button', { name: '45° Hip Extension' })).toHaveAttribute('aria-pressed', 'true')
  await pick.getByRole('button', { name: 'Cable Pull-through' }).click()
  await expect(page.getByRole('region', { name: 'Cable Pull-through', exact: true })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Choose 45° Hip Extension or an alternative' }).getByRole('button', { name: 'Cable Pull-through' })).toHaveAttribute('aria-pressed', 'true')
  expect((await stored(page)).sessions['2026-10-13'].swaps).toEqual({ 'back-extension': 'cable-pull-through' })
  await page.getByRole('group', { name: 'Choose 45° Hip Extension or an alternative' }).getByRole('button', { name: '45° Hip Extension' }).click()
  expect((await stored(page)).sessions['2026-10-13'].swaps ?? {}).toEqual({})
  await noErrors(errors)
})

test('the workout screen shows each exercise’s note, including the week-1 instructions', async ({ page }) => {
  const errors = await open(page, { ...history(), settings: { plan: 'mastery', startDate: '2026-10-12' } }, { at: new Date('2026-10-13T08:00:00'), path: '/workout/tue' })
  await expect(page.getByRole('region', { name: 'Squat', exact: true }).getByText(/^Weeks 1–2: empty bar or goblet squat/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Barbell Hip Thrust', exact: true }).getByText(/^Weeks 1–2: thick pad/)).toBeVisible()
  await noErrors(errors)
})

test('after switching plans, done days say which plan they used and show the new plan', async ({ page }) => {
  const done = (date: string, dayId: string) => ({ date, dayId, startedAt: 0, finishedAt: 3_600_000, plan: 'athletic-extended', log: { 'bench-press': [{ load: 40, reps: 8, done: true }] } })
  const errors = await open(page, { settings: { startDate: '2026-10-12', plan: 'athletic', extended: true }, sessions: { '2026-10-19': done('2026-10-19', 'mon'), '2026-10-21': done('2026-10-21', 'wed') } }, { at: new Date('2026-10-21T18:00:00'), path: '/plan' })
  await page.getByRole('group', { name: 'Weekly plan' }).getByRole('button', { name: 'Mastery' }).click()
  await expect(page.getByText('Done with Athletic · Extended')).toHaveCount(2)
  await page.goto('/#/day/mon')
  await expect(page.getByText(/Below is your Mastery version for next time/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Upper A · Chest & Back Width' })).toBeVisible()
  await page.goto('/#/day/wed')
  await expect(page.getByRole('link', { name: 'Review today’s workout' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pull + Pull-up Skill' })).toBeVisible()
  await page.goto('/#/')
  await expect(page.getByText('Done with Athletic · Extended')).toBeVisible()
  await noErrors(errors)
})

test('forearm exercises highlight the forearms on the muscle map', async ({ page }) => {
  const errors = await open(page, history(), { path: '/exercise/wrist-curl?tab=muscles' })
  await expect(page.getByRole('img', { name: 'front view: Forearms' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'back view: Forearms' })).toBeVisible()
  expect(await page.locator('img[src$="p-forearms-front.svg"]').count()).toBe(1)
  await noErrors(errors)
})
