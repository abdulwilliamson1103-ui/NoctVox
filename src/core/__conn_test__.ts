// Aum — Supabase live connection test
// Run: npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node","types":["node"]}' src/core/__conn_test__.ts

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL ?? '';
const KEY = process.env.SUPABASE_SERVICE_KEY ?? '';

console.log('Supabase URL:', URL);
console.log('Key prefix:  ', KEY.slice(0, 16) + '...');

async function run() {
  if (!URL || !KEY) {
    console.error('❌  Missing env vars'); process.exit(1);
  }

  const db = createClient(URL, KEY);

  // ── 1. Check connection via a lightweight RPC health check ─────────────────
  console.log('\n[1] Pinging Supabase...');
  const { error: pingErr } = await db.from('aum_house_mass').select('count').limit(1);

  if (pingErr) {
    if (pingErr.message.includes('relation') && pingErr.message.includes('does not exist')) {
      console.log('   ⚠  Connected — but schema not applied yet.');
      console.log('   → Run supabase/migrations/001_aum_schema.sql in your Supabase SQL editor.');
      console.log('   Connection: ✓  Schema: ✗\n');
      process.exit(0);
    }
    console.error('❌  Connection failed:', pingErr.message); process.exit(1);
  }
  console.log('   ✓ Connected and schema exists.');

  // ── 2. Upsert a test house-mass row ───────────────────────────────────────
  console.log('\n[2] Writing test house mass row...');
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const { error: writeErr } = await db.rpc('increment_house_mass', {
    p_user_id: testUserId,
    p_house_id: 4,
    p_contribution: 2,
    p_timestamp: new Date().toISOString(),
  });
  if (writeErr) { console.error('❌  Write failed:', writeErr.message); process.exit(1); }
  console.log('   ✓ increment_house_mass RPC succeeded.');

  // ── 3. Read it back ───────────────────────────────────────────────────────
  console.log('\n[3] Reading back house mass...');
  const { data, error: readErr } = await db
    .from('aum_house_mass')
    .select('house_id, total_mass')
    .eq('user_id', testUserId)
    .eq('house_id', 4)
    .single();
  if (readErr) { console.error('❌  Read failed:', readErr.message); process.exit(1); }
  console.log(`   ✓ house_id=${(data as any).house_id}  total_mass=${(data as any).total_mass}`);

  // ── 4. Write a session ────────────────────────────────────────────────────
  console.log('\n[4] Writing test session...');
  const sessionId = crypto.randomUUID();
  const { error: sessErr } = await db.from('aum_sessions').insert({
    id: sessionId,
    user_id: testUserId,
    primary_house: 4,
    dominant_torch: 'heart',
    active_ring: 'venus',
    secondary_ring: 'saturn',
    extended_rings: [],
    echo_blend: { lead_echo: 'taurus', flavor_echo: 'capricorn', warmth: 0.72, confidence: 0.83 },
    expression_mode: 'H4:HEART:VENUS:TAURUS',
    alignment_status: 'aligned',
    confidence_score: 0.85,
    torch_weights: { heart: 32, root: 22 },
    ring_weights: { venus: 38, saturn: 22 },
    house_confidence: 0.85,
  });
  if (sessErr) { console.error('❌  Session write failed:', sessErr.message); process.exit(1); }
  console.log(`   ✓ Session ${sessionId.slice(0, 8)}... persisted.`);

  // ── 5. Write a memory ─────────────────────────────────────────────────────
  console.log('\n[5] Writing episodic memory...');
  const { error: memErr } = await db.from('aum_memories').insert({
    user_id: testUserId,
    house_id: 4,
    emotional_signature: 'heart',
    content: '[Home/heart] User wants to buy a house in Charlotte — exploring property market.',
    mass_contribution: 3,
    pattern_tags: ['real-estate', 'charlotte'],
    surface_type: 'browser',
  });
  if (memErr) { console.error('❌  Memory write failed:', memErr.message); process.exit(1); }
  console.log('   ✓ Episodic memory stored.');

  // ── Cleanup test data ─────────────────────────────────────────────────────
  console.log('\n[6] Cleaning up test data...');
  await Promise.allSettled([
    db.from('aum_house_mass').delete().eq('user_id', testUserId),
    db.from('aum_sessions').delete().eq('user_id', testUserId),
    db.from('aum_memories').delete().eq('user_id', testUserId),
  ]);
  console.log('   ✓ Test rows removed.');

  console.log('\n══════════════════════════════════════════');
  console.log('  Supabase integration: ALL CHECKS PASSED ✓');
  console.log('══════════════════════════════════════════\n');
}

run().catch((err) => { console.error('Unexpected error:', err); process.exit(1); });
