import type { NextApiRequest, NextApiResponse } from 'next'

// Shared message store (in-memory for Vercel serverless)
// Messages persist only within the same Lambda container instance
interface Msg { id: number; role: string; text: string; time: string; minds?: string[] }

const store: { messages: Msg[] } = { messages: [] }
let counter = 0

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  // GET: poll for new messages
  if (req.method === 'GET') {
    const since = parseInt(req.query.since as string) || 0
    const newMsgs = store.messages.slice(since)
    return res.status(200).json({ messages: newMsgs, timestamp: store.messages.length })
  }

  // POST: either submit user message OR write ignis response
  if (req.method === 'POST') {
    const { role, text, minds } = req.body

    // Ignis response write — bypass user checks
    if (role === 'ignis' && text) {
      const msg: Msg = {
        id: ++counter,
        role: 'ignis',
        text: String(text).trim(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        minds: minds || []
      }
      store.messages.push(msg)
      return res.status(200).json({ ok: true, id: msg.id, timestamp: store.messages.length })
    }

    // User message
    if (!text) return res.status(400).json({ error: 'No text' })
    const msg: Msg = {
      id: ++counter,
      role: 'user',
      text: String(text).trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      minds: minds || []
    }
    store.messages.push(msg)
    return res.status(200).json({ ok: true, id: msg.id, timestamp: store.messages.length })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
