import { createMiddleware } from 'hono/factory'
import { auth } from '../lib/auth'
import type { AppBindings } from '../types'

export const session = createMiddleware<AppBindings>(async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('user', result?.user ?? null)
  c.set('session', result?.session ?? null)
  await next()
})
