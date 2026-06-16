import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../db/client'
import type { AppBindings } from '../../types'

export const systemRoutes = new Hono<AppBindings>()
  .get('/', (c) => c.json({ ok: true, service: 'imeji-server' }))
  .get('/healthz', async (c) => {
    await db.execute(sql`select 1`)
    return c.json({ ok: true, db: 'up' })
  })
  .get('/me', (c) => c.json({ user: c.get('user'), session: c.get('session') }))
