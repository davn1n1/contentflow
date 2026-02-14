-- =====================================================
-- NPS (Net Promoter Score) Responses
-- =====================================================

CREATE TABLE IF NOT EXISTS nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  page_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nps_responses_user ON nps_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_responses_created ON nps_responses(created_at DESC);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own responses
CREATE POLICY "nps_insert_own"
  ON nps_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own responses (to check last survey date)
CREATE POLICY "nps_select_own"
  ON nps_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Service role: full access (for admin dashboard/analytics)
CREATE POLICY "nps_service_role"
  ON nps_responses FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');
