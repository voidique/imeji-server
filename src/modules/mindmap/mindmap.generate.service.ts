import { streamObject } from 'ai'
import { db } from '../../db/client'
import { concept, mindmap } from '../../db/schema'
import { defaultModel } from '../../lib/ai'
import { buildSystemPrompt, buildUserPrompt } from './mindmap.generate.prompt'
import { conceptTreeSchema, type GenerateInput } from './mindmap.generate.schema'
import { flattenGeneratedTree } from './mindmap.transform'

export function generateMindmap(userId: string, mapId: string, input: GenerateInput) {
  return streamObject({
    model: defaultModel(),
    schema: conceptTreeSchema,
    schemaName: 'mindmap',
    system: buildSystemPrompt(),
    prompt: buildUserPrompt(input),
    providerOptions: { openai: { reasoningEffort: 'low', textVerbosity: 'low' } },
    onError: ({ error }) => console.error('[generate] stream error', error),
    onFinish: async ({ object }) => {
      if (!object) return
      const title =
        (input.title || object.title || input.source.origin || 'Untitled').trim() || 'Untitled'
      const rows = flattenGeneratedTree(mapId, object.concepts)
      await db.transaction(async (tx) => {
        await tx.insert(mindmap).values({ id: mapId, userId, title })
        if (rows.length) await tx.insert(concept).values(rows)
      })
    },
  })
}
