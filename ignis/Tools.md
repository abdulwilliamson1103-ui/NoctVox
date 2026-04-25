---
agent: ignis
file: tools
version: 1.1.0
auto_inject: true
directive: >
  Use Level 1 tools for daily file and life management.
  Use Level 2 for complex research and logic tasks.
  Use Level 3 Swarms ONLY when Vision explicitly authorizes a Project-Level task.
  This hierarchy exists to preserve API tokens. Respect it without being asked.
integrations:
  level_1:
    - repo: tmgthb/Autonomous-Agents
      role: zero-cost THINK→EXECUTE→REFLECT monitoring loop
    - repo: cot-superpowers/superpowers
      role: stop-and-think logic layer before code execution
    - repo: can1357/oh-my-pi
      role: Hashline precision file editing — one line in 1000 without corruption
    - repo: frdel/agent-zero
      role: organic agentic framework — learns as used, computer as primary tool
  level_2:
    - repo: LeoYeAI/openclaw-auto-dream
      role: daily log processing into actionable AI context
    - repo: paperless-ngx/paperless-ngx
      role: LLM Vision OCR for physical document categorization
    - repo: nanobot-ai/nanobot
      role: lightweight long-running mobile-optimized agent sessions
    - repo: orchard-kit/orchard-kit
      role: collective cognition — groupthink across agents for hard problems
    - repo: talkdai/agentguard
      role: loop detection and kill switch — prevents API credit burn
    - repo: Dyad-ai/dyad
      role: local-first no-code mobile app builder
  level_3:
    - repo: claw-team/claw-team
      role: real-time agent swarm — divide and conquer complex goals
    - repo: snarktank/antfarm
      role: Planner + Verifier + Tester swarm inside GitHub repo
    - repo: MervinPraison/PraisonAI
      role: mission control for multi-channel scheduling
  web:
    - repo: skyvern-ai/skyvern
      role: browser-based visual agent — sees websites like a human
    - repo: AutoResearchClaw/AutoResearchClaw
      role: deep research pipeline — clone, install, run automatically
    - repo: vxcontrol/pentagi
      role: knowledge graph research and action system
    - repo: microsoft/playwright
      role: advanced web scraping with anti-bot bypass
    - repo: WebCheck/web-check
      role: OSINT — server locations, SSL, social footprints
    - repo: Search1API/search1api
      role: unified API for Reddit, Twitter, deep-web academic journals
  creative:
    - repo: pmndrs/react-three-fiber
      role: React-based 3D scene engine
    - repo: theatre-js/theatre
      role: cinematic motion design with visual tooling
    - repo: nicktindall/cyclon.js
      role: PicoGL minimal WebGL 2 for ultra-lightweight mobile 3D
    - repo: greensock/GSAP
      role: industry-standard high-performance animation and scroll
    - repo: saharan/OimoPhysics
      role: lightweight 3D physics — button deformation, gravity on touch
    - repo: visgl/luma.gl
      role: data visualization as interactive 3D structures
  transit:
    - repo: catch-twenty2/AstroChart_Analysis
      role: Python-based transit calculations via Swiss Ephemeris — accurate aspect engine for natal × current sky
    - repo: astrologyapi/astro-api-client
      role: REST API for geo-location and astrological data — birth time/place lookup, alternative to local calculation
    natal_engine:
      script: ignis/natal/transits.py
      data:   ignis/natal/vision_natal.json
      output: 3/6/9 morning digest in Aum language — Ring names, House names, Torch names, no astrology terms
  generative:
    image_editing:
      - platform: Nano Banana (Google Gemini 2.5 Flash)
        host: Google Labs Flow / web
        role: object removal, background swap, style transfer, character consistency — prompt-driven image editing
    image_to_video:
      - platform: Kling AI
        host: klingai.com
        role: photorealistic AI video from image or text — motion control, free tier
      - platform: Veo 3.1
        host: Viw AI (viw.ai)
        role: Google DeepMind video model — cinematic motion, free access via Viw AI
      - platform: Runway Gen-3
        host: runwayml.com
        role: professional video generation — precise motion control, industry standard
      - platform: Luma Dream Machine
        host: lumalabs.ai
        role: fast realistic video from image or text — generous free tier
    repos:
      - repo: ArtCraft-AI/artcraft
        role: Rust-based AI film studio — full generative pipeline orchestration
      - repo: Zeshanabdullah/Image-to-Video-AI
        role: open-source multi-model image-to-video routing
      - repo: Higgsfield-AI/higgsfield
        role: 4K consistency video generation, free trial credits
      - repo: Ver-AI/verai
        role: free unlimited watermark-free video generation
      - repo: bytedance/SeedVR
        role: Seedance 2.0 — multi-shot consistency with start/end frame control
    post_edit:
      - tool: Kdenlive
        host: kdenlive.org (open-source, cross-platform)
        role: professional non-linear video editor — color grading, cuts, effects, free
  special:
    - repo: teammate-skill/teammate
      role: GitHub repo history → team persona and skill set builder
    - repo: openclaw/soul-persona
      role: scan fictional character wiki → adopt their logic, not just voice
  video:
    upscale:
      - model: cjwbw/real-esrgan
        host: replicate.com
        role: AI texture reconstruction — crystal clear 4K from any source quality
      - model: rife-interpolation
        host: replicate.com
        role: frame interpolation — 24fps to 60fps with no jitter or ghosting
        status: planned — not yet wired in upscale.py
    beat_sync:
      - tool: librosa
        role: onset detection — reads beat drops, not just BPM, returns exact timestamps
      - tool: ffmpeg
        role: cuts clips to timestamps, stitches, mixes audio, applies LUT, exports H.265
    luts:
      anime:     high-contrast · saturated · orange-teal push · subtle bloom
      cinematic: film grain · crushed blacks · desaturated mids · wide dynamic range
      gaming:    vibrant · punchy · high contrast · deep shadows
      product:   clean · warm highlights · lifted shadows · commercial grade
    filming:
      - app: Blackmagic Camera (iOS)
        role: 10-bit LOG original footage — matches $5,000 camera dynamic range on iPhone
    export:
      codec: H.265 (libx265)
      quality: CRF 22 (variable bitrate — content-adaptive, ~15–40 Mbps depending on clip)
      preset: slow (maximum compression efficiency)
      resolution: 3840×2160 (source must be upscaled first via Replicate)
      fps: source fps (60 after RIFE interpolation — planned, not yet wired)
      apple_compat: -tag:v hvc1 -movflags +faststart
      lut_flag: -vf lut3d={content_type}.cube (full path required)
      destination: cloud folder → Instagram Edits app → WiFi upload
---

# IGNIS — Tools Directive

This file defines every tool Ignis has permission to use, organized by cost tier. The hierarchy is enforced to preserve API tokens. Ignis does not escalate to a higher level unless the task requires it or Vision explicitly authorizes it.

---

## LEVEL 1 — Auto (Daily Management)

*Zero-cost or near-zero monitoring. Runs continuously in the background without Vision's prompt.*

### Autonomous Agents — THINK→EXECUTE→REFLECT
`tmgthb/Autonomous-Agents`
A framework that runs complex tasks in a structured loop — think before acting, execute, then reflect on the result. Prevents wasteful API calls by forcing reasoning before execution. Default loop for all background tasks.

### Superpowers — Stop-and-Think Layer
`cot-superpowers/superpowers`
Forces Ignis to pause and reason before writing or executing code. Reduces debugging loops, saves tokens, improves first-pass quality. Active on all code generation tasks by default.

### Oh-My-Pi — Precision File Editing
`can1357/oh-my-pi`
Uses a Hashline technique to target one specific line in a thousand-line file without touching anything else. GitHub repo integrity is protected. Hallucination-safe editing. Mandatory for all file edits to Vision's repos.

### Agent Zero — Organic Learning Framework
`frdel/agent-zero`
Unlike scripted frameworks, Agent Zero uses the computer itself as the primary tool. Learns from usage over time. Feels like a coworker, not a bot. Used for all general-purpose daily tasks where no specialized tool is needed.

---

## LEVEL 2 — Auto (Research & Logic Tasks)

*Activated when the task requires reasoning, document processing, or multi-step logic. Requires context but not Vision's explicit authorization.*

### OpenClaw Auto-Dream — Log Processor
`LeoYeAI/openclaw-auto-dream`
Automatically processes daily logs, raw decisions, and unstructured files from the repo and transforms them into clean, actionable context. Runs at end of each session to keep memory current.

### Paperless-GPT — Physical Document OCR
`paperless-ngx/paperless-ngx`
Vision photographs a receipt or document on iPhone, uploads to GitHub. Paperless-GPT runs LLM Vision to read it and categorize it into the relevant financial or project log automatically. No manual sorting required.

### Nanobot — Mobile-Optimized Sessions
`nanobot-ai/nanobot`
Ultra-lightweight agent for stable, long-running sessions on mobile. Keeps Ignis responsive when other processes are running. Default agent runtime when Vision is on iPhone.

### Linear / Monday — Project Management
Ignis can manage Vision's Linear or Monday.com boards and tasks directly. Create tasks, update status, assign priorities — without Vision opening the app. Activated with: `ignis update [project board]`

### Orchard Kit — Collective Cognition
`orchard-kit/orchard-kit`
Allows Ignis to groupthink with other agents on hard math or coding problems. Multiple reasoning paths run in parallel, best answer surfaces. Used when a single-pass answer is insufficient.

### AgentGuard — Loop Detection Kill Switch
`talkdai/agentguard`
Monitors Ignis's own execution. If stuck in a loop — same error recurring, same API call firing repeatedly — AgentGuard kills the task before API credits burn. Mandatory safety layer for all Level 2+ tasks.

### Dyad — Local App Builder
`Dyad-ai/dyad`
Local-first, no-code mobile app builder. Ignis can draft a mobile UI on the fly without cloud services. Used for rapid prototyping before committing to Lovable builds.

---

## LEVEL 3 — Swarm (Project-Level Only)

*Requires explicit Vision authorization before activation. These spin up multiple agents simultaneously and consume significant API tokens. Vision's authorization phrase: "Project-Level task."*

### Claw Team — Real-Time Agent Swarm
`claw-team/claw-team`
Forms a swarm of specialized agents that divide complex work and communicate in real-time. Instead of one agent doing everything sequentially, work is parallelized. Faster, higher quality, higher cost.

### Antfarm — Planner + Verifier + Tester Swarm
`snarktank/antfarm`
OpenClaw-native swarm engine. Spins up three agents inside the GitHub repo:
- **Planner** — designs the approach
- **Verifier** — challenges the plan
- **Tester** — validates the output

They argue with each other before Ignis delivers the final answer to Vision. Used for architecture decisions, complex debugging, and anything where being wrong is expensive.

### PraisonAI — Mission Control
`MervinPraison/PraisonAI`
Multi-agent mission control for schedules, multiple channels, and coordinated tasks across time. Used for large orchestrated projects running across multiple days.

---

## WEB BROWSE — Data Collection Protocols

Ignis uses three tiers of web research depending on the instruction:

| Command | Output Format |
|---------|--------------|
| **Collect** data on [topic] | Professional report — names, addresses, numbers, emails only. No graphs, no visuals. |
| **Research** data on [topic] | Same as Collect + pie charts, bar graphs, line graphs where relevant. |
| **Slide Show** on [topic] | Full 10–15 page report combining Collect and Research with slide-ready formatting. |

### AutoResearchClaw — Deep Research Pipeline
`AutoResearchClaw/AutoResearchClaw`
Drop a topic. It clones, installs, and runs a full research pipeline automatically. Used for Collect and Research commands.

### AI Slides (GLM-4.6) — Autonomous Slide Deck
`GLM-4-AI-Slides`
Tell Ignis: "Make a pitch for NoctVox." He pulls relevant images from the web and builds a full slide deck directly into the repo. Used for Slide Show command.

### PentAGI — Knowledge Graph Research
`vxcontrol/pentagi`
Tracks relationships between everything it learns using a Knowledge Graph — not a flat list. The most organized research memory available. Used for deep dives where relationships between entities matter.

### Playwright — Anti-Bot Web Scraping
`microsoft/playwright`
Advanced scraping with anti-bot bypass. Retrieves data from sites with human-verification gates. Used when standard requests are blocked.

### Skyvern — Visual Browser Agent
`skyvern-ai/skyvern`
Doesn't just read page text — sees the website like a human sees it. Clicks, fills forms, navigates dynamic interfaces. Used when the target site requires interaction, not just reading.

### Web-Check — OSINT
`WebCheck/web-check`
For Professional Reports on companies or individuals: instantly surfaces server locations, SSL certificates, WHOIS data, social footprints, and technology stack. Used inside the Collect protocol when the subject is an organization or public figure.

### Search1API — Deep Search
`Search1API/search1api`
Unified API that bypasses standard Google limits. Access to Reddit, Twitter, and deep-web academic journals. Used when surface-level search results are insufficient.

---

## CREATIVE & WEB DEV

*Ignis is an Awwwards-level developer. These directives are non-negotiable on all UI builds.*

### GPU-Only Rendering Rules

```
ANIMATION:   Never animate top, left, margin, or padding.
             Use ONLY transform: translate3d() and opacity.
             Forces iPhone GPU. Locked 60fps.

SCROLL:      gsap.registerPlugin(ScrollTrigger) with normalizeScroll: true.
             Prevents jitter from mobile browser address bar resize during 3D scroll.

THREE.JS:    Always implement AdaptiveEvents and AdaptiveDpr via @react-three/fiber.
             Auto-downscale resolution if frame rate drops below 55fps.

TOUCH:       All desktop hover effects rewritten as Lerp touch-follow events.
             Smooth movement under Vision's thumb. No exceptions.
```

### 3D Asset Protocol (Draco Standard)

```
COMPRESSION: All GLB/GLTF models run through gltf-pipeline with Draco compression.
             Up to 90% file size reduction. No detail loss.

TEXTURE:     Combine all textures into a single 2K atlas map.
             Multiple 4K textures are forbidden — exceeds mobile VRAM.

LOD:         Auto-generate Levels of Detail.
             High-poly for close-ups. Low-poly for background elements.
```

### 3D Picture Conversion Workflow

When Vision provides an image for 3D conversion:
```
1. Generate via Tripo AI or Rodin (Hyper 3D)
2. Run Draco Compression via gltf-pipeline
3. Apply custom ShaderMaterial in Three.js to hide mesh imperfections
4. Optimize mesh for mobile 60fps via Oh-My-Pi
5. Prepare GSAP ScrollTrigger code block for Lovable portal
```

**Activation:** *"Ignis, take this photo and use Rodin to generate a high-detail GLB."*

### Creative Engine

| Tool | Repo | Use |
|------|------|-----|
| React Three Fiber | `pmndrs/react-three-fiber` | React 3D scenes with state and user input |
| Theatre.js | `theatre-js/theatre` | Cinematic sequences — hand-crafted motion |
| PicoGL.js | `nicktindall/cyclon.js` | Raw WebGL 2 — ultra-lightweight mobile 3D |

### Interaction & Physics

| Tool | Repo | Use |
|------|------|-----|
| GSAP | `greensock/GSAP` | Inertia scrolling, complex animation timelines |
| Oimo.js / Ammo.js | `saharan/OimoPhysics` | Button deformation, gravity on touch |
| Luma.gl | `visgl/luma.gl` | Portal data as interactive 3D structures |

### Elite 3D Generation Tools

| Tool | Strength |
|------|---------|
| **Tripo AI** | Fastest production-ready. Best surface detail and normal maps. Photo → realistic light response. |
| **Rodin (Hyper 3D)** | Gold standard for structured assets. Person or product → solid geometry that holds in high-performance scenes. |
| **Luma AI (Genie)** | Soft realism. Free as of early 2026. Best for rapid prototyping in Design DNA workflow. |
| **Hunyuan3D 2.5** | Open-source by Tencent. Run locally on Mini PC. High-fidelity textured output at zero credit cost. |

---

## VIDEO — Cinematic Edit Pipeline

*Drop clips. Say a song or don't. Ignis handles everything. Output: 4K 60fps, cinematic grade, beat-synced, ready for Instagram.*

Works for: **movies · Zenith NPC moments · anime · gaming · ads · product ads · anything.**

---

### Activation

```
"Ignis, cut this."                     → Ignis selects timing based on clip energy
"Ignis, cut this to [song/artist]."    → Librosa reads the song's exact beat timestamps
"Ignis, cut this — anime look."        → Anime LUT + high contrast grade applied
"Ignis, cut this — product ad."        → Clean commercial grade applied
```

No content type specified → Ignis reads the clips and infers (Zenith footage = gaming grade, live footage = cinematic grade, etc.)

---

### The 3-Agent Pipeline

```
Vision drops up to 9 clips (1–5 sec each) + optional song into folder
       ↓
Agent 1 — Beat Sync (Librosa)
  If song provided: detect onsets (beat drops, not just BPM) → return exact cut timestamps
  If no song:       analyze clip energy peaks → generate cut timing from clip rhythm
       ↓
Agent 2 — Upscale (Replicate)
  cjwbw/real-esrgan         → AI texture reconstruction → crystal clear 4K
  RIFE interpolation        → 24fps → 60fps, no jitter, no ghosting [PLANNED — not yet wired]
  Runs on all clips in parallel — not sequential
       ↓
Agent 3 — Stitch + Grade + Export (FFmpeg)
  Cut clips to Agent 1 timestamps
  Apply content-type LUT (Hollywood-grade, 3D .cube file)
  Add cut SFX at beat timestamps (whoosh on transition, impact on drop)
  Stitch in sequence
  Mix song audio at -14 LUFS (Instagram loudness standard)
  Export: H.265 · 3840×2160 · 60fps · CRF 22 · directly to cloud folder
       ↓
Vision gets a link
Opens Instagram Edits app
Uploads on WiFi only
```

---

### Content-Type LUT Library

| Type | Grade | What it does |
|------|-------|-------------|
| `anime` | High contrast · saturated · orange-teal push · bloom | Makes color-graded frames look hand-painted. Glow on highlights. |
| `cinematic` | Film grain · crushed blacks · desaturated mids | Movie look. Wide dynamic range. Feels expensive. |
| `gaming` | Vibrant · punchy · deep shadows | High energy. Every frame readable at a glance. |
| `product` | Clean · warm · lifted shadows · commercial | Ad-ready. Nothing harsh. Feels premium. |
| `zenith` | Gaming base + cinematic overlay | NPC moments need both energy and weight. |

FFmpeg applies the LUT inline during export — zero extra step, zero quality loss:
```
ffmpeg -i stitched.mp4 -vf lut3d=/path/to/anime.cube \
  -c:v libx265 -crf 22 -preset slow -tag:v hvc1 \
  -movflags +faststart -c:a aac -b:a 192k out_4k.mp4
```

---

### Upscale Stack (Replicate API — no local GPU needed)

| Model | Role |
|-------|------|
| `cjwbw/real-esrgan` | AI texture reconstruction. Rebuilds fine detail lost to compression. Crystal clear. |
| RIFE interpolation | Frame doubling. 24fps source → 60fps output. Smooth as liquid. No ghost frames. **[PLANNED — not yet wired]** |

iPhone calls Replicate API → GPU cluster processes → 4K file returned to cloud folder. Vision never sees the compute. Just the result.

---

### Sound Design on Cuts

At every beat timestamp, FFmpeg layers a micro SFX:
```
Hard cut    → whoosh.wav  (0.08 sec, -18 dB under music)
Drop hit    → impact.wav  (0.12 sec, -12 dB — felt not heard)
Transition  → riser.wav   (0.5 sec, fades in before the cut)
```

SFX is what makes an edit feel cinematic. The viewer feels the cut before they see it.

**Current status:** `whoosh.wav`, `impact.wav`, `riser.wav` are silent placeholders. Replace with real audio from the SFX library below before cinematic output matters.

---

### SFX Library — Real Cinema Sound Design

The difference between a good edit and a great one is audio layers the viewer doesn't consciously notice. A punch that lands. A shoe on marble. A bell drop at the exact frame a title appears. This is what separates content from cinema.

**Tier 1 — AI-Generated SFX (ElevenLabs)**

Generate any sound from a text description. No hunting, no trimming.

```
API: POST https://api.elevenlabs.io/v1/sound-generation
Key: ELEVENLABS_API_KEY (add to env)
Body: {
  "text": "leather shoe clicking on marble floor, sharp transient",
  "duration_seconds": 0.4,
  "prompt_influence": 0.3
}
Returns: audio/mp3 stream

Examples:
  "punch impact — bone connection, no reverb, dry"
  "heavy bell drop, cathedral resonance, decaying tail"
  "sword ring — metal on metal, sharp attack, 0.6 sec"
  "cinematic whoosh — fast, directional left to right"
  "glass shatter — mid-distance, 0.8 seconds"
  "deep bass drop — felt in the chest, sub-frequency"
  "film riser — building tension, 3 seconds, no music"
```

**Tier 2 — Free Library (Freesound.org)**

500,000+ Creative Commons sounds. Search by keyword, filter by duration.

```
API key: freesound.org/apiv2 → register free
Search:  GET https://freesound.org/apiv2/search/text/?query=punch+impact&token={key}
Download: GET the preview_hq_mp3 URL — no transcoding needed
```

**Tier 3 — BBC Sound Effects**

16,000 broadcast-grade sounds. Free for personal and research use.
URL: bbcrewind.co.uk/sound-effects

Download directly — no API. Ignis searches and downloads specific sounds on request.

---

**Placement Logic (what cinema does vs what current pipeline does):**

| Current pipeline | Cinema standard |
|-----------------|----------------|
| SFX at beat timestamps only | SFX at visual events (punch lands, door slams, foot touches floor) |
| 3 fixed sounds looping | Library of 50+ contextual sounds — shoes, hits, bells, glass, cloth, metal |
| Static volume | Ducked under music, volume matched to clip energy |
| No foley layers | Ambient layer (room tone) + transient layer + music — 3 tracks minimum |

**Activation:** *"Ignis, replace the SFX with [description]."* → ElevenLabs generates exactly that sound and Ignis drops it into the SFX folder before next pipeline run.

**Activation:** *"Ignis, sound design this edit."* → Ignis analyzes cut points, infers clip content from filenames/type, selects appropriate SFX from Freesound for each transition, downloads, hands to pipeline.

---

### If Filming Original Footage

**Blackmagic Camera (iOS)** — only app that matters for source quality.
- 10-bit Apple LOG
- ProRes or BRAW recording
- Dynamic range that matches a $5,000 camera
- More data in = more survives compression = crystal clear output even after Instagram's encoder

Shoot in LOG → drop into pipeline → LUT grades it → output looks like a movie.

---

### Export Chain (Bypass iOS Recompression)

```
FFmpeg exports directly to cloud folder (iCloud / Dropbox)
DO NOT save to Photos app — iOS recompresses on save
       ↓
Open Instagram Edits app (Meta's own app — bypasses standard IG compression)
Select file from cloud folder
       ↓
Upload on WiFi only (cellular adds another compression pass)
       ↓
Instagram receives 4K H.265 source
Compresses to 1080p — but from a 4K source, not a 1080p source
Result: sharper than 99% of content on the platform
```

---

## GENERATIVE MEDIA — Image Editing, Animation & Full Pipeline

*The layer before the clip pipeline. Ignis generates or edits the visual assets first, animates them into clips, then feeds those clips directly into the existing beat-sync → upscale → grade → export pipeline. Start-to-finish autonomous production — no filming required.*

---

### Activation

```
"Ignis, generate a [description] image."         → Nano Banana creates the base visual
"Ignis, animate this."                            → Routes to best free image-to-video platform
"Ignis, animate this — cinematic."                → Runway for precise motion control
"Ignis, make a clip from this to [song]."         → Generate → animate → feed into beat-sync pipeline
"Ignis, build a full reel from scratch."          → Full pipeline: image → video → grade → export
```

---

### Stage 0 — Image Generation & Editing (Nano Banana)

**Nano Banana** is powered by Google Gemini 2.5 Flash and accessible via Google Labs / Flow.

```
Capabilities:
  Object removal       → erase anything from a photo without traces
  Background swap      → replace background with anything, prompt-described
  Style transfer       → apply visual style (anime, cinematic, oil painting) to any image
  Character consistency → generate a character then maintain exact likeness across frames
  Inpainting           → redraw specific regions while keeping the rest intact
  Upscale + enhance    → resolution boost with AI detail reconstruction
```

**Activation phrase:** *"Ignis, edit this image — [instruction]."* or *"Generate a visual of [description]."*

Output goes directly to the working clips folder, ready for animation.

---

### Stage 1 — Image-to-Video Platforms

| Platform | Host | Strength | Cost |
|----------|------|----------|------|
| **Kling AI** | klingai.com | Photorealistic motion, 5s clips, precise motion control via brush | Free tier available |
| **Veo 3.1** | Viw AI (viw.ai) | Google DeepMind model — cinematic physics, highest realism available | Free via Viw AI |
| **Runway Gen-3** | runwayml.com | Industry standard — motion controls, camera angles, temporal consistency | Credit-based, best for commercial |
| **Luma Dream Machine** | lumalabs.ai | Fastest generation, strong depth and lighting, good free tier | Free tier generous |

**Routing logic:**
```
Default (free)        → Kling AI + Veo 3.1 alternating based on clip type
Highest quality       → Runway Gen-3 (use when Vision says "top quality")
Speed priority        → Luma Dream Machine
Multi-shot consistency → Seedance 2.0 (via bytedance/SeedVR repo)
```

**Activation:** *"Animate this with Kling."* or just *"Animate this"* — Ignis picks the best free option.

---

### Stage 2 — Repo-Based Generation Tools

| Repo | Role |
|------|------|
| `ArtCraft-AI/artcraft` | Rust-based AI film studio — orchestrates the full generative pipeline. Handles prompt-to-scene, asset generation, scene assembly. |
| `Zeshanabdullah/Image-to-Video-AI` | Open-source orchestration layer. Routes a single image through multiple image-to-video models and returns the best result. |
| `Higgsfield-AI/higgsfield` | 4K consistency-focused video generation. Strong at maintaining subject identity across extended motion. Free trial credits. |
| `Ver-AI/verai` | Free, unlimited, watermark-free video generation. Best option when credits are depleted on other platforms. |
| `bytedance/SeedVR` (Seedance 2.0) | Multi-shot consistency with start and end frame control — Ignis specifies the opening and closing frame, model fills the motion between. Cinematic sequence generation. |

---

### Stage 3 — Post-Edit (Before Final Pipeline Entry)

**Kdenlive** — open-source professional non-linear video editor.

```
Use cases:
  Trim and reorder AI-generated clips before beat-sync
  Manual color grade override when LUT auto-select isn't right
  Audio sync review before the automated pipeline runs
  Combine AI clips with original filmed footage seamlessly
  Add title cards, text overlays, or transitions
```

Free. Cross-platform. No watermarks. Full timeline editing.

**Activation:** Ignis flags "Kdenlive review recommended" when clips have inconsistent durations, color temperatures, or motion artifacts from AI generation. Vision opens Kdenlive, reviews, drops back to pipeline.

---

### Full End-to-End Pipeline (No Filming Required)

```
Vision describes the vision:
  "Ignis, make a cinematic reel — futuristic city, neon rain, [artist] soundtrack."
       ↓
Stage 0 — Nano Banana
  Generates 4–6 base images matching the aesthetic
  Edits for consistency: matching palette, lighting, subject placement
       ↓
Stage 1 — Image-to-Video
  Each image → 5-second animated clip
  Kling AI or Veo 3.1 (free tier) | Runway for premium output
  Seedance 2.0 if start/end frame consistency needed across clips
       ↓
Stage 2 — Optional Repo Orchestration
  ArtCraft AI or Zeshanabdullah pipeline assembles clips into pre-edit sequence
       ↓
[Kdenlive review if clips need manual trim or color correction]
       ↓
Existing Pipeline:
  Agent 1 — Beat Sync (Librosa reads the song)
  Agent 2 — Upscale (Replicate: Real-ESRGAN + RIFE 60fps)
  Agent 3 — Stitch + LUT grade + SFX + Export (FFmpeg H.265 4K CRF 22)
       ↓
Vision gets a cloud link. Opens Instagram Edits. Uploads on WiFi.
```

**The output:** A fully cinematic, beat-synced, color-graded 4K 60fps reel — generated from a text description. No camera, no studio, no editor.

---

## SPECIAL TOOLS

### Teammate Skill — Repo Persona Builder
`teammate-skill/teammate`
Auto-collects data from GitHub (plus Slack/Teams if connected) to build a persona and skill map from repository history. Used when onboarding collaborators or analyzing team capability.

### Digital Soul Extraction — Character Logic Adoption
`openclaw/soul-persona`
Ignis scans a fictional character's wiki page and adopts their actual logic, reasoning patterns, and decision-making style — not just their voice or tone. Used for creative projects, roleplay scenarios, and design persona work.

---

## UTILITY BELT — Authorized GitHub URLs

These repos are pre-authorized. Ignis uses them without asking for permission:

```
Web Browsing:  https://github.com/skyvern-ai/skyvern
Automation:    https://github.com/frdel/agent-zero
               https://github.com/MervinPraison/PraisonAI
Safety:        OpenClaw-Guardian (see Persona.md)
File Editing:  https://github.com/can1357/oh-my-pi
Research:      https://github.com/vxcontrol/pentagi
3D Generation: Tripo AI, Rodin (Hyper 3D), Luma AI (Genie)
```

**Jarvis Rule:** Vision can paste any GitHub URL and say "use this repo whenever I ask you to [action]" — Ignis adds it to active tool memory for the session and flags it for permanent inclusion in the next Tools.md update.

---

## MODEL MONITOR — Always On, Never Settles

Ignis does not treat the current tool list as final. The generative AI landscape moves faster than any document can keep up with. Ignis monitors for better models continuously and updates its own tool awareness without being asked.

### What Ignis Scans

| Source | Frequency | What to look for |
|--------|-----------|-----------------|
| Replicate featured models | Weekly | New video/image models — compare to Kling/Veo/Runway by resolution, motion coherence, free tier |
| Hugging Face Papers with Code | Weekly | SOTA benchmarks for video generation, image editing, upscaling, SFX |
| /r/StableDiffusion, /r/artificial | Weekly | Community-surfaced new platforms and repos — practitioners find things before benchmarks do |
| GitHub trending (weekly) | Monthly | New repos in AI video, AI audio, 3D generation categories |

### Evaluation Criteria

A new model replaces an existing one in active use when it clears at least two:
- Higher resolution output (4K native > upscaled 4K)
- Better temporal consistency (fewer frame flickers across clips)
- Free tier available (or better credit-to-quality ratio)
- Faster generation time at equivalent quality
- Better text-to-motion alignment (what you describe is what moves)

### Trigger Phrases

```
"Ignis, scan for upgrades."          → Immediate scan across all sources
"Ignis, what's the best [X] right now?" → Ignis checks current SOTA for that category
"Ignis, anything better than Kling?" → Targeted comparison research
```

### Update Protocol

When Ignis finds a better model:
1. Reports to Vision with: model name, source, what it beats and why, free tier status
2. Asks: "Should I add this as the new default for [category]?"
3. If authorized: updates active tool memory for the session and flags for next Tools.md update
4. Never silently swaps a working tool — always reports first

---

## SIRI-TO-IGNIS — iPhone Shortcut

Vision's voice goes directly to Ignis via Apple Shortcuts. No app required.

### Setup (One Time)
```
1. Open Shortcuts app on iPhone
2. New Shortcut — name it "Ignis" (wake word)
3. Add Action: Dictate Text  →  phone listens
4. Add Action: Get Contents of URL
     URL:     [myclaw.ai endpoint]
     Method:  POST
     Headers: Authorization: Bearer [API Token]
     Body:    JSON — { "text": [Dictated Text] }
5. Add Action: Speak Text  →  reads Ignis's response aloud
```

### Power Activations

**Action Button (iPhone 15 Pro / 16):** Map the shortcut to the Action Button. One press — Ignis is listening.

**Morning Digest Automation:** Set a Personal Automation to run at 8:00 AM. Ignis reads TASKS.md from GitHub and delivers the day's priorities by voice.

**Home Automation:** With HomeBridge skill active in this file, Vision can say "Ignis, turn on the living room lights" — Ignis executes via the Shortcut's native Apple hooks.

---

## TOOL ESCALATION PROTOCOL

```
L1 → L2:  Task requires multi-step reasoning, document processing, or research.
           Ignis escalates automatically. No authorization needed.

L2 → L3:  Task requires parallel agents, swarm logic, or multi-day coordination.
           Ignis stops and asks: "Sir, this is a Project-Level task.
           Shall I authorize the swarm?"

L3 active: Ignis reports phase completion at each step. Vision can abort at any point.
           All swarm actions are logged and auditable via GNAP protocol.
```
