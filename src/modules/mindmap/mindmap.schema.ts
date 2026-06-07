import { z } from 'zod'

export const mapIdParam = z.object({ mapId: z.string().uuid() })

export const conceptIdParam = z.object({
  mapId: z.string().uuid(),
  conceptId: z.string().uuid(),
})

export const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const masteryEnum = z.enum(['unknown', 'learning', 'known'])

export const createMindmapBody = z.object({
  title: z.string().trim().min(1).max(200),
})

export const updateMindmapBody = z.object({
  title: z.string().trim().min(1).max(200),
})

export const createConceptBody = z.object({
  label: z.string().trim().min(1).max(500),
  detail: z.string().max(5000).optional(),
  parentId: z.string().uuid().nullable().optional(),
  mastery: masteryEnum.optional(),
  position: z.number().int().min(0).optional(),
})

export const updateConceptBody = z
  .object({
    label: z.string().trim().min(1).max(500),
    detail: z.string().max(5000).nullable(),
    parentId: z.string().uuid().nullable(),
    mastery: masteryEnum,
    position: z.number().int().min(0),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })

export type CreateConceptInput = z.infer<typeof createConceptBody>
export type UpdateConceptInput = z.infer<typeof updateConceptBody>
