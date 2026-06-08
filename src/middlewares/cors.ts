import { cors } from 'hono/cors'
import { env } from '../config/env'

export const corsMiddleware = cors({
  origin: env.TRUSTED_ORIGINS,
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'x-mindmap-id'],
  maxAge: 600,
})
