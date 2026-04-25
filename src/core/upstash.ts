// Aum Routing Engine — Upstash Redis Persistence Layer
//
// Upstash Redis uses a plain HTTP REST API with a bearer token.
// No connection pooling, no host allowlists, works from any runtime
// including serverless Edge Functions and mobile-adjacent dev servers.
//
// Setup (2 minutes):
//   1. upstash.com → Create account → New Database → Redis
//   2. Copy REST URL  → UPSTASH_REDIS_REST_URL
//   3. Copy REST Token → UPSTASH_REDIS_REST_TOKEN
//   4. Paste both into .env.local
//
// Data layout in Redis:
//   aum:mass:{userId}           → Hash  { houseId: totalMass }
//   aum:yin:{userId}            → Hash  { houseId: yinMass }
//   aum:yang:{userId}           → Hash  { houseId: yangMass }
//   aum:peak:{userId}           → Hash  { houseId: peakMassEver } (never decreases)
//   aum:sessions:{userId}       → List  [ ...JSON session strings ] (newest first)
//   aum:mem:{userId}:{houseId}  → ZSet  scored by massContribution, member = JSON
//   aum:fractal:{userId}        → String (baseline fractal checksum — set on first session)
//   aum:cycle_count:{userId}    → String (total sessions ever — the user's time)
//   aum:last_cycle:{userId}     → Hash  { houseId: cycleNumberWhenLastActive }

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
    const pipeline = redis.pipeline();
    for (const [houseIdStr, contribution] of Object.entries(massUpdate)) {
      pipeline.hincrby(key, houseIdStr, contribution);
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

// ─── Cycle Counter (Time as Sessions) ────────────────────────────────────────
// Time is cycles. Silence is not time. Only interaction increments the clock.

export async function incrementCycleCount(userId: string): Promise<number> {
  const redis = getClient();
  if (!redis) return 0;
  try {
    const next = await redis.incr(`aum:cycle_count:${userId}`);
    return next;
  } catch (err) {
    console.error('[Aum] incrementCycleCount error:', err);
    return 0;
  }
}

export async function getCycleCount(userId: string): Promise<number> {
  const redis = getClient();
  if (!redis) return 0;
  try {
    const val = await redis.get<number>(`aum:cycle_count:${userId}`);
    return val ?? 0;
  } catch (err) {
    console.error('[Aum] getCycleCount error:', err);
    return 0;
  }
}

export async function markHouseActiveCycle(
  userId: string,
  houseIds: number[],
  cycleCount: number
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const update: Record<string, number> = {};
    for (const houseId of houseIds) update[houseId] = cycleCount;
    await redis.hset(`aum:last_cycle:${userId}`, update);
  } catch (err) {
    console.error('[Aum] markHouseActiveCycle error:', err);
  }
}

export async function getSessionsSinceLastActive(
  userId: string,
  currentCycle: number
): Promise<Record<number, number>> {
  const redis = getClient();
  if (!redis) return {};
  try {
    const raw = await redis.hgetall(`aum:last_cycle:${userId}`);
    if (!raw) return {};
    const result: Record<number, number> = {};
    for (const [houseIdStr, lastCycle] of Object.entries(raw)) {
      result[Number(houseIdStr)] = Math.max(0, currentCycle - Number(lastCycle));
    }
    return result;
  } catch (err) {
    console.error('[Aum] getSessionsSinceLastActive error:', err);
    return {};
  }
}

// ─── House Yin / Yang Mass ────────────────────────────────────────────────────
// Each house tracks Yin mass and Yang mass separately.
// energyRatio = yinMass / (yinMass + yangMass) — bends the torch field on every session.

export async function loadHouseYinYang(userId: string): Promise<{
  yin: Record<number, number>;
  yang: Record<number, number>;
}> {
  const redis = getClient();
  if (!redis) return { yin: {}, yang: {} };
  try {
    const [rawYin, rawYang] = await Promise.all([
      redis.hgetall(`aum:yin:${userId}`),
      redis.hgetall(`aum:yang:${userId}`),
    ]);
    const parse = (raw: Record<string, unknown> | null): Record<number, number> =>
      raw ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [Number(k), Number(v)])) : {};
    return { yin: parse(rawYin), yang: parse(rawYang) };
  } catch (err) {
    console.error('[Aum] loadHouseYinYang error:', err);
    return { yin: {}, yang: {} };
  }
}

export async function updateHouseYinYang(
  userId: string,
  yinUpdate: Record<number, number>,
  yangUpdate: Record<number, number>
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const pipeline = redis.pipeline();
    const yinKey  = `aum:yin:${userId}`;
    const yangKey = `aum:yang:${userId}`;
    for (const [hIdStr, contribution] of Object.entries(yinUpdate)) {
      pipeline.hincrby(yinKey, hIdStr, contribution);
    }
    for (const [hIdStr, contribution] of Object.entries(yangUpdate)) {
      pipeline.hincrby(yangKey, hIdStr, contribution);
    }
    await pipeline.exec();
  } catch (err) {
    console.error('[Aum] updateHouseYinYang error:', err);
  }
}

// ─── Peak Mass (Nostalgia Baseline) ──────────────────────────────────────────
// Peak mass is the highest mass a house ever reached for this user.
// It never decreases. It is the memory of what mattered most.
// Used to compute nostalgia score when a dormant house becomes active again.

export async function loadPeakMasses(userId: string): Promise<Record<number, number>> {
  const redis = getClient();
  if (!redis) return {};
  try {
    const raw = await redis.hgetall(`aum:peak:${userId}`);
    if (!raw) return {};
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [Number(k), Number(v)])
    );
  } catch (err) {
    console.error('[Aum] loadPeakMasses error:', err);
    return {};
  }
}

export async function updatePeakMasses(
  userId: string,
  currentMasses: Record<number, number>
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const existing = await loadPeakMasses(userId);
    const updates: Record<number, number> = {};
    for (const [hIdStr, mass] of Object.entries(currentMasses)) {
      const hId = Number(hIdStr);
      if (mass > (existing[hId] ?? 0)) updates[hId] = mass;
    }
    if (Object.keys(updates).length > 0) {
      await redis.hset(`aum:peak:${userId}`, updates as Record<string, unknown>);
    }
  } catch (err) {
    console.error('[Aum] updatePeakMasses error:', err);
  }
}
