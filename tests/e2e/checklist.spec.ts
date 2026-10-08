import type { Page } from '@playwright/test'
import { expect, hydrated, seedTask, test, toast, uid } from './fixtures'

const rowOf = (page: Page, title: string) => page.getByTestId('task-row').filter({ hasText: title })
const subjects = (page: Page) => page.getByTestId('item-row').getByRole('textbox', { name: /^List name/ })

async function fillRows (page: Page, rows: [string, string?][]) {
  for (const [i, [subject, description]] of rows.entries()) {
    await page.getByLabel(`List name ${i + 1}`).fill(subject)
    if (description) await page.getByLabel(`List description ${i + 1}`).fill(description)
  }
}

test.describe('create checklist', () => {
  test('starts with three empty rows and the row counter follows add / remove', async ({ authed: page }) => {
    await page.goto('/new')
    await hydrated(page)
    await expect(page.getByTestId('item-row')).toHaveCount(3)
    await expect(page.getByTestId('count')).toHaveText('Now, 3 list(s).')

    await page.getByRole('button', { name: 'Add new list +' }).click()
    await expect(page.getByTestId('item-row')).toHaveCount(4)
    await expect(page.getByTestId('count')).toHaveText('Now, 4 list(s).')

    await page.getByRole('button', { name: 'Remove list 2' }).click()
    await expect(page.getByTestId('item-row')).toHaveCount(3)

    // the last remaining row cannot be removed
    await page.getByRole('button', { name: 'Remove list 1' }).click()
    await page.getByRole('button', { name: 'Remove list 1' }).click()
    await expect(page.getByTestId('item-row')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /^Remove list/ })).toHaveCount(0)
  })

  test('creates a checklist and shows it on the home page', async ({ authed: page }) => {
    const title = uid('Daily close')
    await page.goto('/new')
    await hydrated(page)
    await page.getByLabel('Title :').fill(`  ${title}  `)
    await fillRows(page, [['Check disk', 'free space > 20%'], ['Check cpu'], ['Check backup']])
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL('/')
    await expect(toast(page).first()).toContainText('This CheckList is Created.')
    const row = rowOf(page, title)
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('last created')
  })

  test('rejects a blank list name', async ({ authed: page }) => {
    await page.goto('/new')
    await hydrated(page)
    await page.getByLabel('Title :').fill(uid('Blank'))
    await fillRows(page, [['Only one']])
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(toast(page).first()).toContainText('Every list needs a name.')
    await expect(page).toHaveURL(/\/new$/)
    await expect(page.getByLabel('List name 2')).toHaveClass(/is-invalid/)
  })

  test('rejects duplicate list names (case and spacing are ignored)', async ({ authed: page }) => {
    await page.goto('/new')
    await hydrated(page)
    await page.getByLabel('Title :').fill(uid('Dup'))
    await fillRows(page, [['Same name'], ['same   NAME'], ['Other']])
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(toast(page).first()).toContainText('list is same.')
    await expect(page.getByLabel('List name 1')).toHaveClass(/is-invalid/)
    await expect(page.getByLabel('List name 2')).toHaveClass(/is-invalid/)
    await expect(page.getByLabel('List name 3')).not.toHaveClass(/is-invalid/)
    await expect(page).toHaveURL(/\/new$/)
  })

  test('rejects a title that is already used, ignoring case and extra spaces', async ({ authed: page }) => {
    const title = uid('Unique title')
    await seedTask(page, title)
    await page.goto('/new')
    await hydrated(page)
    await page.getByLabel('Title :').fill(`  ${title.toUpperCase().replace(' ', '   ')}  `)
    await fillRows(page, [['a'], ['b'], ['c']])
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(toast(page).first()).toContainText('This Title is use already!')
    await expect(page).toHaveURL(/\/new$/)
  })

  test('a title can be reused once the old checklist is deleted', async ({ authed: page }) => {
    const title = uid('Reusable')
    const { task_id } = await seedTask(page, title)
    expect((await page.request.delete(`/api/tasks/${task_id}`)).ok()).toBeTruthy()
    const again = await page.request.post('/api/tasks', { data: { title, items: [{ subject: 'x' }] } })
    expect(again.status()).toBe(201)
  })

  test('markup in titles and lists is rendered as plain text', async ({ authed: page }) => {
    const title = `<img src=x onerror=__xss=1> ${uid('t')}`
    await seedTask(page, title, ['<b>bold?</b>'])
    await page.goto('/')
    await expect(rowOf(page, 'onerror')).toHaveCount(1)
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined()
  })
})

test.describe('edit checklist', () => {
  test('loads the existing values and saves renamed / added / removed lists', async ({ authed: page }) => {
    const title = uid('Edit me')
    const seed = await seedTask(page, title, ['One', 'Two', 'Three'])

    await page.goto(`/edit/${seed.task_id}`)
    await hydrated(page)
    await expect(page.getByLabel('Title :')).toHaveValue(title)
    await expect(subjects(page)).toHaveCount(3)
    await expect(page.getByLabel('List name 2')).toHaveValue('Two')
    await expect(page.getByLabel('List description 2')).toHaveValue('check Two')
    await expect(page.getByTestId('task-meta')).toContainText('created')

    const newTitle = `${title} v2`
    await page.getByLabel('Title :').fill(newTitle)
    await page.getByLabel('List name 1').fill('One renamed')
    await page.getByRole('button', { name: 'Remove list 2' }).click()
    await page.getByRole('button', { name: 'Add new list +' }).click()
    await page.getByLabel('List name 3').fill('Four')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page).toHaveURL('/')
    await expect(toast(page).first()).toContainText('This CheckList is Updated!')
    await expect(rowOf(page, newTitle)).toHaveCount(1)

    const saved = await (await page.request.get(`/api/tasks/${seed.task_id}`)).json()
    expect(saved.title).toBe(newTitle)
    expect(saved.items.map((i: any) => i.subject)).toEqual(['One renamed', 'Three', 'Four'])
    // kept items keep their id (history stays attached); the new one gets a fresh id
    expect(saved.items[0].item_id).toBe(seed.items[0].item_id)
    expect(saved.items[1].item_id).toBe(seed.items[2].item_id)
    expect(saved.modified_at).not.toBeNull()
  })

  test('saving with the same title keeps working (no false "title in use")', async ({ authed: page }) => {
    const seed = await seedTask(page, uid('Same title'))
    await page.goto(`/edit/${seed.task_id}`)
    await hydrated(page)
    await page.getByLabel('List description 1').fill('changed description')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL('/')
    const saved = await (await page.request.get(`/api/tasks/${seed.task_id}`)).json()
    expect(saved.items[0].description).toBe('changed description')
  })

  test('renaming to another checklist title is refused', async ({ authed: page }) => {
    const other = uid('Taken')
    await seedTask(page, other)
    const seed = await seedTask(page, uid('Mine'))
    await page.goto(`/edit/${seed.task_id}`)
    await hydrated(page)
    await page.getByLabel('Title :').fill(other)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(toast(page).first()).toContainText('This Title is use already!')
    await expect(page).toHaveURL(new RegExp(`/edit/${seed.task_id}$`))
  })

  test('drag and drop reorders the lists and the order is saved', async ({ authed: page }) => {
    const seed = await seedTask(page, uid('Reorder'), ['First', 'Second', 'Third'])
    await page.goto(`/edit/${seed.task_id}`)
    await hydrated(page)

    const handles = page.getByTestId('handle')
    const from = (await handles.nth(0).boundingBox())!
    const to = (await handles.nth(2).boundingBox())!
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(from.x + from.width / 2, from.y + 10, { steps: 5 })
    await page.mouse.move(to.x + to.width / 2, to.y + to.height + 20, { steps: 15 })
    await page.mouse.up()

    await expect(page.getByLabel('List name 1')).toHaveValue('Second')
    await expect(page.getByLabel('List name 3')).toHaveValue('First')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL('/')

    const saved = await (await page.request.get(`/api/tasks/${seed.task_id}`)).json()
    expect(saved.items.map((i: any) => i.subject)).toEqual(['Second', 'Third', 'First'])
  })

  test('an unknown checklist id sends the user home', async ({ authed: page }) => {
    await page.goto('/edit/999999999')
    await expect(page).toHaveURL('/')
    await page.goto('/edit/abc')
    await expect(page).toHaveURL('/')
  })
})

test.describe('home list', () => {
  test('delete asks for confirmation; cancel keeps it, accept removes it for good', async ({ authed: page }) => {
    const title = uid('Delete me')
    await seedTask(page, title)
    await page.goto('/')

    page.once('dialog', d => d.dismiss())
    await rowOf(page, title).getByRole('button', { name: `Delete ${title}` }).click()
    await expect(rowOf(page, title)).toHaveCount(1)

    page.once('dialog', d => { expect(d.message()).toContain('Are you sure'); void d.accept() })
    await rowOf(page, title).getByRole('button', { name: `Delete ${title}` }).click()
    await expect(rowOf(page, title)).toHaveCount(0)
    await expect(toast(page).first()).toContainText('Delete it!')

    await page.reload()
    await expect(rowOf(page, title)).toHaveCount(0)
  })

  test('never-used checklists are listed before used ones and are labelled differently', async ({ authed: page }) => {
    const used = await seedTask(page, uid('Used'), ['a'])
    const fresh = await seedTask(page, uid('Fresh'), ['a'])
    const res = await page.request.post('/api/surveys', { data: { task_id: used.task_id, items: [{ item_id: used.items[0].item_id, problem: false }] } })
    expect(res.status()).toBe(201)

    await page.goto('/')
    await expect(rowOf(page, used.title)).toContainText('recent use')
    await expect(rowOf(page, fresh.title)).toContainText('last created')
    const order = await page.getByTestId('task-row').allInnerTexts()
    const idx = (t: string) => order.findIndex(o => o.includes(t))
    expect(idx(fresh.title)).toBeGreaterThanOrEqual(0)
    expect(idx(fresh.title)).toBeLessThan(idx(used.title))
  })

  test('the title link opens the survey form and edit link opens the editor', async ({ authed: page }) => {
    const seed = await seedTask(page)
    await page.goto('/')
    await rowOf(page, seed.title).locator('a.title').click()
    await expect(page).toHaveURL(new RegExp(`/task/${seed.task_id}$`))
    await expect(page.getByTestId('task-title')).toHaveText(seed.title)

    await page.goto('/')
    await rowOf(page, seed.title).getByRole('link', { name: `Edit ${seed.title}` }).click()
    await expect(page).toHaveURL(new RegExp(`/edit/${seed.task_id}$`))
  })
})
