import { streamObject } from 'ai'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { mindmap } from '@/db/schema'
import { defaultModel } from '@/lib/ai'
import { httpError } from '@/lib/errors'
import { buildAssistPrompt, buildAssistSystem } from './mindmap.assist.prompt'
import { type AssistInput, proposalSchema } from './mindmap.ops.schema'

export async function assistMindmap(userId: string, mapId: string, input: AssistInput) {
  const map = await db.query.mindmap.findFirst({
    where: and(eq(mindmap.id, mapId), eq(mindmap.userId, userId)),
    with: { concepts: true },
  })
  if (!map) throw httpError(404, 'Mindmap not found')

  return streamObject({
    model: defaultModel(),
    schema: proposalSchema,
    schemaName: 'proposal',
    system: buildAssistSystem(),
    prompt: buildAssistPrompt(input, map.title, map.concepts),
    providerOptions: { openai: { reasoningEffort: 'low' } },
    onError: ({ error }) => console.error('[assist] stream error', error),
  })
}
