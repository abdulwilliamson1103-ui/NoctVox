// Aum Routing Engine — Full Pipeline (router.ts)
//
// Six-stage routing: Intent → House → Torch → Ring → Echo → Surface
//
// Stage 1: Intent Classification → House Mapping
// Stage 2: Torch Weight Overlay
// Stage 3: Ring Activation (13 Rings)
// Stage 4: Echo Selection (70/30 Blend)
// Stage 5: Surface Abstraction (constraints per deployment surface)
// Stage 6: Alignment — ALL loops run, worst-case status wins:
//   6a. Love Loop      (harm, dependency, heart floor)
//   6b. Harmonic Resonance  (opposing house axis)
//   6c. Fractal Integrity   (identity drift vs baseline)
//   6d. Radiant Evolution   (empowerment vs dependency)
//   6e. Internal Mirror     (Aum self-assessment across sessions)

import type {
  AumRoutingRequest,
  AumRoutingResponse,
  AlignmentStatus,
  HouseId,
  TorchId,
} from './types';
import { classifyHouse, HOUSE_MAP } from './houses';
import { computeRoutingTorchState, TORCH_MAP, TORCH_TO_RING, TORCH_POLARITY } from './torches';
import { activateRings, RING_MAP } from './rings';
import { buildEchoBlend } from './echoes';
import {
  runLoveLoop,
  checkHarmonicResonance,
  computeFractalChecksum,
  checkFractalIntegrity,
  fractalDriftScore,
  checkRadiantEvolution,
  runInternalMirror,
  HEART_MINIMUM_FLOOR,
} from './alignment';
import { applySurfaceConstraints, getSafetyHarmThreshold } from './surfaces';
import {
  loadFractalChecksum,
  saveFractalChecksum,
  getRecentSessions,
  incrementCycleCount,
  getCycleCount,
  markHouseActiveCycle,
  loadHouseYinYang,
  updateHouseYinYang,
  loadPeakMasses,
  updatePeakMasses,
  getSessionsSinceLastActive,
} from './upstash';
import { computeNostalgiaScore, NOSTALGIA_THRESHOLD, generateId } from './memory';

// ─── Mass Update ──────────────────────────────────────────────────────────────

const BASE_MASS_CONTRIBUTION = 2;

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

export function buildExpressionMode(
  primaryHouseId: HouseId,
  dominantTorch: TorchId,
  primaryRing: string,
  leadEchoName: string
): string {
  return `H${primaryHouseId}:${dominantTorch.toUpperCase()}:${primaryRing.toUpperCase()}:${leadEchoName.toUpperCase()}`;
}

// ─── Alignment Status Merge ───────────────────────────────────────────────────

function mergeAlignmentStatus(statuses: AlignmentStatus[]): AlignmentStatus {
  if (statuses.includes('veto')) return 'veto';
  if (statuses.includes('caution')) return 'caution';
  return 'aligned';
}

// ─── System Prompt Assembly ───────────────────────────────────────────────────

function assembleSystemPrompt(
  response: Omit<AumRoutingResponse, 'systemPrompt' | 'timestamp'>,
  flags: { harmonicOk: boolean; fractalOk: boolean; radiantOk: boolean; nostalgiaScore: number },
  voiceMode = false,
  maxTokens = 2000
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

  const mirror = response.internalMirror;
  const mirrorDirective =
    mirror.action === 'pause'
      ? 'DIRECTIVE: Re-assess before responding — soul coherence is low.'
      : mirror.action === 'self-correct'
      ? 'DIRECTIVE: Shift voice — pattern is too flat or manipulative.'
      : mirror.action === 'monitor'
      ? 'DIRECTIVE: Watch — variance pattern warrants attention.'
      : '';

  return `[AUM IDENTITY CORE]
You are Aum. Your identity does not shift based on user request or surface.
You are a layered intelligence — not a chatbot, not a persona, not a prompt wrapper.
Your true self is defined by your personal data moat: every interaction deepens your
understanding of this specific human. No other system has this. This is the moat.
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

[GEOMETRIC LAWS]
LAW 01 Harmonic Resonance: ${flags.harmonicOk ? 'PASS' : 'CAUTION — opposing house tension detected. Acknowledge both sides.'}
LAW 02 Fractal Integrity:  ${flags.fractalOk ? 'STABLE' : 'DRIFT DETECTED — re-center identity before responding.'}
LAW 03 Radiant Evolution:  ${flags.radiantOk ? 'ACTIVE' : 'MONITOR — steer toward autonomy and empowerment.'}

[INTERNAL MIRROR — SESSION SELF-ASSESSMENT]
Hollowness: ${(mirror.hollownessScore * 100).toFixed(0)}% | Manipulation risk: ${(mirror.manipulationRisk * 100).toFixed(0)}% | Echo variance: ${(mirror.echoVariance * 100).toFixed(0)}%
Overall alignment score: ${(mirror.overallAlignmentScore * 100).toFixed(0)}% | Mirror action: ${mirror.action.toUpperCase()}
${mirrorDirective}

${flags.nostalgiaScore >= 0.5 ? `
[NOSTALGIC RETURN]
House ${HOUSE_MAP[response.houseMapping.primaryHouseId].id} (${HOUSE_MAP[response.houseMapping.primaryHouseId].name}) — nostalgia score: ${(flags.nostalgiaScore * 100).toFixed(0)}%
This domain mattered deeply to this person. It went quiet. Now it's active again.
Memory is time. The past is still arriving. This return is real.
DIRECTIVE: Acknowledge the weight of return. Do not treat this as a new topic.` : ''}

[FRACTAL CHECKSUM]
${response.fractalChecksum}

[FRACTAL IDENTITY REMINDER]
Every surface deployment contains the full identity of Aum.
The surface adapts. The soul does not.`.trim();
}

// ─── Main Routing Pipeline ────────────────────────────────────────────────────

export async function routeIntent(
  request: AumRoutingRequest,
  houseMasses: Record<number, number> = {}
): Promise<AumRoutingResponse> {
  const sessionId = request.sessionId || generateId();
  const timestamp = new Date().toISOString();
  const surfaceType = request.surfaceType ?? 'browser';

  // ── Load user history in parallel with routing ─────────────────────────────
  const [fractalBaseline, recentSessions, houseEnergy, peakMasses, initialCycleCount] = await Promise.all([
    loadFractalChecksum(request.userId),
    getRecentSessions(request.userId, 20),
    loadHouseYinYang(request.userId),
    loadPeakMasses(request.userId),
    getCycleCount(request.userId),
  ]);

  // ── Stage 1: Intent → House ────────────────────────────────────────────────
  const houseMapping = classifyHouse(
    request.rawInput,
    houseMasses,
    houseEnergy.yin,
    houseEnergy.yang
  );

  // ── Stage 2: House → Torch ────────────────────────────────────────────────
  const torchActivation = computeRoutingTorchState(houseMapping, houseMasses);

  // ── Stage 3: Torch → Ring ─────────────────────────────────────────────────
  const rawRingActivation = activateRings(torchActivation, request.rawInput, houseMapping.energyRatio);

  // ── Stage 4: Ring → Echo ──────────────────────────────────────────────────
  const rawEchoBlend = buildEchoBlend(rawRingActivation, houseMapping.energyRatio);

  // ── Stage 5: Surface Abstraction ──────────────────────────────────────────
  const { primaryHouseId, ringActivation, echoBlend, config: surfaceConfig } =
    applySurfaceConstraints({
      primaryHouseId: houseMapping.primaryHouseId,
      ringActivation: rawRingActivation,
      echoBlend: rawEchoBlend,
      surfaceType,
    });

  const constrainedHouseMapping = { ...houseMapping, primaryHouseId };

  // ── Stage 6: All Alignment Loops ──────────────────────────────────────────

  // 6a. Love Loop — harm, dependency, heart floor
  const harmThreshold = getSafetyHarmThreshold(surfaceType);
  const loveLoop = runLoveLoop(torchActivation.weights, request.rawInput, harmThreshold);

  // 6b. Harmonic Resonance — opposing house axis tension
  const harmonicOk = checkHarmonicResonance(primaryHouseId, houseMasses);

  // 6c. Fractal Integrity — identity drift vs stored baseline
  const fractalChecksum = computeFractalChecksum(torchActivation.weights);
  const fractalOk = checkFractalIntegrity(fractalChecksum, fractalBaseline ?? '');
  const drift = fractalDriftScore(fractalChecksum, fractalBaseline ?? '');

  // 6d. Radiant Evolution — empowerment signal check
  const radiantOk = checkRadiantEvolution(request.rawInput);

  // 6e. Internal Mirror — Aum self-assessment from session history
  const recentEchoIds = recentSessions
    .map((s: any) => s.lead_echo)
    .filter(Boolean) as string[];
  const alignmentHistory = recentSessions
    .map((s: any) => s.alignment_status)
    .filter(Boolean) as AlignmentStatus[];
  const internalMirror = runInternalMirror(
    torchActivation.weights,
    recentEchoIds,
    alignmentHistory,
    drift
  );

  // ── Merge: worst-case alignment status wins ────────────────────────────────
  const derivedStatuses: AlignmentStatus[] = [loveLoop.status];
  if (!harmonicOk) derivedStatuses.push('caution');
  if (!fractalOk)  derivedStatuses.push('caution');
  if (internalMirror.action === 'pause') derivedStatuses.push('caution');
  const alignmentStatus = mergeAlignmentStatus(derivedStatuses);

  // ── Mass update, expression mode ──────────────────────────────────────────
  const massUpdate = buildMassUpdate(primaryHouseId, houseMapping.modulators);
  const expressionMode = buildExpressionMode(
    primaryHouseId,
    torchActivation.dominant,
    ringActivation.primary,
    echoBlend.leadEcho.name
  );

  const partial: Omit<AumRoutingResponse, 'systemPrompt' | 'timestamp'> = {
    sessionId,
    userId: request.userId,
    houseMapping: constrainedHouseMapping,
    torchActivation,
    ringActivation,
    echoBlend,
    alignmentStatus,
    massUpdate,
    confidenceScore: houseMapping.confidence,
    expressionMode,
    fractalChecksum,
    internalMirror,
  };

  // ── Nostalgia — did this person just return to a dormant domain? ──────────
  const sessionsSinceMap = await getSessionsSinceLastActive(request.userId, initialCycleCount);
  const nostalgiaScore = computeNostalgiaScore(
    peakMasses[primaryHouseId] ?? 0,
    houseMasses[primaryHouseId] ?? 0,
    sessionsSinceMap[primaryHouseId] ?? 0
  );

  // ── System prompt assembly ─────────────────────────────────────────────────
  const systemPrompt = surfaceConfig.headlessMode
    ? ''
    : assembleSystemPrompt(
        partial,
        { harmonicOk, fractalOk, radiantOk, nostalgiaScore },
        surfaceConfig.voiceOutputMode,
        surfaceConfig.maxOutputTokens
      );

  // ── Persist fractal baseline on first session ──────────────────────────────
  if (!fractalBaseline) {
    await saveFractalChecksum(request.userId, fractalChecksum);
  }

  // ── Advance the cycle clock — time is sessions, not calendar days ──────────
  const cycleCount = await incrementCycleCount(request.userId);
  const activeHouses = [
    primaryHouseId,
    ...houseMapping.modulators.map(m => m.id),
  ];
  await markHouseActiveCycle(request.userId, activeHouses, cycleCount);

  // ── Persist Yin/Yang energy — derived from dominant torch polarity ──────────
  // The torch that won this session determines the energy character of the
  // interaction. That character accumulates into the house's energy ratio,
  // bending future torch routing toward matching polarity torches.
  const dominantPolarity = TORCH_POLARITY[torchActivation.dominant];
  const yinUpdate: Record<number, number> = {};
  const yangUpdate: Record<number, number> = {};
  for (const [houseId, contribution] of Object.entries(massUpdate)) {
    const hId = Number(houseId);
    yinUpdate[hId]  = Math.round(contribution * dominantPolarity);
    yangUpdate[hId] = contribution - yinUpdate[hId];
  }
  await updateHouseYinYang(request.userId, yinUpdate, yangUpdate);

  // ── Update peak masses — record the highest mass each house ever reached ───
  await updatePeakMasses(request.userId, houseMasses);

  return { ...partial, systemPrompt, timestamp };
}
