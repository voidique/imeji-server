import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { requireAuth } from '@/middlewares'
import type { AppBindings } from '@/types'
import {
  conceptIdParam,
  createConceptBody,
  createMindmapBody,
  listQuery,
  mapIdParam,
  updateConceptBody,
  updateMindmapBody,
} from './mindmap.schema'
import {
  createConcept,
  createMindmap,
  deleteConcept,
  deleteMindmap,
  getMindmapWithConcepts,
  listMindmaps,
  updateConcept,
  updateMindmap,
} from './mindmap.service'
import { buildTree, toGraph, toMarkdown } from './mindmap.transform'

export const mindmapRoutes = new Hono<AppBindings>()
  .use('*', requireAuth)

  .get('/', zValidator('query', listQuery), async (c) => {
    const user = c.get('user')!
    const items = await listMindmaps(user.id, c.req.valid('query'))
    return c.json({ items })
  })

  .post('/', zValidator('json', createMindmapBody), async (c) => {
    const user = c.get('user')!
    const map = await createMindmap(user.id, c.req.valid('json').title)
    return c.json(map, 201)
  })

  .get('/:mapId', zValidator('param', mapIdParam), async (c) => {
    const user = c.get('user')!
    const { mapId } = c.req.valid('param')
    const { concepts, ...map } = await getMindmapWithConcepts(user.id, mapId)
    return c.json({ ...map, concepts: buildTree(concepts) })
  })

  .patch(
    '/:mapId',
    zValidator('param', mapIdParam),
    zValidator('json', updateMindmapBody),
    async (c) => {
      const user = c.get('user')!
      const { mapId } = c.req.valid('param')
      const map = await updateMindmap(user.id, mapId, c.req.valid('json').title)
      return c.json(map)
    },
  )

  .delete('/:mapId', zValidator('param', mapIdParam), async (c) => {
    const user = c.get('user')!
    await deleteMindmap(user.id, c.req.valid('param').mapId)
    return c.json({ ok: true })
  })

  .get('/:mapId/markdown', zValidator('param', mapIdParam), async (c) => {
    const user = c.get('user')!
    const { concepts, title } = await getMindmapWithConcepts(user.id, c.req.valid('param').mapId)
    const markdown = toMarkdown(title, buildTree(concepts))
    return c.body(markdown, 200, { 'Content-Type': 'text/markdown; charset=utf-8' })
  })

  .get('/:mapId/graph', zValidator('param', mapIdParam), async (c) => {
    const user = c.get('user')!
    const { concepts } = await getMindmapWithConcepts(user.id, c.req.valid('param').mapId)
    return c.json(toGraph(concepts))
  })

  .post(
    '/:mapId/concepts',
    zValidator('param', mapIdParam),
    zValidator('json', createConceptBody),
    async (c) => {
      const user = c.get('user')!
      const { mapId } = c.req.valid('param')
      const node = await createConcept(user.id, mapId, c.req.valid('json'))
      return c.json(node, 201)
    },
  )

  .patch(
    '/:mapId/concepts/:conceptId',
    zValidator('param', conceptIdParam),
    zValidator('json', updateConceptBody),
    async (c) => {
      const user = c.get('user')!
      const { mapId, conceptId } = c.req.valid('param')
      const node = await updateConcept(user.id, mapId, conceptId, c.req.valid('json'))
      return c.json(node)
    },
  )

  .delete('/:mapId/concepts/:conceptId', zValidator('param', conceptIdParam), async (c) => {
    const user = c.get('user')!
    const { mapId, conceptId } = c.req.valid('param')
    await deleteConcept(user.id, mapId, conceptId)
    return c.json({ ok: true })
  })
