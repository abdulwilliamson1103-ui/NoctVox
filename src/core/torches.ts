// Aum Routing Engine — Layer 2: The 7 Torches
// Torches are the emotional awareness layer. Each Torch's weight is derived from
// the percentage of total user activity that has occurred in its associated Houses.
// Dominant Torch shapes how urgently, warmly, cautiously, or boldly Aum responds.

import type { Torch, TorchId, TorchActivation, ClassicalRingId, HouseId, HouseMapping } from './types';
import { HOUSE_MAP } from './houses';

export const TORCHES: Torch[] = [
  {
    id: 'T-RO',
    name: 'T-RO',
    code: 'T1',
    expression: 'I Am',
    coreWords: 'Safety · Stability · Grounding',
    houses: [1, 2],
    ring: 'R-SR',
    hex: '#8B1A1A',
  },
  {
    id: 'T-SA',
    name: 'T-SA',
    code: 'T2',
    expression: 'I Feel',
    coreWords: 'Passion · Creation · Emotion',
    houses: [5, 8],
    ring: 'R-JE',
    hex: '#C85000',
  },
  {
    id: 'T-SU',
    name: 'T-SU',
    code: 'T3',
    expression: 'I Do',
    coreWords: 'Power · Will · Identity',
    houses: [3, 6],
    ring: 'R-MA',
    hex: '#B8960C',
  },
  {
    id: 'T-HR',
    name: 'T-HR',
    code: 'T4',
    expression: 'I Love',
    coreWords: 'Loving · Connection · Healing',
    houses: [4, 7],
    ring: 'R-VU',
    hex: '#1A7A4A',
  },
  {
    id: 'T-TA',
    name: 'T-TA',
    code: 'T5',
    expression: 'I Speak',
    coreWords: 'Truth · Expression · Sound',
    houses: [9, 10],
    ring: 'R-MR',
    hex: '#1A3A8B',
  },
  {
    id: 'T-TY',
    name: 'T-TY',
    code: 'T6',
    expression: 'I See',
    coreWords: 'Insight · Vision · Clarity',
    houses: [11],
    ring: 'R-MO',
    hex: '#5A0080',
  },
  {
    id: 'T-CW',
    name: 'T-CW',
    code: 'T7',
    expression: 'I Know',
    coreWords: 'Unity · Wisdom · Spirit',
    houses: [12],
    ring: 'R-SU',
    hex: '#8B7A00',
  },
];

export const TORCH_MAP: Record<TorchId, Torch> = Object.fromEntries(
  TORCHES.map((t) => [t.id, t])
) as Record<TorchId, Torch>;

/** Maps each Torch directly to its Classical Ring */
export const TORCH_TO_RING: Record<TorchId, ClassicalRingId> = {
  'T-RO': 'R-SR',
  'T-SA': 'R-JE',
  'T-SU': 'R-MA',
  'T-HR': 'R-VU',
  'T-TA': 'R-MR',
  'T-TY': 'R-MO',
  'T-CW': 'R-SU',
};

// ─── Torch Polarity ───────────────────────────────────────────────────────────
// 0 = pure Yang (outward: will, action, assertion)
// 1 = pure Yin  (inward: receiving, holding, soul)
// The house energy ratio bends torch weights toward torches that share its polarity.

export const TORCH_POLARITY: Record<TorchId, number> = {
  'T-SU': 0.10,  // "I Do"    — power, will — most Yang
  'T-RO': 0.15,  // "I Am"    — grounding, safety — Yang
  'T-SA': 0.40,  // "I Feel"  — passion, creation — Yang-leaning
  'T-TA': 0.50,  // "I Speak" — truth, expression — balanced
  'T-TY': 0.65,  // "I See"   — insight, vision — Yin-leaning
  'T-HR': 0.85,  // "I Love"  — connection, healing — Yin
  'T-CW': 0.95,  // "I Know"  — unity, spirit — most Yin
};

// ─── Weight Computation ───────────────────────────────────────────────────────

/** Baseline equal distribution when there is no house mass history */
function initEqualTorchWeights(): Record<TorchId, number> {
  const base = 100 / TORCHES.length;
  return Object.fromEntries(TORCHES.map((t) => [t.id, base])) as Record<TorchId, number>;
}

function normalizeToHundred(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) return weights;
  return Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, (v / total) * 100])
  );
}

/**
 * Compute Torch weights from accumulated House mass.
 * Each Torch's weight = sum of its Houses' mass / total mass across all Houses × 100
 *
 * @param houseMasses - Map of houseId → accumulated mass
 */
export function computeTorchWeights(
  houseMasses: Record<number, number>
): Record<TorchId, number> {
  const totalMass = Object.values(houseMasses).reduce((a, b) => a + b, 0);
  if (totalMass === 0) return initEqualTorchWeights();

  const weights: Record<string, number> = {};
  for (const torch of TORCHES) {
    const houseSum = torch.houses.reduce(
      (acc, hId) => acc + (houseMasses[hId] ?? 0),
      0
    );
    weights[torch.id] = (houseSum / totalMass) * 100;
  }
  return weights as Record<TorchId, number>;
}

/**
 * Compute the routing-adjusted Torch state for a specific request.
 * Primary House Torch receives +10 boost; modulator House Torches receive partial boost.
 * Result is normalized to 100 total, then ranked to yield dominant and secondary Torches.
 *
 * @param houseMapping - Result from House classifier
 * @param houseMasses  - Persistent house mass ledger for this user
 */
export function computeRoutingTorchState(
  houseMapping: HouseMapping,
  houseMasses: Record<number, number>
): TorchActivation {
  const base = computeTorchWeights(houseMasses) as Record<string, number>;

  // Primary House's Torch gets a routing boost (+10)
  const primaryTorchId = HOUSE_MAP[houseMapping.primaryHouseId].torchRoot;
  base[primaryTorchId] = (base[primaryTorchId] ?? 0) + 10;

  // Modulator Houses' Torches get partial boosts
  for (const mod of houseMapping.modulators) {
    const modTorchId = HOUSE_MAP[mod.id].torchRoot;
    base[modTorchId] = (base[modTorchId] ?? 0) + mod.weight * 5;
  }

  // Energy field — the primary house's Yin/Yang ratio bends the torch field.
  // Polarization measures how far the house is from neutral (0 = balanced, 1 = fully polarized).
  // Each torch is boosted proportionally to how closely its polarity matches the house energy.
  // Max field contribution: +8 to the most-aligned torch (vs +10 for primary torch routing boost).
  const { energyRatio } = houseMapping;
  const polarization = Math.abs(energyRatio - 0.5) * 2;
  if (polarization > 0.05) {
    for (const torch of TORCHES) {
      const alignment = 1 - Math.abs(energyRatio - TORCH_POLARITY[torch.id]);
      base[torch.id] = (base[torch.id] ?? 0) + alignment * polarization * 8;
    }
  }

  const normalized = normalizeToHundred(base) as Record<TorchId, number>;

  const sorted = (Object.entries(normalized) as [TorchId, number][]).sort(
    ([, a], [, b]) => b - a
  );

  return {
    weights: normalized,
    dominant: sorted[0][0],
    secondary: sorted[1][0],
    dominanceRatio: sorted[0][1] / (sorted[1][1] + 0.001),
  };
}
