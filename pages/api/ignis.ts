import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const GATEWAY_URL   = process.env.GATEWAY_URL   || 'https://retail-talked-monitors-ground.trycloudflare.com'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '201b0a73ffd7d7653e82552d530a539f3d86ba8d168073f269d7eef51e00ca10'

// Disable response size cap — required for streaming
export const config = { api: { responseLimit: false } }

function readIgnisFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'ignis', filename), 'utf8')
  } catch {
    return ''
  }
}

function readRootFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), filename), 'utf8')
  } catch {
    return ''
  }
}

function buildSystemPrompt(aum: any): string {
  const persona  = readIgnisFile('Persona.md')
  const memory   = readIgnisFile('Memory.md')
  const tools    = readIgnisFile('Tools.md')
  const routing  = readIgnisFile('domain_routing.md')
  const tasks    = readRootFile('TASKS.md')

  const parts: string[] = []
  if (persona)  parts.push(persona)
  if (memory)   parts.push(memory)
  if (tools)    parts.push(tools)
  if (routing)  parts.push(routing)
  if (tasks)    parts.push(`## VISION'S CURRENT TASKS\n\n${tasks}`)

  if (aum?.systemPrompt && typeof aum.systemPrompt === 'string' && aum.systemPrompt.length > 0) {
    parts.push(aum.systemPrompt)
  }

  return parts.join('\n\n---\n\n')
}

type HistoryItem = { role: string; content: string }

async function callGateway(text: string, systemPrompt: string, history: HistoryItem[]): Promise<string> {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: text },
  ]
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openclaw', messages, max_tokens: 2048, temperature: 0.8 }),
  })
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${await res.text()}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || '[No response]'
}

async function streamGateway(
  text: string, systemPrompt: string, history: HistoryItem[],
  res: NextApiResponse, minds: string[]
): Promise<void> {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: text },
  ]

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')

  let upstream: Response
  try {
    upstream = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openclaw', messages, max_tokens: 2048, temperature: 0.8, stream: true }),
    })
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
    return
  }

  if (!upstream.ok) {
    res.write(`data: ${JSON.stringify({ error: `Gateway ${upstream.status}` })}\n\n`)
    res.end()
    return
  }

  const reader = upstream.body?.getReader()
  if (!reader) {
    res.write(`data: ${JSON.stringify({ error: 'Empty gateway response' })}\n\n`)
    res.end()
    return
  }

  const decoder = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
      if ((res as any).flush) (res as any).flush()
    }
  } catch (_) { /* stream cut — send done event below */ }

  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  res.write(`data: ${JSON.stringify({ ignis_done: true, role: 'ignis', time, minds })}\n\n`)
  res.end()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method === 'GET')     { return res.status(200).json({ messages: [], timestamp: 0 }) }

  if (req.method === 'POST') {
    const { text, minds, aumContext, history, stream } = req.body as {
      text?: string; minds?: string[]; aumContext?: any;
      history?: HistoryItem[]; stream?: boolean;
    }
    if (!text) return res.status(400).json({ error: 'No text' })

    const systemPrompt = buildSystemPrompt(aumContext ?? null)
    const safeHistory  = Array.isArray(history) ? history.slice(-40) : []

    if (stream) {
      await streamGateway(String(text).trim(), systemPrompt, safeHistory, res, minds || [])
      return
    }

    try {
      const response = await callGateway(String(text).trim(), systemPrompt, safeHistory)
      return res.status(200).json({
        ok: true, role: 'ignis', text: response, minds: minds || [],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      })
    } catch (err: any) {
      return res.status(200).json({
        ok: true, role: 'ignis', text: `[Gateway error: ${err.message}]`, minds: [],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
