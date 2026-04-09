import type { NextApiRequest, NextApiResponse } from 'next'

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://retail-talked-monitors-ground.trycloudflare.com'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '201b0a73ffd7d7653e82552d530a539f3d86ba8d168073f269d7eef51e00ca10'

interface Msg {
  id: number
  role: 'user' | 'ignis' | 'council' | 'system'
  text: string
  time: string
  minds?: string[]
}

const store: { messages: Msg[]; counter: number } = { messages: [], counter: 0 }

async function callGateway(text: string): Promise<string> {
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openclaw',
      messages: [{ role: 'user', content: text }],
      max_tokens: 800,
      temperature: 0.8
    })
  })
  if (!res.ok) throw new Error(`Gateway ${res.status}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || '[No response]'
}

function now(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  // GET: poll for new messages since index N
  if (req.method === 'GET') {
    const since = parseInt(req.query.since as string) || 0
    return res.status(200).json({ messages: store.messages.slice(since), timestamp: store.messages.length })
  }

  // POST
  if (req.method === 'POST') {
    const { role, text, minds } = req.body as { role?: string; text?: string; minds?: string[] }

    // Ignis response write (from relay — bypasses gateway)
    if (role === 'ignis' && text) {
      const msg: Msg = { id: ++store.counter, role: 'ignis', text: String(text).trim(), time: now(), minds: minds || [] }
      store.messages.push(msg)
      return res.status(200).json({ ok: true, id: msg.id, timestamp: store.messages.length })
    }

    if (!text) return res.status(400).json({ error: 'No text' })

    const userMsg: Msg = { id: ++store.counter, role: 'user', text: String(text).trim(), time: now(), minds: minds || [] }
    store.messages.push(userMsg)

    // Call gateway — returns the AI response directly
    try {
      const response = await callGateway(String(text).trim())
      const ignisMsg: Msg = { id: ++store.counter, role: 'ignis', text: response, time: now(), minds: minds || [] }
      store.messages.push(ignisMsg)
      return res.status(200).json({ ok: true, userId: userMsg.id, ignisId: ignisMsg.id, text: response, timestamp: store.messages.length })
    } catch (err: any) {
      return res.status(200).json({ ok: true, userId: userMsg.id, text: `[Gateway error: ${err.message}]`, timestamp: store.messages.length })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
