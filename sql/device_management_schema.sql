-- =====================================================
-- Device Management Schema
-- =====================================================
-- Tracks user login sessions and devices for security

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  user_agent TEXT,
  location_city TEXT,
  location_country TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  terminated_at TIMESTAMPTZ,
  terminated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all sessions" ON user_sessions;
CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sessions" ON user_sessions;
CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can terminate any session" ON user_sessions;
CREATE POLICY "Admins can terminate any session"
  ON user_sessions FOR UPDATE
  USING (is_admin_user(auth.uid()));

-- Function to parse user agent
CREATE OR REPLACE FUNCTION parse_user_agent(ua TEXT)
RETURNS TABLE(browser TEXT, os TEXT, device_type TEXT) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE
      WHEN ua ILIKE '%Chrome%' AND ua NOT ILIKE '%Edge%' THEN 'Chrome'
      WHEN ua ILIKE '%Firefox%' THEN 'Firefox'
      WHEN ua ILIKE '%Safari%' AND ua NOT ILIKE '%Chrome%' THEN 'Safari'
      WHEN ua ILIKE '%Edge%' THEN 'Edge'
      WHEN ua ILIKE '%Opera%' THEN 'Opera'
      ELSE 'Unknown'
    END AS browser,
    CASE
      WHEN ua ILIKE '%Windows%' THEN 'Windows'
      WHEN ua ILIKE '%Mac OS%' THEN 'macOS'
      WHEN ua ILIKE '%Linux%' THEN 'Linux'
      WHEN ua ILIKE '%Android%' THEN 'Android'
      WHEN ua ILIKE '%iOS%' OR ua ILIKE '%iPhone%' OR ua ILIKE '%iPad%' THEN 'iOS'
      ELSE 'Unknown'
    END AS os,
    CASE
      WHEN ua ILIKE '%Mobile%' OR ua ILIKE '%Android%' OR ua ILIKE '%iPhone%' THEN 'Mobile'
      WHEN ua ILIKE '%Tablet%' OR ua ILIKE '%iPad%' THEN 'Tablet'
      ELSE 'Desktop'
    END AS device_type;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_parsed RECORD;
BEGIN
  -- Parse user agent
  SELECT * INTO v_parsed FROM parse_user_agent(p_user_agent);
  
  -- Insert session
  INSERT INTO user_sessions (
    user_id,
    ip_address,
    user_agent,
    browser,
    os,
    device_type,
    device_name
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent,
    v_parsed.browser,
    v_parsed.os,
    v_parsed.device_type,
    v_parsed.browser || ' on ' || v_parsed.os
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to terminate session
CREATE OR REPLACE FUNCTION terminate_user_session(
  p_session_id UUID,
  p_terminated_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions
  SET 
    is_active = false,
    terminated_at = NOW(),
    terminated_by = p_terminated_by
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for active sessions
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT 
  s.id,
  s.user_id,
  u.email,
  u.name,
  s.device_name,
  s.device_type,
  s.browser,
  s.os,
  s.ip_address,
  s.location_city,
  s.location_country,
  s.last_activity,
  s.created_at,
  EXTRACT(EPOCH FROM (NOW() - s.last_activity)) / 60 AS minutes_since_activity
FROM user_sessions s
JOIN user_profiles u ON s.user_id = u.id
WHERE s.is_active = true
ORDER BY s.last_activity DESC;

COMMENT ON TABLE user_sessions IS 'Tracks user login sessions and devices for security monitoring';
