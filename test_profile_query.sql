-- Test query to debug profile access
-- Run this in Supabase SQL Editor while logged in as your user
-- This will help us see if RLS is blocking the query

-- First, check what auth.uid() returns (should be your user ID)
SELECT auth.uid() as current_user_id;

-- Then check if your profile is visible
SELECT 
  up.user_id,
  up.full_name,
  up.org_id,
  o.name as org_name
FROM users_profile up
LEFT JOIN organizations o ON up.org_id = o.id
WHERE up.user_id = auth.uid();

-- Check RLS policies on users_profile
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
WHERE tablename = 'users_profile';

-- Test if the current_org_id() function works
SELECT current_org_id();

-- Verify your user's org_id matches the profile's org_id
SELECT 
  up.user_id,
  up.org_id as profile_org_id,
  (SELECT org_id FROM users_profile WHERE user_id = auth.uid()) as expected_org_id,
  CASE 
    WHEN up.org_id = (SELECT org_id FROM users_profile WHERE user_id = auth.uid()) 
    THEN 'Match' 
    ELSE 'Mismatch' 
  END as org_match
FROM users_profile up
WHERE up.user_id = auth.uid();

