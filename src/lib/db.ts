import { Kysely, PostgresDialect, type ColumnType, type Generated } from 'kysely'
import pg from 'pg'

type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>

export type Status = 'PASS' | 'FAIL' | 'WARN' | 'INFO'

export interface TasksTable {
  task_id: Generated<number>
  title: string
  enabled: Generated<boolean>
  created_at: Timestamp
  modified_at: ColumnType<Date | null, Date | string | null | undefined, Date | string | null>
}

export interface TaskItemsTable {
  item_id: Generated<number>
  task_id: number
  subject: string
  description: Generated<string>
  sort_order: number
  enabled: Generated<boolean>
  created_at: Timestamp
}

export interface SurveysTable {
  survey_id: Generated<string>
  task_id: number
  created_at: Timestamp
}

export interface SubmissionsTable {
  submission_id: Generated<number>
  survey_id: string
  item_id: number
  version: number
  status: Status
  remark: Generated<string>
  user_id: string
  user_name: string
  sort_order: number
  created_at: Timestamp
}

export interface Database {
  tasks: TasksTable
  task_items: TaskItemsTable
  surveys: SurveysTable
  submissions: SubmissionsTable
}

export const DATABASE_URL = process.env.DATABASE_URL || 'postgres://survey:survey@localhost:5432/survey'

export const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 10 })

export const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })
