import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import { db } from './client'

await migrate(db, { migrationsFolder: './drizzle' })
console.log('✅ migrations applied')
process.exit(0)
