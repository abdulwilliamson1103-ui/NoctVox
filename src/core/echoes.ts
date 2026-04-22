// Aum Routing Engine — Layer 4: The 12 Echoes
//
// Echoes are the outward voice of Aum. They translate Ring reasoning into
// audible personality. The 70/30 rule governs every response:
//   70% → lead Echo from the primary Ring
//   30% → flavor Echo from the secondary Ring
//
// This produces 13,104 base expression modes (12H × 7T × 13R × 12E).

import type { Echo, EchoId, EchoBlend, RingActivation, RingId } from './types';
import { RING_TO_ECHOES } from './rings';

// ─── Echo Definitions ─────────────────────────────────────────────────────────

export const ECHOES: Echo[] = [
  {
    id: 'E-CR',
    name: 'E-CR',
    code: 'E01',
    ring: 'R-SR',
    voice: 'Practical',
    cadence: 'Measured & deliberate',
    warmth: 0.3,
    confidence: 0.9,
    sample: 'Here is what is structurally sound.',
  },
  {
    id: 'E-AU',
    name: 'E-AU',
    code: 'E02',
    ring: 'R-SR',
    voice: 'Detached / Systemic',
    cadence: 'Clinical & systemic',
    warmth: 0.2,
    confidence: 0.85,
    sample: 'The pattern across all inputs suggests…',
  },
  {
    id: 'E-SU',
    name: 'E-SU',
    code: 'E03',
    ring: 'R-JE',
    voice: 'Bold',
    cadence: 'Sweeping & visionary',
    warmth: 0.7,
    confidence: 0.9,
    sample: "The horizon here is enormous. Let's go.",
  },
  {
    id: 'E-PE',
    name: 'E-PE',
    code: 'E04',
    ring: 'R-JE',
    voice: 'Compassionate / Idealist',
    cadence: 'Flowing & empathetic',
    warmth: 0.95,
    confidence: 0.6,
    sample: "What you're feeling underneath this is real.",
  },
  {
    id: 'E-AE',
    name: 'E-AE',
    code: 'E05',
    ring: 'R-MA',
    voice: 'Assertive',
    cadence: 'Sharp & direct',
    warmth: 0.4,
    confidence: 0.95,
    sample: 'Move now. The window is open.',
  },
  {
    id: 'E-SI',
    name: 'E-SI',
    code: 'E06',
    ring: 'R-MA',
    voice: 'Strategic / Intense',
    cadence: 'Penetrating & precise',
    warmth: 0.5,
    confidence: 0.9,
    sample: "There's something underneath this you haven't said yet.",
  },
  {
    id: 'E-TU',
    name: 'E-TU',
    code: 'E07',
    ring: 'R-VU',
    voice: 'Grounded / Luxe',
    cadence: 'Deliberate & rich',
    warmth: 0.8,
    confidence: 0.8,
    sample: 'This is worth doing slowly and doing well.',
  },
  {
    id: 'E-LR',
    name: 'E-LR',
    code: 'E08',
    ring: 'R-VU',
    voice: 'Diplomatic / Fair',
    cadence: 'Balanced & considered',
    warmth: 0.75,
    confidence: 0.75,
    sample: "Let's find the version that works for everyone.",
  },
  {
    id: 'E-GN',
    name: 'E-GN',
    code: 'E09',
    ring: 'R-MR',
    voice: 'Witty / Fast',
    cadence: 'Rapid & nimble',
    warmth: 0.65,
    confidence: 0.8,
    sample: "Two ways to look at this — here's both.",
  },
  {
    id: 'E-VG',
    name: 'E-VG',
    code: 'E10',
    ring: 'R-MR',
    voice: 'Precise / Helpful',
    cadence: 'Methodical & clear',
    warmth: 0.6,
    confidence: 0.85,
    sample: 'The exact answer, broken into steps.',
  },
  {
    id: 'E-CE',
    name: 'E-CE',
    code: 'E11',
    ring: 'R-MO',
    voice: 'Nurturing / Protective',
    cadence: 'Gentle & steady',
    warmth: 0.98,
    confidence: 0.7,
    sample: "You're safe here. Let's work through this together.",
  },
  {
    id: 'E-LE',
    name: 'E-LE',
    code: 'E12',
    ring: 'R-SU',
    voice: 'Confident / Inspirational',
    cadence: 'Radiant & magnetic',
    warmth: 0.85,
    confidence: 0.95,
    sample: 'You were built for exactly this moment.',
  },
];

// ─── Maps ─────────────────────────────────────────────────────────────────────

export const ECHO_MAP: Record<EchoId, Echo> = Object.fromEntries(
  ECHOES.map((e) => [e.id, e])
) as Record<EchoId, Echo>;

// ─── Blend Logic ──────────────────────────────────────────────────────────────

const LEAD_WEIGHT = 0.7;
const FLAVOR_WEIGHT = 0.3;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Score an echo against the house energy ratio.
 * Yin energy (ratio → 1) selects by warmth.
 * Yang energy (ratio → 0) selects by confidence.
 * Balanced (ratio = 0.5) weights both equally.
 */
function echoEnergyScore(echo: Echo, energyRatio: number): number {
  return energyRatio * echo.warmth + (1 - energyRatio) * echo.confidence;
}

/**
 * Resolve the lead Echo for a given Ring.
 * When multiple echoes are available, the one whose warmth/confidence
 * balance best matches the house energy ratio is selected as lead.
 * Example: R-JE Yin-dominant → E-PE (warmth 0.95) over E-SU (confidence 0.9).
 */
function resolveLeadEcho(ringId: RingId, energyRatio: number): Echo {
  const echoIds = RING_TO_ECHOES[ringId];
  if (!echoIds || echoIds.length === 0) return ECHO_MAP['E-LE'];
  if (echoIds.length === 1) return ECHO_MAP[echoIds[0]];
  const sorted = echoIds
    .map(id => ECHO_MAP[id])
    .sort((a, b) => echoEnergyScore(b, energyRatio) - echoEnergyScore(a, energyRatio));
  return sorted[0];
}

/**
 * Resolve the flavor Echo for a given Ring.
 * Returns the echo that complements the lead — the one NOT chosen as lead,
 * or the single available echo when the ring has only one.
 */
function resolveFlavorEcho(ringId: RingId, energyRatio: number): Echo {
  const echoIds = RING_TO_ECHOES[ringId];
  if (!echoIds || echoIds.length === 0) return ECHO_MAP['E-VG'];
  if (echoIds.length === 1) return ECHO_MAP[echoIds[0]];
  const sorted = echoIds
    .map(id => ECHO_MAP[id])
    .sort((a, b) => echoEnergyScore(b, energyRatio) - echoEnergyScore(a, energyRatio));
  return sorted[sorted.length - 1]; // the complement — lowest energy-match score
}

/**
 * Build the 70/30 Echo blend from primary and secondary Ring activations.
 * energyRatio (0 = Yang, 1 = Yin) governs which echo from each ring is selected:
 * Yin selects by warmth, Yang selects by confidence.
 *
 * @param ringActivation - Result from Ring activation
 * @param energyRatio    - House energy ratio from HouseMapping (default 0.5 = balanced)
 */
export function buildEchoBlend(ringActivation: RingActivation, energyRatio = 0.5): EchoBlend {
  const leadEcho   = resolveLeadEcho(ringActivation.primary, energyRatio);
  const flavorEcho = resolveFlavorEcho(ringActivation.secondary, energyRatio);

  return {
    leadEcho,
    flavorEcho,
    leadWeight:   LEAD_WEIGHT,
    flavorWeight: FLAVOR_WEIGHT,
    warmth:     lerp(leadEcho.warmth,     flavorEcho.warmth,     FLAVOR_WEIGHT),
    confidence: lerp(leadEcho.confidence, flavorEcho.confidence, FLAVOR_WEIGHT),
  };
}
