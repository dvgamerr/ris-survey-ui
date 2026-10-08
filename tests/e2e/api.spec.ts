import { expect, seedTask, test, uid } from './fixtures'

test.describe('csrf guard', () => {
  test('state-changing requests from a foreign origin are blocked, same-origin ones pass', async ({ authed: page }) => {
    const data = { title: uid('csrf'), items: [{ subject: 'a' }] }
    const evil = await page.request.post('/api/tasks', { data, headers: { origin: 'http://evil.example' } })
    expect(evil.status()).toBe(403)
    const base = new URL(process.env.E2E_BASE_URL || 'http://localhost:3000').origin
    const ok = await page.request.post('/api/tasks', { data, headers: { origin: base } })
    expect(ok.status()).toBe(201)
  })
})

test.describe('tasks API validation', () => {
  test('rejects malformed payloads with 400', async ({ authed: page }) => {
    const bad = [
      { title: '   ', items: [{ subject: 'a' }] },
      { title: 'x', items: [] },
      { title: 'x', items: [{ subject: '  ' }] },
      { title: 'x', items: [{ subject: 'a' }, { subject: 'A ' }] },
      { title: 'x'.repeat(51), items: [{ subject: 'a' }] },
      { title: 'x', items: [{ subject: 'a'.repeat(51) }] },
      { title: 'x', items: [{ subject: 'a', description: 'd'.repeat(501) }] }
    ]
    for (const data of bad) {
      const res = await page.request.post('/api/tasks', { data })
      expect(res.status(), JSON.stringify(data).slice(0, 80)).toBe(400)
      expect((await res.json()).success).toBe(false)
    }
    const notJson = await page.request.post('/api/tasks', { data: 'nope', headers: { 'content-type': 'application/json' } })
    expect(notJson.status()).toBe(400)
  })

  test('duplicate titles answer 409 and unknown ids 404', async ({ authed: page }) => {
    const title = uid('API dup')
    await seedTask(page, title)
    const dup = await page.request.post('/api/tasks', { data: { title: title.toLowerCase(), items: [{ subject: 'a' }] } })
    expect(dup.status()).toBe(409)
    expect((await dup.json()).error).toBe('This Title is use already!')

    expect((await page.request.get('/api/tasks/999999999')).status()).toBe(404)
    expect((await page.request.get('/api/tasks/abc')).status()).toBe(404)
    expect((await page.request.put('/api/tasks/999999999', { data: { title: 'x', items: [{ subject: 'a' }] } })).status()).toBe(404)
    expect((await page.request.delete('/api/tasks/999999999')).status()).toBe(404)
  })

  test('list endpoint returns the home rows', async ({ authed: page }) => {
    const seed = await seedTask(page)
    const rows = await (await page.request.get('/api/tasks')).json()
    const mine = rows.find((r: any) => r.task_id === seed.task_id)
    expect(mine).toMatchObject({ title: seed.title, type: 1 })
  })

  test('removed lists are disabled, not erased, so history keeps its labels', async ({ authed: page }) => {
    const seed = await seedTask(page, undefined, ['Keep', 'Drop'])
    const res = await page.request.post('/api/surveys', {
      data: { task_id: seed.task_id, items: seed.items.map(i => ({ item_id: i.item_id, problem: false })) }
    })
    const { survey_id } = await res.json()
    await page.request.put(`/api/tasks/${seed.task_id}`, { data: { title: seed.title, items: [{ item_id: seed.items[0].item_id, subject: 'Keep' }] } })

    const survey = await (await page.request.get(`/api/surveys/${survey_id}`)).json()
    expect(survey.entries.map((e: any) => e.subject).sort()).toEqual(['Drop', 'Keep'])
    const task = await (await page.request.get(`/api/tasks/${seed.task_id}`)).json()
    expect(task.items.map((i: any) => i.subject)).toEqual(['Keep'])
  })
})

test.describe('surveys API validation', () => {
  test('requires every enabled item of the checklist, and only that checklist\'s items', async ({ authed: page }) => {
    const a = await seedTask(page, undefined, ['a1', 'a2'])
    const b = await seedTask(page, undefined, ['b1'])
    const pass = (id: number) => ({ item_id: id, problem: false })

    const partial = await page.request.post('/api/surveys', { data: { task_id: a.task_id, items: [pass(a.items[0].item_id)] } })
    expect(partial.status()).toBe(400)

    const foreign = await page.request.post('/api/surveys', { data: { task_id: a.task_id, items: [pass(a.items[0].item_id), pass(b.items[0].item_id)] } })
    expect(foreign.status()).toBe(400)

    const empty = await page.request.post('/api/surveys', { data: { task_id: a.task_id, items: [] } })
    expect(empty.status()).toBe(400)

    const dup = await page.request.post('/api/surveys', { data: { task_id: a.task_id, items: [pass(a.items[0].item_id), pass(a.items[0].item_id)] } })
    expect(dup.status()).toBe(400)

    const noTask = await page.request.post('/api/surveys', { data: { task_id: 999999999, items: [pass(1)] } })
    expect(noTask.status()).toBe(404)

    const noReason = await page.request.post('/api/surveys', { data: { task_id: b.task_id, items: [{ item_id: b.items[0].item_id, problem: true, status: 'FAIL', reason: ' ' }] } })
    expect(noReason.status()).toBe(400)
  })

  test('an unknown status on a problem falls back to FAIL, a non-problem is always PASS', async ({ authed: page }) => {
    const seed = await seedTask(page, undefined, ['p', 'q'])
    const res = await page.request.post('/api/surveys', {
      data: { task_id: seed.task_id, items: [{ item_id: seed.items[0].item_id, problem: true, status: 'BOGUS', reason: 'r' }, { item_id: seed.items[1].item_id, problem: false, status: 'FAIL', reason: 'ignored' }] }
    })
    const { survey_id } = await res.json()
    const survey = await (await page.request.get(`/api/surveys/${survey_id}`)).json()
    expect(survey.entries.map((e: any) => [e.status, e.remark])).toEqual([['FAIL', 'r'], ['PASS', '']])
  })

  test('editing a survey that does not exist is a 404; foreign items are a 400', async ({ authed: page }) => {
    const missing = await page.request.put('/api/surveys/00000000-0000-0000-0000-000000000000', { data: { items: [{ item_id: 1, problem: false }] } })
    expect(missing.status()).toBe(404)

    const seed = await seedTask(page, undefined, ['only'])
    const { survey_id } = await (await page.request.post('/api/surveys', { data: { task_id: seed.task_id, items: [{ item_id: seed.items[0].item_id, problem: false }] } })).json()
    const foreign = await page.request.put(`/api/surveys/${survey_id}`, { data: { items: [{ item_id: 999999999, problem: false }] } })
    expect(foreign.status()).toBe(400)

    const same = await (await page.request.put(`/api/surveys/${survey_id}`, { data: { items: [{ item_id: seed.items[0].item_id, problem: false }] } })).json()
    expect(same).toEqual({ success: true, updated: 0 })
    const changed = await (await page.request.put(`/api/surveys/${survey_id}`, { data: { items: [{ item_id: seed.items[0].item_id, problem: true, status: 'INFO', reason: 'fyi' }] } })).json()
    expect(changed).toEqual({ success: true, updated: 1 })
  })
})
