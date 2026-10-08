import { api, intParam, json, readBody } from '../../../lib/http'
import { parseTaskInput } from '../../../lib/logic'
import { deleteTask, getTask, updateTask } from '../../../lib/repo'

export const GET = api(async ctx => {
  const task = await getTask(intParam(ctx.params.id))
  return task ? json(task) : json({ success: false, error: 'Checklist not found.' }, 404)
})

export const PUT = api(async ctx => {
  const parsed = parseTaskInput(await readBody(ctx))
  if ('error' in parsed) return json({ success: false, error: parsed.error }, 400)
  await updateTask(intParam(ctx.params.id), parsed.value)
  return json({ success: true })
})

export const DELETE = api(async ctx => {
  const ok = await deleteTask(intParam(ctx.params.id))
  return ok ? json({ success: true }) : json({ success: false, error: 'Checklist not found.' }, 404)
})
