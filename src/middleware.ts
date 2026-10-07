import { defineMiddleware } from 'astro:middleware'
import { auth } from './lib/auth'

const PUBLIC = [/^\/sign-in\/?$/, /^\/api\/auth\//, /^\/api\/health$/, /^\/_astro\//, /^\/favicon\.ico$/]
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])
const TRUSTED = (process.env.TRUSTED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ success: false, error }), { status, headers: { 'content-type': 'application/json' } })

/**
 * CSRF guard for state-changing requests: a browser always sends Origin on cross-site POST/PUT/DELETE,
 * so it must point at the host we were reached on (or a trusted origin). Protocol is ignored on purpose:
 * behind a TLS-terminating proxy the app only sees http.
 */
function crossSite (request: Request) {
  if (SAFE.has(request.method)) return false
  if (request.headers.get('sec-fetch-site') === 'same-origin') return false
  const origin = request.headers.get('origin')
  if (!origin) return false
  if (TRUSTED.includes(origin)) return false
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host
    return new URL(origin).host !== host
  } catch {
    return true
  }
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url
  if (crossSite(ctx.request) && !/^\/api\/auth\//.test(pathname)) return json(403, 'Cross-site request blocked.')

  const session = await auth.api.getSession({ headers: ctx.request.headers })
  ctx.locals.user = session ? { id: session.user.id, name: session.user.name, email: session.user.email } : null

  if (/^\/sign-in\/?$/.test(pathname) && ctx.locals.user) return ctx.redirect('/')
  if (ctx.locals.user || PUBLIC.some(re => re.test(pathname))) return next()

  if (pathname.startsWith('/api/')) return json(401, 'Unauthorized')
  return ctx.redirect('/sign-in')
})
