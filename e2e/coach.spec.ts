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
    await expect(page.getByRole('img', { name: 'Week 6 of 12' })).toBeVisible()
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
    await page.route('https://generativelanguage.googleapis.com/**', (r) => r.fulfill({ status: 400, body: '{}' }))
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
