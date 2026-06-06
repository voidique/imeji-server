import type { Context } from 'hono'
import { getConnInfo } from 'hono/bun'
import { rateLimiter } from 'hono-rate-limiter'
import { env } from '@/config/env'
import type { AppBindings } from '@/types'

const clientKey = (c: Context<AppBindings>) => {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || getConnInfo(c).remote.address || 'unknown'
}

export const rateLimit = rateLimiter<AppBindings>({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  keyGenerator: clientKey,
})

export const authRateLimit = rateLimiter<AppBindings>({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  keyGenerator: clientKey,
})
