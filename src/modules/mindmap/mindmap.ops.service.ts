import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { concept, mindmap } from '@/db/schema'
import { httpError } from '@/lib/errors'
import type { Op } from './mindmap.ops.schema'
import { buildTree } from './mindmap.transform'

type ConceptPatch = Partial<typeof concept.$inferInsert>

function createsCycle(parentOf: Map<string, string | null>, nodeId: string, newParentId: string) {
  let cursor: string | null = newParentId
  while (cursor) {
    if (cursor === nodeId) return true
    cursor = parentOf.get(cursor) ?? null
  }
  return false
}

function removeSubtree(parentOf: Map<string, string | null>, known: Set<string>, id: string) {
  for (const [cid, pid] of parentOf) if (pid === id) removeSubtree(parentOf, known, cid)
  parentOf.delete(id)
  known.delete(id)
}

export async function applyOps(userId: string, mapId: string, ops: Op[]) {
  const [owned] = await db
    .select({ id: mindmap.id })
    .from(mindmap)
    .where(and(eq(mindmap.id, mapId), eq(mindmap.userId, userId)))
    .limit(1)
  if (!owned) throw httpError(404, 'Mindmap not found')

  const existing = await db.select().from(concept).where(eq(concept.mapId, mapId))
  const parentOf = new Map<string, string | null>()
  const known = new Set<string>()
  for (const c of existing) {
    parentOf.set(c.id, c.parentId)
    known.add(c.id)
  }

  const idMap: Record<string, string> = {}
  const resolveParent = (raw: string | null | undefined): string | null => {
    if (raw == null) return null
    if (idMap[raw]) return idMap[raw]
    if (known.has(raw)) return raw
    throw httpError(400, `parentId not found in this map: ${raw}`)
  }

  await db.transaction(async (tx) => {
    for (const op of ops) {
      if (op.op === 'add') {
        if (idMap[op.tempId]) throw httpError(400, `duplicate tempId: ${op.tempId}`)
        const id = crypto.randomUUID()
        const parentId = resolveParent(op.parentId)
        idMap[op.tempId] = id
        known.add(id)
        parentOf.set(id, parentId)
        await tx.insert(concept).values({
          id,
          mapId,
          parentId,
          label: op.label.trim().slice(0, 500),
          detail: op.detail?.trim() ? op.detail.trim().slice(0, 5000) : null,
          mastery: op.mastery ?? undefined,
          position: op.position ?? undefined,
        })
      } else if (op.op === 'update') {
        if (!known.has(op.id)) throw httpError(400, `unknown concept id: ${op.id}`)
        const patch: ConceptPatch = {}
        if (op.label != null) patch.label = op.label.trim().slice(0, 500)
        if (op.detail !== undefined)
          patch.detail = op.detail == null ? null : op.detail.trim().slice(0, 5000) || null
        if (op.mastery != null) patch.mastery = op.mastery
        if (op.position != null) patch.position = op.position
        if (op.parentId !== undefined) {
          const parentId = resolveParent(op.parentId)
          if (parentId === op.id) throw httpError(400, 'a concept cannot be its own parent')
          if (parentId && createsCycle(parentOf, op.id, parentId))
            throw httpError(400, 'update would create a cycle')
          patch.parentId = parentId
          parentOf.set(op.id, parentId)
        }
        if (Object.keys(patch).length === 0) continue
        patch.updatedAt = new Date()
        await tx
          .update(concept)
          .set(patch)
          .where(and(eq(concept.id, op.id), eq(concept.mapId, mapId)))
      } else if (op.op === 'move') {
        if (!known.has(op.id)) throw httpError(400, `unknown concept id: ${op.id}`)
        const parentId = resolveParent(op.parentId)
        if (parentId === op.id) throw httpError(400, 'a concept cannot be its own parent')
        if (parentId && createsCycle(parentOf, op.id, parentId))
          throw httpError(400, 'move would create a cycle')
        const patch: ConceptPatch = { parentId, updatedAt: new Date() }
        if (op.position != null) patch.position = op.position
        await tx
          .update(concept)
          .set(patch)
          .where(and(eq(concept.id, op.id), eq(concept.mapId, mapId)))
        parentOf.set(op.id, parentId)
      } else {
        if (!known.has(op.id)) throw httpError(400, `unknown concept id: ${op.id}`)
        await tx.delete(concept).where(and(eq(concept.id, op.id), eq(concept.mapId, mapId)))
        removeSubtree(parentOf, known, op.id)
      }
    }
    await tx.update(mindmap).set({ updatedAt: new Date() }).where(eq(mindmap.id, mapId))
  })

  const after = await db.query.mindmap.findFirst({
    where: and(eq(mindmap.id, mapId), eq(mindmap.userId, userId)),
    with: { concepts: true },
  })
  if (!after) throw httpError(404, 'Mindmap not found')
  const { concepts: rows, ...map } = after
  return { ...map, concepts: buildTree(rows), idMap }
}
