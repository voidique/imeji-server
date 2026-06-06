import { openai } from './providers'

export function defaultModel() {
  if (openai) return openai('gpt-4.1')
  throw new Error('No AI provider configured (OPENAI_API_KEY)')
}
