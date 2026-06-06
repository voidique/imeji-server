import type { NotFoundHandler } from 'hono'

export const notFound: NotFoundHandler = (c) => c.json({ error: 'Not Found' }, 404)
