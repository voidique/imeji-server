import { env } from '../../config/env'
import { openai } from './providers'

export function defaultModel() {
  if (!openai) throw new Error('No AI provider configured (OPENAI_API_KEY)')
  return openai(env.OPENAI_MODEL)
}
