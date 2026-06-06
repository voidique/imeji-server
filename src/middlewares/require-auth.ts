import { createMiddleware } from 'hono/factory'
import type { AppBindings } from '@/types'

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  if (!c.get('user')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})
