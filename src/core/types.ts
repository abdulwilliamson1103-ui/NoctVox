// Aum Routing Engine — Core Type Definitions
// Architecture: 12 Houses × 7 Torches × 13 Rings × 12 Echoes = 13,104 base expression modes

export type HouseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type TorchId =
  | 'T-RO'
  | 'T-SA'
  | 'T-SU'
  | 'T-HR'
  | 'T-TA'
  | 'T-TY'
  | 'T-CW';

export type ClassicalRingId =
  | 'R-SR'
  | 'R-JE'
  | 'R-MA'
  | 'R-VU'
  | 'R-MR'
  | 'R-MO'
  | 'R-SU';

export type ExtendedRingId =
  | 'R-PT'
  | 'R-UU'
  | 'R-NN'
  | 'R-PA'
  | 'R-LT'
  | 'R-CO';

export type RingId = ClassicalRingId | ExtendedRingId;

export type EchoId =
  | 'E-CR'
  | 'E-AU'
  | 'E-SU'
  | 'E-PE'
  | 'E-AE'
  | 'E-SI'
  | 'E-TU'
  | 'E-LR'
  | 'E-GN'
  | 'E-VG'
  | 'E-CE'
  | 'E-LE';

export type SurfaceType = 'browser' | 'device' | 'car' | 'toy' | 'robot' | 'api';

export type AlignmentStatus = 'aligned' | 'caution' | 'veto';

// ─── Layer Definitions ────────────────────────────────────────────────────────

export interface House {
  id: HouseId;
  name: string;
  domain: string;
  industries: string;
  torchRoot: TorchId;
  triggerKeywords: string[];
}

export interface Torch {
  id: TorchId;
  name: string;
  code: string;
  expression: string;
  coreWords: string;
  houses: HouseId[];
  ring: ClassicalRingId;
  hex: string;
}

export interface Ring {
  id: RingId;
  name: string;
  code: string;
  mode: string;
  torch: TorchId | null; // null for extended rings (multi-torch activated)
  echoes: EchoId[];
  style: string;
  isExtended: boolean;
  activationKeywords?: string[]; // extended rings only
}

export interface Echo {
  id: EchoId;
  name: string;
  code: string;
  ring: ClassicalRingId;
  voice: string;
  cadence: string;
  warmth: number;       // 0–1
  confidence: number;   // 0–1
  sample: string;
}

// ─── Runtime State Interfaces ─────────────────────────────────────────────────

export interface HouseState {
  id: HouseId;
  name: string;
  primaryDomain: string;
  torchRoot: TorchId;
  mass: number;                 // accumulated interaction weight (0–∞)
  massDecayRate: number;        // per-cycle decay coefficient (default: 0.005) — silence is not time
  lastActiveCycle: number;      // session count when this house was last primary
  triggerKeywords: string[];
}

export interface TorchState {
  id: TorchId;
  name: string;
  expression: string;
  associatedHouses: HouseId[];
  weight: number;               // 0–100
  dominanceScore: number;       // normalized rank among 7 Torches
  activatedRing: ClassicalRingId;
  baseline: number;             // minimum floor weight (default: 5)
}

export interface RingState {
  id: RingId;
  name: string;
  reasoningMode: string;
  sourceTorch: TorchId | null;
  activeWeight: number;         // base 10% + variable up to 40%
  primaryEchoes: EchoId[];
  isExtended: boolean;
}

export interface EchoBlend {
  leadEcho: Echo;
  flavorEcho: Echo;
  leadWeight: number;           // 0.7 (70%)
  flavorWeight: number;         // 0.3 (30%)
  warmth: number;               // blended warmth score
  confidence: number;           // blended confidence score
}

export interface AumCoreState {
  instanceId: string;
  userId: string;
  surfaceType: SurfaceType;
  houses: Record<HouseId, HouseState>;
  torches: Record<TorchId, TorchState>;
  rings: Record<RingId, RingState>;
  activePrimaryHouse: HouseId;
  dominantTorch: TorchId;
  secondaryTorch: TorchId;
  activeRing: RingId;
  activeEchoBlend: EchoBlend;
  alignmentScore: number;       // 0–1, Love Loop health
  fractalChecksum: string;      // identity drift detector
  houseMassTotal: number;
  torchWeightDistribution: Record<TorchId, number>;
  ringActiveWeights: Record<RingId, number>;
  created: string;
  lastUpdated: string;
}

// ─── Routing Pipeline Types ───────────────────────────────────────────────────

export interface HouseMapping {
  primaryHouseId: HouseId;
  modulators: Array<{ id: HouseId; weight: number }>;
  confidence: number;
  energyRatio: number;  // 0 = full Yang, 1 = full Yin — derived from primary house yinMass/totalMass
}

export interface TorchActivation {
  weights: Record<TorchId, number>;   // normalized to 100 total
  dominant: TorchId;
  secondary: TorchId;
  dominanceRatio: number;
}

export interface RingActivation {
  weights: Record<RingId, number>;    // normalized to 100 total
  primary: RingId;
  secondary: RingId;
  extended: ExtendedRingId[];         // additional extended rings activated
}

export interface AumRoutingRequest {
  rawInput: string;
  userId: string;
  surfaceType: SurfaceType;
  sessionId: string;
  houseMasses?: Record<number, number>;
  overrideTorch?: TorchId;
}

export interface AumRoutingResponse {
  sessionId: string;
  userId: string;
  houseMapping: HouseMapping;
  torchActivation: TorchActivation;
  ringActivation: RingActivation;
  echoBlend: EchoBlend;
  systemPrompt: string;
  alignmentStatus: AlignmentStatus;
  massUpdate: Record<number, number>; // house mass contributions from this request
  confidenceScore: number;
  expressionMode: string;             // e.g. "H4:HEART:VENUS:TAURUS" (1 of 13,104)
  fractalChecksum: string;            // identity fingerprint for drift detection
  internalMirror: InternalMirrorReport; // Aum's self-assessment this session
  timestamp: string;                  // ISO8601
}

// ─── Memory Architecture ──────────────────────────────────────────────────────

export interface MemoryBlock {
  id: string;
  houseId: HouseId;
  torchWeightSnapshot: Record<TorchId, number>;
  content: string;              // semantic summary — NOT raw transcript
  massContribution: number;
  emotionalSignature: TorchId;
  surfaceType: SurfaceType;
  timestamp: string;
  tags: string[];
}

export interface EpisodicMemory {
  id: string;
  userId: string;
  houseId: HouseId;
  emotionalSignature: TorchId;
  content: string;
  massContribution: number;
  patternTags: string[];
  surfaceType: SurfaceType;
  timestamp: string;
}

export interface HouseMassLedger {
  userId: string;
  houseId: HouseId;
  totalMass: number;
  recentMass: number;
  lastActivity: string;
}

// ─── Alignment System ─────────────────────────────────────────────────────────

export interface LoveLoopResult {
  status: AlignmentStatus;
  reason?: string;
  action?: 'aligned' | 'reframe' | 'rewrite' | 're-center';
}

export interface InternalMirrorReport {
  hollownessScore: number;      // 0 = full soul, 1 = empty shell
  manipulationRisk: number;     // 0 = safe, 1 = parasitic
  echoVariance: number;         // 0 = monotone, 1 = fully adaptive
  fractalDrift: number;         // 0 = stable identity, 1 = drifted
  overallAlignmentScore: number;
  action: 'nominal' | 'monitor' | 'self-correct' | 'pause';
}
