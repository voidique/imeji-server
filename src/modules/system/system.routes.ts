import { Hono } from 'hono'
import type { AppBindings } from '../../types'

export const systemRoutes = new Hono<AppBindings>()
  .get('/', (c) => c.json({ ok: true, service: 'imeji-server' }))
  .get('/me', (c) => c.json({ user: c.get('user'), session: c.get('session') }))
