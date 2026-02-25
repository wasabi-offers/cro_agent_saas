-- RPC functions to safely increment user counters from Edge Function
-- (supabase-js v2 does not support inline SQL template literals)

CREATE OR REPLACE FUNCTION increment_user_pageviews(p_user_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE tracking_users
  SET total_pageviews = total_pageviews + 1,
      last_seen_at    = NOW(),
      updated_at      = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_user_events(p_user_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE tracking_users
  SET total_events = total_events + 1,
      updated_at   = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
