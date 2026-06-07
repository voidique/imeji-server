import { type ModelMessage, streamText } from 'ai'
import { defaultModel } from '@/lib/ai'
import { getMindmapMarkdown } from '@/modules/mindmap/mindmap.service'
import type { ChatRequest } from './chat.schema'

export async function streamMapChat(userId: string, { mapId, messages }: ChatRequest) {
  let system: string | undefined
  if (mapId) {
    const { title, markdown } = await getMindmapMarkdown(userId, mapId)
    system = [
      `You are answering questions about the user's mind map titled "${title}".`,
      'Answer ONLY using the map content below. If the answer is not derivable from it, say it is not in the map.',
      '',
      '--- MAP START ---',
      markdown,
      '--- MAP END ---',
    ].join('\n')
  }

  return streamText({
    model: defaultModel(),
    system,
    messages: messages as ModelMessage[],
    providerOptions: { openai: { reasoningEffort: 'low' } },
  })
}
