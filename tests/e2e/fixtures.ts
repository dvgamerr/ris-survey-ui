import { test as base, expect, type Browser, type BrowserContext, type Page } from '@playwright/test'

export { expect }

const RUN = Date.now().toString(36)
let counter = 0
/** unique per run + per call, so tests never collide on the shared database */
export const uid = (prefix = 'x') => `${prefix}-${RUN}-${(++counter).toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export const PASSWORD = 'secret-pass-1'

export interface Account { name: string, email: string, password: string }
export const newAccount = (name = uid('User')): Account => ({ name, email: `${uid('u')}@example.test`, password: PASSWORD })

/** Wait until every Astro island on the page has hydrated, so typing is never lost. */
export async function hydrated (page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0)
}

/** Register through the API (no verification needed) – the page's cookie jar is signed in afterwards. */
export async function register (page: Page, acc: Account = newAccount()) {
  const origin = new URL(process.env.E2E_BASE_URL || 'http://localhost:3000').origin
  const res = await page.request.post('/api/auth/sign-up/email', { data: acc, headers: { origin } })
  expect(res.ok(), `sign-up failed: ${await res.text()}`).toBeTruthy()
  return acc
}

export interface Seed { task_id: number, title: string, items: { item_id: number, subject: string }[] }

/** Create a checklist through the API and return its ids. */
export async function seedTask (page: Page, title = uid('Checklist'), subjects = ['Disk space', 'CPU load', 'Backup job']): Promise<Seed> {
  const res = await page.request.post('/api/tasks', { data: { title, items: subjects.map(subject => ({ subject, description: `check ${subject}` })) } })
  expect(res.status(), await res.text()).toBe(201)
  const { task_id } = await res.json()
  const task = await (await page.request.get(`/api/tasks/${task_id}`)).json()
  return { task_id, title, items: task.items }
}

export const toast = (page: Page) => page.locator('#toasts .app-toast')

/** A fresh browser context that is signed in as a brand-new user. */
export async function signedInContext (browser: Browser, acc: Account = newAccount()): Promise<{ context: BrowserContext, page: Page, acc: Account }> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await register(page, acc)
  return { context, page, acc }
}

export const test = base.extend<{ account: Account, authed: Page }>({
  account: async ({}, use) => { await use(newAccount()) },
  authed: async ({ page, account }, use) => {
    await register(page, account)
    await use(page)
  }
})
