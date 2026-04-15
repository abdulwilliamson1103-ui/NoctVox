// Upstash Redis live connection test
// Run: npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true,"skipLibCheck":true,"types":["node"]}' src/core/__upstash_test__.ts

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { Redis } from '@upstash/redis';

const URL   = process.env.UPSTASH_REDIS_REST_URL   ?? '';
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

console.log('REST URL prefix:', URL.slice(0, 30) + '...');
console.log('Token prefix:   ', TOKEN.slice(0, 16) + '...');

async function run() {
  if (!URL || !TOKEN) { console.error('❌  Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN'); process.exit(1); }

  const redis = new Redis({ url: URL, token: TOKEN });

  console.log('\n[1] Ping...');
  const pong = await redis.ping();
  console.log('   ✓', pong);

  console.log('\n[2] Write house mass...');
  await redis.hset('aum:mass:test-user', { '4': 10, '10': 5 });
  console.log('   ✓ Written');

  console.log('\n[3] Read house mass...');
  const masses = await redis.hgetall('aum:mass:test-user');
  console.log('   ✓ Masses:', masses);

  console.log('\n[4] Write session...');
  await redis.lpush('aum:sessions:test-user', JSON.stringify({ id: 'test-001', expression_mode: 'H4:HEART:VENUS:TAURUS' }));
  console.log('   ✓ Written');

  console.log('\n[5] Write memory...');
  await redis.zadd('aum:mem:test-user:4', { score: 3, member: JSON.stringify({ content: 'User wants to buy a house', emotionalSignature: 'heart', massContribution: 3 }) });
  console.log('   ✓ Written');

  console.log('\n[6] Cleanup...');
  await redis.del('aum:mass:test-user', 'aum:sessions:test-user', 'aum:mem:test-user:4');
  console.log('   ✓ Cleaned');

  console.log('\n══════════════════════════════════════════');
  console.log('  Upstash Redis: ALL CHECKS PASSED ✓');
  console.log('══════════════════════════════════════════\n');
}

run().catch(err => { console.error('❌  Error:', err.message); process.exit(1); });
