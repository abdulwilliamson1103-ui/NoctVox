# IGNIS — MyClaw Setup Guide

This is the single file MyClaw reads to know everything it needs to activate Ignis.
Read this alongside `Persona.md`, `Memory.md`, and `Tools.md` (same folder).

**When MyClaw reads this file it should work through every section below, confirm
each one is active, and respond with the confirmation phrase at the end.**

---

## WHAT IS ALREADY DONE (NoctVox / Vercel side)

MyClaw does not need to touch any of this. It is built and committed.

| Component | Status | Location |
|-----------|--------|----------|
| Ignis identity + behavioral directive | ✓ Done | `ignis/Persona.md` |
| Ignis memory architecture | ✓ Done | `ignis/Memory.md` |
| Ignis tool registry | ✓ Done | `ignis/Tools.md` |
| Aum soul routing pipeline | ✓ Done | `src/core/` (router, houses, torches, rings, echoes, alignment, memory, upstash) |
| Ignis API endpoint | ✓ Done | `pages/api/ignis.ts` — reads all markdowns, streams responses, maintains conversation history |
| Pipeline proxy (upload + status + download) | ✓ Done | `pages/api/ignis-upload.ts` |
| Gateway config endpoint | ✓ Done | `pages/api/ignis-config.ts` — exposes gatewayUrl + gatewayToken to portal |
| Portal UI | ✓ Done | `public/ignis-portal.html` — messaging, voice, file upload, pipeline progress |
| Video pipeline scripts | ✓ Done | `ignis/video/` — beat_sync.py, upscale.py, stitch.py, run.py, generate_assets.py |
| Python dependencies | ✓ Done | `ignis/video/requirements.txt` — librosa, soundfile, numpy, replicate, requests |
| LUT files (5 grades) | ✓ Done | `ignis/video/luts/` — anime, cinematic, gaming, product, zenith |
| SFX placeholders | ✓ Done | `ignis/video/sfx/` — whoosh.wav, impact.wav, riser.wav (replace with real audio) |
| Pipeline spec for MyClaw | ✓ Done | `ignis/video/MYCLAW_PIPELINE.md` |
| Generative media tool registry | ✓ Done | `ignis/Tools.md` — GENERATIVE MEDIA section — Nano Banana, Kling AI, Veo 3.1, Runway, Luma, Seedance 2.0, Higgsfield, Ver AI, ArtCraft AI, Kdenlive |

---

## SECTION 1 — ENVIRONMENT (MyClaw does this once)

### 1a. Python pipeline dependencies

```bash
cd /path/to/NoctVox
pip install -r ignis/video/requirements.txt
```

Packages: `librosa`, `soundfile`, `numpy`, `replicate`, `requests`, `kerykeion`
(kerykeion is included in requirements.txt — one command installs everything)

**kerykeion** is the primary transit engine. It wraps Swiss Ephemeris to calculate current
planet positions. Used by `ignis/natal/transits.py` every morning digest.
Verify: `python ignis/natal/transits.py` — should print the 3/6/9 digest.

Two reference repos for the transit system:

| Repo | Role | When to use |
|------|------|-------------|
| `catch-twenty2/AstroChart_Analysis` | Python Swiss Ephemeris transit calculator | If kerykeion API changes or more precise aspect control is needed — clone and use as alternative engine in transits.py |
| `astrologyapi/astro-api-client` | REST API — geo-location + birth time/place data | If Vision needs to look up a person's chart by birth location, or validate natal data against a live API |

Neither requires installation right now — kerykeion handles current transit calculation. These are the upgrade path if the engine needs replacing.

### 1b. FFmpeg

Must be in PATH. Verify with:
```bash
ffmpeg -version
```

Install if missing:
```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg
```

### 1c. Environment variables

Add to MyClaw's `.env` or shell profile:

```
REPLICATE_API_TOKEN=your_token_here    # get at replicate.com/account/api-tokens
GATEWAY_URL=https://your-tunnel.trycloudflare.com
GATEWAY_TOKEN=your_gateway_token_here
ELEVENLABS_API_KEY=your_key_here       # get at elevenlabs.io/app/settings/api-keys — for SFX generation
SEARCH1_API_KEY=your_key_here          # get at search1api.com — for deep web research
```

`GATEWAY_TOKEN` is the same token used for `/v1/chat/completions`. The portal
already knows it via `ignis-config.ts` — just keep the values consistent.

---

## SECTION 2 — PIPELINE ENDPOINTS (MyClaw does this once)

Full spec in `ignis/video/MYCLAW_PIPELINE.md`. Summary:

| Method | Path | What it does |
|--------|------|-------------|
| POST | `/pipeline/upload` | Accept clips + options, start `run.py` in background thread, return `{ jobId }` |
| GET | `/pipeline/status/{jobId}` | Return `{ status, progress }` — queued → running → done/error |
| GET | `/pipeline/download/{jobId}` | Stream finished MP4 |

**Critical:** `/pipeline/upload` needs CORS headers — the browser POSTs directly to MyClaw:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```
Handle `OPTIONS` preflight with `200 OK`.

**Absolute path to run.py:**
```python
import os
PIPELINE_DIR = os.path.join(os.path.dirname(__file__), 'ignis', 'video')
RUN_PY = os.path.abspath(os.path.join(PIPELINE_DIR, 'run.py'))
```

---

## SECTION 3 — AGENT TOOLS (MyClaw installs and activates)

These are Ignis's tool capabilities defined in `Tools.md`. Grouped by what MyClaw
actually needs to install vs what Ignis uses as behavioral directives.

### 3a. Install now — concrete, MyClaw uses these directly

| Tool | Install | What it enables |
|------|---------|----------------|
| **Agent Zero** | `git clone https://github.com/frdel/agent-zero` | L1 general task framework — computer as primary tool, learns as used |
| **Playwright** | `pip install playwright && playwright install chromium` | Web scraping with anti-bot bypass — Ignis browses, fills forms, extracts data |
| **Skyvern** | `pip install skyvern` or Docker | Visual browser agent — sees websites like a human, not just HTML |
| **PraisonAI** | `pip install praisonai` | Multi-agent mission control for complex multi-step projects |
| **AgentGuard** | `pip install agentguard` | Loop detection + kill switch — stops burning API credits on stuck tasks |

### 3b. Behavioral frameworks — Ignis uses these as reasoning directives, not installs

These define *how Ignis thinks*, not software to install. They're already embedded
in `Persona.md` as behavioral constants. MyClaw does not need to install them.

| Framework | What it means in practice |
|-----------|--------------------------|
| Autonomous Agents (THINK→EXECUTE→REFLECT) | Ignis reasons before acting, reflects after. Already in Persona.md behavioral constants. |
| Superpowers (stop-and-think) | Ignis pauses before writing or executing code. Built into recursive self-critique in Persona.md. |
| Recursive self-critique | Ignis drafts → critiques → revises before outputting L2/L3 responses. Already wired. |
| Hermes self-evolution | Ignis builds a deepening model of Vision across sessions. Runs on the Aum soul layer. |
| Fractal identity tracking | Ignis detects personality drift and self-corrects. Already in Persona.md. |

### 3c. Research tools — activate when Vision says "Collect" / "Research" / "Slide Show"

| Tool | Install | Trigger |
|------|---------|---------|
| **Search1API** | API key at search1api.com → add `SEARCH1_API_KEY` to env | "Collect data on [topic]" |
| **Web-Check** | `npx web-check` (no install) or `https://web-check.as93.net` | "Research [company/person]" |
| **PentAGI** | Docker: `docker pull vxcontrol/pentagi` | "Deep research on [topic]" |

### 3e. Generative media tools — install now

These enable Ignis to generate images, animate them into clips, and feed them into the existing video pipeline. Full spec in `Tools.md` under **GENERATIVE MEDIA**.

| Tool | Install | What it enables |
|------|---------|----------------|
| **Kdenlive** | `sudo apt install kdenlive` (Linux) or download at kdenlive.org | Post-edit review before pipeline — trim AI clips, fix durations, color review |
| **Playwright** (already in 3a) | Already installed | Drives web-based platforms (Kling AI, Veo via Viw AI, Runway, Luma) when no API is available |

**Web-based platforms (no install — Playwright drives them):**

| Platform | URL | Free tier |
|----------|-----|-----------|
| Nano Banana / Google Flow | labs.google/flow | Yes — Gemini 2.5 Flash image editing |
| Kling AI | klingai.com | Yes — 5s clips free |
| Viw AI (Veo 3.1) | viw.ai | Yes — Google's video model free via Viw |
| Luma Dream Machine | lumalabs.ai | Yes — generous free tier |
| Runway Gen-3 | runwayml.com | Credit-based — use for premium output only |
| Ver AI | ver.ai | Free unlimited watermark-free |

**Open-source repos to clone:**
```bash
git clone https://github.com/Zeshanabdullah/Image-to-Video-AI
git clone https://github.com/Higgsfield-AI/higgsfield
```

**Seedance 2.0 (bytedance/SeedVR):** Available via Replicate API — same workflow as Real-ESRGAN.
Add `REPLICATE_API_TOKEN` (already required for upscale) — no extra setup.

**ArtCraft AI:** Rust-based — install only if Vision explicitly requests full pipeline orchestration.
```bash
# Check https://github.com/ArtCraft-AI/artcraft for current install method
```

### 3d. Planned — not yet wired (document for future activation)

| Tool | Status | When to activate |
|------|--------|-----------------|
| **memU** (NevaMind-AI/memU) | Planned | Persistent long-term memory across months |
| **A-MEM** (agentic-memory/A-MEM) | Planned | Tactical context retrieval per query |
| **MemAgent** (MemAgent/MemAgent) | Planned | Deep archive for multi-million token memory |
| **OpenClaw Auto-Dream** | Planned | End-of-session log processing into context |
| **Paperless-GPT** | Planned | Physical document OCR via iPhone camera |
| **Orchard Kit** | Planned | Groupthink across agents for hard problems |
| **Dyad** | Planned | Local mobile app builder for rapid prototyping |
| **Claw Team** | Planned | L3 real-time agent swarm |
| **Antfarm** | Planned | Planner + Verifier + Tester swarm inside repo |
| **LLaVA-v1.6** | Planned | Primary vision (currently uses base model vision) |
| **OmAgent** | Planned | Multimodal reasoning across text, image, video |
| **Pipecat** | Planned | Real-time voice pipeline upgrade (currently Web Speech API) |
| **VoxClaw / Voxtral** | Planned | Neural voice cloning — Ignis gets a real voice |

---

## SECTION 4 — SIRI → IGNIS (Vision sets up on iPhone — one time)

MyClaw's end is already done (it accepts POST `/v1/chat/completions`).
Vision sets this up on his iPhone:

```
1. Open Shortcuts app
2. New Shortcut — name it "Ignis"
3. Add: Dictate Text
4. Add: Get Contents of URL
     URL:     {GATEWAY_URL}/v1/chat/completions
     Method:  POST
     Headers: Authorization: Bearer {GATEWAY_TOKEN}
              Content-Type: application/json
     Body:    JSON — { "model": "openclaw", "messages": [{ "role": "user", "content": [Dictated Text] }] }
5. Add: Speak Text → reads response aloud
```

**Action Button (iPhone 15 Pro / 16):** Assign "Ignis" shortcut to Action Button.
One press → Ignis listening. No unlock, no app.

**Morning Digest:** Personal Automation at 8:00 AM → runs the shortcut with fixed
text "morning digest" → Ignis reads TASKS.md from GitHub and delivers day's priorities.

---

## SECTION 5 — VIDEO PIPELINE VERIFICATION

Once pipeline endpoints are active, test with:

```bash
# Upload a test clip (skipUpscale=true for fast test)
curl -X POST {GATEWAY_URL}/pipeline/upload \
  -H "Authorization: Bearer {GATEWAY_TOKEN}" \
  -F "clips=@test_clip.mp4" \
  -F "type=cinematic" \
  -F "skipUpscale=true"

# Expected: { "jobId": "abc123", "status": "queued" }

# Poll until done
curl {GATEWAY_URL}/pipeline/status/abc123 \
  -H "Authorization: Bearer {GATEWAY_TOKEN}"

# Expected progression: queued → running → done
```

LUT files are at `ignis/video/luts/` — pass the absolute path:
```bash
python ignis/video/run.py \
  --clips /path/to/clips/ \
  --type cinematic \
  --output /tmp/test_output.mp4 \
  --skip-upscale
```

---

## SECTION 6 — IGNIS VOICE IDENTITY (Fish Speech)

Ignis speaks with the English voice of **Lelouch vi Britannia** from *Code Geass*
(voiced by **Johnny Yong Bosch**, English dub).

That voice — commanding, measured, calm under pressure — is the correct energy for Ignis.

### 6a. Install Fish Speech

```bash
pip install fish-speech
# or run via Docker (recommended for production):
docker pull fishaudio/fish-speech:latest
```

Repo: `fishaudio/fish-speech`
Docs: https://speech.fish.audio

### 6b. Collect reference audio

You need **30–60 seconds** of clean Lelouch English dialogue — no background music, no SFX.

Good sources:
- YouTube: search "Code Geass Lelouch English voice lines" or "Lelouch vi Britannia English dub compilation"
- Any scene where he speaks in a quiet room works. The throne room speeches are ideal.
- Avoid battle scenes — music bleed ruins the clone.

Save as: `ignis/voice/lelouch_reference.wav`
Format: mono, 16kHz or 44.1kHz, clean. Convert with FFmpeg if needed:
```bash
ffmpeg -i source.mp4 -vn -ac 1 -ar 44100 ignis/voice/lelouch_reference.wav
```

### 6c. Generate the voice model

```bash
# Clone voice from reference audio
python -m fish_speech.train.finetune \
  --reference ignis/voice/lelouch_reference.wav \
  --output    ignis/voice/ignis_voice_model/
```

Or using the simpler inference-time cloning (no training needed):
```bash
python -m fish_speech.inference \
  --text     "Your message here" \
  --reference ignis/voice/lelouch_reference.wav \
  --output    ignis/voice/test_output.wav
```

Play the output. Adjust reference clip length if the clone sounds off.

### 6d. Wire into MyClaw response pipeline

Once voice generation is confirmed, MyClaw should expose a TTS endpoint:

```
POST /tts
Body: { "text": "...", "voice": "ignis" }
Returns: audio/wav stream
```

The portal currently uses Web Speech API. To upgrade:
- Replace `speak(text)` in `public/ignis-portal.html` with a fetch to MyClaw's `/tts` endpoint
- Stream the audio and play it via the Web Audio API
- This upgrade is a portal patch — Vision will request it when MyClaw is live.

### 6e. Checklist for this section

- [ ] Fish Speech installed
- [ ] `ignis/voice/` folder created
- [ ] Reference audio collected (30–60 sec, clean, Lelouch English)
- [ ] Inference test passes — `test_output.wav` sounds correct
- [ ] MyClaw `/tts` endpoint live
- [ ] Portal `speak()` patched to use MyClaw TTS (Vision requests this separately)

---

## ACTIVATION CHECKLIST

MyClaw works through this list and confirms each item:

- [ ] `pip install -r ignis/video/requirements.txt` — all packages including kerykeion
- [ ] `python ignis/natal/transits.py` — outputs 3/6/9 digest in Aum language
- [ ] `ffmpeg -version` — FFmpeg in PATH
- [ ] `REPLICATE_API_TOKEN` in environment
- [ ] `GATEWAY_URL` + `GATEWAY_TOKEN` in environment
- [ ] `POST /pipeline/upload` live with CORS headers
- [ ] `GET /pipeline/status/{jobId}` live
- [ ] `GET /pipeline/download/{jobId}` live
- [ ] Pipeline test curl returns `{ "jobId": "...", "status": "queued" }`
- [ ] Agent Zero cloned and runnable
- [ ] Playwright installed + chromium downloaded
- [ ] Skyvern installed
- [ ] AgentGuard installed
- [ ] Search1API key in environment (optional — needed for research commands)
- [ ] ElevenLabs API key in environment (optional — needed for AI-generated SFX)
- [ ] Fish Speech installed + Lelouch voice clone verified (Section 6)
- [ ] Kdenlive installed (`sudo apt install kdenlive`)
- [ ] `git clone https://github.com/Zeshanabdullah/Image-to-Video-AI` (generative pipeline)
- [ ] `git clone https://github.com/Higgsfield-AI/higgsfield` (4K consistency video)
- [ ] Nano Banana / Kling AI / Viw AI / Luma accessible via browser (Playwright drives them)

---

## CONFIRMATION PHRASE

Once all active items are confirmed:

> "Vision and voice kernels detected. Visual processing online. Pipeline endpoints
> live. Agent tools nominal. All systems nominal."

Report any item that failed with what's missing.

---

## SECTION 7 — ARCHITECTURE NOTES (READ BEFORE IMPLEMENTING)

These are non-obvious design decisions baked into the codebase. MyClaw needs to
know them to avoid implementing against the grain or being confused by behavior
that looks like a bug but isn't.

---

### 7a. Conversation history stores raw text — not the full message sent to Ignis

When the portal sends a message with video clips attached, it appends a file context
note to the text before calling `/api/ignis`:

```
"process these clips in zenith style\n\n[Attached: clip1.mp4 (video clip, 5.2MB)]"
```

But `conversationHistory` stores only the raw typed text (`"process these clips in zenith style"`),
not the appended note. **This is intentional.** The attachment note is transient context
for that message only. Storing it in history would contaminate every subsequent prompt
with stale file references. MyClaw should be aware that if it sees a history turn
that mentions files, there may be more file context in the original message than
what history shows.

---

### 7b. Portal always sends `stream: true` — MyClaw MUST support SSE streaming

The portal always sends `{ stream: true }` to `/api/ignis`, which passes `stream: true`
to MyClaw's `/v1/chat/completions`. If MyClaw returns plain JSON instead of SSE,
the portal falls back gracefully (non-streaming path), but streaming is the production
path. MyClaw must support OpenAI-compatible SSE format:

```
data: {"choices":[{"delta":{"content":"token here"}}]}\n\n
...
data: [DONE]\n\n
```

The portal parses `choices[0].delta.content` for live token appending.

---

### 7c. `ignis_done` is added by `ignis.ts` — do NOT send it from MyClaw

After MyClaw closes its SSE stream with `data: [DONE]\n\n`, `ignis.ts` appends
its own event:

```
data: {"ignis_done":true,"role":"ignis","time":"14:32","minds":[]}\n\n
```

The portal does **not** stop reading at `[DONE]` — it explicitly skips it and
waits for `ignis_done` to close the bubble and stamp the timestamp. If MyClaw
sends `ignis_done` directly, it will be treated as a duplicate and ignored — but
the bubble will never close. Let `ignis.ts` handle this signal.

---

### 7d. `downloadUrl` in `/pipeline/status` response is always overwritten

When `ignis-upload.ts` detects `status === 'done'` in MyClaw's status response,
it replaces `downloadUrl` with its own proxied path:

```
/api/ignis-upload?jobId=abc123&download=1
```

MyClaw can return any string as `downloadUrl` — it will never reach the browser
as-is. Just include the field so the proxy can detect `status === 'done'` and
perform the rewrite. The only value that matters is `status`.

---

### 7e. `ai-gen` source type auto-skips upscale inside `run.py`

Passing `--source-type ai-gen` to `run.py` is sufficient to skip upscaling.
`run.py` sets `skip_upscale = True` internally when it sees `ai-gen`. No need to
also pass `--skip-upscale`. Double-flagging is harmless but redundant.

Always send `sourceType=ai-gen` in the pipeline upload form when clips came from
Kling AI, Veo, Runway, Luma, or any AI video generator. Running Real-ESRGAN on
clean AI-generated clips wastes Replicate credits and can introduce artifacts.

---

### 7f. System prompt is rebuilt from disk on every request — no restart needed

`ignis.ts` reads these five files on every POST to `/api/ignis`:
- `ignis/Persona.md`
- `ignis/Memory.md`
- `ignis/Tools.md`
- `ignis/domain_routing.md`
- `TASKS.md` (repo root)

Edit any of them and the next message Ignis receives will use the updated content.
No Vercel redeploy needed. TASKS.md in particular is designed to be updated live —
Ignis reads it on every call.

---

### 7g. `userId: 'noctvox_vision'` is hardcoded in the portal

All Aum routing calls use a single hardcoded userId (`noctvox_vision`). House mass,
fractal baseline, Yin/Yang ratios, episodic memories, and cycle count all accumulate
under this key in Upstash. The portal is single-user by design — there is no auth
layer and no user switching. All of Vision's soul data lives under one key.

---

### 7h. Cloudflare tunnel URL rotates on every MyClaw restart

Every time MyClaw restarts, the Cloudflare tunnel generates a new URL. The portal
fetches this URL on page load from `/api/ignis-config`. After a MyClaw restart:

1. Update `GATEWAY_URL` in Vercel's environment variables (or `.env.local` if
   testing locally)
2. Vision refreshes the portal page — it re-fetches config and gets the new URL

If Vision sends a message while MyClaw is restarting (old URL still in browser),
Ignis will return `[Gateway error: fetch failed]`. Refresh fixes it. No code change
needed — this is an operational procedure.

---

### 7i. Non-streaming gateway errors always return HTTP 200

`ignis.ts` never returns a 5xx status when the gateway fails. Both success and
gateway errors return `200 OK` with the error wrapped as text:

```json
{ "ok": true, "role": "ignis", "text": "[Gateway error: fetch failed]", ... }
```

This means the portal will always render a response bubble, never throw a JS error.
If Vision sees `[Gateway error: ...]` in the chat, MyClaw is unreachable — check
the tunnel URL and token.

---

### 7j. Gateway config is fetched once on page load

The portal fetches `/api/ignis-config` once when the page loads and stores the result
in `ignisGateway`. If MyClaw restarts mid-session, the portal's stored gateway URL
becomes stale. Direct clip uploads will fail (the URL is dead). Status polling and
Ignis chat go through the Vercel proxy and are unaffected. Vision must refresh
the page to get the new tunnel URL after a restart.

---

### 7k. SFX files are silent placeholders

`ignis/video/sfx/` contains three silent WAV files: `whoosh.wav`, `impact.wav`,
`riser.wav`. The pipeline runs correctly with them — silent cut transitions are valid.
Real audio needs to be sourced and dropped in place. Good free sources:
- freesound.org (Creative Commons)
- mixkit.co (free license)

Type-specific subfolders (`sfx/cinematic/`, `sfx/anime/`, etc.) are also supported
by `stitch.py` — drop type-matched SFX there and the pipeline will use them
automatically when `--type` matches.

---

### 7l. RIFE frame interpolation is planned but not wired

`upscale.py` does not do frame interpolation. Output video stays at source fps
(whatever the original clips were). Tools.md documents RIFE as `[PLANNED — not
yet wired]`. Do not expect 60fps output from the pipeline in its current state.
When RIFE is activated it will be wired into `upscale.py` as a post-upscale step
using the Replicate API.

---

## WHAT MYCLAW DOES NOT NEED TO DO

- Touch any file in `src/core/` — Aum is fully wired
- Touch `pages/api/` — all proxy and config endpoints are done
- Touch `public/ignis-portal.html` — portal is fully wired
- Re-read or re-generate the LUT files — they are committed at `ignis/video/luts/`
- Set up the Siri shortcut — that is Vision's iPhone, not MyClaw's machine
