import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  TRUSTED_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) => s.split(',').map((v) => v.trim())),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5.4-mini'),

  RENDER_EXTERNAL_URL: z.string().url().optional(),
  KEEP_WARM_INTERVAL_MS: z.coerce.number().default(180_000),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  MAX_BODY_SIZE: z.coerce.number().default(1_048_576),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(15_000),
})

export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>

export const isProd = env.NODE_ENV === 'production'
export const isDev = env.NODE_ENV === 'development'
