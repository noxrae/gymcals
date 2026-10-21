import { expect, test } from '@playwright/test'
import { history, noErrors, open, stored } from './helpers'

test.describe('4- and 6-month programs', () => {
  test('onboarding can start the 6-month program', async ({ page }) => {
    const errors = await open(page, null)
    await page.getByRole('button', { name: 'Get started' }).click()
    await page.getByRole('button', { name: '6 months' }).click()
    await expect(page.getByRole('button', { name: '6 months' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Weight').fill('76.7')
    await page.getByRole('button', { name: 'Start my 6 months' }).click()
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
    expect((await stored(page)).settings.program).toBe(24)
    await noErrors(errors)
  })

  test('switching program on Plan keeps history and shows the longer calendar', async ({ page }) => {
    const errors = await open(page, history(), { path: '/plan' })
    await expect(page.getByRole('img', { name: 'Week 6 of 24' })).toBeVisible()
    await page.getByRole('group', { name: 'Program length' }).getByRole('button', { name: '4 months' }).click()
    await expect(page.getByRole('img', { name: 'Week 6 of 16' })).toBeVisible()
    await page.getByRole('tab', { name: 'All 16 weeks' }).click()
    await expect(page.getByRole('heading', { name: /^Peak · weeks 13–16/ })).toBeVisible()
    const s = await stored(page)
    expect(s.settings.program).toBe(16)
    expect(Object.keys(s.sessions)).toHaveLength(15)
    await noErrors(errors)
  })

  test('peak block swaps assisted pull-ups for real pull-ups (week 14, 4 months)', async ({ page }) => {
    const errors = await open(page, { ...history(), settings: { program: 16 } }, { at: new Date('2026-12-09T10:00:00'), path: '/day/wed' })
    await expect(page.getByText('Pull-up', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Assisted Pull-up', { exact: true })).toHaveCount(0)
    await noErrors(errors)
  })
})

test.describe('AI coach', () => {
  test('Today shows a briefing that opens the coach', async ({ page }) => {
    const errors = await open(page, history())
    const briefing = page.getByRole('link', { name: /^Coach Pull day/ })
    await expect(briefing).toContainText('g protein to go')
    await expect(briefing).toContainText('Assisted Pull-up')
    await briefing.click()
    await expect(page.getByRole('textbox', { name: 'Ask your coach' })).toBeVisible()
    await expect(page.getByText('Built-in · offline')).toBeVisible()
    await noErrors(errors)
  })

  test('chat answers from the plan and the user’s numbers, offline', async ({ page }) => {
    const errors = await open(page, history(), { path: '/coach' })
    const input = page.getByRole('textbox', { name: 'Ask your coach' })
    await input.fill("what's my workout today?")
    await input.press('Enter')
    await expect(page.getByText('Pull + Pull-up Progression').last()).toBeVisible()
    await page.getByRole('link', { name: 'Open today’s workout' }).click()
    await expect(page).toHaveURL(/#\/day\/wed/)
    await page.goBack()
    await input.fill('how do I lose belly fat')
    await input.press('Enter')
    await expect(page.getByText(/can't be spot-reduced/)).toBeVisible()
    // The chat survives a reload; Clear empties it.
    await page.reload()
    await expect(page.getByText(/can't be spot-reduced/)).toBeVisible()
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByText('Your coach')).toBeVisible()
    await noErrors(errors)
  })

  test('the floating coach button opens the chat from any tab', async ({ page }) => {
    const errors = await open(page, history(), { path: '/progress' })
    await page.getByRole('link', { name: 'Ask your coach' }).click()
    await expect(page).toHaveURL(/#\/coach$/)
    await noErrors(errors)
  })

  test('exercise screen asks the coach with one tap', async ({ page }) => {
    const errors = await open(page, history(), { path: '/exercise/lateral-raise' })
    await page.getByRole('link', { name: /What muscles does lateral raise work/ }).click()
    await expect(page.getByText(/side shoulders/i).last()).toBeVisible()
    await noErrors(errors)
  })

  test('a bad Gemini key is rejected and the built-in coach keeps working', async ({ page }) => {
    // The real server's answer to a wrong key (checked against generativelanguage.googleapis.com).
    await page.route('https://generativelanguage.googleapis.com/**', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } }) }))
    const errors = await open(page, history(), { path: '/settings?ai=1' })
    await page.getByLabel('Gemini API key').fill('not-a-real-key')
    await page.getByRole('button', { name: 'Connect' }).click()
    await expect(page.getByRole('status').filter({ hasText: /Gemini key/ })).toContainText('rejected')
    expect(await page.evaluate(() => localStorage.getItem('gymcals:gemini-key'))).toBeNull()
    await noErrors(errors.filter((e) => !/400/.test(e)))
  })

  test('with a working key, answers come from Gemini; on failure it falls back', async ({ page }) => {
    let fail = false
    await page.route('https://generativelanguage.googleapis.com/**', (r) =>
      fail ? r.fulfill({ status: 503, body: '{}' }) : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Gemini says: **train hard**' }] } }] }) }))
    await open(page, history(), { path: '/coach' })
    await page.evaluate(() => localStorage.setItem('gymcals:gemini-key', 'test-key'))
    await page.reload()
    await expect(page.getByText('Gemini · online')).toBeVisible()
    const input = page.getByRole('textbox', { name: 'Ask your coach' })
    await input.fill('motivate me')
    await input.press('Enter')
    await expect(page.getByText('train hard')).toBeVisible()
    fail = true
    await input.fill('how much protein today')
    await input.press('Enter')
    await expect(page.getByText(/of 130 g/).last()).toBeVisible()
    await expect(page.getByText(/Answered by the built-in coach/)).toBeVisible()
  })
})

test.describe('AI coach · on-device and offline', () => {
  test('uses Chrome’s on-device AI when the browser offers it', async ({ page }) => {
    await page.addInitScript(() => {
      ;(globalThis as unknown as { LanguageModel: unknown }).LanguageModel = {
        availability: async () => 'available',
        create: async (o: { initialPrompts: { role: string; content: string }[] }) => ({
          prompt: async (q: string) => `On-device answer to "${q}" (knows week: ${o.initialPrompts[0].content.includes('currently week 6')})`,
          destroy: () => {},
        }),
      }
    })
    const errors = await open(page, history(), { path: '/coach' })
    await expect(page.getByText('On-device AI', { exact: true })).toBeVisible()
    const input = page.getByRole('textbox', { name: 'Ask your coach' })
    await input.fill('motivate me')
    await input.press('Enter')
    await expect(page.getByText('On-device answer to "motivate me" (knows week: true)')).toBeVisible()
    await noErrors(errors)
  })

  test('built-in coach answers with no internet at all', async ({ page, context }) => {
    const errors = await open(page, history(), { path: '/coach' })
    await expect(page.getByRole('textbox', { name: 'Ask your coach' })).toBeVisible()
    await context.setOffline(true)
    const input = page.getByRole('textbox', { name: 'Ask your coach' })
    await input.fill('what should I eat for dinner')
    await input.press('Enter')
    await expect(page.getByText(/paneer bhurji/)).toBeVisible()
    await context.setOffline(false)
    await noErrors(errors)
  })

  test('Gemini with no internet falls back to the built-in coach', async ({ page, context }) => {
    await open(page, history(), { path: '/coach' })
    await page.evaluate(() => localStorage.setItem('gymcals:gemini-key', 'test-key'))
    await page.reload()
    await expect(page.getByText('Gemini · online')).toBeVisible()
    await context.setOffline(true)
    const input = page.getByRole('textbox', { name: 'Ask your coach' })
    await input.fill('how much water should i drink')
    await input.press('Enter')
    await expect(page.getByText(/2\.5–3\.5 L/)).toBeVisible()
    await expect(page.getByText(/No internet connection\. Answered by the built-in coach/)).toBeVisible()
    await context.setOffline(false)
  })

  test('removing the Gemini key switches back to the built-in coach', async ({ page }) => {
    await page.route('https://generativelanguage.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }) }))
    const errors = await open(page, history(), { path: '/settings?ai=1' })
    await page.getByLabel('Gemini API key').fill('AIza-test-key-1234')
    await page.getByRole('button', { name: 'Connect' }).click()
    await expect(page.getByText('Gemini (free key)')).toBeVisible()
    await expect(page.getByText('•••• 1234')).toBeVisible()
    await page.getByRole('button', { name: 'Remove' }).click()
    await expect(page.getByText('Built-in coach', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('gymcals:gemini-key'))).toBeNull()
    await noErrors(errors)
  })
})

test('after finishing today, the briefing says so and frames the tip as next time', async ({ page }) => {
  const seed = history()
  seed.sessions!['2026-10-14'] = { date: '2026-10-14', dayId: 'wed', startedAt: 0, finishedAt: 3_600_000, log: { 'assisted-pull-up': [8, 8, 8, 8].map((r) => ({ load: 27.5, reps: r, done: true })) } }
  const errors = await open(page, seed)
  const briefing = page.getByRole('link', { name: /^Coach Pull done today/ })
  await expect(briefing).toContainText('Next time, Assisted Pull-up')
  await noErrors(errors)
})
