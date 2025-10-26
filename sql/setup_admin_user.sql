-- Setup admin user
-- First, you need to get the user ID from auth.users table for the admin email
-- Then insert or update the user_profiles table

-- Example query to find user ID (replace 'mhassantoha@gmail.com' with actual admin email):
-- SELECT id FROM auth.users WHERE email = 'mhassantoha@gmail.com';

-- Once you have the user ID, insert or update the user_profiles table:
-- INSERT INTO user_profiles (id, email, name, role)
-- VALUES ('USER_ID_HERE', 'mhassantoha@gmail.com', 'Admin User', 'admin')
-- ON CONFLICT (id) 
-- DO UPDATE SET role = 'admin', email = 'mhassantoha@gmail.com', name = 'Admin User';

-- Alternative approach - make all users with specific emails as admin:
-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE email IN ('mhassantoha@gmail.com', 'admin@munshiinvestment.com');