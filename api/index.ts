import { handle } from 'hono/vercel'
import { createApp } from '../src/app'

export const config = { runtime: 'nodejs', maxDuration: 60 }

const app = createApp()

export default handle(app)
