// Aum Routing Engine — Layer 1: The 12 Houses
// Houses are the stable domain containers for all knowledge, memory, and intent classification.
// Repeated activity in a House increases its mass, biasing future Torch and Ring routing.

import type { House, HouseId, HouseMapping } from './types';

export const HOUSES: House[] = [
  {
    id: 1,
    name: 'Identity',
    domain: 'Identity & Presence',
    industries: 'Biometrics, Digital ID, Wearables, Branding, Personal Security',
    torchRoot: 'T-RO',
    triggerKeywords: [
      'body', 'persona', 'vitality', 'identity', 'self', 'brand',
      'who am i', 'presence', 'appearance', 'myself', 'image', 'name',
      'profile', 'authentic', 'character', 'face',
    ],
  },
  {
    id: 2,
    name: 'Values',
    domain: 'Values & Assets',
    industries: 'Banking, Crypto, Fintech, Personal Finance, Physical Goods',
    torchRoot: 'T-RO',
    triggerKeywords: [
      'money', 'skills', 'security', 'finance', 'crypto', 'assets',
      'wealth', 'invest', 'savings', 'income', 'budget', 'worth',
      'value', 'possession', 'resource', 'property', 'bitcoin', 'earn',
    ],
  },
  {
    id: 3,
    name: 'Communication',
    domain: 'Communication',
    industries: 'Telecom, Social Media, Messaging APIs, Short-form Content, Transit',
    torchRoot: 'T-SU',
    triggerKeywords: [
      'ideas', 'logic', 'messaging', 'social', 'content', 'media',
      'write', 'speak', 'communicate', 'message', 'post', 'email',
      'text', 'talk', 'express', 'share', 'broadcast', 'publish',
    ],
  },
  {
    id: 4,
    name: 'Home',
    domain: 'Home & Foundation',
    industries: 'Real Estate, Smart Home IoT, Interior Design, Ancestry, Agriculture',
    torchRoot: 'T-HR',
    triggerKeywords: [
      'family', 'emotions', 'roots', 'home', 'property', 'foundation',
      'house', 'apartment', 'real estate', 'domestic', 'land',
      'mother', 'ancestry', 'heritage', 'comfort', 'safe', 'neighborhood',
    ],
  },
  {
    id: 5,
    name: 'Creativity',
    domain: 'Creativity & Play',
    industries: 'Gaming, Entertainment, Arts, Romance Apps, Sports',
    torchRoot: 'T-SA',
    triggerKeywords: [
      'play', 'romance', 'risk', 'gaming', 'entertainment', 'arts',
      'create', 'fun', 'game', 'sport', 'date', 'joy', 'perform',
      'art', 'music', 'dance', 'movie', 'story', 'children', 'passion',
    ],
  },
  {
    id: 6,
    name: 'Health',
    domain: 'Health & Service',
    industries: 'HealthTech, Pharma, Fitness, Daily Operations, HR/Staffing',
    torchRoot: 'T-SU',
    triggerKeywords: [
      'work', 'service', 'routine', 'health', 'fitness', 'pharma',
      'wellness', 'exercise', 'diet', 'doctor', 'medicine', 'habit',
      'workflow', 'organize', 'daily', 'optimize', 'body', 'mental',
    ],
  },
  {
    id: 7,
    name: 'Partnerships',
    domain: 'Partnerships',
    industries: 'Legal Contracts, M&A, MarTech, B2B Relations, Marriage',
    torchRoot: 'T-HR',
    triggerKeywords: [
      'contracts', 'balance', 'trust', 'legal', 'partnership', 'business',
      'relationship', 'collaborate', 'agreement', 'marry', 'team',
      'deal', 'client', 'negotiate', 'joint', 'ally', 'spouse',
    ],
  },
  {
    id: 8,
    name: 'Transformation',
    domain: 'Transformation',
    industries: 'Insurance, Cybersecurity, Tax, Inheritance, Deep Psychology',
    torchRoot: 'T-SA',
    triggerKeywords: [
      'debt', 'power', 'secrets', 'insurance', 'tax', 'inheritance',
      'transform', 'deep', 'death', 'change', 'psychology', 'hidden',
      'crisis', 'rebirth', 'shadow', 'merge', 'taboo', 'intense',
    ],
  },
  {
    id: 9,
    name: 'Philosophy',
    domain: 'Philosophy & Travel',
    industries: 'Higher Ed, EdTech, Global Logistics, Tourism, Law, Religion',
    torchRoot: 'T-TA',
    triggerKeywords: [
      'travel', 'beliefs', 'wisdom', 'education', 'law', 'religion',
      'philosophy', 'learn', 'teach', 'explore', 'truth', 'meaning',
      'university', 'faith', 'culture', 'abroad', 'journey', 'purpose',
    ],
  },
  {
    id: 10,
    name: 'Legacy',
    domain: 'Legacy & Career',
    industries: 'Corporate Governance, Government, Executive Strategy, Reputation',
    torchRoot: 'T-TA',
    triggerKeywords: [
      'authority', 'legacy', 'goals', 'career', 'corporate', 'government',
      'reputation', 'ambition', 'leadership', 'strategy', 'success',
      'executive', 'achievement', 'mission', 'vision', 'scale', 'impact',
    ],
  },
  {
    id: 11,
    name: 'Community',
    domain: 'Community',
    industries: 'Non-profits, Crowdfunding, Collaborative SaaS, Web3, Humanitarian Aid',
    torchRoot: 'T-TY',
    triggerKeywords: [
      'groups', 'tech', 'innovation', 'community', 'nonprofit', 'web3',
      'network', 'humanitarian', 'collective', 'ai', 'future', 'society',
      'movement', 'open source', 'decentralized', 'crowd', 'social good',
    ],
  },
  {
    id: 12,
    name: 'Subconscious',
    domain: 'Subconscious',
    industries: 'Mental Health, SleepTech, Prison Reform, Spiritual Apps, Secret Data',
    torchRoot: 'T-CW',
    triggerKeywords: [
      'dreams', 'karma', 'solitude', 'mental health', 'sleep', 'unconscious',
      'spiritual', 'meditation', 'intuition', 'subconscious', 'psyche',
      'inner', 'retreat', 'silence', 'surrender', 'transcend', 'soul',
    ],
  },
];

export const HOUSE_MAP: Record<HouseId, House> = Object.fromEntries(
  HOUSES.map((h) => [h.id, h])
) as Record<HouseId, House>;

// ─── Classifier ───────────────────────────────────────────────────────────────

const MODULATOR_THRESHOLD = 0.15;

function scoreKeywordMatch(input: string, keywords: string[]): number {
  const lower = input.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) hits += 1;
  }
  return hits / keywords.length;
}

/**
 * Classify user intent into a primary House + optional modulator Houses.
 * House mass from prior interactions is applied as a personalization prior.
 *
 * @param rawInput - The raw user intent string
 * @param houseMasses - Accumulated mass per house (from Supabase ledger)
 */
export function classifyHouse(
  rawInput: string,
  houseMasses: Record<number, number> = {}
): HouseMapping {
  const scores: Record<number, number> = {};

  for (const house of HOUSES) {
    const kwScore = scoreKeywordMatch(rawInput, house.triggerKeywords);
    const mass = houseMasses[house.id] ?? 0;
    // Mass acts as a personalization prior — familiar domains score higher.
    // A base of 0.001 ensures mass can differentiate even when no keywords match.
    scores[house.id] = (kwScore + 0.001) * (1 + mass * 0.01);
  }

  const sorted = (Object.entries(scores) as [string, number][]).sort(
    ([, a], [, b]) => b - a
  );

  const primaryHouseId = Number(sorted[0][0]) as HouseId;
  const primaryScore = sorted[0][1];

  // No keyword match at all — default to House 1 (Identity) with low confidence
  if (primaryScore === 0) {
    return { primaryHouseId: 1, modulators: [], confidence: 0.1 };
  }

  const modulators = sorted
    .slice(1)
    .filter(([, s]) => s >= MODULATOR_THRESHOLD)
    .slice(0, 2)
    .map(([id, score]) => ({
      id: Number(id) as HouseId,
      weight: Math.min(0.3, score / (primaryScore + 0.001)),
    }));

  return {
    primaryHouseId,
    modulators,
    confidence: Math.min(1, primaryScore * 3),
  };
}
