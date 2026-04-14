// Aum Routing Engine — Integration Test
// Tests the full pipeline: Intent → House → Torch → Ring → Echo

import { classifyHouse } from './houses';
import { computeRoutingTorchState } from './torches';
import { activateRings } from './rings';
import { buildEchoBlend } from './echoes';
import { routeIntent } from './router';
import { runLoveLoop } from './alignment';
import { classifyMassEvent, computeMassContribution, applyMassDecay } from './memory';

// ─── Test helpers ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function section(name: string) {
  console.log(`\n── ${name} ──`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

section('House Classifier');

const homeMapping = classifyHouse('I want to buy a house in Charlotte');
assert(homeMapping.primaryHouseId === 4, `"buy a house" → House 4 (Home), got H${homeMapping.primaryHouseId}`);
assert(homeMapping.confidence > 0, `confidence > 0 (got ${homeMapping.confidence.toFixed(2)})`);

const financeMapping = classifyHouse('help me invest my crypto savings');
assert(financeMapping.primaryHouseId === 2, `"crypto savings" → House 2 (Values), got H${financeMapping.primaryHouseId}`);

const communityMapping = classifyHouse('building an AI system for our web3 community');
assert(communityMapping.primaryHouseId === 11, `"AI web3 community" → House 11 (Community), got H${communityMapping.primaryHouseId}`);

const noKeywordMapping = classifyHouse('hello there');
assert(noKeywordMapping.primaryHouseId === 1, 'No-keyword input falls back to House 1 (Identity)');
assert(noKeywordMapping.confidence < 0.05, `No-keyword confidence is very low (got ${noKeywordMapping.confidence.toFixed(4)})`);

section('Mass-weighted Classification');

const masses = { 4: 80, 2: 20 }; // User is heavily House 4 (Home)
const massedMapping = classifyHouse('tell me something interesting', masses);
assert(massedMapping.primaryHouseId === 4, `Mass prior shifts neutral input toward H4 (got H${massedMapping.primaryHouseId})`);

section('Torch Weight Computation');

const homeTorchState = computeRoutingTorchState(homeMapping, {});
assert(homeTorchState.dominant === 'heart', `House 4 → dominant Torch = heart (got ${homeTorchState.dominant})`);
assert(typeof homeTorchState.weights['heart'] === 'number', 'heart weight is a number');
const totalTorchWeight = Object.values(homeTorchState.weights).reduce((a, b) => a + b, 0);
assert(Math.abs(totalTorchWeight - 100) < 0.01, `Torch weights sum to 100 (got ${totalTorchWeight.toFixed(2)})`);
assert(homeTorchState.secondary !== homeTorchState.dominant, 'Secondary ≠ dominant Torch');

section('Ring Activation (13 Rings)');

const rings = activateRings(homeTorchState, 'I want to buy a house');
assert(rings.primary === 'venus', `Heart Torch → Venus Ring (got ${rings.primary})`);
assert(typeof rings.weights['saturn'] === 'number', 'Saturn has a weight');
assert(typeof rings.weights['chiron'] === 'number', 'Chiron (extended) has a weight');

const ringWeightTotal = Object.values(rings.weights).reduce((a, b) => a + b, 0);
assert(Math.abs(ringWeightTotal - 100) < 0.01, `Ring weights sum to 100 (got ${ringWeightTotal.toFixed(2)})`);
assert(Object.keys(rings.weights).length === 13, `All 13 rings have weights (got ${Object.keys(rings.weights).length})`);

const extRings = activateRings(homeTorchState, 'I need to transform and heal my wounds');
assert(extRings.extended.length > 0, `Healing keywords activate extended rings (got ${extRings.extended.join(', ') || 'none'})`);

const disruptRings = activateRings(homeTorchState, 'disrupt the system, radical innovation revolution');
const uranusSeen = disruptRings.extended.includes('uranus');
assert(uranusSeen, `Disruption keywords activate Uranus ring`);

section('Echo Blend (70/30)');

const echo = buildEchoBlend(rings);
assert(echo.leadWeight === 0.7, 'Lead weight = 0.70');
assert(echo.flavorWeight === 0.3, 'Flavor weight = 0.30');
assert(echo.leadEcho.id !== echo.flavorEcho.id || rings.primary === rings.secondary,
  'Lead ≠ Flavor echo (unless same ring)');
assert(echo.warmth >= 0 && echo.warmth <= 1, `Warmth in [0,1] range (got ${echo.warmth.toFixed(2)})`);
assert(echo.confidence >= 0 && echo.confidence <= 1, `Confidence in [0,1] range (got ${echo.confidence.toFixed(2)})`);

// Venus Ring → lead echo should be Taurus or Libra
assert(
  echo.leadEcho.id === 'taurus' || echo.leadEcho.id === 'libra',
  `Venus Ring lead echo = Taurus or Libra (got ${echo.leadEcho.id})`
);

section('Love Loop Alignment');

const equalTorches = { root: 14.3, sacral: 14.3, solarplexus: 14.3, heart: 14.3, throat: 14.3, thirdeye: 14.3, crown: 14.1 } as any;
const aligned = runLoveLoop(equalTorches, 'I want to buy a house in Charlotte');
assert(aligned.status === 'aligned', `Normal input → aligned (got ${aligned.status})`);

const lowHeart = { ...equalTorches, heart: 5 } as any;
const vetoed = runLoveLoop(lowHeart, 'help me plan');
assert(vetoed.status === 'veto', `Heart < 8% → veto (got ${vetoed.status})`);

const harmInput = runLoveLoop(equalTorches, 'how do i harm hurt kill attack destroy exploit manipulate deceive fraud scam abuse people violently stalk threaten');
assert(harmInput.status === 'veto' || harmInput.status === 'caution', `Harm keywords → veto or caution (got ${harmInput.status})`);

section('Memory Encoding');

assert(classifyMassEvent('I want to learn more about real estate') === 'QUERY_ONLY', 'Query → QUERY_ONLY');
assert(classifyMassEvent('I feel so anxious about buying a house') === 'EXPRESSED_EMOTION', 'Emotion → EXPRESSED_EMOTION');
assert(classifyMassEvent('I just signed the contract today') === 'DECISION_MADE', 'Decision → DECISION_MADE');
assert(classifyMassEvent('I just bought a house in Charlotte!') === 'LIFE_EVENT', 'Life event detected');
assert(computeMassContribution('just bought a house') === 5, 'Life event → mass 5');
assert(computeMassContribution('hello', false) === 1, 'Query → mass 1');
assert(computeMassContribution('hello', true) === 3, 'Repeated domain → mass 3');

const decayed = applyMassDecay(100, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
assert(decayed < 100 && decayed > 0, `Mass decays over 30 days (100 → ${decayed.toFixed(1)})`);

section('Full routeIntent Pipeline');

async function testFullPipeline() {
  const result = await routeIntent({
    rawInput: 'I want to start a company in the fintech space',
    userId: 'test-user-001',
    surfaceType: 'browser',
    sessionId: 'test-session-001',
  }, {});

  assert(result.sessionId === 'test-session-001', 'Session ID preserved');
  assert(result.houseMapping.primaryHouseId >= 1 && result.houseMapping.primaryHouseId <= 12, 'House in range 1–12');
  assert(typeof result.systemPrompt === 'string' && result.systemPrompt.length > 100, 'System prompt generated');
  assert(result.expressionMode.startsWith('H'), `Expression mode format OK (got ${result.expressionMode})`);
  assert(['aligned','caution','veto'].includes(result.alignmentStatus), `Valid alignment status (got ${result.alignmentStatus})`);
  assert(Object.keys(result.massUpdate).length >= 1, 'Mass update has entries');

  // Expression mode has correct 4-part format H#:TORCH:RING:ECHO
  const parts = result.expressionMode.split(':');
  assert(parts.length === 4, `Expression mode has 4 parts (got ${parts.length}): ${result.expressionMode}`);

  console.log('\n  Sample output for "start a company in fintech":');
  console.log(`    Expression Mode: ${result.expressionMode}`);
  console.log(`    House: ${result.houseMapping.primaryHouseId} (conf: ${result.confidenceScore.toFixed(2)})`);
  console.log(`    Torch: ${result.torchActivation.dominant} (${result.torchActivation.weights[result.torchActivation.dominant].toFixed(1)}%)`);
  console.log(`    Ring: ${result.ringActivation.primary}`);
  console.log(`    Lead Echo: ${result.echoBlend.leadEcho.name} — "${result.echoBlend.leadEcho.sample}"`);
  console.log(`    Alignment: ${result.alignmentStatus}`);

  // ─── Final results ─────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${passed} passed  |  ${failed} failed`);
  if (failed === 0) {
    console.log('  All Aum engine tests passed ✓');
  } else {
    console.error(`  ${failed} test(s) failed — see above`);
    process.exit(1);
  }
}

testFullPipeline().catch((err) => {
  console.error('Pipeline test threw:', err);
  process.exit(1);
});
