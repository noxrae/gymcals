import { expect, test } from '@playwright/test'
import { EXERCISES } from '../src/data/exercises'
import { MUSCLES } from '../src/data/muscles'
import { history, noErrors, open } from './helpers'

const brokenImages = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const imgs = [...document.images].filter((i) => !i.src.includes('ytimg') && i.getAttribute('loading') !== 'lazy')
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r }))))
    return imgs.filter((i) => !i.naturalWidth).map((i) => i.src)
  })

test('every day page renders with its exercises', async ({ page }) => {
  const errors = await open(page, history())
  for (const day of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
    await page.goto(`/#/day/${day}`)
    await expect(page.locator('h1')).toBeVisible()
    expect(await brokenImages(page), day).toEqual([])
  }
  await noErrors(errors)
})

test('every exercise page: video, steps, muscles map and history', async ({ page }) => {
  test.setTimeout(180_000)
  const errors = await open(page, history())
  for (const ex of Object.values(EXERCISES)) {
    await page.goto(`/#/exercise/${ex.key}`)
    await expect(page.getByRole('heading', { name: ex.name })).toBeVisible()
    if (ex.video) {
      await expect(page.getByRole('button', { name: `Play ${ex.name} form video` })).toBeVisible()
      await expect(page.getByRole('link', { name: /Open in YouTube/ })).toHaveAttribute('href', `https://www.youtube.com/watch?v=${ex.video.id}`)
    }
    if (ex.kind === 'cardio') continue
    await expect(page.locator('ol li')).toHaveCount(ex.steps.length)
    await page.getByRole('tab', { name: 'Muscles' }).click()
    const rows = page.getByRole('button', { pressed: false }).filter({ hasText: /PRIMARY|SECONDARY/ })
    await expect(rows).toHaveCount(new Set([...ex.primary, ...ex.secondary]).size)
    for (const m of ex.primary) await expect(page.getByText(MUSCLES[m].latin, { exact: false }).first()).toBeVisible()
    expect(await brokenImages(page), ex.key).toEqual([])
    await page.getByRole('tab', { name: 'History' }).click()
  }
  await noErrors(errors)
})

test('tapping a muscle focuses it on the map and tapping again resets', async ({ page }) => {
  await open(page, history(), { path: '/exercise/assisted-pull-up?tab=muscles' })
  const lats = page.getByRole('button', { name: /Lats/ })
  await lats.click()
  await expect(lats).toHaveAttribute('aria-pressed', 'true')
  const dimmed = await page.locator('.body-figure img:not(.base)').evaluateAll((imgs) => imgs.filter((i) => getComputedStyle(i).opacity !== '1').length)
  expect(dimmed).toBeGreaterThan(0)
  await lats.click()
  await expect(lats).toHaveAttribute('aria-pressed', 'false')
})

test('playing a video swaps the poster for the YouTube player', async ({ page }) => {
  await open(page, history(), { path: '/exercise/bench-press' })
  await page.getByRole('button', { name: 'Play Bench Press form video' }).click()
  await expect(page.locator('iframe[src*="youtube-nocookie.com/embed/"]')).toBeVisible()
})

test('all tabs, settings and back navigation work', async ({ page }) => {
  const errors = await open(page, history())
  for (const [tab, heading] of [['Plan', 'Plan'], ['Progress', 'Progress'], ['Skills', 'Skills'], ['Log', 'Check-in'], ['Today', 'Today']]) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: tab }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: tab })).toHaveClass(/active/)
  }
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible()
  await page.goto('/#/does-not-exist')
  await expect(page).toHaveURL(/#\/$/)
  await page.goto('/#/exercise/not-real')
  await expect(page).toHaveURL(/#\/$/)
  await noErrors(errors)
})
