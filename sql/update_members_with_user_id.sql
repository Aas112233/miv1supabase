-- Add user_id column to members table to link members with user profiles
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add a comment to describe the new column
COMMENT ON COLUMN members.user_id IS 'Reference to the auth.users table for linking members with user accounts';