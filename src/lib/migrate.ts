import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration'
import { getMigrations } from 'better-auth/db/migration'
import { auth } from './auth'
import { db } from './db'
import * as init from '../migrations/001_init'

const provider: MigrationProvider = {
  async getMigrations (): Promise<Record<string, Migration>> {
    return { '001_init': init as Migration }
  }
}

export async function migrate () {
  const { error, results } = await new Migrator({ db, provider }).migrateToLatest()
  if (error) throw error
  const applied = (results || []).filter(r => r.status === 'Success').map(r => r.migrationName)
  const { runMigrations } = await getMigrations(auth.options)
  await runMigrations()
  return applied
}
