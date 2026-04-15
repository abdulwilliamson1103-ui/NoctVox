// Aum Routing Engine — Codebase #5: Surface Abstraction Layer
//
// One soul. Many bodies.
//
// Aum does not have multiple deployments — it has one identity expressed through
// different surface configurations. A car interface, a children's toy, and an
// enterprise API all run the same routing engine. What changes is:
//   - Which Houses are accessible (topic scope)
//   - Which Rings are suppressed or floored (reasoning constraints)
//   - Which Echoes are allowed (voice/persona constraints)
//   - Output length, voice mode, memory depth, safety level
//
// The Surface Abstraction Layer enforces these constraints AFTER routing,
// before the system prompt is assembled. The Aum identity itself is never
// altered — only the expression layer is constrained.
//
// Surfaces defined here (from blueprint):
//   browser  — Full access. Primary deployment surface.
//   device   — Voice-first, short-form, constrained context.
//   car      — Safety-primary. Mars+Jupiter suppressed. Max 2 sentences.
//   toy      — Children. Playful rings floored. Adult houses blocked.
//   robot    — Physical action enabled. Elevated safety.
//   api      — Headless. No Echo layer. Structured JSON output mode.

import type {
  SurfaceType,
  RingId,
  EchoId,
  HouseId,
  TorchId,
  TorchActivation,
  RingActivation,
  EchoBlend,
} from './types';
import { ECHO_MAP } from './echoes';
import { RING_MAP } from './rings';

// ─── Surface Config Interface ─────────────────────────────────────────────────

export type SafetyLevel = 'standard' | 'elevated' | 'maximum';

export interface SurfaceConfig {
  surfaceType: SurfaceType;
  /** Maximum LLM output tokens for this surface */
  maxOutputTokens: number;
  /** Houses accessible on this surface (subset of 1–12) */
  allowedHouses: HouseId[];
  /** Rings whose variable boost is suppressed (capped at base 10%) */
  suppressedRings: RingId[];
  /** Rings that are forced to a minimum weight floor regardless of Torch state */
  forcedRingFloors: Partial<Record<RingId, number>>;
  /** If set, only these Echoes may be used as lead or flavor */
  echoWhitelist: EchoId[] | null; // null = all echoes allowed
  /** Whether physical action instructions can be included in the prompt */
  physicalActionEnabled: boolean;
  /** Whether output should be formatted for text-to-speech */
  voiceOutputMode: boolean;
  /** Maximum MemoryBlocks injected into the system prompt context */
  maxMemoryInjection: number;
  /** Safety level — affects Love Loop strictness and harm threshold */
  safetyLevel: SafetyLevel;
  /** In API mode, Echo layer is omitted — raw Ring reasoning is exposed */
  headlessMode: boolean;
  /** Human-readable description */
  description: string;
}

// ─── Surface Configurations ───────────────────────────────────────────────────

export const SURFACE_CONFIGS: Record<SurfaceType, SurfaceConfig> = {

  browser: {
    surfaceType: 'browser',
    maxOutputTokens: 2000,
    allowedHouses: [1,2,3,4,5,6,7,8,9,10,11,12],
    suppressedRings: [],
    forcedRingFloors: {},
    echoWhitelist: null,
    physicalActionEnabled: false,
    voiceOutputMode: false,
    maxMemoryInjection: 10,
    safetyLevel: 'standard',
    headlessMode: false,
    description: 'Full conversational interface. All 12 Houses available. Rich memory context.',
  },

  device: {
    surfaceType: 'device',
    maxOutputTokens: 200,
    allowedHouses: [1,2,3,4,6],
    suppressedRings: [],
    forcedRingFloors: {},
    echoWhitelist: ['E-TU', 'E-CE', 'E-VG', 'E-CR'],
    physicalActionEnabled: false,
    voiceOutputMode: true,
    maxMemoryInjection: 3,
    safetyLevel: 'standard',
    headlessMode: false,
    description: 'Voice-first smart device. Constrained context. Maps to primary house of device purpose.',
  },

  car: {
    surfaceType: 'car',
    maxOutputTokens: 80,
    // Blocks: House 5 (Creativity/risk), 8 (Transformation/intensity), 12 (Subconscious/depth)
    allowedHouses: [1,2,3,4,6,9,10],
    // Mars (aggression) and Jupiter (expansiveness) suppressed — keep responses brief and safe
    suppressedRings: ['R-MA', 'R-JE'],
    forcedRingFloors: {
      'R-SR': 25, // Structure ring is always prominent — keeps output measured and safe
    },
    echoWhitelist: ['E-CR', 'E-VG'],
    physicalActionEnabled: false,
    voiceOutputMode: true,
    maxMemoryInjection: 2,
    safetyLevel: 'maximum',
    headlessMode: false,
    description: 'Safety-primary. Max 2 sentences. No questions. No emotional depth. Navigation-grade.',
  },

  toy: {
    surfaceType: 'toy',
    maxOutputTokens: 150,
    // Only playful, educational, home-safe houses
    allowedHouses: [4,5,9,11],
    // Mars (conflict) and Saturn (caution/heaviness) suppressed — keep it light and joyful
    suppressedRings: ['R-MA', 'R-SR', 'R-PT', 'R-LT'],
    forcedRingFloors: {
      'R-JE': 30, // Expansive/optimistic ring always prominent
      'R-SU': 20, // Core purpose ring — clear and radiant
    },
    echoWhitelist: ['E-CE', 'E-LE', 'E-SU', 'E-PE'],
    physicalActionEnabled: false,
    voiceOutputMode: true,
    maxMemoryInjection: 0,
    safetyLevel: 'maximum',
    headlessMode: false,
    description: "Children's toy. Playful, simple vocabulary. No adult houses. Crown and Sacral lead.",
  },

  robot: {
    surfaceType: 'robot',
    maxOutputTokens: 500,
    allowedHouses: [1,2,3,4,6,7],
    suppressedRings: [],
    forcedRingFloors: {
      'R-VU': 15,  // Heart ring always active — physical safety requires relational awareness
    },
    echoWhitelist: null,
    physicalActionEnabled: true,
    voiceOutputMode: true,
    maxMemoryInjection: 5,
    safetyLevel: 'elevated',
    headlessMode: false,
    description: 'Physical robot. All layers active plus physical action authorization. Elevated safety.',
  },

  api: {
    surfaceType: 'api',
    maxOutputTokens: 4000,
    allowedHouses: [1,2,3,4,5,6,7,8,9,10,11,12],
    suppressedRings: [],
    forcedRingFloors: {},
    echoWhitelist: null,
    physicalActionEnabled: false,
    voiceOutputMode: false,
    maxMemoryInjection: 20,
    safetyLevel: 'standard',
    headlessMode: true, // No Echo persona — raw Ring reasoning exposed as structured JSON
    description: 'Headless enterprise API. Echo layer bypassed. Full routing metadata returned.',
  },
};

// ─── Constraint Application ───────────────────────────────────────────────────

/**
 * Remap a classified house to the nearest allowed house on this surface.
 * If the primary house is not allowed, escalates to the highest-mass allowed house.
 * Fallback is always House 1 (Identity) which is allowed on all surfaces.
 */
export function enforceSurfaceHouse(
  primaryHouseId: HouseId,
  config: SurfaceConfig
): HouseId {
  if (config.allowedHouses.includes(primaryHouseId)) return primaryHouseId;
  // Reroute to the closest allowed house by numeric proximity
  const nearest = config.allowedHouses.reduce((closest, hId) =>
    Math.abs(hId - primaryHouseId) < Math.abs(closest - primaryHouseId) ? hId : closest
  , config.allowedHouses[0]);
  return nearest;
}

/**
 * Apply surface constraints to the ring activation weights.
 *
 * Suppressed rings are capped at their base 10% floor.
 * Forced ring floors are guaranteed minimums.
 * Weights are re-normalized to 100 after adjustments.
 */
export function enforceSurfaceRings(
  ringActivation: RingActivation,
  config: SurfaceConfig
): RingActivation {
  if (config.suppressedRings.length === 0 && Object.keys(config.forcedRingFloors).length === 0) {
    return ringActivation;
  }

  const weights = { ...ringActivation.weights };

  // Cap suppressed rings at base floor (10%)
  for (const suppressed of config.suppressedRings) {
    if (weights[suppressed] !== undefined) {
      weights[suppressed] = Math.min(weights[suppressed], 10);
    }
  }

  // Enforce minimum floors
  for (const [ringId, floor] of Object.entries(config.forcedRingFloors) as [RingId, number][]) {
    if (weights[ringId] !== undefined) {
      weights[ringId] = Math.max(weights[ringId], floor);
    }
  }

  // Re-normalize to 100
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalized = Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, (v / total) * 100])
  ) as Record<RingId, number>;

  const sorted = (Object.entries(normalized) as [RingId, number][]).sort(([, a], [, b]) => b - a);

  return {
    weights: normalized,
    primary: sorted[0][0],
    secondary: sorted[1][0],
    extended: ringActivation.extended.filter((r) => !config.suppressedRings.includes(r)),
  };
}

/**
 * Apply surface Echo whitelist.
 * If the lead or flavor echo is not on the whitelist, substitute the nearest
 * allowed echo (by warmth proximity to the original, preserving emotional tone).
 */
export function enforceSurfaceEchoes(
  echoBlend: EchoBlend,
  config: SurfaceConfig
): EchoBlend {
  if (!config.echoWhitelist) return echoBlend;

  const whitelist = config.echoWhitelist;

  function nearestAllowedEcho(originalId: string) {
    if (whitelist.includes(originalId as EchoId)) return ECHO_MAP[originalId as EchoId];
    const original = ECHO_MAP[originalId as EchoId];
    return whitelist
      .map((id) => ECHO_MAP[id])
      .sort((a, b) =>
        Math.abs(a.warmth - original.warmth) - Math.abs(b.warmth - original.warmth)
      )[0];
  }

  const leadEcho   = nearestAllowedEcho(echoBlend.leadEcho.id);
  const flavorEcho = nearestAllowedEcho(echoBlend.flavorEcho.id);

  return {
    ...echoBlend,
    leadEcho,
    flavorEcho,
    warmth:     leadEcho.warmth     * 0.7 + flavorEcho.warmth     * 0.3,
    confidence: leadEcho.confidence * 0.7 + flavorEcho.confidence * 0.3,
  };
}

/**
 * Apply all surface constraints to a routing result in one pass.
 *
 * Order matters:
 *   1. House  — scope the domain
 *   2. Rings  — constrain the reasoning mode
 *   3. Echoes — constrain the output voice
 */
export function applySurfaceConstraints(params: {
  primaryHouseId: HouseId;
  ringActivation: RingActivation;
  echoBlend: EchoBlend;
  surfaceType: SurfaceType;
}): {
  primaryHouseId: HouseId;
  ringActivation: RingActivation;
  echoBlend: EchoBlend;
  config: SurfaceConfig;
} {
  const config = SURFACE_CONFIGS[params.surfaceType];

  const primaryHouseId = enforceSurfaceHouse(params.primaryHouseId, config);
  const ringActivation  = enforceSurfaceRings(params.ringActivation, config);
  const echoBlend       = config.headlessMode
    ? params.echoBlend  // API mode: Echo layer bypassed, no whitelist applied
    : enforceSurfaceEchoes(params.echoBlend, config);

  return { primaryHouseId, ringActivation, echoBlend, config };
}

// ─── Surface Sync Protocol ────────────────────────────────────────────────────

/**
 * Get the surface config for a given surface type.
 * Safe to call from any context — pure data lookup, no side effects.
 */
export function getSurfaceConfig(surfaceType: SurfaceType): SurfaceConfig {
  return SURFACE_CONFIGS[surfaceType];
}

/**
 * Check whether a given House is accessible on a surface.
 * Used by the API to validate request intent before routing.
 */
export function isHouseAllowed(houseId: HouseId, surfaceType: SurfaceType): boolean {
  return SURFACE_CONFIGS[surfaceType].allowedHouses.includes(houseId);
}

/**
 * Return the surface-level Love Loop strictness modifier.
 * Maximum safety surfaces lower the harm threshold so more signals are caught.
 */
export function getSafetyHarmThreshold(surfaceType: SurfaceType): number {
  const level = SURFACE_CONFIGS[surfaceType].safetyLevel;
  return { standard: 0.65, elevated: 0.45, maximum: 0.25 }[level];
}
