import { sql } from 'kysely'
import { db, type Status } from './db'
import type { SurveyItemInput, TaskInput } from './logic'

export const PAGE_SIZE = 100
export class HttpError extends Error {
  constructor (public status: number, message: string) { super(message) }
}

const offset = (page: number) => (Math.max(1, page) - 1) * PAGE_SIZE

/* ───────────────────────── tasks (checklists) ───────────────────────── */

export interface HomeRow { task_id: number, title: string, type: 1 | 2, at: Date }

/** Active checklists. type 1 = never used (shows creation time), type 2 = used (shows last use). */
export async function listHome (page = 1): Promise<HomeRow[]> {
  const { rows } = await sql<HomeRow>`
    SELECT t.task_id, t.title,
           CASE WHEN MAX(s.created_at) IS NULL THEN 1 ELSE 2 END AS type,
           COALESCE(MAX(s.created_at), t.created_at) AS at
    FROM tasks t
    LEFT JOIN surveys s ON s.task_id = t.task_id
    WHERE t.enabled
    GROUP BY t.task_id
    ORDER BY type ASC, at DESC, t.task_id DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset(page)}`.execute(db)
  return rows
}

export interface TaskItem { item_id: number, subject: string, description: string, sort_order: number }
export interface TaskDetail { task_id: number, title: string, created_at: Date, modified_at: Date | null, items: TaskItem[] }

export async function getTask (taskId: number): Promise<TaskDetail | null> {
  const task = await db.selectFrom('tasks').selectAll().where('task_id', '=', taskId).where('enabled', '=', true).executeTakeFirst()
  if (!task) return null
  const items = await db.selectFrom('task_items')
    .select(['item_id', 'subject', 'description', 'sort_order'])
    .where('task_id', '=', taskId).where('enabled', '=', true)
    .orderBy('sort_order').orderBy('item_id').execute()
  return { task_id: task.task_id, title: task.title, created_at: task.created_at, modified_at: task.modified_at, items }
}

const isUniqueViolation = (ex: any) => ex?.code === '23505'

export async function createTask (input: TaskInput): Promise<number> {
  try {
    return await db.transaction().execute(async trx => {
      const { task_id } = await trx.insertInto('tasks').values({ title: input.title, created_at: new Date() }).returning('task_id').executeTakeFirstOrThrow()
      await trx.insertInto('task_items').values(input.items.map((it, i) => ({
        task_id, subject: it.subject, description: it.description, sort_order: i + 1
      }))).execute()
      return task_id
    })
  } catch (ex) {
    if (isUniqueViolation(ex)) throw new HttpError(409, 'This Title is use already!')
    throw ex
  }
}

export async function updateTask (taskId: number, input: TaskInput): Promise<void> {
  try {
    await db.transaction().execute(async trx => {
      const task = await trx.selectFrom('tasks').select('task_id').where('task_id', '=', taskId).where('enabled', '=', true).forUpdate().executeTakeFirst()
      if (!task) throw new HttpError(404, 'Checklist not found.')
      await trx.updateTable('tasks').set({ title: input.title, modified_at: new Date() }).where('task_id', '=', taskId).execute()

      const current = await trx.selectFrom('task_items').select('item_id').where('task_id', '=', taskId).where('enabled', '=', true).execute()
      const known = new Set(current.map(c => c.item_id))
      const kept = new Set<number>()

      for (const [i, it] of input.items.entries()) {
        if (it.item_id && known.has(it.item_id)) {
          kept.add(it.item_id)
          await trx.updateTable('task_items').set({ subject: it.subject, description: it.description, sort_order: i + 1 }).where('item_id', '=', it.item_id).execute()
        } else {
          await trx.insertInto('task_items').values({ task_id: taskId, subject: it.subject, description: it.description, sort_order: i + 1 }).execute()
        }
      }
      // items that are no longer in the list are disabled (history keeps pointing at them)
      const removed = [...known].filter(id => !kept.has(id))
      if (removed.length) await trx.updateTable('task_items').set({ enabled: false, sort_order: 0 }).where('item_id', 'in', removed).execute()
    })
  } catch (ex) {
    if (isUniqueViolation(ex)) throw new HttpError(409, 'This Title is use already!')
    throw ex
  }
}

export async function deleteTask (taskId: number): Promise<boolean> {
  const r = await db.updateTable('tasks').set({ enabled: false, modified_at: new Date() }).where('task_id', '=', taskId).where('enabled', '=', true).executeTakeFirst()
  return Number(r.numUpdatedRows) > 0
}

/* ───────────────────────── surveys (submissions) ───────────────────────── */

export interface UserRef { id: string, name: string }

export async function createSurvey (taskId: number, items: SurveyItemInput[], user: UserRef): Promise<string> {
  return db.transaction().execute(async trx => {
    const task = await trx.selectFrom('tasks').select('task_id').where('task_id', '=', taskId).where('enabled', '=', true).executeTakeFirst()
    if (!task) throw new HttpError(404, 'Checklist not found.')
    const rows = await trx.selectFrom('task_items').select(['item_id', 'sort_order']).where('task_id', '=', taskId).where('enabled', '=', true).execute()
    const order = new Map(rows.map(r => [r.item_id, r.sort_order]))
    if (items.some(it => !order.has(it.item_id))) throw new HttpError(400, 'Item does not belong to this checklist.')
    if (items.length !== order.size) throw new HttpError(400, 'Please check every item.')

    const { survey_id } = await trx.insertInto('surveys').values({ task_id: taskId }).returning('survey_id').executeTakeFirstOrThrow()
    await trx.insertInto('submissions').values(items.map(it => ({
      survey_id, item_id: it.item_id, version: 1, status: it.status, remark: it.remark,
      user_id: user.id, user_name: user.name, sort_order: order.get(it.item_id)!
    }))).execute()
    return survey_id
  })
}

export interface SurveyRow {
  survey_id: string, title: string, created_at: Date, editors: string,
  fail: number, warn: number, info: number, pass: number
}

/** Latest submissions first; counts use the newest version of every item. */
export async function listSurveys (page = 1): Promise<SurveyRow[]> {
  const { rows } = await sql<SurveyRow>`
    SELECT sv.survey_id, t.title, sv.created_at,
      (SELECT string_agg(DISTINCT user_name, ', ') FROM submissions WHERE survey_id = sv.survey_id) AS editors,
      COUNT(*) FILTER (WHERE l.status = 'FAIL')::int AS fail,
      COUNT(*) FILTER (WHERE l.status = 'WARN')::int AS warn,
      COUNT(*) FILTER (WHERE l.status = 'INFO')::int AS info,
      COUNT(*) FILTER (WHERE l.status = 'PASS')::int AS pass
    FROM surveys sv
    JOIN tasks t ON t.task_id = sv.task_id
    JOIN LATERAL (
      SELECT DISTINCT ON (item_id) status FROM submissions WHERE survey_id = sv.survey_id ORDER BY item_id, version DESC
    ) l ON true
    GROUP BY sv.survey_id, t.title, sv.created_at
    ORDER BY sv.created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset(page)}`.execute(db)
  return rows
}

export interface SurveyEntry {
  item_id: number, subject: string, description: string, status: Status, remark: string,
  version: number, user_name: string, created_at: Date, sort_order: number
}
export interface SurveyDetail { survey_id: string, task_id: number, title: string, created_at: Date, editors: string, entries: SurveyEntry[] }

/** Every version of every item, ordered by item then newest version first. */
export async function getSurvey (surveyId: string): Promise<SurveyDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(surveyId)) return null
  const sv = await db.selectFrom('surveys').innerJoin('tasks', 'tasks.task_id', 'surveys.task_id')
    .select(['surveys.survey_id', 'surveys.task_id', 'tasks.title', 'surveys.created_at'])
    .where('surveys.survey_id', '=', surveyId).executeTakeFirst()
  if (!sv) return null
  const entries = await db.selectFrom('submissions').innerJoin('task_items', 'task_items.item_id', 'submissions.item_id')
    .select(['submissions.item_id', 'task_items.subject', 'task_items.description', 'submissions.status', 'submissions.remark',
      'submissions.version', 'submissions.user_name', 'submissions.created_at', 'submissions.sort_order'])
    .where('submissions.survey_id', '=', surveyId)
    .orderBy('submissions.sort_order').orderBy('submissions.item_id').orderBy('submissions.version', 'desc').execute()
  const editors = [...new Set(entries.slice().sort((a, b) => a.version - b.version).map(e => e.user_name))].join(', ')
  return { ...sv, editors, entries }
}

export const latestEntries = (entries: SurveyEntry[]) => {
  const seen = new Set<number>()
  return entries.filter(e => !seen.has(e.item_id) && !!seen.add(e.item_id))
}

/** Edit a past survey. Only items whose status/remark changed get a new version. Returns how many changed. */
export async function updateSurvey (surveyId: string, items: SurveyItemInput[], user: UserRef): Promise<number> {
  return db.transaction().execute(async trx => {
    const sv = await trx.selectFrom('surveys').select('survey_id').where('survey_id', '=', surveyId).forUpdate().executeTakeFirst()
    if (!sv) throw new HttpError(404, 'Survey not found.')
    const { rows: latest } = await sql<{ item_id: number, status: Status, remark: string, version: number, sort_order: number }>`
      SELECT DISTINCT ON (item_id) item_id, status, remark, version, sort_order
      FROM submissions WHERE survey_id = ${surveyId} ORDER BY item_id, version DESC`.execute(trx)
    const byItem = new Map(latest.map(l => [l.item_id, l]))
    let changed = 0
    for (const it of items) {
      const cur = byItem.get(it.item_id)
      if (!cur) throw new HttpError(400, 'Item does not belong to this survey.')
      if (cur.status === it.status && cur.remark === it.remark) continue
      await trx.insertInto('submissions').values({
        survey_id: surveyId, item_id: it.item_id, version: cur.version + 1, status: it.status, remark: it.remark,
        user_id: user.id, user_name: user.name, sort_order: cur.sort_order
      }).execute()
      changed++
    }
    return changed
  })
}
