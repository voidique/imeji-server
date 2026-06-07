import { z } from 'zod'

export const masteryEnum = z.enum(['unknown', 'learning', 'known'])

// ── AI proposal output (OpenAI strict: every key present, optionals nullable) ──
const aiAddOp = z.object({
  op: z.literal('add'),
  tempId: z.string().describe('unique id within this batch for the new node'),
  parentId: z.string().nullable().describe('existing concept id, an earlier tempId, or null for root'),
  label: z.string(),
  detail: z.string().nullable(),
  mastery: masteryEnum.nullable(),
  position: z.number().int().nullable(),
})
const aiUpdateOp = z.object({
  op: z.literal('update'),
  id: z.string().describe('existing concept id in this map'),
  label: z.string().nullable(),
  detail: z.string().nullable(),
  mastery: masteryEnum.nullable(),
  parentId: z.string().nullable(),
  position: z.number().int().nullable(),
})
const aiDeleteOp = z.object({
  op: z.literal('delete'),
  id: z.string().describe('existing concept id; deletes it and its descendants'),
})
const aiMoveOp = z.object({
  op: z.literal('move'),
  id: z.string(),
  parentId: z.string().nullable(),
  position: z.number().int().nullable(),
})

export const aiOpSchema = z.union([aiAddOp, aiUpdateOp, aiDeleteOp, aiMoveOp])

export const proposalSchema = z.object({
  summary: z.string().describe('short description of the proposed change set'),
  ops: z.array(aiOpSchema),
})

export type Proposal = z.infer<typeof proposalSchema>

// ── /ops input (lenient: optionals optional or null) ──
const addOp = z.object({
  op: z.literal('add'),
  tempId: z.string().min(1),
  parentId: z.string().nullish(),
  label: z.string().trim().min(1).max(500),
  detail: z.string().max(5000).nullish(),
  mastery: masteryEnum.nullish(),
  position: z.number().int().min(0).nullish(),
})
const updateOp = z.object({
  op: z.literal('update'),
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(500).nullish(),
  detail: z.string().max(5000).nullish(),
  mastery: masteryEnum.nullish(),
  parentId: z.string().nullish(),
  position: z.number().int().min(0).nullish(),
})
const deleteOp = z.object({ op: z.literal('delete'), id: z.string().uuid() })
const moveOp = z.object({
  op: z.literal('move'),
  id: z.string().uuid(),
  parentId: z.string().nullish(),
  position: z.number().int().min(0).nullish(),
})

export const opSchema = z.discriminatedUnion('op', [addOp, updateOp, deleteOp, moveOp])
export type Op = z.infer<typeof opSchema>

export const opsRequestSchema = z.object({
  ops: z.array(opSchema).min(1).max(200),
})

export const assistRequestSchema = z.object({
  instruction: z.string().trim().min(1).max(4000),
  selection: z.array(z.string().uuid()).nullish(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(20000) }))
    .nullish(),
})
export type AssistInput = z.infer<typeof assistRequestSchema>
