import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export function httpError(status: ContentfulStatusCode, message: string) {
  return new HTTPException(status, {
    res: Response.json({ error: message }, { status }),
  })
}
