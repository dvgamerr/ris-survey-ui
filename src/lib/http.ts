import type { APIContext } from 'astro'
import { HttpError } from './repo'

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

type Handler = (ctx: APIContext, user: NonNullable<App.Locals['user']>) => Promise<Response>

/** Auth check + uniform error handling for the JSON API. */
export const api = (fn: Handler) => async (ctx: APIContext): Promise<Response> => {
  const user = ctx.locals.user
  if (!user) return json({ success: false, error: 'Unauthorized' }, 401)
  try {
    return await fn(ctx, user)
  } catch (ex: any) {
    if (ex instanceof HttpError) return json({ success: false, error: ex.message }, ex.status)
    console.error(ex)
    return json({ success: false, error: 'Internal error' }, 500)
  }
}

export async function readBody (ctx: APIContext) {
  try { return await ctx.request.json() } catch { throw new HttpError(400, 'Invalid JSON body.') }
}

export function intParam (v: string | undefined) {
  const n = Number(v)
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(404, 'Not found.')
  return n
}
