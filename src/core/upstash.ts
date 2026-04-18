// Aum Routing Engine — Upstash Redis Persistence Layer
//
// Drop-in replacement for supabase.ts — same function signatures,
// same graceful fallback behavior when env vars are missing.
//
// Why Upstash instead of Supabase:
//   Upstash Redis uses a plain HTTP REST API with a bearer token.
//   No connection pooling, no host allowlists, works from any runtime
//   including serverless Edge Functions and mobile-adjacent dev servers.
//
// Setup (2 minutes):
//   1. upstash.com → Create account → New Database → Redis
//   2. Copy REST URL  → UPSTASH_REDIS_REST_URL
//   3. Copy REST Token → UPSTASH_REDIS_REST_TOKEN
//   4. Paste both into .env.local
//
// Data layout in Redis:
//   aum:mass:{userId}           → Hash  { houseId: totalMass }
//   aum:sessions:{userId}       → List  [ ...JSON session strings ] (newest first)
//   aum:mem:{userId}:{houseId}  → ZSet  scored by massContribution, member = JSON
//   aum:fractal:{userId}        → String (baseline fractal checksum — set on first session)

import { Redis } from '@upstash/redis';
import type { AumRoutingResponse, HouseId, TorchId, SurfaceType } from './types';

// ─── Client ───────────────────────────────────────────────────────────────────

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL   ?? '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

if (!REDIS_URL   && typeof window === 'undefined') console.warn('[Aum] UPSTASH_REDIS_REST_URL not set — persistence unavailable.');
if (!REDIS_TOKEN && typeof window === 'undefined') console.warn('[Aum] UPSTASH_REDIS_REST_TOKEN not set — persistence unavailable.');

function getClient(): Redis | null {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  return new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
}

// ─── House Mass Ledger ────────────────────────────────────────────────────────

export async function loadHouseMasses(
  userId: string
): Promise<Record<number, number>> {
  const redis = getClient();
  if (!redis) return {};
  try {
    const raw = await redis.hgetall(`aum:mass:${userId}`);
    if (!raw) return {};
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [Number(k), Number(v)])
    );
  } catch (err) {
    console.error('[Aum] loadHouseMasses error:', err);
    return {};
  }
}

export async function updateHouseMasses(
  userId: string,
  massUpdate: Record<number, number>
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const key = `aum:mass:${userId}`;
    // Load existing, add contribution, write back
    const existing = await loadHouseMasses(userId);
    const pipeline = redis.pipeline();
    for (const [houseIdStr, contribution] of Object.entries(massUpdate)) {
      const houseId = Number(houseIdStr);
      const current = existing[houseId] ?? 0;
      pipeline.hset(key, { [houseId]: current + contribution });
    }
    await pipeline.exec();
  } catch (err) {
    console.error('[Aum] updateHouseMasses error:', err);
  }
}

// ─── Session Log ──────────────────────────────────────────────────────────────

export async function persistRoutingSession(
  response: AumRoutingResponse
): Promise<string | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const payload = JSON.stringify({
      id:               response.sessionId,
      primary_house:    response.houseMapping.primaryHouseId,
      dominant_torch:   response.torchActivation.dominant,
      active_ring:      response.ringActivation.primary,
      lead_echo:        response.echoBlend.leadEcho.id,
      expression_mode:  response.expressionMode,
      alignment_status: response.alignmentStatus,
      created_at:       response.timestamp,
    });
    // Prepend to list — newest first. Keep last 500 sessions per user.
    const key = `aum:sessions:${response.userId}`;
    await redis.lpush(key, payload);
    await redis.ltrim(key, 0, 499);
    return response.sessionId;
  } catch (err) {
    console.error('[Aum] persistRoutingSession error:', err);
    return null;
  }
}

export async function getRecentSessions(
  userId: string,
  limit = 10
): Promise<any[]> {
  const redis = getClient();
  if (!redis) return [];
  try {
    const raw = await redis.lrange(`aum:sessions:${userId}`, 0, limit - 1);
    return raw.map((s: string) => JSON.parse(s));
  } catch (err) {
    console.error('[Aum] getRecentSessions error:', err);
    return [];
  }
}

// ─── Fractal Checksum ─────────────────────────────────────────────────────────

export async function loadFractalChecksum(userId: string): Promise<string | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    return await redis.get<string>(`aum:fractal:${userId}`);
  } catch (err) {
    console.error('[Aum] loadFractalChecksum error:', err);
    return null;
  }
}

export async function saveFractalChecksum(userId: string, checksum: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(`aum:fractal:${userId}`, checksum);
  } catch (err) {
    console.error('[Aum] saveFractalChecksum error:', err);
  }
}

// ─── Episodic Memory ──────────────────────────────────────────────────────────

export async function storeEpisodicMemory(params: {
  userId: string;
  houseId: HouseId;
  content: string;
  emotionalSignature: TorchId;
  massContribution: number;
  surfaceType: SurfaceType;
  tags?: string[];
}): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const member = JSON.stringify({
      content:            params.content,
      emotionalSignature: params.emotionalSignature,
      massContribution:   params.massContribution,
      surfaceType:        params.surfaceType,
      tags:               params.tags ?? [],
      createdAt:          new Date().toISOString(),
    });
    const key = `aum:mem:${params.userId}:${params.houseId}`;
    // Score = massContribution — higher mass memories sort to top
    await redis.zadd(key, { score: params.massContribution, member });
    // Cap at 200 memories per house per user
    await redis.zremrangebyrank(key, 0, -201);
  } catch (err) {
    console.error('[Aum] storeEpisodicMemory error:', err);
  }
}

export async function retrieveRelevantMemories(
  userId: string,
  houseId: HouseId,
  limit = 5
): Promise<Array<{ content: string; emotionalSignature: string; massContribution: number }>> {
  const redis = getClient();
  if (!redis) return [];
  try {
    // Highest scored (highest mass) members first
    const raw = await redis.zrange(
      `aum:mem:${userId}:${houseId}`, 0, limit - 1,
      { rev: true }
    );
    return (raw as string[]).map((s) => {
      const parsed = JSON.parse(s);
      return {
        content:            parsed.content,
        emotionalSignature: parsed.emotionalSignature,
        massContribution:   parsed.massContribution,
      };
    });
  } catch (err) {
    console.error('[Aum] retrieveRelevantMemories error:', err);
    return [];
  }
}
