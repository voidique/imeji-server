import type { Hono } from 'hono'
import { authRoutes } from '@/modules/auth/auth.routes'
import { chatRoutes } from '@/modules/chat/chat.routes'
import { systemRoutes } from '@/modules/system/system.routes'
import type { AppBindings } from '@/types'

export function registerRoutes(app: Hono<AppBindings>) {
  app.route('/', systemRoutes)
  app.route('/api/auth', authRoutes)
  app.route('/api/chat', chatRoutes)
}
