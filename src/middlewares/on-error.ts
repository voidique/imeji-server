import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { isProd } from '../config/env'
import type { AppBindings } from '../types'

export const onError: ErrorHandler<AppBindings> = (err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(`[${c.get('requestId')}]`, err)
  return c.json({ error: isProd ? 'Internal Server Error' : err.message }, 500)
}
