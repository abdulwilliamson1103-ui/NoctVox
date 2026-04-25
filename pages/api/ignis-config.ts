import type { NextApiRequest, NextApiResponse } from 'next'

const GATEWAY_URL   = process.env.GATEWAY_URL   || 'https://retail-talked-monitors-ground.trycloudflare.com'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '201b0a73ffd7d7653e82552d530a539f3d86ba8d168073f269d7eef51e00ca10'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  res.json({ gatewayUrl: GATEWAY_URL, gatewayToken: GATEWAY_TOKEN })
}
