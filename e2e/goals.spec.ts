import { expect, test } from '@playwright/test'
import { history, iso, noErrors, open, stored, WED_WEEK6 } from './helpers'

const TODAY = iso(WED_WEEK6)

test('every day separates gym and calisthenics with clear labels', async ({ page }) => {
  const errors = await open(page, history(), { path: '/day/wed' })
  const headers = page.locator('h2.sec')
  await expect(headers.filter({ hasText: 'Calisthenics' }).first()).toContainText('Pull-up skill')
  await expect(headers.filter({ hasText: /^Gym/ }).first()).toContainText('Back strength')
  await expect(page.getByText('Calisthenics', { exact: true }).last()).toBeVisible()
  await page.goto('/#/day/sat')
  await expect(page.getByText('Shoulders · V-taper')).toBeVisible()
  await expect(page.getByRole('link', { name: /Lateral Raise.*3 × 12–15/ })).toBeVisible()
  await page.goto('/#/workout/wed')
  await expect(page.locator('h2.sec').filter({ hasText: 'Calisthenics' }).first()).toBeVisible()
  await noErrors(errors)
})

test('form demo: photo loop, hold, and animated figure — play/pause works', async ({ page }) => {
  const errors = await open(page, history(), { path: '/exercise/bench-press' })
  const demo = page.getByRole('figure', { name: 'Bench Press form demo' })
  await expect(demo.getByRole('img', { name: /start position/ })).toBeVisible()
  await expect(demo).toContainText(/Start position|Move with control|Squeeze|Return slowly/)
  await demo.getByRole('button', { name: 'Pause form demo' }).click()
  await expect(demo.getByRole('button', { name: 'Play form demo' })).toBeVisible()

  for (const key of ['pike-push-up', 'scapular-push-up', 'tuck-l-sit']) {
    await page.goto(`/#/exercise/${key}`)
    await expect(page.getByRole('figure', { name: /form demo/ }).getByRole('img', { name: 'Animated figure showing the movement' })).toBeVisible()
  }
  await page.goto('/#/exercise/plank')
  await expect(page.getByRole('figure', { name: /form demo/ })).toContainText(/Hold/)
  await page.goto('/#/exercise/incline-walk')
  await expect(page.getByRole('figure', { name: /form demo/ })).toBeVisible()
  await noErrors(errors)
})

test('calorie target: set profile, see target on Today and in check-in', async ({ page }) => {
  await open(page, history())
  await page.getByRole('link', { name: /Set your target/ }).click()
  await expect(page).toHaveURL(/settings\?profile=1/)
  await page.getByLabel('Height').fill('175')
  await page.getByLabel('Age').fill('25')
  await page.getByRole('button', { name: 'Male', exact: true }).click()
  await page.getByRole('button', { name: 'On my feet' }).click()
  await expect(page.getByText('Fat-loss target')).toBeVisible()
  const target = await page.locator('.row', { hasText: 'Fat-loss target' }).innerText()
  expect(target).toMatch(/2,[0-9]{3}/)
  await page.getByRole('button', { name: 'Lower the calorie target by 50' }).click()
  expect((await stored(page)).settings.calorieAdjust).toBe(-50)
  await page.goto('/#/')
  await expect(page.getByRole('link', { name: /Calories.*kcal/ })).toBeVisible()
  await page.goto('/#/log')
  await page.getByLabel(/Calories eaten/).fill('1850')
  expect((await stored(page)).checkins[TODAY].calories).toBe(1850)
})

test('V-taper ratio and body-fat estimate from monthly measurements', async ({ page }) => {
  const seed = history()
  seed.settings = { profile: { heightCm: 178, age: 25, sex: 'male', activity: 'medium' } }
  await open(page, seed, { path: '/log' })
  await page.getByLabel('Waist at navel').fill('85')
  await page.getByLabel('Shoulders (widest)').fill('119')
  await page.getByLabel('Neck').fill('38')
  await page.goto('/#/progress?tab=body')
  await page.getByRole('tab', { name: 'Body' }).click()
  await expect(page.getByText('1.40')).toBeVisible()
  await expect(page.getByText(/16\.4/)).toBeVisible()
  await expect(page.getByText(/points to the six-pack range/)).toBeVisible()
})

test('empty Body tab explains what to measure', async ({ page }) => {
  await open(page, history(), { path: '/progress' })
  await page.getByRole('tab', { name: 'Body' }).click()
  await expect(page.getByText(/Measure around your shoulders/)).toBeVisible()
  await expect(page.getByText(/Add your height in Settings/)).toBeVisible()
})

test('Plan explains why it works, including honest fat-loss and abs expectations', async ({ page }) => {
  await open(page, history(), { path: '/plan' })
  const belly = page.getByRole('button', { name: 'Belly fat and love handles' })
  await belly.click()
  await expect(belly).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText(/Fat can’t be spot-reduced/)).toBeVisible()
  await page.getByRole('button', { name: 'A visible six-pack' }).click()
  await expect(page.getByText(/around 10–12% for men/)).toBeVisible()
})
