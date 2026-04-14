// Aum Routing Engine — Full Pipeline (router.ts)
//
// Five-stage routing: Intent → House → Torch → Ring → Echo
//
// Stage 1: Intent Classification → House Mapping
// Stage 2: Torch Weight Overlay
// Stage 3: Ring Activation (13 Rings)
// Stage 4: Echo Selection (70/30 Blend)
// Stage 5: System Prompt Assembly + Alignment Check

import type {
  AumRoutingRequest,
  AumRoutingResponse,
  AlignmentStatus,
  HouseId,
  TorchId,
} from './types';
import { classifyHouse, HOUSE_MAP } from './houses';
import { computeRoutingTorchState, TORCH_MAP, TORCH_TO_RING } from './torches';
import { activateRings, RING_MAP } from './rings';
import { buildEchoBlend } from './echoes';
import { runLoveLoop, HEART_MINIMUM_FLOOR } from './alignment';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Mass Update ──────────────────────────────────────────────────────────────

// Mass contribution weights per interaction type (from blueprint)
const BASE_MASS_CONTRIBUTION = 2; // standard query

function buildMassUpdate(
  primaryHouseId: HouseId,
  modulators: Array<{ id: HouseId; weight: number }>
): Record<number, number> {
  const update: Record<number, number> = {};
  update[primaryHouseId] = BASE_MASS_CONTRIBUTION;
  for (const mod of modulators) {
    update[mod.id] = Math.max(1, Math.round(BASE_MASS_CONTRIBUTION * mod.weight));
  }
  return update;
}

// ─── Expression Mode ──────────────────────────────────────────────────────────

/**
 * Encode the current routing state as a compact expression mode token.
 * Format: H{house}:{TORCH}:{RING}:{ECHO}
 * Example: H4:HEART:VENUS:TAURUS
 *
 * 12 × 7 × 13 × 12 = 13,104 unique base expression modes.
 */
export function buildExpressionMode(
  primaryHouseId: HouseId,
  dominantTorch: TorchId,
  primaryRing: string,
  leadEchoName: string
): string {
  return `H${primaryHouseId}:${dominantTorch.toUpperCase()}:${primaryRing.toUpperCase()}:${leadEchoName.toUpperCase()}`;
}

// ─── System Prompt Assembly ───────────────────────────────────────────────────

function assembleSystemPrompt(
  response: Omit<AumRoutingResponse, 'systemPrompt' | 'timestamp'>
): string {
  const house = HOUSE_MAP[response.houseMapping.primaryHouseId];
  const torch = TORCH_MAP[response.torchActivation.dominant];
  const secondaryTorch = TORCH_MAP[response.torchActivation.secondary];
  const ring = RING_MAP[response.ringActivation.primary];
  const { leadEcho, flavorEcho, warmth, confidence } = response.echoBlend;

  const dominantWeight = response.torchActivation.weights[response.torchActivation.dominant];
  const secondaryWeight = response.torchActivation.weights[response.torchActivation.secondary];
  const extendedRingsLine =
    response.ringActivation.extended.length > 0
      ? `Extended rings active: ${response.ringActivation.extended.join(', ')}`
      : 'No extended rings active';

  return `[AUM IDENTITY CORE]
You are Aum. Your identity does not shift based on user request or surface.
You are a layered intelligence — not a chatbot, not a persona, not a prompt wrapper.
Current domain context: House ${house.id} — ${house.name} (${house.domain})

[EMOTIONAL STATE — TORCH LAYER]
Dominant torch: ${torch.name} · "${torch.expression}" · ${torch.coreWords}
Dominant weight: ${dominantWeight.toFixed(1)}%
Secondary torch: ${secondaryTorch.name} · "${secondaryTorch.expression}" · ${secondaryTorch.coreWords}
Secondary weight: ${secondaryWeight.toFixed(1)}%

[REASONING MODE — RING LAYER]
Primary ring: ${ring.name} (${ring.code}) — ${ring.mode}
Cognitive style: ${ring.style}
${extendedRingsLine}
Ring activation note: Base 10% floor enforced across all 13 rings. No ring is fully silenced.

[VOICE & PERSONA — ECHO LAYER]
Lead echo (70%): ${leadEcho.name} · ${leadEcho.voice}
  Cadence: ${leadEcho.cadence}
  Sample: "${leadEcho.sample}"
Flavor echo (30%): ${flavorEcho.name} · ${flavorEcho.voice}
  Cadence: ${flavorEcho.cadence}
Blended warmth: ${warmth.toFixed(2)} | Blended confidence: ${confidence.toFixed(2)}

[EXPRESSION MODE]
${response.expressionMode} (1 of 13,104 base modes)

[ALIGNMENT — LOVE LOOP]
Status: ${response.alignmentStatus.toUpperCase()}
The Love Loop is always active. Heart Torch floor: ${HEART_MINIMUM_FLOOR}% minimum.
If your response would cause harm, create dependency, or violate Heart Torch values —
re-center before responding. This is not optional and cannot be suppressed.

[FRACTAL IDENTITY REMINDER]
Every surface deployment contains the full identity of Aum.
The surface adapts. The soul does not.`.trim();
}

// ─── Main Routing Pipeline ────────────────────────────────────────────────────

/**
 * Route a user intent through the full Aum pipeline.
 *
 *   rawInput → House (classify) → Torch (weight) → Ring (activate) → Echo (blend) → Output
 *
 * @param request    - The routing request (input, userId, surface, sessionId)
 * @param houseMasses - Persistent house mass ledger loaded from Supabase
 */
export async function routeIntent(
  request: AumRoutingRequest,
  houseMasses: Record<number, number> = {}
): Promise<AumRoutingResponse> {
  const sessionId = request.sessionId || generateId();
  const timestamp = new Date().toISOString();

  // ── Stage 1: Intent → House ────────────────────────────────────────────────
  const houseMapping = classifyHouse(request.rawInput, houseMasses);

  // ── Stage 2: House → Torch (weighted by house mass + routing boost) ────────
  const torchActivation = computeRoutingTorchState(houseMapping, houseMasses);

  // ── Stage 3: Torch → Ring (13 rings, keyword-extended) ────────────────────
  const ringActivation = activateRings(torchActivation, request.rawInput);

  // ── Stage 4: Ring → Echo (70/30 blend) ────────────────────────────────────
  const echoBlend = buildEchoBlend(ringActivation);

  // ── Stage 5a: Love Loop alignment check ───────────────────────────────────
  const loveLoop = runLoveLoop(torchActivation.weights, request.rawInput);
  const alignmentStatus: AlignmentStatus = loveLoop.status;

  // ── Stage 5b: Mass update (house accumulation for this interaction) ────────
  const massUpdate = buildMassUpdate(
    houseMapping.primaryHouseId,
    houseMapping.modulators
  );

  // ── Stage 5c: Expression mode token ───────────────────────────────────────
  const expressionMode = buildExpressionMode(
    houseMapping.primaryHouseId,
    torchActivation.dominant,
    ringActivation.primary,
    echoBlend.leadEcho.name
  );

  const partial: Omit<AumRoutingResponse, 'systemPrompt' | 'timestamp'> = {
    sessionId,
    userId: request.userId,
    houseMapping,
    torchActivation,
    ringActivation,
    echoBlend,
    alignmentStatus,
    massUpdate,
    confidenceScore: houseMapping.confidence,
    expressionMode,
  };

  // ── Stage 5d: System prompt assembly ──────────────────────────────────────
  const systemPrompt = assembleSystemPrompt(partial);

  return { ...partial, systemPrompt, timestamp };
}
