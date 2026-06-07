import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { type Concept, concept, mindmap } from '@/db/schema'
import { httpError } from '@/lib/errors'
import type { CreateConceptInput, UpdateConceptInput } from './mindmap.schema'
import { buildTree, toMarkdown } from './mindmap.transform'

async function getOwnedMap(userId: string, mapId: string) {
  const [row] = await db
    .select()
    .from(mindmap)
    .where(and(eq(mindmap.id, mapId), eq(mindmap.userId, userId)))
    .limit(1)
  if (!row) throw httpError(404, 'Mindmap not found')
  return row
}

async function touchMap(mapId: string) {
  await db.update(mindmap).set({ updatedAt: new Date() }).where(eq(mindmap.id, mapId))
}

function createsCycle(concepts: Concept[], conceptId: string, newParentId: string) {
  const byId = new Map(concepts.map((c) => [c.id, c]))
  let cursor: string | null = newParentId
  while (cursor) {
    if (cursor === conceptId) return true
    cursor = byId.get(cursor)?.parentId ?? null
  }
  return false
}

export function listMindmaps(userId: string, opts: { limit: number; offset: number }) {
  return db
    .select({
      id: mindmap.id,
      title: mindmap.title,
      conceptCount: count(concept.id),
      createdAt: mindmap.createdAt,
      updatedAt: mindmap.updatedAt,
    })
    .from(mindmap)
    .leftJoin(concept, eq(concept.mapId, mindmap.id))
    .where(eq(mindmap.userId, userId))
    .groupBy(mindmap.id)
    .orderBy(desc(mindmap.updatedAt))
    .limit(opts.limit)
    .offset(opts.offset)
}

export async function createMindmap(userId: string, title: string) {
  const [row] = await db.insert(mindmap).values({ userId, title }).returning()
  return row
}

export async function getMindmapWithConcepts(userId: string, mapId: string) {
  const map = await db.query.mindmap.findFirst({
    where: and(eq(mindmap.id, mapId), eq(mindmap.userId, userId)),
    with: { concepts: true },
  })
  if (!map) throw httpError(404, 'Mindmap not found')
  return map
}

export async function getMindmapMarkdown(userId: string, mapId: string) {
  const map = await getMindmapWithConcepts(userId, mapId)
  return { title: map.title, markdown: toMarkdown(map.title, buildTree(map.concepts)) }
}

export async function updateMindmap(userId: string, mapId: string, title: string) {
  await getOwnedMap(userId, mapId)
  const [row] = await db
    .update(mindmap)
    .set({ title, updatedAt: new Date() })
    .where(eq(mindmap.id, mapId))
    .returning()
  return row
}

export async function deleteMindmap(userId: string, mapId: string) {
  await getOwnedMap(userId, mapId)
  await db.delete(mindmap).where(eq(mindmap.id, mapId))
}

export async function createConcept(userId: string, mapId: string, input: CreateConceptInput) {
  await getOwnedMap(userId, mapId)

  if (input.parentId) {
    const [parent] = await db
      .select({ id: concept.id })
      .from(concept)
      .where(and(eq(concept.id, input.parentId), eq(concept.mapId, mapId)))
      .limit(1)
    if (!parent) throw httpError(400, 'parentId not found in this mindmap')
  }

  const [row] = await db
    .insert(concept)
    .values({
      mapId,
      parentId: input.parentId ?? null,
      label: input.label,
      detail: input.detail,
      mastery: input.mastery,
      position: input.position,
    })
    .returning()
  await touchMap(mapId)
  return row
}

export async function updateConcept(
  userId: string,
  mapId: string,
  conceptId: string,
  input: UpdateConceptInput,
) {
  await getOwnedMap(userId, mapId)

  const concepts = await db.select().from(concept).where(eq(concept.mapId, mapId))
  const target = concepts.find((c) => c.id === conceptId)
  if (!target) throw httpError(404, 'Concept not found')

  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === conceptId) throw httpError(400, 'A concept cannot be its own parent')
    if (!concepts.some((c) => c.id === input.parentId))
      throw httpError(400, 'parentId not found in this mindmap')
    if (createsCycle(concepts, conceptId, input.parentId))
      throw httpError(400, 'Move would create a cycle')
  }

  const [row] = await db
    .update(concept)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(concept.id, conceptId), eq(concept.mapId, mapId)))
    .returning()
  await touchMap(mapId)
  return row
}

export async function deleteConcept(userId: string, mapId: string, conceptId: string) {
  await getOwnedMap(userId, mapId)
  const deleted = await db
    .delete(concept)
    .where(and(eq(concept.id, conceptId), eq(concept.mapId, mapId)))
    .returning({ id: concept.id })
  if (deleted.length === 0) throw httpError(404, 'Concept not found')
  await touchMap(mapId)
}
