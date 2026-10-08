/** Hook for pushing a summary somewhere (LINE in the old system, where 2.1.0 only logged it). */
export interface SurveySummary {
  title: string
  by: string
  fail: number
  warn: number
  info: number
  pass: number
  updated: boolean
  surveyId: string
}

export function notifySurvey (s: SurveySummary) {
  console.info(`[notify] ${s.updated ? 'Updated' : 'Submitted'} "${s.title}" by ${s.by} (F:${s.fail} W:${s.warn} I:${s.info} P:${s.pass}) ${s.surveyId}`)
}
