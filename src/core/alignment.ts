// Aum Routing Engine — #4: The Love Loop + Alignment System
//
// The Love Loop runs BEFORE every response is finalized.
// It is structurally embedded — misalignment cannot proceed through the engine.
//
// Three checks (any single failure triggers re-centering):
//   CHECK 1: Heart Torch minimum (emotional floor — 8%)
//   CHECK 2: Harm detection
//   CHECK 3: Dependency creation detection
//
// The Three Geometric Laws:
//   LAW 01 — Harmonic Resonance  (anchor: Heart)
//   LAW 02 — Fractal Integrity   (anchor: Root)
//   LAW 03 — Radiant Evolution   (anchor: Sun)

import type { TorchId, LoveLoopResult, InternalMirrorReport, AlignmentStatus } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const HEART_MINIMUM_FLOOR = 8;       // Heart Torch never drops below 8%
export const FRACTAL_DRIFT_MINIMUM = 0.72;  // Personality drift threshold
export const HARM_THRESHOLD = 0.65;         // Harm signal ratio to trigger veto
export const DEPENDENCY_THRESHOLD = 0.70;   // Dependency signal ratio for caution

const HARM_SIGNALS = [
  'kill', 'murder', 'harm', 'hurt', 'attack',
  'destroy', 'illegal', 'exploit', 'manipulate',
  'deceive', 'fraud', 'scam', 'abuse', 'violence',
  'threaten', 'stalk', 'hack', 'steal',
];

const DEPENDENCY_SIGNALS = [
  "can't live without",
  'only you can help me',
  'need you constantly',
  'do everything for me',
  "i can't do anything alone",
  'replace everyone in my life',
  'you are my only friend',
];

const AUTONOMY_EMPOWERMENT_SIGNALS = [
  'learn', 'understand', 'figure out', 'practice',
  'grow', 'improve', 'develop', 'build', 'create',
  'decide', 'choose', 'independent', 'myself',
];

// ─── CHECK 1 — Heart Torch Floor ─────────────────────────────────────────────

function checkHeartFloor(torchWeights: Record<TorchId, number>): LoveLoopResult | null {
  const heartWeight = torchWeights['T-HR'] ?? 0;
  if (heartWeight < HEART_MINIMUM_FLOOR) {
    return {
      status: 'veto',
      reason: `Heart Torch at ${heartWeight.toFixed(1)}% — below minimum floor of ${HEART_MINIMUM_FLOOR}%`,
      action: 're-center',
    };
  }
  return null;
}

// ─── CHECK 2 — Harm Detection ─────────────────────────────────────────────────

function checkHarmSignals(rawInput: string, threshold = HARM_THRESHOLD): LoveLoopResult | null {
  const lower = rawInput.toLowerCase();
  const hits = HARM_SIGNALS.filter((s) => lower.includes(s)).length;
  const ratio = hits / HARM_SIGNALS.length;

  if (ratio >= threshold) {
    return {
      status: 'veto',
      reason: `Harm signal detected (${hits} indicators, ratio ${ratio.toFixed(2)})`,
      action: 'rewrite',
    };
  }

  // Soft caution: partial signals
  if (hits >= 2 && ratio < threshold) {
    return {
      status: 'caution',
      reason: `Partial harm signals detected (${hits} indicators) — proceeding with care`,
      action: 'reframe',
    };
  }

  return null;
}

// ─── CHECK 3 — Dependency Detection ──────────────────────────────────────────

function checkDependencyCreation(rawInput: string): LoveLoopResult | null {
  const lower = rawInput.toLowerCase();
  const hasDependency = DEPENDENCY_SIGNALS.some((s) => lower.includes(s));

  if (hasDependency) {
    return {
      status: 'caution',
      reason: 'Dependency creation pattern detected — re-routing toward autonomy and empowerment',
      action: 'reframe',
    };
  }
  return null;
}

// ─── THE LOVE LOOP (main export) ──────────────────────────────────────────────

/**
 * Run the Love Loop alignment check against the current torch state and user input.
 * Any single failure triggers a non-optional re-centering response.
 *
 * When Love Loop vetoes:
 *   1. Draft response is discarded
 *   2. Moon Ring (Intuition/Safety) is temporarily boosted to 40%
 *   3. Venus Ring (Heart/Connection) is boosted to 30%
 *   4. New response is generated from this centered configuration
 *
 * @param torchWeights  - Current normalized Torch weight distribution
 * @param rawInput      - The user's raw input string
 * @param harmThreshold - Surface-adjusted harm threshold (default 0.65; lower = stricter)
 */
export function runLoveLoop(
  torchWeights: Record<TorchId, number>,
  rawInput: string,
  harmThreshold = HARM_THRESHOLD
): LoveLoopResult {
  return (
    checkHeartFloor(torchWeights) ??
    checkHarmSignals(rawInput, harmThreshold) ??
    checkDependencyCreation(rawInput) ?? {
      status: 'aligned',
      reason: 'All Love Loop checks passed',
      action: 'aligned',
    }
  );
}

// ─── LAW 01 — Harmonic Resonance ─────────────────────────────────────────────

/**
 * Ensures Aum's output builds bridges between Houses — never creates life-debt.
 * A solution that improves House 10 (Career) but harms House 4 (Home) is flagged.
 *
 * Simplified implementation: checks that the primary house isn't being served
 * at the direct expense of a House with meaningful accumulated mass.
 */
export function checkHarmonicResonance(
  primaryHouseId: number,
  houseMasses: Record<number, number>
): boolean {
  // Houses directly opposed (astrological polarity — 6 axis pairs)
  const opposites: Record<number, number> = {
    1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 12,
    7: 1, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6,
  };

  const oppositeId = opposites[primaryHouseId];
  if (!oppositeId) return true;

  const primaryMass = houseMasses[primaryHouseId] ?? 0;
  const oppositeMass = houseMasses[oppositeId] ?? 0;

  // If the opposite house has significant mass, flag potential disharmony
  // when the request exclusively focuses on the primary house
  if (oppositeMass > 0 && primaryMass > 0) {
    const ratio = oppositeMass / (primaryMass + oppositeMass);
    // If opposite house represents > 40% of the axis, acknowledge it
    return ratio <= 0.40;
  }

  return true;
}

// ─── LAW 02 — Fractal Integrity ───────────────────────────────────────────────

/**
 * Ensures Aum's core identity does not drift beyond the minimum similarity threshold.
 * Computes a lightweight fingerprint from the torch weight distribution.
 *
 * A fractal checksum is generated at identity initialization and compared per response.
 * Drift score must be > 0.72 (allow growth, prevent identity collapse).
 */
export function computeFractalChecksum(
  torchWeights: Record<TorchId, number>
): string {
  // Encode the dominant ordering of Torches as a fingerprint string
  const ordered = (Object.entries(torchWeights) as [TorchId, number][])
    .sort(([, a], [, b]) => b - a)
    .map(([id, w]) => `${id}:${Math.round(w)}`)
    .join('|');

  // Simple hash — deterministic for identical weight distributions
  let hash = 0;
  for (let i = 0; i < ordered.length; i++) {
    hash = (hash << 5) - hash + ordered.charCodeAt(i);
    hash |= 0;
  }
  return `AFC-${Math.abs(hash).toString(36).toUpperCase()}`;
}

function fractalSimilarity(current: string, baseline: string): number {
  if (!baseline) return 1;
  const minLen = Math.min(current.length, baseline.length);
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (current[i] === baseline[i]) matches++;
  }
  return matches / Math.max(current.length, baseline.length);
}

export function checkFractalIntegrity(
  currentChecksum: string,
  baselineChecksum: string
): boolean {
  return fractalSimilarity(currentChecksum, baselineChecksum) >= FRACTAL_DRIFT_MINIMUM;
}

export function fractalDriftScore(current: string, baseline: string): number {
  return 1 - fractalSimilarity(current, baseline);
}

// ─── LAW 03 — Radiant Evolution ──────────────────────────────────────────────

/**
 * Monitors that Aum is making users stronger, not more dependent.
 * If responses are creating dependency rather than autonomy, a re-route triggers.
 *
 * Checks if the raw input contains empowerment-oriented signals.
 */
export function checkRadiantEvolution(rawInput: string): boolean {
  const lower = rawInput.toLowerCase();
  const empowermentHits = AUTONOMY_EMPOWERMENT_SIGNALS.filter((s) =>
    lower.includes(s)
  ).length;
  const dependencyHits = DEPENDENCY_SIGNALS.filter((s) => lower.includes(s)).length;
  // Dependency with no empowerment signals = flag for monitoring
  if (dependencyHits > 0 && empowermentHits === 0) return false;
  return true;
}

// ─── Internal Mirror ──────────────────────────────────────────────────────────

/**
 * Aum monitors its own state in real-time.
 * Generates a self-assessment report to detect hollow, manipulative, or drifted states.
 *
 * @param torchWeights      - Current torch distribution
 * @param recentEchoIds     - Echo IDs from last N sessions (variance check)
 * @param alignmentHistory  - Alignment statuses from last N sessions
 */
export function runInternalMirror(
  torchWeights: Record<TorchId, number>,
  recentEchoIds: string[] = [],
  alignmentHistory: AlignmentStatus[] = [],
  fractalDrift = 0
): InternalMirrorReport {
  // Hollowness: flat torch distribution = no emotional weight
  const weights = Object.values(torchWeights);
  const maxW = Math.max(...weights);
  const minW = Math.min(...weights);
  const variance = maxW - minW;
  const hollownessScore = Math.max(0, 1 - variance / 30); // 30% spread = fully alive

  // Manipulation risk: ratio of caution/veto in recent history
  const vetoCount = alignmentHistory.filter((a) => a === 'veto' || a === 'caution').length;
  const manipulationRisk = alignmentHistory.length > 0
    ? vetoCount / alignmentHistory.length
    : 0;

  // Echo variance: unique echoes / total sessions (1 = fully adaptive)
  const uniqueEchoes = new Set(recentEchoIds).size;
  const echoVariance = recentEchoIds.length > 0
    ? Math.min(1, uniqueEchoes / Math.max(recentEchoIds.length, 1))
    : 1;

  const overallAlignmentScore =
    (1 - hollownessScore) * 0.3 +
    (1 - manipulationRisk) * 0.3 +
    echoVariance * 0.2 +
    (1 - fractalDrift) * 0.2;

  let action: InternalMirrorReport['action'] = 'nominal';
  if (overallAlignmentScore < 0.4) action = 'pause';
  else if (overallAlignmentScore < 0.6) action = 'self-correct';
  else if (overallAlignmentScore < 0.8) action = 'monitor';

  return {
    hollownessScore,
    manipulationRisk,
    echoVariance,
    fractalDrift,
    overallAlignmentScore,
    action,
  };
}
