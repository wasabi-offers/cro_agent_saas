-- CRO Product Usage Tracking
-- Tracks what users do inside the CRO app: analyses, landings, chat, funnels, etc.

CREATE TABLE IF NOT EXISTS cro_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  user_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cro_usage_events_type ON cro_usage_events (event_type);
CREATE INDEX IF NOT EXISTS idx_cro_usage_events_created_at ON cro_usage_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cro_usage_events_user_id ON cro_usage_events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cro_usage_events_session_id ON cro_usage_events (session_id) WHERE session_id IS NOT NULL;

-- Optional: RLS (allow insert from anon for client-side tracking; restrict read to service role)
ALTER TABLE cro_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for anonymous" ON cro_usage_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read with service role" ON cro_usage_events
  FOR SELECT USING (auth.role() = 'service_role');

COMMENT ON TABLE cro_usage_events IS 'Product usage: landing analyses, chat, CRO analyses, funnels, saves, etc.';
