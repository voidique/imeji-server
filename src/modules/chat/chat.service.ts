import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { defaultModel } from '@/lib/ai'

export async function streamChat(messages: UIMessage[]) {
  return streamText({
    model: defaultModel(),
    messages: await convertToModelMessages(messages),
  })
}
