# imeji-server

Backend API for a brainstorming / knowledge-visualization app. A user brainstorms a topic, concepts are stored as a tree, and the frontend renders that tree as a markmap mindmap and as a force-directed knowledge graph.

Built with Hono on Bun. Authentication via better-auth (bearer tokens), data in Neon Postgres through Drizzle, AI streaming via the Vercel AI SDK.

## Stack

| Area | Package |
|------|---------|
| Runtime | Bun |
| Framework | Hono 4 |
| Auth | better-auth 1.6 (drizzle adapter, `pg`, bearer plugin) |
| Database | Neon serverless Postgres + drizzle-orm 0.45 |
| AI | ai 6 + @ai-sdk/openai |
| Validation | zod 4 + @hono/zod-validator |

## Getting started

```bash
cp .env.example .env          # set DATABASE_URL (Neon) and BETTER_AUTH_SECRET
bun install
bun run db:generate           # schema -> SQL migration
bun run db:migrate            # apply to Neon
bun run dev
```

- `BETTER_AUTH_SECRET`: generate with `openssl rand -base64 32`
- AI chat requires `OPENAI_API_KEY`

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Hot-reload dev server |
| `bun run start` | Production run |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run db:generate` | drizzle-kit: schema -> SQL |
| `bun run db:migrate` | Apply migrations (Bun runtime migrator) |
| `bun run db:push` | Push schema directly without migrations (dev) |
| `bun run db:studio` | Drizzle Studio |

## Project structure

```
src/
  index.ts                  # server entry (Bun.serve config)
  app.ts                    # createApp(): middleware + registerRoutes
  routes.ts                 # mounts module routers
  types.ts                  # global Hono types (AppBindings)
  config/
    env.ts                  # zod env validation (fail-fast)
  db/
    client.ts               # Neon serverless + drizzle client
    migrate.ts              # migration apply script
    schema/
      auth.ts               # better-auth core tables
      mindmap.ts            # mindmap + concept tables
      index.ts              # schema barrel
  lib/
    auth.ts                 # better-auth instance
    errors.ts               # JSON error helper
    ai/
      providers.ts          # openai instance
      models.ts             # model selection
      index.ts              # barrel
  middlewares/
    cors.ts                 # CORS
    security-headers.ts     # security headers (HSTS/CSP/COOP...)
    csrf.ts                 # CSRF (Origin check)
    rate-limit.ts           # rate limiting (global + stricter auth)
    body-limit.ts           # request body size cap
    session.ts              # session injection
    require-auth.ts         # auth guard
    not-found.ts            # 404 handler
    on-error.ts             # global error handler
    index.ts                # barrel
  modules/
    system/system.routes.ts # / , /me
    auth/auth.routes.ts     # /api/auth/* (better-auth handler)
    chat/                   # AI streaming chat (routes/service/schema)
    mindmap/                # mindmap + concept CRUD (routes/service/schema/transform)
drizzle/                    # generated SQL migrations
drizzle.config.ts
```

## Data model

- **Mindmap** — a knowledge map owned by one user (`id`, `userId`, `title`, timestamps).
- **Concept** — a node in a map's tree (`id`, `mapId`, `parentId`, `label`, `detail`, `mastery`, `position`, timestamps). `parentId` is null for roots; `mastery` is `unknown | learning | known`.

A single `concept` table feeds both visualizations: the parent/position hierarchy renders as a markmap tree, and the parent→child edges render as a force-directed graph (node color by `mastery`).

## Authentication

better-auth with the `bearer()` plugin. Clients authenticate via the `Authorization: Bearer <token>` header (cookies also supported).

```bash
# sign in -> token is in the set-auth-token response header (and body)
curl -i -X POST $API/api/auth/sign-in/email \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.com","password":"password1234"}'

# call protected endpoints
curl $API/api/mindmaps -H "Authorization: Bearer <token>"
```

All `/api/mindmaps/*` endpoints require authentication and are scoped to the owner. Accessing another user's resource returns `404` (existence is hidden).

## Security

Global middleware chain (`app.ts`, in order):

| Middleware | Protects against |
|------------|------------------|
| `securityHeaders` | clickjacking, MIME sniffing, info leakage (HSTS, X-Frame-Options: DENY, CSP `default-src 'none'`, nosniff, COOP/COEP/CORP) |
| `corsMiddleware` | unauthorized cross-origin access — only `TRUSTED_ORIGINS`, credentials enabled |
| `rateLimit` | DDoS / abuse — per-IP (or `X-Forwarded-For`) window, 429 on excess |
| `bodyLimitMiddleware` | large-payload DoS — 413 above `MAX_BODY_SIZE` |
| `csrfMiddleware` | form-based CSRF — Origin checked for state-changing requests (JSON/Bearer requests pass) |
| `session` | session injection (then `requireAuth` guards routes) |

Per-route hardening: `/api/auth/*` adds a stricter rate limit and a request timeout (brute-force / slowloris mitigation); streaming responses (`/api/chat`) intentionally skip the timeout.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/me` | Current session/user |
| ALL | `/api/auth/*` | better-auth (sign-up/in/out, session, ...) |
| POST | `/api/chat` | 🔒 AI streaming chat (useChat-compatible) |
| GET | `/api/mindmaps` | 🔒 List my maps (`?limit&offset`, includes concept count) |
| POST | `/api/mindmaps` | 🔒 Create map `{ title }` |
| GET | `/api/mindmaps/:id` | 🔒 Map detail + concept **tree** |
| PATCH | `/api/mindmaps/:id` | 🔒 Update map `{ title }` |
| DELETE | `/api/mindmaps/:id` | 🔒 Delete map (concepts cascade) |
| GET | `/api/mindmaps/:id/markdown` | 🔒 Markdown for markmap (text/markdown) |
| GET | `/api/mindmaps/:id/graph` | 🔒 `{ nodes, links }` for force-graph |
| POST | `/api/mindmaps/:id/concepts` | 🔒 Add concept `{ label, detail?, parentId?, mastery?, position? }` |
| PATCH | `/api/mindmaps/:id/concepts/:cid` | 🔒 Update concept (partial, cycle-guarded) |
| DELETE | `/api/mindmaps/:id/concepts/:cid` | 🔒 Delete concept (descendants cascade) |

🔒 = authentication required. State-changing requests must use `application/json`.
