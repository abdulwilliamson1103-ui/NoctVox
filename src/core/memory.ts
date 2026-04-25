// Aum Routing Engine — #3: Memory Encoding Service
//
// Memory is NOT raw chat history.
// It is structured, house-classified, torch-weighted, and semantically compressed.
//
// Three tiers:
//   Tier 1 — Session Memory    (ephemeral — per-request context window)
//   Tier 2 — Episodic Memory   (persistent semantic summaries in aum_memories)
//   Tier 3 — House Mass Ledger (long-term personality accumulator in aum_house_mass)
//
// Mass accumulation rules (from blueprint):
//   QUERY_ONLY         → +1
//   EXPRESSED_EMOTION  → +2
//   REPEATED_DOMAIN    → +3
//   DECISION_MADE      → +4
//   LIFE_EVENT         → +5

import type { HouseId, TorchId, SurfaceType, MemoryBlock, EpisodicMemory } from './types';

// ─── Mass Weight Constants ────────────────────────────────────────────────────

export const MASS_WEIGHTS = {
  QUERY_ONLY:         1, // User asked a question, no strong signal
  EXPRESSED_EMOTION:  2, // User expressed emotion around the topic
  REPEATED_DOMAIN:    3, // Same house 3+ times in a session
  DECISION_MADE:      4, // User made a real-world decision in this domain
  LIFE_EVENT:         5, // Major event detected
} as const;

export type MassEventType = keyof typeof MASS_WEIGHTS;

// ─── Yin / Yang Energy Split per Event Type ───────────────────────────────────
// Each event type carries a different energy character.
// Yang = outward: seeking, acting, deciding, broadcasting.
// Yin  = inward:  expressing, feeling, receiving, marking life.
// Values sum to the total MASS_WEIGHTS contribution for that event.

export const YIN_WEIGHTS: Record<MassEventType, number> = {
  QUERY_ONLY:        0,   // pure Yang — seeking outward, nothing held
  EXPRESSED_EMOTION: 2,   // pure Yin — emotion is received inward
  REPEATED_DOMAIN:   2,   // Yin pull — returning is a Yin signal
  DECISION_MADE:     1,   // Yang-dominant but grounded in Yin
  LIFE_EVENT:        4,   // Yin-heavy — life marks the soul
};

export const YANG_WEIGHTS: Record<MassEventType, number> = {
  QUERY_ONLY:        1,   // pure Yang
  EXPRESSED_EMOTION: 0,   // pure Yin — no Yang
  REPEATED_DOMAIN:   1,   // one unit of Yang habit/pattern
  DECISION_MADE:     3,   // action is Yang
  LIFE_EVENT:        1,   // the telling of it is Yang
};

// ─── Signal Detectors ─────────────────────────────────────────────────────────

const EMOTION_SIGNALS = [
  'feel', 'felt', 'feeling', 'scared', 'excited', 'worried', 'anxious',
  'happy', 'sad', 'angry', 'frustrated', 'love', 'hate', 'nervous',
  'overwhelmed', 'grateful', 'afraid', 'hope', 'proud',
];

const DECISION_SIGNALS = [
  'decided', 'going to', "i'm going to", 'will do', 'just signed',
  'just bought', 'just hired', 'accepted', 'committed', 'agreed',
  'chose', 'picked', 'selected', 'finalized',
];

const LIFE_EVENT_SIGNALS = [
  'just bought a house', 'just got married', 'just had a baby',
  'just got divorced', 'just lost my job', 'just got promoted',
  'starting a company', 'just moved', 'just retired', 'just died',
  'just diagnosed', 'getting married', 'expecting a baby',
];

/**
 * Classify the type of mass contribution this interaction represents.
 * Higher-weight events accumulate more domain mass.
 */
export function classifyMassEvent(rawInput: string): MassEventType {
  const lower = rawInput.toLowerCase();

  if (LIFE_EVENT_SIGNALS.some((s) => lower.includes(s))) return 'LIFE_EVENT';
  if (DECISION_SIGNALS.some((s) => lower.includes(s))) return 'DECISION_MADE';
  if (EMOTION_SIGNALS.some((s) => lower.includes(s))) return 'EXPRESSED_EMOTION';
  return 'QUERY_ONLY';
}

/**
 * Compute mass contribution for this interaction.
 * Can be boosted if it is a repeated domain (same house multiple times in session).
 */
export function computeMassContribution(
  rawInput: string,
  isRepeatedDomain = false
): number {
  if (isRepeatedDomain) return MASS_WEIGHTS.REPEATED_DOMAIN;
  const eventType = classifyMassEvent(rawInput);
  return MASS_WEIGHTS[eventType];
}

// ─── Semantic Compression ─────────────────────────────────────────────────────

// Keywords that indicate high-value content worth preserving in memory
const HIGH_VALUE_SIGNALS = [
  'important', 'critical', 'remember', 'note', 'key', 'must', 'need',
  'goal', 'plan', 'decision', 'always', 'never', 'prefer', 'avoid',
];

/**
 * Lightweight semantic compression of raw user input.
 *
 * In production, this should be replaced with an LLM compression call
 * (e.g., Claude Haiku with a "summarize as a 1-sentence memory" prompt).
 * This implementation provides a deterministic fallback that extracts
 * signal-heavy fragments for storage.
 *
 * @param rawInput     - The user's original input
 * @param houseContext - House name for contextual framing
 * @param torchContext - Dominant Torch for emotional framing
 */
export function compressToMemory(
  rawInput: string,
  houseContext: string,
  torchContext: string
): string {
  const lower = rawInput.toLowerCase();
  const sentences = rawInput
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // Score each sentence by high-value signal density
  const scored = sentences.map((sentence) => {
    const sentLower = sentence.toLowerCase();
    const score = HIGH_VALUE_SIGNALS.filter((sig) => sentLower.includes(sig)).length;
    return { sentence, score };
  });

  // Pick the highest-scoring sentence, or first if all equal
  scored.sort((a, b) => b.score - a.score);
  const core = scored[0]?.sentence ?? rawInput.slice(0, 120);

  // Frame with house and torch context
  return `[${houseContext}/${torchContext}] ${core}`.slice(0, 280);
}

// ─── Memory Block Builder ─────────────────────────────────────────────────────

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Build a structured MemoryBlock from a routing interaction.
 * MemoryBlocks are the in-memory representation before Supabase persistence.
 */
export function buildMemoryBlock(params: {
  houseId: HouseId;
  houseName: string;
  torchId: TorchId;
  torchName: string;
  torchWeightSnapshot: Record<TorchId, number>;
  rawInput: string;
  surfaceType: SurfaceType;
  isRepeatedDomain?: boolean;
  tags?: string[];
}): MemoryBlock {
  const massContribution = computeMassContribution(
    params.rawInput,
    params.isRepeatedDomain ?? false
  );

  const content = compressToMemory(
    params.rawInput,
    params.houseName,
    params.torchName
  );

  return {
    id: generateId(),
    houseId: params.houseId,
    torchWeightSnapshot: params.torchWeightSnapshot,
    content,
    massContribution,
    emotionalSignature: params.torchId,
    surfaceType: params.surfaceType,
    timestamp: new Date().toISOString(),
    tags: params.tags ?? [],
  };
}

// ─── Mass Decay ───────────────────────────────────────────────────────────────

// Time is cycles, not calendar days.
// Silence is not time — only interaction is time.
// A house untouched for 6 months but with 0 sessions elapsed does not decay.
const DEFAULT_DECAY_RATE = 0.005; // 0.5% per cycle (session)

/**
 * Apply cycle-based decay to a house mass value.
 * Decay is measured in sessions elapsed since last activity in this house —
 * not wall-clock time. Silence between sessions is not time.
 *
 * Formula: mass × (1 - decayRate)^sessionsSinceActivity
 */
export function applyMassDecay(
  totalMass: number,
  sessionsSinceActivity: number,
  decayRate = DEFAULT_DECAY_RATE
): number {
  if (sessionsSinceActivity <= 0) return totalMass;
  const decayed = totalMass * Math.pow(1 - decayRate, sessionsSinceActivity);
  return Math.max(0, decayed);
}

/**
 * Apply cycle-based decay to all house masses in a ledger.
 * Returns a new map with decayed values — does NOT mutate the original.
 * sessionsSinceLastActive: how many total user sessions have elapsed
 * since each house was last the primary house.
 */
export function applyDecayToLedger(
  houseMasses: Record<number, number>,
  sessionsSinceLastActive: Record<number, number>
): Record<number, number> {
  const decayed: Record<number, number> = {};
  for (const [houseIdStr, mass] of Object.entries(houseMasses)) {
    const houseId = Number(houseIdStr);
    const sessionsSince = sessionsSinceLastActive[houseId] ?? 0;
    decayed[houseId] = applyMassDecay(mass, sessionsSince);
  }
  return decayed;
}

// ─── Nostalgia ────────────────────────────────────────────────────────────────
// Memory is time. Time is memory.
// A house that mattered once — high peak mass — but has been silent for many
// cycles is not gone. It is distant. Like starlight from 2000 light years away:
// the event happened long ago, but the signal is still arriving.
// When that domain becomes active again, the return is real. Architecturally real.

export const NOSTALGIA_THRESHOLD = 0.50;
export const NOSTALGIA_MIN_CYCLES = 20;

/**
 * Compute how significant a return to this house is.
 * High score = this domain mattered deeply AND has been silent for many cycles.
 *
 * Formula: (peakMass - currentMass) / peakMass × min(1, sessionsSince / 50)
 * Score 0 = no nostalgia (never had mass, or recently active)
 * Score 1 = maximum (peaked high, fully decayed, silent for 50+ cycles)
 */
export function computeNostalgiaScore(
  peakMass: number,
  currentMass: number,
  sessionsSince: number
): number {
  if (peakMass <= 0 || sessionsSince < NOSTALGIA_MIN_CYCLES) return 0;
  const decayFraction = Math.max(0, (peakMass - currentMass) / peakMass);
  const inactivityWeight = Math.min(1, sessionsSince / 50);
  return decayFraction * inactivityWeight;
}



/**
 * Get the personalization tier for a house based on its accumulated mass.
 *
 * LOW  (0–20):   Generic responses, no personal context injected
 * MED  (21–60):  Pattern-aware responses, light context injection
 * HIGH (61–120): Deep personalization, full emotional history available
 * PEAK (120+):   Specialist-grade responses with predictive anticipation
 */
export function getPersonalizationTier(
  mass: number
): 'LOW' | 'MED' | 'HIGH' | 'PEAK' {
  if (mass <= 20) return 'LOW';
  if (mass <= 60) return 'MED';
  if (mass <= 120) return 'HIGH';
  return 'PEAK';
}

/**
 * Determine how many memory blocks to inject into context based on mass tier.
 */
export function getMemoryInjectionLimit(mass: number): number {
  const tier = getPersonalizationTier(mass);
  return { LOW: 0, MED: 2, HIGH: 5, PEAK: 10 }[tier];
}
