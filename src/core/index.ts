// Aum Routing Engine — Public API
// Import everything you need from '@/src/core'
//
// Persistence: Upstash Redis (HTTP REST — no host restrictions, works anywhere)

export * from './types';
export * from './houses';
export * from './torches';
export * from './rings';
export * from './echoes';
export * from './router';
export * from './alignment';
export * from './memory';
export * from './surfaces';

// Persistence — Upstash Redis
export {
  loadHouseMasses,
  persistRoutingSession,
  updateHouseMasses,
  storeEpisodicMemory,
  retrieveRelevantMemories,
  getRecentSessions,
} from './upstash';
