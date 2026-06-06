import { createOpenAI } from '@ai-sdk/openai'
import { env } from '@/config/env'

export const openai = env.OPENAI_API_KEY
  ? createOpenAI({ apiKey: env.OPENAI_API_KEY })
  : undefined
