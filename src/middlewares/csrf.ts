import { csrf } from 'hono/csrf'
import { env } from '@/config/env'

export const csrfMiddleware = csrf({ origin: env.TRUSTED_ORIGINS })
