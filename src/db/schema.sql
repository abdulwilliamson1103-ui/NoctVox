-- ============================================================
-- AUM ROUTING ENGINE — SUPABASE SCHEMA
-- src/db/schema.sql
--
-- Paste this entire file into your Supabase SQL Editor and run it.
-- Dashboard → SQL Editor → New Query → Paste → Run
--
-- Tables:
--   aum_identities   — Core identity record per user+surface
--   aum_house_mass   — Long-term personality accumulator (Tier 3 memory)
--   aum_memories     — Episodic semantic memories (Tier 2 memory)
--   aum_sessions     — Full routing log per request
--
-- Functions:
--   increment_house_mass()     — Atomic upsert + increment (used by updateHouseMasses)
--   update_identity_timestamp() — Auto-updates updated_at on identity records
--
-- Security:
--   RLS enabled on all tables.
--   User-owns-data policies: users can only read/write their own rows.
--   Service role key bypasses RLS automatically (used by server-side routes).
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
-- pgcrypto is needed for gen_random_uuid() on older Postgres versions.
-- On Supabase (Postgres 15+) this is available by default.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Table: aum_identities ─────────────────────────────────────
-- One row per user per surface. Tracks fractal checksum and alignment score
-- so Aum can detect identity drift and self-correct.
CREATE TABLE IF NOT EXISTS aum_identities (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  surface_type      TEXT         NOT NULL DEFAULT 'browser'
                                 CHECK (surface_type IN ('browser','device','car','toy','robot','api')),
  fractal_checksum  TEXT,
  alignment_score   NUMERIC(4,3) NOT NULL DEFAULT 1.0
                                 CHECK (alignment_score BETWEEN 0 AND 1),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, surface_type)
);

-- ── Table: aum_house_mass ─────────────────────────────────────
-- The long-term personality accumulator. One row per user per house (1–12).
-- total_mass grows with every interaction. recent_mass reflects last 30 days.
-- This is the data that drives Torch weighting and Echo personalization.
CREATE TABLE IF NOT EXISTS aum_house_mass (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  house_id       INTEGER      NOT NULL CHECK (house_id BETWEEN 1 AND 12),
  total_mass     NUMERIC      NOT NULL DEFAULT 0 CHECK (total_mass >= 0),
  recent_mass    NUMERIC      NOT NULL DEFAULT 0 CHECK (recent_mass >= 0),
  last_activity  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, house_id)
);

-- ── Table: aum_memories ───────────────────────────────────────
-- Episodic memory store. Content is a semantic summary (max ~280 chars),
-- NOT raw user input or transcript. Each row contributes mass_contribution
-- points to its house. High-mass memories surface first in context retrieval.
CREATE TABLE IF NOT EXISTS aum_memories (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  house_id            INTEGER      NOT NULL CHECK (house_id BETWEEN 1 AND 12),
  emotional_signature TEXT         NOT NULL
                                   CHECK (emotional_signature IN
                                     ('root','sacral','solarplexus','heart','throat','thirdeye','crown')),
  content             TEXT         NOT NULL CHECK (char_length(content) BETWEEN 1 AND 280),
  mass_contribution   NUMERIC      NOT NULL DEFAULT 1 CHECK (mass_contribution BETWEEN 1 AND 5),
  pattern_tags        TEXT[]       NOT NULL DEFAULT '{}',
  surface_type        TEXT         NOT NULL DEFAULT 'browser',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Table: aum_sessions ───────────────────────────────────────
-- Full routing log. One row per routeIntent() call. Used for analytics,
-- alignment auditing, and the Internal Mirror drift detection system.
CREATE TABLE IF NOT EXISTS aum_sessions (
  id               UUID         PRIMARY KEY,  -- Passed from app (sessionId = crypto.randomUUID())
  user_id          UUID         NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  primary_house    INTEGER      CHECK (primary_house BETWEEN 1 AND 12),
  dominant_torch   TEXT         CHECK (dominant_torch IN
                                  ('root','sacral','solarplexus','heart','throat','thirdeye','crown')),
  active_ring      TEXT,                        -- RingId (primary)
  secondary_ring   TEXT,                        -- RingId (secondary)
  extended_rings   TEXT[]       NOT NULL DEFAULT '{}',  -- ExtendedRingId[]
  echo_blend       JSONB,                       -- { lead_echo, flavor_echo, warmth, confidence }
  expression_mode  TEXT,                        -- e.g. "H4:HEART:VENUS:TAURUS"
  alignment_status TEXT         NOT NULL DEFAULT 'aligned'
                                CHECK (alignment_status IN ('aligned','caution','veto')),
  confidence_score NUMERIC(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  torch_weights    JSONB,                       -- Record<TorchId, number>
  ring_weights     JSONB,                       -- Record<RingId, number>
  house_confidence NUMERIC(5,4) CHECK (house_confidence BETWEEN 0 AND 1),
  surface_type     TEXT         NOT NULL DEFAULT 'browser',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Function: increment_house_mass ───────────────────────────
-- Atomically upserts a house_mass row and increments both total_mass
-- and recent_mass. Called by updateHouseMasses() in supabase.ts.
-- SECURITY DEFINER means it runs as the DB owner (bypasses RLS safely
-- for this specific write, since the app already validates userId).
CREATE OR REPLACE FUNCTION increment_house_mass(
  p_user_id      UUID,
  p_house_id     INTEGER,
  p_contribution NUMERIC,
  p_timestamp    TIMESTAMPTZ
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO aum_house_mass (user_id, house_id, total_mass, recent_mass, last_activity)
    VALUES (p_user_id, p_house_id, p_contribution, p_contribution, p_timestamp)
  ON CONFLICT (user_id, house_id) DO UPDATE
    SET total_mass    = aum_house_mass.total_mass    + EXCLUDED.total_mass,
        recent_mass   = aum_house_mass.recent_mass   + EXCLUDED.recent_mass,
        last_activity = EXCLUDED.last_activity;
END;
$$;

-- ── Function: update_identity_timestamp ──────────────────────
-- Keeps updated_at current on aum_identities without app-level logic.
CREATE OR REPLACE FUNCTION update_identity_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_identity_updated_at ON aum_identities;
CREATE TRIGGER trg_identity_updated_at
  BEFORE UPDATE ON aum_identities
  FOR EACH ROW EXECUTE FUNCTION update_identity_timestamp();

-- ── Row Level Security ────────────────────────────────────────
-- Enabled on all tables. Each user can only access their own rows.
-- The server-side service role key bypasses RLS automatically.
ALTER TABLE aum_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE aum_house_mass ENABLE ROW LEVEL SECURITY;
ALTER TABLE aum_memories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE aum_sessions   ENABLE ROW LEVEL SECURITY;

-- Drop policies if they already exist (safe to re-run this script)
DROP POLICY IF EXISTS user_owns_identity  ON aum_identities;
DROP POLICY IF EXISTS user_owns_mass      ON aum_house_mass;
DROP POLICY IF EXISTS user_owns_memories  ON aum_memories;
DROP POLICY IF EXISTS user_owns_sessions  ON aum_sessions;

CREATE POLICY user_owns_identity  ON aum_identities USING (user_id = auth.uid());
CREATE POLICY user_owns_mass      ON aum_house_mass USING (user_id = auth.uid());
CREATE POLICY user_owns_memories  ON aum_memories   USING (user_id = auth.uid());
CREATE POLICY user_owns_sessions  ON aum_sessions   USING (user_id = auth.uid());

-- ── Indexes ───────────────────────────────────────────────────
-- Optimized for the most common read patterns in supabase.ts:
--   loadHouseMasses()         → idx_house_mass_user
--   retrieveRelevantMemories() → idx_memories_user_house, idx_memories_mass_desc
--   getRecentSessions()       → idx_sessions_user_time

CREATE INDEX IF NOT EXISTS idx_house_mass_user
  ON aum_house_mass (user_id);

CREATE INDEX IF NOT EXISTS idx_memories_user_house
  ON aum_memories (user_id, house_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_mass_desc
  ON aum_memories (user_id, mass_contribution DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_time
  ON aum_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_expression_mode
  ON aum_sessions (expression_mode);

-- ── Verification query (run after applying schema) ────────────
-- Uncomment and run to confirm all tables exist:
--
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('aum_identities','aum_house_mass','aum_memories','aum_sessions')
-- ORDER BY table_name;
