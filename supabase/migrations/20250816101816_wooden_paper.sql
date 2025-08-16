/*
  Script to set up initial teacher account
  
  Instructions:
  1. First create a user via Supabase Auth (email/password)
  2. Get the user ID from the auth.users table
  3. Run this script with the actual user ID
  
  Example usage:
  Replace 'USER_ID_HERE' with the actual UUID from auth.users
*/

-- Update user role to teacher
UPDATE profiles 
SET role = 'teacher', updated_at = now()
WHERE id = 'USER_ID_HERE'; -- Replace with actual user ID

-- Verify the update
SELECT id, full_name, role, created_at 
FROM profiles 
WHERE id = 'USER_ID_HERE';

-- Grant access to all levels for testing (optional)
INSERT INTO level_access (user_id, level_id, granted_by, reason)
SELECT 'USER_ID_HERE', id, 'USER_ID_HERE', 'teacher_setup'
FROM levels
ON CONFLICT (user_id, level_id) DO NOTHING;