import type { Concept } from '../../db/schema'
import type { AssistInput } from './mindmap.ops.schema'
import { serializeConcepts } from './mindmap.transform'

export function buildAssistSystem() {
  return [
    'You propose edits to a mind map as an ordered list of ops. You DO NOT apply them.',
    '',
    'Rules:',
    '- Use ONLY concept ids that appear in the provided map. Never invent an id for an existing node.',
    '- For a new node use op "add" with a unique "tempId" you choose (e.g. "t1"). A later op may reference that tempId as parentId, but only AFTER the add.',
    '- "update", "delete", and "move" must target an existing concept id from the map.',
    '- parentId: an existing id, an earlier tempId, or null for a root. Never create a cycle (a node cannot become a descendant of itself).',
    '- Propose only what the instruction asks for; keep the op list minimal.',
    '- Labels are short. Details are grounded and optional (null when there is none).',
    '- "summary": one short sentence describing the change set.',
  ].join('\n')
}

export function buildAssistPrompt(input: AssistInput, title: string, concepts: Concept[]) {
  const parts = [`Map title: ${title}`, '', 'Current concepts:', serializeConcepts(concepts)]

  if (input.selection?.length) {
    parts.push('', `User-selected concept ids: ${input.selection.join(', ')}`)
  }
  if (input.messages?.length) {
    parts.push('', 'Prior conversation:')
    for (const m of input.messages) parts.push(`${m.role}: ${m.content}`)
  }
  parts.push('', `Instruction: ${input.instruction}`)
  return parts.join('\n')
}
