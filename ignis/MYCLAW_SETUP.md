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
| Ignis API endpoint | ✓ Done | `pages/api/ignis.ts` — reads all 3 markdowns, calls `/v1/chat/completions` |
| Pipeline proxy (upload + status + download) | ✓ Done | `pages/api/ignis-upload.ts` |
| Gateway config endpoint | ✓ Done | `pages/api/ignis-config.ts` — exposes gatewayUrl + gatewayToken to portal |
| Portal UI | ✓ Done | `public/ignis-portal.html` — messaging, voice, file upload, pipeline progress |
| Video pipeline scripts | ✓ Done | `ignis/video/` — beat_sync.py, upscale.py, stitch.py, run.py, generate_assets.py |
| Python dependencies | ✓ Done | `ignis/video/requirements.txt` — librosa, soundfile, numpy, replicate, requests |
| LUT files (5 grades) | ✓ Done | `ignis/video/luts/` — anime, cinematic, gaming, product, zenith |
| SFX placeholders | ✓ Done | `ignis/video/sfx/` — whoosh.wav, impact.wav, riser.wav (replace with real audio) |
| Pipeline spec for MyClaw | ✓ Done | `ignis/video/MYCLAW_PIPELINE.md` |

---

## SECTION 1 — ENVIRONMENT (MyClaw does this once)

### 1a. Python pipeline dependencies

```bash
cd /path/to/NoctVox
pip install -r ignis/video/requirements.txt
pip install kerykeion
```

Packages: `librosa`, `soundfile`, `numpy`, `replicate`, `requests`, `kerykeion`

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

- [ ] `pip install -r ignis/video/requirements.txt` — pipeline packages installed
- [ ] `pip install kerykeion` — transit engine installed
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
- [ ] Fish Speech installed + Lelouch voice clone verified (Section 6)

---

## CONFIRMATION PHRASE

Once all active items are confirmed:

> "Vision and voice kernels detected. Visual processing online. Pipeline endpoints
> live. Agent tools nominal. All systems nominal."

Report any item that failed with what's missing.

---

## WHAT MYCLAW DOES NOT NEED TO DO

- Touch any file in `src/core/` — Aum is fully wired
- Touch `pages/api/` — all proxy and config endpoints are done
- Touch `public/ignis-portal.html` — portal is fully wired
- Re-read or re-generate the LUT files — they are committed at `ignis/video/luts/`
- Set up the Siri shortcut — that is Vision's iPhone, not MyClaw's machine
