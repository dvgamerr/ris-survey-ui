import { api, json, readBody } from '../../../lib/http'
import { parseTaskInput } from '../../../lib/logic'
import { createTask, listHome } from '../../../lib/repo'

export const GET = api(async ctx => json(await listHome(Number(ctx.url.searchParams.get('p')) || 1)))

export const POST = api(async ctx => {
  const parsed = parseTaskInput(await readBody(ctx))
  if ('error' in parsed) return json({ success: false, error: parsed.error }, 400)
  return json({ success: true, task_id: await createTask(parsed.value) }, 201)
})
