# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Web app
npm run dev          # Next.js dev server (localhost:3000)
npm run build        # Production build
npm start            # Serve production build

# Worker process
npm run dev:worker   # Run workflow task server locally (tsx workers/index.ts)
npm run build:worker # Compile worker (tsconfig.worker.json → dist/)

# Scripts
npm run seed:brainrot                    # Seed brainrot footage
tsx scripts/smoke-test.ts                # Quick smoke test
tsx scripts/e2e-test.ts                  # End-to-end test
tsx scripts/test-clickhouse.ts           # Test ClickHouse connectivity
```

Install: `npm install --legacy-peer-deps` (required due to peer dep conflicts).

## Architecture

**Two-process deployment on Render:**
- `viralprinter-web` — Next.js app (App Router), serves the UI and API routes
- `viralprinter-workflows` — Render Workflows task server, executes the video pipeline

**Local vs production routing:** `IS_LOCAL = !process.env.RENDER_SDK_SOCKET_PATH`. In local dev, API routes lazy-import `lib/localRunner.ts` and run the pipeline in-process with a module-level `Map` for job state. In production, `lib/renderClient.ts` dispatches tasks to the Render Workflows service via `@renderinc/sdk`.

**Video pipeline** (`workers/pipeline.ts` → `workers/tasks/*.ts`):
1. `generateHook` — Anthropic Claude generates a hook line
2. `generateScript` — Claude writes the full script with segments
3. `generateAudio` + `fetchVisuals` — run in parallel; Polly or ElevenLabs for TTS, Pexels API for b-roll
4. `assembleVideo` — stitches audio + visuals with word-level subtitles
5. `uploadToS3` — uploads final video to AWS S3
6. `postToTikTok` — posts via Composio; mock mode if `COMPOSIO_TIKTOK_ENTITY_ID` is unset
7. `logAnalytics` — writes run record to ClickHouse Cloud

**Frontend** (`app/components/`):
- `Dashboard.tsx` — shell with Scout / Create / History tabs; user `Profile` stored in `localStorage`
- `ScoutTab.tsx` — calls `/api/scout`, shows AI-curated content ideas; results cached 15 min per niche in `lib/scout.ts`
- `CreateTab.tsx` — form to trigger generation; polls `/api/status/[runId]` for step-by-step progress
- `HistoryTab.tsx` — calls `/api/history`, reads from ClickHouse

**API routes** (`app/api/`):
- `POST /api/generate` — starts a pipeline run, returns `{ runId, taskRunId }`
- `GET /api/status/[runId]` — returns `RunStatus` (steps, current step, result)
- `GET /api/scout` — returns `ScoutResult` (3 sections × 3 ideas)
- `GET /api/history` — returns recent `PostRecord[]` from ClickHouse

**Key types** (`lib/types.ts`): `GenerateRequest`, `ScriptResult`, `AudioResult`, `PostResult`, `RunStatus`, `StepStatus`, `PIPELINE_STEPS`.

## Environment Variables

Copy `.env.example` to `.env.local`. Key vars:
- `ANTHROPIC_API_KEY` — script/hook/scout generation
- `PEXELS_API_KEY` — b-roll stock footage
- `ELEVENLABS_API_KEY` — optional; only needed for ElevenLabs TTS
- `AWS_*` — S3 (media storage) and Polly (TTS)
- `COMPOSIO_API_KEY` + `COMPOSIO_TIKTOK_ENTITY_ID` — TikTok posting (leave entity ID blank for mock mode)
- `CLICKHOUSE_*` — analytics storage
- `RENDER_API_KEY` + `RENDER_WORKFLOWS_SERVICE_SLUG` — production only
- `RENDER_LOCAL_DEV_URL` — local workflow server URL (default `http://localhost:10000`)
