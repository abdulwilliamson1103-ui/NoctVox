-- ============================================================
-- Aum Routing Engine — Supabase Schema
-- Migration: 001_aum_schema.sql
-- Tables: aum_identities, aum_house_mass, aum_memories, aum_sessions
-- ============================================================

-- ── Core identity record ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS aum_identities (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         REFERENCES auth.users ON DELETE CASCADE,
  surface_type      TEXT         NOT NULL DEFAULT 'browser',
  fractal_checksum  TEXT,
  alignment_score   NUMERIC      DEFAULT 1.0,
  created_at        TIMESTAMPTZ  DEFAULT now(),
  updated_at        TIMESTAMPTZ  DEFAULT now()
);

-- ── House mass ledger (long-term personality accumulator) ────
-- Each row = one house's total accumulated interaction mass for a user.
-- Mass drives Torch weight → Ring activation → Echo selection.
CREATE TABLE IF NOT EXISTS aum_house_mass (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         REFERENCES auth.users ON DELETE CASCADE,
  house_id       INTEGER      NOT NULL CHECK (house_id BETWEEN 1 AND 12),
  total_mass     NUMERIC      DEFAULT 0,
  recent_mass    NUMERIC      DEFAULT 0,   -- last 30 days only
  last_activity  TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (user_id, house_id)
);

-- ── Episodic memory (semantic summaries — NOT raw transcripts) ──
-- Stored per house, torch-signed, with mass contribution weight.
CREATE TABLE IF NOT EXISTS aum_memories (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         REFERENCES auth.users ON DELETE CASCADE,
  house_id            INTEGER      CHECK (house_id BETWEEN 1 AND 12),
  emotional_signature TEXT,                              -- TorchId at encoding time
  content             TEXT         NOT NULL,             -- Semantic summary (≤280 chars)
  mass_contribution   NUMERIC      DEFAULT 1,
  pattern_tags        TEXT[]       DEFAULT '{}',
  surface_type        TEXT         DEFAULT 'browser',
  created_at          TIMESTAMPTZ  DEFAULT now()
);

-- ── Session routing log (every routeIntent() call persisted) ─
CREATE TABLE IF NOT EXISTS aum_sessions (
  id               UUID         PRIMARY KEY,             -- Passed from app (sessionId)
  user_id          UUID         REFERENCES auth.users ON DELETE CASCADE,
  primary_house    INTEGER,                              -- 1–12
  dominant_torch   TEXT,                                 -- TorchId
  active_ring      TEXT,                                 -- RingId (primary)
  secondary_ring   TEXT,                                 -- RingId (secondary)
  extended_rings   TEXT[]       DEFAULT '{}',            -- ExtendedRingId[]
  echo_blend       JSONB,                                -- { lead_echo, flavor_echo, warmth, confidence }
  expression_mode  TEXT,                                 -- e.g. "H4:HEART:VENUS:TAURUS"
  alignment_status TEXT         DEFAULT 'aligned',       -- aligned | caution | veto
  confidence_score NUMERIC,
  torch_weights    JSONB,                                -- Record<TorchId, number>
  ring_weights     JSONB,                                -- Record<RingId, number>
  house_confidence NUMERIC,
  surface_type     TEXT         DEFAULT 'browser',
  created_at       TIMESTAMPTZ  DEFAULT now()
);

-- ── Mass accumulation helper function (upsert-safe) ──────────
-- Called by updateHouseMasses() to atomically increment mass.
CREATE OR REPLACE FUNCTION increment_house_mass(
  p_user_id      UUID,
  p_house_id     INTEGER,
  p_contribution NUMERIC,
  p_timestamp    TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO aum_house_mass (user_id, house_id, total_mass, recent_mass, last_activity)
    VALUES (p_user_id, p_house_id, p_contribution, p_contribution, p_timestamp)
  ON CONFLICT (user_id, house_id) DO UPDATE
    SET total_mass    = aum_house_mass.total_mass    + EXCLUDED.total_mass,
        recent_mass   = aum_house_mass.recent_mass   + EXCLUDED.recent_mass,
        last_activity = EXCLUDED.last_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Auto-update updated_at on aum_identities ─────────────────
CREATE OR REPLACE FUNCTION update_identity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_identity_updated_at ON aum_identities;
CREATE TRIGGER trg_identity_updated_at
  BEFORE UPDATE ON aum_identities
  FOR EACH ROW EXECUTE FUNCTION update_identity_timestamp();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE aum_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE aum_house_mass ENABLE ROW LEVEL SECURITY;
ALTER TABLE aum_memories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE aum_sessions   ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY user_owns_identity  ON aum_identities USING (user_id = auth.uid());
CREATE POLICY user_owns_mass      ON aum_house_mass USING (user_id = auth.uid());
CREATE POLICY user_owns_memories  ON aum_memories   USING (user_id = auth.uid());
CREATE POLICY user_owns_sessions  ON aum_sessions   USING (user_id = auth.uid());

-- Service role bypasses RLS (used by server-side API routes)
-- Granted automatically via service key — no explicit grant needed.

-- ── Performance Indexes ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user_time
  ON aum_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_user_house
  ON aum_memories (user_id, house_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_mass_desc
  ON aum_memories (user_id, mass_contribution DESC);

CREATE INDEX IF NOT EXISTS idx_house_mass_user
  ON aum_house_mass (user_id);
