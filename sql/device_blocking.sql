-- =====================================================
-- Device-Level Blocking Enhancement
-- =====================================================
-- Prevents specific devices/IPs from logging in again

-- Add device blocking columns
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS device_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_blocked ON user_sessions(user_id, ip_address, device_blocked);

-- Function to terminate and block device
CREATE OR REPLACE FUNCTION terminate_and_block_device(
  p_session_id UUID,
  p_terminated_by UUID,
  p_reason TEXT DEFAULT 'Device access terminated by administrator'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_ip_address TEXT;
  v_user_agent TEXT;
BEGIN
  -- Get session details
  SELECT user_id, ip_address, user_agent 
  INTO v_user_id, v_ip_address, v_user_agent
  FROM user_sessions
  WHERE id = p_session_id;
  
  -- Terminate current session
  UPDATE user_sessions
  SET 
    is_active = false,
    terminated_at = NOW(),
    terminated_by = p_terminated_by,
    device_blocked = true,
    block_reason = p_reason
  WHERE id = p_session_id;
  
  -- Block all sessions from same device (IP + User Agent)
  UPDATE user_sessions
  SET 
    device_blocked = true,
    block_reason = p_reason
  WHERE user_id = v_user_id 
    AND ip_address = v_ip_address 
    AND user_agent = v_user_agent
    AND id != p_session_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unblock device
CREATE OR REPLACE FUNCTION unblock_device(
  p_user_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions
  SET 
    device_blocked = false,
    block_reason = NULL
  WHERE user_id = p_user_id 
    AND ip_address = p_ip_address 
    AND user_agent = p_user_agent;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device is blocked
CREATE OR REPLACE FUNCTION is_device_blocked(
  p_user_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS TABLE(blocked BOOLEAN, reason TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT device_blocked, block_reason
  FROM user_sessions
  WHERE user_id = p_user_id 
    AND ip_address = p_ip_address 
    AND user_agent = p_user_agent
    AND device_blocked = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN user_sessions.device_blocked IS 'Whether this specific device is blocked from logging in';
COMMENT ON COLUMN user_sessions.block_reason IS 'Reason for blocking this device';
