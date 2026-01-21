-- Table for app settings and API keys
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy (allow all for now)
CREATE POLICY "Allow all access to app_settings" ON app_settings FOR ALL USING (true);

-- Insert default screenshot API keys (demo)
INSERT INTO app_settings (setting_key, setting_value)
VALUES
  ('screenshot_api_access_key', 'demo'),
  ('screenshot_api_secret_key', 'demo')
ON CONFLICT (setting_key) DO NOTHING;
