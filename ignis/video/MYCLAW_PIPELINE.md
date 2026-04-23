# Ignis Video Pipeline — MyClaw Server Spec

This file tells MyClaw exactly what endpoints to expose so the Ignis
portal can upload video clips, run the pipeline, and serve the finished edit.

**When MyClaw reads this file and sees it's not yet active, it should
set up these endpoints automatically and confirm when ready.**

---

## Overview

The portal (running on Vercel) cannot run Python or FFmpeg.
MyClaw (running locally, exposed via Cloudflare tunnel) is the processing engine.

The full flow once MyClaw exposes these routes:

```
iPhone portal
  ↓ POST directly to MyClaw /pipeline/upload  ← large file, bypasses Vercel
    (falls back to /api/ignis-upload proxy if gateway config not loaded)
      ↓ saves clips to /tmp/ignis_{jobId}/
      ↓ runs: python run.py --clips ... --type ... --output ...
      ↓ tracks job status in memory
    ↑ returns { jobId }
  ↑ portal polls status every 4s via /api/ignis-upload?jobId=xxx (proxied)
    ↓ GET /pipeline/status/{jobId} (MyClaw)
    ↑ returns { status, progress, downloadUrl }
  ↑ when done — portal opens download link via proxy
    ↓ GET /pipeline/download/{jobId} (MyClaw)
    ↑ streams final_output.mp4
```

**Why direct upload?**
Vercel free tier caps request bodies at ~4.5 MB. Video clips are always larger.
The portal fetches `/api/ignis-config` on load to get `gatewayUrl` + `gatewayToken`,
then POSTs clips directly to MyClaw. Status polling and download still go through
the Next.js proxy (both are small payloads — no size issue there).

---

## Endpoints to Expose

### 1. POST /pipeline/upload

Accepts video clips and pipeline options. Starts the job immediately in a
background thread. Returns a `jobId` without waiting for completion.

**⚠ CORS required on this endpoint** — the portal POSTs directly from the browser.
MyClaw must respond with:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```
And handle the `OPTIONS` preflight with `200 OK` before the actual `POST` arrives.

**Request:**
```
Content-Type: multipart/form-data
Authorization: Bearer {GATEWAY_TOKEN}

Fields:
  clips         File[]   Required. One or more video clip files (.mp4 .mov .m4v)
  song          File     Optional. Song for beat sync (.mp3 .wav .m4a)
  type          string   Optional. 'anime' | 'cinematic' | 'portrait' | 'sport' | 'raw'
                         Default: 'cinematic'
  skipUpscale   string   Optional. 'true' | 'false'. Default: 'false'
                         Set 'true' to skip Replicate upscaling (faster, lower quality)
  scale         string   Optional. '2' | '4'. Default: '4'
  clipDuration  string   Optional. Seconds per clip slot. Default: '2.5'
```

**Response 202:**
```json
{
  "jobId": "abc123",
  "status": "queued"
}
```

**What MyClaw does internally:**
```python
import uuid, os, threading

jobId   = str(uuid.uuid4())[:8]
job_dir = f"/tmp/ignis_{jobId}"
clips_dir = f"{job_dir}/clips"
os.makedirs(clips_dir, exist_ok=True)

# Save uploaded clips to clips_dir
# Save song to job_dir/song.* if provided
# Store job state: jobs[jobId] = { status: 'queued', progress: '', output: None }

# Start background thread:
def run_pipeline():
    jobs[jobId]['status'] = 'running'
    try:
        cmd = [
            'python', '/path/to/ignis/video/run.py',
            '--clips',  clips_dir,
            '--type',   type_param,
            '--output', f'{job_dir}/output.mp4',
            '--skip-upscale',  # if skipUpscale == 'true'
        ]
        if song_path:
            cmd += ['--song', song_path]

        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in proc.stdout:
            jobs[jobId]['progress'] = line.strip()
        proc.wait()

        if proc.returncode == 0:
            jobs[jobId]['status']  = 'done'
            jobs[jobId]['output']  = f'{job_dir}/output.mp4'
        else:
            jobs[jobId]['status']  = 'error'
            jobs[jobId]['progress'] = 'Pipeline failed — check server logs'
    except Exception as e:
        jobs[jobId]['status']   = 'error'
        jobs[jobId]['progress'] = str(e)

threading.Thread(target=run_pipeline, daemon=True).start()
```

---

### 2. GET /pipeline/status/{jobId}

Returns the current state of a job. The portal polls this every 4 seconds.

**Request:**
```
Authorization: Bearer {GATEWAY_TOKEN}
```

**Response 200 (while running):**
```json
{
  "jobId": "abc123",
  "status": "running",
  "progress": "Trimming clips..."
}
```

**Response 200 (complete):**
```json
{
  "jobId": "abc123",
  "status": "done",
  "progress": "Done.",
  "downloadUrl": "/pipeline/download/abc123"
}
```

**Response 200 (error):**
```json
{
  "jobId": "abc123",
  "status": "error",
  "progress": "Pipeline failed — ffmpeg not found"
}
```

**Response 404:**
```json
{ "error": "Job not found" }
```

---

### 3. GET /pipeline/download/{jobId}

Streams the finished MP4 file to the client.

**Request:**
```
Authorization: Bearer {GATEWAY_TOKEN}
```

**Response 200:**
```
Content-Type: video/mp4
Content-Disposition: attachment; filename="ignis_edit.mp4"
Content-Length: {file size in bytes}

[binary MP4 stream]
```

**Response 404:** Job not found or not done yet.

**Response 425:** Job still processing (use 425 Too Early so the portal knows to wait).

---

## Environment Requirements

MyClaw must have these available where the pipeline runs:

```
python3          with pip packages: librosa, soundfile, numpy, replicate, requests
ffmpeg           in PATH (brew install ffmpeg / apt install ffmpeg)
REPLICATE_API_TOKEN  in environment (only needed when skipUpscale is false)
```

The pipeline scripts are at: `ignis/video/` in the NoctVox repo root.
`run.py` is the entry point.

---

## Auth

All three endpoints require:
```
Authorization: Bearer {GATEWAY_TOKEN}
```

`GATEWAY_TOKEN` is the same token already used for the `/v1/chat/completions` endpoint.
MyClaw should validate it on every pipeline request the same way it does for LLM requests.

---

## Job Cleanup

Jobs and their temp files can be cleaned up after 1 hour.
A simple background task that checks `/tmp/ignis_*/` and deletes anything older than 3600s is sufficient.

---

## Test It

Once active, MyClaw should confirm by responding to:

```bash
curl -X POST {GATEWAY_URL}/pipeline/upload \
  -H "Authorization: Bearer {GATEWAY_TOKEN}" \
  -F "clips=@test_clip.mp4" \
  -F "type=cinematic" \
  -F "skipUpscale=true"
```

Expected: `{ "jobId": "...", "status": "queued" }`

Then poll:
```bash
curl {GATEWAY_URL}/pipeline/status/{jobId} \
  -H "Authorization: Bearer {GATEWAY_TOKEN}"
```

Expected: status moves `queued → running → done`

---

## Summary for MyClaw

Three endpoints:

| Method | Path | What it does |
|--------|------|-------------|
| POST | /pipeline/upload | Accept clips, start run.py in background, return jobId |
| GET  | /pipeline/status/{jobId} | Return current status + progress string |
| GET  | /pipeline/download/{jobId} | Stream finished MP4 |

Same auth token as LLM endpoint. Python + FFmpeg must be in environment.
Pipeline scripts are in `ignis/video/` — `run.py` is the entry point.
