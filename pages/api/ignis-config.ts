import type { NextApiRequest, NextApiResponse } from 'next'

const GATEWAY_URL   = process.env.GATEWAY_URL   || 'https://retail-talked-monitors-ground.trycloudflare.com'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '201b0a73ffd7d7653e82552d530a539f3d86ba8d168073f269d7eef51e00ca10'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({ gatewayUrl: GATEWAY_URL, gatewayToken: GATEWAY_TOKEN })
}
