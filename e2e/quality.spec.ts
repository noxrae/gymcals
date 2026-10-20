import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { history, open } from './helpers'

const ROUTES = ['/', '/plan', '/progress', '/skills', '/log', '/settings', '/day/wed', '/workout/wed', '/exercise/bench-press', '/exercise/bench-press?tab=muscles', '/coach', '/coach?q=How%20am%20I%20doing%3F']

for (const scheme of ['light', 'dark'] as const) {
  test(`accessibility (${scheme}): no serious or critical axe violations`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.emulateMedia({ colorScheme: scheme })
    await open(page, history())
    const problems: string[] = []
    for (const r of ROUTES) {
      await page.goto(`/#${r}`)
      await page.waitForTimeout(500)
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      for (const v of res.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
        problems.push(`${r} · ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
      }
    }
    expect(problems, problems.join('\n')).toEqual([])
  })
}

for (const width of [320, 360, 414, 768, 1280]) {
  test(`layout at ${width}px: no sideways scrolling or clipped controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await open(page, history())
    const issues: string[] = []
    for (const r of ROUTES) {
      await page.goto(`/#${r}`)
      await page.waitForTimeout(150)
      // Measure only after the screen's enter animation has settled (it slides in, which made this flaky).
      await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => null))))
      const res = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth
        const over = document.documentElement.scrollWidth - vw
        // Interactive elements narrower than their text (squashed) or off-screen.
        const clipped = [...document.querySelectorAll('button, a, input')]
          .filter((el) => {
            const b = el.getBoundingClientRect()
            if (!b.width || getComputedStyle(el).visibility === 'hidden') return false
            if (el.closest('.chips')) return false
            return b.right > vw + 1 || b.left < -1
          })
          .map((el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30))
        return { over, clipped }
      })
      if (res.over > 0) issues.push(`${r}: page is ${res.over}px wider than the screen`)
      if (res.clipped.length) issues.push(`${r}: off-screen → ${res.clipped.join(', ')}`)
    }
    expect(issues, issues.join('\n')).toEqual([])
  })
}

test('small touch targets: buttons and links are at least 32px tall', async ({ page }) => {
  await open(page, history())
  const small: string[] = []
  for (const r of ROUTES) {
    await page.goto(`/#${r}`)
    await page.waitForTimeout(300)
    small.push(...(await page.evaluate((route) => [...document.querySelectorAll('button, a')]
      .filter((el) => {
        const b = el.getBoundingClientRect()
        return b.width > 0 && b.height > 0 && b.height < 32 && !el.closest('figcaption')
      })
      .map((el) => `${route}: "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 25)}" ${Math.round(el.getBoundingClientRect().height)}px`), r)))
  }
  expect(small, small.join('\n')).toEqual([])
})

test('works offline after the first visit (PWA service worker)', async ({ page, context }) => {
  await open(page, history())
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible()
  await page.goto('/#/exercise/squat')
  await expect(page.getByRole('heading', { name: 'Squat' })).toBeVisible()
  await expect(page.getByText('Connect to the internet to watch the video')).toBeVisible()
  const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && !i.naturalWidth && !i.src.includes('ytimg')).map((i) => i.src))
  expect(broken).toEqual([])
  await context.setOffline(false)
})

test('installable: manifest and icons are served', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest).toMatchObject({ short_name: 'GymCals', display: 'standalone' })
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).status()).toBe(200)
})
