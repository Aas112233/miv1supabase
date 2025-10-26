-- Add last_login column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login);

-- Add comment
COMMENT ON COLUMN user_profiles.last_login IS 'Timestamp of the user''s last login';
