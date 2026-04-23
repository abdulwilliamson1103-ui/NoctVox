import type { NextApiRequest, NextApiResponse } from 'next'

const GATEWAY_URL   = process.env.GATEWAY_URL   || 'https://retail-talked-monitors-ground.trycloudflare.com'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '201b0a73ffd7d7653e82552d530a539f3d86ba8d168073f269d7eef51e00ca10'

// Disable body parser so we can stream multipart directly to MyClaw
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}

function corsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function readBodyBuffer(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data',  (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    req.on('end',   ()              => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const authHeader = { Authorization: `Bearer ${GATEWAY_TOKEN}` }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  corsHeaders(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  // ── POST /api/ignis-upload ───────────────────────────
  // Forward multipart clips + options to MyClaw /pipeline/upload
  // MyClaw saves files, starts run.py in background, returns { jobId }
  if (req.method === 'POST') {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' })
    }
    try {
      const body = await readBodyBuffer(req)
      const upstream = await fetch(`${GATEWAY_URL}/pipeline/upload`, {
        method:  'POST',
        headers: { ...authHeader, 'Content-Type': contentType },
        body,
      })
      const data = await upstream.json()
      return res.status(upstream.ok ? 202 : upstream.status).json(data)
    } catch (err: any) {
      return res.status(502).json({ error: `MyClaw unreachable: ${err.message}` })
    }
  }

  // ── GET /api/ignis-upload?jobId=xxx ──────────────────
  // Poll job status from MyClaw /pipeline/status/{jobId}
  // Returns { jobId, status, progress, downloadUrl? }
  //
  // GET /api/ignis-upload?jobId=xxx&download=1
  // Proxy the finished MP4 stream from MyClaw /pipeline/download/{jobId}
  if (req.method === 'GET') {
    const { jobId, download } = req.query as { jobId?: string; download?: string }
    if (!jobId) return res.status(400).json({ error: 'jobId required' })

    if (download === '1') {
      // Stream finished MP4 through to the browser
      try {
        const upstream = await fetch(`${GATEWAY_URL}/pipeline/download/${jobId}`, {
          headers: authHeader,
        })
        if (!upstream.ok) {
          const status = upstream.status === 425 ? 425 : 404
          return res.status(status).json({ error: 'File not ready yet' })
        }
        res.setHeader('Content-Type',        'video/mp4')
        res.setHeader('Content-Disposition', `attachment; filename="ignis_edit_${jobId}.mp4"`)
        const cl = upstream.headers.get('content-length')
        if (cl) res.setHeader('Content-Length', cl)

        const reader = upstream.body?.getReader()
        if (!reader) return res.status(500).json({ error: 'Empty response from MyClaw' })
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(Buffer.from(value))
        }
        res.end()
      } catch (err: any) {
        return res.status(502).json({ error: `MyClaw unreachable: ${err.message}` })
      }
      return
    }

    // Status poll
    try {
      const upstream = await fetch(`${GATEWAY_URL}/pipeline/status/${jobId}`, {
        headers: authHeader,
      })
      const data = await upstream.json()
      // If done, rewrite downloadUrl to go through our authenticated proxy
      if (data.status === 'done') {
        data.downloadUrl = `/api/ignis-upload?jobId=${jobId}&download=1`
      }
      return res.status(upstream.status).json(data)
    } catch (err: any) {
      return res.status(502).json({ error: `MyClaw unreachable: ${err.message}` })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
