import { api, json, readBody } from '../../../lib/http'
import { parseSurveyItems } from '../../../lib/logic'
import { notifySurvey } from '../../../lib/notify'
import { getSurvey, latestEntries, updateSurvey } from '../../../lib/repo'

export const GET = api(async ctx => {
  const survey = await getSurvey(ctx.params.id ?? '')
  return survey ? json(survey) : json({ success: false, error: 'Survey not found.' }, 404)
})

export const PUT = api(async (ctx, user) => {
  const id = ctx.params.id ?? ''
  const parsed = parseSurveyItems(await readBody(ctx))
  if ('error' in parsed) return json({ success: false, error: parsed.error }, 400)
  const updated = await updateSurvey(id, parsed.value, user)
  if (updated > 0) {
    const survey = await getSurvey(id)
    const rows = survey ? latestEntries(survey.entries) : []
    const count = (s: string) => rows.filter(r => r.status === s).length
    notifySurvey({ title: survey?.title ?? '', by: user.name, fail: count('FAIL'), warn: count('WARN'), info: count('INFO'), pass: count('PASS'), updated: true, surveyId: id })
  }
  return json({ success: true, updated })
})
