import { api, intParam, json, readBody } from '../../../lib/http'
import { parseSurveyItems } from '../../../lib/logic'
import { notifySurvey } from '../../../lib/notify'
import { createSurvey, getSurvey, getTask, latestEntries } from '../../../lib/repo'

export const POST = api(async (ctx, user) => {
  const body = await readBody(ctx)
  const parsed = parseSurveyItems(body)
  if ('error' in parsed) return json({ success: false, error: parsed.error }, 400)
  const taskId = intParam(String(body.task_id))
  const surveyId = await createSurvey(taskId, parsed.value, user)

  const [task, survey] = [await getTask(taskId), await getSurvey(surveyId)]
  const rows = survey ? latestEntries(survey.entries) : []
  const count = (s: string) => rows.filter(r => r.status === s).length
  notifySurvey({ title: task?.title ?? '', by: user.name, fail: count('FAIL'), warn: count('WARN'), info: count('INFO'), pass: count('PASS'), updated: false, surveyId })
  return json({ success: true, survey_id: surveyId }, 201)
})
