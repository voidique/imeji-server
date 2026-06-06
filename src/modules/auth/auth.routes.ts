import { Hono } from 'hono'
import { timeout } from 'hono/timeout'
import { auth } from '@/lib/auth'
import { authRateLimit } from '@/middlewares'
import { env } from '@/config/env'
import type { AppBindings } from '@/types'

export const authRoutes = new Hono<AppBindings>()
  .use('*', authRateLimit)
  .use('*', timeout(env.REQUEST_TIMEOUT_MS))
  .on(['GET', 'POST'], '/*', (c) => auth.handler(c.req.raw))
