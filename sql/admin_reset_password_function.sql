-- Function to allow admins to reset user passwords
-- This creates a temporary password that user must change on next login

CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temp_password TEXT NOT NULL,
  reset_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can insert/update
CREATE POLICY "Admins can manage password resets"
ON password_resets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Function to set temporary password
CREATE OR REPLACE FUNCTION set_temp_password(
  target_user_id UUID,
  new_temp_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
  target_email TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO admin_role
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can reset passwords';
  END IF;
  
  -- Get user email
  SELECT email INTO target_email
  FROM user_profiles
  WHERE id = target_user_id;
  
  -- Insert or update temp password
  INSERT INTO password_resets (user_id, temp_password, reset_by)
  VALUES (target_user_id, new_temp_password, auth.uid())
  ON CONFLICT (user_id)
  DO UPDATE SET
    temp_password = new_temp_password,
    reset_by = auth.uid(),
    created_at = NOW(),
    used = FALSE;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Temporary password set',
    'email', target_email,
    'temp_password', new_temp_password
  );
END;
$$;
