import { createApp } from '@/app'
import { env } from '@/config/env'

const app = createApp()

console.log(`🚀 imeji-server listening on http://localhost:${env.PORT}`)

export default {
  port: env.PORT,
  fetch: app.fetch,
}
