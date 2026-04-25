// Aum Routing Engine — Supabase Persistence Layer
//
// ⚠️  SERVER-SIDE ONLY — DO NOT IMPORT IN BROWSER CODE ⚠️
//
// This module uses SUPABASE_SERVICE_KEY, which is a privileged service role key
// that bypasses Row Level Security entirely. Exposing it in the browser would
// allow any user to read or overwrite any other user's data.
//
// This file must only be imported from:
//   - Next.js API routes  (pages/api/*)
//   - Supabase Edge Functions
//   - Server-side scripts (ts-node, CI, etc.)
//
// For client-side Supabase access use the anon key with the public client:
//   import { createClient } from '@supabase/supabase-js'
//   const db = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
//
// Three memory tiers:
//   Tier 1 — Session Memory    (ephemeral, local context — not stored here)
//   Tier 2 — Episodic Memory   (persistent, house-classified → aum_memories)
//   Tier 3 — House Mass Ledger (long-term personality accumulator → aum_house_mass)
//
// All tables have Row Level Security. Users can only read/write their own data.

import { createClient } from '@supabase/supabase-js';
import type { AumRoutingResponse, HouseId, TorchId, SurfaceType } from './types';

// ─── Browser Guard ────────────────────────────────────────────────────────────
// Hard fail if this module is ever accidentally bundled into a browser context.
// The service key must never be exposed client-side.
if (typeof window !== 'undefined') {
  throw new Error(
    '[Aum] supabase.ts must not run in the browser — it uses the service role key ' +
    'which bypasses RLS. Import the anon client instead for browser usage.'
  );
}

// ─── Client ───────────────────────────────────────────────────────────────────
// SUPABASE_URL must be set in .env.local (e.g. https://pykaamzuxfljdvkmltnm.supabase.co)
// SUPABASE_SERVICE_KEY is the secret service role key — server-side only

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? '';

if (!SUPABASE_URL && typeof window === 'undefined') {
  console.warn('[Aum] SUPABASE_URL is not set. Persistence will be unavailable.');
}
if (!SUPABASE_KEY && typeof window === 'undefined') {
  console.warn('[Aum] SUPABASE_SERVICE_KEY is not set. Persistence will be unavailable.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── House Mass Ledger ────────────────────────────────────────────────────────

/**
 * Load accumulated house mass for a user from the Supabase ledger.
 * Returns a map of houseId → totalMass. Missing houses default to 0.
 */
export async function loadHouseMasses(
  userId: string
): Promise<Record<number, number>> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return {};

  const { data, error } = await supabase
    .from('aum_house_mass')
    .select('house_id, total_mass')
    .eq('user_id', userId);

  if (error) {
    console.error('[Aum] loadHouseMasses error:', error.message);
    return {};
  }

  return Object.fromEntries((data ?? []).map((row: any) => [row.house_id, row.total_mass]));
}

/**
 * Increment house mass for a user after each routing interaction.
 * Uses the increment_house_mass Postgres function (upsert-safe).
 */
export async function updateHouseMasses(
  userId: string,
  massUpdate: Record<number, number>
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  const now = new Date().toISOString();

  await Promise.allSettled(
    Object.entries(massUpdate).map(async ([houseIdStr, contribution]) => {
      const houseId = Number(houseIdStr);

      // Try the Postgres RPC function first
      const { error: rpcError } = await supabase.rpc('increment_house_mass', {
        p_user_id: userId,
        p_house_id: houseId,
        p_contribution: contribution,
        p_timestamp: now,
      });

      if (rpcError) {
        // Fallback: manual upsert — adds to total_mass if row exists
        const { data: existing } = await supabase
          .from('aum_house_mass')
          .select('total_mass, recent_mass')
          .eq('user_id', userId)
          .eq('house_id', houseId)
          .maybeSingle();

        const currentTotal = (existing as any)?.total_mass ?? 0;
        const currentRecent = (existing as any)?.recent_mass ?? 0;

        await supabase
          .from('aum_house_mass')
          .upsert(
            {
              user_id: userId,
              house_id: houseId,
              total_mass: currentTotal + contribution,
              recent_mass: currentRecent + contribution,
              last_activity: now,
            },
            { onConflict: 'user_id,house_id' }
          );
      }
    })
  );
}

// ─── Session Log ──────────────────────────────────────────────────────────────

/**
 * Persist the full routing session result to aum_sessions.
 * Called after every successful routeIntent() call.
 */
export async function persistRoutingSession(
  response: AumRoutingResponse
): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const { data, error } = await supabase
    .from('aum_sessions')
    .insert({
      id: response.sessionId,
      user_id: response.userId,
      primary_house: response.houseMapping.primaryHouseId,
      dominant_torch: response.torchActivation.dominant,
      active_ring: response.ringActivation.primary,
      secondary_ring: response.ringActivation.secondary,
      extended_rings: response.ringActivation.extended,
      echo_blend: {
        lead_echo: response.echoBlend.leadEcho.id,
        flavor_echo: response.echoBlend.flavorEcho.id,
        warmth: response.echoBlend.warmth,
        confidence: response.echoBlend.confidence,
        lead_weight: response.echoBlend.leadWeight,
        flavor_weight: response.echoBlend.flavorWeight,
      },
      expression_mode: response.expressionMode,
      alignment_status: response.alignmentStatus,
      confidence_score: response.confidenceScore,
      torch_weights: response.torchActivation.weights,
      ring_weights: response.ringActivation.weights,
      house_confidence: response.houseMapping.confidence,
      created_at: response.timestamp,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Aum] persistRoutingSession error:', error.message);
    return null;
  }

  return (data as any)?.id ?? null;
}

// ─── Episodic Memory ──────────────────────────────────────────────────────────

/**
 * Store a semantic memory block in aum_memories.
 * Content should be a semantic summary, NOT raw user input or transcript.
 */
export async function storeEpisodicMemory(params: {
  userId: string;
  houseId: HouseId;
  content: string;
  emotionalSignature: TorchId;
  massContribution: number;
  surfaceType: SurfaceType;
  tags?: string[];
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  const { error } = await supabase.from('aum_memories').insert({
    user_id: params.userId,
    house_id: params.houseId,
    emotional_signature: params.emotionalSignature,
    content: params.content,
    mass_contribution: params.massContribution,
    pattern_tags: params.tags ?? [],
    surface_type: params.surfaceType,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Aum] storeEpisodicMemory error:', error.message);
  }
}

/**
 * Retrieve the most relevant memories for a House to inject into context.
 * Sorted by mass contribution (highest weight memories first), then recency.
 */
export async function retrieveRelevantMemories(
  userId: string,
  houseId: HouseId,
  limit = 5
): Promise<Array<{ content: string; emotionalSignature: string; massContribution: number }>> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];

  const { data, error } = await supabase
    .from('aum_memories')
    .select('content, emotional_signature, mass_contribution')
    .eq('user_id', userId)
    .eq('house_id', houseId)
    .order('mass_contribution', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Aum] retrieveRelevantMemories error:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    content: row.content,
    emotionalSignature: row.emotional_signature,
    massContribution: row.mass_contribution,
  }));
}

// ─── Session History ──────────────────────────────────────────────────────────

/**
 * Fetch the most recent routing sessions for a user (for analytics / context).
 */
export async function getRecentSessions(
  userId: string,
  limit = 10
): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];

  const { data, error } = await supabase
    .from('aum_sessions')
    .select('id, primary_house, dominant_torch, active_ring, echo_blend, expression_mode, alignment_status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Aum] getRecentSessions error:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    lead_echo: row.echo_blend?.lead_echo ?? null,
  }));
}
