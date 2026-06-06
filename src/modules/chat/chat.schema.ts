import type { UIMessage } from 'ai'
import { z } from 'zod'

export const chatRequestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>
