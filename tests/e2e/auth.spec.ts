import { expect, hydrated, newAccount, register, test, toast } from './fixtures'

test.describe('authentication', () => {
  test('anonymous visitors are sent to the sign-in page', async ({ page }) => {
    for (const path of ['/', '/history', '/new', '/task/1', '/history/version/00000000-0000-0000-0000-000000000000']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/sign-in$/)
    }
    await expect(page.getByTestId('auth-title')).toHaveText('Sign-In')
  })

  test('the JSON API answers 401 without a session, but health stays public', async ({ request }) => {
    for (const [method, url] of [['get', '/api/tasks'], ['post', '/api/tasks'], ['get', '/api/tasks/1'], ['post', '/api/surveys'], ['put', '/api/surveys/x']] as const) {
      const res = await request[method](url)
      expect(res.status(), `${method} ${url}`).toBe(401)
    }
    const health = await request.get('/api/health')
    expect(health.ok()).toBeTruthy()
    expect(await health.json()).toEqual({ ok: true })
  })

  test('register needs no verification and signs the user straight in', async ({ page }) => {
    const acc = newAccount()
    await page.goto('/sign-in')
    await hydrated(page)
    await page.getByTestId('auth-toggle').click()
    await expect(page.getByTestId('auth-title')).toHaveText('Register')
    await page.getByLabel('Name').fill(acc.name)
    await page.getByLabel('Email').fill(acc.email)
    await page.getByLabel('Password').fill(acc.password)
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('user-name')).toHaveText(acc.name)
    await expect(page.getByRole('heading', { name: 'All Title Survey Checklists' })).toBeVisible()
  })

  test('a signed-in user is bounced away from /sign-in, and logout ends the session', async ({ authed: page, account }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('user-name')).toHaveText(account.name)

    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL(/\/sign-in$/)
    await page.goto('/')
    await expect(page).toHaveURL(/\/sign-in$/)
  })

  test('login works with the registered credentials', async ({ page }) => {
    const acc = await register(page)
    await page.context().clearCookies()

    await page.goto('/sign-in')
    await hydrated(page)
    await page.getByLabel('Email').fill(acc.email)
    await page.getByLabel('Password').fill(acc.password)
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('user-name')).toHaveText(acc.name)
  })

  test('wrong password shows an error and stays on the page', async ({ page }) => {
    const acc = await register(page)
    await page.context().clearCookies()

    await page.goto('/sign-in')
    await hydrated(page)
    await page.getByLabel('Email').fill(acc.email)
    await page.getByLabel('Password').fill('not-the-password')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(toast(page).first()).toContainText('Email or Password wrong.')
    await expect(page).toHaveURL(/\/sign-in$/)
  })

  test('registering an e-mail twice is rejected', async ({ page }) => {
    const acc = await register(page)
    await page.context().clearCookies()

    await page.goto('/sign-in')
    await hydrated(page)
    await page.getByTestId('auth-toggle').click()
    await page.getByLabel('Name').fill('Someone Else')
    await page.getByLabel('Email').fill(acc.email)
    await page.getByLabel('Password').fill(acc.password)
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(toast(page).first()).toBeVisible()
    await expect(page).toHaveURL(/\/sign-in$/)
  })

  test('a password shorter than 6 characters is refused', async ({ page }) => {
    await page.goto('/sign-in')
    await hydrated(page)
    await page.getByTestId('auth-toggle').click()
    await page.getByLabel('Name').fill('Short Pass')
    await page.getByLabel('Email').fill(newAccount().email)
    await page.getByLabel('Password').fill('12345')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL(/\/sign-in$/)
  })
})
