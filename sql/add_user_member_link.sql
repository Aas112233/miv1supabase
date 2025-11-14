-- =====================================================
-- Add User-Member Link Enhancement
-- =====================================================
-- This migration ensures the user_id column exists in members table
-- and adds necessary constraints and indexes

-- Add user_id column to members table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE members ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add unique constraint to ensure one member per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'members_user_id_unique'
  ) THEN
    ALTER TABLE members ADD CONSTRAINT members_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- Add comment for documentation
COMMENT ON COLUMN members.user_id IS 'Links a member record to a user account for access control';
