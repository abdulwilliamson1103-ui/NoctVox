// Aum Routing Engine — Next.js API Route
// POST /api/aum
//
// Runs the full routing pipeline: Intent → House → Torch → Ring → Echo
// Loads house mass from Upstash Redis, routes, persists result, returns AumRoutingResponse.

import type { NextApiRequest, NextApiResponse } from 'next';
import { routeIntent } from '@/src/core/router';
import {
  loadHouseMasses,
  persistRoutingSession,
  updateHouseMasses,
  storeEpisodicMemory,
} from '@/src/core/upstash';
import { classifyMassEvent, compressToMemory } from '@/src/core/memory';
import { HOUSE_MAP } from '@/src/core/houses';
import { TORCH_MAP } from '@/src/core/torches';
import type { AumRoutingRequest, AumRoutingResponse } from '@/src/core/types';

function setCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AumRoutingResponse | { error: string }>
) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed — use POST.' });
  }

  const body = req.body as Partial<AumRoutingRequest>;
  const { rawInput, userId, surfaceType, sessionId, overrideTorch } = body;

  if (!rawInput || typeof rawInput !== 'string' || rawInput.trim().length === 0) {
    return res.status(400).json({ error: 'rawInput is required and must be a non-empty string.' });
  }
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required.' });
  }

  const request: AumRoutingRequest = {
    rawInput: rawInput.trim(),
    userId,
    surfaceType: surfaceType ?? 'browser',
    sessionId: sessionId ?? crypto.randomUUID(),
    overrideTorch,
  };

  try {
    // Load user's accumulated house mass (personalization prior)
    const houseMasses = await loadHouseMasses(userId);

    // Run the full Aum routing pipeline
    const result = await routeIntent(request, houseMasses);

    // Persist session and update house masses; store episodic memory for emotional events
    const eventType = classifyMassEvent(request.rawInput);
    const persistTasks: Promise<any>[] = [
      persistRoutingSession(result),
      updateHouseMasses(userId, result.massUpdate),
    ];
    if (eventType !== 'QUERY_ONLY') {
      const house = HOUSE_MAP[result.houseMapping.primaryHouseId];
      const torch = TORCH_MAP[result.torchActivation.dominant];
      persistTasks.push(
        storeEpisodicMemory({
          userId,
          houseId: result.houseMapping.primaryHouseId,
          content: compressToMemory(request.rawInput, house.name, torch.name),
          emotionalSignature: result.torchActivation.dominant,
          massContribution: result.massUpdate[result.houseMapping.primaryHouseId] ?? 2,
          surfaceType: request.surfaceType,
        })
      );
    }
    await Promise.allSettled(persistTasks);

    return res.status(200).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal routing error';
    console.error('[Aum API]', message);
    return res.status(500).json({ error: message });
  }
}
