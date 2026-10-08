import type { Page } from '@playwright/test'
import { expect, hydrated, newAccount, seedTask, signedInContext, test, toast, type Seed } from './fixtures'

type Mark = 'PASS' | 'FAIL' | 'WARN' | 'INFO'

/** Submit a survey through the API: one mark per item, in order. */
async function submit (page: Page, seed: Seed, marks: Mark[], reason = 'something is off') {
  const res = await page.request.post('/api/surveys', {
    data: {
      task_id: seed.task_id,
      items: seed.items.map((it, i) => ({ item_id: it.item_id, problem: marks[i] !== 'PASS', status: marks[i], reason: marks[i] === 'PASS' ? '' : `${reason} #${i + 1}` }))
    }
  })
  expect(res.status(), await res.text()).toBe(201)
  return (await res.json()).survey_id as string
}

const row = (page: Page, title: string) => page.getByTestId('history-row').filter({ hasText: title })

test.describe('history list', () => {
  test('groups by day, newest first, with the worst status as the icon and per-status badges', async ({ authed: page }) => {
    const a = await seedTask(page, undefined, ['a', 'b', 'c', 'd'])
    const b = await seedTask(page, undefined, ['a', 'b'])
    const c = await seedTask(page, undefined, ['a'])
    await submit(page, a, ['PASS', 'FAIL', 'WARN', 'INFO'])
    await submit(page, b, ['PASS', 'INFO'])
    await submit(page, c, ['PASS'])

    await page.goto('/history')
    await expect(page.getByTestId('history-day').first().getByRole('heading')).toHaveText('Today')

    await expect(row(page, a.title)).toHaveAttribute('data-status', 'FAIL')
    await expect(row(page, a.title)).toContainText('Fail 1')
    await expect(row(page, a.title)).toContainText('Warning 1')
    await expect(row(page, a.title)).toContainText('Info 1')

    await expect(row(page, b.title)).toHaveAttribute('data-status', 'INFO')
    await expect(row(page, b.title)).toContainText('Info 1')
    await expect(row(page, b.title)).not.toContainText('Fail')

    await expect(row(page, c.title)).toHaveAttribute('data-status', 'PASS')
    await expect(row(page, c.title).locator('.badge')).toHaveCount(0)

    const texts = await page.getByTestId('history-row').allInnerTexts()
    const idx = (t: string) => texts.findIndex(x => x.includes(t))
    expect(idx(c.title)).toBeLessThan(idx(b.title))
    expect(idx(b.title)).toBeLessThan(idx(a.title))
  })

  test('the title opens the version page and the pencil opens the edit page', async ({ authed: page }) => {
    const seed = await seedTask(page)
    const id = await submit(page, seed, ['PASS', 'PASS', 'PASS'])
    await page.goto('/history')
    await row(page, seed.title).getByRole('link', { name: seed.title, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/history/version/${id}$`))

    await page.goto('/history')
    await row(page, seed.title).getByRole('link', { name: `Edit ${seed.title}` }).click()
    await expect(page).toHaveURL(new RegExp(`/history/edit/${id}$`))
  })

  test('unknown survey ids redirect back to the history', async ({ authed: page }) => {
    for (const p of ['/history/version/not-a-uuid', '/history/version/00000000-0000-0000-0000-000000000000', '/history/edit/00000000-0000-0000-0000-000000000000']) {
      await page.goto(p)
      await expect(page).toHaveURL(/\/history$/)
    }
  })
})

test.describe('version page', () => {
  test('shows every item with its status, reason and who submitted it', async ({ authed: page, account }) => {
    const seed = await seedTask(page, undefined, ['Disk', 'CPU'])
    const id = await submit(page, seed, ['FAIL', 'PASS'], 'disk is full')
    await page.goto(`/history/version/${id}`)

    await expect(page.getByTestId('survey-meta')).toContainText(seed.title)
    await expect(page.getByTestId('survey-meta')).toContainText(account.name)
    const items = page.getByTestId('version-item')
    await expect(items).toHaveCount(2)
    await expect(items.nth(0)).toContainText('1. Disk')
    await expect(items.nth(0).getByLabel('FAIL')).toBeVisible()
    await expect(items.nth(0)).toContainText('disk is full #1')
    await expect(items.nth(0)).toContainText(`submitted by ${account.name}`)
    await expect(items.nth(1).getByLabel('PASS')).toBeVisible()
    await expect(items.nth(1).locator('pre')).toHaveCount(0)
    await expect(page.getByTestId('older-versions')).toHaveCount(0)
  })

  test('reasons are shown as text, never as markup', async ({ authed: page }) => {
    const seed = await seedTask(page, undefined, ['x'])
    const id = await submit(page, seed, ['FAIL'], '<img src=x onerror=__xss=1>')
    await page.goto(`/history/version/${id}`)
    await expect(page.locator('pre').first()).toContainText('<img src=x onerror=__xss=1>')
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined()
  })
})

test.describe('edit a past survey', () => {
  test('loads the saved state of every item', async ({ authed: page }) => {
    const seed = await seedTask(page, undefined, ['Disk', 'CPU', 'Backup'])
    const id = await submit(page, seed, ['PASS', 'WARN', 'PASS'], 'cpu is busy')
    await page.goto(`/history/edit/${id}`)
    await hydrated(page)

    const item = (n: number) => page.getByTestId('survey-item').nth(n - 1)
    await expect(item(1).getByRole('checkbox')).toBeChecked()
    await expect(item(2).getByRole('checkbox')).not.toBeChecked()
    await expect(item(2).getByRole('button', { name: /^WARN/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(item(2).getByRole('textbox', { name: /^Reason/ })).toHaveValue('cpu is busy #2')
    await expect(page.getByTestId('check-all')).toHaveCount(0)
  })

  test('only changed items get a new version; the older one stays visible', async ({ authed: page, account }) => {
    const seed = await seedTask(page, undefined, ['Disk', 'CPU', 'Backup'])
    const id = await submit(page, seed, ['PASS', 'PASS', 'FAIL'], 'backup failed')

    await page.goto(`/history/edit/${id}`)
    await hydrated(page)
    const item = (n: number) => page.getByTestId('survey-item').nth(n - 1)
    await item(2).getByRole('button', { name: /^Problem/ }).click()
    await item(2).getByRole('button', { name: /^INFO/ }).click()
    await item(2).getByRole('textbox', { name: /^Reason/ }).fill('cpu spike, watching')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page).toHaveURL(/\/history$/)
    await expect(toast(page).first()).toContainText('Task Updated.')
    await expect(row(page, seed.title)).toContainText('Fail 1')
    await expect(row(page, seed.title)).toContainText('Info 1')

    await page.goto(`/history/version/${id}`)
    const items = page.getByTestId('version-item')
    await expect(items.nth(0)).toContainText(`submitted by ${account.name}`) // untouched
    await expect(items.nth(2)).toContainText(`submitted by ${account.name}`) // untouched
    await expect(items.nth(1)).toContainText(`updated by ${account.name}`)
    await expect(items.nth(1)).toContainText('cpu spike, watching')
    await expect(items.nth(1).getByTestId('older-versions')).toContainText(`submitted by ${account.name}`)
    await expect(items.nth(1).getByTestId('older-versions').getByLabel('PASS')).toBeVisible()
    await expect(page.getByTestId('older-versions')).toHaveCount(1)
  })

  test('saving without changes creates no new version', async ({ authed: page }) => {
    const seed = await seedTask(page, undefined, ['Disk', 'CPU'])
    const id = await submit(page, seed, ['PASS', 'FAIL'])
    await page.goto(`/history/edit/${id}`)
    await hydrated(page)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/history$/)
    await page.goto(`/history/version/${id}`)
    await expect(page.getByTestId('older-versions')).toHaveCount(0)
    await expect(page.getByTestId('version-item').filter({ hasText: 'updated by' })).toHaveCount(0)
  })

  test('fixing a problem turns the row green and drops its badge', async ({ authed: page }) => {
    const seed = await seedTask(page, undefined, ['Disk'])
    const id = await submit(page, seed, ['FAIL'])
    await page.goto(`/history/edit/${id}`)
    await hydrated(page)
    await page.getByTestId('survey-item').first().getByRole('button', { name: /^Cancel/ }).click()
    await page.getByTestId('survey-item').first().getByRole('checkbox').check({ force: true })
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/history$/)
    await expect(row(page, seed.title)).toHaveAttribute('data-status', 'PASS')
    await expect(row(page, seed.title)).not.toContainText('Fail')
  })

  test('a second person editing is listed as an editor', async ({ authed: page, account, browser }) => {
    const seed = await seedTask(page, undefined, ['Disk'])
    const id = await submit(page, seed, ['PASS'])

    const other = await signedInContext(browser, newAccount())
    await other.page.goto(`/history/edit/${id}`)
    await hydrated(other.page)
    await other.page.getByTestId('survey-item').first().getByRole('button', { name: /^Problem/ }).click()
    await other.page.getByTestId('survey-item').first().getByRole('textbox', { name: /^Reason/ }).fill('seen by another person')
    await other.page.getByRole('button', { name: 'Save' }).click()
    await expect(other.page).toHaveURL(/\/history$/)

    await page.goto('/history')
    await expect(row(page, seed.title)).toContainText(account.name)
    await expect(row(page, seed.title)).toContainText(other.acc.name)
    await page.goto(`/history/version/${id}`)
    await expect(page.getByTestId('version-item').first()).toContainText(`updated by ${other.acc.name}`)
    await other.context.close()
  })
})
