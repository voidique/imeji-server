import 'dotenv/config'
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { env } from './config/env'

const app = createApp()

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🚀 imeji-server listening on http://localhost:${info.port}`)
})
