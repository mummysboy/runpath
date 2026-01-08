-- Verify the RLS fix was applied
-- Run this to check if the policy was fixed

-- Check if the policy exists and what it looks like
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users_profile'
AND policyname = 'Users can view profiles in own org';

-- Test if you can query your own profile
-- Replace YOUR_USER_ID with your actual user ID
SELECT 
  user_id,
  full_name,
  org_id,
  created_at
FROM users_profile
WHERE user_id = 'YOUR_USER_ID';

-- If the above query returns nothing, try this to see all profiles (should work with admin)
-- This helps verify the table has data
SELECT COUNT(*) as total_profiles FROM users_profile;

-- Check if RLS is enabled on the table
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users_profile';

