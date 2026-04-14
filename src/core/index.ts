// Aum Routing Engine — Public API
// Import everything you need from '@/src/core'
//
// ⚠️  Supabase exports are explicitly named below (not `export * from './supabase'`).
//
// Why: supabase.ts uses SUPABASE_SERVICE_KEY, a privileged key that bypasses RLS.
// Using `export *` would make it trivially easy for a future developer to re-export
// the service client into a browser bundle without realising the security risk.
// Explicit named exports force the import to be deliberate and reviewable.
// For browser-side Supabase access, create a separate anon-key client instead.

export * from './types';
export * from './houses';
export * from './torches';
export * from './rings';
export * from './echoes';
export * from './router';
export * from './alignment';
export * from './memory';
export * from './surfaces';

// Supabase — named exports only (see note above)
export {
  supabase,
  loadHouseMasses,
  persistRoutingSession,
  updateHouseMasses,
  storeEpisodicMemory,
  retrieveRelevantMemories,
  getRecentSessions,
} from './supabase';
