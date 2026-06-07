import { z } from 'zod'

export const chatRequestSchema = z.object({
  mapId: z.string().uuid().nullish(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(20000),
      }),
    )
    .min(1),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>
