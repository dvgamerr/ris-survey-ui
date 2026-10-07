import type { Status } from './db'

export const STATUSES: Status[] = ['FAIL', 'WARN', 'INFO']

export interface DraftItem {
  item_id?: number | null
  subject: string
  description?: string
}

/** trim and collapse inner whitespace, like the original title handling. */
export const normalizeText = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim()

export const TITLE_MAX = 50
export const SUBJECT_MAX = 50
export const DESCRIPTION_MAX = 500
export const REMARK_MAX = 500

export interface TaskInput {
  title: string
  items: { item_id: number | null, subject: string, description: string }[]
}

/** Validate + normalise the payload of "create/update checklist". Returns an error message in `error`. */
export function parseTaskInput (body: any): { error: string } | { value: TaskInput } {
  const title = normalizeText(body?.title)
  if (!title) return { error: "Don't spacing in text box !" }
  if (title.length > TITLE_MAX) return { error: `Title is too long (max ${TITLE_MAX}).` }
  if (!Array.isArray(body?.items) || body.items.length === 0) return { error: 'At least one list is required.' }

  const seen = new Set<string>()
  const items: TaskInput['items'] = []
  for (const raw of body.items) {
    const subject = normalizeText(raw?.subject)
    const description = String(raw?.description ?? '').trim()
    if (!subject) return { error: "Don't spacing in text box !" }
    if (subject.length > SUBJECT_MAX) return { error: `List name is too long (max ${SUBJECT_MAX}).` }
    if (description.length > DESCRIPTION_MAX) return { error: `Description is too long (max ${DESCRIPTION_MAX}).` }
    const key = subject.toLowerCase()
    if (seen.has(key)) return { error: 'list is same.' }
    seen.add(key)
    const id = Number(raw?.item_id)
    items.push({ item_id: Number.isInteger(id) && id > 0 ? id : null, subject, description })
  }
  return { value: { title, items } }
}

export interface SurveyItemInput {
  item_id: number
  status: Status
  remark: string
}

/** The UI sends {item_id, problem, status, reason}; collapse to the stored {status, remark}. */
export function parseSurveyItems (body: any): { error: string } | { value: SurveyItemInput[] } {
  if (!Array.isArray(body?.items) || body.items.length === 0) return { error: 'No items.' }
  const seen = new Set<number>()
  const value: SurveyItemInput[] = []
  for (const raw of body.items) {
    const item_id = Number(raw?.item_id)
    if (!Number.isInteger(item_id) || item_id <= 0) return { error: 'Invalid item.' }
    if (seen.has(item_id)) return { error: 'Duplicate item.' }
    seen.add(item_id)
    const problem = !!raw?.problem
    const status: Status = problem ? (STATUSES.includes(raw?.status) ? raw.status : 'FAIL') : 'PASS'
    const remark = problem ? String(raw?.reason ?? '').trim() : ''
    if (problem && !remark) return { error: 'Please describe the problem.' }
    if (remark.length > REMARK_MAX) return { error: `Reason is too long (max ${REMARK_MAX}).` }
    value.push({ item_id, status, remark })
  }
  return { value }
}

export interface Counts { fail: number, warn: number, info: number, pass: number }

/** The worst status wins: FAIL > WARN > INFO > PASS. */
export function worstStatus (c: Counts): Status | null {
  if (c.fail > 0) return 'FAIL'
  if (c.warn > 0) return 'WARN'
  if (c.info > 0) return 'INFO'
  if (c.pass > 0) return 'PASS'
  return null
}

export const statusColor: Record<Status, string> = { FAIL: 'danger', WARN: 'warning', INFO: 'info', PASS: 'success' }
export const statusIcon: Record<Status, string> = { FAIL: '✖', WARN: '⚠', INFO: 'ℹ', PASS: '✔' }
