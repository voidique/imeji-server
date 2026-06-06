import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { requireAuth } from '@/middlewares'
import type { AppBindings } from '@/types'
import { chatRequestSchema } from './chat.schema'
import { streamChat } from './chat.service'

export const chatRoutes = new Hono<AppBindings>().post(
  '/',
  requireAuth,
  zValidator('json', chatRequestSchema),
  async (c) => {
    const { messages } = c.req.valid('json')
    const result = await streamChat(messages)
    return result.toUIMessageStreamResponse()
  },
)
