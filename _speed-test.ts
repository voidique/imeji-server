import { createOpenAI } from '@ai-sdk/openai'
import { streamObject } from 'ai'
import { conceptTreeSchema } from './src/modules/mindmap/mindmap.generate.schema'
import { buildSystemPrompt, buildUserPrompt } from './src/modules/mindmap/mindmap.generate.prompt'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const input = {
  title: null, source: { kind: 'text' as const, origin: 'resume.md', lang: 'ko' },
  content: `# 김태현 이력서
## 소개
- 현재 활동: 보안 동아리 운영
## 경력
- voidique: 주요 프로젝트 다수
- 에스티이지(STEG): 주요 업무 백엔드
- 데브게이트(devgate): 주요 업무 인프라
## 학력
- 항해99 12기
- 인천전자마이스터고 사이버보안 기능반
## 수상
- 시스코 네트워킹 아카데미 경진대회 은상`,
}

async function run(id: string, opts: any) {
  const t0 = performance.now()
  let firstChunk = 0
  const r = streamObject({ model: openai(id), schema: conceptTreeSchema, schemaName: 'mindmap',
    system: buildSystemPrompt(), prompt: buildUserPrompt(input), ...opts })
  for await (const _ of r.partialObjectStream) { if (!firstChunk) firstChunk = performance.now() }
  const obj = await r.object
  const total = performance.now() - t0
  console.log(`${id.padEnd(16)} | TTFB ${(firstChunk - t0).toFixed(0).padStart(5)}ms | total ${total.toFixed(0).padStart(5)}ms | nodes ${JSON.stringify(obj).match(/"label"/g)?.length ?? 0}`)
}

await run('gpt-4.1', { temperature: 0.2 })
await run('gpt-5.4-mini', { providerOptions: { openai: { reasoningEffort: 'minimal', textVerbosity: 'low' } } })
await run('gpt-5.4-mini', { providerOptions: { openai: { reasoningEffort: 'low' } } })
