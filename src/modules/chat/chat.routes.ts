import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { requireAuth } from '../../middlewares'
import type { AppBindings } from '../../types'
import { chatRequestSchema } from './chat.schema'
import { streamMapChat } from './chat.service'

export const chatRoutes = new Hono<AppBindings>().post(
  '/',
  requireAuth,
  zValidator('json', chatRequestSchema),
  async (c) => {
    const user = c.get('user')!
    const result = await streamMapChat(user.id, c.req.valid('json'))
    return result.toTextStreamResponse()
  },
)
