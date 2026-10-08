import { migrate } from '../src/lib/migrate'
import { pool } from '../src/lib/db'

const applied = await migrate()
console.log(applied.length ? `migrated: ${applied.join(', ')}` : 'database is up to date')
await pool.end()
