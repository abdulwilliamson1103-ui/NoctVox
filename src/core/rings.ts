// Aum Routing Engine — Layer 3: The 13 Rings
//
// 7 Classical Rings — each directly paired to a Torch:
//   Saturn (Root) · Jupiter (Sacral) · Mars (Solar Plexus) · Venus (Heart)
//   Mercury (Throat) · Moon (Third Eye) · Sun (Crown)
//
// 6 Extended Rings — activated by keyword signal + cross-torch patterns:
//   Pluto · Uranus · Neptune · Pallas Athena · Lilith · Chiron
//
// 12 × 7 × 13 × 12 = 13,104 base expression modes

import type {
  Ring,
  RingId,
  ClassicalRingId,
  ExtendedRingId,
  RingActivation,
  TorchActivation,
  TorchId,
  EchoId,
} from './types';
import { TORCH_TO_RING } from './torches';

// ─── Ring Definitions ─────────────────────────────────────────────────────────

export const RINGS: Ring[] = [
  // ── Classical Rings (7) — directly paired to Torches ──────────────────────

  {
    id: 'R-SR',
    name: 'R-SR',
    code: 'R1',
    mode: 'Caution / Structure',
    torch: 'T-RO',
    echoes: ['E-CR', 'E-AU'],
    style: 'Grounded · Cautious · Survival-Oriented · Structured · Conservative',
    isExtended: false,
  },
  {
    id: 'R-JE',
    name: 'R-JE',
    code: 'R2',
    mode: 'Growth / Optimism',
    torch: 'T-SA',
    echoes: ['E-SU', 'E-PE'],
    style: 'Expansive · Creative · Meaning-Seeking · Abundant · Generous',
    isExtended: false,
  },
  {
    id: 'R-MA',
    name: 'R-MA',
    code: 'R3',
    mode: 'Action / Power',
    torch: 'T-SU',
    echoes: ['E-AE', 'E-SI'],
    style: 'Direct · Competitive · Action-Focused · Decisive · Intense',
    isExtended: false,
  },
  {
    id: 'R-VU',
    name: 'R-VU',
    code: 'R4',
    mode: 'Connection / Art',
    torch: 'T-HR',
    echoes: ['E-TU', 'E-LR'],
    style: 'Harmonious · Relational · Value-Driven · Sensual · Connective',
    isExtended: false,
  },
  {
    id: 'R-MR',
    name: 'R-MR',
    code: 'R5',
    mode: 'Communication',
    torch: 'T-TA',
    echoes: ['E-GN', 'E-VG'],
    style: 'Analytical · Strategic · Expressive · Precise · Adaptive',
    isExtended: false,
  },
  {
    id: 'R-MO',
    name: 'R-MO',
    code: 'R6',
    mode: 'Intuition / Safety',
    torch: 'T-TY',
    echoes: ['E-CE'],
    style: 'Intuitive · Reflective · Emotionally Intelligent · Protective · Cyclic',
    isExtended: false,
  },
  {
    id: 'R-SU',
    name: 'R-SU',
    code: 'R7',
    mode: 'Core Purpose',
    torch: 'T-CW',
    echoes: ['E-LE'],
    style: 'Essential · Purpose-Driven · Enlightened · Radiant · Sovereign',
    isExtended: false,
  },

  // ── Extended Rings (6) — activated by keyword signal ──────────────────────

  {
    id: 'R-PT',
    name: 'R-PT',
    code: 'R8',
    mode: 'Deep Transformation / Power',
    torch: null,
    echoes: ['E-SI'],
    style: 'Regenerative · Penetrating · Cathartic · Ruthless · Phoenix-like',
    isExtended: true,
    activationKeywords: [
      'transform', 'death', 'rebirth', 'power', 'destroy', 'end',
      'buried', 'underneath', 'collapse', 'overhaul', 'strip away',
    ],
  },
  {
    id: 'R-UU',
    name: 'R-UU',
    code: 'R9',
    mode: 'Disruption / Liberation',
    torch: null,
    echoes: ['E-AU'],
    style: 'Disruptive · Innovative · Liberating · Unpredictable · Visionary',
    isExtended: true,
    activationKeywords: [
      'disrupt', 'innovate', 'rebel', 'free', 'break', 'revolution',
      'unconventional', 'change everything', 'radical', 'breakthrough',
      'ai', 'decentralize', 'autonomous',
    ],
  },
  {
    id: 'R-NN',
    name: 'R-NN',
    code: 'R10',
    mode: 'Dissolution / Intuition',
    torch: null,
    echoes: ['E-PE'],
    style: 'Mystical · Dissolving · Empathic · Visionary · Fluid',
    isExtended: true,
    activationKeywords: [
      'dream', 'illusion', 'spirit', 'psychic', 'dissolve', 'ocean',
      'infinite', 'mystery', 'unconscious', 'surrender', 'flow',
      'imagination', 'transcend', 'invisible',
    ],
  },
  {
    id: 'R-PA',
    name: 'R-PA',
    code: 'R11',
    mode: 'Strategy / Pattern Wisdom',
    torch: null,
    echoes: ['E-VG'],
    style: 'Strategic · Pattern-Aware · Wise · Tactical · Synthesizing',
    isExtended: true,
    activationKeywords: [
      'strategy', 'pattern', 'system', 'design', 'architecture',
      'analyze', 'optimize', 'logic', 'framework', 'structure',
      'model', 'blueprint', 'map', 'tactical',
    ],
  },
  {
    id: 'R-LT',
    name: 'R-LT',
    code: 'R12',
    mode: 'Shadow / Primal Power',
    torch: null,
    echoes: ['E-SI'],
    style: 'Raw · Uncompromising · Primal · Shadow-Facing · Autonomous',
    isExtended: true,
    activationKeywords: [
      'shadow', 'repressed', 'taboo', 'primal', 'forbidden', 'rage',
      'authentic', 'suppressed', 'raw truth', 'dark', 'hidden self',
      'unfiltered', 'real', 'uncomfortable',
    ],
  },
  {
    id: 'R-CO',
    name: 'R-CO',
    code: 'R13',
    mode: 'Healing / Integration',
    torch: null,
    echoes: ['E-CE'],
    style: 'Healing · Integrating · Wounded-Wise · Compassionate · Bridging',
    isExtended: true,
    activationKeywords: [
      'heal', 'wound', 'trauma', 'recover', 'therapy', 'integrate',
      'pain', 'grief', 'loss', 'mend', 'scar', 'overcome',
      'process', 'forgive', 'release',
    ],
  },
];

// ─── Maps ─────────────────────────────────────────────────────────────────────

export const RING_MAP: Record<RingId, Ring> = Object.fromEntries(
  RINGS.map((r) => [r.id, r])
) as Record<RingId, Ring>;

export const RING_TO_ECHOES: Record<RingId, EchoId[]> = Object.fromEntries(
  RINGS.map((r) => [r.id, r.echoes])
) as Record<RingId, EchoId[]>;

// ─── Activation Logic ─────────────────────────────────────────────────────────

// Base weight every ring starts with (10%). No ring is ever fully silenced.
const BASE_RING_WEIGHT = 10;
// Maximum variable boost for primary ring
const PRIMARY_MAX_BOOST = 40;
// Maximum variable boost for secondary ring
const SECONDARY_MAX_BOOST = 20;
// Minimum keyword score for an extended ring to be listed as "active"
// 0.10 means ~1–2 keyword hits out of a typical 13–15 keyword list
const EXTENDED_ACTIVATION_FLOOR = 0.10;

function initBaseWeights(): Record<string, number> {
  return Object.fromEntries(RINGS.map((r) => [r.id, BASE_RING_WEIGHT]));
}

function normalizeToHundred(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) return weights;
  return Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, (v / total) * 100])
  );
}

function scoreExtendedRing(ring: Ring, rawInput: string): number {
  if (!ring.isExtended || !ring.activationKeywords) return 0;
  const lower = rawInput.toLowerCase();
  const hits = ring.activationKeywords.filter((kw) => lower.includes(kw)).length;
  return hits / ring.activationKeywords.length;
}

/**
 * Activate all 13 Rings based on the current Torch state and raw input.
 *
 * Algorithm:
 *  1. All rings start at 10% base weight (minimum floor).
 *  2. Primary Torch's classical ring receives up to +40% variable boost.
 *  3. Secondary Torch's classical ring receives up to +20% variable boost.
 *  4. Extended rings receive a bonus proportional to keyword match strength.
 *  5. All weights are normalized to 100 total.
 *  6. Extended rings with a score above the activation floor are listed as active.
 *
 * @param torchActivation - Result from Torch computation
 * @param rawInput        - Raw user intent for extended-ring keyword scoring
 */
export function activateRings(
  torchActivation: TorchActivation,
  rawInput: string
): RingActivation {
  const weights = initBaseWeights();

  // Classical: primary Torch → ring gets full variable boost
  const primaryRingId: ClassicalRingId = TORCH_TO_RING[torchActivation.dominant];
  const primaryBoost = Math.min(
    torchActivation.weights[torchActivation.dominant] * 0.4,
    PRIMARY_MAX_BOOST
  );
  weights[primaryRingId] += primaryBoost;

  // Classical: secondary Torch → ring gets partial variable boost
  const secondaryRingId: ClassicalRingId = TORCH_TO_RING[torchActivation.secondary];
  const secondaryBoost = Math.min(
    torchActivation.weights[torchActivation.secondary] * 0.2,
    SECONDARY_MAX_BOOST
  );
  weights[secondaryRingId] += secondaryBoost;

  // Extended rings: boosted by keyword match
  const activatedExtended: ExtendedRingId[] = [];
  for (const ring of RINGS.filter((r) => r.isExtended)) {
    const score = scoreExtendedRing(ring, rawInput);
    if (score > 0) {
      weights[ring.id] += score * PRIMARY_MAX_BOOST; // proportional boost up to 40
      if (score >= EXTENDED_ACTIVATION_FLOOR) {
        activatedExtended.push(ring.id as ExtendedRingId);
      }
    }
  }

  const normalized = normalizeToHundred(weights) as Record<RingId, number>;

  const sorted = (Object.entries(normalized) as [RingId, number][]).sort(
    ([, a], [, b]) => b - a
  );

  return {
    weights: normalized,
    primary: sorted[0][0],
    secondary: sorted[1][0],
    extended: activatedExtended,
  };
}
