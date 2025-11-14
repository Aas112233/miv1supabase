-- Add new user roles: manager and accountant
-- This migration adds support for additional user roles beyond member and admin

-- Update the user_profiles table to support new roles
-- Note: If you have a CHECK constraint on the role column, you may need to drop and recreate it

-- Drop existing check constraint if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add new check constraint with all roles
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('member', 'manager', 'accountant', 'admin'));

-- Add comment to document the roles
COMMENT ON COLUMN user_profiles.role IS 'User role: member (basic access), manager (operational management), accountant (financial management), admin (full access)';

-- Optional: Update existing users if needed
-- UPDATE user_profiles SET role = 'manager' WHERE email = 'manager@example.com';
-- UPDATE user_profiles SET role = 'accountant' WHERE email = 'accountant@example.com';
