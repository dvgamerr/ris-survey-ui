import type { APIRoute } from 'astro'
import { sql } from 'kysely'
import { db } from '../../lib/db'

export const GET: APIRoute = async () => {
  try {
    await sql`SELECT 1`.execute(db)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 503, headers: { 'content-type': 'application/json' } })
  }
}
