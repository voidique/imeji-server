# imeji-server

Hono + Bun 백엔드. 인증은 **better-auth**, DB는 **Neon Postgres + Drizzle**, AI는 **Vercel AI SDK v6**.

## Stack (2026-06 기준)

| 영역 | 패키지 |
|------|--------|
| Runtime | Bun |
| Framework | Hono 4 |
| Auth | better-auth 1.6 (drizzle adapter, `pg`) |
| DB | Neon serverless + drizzle-orm 0.45 |
| AI | ai 6 + @ai-sdk/openai |
| Validation | zod 4 + @hono/zod-validator |

## 시작하기

```bash
cp .env.example .env          # DATABASE_URL(Neon), BETTER_AUTH_SECRET 채우기
bun install
bun run db:generate           # 스키마 → SQL 마이그레이션 생성
bun run db:migrate            # Neon 에 적용
bun run dev
```

- `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
- AI 채팅은 `OPENAI_API_KEY` 필요

## 스크립트

| 명령 | 설명 |
|------|------|
| `bun run dev` | 핫리로드 개발 서버 |
| `bun run start` | 프로덕션 실행 |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run db:generate` | drizzle-kit: 스키마 → SQL |
| `bun run db:migrate` | Bun 런타임 마이그레이터로 적용 |
| `bun run db:push` | 마이그레이션 없이 스키마 직접 반영 (개발용) |
| `bun run db:studio` | Drizzle Studio |

## 폴더 구조

```
src/
  index.ts                  # 서버 진입점 (Bun.serve 설정)
  app.ts                    # createApp(): 미들웨어 등록 + registerRoutes
  routes.ts                 # 모듈 라우터를 앱에 마운트
  types.ts                  # Hono 전역 타입 (AppBindings)
  config/
    env.ts                  # zod 환경변수 검증 (fail-fast)
  db/
    client.ts               # Neon serverless + drizzle 클라이언트
    migrate.ts              # 마이그레이션 적용 스크립트
    schema/
      auth.ts               # better-auth 코어 테이블
      index.ts              # 스키마 배럴
  lib/
    auth.ts                 # better-auth 인스턴스
    ai/
      providers.ts          # openai 인스턴스
      models.ts             # 모델 선택
      index.ts              # 배럴
  middlewares/
    cors.ts                 # CORS
    security-headers.ts     # 보안 헤더 (HSTS/CSP/COOP 등)
    csrf.ts                 # CSRF (Origin 검증)
    rate-limit.ts           # rate limit (전역 + auth 강화)
    body-limit.ts           # 본문 크기 제한
    session.ts              # 세션 주입
    require-auth.ts         # 인증 가드
    not-found.ts            # 404 핸들러
    on-error.ts             # 전역 에러 핸들러
    index.ts                # 배럴
  modules/
    system/system.routes.ts # / , /me
    auth/auth.routes.ts     # /api/auth/* (better-auth 위임)
    chat/
      chat.routes.ts        # HTTP 레이어
      chat.service.ts       # 비즈니스 로직 (AI 스트리밍)
      chat.schema.ts        # zod 요청 스키마
drizzle/                    # 생성된 SQL 마이그레이션
drizzle.config.ts
```

### 설계 원칙

- **한 파일 = 한 책임** — 미들웨어·핸들러를 역할 단위로 분리하고 배럴(`index.ts`)로 묶음.
- **app / server / routes 분리** — `app.ts`는 조립, `routes.ts`는 마운트, `index.ts`는 부팅. 테스트에서 `createApp().request()` 가능.
- **수직 슬라이스(modules)** — 기능마다 routes/service/schema. 라우트는 얇게, 로직은 service로.
- **`lib` vs `modules`** — `lib`는 SDK 인스턴스 등 횡단 관심사, `modules`는 도메인 기능.
- **경로 별칭** — `@/*` → `src/*`.

## 보안

전역 미들웨어 체인 (`app.ts`, 순서대로):

| 미들웨어 | 방어 대상 |
|----------|-----------|
| `securityHeaders` | clickjacking, MIME 스니핑, XSS, 정보 누출 (HSTS / X-Frame-Options:DENY / CSP `default-src 'none'` / nosniff / COOP·COEP·CORP) |
| `corsMiddleware` | 무단 cross-origin 접근 — `TRUSTED_ORIGINS` 만 허용, credentials 포함 |
| `rateLimit` | DDoS / 무차별 요청 — IP(또는 `X-Forwarded-For`) 기준 윈도우 제한, 초과 시 429 |
| `bodyLimitMiddleware` | 대용량 페이로드 DoS — `MAX_BODY_SIZE` 초과 시 413 |
| `csrfMiddleware` | form 기반 CSRF — 상태변경 요청의 Origin 을 `TRUSTED_ORIGINS` 와 대조 (JSON/Bearer 요청은 비차단) |
| `session` | 세션 주입 (이후 `requireAuth` 로 보호) |

라우트 단위 추가 방어:

- `/api/auth/*` — `authRateLimit`(더 엄격) + `timeout(REQUEST_TIMEOUT_MS)` 로 brute-force·slowloris 완화. better-auth 자체 rate limit 과 중첩 적용.
- 스트리밍 응답(`/api/chat`)에는 timeout 을 걸지 않아 응답이 끊기지 않음.

> **프로덕션 주의**
> - rate limit 기본 store 는 **in-memory** — 다중 인스턴스라면 `@hono-rate-limiter/redis` 등 공유 store 로 교체.
> - 프록시(로드밸런서) 뒤에 둘 경우 `X-Forwarded-For` 를 신뢰하므로, 프록시가 해당 헤더를 검증·설정하는지 확인.
> - HSTS 는 HTTPS 환경에서만 의미가 있음.

## 인증 (Bearer)

better-auth `bearer()` 플러그인 사용. 쿠키 없이 **`Authorization: Bearer <token>`** 헤더로 인증 가능.

```bash
# 로그인 → 응답 헤더 set-auth-token 에서 토큰 획득
curl -i -X POST $API/api/auth/sign-in/email \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.com","password":"password1234"}'

# 이후 보호된 API 호출
curl $API/api/mindmaps -H "Authorization: Bearer <token>"
```

모든 `/api/mindmaps/*` 는 인증 필수이며, 리소스는 **소유자(userId) 로 스코프**됩니다. 남의 맵 접근 시 존재를 숨기기 위해 `404` 를 반환합니다.

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 헬스체크 |
| GET | `/me` | 현재 세션/유저 |
| ALL | `/api/auth/*` | better-auth (가입/로그인/세션 등) |
| POST | `/api/chat` | 🔒 AI 스트리밍 채팅 (useChat 호환) |
| GET | `/api/mindmaps` | 🔒 내 맵 목록 (`?limit&offset`, 개념 수 포함) |
| POST | `/api/mindmaps` | 🔒 맵 생성 `{ title }` |
| GET | `/api/mindmaps/:id` | 🔒 맵 상세 + concept **트리** |
| PATCH | `/api/mindmaps/:id` | 🔒 맵 수정 `{ title }` |
| DELETE | `/api/mindmaps/:id` | 🔒 맵 삭제 (concept cascade) |
| GET | `/api/mindmaps/:id/markdown` | 🔒 markmap 용 마크다운 (text/markdown) |
| GET | `/api/mindmaps/:id/graph` | 🔒 force-graph 용 `{ nodes, links }` |
| POST | `/api/mindmaps/:id/concepts` | 🔒 개념 추가 `{ label, detail?, parentId?, mastery?, position? }` |
| PATCH | `/api/mindmaps/:id/concepts/:cid` | 🔒 개념 수정 (부분, 사이클 방지) |
| DELETE | `/api/mindmaps/:id/concepts/:cid` | 🔒 개념 삭제 (자식 cascade) |

> 🔒 = 인증 필요. 상태변경 요청은 `application/json` 으로 보내야 함 (CSRF 보호: form 계열 content-type 은 Origin 검증).
