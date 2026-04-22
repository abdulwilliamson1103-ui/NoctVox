import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const GATEWAY_URL   = process.env.GATEWAY_URL   || 'https://retail-talked-monitors-ground.trycloudflare.com'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '201b0a73ffd7d7653e82552d530a539f3d86ba8d168073f269d7eef51e00ca10'

function readIgnisFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'ignis', filename), 'utf8')
  } catch {
    return ''
  }
}

function buildSystemPrompt(aum: any): string {
  const persona = readIgnisFile('Persona.md')
  const memory  = readIgnisFile('Memory.md')
  const tools   = readIgnisFile('Tools.md')

  const parts: string[] = []

  if (persona) parts.push(persona)
  if (memory)  parts.push(memory)
  if (tools)   parts.push(tools)

  // Aum soul prompt — full pipeline output from router.ts
  if (aum?.systemPrompt && typeof aum.systemPrompt === 'string' && aum.systemPrompt.length > 0) {
    parts.push(aum.systemPrompt)
  }

  return parts.join('\n\n---\n\n')
}

async function callGateway(text: string, systemPrompt: string): Promise<string> {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: text },
  ]
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openclaw', messages, max_tokens: 800, temperature: 0.8 }),
  })
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${await res.text()}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || '[No response]'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method === 'GET')     { return res.status(200).json({ messages: [], timestamp: 0 }) }

  if (req.method === 'POST') {
    const { text, minds, aumContext } = req.body as { text?: string; minds?: string[]; aumContext?: any }
    if (!text) return res.status(400).json({ error: 'No text' })

    const systemPrompt = buildSystemPrompt(aumContext ?? null)

    try {
      const response = await callGateway(String(text).trim(), systemPrompt)
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

async function callGateway(text: string, systemPrompt: string): Promise<string> {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: text },
  ]
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openclaw', messages, max_tokens: 800, temperature: 0.8 }),
  })
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${await res.text()}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || '[No response]'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method === 'GET')     { return res.status(200).json({ messages: [], timestamp: 0 }) }

  if (req.method === 'POST') {
    const { text, minds, aumContext } = req.body as { text?: string; minds?: string[]; aumContext?: any }
    if (!text) return res.status(400).json({ error: 'No text' })

    const systemPrompt = buildSystemPrompt(aumContext ?? null)

    try {
      const response = await callGateway(String(text).trim(), systemPrompt)
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
