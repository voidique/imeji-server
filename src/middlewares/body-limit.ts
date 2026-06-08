import { bodyLimit } from 'hono/body-limit'
import { env } from '../config/env'

export const bodyLimitMiddleware = bodyLimit({
  maxSize: env.MAX_BODY_SIZE,
  onError: (c) => c.json({ error: 'Payload Too Large' }, 413),
})
