-- =====================================================
-- User Access Control Enhancement
-- =====================================================
-- Adds ability to block/unblock user access

-- Add access_blocked column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS access_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_access_blocked ON user_profiles(access_blocked);

-- Function to block user access
CREATE OR REPLACE FUNCTION block_user_access(
  p_user_id UUID,
  p_blocked_by UUID,
  p_reason TEXT DEFAULT 'Access terminated by administrator'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Block user
  UPDATE user_profiles
  SET 
    access_blocked = true,
    blocked_at = NOW(),
    blocked_by = p_blocked_by,
    block_reason = p_reason
  WHERE id = p_user_id;
  
  -- Terminate all active sessions
  UPDATE user_sessions
  SET 
    is_active = false,
    terminated_at = NOW(),
    terminated_by = p_blocked_by
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unblock user access
CREATE OR REPLACE FUNCTION unblock_user_access(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET 
    access_blocked = false,
    blocked_at = NULL,
    blocked_by = NULL,
    block_reason = NULL
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user access is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  SELECT access_blocked INTO v_blocked
  FROM user_profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_blocked, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN user_profiles.access_blocked IS 'Whether user access is blocked by admin';
COMMENT ON COLUMN user_profiles.blocked_at IS 'Timestamp when user was blocked';
COMMENT ON COLUMN user_profiles.blocked_by IS 'Admin who blocked the user';
COMMENT ON COLUMN user_profiles.block_reason IS 'Reason for blocking user access';
