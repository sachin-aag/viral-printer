## Inspiration

Short-form video is the most powerful distribution channel on the internet — it's how products launch, ideas spread, and careers get made. But making even a simple TikTok takes hours: scripting, recording, editing, captioning, posting. That workflow is fine for full-time creators. It's a wall for everyone else.

We asked: what if you could go from "I have something to say" to "it's live on TikTok" in under two minutes, with zero editing? Not a template. Not a half-baked draft you still need to touch up. A fully finished, subtitle-perfect, posted video — from a single sentence.

## What it does

ViralPrinter is a one-prompt content engine. You describe what you want to talk about, and it handles everything else:

- **Scout** — AI scans trending topics in your niche and surfaces content ideas tailored to your voice, audience, and style. Pick one, or type your own.
- **Create** — One click kicks off a fully autonomous pipeline: it writes a scroll-stopping hook, generates the full script, produces voiceover audio, finds matching b-roll footage, optionally generates an AI speaker video, assembles everything with word-level animated subtitles, and posts it straight to TikTok.
- **History + Analytics** — Every generation is logged. Review past videos, track what you've published, and build intuition for what resonates.

The entire pipeline runs as a durable workflow with real-time step-by-step progress visible in the UI — you watch each stage complete live.

## How we built it

Two services deployed on **Render**:

- A **Next.js 16** frontend (App Router) serving the UI and API layer
- A **Render Workflows** task server orchestrating the 7-step video pipeline with built-in retries, state tracking, and fault tolerance

The pipeline is designed for speed — audio generation and visual fetching run in parallel — and uses Render's workflow primitives so every step either completes or fails gracefully with full observability. Locally, the entire stack runs in-process for fast iteration; in production, the web service dispatches to the workflow service via the Render SDK.

**Claude** (Anthropic) powers all the intelligence: hook generation, script writing, and content scouting. **AWS Polly** and **ElevenLabs** handle text-to-speech. **Pexels** supplies b-roll. **Google Veo 2** generates AI speaker video. **Composio** manages the TikTok OAuth flow and posting. **ClickHouse Cloud** stores every run for analytics.

## Challenges we ran into

- **Word-level subtitle sync** — Aligning subtitles frame-by-frame to TTS audio meant parsing phoneme-level timing data from Polly's speech marks and mapping it precisely to video frames during assembly. Getting this wrong by even a few hundred milliseconds makes the output feel broken.
- **Pipeline reliability** — A 7-step pipeline where any step can fail (API rate limits, network timeouts, video encoding errors) can't just be a chain of awaits. Render Workflows gave us the retry and state primitives to make it genuinely production-grade.
- **TikTok OAuth** — Programmatic posting to TikTok is notoriously painful. Composio abstracted the entire auth flow so we could focus on the product instead of debugging token refresh logic.
- **Parallelism without race conditions** — Running audio generation and visual fetching simultaneously while keeping the pipeline state machine consistent required careful step-tracking design so the UI always shows accurate progress.

## Accomplishments that we're proud of

- **Prompt to posted TikTok in under 2 minutes** — the entire pipeline, from typing a sentence to a live video on TikTok, runs end-to-end without any human intervention.
- **It actually works** — this isn't a mockup or a demo with hardcoded outputs. Every step calls real APIs, produces real artifacts, and the video that gets posted is genuinely generated from scratch each time.
- **The scout is genuinely useful** — the AI content ideation doesn't just regurgitate trending hashtags. It reasons about your niche, audience, and style to suggest ideas you'd actually want to make.
- **Real-time pipeline visibility** — watching each step light up in the UI as it completes (hook ✓, script ✓, audio ✓, visuals ✓, assembly ✓, upload ✓, posted ✓) makes the experience feel like magic instead of a loading spinner.

## What we learned

The gap between "technically possible" and "feels like magic" is almost entirely UX. Every API we needed existed before we started — Claude, Polly, Pexels, Composio, Veo 2. The hard part was wiring them into a pipeline that feels instant, reliable, and zero-friction. Orchestration and error handling are where the real engineering lives, not the individual API calls.

We also learned that durable workflows change how you think about multi-step AI pipelines. Once you have retries, state persistence, and step-level observability built into the infrastructure, you stop writing defensive spaghetti code and start building features.

## What's next for ViralPrinter

- **Multi-platform posting** — YouTube Shorts, Instagram Reels, and LinkedIn video from the same pipeline
- **A/B hook testing** — Generate multiple hooks for the same script, post variants, and learn which style wins
- **Analytics feedback loop** — Pull performance data back in and auto-tune future scripts toward what actually gets views
- **Batch scheduling** — Plan and generate a week of content in one sitting, with scheduled posting
- **Voice cloning** — Use your own voice instead of a TTS engine so the content sounds like you
