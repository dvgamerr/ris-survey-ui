import { sql, type Kysely } from 'kysely'

export async function up (db: Kysely<any>) {
  await db.schema
    .createTable('tasks')
    .addColumn('task_id', 'serial', c => c.primaryKey())
    .addColumn('title', 'varchar(50)', c => c.notNull())
    .addColumn('enabled', 'boolean', c => c.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .addColumn('modified_at', 'timestamptz')
    .execute()
  // an active title must be unique (case-insensitive); soft-deleted ones free the name again
  await sql`CREATE UNIQUE INDEX tasks_title_active_uq ON tasks (lower(title)) WHERE enabled`.execute(db)

  await db.schema
    .createTable('task_items')
    .addColumn('item_id', 'serial', c => c.primaryKey())
    .addColumn('task_id', 'integer', c => c.notNull().references('tasks.task_id').onDelete('cascade'))
    .addColumn('subject', 'varchar(50)', c => c.notNull())
    .addColumn('description', 'varchar(500)', c => c.notNull().defaultTo(''))
    .addColumn('sort_order', 'integer', c => c.notNull())
    .addColumn('enabled', 'boolean', c => c.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex('task_items_task_idx').on('task_items').column('task_id').execute()

  await db.schema
    .createTable('surveys')
    .addColumn('survey_id', 'uuid', c => c.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('task_id', 'integer', c => c.notNull().references('tasks.task_id'))
    .addColumn('created_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex('surveys_created_idx').on('surveys').column('created_at').execute()

  await db.schema
    .createTable('submissions')
    .addColumn('submission_id', 'serial', c => c.primaryKey())
    .addColumn('survey_id', 'uuid', c => c.notNull().references('surveys.survey_id').onDelete('cascade'))
    .addColumn('item_id', 'integer', c => c.notNull().references('task_items.item_id'))
    .addColumn('version', 'integer', c => c.notNull().defaultTo(1))
    .addColumn('status', 'varchar(4)', c => c.notNull().check(sql`status IN ('PASS','FAIL','WARN','INFO')`))
    .addColumn('remark', 'varchar(500)', c => c.notNull().defaultTo(''))
    .addColumn('user_id', 'text', c => c.notNull())
    .addColumn('user_name', 'text', c => c.notNull())
    .addColumn('sort_order', 'integer', c => c.notNull())
    .addColumn('created_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('submissions_version_uq', ['survey_id', 'item_id', 'version'])
    .execute()
}

export async function down (db: Kysely<any>) {
  await db.schema.dropTable('submissions').execute()
  await db.schema.dropTable('surveys').execute()
  await db.schema.dropTable('task_items').execute()
  await db.schema.dropTable('tasks').execute()
}
