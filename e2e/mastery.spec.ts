import { expect, test } from '@playwright/test'
import { history, noErrors, open, stored } from './helpers'

test('choose Mastery on Plan: its week shows, Extended is only for Athletic, history stays', async ({ page }) => {
  const errors = await open(page, history(), { path: '/plan' })
  await page.getByRole('group', { name: 'Weekly plan' }).getByRole('button', { name: 'Mastery' }).click()
  await expect(page.getByText('Switched to the Mastery plan')).toBeVisible()
  await expect(page.getByRole('switch', { name: /Extended/ })).toHaveCount(0)
  await expect(page.getByText('Legs · Squat, Glutes & Hamstrings')).toBeVisible()
  await expect(page.getByText(/lighter week 6/)).toBeVisible()
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
  await expect(page.getByRole('heading', { name: /Month 4/ })).toHaveCount(0)
  await noErrors(errors)
})
