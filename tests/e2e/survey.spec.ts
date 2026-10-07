import type { Page } from '@playwright/test'
import { expect, hydrated, seedTask, test, toast, uid } from './fixtures'

const item = (page: Page, n: number) => page.getByTestId('survey-item').nth(n - 1)
const toggle = (page: Page, n: number) => item(page, n).getByRole('checkbox')
const summary = (page: Page) => page.getByTestId('summary')

async function open (page: Page, subjects = ['Disk space', 'CPU load', 'Backup job']) {
  const seed = await seedTask(page, uid('Survey'), subjects)
  await page.goto(`/task/${seed.task_id}`)
  await hydrated(page)
  return seed
}

test.describe('fill a survey', () => {
  test('shows the checklist with live Pass / Fail / Uncheck counters', async ({ authed: page }) => {
    const seed = await open(page)
    await expect(page.getByTestId('task-title')).toHaveText(seed.title)
    await expect(page.getByTestId('survey-item')).toHaveCount(3)
    await expect(item(page, 1).getByTestId('subject')).toHaveText('1. Disk space')
    await expect(summary(page)).toContainText('Pass: 0')
    await expect(summary(page)).toContainText('[ 3 Uncheck(s) ]')

    await toggle(page, 1).check({ force: true })
    await expect(summary(page)).toContainText('Pass: 1')
    await expect(summary(page)).toContainText('[ 2 Uncheck(s) ]')

    await item(page, 2).getByRole('button', { name: /^Problem/ }).click()
    await expect(summary(page)).toContainText('Fail: 1')
    await expect(summary(page)).toContainText('[ 1 Uncheck(s) ]')
  })

  test('Checked All / Unchecked All toggles every item', async ({ authed: page }) => {
    await open(page)
    const button = page.getByTestId('check-all')
    await expect(button).toHaveText('Checked All')
    await button.click()
    await expect(button).toHaveText('Unchecked All')
    await expect(summary(page)).toContainText('Pass: 3')
    await expect(summary(page)).not.toContainText('Uncheck(s)')
    for (const n of [1, 2, 3]) await expect(toggle(page, n)).toBeChecked()

    await button.click()
    await expect(button).toHaveText('Checked All')
    await expect(summary(page)).toContainText('Pass: 0')
  })

  test('cannot submit while something is still unchecked', async ({ authed: page }) => {
    await open(page)
    await toggle(page, 1).check({ force: true })
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(toast(page).first()).toContainText('Please check every item.')
    await expect(page).toHaveURL(/\/task\/\d+$/)
    await expect(item(page, 2)).toHaveClass(/invalid/)
    await expect(item(page, 1)).not.toHaveClass(/invalid/)
  })

  test('Problem opens status buttons (FAIL by default) and a reason box, and disables the switch', async ({ authed: page }) => {
    await open(page)
    await toggle(page, 1).check({ force: true })
    const problem = item(page, 1).getByRole('button', { name: /^Problem/ })
    await problem.click()

    await expect(toggle(page, 1)).not.toBeChecked() // marking a problem unchecks "pass"
    await expect(toggle(page, 1)).toBeDisabled()
    await expect(item(page, 1).getByRole('button', { name: /^FAIL/ })).toHaveAttribute('aria-pressed', 'true')
    await item(page, 1).getByRole('button', { name: /^WARN/ }).click()
    await expect(item(page, 1).getByRole('button', { name: /^WARN/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(item(page, 1).getByRole('button', { name: /^FAIL/ })).toHaveAttribute('aria-pressed', 'false')
    await expect(item(page, 1).getByRole('textbox', { name: /^Reason/ })).toBeVisible()

    await item(page, 1).getByRole('button', { name: /^Cancel/ }).click()
    await expect(item(page, 1).getByRole('textbox', { name: /^Reason/ })).toHaveCount(0)
    await expect(toggle(page, 1)).toBeEnabled()
  })

  test('a problem needs a description before it can be submitted', async ({ authed: page }) => {
    await open(page, ['Only'])
    await item(page, 1).getByRole('button', { name: /^Problem/ }).click()
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(toast(page).first()).toContainText('Please describe the problem.')
    await expect(page).toHaveURL(/\/task\/\d+$/)
  })

  test('submitting saves the survey and lands on the history with a thank-you', async ({ authed: page, account }) => {
    const seed = await open(page)
    await toggle(page, 1).check({ force: true })
    await item(page, 2).getByRole('button', { name: /^Problem/ }).click()
    await item(page, 2).getByRole('button', { name: /^WARN/ }).click()
    await item(page, 2).getByRole('textbox', { name: /^Reason/ }).fill('cpu at 91%')
    await toggle(page, 3).check({ force: true })
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL(/\/history$/)
    await expect(toast(page).first()).toContainText('Thanks.')
    const row = page.getByTestId('history-row').filter({ hasText: seed.title })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('Warning 1')
    await expect(row).not.toContainText('Fail')
    await expect(row).toContainText(`by ${account.name}`)
    await expect(row).toHaveAttribute('data-status', 'WARN')
  })

  test('the draft survives a reload and Reset clears it', async ({ authed: page }) => {
    await open(page)
    await toggle(page, 1).check({ force: true })
    await item(page, 2).getByRole('button', { name: /^Problem/ }).click()
    await item(page, 2).getByRole('textbox', { name: /^Reason/ }).fill('half written')

    await page.reload()
    await hydrated(page)
    await expect(toggle(page, 1)).toBeChecked()
    await expect(item(page, 2).getByRole('textbox', { name: /^Reason/ })).toHaveValue('half written')
    await expect(summary(page)).toContainText('Pass: 1')

    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(toggle(page, 1)).not.toBeChecked()
    await expect(summary(page)).toContainText('[ 3 Uncheck(s) ]')
    await page.reload()
    await hydrated(page)
    await expect(summary(page)).toContainText('Pass: 0')
  })

  test('a submitted draft does not come back', async ({ authed: page }) => {
    const seed = await open(page, ['Solo'])
    await toggle(page, 1).check({ force: true })
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page).toHaveURL(/\/history$/)
    await page.goto(`/task/${seed.task_id}`)
    await hydrated(page)
    await expect(toggle(page, 1)).not.toBeChecked()
  })

  test('a draft is ignored when the checklist changed in the meantime', async ({ authed: page }) => {
    const seed = await open(page)
    await toggle(page, 1).check({ force: true })
    const res = await page.request.put(`/api/tasks/${seed.task_id}`, {
      data: { title: seed.title, items: [...seed.items.map(i => ({ item_id: i.item_id, subject: i.subject })), { subject: 'Brand new' }] }
    })
    expect(res.ok()).toBeTruthy()
    await page.reload()
    await hydrated(page)
    await expect(page.getByTestId('survey-item')).toHaveCount(4)
    await expect(toggle(page, 1)).not.toBeChecked()
  })

  test('an unknown or removed checklist sends the user home', async ({ authed: page }) => {
    await page.goto('/task/999999999')
    await expect(page).toHaveURL('/')
    const seed = await seedTask(page)
    await page.request.delete(`/api/tasks/${seed.task_id}`)
    await page.goto(`/task/${seed.task_id}`)
    await expect(page).toHaveURL('/')
  })
})
