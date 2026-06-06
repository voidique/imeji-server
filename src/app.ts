import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import {
  bodyLimitMiddleware,
  corsMiddleware,
  csrfMiddleware,
  notFound,
  onError,
  rateLimit,
  securityHeaders,
  session,
} from '@/middlewares'
import { registerRoutes } from '@/routes'
import type { AppBindings } from '@/types'

export function createApp() {
  const app = new Hono<AppBindings>()

  app.use('*', requestId())
  app.use('*', logger())
  app.use('*', securityHeaders)
  app.use('*', corsMiddleware)
  app.use('*', rateLimit)
  app.use('*', bodyLimitMiddleware)
  app.use('*', csrfMiddleware)
  app.use('*', session)

  registerRoutes(app)

  app.notFound(notFound)
  app.onError(onError)

  return app
}

export type App = ReturnType<typeof createApp>
