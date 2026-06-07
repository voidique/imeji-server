import { z } from 'zod'

export const generateRequestSchema = z.object({
  title: z.string().trim().min(1).max(200).nullish(),
  source: z.object({
    kind: z.enum(['text', 'pdf', 'pptx', 'docx', 'hwpx', 'youtube']),
    origin: z.string().max(2000).nullish(),
    lang: z.string().max(20).nullish(),
  }),
  content: z.string().min(1).max(200_000),
})

export type GenerateInput = z.infer<typeof generateRequestSchema>

export type GeneratedConcept = {
  label: string
  detail: string | null
  children: GeneratedConcept[] | null
}

export const generatedConceptSchema: z.ZodType<GeneratedConcept> = z.lazy(() =>
  z.object({
    label: z.string().describe('Concise concept name (2-6 words), grounded in the source'),
    detail: z
      .string()
      .nullable()
      .describe('Faithful 1-2 sentence explanation from the source; null if unsupported'),
    children: z
      .array(generatedConceptSchema)
      .nullable()
      .describe('Sub-concepts; null or empty if none'),
  }),
)

export const conceptTreeSchema = z.object({
  title: z.string().describe('Short title for the whole mind map, in the source language'),
  concepts: z.array(generatedConceptSchema).describe('Top-level concepts (main themes)'),
})

export type ConceptTree = z.infer<typeof conceptTreeSchema>
